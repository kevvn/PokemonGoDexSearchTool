import { useCallback, useMemo, useReducer, useRef, useState, useSyncExternalStore } from 'react';
import {
  INITIAL_META_SYNC_STATE,
  transitionMetaSync,
} from '../../models/machines/metaSyncMachine';
import {
  commitSyncedMetaCache,
  computeMetaIdSets,
  metaCacheStore,
} from '../../models/metaCacheModel';
import { fetchLivePvPokeMeta } from '../../services/metaNetworkService';

export function useMetaExplorerController({ pokemonList }) {
  const metaCache = useSyncExternalStore(
    metaCacheStore.subscribe,
    metaCacheStore.getSnapshot,
    metaCacheStore.getServerSnapshot
  );

  const [metaSyncState, dispatchMetaSync] = useReducer(
    transitionMetaSync,
    INITIAL_META_SYNC_STATE
  );
  const [activeMetaLeagueTab, setActiveMetaLeagueTab] = useState('great_league');
  const [metaSearchFilter, setMetaSearchFilter] = useState('');
  const syncAbortRef = useRef(null);

  // Zero-useEffect unmount abort cleanup via React 19 ref callback
  const panelRef = useCallback((node) => {
    if (!node) return undefined;
    return () => {
      syncAbortRef.current?.abort();
      syncAbortRef.current = null;
    };
  }, []);

  const handleSyncMeta = useCallback(async () => {
    if (metaSyncState.status === 'syncing') return;

    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      dispatchMetaSync({
        type: 'SYNC_OFFLINE',
        message: 'You are offline — using cached PvPoke Top 100 & DialgaDex rankings.',
      });
      return;
    }

    syncAbortRef.current?.abort();
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    syncAbortRef.current = controller;

    dispatchMetaSync({ type: 'START_SYNC' });
    try {
      const updated = await fetchLivePvPokeMeta(pokemonList, {
        signal: controller?.signal,
      });
      if (controller?.signal.aborted) return;
      commitSyncedMetaCache(updated);
      dispatchMetaSync({
        type: 'SYNC_SUCCESS',
        message: `Synced PvPoke Top 100 (GL/UL/ML) & ${updated.pve.entries.length} PvE raiders across all 4 tabs.`,
      });
    } catch (err) {
      if (err?.name === 'AbortError' || controller?.signal.aborted) return;
      dispatchMetaSync({
        type: 'SYNC_ERROR',
        message: `Offline / sync error (${err.message}). Using cached rankings.`,
      });
    } finally {
      if (syncAbortRef.current === controller) {
        syncAbortRef.current = null;
      }
    }
  }, [metaSyncState.status, pokemonList]);

  const metaSets = useMemo(
    () => computeMetaIdSets(metaCache, pokemonList),
    [metaCache, pokemonList]
  );

  return useMemo(
    () => ({
      panelRef,
      metaCache,
      metaSets,
      metaSyncState,
      handleSyncMeta,
      activeMetaLeagueTab,
      setActiveMetaLeagueTab,
      metaSearchFilter,
      setMetaSearchFilter,
    }),
    [
      panelRef,
      metaCache,
      metaSets,
      metaSyncState,
      handleSyncMeta,
      activeMetaLeagueTab,
      metaSearchFilter,
    ]
  );
}
