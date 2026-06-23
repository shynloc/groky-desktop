// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::sync::Mutex;
use tauri::Emitter;
use serde::{Deserialize, Serialize};
use std::process::Stdio;
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};
use tokio::process::Command as TokioCommand;

fn find_grok_binary() -> String {
    let home = std::env::var("HOME").unwrap_or_default();
    let candidates = vec![
        format!("{}/.grok/bin/grok", home),
        "/opt/homebrew/bin/grok".to_string(),
        "/usr/local/bin/grok".to_string(),
        format!("{}/.cargo/bin/grok", home),
    ];
    for c in &candidates {
        if std::path::Path::new(c).exists() {
            return c.clone();
        }
    }
    "grok".to_string()
}

#[derive(Serialize, Deserialize, Clone)]
struct GrokEvent {
    #[serde(rename = "type")]
    event_type: String,
    data: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    session_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    raw_json: Option<serde_json::Value>,
}

// ── Filesystem ───────────────────────────────────────────────────────────────

#[derive(Serialize, Clone)]
struct FileEntry {
    name: String,
    path: String,
    is_dir: bool,
}

#[derive(Serialize)]
struct InspectReport {
    stdout: String,
    stderr: String,
    status: Option<i32>,
}

#[tauri::command]
fn list_directory(path: String) -> Result<Vec<FileEntry>, String> {
    let read = std::fs::read_dir(&path).map_err(|e| e.to_string())?;

    const SKIP: &[&str] = &[
        "node_modules", "target", "dist", ".git", ".next",
        "build", "__pycache__", ".venv",
    ];

    let mut entries: Vec<FileEntry> = read
        .filter_map(|res| res.ok())
        .filter_map(|e| {
            let name = e.file_name().to_string_lossy().to_string();
            if name.starts_with('.') || SKIP.contains(&name.as_str()) {
                return None;
            }
            let is_dir = e.file_type().map(|t| t.is_dir()).unwrap_or(false);
            let path = e.path().to_string_lossy().to_string();
            Some(FileEntry { name, path, is_dir })
        })
        .collect();

    entries.sort_by(|a, b| match (a.is_dir, b.is_dir) {
        (true, false) => std::cmp::Ordering::Less,
        (false, true) => std::cmp::Ordering::Greater,
        _ => a.name.cmp(&b.name),
    });

    Ok(entries)
}

/// Run `grok models` and return the list of model IDs.
#[tauri::command]
async fn get_grok_models(api_key: Option<String>) -> Result<Vec<String>, String> {
    let grok_bin = find_grok_binary();
    let mut cmd = TokioCommand::new(&grok_bin);
    cmd.arg("models")
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());
    if let Some(ref key) = api_key {
        cmd.env("XAI_API_KEY", key);
    }
    let output = cmd.output().await
        .map_err(|e| format!("Failed to run grok models: {}", e))?;
    let stdout = String::from_utf8_lossy(&output.stdout).to_string();

    // Parse lines like "  - grok-build" or "  * grok-composer-2.5-fast (default)"
    let models: Vec<String> = stdout
        .lines()
        .filter_map(|line| {
            let t = line.trim();
            if t.starts_with("- ") || t.starts_with("* ") {
                t[2..].split_whitespace().next().map(|s| s.to_string())
            } else {
                None
            }
        })
        .collect();

    if models.is_empty() {
        Err(stdout)
    } else {
        Ok(models)
    }
}

/// Read a file's content, capped at 100 KB.
#[tauri::command]
async fn read_file_content(path: String) -> Result<String, String> {
    const MAX_BYTES: usize = 100_000;
    let bytes = tokio::fs::read(&path).await.map_err(|e| e.to_string())?;
    let truncated = &bytes[..bytes.len().min(MAX_BYTES)];
    Ok(String::from_utf8_lossy(truncated).to_string())
}

#[tauri::command]
async fn inspect_grok(cwd: Option<String>) -> Result<InspectReport, String> {
    let grok_bin = find_grok_binary();
    let working_dir = cwd.unwrap_or_else(|| ".".to_string());
    let output = TokioCommand::new(&grok_bin)
        .arg("inspect")
        .current_dir(&working_dir)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .output()
        .await
        .map_err(|e| format!("Failed to run grok inspect ({}): {}", grok_bin, e))?;

    Ok(InspectReport {
        stdout: String::from_utf8_lossy(&output.stdout).to_string(),
        stderr: String::from_utf8_lossy(&output.stderr).to_string(),
        status: output.status.code(),
    })
}

const TEXT_TYPES: &[&str] = &["text", "content", "thought", "end", "error"];

fn parse_grok_line(line: &str) -> GrokEvent {
    if let Ok(parsed) = serde_json::from_str::<serde_json::Value>(line) {
        let typ = parsed
            .get("type")
            .and_then(|v| v.as_str())
            .unwrap_or("text")
            .to_string();

        let data = parsed
            .get("data")
            .or_else(|| parsed.get("text"))
            .or_else(|| parsed.get("message"))
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string();

        let session_id = parsed
            .get("sessionId")
            .or_else(|| parsed.get("session_id"))
            .and_then(|v| v.as_str())
            .map(|s| s.to_string());

        let raw_json = if TEXT_TYPES.contains(&typ.as_str()) {
            None
        } else {
            Some(parsed)
        };

        GrokEvent { event_type: typ, data, session_id, raw_json }
    } else {
        GrokEvent {
            event_type: "text".to_string(),
            data: line.to_string(),
            session_id: None,
            raw_json: None,
        }
    }
}

/// Managed state holding the current grok child process and its stdin.
struct GrokState {
    current_child: Mutex<Option<tokio::process::Child>>,
    // tokio mutex so we can hold it across write_all().await
    current_stdin: tokio::sync::Mutex<Option<tokio::process::ChildStdin>>,
}

/// Write a response line to grok's stdin (used by the ApprovalModal).
#[tauri::command]
async fn reply_to_grok(
    state: tauri::State<'_, GrokState>,
    response: String,
) -> Result<(), String> {
    let mut guard = state.current_stdin.lock().await;
    if let Some(ref mut stdin) = *guard {
        let line = format!("{}\n", response.trim());
        stdin.write_all(line.as_bytes()).await.map_err(|e| e.to_string())?;
        stdin.flush().await.map_err(|e| e.to_string())?;
        Ok(())
    } else {
        Err("No active grok process stdin".to_string())
    }
}

#[tauri::command]
async fn send_grok_prompt(
    app: tauri::AppHandle,
    state: tauri::State<'_, GrokState>,
    prompt: String,
    cwd: Option<String>,
    session_id: Option<String>,
    model: Option<String>,
    always_approve: Option<bool>,
    plan_mode: Option<bool>,
    effort: Option<String>,
    api_key: Option<String>,
) -> Result<String, String> {
    let working_dir = cwd.unwrap_or_else(|| ".".to_string());
    let grok_bin = find_grok_binary();

    // Kill previous child (take outside mutex to avoid holding across await)
    let old_child = {
        let mut guard = state.current_child.lock().map_err(|e| e.to_string())?;
        guard.take()
    };
    if let Some(mut child) = old_child {
        let _ = child.kill().await;
    }

    // Drop old stdin
    {
        let mut guard = state.current_stdin.lock().await;
        *guard = None;
    }

    let prompt = if plan_mode.unwrap_or(false) {
        format!(
            "Plan mode is active. First sketch the approach and avoid file edits unless the user explicitly asks to proceed.\n\n{}",
            prompt
        )
    } else {
        prompt
    };

    let mut cmd = TokioCommand::new(&grok_bin);
    cmd.arg("-p")
        .arg(&prompt)
        .arg("--output-format")
        .arg("streaming-json")
        .arg("--cwd")
        .arg(&working_dir)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());

    if let Some(ref sid) = session_id {
        cmd.arg("--resume").arg(sid);
    }
    if let Some(ref m) = model {
        cmd.arg("--model").arg(m);
    }
    if always_approve.unwrap_or(false) {
        cmd.arg("--always-approve");
    }
    if let Some(ref e) = effort {
        cmd.arg("--effort").arg(e);
    }
    if let Some(ref key) = api_key {
        if !key.is_empty() {
            cmd.env("XAI_API_KEY", key);
        }
    }

    let mut child = cmd.spawn().map_err(|e| {
        format!(
            "Failed to spawn grok ({}): {}. Make sure Grok CLI is installed (~/.grok/bin).",
            grok_bin, e
        )
    })?;

    let stdin  = child.stdin.take().ok_or("No stdin")?;
    let stdout = child.stdout.take().ok_or("No stdout")?;
    let stderr = child.stderr.take().ok_or("No stderr")?;

    {
        let mut guard = state.current_child.lock().map_err(|e| e.to_string())?;
        *guard = Some(child);
    }
    {
        let mut guard = state.current_stdin.lock().await;
        *guard = Some(stdin);
    }

    let app_h = app.clone();
    tauri::async_runtime::spawn(async move {
        let mut reader = BufReader::new(stdout).lines();
        let mut saw_end = false;
        while let Ok(Some(line)) = reader.next_line().await {
            if line.trim().is_empty() {
                continue;
            }
            let event = parse_grok_line(&line);
            if event.event_type == "end" {
                saw_end = true;
            }
            let _ = app_h.emit("grok-event", &event);
        }
        if !saw_end {
            let _ = app_h.emit("grok-event", GrokEvent {
                event_type: "end".to_string(),
                data: String::new(),
                session_id: None,
                raw_json: None,
            });
        }
    });

    tauri::async_runtime::spawn(async move {
        let mut reader = BufReader::new(stderr).lines();
        while let Ok(Some(line)) = reader.next_line().await {
            if line.trim().is_empty() {
                continue;
            }
            eprintln!("[grok stderr] {}", line);
        }
    });

    Ok("streaming".to_string())
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(GrokState {
            current_child: Mutex::new(None),
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
            send_grok_prompt,
            list_directory,
            inspect_grok,
            reply_to_grok,
            read_file_content,
            get_grok_models,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
