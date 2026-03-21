import { useState, useMemo, useCallback, useEffect } from 'react';
import pokemonData from './data/pokedex.json';
import PokemonGrid from './components/PokemonGrid';
import FilterPanel from './components/FilterPanel';
import SearchStringDisplay from './components/SearchStringDisplay';
import RegionSelector from './components/RegionSelector';
import { compressIdRanges, parseSearchString, ATTRIBUTES } from './utils/searchUtils';
import useLocalStorage from './hooks/useLocalStorage';

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

const setStorageOptions = {
  serialize: (val) => JSON.stringify(Array.from(val)),
  deserialize: (val) => new Set(JSON.parse(val))
};

const filterStorageOptions = {
  deserialize: (val) => ({ ...defaultFilters, ...JSON.parse(val) })
};

function App() {
  const [selectedIds, setSelectedIds] = useLocalStorage('pokedex_selectedIds', new Set(), setStorageOptions);

  const [filters, setFilters] = useLocalStorage('pokedex_filters', defaultFilters, filterStorageOptions);

  const togglePokemon = useCallback((id) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  }, [setSelectedIds]);

  const handleRegionSelection = useCallback((ids, shouldSelect) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      ids.forEach(id => {
        if (shouldSelect) newSet.add(id);
        else newSet.delete(id);
      });
      return newSet;
    });
  }, [setSelectedIds]);

  const handleInvertSelection = useCallback(() => {
    setSelectedIds(prev => {
      const newSet = new Set();
      pokemonData.forEach(p => {
        if (!prev.has(p.id)) {
          newSet.add(p.id);
        }
      });
      return newSet;
    });
  }, [setSelectedIds]);

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
  }, [setSelectedIds, setFilters]);

  const [showSelectedOnly, setShowSelectedOnly] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // Prevent scrolling on body when modal is open
  useEffect(() => {
    if (isFilterModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isFilterModalOpen]);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
      <header className="bg-white shadow-sm z-40 sticky top-0">
          <div className="relative flex items-center justify-center py-4">
            <h1 className="text-2xl font-black text-gray-800 tracking-tighter uppercase">
               PokéSearch
               <span className="text-blue-500 text-xs align-top ml-1 bg-blue-100 px-1 py-0.5 rounded">v1.0</span>
            </h1>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-4">
                <button
                  onClick={handleInvertSelection}
                  className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold uppercase tracking-wide rounded border border-gray-300 transition-colors"
                  title="Invert Selection"
                >
                  Invert
                </button>
                <label className="flex items-center cursor-pointer select-none gap-2" title="Show only selected Pokemon">
                  <div className="relative">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={showSelectedOnly}
                      onChange={() => setShowSelectedOnly(!showSelectedOnly)}
                    />
                    <div className={`block w-10 h-6 rounded-full transition-colors ${showSelectedOnly ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
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
         {/* Mobile Filter Modal Overlay */}
         {isFilterModalOpen && (
           <div
             className="fixed inset-0 bg-black/50 z-[60] lg:hidden backdrop-blur-sm transition-opacity"
             onClick={() => setIsFilterModalOpen(false)}
             aria-hidden="true"
           ></div>
         )}

         {/* Filter Panel (Sidebar on Desktop, Modal on Mobile) */}
         <aside className={`
           fixed inset-y-0 left-0 z-[60] w-full max-w-md bg-white shadow-2xl transform transition-transform duration-300 ease-in-out overflow-y-auto
           ${isFilterModalOpen ? 'translate-x-0' : '-translate-x-full'}
           lg:w-96 lg:translate-x-0 lg:sticky lg:top-[160px] lg:h-[calc(100vh-160px)] lg:bg-gray-50 lg:border-r lg:border-gray-200 lg:z-20 lg:shadow-inner
         `}>
            <FilterPanel filters={filters} setFilters={setFilters} onClose={() => setIsFilterModalOpen(false)} />
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

      {/* Floating Action Button for Mobile */}
      <button
        onClick={() => setIsFilterModalOpen(true)}
        className="lg:hidden fixed bottom-32 right-6 z-40 bg-blue-600 text-white p-4 rounded-full shadow-xl hover:bg-blue-700 transition-transform active:scale-95 flex items-center justify-center pb-safe-area-inset-bottom"
        aria-label="Open filters"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
      </button>
    </div>
  );
}

export default App;
