use tauri::Manager;

// Location of the auto-saved workspace inside the OS app-data directory.
fn workspace_path(app: &tauri::AppHandle) -> Result<std::path::PathBuf, String> {
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    Ok(dir.join("workspace.json"))
}

// Persist the whole workspace (tree + page contents) as JSON. Auto-called by
// the frontend on changes; the user never picks a file.
#[tauri::command]
fn save_workspace(app: tauri::AppHandle, contents: String) -> Result<(), String> {
    let path = workspace_path(&app)?;
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    std::fs::write(&path, contents).map_err(|e| e.to_string())
}

// Load the previously saved workspace, or None on first run.
#[tauri::command]
fn load_workspace(app: tauri::AppHandle) -> Result<Option<String>, String> {
    let path = workspace_path(&app)?;
    match std::fs::read_to_string(&path) {
        Ok(contents) => Ok(Some(contents)),
        Err(err) if err.kind() == std::io::ErrorKind::NotFound => Ok(None),
        Err(err) => Err(err.to_string()),
    }
}

// Read the text contents of a markdown file dropped onto the window so it can
// be embedded into a card. Intent is enforced here (not just in the renderer):
// only .md files, and a size cap, to keep this a least-privilege primitive.
const MAX_MARKDOWN_BYTES: u64 = 8 * 1024 * 1024; // 8 MB

#[tauri::command]
fn read_text_file(path: String) -> Result<String, String> {
    if !path.to_lowercase().ends_with(".md") {
        return Err("unsupported file type (only .md is allowed)".into());
    }
    let metadata = std::fs::metadata(&path).map_err(|e| e.to_string())?;
    if metadata.len() > MAX_MARKDOWN_BYTES {
        return Err("file is too large".into());
    }
    std::fs::read_to_string(&path).map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            save_workspace,
            load_workspace,
            read_text_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
