import { useCallback, useId, useMemo, useReducer, useRef } from 'react';
import {
  INITIAL_SEARCH_DOCK_STATE,
  transitionSearchDock,
} from '../models/machines/searchDockMachine';
import { inspectAndFixPogoQuery, validateSearchString } from '../models/searchEngine';
import { generateOfflineQrDataUrl } from '../services/qrCodeService';

export function useSearchDockController({ searchString, onSearchUpdate }) {
  const [state, dispatch] = useReducer(transitionSearchDock, INITIAL_SEARCH_DOCK_STATE);
  const qrRequestIdRef = useRef(0);
  const qrDialogRef = useRef(null);
  const dockInputId = useId();
  const qrHeadingId = useId();

  const displayValue = state.draft.mode === 'editing' ? state.draft.value : searchString;

  const validation = useMemo(() => validateSearchString(displayValue), [displayValue]);
  const precedenceCheck = useMemo(() => inspectAndFixPogoQuery(displayValue), [displayValue]);

  const changeDraft = useCallback((value) => {
    dispatch({ type: 'CHANGE_DRAFT', value });
  }, []);

  const commitDraft = useCallback(() => {
    if (state.draft.mode === 'editing') {
      if (state.draft.value !== searchString) {
        onSearchUpdate(state.draft.value);
      }
      dispatch({ type: 'COMMIT_DRAFT' });
    }
  }, [state.draft, searchString, onSearchUpdate]);

  const cancelDraft = useCallback(() => {
    dispatch({ type: 'CANCEL_DRAFT' });
  }, []);

  const clearQuery = useCallback(() => {
    dispatch({ type: 'CANCEL_DRAFT' });
    onSearchUpdate('');
  }, [onSearchUpdate]);

  const fixPrecedence = useCallback(() => {
    dispatch({ type: 'CANCEL_DRAFT' });
    onSearchUpdate(precedenceCheck.fixedCnfQuery);
  }, [precedenceCheck.fixedCnfQuery, onSearchUpdate]);

  const toggleSavedMenu = useCallback(() => {
    dispatch({ type: 'TOGGLE_SAVED_MENU' });
  }, []);

  const closeOverlay = useCallback(() => {
    dispatch({ type: 'CLOSE_OVERLAY' });
  }, []);

  const selectSavedSearch = useCallback(
    (query) => {
      dispatch({ type: 'CANCEL_DRAFT' });
      onSearchUpdate(query);
      dispatch({ type: 'CLOSE_OVERLAY' });
    },
    [onSearchUpdate]
  );

  const openQrModal = useCallback(async () => {
    const requestId = ++qrRequestIdRef.current;
    dispatch({ type: 'OPEN_QR', forString: displayValue, requestId });

    const dialog = qrDialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
    }

    if (!displayValue) return;

    const result = await generateOfflineQrDataUrl(displayValue);
    if (result.ok) {
      dispatch({ type: 'QR_SUCCESS', requestId, dataUrl: result.dataUrl });
    } else {
      dispatch({ type: 'QR_ERROR', requestId, error: result.error });
    }
  }, [displayValue]);

  const closeQrModal = useCallback(() => {
    const dialog = qrDialogRef.current;
    if (dialog && dialog.open) {
      dialog.close();
    }
    dispatch({ type: 'CLOSE_OVERLAY' });
  }, []);

  const handleDockInputKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter') {
        commitDraft();
        e.currentTarget.blur();
      } else if (e.key === 'Escape') {
        cancelDraft();
        e.currentTarget.blur();
      }
    },
    [commitDraft, cancelDraft]
  );

  const handleDockContainerKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape' && state.overlay.type === 'saved-menu') {
        e.stopPropagation();
        dispatch({ type: 'CLOSE_OVERLAY' });
      }
    },
    [state.overlay.type]
  );

  return {
    dockInputId,
    qrHeadingId,
    qrDialogRef,
    displayValue,
    validation,
    precedenceCheck,
    isMenuOpen: state.overlay.type === 'saved-menu',
    qrOverlay: state.overlay.type === 'qr' ? state.overlay : null,
    changeDraft,
    commitDraft,
    clearQuery,
    fixPrecedence,
    toggleSavedMenu,
    closeOverlay,
    selectSavedSearch,
    openQrModal,
    closeQrModal,
    handleDockInputKeyDown,
    handleDockContainerKeyDown,
  };
}
