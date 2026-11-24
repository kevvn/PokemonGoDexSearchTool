import { describe, expect, test, vi } from 'vitest';
import { createPwaStore } from './pwaModel';

describe('pwaModel store', () => {
  test('tracks PWA lifecycle state and online status without duplicate notifications', () => {
    const store = createPwaStore();
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    expect(store.getSnapshot().status).toBe('idle');
    expect(store.getServerSnapshot()).toMatchObject({
      status: 'idle',
      isOnline: true,
      bannerDismissed: false,
    });

    store.dispatch({ type: 'REGISTER_START' });
    expect(store.getSnapshot().status).toBe('registering');
    expect(listener).toHaveBeenCalledTimes(1);

    store.dispatch({ type: 'OFFLINE_READY' });
    expect(store.getSnapshot().status).toBe('offline-ready');
    expect(listener).toHaveBeenCalledTimes(2);

    // No-op dispatch should not notify listeners
    store.dispatch({ type: 'OFFLINE_READY' });
    expect(listener).toHaveBeenCalledTimes(2);

    store.setOnlineStatus(false);
    expect(store.getSnapshot().isOnline).toBe(false);
    expect(listener).toHaveBeenCalledTimes(3);

    // Setting identical online status should be a no-op
    store.setOnlineStatus(false);
    expect(listener).toHaveBeenCalledTimes(3);

    store.dispatch({ type: 'DISMISS_BANNER' });
    expect(store.getSnapshot().bannerDismissed).toBe(true);
    expect(listener).toHaveBeenCalledTimes(4);

    store.dispatch({ type: 'UPDATE_AVAILABLE' });
    expect(store.getSnapshot()).toMatchObject({
      status: 'update-available',
      isOnline: false,
      bannerDismissed: false,
    });

    unsubscribe();
    store.reset();
    expect(store.getSnapshot().status).toBe('idle');
    expect(listener).toHaveBeenCalledTimes(5);
  });
});
