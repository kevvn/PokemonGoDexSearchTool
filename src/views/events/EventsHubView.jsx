import React, { useMemo } from 'react';
import {
  EVENT_HUB_TABS,
  useEventsHubController,
} from '../../controllers/useEventsHubController';
import CnfCombinerPanel from './CnfCombinerPanel';
import CommunityDaysPanel from './CommunityDaysPanel';
import { AgeOptionsDialog } from './EventDialogs';
import EventsArchivePanel from './EventsArchivePanel';
import MetaExplorerPanel from './MetaExplorerPanel';
import YearSlicerPanel from './YearSlicerPanel';
import { attachTablistFadeObserver } from '../shared/tablistRef';

const BUFFER_LABELS = {
  'evening-safe': '24h Rolling Safe',
  'plus-minus-1': '±1d Timezone',
  exact: 'Exact Calendar',
};

function EventsHubView({ pokemonList, customTagMap, customTags, onLoadSearchString, onSelectSpeciesInGrid }) {
  const effectiveTagMap = customTagMap ?? customTags?.tagMap ?? null;
  const controller = useEventsHubController({ customTagMap: effectiveTagMap });
  const {
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
  } = controller;

  const panelBeforeMatchRefs = useMemo(() => {
    const map = {};
    for (const tab of EVENT_HUB_TABS) {
      map[tab.id] = (panel) => {
        if (!panel) return undefined;
        const onBeforeMatch = () => selectSubTab(tab.id);
        panel.addEventListener('beforematch', onBeforeMatch);
        return () => panel.removeEventListener('beforematch', onBeforeMatch);
      };
    }
    return map;
  }, [selectSubTab]);

  const bufferLabel = BUFFER_LABELS[bufferMode] || BUFFER_LABELS.exact;

  return (
    <div className="max-w-7xl mx-auto w-full pb-24">
      {/* Sticky Single-Row Pill Tablist + Compact Controls (offset accounts for 2-row mobile header) */}
      <div className="sticky top-[84px] md:top-[56px] z-30 bg-[#bfeaf6]/90 backdrop-blur-md border-b border-white/65">
        <div className="max-w-7xl mx-auto px-2 sm:px-4">
          <div
            ref={attachTablistFadeObserver}
            className="mwg-tablist"
            role="tablist"
            aria-label="Events, timeline, and search tools"
          >
            {EVENT_HUB_TABS.map((tab, idx) => {
              const isSelected = activeSubTab === tab.id;
              const domId = `${tabBaseId}-tab-${tab.id}`;
              const panelId = `${tabBaseId}-panel-${tab.id}`;
              return (
                <button
                  key={tab.id}
                  ref={tabRefHandlers[tab.id]}
                  type="button"
                  role="tab"
                  id={domId}
                  aria-controls={panelId}
                  aria-selected={isSelected ? 'true' : 'false'}
                  tabIndex={isSelected ? 0 : -1}
                  onClick={() => selectSubTab(tab.id)}
                  onKeyDown={(e) => handleTabKeyDown(e, idx)}
                >
                  <span aria-hidden="true">{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between gap-2 py-1.5 px-1 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <button
                type="button"
                onClick={() => setUntaggedOnly((v) => !v)}
                aria-pressed={untaggedOnly}
                className={`compact-inline-chip min-h-[30px] px-3 py-0.5 text-[11px] uppercase cursor-pointer inline-flex items-center gap-1 ${
                  untaggedOnly ? 'pogo-pill-active' : 'pogo-pill'
                }`}
              >
                <span>{untaggedOnly ? '✓ !# UNTAGGED' : '!# OFF'}</span>
              </button>

              <span className="text-[11px] font-bold text-[#1b4d60] truncate">
                {bufferLabel} • Ref {referenceDate}
              </span>
            </div>

            <button
              type="button"
              onClick={openOptionsDialog}
              className="compact-inline-chip pogo-pill min-h-[30px] px-3 py-0.5 text-[11px] uppercase cursor-pointer shrink-0 inline-flex items-center gap-1"
            >
              <span aria-hidden="true">⚙️</span>
              <span>AGE OPTIONS</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tab Panels Container — each panel manages its own focused controller */}
      <div className="px-3 sm:px-5">
        <div
          id={`${tabBaseId}-panel-events-db`}
          ref={panelBeforeMatchRefs['events-db']}
          role="tabpanel"
          aria-labelledby={`${tabBaseId}-tab-events-db`}
          hidden={activeSubTab !== 'events-db' ? 'until-found' : undefined}
        >
          <EventsArchivePanel
            referenceDate={referenceDate}
            bufferMode={bufferMode}
            untaggedOnly={untaggedOnly}
            onLoadSearchString={onLoadSearchString}
            onSelectSpeciesInGrid={onSelectSpeciesInGrid}
          />
        </div>

        <div
          id={`${tabBaseId}-panel-year-slicer`}
          ref={panelBeforeMatchRefs['year-slicer']}
          role="tabpanel"
          aria-labelledby={`${tabBaseId}-tab-year-slicer`}
          hidden={activeSubTab !== 'year-slicer' ? 'until-found' : undefined}
        >
          <YearSlicerPanel
            referenceDate={referenceDate}
            bufferMode={bufferMode}
            untaggedOnly={untaggedOnly}
            tagMap={tagMap}
            onLoadSearchString={onLoadSearchString}
          />
        </div>

        <div
          id={`${tabBaseId}-panel-community-days`}
          ref={panelBeforeMatchRefs['community-days']}
          role="tabpanel"
          aria-labelledby={`${tabBaseId}-tab-community-days`}
          hidden={activeSubTab !== 'community-days' ? 'until-found' : undefined}
        >
          <CommunityDaysPanel
            untaggedOnly={untaggedOnly}
            tagMap={tagMap}
            onLoadSearchString={onLoadSearchString}
            onSelectSpeciesInGrid={onSelectSpeciesInGrid}
          />
        </div>

        <div
          id={`${tabBaseId}-panel-meta-sync`}
          ref={panelBeforeMatchRefs['meta-sync']}
          role="tabpanel"
          aria-labelledby={`${tabBaseId}-tab-meta-sync`}
          hidden={activeSubTab !== 'meta-sync' ? 'until-found' : undefined}
        >
          <MetaExplorerPanel
            pokemonList={pokemonList}
            untaggedOnly={untaggedOnly}
          />
        </div>

        <div
          id={`${tabBaseId}-panel-cnf-combiner`}
          ref={panelBeforeMatchRefs['cnf-combiner']}
          role="tabpanel"
          aria-labelledby={`${tabBaseId}-tab-cnf-combiner`}
          hidden={activeSubTab !== 'cnf-combiner' ? 'until-found' : undefined}
        >
          <CnfCombinerPanel
            untaggedOnly={untaggedOnly}
            onLoadSearchString={onLoadSearchString}
          />
        </div>
      </div>

      <AgeOptionsDialog
        optionsDialogRef={optionsDialogRef}
        optionsHeadingId={optionsHeadingId}
        untaggedOnly={untaggedOnly}
        setUntaggedOnly={setUntaggedOnly}
        referenceDate={referenceDate}
        setReferenceDate={setReferenceDate}
        bufferMode={bufferMode}
        setBufferMode={setBufferMode}
      />
    </div>
  );
}

export default React.memo(EventsHubView);
