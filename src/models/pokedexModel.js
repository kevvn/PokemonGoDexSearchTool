import { createPersistentStore } from './storage/createPersistentStore';
import { countActiveFilters, createDefaultFilters } from './searchEngine';
import {
  FALLBACK_SPRITE,
  getHomeSpriteUrl,
  getPixelSpriteUrl,
} from './spriteUrls';
import {
  INITIAL_WORKSPACE_STATE,
  normalizeTab,
  transitionWorkspace,
} from './machines/workspaceMachine';

export {
  FALLBACK_SPRITE,
  getPixelSpriteUrl,
  getHomeSpriteUrl,
  countActiveFilters,
};

export function migrateFilters(raw) {
  const defaults = createDefaultFilters();
  if (!raw || typeof raw !== 'object') return defaults;
  const merged = {
    ...defaults,
    ...raw,
    attributeLogic: raw.attributeLogic === 'OR' ? 'OR' : 'AND',
    ivStats: {
      ...defaults.ivStats,
      ...(raw.ivStats && typeof raw.ivStats === 'object' ? raw.ivStats : {}),
    },
    rawClauses: Array.isArray(raw.rawClauses) ? raw.rawClauses : [],
  };
  if ('ultra beasts' in raw && raw['ultra beasts'] !== undefined && merged.ultrabeast === null) {
    merged.ultrabeast = raw['ultra beasts'];
  }
  delete merged['ultra beasts'];
  return merged;
}

export const viewModeStore = createPersistentStore({
  key: 'pokedex_viewMode',
  getDefaultValue: () => 'triage',
  deserialize: (val) => normalizeTab(JSON.parse(val)),
});

export const selectedIdsStore = createPersistentStore({
  key: 'pokedex_selectedIds',
  getDefaultValue: () => new Set(),
  serialize: (val) => JSON.stringify(Array.from(val)),
  deserialize: (val) => {
    const parsed = JSON.parse(val);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((n) => Number.isInteger(n) && n >= 1));
  },
});

export const filtersStore = createPersistentStore({
  key: 'pokedex_filters',
  schemaVersion: 2,
  getDefaultValue: createDefaultFilters,
  deserialize: (val) => migrateFilters(JSON.parse(val)),
  migrate: (oldData) => migrateFilters(oldData),
});

/**
 * Ephemeral workspace UI store coordinating dock ownership and mobile filter drawer state.
 * Backed by `workspaceMachine` and synchronized with `viewModeStore` so cross-tab tab switches
 * and external services (`copyService`) stay coherent without `useEffect`.
 */
function createWorkspaceUiStore() {
  let state = {
    activeTab: viewModeStore.getSnapshot(),
    dockSource: INITIAL_WORKSPACE_STATE.dockSource,
    filterDrawerOpen: INITIAL_WORKSPACE_STATE.filterDrawerOpen,
  };
  const listeners = new Set();
  let unsubViewMode = null;

  const notify = () => {
    for (const listener of listeners) {
      listener();
    }
  };

  const syncFromViewMode = () => {
    const tab = viewModeStore.getSnapshot();
    if (tab !== state.activeTab) {
      state = { ...state, activeTab: tab };
      notify();
    }
  };

  const dispatch = (event) => {
    const syncedState = {
      ...state,
      activeTab: viewModeStore.getSnapshot(),
    };
    const nextState = transitionWorkspace(syncedState, event);
    if (nextState.activeTab !== viewModeStore.getSnapshot()) {
      viewModeStore.setState(nextState.activeTab);
    }
    if (
      nextState.activeTab !== state.activeTab ||
      nextState.dockSource !== state.dockSource ||
      nextState.filterDrawerOpen !== state.filterDrawerOpen
    ) {
      state = nextState;
      notify();
    }
  };

  return {
    getSnapshot: () => state,
    getServerSnapshot: () => INITIAL_WORKSPACE_STATE,
    dispatch,
    subscribe: (listener) => {
      if (listeners.size === 0 && !unsubViewMode) {
        unsubViewMode = viewModeStore.subscribe(syncFromViewMode);
      }
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0 && unsubViewMode) {
          unsubViewMode();
          unsubViewMode = null;
        }
      };
    },
  };
}

/**
 * Dedicated scroll-spy store for the currently visible region pill.
 * Isolated from `builderGridStore` so scrolling NEVER re-renders `PokemonGrid` or `PokedexBuilderView`.
 */
function createActiveRegionStore() {
  let activeRegion = 'Kanto';
  const listeners = new Set();

  const notify = () => {
    for (const listener of listeners) {
      listener();
    }
  };

  return {
    getSnapshot: () => activeRegion,
    getServerSnapshot: () => 'Kanto',
    set: (region) => {
      if (!region || region === activeRegion) return activeRegion;
      activeRegion = region;
      notify();
      return activeRegion;
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export const activeRegionStore = createActiveRegionStore();

const INITIAL_BUILDER_GRID_STATE = {
  searchQuery: '',
  selectedOnly: false,
  collapsedRegions: {},
  familyMode: false,
  pveType: 'dragon',
  activeMetaLabel: '',
};

function createBuilderGridStore() {
  let state = INITIAL_BUILDER_GRID_STATE;
  const listeners = new Set();

  const notify = () => {
    for (const listener of listeners) {
      listener();
    }
  };

  const update = (updater) => {
    const next = typeof updater === 'function' ? updater(state) : { ...state, ...updater };
    if (Object.is(next, state)) return state;
    state = next;
    notify();
    return state;
  };

  return {
    getSnapshot: () => state,
    getServerSnapshot: () => INITIAL_BUILDER_GRID_STATE,
    update,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export const builderGridStore = createBuilderGridStore();
export const workspaceUiStore = createWorkspaceUiStore();

export function syncCopiedStringToDock(text) {
  if (typeof text === 'string' && text.length > 0) {
    workspaceUiStore.dispatch({ type: 'SYNC_COPIED_STRING', text });
  }
}

export function filterAndGroupPokemon(
  pokemonList,
  { searchQuery = '', selectedOnly = false, selectedIds = new Set(), filterTypes = [] } = {}
) {
  const groupedRegions = {};
  const visibleList = [];
  const query = String(searchQuery || '').toLowerCase().trim();
  const numericQuery = query.replace(/^#?0+/, '');
  const activeTypeSet = filterTypes?.length ? new Set(filterTypes) : null;

  for (const p of pokemonList) {
    const padded4 = String(p.id).padStart(4, '0');
    const matchesSearch =
      !query ||
      p.name.toLowerCase().includes(query) ||
      String(p.id) === query ||
      (numericQuery && String(p.id) === numericQuery) ||
      padded4.includes(query) ||
      p.types.some((t) => t.toLowerCase().includes(query));

    const matchesSelected = !selectedOnly || selectedIds.has(p.id);
    const matchesTypeFilter = !activeTypeSet || p.types.some((t) => activeTypeSet.has(t));

    if (matchesSearch && matchesSelected && matchesTypeFilter) {
      if (!groupedRegions[p.region]) groupedRegions[p.region] = [];
      groupedRegions[p.region].push(p);
      visibleList.push(p);
    }
  }

  return { groupedRegions, visibleList };
}

export function areRegionPropsEqual(prev, next) {
  if (prev.region !== next.region) return false;
  if (prev.isCollapsed !== next.isCollapsed) return false;
  if (prev.familyMode !== next.familyMode) return false;
  if (prev.observeRegionRef !== next.observeRegionRef) return false;

  if (prev.pokemons !== next.pokemons) {
    if (prev.pokemons.length !== next.pokemons.length) return false;
    for (let i = 0; i < prev.pokemons.length; i++) {
      if (prev.pokemons[i] !== next.pokemons[i]) return false;
    }
  }

  if (prev.handleRegionSelection !== next.handleRegionSelection) return false;
  if (prev.togglePokemon !== next.togglePokemon) return false;
  if (prev.toggleCollapse !== next.toggleCollapse) return false;
  if (prev.onSelectFamily !== next.onSelectFamily) return false;

  const prevSel = prev.selectedIds;
  const nextSel = next.selectedIds;
  if (prevSel === nextSel) return true;

  for (const p of prev.pokemons) {
    if (prevSel.has(p.id) !== nextSel.has(p.id)) {
      return false;
    }
  }
  return true;
}
