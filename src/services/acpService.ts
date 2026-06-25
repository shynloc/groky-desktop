/**
 * Agent Context Protocol (ACP) — frontend service layer.
 *
 * Provides session lifecycle management, context tracking,
 * and persistent session state via Tauri commands.
 */

import { invoke } from '@tauri-apps/api/core';

const IS_TAURI = typeof (window as any).__TAURI_INTERNALS__ !== 'undefined';

// ── Types ────────────────────────────────────────────────────────────────────

export interface AcpSession {
  id: string;
  project_path: string;
  model: string | null;
  created_at: string;
  last_active: string;
  message_count: number;
  total_tokens: number;
  context_limit: number;
  title: string | null;
}

export interface AcpSessionContext {
  session: AcpSession;
  grok_session_id: string | null;
  allowed_tools: string[];
  summary: string | null;
}

// ── Service ──────────────────────────────────────────────────────────────────

export const acpService = {
  /**
   * Create a new ACP session.
   */
  async createSession(projectPath: string, model?: string): Promise<AcpSessionContext | null> {
    if (!IS_TAURI) return null;
    try {
      return await invoke<AcpSessionContext>('acp_create_session', {
        projectPath,
        model: model ?? null,
      });
    } catch (err) {
      console.error('ACP create session failed:', err);
      return null;
    }
  },

  /**
   * Resume an existing ACP session.
   */
  async resumeSession(sessionId: string): Promise<AcpSessionContext | null> {
    if (!IS_TAURI) return null;
    try {
      return await invoke<AcpSessionContext>('acp_resume_session', { sessionId });
    } catch (err) {
      console.error('ACP resume session failed:', err);
      return null;
    }
  },

  /**
   * List all saved sessions (sorted by last_active descending).
   */
  async listSessions(): Promise<AcpSession[]> {
    if (!IS_TAURI) return [];
    try {
      return await invoke<AcpSession[]>('acp_list_sessions');
    } catch (err) {
      console.error('ACP list sessions failed:', err);
      return [];
    }
  },

  /**
   * Delete a session.
   */
  async deleteSession(sessionId: string): Promise<void> {
    if (!IS_TAURI) return;
    try {
      await invoke('acp_delete_session', { sessionId });
    } catch (err) {
      console.error('ACP delete session failed:', err);
    }
  },

  /**
   * Update session stats after a response cycle.
   */
  async updateSession(
    sessionId: string,
    tokensUsed: number,
    grokSessionId?: string,
  ): Promise<AcpSessionContext | null> {
    if (!IS_TAURI) return null;
    try {
      return await invoke<AcpSessionContext>('acp_update_session', {
        sessionId,
        tokensUsed,
        grokSessionId: grokSessionId ?? null,
      });
    } catch (err) {
      console.error('ACP update session failed:', err);
      return null;
    }
  },

  /**
   * Check if a session needs context compaction (>75% usage).
   */
  async needsCompaction(sessionId: string): Promise<boolean> {
    if (!IS_TAURI) return false;
    try {
      return await invoke<boolean>('acp_needs_compaction', { sessionId });
    } catch {
      return false;
    }
  },

  /**
   * Add a tool to the session allow-list.
   */
  async allowTool(sessionId: string, tool: string): Promise<void> {
    if (!IS_TAURI) return;
    try {
      await invoke('acp_allow_tool', { sessionId, tool });
    } catch (err) {
      console.error('ACP allow tool failed:', err);
    }
  },

  /**
   * Get the grok session ID for resuming.
   */
  async getGrokSessionId(sessionId: string): Promise<string | null> {
    if (!IS_TAURI) return null;
    try {
      return await invoke<string | null>('acp_get_grok_session_id', { sessionId });
    } catch {
      return null;
    }
  },
};
