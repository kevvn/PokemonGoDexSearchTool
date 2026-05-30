import React, { useMemo, useState, useCallback, useRef } from 'react';

// Smart heuristic to get evolutionary family IDs
const getFamilyIds = (pokemon, pokemonList) => {
  const getPrefix = (name) => name.split('-')[0].substring(0, 4);
  const prefix = getPrefix(pokemon.name);
  
  const family = pokemonList.filter(p => {
    if (p.region !== pokemon.region) return false;
    
    // Check if within National Dex sequential range of 2 (most standard families are contiguous N, N+1, N+2)
    const isAdjacent = Math.abs(p.id - pokemon.id) <= 2;
    if (isAdjacent) {
      // Ensure we don't accidentally link unrelated species at gen boundaries
      return true;
    }
    
    // Fallback to prefix matching for name similarity within same gen
    const pPrefix = getPrefix(p.name);
    return pPrefix === prefix && Math.abs(p.id - pokemon.id) <= 5;
  });
  
  return family.map(p => p.id);
};

const PokemonCard = React.memo(({ pokemon, selected, toggle, list, onSelectFamily }) => {
  const primaryType = pokemon.types[0] || 'normal';
  
  const handleFamilyClick = (e) => {
    e.stopPropagation();
    const familyIds = getFamilyIds(pokemon, list);
    onSelectFamily(familyIds);
  };

  return (
    <div
      onClick={(e) => toggle(pokemon.id, e)}
      className={`relative cursor-pointer rounded-2xl p-3 flex flex-col items-center transition-all duration-300 select-none border group/card hover:scale-[1.05] hover:active:scale-[0.98] ${
        selected
          ? `bg-slate-900 border-slate-700 ring-2 ring-blue-500/40 shadow-type-${primaryType}`
          : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-850 hover:border-slate-700'
      }`}
    >
      {/* Pokédex ID and Family Shortcut */}
      <div className="flex justify-between w-full items-center mb-1">
        <span className="text-[10px] text-slate-500 font-mono font-bold tracking-wider">#{pokemon.id}</span>
        
        {/* Select Family Quick Trigger */}
        <button
          onClick={handleFamilyClick}
          title="Select evolution line"
          className="opacity-0 group-hover/card:opacity-100 text-[9px] bg-slate-800 hover:bg-slate-750 text-blue-400 hover:text-blue-300 font-bold px-1.5 py-0.5 rounded border border-slate-700 transition-all cursor-pointer"
        >
          + Family
        </button>
      </div>

      {/* Image with glow effect */}
      <div className="relative w-20 h-20 flex items-center justify-center mb-2">
        <div className={`absolute inset-0 rounded-full blur-xl opacity-0 group-hover/card:opacity-20 transition-opacity duration-300 bg-type-${primaryType}`}></div>
        <img
          src={pokemon.sprite}
          alt={pokemon.name}
          className="w-20 h-20 object-contain rendering-pixelated relative z-10 drop-shadow-[0_4px_6px_rgba(0,0,0,0.3)] transition-transform duration-300 group-hover/card:scale-110"
          loading="lazy"
          width="80"
          height="80"
        />
      </div>

      {/* Name */}
      <div className="text-xs font-bold capitalize text-slate-200 text-center truncate w-full px-1 mb-2 group-hover/card:text-white">
        {pokemon.name.replace('-', ' ')}
      </div>

      {/* Modern Type Badges */}
      <div className="flex gap-1 justify-center w-full mt-auto">
        {pokemon.types.map(t => (
          <span
            key={t}
            className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md text-white/90 shadow-sm border border-white/5 bg-type-${t}`}
          >
            {t.substring(0, 4)}
          </span>
        ))}
      </div>

      {/* Selection Checkmark Bubble */}
      {selected && (
        <div className="absolute -top-1.5 -right-1.5 bg-blue-500 text-slate-900 rounded-full w-5 h-5 flex items-center justify-center border-2 border-slate-950 shadow-[0_0_10px_rgba(59,130,246,0.6)] animate-float">
          <svg className="w-3.5 h-3.5 fill-current text-white" viewBox="0 0 20 20">
            <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" fillRule="evenodd"/>
          </svg>
        </div>
      )}
    </div>
  );
});

const RegionSection = React.memo(({ region, pokemons, selectedIds, togglePokemon, handleRegionSelection, isCollapsed, toggleCollapse, fullList, onSelectFamily }) => {
  const selectedCount = pokemons.filter(p => selectedIds.has(p.id)).length;
  const totalCount = pokemons.length;
  const allSelected = selectedCount === totalCount && totalCount > 0;
  const someSelected = selectedCount > 0;

  if (totalCount === 0) return null;

  return (
    <div 
      id={`region-${region}`} 
      className="scroll-mt-48 bg-slate-900/30 rounded-3xl p-5 border border-slate-900/80 shadow-md mb-8"
      style={{ contentVisibility: 'auto', containIntrinsicSize: '0 500px' }}
    >
      {/* Region Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => toggleCollapse(region)}>
            <div className="bg-gradient-to-b from-blue-500 to-indigo-600 w-1.5 h-9 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-100 tracking-wide flex items-center gap-2 hover:text-white transition-colors">
                {region}
                <span className={`transition-transform duration-300 text-slate-500 text-xs ${isCollapsed ? '-rotate-90' : 'rotate-0'}`}>
                  ▼
                </span>
              </h2>
              <span className="text-xs font-semibold text-slate-500 mt-0.5 block">
                {selectedCount} selected / {totalCount} Species
              </span>
            </div>
        </div>

        {/* Region level selection actions */}
        <div className="flex gap-2">
          {!allSelected && (
            <button
              onClick={() => handleRegionSelection(pokemons.map(p => p.id), true)}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 bg-slate-850 hover:bg-slate-800 border border-slate-850 text-slate-300 hover:text-white"
            >
              Select All
            </button>
          )}
          {someSelected && (
            <button
              onClick={() => handleRegionSelection(pokemons.map(p => p.id), false)}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 hover:text-blue-300"
            >
              Deselect All
            </button>
          )}
        </div>
      </div>

      {/* Grid Container */}
      {!isCollapsed && (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3.5">
          {pokemons.map(p => (
            <PokemonCard
              key={p.id}
              pokemon={p}
              selected={selectedIds.has(p.id)}
              toggle={togglePokemon}
              list={fullList}
              onSelectFamily={onSelectFamily}
            />
          ))}
        </div>
      )}
    </div>
  );
});

function PokemonGrid({ 
  pokemonList, 
  selectedIds, 
  togglePokemon, 
  handleRegionSelection,
  searchQuery,
  setSearchQuery,
  selectedOnly,
  setSelectedOnly
}) {
  const [collapsedRegions, setCollapsedRegions] = useState({});
  const lastClickedId = useRef(null);

  // Group and Filter Pokémon
  const { groupedRegions, visibleList } = useMemo(() => {
    const grouped = {};
    const visible = [];
    const query = searchQuery.toLowerCase().trim();

    pokemonList.forEach(p => {
      // 1. Text filter (name, id, type)
      const matchesSearch = 
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

  const toggleCollapse = useCallback((region) => {
    setCollapsedRegions(prev => ({
      ...prev,
      [region]: !prev[region]
    }));
  }, []);

  const handleSelectFamily = useCallback((familyIds) => {
    // Bulk select the family
    handleRegionSelection(familyIds, true);
  }, [handleRegionSelection]);

  // Upgraded Toggle support for Shift + Click range selection
  const handleToggleCard = useCallback((id, event) => {
    if (event.shiftKey && lastClickedId.current !== null && lastClickedId.current !== id) {
      // Perform range selection based on index in CURRENTLY visible list
      const idx1 = visibleList.findIndex(p => p.id === lastClickedId.current);
      const idx2 = visibleList.findIndex(p => p.id === id);

      if (idx1 !== -1 && idx2 !== -1) {
        const start = Math.min(idx1, idx2);
        const end = Math.max(idx1, idx2);
        const rangeIds = visibleList.slice(start, end + 1).map(p => p.id);
        
        // Determine selection target: match selection status of the last clicked item, 
        // or default to true if last clicked is selected
        const targetSelection = selectedIds.has(lastClickedId.current);
        handleRegionSelection(rangeIds, targetSelection);
        
        // Update anchor
        lastClickedId.current = id;
        return;
      }
    }
    
    // Normal single select
    togglePokemon(id);
    lastClickedId.current = id;
  }, [visibleList, selectedIds, togglePokemon, handleRegionSelection]);

  return (
    <div className="space-y-6 pb-36 px-4 md:px-6 max-w-7xl mx-auto mt-4">
      
      {/* Grid Toolbar: Search and Filter Actions */}
      <div className="glass-panel rounded-3xl p-4 md:p-5 flex flex-col md:flex-row items-center gap-4 justify-between shadow-xl">
        
        {/* Live Search Input */}
        <div className="relative w-full md:max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            🔍
          </span>
          <input
            type="text"
            placeholder="Search by Name, Dex #, or Type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 font-bold"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filters and Utility Switches */}
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto justify-end">
          
          {/* Selected Only Toggle */}
          <button
            onClick={() => setSelectedOnly(prev => !prev)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all border ${
              selectedOnly
                ? 'bg-blue-500 text-slate-950 border-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.3)] hover:bg-blue-400'
                : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-slate-350 hover:border-slate-700'
            }`}
          >
            <span className="text-[14px]">⭐</span>
            Selected Only ({selectedIds.size})
          </button>

          {/* Quick Clear Current Search View Selection */}
          {visibleList.length > 0 && (
            <button
              onClick={() => {
                const visibleIds = visibleList.map(p => p.id);
                const hasAnySelected = visibleIds.some(id => selectedIds.has(id));
                handleRegionSelection(visibleIds, !hasAnySelected);
              }}
              className="px-4 py-2.5 rounded-2xl text-xs font-bold transition-all bg-slate-850 hover:bg-slate-800 border border-slate-800 text-slate-300"
            >
              {visibleList.some(p => selectedIds.has(p.id)) ? 'Deselect Visible' : 'Select Visible'}
            </button>
          )}
        </div>
      </div>

      {/* Grid Empty State */}
      {visibleList.length === 0 && (
        <div className="glass-panel rounded-3xl p-12 text-center border border-slate-900 shadow-inner">
          <div className="text-4xl mb-3">🕵️‍♂️</div>
          <h3 className="text-lg font-bold text-slate-300">No Pokémon found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search query or toggling off the "Selected Only" filter state.
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
              fullList={pokemonList}
              onSelectFamily={handleSelectFamily}
          />
        ))}
      </div>
    </div>
  );
}

export default React.memo(PokemonGrid);
