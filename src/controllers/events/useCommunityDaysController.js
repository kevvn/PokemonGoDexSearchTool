import { useCallback, useMemo, useState } from 'react';
import {
  ALL_COMMUNITY_DAY_PRE_EVO_IDS,
  COMMUNITY_DAY_EVENTS,
  getCommunityDaysByYear,
} from '../../models/communityDayModel';
import { compressIdRanges } from '../../models/searchEngine';

export function useCommunityDaysController() {
  const communityDaysByYear = useMemo(() => getCommunityDaysByYear(), []);
  const latestYear = communityDaysByYear[0]?.[0] ?? new Date().getFullYear();

  const [selectedCdEventIds, setSelectedCdEventIds] = useState(
    () => new Set(COMMUNITY_DAY_EVENTS.map((ev) => ev.id))
  );
  const [cdSearchFilter, setCdSearchFilter] = useState('');
  const [expandedCdYears, setExpandedCdYears] = useState(() => new Set([latestYear]));
  // Track explicit collapses during search so `<details open>` never desyncs with React state
  const [collapsedDuringSearch, setCollapsedDuringSearch] = useState(() => new Set());

  const updateCdSearchFilter = useCallback((nextVal) => {
    setCdSearchFilter(nextVal);
    setCollapsedDuringSearch(new Set());
  }, []);

  const selectedCdFamilyIds = useMemo(() => {
    const idSet = new Set();
    for (const ev of COMMUNITY_DAY_EVENTS) {
      if (selectedCdEventIds.has(ev.id)) {
        for (const fid of ev.familyIds) idSet.add(fid);
      }
    }
    return Array.from(idSet).sort((a, b) => a - b);
  }, [selectedCdEventIds]);

  const selectedCdFamilyRanges = useMemo(
    () => compressIdRanges(selectedCdFamilyIds),
    [selectedCdFamilyIds]
  );

  const allCdPreEvoRanges = useMemo(
    () => compressIdRanges(ALL_COMMUNITY_DAY_PRE_EVO_IDS),
    []
  );

  const toggleCdEvent = useCallback((eventId) => {
    setSelectedCdEventIds((prev) => {
      const next = new Set(prev);
      if (next.has(eventId)) next.delete(eventId);
      else next.add(eventId);
      return next;
    });
  }, []);

  const toggleCdYear = useCallback((yearEvents, shouldSelect) => {
    setSelectedCdEventIds((prev) => {
      const next = new Set(prev);
      for (const ev of yearEvents) {
        if (shouldSelect) next.add(ev.id);
        else next.delete(ev.id);
      }
      return next;
    });
  }, []);

  const selectAllCdEvents = useCallback(() => {
    setSelectedCdEventIds(new Set(COMMUNITY_DAY_EVENTS.map((ev) => ev.id)));
  }, []);

  const clearAllCdEvents = useCallback(() => {
    setSelectedCdEventIds(new Set());
  }, []);

  const setCdYearExpanded = useCallback(
    (year, isOpen) => {
      if (cdSearchFilter.trim()) {
        setCollapsedDuringSearch((prev) => {
          const next = new Set(prev);
          if (isOpen) next.delete(year);
          else next.add(year);
          return next;
        });
        return;
      }
      setExpandedCdYears((prev) => {
        const has = prev.has(year);
        if ((isOpen && has) || (!isOpen && !has)) return prev;
        const next = new Set(prev);
        if (isOpen) next.add(year);
        else next.delete(year);
        return next;
      });
    },
    [cdSearchFilter]
  );

  const isCdYearOpen = useCallback(
    (year) => {
      if (cdSearchFilter.trim()) {
        return !collapsedDuringSearch.has(year);
      }
      return expandedCdYears.has(year);
    },
    [cdSearchFilter, collapsedDuringSearch, expandedCdYears]
  );

  const toggleAllCdYears = useCallback(
    (visibleYears) => {
      if (cdSearchFilter.trim()) {
        setCollapsedDuringSearch((prev) => {
          const allOpen = visibleYears.length > 0 && visibleYears.every((y) => !prev.has(y));
          return allOpen ? new Set(visibleYears) : new Set();
        });
        return;
      }
      setExpandedCdYears((prev) => {
        const allOpen = visibleYears.length > 0 && visibleYears.every((y) => prev.has(y));
        return allOpen ? new Set() : new Set(visibleYears);
      });
    },
    [cdSearchFilter]
  );

  return useMemo(
    () => ({
      communityDaysByYear,
      selectedCdEventIds,
      selectedCdFamilyIds,
      selectedCdFamilyRanges,
      allCdPreEvoRanges,
      cdSearchFilter,
      setCdSearchFilter: updateCdSearchFilter,
      expandedCdYears,
      isCdYearOpen,
      setCdYearExpanded,
      toggleAllCdYears,
      toggleCdEvent,
      toggleCdYear,
      selectAllCdEvents,
      clearAllCdEvents,
    }),
    [
      communityDaysByYear,
      selectedCdEventIds,
      selectedCdFamilyIds,
      selectedCdFamilyRanges,
      allCdPreEvoRanges,
      cdSearchFilter,
      updateCdSearchFilter,
      expandedCdYears,
      isCdYearOpen,
      setCdYearExpanded,
      toggleAllCdYears,
      toggleCdEvent,
      toggleCdYear,
      selectAllCdEvents,
      clearAllCdEvents,
    ]
  );
}
