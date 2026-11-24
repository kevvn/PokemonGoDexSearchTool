import { useCallback, useMemo, useSyncExternalStore } from 'react';
import {
  builderGridStore,
  filtersStore,
  selectedIdsStore,
  viewModeStore,
  workspaceUiStore,
} from '../models/pokedexModel';
import { generateSearchString, parseSearchString } from '../models/searchEngine';

export function useWorkspaceController(pokemonList) {
  const activeTab = useSyncExternalStore(
    viewModeStore.subscribe,
    viewModeStore.getSnapshot,
    viewModeStore.getServerSnapshot
  );
  const selectedIds = useSyncExternalStore(
    selectedIdsStore.subscribe,
    selectedIdsStore.getSnapshot,
    selectedIdsStore.getServerSnapshot
  );
  const filters = useSyncExternalStore(
    filtersStore.subscribe,
    filtersStore.getSnapshot,
    filtersStore.getServerSnapshot
  );
  const uiState = useSyncExternalStore(
    workspaceUiStore.subscribe,
    workspaceUiStore.getSnapshot,
    workspaceUiStore.getServerSnapshot
  );

  const selectTab = useCallback((tab, { resetDock = false } = {}) => {
    workspaceUiStore.dispatch({ type: 'SELECT_TAB', tab, resetDock });
  }, []);

  const togglePokemon = useCallback((id) => {
    workspaceUiStore.dispatch({ type: 'BUILDER_MUTATED' });
    selectedIdsStore.setState((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectRegionBatch = useCallback((ids, shouldSelect) => {
    workspaceUiStore.dispatch({ type: 'BUILDER_MUTATED' });
    selectedIdsStore.setState((prev) => {
      const next = new Set(prev);
      for (const id of ids) {
        if (shouldSelect) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  }, []);

  const replaceSelection = useCallback((ids) => {
    workspaceUiStore.dispatch({ type: 'BUILDER_MUTATED' });
    selectedIdsStore.setState(new Set(ids));
  }, []);

  const clearSelection = useCallback(() => {
    workspaceUiStore.dispatch({ type: 'BUILDER_MUTATED' });
    selectedIdsStore.setState(new Set());
  }, []);

  const invertSelection = useCallback(() => {
    workspaceUiStore.dispatch({ type: 'BUILDER_MUTATED' });
    selectedIdsStore.setState((prev) => {
      const next = new Set();
      for (const p of pokemonList) {
        if (!prev.has(p.id)) {
          next.add(p.id);
        }
      }
      return next;
    });
  }, [pokemonList]);

  const updateFilters = useCallback((updater) => {
    workspaceUiStore.dispatch({ type: 'BUILDER_MUTATED' });
    filtersStore.setState(updater);
  }, []);

  const removeRawClause = useCallback((idx) => {
    workspaceUiStore.dispatch({ type: 'BUILDER_MUTATED' });
    filtersStore.setState((prev) => ({
      ...prev,
      rawClauses: (prev.rawClauses || []).filter((_, i) => i !== idx),
    }));
  }, []);

  const builderSearchString = useMemo(
    () => generateSearchString(selectedIds, filters),
    [selectedIds, filters]
  );

  const isCustomDock = uiState.dockSource.mode === 'custom';
  const activeSearchString = isCustomDock ? uiState.dockSource.text : builderSearchString;

  const updateDockSearchString = useCallback(
    (newString) => {
      if (activeTab === 'builder') {
        workspaceUiStore.dispatch({ type: 'BUILDER_MUTATED' });
        const { selectedIds: newIds, filters: newFilters } = parseSearchString(newString);
        selectedIdsStore.setState(newIds);
        filtersStore.setState(newFilters);
      } else {
        workspaceUiStore.dispatch({ type: 'SET_CUSTOM_DOCK_STRING', text: newString || '' });
      }
    },
    [activeTab]
  );

  const applyFilterQuery = useCallback((queryString) => {
    workspaceUiStore.dispatch({ type: 'BUILDER_MUTATED' });
    const { selectedIds: newIds, filters: newFilters } = parseSearchString(queryString);
    selectedIdsStore.setState(newIds);
    filtersStore.setState(newFilters);
  }, []);

  const loadQueryFromTriage = useCallback((queryString) => {
    const { selectedIds: newIds, filters: newFilters } = parseSearchString(queryString);
    selectedIdsStore.setState(newIds);
    filtersStore.setState(newFilters);
    workspaceUiStore.dispatch({ type: 'LOAD_QUERY_INTO_BUILDER' });
    if (typeof window !== 'undefined') {
      const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
      window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    }
  }, []);

  const loadEventStringToDock = useCallback((recipeString) => {
    workspaceUiStore.dispatch({ type: 'LOAD_EVENT_STRING', text: recipeString });
  }, []);

  const selectSpeciesInBuilder = useCallback((speciesIds) => {
    selectedIdsStore.setState(new Set(speciesIds));
    builderGridStore.update((prev) => ({ ...prev, selectedOnly: true }));
    workspaceUiStore.dispatch({ type: 'SELECT_SPECIES_IN_BUILDER' });
  }, []);

  const openFilterDrawer = useCallback(() => {
    workspaceUiStore.dispatch({ type: 'OPEN_FILTER_DRAWER' });
  }, []);

  const closeFilterDrawer = useCallback(() => {
    workspaceUiStore.dispatch({ type: 'CLOSE_FILTER_DRAWER' });
  }, []);

  return useMemo(
    () => ({
      activeTab,
      selectedIds,
      filters,
      isCustomDock,
      isFilterModalOpen: uiState.filterDrawerOpen,
      activeSearchString,
      selectTab,
      togglePokemon,
      selectRegionBatch,
      replaceSelection,
      clearSelection,
      invertSelection,
      updateFilters,
      removeRawClause,
      updateDockSearchString,
      applyFilterQuery,
      loadQueryFromTriage,
      loadEventStringToDock,
      selectSpeciesInBuilder,
      openFilterDrawer,
      closeFilterDrawer,
    }),
    [
      activeTab,
      selectedIds,
      filters,
      isCustomDock,
      uiState.filterDrawerOpen,
      activeSearchString,
      selectTab,
      togglePokemon,
      selectRegionBatch,
      replaceSelection,
      clearSelection,
      invertSelection,
      updateFilters,
      removeRawClause,
      updateDockSearchString,
      applyFilterQuery,
      loadQueryFromTriage,
      loadEventStringToDock,
      selectSpeciesInBuilder,
      openFilterDrawer,
      closeFilterDrawer,
    ]
  );
}
