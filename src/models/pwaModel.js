import { INITIAL_PWA_STATE, transitionPwa } from './machines/pwaMachine';

const SERVER_SNAPSHOT = {
  ...INITIAL_PWA_STATE,
  isOnline: true,
};

function readNavigatorOnline() {
  if (typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean') {
    return navigator.onLine;
  }
  return true;
}

export function createPwaStore() {
  let state = {
    ...INITIAL_PWA_STATE,
    isOnline: readNavigatorOnline(),
  };
  const listeners = new Set();

  const notify = () => {
    for (const listener of listeners) {
      listener();
    }
  };

  const dispatch = (event) => {
    const nextMachine = transitionPwa(state, event);
    if (
      nextMachine.status === state.status &&
      nextMachine.errorMessage === state.errorMessage &&
      nextMachine.bannerDismissed === state.bannerDismissed
    ) {
      return state;
    }
    state = {
      ...nextMachine,
      isOnline: state.isOnline,
    };
    notify();
    return state;
  };

  const setOnlineStatus = (isOnline) => {
    const nextOnline = Boolean(isOnline);
    if (state.isOnline === nextOnline) return state;
    state = {
      ...state,
      isOnline: nextOnline,
    };
    notify();
    return state;
  };

  const reset = () => {
    state = {
      ...INITIAL_PWA_STATE,
      isOnline: readNavigatorOnline(),
    };
    notify();
  };

  return {
    getSnapshot: () => state,
    getServerSnapshot: () => SERVER_SNAPSHOT,
    dispatch,
    setOnlineStatus,
    reset,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export const pwaModelStore = createPwaStore();
