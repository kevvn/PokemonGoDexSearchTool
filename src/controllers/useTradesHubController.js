import { useCallback, useId, useMemo, useRef, useState } from 'react';
import { createDefaultTagMap, mergeTagMap } from '../models/tagModel';

export const TRADE_HUB_TABS = [
  { id: 'audit', icon: '🧹', label: 'Hoard Audit' },
  { id: 'remote', icon: '🌍', label: 'Remote Trade' },
  { id: 'wishlists', icon: '🤝', label: 'Friend Wishlists' },
];

/**
 * Lean Trades Hub coordinator owning sub-tab navigation and resolved tagMap.
 * Individual panels own their own isolated controllers under `src/controllers/trades/`
 * so editing wishlists or sliders never re-renders sibling `hidden="until-found"` panels.
 */
export function useTradesHubController({ customTagMap }) {
  const [activeSubTab, setActiveSubTab] = useState('audit');
  const tabRefs = useRef({});
  const tabBaseId = useId();

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
      if (e.key === 'ArrowRight') nextIdx = (idx + 1) % TRADE_HUB_TABS.length;
      else if (e.key === 'ArrowLeft') nextIdx = (idx - 1 + TRADE_HUB_TABS.length) % TRADE_HUB_TABS.length;
      else if (e.key === 'Home') nextIdx = 0;
      else if (e.key === 'End') nextIdx = TRADE_HUB_TABS.length - 1;

      if (nextIdx !== null) {
        e.preventDefault();
        selectSubTab(TRADE_HUB_TABS[nextIdx].id, { focus: true });
      }
    },
    [selectSubTab]
  );

  const tabRefHandlers = useMemo(() => {
    const map = {};
    for (const tab of TRADE_HUB_TABS) {
      map[tab.id] = (el) => {
        tabRefs.current[tab.id] = el;
      };
    }
    return map;
  }, []);

  return useMemo(
    () => ({
      tabBaseId,
      tabRefHandlers,
      activeSubTab,
      selectSubTab,
      handleTabKeyDown,
      tagMap,
    }),
    [tabBaseId, tabRefHandlers, activeSubTab, selectSubTab, handleTabKeyDown, tagMap]
  );
}
