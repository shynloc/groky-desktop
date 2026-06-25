// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

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

/// Sanitize user input — log dangerous patterns for debugging.
/// Note: Tokio Command does not use a shell, so these patterns cannot cause
/// injection. This function only aids observability.
fn log_dangerous_patterns(input: &str) {
    const DANGEROUS_PATTERNS: &[&str] = &[
        "$(", "`", "${",
    ];

    for pattern in DANGEROUS_PATTERNS {
        if input.contains(pattern) {
            eprintln!("[SECURITY] Potentially dangerous pattern '{}' found in prompt", pattern);
        }
    }
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
fn list_directory(path: String, project_path: Option<String>) -> Result<Vec<FileEntry>, String> {
    // Security: restrict to project directory if provided
    if let Some(ref project) = project_path {
        let dir_canonical = std::fs::canonicalize(&path)
            .map_err(|e| format!("Invalid path: {}", e))?;
        let project_canonical = std::fs::canonicalize(project)
            .map_err(|e| format!("Invalid project path: {}", e))?;
        if !dir_canonical.starts_with(&project_canonical) {
            return Err("Access denied: path is outside project directory".to_string());
        }
    }

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
async fn read_file_content(path: String, project_path: Option<String>) -> Result<String, String> {
    const MAX_BYTES: usize = 100_000;
    
    // Security: Validate path is within project directory
    if let Some(ref project) = project_path {
        let project_canonical = std::fs::canonicalize(project)
            .map_err(|e| format!("Invalid project path: {}", e))?;
        let file_canonical = std::fs::canonicalize(&path)
            .map_err(|e| format!("Invalid file path: {}", e))?;
        
        if !file_canonical.starts_with(&project_canonical) {
            return Err("Access denied: file is outside project directory".to_string());
        }
    }
    
    // Security: Block access to sensitive files (exact filename matching)
    const SENSITIVE_DIRS: &[&str] = &[".ssh", ".gnupg", ".aws"];
    const SENSITIVE_FILENAMES: &[&str] = &[
        "id_rsa", "id_ed25519", "id_ecdsa",
        ".env", ".env.local", ".env.production",
    ];

    let path_obj = std::path::Path::new(&path);
    let filename = path_obj.file_name().unwrap_or_default().to_string_lossy();
    let is_sensitive = path_obj.components().any(|c| {
        SENSITIVE_DIRS.contains(&c.as_os_str().to_string_lossy().as_ref())
    }) || SENSITIVE_FILENAMES.iter().any(|&pat| filename == pat);

    if is_sensitive {
        return Err("Access denied: sensitive file detected".to_string());
    }
    
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

/// Apply a search_replace diff to a file on disk.
#[tauri::command]
async fn apply_diff(
    file_path: String,
    old_str: String,
    new_str: String,
    project_path: String,
) -> Result<String, String> {
    // Security: validate file is within project
    let project_canonical = std::fs::canonicalize(&project_path)
        .map_err(|e| format!("Invalid project path: {}", e))?;
    let abs_path = if std::path::Path::new(&file_path).is_absolute() {
        file_path.clone()
    } else {
        format!("{}/{}", project_path, file_path)
    };
    let file_canonical = std::fs::canonicalize(&abs_path)
        .map_err(|e| format!("Invalid file path: {}", e))?;
    if !file_canonical.starts_with(&project_canonical) {
        return Err("Access denied: file is outside project directory".to_string());
    }

    let content = tokio::fs::read_to_string(&abs_path)
        .await
        .map_err(|e| format!("Failed to read file: {}", e))?;

    if !content.contains(&old_str) {
        return Err("Old string not found in file — the file may have changed".to_string());
    }

    let new_content = content.replacen(&old_str, &new_str, 1);
    tokio::fs::write(&abs_path, &new_content)
        .await
        .map_err(|e| format!("Failed to write file: {}", e))?;

    Ok(format!("Applied diff to {}", abs_path))
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
    // Use tokio::sync::Mutex for both to avoid blocking across .await
    current_child: tokio::sync::Mutex<Option<tokio::process::Child>>,
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
        let mut guard = state.current_child.lock().await;
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
    
    log_dangerous_patterns(&prompt);

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
        let mut guard = state.current_child.lock().await;
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
        send_grok_prompt,
        list_directory,
        inspect_grok,
        reply_to_grok,
        read_file_content,
        get_grok_models,
        apply_diff,
    ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
