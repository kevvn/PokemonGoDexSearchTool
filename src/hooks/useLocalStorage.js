import { useState, useEffect } from 'react';

/**
 * A custom hook to synchronize state with localStorage.
 *
 * @param {string} key - The localStorage key.
 * @param {any} initialValue - The initial value (or a function that returns it).
 * @param {object} options - Optional serialize and deserialize functions.
 * @returns {[any, function]} - The state and setter function.
 */
export function useLocalStorage(key, initialValue, options = {}) {
  const {
    serialize = JSON.stringify,
    deserialize = JSON.parse,
  } = options;

  const [state, setState] = useState(() => {
    try {
      // In SSR or non-browser environments, return initial value
      if (typeof window === 'undefined') {
        return typeof initialValue === 'function' ? initialValue() : initialValue;
      }

      const item = window.localStorage.getItem(key);
      if (item === null) {
        return typeof initialValue === 'function' ? initialValue() : initialValue;
      }
      return deserialize(item);
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return typeof initialValue === 'function' ? initialValue() : initialValue;
    }
  });

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, serialize(state));
      }
    } catch (error) {
      console.error(`Error writing localStorage key "${key}":`, error);
    }
  }, [key, state, serialize]);

  return [state, setState];
}
