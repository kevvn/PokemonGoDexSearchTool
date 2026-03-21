import { useState, useEffect, useCallback } from 'react';

function useLocalStorage(key, initialValue, options = {}) {
  const {
    serialize = JSON.stringify,
    deserialize = JSON.parse,
  } = options;

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

  useEffect(() => {
    try {
      localStorage.setItem(key, serialize(value));
    } catch (e) {
      console.error(`Failed to save ${key}:`, e);
    }
  }, [key, value, serialize]);

  const setStableValue = useCallback((newValue) => {
    setValue(newValue);
  }, []);

  return [value, setStableValue];
}

export default useLocalStorage;
