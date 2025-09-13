// Pluely linux speaker input and stream
use anyhow::{anyhow, Result};
use futures_util::Stream;
use std::collections::VecDeque;
use std::sync::{Arc, Mutex};
use std::task::{Poll, Waker};
use std::thread;

use pulsectl::stream::{Direction, Stream};
use pulsectl::simple::Simple;
use pulsectl::sample::{Spec, Format};

pub struct SpeakerInput {
    server_name: Option<String>,
}

impl SpeakerInput {
    pub fn new() -> Result<Self> {
        let simple = Simple::new("localhost").map_err(|e| anyhow!(e.to_string()))?;
        let server_name = simple.get_server_info().map(|info| info.server_name);
        Ok(Self { server_name })
    }

    pub fn stream(self) -> SpeakerStream {
        let sample_queue = Arc::new(Mutex::new(VecDeque::new()));
        let waker_state = Arc::new(Mutex::new(WakerState {
            waker: None,
            shutdown: false,
        }));
        let (init_tx, init_rx) = std::sync::mpsc::channel();

        let queue_clone = sample_queue.clone();
        let waker_clone = waker_state.clone();
        let server_name = self.server_name;

        let capture_thread = thread::spawn(move || {
            if let Err(e) = SpeakerStream::capture_audio_loop(
                queue_clone,
                waker_clone,
                server_name.as_deref(),
                init_tx,
            ) {
                eprintln!("Audio capture loop failed: {}", e);
            }
        });

        let sample_rate = match init_rx.recv() {
            Ok(Ok(sr)) => sr,
            Ok(Err(e)) => {
                eprintln!("Audio initialization failed: {}", e);
                0
            }
            Err(e) => {
                eprintln!("Failed to receive audio init signal: {}", e);
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
        server_name: Option<&str>,
        init_tx: std::sync::mpsc::Sender<Result<u32>>,
    ) -> Result<()> {
        let spec = Spec {
            format: Format::F32le,
            rate: 16000,
            channels: 1,
        };
        assert!(spec.is_valid());

        let init_result: Result<(Stream, u32, u8)> = (|| {
            let simple = Simple::new(server_name.unwrap_or("localhost")).map_err(|e| anyhow!(e.to_string()))?;
            let monitor_source = simple.get_server_info()
                .and_then(|info| info.default_sink_name)
                .map(|sink_name| format!("{}.monitor", sink_name))
                .ok_or_else(|| anyhow!("Could not get default sink name"))?;

            let stream = Stream::new(
                &simple.context,
                "pluely-capture",
                &spec,
                None,
            ).map_err(|e| anyhow!(e.to_string()))?;
            
            stream.connect_record(Some(&monitor_source), None, Direction::Record).map_err(|e| anyhow!(e.to_string()))?;

            Ok((stream, spec.rate, spec.channels))
        })();

        match init_result {
            Ok((stream, sample_rate, _n_channels)) => {
                let _ = init_tx.send(Ok(sample_rate));
                loop {
                    if waker_state.lock().unwrap().shutdown {
                        break;
                    }
                    
                    match stream.read(8192) {
                        Ok(data) => {
                            let samples: Vec<f32> = data
                                .chunks_exact(4)
                                .map(|chunk| f32::from_le_bytes([chunk[0], chunk[1], chunk[2], chunk[3]]))
                                .collect();

                            if !samples.is_empty() {
                                sample_queue.lock().unwrap().extend(samples);
                                if let Some(waker) = waker_state.lock().unwrap().waker.take() {
                                    waker.wake();
                                }
                            } else {
                                thread::sleep(std::time::Duration::from_millis(10));
                            }
                        }
                        Err(e) => {
                            eprintln!("PulseAudio stream read error: {:?}", e);
                            break;
                        }
                    }
                }
            }
            Err(e) => {
                let _ = init_tx.send(Err(e));
            }
        }
        Ok(())
    }
}

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

impl Stream for SpeakerStream {
    type Item = f32;

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

        state.waker = Some(cx.waker().clone());
        Poll::Pending
    }
}