import React, { useMemo, useEffect, useRef, useCallback } from 'react';

function RegionSelector({ regions, selectedIds, pokemonList, activeRegion }) {
  const scrollContainerRef = useRef(null);

  // Auto-scroll the region selector to keep active region in view
  useEffect(() => {
    if (activeRegion && scrollContainerRef.current) {
      const activeEl = scrollContainerRef.current.querySelector(`[data-region="${activeRegion}"]`);
      if (activeEl) {
        const container = scrollContainerRef.current;
        const scrollLeft = activeEl.offsetLeft - container.offsetWidth / 2 + activeEl.offsetWidth / 2;
        container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
      }
    }
  }, [activeRegion]);

  // Calculate selection stats per region
  const regionStats = useMemo(() => {
    const stats = {};
    regions.forEach((r) => {
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
  }, [regions, selectedIds, pokemonList]);

  const scrollToRegion = (region) => {
    const el = document.getElementById(`region-${region}`);
    if (el) {
      const offset = 165;
      const elementPosition = el.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  const handleScrollLeft = useCallback(() => {
    scrollContainerRef.current?.scrollBy({ left: -240, behavior: 'smooth' });
  }, []);

  const handleScrollRight = useCallback(() => {
    scrollContainerRef.current?.scrollBy({ left: 240, behavior: 'smooth' });
  }, []);

  return (
    <nav aria-label="Region quick navigation" className="relative group">
      {/* Desktop Scroll Left Circular Button */}
      <button
        type="button"
        onClick={handleScrollLeft}
        aria-label="Scroll regions left"
        className="hidden md:flex pogo-circle-btn absolute left-1 top-1/2 -translate-y-1/2 z-40 w-7 h-7 opacity-0 group-hover:opacity-100 transition-opacity font-black text-sm"
      >
        ‹
      </button>

      {/* Desktop Scroll Right Circular Button */}
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
        {regions.map((region) => {
          const stats = regionStats[region] || { total: 0, selected: 0 };
          const hasSelected = stats.selected > 0;
          const isAllSelected = stats.selected === stats.total && stats.total > 0;
          const isActive = region === activeRegion;

          return (
            <div key={region} data-region={region} className="shrink-0">
              <button
                type="button"
                onClick={() => scrollToRegion(region)}
                aria-current={isActive ? 'true' : undefined}
                aria-label={`${region} region: ${stats.selected} of ${stats.total} species selected`}
                className={`flex items-center gap-2 px-3.5 py-1.5 min-h-[38px] text-xs uppercase cursor-pointer ${
                  isActive ? 'pogo-pill-active' : 'pogo-pill'
                }`}
              >
                <span className="font-extrabold tracking-wider">{region}</span>

                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-white/22 text-white'
                      : isAllSelected
                        ? 'bg-[#0d7da8] text-white'
                        : hasSelected
                          ? 'bg-[#d5effa] text-[#0b698e]'
                          : 'bg-[#e6f6fc] text-[#285d72]'
                  }`}
                >
                  {hasSelected ? `${stats.selected}/${stats.total}` : stats.total}
                </span>
              </button>
            </div>
          );
        })}
      </div>
    </nav>
  );
}

export default React.memo(RegionSelector);
