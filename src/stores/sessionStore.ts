import { create } from 'zustand';
import { Session } from '../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function loadSessions(): Session[] {
  try {
    const stored = localStorage.getItem('groky-sessions');
    return stored ? (JSON.parse(stored) as Session[]) : [];
  } catch {
    return [];
  }
}

function saveSessions(sessions: Session[]): void {
  try {
    localStorage.setItem('groky-sessions', JSON.stringify(sessions));
  } catch {
    // ignore quota errors
  }
}

// ---------------------------------------------------------------------------
// Store shape
// ---------------------------------------------------------------------------

export interface SessionStore {
  // Project
  projectPath: string | null;
  setProjectPath: (path: string | null) => void;

  // Session
  currentSessionId: string | null;
  setSessionId: (id: string | null) => void;

  // Session history
  sessions: Session[];
  removeSession: (id: string) => void;
  addSession: (session: Session) => void;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useSessionStore = create<SessionStore>((set) => ({
  // ── Project ──────────────────────────────────────────────────────────────
  projectPath: null,
  setProjectPath: (path) => set({ projectPath: path }),

  // ── Session ──────────────────────────────────────────────────────────────
  currentSessionId: null,
  setSessionId: (id) => set({ currentSessionId: id }),

  // ── Session history ───────────────────────────────────────────────────────
  sessions: loadSessions(),
  removeSession: (id) =>
    set((s) => {
      const sessions = s.sessions.filter((ss) => ss.id !== id);
      saveSessions(sessions);
      return { sessions };
    }),
  addSession: (session) =>
    set((s) => {
      const sessions = [session, ...s.sessions.filter((ss) => ss.id !== session.id)].slice(0, 20);
      saveSessions(sessions);
      return { sessions };
    }),
}));
