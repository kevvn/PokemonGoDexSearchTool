import { useCallback, useId, useMemo, useReducer, useRef, useState, useSyncExternalStore } from 'react';
import {
  buildEventActionStrings,
  buildEventDatabaseSnapshot,
  calculateAgeSearchString,
  deleteCustomEvent,
  eventArchiveStore,
  exportEventDatabasePayload,
  getAvailableEventYears,
  getTodayPlainDateString,
  importEventDatabasePayload,
  resetEventDatabase,
  saveEventEntry,
  toggleEventAttended,
} from '../../models/eventArchiveModel';
import {
  INITIAL_EVENT_MODAL_STATE,
  transitionEventModal,
} from '../../models/machines/eventModalMachine';
import { createResetConfirmStore } from '../../models/machines/resetConfirmMachine';
import { downloadJsonFile, readJsonFile } from '../../services/fileTransferService';

const eventResetConfirmStore = createResetConfirmStore(3500);

export function useEventsArchiveController({ referenceDate, bufferMode, untaggedOnly }) {
  const rawEventState = useSyncExternalStore(
    eventArchiveStore.subscribe,
    eventArchiveStore.getSnapshot,
    eventArchiveStore.getServerSnapshot
  );
  const resetConfirmState = useSyncExternalStore(
    eventResetConfirmStore.subscribe,
    eventResetConfirmStore.getSnapshot,
    eventResetConfirmStore.getServerSnapshot
  );

  const eventDb = useMemo(() => buildEventDatabaseSnapshot(rawEventState), [rawEventState]);

  const [eventDbSearch, setEventDbSearch] = useState('');
  const [eventYearFilter, setEventYearFilter] = useState('ALL');
  const [eventSeriesFilter, setEventSeriesFilter] = useState('ALL');
  const [dbStatusBanner, setDbStatusBanner] = useState(null);

  const [customEventName, setCustomEventName] = useState('Custom Window');
  const [customStartDate, setCustomStartDate] = useState(() => getTodayPlainDateString());
  const [customEndDate, setCustomEndDate] = useState(() => getTodayPlainDateString());
  const [customExcludeRemote, setCustomExcludeRemote] = useState(false);
  const [customRequireLocationBg, setCustomRequireLocationBg] = useState(false);

  const [eventModalState, dispatchEventModal] = useReducer(
    transitionEventModal,
    INITIAL_EVENT_MODAL_STATE
  );

  const eventDialogRef = useRef(null);
  const fileImportRef = useRef(null);
  const dialogId = useId();
  const dialogHeadingId = useId();

  const availableYearFilters = useMemo(
    () => ['ALL', ...getAvailableEventYears({ events: eventDb.events })],
    [eventDb.events]
  );

  const filteredEvents = useMemo(() => {
    return eventDb.events.filter((ev) => {
      if (eventYearFilter !== 'ALL' && Number(ev.year) !== Number(eventYearFilter)) return false;
      if (eventSeriesFilter !== 'ALL' && ev.series !== eventSeriesFilter) return false;
      if (eventDbSearch.trim()) {
        const q = eventDbSearch.toLowerCase();
        const hay = [
          ev.name,
          ev.location,
          ev.tag,
          ev.series,
          ev.raidSummary,
          ev.specialSummary,
          ev.featuredSpecies,
          String(ev.year),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return hay.includes(q);
      }
      return true;
    });
  }, [eventDb.events, eventYearFilter, eventSeriesFilter, eventDbSearch]);

  // Precompute action strings in controller memo so MajorEventCard never runs calculateAgeSearchString inside render
  const eventActionsById = useMemo(() => {
    const map = {};
    for (const ev of filteredEvents) {
      map[ev.id] = buildEventActionStrings(ev, referenceDate, {
        untaggedOnly,
        bufferMode,
      });
    }
    return map;
  }, [filteredEvents, referenceDate, untaggedOnly, bufferMode]);

  const customAgeResult = useMemo(() => {
    const extraTokens = [];
    if (customRequireLocationBg) extraTokens.push('locationbackground');
    return calculateAgeSearchString(
      customStartDate || referenceDate,
      customEndDate || customStartDate || referenceDate,
      referenceDate,
      {
        bufferMode,
        untaggedOnly,
        extraTokens,
        excludeRemote: customExcludeRemote,
      }
    );
  }, [
    customStartDate,
    customEndDate,
    referenceDate,
    bufferMode,
    untaggedOnly,
    customExcludeRemote,
    customRequireLocationBg,
  ]);

  const openAddEventModal = useCallback(() => {
    dispatchEventModal({
      type: 'OPEN_CREATE',
      referenceDate,
      id: `custom-${Date.now()}`,
    });
    if (eventDialogRef.current && !eventDialogRef.current.open) {
      eventDialogRef.current.showModal();
    }
  }, [referenceDate]);

  const openEditEventModal = useCallback((eventItem) => {
    dispatchEventModal({ type: 'OPEN_EDIT', eventItem });
    if (eventDialogRef.current && !eventDialogRef.current.open) {
      eventDialogRef.current.showModal();
    }
  }, []);

  const closeEventModal = useCallback((returnValue = 'cancel') => {
    if (eventDialogRef.current?.open) {
      eventDialogRef.current.close(typeof returnValue === 'string' ? returnValue : '');
    } else {
      dispatchEventModal({ type: 'CLOSE' });
    }
  }, []);

  // Dedicated native `close` event listener so ESC/light-dismiss never re-enters dialog.close()
  const handleDialogClosed = useCallback(() => {
    dispatchEventModal({ type: 'CLOSE' });
  }, []);

  const updateEventFormField = useCallback((field, value) => {
    dispatchEventModal({ type: 'UPDATE_FIELD', field, value });
  }, []);

  const saveEventModal = useCallback(
    (e) => {
      e.preventDefault();
      const saved = saveEventEntry(eventModalState.form);
      setDbStatusBanner(`Saved "${saved.name}".`);
      if (eventDialogRef.current?.open) {
        eventDialogRef.current.close('saved');
      }
      dispatchEventModal({ type: 'CLOSE' });
    },
    [eventModalState.form]
  );

  const handleDeleteCustomEvent = useCallback((eventId) => {
    deleteCustomEvent(eventId);
    setDbStatusBanner('Deleted custom event.');
  }, []);

  const handleExportEventsJson = useCallback(() => {
    const payload = exportEventDatabasePayload(eventDb);
    downloadJsonFile(`pogo-events-${referenceDate}.json`, payload);
  }, [eventDb, referenceDate]);

  const handleImportEventsJson = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const parsed = await readJsonFile(file);
      const res = importEventDatabasePayload(parsed);
      if (!res.ok) {
        setDbStatusBanner(`Import failed: ${res.error}`);
      } else if (res.droppedCustomCount > 0) {
        setDbStatusBanner(
          `Imported ${file.name} (${res.droppedCustomCount} malformed custom event(s) skipped).`
        );
      } else {
        setDbStatusBanner(`Imported ${file.name}.`);
      }
    } catch (err) {
      setDbStatusBanner(`Import failed: ${err.message}`);
    } finally {
      e.target.value = '';
    }
  }, []);

  const handleResetEventsDb = useCallback(() => {
    eventResetConfirmStore.handleClick(() => {
      resetEventDatabase();
      setDbStatusBanner('Restored default event archive.');
    });
  }, []);

  return useMemo(
    () => ({
      eventDb,
      availableYearFilters,
      filteredEvents,
      eventActionsById,
      eventDbSearch,
      setEventDbSearch,
      eventYearFilter,
      setEventYearFilter,
      eventSeriesFilter,
      setEventSeriesFilter,
      dbStatusBanner,
      confirmReset: resetConfirmState === 'armed',
      customEventName,
      setCustomEventName,
      customStartDate,
      setCustomStartDate,
      customEndDate,
      setCustomEndDate,
      customExcludeRemote,
      setCustomExcludeRemote,
      customRequireLocationBg,
      setCustomRequireLocationBg,
      customAgeResult,
      eventModalState,
      eventDialogRef,
      fileImportRef,
      dialogId,
      dialogHeadingId,
      openAddEventModal,
      openEditEventModal,
      closeEventModal,
      handleDialogClosed,
      updateEventFormField,
      saveEventModal,
      handleToggleEventAttended: toggleEventAttended,
      handleDeleteCustomEvent,
      handleExportEventsJson,
      handleImportEventsJson,
      handleResetEventsDb,
    }),
    [
      eventDb,
      availableYearFilters,
      filteredEvents,
      eventActionsById,
      eventDbSearch,
      eventYearFilter,
      eventSeriesFilter,
      dbStatusBanner,
      resetConfirmState,
      customEventName,
      customStartDate,
      customEndDate,
      customExcludeRemote,
      customRequireLocationBg,
      customAgeResult,
      eventModalState,
      dialogId,
      dialogHeadingId,
      openAddEventModal,
      openEditEventModal,
      closeEventModal,
      handleDialogClosed,
      updateEventFormField,
      saveEventModal,
      handleDeleteCustomEvent,
      handleExportEventsJson,
      handleImportEventsJson,
      handleResetEventsDb,
    ]
  );
}
