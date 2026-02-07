import React, { useMemo, useState } from 'react';

const PokemonCard = React.memo(({ pokemon, selected, toggle }) => {
  return (
    <div
      onClick={() => toggle(pokemon.id)}
      className={`relative cursor-pointer rounded-xl p-2 flex flex-col items-center transition-all duration-200 select-none shadow-sm border ${
        selected
          ? 'bg-blue-100 border-blue-500 ring-2 ring-blue-400'
          : 'bg-white border-gray-100 hover:bg-gray-50 hover:border-gray-300'
      }`}
    >
      <div className="text-[10px] text-gray-400 font-mono self-start opacity-70">#{pokemon.id}</div>
      <img
        src={pokemon.sprite}
        alt={pokemon.name}
        className="w-20 h-20 object-contain rendering-pixelated mb-1"
        loading="lazy"
        width="80"
        height="80"
      />
      <div className="text-xs font-semibold capitalize text-gray-800 text-center truncate w-full px-1">
        {pokemon.name}
      </div>
      <div className="flex gap-1 mt-2 justify-center w-full">
        {pokemon.types.map(t => (
          <div
            key={t}
            className={`w-3 h-3 rounded-full bg-type-${t} shadow-sm border border-white/20`}
            title={t}
          />
        ))}
      </div>

      {selected && (
        <div className="absolute top-2 right-2 text-blue-500">
          <svg className="w-5 h-5 fill-current" viewBox="0 0 20 20">
            <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" fillRule="evenodd"/>
          </svg>
        </div>
      )}
    </div>
  );
});

export default function PokemonGrid({ pokemonList, selectedIds, togglePokemon, toggleRegionSelection }) {
  const [collapsedRegions, setCollapsedRegions] = useState({});

  const regions = useMemo(() => {
    const grouped = {};
    pokemonList.forEach(p => {
      if (!grouped[p.region]) grouped[p.region] = [];
      grouped[p.region].push(p);
    });
    return grouped;
  }, [pokemonList]);

  const toggleCollapse = (region) => {
    setCollapsedRegions(prev => ({
      ...prev,
      [region]: !prev[region]
    }));
  };

  return (
    <div className="space-y-12 pb-32 px-4 md:px-6 max-w-7xl mx-auto">
      {Object.entries(regions).map(([region, pokemons]) => {
        const isCollapsed = collapsedRegions[region];
        const allSelected = pokemons.every(p => selectedIds.has(p.id));

        return (
          <div key={region} id={`region-${region}`} className="scroll-mt-48">
            <div className="flex items-center justify-between mb-6 sticky top-[160px] bg-white/95 backdrop-blur-sm z-10 py-3 border-b border-gray-100 shadow-sm">
              <div className="flex items-center gap-4 cursor-pointer" onClick={() => toggleCollapse(region)}>
                 <div className="bg-blue-600 w-1.5 h-8 rounded-full"></div>
                 <div>
                    <h2 className="text-2xl font-bold text-gray-800 tracking-tight flex items-center gap-2">
                      {region}
                      <span className={`transition-transform duration-200 text-gray-400 text-sm ${isCollapsed ? '-rotate-90' : 'rotate-0'}`}>
                        ▼
                      </span>
                    </h2>
                    <span className="text-sm font-medium text-gray-400">
                      {pokemons.length} Species
                    </span>
                 </div>
              </div>

              <button
                onClick={() => toggleRegionSelection(pokemons.map(p => p.id))}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  allSelected
                    ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {allSelected ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            {!isCollapsed && (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                {pokemons.map(p => (
                  <PokemonCard
                    key={p.id}
                    pokemon={p}
                    selected={selectedIds.has(p.id)}
                    toggle={togglePokemon}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
