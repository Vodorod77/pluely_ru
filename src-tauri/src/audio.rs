// Pluely: Audio capture module for system audio monitoring and speech detection (speech detection is based on the VAD algorithm)
use base64::Engine;
use base64::engine::general_purpose::STANDARD as B64;
use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use cpal::{Device, SampleFormat, StreamConfig, SupportedStreamConfig};
use hound::{WavSpec, WavWriter};
use once_cell::sync::Lazy;
use std::collections::VecDeque;
use std::io::Cursor;
use std::sync::{mpsc, Mutex};
use std::thread;
use tauri::{command, Emitter, Window};
use tokio;

// Pluely: Default values for audio settings
const DEFAULT_VAD_SENSITIVITY_RMS: f32 = 0.004; // sensitivity of the VAD algorithm
const DEFAULT_SPEECH_PEAK_THRESHOLD: f32 = 0.01;  // sensitivity of the VAD algorithm
const DEFAULT_SILENCE_CHUNKS: usize = 47;         // silence chunks threshold (~1 second at 48kHz, ~1.08s at 44.1kHz)
const DEFAULT_MIN_SPEECH_CHUNKS: usize = 15;      // min speech duration (~0.32s at 48kHz, ~0.35s at 44.1kHz)
const DEFAULT_PRE_SPEECH_CHUNKS: usize = 15;      // pre-speech buffer size (~0.32s at 48kHz, ~0.35s at 44.1kHz)
const ANALYSIS_CHUNK: usize = 1024;               // analysis window size for the VAD algorithm (1024 samples)

// Pluely: Global, consolidated capture state
#[derive(Clone)]
struct Settings {
    vad_sensitivity_rms: f32,
    speech_peak_threshold: f32,
    silence_chunks_to_end: usize,
    min_speech_chunks: usize,
    pre_speech_chunks: usize,
}

// Pluely: Default settings
impl Default for Settings {
    fn default() -> Self {
        Self {
            vad_sensitivity_rms: DEFAULT_VAD_SENSITIVITY_RMS,
            speech_peak_threshold: DEFAULT_SPEECH_PEAK_THRESHOLD,
            silence_chunks_to_end: DEFAULT_SILENCE_CHUNKS,
            min_speech_chunks: DEFAULT_MIN_SPEECH_CHUNKS,
            pre_speech_chunks: DEFAULT_PRE_SPEECH_CHUNKS,
        }
    }
}

// Pluely: Capture state
struct CaptureState {
    is_capturing: bool,
    settings: Settings,
    stop_sender: Option<mpsc::Sender<()>>,
    thread_handle: Option<thread::JoinHandle<()>>,
}

// Pluely: Default capture state
impl Default for CaptureState {
    fn default() -> Self {
        Self {
            is_capturing: false,
            settings: Settings::default(),
            stop_sender: None,
            thread_handle: None,
        }
    }
}

// Global, consolidated capture state
static STATE: Lazy<Mutex<CaptureState>> = Lazy::new(|| Mutex::new(CaptureState::default()));

// Audio processor (runs inside stream callback)

// Utility: WAV + Base64 encoding
fn samples_to_wav_b64(sample_rate: u32, mono_f32: &[f32]) -> Result<String, String> {
    let mut cursor = Cursor::new(Vec::new());
    let spec = WavSpec {
        channels: 1,
        sample_rate,
        bits_per_sample: 16,
        sample_format: hound::SampleFormat::Int,
    };

    let mut writer = WavWriter::new(&mut cursor, spec)
        .map_err(|e| format!("WAV writer create failed: {}", e))?;

    for &s in mono_f32 {
        let clamped = s.clamp(-1.0, 1.0);
        let sample_i16 = (clamped * i16::MAX as f32) as i16;
        writer.write_sample(sample_i16).map_err(|e| format!("WAV write failed: {}", e))?;
    }
    writer.finalize().map_err(|e| format!("WAV finalize failed: {}", e))?;
    Ok(B64.encode(cursor.into_inner()))
}

// Heuristic device selection (works cross-platform)
fn select_system_audio_device() -> Result<Device, String> {
    let host = cpal::default_host();
    let devices = host.input_devices().map_err(|e| format!("enumerate devices failed: {}", e))?;
    
    // Collect device names for error reporting
    let mut device_list = Vec::new();
    let mut scored: Vec<(i32, Device, String)> = Vec::new();
    
    for dev in devices {
        let name = dev.name().unwrap_or_else(|_| "Unknown".to_string());
        device_list.push(name.clone());
        let lower = name.to_lowercase();
        let score;
        // Windows specific
        #[cfg(target_os = "windows")]
        {
            if lower.contains("stereo mix") || lower.contains("what u hear") || lower.contains("what you hear") { score = 100; }
            else if lower.contains("cable") { score = 90; }
            else if lower.contains("voicemeeter") || lower.contains("voicemeter") { score = 85; }
            else if lower.contains("vb-audio") { score = 85; }
            else if lower.contains("virtual") || lower.contains("loopback") { score = 70; }
            else { score = 10; }
        }
        // macOS specific
        #[cfg(target_os = "macos")]
        {
            if lower.contains("blackhole") { score = 100; }
            else if lower.contains("loopback") { score = 95; }
            else if lower.contains("soundflower") { score = 90; }
            else if lower.contains("multi-output") { score = 85; }
            else if lower.contains("aggregate") { score = 80; }
            else if (lower.contains("speakers") || lower.contains("headphones")) && lower.contains("blackhole") { score = 95; }
            else { score = 10; }
        }
        // Linux specific
        #[cfg(target_os = "linux")]
        {
            if lower.contains("monitor") { score = 100; }
            else if lower.contains("alsa_output") && lower.contains("monitor") { score = 100; }
            else if lower.contains("pulse") && lower.contains("monitor") { score = 95; }
            else if lower.contains("loopback") { score = 80; }
            else { score = 10; }
        }
        // Default score for other platforms
        #[cfg(not(any(target_os = "windows", target_os = "macos", target_os = "linux")))]
        {
            score = 10; // Default score for other platforms
        }
        scored.push((score, dev, name));
    }
    
    scored.sort_by(|a, b| b.0.cmp(&a.0));
    
    // Check if we found any high-scoring virtual audio devices
    if let Some((score, dev, name)) = scored.iter().next() {
        if *score >= 70 {
            eprintln!("Selected virtual audio device: {}", name);
            return Ok(dev.clone());
        }
    }
    
    // If no high-scoring devices, try fallback to default input device
    if let Some(default_device) = host.default_input_device() {
        let default_name = default_device.name().unwrap_or_else(|_| "Default Input".to_string());
        eprintln!("No virtual audio device found, using default: {}", default_name);
        return Ok(default_device);
    }
    
    // Return simple error message - let frontend handle detailed instructions
    Err("SETUP_REQUIRED".to_string())
}

// Helper functions for audio testing
fn get_system_audio_device() -> Result<Device, String> {
    select_system_audio_device()
}



// The capture thread function
// Builds the stream (inside the thread), keeps it alive, processes callbacks, waits for stop signal,
// drops the stream and exits when asked to stop.
fn spawn_capture_thread(window: Window, cfg: SupportedStreamConfig, settings: Settings) -> (mpsc::Sender<()>, thread::JoinHandle<()>) {
    let (tx, rx) = mpsc::channel::<()>();

    // clone what we need into thread
    let cfg_clone = cfg.clone();
    let join_handle = thread::spawn(move || {
        // Build stream inside this thread (so `Stream` is owned by this thread)
        let device = match select_system_audio_device() {
            Ok(d) => d,
            Err(e) => {
                eprintln!("capture thread: device select failed: {}", e);
                return;
            }
        };

        // build stream config
        let stream_config: StreamConfig = cfg_clone.clone().into();
        let sample_rate = stream_config.sample_rate.0;
        let channels = stream_config.channels as usize;

        // Processor local state
        let mut interleaved: VecDeque<f32> = VecDeque::new();
        let mut pre_speech: VecDeque<f32> = VecDeque::new();
        let mut speech_buffer: Vec<f32> = Vec::new();
        let mut in_speech = false;
        let mut silence_chunks = 0usize;
        let mut speech_chunks = 0usize;
        let max_samples = (sample_rate as usize) * 30; // safety cap 30s

        // helper to process a mono chunk
        let process_chunk = |mono_chunk: &[f32]| {
            let mut sumsq = 0.0f32;
            let mut peak = 0.0f32;
            for &v in mono_chunk {
                let a = v.abs();
                peak = peak.max(a);
                sumsq += v * v;
            }
            let rms = (sumsq / mono_chunk.len() as f32).sqrt();
            (rms, peak)
        };

        // audio callback builder depending on sample format
        let err_fn = |err| eprintln!("cpal stream error: {}", err);

        // Build input stream for supported format
        let stream_result = match cfg_clone.sample_format() {
            SampleFormat::F32 => {
                device.build_input_stream(
                    &stream_config,
                    move |data: &[f32], _| {
                        // append interleaved data
                        interleaved.extend(data.iter().copied());
                        // attempt to extract mono chunks
                        let needed = ANALYSIS_CHUNK * channels;
                        while interleaved.len() >= needed {
                            // form mono chunk
                            let mut mono = Vec::with_capacity(ANALYSIS_CHUNK);
                            for _ in 0..ANALYSIS_CHUNK {
                                let mut sum = 0.0f32;
                                for _c in 0..channels {
                                    if let Some(v) = interleaved.pop_front() {
                                        sum += v;
                                    }
                                }
                                // push mono chunk to buffer
                                mono.push(sum / channels as f32);
                            }

                            let (rms, peak) = process_chunk(&mono);
                            let is_speech = rms > settings.vad_sensitivity_rms || peak > settings.speech_peak_threshold;

                            if is_speech {
                                if !in_speech {
                                    in_speech = true;
                                    speech_chunks = 0;
                                    silence_chunks = 0;
                                    // prepend pre-speech
                                    speech_buffer.extend(pre_speech.drain(..));
                                    if let Err(e) = window.emit("speech-start", ()) {
                                        eprintln!("emit speech-start failed: {}", e);
                                    }
                                }
                                speech_chunks += 1;
                                speech_buffer.extend_from_slice(&mono);
                                if speech_buffer.len() > max_samples {
                                    // finalize forcibly (send then clear)
                                    if let Ok(b64) = samples_to_wav_b64(sample_rate, &speech_buffer) {
                                        let _ = window.emit("speech-detected", b64);
                                    }
                                    speech_buffer.clear();
                                    in_speech = false;
                                }
                            } else {
                                if in_speech {
                                    // increment silence chunks
                                    silence_chunks += 1;
                                    speech_buffer.extend_from_slice(&mono);
                                    // check if silence chunks exceed threshold
                                    if silence_chunks >= settings.silence_chunks_to_end {
                                        if speech_chunks >= settings.min_speech_chunks && !speech_buffer.is_empty() {
                                            // trim trailing silence (conservative)
                                            let trim = (settings.silence_chunks_to_end / 2) * ANALYSIS_CHUNK;
                                            if speech_buffer.len() > trim {
                                                let new_len = speech_buffer.len() - trim;
                                                speech_buffer.truncate(new_len);
                                            }
                                            if let Ok(b64) = samples_to_wav_b64(sample_rate, &speech_buffer) {
                                                let _ = window.emit("speech-detected", b64);
                                            }
                                        }
                                        speech_buffer.clear();
                                        in_speech = false;
                                        silence_chunks = 0;
                                        speech_chunks = 0;
                                    }
                                } else {
                                    // not in speech: push to pre-speech rolling buffer
                                    pre_speech.extend(mono.into_iter());
                                    while pre_speech.len() > settings.pre_speech_chunks * ANALYSIS_CHUNK {
                                        pre_speech.pop_front();
                                    }
                                }
                            }
                        }
                    },
                    err_fn,
                    None,
                )
            }
            SampleFormat::I16 => {
                device.build_input_stream(
                    &stream_config,
                    move |data: &[i16], _| {
                        // convert to f32 normalized
                        for &s in data {
                            interleaved.push_back(s as f32 / i16::MAX as f32);
                        }
                        // reuse same logic as above by letting the while loop run
                        // (we replicate the same processing code below for clarity)
                        let needed = ANALYSIS_CHUNK * channels;
                        while interleaved.len() >= needed {
                            let mut mono = Vec::with_capacity(ANALYSIS_CHUNK);
                            for _ in 0..ANALYSIS_CHUNK {
                                let mut sum = 0.0f32;
                                for _c in 0..channels {
                                    if let Some(v) = interleaved.pop_front() {
                                        sum += v;
                                    }
                                }
                                mono.push(sum / channels as f32);
                            }
                            let (rms, peak) = process_chunk(&mono);
                            let is_speech = rms > settings.vad_sensitivity_rms || peak > settings.speech_peak_threshold;
                            // process speech
                            if is_speech {
                                if !in_speech {
                                    in_speech = true;
                                    speech_chunks = 0;
                                    silence_chunks = 0;
                                    speech_buffer.extend(pre_speech.drain(..));
                                    if let Err(e) = window.emit("speech-start", ()) {
                                        eprintln!("emit speech-start failed: {}", e);
                                    }
                                }
                                // increment speech chunks
                                speech_chunks += 1;
                                speech_buffer.extend_from_slice(&mono);
                                if speech_buffer.len() > max_samples {
                                    if let Ok(b64) = samples_to_wav_b64(sample_rate, &speech_buffer) {
                                        let _ = window.emit("speech-detected", b64);
                                    }
                                    speech_buffer.clear();
                                    in_speech = false;
                                }
                            } else {
                                if in_speech {
                                    // increment silence chunks
                                    silence_chunks += 1;
                                    speech_buffer.extend_from_slice(&mono);
                                    if silence_chunks >= settings.silence_chunks_to_end {
                                        if speech_chunks >= settings.min_speech_chunks && !speech_buffer.is_empty() {
                                            let trim = (settings.silence_chunks_to_end / 2) * ANALYSIS_CHUNK;
                                            if speech_buffer.len() > trim {
                                                let new_len = speech_buffer.len() - trim;
                                                speech_buffer.truncate(new_len);
                                            }
                                            if let Ok(b64) = samples_to_wav_b64(sample_rate, &speech_buffer) {
                                                let _ = window.emit("speech-detected", b64);
                                            }
                                        }
                                        speech_buffer.clear();
                                        in_speech = false;
                                        silence_chunks = 0;
                                        speech_chunks = 0;
                                    }
                                } else {
                                    // not in speech: push to pre-speech rolling buffer
                                    pre_speech.extend(mono.into_iter());
                                    while pre_speech.len() > settings.pre_speech_chunks * ANALYSIS_CHUNK {
                                        pre_speech.pop_front();
                                    }
                                }
                            }
                        }
                    },
                    err_fn,
                    None,
                )
            }
            // process u16 format
            SampleFormat::U16 => {
                device.build_input_stream(
                    &stream_config,
                    move |data: &[u16], _| {
                        for &s in data {
                            interleaved.push_back((s as f32 - u16::MAX as f32 / 2.0) / (u16::MAX as f32 / 2.0));
                        }
                        // form mono chunk
                        let needed = ANALYSIS_CHUNK * channels;
                        // reuse same logic as above by letting the while loop run
                        // (we replicate the same processing code below for clarity)
                        while interleaved.len() >= needed {
                            let mut mono = Vec::with_capacity(ANALYSIS_CHUNK);
                            for _ in 0..ANALYSIS_CHUNK {
                                let mut sum = 0.0f32;
                                for _c in 0..channels {
                                    if let Some(v) = interleaved.pop_front() {
                                        sum += v;
                                    }
                                }
                                mono.push(sum / channels as f32);
                            }
                            let (rms, peak) = process_chunk(&mono);
                            let is_speech = rms > settings.vad_sensitivity_rms || peak > settings.speech_peak_threshold;
                            if is_speech {
                                // process speech
                                if !in_speech {
                                    in_speech = true;
                                    speech_chunks = 0;
                                    silence_chunks = 0;
                                    speech_buffer.extend(pre_speech.drain(..));
                                    if let Err(e) = window.emit("speech-start", ()) {
                                        eprintln!("emit speech-start failed: {}", e);
                                    }
                                }
                                // increment speech chunks
                                speech_chunks += 1;
                                speech_buffer.extend_from_slice(&mono);
                                if speech_buffer.len() > max_samples {
                                    if let Ok(b64) = samples_to_wav_b64(sample_rate, &speech_buffer) {
                                        let _ = window.emit("speech-detected", b64);
                                    }
                                    speech_buffer.clear();
                                    in_speech = false;
                                }
                            } else {
                                if in_speech {
                                    // increment silence chunks
                                    silence_chunks += 1;
                                    speech_buffer.extend_from_slice(&mono);
                                    // check if silence chunks exceed threshold
                                    if silence_chunks >= settings.silence_chunks_to_end {
                                        if speech_chunks >= settings.min_speech_chunks && !speech_buffer.is_empty() {
                                            let trim = (settings.silence_chunks_to_end / 2) * ANALYSIS_CHUNK;
                                            if speech_buffer.len() > trim {
                                                let new_len = speech_buffer.len() - trim;
                                                speech_buffer.truncate(new_len);
                                            }
                                            // emit speech detected
                                            if let Ok(b64) = samples_to_wav_b64(sample_rate, &speech_buffer) {
                                                let _ = window.emit("speech-detected", b64);
                                            }
                                        }
                                        // clear speech buffer
                                        speech_buffer.clear();
                                        in_speech = false;
                                        silence_chunks = 0;
                                        speech_chunks = 0;
                                    }
                                } else {
                                    pre_speech.extend(mono.into_iter());
                                    // trim pre-speech buffer
                                    while pre_speech.len() > settings.pre_speech_chunks * ANALYSIS_CHUNK {
                                        pre_speech.pop_front();
                                    }
                                }
                            }
                        }
                    },
                    err_fn,
                    None,
                )
            }
            _ => {
                eprintln!("Unsupported sample format: {:?}", cfg_clone.sample_format());
                return;
            }
        };

        // start and keep alive
        match stream_result {
            Ok(stream) => {
                eprintln!("Audio stream started successfully");
                if let Err(e) = stream.play() {
                    eprintln!("failed to play stream in thread: {}", e);
                    return;
                }

                eprintln!("Waiting for stop signal...");
                // wait for stop signal
                let _ = rx.recv();
                eprintln!("Stop signal received, stopping stream...");

                // Stop the stream before dropping it
                if let Err(e) = stream.pause() {
                    eprintln!("Warning: failed to pause stream: {}", e);
                }

                // Drop `stream` here by falling out of scope -> release audio device
                drop(stream);
                eprintln!("Audio stream dropped");

                // Add delay for CoreAudio to properly release the device (macOS specific)
                #[cfg(target_os = "macos")]
                {
                    eprintln!("Waiting for CoreAudio cleanup...");
                    std::thread::sleep(std::time::Duration::from_millis(500));
                }
            }
            Err(e) => {
                eprintln!("build_input_stream failed inside capture thread: {}", e);
            }
        }
        eprintln!("Capture thread exiting");
    });

    (tx, join_handle)
}


// Pluely: Tauri commands

// Start system audio capture
#[tauri::command]
pub async fn start_system_audio_capture(window: Window) -> Result<String, String> {
    let mut st = STATE.lock().unwrap();
    if st.is_capturing {
        return Err("already capturing".into());
    }

    // Clean up any leftover state from previous sessions
    st.stop_sender = None;
    st.thread_handle = None;

    let device = select_system_audio_device().map_err(|e| format!("device select: {}", e))?;
    let supported = device.default_input_config().map_err(|e| format!("default_input_config: {}", e))?;

    // Spawn capture thread which will build and own the Stream
    let settings = st.settings.clone();
    let (stop_sender, join_handle) = spawn_capture_thread(window, supported, settings);

    // set stop sender and thread handle
    st.stop_sender = Some(stop_sender);
    st.thread_handle = Some(join_handle);
    st.is_capturing = true;

    Ok("capture started".into())
}

// Stop system audio capture
#[tauri::command]
pub async fn stop_system_audio_capture() -> Result<String, String> {
    // Send stop signal & join thread (join in blocking-friendly way so we don't block tokio core)
    let mut st = STATE.lock().unwrap();
    if !st.is_capturing {
        return Err("no active capture".into());
    }

    eprintln!("Stopping audio capture...");

    // Send stop signal first
    if let Some(tx) = st.stop_sender.take() {
        // best-effort send (ignore if thread already died)
        let _ = tx.send(());
        eprintln!("Stop signal sent to capture thread");
    }

    // Clear capturing flag immediately to prevent new starts
    st.is_capturing = false;

    // Join the thread in a separate blocking task to avoid blocking the async runtime
    if let Some(handle) = st.thread_handle.take() {
        // Use tokio::task::spawn_blocking for proper async runtime integration
        tokio::task::spawn_blocking(move || {
            eprintln!("Joining capture thread...");
            match handle.join() {
                Ok(_) => eprintln!("Capture thread joined successfully"),
                Err(e) => eprintln!("Failed to join capture thread: {:?}", e),
            }
        });
    }

    // Clear any remaining state
    st.stop_sender = None;
    st.thread_handle = None;

    eprintln!("Audio capture stopped and cleaned up");
    Ok("capture stopped".into())
}

// Get audio devices
#[command]
pub async fn get_audio_devices() -> Result<Vec<String>, String> {
    let host = cpal::default_host();
    let mut names = Vec::new();
    // get input devices
    for d in host.input_devices().map_err(|e| e.to_string())? {
        names.push(d.name().unwrap_or_else(|_| "Unknown".into()));
    }
    Ok(names)
}

// Debug audio devices
#[command]
pub async fn debug_audio_devices() -> Result<String, String> {
    let host = cpal::default_host();
    let mut out = String::from("=== AUDIO DEVICE DEBUG INFO ===\n\n");
    // get input devices
    for (i, d) in host
        .input_devices()
        .map_err(|e| format!("input_devices: {e}"))?
        .enumerate()
    {
        let name = d.name().unwrap_or_else(|_| "Unknown".into());
        out.push_str(&format!("Device {}: {}\n", i + 1, name));
        // Get default input config for the device
        match d.default_input_config() {
            Ok(cfg) => {
                out.push_str(&format!("  Sample Rate: {} Hz\n", cfg.sample_rate().0));
                out.push_str(&format!("  Channels: {}\n", cfg.channels()));
                out.push_str(&format!("  Sample Format: {:?}\n\n", cfg.sample_format()));
            }
            Err(e) => {
                out.push_str(&format!("  Config Error: {e}\n\n"));
            }
        }
    }
    Ok(out)
}

#[command]
pub async fn test_audio_levels() -> Result<String, String> {
    let device = get_system_audio_device()?;
    let config = device.default_input_config()
        .map_err(|e| format!("Failed to get default input config: {}", e))?;

    let sample_rate = config.sample_rate().0;
    let channels = config.channels();
    let sample_format = config.sample_format();

    // Create a temporary stream to test audio levels
    let (tx, mut rx) = tokio::sync::mpsc::unbounded_channel();
    
    let stream = match sample_format {
        SampleFormat::F32 => {
            device.build_input_stream(
                &config.into(),
                move |data: &[f32], _: &cpal::InputCallbackInfo| {
                    // Calculate RMS for this chunk
                    let sum_squares: f32 = data.iter().map(|&x| x * x).sum();
                    let rms = (sum_squares / data.len() as f32).sqrt();
                    let peak = data.iter().map(|&x| x.abs()).fold(0.0f32, f32::max);
                    
                    if let Err(_) = tx.send((rms, peak)) {
                        // Channel closed, stop sending
                    }
                },
                |_err| {},
                None,
            )
        }
        SampleFormat::I16 => {
            device.build_input_stream(
                &config.into(),
                move |data: &[i16], _: &cpal::InputCallbackInfo| {
                    // Convert to f32 and calculate RMS
                    let f32_data: Vec<f32> = data.iter().map(|&x| x as f32 / 32768.0).collect();
                    let sum_squares: f32 = f32_data.iter().map(|&x| x * x).sum();
                    let rms = (sum_squares / f32_data.len() as f32).sqrt();
                    let peak = f32_data.iter().map(|&x| x.abs()).fold(0.0f32, f32::max);
                    
                    if let Err(_) = tx.send((rms, peak)) {
                        // Channel closed, stop sending
                    }
                },
                |_err| {},
                None,
            )
        }
        SampleFormat::U16 => {
            device.build_input_stream(
                &config.into(),
                move |data: &[u16], _: &cpal::InputCallbackInfo| {
                    // Convert to f32 and calculate RMS
                    let f32_data: Vec<f32> = data.iter().map(|&x| (x as f32 - 32768.0) / 32768.0).collect();
                    let sum_squares: f32 = f32_data.iter().map(|&x| x * x).sum();
                    let rms = (sum_squares / f32_data.len() as f32).sqrt();
                    let peak = f32_data.iter().map(|&x| x.abs()).fold(0.0f32, f32::max);
                    
                    if let Err(_) = tx.send((rms, peak)) {
                        // Channel closed, stop sending
                    }
                },
                |_err| {},
                None,
            )
        }
        _ => {
            return Err(format!("Unsupported sample format: {:?}", sample_format));
        }
    }.map_err(|e| format!("Failed to build test stream: {}", e))?;

    // Start the stream and collect samples for 3 seconds
    stream.play().map_err(|e| format!("Failed to start test stream: {}", e))?;
    
    let mut max_rms = 0.0f32;
    let mut max_peak = 0.0f32;
    let mut sample_count = 0;
    let mut total_rms = 0.0f32;
    
    // Collect samples for 3 seconds
    let start_time = std::time::Instant::now();
    while start_time.elapsed().as_secs() < 3 {
        if let Ok((rms, peak)) = rx.try_recv() {
            max_rms = max_rms.max(rms);
            max_peak = max_peak.max(peak);
            total_rms += rms;
            sample_count += 1;
        }
        std::thread::sleep(std::time::Duration::from_millis(10));
    }
    
    drop(stream); // Stop the stream
    
    let avg_rms = if sample_count > 0 { total_rms / sample_count as f32 } else { 0.0 };
    
    Ok(format!(
        "Audio Level Test Results:\n\
        Device: {}\n\
        Sample Rate: {}Hz, Channels: {}\n\
        Test Duration: 3 seconds\n\
        Max RMS: {:.6}\n\
        Max Peak: {:.6}\n\
        Avg RMS: {:.6}\n\
        Samples: {}\n\n\
        Current VAD Threshold: {:.4}\n\
        Audio Detected: {}\n\n\
        Recommendations:\n\
        - If Max RMS < {:.4}: Increase system volume or check BlackHole setup\n\
        - If Max RMS > 0.01: Audio levels look good\n\
        - If no audio: Check if applications are outputting to BlackHole", 
        device.name().unwrap_or_else(|_| "Unknown".to_string()),
        sample_rate, 
        channels,
        max_rms, 
        max_peak, 
        avg_rms,
        sample_count,
        DEFAULT_VAD_SENSITIVITY_RMS,
        if max_rms > DEFAULT_VAD_SENSITIVITY_RMS { "YES" } else { "NO" },
        DEFAULT_VAD_SENSITIVITY_RMS
    ))
}

// Pluely: SETTINGS COMMANDS

// reset audio settings
#[command]
pub async fn reset_audio_settings() -> Result<String, String> {
    let mut st = STATE.lock().unwrap();
    st.settings = Settings::default();
    Ok("Audio settings reset to defaults".into())
}

// set vad sensitivity
#[command]
pub async fn set_vad_sensitivity(value: f32) -> Result<String, String> {
    if !(0.0001..=0.1).contains(&value) {
        return Err("vad_sensitivity must be between 0.0001 and 0.1".into());
    }
    let mut st = STATE.lock().unwrap();
    st.settings.vad_sensitivity_rms = value;
    Ok(format!("VAD RMS set to {:.4}", value))
}

// set speech threshold
#[command]
pub async fn set_speech_threshold(value: f32) -> Result<String, String> {
    if !(0.0001..=0.1).contains(&value) {
        return Err("speech_threshold must be between 0.0001 and 0.1".into());
    }
    let mut st = STATE.lock().unwrap();
    st.settings.speech_peak_threshold = value;
    Ok(format!("Speech peak threshold set to {:.4}", value))
}

// set silence threshold
#[command]
pub async fn set_silence_threshold(chunks: usize) -> Result<String, String> {
    if !(1..=2000).contains(&chunks) {
        return Err("silence_chunks must be in [1, 2000]".into());
    }
    let mut st = STATE.lock().unwrap();
    st.settings.silence_chunks_to_end = chunks;
    Ok(format!("Silence chunks set to {}", chunks))
}

// set min speech duration
#[command]
pub async fn set_min_speech_duration(chunks: usize) -> Result<String, String> {
    if !(1..=1000).contains(&chunks) {
        return Err("min_speech_chunks must be in [1, 1000]".into());
    }
    let mut st = STATE.lock().unwrap();
    st.settings.min_speech_chunks = chunks;
    Ok(format!("Min speech chunks set to {}", chunks))
}

// set pre-speech buffer size
#[command]
pub async fn set_pre_speech_buffer_size(chunks: usize) -> Result<String, String> {
    if !(1..=1000).contains(&chunks) {
        return Err("pre_speech_chunks must be in [1, 1000]".into());
    }
    let mut st = STATE.lock().unwrap();
    st.settings.pre_speech_chunks = chunks;
    Ok(format!("Pre-speech chunks set to {}", chunks))
}

// get vad status
#[command]
pub async fn get_vad_status() -> Result<String, String> {
    let st = STATE.lock().unwrap();
    
    // Calculate approximate timing based on typical sample rates
    let chunk_duration_44k = ANALYSIS_CHUNK as f32 / 44100.0; // ~0.023 seconds
    let chunk_duration_48k = ANALYSIS_CHUNK as f32 / 48000.0; // ~0.021 seconds
    
    let silence_time_44k = st.settings.silence_chunks_to_end as f32 * chunk_duration_44k;
    let silence_time_48k = st.settings.silence_chunks_to_end as f32 * chunk_duration_48k;
    
    let min_speech_time_44k = st.settings.min_speech_chunks as f32 * chunk_duration_44k;
    let min_speech_time_48k = st.settings.min_speech_chunks as f32 * chunk_duration_48k;
    
    Ok(format!(
        "VAD Status:\n\
        Capturing: {}\n\
        VAD RMS Sensitivity: {:.4}\n\
        Speech Peak Threshold: {:.4}\n\
        Silence Chunks to End: {} (~{:.2}s @ 44.1kHz, ~{:.2}s @ 48kHz)\n\
        Min Speech Chunks: {} (~{:.2}s @ 44.1kHz, ~{:.2}s @ 48kHz)\n\
        Pre-speech Chunks: {}\n\
        Analysis Chunk Size: {} samples",
        st.is_capturing,
        st.settings.vad_sensitivity_rms,
        st.settings.speech_peak_threshold,
        st.settings.silence_chunks_to_end, silence_time_44k, silence_time_48k,
        st.settings.min_speech_chunks, min_speech_time_44k, min_speech_time_48k,
        st.settings.pre_speech_chunks,
        ANALYSIS_CHUNK
    ))
}
