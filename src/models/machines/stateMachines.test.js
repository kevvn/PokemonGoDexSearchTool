import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import {
  INITIAL_WORKSPACE_STATE,
  normalizeTab,
  transitionWorkspace,
} from './workspaceMachine';
import {
  INITIAL_SEARCH_DOCK_STATE,
  transitionSearchDock,
} from './searchDockMachine';
import {
  cycleTriState,
  toTriStateLabel,
  toggleTriStateTarget,
} from './triStateMachine';
import {
  INITIAL_RESET_CONFIRM_STATE,
  createResetConfirmStore,
  transitionResetConfirm,
} from './resetConfirmMachine';
import {
  INITIAL_META_SYNC_STATE,
  transitionMetaSync,
} from './metaSyncMachine';
import {
  EMPTY_EVENT_FORM,
  INITIAL_EVENT_MODAL_STATE,
  transitionEventModal,
} from './eventModalMachine';
import { INITIAL_PWA_STATE, transitionPwa } from './pwaMachine';
import { INITIAL_QR_MODAL_STATE, transitionQrModal } from './qrModalMachine';

describe('workspaceMachine', () => {
  test('normalizes legacy grid tab and invalid tabs safely', () => {
    expect(normalizeTab('grid')).toBe('builder');
    expect(normalizeTab('events')).toBe('events');
    expect(normalizeTab('tags')).toBe('tags');
    expect(normalizeTab('trades')).toBe('trades');
    expect(normalizeTab('unknown')).toBe('triage');
  });

  test('manages tab switching, dock ownership, and drawer transitions', () => {
    let state = transitionWorkspace(INITIAL_WORKSPACE_STATE, {
      type: 'LOAD_EVENT_STRING',
      text: 'shiny&!#',
    });
    expect(state.dockSource).toEqual({ mode: 'custom', text: 'shiny&!#' });

    state = transitionWorkspace(state, { type: 'OPEN_FILTER_DRAWER' });
    expect(state).toEqual({
      activeTab: 'builder',
      dockSource: { mode: 'builder' },
      filterDrawerOpen: true,
    });

    state = transitionWorkspace(state, { type: 'SELECT_TAB', tab: 'tags' });
    expect(state.activeTab).toBe('tags');
    expect(state.filterDrawerOpen).toBe(false);

    state = transitionWorkspace(state, { type: 'SYNC_COPIED_STRING', text: 'age0' });
    state = transitionWorkspace(state, { type: 'SELECT_TAB', tab: 'builder', resetDock: true });
    expect(state.dockSource).toEqual({ mode: 'builder' });
  });
});

describe('searchDockMachine', () => {
  test('handles draft editing, commit/cancel, exclusive overlay, and stale QR requestId guard', () => {
    let state = transitionSearchDock(INITIAL_SEARCH_DOCK_STATE, {
      type: 'CHANGE_DRAFT',
      value: '4*&shiny',
    });
    expect(state.draft).toEqual({ mode: 'editing', value: '4*&shiny' });

    state = transitionSearchDock(state, { type: 'TOGGLE_SAVED_MENU' });
    expect(state.overlay).toEqual({ type: 'saved-menu' });

    state = transitionSearchDock(state, { type: 'OPEN_QR', forString: '', requestId: 1 });
    expect(state.overlay.status).toBe('empty');

    state = transitionSearchDock(state, { type: 'OPEN_QR', forString: '4*&shiny', requestId: 2 });
    state = transitionSearchDock(state, { type: 'OPEN_QR', forString: 'legendary', requestId: 3 });

    // Stale response for requestId 2 must be ignored
    const afterStale = transitionSearchDock(state, {
      type: 'QR_SUCCESS',
      requestId: 2,
      dataUrl: 'data:image/png;base64,STALE',
    });
    expect(afterStale).toBe(state);
    expect(afterStale.overlay.status).toBe('generating');

    // Matching requestId 3 resolves cleanly
    const ready = transitionSearchDock(afterStale, {
      type: 'QR_SUCCESS',
      requestId: 3,
      dataUrl: 'data:image/png;base64,VALID',
    });
    expect(ready.overlay).toMatchObject({
      type: 'qr',
      status: 'ready',
      forString: 'legendary',
      dataUrl: 'data:image/png;base64,VALID',
    });

    const closed = transitionSearchDock(ready, { type: 'CLOSE_OVERLAY' });
    expect(closed.overlay).toEqual({ type: 'none' });
  });
});

describe('triStateMachine', () => {
  test('cycles null -> true -> false -> null and toggles targets', () => {
    expect(cycleTriState(null)).toBe(true);
    expect(cycleTriState(undefined)).toBe(true);
    expect(cycleTriState(true)).toBe(false);
    expect(cycleTriState(false)).toBeNull();

    expect(toggleTriStateTarget(null, true)).toBe(true);
    expect(toggleTriStateTarget(true, true)).toBeNull();
    expect(toggleTriStateTarget(false, true)).toBe(true);
    expect(toggleTriStateTarget(true, false)).toBe(false);

    expect(toTriStateLabel(true)).toBe('include');
    expect(toTriStateLabel(false)).toBe('exclude');
    expect(toTriStateLabel(null)).toBe('off');
  });
});

describe('resetConfirmMachine & createResetConfirmStore', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('pure transition requires second click before confirming', () => {
    const first = transitionResetConfirm(INITIAL_RESET_CONFIRM_STATE, { type: 'CLICK' });
    expect(first).toEqual({ state: 'armed', confirmed: false });

    const second = transitionResetConfirm(first.state, { type: 'CLICK' });
    expect(second).toEqual({ state: 'idle', confirmed: true });

    const timedOut = transitionResetConfirm('armed', { type: 'TIMEOUT' });
    expect(timedOut).toEqual({ state: 'idle', confirmed: false });
  });

  test('store arms timer, disarms after timeout, confirms on second click, and cleans up on unsubscribe', () => {
    const store = createResetConfirmStore(3500);
    const listener = vi.fn();
    const onConfirmed = vi.fn();

    const unsub = store.subscribe(listener);
    expect(store.getSnapshot()).toBe('idle');

    // First click arms
    expect(store.handleClick(onConfirmed)).toBe(false);
    expect(store.getSnapshot()).toBe('armed');
    expect(onConfirmed).not.toHaveBeenCalled();

    // Timeout resets to idle
    vi.advanceTimersByTime(3500);
    expect(store.getSnapshot()).toBe('idle');

    // Two rapid clicks confirm
    expect(store.handleClick(onConfirmed)).toBe(false);
    expect(store.handleClick(onConfirmed)).toBe(true);
    expect(onConfirmed).toHaveBeenCalledTimes(1);
    expect(store.getSnapshot()).toBe('idle');

    // Dropping last subscriber cancels pending timeout and resets state
    store.handleClick(onConfirmed);
    expect(store.getSnapshot()).toBe('armed');
    unsub();
    expect(store.getSnapshot()).toBe('idle');
    vi.advanceTimersByTime(5000);
    expect(store.getSnapshot()).toBe('idle');
  });
});

describe('metaSyncMachine', () => {
  test('enforces double-submit guard while syncing and transitions through offline/success/error', () => {
    const syncing = transitionMetaSync(INITIAL_META_SYNC_STATE, { type: 'START_SYNC' });
    expect(syncing).toEqual({ status: 'syncing', message: null });

    const duplicateStart = transitionMetaSync(syncing, { type: 'START_SYNC' });
    expect(duplicateStart).toBe(syncing);

    const synced = transitionMetaSync(syncing, { type: 'SYNC_SUCCESS', message: 'Done' });
    expect(synced).toEqual({ status: 'synced', message: 'Done' });

    const offline = transitionMetaSync(synced, { type: 'SYNC_OFFLINE', message: 'Offline cache' });
    expect(offline).toEqual({ status: 'offline', message: 'Offline cache' });

    const errored = transitionMetaSync(syncing, { type: 'SYNC_ERROR', message: 'Boom' });
    expect(errored).toEqual({ status: 'error', message: 'Boom' });

    const dismissed = transitionMetaSync(errored, { type: 'DISMISS_MESSAGE' });
    expect(dismissed).toEqual({ status: 'idle', message: null });
  });
});

describe('eventModalMachine', () => {
  test('handles create, edit, field updates, and close transitions', () => {
    const created = transitionEventModal(INITIAL_EVENT_MODAL_STATE, {
      type: 'OPEN_CREATE',
      referenceDate: '2026-10-15',
      id: 'custom-1',
    });
    expect(created.mode).toBe('create');
    expect(created.form.start).toBe('2026-10-15');
    expect(created.form.year).toBe(2026);

    const updated = transitionEventModal(created, {
      type: 'UPDATE_FIELD',
      field: 'name',
      value: 'Test Safari',
    });
    expect(updated.form.name).toBe('Test Safari');

    const edited = transitionEventModal(INITIAL_EVENT_MODAL_STATE, {
      type: 'OPEN_EDIT',
      eventItem: {
        ...EMPTY_EVENT_FORM,
        id: 'go-fest-2026',
        name: 'GO Fest 2026',
        raidMegaIds: [800, 888],
        regionalRareIds: [201],
        isCustom: false,
      },
    });
    expect(edited.mode).toBe('edit');
    expect(edited.isCustom).toBe(false);
    expect(edited.form.raidMegaIdsText).toBe('800, 888');
    expect(edited.form.regionalRareIdsText).toBe('201');

    const closed = transitionEventModal(edited, { type: 'CLOSE' });
    expect(closed.mode).toBe('closed');
  });
});

describe('pwaMachine', () => {
  test('tracks service worker registration, offline-ready, update-available, and errors', () => {
    let state = transitionPwa(INITIAL_PWA_STATE, { type: 'REGISTER_START' });
    expect(state.status).toBe('registering');

    state = transitionPwa(state, { type: 'OFFLINE_READY' });
    expect(state.status).toBe('offline-ready');

    // Late REGISTER_START must not regress an active offline-ready state
    expect(transitionPwa(state, { type: 'REGISTER_START' })).toBe(state);

    state = transitionPwa(state, { type: 'DISMISS_BANNER' });
    expect(state.bannerDismissed).toBe(true);

    state = transitionPwa(state, { type: 'UPDATE_AVAILABLE' });
    expect(state.status).toBe('update-available');
    expect(state.bannerDismissed).toBe(false);

    state = transitionPwa(state, { type: 'APPLY_UPDATE' });
    expect(state.status).toBe('updating');

    const unsupported = transitionPwa(INITIAL_PWA_STATE, { type: 'UNSUPPORTED' });
    expect(unsupported.status).toBe('unsupported');

    const failed = transitionPwa(INITIAL_PWA_STATE, {
      type: 'REGISTER_ERROR',
      errorMessage: 'SW blocked',
    });
    expect(failed.status).toBe('error');
    expect(failed.errorMessage).toBe('SW blocked');
  });
});

describe('qrModalMachine', () => {
  test('guards against stale async QR completions and close-before-resolve races', () => {
    let state = transitionQrModal(INITIAL_QR_MODAL_STATE, {
      type: 'OPEN_QR',
      requestId: 1,
      forString: '201,384',
    });
    expect(state).toEqual({
      status: 'loading',
      requestId: 1,
      forString: '201,384',
      dataUrl: '',
      error: '',
    });

    // Rapid reopen bumps requestId to 2; late response for requestId 1 must be ignored
    state = transitionQrModal(state, { type: 'OPEN_QR', requestId: 2, forString: '479' });
    expect(transitionQrModal(state, { type: 'QR_SUCCESS', requestId: 1, dataUrl: 'data:stale' })).toBe(state);

    // Matching requestId transitions cleanly to ready
    state = transitionQrModal(state, { type: 'QR_SUCCESS', requestId: 2, dataUrl: 'data:fresh' });
    expect(state.status).toBe('ready');
    expect(state.forString).toBe('479');
    expect(state.dataUrl).toBe('data:fresh');

    // Close while loading ignores late resolution
    state = transitionQrModal(state, { type: 'OPEN_QR', requestId: 3, forString: '757' });
    state = transitionQrModal(state, { type: 'CLOSE_QR' });
    expect(state.status).toBe('idle');
    expect(transitionQrModal(state, { type: 'QR_SUCCESS', requestId: 3, dataUrl: 'data:late' })).toBe(state);
    expect(transitionQrModal(state, { type: 'QR_ERROR', requestId: 3, error: 'late err' })).toBe(state);
  });
});

