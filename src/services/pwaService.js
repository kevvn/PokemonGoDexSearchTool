import { registerSW } from 'virtual:pwa-register';

let initialized = false;
let updateSWCallback = null;
let swRegistration = null;
let periodicCheckId = null;
let lastUpdateCheckAt = 0;
let stateEventHandler = null;
let onlineChangeHandler = null;

const UPDATE_POLL_INTERVAL_MS = 60 * 60 * 1000;
const VISIBILITY_CHECK_THROTTLE_MS = 5 * 60 * 1000;
const APPLY_UPDATE_TIMEOUT_MS = 5000;

function emitEvent(event) {
  stateEventHandler?.(event);
}

function emitOnline(isOnline) {
  onlineChangeHandler?.(Boolean(isOnline));
}

export function initializePwaService({ onStateEvent, onOnlineChange } = {}) {
  if (typeof onStateEvent === 'function') stateEventHandler = onStateEvent;
  if (typeof onOnlineChange === 'function') onlineChangeHandler = onOnlineChange;

  if (initialized || typeof window === 'undefined') {
    return () => {};
  }
  initialized = true;

  const maybeCheckThrottled = () => {
    const now = Date.now();
    if (now - lastUpdateCheckAt < VISIBILITY_CHECK_THROTTLE_MS) return;
    lastUpdateCheckAt = now;
    checkForPwaUpdates();
  };

  const syncOnline = () => {
    emitOnline(true);
    maybeCheckThrottled();
  };
  const syncOffline = () => emitOnline(false);
  const handleVisibilityChange = () => {
    if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
      maybeCheckThrottled();
    }
  };

  window.addEventListener('online', syncOnline);
  window.addEventListener('offline', syncOffline);
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', handleVisibilityChange);
  }
  emitOnline(typeof navigator !== 'undefined' ? navigator.onLine : true);

  const cleanup = () => {
    window.removeEventListener('online', syncOnline);
    window.removeEventListener('offline', syncOffline);
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    }
    if (periodicCheckId !== null) {
      clearInterval(periodicCheckId);
      periodicCheckId = null;
    }
    initialized = false;
  };

  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    emitEvent({ type: 'UNSUPPORTED' });
    return cleanup;
  }

  emitEvent({ type: 'REGISTER_START' });

  try {
    updateSWCallback = registerSW({
      immediate: true,
      onOfflineReady() {
        // Fired only on initial offline cache readiness (never spams every cold start)
        emitEvent({ type: 'OFFLINE_READY' });
      },
      onNeedRefresh() {
        emitEvent({ type: 'UPDATE_AVAILABLE' });
      },
      onRegisteredSW(_swUrl, registration) {
        swRegistration = registration || null;
        if (registration && periodicCheckId === null) {
          periodicCheckId = setInterval(() => {
            if (typeof navigator !== 'undefined' && !navigator.onLine) return;
            lastUpdateCheckAt = Date.now();
            registration.update().catch(() => {});
          }, UPDATE_POLL_INTERVAL_MS);
        }
      },
      onRegisterError(error) {
        emitEvent({
          type: 'REGISTER_ERROR',
          errorMessage: error?.message || 'Service worker registration failed.',
        });
      },
    });
  } catch (error) {
    emitEvent({
      type: 'REGISTER_ERROR',
      errorMessage: error?.message || 'Service worker initialization failed.',
    });
  }

  return cleanup;
}

export async function applyPwaUpdate() {
  if (typeof updateSWCallback !== 'function') return false;
  emitEvent({ type: 'APPLY_UPDATE' });

  let timeoutId = null;
  try {
    await Promise.race([
      Promise.resolve(updateSWCallback(true)),
      new Promise((_, reject) => {
        timeoutId = setTimeout(
          () => reject(new Error('Update timed out. Reload the page to complete.')),
          APPLY_UPDATE_TIMEOUT_MS
        );
      }),
    ]);
    return true;
  } catch (error) {
    emitEvent({
      type: 'REGISTER_ERROR',
      errorMessage: error?.message || 'Failed to apply offline update.',
    });
    return false;
  } finally {
    if (timeoutId !== null) clearTimeout(timeoutId);
  }
}

export async function checkForPwaUpdates() {
  if (!swRegistration || (typeof navigator !== 'undefined' && !navigator.onLine)) {
    return false;
  }
  try {
    await swRegistration.update();
    return true;
  } catch {
    return false;
  }
}
