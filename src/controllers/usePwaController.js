import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { pwaModelStore } from '../models/pwaModel';
import { applyPwaUpdate, checkForPwaUpdates } from '../services/pwaService';

export function usePwaController() {
  const pwaState = useSyncExternalStore(
    pwaModelStore.subscribe,
    pwaModelStore.getSnapshot,
    pwaModelStore.getServerSnapshot
  );

  const dismissBanner = useCallback(() => {
    pwaModelStore.dispatch({ type: 'DISMISS_BANNER' });
  }, []);

  return useMemo(
    () => ({
      ...pwaState,
      applyUpdate: applyPwaUpdate,
      checkForUpdates: checkForPwaUpdates,
      dismissBanner,
    }),
    [pwaState, dismissBanner]
  );
}
