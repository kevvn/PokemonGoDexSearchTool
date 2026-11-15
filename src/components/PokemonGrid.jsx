import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { areRegionPropsEqual } from '../utils/gridUtils';
import { getFamilyIds } from '../utils/familyUtils';

// Fallback Pokéball SVG data URL for broken sprite image handling
const FALLBACK_SPRITE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='45' fill='%23ff385c'/%3E%3Cpath d='M5 50h90A45 45 0 0 1 5 50' fill='%23f8fafc'/%3E%3Cpath d='M5 50h90' stroke='%23112d35' stroke-width='8'/%3E%3Ccircle cx='50' cy='50' r='16' fill='%23112d35'/%3E%3Ccircle cx='50' cy='50' r='10' fill='%23f8fafc'/%3E%3C/svg%3E";

const PokemonCard = React.memo(({ pokemon, selected, toggle, onSelectFamily }) => {
  const primaryType = pokemon.types[0] || 'normal';
  
  const handleFamilyClick = (e) => {
    e.stopPropagation();
    const familyIds = getFamilyIds(pokemon.id);
    onSelectFamily(familyIds);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggle(pokemon.id, e);
    }
  };

  const handleImageError = (e) => {
    e.currentTarget.onerror = null;
    e.currentTarget.src = FALLBACK_SPRITE;
  };

  // Format ID with leading zeros (e.g., #001, #025, #150)
  const formattedId = String(pokemon.id).padStart(3, '0');

  return (
    <div
      role="button"
      aria-pressed={selected}
      aria-label={`#${pokemon.id} ${pokemon.name}, ${pokemon.types.join(', ')}`}
      tabIndex={0}
      onClick={(e) => toggle(pokemon.id, e)}
      onKeyDown={handleKeyDown}
      className={`relative cursor-pointer rounded-3xl p-3 flex flex-col items-center select-none group/card focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
        selected ? 'pogo-card-selected' : 'pogo-card'
      }`}
    >
      {/* Pokédex ID and Family Shortcut */}
      <div className="flex justify-between w-full items-center mb-1 z-10">
        <span className="text-[11px] font-black text-slate-500 font-mono tracking-wider">
          #{formattedId}
        </span>
        
        <button
          onClick={handleFamilyClick}
          title={`Select entire evolution family for ${pokemon.name}`}
          aria-label={`Select evolution family for ${pokemon.name}`}
          className="opacity-0 group-hover/card:opacity-100 focus:opacity-100 text-[9px] bg-teal-50 hover:bg-teal-100 text-teal-800 hover:text-teal-900 font-black px-2 py-0.5 rounded-full border border-teal-200 transition-all cursor-pointer shadow-sm"
        >
          🍬 Family
        </button>
      </div>

      {/* Pokémon GO Spotlight Platform with Sprite */}
      <div className="relative w-24 h-24 flex items-center justify-center my-1">
        {/* Grassy / Circular Stage Pedestal */}
        <div className="pogo-pedestal" />
        
        {/* Soft Type Glow */}
        <div className={`absolute inset-0 rounded-full blur-xl opacity-15 group-hover/card:opacity-35 transition-opacity duration-300 bg-type-${primaryType}`}></div>
        
        <img
          src={pokemon.sprite}
          alt={pokemon.name}
          onError={handleImageError}
          className="w-20 h-20 object-contain rendering-pixelated relative z-10 drop-shadow-[0_4px_6px_rgba(0,40,30,0.25)] transition-transform duration-200 group-hover/card:scale-110"
          loading="lazy"
          width="80"
          height="80"
        />
      </div>

      {/* Name in Bold PoGo Style */}
      <div className="text-xs font-black capitalize text-slate-800 text-center truncate w-full px-1 mb-2 group-hover/card:text-teal-700 tracking-tight">
        {pokemon.name.replace(/-/g, ' ')}
      </div>

      {/* Pokémon GO Type Capsules */}
      <div className="flex gap-1 justify-center w-full mt-auto z-10">
        {pokemon.types.map(t => (
          <span
            key={t}
            className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full text-white shadow-sm border border-white/20 bg-type-${t} tracking-wider`}
          >
            {t.substring(0, 4)}
          </span>
        ))}
      </div>

      {/* Pokémon GO Selection Badge */}
      {selected && (
        <div className="absolute -top-1.5 -right-1.5 pokeball-badge shadow-md animate-float z-20">
          <div className="pokeball-badge-top" />
          <div className="pokeball-badge-bottom" />
          <div className="pokeball-badge-band" />
          <div className="pokeball-badge-center" />
        </div>
      )}
    </div>
  );
});

const RegionSection = React.memo(({ region, pokemons, selectedIds, togglePokemon, handleRegionSelection, isCollapsed, toggleCollapse, onSelectFamily }) => {
  const selectedCount = pokemons.filter(p => selectedIds.has(p.id)).length;
  const totalCount = pokemons.length;
  const allSelected = selectedCount === totalCount && totalCount > 0;
  const someSelected = selectedCount > 0;

  if (totalCount === 0) return null;

  return (
    <div 
      id={`region-${region}`} 
      className="scroll-mt-48 bg-white/70 rounded-3xl p-5 border border-teal-100 shadow-sm mb-8 region-section-optimized backdrop-blur-md"
      style={{ contentVisibility: 'auto', containIntrinsicSize: '0 500px' }}
    >
      {/* Region Section Header (Desktop) */}
      <div className="hidden md:flex items-center justify-between mb-6 pb-4 border-b border-teal-100">
        <div 
          className="flex items-center gap-3.5 cursor-pointer select-none group/title" 
          onClick={() => toggleCollapse(region)}
          role="button"
          tabIndex={0}
          aria-expanded={!isCollapsed}
          aria-controls={`region-grid-${region}`}
        >
          <div className="bg-gradient-to-b from-[#00d2b4] to-[#1b7a69] w-2 h-9 rounded-full shadow-[0_0_8px_rgba(0,210,180,0.5)]"></div>
          <div>
            <h2 className="text-lg font-black text-slate-800 tracking-wider uppercase flex items-center gap-2 group-hover/title:text-teal-700 transition-colors">
              {region}
              <span className={`transition-transform duration-300 text-teal-600 text-xs ${isCollapsed ? '-rotate-90' : 'rotate-0'}`}>
                ▼
              </span>
            </h2>
            <span className="text-[11px] font-bold text-slate-500 mt-0.5 block tracking-wide">
              <span className="text-teal-700 font-black">{selectedCount}</span> Selected / {totalCount} Species
            </span>
          </div>
        </div>

        {/* Region actions */}
        <div className="flex gap-2">
          {!allSelected && (
            <button
              onClick={() => handleRegionSelection(pokemons.map(p => p.id), true)}
              className="px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-200 bg-teal-50 hover:bg-teal-100 border border-teal-300 text-teal-800 cursor-pointer shadow-sm"
            >
              Select All
            </button>
          )}
          {someSelected && (
            <button
              onClick={() => handleRegionSelection(pokemons.map(p => p.id), false)}
              className="px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-200 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 cursor-pointer shadow-sm"
            >
              Deselect All
            </button>
          )}
        </div>
      </div>

      {/* Grid Container */}
      {!isCollapsed && (
        <div id={`region-grid-${region}`} className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3.5">
          {pokemons.map(p => (
            <PokemonCard
              key={p.id}
              pokemon={p}
              selected={selectedIds.has(p.id)}
              toggle={togglePokemon}
              onSelectFamily={onSelectFamily}
            />
          ))}
        </div>
      )}
    </div>
  );
}, areRegionPropsEqual);

function PokemonGrid({ 
  pokemonList, 
  selectedIds, 
  togglePokemon, 
  handleRegionSelection,
  searchQuery,
  setSearchQuery,
  selectedOnly,
  setSelectedOnly,
  onRegionVisible,
  onOpenFilters
}) {
  const [collapsedRegions, setCollapsedRegions] = useState({});
  const lastClickedId = useRef(null);

  // Keep refs to avoid recreating handlers when dependencies update
  const visibleListRef = useRef([]);
  const selectedIdsRef = useRef(selectedIds);

  useEffect(() => {
    selectedIdsRef.current = selectedIds;
  }, [selectedIds]);

  // Group and Filter Pokémon
  const { groupedRegions, visibleList } = useMemo(() => {
    const grouped = {};
    const visible = [];
    const query = searchQuery.toLowerCase().trim();

    pokemonList.forEach(p => {
      // 1. Text search filter
      const matchesSearch = 
        !query ||
        p.name.toLowerCase().includes(query) ||
        p.id.toString() === query ||
        p.types.some(t => t.toLowerCase().includes(query));

      // 2. Selected only filter
      const matchesSelected = !selectedOnly || selectedIds.has(p.id);

      if (matchesSearch && matchesSelected) {
        if (!grouped[p.region]) grouped[p.region] = [];
        grouped[p.region].push(p);
        visible.push(p);
      }
    });

    return { groupedRegions: grouped, visibleList: visible };
  }, [pokemonList, searchQuery, selectedOnly, selectedIds]);

  useEffect(() => {
    visibleListRef.current = visibleList;
  }, [visibleList]);

  const toggleCollapse = useCallback((region) => {
    setCollapsedRegions(prev => ({
      ...prev,
      [region]: !prev[region]
    }));
  }, []);

  const handleSelectFamily = useCallback((familyIds) => {
    handleRegionSelection(familyIds, true);
  }, [handleRegionSelection]);

  // Stable card toggle handler with Shift + Click range support
  const handleToggleCard = useCallback((id, event) => {
    if (event && event.shiftKey && lastClickedId.current !== null && lastClickedId.current !== id) {
      const currentVisible = visibleListRef.current;
      const idx1 = currentVisible.findIndex(p => p.id === lastClickedId.current);
      const idx2 = currentVisible.findIndex(p => p.id === id);

      if (idx1 !== -1 && idx2 !== -1) {
        const start = Math.min(idx1, idx2);
        const end = Math.max(idx1, idx2);
        const rangeIds = currentVisible.slice(start, end + 1).map(p => p.id);
        
        const targetSelection = selectedIdsRef.current.has(lastClickedId.current);
        handleRegionSelection(rangeIds, targetSelection);
        
        lastClickedId.current = id;
        return;
      }
    }
    
    togglePokemon(id);
    lastClickedId.current = id;
  }, [togglePokemon, handleRegionSelection]);

  // Use IntersectionObserver to track visible regions and update headers
  useEffect(() => {
    if (!onRegionVisible) return;

    const observerOptions = {
      root: null,
      rootMargin: '-200px 0px -50% 0px',
      threshold: 0
    };

    const handleIntersect = (entries) => {
      const intersectingEntry = entries.find(entry => entry.isIntersecting);
      if (intersectingEntry) {
        const regionId = intersectingEntry.target.id;
        const regionName = regionId.replace('region-', '');
        onRegionVisible(regionName);
      }
    };

    const observer = new IntersectionObserver(handleIntersect, observerOptions);

    const regionElements = document.querySelectorAll('.region-section-optimized');
    regionElements.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, [groupedRegions, onRegionVisible]);

  return (
    <div className="space-y-6 pb-36 px-4 md:px-6 max-w-7xl mx-auto mt-4">
      
      {/* Pokémon GO Style Search & Control Bar */}
      <div className="bg-white/95 rounded-3xl p-4 md:p-5 flex flex-col md:flex-row items-center gap-4 justify-between shadow-lg border border-teal-100 backdrop-blur-md">
        
        {/* Capsule Search Input */}
        <div className="relative w-full md:max-w-md">
          <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-teal-600">
            <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search Pokémon by Name, Dex #, or Type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search Pokémon by Name, Dex Number, or Type"
            className="w-full pl-11 pr-10 py-2.5 rounded-full bg-slate-50 border border-teal-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-400/20 transition-all font-semibold shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              aria-label="Clear search input"
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 font-bold cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
          
          {/* Quick Filter Sheet Button */}
          <button
            onClick={onOpenFilters}
            aria-label="Open Filter Controls Sheet"
            className="flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-black uppercase tracking-wider bg-teal-600 hover:bg-teal-500 text-white transition-all cursor-pointer shadow-md"
          >
            <span>⚙️</span>
            <span>Filters</span>
          </button>

          {/* Selected Only Toggle (PoGo Star Badge Style) */}
          <button
            onClick={() => setSelectedOnly(prev => !prev)}
            aria-pressed={selectedOnly}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all border cursor-pointer ${
              selectedOnly
                ? 'bg-amber-400 text-slate-900 border-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.5)] font-black'
                : 'bg-white border-teal-200 text-slate-700 hover:bg-teal-50 hover:border-teal-400 shadow-sm'
            }`}
          >
            <span className="text-sm">⭐</span>
            <span>Selected ({selectedIds.size})</span>
          </button>

          {/* Quick Select / Deselect Visible */}
          {visibleList.length > 0 && (
            <button
              onClick={() => {
                const visibleIds = visibleList.map(p => p.id);
                const hasAnySelected = visibleIds.some(id => selectedIds.has(id));
                handleRegionSelection(visibleIds, !hasAnySelected);
              }}
              className="px-4 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 hover:text-slate-900 cursor-pointer shadow-sm"
            >
              {visibleList.some(p => selectedIds.has(p.id)) ? 'Deselect Visible' : 'Select Visible'}
            </button>
          )}
        </div>
      </div>

      {/* Grid Empty State */}
      {visibleList.length === 0 && (
        <div className="bg-white/80 rounded-3xl p-12 text-center border border-teal-100 shadow-sm">
          <div className="text-5xl mb-3 animate-float">🔍</div>
          <h3 className="text-lg font-black text-slate-700 uppercase tracking-wide">No Pokémon found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto font-medium">
            Try adjusting your search query or toggling off the "Selected Only" filter.
          </p>
        </div>
      )}

      {/* Regions rendering list */}
      <div className="space-y-6">
        {Object.entries(groupedRegions).map(([region, pokemons]) => (
          <RegionSection
            key={region}
            region={region}
            pokemons={pokemons}
            selectedIds={selectedIds}
            togglePokemon={handleToggleCard}
            handleRegionSelection={handleRegionSelection}
            isCollapsed={collapsedRegions[region]}
            toggleCollapse={toggleCollapse}
            onSelectFamily={handleSelectFamily}
          />
        ))}
      </div>
    </div>
  );
}

export default React.memo(PokemonGrid);
