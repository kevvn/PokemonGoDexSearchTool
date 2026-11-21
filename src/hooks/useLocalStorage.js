import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Persistent state hook backed by localStorage.
 * Supports optional `schemaVersion` & `migrate(oldData, oldVersion)` for safe forward upgrades,
 * plus multi-tab synchronization via the `storage` event.
 */
function useLocalStorage(key, initialValue, options = {}) {
  const {
    serialize = JSON.stringify,
    deserialize = JSON.parse,
    schemaVersion = null,
    migrate = null,
  } = options;

  const serializeRef = useRef(serialize);
  const deserializeRef = useRef(deserialize);
  const migrateRef = useRef(migrate);

  useEffect(() => {
    serializeRef.current = serialize;
    deserializeRef.current = deserialize;
    migrateRef.current = migrate;
  }, [serialize, deserialize, migrate]);

  const parseRawValue = useCallback(
    (saved) => {
      if (schemaVersion !== null) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && parsed.__v === schemaVersion && 'data' in parsed) {
          return deserializeRef.current(JSON.stringify(parsed.data));
        }
        // Legacy unversioned or older version payload
        const oldVersion =
          parsed && typeof parsed === 'object' && typeof parsed.__v === 'number' ? parsed.__v : 0;
        const rawData =
          parsed && typeof parsed === 'object' && '__v' in parsed && 'data' in parsed
            ? parsed.data
            : parsed;
        if (typeof migrateRef.current === 'function') {
          return migrateRef.current(rawData, oldVersion);
        }
        return deserializeRef.current(JSON.stringify(rawData));
      }
      return deserializeRef.current(saved);
    },
    [schemaVersion]
  );

  const [value, setValue] = useState(() => {
    try {
      if (typeof localStorage === 'undefined') {
        return typeof initialValue === 'function' ? initialValue() : initialValue;
      }
      const saved = localStorage.getItem(key);
      if (saved !== null) {
        if (schemaVersion !== null) {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed === 'object' && parsed.__v === schemaVersion && 'data' in parsed) {
            return deserialize(JSON.stringify(parsed.data));
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
          return deserialize(JSON.stringify(rawData));
        }
        return deserialize(saved);
      }
      return typeof initialValue === 'function' ? initialValue() : initialValue;
    } catch (e) {
      console.error(`Failed to load ${key}:`, e);
      return typeof initialValue === 'function' ? initialValue() : initialValue;
    }
  });

  useEffect(() => {
    try {
      if (typeof localStorage === 'undefined') return;
      if (schemaVersion !== null) {
        const serializedData = JSON.parse(serializeRef.current(value));
        localStorage.setItem(key, JSON.stringify({ __v: schemaVersion, data: serializedData }));
      } else {
        localStorage.setItem(key, serializeRef.current(value));
      }
    } catch (e) {
      console.error(`Failed to save ${key}:`, e);
    }
  }, [key, value, schemaVersion]);

  // Multi-tab synchronization via storage event
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const handleStorageChange = (event) => {
      if (event.key === key && event.newValue !== null) {
        try {
          setValue(parseRawValue(event.newValue));
        } catch (e) {
          console.error(`Failed to sync storage change for ${key}:`, e);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key, parseRawValue]);

  const setStableValue = useCallback((newValue) => {
    setValue(newValue);
  }, []);

  return [value, setStableValue];
}

export default useLocalStorage;
