// Write the canvas snapshot (JSON) to the given path. Done in Rust so the app
// can save to any drive/location the user picks, without the fs-plugin scope
// restrictions that would otherwise make writes silently fail.
#[tauri::command]
fn save_canvas(path: String, contents: String) -> Result<(), String> {
    std::fs::write(&path, contents).map_err(|e| e.to_string())
}

// Read a previously saved canvas snapshot (JSON) back from disk.
#[tauri::command]
fn load_canvas(path: String) -> Result<String, String> {
    std::fs::read_to_string(&path).map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![save_canvas, load_canvas])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
