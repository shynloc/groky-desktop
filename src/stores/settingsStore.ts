import { create } from 'zustand';
import { GrokModelId, EffortLevel, AuthMode } from '../constants';
import { Language } from '../i18n';
import { setApiKey as saveApiKey, setSetting, getSetting } from '../services/secureStore';

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

  // Init (load persisted settings)
  initSettings: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useSettingsStore = create<SettingsStore>((set) => ({
  // ── Model ────────────────────────────────────────────────────────────────
  model: 'grok-build',
  setModel: (m) => { setSetting('model', m); set({ model: m }); },

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
  language: 'zh',
  setLanguage: (l) => { setSetting('language', l); set({ language: l }); },

  // ── Theme ────────────────────────────────────────────────────────────────
  theme: 'dark',
  setTheme: (t) => { setSetting('theme', t); set({ theme: t }); },

  // ── Auth ─────────────────────────────────────────────────────────────────
  authMode: 'subscription',
  setAuthMode: (m) => { setSetting('auth-mode', m); set({ authMode: m }); },

  // ── API Key ──────────────────────────────────────────────────────────────
  apiKey: '',
  setApiKey: async (k) => {
    try {
      await saveApiKey(k);
      set({ apiKey: k });
    } catch (error) {
      console.error('Failed to save API key:', error);
      set({ apiKey: k });
    }
  },

  // ── Dynamic models ───────────────────────────────────────────────────────
  dynamicModels: [],
  setDynamicModels: (models) => set({ dynamicModels: models }),

  // ── Init ─────────────────────────────────────────────────────────────────
  initSettings: async () => {
    const [model, language, theme, authMode] = await Promise.all([
      getSetting<string>('model', 'grok-build'),
      getSetting<string>('language', 'zh'),
      getSetting<string>('theme', 'dark'),
      getSetting<string>('auth-mode', 'subscription'),
    ]);
    set({
      model: model as GrokModelId,
      language: language as Language,
      theme: theme as 'dark' | 'light',
      authMode: authMode as AuthMode,
    });
  },
}));
