// Pluely windows speaker input and stream
use anyhow::Result;
use futures_util::Stream;
use std::collections::VecDeque;
use std::sync::{mpsc, Arc, Mutex};
use std::task::{Poll, Waker};
use std::thread;
use tracing::error;
use wasapi::{
    AudioClient, AudioCaptureClient, Device, Direction, SampleType, ShareMode, StreamFlags,
    WaveFormat,
};

pub struct SpeakerInput {}

impl SpeakerInput {
    pub fn new() -> Result<Self> {
        Ok(Self {})
    }

    // Starts the audio stream
    pub fn stream(self) -> SpeakerStream {
        let sample_queue = Arc::new(Mutex::new(VecDeque::new()));
        let waker_state = Arc::new(Mutex::new(WakerState {
            waker: None,
            has_data: false,
            shutdown: false,
        }));
        let (init_tx, init_rx) = mpsc::channel();

        let queue_clone = sample_queue.clone();
        let waker_clone = waker_state.clone();

        let capture_thread = thread::spawn(move || {
            if let Err(e) = SpeakerStream::capture_audio_loop(queue_clone, waker_clone, init_tx) {
                error!("Audio capture loop failed: {}", e);
            }
        });

        let sample_rate = match init_rx.recv() {
            Ok(Ok(sr)) => sr,
            Ok(Err(e)) => {
                error!("Audio initialization failed: {}", e);
                0
            }
            Err(e) => {
                error!("Failed to receive audio init signal: {}", e);
                0
            }
        };

        SpeakerStream {
            sample_queue,
            waker_state,
            capture_thread: Some(capture_thread),
            sample_rate,
        }
    }
}

struct WakerState {
    waker: Option<Waker>,
    has_data: bool,
    shutdown: bool,
}

pub struct SpeakerStream {
    sample_queue: Arc<Mutex<VecDeque<f32>>>,
    waker_state: Arc<Mutex<WakerState>>,
    capture_thread: Option<thread::JoinHandle<()>>,
    sample_rate: u32,
}

impl SpeakerStream {
    pub fn sample_rate(&self) -> u32 {
        self.sample_rate
    }

    fn capture_audio_loop(
        sample_queue: Arc<Mutex<VecDeque<f32>>>,
        waker_state: Arc<Mutex<WakerState>>,
        init_tx: mpsc::Sender<Result<u32>>,
    ) -> Result<()> {
        let init_result: Result<(u32, u16, Device, AudioClient, AudioCaptureClient)> = (|| {
            let device = wasapi::get_default_device(&Direction::Render)?;
            let mut audio_client = device.get_iaudioclient()?;
            let wave_format = audio_client.get_mix_format()?;

            let desired_channels = 1;
            let sample_rate = wave_format.get_samplerate();
            let n_channels = wave_format.get_nchannels();

            let format = WaveFormat::new(
                wave_format.get_tag(),
                desired_channels,
                sample_rate,
                wave_format.get_avgbytespersec() / n_channels as u32 * desired_channels as u32,
                wave_format.get_blockalign() / n_channels * desired_channels,
                wave_format.get_bitspersample(),
                Some(SampleType::Float),
            );

            audio_client.initialize_client(
                &format,
                0,
                &Direction::Capture,
                &ShareMode::Shared,
                false,
            )?;

            let h_event = audio_client.set_get_eventhandle()?;
            let render_client = audio_client.get_audiocaptureclient()?;
            audio_client.start_stream()?;

            // Wait for the first packet to be ready.
            h_event.wait_for_event(1000)?;

            Ok((
                sample_rate,
                n_channels,
                device,
                audio_client,
                render_client,
            ))
        })();

        match init_result {
            Ok((sample_rate, n_channels, _device, _client, render_client)) => {
                init_tx.send(Ok(sample_rate))?;

                loop {
                    if waker_state.lock().unwrap().shutdown {
                        break;
                    }

                    let available_frames = render_client.get_next_packet_size()?;
                    if available_frames == 0 {
                        std::thread::sleep(std::time::Duration::from_millis(10));
                        continue;
                    }

                    let (buffer, flags) =
                        render_client.get_buffer(available_frames)?;

                    if flags.contains(StreamFlags::SILENT) {
                        let mut queue = sample_queue.lock().unwrap();
                        for _ in 0..available_frames {
                            queue.push_back(0.0);
                        }
                    } else {
                        let mut samples = Vec::new();
                        let buffer_slice = unsafe {
                            std::slice::from_raw_parts(buffer, (available_frames * n_channels as u32 * 4) as usize)
                        };

                        for chunk in buffer_slice.chunks_exact(4 * n_channels as usize) {
                            let mut mono_sample = 0.0;
                            for i in 0..n_channels {
                                let start = i as usize * 4;
                                let bytes = [chunk[start], chunk[start + 1], chunk[start + 2], chunk[start + 3]];
                                mono_sample += f32::from_le_bytes(bytes);
                            }
                            samples.push(mono_sample / n_channels as f32);
                        }

                        if !samples.is_empty() {
                            let mut queue = sample_queue.lock().unwrap();
                            queue.extend(samples);
                        }
                    }
                    render_client.release_buffer(available_frames)?;

                    let mut state = waker_state.lock().unwrap();
                    if !state.has_data {
                        state.has_data = true;
                        if let Some(waker) = state.waker.take() {
                            waker.wake();
                        }
                    }
                }
            }
            Err(e) => {
                init_tx.send(Err(anyhow::anyhow!(e.to_string())))?;
            }
        }
        Ok(())
    }
}

// Drops the audio stream
impl Drop for SpeakerStream {
    fn drop(&mut self) {
        {
            let mut state = self.waker_state.lock().unwrap();
            state.shutdown = true;
            if let Some(waker) = state.waker.take() {
                waker.wake();
            }
        }

        if let Some(thread) = self.capture_thread.take() {
            let _ = thread.join();
        }
    }
}

// Stream of f32 audio samples from the speaker
impl Stream for SpeakerStream {
    type Item = f32;

    // Polls the audio stream
    fn poll_next(
        self: std::pin::Pin<&mut Self>,
        cx: &mut std::task::Context<'_>,
    ) -> Poll<Option<Self::Item>> {
        let mut queue = self.sample_queue.lock().unwrap();
        if let Some(sample) = queue.pop_front() {
            return Poll::Ready(Some(sample));
        }

        let mut state = self.waker_state.lock().unwrap();
        if state.shutdown {
            return Poll::Ready(None);
        }

        state.has_data = false;
        state.waker = Some(cx.waker().clone());

        Poll::Pending
    }
}