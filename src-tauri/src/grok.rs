use serde::{Deserialize, Serialize};
use std::process::Stdio;
use tauri::Emitter;
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};
use tokio::process::Command as TokioCommand;

// ── Types ────────────────────────────────────────────────────────────────────

#[derive(Serialize, Deserialize, Clone)]
pub struct GrokEvent {
    #[serde(rename = "type")]
    pub event_type: String,
    pub data: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub session_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub raw_json: Option<serde_json::Value>,
}

#[derive(Serialize, Clone)]
pub struct FileEntry {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
}

#[derive(Serialize)]
pub struct InspectReport {
    pub stdout: String,
    pub stderr: String,
    pub status: Option<i32>,
}

/// Managed state holding the current grok child process and its stdin.
pub struct GrokState {
    pub current_child: tokio::sync::Mutex<Option<tokio::process::Child>>,
    pub current_stdin: tokio::sync::Mutex<Option<tokio::process::ChildStdin>>,
}

// ── Helpers ──────────────────────────────────────────────────────────────────

pub fn find_grok_binary() -> String {
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
pub fn log_dangerous_patterns(input: &str) {
    const DANGEROUS_PATTERNS: &[&str] = &[
        "$(", "`", "${",
    ];

    for pattern in DANGEROUS_PATTERNS {
        if input.contains(pattern) {
            eprintln!("[SECURITY] Potentially dangerous pattern '{}' found in prompt", pattern);
        }
    }
}

const TEXT_TYPES: &[&str] = &["text", "content", "thought", "end", "error"];

pub fn parse_grok_line(line: &str) -> GrokEvent {
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

/// Kill the current grok child process and clear stdin.
pub async fn kill_current_process(state: &GrokState) {
    let old_child = {
        let mut guard = state.current_child.lock().await;
        guard.take()
    };
    if let Some(mut child) = old_child {
        let _ = child.kill().await;
    }
    {
        let mut guard = state.current_stdin.lock().await;
        *guard = None;
    }
}

/// Write a line to grok's stdin.
pub async fn write_to_stdin(state: &GrokState, response: &str) -> Result<(), String> {
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

/// Spawn the grok process with the given arguments and emit events to the frontend.
pub async fn spawn_grok_process(
    app: tauri::AppHandle,
    state: &GrokState,
    prompt: &str,
    working_dir: &str,
    session_id: Option<&str>,
    model: Option<&str>,
    always_approve: bool,
    effort: Option<&str>,
    api_key: Option<&str>,
) -> Result<String, String> {
    let grok_bin = find_grok_binary();

    kill_current_process(state).await;

    let prompt = prompt;

    log_dangerous_patterns(prompt);

    let mut cmd = TokioCommand::new(&grok_bin);
    cmd.arg("-p")
        .arg(prompt)
        .arg("--output-format")
        .arg("streaming-json")
        .arg("--cwd")
        .arg(working_dir)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());

    if let Some(sid) = session_id {
        cmd.arg("--resume").arg(sid);
    }
    if let Some(m) = model {
        cmd.arg("--model").arg(m);
    }
    if always_approve {
        cmd.arg("--always-approve");
    }
    if let Some(e) = effort {
        cmd.arg("--effort").arg(e);
    }
    if let Some(key) = api_key {
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

    // Spawn stdout reader
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

    // Spawn stderr reader
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
