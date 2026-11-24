import { useCallback, useMemo, useRef, useSyncExternalStore } from 'react';
import {
  activeRegionStore,
  builderGridStore,
  countActiveFilters,
  filterAndGroupPokemon,
  filtersStore,
  selectedIdsStore,
} from '../models/pokedexModel';

const EMPTY_SELECTED_SET = new Set();

export function usePokedexBuilderController({
  pokemonList,
  selectedIds,
  filters,
  togglePokemon,
  handleRegionSelection,
  onReplaceSelection,
}) {
  const gridState = useSyncExternalStore(
    builderGridStore.subscribe,
    builderGridStore.getSnapshot,
    builderGridStore.getServerSnapshot
  );

  const lastClickedIdRef = useRef(null);
  const intersectionObserverRef = useRef(null);
  const observedRegionsCountRef = useRef(0);

  // Gate `selectedIds` dependency on `selectedOnly` so clicking a Pokémon card when
  // `selectedOnly === false` does NOT re-filter & re-group all 1,025 Pokémon!
  const effectiveSelectedIds = gridState.selectedOnly ? selectedIds : EMPTY_SELECTED_SET;

  const { groupedRegions, visibleList } = useMemo(
    () =>
      filterAndGroupPokemon(pokemonList, {
        searchQuery: gridState.searchQuery,
        selectedOnly: gridState.selectedOnly,
        selectedIds: effectiveSelectedIds,
        filterTypes: filters?.types,
      }),
    [pokemonList, gridState.searchQuery, gridState.selectedOnly, effectiveSelectedIds, filters?.types]
  );

  const activeFilterBadgeCount = useMemo(() => countActiveFilters(filters), [filters]);

  const setSearchQuery = useCallback((searchQuery) => {
    builderGridStore.update((prev) => ({ ...prev, searchQuery }));
  }, []);

  const setSelectedOnly = useCallback((valOrUpdater) => {
    builderGridStore.update((prev) => ({
      ...prev,
      selectedOnly:
        typeof valOrUpdater === 'function' ? valOrUpdater(prev.selectedOnly) : Boolean(valOrUpdater),
    }));
  }, []);

  const toggleFamilyMode = useCallback(() => {
    builderGridStore.update((prev) => ({ ...prev, familyMode: !prev.familyMode }));
  }, []);

  const toggleCollapse = useCallback((region) => {
    builderGridStore.update((prev) => ({
      ...prev,
      collapsedRegions: {
        ...prev.collapsedRegions,
        [region]: !prev.collapsedRegions[region],
      },
    }));
  }, []);

  const setPveType = useCallback((pveType) => {
    builderGridStore.update((prev) => ({ ...prev, pveType }));
  }, []);

  const setActiveMetaLabel = useCallback((activeMetaLabel) => {
    builderGridStore.update((prev) => ({ ...prev, activeMetaLabel }));
  }, []);

  const handleSelectFamily = useCallback(
    (familyIds, shouldSelect = true) => {
      handleRegionSelection(familyIds, shouldSelect);
    },
    [handleRegionSelection]
  );

  const applyMetaQuickSelect = useCallback(
    (label, ids) => {
      if (!Array.isArray(ids) || ids.length === 0) return;
      builderGridStore.update((prev) => ({ ...prev, activeMetaLabel: label }));
      if (onReplaceSelection) {
        onReplaceSelection(ids);
      } else {
        handleRegionSelection(ids, true);
      }
    },
    [onReplaceSelection, handleRegionSelection]
  );

  const clearMetaQuickSelect = useCallback(() => {
    builderGridStore.update((prev) => ({ ...prev, activeMetaLabel: '' }));
    onReplaceSelection?.([]);
  }, [onReplaceSelection]);

  // Zero-useEffect Shift+Click range selection: reads current stores directly on click
  // so `handleToggleCard` stays referentially stable for `RegionSection` memoization.
  const handleToggleCard = useCallback(
    (id, event) => {
      if (
        event &&
        event.shiftKey &&
        lastClickedIdRef.current !== null &&
        lastClickedIdRef.current !== id
      ) {
        const latestGrid = builderGridStore.getSnapshot();
        const latestSelected = selectedIdsStore.getSnapshot();
        const latestFilters = filtersStore.getSnapshot();
        const { visibleList: currentVisible } = filterAndGroupPokemon(pokemonList, {
          searchQuery: latestGrid.searchQuery,
          selectedOnly: latestGrid.selectedOnly,
          selectedIds: latestSelected,
          filterTypes: latestFilters?.types,
        });

        const idx1 = currentVisible.findIndex((p) => p.id === lastClickedIdRef.current);
        const idx2 = currentVisible.findIndex((p) => p.id === id);

        if (idx1 !== -1 && idx2 !== -1) {
          const start = Math.min(idx1, idx2);
          const end = Math.max(idx1, idx2);
          const rangeIds = currentVisible.slice(start, end + 1).map((p) => p.id);

          const targetSelection = latestSelected.has(lastClickedIdRef.current);
          handleRegionSelection(rangeIds, targetSelection);
          lastClickedIdRef.current = id;
          return;
        }
      }

      togglePokemon(id);
      lastClickedIdRef.current = id;
    },
    [pokemonList, togglePokemon, handleRegionSelection]
  );

  // Zero-useEffect IntersectionObserver via React 19 ref cleanup callback.
  // Writes only to `activeRegionStore` so scrolling never re-renders `PokemonGrid`!
  const observeRegionRef = useCallback((el) => {
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;

    if (!intersectionObserverRef.current) {
      intersectionObserverRef.current = new IntersectionObserver(
        (entries) => {
          const intersecting = entries.find((entry) => entry.isIntersecting);
          const regionName =
            intersecting?.target?.dataset?.region ||
            intersecting?.target?.id?.replace('region-', '');
          if (regionName) {
            activeRegionStore.set(regionName);
          }
        },
        {
          root: null,
          rootMargin: '-200px 0px -50% 0px',
          threshold: 0,
        }
      );
    }

    const observer = intersectionObserverRef.current;
    observer.observe(el);
    observedRegionsCountRef.current += 1;

    return () => {
      observer.unobserve(el);
      observedRegionsCountRef.current = Math.max(0, observedRegionsCountRef.current - 1);
      if (observedRegionsCountRef.current === 0) {
        observer.disconnect();
        intersectionObserverRef.current = null;
      }
    };
  }, []);

  return useMemo(
    () => ({
      searchQuery: gridState.searchQuery,
      selectedOnly: gridState.selectedOnly,
      collapsedRegions: gridState.collapsedRegions,
      familyMode: gridState.familyMode,
      pveType: gridState.pveType,
      activeMetaLabel: gridState.activeMetaLabel,
      groupedRegions,
      visibleList,
      activeFilterBadgeCount,
      setSearchQuery,
      setSelectedOnly,
      toggleFamilyMode,
      toggleCollapse,
      setPveType,
      setActiveMetaLabel,
      handleSelectFamily,
      applyMetaQuickSelect,
      clearMetaQuickSelect,
      handleToggleCard,
      observeRegionRef,
    }),
    [
      gridState.searchQuery,
      gridState.selectedOnly,
      gridState.collapsedRegions,
      gridState.familyMode,
      gridState.pveType,
      gridState.activeMetaLabel,
      groupedRegions,
      visibleList,
      activeFilterBadgeCount,
      setSearchQuery,
      setSelectedOnly,
      toggleFamilyMode,
      toggleCollapse,
      setPveType,
      setActiveMetaLabel,
      handleSelectFamily,
      applyMetaQuickSelect,
      clearMetaQuickSelect,
      handleToggleCard,
      observeRegionRef,
    ]
  );
}
