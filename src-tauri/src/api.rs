use serde::{Deserialize, Serialize};
use std::env;
use tauri::{AppHandle, Manager, Emitter};
use futures_util::StreamExt;
use std::fs;
use std::path::PathBuf;

// Helper function to load environment variables
fn load_env_vars() {
    let _ = dotenv::dotenv();
}

fn get_app_endpoint() -> Result<String, String> {
    load_env_vars();
    
    env::var("APP_ENDPOINT")
        .map_err(|_| "APP_ENDPOINT environment variable not set. Please add APP_ENDPOINT=your_app_endpoint to your .env file".to_string())
}

fn get_api_access_key() -> Result<String, String> {
    load_env_vars();
    
    env::var("API_ACCESS_KEY")
        .map_err(|_| "API_ACCESS_KEY environment variable not set. Please add API_ACCESS_KEY=your_access_key to your .env file".to_string())
}

// Secure storage functions
fn get_secure_storage_path(app: &AppHandle) -> Result<PathBuf, String> {
    let app_data_dir = app.path().app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {}", e))?;
    
    fs::create_dir_all(&app_data_dir)
        .map_err(|e| format!("Failed to create app data directory: {}", e))?;
    
    Ok(app_data_dir.join("secure_storage.json"))
}

#[derive(Debug, Serialize, Deserialize, Default)]
struct SecureStorage {
    license_key: Option<String>,
    instance_id: Option<String>,
}

async fn get_stored_credentials(app: &AppHandle) -> Result<(String, String), String> {
    let storage_path = get_secure_storage_path(app)?;
    
    if !storage_path.exists() {
        return Err("No license found. Please activate your license first.".to_string());
    }
    
    let content = fs::read_to_string(&storage_path)
        .map_err(|e| format!("Failed to read storage file: {}", e))?;
    
    let storage: SecureStorage = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse storage file: {}", e))?;
    
    let license_key = storage.license_key.ok_or("License key not found".to_string())?;
    let instance_id = storage.instance_id.ok_or("Instance ID not found".to_string())?;
    
    Ok((license_key, instance_id))
}

// Audio API Structs
#[derive(Debug, Serialize, Deserialize)]
pub struct AudioRequest {
    audio_base64: String,  
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AudioResponse {
    success: bool,
    transcription: Option<String>,
    error: Option<String>,
}

// Chat API Structs
#[derive(Debug, Serialize, Deserialize)]
pub struct ChatRequest {
    user_message: String,
    system_prompt: Option<String>,
    image_base64: Option<serde_json::Value>, // Can be string or array
    history: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ChatResponse {
    success: bool,
    message: Option<String>,
    error: Option<String>,
}


// Audio API Command
#[tauri::command]
pub async fn transcribe_audio(
    app: AppHandle,
    audio_base64: String,
) -> Result<AudioResponse, String> {
    // Get environment variables
    let app_endpoint = get_app_endpoint()?;
    let api_access_key = get_api_access_key()?;
    
    // Get stored credentials
    let (license_key, instance_id) = get_stored_credentials(&app).await?;
    
    // Prepare audio request
    let audio_request = AudioRequest {
        audio_base64,
     
    };
    
    // Make HTTP request to audio endpoint
    let client = reqwest::Client::new();
    let url = format!("{}/api/audio", app_endpoint);
    
    let response = client
        .post(&url)
        .header("Content-Type", "application/json")
        .header("Authorization", format!("Bearer {}", api_access_key))
        .header("license_key", &license_key)
        .header("instance", &instance_id)
        .json(&audio_request)
        .send()
        .await
        .map_err(|e| format!("Failed to make audio request: {}", e))?;
    
    let audio_response: AudioResponse = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse audio response: {}", e))?;
    
    Ok(audio_response)
}

// Chat API Command with Streaming
#[tauri::command]
pub async fn chat_stream(
    app: AppHandle,
    user_message: String,
    system_prompt: Option<String>,
    image_base64: Option<serde_json::Value>,
    history: Option<String>,
) -> Result<String, String> {
    // Get environment variables
    let app_endpoint = get_app_endpoint()?;
    let api_access_key = get_api_access_key()?;
    
    // Get stored credentials
    let (license_key, instance_id) = get_stored_credentials(&app).await?;
    
    // Prepare chat request
    let chat_request = ChatRequest {
        user_message,
        system_prompt,
        image_base64,
        history,
    };
    
    // Make HTTP request to chat endpoint with streaming
    let client = reqwest::Client::new();
    let url = format!("{}/api/chat?stream=true", app_endpoint);
    
    let response = client
        .post(&url)
        .header("Content-Type", "application/json")
        .header("Authorization", format!("Bearer {}", api_access_key))
        .header("license_key", &license_key)
        .header("instance", &instance_id)
        .json(&chat_request)
        .send()
        .await
        .map_err(|e| format!("Failed to make chat request: {}", e))?;
    
    // Check if the response is successful
    if !response.status().is_success() {
        let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
        return Err(format!("Chat API error: {}", error_text));
    }
    
    // Handle streaming response
    let mut stream = response.bytes_stream();
    let mut full_response = String::new();
    let mut buffer = String::new();
    
    while let Some(chunk) = stream.next().await {
        match chunk {
            Ok(bytes) => {
                let chunk_str = String::from_utf8_lossy(&bytes);
                buffer.push_str(&chunk_str);
                
                // Process complete lines
                let lines: Vec<&str> = buffer.split('\n').collect();
                let incomplete_line = lines.last().unwrap_or(&"").to_string();
                
                for line in &lines[..lines.len()-1] { // Process all but the last (potentially incomplete) line
                    let trimmed_line = line.trim();
                    
                    if trimmed_line.starts_with("data: ") {
                        let json_str = trimmed_line.strip_prefix("data: ").unwrap_or("");
                        
                        if json_str == "[DONE]" {
                            break;
                        }
                        
                        if !json_str.is_empty() {
                            // Try to parse the JSON and extract content
                            if let Ok(parsed) = serde_json::from_str::<serde_json::Value>(json_str) {
                                if let Some(choices) = parsed.get("choices").and_then(|c| c.as_array()) {
                                    if let Some(first_choice) = choices.first() {
                                        if let Some(delta) = first_choice.get("delta") {
                                            if let Some(content) = delta.get("content").and_then(|c| c.as_str()) {
                                                full_response.push_str(content);
                                                // Emit just the content to frontend
                                                let _ = app.emit("chat_stream_chunk", content);
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                
                // Update buffer with incomplete line
                buffer = incomplete_line;
            }
            Err(e) => {
                return Err(format!("Stream error: {}", e));
            }
        }
    }
    
    // Emit completion event
    let _ = app.emit("chat_stream_complete", &full_response);
    
    Ok(full_response)
}

// Helper command to check if license is available
#[tauri::command]
pub async fn check_license_status(app: AppHandle) -> Result<bool, String> {
    match get_stored_credentials(&app).await {
        Ok(_) => Ok(true),
        Err(_) => Ok(false),
    }
}
