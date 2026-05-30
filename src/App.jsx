import { useState, useMemo, useCallback } from 'react';
import pokemonData from './data/pokedex.json';
import PokemonGrid from './components/PokemonGrid';
import FilterPanel from './components/FilterPanel';
import SearchStringDisplay from './components/SearchStringDisplay';
import RegionSelector from './components/RegionSelector';

function App() {
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOnly, setSelectedOnly] = useState(false);
  const [filters, setFilters] = useState({
    appraisal: [],
    ageMin: '',
    ageMax: '',
    types: [],
    // Attributes
    shiny: null,
    shadow: null,
    purified: null,
    lucky: null,
    legendary: null,
    mythical: null,
    'ultra beasts': null,
    costume: null,
    evolve: null,
    alola: null,
    galar: null,
    hisui: null,
    paldea: null,
  });

  const togglePokemon = useCallback((id) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  }, []);

  const handleRegionSelection = useCallback((ids, shouldSelect) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      ids.forEach(id => {
        if (shouldSelect) newSet.add(id);
        else newSet.delete(id);
      });
      return newSet;
    });
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const searchString = useMemo(() => {
    const parts = [];

    // Pokemon IDs
    if (selectedIds.size > 0) {
      const sorted = Array.from(selectedIds).map(Number).sort((a, b) => a - b);
      const ranges = [];
      if (sorted.length > 0) {
        let start = sorted[0];
        let prev = sorted[0];

        for (let i = 1; i < sorted.length; i++) {
          if (sorted[i] === prev + 1) {
            prev = sorted[i];
          } else {
            ranges.push(start === prev ? `${start}` : `${start}-${prev}`);
            start = sorted[i];
            prev = sorted[i];
          }
        }
        ranges.push(start === prev ? `${start}` : `${start}-${prev}`);
        parts.push(ranges.join(','));
      }
    }

    // Appraisal
    if (filters.appraisal.length > 0) {
      parts.push(filters.appraisal.join(','));
    }

    // Age
    if (filters.ageMin !== '' || filters.ageMax !== '') {
      const min = filters.ageMin !== '' ? filters.ageMin : '';
      const max = filters.ageMax !== '' ? filters.ageMax : '';
      if (min !== '' && max !== '' && min === max) {
         parts.push(`age${min}`);
      } else {
         parts.push(`age${min}-${max}`);
      }
    }

    // Attributes
    const attributes = [
      'shiny', 'shadow', 'purified', 'lucky', 'legendary', 'mythical',
      'ultra beasts', 'costume', 'evolve', 'alola', 'galar', 'hisui', 'paldea'
    ];

    attributes.forEach(attr => {
      if (filters[attr] === true) parts.push(attr);
      if (filters[attr] === false) parts.push(`!${attr}`);
    });

    // Types
    if (filters.types && filters.types.length > 0) {
       parts.push(filters.types.join(','));
    }

    return parts.join('&');
  }, [selectedIds, filters]);

  // Extract regions from data
  const regions = useMemo(() => {
     // Use Set to get unique regions, preserving order of appearance in JSON (which is Gen 1 -> Gen 9)
     const uniqueRegions = new Set();
     pokemonData.forEach(p => uniqueRegions.add(p.region));
     return Array.from(uniqueRegions);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-500/30">
      
      {/* Premium Glassmorphic Header */}
      <header className="bg-slate-900/90 border-b border-slate-800/80 z-40 sticky top-0 backdrop-blur-md">
          <div className="max-w-7xl mx-auto flex items-center justify-between px-4 md:px-6 py-3.5 select-none">
            <h1 className="text-xl font-extrabold tracking-tight uppercase flex items-center gap-2 cursor-default">
              <span className="text-2xl animate-float">🔍</span>
              <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-indigo-500 bg-clip-text text-transparent font-black tracking-tighter">
                PokéSearch
              </span>
              <span className="text-[10px] font-extrabold bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-lg border border-blue-500/30">
                PRO UX v2.0
              </span>
            </h1>
            
            <div className="text-[11px] font-bold text-slate-500 hidden sm:block tracking-wide">
              Pokémon GO Search Query Maker
            </div>
          </div>
          
          {/* Enhanced Region Navigation Selector */}
          <RegionSelector 
            regions={regions} 
            selectedIds={selectedIds} 
            pokemonList={pokemonData} 
          />
      </header>

      {/* Main Container Layout */}
      <main className="flex-1 flex flex-col lg:flex-row max-w-7xl mx-auto w-full relative">
         
         {/* Collapsible/Sticky Filter Panel */}
         <aside className="lg:w-80 lg:sticky lg:top-[160px] lg:h-[calc(100vh-160px)] lg:overflow-y-auto z-20">
            <FilterPanel filters={filters} setFilters={setFilters} />
         </aside>

         {/* Pokémon Grid Panel */}
         <div className="flex-1 overflow-x-hidden">
            <PokemonGrid
               pokemonList={pokemonData}
               selectedIds={selectedIds}
               togglePokemon={togglePokemon}
               handleRegionSelection={handleRegionSelection}
               searchQuery={searchQuery}
               setSearchQuery={setSearchQuery}
               selectedOnly={selectedOnly}
               setSelectedOnly={setSelectedOnly}
            />
         </div>
      </main>

      {/* Dynamic bottom string display dashboard */}
      <SearchStringDisplay 
        searchString={searchString} 
        selectedCount={selectedIds.size}
        onClearSelection={handleClearSelection}
      />
    </div>
  );
}

export default App;
