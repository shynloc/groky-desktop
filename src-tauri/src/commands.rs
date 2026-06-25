use crate::grok::{self, FileEntry, GrokState, InspectReport};
use crate::acp;
use tokio::process::Command as TokioCommand;

// ── Filesystem Commands ──────────────────────────────────────────────────────

#[tauri::command]
pub fn list_directory(path: String, project_path: Option<String>) -> Result<Vec<FileEntry>, String> {
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

/// Read a file's content, capped at 100 KB.
#[tauri::command]
pub async fn read_file_content(path: String, project_path: Option<String>) -> Result<String, String> {
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

/// Apply a search_replace diff to a file on disk.
#[tauri::command]
pub async fn apply_diff(
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

/// Get git status for files in a project directory.
/// Returns a map of file path -> status char (M, A, D, ??, etc.)
#[tauri::command]
pub async fn get_git_status(project_path: String) -> Result<Vec<(String, String)>, String> {
    let output = TokioCommand::new("git")
        .args(["status", "--porcelain", "-z"])
        .current_dir(&project_path)
        .output()
        .await
        .map_err(|e| format!("Failed to run git status: {}", e))?;

    if !output.status.success() {
        return Ok(vec![]);
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let mut result = Vec::new();

    // git status -z outputs: "XY filename\0" entries
    for entry in stdout.split('\0') {
        if entry.len() < 4 {
            continue;
        }
        let status = entry[..2].trim().to_string();
        let path = entry[3..].trim().to_string();
        if !status.is_empty() && !path.is_empty() {
            result.push((path, status));
        }
    }

    Ok(result)
}

// ── Keychain Commands ───────────────────────────────────────────────────────

const KEYCHAIN_SERVICE: &str = "groky-desktop";
const KEYCHAIN_USER: &str = "xai-api-key";

/// Store API key in the system keychain (macOS Keychain / Windows Credential Manager / Linux Secret Service).
#[tauri::command]
pub fn keychain_set_api_key(key: String) -> Result<(), String> {
    let entry = keyring::Entry::new(KEYCHAIN_SERVICE, KEYCHAIN_USER)
        .map_err(|e| format!("Keychain entry error: {}", e))?;
    entry.set_password(&key)
        .map_err(|e| format!("Failed to store key in keychain: {}", e))?;
    Ok(())
}

/// Read API key from the system keychain.
#[tauri::command]
pub fn keychain_get_api_key() -> Result<String, String> {
    let entry = keyring::Entry::new(KEYCHAIN_SERVICE, KEYCHAIN_USER)
        .map_err(|e| format!("Keychain entry error: {}", e))?;
    match entry.get_password() {
        Ok(key) => Ok(key),
        Err(keyring::Error::NoEntry) => Ok(String::new()),
        Err(e) => Err(format!("Failed to read key from keychain: {}", e)),
    }
}

/// Delete API key from the system keychain.
#[tauri::command]
pub fn keychain_delete_api_key() -> Result<(), String> {
    let entry = keyring::Entry::new(KEYCHAIN_SERVICE, KEYCHAIN_USER)
        .map_err(|e| format!("Keychain entry error: {}", e))?;
    match entry.delete_credential() {
        Ok(()) => Ok(()),
        Err(keyring::Error::NoEntry) => Ok(()),
        Err(e) => Err(format!("Failed to delete key from keychain: {}", e)),
    }
}

// ── Grok CLI Commands ────────────────────────────────────────────────────────

/// Run `grok models` and return the list of model IDs.
#[tauri::command]
pub async fn get_grok_models(api_key: Option<String>) -> Result<Vec<String>, String> {
    let grok_bin = grok::find_grok_binary();
    let mut cmd = TokioCommand::new(&grok_bin);
    cmd.arg("models")
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped());
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

#[tauri::command]
pub async fn inspect_grok(cwd: Option<String>) -> Result<InspectReport, String> {
    let grok_bin = grok::find_grok_binary();
    let working_dir = cwd.unwrap_or_else(|| ".".to_string());
    let output = TokioCommand::new(&grok_bin)
        .arg("inspect")
        .current_dir(&working_dir)
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped())
        .output()
        .await
        .map_err(|e| format!("Failed to run grok inspect ({}): {}", grok_bin, e))?;

    Ok(InspectReport {
        stdout: String::from_utf8_lossy(&output.stdout).to_string(),
        stderr: String::from_utf8_lossy(&output.stderr).to_string(),
        status: output.status.code(),
    })
}

/// Write a response line to grok's stdin (used by the ApprovalModal).
#[tauri::command]
pub async fn reply_to_grok(
    state: tauri::State<'_, GrokState>,
    response: String,
) -> Result<(), String> {
    grok::write_to_stdin(&state, &response).await
}

#[tauri::command]
pub async fn send_grok_prompt(
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

    let prompt = if plan_mode.unwrap_or(false) {
        format!(
            "Plan mode is active. First sketch the approach and avoid file edits unless the user explicitly asks to proceed.\n\n{}",
            prompt
        )
    } else {
        prompt
    };

    grok::spawn_grok_process(
        app,
        &state,
        &prompt,
        &working_dir,
        session_id.as_deref(),
        model.as_deref(),
        always_approve.unwrap_or(false),
        effort.as_deref(),
        api_key.as_deref(),
    ).await
}

// ── ACP Session Commands ─────────────────────────────────────────────────────

/// Create a new ACP session.
#[tauri::command]
pub async fn acp_create_session(
    project_path: String,
    model: Option<String>,
) -> Result<acp::AcpSessionContext, String> {
    let ctx = acp::create_session(&project_path, model.as_deref(), 256_000);
    acp::save_session(&ctx).await?;
    Ok(ctx)
}

/// Resume an existing ACP session.
#[tauri::command]
pub async fn acp_resume_session(session_id: String) -> Result<acp::AcpSessionContext, String> {
    acp::load_session(&session_id).await
}

/// List all saved ACP sessions.
#[tauri::command]
pub async fn acp_list_sessions() -> Result<Vec<acp::AcpSession>, String> {
    acp::list_sessions().await
}

/// Delete an ACP session.
#[tauri::command]
pub async fn acp_delete_session(session_id: String) -> Result<(), String> {
    acp::delete_session(&session_id).await
}

/// Update session stats after a response cycle.
#[tauri::command]
pub async fn acp_update_session(
    session_id: String,
    tokens_used: usize,
    grok_session_id: Option<String>,
) -> Result<acp::AcpSessionContext, String> {
    let mut ctx = acp::load_session(&session_id).await?;
    acp::update_session_stats(&mut ctx, tokens_used);
    if let Some(sid) = grok_session_id {
        ctx.grok_session_id = Some(sid);
    }
    acp::save_session(&ctx).await?;
    Ok(ctx)
}

/// Check if a session needs context compaction.
#[tauri::command]
pub async fn acp_needs_compaction(session_id: String) -> Result<bool, String> {
    let ctx = acp::load_session(&session_id).await?;
    Ok(acp::needs_compaction(&ctx))
}

/// Add a tool to the session allow-list.
#[tauri::command]
pub async fn acp_allow_tool(session_id: String, tool: String) -> Result<(), String> {
    let mut ctx = acp::load_session(&session_id).await?;
    if !ctx.allowed_tools.contains(&tool) {
        ctx.allowed_tools.push(tool);
    }
    acp::save_session(&ctx).await?;
    Ok(())
}

/// Get the saved grok session ID for resuming.
#[tauri::command]
pub async fn acp_get_grok_session_id(session_id: String) -> Result<Option<String>, String> {
    let ctx = acp::load_session(&session_id).await?;
    Ok(ctx.grok_session_id)
}
