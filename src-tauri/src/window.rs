use tauri::{Manager, App, WebviewWindow, PhysicalPosition};
use std::time::Duration;

// The offset from the top of the screen to the window
const TOP_OFFSET: i32 = 54;
const RETRY_DELAY_MS: u64 = 100;
const MAX_RETRIES: u32 = 10;

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
    
    // For Linux, we need to add a delay and retry mechanism
    #[cfg(target_os = "linux")]
    {
        let window_clone = window.clone();
        std::thread::spawn(move || {
            // Wait a bit for the window manager to fully initialize
            std::thread::sleep(Duration::from_millis(200));
            
            // Try positioning with retries
            for _ in 0..MAX_RETRIES {
                if let Ok(_) = position_window_top_center_with_retry(&window_clone, TOP_OFFSET) {
                    break;
                }
                std::thread::sleep(Duration::from_millis(RETRY_DELAY_MS));
            }
        });
        
        // Also try immediate positioning (might work on some Linux setups)
        let _ = position_window_top_center(&window, TOP_OFFSET);
    }
    
    // For macOS and Windows, use the original logic
    #[cfg(not(target_os = "linux"))]
    {
        position_window_top_center(&window, TOP_OFFSET)?;
    }
    
    Ok(())
}

/// Positions a window at the top center of the screen with a specified Y offset
pub fn position_window_top_center(window: &WebviewWindow, y_offset: i32) -> Result<(), Box<dyn std::error::Error>> {
    // Get the primary monitor
    let monitor = window.primary_monitor()?
        .ok_or("Primary monitor not found")?;
    
    let monitor_size = monitor.size();
    let window_size = window.outer_size()?;
    
    // Calculate center X position
    let center_x = (monitor_size.width as i32 - window_size.width as i32) / 2;
    
    // Ensure we don't position the window off-screen
    let safe_x = center_x.max(0);
    let safe_y = y_offset.max(0);
    
    // Set the window position using Physical positioning for more reliable results on Linux
    window.set_position(tauri::Position::Physical(PhysicalPosition {
        x: safe_x,
        y: safe_y,
    }))?;
    
    Ok(())
}

/// Enhanced positioning function with retry mechanism for Linux
pub fn position_window_top_center_with_retry(window: &WebviewWindow, y_offset: i32) -> Result<(), Box<dyn std::error::Error>> {
    // Wait for the primary monitor to be properly detected
    let monitor = loop {
        if let Ok(Some(monitor)) = window.primary_monitor() {
            break monitor;
        }
        std::thread::sleep(Duration::from_millis(50));
    };
    
    let monitor_size = monitor.size();
    let window_size = window.outer_size()?;
    
    // Calculate center X position with additional validation
    let center_x = (monitor_size.width as i32 - window_size.width as i32) / 2;
    
    // Add monitor position offset for multi-monitor setups
    let monitor_pos = monitor.position();
    let final_x = monitor_pos.x + center_x.max(0);
    let final_y = monitor_pos.y + y_offset.max(0);
    
    // Set position with validated coordinates
    window.set_position(tauri::Position::Physical(PhysicalPosition {
        x: final_x,
        y: final_y,
    }))?;
    
    Ok(())
}

/// Function to handle window repositioning when window size changes (used in set_window_height)
pub fn reposition_after_resize(window: &WebviewWindow) -> Result<(), Box<dyn std::error::Error>> {
    #[cfg(target_os = "linux")]
    {
        // Add small delay on Linux to ensure window manager processes the resize
        std::thread::sleep(Duration::from_millis(50));
        position_window_top_center_with_retry(window, TOP_OFFSET)
    }
    
    #[cfg(not(target_os = "linux"))]
    {
        position_window_top_center(window, TOP_OFFSET)
    }
}

/// Future function for centering window completely (both X and Y)
#[allow(dead_code)]
pub fn center_window_completely(window: &WebviewWindow) -> Result<(), Box<dyn std::error::Error>> {
    let monitor = window.primary_monitor()?
        .ok_or("Primary monitor not found")?;
    
    let monitor_size = monitor.size();
    let window_size = window.outer_size()?;
    let monitor_pos = monitor.position();
    
    let center_x = monitor_pos.x + (monitor_size.width as i32 - window_size.width as i32) / 2;
    let center_y = monitor_pos.y + (monitor_size.height as i32 - window_size.height as i32) / 2;
    
    window.set_position(tauri::Position::Physical(PhysicalPosition {
        x: center_x.max(monitor_pos.x),
        y: center_y.max(monitor_pos.y),
    }))?;
    
    Ok(())
}

/// Future function for positioning window at custom coordinates
#[allow(dead_code)]
pub fn position_window_at(window: &WebviewWindow, x: i32, y: i32) -> Result<(), Box<dyn std::error::Error>> {
    window.set_position(tauri::Position::Physical(PhysicalPosition { x, y }))?;
    Ok(())
}
