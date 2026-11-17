import { useState, useMemo, useCallback, useEffect } from 'react';
import pokemonData from './data/pokedex.json';
import PokemonGrid from './components/PokemonGrid';
import FilterPanel from './components/FilterPanel';
import SearchStringDisplay from './components/SearchStringDisplay';
import RegionSelector from './components/RegionSelector';
import TriagePipelineView from './components/TriagePipelineView';
import useLocalStorage from './hooks/useLocalStorage';
import { compressIdRanges, parseSearchString, ATTRIBUTES } from './utils/searchUtils';
import { ensureCopyCommandRegistered } from './utils/copyCommand';

const defaultFilters = {
  appraisal: [],
  ageMin: '',
  ageMax: '',
  types: [],
  attributeLogic: 'AND',
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
  const [viewMode, setViewMode] = useLocalStorage('pokedex_viewMode', 'triage');
  const [selectedIds, setSelectedIds] = useLocalStorage('pokedex_selectedIds', new Set(), setStorageOptions);
  const [filters, setFilters] = useLocalStorage('pokedex_filters', defaultFilters, filterStorageOptions);

  const [customBarString, setCustomBarString] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOnly, setSelectedOnly] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [activeRegion, setActiveRegion] = useState('');

  useEffect(() => {
    ensureCopyCommandRegistered();
    const onCopiedString = (e) => {
      if (e.detail?.text) {
        setCustomBarString(e.detail.text);
      }
    };
    window.addEventListener('pogo-copied-string', onCopiedString);
    return () => window.removeEventListener('pogo-copied-string', onCopiedString);
  }, []);

  const togglePokemon = useCallback((id) => {
    setCustomBarString(null);
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  }, [setSelectedIds]);

  const handleRegionSelection = useCallback((ids, shouldSelect) => {
    setCustomBarString(null);
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
    setCustomBarString(null);
    setSelectedIds(new Set());
  }, [setSelectedIds]);

  const handleInvertSelection = useCallback(() => {
    setCustomBarString(null);
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

  const handleSetFilters = useCallback((updater) => {
    setCustomBarString(null);
    setFilters(updater);
  }, [setFilters]);

  const gridSearchString = useMemo(() => {
    const parts = [];

    const idString = compressIdRanges(selectedIds);
    if (idString) {
      parts.push(idString);
    }

    if (filters.appraisal.length > 0) {
      parts.push(filters.appraisal.join(','));
    }

    if (filters.ageMin !== '' || filters.ageMax !== '') {
      const min = filters.ageMin !== '' ? filters.ageMin : '';
      const max = filters.ageMax !== '' ? filters.ageMax : '';
      if (min !== '' && max !== '' && min === max) {
        parts.push(`age${min}`);
      } else {
        parts.push(`age${min}-${max}`);
      }
    }

    const positiveAttrs = [];
    const negativeAttrs = [];
    ATTRIBUTES.forEach(attr => {
      if (filters[attr] === true) positiveAttrs.push(attr);
      if (filters[attr] === false) negativeAttrs.push(`!${attr}`);
    });

    if (positiveAttrs.length > 0) {
      if (filters.attributeLogic === 'OR') {
        parts.push(positiveAttrs.join(','));
      } else {
        parts.push(...positiveAttrs);
      }
    }

    if (negativeAttrs.length > 0) {
      parts.push(...negativeAttrs);
    }

    if (filters.types && filters.types.length > 0) {
      parts.push(filters.types.join(','));
    }

    return parts.join('&');
  }, [selectedIds, filters]);

  const activeSearchString = customBarString !== null ? customBarString : gridSearchString;

  const regions = useMemo(() => {
    const uniqueRegions = new Set();
    pokemonData.forEach(p => uniqueRegions.add(p.region));
    return Array.from(uniqueRegions);
  }, []);

  const handleSearchUpdate = useCallback((newString) => {
    setCustomBarString(newString);
    if (viewMode === 'grid') {
      const { selectedIds: newIds, filters: newFilters } = parseSearchString(newString);
      setSelectedIds(newIds);
      setFilters(newFilters);
    }
  }, [viewMode, setSelectedIds, setFilters]);

  const handleLoadTriageString = useCallback((recipeString) => {
    setCustomBarString(recipeString);
  }, []);

  const handleSelectSpeciesInGrid = useCallback((speciesIds) => {
    setCustomBarString(null);
    setSelectedIds(new Set(speciesIds));
    setSelectedOnly(true);
    setViewMode('grid');
  }, [setSelectedIds, setViewMode]);

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
    <div className="min-h-[100dvh] pogo-storage-bg text-slate-800 flex flex-col font-sans selection:bg-teal-500/20 selection:text-teal-900">
      {/* Compact Mobile-First Header */}
      <header className="pogo-header-gradient text-white z-40 sticky top-0 safe-top-header pb-1.5">
        <div className="mwg-header-row max-w-7xl mx-auto flex items-center justify-between gap-2 select-none">
          {/* App Branding */}
          <div className="flex items-center gap-2 min-w-0 shrink-0">
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/15 p-0.5 flex items-center justify-center border border-white/35 shrink-0" aria-hidden="true">
              <div className="pokeball-badge">
                <div className="pokeball-badge-top" />
                <div className="pokeball-badge-bottom" />
                <div className="pokeball-badge-band" />
                <div className="pokeball-badge-center" />
              </div>
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-lg font-black tracking-wide uppercase text-white leading-tight whitespace-nowrap">
                PokéSearch
              </h1>
              <div className="hidden md:block text-[10px] font-bold text-teal-100 tracking-wider uppercase leading-none">
                Storage Triage & Pokédex Search Builder
              </div>
            </div>
          </div>

          {/* Single-Line Segmented Mode Switcher */}
          <div className="flex items-center shrink-0">
            <div className="bg-black/25 p-0.5 rounded-full inline-flex items-center gap-0.5 border border-white/25">
              <button
                type="button"
                onClick={() => setViewMode('triage')}
                className={`mwg-adaptive-slot h-8 px-2.5 sm:px-3.5 rounded-full text-xs font-extrabold tracking-wide transition-colors cursor-pointer inline-flex items-center justify-center gap-1 whitespace-nowrap ${
                  viewMode === 'triage'
                    ? 'bg-white text-teal-900 shadow-xs'
                    : 'text-white/95 hover:bg-white/10'
                }`}
              >
                <span aria-hidden="true">⚡</span>
                <span className="long">Inventory Triage</span>
                <span className="short" aria-hidden="true">Triage</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setCustomBarString(null);
                  setViewMode('grid');
                }}
                className={`mwg-adaptive-slot h-8 px-2.5 sm:px-3.5 rounded-full text-xs font-extrabold tracking-wide transition-colors cursor-pointer inline-flex items-center justify-center gap-1 whitespace-nowrap ${
                  viewMode === 'grid'
                    ? 'bg-white text-teal-900 shadow-xs'
                    : 'text-white/95 hover:bg-white/10'
                }`}
              >
                <span aria-hidden="true">📖</span>
                <span className="long">Pokédex Grid ({selectedIds.size})</span>
                <span className="short" aria-hidden="true">Dex ({selectedIds.size})</span>
              </button>
            </div>
          </div>
        </div>

        {/* Region Tabs (Only in Pokédex Grid Mode) */}
        {viewMode === 'grid' && (
          <div className="mt-1.5">
            <RegionSelector
              regions={regions}
              selectedIds={selectedIds}
              pokemonList={pokemonData}
              activeRegion={activeRegion}
              handleRegionSelection={handleRegionSelection}
            />
          </div>
        )}
      </header>

      {/* Main Content */}
      {viewMode === 'triage' ? (
        <main className="flex-1 w-full">
          <TriagePipelineView
            pokemonList={pokemonData}
            onLoadSearchString={handleLoadTriageString}
            onSelectSpeciesInGrid={handleSelectSpeciesInGrid}
          />
        </main>
      ) : (
        <main className="flex-1 flex flex-col lg:flex-row max-w-7xl mx-auto w-full relative">
          {isFilterModalOpen && (
            <div
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[50] lg:hidden transition-opacity"
              onClick={() => setIsFilterModalOpen(false)}
              aria-hidden="true"
            />
          )}

          <aside
            className={`
              fixed inset-y-0 left-0 z-[60] w-full max-w-sm bg-white border-r border-teal-100 transform transition-transform duration-300 ease-in-out overflow-y-auto shadow-2xl
              ${isFilterModalOpen ? 'translate-x-0' : '-translate-x-full'}
              lg:translate-x-0 lg:static lg:w-80 lg:h-[calc(100vh-140px)] lg:overflow-y-auto lg:z-20 lg:shadow-none lg:bg-white/90 lg:backdrop-blur-md
            `}
          >
            <FilterPanel
              filters={filters}
              setFilters={handleSetFilters}
              onClose={() => setIsFilterModalOpen(false)}
              handleInvertSelection={handleInvertSelection}
            />
          </aside>

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
      )}

      {/* Compact Context-Aware Bottom Search Bar Dock */}
      <SearchStringDisplay
        viewMode={viewMode}
        searchString={activeSearchString}
        selectedCount={selectedIds.size}
        onClearSelection={handleClearSelection}
        onSearchUpdate={handleSearchUpdate}
        onOpenFilters={() => {
          setViewMode('grid');
          setIsFilterModalOpen(true);
        }}
      />
    </div>
  );
}

export default App;
