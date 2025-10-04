use serde_json::json;
use std::sync::Mutex;
use tauri::{AppHandle, Emitter, Manager, Runtime};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, ShortcutState};
// State for window visibility
pub struct WindowVisibility {
    #[allow(dead_code)]
    pub is_hidden: Mutex<bool>,
}

// Default shortcuts
#[cfg(target_os = "macos")]
const DEFAULT_TOGGLE_SHORTCUT: &str = "cmd+backslash";
#[cfg(not(target_os = "macos"))]
const DEFAULT_TOGGLE_SHORTCUT: &str = "ctrl+backslash";

#[cfg(target_os = "macos")]
const DEFAULT_AUDIO_SHORTCUT: &str = "cmd+shift+a";
#[cfg(not(target_os = "macos"))]
const DEFAULT_AUDIO_SHORTCUT: &str = "ctrl+shift+a";

#[cfg(target_os = "macos")]
const DEFAULT_SCREENSHOT_SHORTCUT: &str = "cmd+shift+s";
#[cfg(not(target_os = "macos"))]
const DEFAULT_SCREENSHOT_SHORTCUT: &str = "ctrl+shift+s";

#[cfg(target_os = "macos")]
const DEFAULT_SYSTEM_AUDIO_SHORTCUT: &str = "cmd+shift+m";
#[cfg(not(target_os = "macos"))]
const DEFAULT_SYSTEM_AUDIO_SHORTCUT: &str = "ctrl+shift+m";

/// Initialize global shortcuts for the application
pub fn setup_global_shortcuts<R: Runtime>(
    app: &AppHandle<R>,
) -> Result<(), Box<dyn std::error::Error>> {
    let toggle_shortcut = DEFAULT_TOGGLE_SHORTCUT.parse::<Shortcut>()?;
    let audio_shortcut = DEFAULT_AUDIO_SHORTCUT.parse::<Shortcut>()?;
    let screenshot_shortcut = DEFAULT_SCREENSHOT_SHORTCUT.parse::<Shortcut>()?;
    let system_audio_shortcut = DEFAULT_SYSTEM_AUDIO_SHORTCUT.parse::<Shortcut>()?;

    // Register global shortcuts
    app.global_shortcut()
        .on_shortcut(toggle_shortcut, move |app, _shortcut, event| {
            if event.state() == ShortcutState::Pressed {
                handle_toggle_window(&app);
            }
        })
        .map_err(|e| format!("Failed to register toggle shortcut: {}", e))?;

    let app_handle = app.clone();
    app.global_shortcut()
        .on_shortcut(audio_shortcut, move |_app, _shortcut, event| {
            if event.state() == ShortcutState::Pressed {
                handle_audio_shortcut(&app_handle);
            }
        })
        .map_err(|e| format!("Failed to register audio shortcut: {}", e))?;

    let app_handle = app.clone();
    app.global_shortcut()
        .on_shortcut(screenshot_shortcut, move |_app, _shortcut, event| {
            if event.state() == ShortcutState::Pressed {
                handle_screenshot_shortcut(&app_handle);
            }
        })
        .map_err(|e| format!("Failed to register screenshot shortcut: {}", e))?;

    let app_handle = app.clone();
    app.global_shortcut()
        .on_shortcut(system_audio_shortcut, move |_app, _shortcut, event| {
            if event.state() == ShortcutState::Pressed {
                handle_system_audio_shortcut(&app_handle);
            }
        })
        .map_err(|e| format!("Failed to register system audio shortcut: {}", e))?;

    // Register all shortcuts
    app.global_shortcut()
        .register(toggle_shortcut)
        .map_err(|e| format!("Failed to register toggle shortcut: {}", e))?;
    app.global_shortcut()
        .register(audio_shortcut)
        .map_err(|e| format!("Failed to register audio shortcut: {}", e))?;
    app.global_shortcut()
        .register(screenshot_shortcut)
        .map_err(|e| format!("Failed to register screenshot shortcut: {}", e))?;
    app.global_shortcut()
        .register(system_audio_shortcut)
        .map_err(|e| format!("Failed to register system audio shortcut: {}", e))?;

    Ok(())
}

/// Handle app toggle (hide/show) with input focus and app icon management
fn handle_toggle_window<R: Runtime>(app: &AppHandle<R>) {
    // Get the main window
    let Some(window) = app.get_webview_window("main") else {
        return;
    };

    #[cfg(target_os = "windows")]
    {
        let state = app.state::<WindowVisibility>();
        let mut is_hidden = state.is_hidden.lock().unwrap();
        *is_hidden = !*is_hidden;

        if let Err(e) = window.emit("toggle-window-visibility", *is_hidden) {
            eprintln!("Failed to emit toggle-window-visibility event: {}", e);
        }
        return;
    }

    #[cfg(not(target_os = "windows"))]
    match window.is_visible() {
        Ok(true) => {
            // Window is visible, hide it and handle app icon based on user settings
            if let Err(e) = window.hide() {
                eprintln!("Failed to hide window: {}", e);
            }
        }
        Ok(false) => {
            // Window is hidden, show it and handle app icon based on user settings
            if let Err(e) = window.show() {
                eprintln!("Failed to show window: {}", e);
            }

            if let Err(e) = window.set_focus() {
                eprintln!("Failed to focus window: {}", e);
            }

            // Emit event to focus text input
            if let Err(e) = window.emit("focus-text-input", json!({})) {
                eprintln!("Failed to emit focus event: {}", e);
            }
        }
        Err(e) => {
            eprintln!("Failed to check window visibility: {}", e);
        }
    }
}

/// Handle audio shortcut
fn handle_audio_shortcut<R: Runtime>(app: &AppHandle<R>) {
    if let Some(window) = app.get_webview_window("main") {
        // Ensure window is visible
        if let Ok(false) = window.is_visible() {
            if let Err(_e) = window.show() {
                return;
            }
            if let Err(e) = window.set_focus() {
                eprintln!("Failed to focus window: {}", e);
            }
        }

        // Emit event to start audio recording
        if let Err(e) = window.emit("start-audio-recording", json!({})) {
            eprintln!("Failed to emit audio recording event: {}", e);
        }
    }
}

/// Handle screenshot shortcut - mode will be determined by user settings in frontend
fn handle_screenshot_shortcut<R: Runtime>(app: &AppHandle<R>) {
    if let Some(window) = app.get_webview_window("main") {
        // Emit event to trigger screenshot - frontend will determine auto/manual mode
        if let Err(e) = window.emit("trigger-screenshot", json!({})) {
            eprintln!("Failed to emit screenshot event: {}", e);
        }
    }
}

/// Handle system audio shortcut
fn handle_system_audio_shortcut<R: Runtime>(app: &AppHandle<R>) {
    if let Some(window) = app.get_webview_window("main") {
        // Ensure window is visible
        if let Ok(false) = window.is_visible() {
            if let Err(e) = window.show() {
                eprintln!("Failed to show window: {}", e);
                return;
            }
            if let Err(e) = window.set_focus() {
                eprintln!("Failed to focus window: {}", e);
            }
        }

        // Emit event to toggle system audio capture - frontend will determine current state
        if let Err(e) = window.emit("toggle-system-audio", json!({})) {
            eprintln!("Failed to emit system audio event: {}", e);
        }
    }
}

/// Tauri command to get current shortcuts
#[tauri::command]
pub fn get_shortcuts() -> serde_json::Value {
    json!({
        "toggle": DEFAULT_TOGGLE_SHORTCUT,
        "audio": DEFAULT_AUDIO_SHORTCUT,
        "screenshot": DEFAULT_SCREENSHOT_SHORTCUT,
        "systemAudio": DEFAULT_SYSTEM_AUDIO_SHORTCUT
    })
}

/// Tauri command to check if shortcuts are registered
#[tauri::command]
pub fn check_shortcuts_registered<R: Runtime>(app: AppHandle<R>) -> Result<bool, String> {
    let shortcuts = [
        DEFAULT_TOGGLE_SHORTCUT,
        DEFAULT_AUDIO_SHORTCUT,
        DEFAULT_SCREENSHOT_SHORTCUT,
        DEFAULT_SYSTEM_AUDIO_SHORTCUT,
    ];

    for shortcut_str in shortcuts {
        if let Ok(shortcut) = shortcut_str.parse::<Shortcut>() {
            let registered = app.global_shortcut().is_registered(shortcut);
            if !registered {
                return Ok(false);
            }
        } else {
            return Err(format!("Failed to parse shortcut: {}", shortcut_str));
        }
    }

    Ok(true)
}
// Tauri command to set app icon visibility in dock/taskbar
#[tauri::command]
pub fn set_app_icon_visibility<R: Runtime>(app: AppHandle<R>, visible: bool) -> Result<(), String> {

    #[cfg(target_os = "macos")]
    {
        // On macOS, use activation policy to control dock icon
        let policy = if visible {
            tauri::ActivationPolicy::Regular
        } else {
            tauri::ActivationPolicy::Accessory
        };

        app.set_activation_policy(policy).map_err(|e| {
            eprintln!("Failed to set activation policy: {}", e);
            format!("Failed to set activation policy: {}", e)
        })?;
    }

    #[cfg(target_os = "windows")]
    {
        // On Windows, control taskbar icon visibility
        if let Some(window) = app.get_webview_window("main") {
            window.set_skip_taskbar(!visible).map_err(|e| {
                format!("Failed to set taskbar visibility: {}", e)
            })?;
        } else {
            eprintln!("Main window not found on Windows");
        }
    }

    #[cfg(target_os = "linux")]
    {
        // On Linux, control panel icon visibility
        if let Some(window) = app.get_webview_window("main") {
            window.set_skip_taskbar(!visible).map_err(|e| {
                format!("Failed to set panel visibility: {}", e)
            })?;
        } else {
            eprintln!("Main window not found on Linux");
        }
    }

    Ok(())
}

/// Tauri command to set always on top state
#[tauri::command]
pub fn set_always_on_top<R: Runtime>(app: AppHandle<R>, enabled: bool) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        window.set_always_on_top(enabled).map_err(|e| {
            format!("Failed to set always on top: {}", e)
        })?;

    } else {
        return Err("Main window not found".to_string());
    }

    Ok(())
}
