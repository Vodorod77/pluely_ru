use base64::Engine;
use image::codecs::png::PngEncoder;
use image::{ColorType, ImageEncoder, GenericImageView};
use xcap::Monitor;
use tauri::{Manager, WebviewUrl, WebviewWindowBuilder};
use std::sync::{Arc, Mutex};
use serde::{Deserialize, Serialize};
use tauri::Emitter;
use std::{thread, time::Duration};

#[derive(Debug, Serialize, Deserialize)]
pub struct SelectionCoords {
    pub x: u32,
    pub y: u32,
    pub width: u32,
    pub height: u32,
}

// Store the captured full screen image temporarily for cropping
#[derive(Default)]
pub struct CaptureState {
    pub captured_image: Arc<Mutex<Option<image::RgbaImage>>>,
}

#[tauri::command]
pub async fn start_screen_capture(app: tauri::AppHandle) -> Result<(), String> {
    // Get primary monitor dimensions
    let monitors = Monitor::all().map_err(|e| format!("Failed to get monitors: {}", e))?;
    let primary_monitor = monitors
        .iter()
        .find(|m| m.is_primary())
        .ok_or("No primary monitor found".to_string())?;

    // Capture the full screen first
    let captured_image = primary_monitor
        .capture_image()
        .map_err(|e| format!("Failed to capture image: {}", e))?;
    
    // Store the captured image in app state
    let state = app.state::<CaptureState>();
    *state.captured_image.lock().unwrap() = Some(captured_image);

    // Get monitor dimensions
    let monitor_width = primary_monitor.width() as f64;
    let monitor_height = primary_monitor.height() as f64;
    let monitor_x = primary_monitor.x() as f64;
    let monitor_y = primary_monitor.y() as f64;

    // Create overlay window for selection - uses the same index.html but main.tsx detects window label
    let overlay = WebviewWindowBuilder::new(
        &app,
        "capture-overlay",
        WebviewUrl::App("index.html".into())
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
    .map_err(|e| format!("Failed to create overlay window: {}", e))?;

    // Wait a short moment for content to load before showing
    thread::sleep(Duration::from_millis(100));

    // Show the window (now fully loaded) without white flash
    overlay.show().ok();
    overlay.set_focus().ok();
    overlay.set_always_on_top(true).ok();
    overlay.request_user_attention(Some(tauri::UserAttentionType::Critical)).ok();

    // Give it a moment to settle and try to focus again
    std::thread::sleep(std::time::Duration::from_millis(100));
    overlay.set_focus().ok();

    println!("Overlay window created and focused - ready for input");

    Ok(())
}

// close overlay window
#[tauri::command]
pub fn close_overlay_window(app: tauri::AppHandle) -> Result<(), String> {
    println!("Force closing overlay window");
    if let Some(window) = app.get_webview_window("capture-overlay") {
        window
            .destroy()
            .map_err(|e| format!("Failed to close overlay: {}", e))?;
        println!("Overlay window closed successfully");
    } else {
        println!("Overlay window not found");
    }

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
) -> Result<String, String> {
    // Get the stored captured image
    let state = app.state::<CaptureState>();
    let captured_image = state
        .captured_image
        .lock()
        .unwrap()
        .take()
        .ok_or("No captured image found".to_string())?;

    // Validate coordinates
    if coords.width == 0 || coords.height == 0 {
        return Err("Invalid selection dimensions".to_string());
    }

    let img_width = captured_image.width();
    let img_height = captured_image.height();

    // Ensure coordinates are within bounds
    let x = coords.x.min(img_width.saturating_sub(1));
    let y = coords.y.min(img_height.saturating_sub(1));
    let width = coords.width.min(img_width - x);
    let height = coords.height.min(img_height - y);

    // Crop the image to the selected area
    let cropped = captured_image.view(x, y, width, height).to_image();

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
    
    // Close the overlay window
    if let Some(window) = app.get_webview_window("capture-overlay") {
        let _ = window.destroy();
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

