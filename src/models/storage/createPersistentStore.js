/**
 * Persistent external store backed by localStorage and safe for React 19 `useSyncExternalStore`.
 *
 * Guarantees:
 * - Cached snapshot references (`getSnapshot` and `getServerSnapshot` never allocate fresh objects)
 * - Schema-versioned envelope (`{ __v, data }`) + legacy key fallback & forward migration
 * - Synchronous localStorage persistence inside `setState` / `reset` (zero `useEffect`)
 * - Ref-counted `window` `'storage'` listener for multi-tab synchronization (including `localStorage.clear()`)
 * - Refresh on 0 -> 1 subscriber transitions if external storage changed while unsubscribed
 * - Surfacing write errors (`QuotaExceededError`, private browsing) via `getLastWriteError()` / `onStorageError`
 */

function resolveInitialDefault(getDefaultValue) {
  return typeof getDefaultValue === 'function' ? getDefaultValue() : getDefaultValue;
}

function getStorageSafe() {
  try {
    if (typeof window === 'undefined') return null;
    return globalThis.localStorage ?? window.localStorage ?? null;
  } catch {
    return null;
  }
}

export function createPersistentStore({
  key,
  legacyKeys = [],
  getDefaultValue,
  schemaVersion = null,
  serialize = JSON.stringify,
  deserialize = JSON.parse,
  migrate = null,
  onStorageError = null,
}) {
  const defaultSnapshot = resolveInitialDefault(getDefaultValue);
  const isDefaultSerialize = serialize === JSON.stringify;
  const isDefaultDeserialize = deserialize === JSON.parse;

  let lastWriteError = null;
  let lastKnownRaw = undefined;

  const parseRaw = (raw) => {
    if (schemaVersion !== null) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && parsed.__v === schemaVersion && 'data' in parsed) {
        return isDefaultDeserialize ? parsed.data : deserialize(JSON.stringify(parsed.data));
      }
      const oldVersion =
        parsed && typeof parsed === 'object' && typeof parsed.__v === 'number' ? parsed.__v : 0;
      const rawData =
        parsed && typeof parsed === 'object' && '__v' in parsed && 'data' in parsed
          ? parsed.data
          : parsed;
      if (typeof migrate === 'function') {
        return migrate(rawData, oldVersion);
      }
      return isDefaultDeserialize ? rawData : deserialize(JSON.stringify(rawData));
    }
    return deserialize(raw);
  };

  const readRawEntry = (storage) => {
    if (!storage) return { raw: null, fromLegacyKey: null };
    const primary = storage.getItem(key);
    if (primary !== null) {
      return { raw: primary, fromLegacyKey: null };
    }
    if (Array.isArray(legacyKeys)) {
      for (const legacyKey of legacyKeys) {
        const legacyVal = storage.getItem(legacyKey);
        if (legacyVal !== null) {
          return { raw: legacyVal, fromLegacyKey: legacyKey };
        }
      }
    }
    return { raw: null, fromLegacyKey: null };
  };

  const formatForStorage = (nextValue) => {
    if (schemaVersion !== null) {
      if (isDefaultSerialize) {
        return JSON.stringify({ __v: schemaVersion, data: nextValue });
      }
      const serializedData = JSON.parse(serialize(nextValue));
      return JSON.stringify({ __v: schemaVersion, data: serializedData });
    }
    return serialize(nextValue);
  };

  const writeToStorage = (nextValue) => {
    const storage = getStorageSafe();
    if (!storage) {
      lastWriteError = null;
      return { ok: true, error: null };
    }
    try {
      const encoded = formatForStorage(nextValue);
      storage.setItem(key, encoded);
      lastKnownRaw = encoded;
      lastWriteError = null;
      return { ok: true, error: null };
    } catch (error) {
      lastWriteError = error;
      console.error(`Failed to save "${key}" to localStorage:`, error);
      if (typeof onStorageError === 'function') {
        try {
          onStorageError(error, key);
        } catch {
          // Ignore callback errors
        }
      }
      return { ok: false, error };
    }
  };

  const readFromStorage = () => {
    const storage = getStorageSafe();
    if (!storage) {
      lastKnownRaw = null;
      return resolveInitialDefault(getDefaultValue);
    }

    try {
      const { raw, fromLegacyKey } = readRawEntry(storage);
      if (raw !== null) {
        const parsedValue = parseRaw(raw);
        if (fromLegacyKey !== null) {
          // Persist migrated legacy value forward under the primary key
          writeToStorage(parsedValue);
        } else {
          lastKnownRaw = raw;
        }
        return parsedValue;
      }
      lastKnownRaw = null;
    } catch (error) {
      console.error(`Failed to load "${key}" from localStorage:`, error);
      lastKnownRaw = null;
    }
    return resolveInitialDefault(getDefaultValue);
  };

  let currentValue = readFromStorage();
  const listeners = new Set();
  let storageHandler = null;

  const notify = () => {
    for (const listener of listeners) {
      listener();
    }
  };

  const attachStorageListener = () => {
    if (storageHandler || typeof window === 'undefined') return;
    storageHandler = (event) => {
      // event.key === null signals localStorage.clear()
      if (event.key !== null && event.key !== key) return;
      try {
        if (event.key === null || event.newValue === null) {
          lastKnownRaw = null;
          currentValue = resolveInitialDefault(getDefaultValue);
        } else {
          lastKnownRaw = event.newValue;
          currentValue = parseRaw(event.newValue);
        }
        notify();
      } catch (error) {
        console.error(`Failed to sync storage change for "${key}":`, error);
      }
    };
    window.addEventListener('storage', storageHandler);
  };

  const detachStorageListener = () => {
    if (!storageHandler || typeof window === 'undefined') return;
    window.removeEventListener('storage', storageHandler);
    storageHandler = null;
  };

  const getSnapshot = () => currentValue;

  const getServerSnapshot = () => defaultSnapshot;

  const getLastWriteError = () => lastWriteError;

  const setState = (updater) => {
    const nextValue = typeof updater === 'function' ? updater(currentValue) : updater;
    if (Object.is(nextValue, currentValue)) {
      return currentValue;
    }
    currentValue = nextValue;
    writeToStorage(currentValue);
    notify();
    return currentValue;
  };

  const reset = () => {
    const storage = getStorageSafe();
    if (storage) {
      try {
        storage.removeItem(key);
        if (Array.isArray(legacyKeys)) {
          for (const legacyKey of legacyKeys) {
            storage.removeItem(legacyKey);
          }
        }
      } catch (error) {
        console.error(`Failed to remove "${key}" from localStorage:`, error);
      }
    }
    lastKnownRaw = null;
    lastWriteError = null;
    currentValue = resolveInitialDefault(getDefaultValue);
    notify();
    return currentValue;
  };

  const reloadFromStorage = () => {
    currentValue = readFromStorage();
    notify();
    return currentValue;
  };

  const subscribe = (listener) => {
    if (listeners.size === 0) {
      // Refresh if storage changed externally while no subscribers were attached
      const storage = getStorageSafe();
      if (storage) {
        try {
          const { raw } = readRawEntry(storage);
          if (raw !== lastKnownRaw) {
            currentValue = readFromStorage();
          }
        } catch {
          // Ignore transient read error on subscribe
        }
      }
      attachStorageListener();
    }
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
      if (listeners.size === 0) {
        detachStorageListener();
      }
    };
  };

  return {
    key,
    getSnapshot,
    getServerSnapshot,
    getLastWriteError,
    setState,
    reset,
    reloadFromStorage,
    subscribe,
  };
}
