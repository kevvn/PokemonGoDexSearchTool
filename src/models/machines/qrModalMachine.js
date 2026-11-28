/**
 * Explicit Finite State Machine for async offline QR <dialog> lifecycle.
 * Uses a monotonic requestId guard and snapshotted `forString` so rapid close/reopen
 * never displays a stale QR image above a newer query.
 */

export const INITIAL_QR_MODAL_STATE = {
  status: 'idle', // 'idle' | 'loading' | 'ready' | 'error'
  requestId: 0,
  forString: '',
  dataUrl: '',
  error: '',
};

export function transitionQrModal(state, event) {
  switch (event?.type) {
    case 'OPEN_QR':
      return {
        status: 'loading',
        requestId: event.requestId,
        forString: typeof event.forString === 'string' ? event.forString : '',
        dataUrl: '',
        error: '',
      };

    case 'QR_SUCCESS':
      if (state.status !== 'loading' || state.requestId !== event.requestId) {
        return state;
      }
      return {
        ...state,
        status: 'ready',
        dataUrl: event.dataUrl || '',
        error: '',
      };

    case 'QR_ERROR':
      if (state.status !== 'loading' || state.requestId !== event.requestId) {
        return state;
      }
      return {
        ...state,
        status: 'error',
        dataUrl: '',
        error: event.error || 'Unable to generate offline QR code.',
      };

    case 'CLOSE_QR':
      if (state.status === 'idle') return state;
      return {
        ...INITIAL_QR_MODAL_STATE,
        requestId: state.requestId,
      };

    default:
      return state;
  }
}
