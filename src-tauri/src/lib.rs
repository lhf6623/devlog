// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::Manager;

const DATA_FILE_NAME: &str = "devlog_data.json";

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct AppData {
    pub records: Vec<Record>,
    pub categories: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Record {
    pub id: String,
    pub title: String,
    pub content: String,
    pub status: String,
    pub category: String,
    pub created_at: String,
    pub updated_at: String,
}

fn data_path(app_handle: &tauri::AppHandle) -> Result<PathBuf, String> {
    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?;
    Ok(app_data_dir.join(DATA_FILE_NAME))
}

fn load_app_data(path: &PathBuf) -> Result<AppData, String> {
    if !path.exists() {
        return Ok(AppData::default());
    }
    let content = fs::read_to_string(path).map_err(|e| format!("Failed to read data file: {}", e))?;
    if content.trim().is_empty() {
        return Ok(AppData::default());
    }
    serde_json::from_str(&content).map_err(|e| format!("Failed to parse data file: {}", e))
}

fn save_app_data(path: &PathBuf, data: &AppData) -> Result<(), String> {
    if let Some(parent) = path.parent() {
        if !parent.exists() {
            fs::create_dir_all(parent).map_err(|e| format!("Failed to create data dir: {}", e))?;
        }
    }
    let content = serde_json::to_string_pretty(data)
        .map_err(|e| format!("Failed to serialize data: {}", e))?;
    fs::write(path, content).map_err(|e| format!("Failed to write data file: {}", e))
}

#[tauri::command]
fn load_data(app_handle: tauri::AppHandle) -> Result<AppData, String> {
    let path = data_path(&app_handle)?;
    load_app_data(&path)
}

#[tauri::command]
fn save_record(record: Record, app_handle: tauri::AppHandle) -> Result<AppData, String> {
    let path = data_path(&app_handle)?;
    let mut data = load_app_data(&path)?;

    let category = record.category.clone();
    let pos = data.records.iter().position(|r| r.id == record.id);
    match pos {
        Some(idx) => {
            data.records[idx] = record;
        }
        None => {
            data.records.push(record);
        }
    }

    if !category.is_empty() && !data.categories.contains(&category) {
        data.categories.push(category);
        data.categories.sort_by(|a, b| a.to_lowercase().cmp(&b.to_lowercase()));
    }

    save_app_data(&path, &data)?;
    Ok(data)
}

#[tauri::command]
fn delete_record(id: String, app_handle: tauri::AppHandle) -> Result<AppData, String> {
    let path = data_path(&app_handle)?;
    let mut data = load_app_data(&path)?;
    data.records.retain(|r| r.id != id);
    save_app_data(&path, &data)?;
    Ok(data)
}

#[tauri::command]
fn add_category(name: String, app_handle: tauri::AppHandle) -> Result<AppData, String> {
    let path = data_path(&app_handle)?;
    let mut data = load_app_data(&path)?;
    let name = name.trim().to_string();
    if !name.is_empty() && !data.categories.contains(&name) {
        data.categories.push(name);
        data.categories.sort_by(|a, b| a.to_lowercase().cmp(&b.to_lowercase()));
    }
    save_app_data(&path, &data)?;
    Ok(data)
}

#[tauri::command]
fn delete_category(name: String, app_handle: tauri::AppHandle) -> Result<AppData, String> {
    let path = data_path(&app_handle)?;
    let mut data = load_app_data(&path)?;
    data.categories.retain(|c| c != &name);
    // Optionally clear category on records using this category
    for record in &mut data.records {
        if record.category == name {
            record.category = String::new();
        }
    }
    save_app_data(&path, &data)?;
    Ok(data)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            load_data,
            save_record,
            delete_record,
            add_category,
            delete_category
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
