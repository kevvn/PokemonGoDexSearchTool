import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { createPersistentStore } from './createPersistentStore';

function createMemoryStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => {
      map.set(k, String(v));
    },
    removeItem: (k) => {
      map.delete(k);
    },
    dump: () => Object.fromEntries(map.entries()),
  };
}

function createWindowEventMock() {
  const listeners = new Map();
  return {
    addEventListener(type, fn) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(fn);
    },
    removeEventListener(type, fn) {
      listeners.get(type)?.delete(fn);
    },
    dispatchEvent(event) {
      for (const fn of listeners.get(event.type) || []) {
        fn(event);
      }
    },
    listenerCount: (type) => listeners.get(type)?.size || 0,
  };
}

describe('createPersistentStore', () => {
  const originalLocalStorageDesc = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const originalWindow = globalThis.window;

  let storage;
  let win;

  beforeEach(() => {
    storage = createMemoryStorage();
    win = createWindowEventMock();
    Object.defineProperty(globalThis, 'localStorage', {
      value: storage,
      configurable: true,
      writable: true,
    });
    globalThis.window = win;
  });

  afterEach(() => {
    if (originalLocalStorageDesc) {
      Object.defineProperty(globalThis, 'localStorage', originalLocalStorageDesc);
    } else {
      delete globalThis.localStorage;
    }

    if (originalWindow === undefined) delete globalThis.window;
    else globalThis.window = originalWindow;
  });

  test('writes { __v, data } schema envelope and migrates legacy keys forward', () => {
    storage.setItem('legacy_v1', JSON.stringify({ legacyField: 'ok' }));

    const store = createPersistentStore({
      key: 'modern_v2',
      legacyKeys: ['legacy_v1'],
      schemaVersion: 2,
      getDefaultValue: () => ({ count: 0, migrated: false }),
      migrate: (raw) => ({ count: 5, migrated: Boolean(raw?.legacyField) }),
    });

    expect(store.getSnapshot()).toEqual({ count: 5, migrated: true });
    expect(store.getServerSnapshot()).toEqual({ count: 0, migrated: false });
    // Cached reference stability for useSyncExternalStore
    expect(Object.is(store.getSnapshot(), store.getSnapshot())).toBe(true);
    expect(Object.is(store.getServerSnapshot(), store.getServerSnapshot())).toBe(true);

    store.setState({ count: 9, migrated: true });
    const rawSaved = JSON.parse(storage.getItem('modern_v2'));
    expect(rawSaved).toEqual({ __v: 2, data: { count: 9, migrated: true } });

    store.reset();
    expect(storage.getItem('modern_v2')).toBeNull();
    expect(storage.getItem('legacy_v1')).toBeNull();
    expect(store.getSnapshot()).toEqual({ count: 0, migrated: false });
  });

  test('ignores no-op updates and syncs ref-counted window storage events across tabs', () => {
    const store = createPersistentStore({
      key: 'prefs_v1',
      getDefaultValue: () => ({ theme: 'light' }),
    });
    const listener = vi.fn();

    expect(win.listenerCount('storage')).toBe(0);
    const unsub1 = store.subscribe(listener);
    const unsub2 = store.subscribe(() => {});
    expect(win.listenerCount('storage')).toBe(1);

    const sameRef = store.getSnapshot();
    store.setState(sameRef);
    expect(listener).not.toHaveBeenCalled();

    // Cross-tab change to an unrelated key does nothing
    win.dispatchEvent({ type: 'storage', key: 'other_key', newValue: JSON.stringify({ theme: 'dark' }) });
    expect(listener).not.toHaveBeenCalled();

    // Cross-tab change to matching key updates snapshot and notifies subscribers
    win.dispatchEvent({ type: 'storage', key: 'prefs_v1', newValue: JSON.stringify({ theme: 'dark' }) });
    expect(store.getSnapshot()).toEqual({ theme: 'dark' });
    expect(listener).toHaveBeenCalledTimes(1);

    unsub1();
    expect(win.listenerCount('storage')).toBe(1);
    unsub2();
    expect(win.listenerCount('storage')).toBe(0);
  });

  test('handles localStorage.clear() (event.key === null), 0 -> 1 refresh, and surfaces QuotaExceededError', () => {
    const onStorageError = vi.fn();
    const store = createPersistentStore({
      key: 'clear_test_v1',
      getDefaultValue: () => ({ value: 'default' }),
      onStorageError,
    });
    const listener = vi.fn();
    const unsub = store.subscribe(listener);

    store.setState({ value: 'custom' });
    expect(store.getSnapshot()).toEqual({ value: 'custom' });

    // Cross-tab localStorage.clear() dispatches event.key === null
    win.dispatchEvent({ type: 'storage', key: null, newValue: null });
    expect(store.getSnapshot()).toEqual({ value: 'default' });
    expect(listener).toHaveBeenCalledTimes(2);

    unsub();

    // Mutate storage while unsubscribed -> 0 -> 1 subscribe refreshes snapshot
    storage.setItem('clear_test_v1', JSON.stringify({ value: 'updated-while-unsubscribed' }));
    const unsub2 = store.subscribe(() => {});
    expect(store.getSnapshot()).toEqual({ value: 'updated-while-unsubscribed' });
    unsub2();

    // QuotaExceededError is caught and exposed via getLastWriteError() + onStorageError
    const origSetItem = storage.setItem;
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    storage.setItem = () => {
      throw new Error('QuotaExceededError');
    };
    store.setState({ value: 'overflow' });
    expect(store.getLastWriteError()?.message).toBe('QuotaExceededError');
    expect(onStorageError).toHaveBeenCalledTimes(1);
    storage.setItem = origSetItem;
    errorSpy.mockRestore();
  });
});
