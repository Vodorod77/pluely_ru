use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use cpal::{Device, SampleFormat};
use hound::{WavSpec, WavWriter};
use std::collections::VecDeque;
use std::io::Cursor;
use std::sync::Mutex;
use std::sync::atomic::{AtomicBool, Ordering};
use tauri::{command, Emitter, Window};
use tokio::sync::mpsc;
use once_cell::sync::Lazy;
use base64::Engine;


// Default values for audio settings
const DEFAULT_VAD_SENSITIVITY: f32 = 0.004;
const DEFAULT_SPEECH_THRESHOLD: f32 = 0.01;
const DEFAULT_SILENCE_THRESHOLD: usize = 200;
const DEFAULT_MIN_SPEECH_DURATION: usize = 20;
const DEFAULT_PRE_SPEECH_BUFFER_SIZE: usize = 20;

// Global state for managing audio capture
static IS_CAPTURING: AtomicBool = AtomicBool::new(false);
static STOP_SENDER: Lazy<Mutex<Option<mpsc::UnboundedSender<()>>>> = Lazy::new(|| Mutex::new(None));
static VAD_SENSITIVITY: Lazy<Mutex<f32>> = Lazy::new(|| Mutex::new(DEFAULT_VAD_SENSITIVITY)); // Default sensitivity for system audio
static SPEECH_THRESHOLD: Lazy<Mutex<f32>> = Lazy::new(|| Mutex::new(DEFAULT_SPEECH_THRESHOLD)); // Speech detection threshold
static SILENCE_THRESHOLD: Lazy<Mutex<usize>> = Lazy::new(|| Mutex::new(DEFAULT_SILENCE_THRESHOLD)); // Silence frames before stopping
static MIN_SPEECH_DURATION: Lazy<Mutex<usize>> = Lazy::new(|| Mutex::new(DEFAULT_MIN_SPEECH_DURATION)); // Minimum speech frames
static PRE_SPEECH_BUFFER_SIZE: Lazy<Mutex<usize>> = Lazy::new(|| Mutex::new(DEFAULT_PRE_SPEECH_BUFFER_SIZE)); // Pre-speech buffer size

struct AudioProcessor {
    sample_rate: u32,
    channels: u16,
    buffer: VecDeque<f32>,
    speech_buffer: Vec<f32>,
    pre_speech_buffer: VecDeque<f32>, // Buffer to capture audio before speech detection
    is_speech_active: bool,
    silence_counter: usize,
    speech_counter: usize,
    _speech_threshold: f32,
    silence_threshold: usize,
    min_speech_duration: usize,
    pre_speech_buffer_size: usize,
    window: Window,
}

impl AudioProcessor {
    fn new(sample_rate: u32, channels: u16, window: Window) -> Self {
        Self {
            sample_rate,
            channels,
            buffer: VecDeque::new(),
            speech_buffer: Vec::new(),
            pre_speech_buffer: VecDeque::new(),
            is_speech_active: false,
            silence_counter: 0,
            speech_counter: 0,
            _speech_threshold: *SPEECH_THRESHOLD.lock().unwrap(),
            silence_threshold: *SILENCE_THRESHOLD.lock().unwrap(),
            min_speech_duration: *MIN_SPEECH_DURATION.lock().unwrap(),
            pre_speech_buffer_size: *PRE_SPEECH_BUFFER_SIZE.lock().unwrap(),
            window,
        }
    }

    fn process_audio_chunk(&mut self, samples: &[f32]) -> Result<(), String> {
        // Add samples to buffer
        self.buffer.extend(samples);

        // Process in chunks suitable for analysis (typically 1024 samples)
        let chunk_size = 1024;
        while self.buffer.len() >= chunk_size {
            let chunk: Vec<f32> = self.buffer.drain(..chunk_size).collect();
            
            // Convert to mono if stereo
            let mono_chunk = if self.channels == 2 {
                chunk.chunks(2).map(|stereo| (stereo[0] + stereo[1]) / 2.0).collect()
            } else {
                chunk
            };

            // Calculate RMS energy for voice activity detection
            let rms = self.calculate_rms(&mono_chunk);
            
            // Get current sensitivity from global state
            let current_threshold = {
                let sensitivity = VAD_SENSITIVITY.lock().unwrap();
                *sensitivity
            };
            
            // Use a more sophisticated detection - consider both RMS and peak values
            let peak = mono_chunk.iter().map(|&x| x.abs()).fold(0.0f32, f32::max);
            let is_speech = rms > current_threshold || peak > (current_threshold * 2.0);
            

            
            if is_speech {
                if !self.is_speech_active {
                    // Start of speech detected
                    self.speech_buffer.clear();
                    
                    // Add pre-speech buffer to capture the beginning of speech
                    for pre_chunk in &self.pre_speech_buffer {
                        self.speech_buffer.push(*pre_chunk);
                    }
                    
                    self.is_speech_active = true;
                    self.silence_counter = 0;
                    self.speech_counter = 1;
                    
                    // Emit event to frontend
                                         if let Err(_e) = self.window.emit("speech-start", ()) {
                        // Failed to emit speech-start event
                    }
                } else {
                    self.speech_counter += 1;
                }
                
                // Add current chunk to speech buffer
                self.speech_buffer.extend(&mono_chunk);
                self.silence_counter = 0;
                
                // Clear pre-speech buffer since we're in active speech
                self.pre_speech_buffer.clear();
            } else {
                if self.is_speech_active {
                    // We're in speech but current chunk is silent
                    self.silence_counter += 1;
                    
                    // Continue adding to speech buffer during silence (to capture pauses)
                    self.speech_buffer.extend(&mono_chunk);
                    
                    if self.silence_counter >= self.silence_threshold {
                        // End of speech confirmed - check if we have enough speech content
                        if self.speech_counter >= self.min_speech_duration && !self.speech_buffer.is_empty() {
                            // Remove the trailing silence from the speech buffer (be more conservative)
                            let samples_to_remove = (self.silence_threshold / 2) * (chunk_size / if self.channels == 2 { 2 } else { 1 });
                            let new_len = self.speech_buffer.len().saturating_sub(samples_to_remove);
                            self.speech_buffer.truncate(new_len);
                            
                            // Only process if we still have substantial content
                            if self.speech_buffer.len() > chunk_size {
                                self.process_speech_segment()?;
                            }
                        }
                        
                        // Reset speech detection state
                        self.is_speech_active = false;
                        self.silence_counter = 0;
                        self.speech_counter = 0;
                        self.speech_buffer.clear();
                    }
                } else {
                    // Not in speech - maintain pre-speech buffer
                    self.pre_speech_buffer.extend(&mono_chunk);
                    
                    // Keep pre-speech buffer at fixed size
                    while self.pre_speech_buffer.len() > self.pre_speech_buffer_size * (chunk_size / if self.channels == 2 { 2 } else { 1 }) {
                        self.pre_speech_buffer.pop_front();
                    }
                }
            }
        }

        Ok(())
    }

    fn calculate_rms(&self, samples: &[f32]) -> f32 {
        if samples.is_empty() {
            return 0.0;
        }
        
        let sum_squares: f32 = samples.iter().map(|&x| x * x).sum();
        (sum_squares / samples.len() as f32).sqrt()
    }

    fn process_speech_segment(&mut self) -> Result<(), String> {
        if self.speech_buffer.is_empty() {
            return Ok(());
        }

        let _duration_seconds = self.speech_buffer.len() as f32 / self.sample_rate as f32;


        // Convert speech buffer to WAV format
        let wav_data = self.samples_to_wav(&self.speech_buffer)?;
        
        // Convert to base64
        let base64_audio = base64::engine::general_purpose::STANDARD.encode(&wav_data);
        
        // Emit the audio data to frontend for STT processing
        if let Err(_e) = self.window.emit("speech-detected", base64_audio) {
            // Failed to emit speech-detected event
        }

        // Clear the speech buffer
        self.speech_buffer.clear();
        
        Ok(())
    }

    fn samples_to_wav(&self, samples: &[f32]) -> Result<Vec<u8>, String> {
        let mut cursor = Cursor::new(Vec::new());
        
        let spec = WavSpec {
            channels: 1, // Mono
            sample_rate: self.sample_rate,
            bits_per_sample: 16,
            sample_format: hound::SampleFormat::Int,
        };

        let mut writer = WavWriter::new(&mut cursor, spec)
            .map_err(|e| format!("Failed to create WAV writer: {}", e))?;

        // Convert f32 samples to i16
        for &sample in samples {
            let sample_i16 = (sample * 32767.0).clamp(-32768.0, 32767.0) as i16;
            writer.write_sample(sample_i16)
                .map_err(|e| format!("Failed to write sample: {}", e))?;
        }

        writer.finalize()
            .map_err(|e| format!("Failed to finalize WAV: {}", e))?;

        Ok(cursor.into_inner())
    }
}

fn get_system_audio_device() -> Result<Device, String> {
    let host = cpal::default_host();
    
    // First, try to find a proper loopback device
    let input_devices = host.input_devices()
        .map_err(|e| format!("Failed to enumerate input devices: {}", e))?;

    let mut device_list = Vec::new();
    let mut virtual_devices = Vec::new();
    let mut fallback_devices = Vec::new();

    for device in input_devices {
        let name = device.name()
            .map_err(|e| format!("Failed to get device name: {}", e))?;
        device_list.push(name.clone());
        
        let name_lower = name.to_lowercase();
        
        // Skip obvious microphone devices
        let is_microphone = name_lower.contains("microphone") || 
                           name_lower.contains("mic") && !name_lower.contains("stereo mix") ||
                           name_lower.contains("webcam") ||
                           name_lower.contains("headset") && name_lower.contains("mic") ||
                           name_lower.contains("airpods") && name_lower.contains("mic") ||
                           name_lower.contains("bluetooth") && name_lower.contains("mic");
        
        if is_microphone {
            continue;
        }
        
        // Platform-specific device detection
        #[cfg(target_os = "windows")]
        {
            if name_lower.contains("stereo mix") {
                virtual_devices.push((device, name.clone(), 10)); // Highest priority - built-in Windows feature
            } else if name_lower.contains("what u hear") {
                virtual_devices.push((device, name.clone(), 10)); // Creative's equivalent of Stereo Mix
            } else if name_lower.contains("cable output") || name_lower.contains("cable input") {
                virtual_devices.push((device, name.clone(), 9)); // VB-Audio Cable
            } else if name_lower.contains("voicemeeter") {
                virtual_devices.push((device, name.clone(), 9)); // VoiceMeeter virtual devices
            } else if name_lower.contains("virtual") && name_lower.contains("audio") {
                virtual_devices.push((device, name.clone(), 8)); // Generic virtual audio
            } else if name_lower.contains("loopback") {
                virtual_devices.push((device, name.clone(), 8)); // Generic loopback devices
            } else if name_lower.contains("wave out mix") {
                virtual_devices.push((device, name.clone(), 7)); // Alternative mix devices
            } else if name_lower.contains("speakers") && name_lower.contains("mix") {
                virtual_devices.push((device, name.clone(), 7)); // Speaker mix devices
            } else if name_lower.contains("realtek") && name_lower.contains("mix") {
                virtual_devices.push((device, name.clone(), 6)); // Realtek audio mix
            } else {
                fallback_devices.push((device, name.clone(), 1));
            }
        }
        
        #[cfg(target_os = "macos")]
        {
            // Virtual audio devices (highest priority)
            if name_lower.contains("blackhole") {
                virtual_devices.push((device, name.clone(), 10));
            } else if name_lower.contains("loopback") {
                virtual_devices.push((device, name.clone(), 9));
            } else if name_lower.contains("soundflower") {
                virtual_devices.push((device, name.clone(), 8));
            } else if name_lower.contains("virtual") && name_lower.contains("audio") {
                virtual_devices.push((device, name.clone(), 7));
            } else if name_lower.contains("aggregate") {
                virtual_devices.push((device, name.clone(), 6));
            } else if name_lower.contains("multi-output") {
                virtual_devices.push((device, name.clone(), 5));
            }
            // Built-in devices (fallback - may work for system audio)
            else if name_lower.contains("built-in") && !name_lower.contains("microphone") {
                fallback_devices.push((device, name.clone(), 3));
            }
            // Any other input device (last resort)
            else {
                fallback_devices.push((device, name.clone(), 1));
            }
        }
        
        #[cfg(target_os = "linux")]
        {
            if name_lower.contains("monitor") && !name_lower.contains("mic") {
                virtual_devices.push((device, name.clone(), 10)); // PulseAudio monitor devices - highest priority
            } else if name_lower.contains("pulse") && name_lower.contains("monitor") {
                virtual_devices.push((device, name.clone(), 10)); // Explicit PulseAudio monitors
            } else if name_lower.contains("alsa_output") && name_lower.contains("monitor") {
                virtual_devices.push((device, name.clone(), 9)); // ALSA output monitors
            } else if name_lower.contains("loopback") {
                virtual_devices.push((device, name.clone(), 8)); // Generic loopback devices
            } else if name_lower.contains("virtual") && !name_lower.contains("mic") {
                virtual_devices.push((device, name.clone(), 7)); // Virtual audio devices
            } else if name_lower.contains("null") && name_lower.contains("sink") {
                virtual_devices.push((device, name.clone(), 6)); // PulseAudio null sinks
            } else {
                fallback_devices.push((device, name.clone(), 1));
            }
        }
    }

    // Try virtual devices first
    if !virtual_devices.is_empty() {
        virtual_devices.sort_by(|a, b| b.2.cmp(&a.2));
        if let Some((device, _name, _priority)) = virtual_devices.first() {

            return Ok(device.clone());
        }
    }
    
    // Fallback to any available input device
    if !fallback_devices.is_empty() {
        fallback_devices.sort_by(|a, b| b.2.cmp(&a.2));
        if let Some((device, _name, _priority)) = fallback_devices.first() {

            return Ok(device.clone());
        }
    }

    // If no devices found at all, show error
    #[cfg(target_os = "macos")]
    {
        Err(format!(
            "No audio input devices found.\n\
            Available devices: {:?}\n\n\
            This is unusual - please check:\n\
            1. System Preferences > Security & Privacy > Microphone - ensure Pluely has permission\n\
            2. System Preferences > Security & Privacy > Screen Recording - ensure Pluely has permission\n\
            3. Try restarting Pluely\n\n\
            For best system audio capture, consider installing:\n\
            - BlackHole (free): https://existential.audio/blackhole/\n\
            - Loopback (paid): https://rogueamoeba.com/loopback/", 
            device_list
        ))
    }

    #[cfg(target_os = "windows")]
    {
        Err(format!(
            "No audio input devices found.\n\
            Available devices: {:?}\n\n\
            To capture system audio on Windows:\n\
            1. Right-click speaker icon → Sounds → Recording tab\n\
            2. Right-click empty space → Show Disabled Devices\n\
            3. Enable 'Stereo Mix' if available\n\
            4. Or install VB-Audio Virtual Cable: https://vb-audio.com/Cable/\n\
            5. Or install VoiceMeeter: https://vb-audio.com/Voicemeeter/", 
            device_list
        ))
    }

    #[cfg(target_os = "linux")]
    {
        Err(format!(
            "No audio input devices found.\n\
            Available devices: {:?}\n\n\
            To capture system audio on Linux:\n\
            1. Install PulseAudio: sudo apt install pulseaudio-utils\n\
            2. List sources: pactl list sources short\n\
            3. Look for '.monitor' devices\n\
            4. Or create loopback: pactl load-module module-loopback latency_msec=1\n\
            5. Or use pavucontrol GUI: sudo apt install pavucontrol", 
            device_list
        ))
    }
}

#[command]
pub async fn start_default_audio_capture(window: Window) -> Result<String, String> {
    // Check if already capturing
    if IS_CAPTURING.load(Ordering::Relaxed) {
        return Err("Audio capture is already running".to_string());
    }

    let host = cpal::default_host();
    let device = host.default_input_device()
        .ok_or_else(|| "No default input device available".to_string())?;
    
    let device_name = device.name().unwrap_or_else(|_| "Unknown Device".to_string());

    
    let config = device.default_input_config()
        .map_err(|e| format!("Failed to get default input config: {}", e))?;

    let sample_rate = config.sample_rate().0;
    let channels = config.channels();
    let sample_format = config.sample_format();

    // Create stop channel
    let (stop_sender, _stop_receiver) = mpsc::unbounded_channel();

    // Build the input stream
    let stream = match sample_format {
        SampleFormat::F32 => {
            let mut processor = AudioProcessor::new(sample_rate, channels, window.clone());
            device.build_input_stream(
                &config.into(),
                move |data: &[f32], _: &cpal::InputCallbackInfo| {
                    if let Err(_e) = processor.process_audio_chunk(data) {

                    }
                },
                |_err| {},
                None,
            )
        }
        SampleFormat::I16 => {
            let mut processor = AudioProcessor::new(sample_rate, channels, window.clone());
            device.build_input_stream(
                &config.into(),
                move |data: &[i16], _: &cpal::InputCallbackInfo| {
                    // Convert i16 to f32
                    let f32_data: Vec<f32> = data.iter()
                        .map(|&sample| sample as f32 / 32768.0)
                        .collect();
                    
                    if let Err(_e) = processor.process_audio_chunk(&f32_data) {

                    }
                },
                |_err| {},
                None,
            )
        }
        SampleFormat::U16 => {
            let mut processor = AudioProcessor::new(sample_rate, channels, window.clone());
            device.build_input_stream(
                &config.into(),
                move |data: &[u16], _: &cpal::InputCallbackInfo| {
                    // Convert u16 to f32
                    let f32_data: Vec<f32> = data.iter()
                        .map(|&sample| (sample as f32 - 32768.0) / 32768.0)
                        .collect();
                    
                    if let Err(_e) = processor.process_audio_chunk(&f32_data) {

                    }
                },
                |_err| {},
                None,
            )
        }
        _ => {
            return Err(format!("Unsupported sample format: {:?}", sample_format));
        }
    }.map_err(|e| format!("Failed to build input stream: {}", e))?;

    // Start the stream
    stream.play().map_err(|e| format!("Failed to start audio stream: {}", e))?;

    // Store the stop sender and set capturing flag
    {
        let mut sender = STOP_SENDER.lock().unwrap();
        *sender = Some(stop_sender);
    }
    IS_CAPTURING.store(true, Ordering::Relaxed);

    // Keep stream alive by forgetting it - it will be cleaned up when the process exits
    // This is acceptable for audio streams as they're typically long-lived
    std::mem::forget(stream);

    Ok(format!("Default audio capture started: {} (Sample rate: {}Hz, Channels: {})", device_name, sample_rate, channels))
}

#[command]
pub async fn start_system_audio_capture(window: Window) -> Result<String, String> {
    // Check if already capturing
    if IS_CAPTURING.load(Ordering::Relaxed) {
        return Err("Audio capture is already running".to_string());
    }

    let device = get_system_audio_device()?;
    let config = device.default_input_config()
        .map_err(|e| format!("Failed to get default input config: {}", e))?;

    let sample_rate = config.sample_rate().0;
    let channels = config.channels();
    let sample_format = config.sample_format();

    // Create stop channel
    let (stop_sender, _stop_receiver) = mpsc::unbounded_channel();

    // Build the input stream
    let stream = match sample_format {
        SampleFormat::F32 => {
            let mut processor = AudioProcessor::new(sample_rate, channels, window.clone());
            device.build_input_stream(
                &config.into(),
                move |data: &[f32], _: &cpal::InputCallbackInfo| {
                    if let Err(_e) = processor.process_audio_chunk(data) {

                    }
                },
                |_err| {},
                None,
            )
        }
        SampleFormat::I16 => {
            let mut processor = AudioProcessor::new(sample_rate, channels, window.clone());
            device.build_input_stream(
                &config.into(),
                move |data: &[i16], _: &cpal::InputCallbackInfo| {
                    // Convert i16 to f32
                    let f32_data: Vec<f32> = data.iter()
                        .map(|&sample| sample as f32 / 32768.0)
                        .collect();
                    
                    if let Err(_e) = processor.process_audio_chunk(&f32_data) {

                    }
                },
                |_err| {},
                None,
            )
        }
        SampleFormat::U16 => {
            let mut processor = AudioProcessor::new(sample_rate, channels, window.clone());
            device.build_input_stream(
                &config.into(),
                move |data: &[u16], _: &cpal::InputCallbackInfo| {
                    // Convert u16 to f32
                    let f32_data: Vec<f32> = data.iter()
                        .map(|&sample| (sample as f32 - 32768.0) / 32768.0)
                        .collect();
                    
                    if let Err(_e) = processor.process_audio_chunk(&f32_data) {

                    }
                },
                |_err| {},
                None,
            )
        }
        _ => {
            return Err(format!("Unsupported sample format: {:?}", sample_format));
        }
    }.map_err(|e| format!("Failed to build input stream: {}", e))?;

    // Start the stream
    stream.play().map_err(|e| format!("Failed to start audio stream: {}", e))?;

    // Store the stop sender and set capturing flag
    {
        let mut sender = STOP_SENDER.lock().unwrap();
        *sender = Some(stop_sender);
    }
    IS_CAPTURING.store(true, Ordering::Relaxed);

    // Keep stream alive by forgetting it - it will be cleaned up when the process exits
    // This is acceptable for audio streams as they're typically long-lived
    std::mem::forget(stream);

    Ok(format!("System audio capture started (Sample rate: {}Hz, Channels: {})", sample_rate, channels))
}

#[command]
pub async fn stop_system_audio_capture() -> Result<String, String> {
    if !IS_CAPTURING.load(Ordering::Relaxed) {
        return Err("No active audio capture to stop".to_string());
    }

    let mut sender_guard = STOP_SENDER.lock().unwrap();
    if let Some(sender) = sender_guard.take() {
        if let Err(_) = sender.send(()) {

        }
        IS_CAPTURING.store(false, Ordering::Relaxed);
        Ok("System audio capture stopped".to_string())
    } else {
        Err("No active audio capture to stop".to_string())
    }
}

#[command]
pub async fn get_audio_devices() -> Result<Vec<String>, String> {
    let host = cpal::default_host();
    let devices = host.input_devices()
        .map_err(|e| format!("Failed to enumerate devices: {}", e))?;

    let mut device_names = Vec::new();
    for device in devices {
        match device.name() {
            Ok(name) => device_names.push(name),
            Err(_e) => {},
        }
    }

    Ok(device_names)
}

#[command]
pub async fn set_vad_sensitivity(sensitivity: f32) -> Result<String, String> {
    // Validate sensitivity range
    if sensitivity < 0.001 || sensitivity > 0.1 {
        return Err("Sensitivity must be between 0.001 and 0.1".to_string());
    }
    
    // Update global sensitivity
    {
        let mut global_sensitivity = VAD_SENSITIVITY.lock().unwrap();
        *global_sensitivity = sensitivity;
    }
    
    Ok(format!("VAD sensitivity updated to: {:.3}", sensitivity))
}

#[command]
pub async fn set_speech_threshold(threshold: f32) -> Result<String, String> {
    if threshold < 0.001 || threshold > 0.1 {
        return Err("Speech threshold must be between 0.001 and 0.1".to_string());
    }
    
    {
        let mut global_threshold = SPEECH_THRESHOLD.lock().unwrap();
        *global_threshold = threshold;
    }
    
    Ok(format!("Speech threshold updated to: {:.3}", threshold))
}

#[command]
pub async fn set_silence_threshold(threshold: usize) -> Result<String, String> {
    if threshold < 1 || threshold > 500 {
        return Err("Silence threshold must be between 1 and 500 frames".to_string());
    }
    
    {
        let mut global_threshold = SILENCE_THRESHOLD.lock().unwrap();
        *global_threshold = threshold;
    }
    
    Ok(format!("Silence threshold updated to: {} frames", threshold))
}

#[command]
pub async fn set_min_speech_duration(duration: usize) -> Result<String, String> {
    if duration < 1 || duration > 100 {
        return Err("Minimum speech duration must be between 1 and 100 frames".to_string());
    }
    
    {
        let mut global_duration = MIN_SPEECH_DURATION.lock().unwrap();
        *global_duration = duration;
    }
    
    Ok(format!("Minimum speech duration updated to: {} frames", duration))
}

#[command]
pub async fn set_pre_speech_buffer_size(size: usize) -> Result<String, String> {
    if size < 1 || size > 100 {
        return Err("Pre-speech buffer size must be between 1 and 100 frames".to_string());
    }
    
    {
        let mut global_size = PRE_SPEECH_BUFFER_SIZE.lock().unwrap();
        *global_size = size;
    }
    
    Ok(format!("Pre-speech buffer size updated to: {} frames", size))
}

#[command]
pub async fn get_audio_settings() -> Result<String, String> {
    let vad_sensitivity = *VAD_SENSITIVITY.lock().unwrap();
    let speech_threshold = *SPEECH_THRESHOLD.lock().unwrap();
    let silence_threshold = *SILENCE_THRESHOLD.lock().unwrap();
    let min_speech_duration = *MIN_SPEECH_DURATION.lock().unwrap();
    let pre_speech_buffer_size = *PRE_SPEECH_BUFFER_SIZE.lock().unwrap();
    
    let settings = format!(
        "VAD Sensitivity: {:.3}\nSpeech Threshold: {:.3}\nSilence Threshold: {} frames\nMin Speech Duration: {} frames\nPre-speech Buffer: {} frames",
        vad_sensitivity, speech_threshold, silence_threshold, min_speech_duration, pre_speech_buffer_size
    );
    
    Ok(settings)
}

#[command]
pub async fn reset_audio_settings() -> Result<String, String> {
    // Reset to default values
    {
        let mut vad_sensitivity = VAD_SENSITIVITY.lock().unwrap();
        *vad_sensitivity = DEFAULT_VAD_SENSITIVITY;
    }
    {
        let mut speech_threshold = SPEECH_THRESHOLD.lock().unwrap();
        *speech_threshold = DEFAULT_SPEECH_THRESHOLD;
    }
    {
        let mut silence_threshold = SILENCE_THRESHOLD.lock().unwrap();
        *silence_threshold = DEFAULT_SILENCE_THRESHOLD;
    }
    {
        let mut min_speech_duration = MIN_SPEECH_DURATION.lock().unwrap();
        *min_speech_duration = DEFAULT_MIN_SPEECH_DURATION;
    }
    {
        let mut pre_speech_buffer_size = PRE_SPEECH_BUFFER_SIZE.lock().unwrap();
        *pre_speech_buffer_size = DEFAULT_PRE_SPEECH_BUFFER_SIZE;
    }

    Ok("All audio settings reset to defaults".to_string())
}

#[command]
pub async fn get_vad_status() -> Result<String, String> {
    let sensitivity = {
        let s = VAD_SENSITIVITY.lock().unwrap();
        *s
    };
    
    let capturing = IS_CAPTURING.load(Ordering::Relaxed);
    
    Ok(format!(
        "VAD Status - Capturing: {}, Sensitivity: {:.3}", 
        capturing, 
        sensitivity
    ))
}

#[command]
pub async fn debug_audio_devices() -> Result<String, String> {
    let host = cpal::default_host();
    let devices = host.input_devices()
        .map_err(|e| format!("Failed to enumerate devices: {}", e))?;

    let mut debug_info = String::new();
    debug_info.push_str("=== AUDIO DEVICE DEBUG INFO ===\n\n");

    for (i, device) in devices.enumerate() {
        let name = device.name()
            .map_err(|e| format!("Failed to get device name: {}", e))?;
        
        debug_info.push_str(&format!("Device {}: {}\n", i + 1, name));
        
        let name_lower = name.to_lowercase();
        
        // Analyze device type
        if name_lower.contains("microphone") || name_lower.contains("mic") {
            debug_info.push_str("  Type: Microphone (excluded from system audio)\n");
        } else if name_lower.contains("blackhole") {
            debug_info.push_str("  Type: BlackHole Virtual Audio (PERFECT for system audio)\n");
        } else if name_lower.contains("loopback") {
            debug_info.push_str("  Type: Loopback Device (GOOD for system audio)\n");
        } else if name_lower.contains("soundflower") {
            debug_info.push_str("  Type: SoundFlower (GOOD for system audio)\n");
        } else if name_lower.contains("stereo mix") {
            debug_info.push_str("  Type: Stereo Mix (PERFECT for system audio)\n");
        } else if name_lower.contains("monitor") {
            debug_info.push_str("  Type: Monitor Device (PERFECT for system audio)\n");
        } else if name_lower.contains("virtual") {
            debug_info.push_str("  Type: Virtual Audio Device (GOOD for system audio)\n");
        } else if name_lower.contains("built-in") || name_lower.contains("internal") {
            debug_info.push_str("  Type: Built-in Device (excluded from system audio)\n");
        } else {
            debug_info.push_str("  Type: Unknown/Other\n");
        }
        
        // Try to get device config
        match device.default_input_config() {
            Ok(config) => {
                debug_info.push_str(&format!("  Sample Rate: {}Hz\n", config.sample_rate().0));
                debug_info.push_str(&format!("  Channels: {}\n", config.channels()));
                debug_info.push_str(&format!("  Sample Format: {:?}\n", config.sample_format()));
            }
            Err(e) => {
                debug_info.push_str(&format!("  Config Error: {}\n", e));
            }
        }
        
        debug_info.push_str("\n");
    }
    
    Ok(debug_info)
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
        Current VAD Threshold: 0.001\n\
        Audio Detected: {}\n\n\
        Recommendations:\n\
        - If Max RMS < 0.001: Increase system volume or check BlackHole setup\n\
        - If Max RMS > 0.01: Audio levels look good\n\
        - If no audio: Check if applications are outputting to BlackHole", 
        device.name().unwrap_or_else(|_| "Unknown".to_string()),
        sample_rate, 
        channels,
        max_rms, 
        max_peak, 
        avg_rms,
        sample_count,
        if max_rms > 0.001 { "YES" } else { "NO" }
    ))
}