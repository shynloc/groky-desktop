import { create } from 'zustand';
import { Session } from '../types';
import { MAX_SESSIONS } from '../constants/config';
import { getSetting, setSetting } from '../services/secureStore';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function loadSessions(): Promise<Session[]> {
  return getSetting<Session[]>('sessions', []);
}

function saveSessions(sessions: Session[]): void {
  setSetting('sessions', sessions);
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
  initSessions: () => Promise<void>;
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
  sessions: [],
  removeSession: (id) =>
    set((s) => {
      const sessions = s.sessions.filter((ss) => ss.id !== id);
      saveSessions(sessions);
      return { sessions };
    }),
  addSession: (session) =>
    set((s) => {
      const sessions = [session, ...s.sessions.filter((ss) => ss.id !== session.id)].slice(0, MAX_SESSIONS);
      saveSessions(sessions);
      return { sessions };
    }),
  initSessions: async () => {
    const sessions = await loadSessions();
    set({ sessions });
  },
}));
