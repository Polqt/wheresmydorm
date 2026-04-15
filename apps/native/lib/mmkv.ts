import * as FileSystem from "expo-file-system";

type StorageLike = {
  getString: (key: string) => string | undefined;
  remove: (key: string) => void;
  set: (key: string, value: string) => void;
};

type FallbackStorageState = Record<string, string>;

const FALLBACK_STORAGE_FILE = new FileSystem.File(
  FileSystem.Paths.document,
  "wmd-storage.json",
);

let fallbackStorageCache: FallbackStorageState | null = null;

function createMmkvStorage(): StorageLike | null {
  try {
    // Lazy require prevents Expo/dev clients from crashing when the native
    // MMKV module hasn't been rebuilt into the app yet.
    const { createMMKV } = require("react-native-mmkv") as {
      createMMKV: (options: { id: string }) => StorageLike;
    };

    return createMMKV({ id: "wheresmydorm" });
  } catch {
    return null;
  }
}

async function readFallbackStorage() {
  if (fallbackStorageCache) {
    return fallbackStorageCache;
  }

  try {
    const raw = await FALLBACK_STORAGE_FILE.text();
    fallbackStorageCache = JSON.parse(raw) as FallbackStorageState;
  } catch {
    fallbackStorageCache = {};
  }

  return fallbackStorageCache;
}

async function writeFallbackStorage(storage: FallbackStorageState) {
  fallbackStorageCache = storage;
  try {
    FALLBACK_STORAGE_FILE.create({ intermediates: true, overwrite: true });
  } catch {
    // The file already exists; overwrite below.
  }
  FALLBACK_STORAGE_FILE.write(JSON.stringify(storage));
}

export const mmkv = createMmkvStorage();

function normalizeStorageKey(key: string) {
  return key.replace(/[^A-Za-z0-9._-]/g, "_");
}

export const asyncStorageAdapter = {
  async getItem(key: string) {
    const normalizedKey = normalizeStorageKey(key);

    if (mmkv) {
      return mmkv.getString(normalizedKey) ?? null;
    }

    const storage = await readFallbackStorage();
    return storage[normalizedKey] ?? null;
  },
  async removeItem(key: string) {
    const normalizedKey = normalizeStorageKey(key);

    if (mmkv) {
      mmkv.remove(normalizedKey);
      return;
    }

    const storage = await readFallbackStorage();

    if (!(normalizedKey in storage)) {
      return;
    }

    const nextStorage = { ...storage };
    delete nextStorage[normalizedKey];
    await writeFallbackStorage(nextStorage);
  },
  async setItem(key: string, value: string) {
    const normalizedKey = normalizeStorageKey(key);

    if (mmkv) {
      mmkv.set(normalizedKey, value);
      return;
    }

    const storage = await readFallbackStorage();
    await writeFallbackStorage({
      ...storage,
      [normalizedKey]: value,
    });
  },
};
