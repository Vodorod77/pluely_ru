use tauri::{Manager, App, WebviewWindow};

// The offset from the top of the screen to the window
const TOP_OFFSET: i32 = 54;

/// Sets up the main window with custom positioning
pub fn setup_main_window(app: &mut App) -> Result<(), Box<dyn std::error::Error>> {
    // Try different possible window labels
    let window = app.get_webview_window("main")
        .or_else(|| app.get_webview_window("pluely"))
        .or_else(|| {
            // Get the first window if specific labels don't work
            app.webview_windows().values().next().cloned()
        })
        .ok_or("No window found")?;
    
    position_window_top_center(&window, TOP_OFFSET)?;
    
    Ok(())
}

/// Positions a window at the top center of the screen with a specified Y offset
pub fn position_window_top_center(window: &WebviewWindow, y_offset: i32) -> Result<(), Box<dyn std::error::Error>> {
    // Get the primary monitor
    if let Some(monitor) = window.primary_monitor()? {
        let monitor_size = monitor.size();
        let window_size = window.outer_size()?;
        
        // Calculate center X position
        let center_x = (monitor_size.width as i32 - window_size.width as i32) / 2;
        
        // Set the window position
        window.set_position(tauri::Position::Physical(tauri::PhysicalPosition {
            x: center_x,
            y: y_offset,
        }))?;
    }
    
    Ok(())
}

/// Future function for centering window completely (both X and Y)
#[allow(dead_code)]
pub fn center_window_completely(window: &WebviewWindow) -> Result<(), Box<dyn std::error::Error>> {
    if let Some(monitor) = window.primary_monitor()? {
        let monitor_size = monitor.size();
        let window_size = window.outer_size()?;
        
        let center_x = (monitor_size.width as i32 - window_size.width as i32) / 2;
        let center_y = (monitor_size.height as i32 - window_size.height as i32) / 2;
        
        window.set_position(tauri::Position::Physical(tauri::PhysicalPosition {
            x: center_x,
            y: center_y,
        }))?;
    }
    
    Ok(())
}

#[tauri::command]
pub fn set_window_height(window: tauri::WebviewWindow, height: u32) -> Result<(), String> {
    use tauri::{LogicalSize, Size, PhysicalPosition};

    // Get monitor size
    let monitor = window.current_monitor()
        .map_err(|e| format!("Failed to get monitor: {}", e))?
        .ok_or("No monitor found".to_string())?;
    let screen_size = monitor.size();

    // Get current position & size
    let current_pos = window.outer_position()
        .map_err(|e| format!("Failed to get window position: {}", e))?;
 
    let new_height = height as i32;
    let new_width = 700; // dynamically use current width
    let mut new_x = current_pos.x;
    let mut new_y = current_pos.y;

    // Ensure width fits inside screen
    if new_x + new_width > screen_size.width as i32 {
        new_x = screen_size.width as i32 - new_width;
    }
    if new_x < 0 {
        new_x = 0;
    }

    // Check vertical fit
    if new_y + new_height > screen_size.height as i32 {
        // shift up so bottom fits
        new_y = screen_size.height as i32 - new_height;
        if new_y < 0 {
            new_y = 0; // in case screen is smaller than requested height
        }
    }

    // Resize (keep current width, only update height)
    let new_size = LogicalSize::new(new_width as f64, new_height as f64);
    window.set_size(Size::Logical(new_size))
        .map_err(|e| format!("Failed to resize window: {}", e))?;

    // Reposition
    window.set_position(tauri::Position::Physical(PhysicalPosition {
        x: new_x,
        y: new_y,
    }))
    .map_err(|e| format!("Failed to reposition window: {}", e))?;

    Ok(())
}