use serde::{Deserialize, Serialize};
use std::env;
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};
use uuid::Uuid;

// Helper function to load environment variables
fn load_env_vars() {
    let _ = dotenv::dotenv();
}

fn get_payment_endpoint() -> Result<String, String> {
    load_env_vars();
    
    env::var("PAYMENT_ENDPOINT")
        .map_err(|_| "PAYMENT_ENDPOINT environment variable not set. Please create a .env file in the project root with PAYMENT_ENDPOINT=your_api_endpoint".to_string())
}

fn get_api_access_key() -> Result<String, String> {
    load_env_vars();
    
    env::var("API_ACCESS_KEY")
        .map_err(|_| "API_ACCESS_KEY environment variable not set. Please add API_ACCESS_KEY=your_access_key to your .env file".to_string())
}

// Secure storage functions using Tauri's app data directory
fn get_secure_storage_path(app: &AppHandle) -> Result<PathBuf, String> {
    let app_data_dir = app.path().app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {}", e))?;
    
    // Create the directory if it doesn't exist
    fs::create_dir_all(&app_data_dir)
        .map_err(|e| format!("Failed to create app data directory: {}", e))?;
    
    Ok(app_data_dir.join("secure_storage.json"))
}

#[derive(Debug, Serialize, Deserialize, Default)]
struct SecureStorage {
    license_key: Option<String>,
    instance_id: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct StorageItem {
    key: String,
    value: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct StorageResult {
    license_key: Option<String>,
    instance_id: Option<String>,
}

#[tauri::command]
pub async fn secure_storage_save(app: AppHandle, items: Vec<StorageItem>) -> Result<(), String> {
    let storage_path = get_secure_storage_path(&app)?;
    
    let mut storage = if storage_path.exists() {
        let content = fs::read_to_string(&storage_path)
            .map_err(|e| format!("Failed to read storage file: {}", e))?;
        serde_json::from_str(&content).unwrap_or_default()
    } else {
        SecureStorage::default()
    };
    
    for item in items {
        match item.key.as_str() {
            "pluely_license_key" => storage.license_key = Some(item.value),
            "pluely_instance_id" => storage.instance_id = Some(item.value),
            _ => return Err(format!("Invalid storage key: {}", item.key)),
        }
    }
    
    let content = serde_json::to_string(&storage)
        .map_err(|e| format!("Failed to serialize storage: {}", e))?;
    
    fs::write(&storage_path, content)
        .map_err(|e| format!("Failed to write storage file: {}", e))?;
    
    Ok(())
}

#[tauri::command]
pub async fn secure_storage_get(app: AppHandle) -> Result<StorageResult, String> {
    let storage_path = get_secure_storage_path(&app)?;
    
    if !storage_path.exists() {
        return Ok(StorageResult {
            license_key: None,
            instance_id: None,
        });
    }
    
    let content = fs::read_to_string(&storage_path)
        .map_err(|e| format!("Failed to read storage file: {}", e))?;
    
    let storage: SecureStorage = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse storage file: {}", e))?;
    
    Ok(StorageResult {
        license_key: storage.license_key,
        instance_id: storage.instance_id,
    })
}

#[tauri::command]
pub async fn secure_storage_remove(app: AppHandle, keys: Vec<String>) -> Result<(), String> {
    let storage_path = get_secure_storage_path(&app)?;
    
    if !storage_path.exists() {
        return Ok(()); // Nothing to remove
    }
    
    let content = fs::read_to_string(&storage_path)
        .map_err(|e| format!("Failed to read storage file: {}", e))?;
    
    let mut storage: SecureStorage = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse storage file: {}", e))?;
    
    for key in keys {
        match key.as_str() {
            "pluely_license_key" => storage.license_key = None,
            "pluely_instance_id" => storage.instance_id = None,
            _ => return Err(format!("Invalid storage key: {}", key)),
        }
    }
    
    let content = serde_json::to_string(&storage)
        .map_err(|e| format!("Failed to serialize storage: {}", e))?;
    
    fs::write(&storage_path, content)
        .map_err(|e| format!("Failed to write storage file: {}", e))?;
    
    Ok(())
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ActivationRequest {
    license_key: String,
    instance_name: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ActivationResponse {
    activated: bool,
    error: Option<String>,
    license_key: Option<String>,
    instance: Option<InstanceInfo>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct InstanceInfo {
    id: String,
    name: String,
    created_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CheckoutResponse {
    success: Option<bool>,
    checkout_url: Option<String>,
    error: Option<String>,
}

#[tauri::command]
pub async fn activate_license_api(license_key: String) -> Result<ActivationResponse, String> {
    // Get payment endpoint and API access key from environment
    let payment_endpoint = get_payment_endpoint()?;
    let api_access_key = get_api_access_key()?;
    
    // Generate UUID for instance name
    let instance_name = Uuid::new_v4().to_string();
    
    // Prepare activation request
    let activation_request = ActivationRequest {
        license_key: license_key.clone(),
        instance_name: instance_name.clone(),
    };
    
    // Make HTTP request to activation endpoint with authorization header
    let client = reqwest::Client::new();
    let url = format!("{}/activate", payment_endpoint);
    
    let response = client
        .post(&url)
        .header("Content-Type", "application/json")
        .header("Authorization", format!("Bearer {}", api_access_key))
        .json(&activation_request)
        .send()
        .await
        .map_err(|e| format!("Failed to make activation request: {}", e))?;
    
    let activation_response: ActivationResponse = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse activation response: {}", e))?;
    
    Ok(activation_response)
}

#[tauri::command]
pub fn mask_license_key_cmd(license_key: String) -> String {
    if license_key.len() <= 8 {
        return "*".repeat(license_key.len());
    }
    
    let first_four = &license_key[..4];
    let last_four = &license_key[license_key.len()-4..];
    let middle_stars = "*".repeat(license_key.len() - 8);
    
    format!("{}{}{}", first_four, middle_stars, last_four)
}

#[tauri::command]
pub async fn get_checkout_url() -> Result<CheckoutResponse, String> {
    // Get payment endpoint and API access key from environment
    let payment_endpoint = get_payment_endpoint()?;
    let api_access_key = get_api_access_key()?;
    
    // Make HTTP request to checkout endpoint with authorization header
    let client = reqwest::Client::new();
    let url = format!("{}/checkout", payment_endpoint);
    
    let response = client
        .post(&url)
        .header("Content-Type", "application/json")
        .header("Authorization", format!("Bearer {}", api_access_key))
        .json(&serde_json::json!({}))
        .send()
        .await
        .map_err(|e| format!("Failed to make checkout request: {}", e))?;
    
    let checkout_response: CheckoutResponse = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse checkout response: {}", e))?;
    
    Ok(checkout_response)
}