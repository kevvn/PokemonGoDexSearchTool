import { useState, useMemo } from 'react';
import pokemonData from './data/pokedex.json';
import PokemonGrid from './components/PokemonGrid';
import FilterPanel from './components/FilterPanel';
import SearchStringDisplay from './components/SearchStringDisplay';
import RegionSelector from './components/RegionSelector';
import { INITIAL_FILTERS } from './constants/filters';

function App() {
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [filters, setFilters] = useState(INITIAL_FILTERS);

  const togglePokemon = (id) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const handleRegionSelection = (ids, shouldSelect) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      ids.forEach(id => {
        if (shouldSelect) newSet.add(id);
        else newSet.delete(id);
      });
      return newSet;
    });
  };

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
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
      <header className="bg-white shadow-sm z-40 sticky top-0">
          <h1 className="text-center py-4 text-2xl font-black text-gray-800 tracking-tighter uppercase">
             PokéSearch
             <span className="text-blue-500 text-xs align-top ml-1 bg-blue-100 px-1 py-0.5 rounded">v1.0</span>
          </h1>
          <RegionSelector regions={regions} />
      </header>

      <main className="flex-1 flex flex-col lg:flex-row max-w-7xl mx-auto w-full relative">
         <aside className="lg:w-80 lg:sticky lg:top-[160px] lg:h-[calc(100vh-160px)] lg:overflow-y-auto bg-gray-50 border-r border-gray-200 z-20 shadow-inner">
            <FilterPanel filters={filters} setFilters={setFilters} />
         </aside>

         <div className="flex-1">
            <PokemonGrid
               pokemonList={pokemonData}
               selectedIds={selectedIds}
               togglePokemon={togglePokemon}
               handleRegionSelection={handleRegionSelection}
            />
         </div>
      </main>

      <SearchStringDisplay searchString={searchString} />
    </div>
  );
}

export default App;
