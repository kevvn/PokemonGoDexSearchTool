/**
 * Explicit Two-Step Destructive Reset Confirmation Machine + Self-Cleaning External Store.
 * Replaces component-local `confirmReset` + `resetTimerRef` + unmount `useEffect`.
 */

export const INITIAL_RESET_CONFIRM_STATE = 'idle';

export function transitionResetConfirm(state, event) {
  switch (event?.type) {
    case 'CLICK':
      if (state === 'idle') {
        return { state: 'armed', confirmed: false };
      }
      if (state === 'armed') {
        return { state: 'idle', confirmed: true };
      }
      return { state: 'idle', confirmed: false };

    case 'TIMEOUT':
    case 'CANCEL':
      return { state: 'idle', confirmed: false };

    default:
      return { state, confirmed: false };
  }
}

export function createResetConfirmStore(timeoutMs = 3500) {
  let state = INITIAL_RESET_CONFIRM_STATE;
  let timerId = null;
  const listeners = new Set();

  const clearPendingTimer = () => {
    if (timerId !== null) {
      clearTimeout(timerId);
      timerId = null;
    }
  };

  const notify = () => {
    for (const listener of listeners) {
      listener();
    }
  };

  const disarm = () => {
    clearPendingTimer();
    if (state !== 'idle') {
      state = 'idle';
      notify();
    }
  };

  const handleClick = (onConfirmed) => {
    const result = transitionResetConfirm(state, { type: 'CLICK' });
    state = result.state;
    clearPendingTimer();

    if (result.state === 'armed') {
      timerId = setTimeout(() => {
        timerId = null;
        const timedOut = transitionResetConfirm(state, { type: 'TIMEOUT' });
        if (timedOut.state !== state) {
          state = timedOut.state;
          notify();
        }
      }, timeoutMs);
    }

    notify();

    if (result.confirmed && typeof onConfirmed === 'function') {
      onConfirmed();
    }
    return result.confirmed;
  };

  const getSnapshot = () => state;
  const getServerSnapshot = () => INITIAL_RESET_CONFIRM_STATE;

  const subscribe = (listener) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
      if (listeners.size === 0) {
        clearPendingTimer();
        state = INITIAL_RESET_CONFIRM_STATE;
      }
    };
  };

  return {
    getSnapshot,
    getServerSnapshot,
    subscribe,
    handleClick,
    disarm,
  };
}
