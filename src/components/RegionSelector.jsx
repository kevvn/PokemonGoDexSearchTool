import React, { useMemo, useEffect, useRef } from 'react';

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

  const onSelectAllToggle = (region, shouldSelect) => {
    if (pokemonList && handleRegionSelection) {
      const regionPokemonIds = pokemonList.filter(p => p.region === region).map(p => p.id);
      handleRegionSelection(regionPokemonIds, shouldSelect);
    }
  };

  return (
    <div className="bg-slate-900/90 backdrop-blur-md z-30 border-b border-slate-800/80 sticky top-[72px]">
      <div 
        ref={scrollContainerRef} 
        className="flex overflow-x-auto p-3.5 gap-3.5 no-scrollbar max-w-7xl mx-auto px-4 md:px-6 scroll-smooth"
      >
        {regions.map(region => {
          const stats = regionStats[region] || { total: 0, selected: 0 };
          const hasSelected = stats.selected > 0;
          const isAllSelected = stats.selected === stats.total && stats.total > 0;
          const isActive = region === activeRegion;

          return (
            <div 
              key={region} 
              data-region={region} 
              className="flex flex-col items-center shrink-0"
            >
              <button
                onClick={() => scrollToRegion(region)}
                className={`flex items-center gap-2.5 px-4 py-2 rounded-xl group transition-all duration-200 border hover:scale-[1.03] active:scale-[0.98] ${
                  isActive
                    ? 'bg-blue-500/10 border-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.25)]'
                    : isAllSelected
                      ? 'bg-emerald-500/5 border-emerald-500/50 hover:bg-slate-800/60'
                      : hasSelected
                        ? 'bg-blue-500/5 border-blue-500/40 hover:bg-slate-800/60'
                        : 'bg-slate-950/40 border-slate-800/50 hover:bg-slate-800/60 hover:border-slate-700/80'
                }`}
              >
                {/* Badge Icon */}
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs transition-all duration-300 ${
                  isActive
                    ? 'bg-blue-500 text-slate-950 shadow-[0_0_8px_rgba(59,130,246,0.4)]'
                    : isAllSelected
                      ? 'bg-emerald-500/20 border border-emerald-500 text-emerald-400'
                      : hasSelected
                        ? 'bg-blue-500/20 border border-blue-500 text-blue-400'
                        : 'bg-slate-800 border border-slate-700/60 text-slate-400 group-hover:text-slate-200'
                }`}>
                  {region.substring(0, 2).toUpperCase()}
                </div>

                {/* Region details */}
                <div className="flex flex-col items-start select-none">
                  <span className={`text-xs font-bold uppercase tracking-wider transition-colors ${
                    isActive ? 'text-blue-400' : 'text-slate-300 group-hover:text-white'
                  }`}>
                    {region}
                  </span>
                  
                  {/* Selected count */}
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-[10px] font-semibold text-slate-500 group-hover:text-slate-400">
                      {stats.total} entries
                    </span>
                    {hasSelected && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                        isAllSelected 
                          ? 'bg-emerald-500/20 text-emerald-400' 
                          : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {stats.selected}
                      </span>
                    )}
                  </div>
                </div>
              </button>

              {/* Mobile Quick Select All (only visible under active region on mobile) */}
              {isActive && (
                <div className="md:hidden mt-2 flex justify-center w-full select-none animate-float">
                  {!isAllSelected ? (
                    <button
                      onClick={() => onSelectAllToggle(region, true)}
                      className="text-[9px] bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 py-1 px-3 rounded-full font-bold shadow-sm transition-colors whitespace-nowrap"
                    >
                      Select All
                    </button>
                  ) : hasSelected ? (
                    <button
                      onClick={() => onSelectAllToggle(region, false)}
                      className="text-[9px] bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 py-1 px-3 rounded-full font-bold shadow-sm transition-colors whitespace-nowrap"
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
    </div>
  );
}

export default React.memo(RegionSelector);
