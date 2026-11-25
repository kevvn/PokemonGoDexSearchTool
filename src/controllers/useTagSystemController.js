import { useCallback, useMemo, useState, useSyncExternalStore } from 'react';
import { createResetConfirmStore } from '../models/machines/resetConfirmMachine';
import {
  EVENT_HYDRATION_YEARS,
  HYDRATION_STAGES,
  formatTagSetupListText,
  getAllTagHydrationSteps,
  getRecommendedDragOrder,
  getTagHash as resolveTagHash,
  hydrationProgressStore,
  lintTagMap,
  resetAllTags,
  resetHydrationProgress,
  resolveTagsList,
  tagStore,
  toggleHydrationChecked,
  toggleTagEnabled,
  updateTagName,
} from '../models/tagModel';
import {
  buildEventDatabaseSnapshot,
  eventArchiveStore,
} from '../models/eventArchiveModel';

const resetConfirmStore = createResetConfirmStore(3500);

/**
 * Lightweight hook for `App.jsx` & `AppHeader`: subscribes ONLY to `tagStore`
 * (never to hydration checklist, walkthrough modal, or reset confirmation state).
 */
export function useTagSummaryController() {
  const tagMap = useSyncExternalStore(
    tagStore.subscribe,
    tagStore.getSnapshot,
    tagStore.getServerSnapshot
  );

  const lintResults = useMemo(() => lintTagMap(tagMap), [tagMap]);

  return useMemo(
    () => ({
      tagMap,
      errorCount: lintResults.errorCount,
      warningCount: lintResults.warningCount,
    }),
    [tagMap, lintResults.errorCount, lintResults.warningCount]
  );
}

/**
 * Full Tag System controller scoped inside `TagSystemView` so hydration checkboxes,
 * walkthrough expansion, and reset confirmation never re-render the rest of the app.
 */
export function useTagSystemController(metaSnapshot = null) {
  const tagMap = useSyncExternalStore(
    tagStore.subscribe,
    tagStore.getSnapshot,
    tagStore.getServerSnapshot
  );
  const checkedTags = useSyncExternalStore(
    hydrationProgressStore.subscribe,
    hydrationProgressStore.getSnapshot,
    hydrationProgressStore.getServerSnapshot
  );
  const resetConfirmState = useSyncExternalStore(
    resetConfirmStore.subscribe,
    resetConfirmStore.getSnapshot,
    resetConfirmStore.getServerSnapshot
  );
  const rawEventState = useSyncExternalStore(
    eventArchiveStore.subscribe,
    eventArchiveStore.getSnapshot,
    eventArchiveStore.getServerSnapshot
  );

  const [walkthroughOpen, setWalkthroughOpen] = useState(false);
  const [eventYearScope, setEventYearScope] = useState('ALL');

  const eventDb = useMemo(() => buildEventDatabaseSnapshot(rawEventState), [rawEventState]);
  const eventList = eventDb.events;

  const availableEventYears = useMemo(() => {
    const years = new Set(EVENT_HYDRATION_YEARS);
    if (Array.isArray(eventList)) {
      for (const ev of eventList) {
        const y = Number(ev?.year);
        if (Number.isInteger(y) && y >= 2016) years.add(y);
      }
    }
    return Array.from(years).sort((a, b) => b - a);
  }, [eventList]);

  const hydrationOptions = useMemo(
    () => ({
      eventYear: eventYearScope,
      events: eventList,
    }),
    [eventYearScope, eventList]
  );

  const resolvedTags = useMemo(() => resolveTagsList(tagMap), [tagMap]);
  const lintResults = useMemo(() => lintTagMap(tagMap), [tagMap]);

  const enabledCount = useMemo(
    () => resolvedTags.filter((t) => t.enabled).length,
    [resolvedTags]
  );

  const recommendedTop12 = useMemo(
    () => getRecommendedDragOrder(tagMap).slice(0, 12),
    [tagMap]
  );

  const allHydrationSteps = useMemo(
    () => getAllTagHydrationSteps(tagMap, metaSnapshot, hydrationOptions),
    [tagMap, metaSnapshot, hydrationOptions]
  );

  // Precomputed lookup map so TagSystemView cards never re-run buildTagHydrationQueries during render
  const hydrationQueriesByTagId = useMemo(
    () => Object.fromEntries(allHydrationSteps.map((step) => [step.tagId, step.queries])),
    [allHydrationSteps]
  );

  const hydrationStagesGrouped = useMemo(() => {
    const byStage = new Map();
    for (const stage of HYDRATION_STAGES) {
      byStage.set(stage.id, { ...stage, steps: [] });
    }
    for (const step of allHydrationSteps) {
      byStage.get(step.stageId)?.steps.push(step);
    }
    return Array.from(byStage.values());
  }, [allHydrationSteps]);

  const enabledHydrationSteps = useMemo(
    () => allHydrationSteps.filter((s) => s.enabled),
    [allHydrationSteps]
  );

  const completedHydrationCount = useMemo(
    () => enabledHydrationSteps.filter((s) => Boolean(checkedTags[s.tagId])).length,
    [enabledHydrationSteps, checkedTags]
  );

  const hydrationPct =
    enabledHydrationSteps.length > 0
      ? Math.round((completedHydrationCount / enabledHydrationSteps.length) * 100)
      : 0;

  const setupListText = useMemo(() => formatTagSetupListText(tagMap), [tagMap]);

  const getTagHash = useCallback(
    (tagId) => resolveTagHash(tagId, tagMap),
    [tagMap]
  );

  const handleResetClick = useCallback(() => {
    resetConfirmStore.handleClick(resetAllTags);
  }, []);

  const toggleWalkthrough = useCallback(() => {
    setWalkthroughOpen((prev) => !prev);
  }, []);

  return useMemo(
    () => ({
      tagMap,
      resolvedTags,
      lintResults,
      enabledCount,
      recommendedTop12,
      hydrationQueriesByTagId,
      hydrationStagesGrouped,
      enabledHydrationSteps,
      completedHydrationCount,
      hydrationPct,
      setupListText,
      checkedTags,
      walkthroughOpen,
      eventYearScope,
      availableEventYears,
      confirmReset: resetConfirmState === 'armed',
      updateTagName,
      toggleTag: toggleTagEnabled,
      resetTags: resetAllTags,
      getTagHash,
      handleResetClick,
      toggleWalkthrough,
      setEventYearScope,
      toggleCheckedTag: toggleHydrationChecked,
      resetHydrationProgress,
    }),
    [
      tagMap,
      resolvedTags,
      lintResults,
      enabledCount,
      recommendedTop12,
      hydrationQueriesByTagId,
      hydrationStagesGrouped,
      enabledHydrationSteps,
      completedHydrationCount,
      hydrationPct,
      setupListText,
      checkedTags,
      walkthroughOpen,
      eventYearScope,
      availableEventYears,
      resetConfirmState,
      getTagHash,
      handleResetClick,
      toggleWalkthrough,
    ]
  );
}
