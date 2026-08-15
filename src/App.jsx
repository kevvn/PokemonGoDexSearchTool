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

  // Generate Pokémon GO search query string
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
    <div className="min-h-screen pogo-storage-bg text-slate-800 flex flex-col font-sans selection:bg-teal-500/20 selection:text-teal-900">
      
      {/* Authentic Pokémon GO Header Bar */}
      <header className="pogo-header-gradient text-white z-40 sticky top-0 shadow-lg">
          <div className="max-w-7xl mx-auto flex items-center justify-between px-4 md:px-6 py-3 select-none">
            
            {/* App Branding */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/20 p-1 flex items-center justify-center shadow-md border border-white/40">
                <div className="pokeball-badge scale-125" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-wider uppercase drop-shadow-sm text-white">
                  POKÉMON
                </h1>
                <div className="text-[9px] font-extrabold text-teal-100 uppercase tracking-widest leading-none">
                  Pokédex & Search Tool
                </div>
              </div>
            </div>
            
            {/* Pokémon GO Storage Counter Pill */}
            <div className="flex items-center gap-2">
              <div className="pogo-storage-counter px-4 py-1.5 rounded-full flex items-center gap-2 text-slate-800 shadow-md">
                <span className="text-xs font-black text-[#1b7a69] tracking-wider uppercase">
                  STORAGE:
                </span>
                <span className="text-xs font-mono font-black text-slate-900">
                  <span className="text-[#00aa90] font-black">{selectedIds.size}</span> / {pokemonData.length}
                </span>
              </div>
            </div>
          </div>
          
          {/* Pokémon GO Top Category Tabs */}
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
             className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[50] lg:hidden transition-opacity"
             onClick={() => setIsFilterModalOpen(false)}
             aria-hidden="true"
           ></div>
         )}

         {/* Collapsible/Sticky Filter Panel Drawer (PoGo Search Sheet) */}
         <aside className={`
           fixed inset-y-0 left-0 z-[60] w-full max-w-sm bg-white border-r border-teal-100 transform transition-transform duration-300 ease-in-out overflow-y-auto shadow-2xl
           ${isFilterModalOpen ? 'translate-x-0' : '-translate-x-full'}
           lg:translate-x-0 lg:static lg:w-80 lg:h-[calc(100vh-140px)] lg:overflow-y-auto lg:z-20 lg:shadow-none lg:bg-white/90 lg:backdrop-blur-md
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
               onOpenFilters={() => setIsFilterModalOpen(true)}
            />
         </div>
      </main>

      {/* Dynamic bottom string display dashboard with 3D Pokéball */}
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
