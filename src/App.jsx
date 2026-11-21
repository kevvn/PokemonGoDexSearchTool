import { useState, useMemo, useCallback, useEffect } from 'react';
import pokemonData from './data/pokedex.json';
import metaSnapshot from './data/meta_snapshot.json';
import PokemonGrid from './components/PokemonGrid';
import FilterPanel from './components/FilterPanel';
import SearchStringDisplay from './components/SearchStringDisplay';
import RegionSelector from './components/RegionSelector';
import TriagePipelineView from './components/TriagePipelineView';
import TriageFunnelsTab from './components/TriageFunnelsTab';
import TagSystemTab from './components/TagSystemTab';
import { PogoCategoryIcon } from './components/ui/PogoDesignSystem';
import useLocalStorage from './hooks/useLocalStorage';
import useCustomTags from './hooks/useCustomTags';
import {
  REGIONS,
  createDefaultFilters,
  generateSearchString,
  parseSearchString,
} from './utils/searchUtils';
import { ensureCopyCommandRegistered } from './utils/copyCommand';

const VALID_TABS = new Set(['triage', 'events', 'tags', 'builder']);

function normalizeViewMode(val) {
  if (val === 'grid') return 'builder';
  return VALID_TABS.has(val) ? val : 'triage';
}

const viewModeStorageOptions = {
  deserialize: (val) => normalizeViewMode(JSON.parse(val)),
};

const setStorageOptions = {
  serialize: (val) => JSON.stringify(Array.from(val)),
  deserialize: (val) => new Set(JSON.parse(val)),
};

function migrateFilters(raw) {
  const defaults = createDefaultFilters();
  if (!raw || typeof raw !== 'object') return defaults;
  const merged = {
    ...defaults,
    ...raw,
    ivStats: {
      ...defaults.ivStats,
      ...(raw.ivStats && typeof raw.ivStats === 'object' ? raw.ivStats : {}),
    },
    rawClauses: Array.isArray(raw.rawClauses) ? raw.rawClauses : [],
  };
  // Migrate legacy `'ultra beasts'` key to canonical `ultrabeast`
  if ('ultra beasts' in raw && raw['ultra beasts'] !== undefined && merged.ultrabeast === null) {
    merged.ultrabeast = raw['ultra beasts'];
  }
  delete merged['ultra beasts'];
  return merged;
}

const filterStorageOptions = {
  schemaVersion: 2,
  deserialize: (val) => migrateFilters(JSON.parse(val)),
  migrate: (oldData) => migrateFilters(oldData),
};

function App() {
  const [viewMode, setViewMode] = useLocalStorage('pokedex_viewMode', 'triage', viewModeStorageOptions);
  const [selectedIds, setSelectedIds] = useLocalStorage(
    'pokedex_selectedIds',
    new Set(),
    setStorageOptions
  );
  const [filters, setFilters] = useLocalStorage(
    'pokedex_filters',
    createDefaultFilters,
    filterStorageOptions
  );
  const customTags = useCustomTags();

  const [customBarString, setCustomBarString] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOnly, setSelectedOnly] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [activeRegion, setActiveRegion] = useState('Kanto');

  const activeTab = normalizeViewMode(viewMode);

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

  const togglePokemon = useCallback(
    (id) => {
      setCustomBarString(null);
      setSelectedIds((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        return newSet;
      });
    },
    [setSelectedIds]
  );

  const handleRegionSelection = useCallback(
    (ids, shouldSelect) => {
      setCustomBarString(null);
      setSelectedIds((prev) => {
        const newSet = new Set(prev);
        ids.forEach((id) => {
          if (shouldSelect) newSet.add(id);
          else newSet.delete(id);
        });
        return newSet;
      });
    },
    [setSelectedIds]
  );

  const handleReplaceSelection = useCallback(
    (ids) => {
      setCustomBarString(null);
      setSelectedIds(new Set(ids));
    },
    [setSelectedIds]
  );

  const handleClearSelection = useCallback(() => {
    setCustomBarString(null);
    setSelectedIds(new Set());
  }, [setSelectedIds]);

  const handleInvertSelection = useCallback(() => {
    setCustomBarString(null);
    setSelectedIds((prev) => {
      const newSet = new Set();
      pokemonData.forEach((p) => {
        if (!prev.has(p.id)) {
          newSet.add(p.id);
        }
      });
      return newSet;
    });
  }, [setSelectedIds]);

  const handleSetFilters = useCallback(
    (updater) => {
      setCustomBarString(null);
      setFilters(updater);
    },
    [setFilters]
  );

  const handleRemoveRawClause = useCallback(
    (idx) => {
      setCustomBarString(null);
      setFilters((prev) => ({
        ...prev,
        rawClauses: (prev.rawClauses || []).filter((_, i) => i !== idx),
      }));
    },
    [setFilters]
  );

  // Canonical Leidwesen v0.435.1 search string for Builder mode
  const builderSearchString = useMemo(
    () => generateSearchString(selectedIds, filters),
    [selectedIds, filters]
  );

  const activeSearchString = customBarString !== null ? customBarString : builderSearchString;

  // Bidirectional search string update from bottom dock
  const handleSearchUpdate = useCallback(
    (newString) => {
      if (activeTab === 'builder') {
        setCustomBarString(null);
        const { selectedIds: newIds, filters: newFilters } = parseSearchString(newString);
        setSelectedIds(newIds);
        setFilters(newFilters);
      } else if (!newString) {
        setCustomBarString('');
      } else {
        setCustomBarString(newString);
      }
    },
    [activeTab, setSelectedIds, setFilters]
  );

  // Apply a verified preset query directly inside FilterPanel (always parses into Builder state)
  const handleApplyFilterQuery = useCallback(
    (queryString) => {
      setCustomBarString(null);
      const { selectedIds: newIds, filters: newFilters } = parseSearchString(queryString);
      setSelectedIds(newIds);
      setFilters(newFilters);
    },
    [setSelectedIds, setFilters]
  );

  // Handoff from Triage Funnels tab -> Pokédex Builder tab
  const handleLoadFromTriage = useCallback(
    (queryString) => {
      setCustomBarString(null);
      const { selectedIds: newIds, filters: newFilters } = parseSearchString(queryString);
      setSelectedIds(newIds);
      setFilters(newFilters);
      setViewMode('builder');
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    [setSelectedIds, setFilters, setViewMode]
  );

  // Handoff from Events & Trips (`TriagePipelineView`) -> bottom dock
  const handleLoadEventString = useCallback((recipeString) => {
    setCustomBarString(recipeString);
  }, []);

  // Handoff from Events & Trips (`TriagePipelineView`) -> Pokédex Builder selection
  const handleSelectSpeciesInGrid = useCallback(
    (speciesIds) => {
      setCustomBarString(null);
      setSelectedIds(new Set(speciesIds));
      setSelectedOnly(true);
      setViewMode('builder');
    },
    [setSelectedIds, setViewMode]
  );

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

  const tagErrors = customTags.lintResults?.errorCount || 0;
  const tagWarnings = customTags.lintResults?.warningCount || 0;

  return (
    <div className="min-h-[100dvh] pogo-pokedex-canvas flex flex-col font-sans">
      {/* Modern Pokémon GO Pokédex Sky-Cyan Sticky Frosted Header */}
      <header className="pogo-pokedex-header z-40 sticky top-0 safe-top-header pb-2">
        <div className="mwg-header-row max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-2 select-none">
          {/* Brand Title + Selected Counter */}
          <div className="flex items-center justify-between gap-2.5 min-w-0 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
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
                  <span className="text-xs font-bold text-[#0c749c] tracking-wide whitespace-nowrap">
                    Selected: {selectedIds.size} / {pokemonData.length}
                  </span>
                </div>
                <div className="hidden md:block text-[10px] font-bold text-[#285d72] tracking-wider uppercase leading-none mt-0.5">
                  Pokémon GO Search String &amp; Storage Triage
                </div>
              </div>
            </div>
          </div>

          {/* 4-Tab Primary Workspace Navigation (PoGO Frosted Pill Bar) */}
          <nav
            aria-label="Primary workspace navigation"
            className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 shrink-0"
          >
            <button
              type="button"
              onClick={() => setViewMode('triage')}
              aria-current={activeTab === 'triage' ? 'page' : undefined}
              className={`h-8 sm:h-9 px-3 sm:px-3.5 text-[11px] sm:text-xs uppercase inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'triage' ? 'pogo-pill-active' : 'pogo-pill'
              }`}
            >
              <span aria-hidden="true">⚡</span>
              <span>Triage Funnels</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('events')}
              aria-current={activeTab === 'events' ? 'page' : undefined}
              className={`h-8 sm:h-9 px-3 sm:px-3.5 text-[11px] sm:text-xs uppercase inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'events' ? 'pogo-pill-active' : 'pogo-pill'
              }`}
            >
              <span aria-hidden="true">📅</span>
              <span>Events &amp; Trips</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('tags')}
              aria-current={activeTab === 'tags' ? 'page' : undefined}
              className={`h-8 sm:h-9 px-3 sm:px-3.5 text-[11px] sm:text-xs uppercase inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'tags' ? 'pogo-pill-active' : 'pogo-pill'
              }`}
            >
              <span aria-hidden="true">🏷️</span>
              <span>Tag System</span>
              {tagErrors > 0 ? (
                <span
                  className="bg-rose-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full border border-white/80"
                  title={`${tagErrors} tag collision error(s)`}
                >
                  {tagErrors}
                </span>
              ) : tagWarnings > 0 ? (
                <span
                  className="bg-amber-400 text-[#123c4d] text-[9px] font-black px-1.5 py-0.2 rounded-full border border-white/80"
                  title={`${tagWarnings} tag warning(s)`}
                >
                  {tagWarnings}
                </span>
              ) : null}
            </button>

            <button
              type="button"
              onClick={() => {
                setCustomBarString(null);
                setViewMode('builder');
              }}
              aria-current={activeTab === 'builder' ? 'page' : undefined}
              className={`h-8 sm:h-9 px-3 sm:px-3.5 text-[11px] sm:text-xs uppercase inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'builder' ? 'pogo-pill-active' : 'pogo-pill'
              }`}
            >
              <span aria-hidden="true">🧭</span>
              <span>Pokédex Builder ({selectedIds.size})</span>
            </button>
          </nav>
        </div>

        {/* 10-Region Pill Selector (Including Hisui — Only in Pokédex Builder Mode) */}
        {activeTab === 'builder' && (
          <div className="mt-2">
            <RegionSelector
              regions={REGIONS}
              selectedIds={selectedIds}
              pokemonList={pokemonData}
              activeRegion={activeRegion}
              handleRegionSelection={handleRegionSelection}
            />
          </div>
        )}
      </header>

      {/* Main Content */}
      {activeTab === 'triage' && (
        <main className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-5 py-4 sm:py-5">
          <TriageFunnelsTab
            metaSnapshot={metaSnapshot}
            customTags={customTags}
            onLoadQuery={handleLoadFromTriage}
          />
        </main>
      )}

      {activeTab === 'events' && (
        <main className="flex-1 w-full">
          <TriagePipelineView
            pokemonList={pokemonData}
            onLoadSearchString={handleLoadEventString}
            onSelectSpeciesInGrid={handleSelectSpeciesInGrid}
          />
        </main>
      )}

      {activeTab === 'tags' && (
        <main className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-5 py-4 sm:py-5">
          <TagSystemTab customTags={customTags} />
        </main>
      )}

      {activeTab === 'builder' && (
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
              fixed inset-y-0 left-0 z-[60] w-full max-w-sm transform transition-transform duration-300 ease-in-out overflow-y-auto shadow-2xl
              ${isFilterModalOpen ? 'translate-x-0' : '-translate-x-full'}
              lg:translate-x-0 lg:static lg:w-[340px] lg:h-[calc(100dvh-132px)] lg:sticky lg:top-[116px] lg:overflow-y-auto lg:z-20 lg:shadow-none lg:py-4 lg:pl-4
            `}
          >
            <FilterPanel
              filters={filters}
              setFilters={handleSetFilters}
              pokemonList={pokemonData}
              selectedCount={selectedIds.size}
              onClose={() => setIsFilterModalOpen(false)}
              handleInvertSelection={handleInvertSelection}
              onApplyQuery={handleApplyFilterQuery}
            />
          </aside>

          <div className="flex-1 min-w-0 overflow-x-hidden">
            <PokemonGrid
              pokemonList={pokemonData}
              metaSnapshot={metaSnapshot}
              selectedIds={selectedIds}
              togglePokemon={togglePokemon}
              handleRegionSelection={handleRegionSelection}
              onReplaceSelection={handleReplaceSelection}
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
        viewMode={activeTab}
        searchString={activeSearchString}
        selectedCount={selectedIds.size}
        rawClauses={
          activeTab === 'builder' && customBarString === null ? filters.rawClauses || [] : []
        }
        onRemoveRawClause={handleRemoveRawClause}
        onClearSelection={handleClearSelection}
        onSearchUpdate={handleSearchUpdate}
        onOpenFilters={() => {
          setCustomBarString(null);
          setViewMode('builder');
          setIsFilterModalOpen(true);
        }}
      />
    </div>
  );
}

export default App;
