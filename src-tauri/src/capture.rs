use base64::Engine;
use image::codecs::png::PngEncoder;
use image::{ColorType, GenericImageView, ImageEncoder};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use std::{thread, time::Duration};
use tauri::Emitter;
use tauri::{Manager, WebviewUrl, WebviewWindowBuilder};
use xcap::Monitor;

#[derive(Debug, Serialize, Deserialize)]
pub struct SelectionCoords {
    pub x: u32,
    pub y: u32,
    pub width: u32,
    pub height: u32,
}

#[derive(Debug, Clone)]
pub struct MonitorInfo {
    pub image: image::RgbaImage,
}

// Store captured images from all monitors temporarily for cropping
#[derive(Default)]
pub struct CaptureState {
    pub captured_monitors: Arc<Mutex<HashMap<usize, MonitorInfo>>>,
}

#[tauri::command]
pub async fn start_screen_capture(app: tauri::AppHandle) -> Result<(), String> {
    // Get all monitors
    let monitors = Monitor::all().map_err(|e| format!("Failed to get monitors: {}", e))?;
    
    if monitors.is_empty() {
        return Err("No monitors found".to_string());
    }

    let state = app.state::<CaptureState>();
    let mut captured_monitors = HashMap::new();

    // Capture all monitors and store their info
    for (idx, monitor) in monitors.iter().enumerate() {
        let captured_image = monitor
            .capture_image()
            .map_err(|e| format!("Failed to capture monitor {}: {}", idx, e))?;

        let monitor_info = MonitorInfo {
            image: captured_image,
        };

        captured_monitors.insert(idx, monitor_info);
    }

    // Store all captured monitors
    *state.captured_monitors.lock().unwrap() = captured_monitors;

    // Create overlay windows for all monitors
    for (idx, monitor) in monitors.iter().enumerate() {
        let monitor_width = monitor.width() as f64;
        let monitor_height = monitor.height() as f64;
        let monitor_x = monitor.x() as f64;
        let monitor_y = monitor.y() as f64;

        let window_label = format!("capture-overlay-{}", idx);

        let overlay = WebviewWindowBuilder::new(
            &app,
            &window_label,
            WebviewUrl::App("index.html".into()),
        )
        .title("Screen Capture")
        .inner_size(monitor_width, monitor_height)
        .position(monitor_x, monitor_y)
        .transparent(true)
        .always_on_top(true)
        .decorations(false)
        .skip_taskbar(true)
        .resizable(false)
        .closable(false)
        .minimizable(false)
        .maximizable(false)
        .visible(false)
        .focused(true)
        .accept_first_mouse(true)
        .build()
        .map_err(|e| format!("Failed to create overlay window {}: {}", idx, e))?;

        // Wait a short moment for content to load before showing
        thread::sleep(Duration::from_millis(100));

        overlay.show().ok();
        overlay.set_always_on_top(true).ok();
        
        if monitor.is_primary() {
            overlay.set_focus().ok();
            overlay
                .request_user_attention(Some(tauri::UserAttentionType::Critical))
                .ok();
        }
    }

    // Give a moment for all windows to settle, then focus primary again
    std::thread::sleep(std::time::Duration::from_millis(100));
    
    for (idx, monitor) in monitors.iter().enumerate() {
        if monitor.is_primary() {
            let window_label = format!("capture-overlay-{}", idx);
            if let Some(window) = app.get_webview_window(&window_label) {
                window.set_focus().ok();
            }
            break;
        }
    }

    Ok(())
}

// close overlay window
#[tauri::command]
pub fn close_overlay_window(app: tauri::AppHandle) -> Result<(), String> {
    // Get all webview windows and close those that are capture overlays
    let webview_windows = app.webview_windows();
    
    for (label, window) in webview_windows.iter() {
        if label.starts_with("capture-overlay-") {
            window.destroy().ok();
        }
    }

    // Clear captured monitors from state
    let state = app.state::<CaptureState>();
    state.captured_monitors.lock().unwrap().clear();

    // Emit an event to the main window to signal that the overlay has been closed
    if let Some(main_window) = app.get_webview_window("main") {
        main_window.emit("capture-closed", ()).unwrap();
    }

    Ok(())
}

#[tauri::command]
pub async fn capture_selected_area(
    app: tauri::AppHandle,
    coords: SelectionCoords,
    monitor_index: usize,
) -> Result<String, String> {
    // Get the stored captured monitors
    let state = app.state::<CaptureState>();
    let mut captured_monitors = state.captured_monitors.lock().unwrap();
    
    let monitor_info = captured_monitors
        .remove(&monitor_index)
        .ok_or(format!("No captured image found for monitor {}", monitor_index))?;

    // Validate coordinates
    if coords.width == 0 || coords.height == 0 {
        return Err("Invalid selection dimensions".to_string());
    }

    let img_width = monitor_info.image.width();
    let img_height = monitor_info.image.height();

    // Ensure coordinates are within bounds
    let x = coords.x.min(img_width.saturating_sub(1));
    let y = coords.y.min(img_height.saturating_sub(1));
    let width = coords.width.min(img_width - x);
    let height = coords.height.min(img_height - y);

    // Crop the image to the selected area
    let cropped = monitor_info.image.view(x, y, width, height).to_image();

    // Encode to PNG and base64
    let mut png_buffer = Vec::new();
    PngEncoder::new(&mut png_buffer)
        .write_image(
            cropped.as_raw(),
            cropped.width(),
            cropped.height(),
            ColorType::Rgba8.into(),
        )
        .map_err(|e| format!("Failed to encode to PNG: {}", e))?;

    let base64_str = base64::engine::general_purpose::STANDARD.encode(png_buffer);

    captured_monitors.clear();
    drop(captured_monitors);

    // Close all overlay windows
    let webview_windows = app.webview_windows();
    for (label, window) in webview_windows.iter() {
        if label.starts_with("capture-overlay-") {
            window.destroy().ok();
        }
    }

    // Emit event with base64 data
    app.emit("captured-selection", &base64_str)
        .map_err(|e| format!("Failed to emit captured-selection event: {}", e))?;

    Ok(base64_str)
}

#[tauri::command]
pub async fn capture_to_base64() -> Result<String, String> {
    tauri::async_runtime::spawn_blocking(|| {
        let monitors = Monitor::all().map_err(|e| format!("Failed to get monitors: {}", e))?;
        let primary_monitor = monitors
            .into_iter()
            .find(|m| m.is_primary())
            .ok_or_else(|| "No primary monitor found".to_string())?;

        let image = primary_monitor
            .capture_image()
            .map_err(|e| format!("Failed to capture image: {}", e))?;
        let mut png_buffer = Vec::new();
        PngEncoder::new(&mut png_buffer)
            .write_image(
                image.as_raw(),
                image.width(),
                image.height(),
                ColorType::Rgba8.into(),
            )
            .map_err(|e| format!("Failed to encode to PNG: {}", e))?;
        let base64_str = base64::engine::general_purpose::STANDARD.encode(png_buffer);

        Ok(base64_str)
    })
    .await
    .map_err(|e| format!("Task panicked: {}", e))?
}
