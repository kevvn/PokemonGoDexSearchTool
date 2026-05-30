import React, { useMemo } from 'react';

function RegionSelector({ regions, selectedIds, pokemonList }) {
  
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
      // Offset for our sticky header height which will be around 170px
      const offset = 180; 
      const elementPosition = el.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="bg-slate-900/90 backdrop-blur-md z-30 border-b border-slate-800/80 sticky top-[72px]">
      <div className="flex overflow-x-auto p-3.5 gap-3.5 no-scrollbar max-w-7xl mx-auto px-4 md:px-6 scroll-smooth">
        {regions.map(region => {
          const stats = regionStats[region] || { total: 0, selected: 0 };
          const hasSelected = stats.selected > 0;
          const isAllSelected = stats.selected === stats.total && stats.total > 0;

          return (
            <button
              key={region}
              onClick={() => scrollToRegion(region)}
              className="flex items-center gap-2.5 px-4 py-2 rounded-xl group shrink-0 transition-all duration-200 bg-slate-950/40 border border-slate-800/50 hover:bg-slate-800/60 hover:border-slate-700/80 hover:scale-[1.03] active:scale-[0.98]"
            >
              {/* Badge Icon representing Region */}
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs transition-all duration-300 ${
                isAllSelected
                  ? 'bg-emerald-500/20 border border-emerald-500 text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                  : hasSelected
                    ? 'bg-blue-500/20 border border-blue-500 text-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.3)]'
                    : 'bg-slate-800 border border-slate-700/60 text-slate-400 group-hover:text-slate-200'
              }`}>
                {region.substring(0, 2).toUpperCase()}
              </div>

              {/* Region details */}
              <div className="flex flex-col items-start select-none">
                <span className="text-xs font-bold text-slate-300 group-hover:text-white uppercase tracking-wider transition-colors">
                  {region}
                </span>
                
                {/* Dynamic selected indicator counts */}
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
          );
        })}
      </div>
    </div>
  );
}

export default React.memo(RegionSelector);
