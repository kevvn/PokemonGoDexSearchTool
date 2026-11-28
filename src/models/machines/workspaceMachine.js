/**
 * Explicit Finite State Machine for top-level workspace tabs, search dock ownership,
 * and mobile filter drawer visibility.
 */

export const VALID_TABS = new Set(['triage', 'events', 'tags', 'trades', 'builder']);

export function normalizeTab(value) {
  if (value === 'grid') return 'builder';
  return VALID_TABS.has(value) ? value : 'triage';
}

export const INITIAL_WORKSPACE_STATE = {
  activeTab: 'triage',
  dockSource: { mode: 'builder' },
  filterDrawerOpen: false,
};

const BUILDER_DOCK = { mode: 'builder' };

export function transitionWorkspace(state, event) {
  switch (event?.type) {
    case 'SELECT_TAB': {
      const nextTab = normalizeTab(event.tab);
      return {
        activeTab: nextTab,
        dockSource: event.resetDock ? BUILDER_DOCK : state.dockSource,
        filterDrawerOpen: nextTab === 'builder' ? state.filterDrawerOpen : false,
      };
    }

    case 'BUILDER_MUTATED':
      return {
        ...state,
        dockSource: BUILDER_DOCK,
      };

    case 'SYNC_COPIED_STRING':
    case 'LOAD_EVENT_STRING':
    case 'SET_CUSTOM_DOCK_STRING': {
      const text = typeof event.text === 'string' ? event.text : '';
      return {
        ...state,
        dockSource: { mode: 'custom', text },
      };
    }

    case 'LOAD_QUERY_INTO_BUILDER':
    case 'SELECT_SPECIES_IN_BUILDER':
      return {
        activeTab: 'builder',
        dockSource: BUILDER_DOCK,
        filterDrawerOpen: false,
      };

    case 'OPEN_FILTER_DRAWER':
      return {
        activeTab: 'builder',
        dockSource: BUILDER_DOCK,
        filterDrawerOpen: true,
      };

    case 'CLOSE_FILTER_DRAWER':
      if (!state.filterDrawerOpen) return state;
      return {
        ...state,
        filterDrawerOpen: false,
      };

    default:
      return state;
  }
}
