import React from 'react';

function RegionSelector({ regions }) {
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

  return (
    <div className="bg-white/95 backdrop-blur z-30 shadow-sm border-b border-gray-200">
      <div className="flex overflow-x-auto p-3 gap-3 no-scrollbar max-w-7xl mx-auto px-4 md:px-6">
        {regions.map(region => (
          <button
            key={region}
            onClick={() => scrollToRegion(region)}
            className="flex flex-col items-center min-w-[70px] group shrink-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            <div className="w-10 h-10 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center group-hover:bg-blue-50 group-hover:border-blue-300 transition-all shadow-sm">
               {/* Simple initial based icon */}
              <span className="text-sm font-bold text-gray-400 group-hover:text-blue-500">
                {region.substring(0, 2).toUpperCase()}
              </span>
            </div>
            <span className="text-[10px] font-bold mt-1 text-gray-500 group-hover:text-blue-600 uppercase tracking-wide">
              {region}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default React.memo(RegionSelector);
