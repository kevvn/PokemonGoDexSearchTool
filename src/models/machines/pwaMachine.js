/**
 * Explicit Finite State Machine for Service Worker & Offline PWA Lifecycle.
 */

export const INITIAL_PWA_STATE = {
  status: 'idle', // 'unsupported' | 'idle' | 'registering' | 'offline-ready' | 'update-available' | 'updating' | 'error'
  errorMessage: null,
  bannerDismissed: false,
};

export function transitionPwa(state, event) {
  switch (event?.type) {
    case 'UNSUPPORTED':
      return {
        status: 'unsupported',
        errorMessage: null,
        bannerDismissed: false,
      };

    case 'REGISTER_START':
      if (state.status === 'offline-ready' || state.status === 'update-available') {
        return state;
      }
      return {
        status: 'registering',
        errorMessage: null,
        bannerDismissed: false,
      };

    case 'OFFLINE_READY':
      return {
        status: 'offline-ready',
        errorMessage: null,
        bannerDismissed: false,
      };

    case 'UPDATE_AVAILABLE':
      return {
        status: 'update-available',
        errorMessage: null,
        bannerDismissed: false,
      };

    case 'APPLY_UPDATE':
      if (state.status !== 'update-available') return state;
      return {
        ...state,
        status: 'updating',
        errorMessage: null,
      };

    case 'REGISTER_ERROR':
      return {
        status: 'error',
        errorMessage: String(event.errorMessage || 'Service worker registration failed.'),
        bannerDismissed: false,
      };

    case 'DISMISS_BANNER':
      if (state.bannerDismissed) return state;
      return {
        ...state,
        bannerDismissed: true,
      };

    default:
      return state;
  }
}
