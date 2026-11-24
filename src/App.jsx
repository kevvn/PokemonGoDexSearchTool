import React, { Suspense, useMemo, useSyncExternalStore } from 'react';
import pokemonData from './data/pokedex.json';
import { getActiveMetaSnapshot, metaCacheStore } from './models/metaCacheModel';
import { usePwaController } from './controllers/usePwaController';
import { useTagSummaryController } from './controllers/useTagSystemController';
import { useWorkspaceController } from './controllers/useWorkspaceController';
import SearchStringDock from './views/dock/SearchStringDock';
import AppHeader from './views/layout/AppHeader';
import ErrorBoundary from './views/shared/ErrorBoundary';
import TriageFunnelsView from './views/triage/TriageFunnelsView';

const EventsHubView = React.lazy(() => import('./views/events/EventsHubView'));
const TagSystemView = React.lazy(() => import('./views/tags/TagSystemView'));
const PokedexBuilderView = React.lazy(() => import('./views/builder/PokedexBuilderView'));

const EMPTY_RAW_CLAUSES = [];

function TabLoadingFallback({ label }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="max-w-4xl mx-auto my-8 p-6 pogo-glass-card text-center text-xs font-extrabold uppercase tracking-wider text-[#0b698e]"
    >
      Loading {label}…
    </div>
  );
}

function App() {
  const workspace = useWorkspaceController(pokemonData);
  const tagSummary = useTagSummaryController();
  const pwa = usePwaController();
  const metaCache = useSyncExternalStore(
    metaCacheStore.subscribe,
    metaCacheStore.getSnapshot,
    metaCacheStore.getServerSnapshot
  );

  const activeMetaSnapshot = useMemo(
    () => getActiveMetaSnapshot(metaCache),
    [metaCache]
  );

  const dockRawClauses =
    workspace.activeTab === 'builder' && !workspace.isCustomDock
      ? workspace.filters.rawClauses || EMPTY_RAW_CLAUSES
      : EMPTY_RAW_CLAUSES;

  return (
    <div className="mwg-touch-scope min-h-screen flex flex-col font-sans bg-[#bfeaf6] text-[#123c4d]">
      <AppHeader
        activeTab={workspace.activeTab}
        selectedIds={workspace.selectedIds}
        pokemonList={pokemonData}
        tagErrors={tagSummary.errorCount}
        tagWarnings={tagSummary.warningCount}
        pwa={pwa}
        onSelectTab={workspace.selectTab}
        onSelectRegionBatch={workspace.selectRegionBatch}
      />

      <ErrorBoundary key={workspace.activeTab} title="This panel hit an unexpected error">
        {workspace.activeTab === 'triage' && (
          <main className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-5 py-4 sm:py-5">
            <TriageFunnelsView
              metaSnapshot={activeMetaSnapshot}
              customTagMap={tagSummary.tagMap}
              onLoadQuery={workspace.loadQueryFromTriage}
            />
          </main>
        )}

        {workspace.activeTab === 'events' && (
          <main className="flex-1 w-full">
            <Suspense fallback={<TabLoadingFallback label="Events & Trips" />}>
              <EventsHubView
                pokemonList={pokemonData}
                customTagMap={tagSummary.tagMap}
                onLoadSearchString={workspace.loadEventStringToDock}
                onSelectSpeciesInGrid={workspace.selectSpeciesInBuilder}
              />
            </Suspense>
          </main>
        )}

        {workspace.activeTab === 'tags' && (
          <main className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-5 py-4 sm:py-5">
            <Suspense fallback={<TabLoadingFallback label="Tag System" />}>
              <TagSystemView
                metaSnapshot={activeMetaSnapshot}
                onLoadQuery={workspace.loadQueryFromTriage}
              />
            </Suspense>
          </main>
        )}

        {workspace.activeTab === 'builder' && (
          <Suspense fallback={<TabLoadingFallback label="Pokédex Builder" />}>
            <PokedexBuilderView
              pokemonList={pokemonData}
              metaSnapshot={activeMetaSnapshot}
              selectedIds={workspace.selectedIds}
              filters={workspace.filters}
              isFilterModalOpen={workspace.isFilterModalOpen}
              togglePokemon={workspace.togglePokemon}
              selectRegionBatch={workspace.selectRegionBatch}
              replaceSelection={workspace.replaceSelection}
              invertSelection={workspace.invertSelection}
              updateFilters={workspace.updateFilters}
              applyFilterQuery={workspace.applyFilterQuery}
              openFilterDrawer={workspace.openFilterDrawer}
              closeFilterDrawer={workspace.closeFilterDrawer}
            />
          </Suspense>
        )}
      </ErrorBoundary>

      <SearchStringDock
        viewMode={workspace.activeTab}
        searchString={workspace.activeSearchString}
        selectedCount={workspace.selectedIds.size}
        rawClauses={dockRawClauses}
        onRemoveRawClause={workspace.removeRawClause}
        onClearSelection={workspace.clearSelection}
        onSearchUpdate={workspace.updateDockSearchString}
        onOpenFilters={workspace.openFilterDrawer}
      />
    </div>
  );
}

export default App;
