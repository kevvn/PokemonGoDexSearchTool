import { useState, useMemo, useCallback, useEffect } from 'react';
import pokemonData from './data/pokedex.json';
import PokemonGrid from './components/PokemonGrid';
import FilterPanel from './components/FilterPanel';
import SearchStringDisplay from './components/SearchStringDisplay';
import RegionSelector from './components/RegionSelector';
import useLocalStorage from './hooks/useLocalStorage';
import { compressIdRanges, parseSearchString, ATTRIBUTES } from './utils/searchUtils';

const defaultFilters = {
  appraisal: [],
  ageMin: '',
  ageMax: '',
  types: [],
  ...ATTRIBUTES.reduce((acc, attr) => ({ ...acc, [attr]: null }), {})
};

const setStorageOptions = {
  serialize: (val) => JSON.stringify(Array.from(val)),
  deserialize: (val) => new Set(JSON.parse(val))
};

const filterStorageOptions = {
  deserialize: (val) => ({ ...defaultFilters, ...JSON.parse(val) })
};

function App() {
  // Persisted state hooks
  const [selectedIds, setSelectedIds] = useLocalStorage('pokedex_selectedIds', new Set(), setStorageOptions);
  const [filters, setFilters] = useLocalStorage('pokedex_filters', defaultFilters, filterStorageOptions);
  
  // Local volatile states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOnly, setSelectedOnly] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [activeRegion, setActiveRegion] = useState('');

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

  const handleClearSelection = useCallback(() => {
    setSelectedIds(new Set());
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

  // Generate Pokego search string
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

  // Extract unique regions
  const regions = useMemo(() => {
     const uniqueRegions = new Set();
     pokemonData.forEach(p => uniqueRegions.add(p.region));
     return Array.from(uniqueRegions);
  }, []);

  // Update selection/filters when user pastes/types search string directly in display input
  const handleSearchUpdate = useCallback((newString) => {
    const { selectedIds: newIds, filters: newFilters } = parseSearchString(newString);
    setSelectedIds(newIds);
    setFilters(newFilters);
  }, [setSelectedIds, setFilters]);

  // Lock document body scroll on mobile when modal is active
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
            activeRegion={activeRegion}
            handleRegionSelection={handleRegionSelection}
          />
      </header>

      {/* Main Container Layout */}
      <main className="flex-1 flex flex-col lg:flex-row max-w-7xl mx-auto w-full relative">
         
         {/* Mobile Filter Modal Backdrop overlay */}
         {isFilterModalOpen && (
           <div
             className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[50] lg:hidden transition-opacity"
             onClick={() => setIsFilterModalOpen(false)}
             aria-hidden="true"
           ></div>
         )}

         {/* Collapsible/Sticky Filter Panel Drawer */}
         <aside className={`
           fixed inset-y-0 left-0 z-[60] w-full max-w-sm bg-slate-900 border-r border-slate-800/80 transform transition-transform duration-300 ease-in-out overflow-y-auto
           ${isFilterModalOpen ? 'translate-x-0' : '-translate-x-full'}
           lg:translate-x-0 lg:static lg:w-80 lg:h-[calc(100vh-160px)] lg:overflow-y-auto lg:z-20
         `}>
            <FilterPanel 
              filters={filters} 
              setFilters={setFilters} 
              onClose={() => setIsFilterModalOpen(false)}
              handleInvertSelection={handleInvertSelection}
            />
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
               onRegionVisible={setActiveRegion}
            />
         </div>
      </main>

      {/* Dynamic bottom string display dashboard */}
      <SearchStringDisplay 
        searchString={searchString} 
        selectedCount={selectedIds.size}
        onClearSelection={handleClearSelection}
        onSearchUpdate={handleSearchUpdate}
        onOpenFilters={() => setIsFilterModalOpen(true)}
      />
    </div>
  );
}

export default App;
