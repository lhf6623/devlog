use std::fs;
use std::path::PathBuf;

fn get_data_path() -> PathBuf {
    let mut path = dirs::data_dir().expect("failed to get data dir");
    path.push("devlog");
    fs::create_dir_all(&path).expect("failed to create data dir");
    path.push("data.json");
    path
}

#[tauri::command]
fn load_data() -> String {
    let path = get_data_path();
    if path.exists() {
        fs::read_to_string(path).unwrap_or_else(|_| "[]".to_string())
    } else {
        "[]".to_string()
    }
}

#[tauri::command]
fn save_data(data: String) -> Result<(), String> {
    let path = get_data_path();
    fs::write(path, data).map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![load_data, save_data])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
