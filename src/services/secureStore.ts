import { Store } from '@tauri-apps/plugin-store';

const STORE_FILE = 'groky-secure.json';
const API_KEY_KEY = 'xai-api-key';
const SETTINGS_PREFIX = 'setting-';

// Detect Tauri at runtime
const IS_TAURI = typeof (window as any).__TAURI_INTERNALS__ !== 'undefined';

let store: Store | null = null;

async function getStore(): Promise<Store> {
  if (!store) {
    store = await Store.load(STORE_FILE);
  }
  return store;
}

// ── Generic setting helpers ────────────────────────────────────────────────

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  if (!IS_TAURI) {
    const raw = localStorage.getItem(SETTINGS_PREFIX + key);
    if (raw === null) return fallback;
    try { return JSON.parse(raw) as T; } catch { return fallback; }
  }
  try {
    const s = await getStore();
    const val = await s.get<T>(SETTINGS_PREFIX + key);
    return val ?? fallback;
  } catch {
    return fallback;
  }
}

export async function setSetting(key: string, value: unknown): Promise<void> {
  if (!IS_TAURI) {
    localStorage.setItem(SETTINGS_PREFIX + key, JSON.stringify(value));
    return;
  }
  try {
    const s = await getStore();
    await s.set(SETTINGS_PREFIX + key, value);
    await s.save();
  } catch (error) {
    console.error(`Failed to save setting ${key}:`, error);
  }
}

// ── API Key ────────────────────────────────────────────────────────────────

export async function getApiKey(): Promise<string> {
  try {
    const s = await getStore();
    const key = await s.get<string>(API_KEY_KEY);
    return key ?? '';
  } catch (error) {
    console.error('Failed to read API key from secure store:', error);
    return '';
  }
}

export async function setApiKey(key: string): Promise<void> {
  try {
    const s = await getStore();
    if (key) {
      await s.set(API_KEY_KEY, key);
    } else {
      await s.delete(API_KEY_KEY);
    }
    await s.save();
  } catch (error) {
    console.error('Failed to save API key to secure store:', error);
    throw error;
  }
}

export async function removeApiKey(): Promise<void> {
  try {
    const s = await getStore();
    await s.delete(API_KEY_KEY);
    await s.save();
  } catch (error) {
    console.error('Failed to remove API key from secure store:', error);
    throw error;
  }
}

export async function migrateFromLocalStorage(): Promise<void> {
  try {
    const oldKey = localStorage.getItem('groky-api-key');
    if (oldKey) {
      await setApiKey(oldKey);
      localStorage.removeItem('groky-api-key');
      console.info('Migrated API key from localStorage to secure store');
    }
    // Migrate other settings from localStorage
    const keys = ['groky-model', 'groky-language', 'groky-theme', 'groky-auth-mode'];
    for (const lsKey of keys) {
      const raw = localStorage.getItem(lsKey);
      if (raw !== null) {
        const settingKey = SETTINGS_PREFIX + lsKey.replace('groky-', '');
        const s = await getStore();
        const existing = await s.get(settingKey);
        if (existing === null || existing === undefined) {
          await s.set(settingKey, raw);
          await s.save();
        }
        localStorage.removeItem(lsKey);
      }
    }
  } catch (error) {
    console.error('Failed to migrate settings from localStorage:', error);
  }
}
