// Device management for audio capture
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AudioDeviceInfo {
    pub id: String,
    pub name: String,
    pub is_default: bool,
    pub sample_rate: Option<u32>,
    pub channels: Option<u16>,
}

// Platform-specific device listing
#[cfg(target_os = "macos")]
pub fn list_audio_output_devices() -> Result<Vec<AudioDeviceInfo>, String> {
    use cidre::core_audio as ca;
    
    let mut devices = Vec::new();
    
    // Get default output device
    let default_device = ca::System::default_output_device()
        .map_err(|e| format!("Failed to get default device: {}", e))?;
    let default_uid = default_device.uid()
        .map_err(|e| format!("Failed to get default UID: {}", e))?;
    
    // For now, just return the default device (cidre doesn't have a simple way to list all devices)
    // This is a known limitation - would need to enumerate all devices via CoreAudio directly
    let devices_vec = vec![default_device];
    
    for device in devices_vec.iter() {
        let uid = match device.uid() {
            Ok(uid) => uid.to_string(),
            Err(_) => continue,
        };
        
        let name = device.name()
            .unwrap_or_else(|_| "Unknown Device".into())
            .to_string();
        
        let is_default = uid == default_uid.to_string();
        
        let sample_rate = device.nominal_sample_rate().ok().map(|r| r as u32);
        
        devices.push(AudioDeviceInfo {
            id: uid,
            name,
            is_default,
            sample_rate,
            channels: Some(2), // Most devices are stereo
        });
    }
    
    Ok(devices)
}

#[cfg(target_os = "windows")]
pub fn list_audio_output_devices() -> Result<Vec<AudioDeviceInfo>, String> {
    // use wasapi::{get_default_device, get_device_names, Direction};
        
    let mut devices = Vec::new();
    
    // Get default device
    // let default_device = get_default_device(&Direction::Render)
    //     .map_err(|e| format!("Failed to get default device: {}", e))?;
    // let default_name = default_device.get_friendlyname()
    //     .unwrap_or_else(|_| "Default".to_string());
    
    // Get all render (output) devices
    // let device_names = get_device_names(&Direction::Render)
    //     .map_err(|e| format!("Failed to list devices: {}", e))?;
    
    // for (idx, name) in device_names.iter().enumerate() {
    //     devices.push(AudioDeviceInfo {
    //         id: format!("win_out_{}", idx),
    //         name: name.clone(),
    //         is_default: name == &default_name,
    //         sample_rate: Some(44100), // Standard rate
    //         channels: Some(2),
    //     });
    // }
    
    Ok(devices)
}

#[cfg(target_os = "linux")]
pub fn list_audio_output_devices() -> Result<Vec<AudioDeviceInfo>, String> {
    use libpulse_binding as pulse;
    use pulse::context::{Context, introspect::SinkInfo};
    use pulse::mainloop::standard::{Mainloop, IterateResult};
    use std::sync::{Arc, Mutex};
    use std::rc::Rc;
    use std::cell::RefCell;
        
    let devices = Arc::new(Mutex::new(Vec::new()));
    let devices_clone = devices.clone();
    
    // Create mainloop
    let mut mainloop = Mainloop::new()
        .ok_or("Failed to create mainloop")?;
    
    let mut context = Context::new(&mainloop, "pluely-device-list")
        .ok_or("Failed to create context")?;
    
    // Connect to PulseAudio server
    context.connect(None, pulse::context::FlagSet::NOFLAGS, None)
        .map_err(|e| format!("Failed to connect to PulseAudio: {}", e))?;
    
    // Wait for connection
    loop {
        match mainloop.iterate(false) {
            IterateResult::Quit(_) | IterateResult::Err(_) => {
                return Err("Mainloop error".to_string());
            }
            IterateResult::Success(_) => {}
        }
        
        match context.get_state() {
            pulse::context::State::Ready => break,
            pulse::context::State::Failed | pulse::context::State::Terminated => {
                return Err("Connection failed".to_string());
            }
            _ => {}
        }
    }
    
    // Query sinks (output devices)
    let introspector = context.introspect();
    let op = introspector.get_sink_info_list(move |sink_list| {
        for sink in sink_list {
            let mut devices = devices_clone.lock().unwrap();
            devices.push(AudioDeviceInfo {
                id: sink.name.as_ref().map(|n| n.to_string()).unwrap_or_default(),
                name: sink.description.as_ref().map(|d| d.to_string()).unwrap_or_else(|| "Unknown".to_string()),
                is_default: false, // Would need to check server info for default
                sample_rate: Some(sink.sample_spec.rate),
                channels: Some(sink.sample_spec.channels as u16),
            });
        }
    });
    
    // Wait for operation to complete
    while op.get_state() == pulse::operation::State::Running {
        match mainloop.iterate(false) {
            IterateResult::Quit(_) | IterateResult::Err(_) => {
                return Err("Operation error".to_string());
            }
            IterateResult::Success(_) => {}
        }
    }
    
    let result = devices.lock().unwrap().clone();
    Ok(result)
}

#[cfg(not(any(target_os = "macos", target_os = "windows", target_os = "linux")))]
pub fn list_audio_output_devices() -> Result<Vec<AudioDeviceInfo>, String> {
    Err("Device listing not supported on this platform".to_string())
}

// Tauri commands
#[tauri::command]
pub fn list_system_audio_devices() -> Result<Vec<AudioDeviceInfo>, String> {
    list_audio_output_devices()
}

#[tauri::command]
pub fn get_default_audio_device() -> Result<Option<AudioDeviceInfo>, String> {
    let devices = list_audio_output_devices()?;
    Ok(devices.into_iter().find(|d| d.is_default))
}

