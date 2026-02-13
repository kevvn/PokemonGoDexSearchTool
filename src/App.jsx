import { useState, useMemo, useCallback, useEffect } from 'react';
import pokemonData from './data/pokedex.json';
import PokemonGrid from './components/PokemonGrid';
import FilterPanel from './components/FilterPanel';
import SearchStringDisplay from './components/SearchStringDisplay';
import RegionSelector from './components/RegionSelector';
import { compressIdRanges, parseSearchString, ATTRIBUTES } from './utils/searchUtils';

function App() {
  const [selectedIds, setSelectedIds] = useState(() => {
    try {
      const saved = localStorage.getItem('pokedex_selectedIds');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch (e) {
      console.error('Failed to load selectedIds:', e);
      return new Set();
    }
  });

  const [filters, setFilters] = useState(() => {
    const defaultFilters = {
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
    };

    try {
      const saved = localStorage.getItem('pokedex_filters');
      return saved ? { ...defaultFilters, ...JSON.parse(saved) } : defaultFilters;
    } catch (e) {
      console.error('Failed to load filters:', e);
      return defaultFilters;
    }
  });

  // Persistence effects
  useEffect(() => {
    try {
      localStorage.setItem('pokedex_selectedIds', JSON.stringify(Array.from(selectedIds)));
    } catch (e) {
      console.error('Failed to save selectedIds:', e);
    }
  }, [selectedIds]);

  useEffect(() => {
    try {
      localStorage.setItem('pokedex_filters', JSON.stringify(filters));
    } catch (e) {
      console.error('Failed to save filters:', e);
    }
  }, [filters]);

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

  const searchString = useMemo(() => {
    const parts = [];

    // Pokemon IDs
    const idString = compressIdRanges(selectedIds);
    if (idString) {
      parts.push(idString);
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
    ATTRIBUTES.forEach(attr => {
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

  const handleSearchUpdate = useCallback((newString) => {
    const { selectedIds: newIds, filters: newFilters } = parseSearchString(newString);
    setSelectedIds(newIds);
    setFilters(newFilters);
  }, []);

  const [showSelectedOnly, setShowSelectedOnly] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
      <header className="bg-white shadow-sm z-40 sticky top-0">
          <div className="relative flex items-center justify-center py-4">
            <h1 className="text-2xl font-black text-gray-800 tracking-tighter uppercase">
               PokéSearch
               <span className="text-blue-500 text-xs align-top ml-1 bg-blue-100 px-1 py-0.5 rounded">v1.0</span>
            </h1>
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <label className="flex items-center cursor-pointer select-none gap-2" title="Show only selected Pokemon">
                  <div className="relative">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      aria-label="Show selected only"
                      checked={showSelectedOnly}
                      onChange={() => setShowSelectedOnly(!showSelectedOnly)}
                    />
                    <div className={`block w-10 h-6 rounded-full transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-blue-500 peer-focus-visible:ring-offset-2 ${showSelectedOnly ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                    <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${showSelectedOnly ? 'transform translate-x-4' : ''}`}></div>
                  </div>
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wide hidden sm:block">
                    Selected Only
                  </div>
                </label>
            </div>
          </div>
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
               showSelectedOnly={showSelectedOnly}
            />
         </div>
      </main>

      <SearchStringDisplay searchString={searchString} onSearchUpdate={handleSearchUpdate} />
    </div>
  );
}

export default App;
