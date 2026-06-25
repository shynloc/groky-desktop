import { Store } from '@tauri-apps/plugin-store';
import { invoke } from '@tauri-apps/api/core';

const STORE_FILE = 'groky-secure.json';
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

// ── API Key (Keychain) ─────────────────────────────────────────────────────

export async function getApiKey(): Promise<string> {
  if (!IS_TAURI) {
    return localStorage.getItem('groky-api-key') ?? '';
  }
  try {
    return await invoke<string>('keychain_get_api_key');
  } catch (error) {
    console.error('Failed to read API key from keychain:', error);
    // Fallback: try reading from legacy store
    try {
      const s = await getStore();
      const key = await s.get<string>('xai-api-key');
      return key ?? '';
    } catch {
      return '';
    }
  }
}

export async function setApiKey(key: string): Promise<void> {
  if (!IS_TAURI) {
    if (key) {
      localStorage.setItem('groky-api-key', key);
    } else {
      localStorage.removeItem('groky-api-key');
    }
    return;
  }
  try {
    if (key) {
      await invoke('keychain_set_api_key', { key });
    } else {
      await invoke('keychain_delete_api_key');
    }
    // Also clean up legacy store entry if present
    try {
      const s = await getStore();
      await s.delete('xai-api-key');
      await s.save();
    } catch { /* ignore */ }
  } catch (error) {
    console.error('Failed to save API key to keychain:', error);
    throw error;
  }
}

export async function removeApiKey(): Promise<void> {
  if (!IS_TAURI) {
    localStorage.removeItem('groky-api-key');
    return;
  }
  try {
    await invoke('keychain_delete_api_key');
  } catch (error) {
    console.error('Failed to remove API key from keychain:', error);
    throw error;
  }
}

export async function migrateFromLocalStorage(): Promise<void> {
  try {
    // Migrate API key from localStorage to keychain
    const oldKey = localStorage.getItem('groky-api-key');
    if (oldKey) {
      await setApiKey(oldKey);
      localStorage.removeItem('groky-api-key');
      console.info('Migrated API key from localStorage to keychain');
    }
    // Migrate API key from legacy plugin-store to keychain
    if (IS_TAURI) {
      try {
        const s = await getStore();
        const legacyKey = await s.get<string>('xai-api-key');
        if (legacyKey) {
          await invoke('keychain_set_api_key', { key: legacyKey });
          await s.delete('xai-api-key');
          await s.save();
          console.info('Migrated API key from plugin-store to keychain');
        }
      } catch { /* ignore */ }
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
