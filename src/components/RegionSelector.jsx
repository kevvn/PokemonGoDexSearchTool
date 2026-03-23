import React, { useEffect, useRef } from 'react';

function RegionSelector({ regions, activeRegion, handleRegionSelection, pokemonData, selectedIds }) {
  const scrollContainerRef = useRef(null);

  // Auto-scroll the region selector to keep active region in view
  useEffect(() => {
    if (activeRegion && scrollContainerRef.current) {
      const activeEl = scrollContainerRef.current.querySelector(`[data-region="${activeRegion}"]`);
      if (activeEl) {
        // Scroll active element to center of container
        const container = scrollContainerRef.current;
        const scrollLeft = activeEl.offsetLeft - (container.offsetWidth / 2) + (activeEl.offsetWidth / 2);
        container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
      }
    }
  }, [activeRegion]);

  const scrollToRegion = (region) => {
    const el = document.getElementById(`region-${region}`);
    if (el) {
      const offset = 180; // Adjust for sticky header height
      const elementPosition = el.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const onSelectAllToggle = (region, shouldSelect) => {
    if (pokemonData && handleRegionSelection) {
      const regionPokemonIds = pokemonData.filter(p => p.region === region).map(p => p.id);
      handleRegionSelection(regionPokemonIds, shouldSelect);
    }
  };

  return (
    <div className="bg-white/95 backdrop-blur z-30 shadow-sm border-b border-gray-200">
      <div ref={scrollContainerRef} className="flex overflow-x-auto p-3 gap-3 no-scrollbar max-w-7xl mx-auto px-4 md:px-6 scroll-smooth">
        {regions.map(region => {
          const isActive = region === activeRegion;

          // Calculate selection state for the active region to show appropriate select/deselect button
          let isAllSelected = false;
          let isSomeSelected = false;
          if (isActive && pokemonData && selectedIds) {
            const regionPokemonIds = pokemonData.filter(p => p.region === region).map(p => p.id);
            const selectedCount = regionPokemonIds.filter(id => selectedIds.has(id)).length;
            isAllSelected = selectedCount === regionPokemonIds.length && regionPokemonIds.length > 0;
            isSomeSelected = selectedCount > 0;
          }

          return (
            <div key={region} data-region={region} className="flex flex-col items-center min-w-[70px] shrink-0">
              <button
                onClick={() => scrollToRegion(region)}
                className="flex flex-col items-center group focus:outline-none"
              >
                <div className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all shadow-sm
                  ${isActive
                    ? 'bg-blue-100 border-blue-500 ring-2 ring-blue-300'
                    : 'bg-gray-50 border-gray-200 group-hover:bg-blue-50 group-hover:border-blue-300'}`}
                >
                  <span className={`text-sm font-bold transition-colors
                    ${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-500'}`}
                  >
                    {region.substring(0, 2).toUpperCase()}
                  </span>
                </div>
                <span className={`text-[10px] font-bold mt-1 uppercase tracking-wide transition-colors
                  ${isActive ? 'text-blue-600' : 'text-gray-500 group-hover:text-blue-600'}`}
                >
                  {region}
                </span>
              </button>

              {/* Mobile Select/Deselect All button (only visible for active region on mobile) */}
              {isActive && (
                <div className="md:hidden mt-1 flex justify-center w-full">
                  {!isAllSelected ? (
                    <button
                      onClick={() => onSelectAllToggle(region, true)}
                      className="text-[9px] bg-gray-100 hover:bg-gray-200 text-gray-600 py-0.5 px-2 rounded-full font-medium shadow-sm transition-colors whitespace-nowrap"
                    >
                      Select All
                    </button>
                  ) : isSomeSelected ? (
                    <button
                      onClick={() => onSelectAllToggle(region, false)}
                      className="text-[9px] bg-blue-100 hover:bg-blue-200 text-blue-700 py-0.5 px-2 rounded-full font-medium shadow-sm transition-colors whitespace-nowrap"
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
