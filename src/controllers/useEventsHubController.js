import { useCallback, useId, useMemo, useRef, useState } from 'react';
import { getTodayPlainDateString } from '../models/eventArchiveModel';
import { createDefaultTagMap, mergeTagMap } from '../models/tagModel';

export const EVENT_HUB_TABS = [
  { id: 'events-db', icon: '🎟️', label: 'Events' },
  { id: 'year-slicer', icon: '🗓️', label: 'Timeline' },
  { id: 'community-days', icon: '✨', label: 'Comm Days' },
  { id: 'meta-sync', icon: '⚔️', label: 'Meta' },
  { id: 'cnf-combiner', icon: '🔗', label: 'CNF Combiner' },
];

/**
 * Lean Events Hub coordinator owning only shared temporal options (`referenceDate`,
 * `bufferMode`, `untaggedOnly`), active sub-tab navigation, and the Options modal ref.
 * Individual panels own their own focused controllers under `src/controllers/events/`
 * so typing in one `hidden="until-found"` panel never re-renders the other 4 panels.
 */
export function useEventsHubController({ customTagMap }) {
  const [activeSubTab, setActiveSubTab] = useState('events-db');
  const [untaggedOnly, setUntaggedOnly] = useState(true);
  const [referenceDate, setReferenceDate] = useState(() => getTodayPlainDateString());
  const [bufferMode, setBufferMode] = useState('evening-safe');

  const optionsDialogRef = useRef(null);
  const tabRefs = useRef({});
  const tabBaseId = useId();
  const optionsHeadingId = useId();

  const tagMap = useMemo(
    () => (customTagMap ? mergeTagMap(customTagMap) : createDefaultTagMap()),
    [customTagMap]
  );

  const selectSubTab = useCallback((tabId, { focus = false } = {}) => {
    setActiveSubTab(tabId);
    const el = tabRefs.current[tabId];
    if (focus) el?.focus();
    if (el?.scrollIntoView) {
      try {
        el.scrollIntoView({ block: 'nearest', inline: 'nearest', container: 'nearest' });
      } catch {
        el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      }
    }
  }, []);

  const handleTabKeyDown = useCallback(
    (e, idx) => {
      let nextIdx = null;
      if (e.key === 'ArrowRight') nextIdx = (idx + 1) % EVENT_HUB_TABS.length;
      else if (e.key === 'ArrowLeft') nextIdx = (idx - 1 + EVENT_HUB_TABS.length) % EVENT_HUB_TABS.length;
      else if (e.key === 'Home') nextIdx = 0;
      else if (e.key === 'End') nextIdx = EVENT_HUB_TABS.length - 1;

      if (nextIdx !== null) {
        e.preventDefault();
        selectSubTab(EVENT_HUB_TABS[nextIdx].id, { focus: true });
      }
    },
    [selectSubTab]
  );

  const tabRefHandlers = useMemo(() => {
    const map = {};
    for (const tab of EVENT_HUB_TABS) {
      map[tab.id] = (el) => {
        tabRefs.current[tab.id] = el;
      };
    }
    return map;
  }, []);

  const openOptionsDialog = useCallback(() => {
    if (optionsDialogRef.current && !optionsDialogRef.current.open) {
      optionsDialogRef.current.showModal();
    }
  }, []);

  return useMemo(
    () => ({
      tabBaseId,
      tabRefHandlers,
      optionsDialogRef,
      optionsHeadingId,
      activeSubTab,
      selectSubTab,
      handleTabKeyDown,
      untaggedOnly,
      setUntaggedOnly,
      referenceDate,
      setReferenceDate,
      bufferMode,
      setBufferMode,
      tagMap,
      openOptionsDialog,
    }),
    [
      tabBaseId,
      tabRefHandlers,
      optionsHeadingId,
      activeSubTab,
      selectSubTab,
      handleTabKeyDown,
      untaggedOnly,
      referenceDate,
      bufferMode,
      tagMap,
      openOptionsDialog,
    ]
  );
}
