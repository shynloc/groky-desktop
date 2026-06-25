// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod grok;
mod commands;

use grok::GrokState;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .manage(GrokState {
            current_child: tokio::sync::Mutex::new(None),
            current_stdin: tokio::sync::Mutex::new(None),
        })
        .setup(|app| {
            #[cfg(debug_assertions)]
            {
                use tauri::Manager;
                if let Some(window) = app.get_webview_window("main") {
                    window.open_devtools();
                }
            }
            #[cfg(not(debug_assertions))]
            let _ = app;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::send_grok_prompt,
            commands::list_directory,
            commands::inspect_grok,
            commands::reply_to_grok,
            commands::read_file_content,
            commands::get_grok_models,
            commands::apply_diff,
            commands::get_git_status,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
