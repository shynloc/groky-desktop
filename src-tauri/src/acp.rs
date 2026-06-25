//! Agent Context Protocol (ACP) — session-aware agent communication layer.
//!
//! ACP wraps the grok CLI process with session lifecycle management,
//! context window tracking, and persistent session state.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use tokio::fs;

// ── ACP Message Types ────────────────────────────────────────────────────────

/// Messages sent from the backend to the frontend.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "data")]
pub enum AcpServerMessage {
    /// Agent started processing a prompt.
    SessionStarted { session_id: String },
    /// Streaming text chunk from the agent.
    TextDelta { text: String },
    /// Agent is thinking (internal reasoning).
    ThinkingDelta { text: String },
    /// Agent used a tool.
    ToolCall { id: String, tool: String, input: String, file_path: Option<String> },
    /// Tool call completed.
    ToolResult { id: String, output: String, status: String },
    /// Agent emitted a todo list.
    TodoUpdate { todos: Vec<AcpTodoItem> },
    /// Agent requests permission for a tool.
    PermissionRequest { request_id: String, tool: String, command: Option<String>, description: Option<String>, path: Option<String> },
    /// Session ended (agent finished).
    SessionEnded { session_id: String, token_usage: AcpTokenUsage },
    /// An error occurred.
    Error { message: String, recoverable: bool },
    /// Context window usage update.
    ContextUsage { used: usize, limit: usize },
}

/// Messages sent from the frontend to the backend.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "data")]
pub enum AcpClientMessage {
    /// Send a new prompt to the agent.
    Prompt { text: String },
    /// Respond to a permission request.
    PermissionResponse { request_id: String, action: AcpPermissionAction },
    /// Request context compaction.
    Compact,
    /// Cancel the current operation.
    Cancel,
    /// Resume a previous session.
    Resume { session_id: String },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AcpPermissionAction {
    Allow,
    AllowForSession,
    Deny,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AcpTodoItem {
    pub id: String,
    pub content: String,
    pub status: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AcpTokenUsage {
    pub input_tokens: usize,
    pub output_tokens: usize,
    pub total_tokens: usize,
}

// ── Session State ────────────────────────────────────────────────────────────

/// Persisted session state saved to disk.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AcpSession {
    pub id: String,
    pub project_path: String,
    pub model: Option<String>,
    pub created_at: String,
    pub last_active: String,
    pub message_count: usize,
    pub total_tokens: usize,
    pub context_limit: usize,
    pub title: Option<String>,
}

/// In-memory session context with conversation history.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AcpSessionContext {
    pub session: AcpSession,
    /// Grok CLI session ID (returned by the agent).
    pub grok_session_id: Option<String>,
    /// Permission allow-list for this session.
    pub allowed_tools: Vec<String>,
    /// Conversation summary (after compaction).
    pub summary: Option<String>,
}

// ── Session Store ────────────────────────────────────────────────────────────

const SESSIONS_DIR: &str = "groky-sessions";
const SESSION_FILE: &str = "session.json";

fn sessions_root() -> PathBuf {
    let home = std::env::var("HOME").unwrap_or_else(|_| ".".to_string());
    PathBuf::from(home).join(".groky").join(SESSIONS_DIR)
}

fn session_dir(session_id: &str) -> PathBuf {
    sessions_root().join(session_id)
}

/// Save a session to disk.
pub async fn save_session(ctx: &AcpSessionContext) -> Result<(), String> {
    let dir = session_dir(&ctx.session.id);
    fs::create_dir_all(&dir).await
        .map_err(|e| format!("Failed to create session dir: {}", e))?;

    let json = serde_json::to_string_pretty(ctx)
        .map_err(|e| format!("Failed to serialize session: {}", e))?;
    fs::write(dir.join(SESSION_FILE), json).await
        .map_err(|e| format!("Failed to write session: {}", e))?;
    Ok(())
}

/// Load a session from disk.
pub async fn load_session(session_id: &str) -> Result<AcpSessionContext, String> {
    let path = session_dir(session_id).join(SESSION_FILE);
    let json = fs::read_to_string(&path).await
        .map_err(|e| format!("Failed to read session {}: {}", session_id, e))?;
    serde_json::from_str(&json)
        .map_err(|e| format!("Failed to parse session {}: {}", session_id, e))
}

/// List all saved sessions (sorted by last_active descending).
pub async fn list_sessions() -> Result<Vec<AcpSession>, String> {
    let root = sessions_root();
    if !root.exists() {
        return Ok(vec![]);
    }

    let mut sessions = Vec::new();
    let mut entries = fs::read_dir(&root).await
        .map_err(|e| format!("Failed to read sessions dir: {}", e))?;

    while let Some(entry) = entries.next_entry().await
        .map_err(|e| format!("Failed to read entry: {}", e))? {
        let session_file = entry.path().join(SESSION_FILE);
        if session_file.exists() {
            if let Ok(json) = fs::read_to_string(&session_file).await {
                if let Ok(ctx) = serde_json::from_str::<AcpSessionContext>(&json) {
                    sessions.push(ctx.session);
                }
            }
        }
    }

    sessions.sort_by(|a, b| b.last_active.cmp(&a.last_active));
    Ok(sessions)
}

/// Delete a session from disk.
pub async fn delete_session(session_id: &str) -> Result<(), String> {
    let dir = session_dir(session_id);
    if dir.exists() {
        fs::remove_dir_all(&dir).await
            .map_err(|e| format!("Failed to delete session: {}", e))?;
    }
    Ok(())
}

/// Create a new session context.
pub fn create_session(project_path: &str, model: Option<&str>, context_limit: usize) -> AcpSessionContext {
    let id = format!("ses-{}", uuid_v4());
    let now = chrono_now();
    AcpSessionContext {
        session: AcpSession {
            id: id.clone(),
            project_path: project_path.to_string(),
            model: model.map(|s| s.to_string()),
            created_at: now.clone(),
            last_active: now,
            message_count: 0,
            total_tokens: 0,
            context_limit,
            title: None,
        },
        grok_session_id: None,
        allowed_tools: Vec::new(),
        summary: None,
    }
}

/// Update session after a prompt/response cycle.
pub fn update_session_stats(ctx: &mut AcpSessionContext, tokens_used: usize) {
    ctx.session.message_count += 1;
    ctx.session.total_tokens += tokens_used;
    ctx.session.last_active = chrono_now();

    // Auto-generate title from first user message count
    if ctx.session.title.is_none() && ctx.session.message_count >= 1 {
        ctx.session.title = Some(format!("Session {}", &ctx.session.id[4..12]));
    }
}

/// Check if context window needs compaction.
pub fn needs_compaction(ctx: &AcpSessionContext) -> bool {
    ctx.session.total_tokens > (ctx.session.context_limit as f64 * 0.75) as usize
}

// ── Helpers ──────────────────────────────────────────────────────────────────

fn uuid_v4() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let t = SystemTime::now().duration_since(UNIX_EPOCH).unwrap_or_default();
    format!("{:08x}-{:04x}-{:04x}", t.as_secs() as u32, t.subsec_millis() as u16, t.subsec_micros() as u16)
}

fn chrono_now() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let t = SystemTime::now().duration_since(UNIX_EPOCH).unwrap_or_default();
    format!("{}", t.as_secs())
}
