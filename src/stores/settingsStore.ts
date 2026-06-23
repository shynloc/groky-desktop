import { create } from 'zustand';
import { GrokModelId, EffortLevel, AuthMode } from '../constants';
import { Language } from '../i18n';
import { setApiKey as saveApiKey } from '../services/secureStore';

// ---------------------------------------------------------------------------
// Store shape
// ---------------------------------------------------------------------------

export interface SettingsStore {
  // Model
  model: GrokModelId;
  setModel: (m: GrokModelId) => void;

  // Effort
  effort: EffortLevel | null;
  setEffort: (e: EffortLevel | null) => void;

  // Plan mode
  planMode: boolean;
  togglePlanMode: () => void;

  // Always approve
  alwaysApproveEnabled: boolean;
  toggleAlwaysApprove: () => void;

  // Language
  language: Language;
  setLanguage: (l: Language) => void;

  // Theme
  theme: 'dark' | 'light';
  setTheme: (t: 'dark' | 'light') => void;

  // Auth
  authMode: AuthMode;
  setAuthMode: (m: AuthMode) => void;

  // API Key
  apiKey: string;
  setApiKey: (k: string) => Promise<void>;

  // Dynamic models
  dynamicModels: { id: string; label: string }[];
  setDynamicModels: (models: { id: string; label: string }[]) => void;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useSettingsStore = create<SettingsStore>((set) => ({
  // ── Model ────────────────────────────────────────────────────────────────
  model: (localStorage.getItem('groky-model') ?? 'grok-build'),
  setModel: (m) => { localStorage.setItem('groky-model', m); set({ model: m }); },

  // ── Effort ───────────────────────────────────────────────────────────────
  effort: null,
  setEffort: (e) => set({ effort: e }),

  // ── Plan mode ────────────────────────────────────────────────────────────
  planMode: false,
  togglePlanMode: () => set((s) => ({ planMode: !s.planMode })),

  // ── Always approve ───────────────────────────────────────────────────────
  alwaysApproveEnabled: false,
  toggleAlwaysApprove: () => set((s) => ({ alwaysApproveEnabled: !s.alwaysApproveEnabled })),

  // ── Language ─────────────────────────────────────────────────────────────
  language: (localStorage.getItem('groky-language') as Language | null) ?? 'zh',
  setLanguage: (l) => {
    localStorage.setItem('groky-language', l);
    set({ language: l });
  },

  // ── Theme ────────────────────────────────────────────────────────────────
  theme: (localStorage.getItem('groky-theme') as 'dark' | 'light' | null) ?? 'dark',
  setTheme: (t) => {
    localStorage.setItem('groky-theme', t);
    set({ theme: t });
  },

  // ── Auth ─────────────────────────────────────────────────────────────────
  authMode: (localStorage.getItem('groky-auth-mode') as AuthMode | null) ?? 'subscription',
  setAuthMode: (m) => { localStorage.setItem('groky-auth-mode', m); set({ authMode: m }); },

  // ── API Key ──────────────────────────────────────────────────────────────
  apiKey: '', // Will be loaded asynchronously
  setApiKey: async (k) => {
    try {
      await saveApiKey(k);
      set({ apiKey: k });
    } catch (error) {
      console.error('Failed to save API key:', error);
      // Fallback to localStorage in case of error
      localStorage.setItem('groky-api-key', k);
      set({ apiKey: k });
    }
  },

  // ── Dynamic models ───────────────────────────────────────────────────────
  dynamicModels: [],
  setDynamicModels: (models) => set({ dynamicModels: models }),
}));
