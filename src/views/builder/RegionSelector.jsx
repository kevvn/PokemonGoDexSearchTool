import React, { useCallback, useMemo, useRef, useSyncExternalStore } from 'react';
import { activeRegionStore } from '../../models/pokedexModel';
import { REGIONS } from '../../models/searchEngine';

function getScrollBehavior() {
  if (
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
  ) {
    return 'auto';
  }
  return 'smooth';
}

function centerPillInContainer(pillEl) {
  if (!pillEl || typeof requestAnimationFrame !== 'function') return undefined;
  const rafId = requestAnimationFrame(() => {
    const container = pillEl.parentElement;
    if (!container) return;
    const scrollLeft = pillEl.offsetLeft - container.offsetWidth / 2 + pillEl.offsetWidth / 2;
    container.scrollTo({ left: scrollLeft, behavior: getScrollBehavior() });
  });
  return () => cancelAnimationFrame(rafId);
}

function RegionSelector({
  regions = REGIONS,
  selectedIds,
  pokemonList,
  activeRegion: activeRegionProp,
  handleRegionSelection,
}) {
  const scrollContainerRef = useRef(null);
  const storeActiveRegion = useSyncExternalStore(
    activeRegionStore.subscribe,
    activeRegionStore.getSnapshot,
    activeRegionStore.getServerSnapshot
  );
  const activeRegion = activeRegionProp || storeActiveRegion;

  const orderedRegions = useMemo(() => {
    const present = new Set(regions);
    const ordered = REGIONS.filter((r) => present.has(r));
    regions.forEach((r) => {
      if (!ordered.includes(r)) ordered.push(r);
    });
    return ordered;
  }, [regions]);

  const regionStats = useMemo(() => {
    const stats = {};
    orderedRegions.forEach((r) => {
      stats[r] = { total: 0, selected: 0 };
    });

    pokemonList.forEach((p) => {
      if (stats[p.region]) {
        stats[p.region].total++;
        if (selectedIds.has(p.id)) {
          stats[p.region].selected++;
        }
      }
    });
    return stats;
  }, [orderedRegions, selectedIds, pokemonList]);

  const scrollToRegion = (region) => {
    const el = document.getElementById(`region-${region}`);
    if (el) {
      const offset = 175;
      const elementPosition = el.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - offset;
      window.scrollTo({
        top: offsetPosition,
        behavior: getScrollBehavior(),
      });
    }
  };

  const handleScrollLeft = useCallback(() => {
    scrollContainerRef.current?.scrollBy({ left: -240, behavior: getScrollBehavior() });
  }, []);

  const handleScrollRight = useCallback(() => {
    scrollContainerRef.current?.scrollBy({ left: 240, behavior: getScrollBehavior() });
  }, []);

  const onSelectAllToggle = (region, shouldSelect) => {
    if (pokemonList && handleRegionSelection) {
      const regionPokemonIds = pokemonList.filter((p) => p.region === region).map((p) => p.id);
      handleRegionSelection(regionPokemonIds, shouldSelect);
    }
  };

  return (
    <nav aria-label="Region quick navigation" className="relative group">
      <button
        type="button"
        onClick={handleScrollLeft}
        aria-label="Scroll regions left"
        className="hidden md:flex pogo-circle-btn absolute left-1 top-1/2 -translate-y-1/2 z-40 w-7 h-7 opacity-0 group-hover:opacity-100 transition-opacity font-black text-sm"
      >
        ‹
      </button>

      <button
        type="button"
        onClick={handleScrollRight}
        aria-label="Scroll regions right"
        className="hidden md:flex pogo-circle-btn absolute right-1 top-1/2 -translate-y-1/2 z-40 w-7 h-7 opacity-0 group-hover:opacity-100 transition-opacity font-black text-sm"
      >
        ›
      </button>

      <div
        ref={scrollContainerRef}
        className="flex overflow-x-auto py-1 gap-2 no-scrollbar max-w-7xl mx-auto md:px-6 scroll-smooth"
      >
        {orderedRegions.map((region) => {
          const stats = regionStats[region] || { total: 0, selected: 0 };
          const hasSelected = stats.selected > 0;
          const isAllSelected = stats.selected === stats.total && stats.total > 0;
          const isActive = region === activeRegion;

          return (
            <div
              key={region}
              ref={isActive ? centerPillInContainer : undefined}
              data-region={region}
              className="flex flex-col items-center shrink-0"
            >
              <button
                type="button"
                onClick={() => scrollToRegion(region)}
                aria-current={isActive ? 'true' : undefined}
                aria-label={`${region} region: ${stats.selected} of ${stats.total} species selected`}
                className={`flex items-center gap-2 px-3.5 py-1.5 text-xs uppercase cursor-pointer ${
                  isActive ? 'pogo-pill-active' : 'pogo-pill'
                }`}
              >
                <span className="font-extrabold tracking-wider">{region}</span>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-white/22 text-white'
                      : isAllSelected
                        ? 'bg-[#1d7a4d] text-white'
                        : hasSelected
                          ? 'bg-[#d5effa] text-[#0b698e]'
                          : 'bg-[#e6f6fc] text-[#285d72]'
                  }`}
                >
                  {hasSelected ? `${stats.selected}/${stats.total}` : stats.total}
                </span>
              </button>

              {isActive && (
                <div className="md:hidden mt-1 flex justify-center w-full select-none">
                  {!isAllSelected ? (
                    <button
                      type="button"
                      onClick={() => onSelectAllToggle(region, true)}
                      aria-label={`Select all ${region} Pokémon`}
                      className="compact-inline-chip text-[9px] bg-white/95 text-[#0b698e] border border-[#0d7da8]/30 py-0.5 px-2.5 rounded-full font-extrabold uppercase tracking-wider shadow-2xs cursor-pointer"
                    >
                      Select All
                    </button>
                  ) : hasSelected ? (
                    <button
                      type="button"
                      onClick={() => onSelectAllToggle(region, false)}
                      aria-label={`Deselect all ${region} Pokémon`}
                      className="compact-inline-chip text-[9px] bg-rose-600 text-white py-0.5 px-2.5 rounded-full font-extrabold uppercase tracking-wider shadow-2xs cursor-pointer"
                    >
                      Clear
                    </button>
                  ) : null}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
}

export default React.memo(RegionSelector);
