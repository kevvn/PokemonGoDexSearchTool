import { useState, useEffect, useCallback, useRef } from 'react';

function useLocalStorage(key, initialValue, options = {}) {
  const {
    serialize = JSON.stringify,
    deserialize = JSON.parse,
  } = options;

  const serializeRef = useRef(serialize);
  const deserializeRef = useRef(deserialize);

  useEffect(() => {
    serializeRef.current = serialize;
    deserializeRef.current = deserialize;
  }, [serialize, deserialize]);

  const [value, setValue] = useState(() => {
    try {
      const saved = localStorage.getItem(key);
      if (saved !== null) {
        return deserialize(saved);
      }
      return typeof initialValue === 'function' ? initialValue() : initialValue;
    } catch (e) {
      console.error(`Failed to load ${key}:`, e);
      return typeof initialValue === 'function' ? initialValue() : initialValue;
    }
  });

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(key, serializeRef.current(value));
    } catch (e) {
      console.error(`Failed to save ${key}:`, e);
    }
  }, [key, value]);

  // Multi-tab synchronization via storage event
  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key === key && event.newValue !== null) {
        try {
          const parsed = deserializeRef.current(event.newValue);
          setValue(parsed);
        } catch (e) {
          console.error(`Failed to sync storage change for ${key}:`, e);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key]);

  const setStableValue = useCallback((newValue) => {
    setValue(newValue);
  }, []);

  return [value, setStableValue];
}

export default useLocalStorage;
