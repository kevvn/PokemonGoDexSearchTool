import { useCallback, useId, useMemo, useReducer, useRef, useState, useSyncExternalStore } from 'react';
import {
  INITIAL_QR_MODAL_STATE,
  transitionQrModal,
} from '../../models/machines/qrModalMachine';
import {
  addFriendWishlistEntry,
  addWishlistSpecies,
  buildGroupWishlistQueries,
  clearPersonalWishlist,
  compileMyWishlist,
  parseImportedFriendWishlist,
  removeFriendWishlistEntry,
  removeWishlistSpecies,
  searchWishlistSpeciesSuggestions,
  toggleFriendWishlistActive,
  toggleWishlistSpeciesTrait,
  tradeWishlistStore,
} from '../../models/trades/tradeWishlistModel';
import { generateOfflineQrDataUrl } from '../../services/qrCodeService';

export function useTradeWishlistController({ pokemonList, metaSnapshot }) {
  const storeState = useSyncExternalStore(
    tradeWishlistStore.subscribe,
    tradeWishlistStore.getSnapshot,
    tradeWishlistStore.getServerSnapshot
  );

  const [speciesSearch, setSpeciesSearch] = useState('');
  const [remoteReady, setRemoteReady] = useState(false);
  const [friendName, setFriendName] = useState('');
  const [friendQueryInput, setFriendQueryInput] = useState('');
  const [importError, setImportError] = useState('');
  const [storageError, setStorageError] = useState('');

  const [qrState, dispatchQr] = useReducer(transitionQrModal, INITIAL_QR_MODAL_STATE);
  const qrRequestIdRef = useRef(0);
  const qrDialogRef = useRef(null);
  const qrHeadingId = useId();
  const speciesInputId = useId();
  const friendNameId = useId();
  const friendQueryId = useId();

  const myWishlist = storeState.myWishlist;
  const friendWishlists = storeState.friendWishlists;

  const pokemonById = useMemo(() => {
    const map = new Map();
    for (const p of pokemonList || []) {
      map.set(p.id, p);
    }
    return map;
  }, [pokemonList]);

  const existingWishlistIds = useMemo(
    () => myWishlist.map((item) => item.dexId),
    [myWishlist]
  );

  const speciesSuggestions = useMemo(
    () => searchWishlistSpeciesSuggestions(pokemonList, speciesSearch, existingWishlistIds, 8),
    [pokemonList, speciesSearch, existingWishlistIds]
  );

  const compiledMyWishlist = useMemo(
    () => compileMyWishlist(myWishlist, { remoteReady, excludeFavorite: true }),
    [myWishlist, remoteReady]
  );

  const groupQueries = useMemo(
    () =>
      buildGroupWishlistQueries(friendWishlists, {
        remoteReady,
        metaSnapshot,
      }),
    [friendWishlists, remoteReady, metaSnapshot]
  );

  const handleStorageResult = useCallback((res) => {
    setStorageError(res?.storageError || '');
  }, []);

  const dismissStorageError = useCallback(() => {
    setStorageError('');
  }, []);

  const addSpeciesToWishlist = useCallback(
    (dexId) => {
      handleStorageResult(addWishlistSpecies(dexId));
      setSpeciesSearch('');
    },
    [handleStorageResult]
  );

  const removeSpeciesFromWishlist = useCallback(
    (dexId) => {
      handleStorageResult(removeWishlistSpecies(dexId));
    },
    [handleStorageResult]
  );

  const toggleWishlistTrait = useCallback(
    (dexId, traitId) => {
      handleStorageResult(toggleWishlistSpeciesTrait(dexId, traitId));
    },
    [handleStorageResult]
  );

  const clearMyWishlist = useCallback(() => {
    handleStorageResult(clearPersonalWishlist());
  }, [handleStorageResult]);

  const importFriendWishlist = useCallback(
    (e) => {
      if (e?.preventDefault) e.preventDefault();
      const result = parseImportedFriendWishlist(friendName, friendQueryInput, pokemonList);
      if (!result.ok) {
        setImportError(result.error);
        return;
      }
      setImportError('');
      handleStorageResult(addFriendWishlistEntry(result.entry));
      setFriendName('');
      setFriendQueryInput('');
    },
    [friendName, friendQueryInput, pokemonList, handleStorageResult]
  );

  const toggleFriendActive = useCallback(
    (id) => {
      handleStorageResult(toggleFriendWishlistActive(id));
    },
    [handleStorageResult]
  );

  const removeFriendWishlist = useCallback(
    (id) => {
      handleStorageResult(removeFriendWishlistEntry(id));
    },
    [handleStorageResult]
  );

  const openWishlistQrModal = useCallback(async () => {
    const query = compiledMyWishlist.query;
    if (!query) return;
    const requestId = qrRequestIdRef.current + 1;
    qrRequestIdRef.current = requestId;

    dispatchQr({ type: 'OPEN_QR', requestId, forString: query });
    if (qrDialogRef.current && !qrDialogRef.current.open) {
      qrDialogRef.current.showModal();
    }

    try {
      const res = await generateOfflineQrDataUrl(query);
      if (res.ok && res.dataUrl) {
        dispatchQr({ type: 'QR_SUCCESS', requestId, dataUrl: res.dataUrl });
      } else {
        dispatchQr({
          type: 'QR_ERROR',
          requestId,
          error: res.error || 'Unable to generate offline QR code.',
        });
      }
    } catch (err) {
      dispatchQr({
        type: 'QR_ERROR',
        requestId,
        error: err?.message || 'Unable to generate offline QR code.',
      });
    }
  }, [compiledMyWishlist.query]);

  const closeWishlistQrModal = useCallback(() => {
    if (qrDialogRef.current?.open) {
      qrDialogRef.current.close();
    }
    dispatchQr({ type: 'CLOSE_QR' });
  }, []);

  return useMemo(
    () => ({
      myWishlist,
      friendWishlists,
      pokemonById,
      speciesSearch,
      setSpeciesSearch,
      speciesSuggestions,
      remoteReady,
      setRemoteReady,
      compiledMyWishlist,
      groupQueries,
      friendName,
      setFriendName,
      friendQueryInput,
      setFriendQueryInput,
      importError,
      storageError,
      dismissStorageError,
      qrState,
      qrDialogRef,
      qrHeadingId,
      speciesInputId,
      friendNameId,
      friendQueryId,
      addSpeciesToWishlist,
      removeSpeciesFromWishlist,
      toggleWishlistTrait,
      clearMyWishlist,
      importFriendWishlist,
      toggleFriendActive,
      removeFriendWishlist,
      openWishlistQrModal,
      closeWishlistQrModal,
    }),
    [
      myWishlist,
      friendWishlists,
      pokemonById,
      speciesSearch,
      speciesSuggestions,
      remoteReady,
      compiledMyWishlist,
      groupQueries,
      friendName,
      friendQueryInput,
      importError,
      storageError,
      dismissStorageError,
      qrState,
      qrHeadingId,
      speciesInputId,
      friendNameId,
      friendQueryId,
      addSpeciesToWishlist,
      removeSpeciesFromWishlist,
      toggleWishlistTrait,
      clearMyWishlist,
      importFriendWishlist,
      toggleFriendActive,
      removeFriendWishlist,
      openWishlistQrModal,
      closeWishlistQrModal,
    ]
  );
}
