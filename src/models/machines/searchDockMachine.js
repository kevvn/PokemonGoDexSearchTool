/**
 * Explicit Finite State Machine for the Bottom Search Dock:
 * - Draft editing lifecycle (`synced` vs `editing`)
 * - Mutually exclusive overlay (`none` | `saved-menu` | `qr`)
 * - Monotonic `requestId` guard for async offline QR generation
 */

export const INITIAL_SEARCH_DOCK_STATE = {
  draft: { mode: 'synced' },
  overlay: { type: 'none' },
};

export function transitionSearchDock(state, event) {
  switch (event?.type) {
    case 'CHANGE_DRAFT':
      return {
        ...state,
        draft: { mode: 'editing', value: String(event.value ?? '') },
      };

    case 'COMMIT_DRAFT':
    case 'CANCEL_DRAFT':
      if (state.draft.mode === 'synced') return state;
      return {
        ...state,
        draft: { mode: 'synced' },
      };

    case 'TOGGLE_SAVED_MENU':
      return {
        ...state,
        overlay:
          state.overlay.type === 'saved-menu'
            ? { type: 'none' }
            : { type: 'saved-menu' },
      };

    case 'OPEN_QR': {
      const forString = String(event.forString ?? '');
      const requestId = Number(event.requestId ?? 0);
      if (!forString) {
        return {
          ...state,
          overlay: {
            type: 'qr',
            status: 'empty',
            requestId,
            forString: '',
            dataUrl: '',
            error: '',
          },
        };
      }
      return {
        ...state,
        overlay: {
          type: 'qr',
          status: 'generating',
          requestId,
          forString,
          dataUrl: '',
          error: '',
        },
      };
    }

    case 'QR_SUCCESS': {
      if (
        state.overlay.type !== 'qr' ||
        state.overlay.requestId !== event.requestId
      ) {
        return state;
      }
      return {
        ...state,
        overlay: {
          type: 'qr',
          status: 'ready',
          requestId: state.overlay.requestId,
          forString: state.overlay.forString,
          dataUrl: String(event.dataUrl ?? ''),
          error: '',
        },
      };
    }

    case 'QR_ERROR': {
      if (
        state.overlay.type !== 'qr' ||
        state.overlay.requestId !== event.requestId
      ) {
        return state;
      }
      return {
        ...state,
        overlay: {
          type: 'qr',
          status: 'error',
          requestId: state.overlay.requestId,
          forString: state.overlay.forString,
          dataUrl: '',
          error: String(event.error ?? 'Failed to generate offline QR code.'),
        },
      };
    }

    case 'CLOSE_OVERLAY':
      if (state.overlay.type === 'none') return state;
      return {
        ...state,
        overlay: { type: 'none' },
      };

    default:
      return state;
  }
}
