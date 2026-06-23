import { Store } from '@tauri-apps/plugin-store';

const STORE_FILE = 'groky-secure.json';
const API_KEY_KEY = 'xai-api-key';

let store: Store | null = null;

async function getStore(): Promise<Store> {
  if (!store) {
    store = await Store.load(STORE_FILE);
  }
  return store;
}

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
  } catch (error) {
    console.error('Failed to migrate API key:', error);
  }
}
