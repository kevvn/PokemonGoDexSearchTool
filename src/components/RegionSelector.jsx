import React, { useMemo, useEffect, useRef, useCallback } from 'react';

// Regional Generation Roman Numerals
const REGION_GENS = {
  Kanto: 'GEN I',
  Johto: 'GEN II',
  Hoenn: 'GEN III',
  Sinnoh: 'GEN IV',
  Unova: 'GEN V',
  Kalos: 'GEN VI',
  Alola: 'GEN VII',
  Galar: 'GEN VIII',
  Paldea: 'GEN IX'
};

function RegionSelector({ regions, selectedIds, pokemonList, activeRegion, handleRegionSelection }) {
  const scrollContainerRef = useRef(null);

  // Auto-scroll the region selector to keep active region in view
  useEffect(() => {
    if (activeRegion && scrollContainerRef.current) {
      const activeEl = scrollContainerRef.current.querySelector(`[data-region="${activeRegion}"]`);
      if (activeEl) {
        const container = scrollContainerRef.current;
        const scrollLeft = activeEl.offsetLeft - (container.offsetWidth / 2) + (activeEl.offsetWidth / 2);
        container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
      }
    }
  }, [activeRegion]);

  // Calculate selection stats per region
  const regionStats = useMemo(() => {
    const stats = {};
    regions.forEach(r => {
      stats[r] = { total: 0, selected: 0 };
    });
    
    pokemonList.forEach(p => {
      if (stats[p.region]) {
        stats[p.region].total++;
        if (selectedIds.has(p.id)) {
          stats[p.region].selected++;
        }
      }
    });
    return stats;
  }, [regions, selectedIds, pokemonList]);

  const scrollToRegion = (region) => {
    const el = document.getElementById(`region-${region}`);
    if (el) {
      const offset = 180; // Sticky header offset
      const elementPosition = el.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const handleScrollLeft = useCallback(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -240, behavior: 'smooth' });
    }
  }, []);

  const handleScrollRight = useCallback(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 240, behavior: 'smooth' });
    }
  }, []);

  const onSelectAllToggle = (region, shouldSelect) => {
    if (pokemonList && handleRegionSelection) {
      const regionPokemonIds = pokemonList.filter(p => p.region === region).map(p => p.id);
      handleRegionSelection(regionPokemonIds, shouldSelect);
    }
  };

  return (
    <nav aria-label="Region quick navigation" className="bg-[#1b7a69] border-t border-white/10 z-30 sticky top-[68px] relative group shadow-sm">
      {/* Desktop Scroll Left Button */}
      <button
        onClick={handleScrollLeft}
        aria-label="Scroll regions left"
        className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 z-40 w-7 h-7 items-center justify-center rounded-full bg-white text-teal-800 shadow-md hover:bg-teal-50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer font-black text-sm"
      >
        ‹
      </button>

      {/* Desktop Scroll Right Button */}
      <button
        onClick={handleScrollRight}
        aria-label="Scroll regions right"
        className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 z-40 w-7 h-7 items-center justify-center rounded-full bg-white text-teal-800 shadow-md hover:bg-teal-50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer font-black text-sm"
      >
        ›
      </button>

      <div 
        ref={scrollContainerRef} 
        className="flex overflow-x-auto p-2.5 gap-2 no-scrollbar max-w-7xl mx-auto px-4 md:px-8 scroll-smooth"
      >
        {regions.map(region => {
          const stats = regionStats[region] || { total: 0, selected: 0 };
          const hasSelected = stats.selected > 0;
          const isAllSelected = stats.selected === stats.total && stats.total > 0;
          const isActive = region === activeRegion;
          const genLabel = REGION_GENS[region] || 'REGION';

          return (
            <div 
              key={region} 
              data-region={region} 
              className="flex flex-col items-center shrink-0"
            >
              <button
                onClick={() => scrollToRegion(region)}
                aria-current={isActive ? 'true' : undefined}
                aria-label={`${region} region: ${stats.selected} of ${stats.total} species selected`}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full group/btn transition-all duration-150 border cursor-pointer shadow-xs ${
                  isActive
                    ? 'bg-white text-[#1b7a69] border-white shadow-md font-black scale-105'
                    : isAllSelected
                      ? 'bg-[#145d50] border-teal-300/40 text-white hover:bg-[#186a5b]'
                      : hasSelected
                        ? 'bg-[#166456] border-teal-300/30 text-white hover:bg-[#1a7162]'
                        : 'bg-[#155b4e]/80 border-transparent text-teal-100 hover:bg-[#186a5b] hover:text-white'
                }`}
              >
                {/* Gen Badge */}
                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-widest ${
                  isActive
                    ? 'bg-[#1b7a69] text-white'
                    : 'bg-black/20 text-teal-100'
                }`}>
                  {genLabel}
                </span>

                {/* Region name */}
                <span className="text-xs font-black uppercase tracking-wider">
                  {region}
                </span>
                
                {/* Count badge */}
                <span className={`text-[10px] font-black px-1.5 rounded-full ${
                  isActive
                    ? 'bg-amber-400 text-slate-900'
                    : hasSelected
                      ? 'bg-teal-300 text-teal-950 font-black'
                      : 'text-teal-200'
                }`}>
                  {hasSelected ? `${stats.selected}/${stats.total}` : stats.total}
                </span>
              </button>

              {/* Mobile Quick Select All */}
              {isActive && (
                <div className="md:hidden mt-1.5 flex justify-center w-full select-none animate-float">
                  {!isAllSelected ? (
                    <button
                      onClick={() => onSelectAllToggle(region, true)}
                      aria-label={`Select all ${region} Pokémon`}
                      className="text-[9px] bg-white text-[#1b7a69] border border-teal-200 py-0.5 px-2.5 rounded-full font-black uppercase tracking-wider shadow-sm cursor-pointer"
                    >
                      Select All
                    </button>
                  ) : hasSelected ? (
                    <button
                      onClick={() => onSelectAllToggle(region, false)}
                      aria-label={`Deselect all ${region} Pokémon`}
                      className="text-[9px] bg-rose-500 text-white py-0.5 px-2.5 rounded-full font-black uppercase tracking-wider shadow-sm cursor-pointer"
                    >
                      Deselect
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
