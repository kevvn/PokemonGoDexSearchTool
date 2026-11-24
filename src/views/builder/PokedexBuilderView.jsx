import React, { useCallback, useSyncExternalStore } from 'react';
import { usePokedexBuilderController } from '../../controllers/usePokedexBuilderController';
import FilterPanel from './FilterPanel';
import PokemonGrid from './PokemonGrid';

const DESKTOP_MEDIA_QUERY = '(min-width: 1024px)';

function subscribeDesktopViewport(callback) {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return () => {};
  }
  const mql = window.matchMedia(DESKTOP_MEDIA_QUERY);
  mql.addEventListener('change', callback);
  return () => mql.removeEventListener('change', callback);
}

function getDesktopViewportSnapshot() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return true;
  }
  return window.matchMedia(DESKTOP_MEDIA_QUERY).matches;
}

function getDesktopViewportServerSnapshot() {
  return true;
}

function PokedexBuilderView({
  pokemonList,
  metaSnapshot,
  selectedIds,
  filters,
  isFilterModalOpen,
  togglePokemon,
  selectRegionBatch,
  replaceSelection,
  invertSelection,
  updateFilters,
  applyFilterQuery,
  openFilterDrawer,
  closeFilterDrawer,
}) {
  const gridController = usePokedexBuilderController({
    pokemonList,
    selectedIds,
    filters,
    togglePokemon,
    handleRegionSelection: selectRegionBatch,
    onReplaceSelection: replaceSelection,
  });

  const isDesktop = useSyncExternalStore(
    subscribeDesktopViewport,
    getDesktopViewportSnapshot,
    getDesktopViewportServerSnapshot
  );

  const isMobileDrawerHidden = !isDesktop && !isFilterModalOpen;

  const handleDrawerKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape' && isFilterModalOpen && !isDesktop) {
        e.preventDefault();
        closeFilterDrawer();
      }
    },
    [isFilterModalOpen, isDesktop, closeFilterDrawer]
  );

  return (
    <main className="flex-1 flex flex-col lg:flex-row max-w-7xl mx-auto w-full relative">
      {isFilterModalOpen && !isDesktop && (
        <div
          className="fixed inset-0 bg-[#08344a]/45 backdrop-blur-xs z-[50] lg:hidden transition-opacity overscroll-contain"
          onClick={closeFilterDrawer}
          aria-hidden="true"
        />
      )}

      <aside
        role={!isDesktop && isFilterModalOpen ? 'dialog' : undefined}
        aria-modal={!isDesktop && isFilterModalOpen ? 'true' : undefined}
        aria-label="Pokédex Filter By Controls"
        aria-hidden={isMobileDrawerHidden || undefined}
        inert={isMobileDrawerHidden || undefined}
        onKeyDown={handleDrawerKeyDown}
        className={`
          fixed inset-y-0 left-0 z-[60] w-full max-w-sm transform transition-transform duration-300 ease-in-out overflow-y-auto overscroll-contain shadow-2xl
          ${isFilterModalOpen ? 'translate-x-0 visible' : '-translate-x-full invisible pointer-events-none'}
          lg:visible lg:pointer-events-auto lg:translate-x-0 lg:static lg:w-[340px] lg:h-[calc(100dvh-132px)] lg:sticky lg:top-[116px] lg:overflow-y-auto lg:z-20 lg:shadow-none lg:py-4 lg:pl-4
        `}
      >
        <FilterPanel
          filters={filters}
          setFilters={updateFilters}
          pokemonList={pokemonList}
          onClose={closeFilterDrawer}
          handleInvertSelection={invertSelection}
          onApplyQuery={applyFilterQuery}
        />
      </aside>

      <div className="flex-1 min-w-0 overflow-x-clip">
        <PokemonGrid
          pokemonList={pokemonList}
          metaSnapshot={metaSnapshot}
          selectedIds={selectedIds}
          handleRegionSelection={selectRegionBatch}
          filters={filters}
          setFilters={updateFilters}
          onOpenFilters={openFilterDrawer}
          controller={gridController}
        />
      </div>
    </main>
  );
}

export default React.memo(PokedexBuilderView);
