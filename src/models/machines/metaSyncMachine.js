/**
 * Explicit Finite State Machine for Live PvPoke / DialgaDex Meta Synchronization.
 */

export const INITIAL_META_SYNC_STATE = {
  status: 'idle', // 'idle' | 'syncing' | 'synced' | 'offline' | 'error'
  message: null,
};

export function transitionMetaSync(state, event) {
  switch (event?.type) {
    case 'START_SYNC':
      if (state.status === 'syncing') return state;
      return {
        status: 'syncing',
        message: null,
      };

    case 'SYNC_OFFLINE':
      return {
        status: 'offline',
        message:
          event.message ||
          'Offline mode active — using cached PvPoke Top 100 & DialgaDex rankings.',
      };

    case 'SYNC_SUCCESS':
      return {
        status: 'synced',
        message: String(event.message ?? 'Synced live meta rankings.'),
      };

    case 'SYNC_ERROR':
      return {
        status: 'error',
        message: String(event.message ?? 'Sync failed. Using cached rankings.'),
      };

    case 'DISMISS_MESSAGE':
      if (!state.message && state.status === 'idle') return state;
      return {
        status: state.status === 'syncing' ? 'syncing' : 'idle',
        message: null,
      };

    default:
      return state;
  }
}
