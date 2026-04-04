use crate::crypto::{decrypt, encrypt, get_encryption_key};
use anyhow::{anyhow, Result};
use keyring::{Entry, Error as KeyringError};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

// Types for API key storage
#[derive(Serialize, Deserialize)]
pub struct EncryptedData {
    encrypted: String,
}

// Types for conversations
#[derive(Serialize, Deserialize, Clone)]
pub struct Message {
    pub role: String,
    pub content: String,
    pub timestamp: i64,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct Conversation {
    pub id: String,
    pub title: String,
    pub messages: Vec<Message>,
    pub created_at: i64,
    pub updated_at: i64,
}

/// Get the conversations directory path
fn get_conversations_dir(app: &AppHandle) -> Result<PathBuf> {
    let app_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| anyhow!("Failed to get app data dir: {}", e))?;

    let conversations_dir = app_dir.join("conversations");
    fs::create_dir_all(&conversations_dir)
        .map_err(|e| anyhow!("Failed to create conversations dir: {}", e))?;

    Ok(conversations_dir)
}

/// Save API key encrypted in platform-specific secure storage
#[tauri::command]
pub async fn save_api_key(api_key: String) -> Result<(), String> {
    let key = get_encryption_key();
    let encrypted = encrypt(&api_key, &key).map_err(|e| e.to_string())?;

    // Use keyring for secure storage (Keychain on Mac, Credential Manager on Windows)
    let entry = Entry::new("ai-gui-app", "api_key")
        .map_err(|e| format!("Failed to create keyring entry: {}", e))?;

    entry
        .set_password(&encrypted)
        .map_err(|e| format!("Failed to save API key: {}", e))?;

    log::info!("API key saved successfully");
    Ok(())
}

/// Get the saved API key
#[tauri::command]
pub async fn get_api_key() -> Result<Option<String>, String> {
    let entry = Entry::new("ai-gui-app", "api_key")
        .map_err(|e| format!("Failed to create keyring entry: {}", e))?;

    let encrypted = match entry.get_password() {
        Ok(password) => password,
        Err(KeyringError::NoEntry) => return Ok(None),
        Err(e) => return Err(format!("Failed to get API key: {}", e)),
    };

    let key = get_encryption_key();
    let decrypted = decrypt(&encrypted, &key).map_err(|e| e.to_string())?;

    Ok(Some(decrypted))
}

/// Delete the saved API key
#[tauri::command]
pub async fn delete_api_key() -> Result<(), String> {
    let entry = Entry::new("ai-gui-app", "api_key")
        .map_err(|e| format!("Failed to create keyring entry: {}", e))?;

    entry
        .delete_credential()
        .map_err(|e| format!("Failed to delete API key: {}", e))?;

    log::info!("API key deleted successfully");
    Ok(())
}

/// Save a conversation to disk
#[tauri::command]
pub async fn save_conversation(app: AppHandle, conversation: Conversation) -> Result<(), String> {
    let conversations_dir = get_conversations_dir(&app).map_err(|e| e.to_string())?;
    let file_path = conversations_dir.join(format!("{}.json", conversation.id));

    let json = serde_json::to_string_pretty(&conversation)
        .map_err(|e| format!("Failed to serialize conversation: {}", e))?;

    fs::write(file_path, json)
        .map_err(|e| format!("Failed to write conversation: {}", e))?;

    log::info!("Conversation {} saved successfully", conversation.id);
    Ok(())
}

/// Get all conversations
#[tauri::command]
pub async fn get_conversations(app: AppHandle) -> Result<Vec<Conversation>, String> {
    let conversations_dir = get_conversations_dir(&app).map_err(|e| e.to_string())?;

    let mut conversations = Vec::new();

    let entries = fs::read_dir(conversations_dir)
        .map_err(|e| format!("Failed to read conversations directory: {}", e))?;

    for entry in entries {
        let entry = entry.map_err(|e| format!("Failed to read directory entry: {}", e))?;
        let path = entry.path();

        if path.extension().and_then(|s| s.to_str()) != Some("json") {
            continue;
        }

        let json = fs::read_to_string(&path)
            .map_err(|e| format!("Failed to read conversation file: {}", e))?;

        let conversation: Conversation = serde_json::from_str(&json)
            .map_err(|e| format!("Failed to parse conversation: {}", e))?;

        conversations.push(conversation);
    }

    // Sort by updated_at descending
    conversations.sort_by(|a, b| b.updated_at.cmp(&a.updated_at));

    Ok(conversations)
}

/// Delete a conversation
#[tauri::command]
pub async fn delete_conversation(app: AppHandle, id: String) -> Result<(), String> {
    let conversations_dir = get_conversations_dir(&app).map_err(|e| e.to_string())?;
    let file_path = conversations_dir.join(format!("{}.json", id));

    fs::remove_file(file_path)
        .map_err(|e| format!("Failed to delete conversation: {}", e))?;

    log::info!("Conversation {} deleted successfully", id);
    Ok(())
}

/// Delete all conversations
#[tauri::command]
pub async fn clear_all_conversations(app: AppHandle) -> Result<(), String> {
    let conversations_dir = get_conversations_dir(&app).map_err(|e| e.to_string())?;

    let entries = fs::read_dir(&conversations_dir)
        .map_err(|e| format!("Failed to read conversations directory: {}", e))?;

    for entry in entries {
        let entry = entry.map_err(|e| format!("Failed to read directory entry: {}", e))?;
        let path = entry.path();

        if path.extension().and_then(|s| s.to_str()) == Some("json") {
            fs::remove_file(&path)
                .map_err(|e| format!("Failed to delete conversation file: {}", e))?;
        }
    }

    log::info!("All conversations cleared");
    Ok(())
}
