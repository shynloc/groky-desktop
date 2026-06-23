// Known models for subscription mode (grok.com login)
export const SUBSCRIPTION_MODELS = [
  { id: 'grok-build',             label: 'Grok Build',           context: '256k', badge: 'coding' },
  { id: 'grok-composer-2.5-fast', label: 'Grok Composer Fast',   context: '1M',   badge: 'best'   },
] as const;

// Known models for xAI API key mode
export const API_MODELS = [
  { id: 'grok-3',              label: 'Grok 3',           context: '131k', badge: 'best'   },
  { id: 'grok-3-fast',         label: 'Grok 3 Fast',      context: '131k', badge: null     },
  { id: 'grok-3-mini',         label: 'Grok 3 Mini',      context: '131k', badge: 'reason' },
  { id: 'grok-3-mini-fast',    label: 'Grok 3 Mini Fast', context: '131k', badge: null     },
  { id: 'grok-2-1212',         label: 'Grok 2',           context: '131k', badge: null     },
] as const;

// All known models combined (used as fallback before dynamic detection)
export const GROK_MODELS = [...SUBSCRIPTION_MODELS, ...API_MODELS] as const;

// GrokModelId is string to allow dynamic models from `grok models`
export type GrokModelId = string;

export const EFFORT_LEVELS = ['low', 'medium', 'high', 'xhigh', 'max'] as const;
export type EffortLevel = (typeof EFFORT_LEVELS)[number];

export type AuthMode = 'subscription' | 'apikey';
