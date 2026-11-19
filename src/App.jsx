import { useState, useMemo, useCallback, useEffect } from 'react';
import pokemonData from './data/pokedex.json';
import PokemonGrid from './components/PokemonGrid';
import FilterPanel from './components/FilterPanel';
import SearchStringDisplay from './components/SearchStringDisplay';
import RegionSelector from './components/RegionSelector';
import TriagePipelineView from './components/TriagePipelineView';
import { PogoCategoryIcon } from './components/ui/PogoDesignSystem';
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
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem('pogo_theme');
      if (saved === 'dark' || saved === 'light') return saved;
      if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) return 'dark';
    }
    return 'light';
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      window.localStorage.setItem('pogo_theme', theme);
    } catch {
      // Ignore storage quota / private mode errors
    }
  }, [theme]);

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

  const activeFilterCount = useMemo(() => {
    let count = 0;
    count += filters.appraisal.length;
    count += filters.types.length;
    if (filters.ageMin !== '' || filters.ageMax !== '') count += 1;
    ATTRIBUTES.forEach((attr) => {
      if (filters[attr] === true || filters[attr] === false) count += 1;
    });
    return count;
  }, [filters]);

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
    <div className="min-h-[100dvh] pogo-pokedex-canvas flex flex-col font-sans">
      {/* Pokémon GO Pokédex Sky-Cyan Header (Matches Screenshots 1 & 3) */}
      <header className="pogo-pokedex-header z-40 sticky top-0 safe-top-header pb-2">
        <div className="mwg-header-row max-w-7xl mx-auto flex items-center justify-between gap-2 select-none">
          {/* Left: POKÉDEX Title + Caught/Selected Counter */}
          <div className="flex items-center gap-2.5 min-w-0 shrink-0">
            <span
              className="w-8 h-8 rounded-full bg-[#0d7da8] text-white flex items-center justify-center shadow-sm border-2 border-white/85 shrink-0"
              aria-hidden="true"
            >
              <PogoCategoryIcon name="pokedex" className="w-[18px] h-[18px]" />
            </span>
            <div className="min-w-0">
              <div className="flex items-baseline gap-2.5">
                <h1 className="font-display text-base sm:text-lg font-extrabold tracking-wider uppercase text-[#0b698e] leading-tight whitespace-nowrap">
                  POKÉDEX
                </h1>
                {viewMode === 'grid' && (
                  <span className="hidden sm:inline-block text-xs font-bold text-[#0c749c] tracking-wide whitespace-nowrap">
                    Selected: {selectedIds.size} / {pokemonData.length}
                  </span>
                )}
              </div>
              <div className="hidden md:block text-[10px] font-bold text-[#285d72] tracking-wider uppercase leading-none mt-0.5">
                Pokémon GO Search String &amp; Storage Triage
              </div>
            </div>
          </div>

          {/* Right: Pokémon GO Pill Mode Switcher (Matches Screenshot 2 & 3 Pill Bar) */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('triage')}
              className={`mwg-adaptive-slot h-8 sm:h-9 px-3 sm:px-4 text-[11px] sm:text-xs uppercase inline-flex items-center justify-center gap-1.5 cursor-pointer ${
                viewMode === 'triage' ? 'pogo-pill-active' : 'pogo-pill'
              }`}
            >
              <span aria-hidden="true">⚡</span>
              <span className="long">TRIAGE</span>
              <span className="short" aria-hidden="true">TRIAGE</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setCustomBarString(null);
                setViewMode('grid');
              }}
              className={`mwg-adaptive-slot h-8 sm:h-9 px-3 sm:px-4 text-[11px] sm:text-xs uppercase inline-flex items-center justify-center gap-1.5 cursor-pointer ${
                viewMode === 'grid' ? 'pogo-pill-active' : 'pogo-pill'
              }`}
            >
              <span className="long">POKÉMON ({selectedIds.size})</span>
              <span className="short" aria-hidden="true">DEX ({selectedIds.size})</span>
            </button>
            <button
              type="button"
              onClick={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="pogo-pill w-8 h-8 sm:w-9 sm:h-9 inline-flex items-center justify-center text-sm cursor-pointer shrink-0"
            >
              <span aria-hidden="true">{theme === 'dark' ? '☀️' : '🌙'}</span>
            </button>
          </div>
        </div>

        {/* Region Pill Selector (Only in Pokédex Grid Mode) */}
        {viewMode === 'grid' && (
          <div className="mt-2">
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
              className="fixed inset-0 bg-[#08344a]/45 backdrop-blur-xs z-[50] lg:hidden transition-opacity"
              onClick={() => setIsFilterModalOpen(false)}
              aria-hidden="true"
            />
          )}

          <aside
            aria-label="Pokédex Filter By Controls"
            className={`
              fixed inset-x-0 bottom-0 z-[60] w-full max-h-[85dvh] rounded-t-3xl flex flex-col overflow-hidden transform transition-transform duration-300 ease-in-out shadow-2xl
              ${isFilterModalOpen ? 'translate-y-0' : 'translate-y-full'}
              lg:translate-y-0 lg:static lg:w-[340px] lg:max-h-none lg:h-[calc(100dvh-132px)] lg:sticky lg:top-[116px] lg:rounded-none lg:overflow-y-auto lg:z-20 lg:shadow-none lg:py-4 lg:pl-4
            `}
          >
            <FilterPanel
              filters={filters}
              setFilters={handleSetFilters}
              pokemonList={pokemonData}
              selectedCount={selectedIds.size}
              onClose={() => setIsFilterModalOpen(false)}
              handleInvertSelection={handleInvertSelection}
            />
          </aside>

          <div className="flex-1 min-w-0 overflow-x-hidden">
            <PokemonGrid
              pokemonList={pokemonData}
              selectedIds={selectedIds}
              togglePokemon={togglePokemon}
              handleRegionSelection={handleRegionSelection}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedOnly={selectedOnly}
              setSelectedOnly={setSelectedOnly}
              filters={filters}
              setFilters={handleSetFilters}
              onRegionVisible={setActiveRegion}
              onOpenFilters={() => setIsFilterModalOpen(true)}
            />
          </div>
        </main>
      )}

      {/* Frosted Sky-Glass Bottom Search Bar Dock */}
      <SearchStringDisplay
        viewMode={viewMode}
        searchString={activeSearchString}
        selectedCount={selectedIds.size}
        activeFilterCount={activeFilterCount}
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
