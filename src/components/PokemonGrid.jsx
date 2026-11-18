import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { areRegionPropsEqual } from '../utils/gridUtils';
import { getFamilyIds } from '../utils/familyUtils';
import {
  PogoSummaryCard,
  PogoRegionBanner,
  PogoSearchInput,
  PogoCategoryIcon,
  PogoTypeIcon,
} from './ui/PogoDesignSystem';

// Fallback Pokéball SVG data URL for broken sprite image handling
const FALLBACK_SPRITE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='45' fill='%23ff385c'/%3E%3Cpath d='M5 50h90A45 45 0 0 1 5 50' fill='%23f8fafc'/%3E%3Cpath d='M5 50h90' stroke='%230b4f6c' stroke-width='8'/%3E%3Ccircle cx='50' cy='50' r='16' fill='%230b4f6c'/%3E%3Ccircle cx='50' cy='50' r='10' fill='%23f8fafc'/%3E%3C/svg%3E";

/**
 * Screenshot 2 Frosted Ice-Glass Pokédex Tile (0494, 0495, 0496...)
 */
const PokemonCard = React.memo(({ pokemon, selected, toggle, onSelectFamily }) => {
  const handleFamilyClick = (e) => {
    e.stopPropagation();
    const familyIds = getFamilyIds(pokemon.id);
    onSelectFamily(familyIds);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggle(pokemon.id, e);
    }
  };

  const handleImageError = (e) => {
    e.currentTarget.onerror = null;
    e.currentTarget.src = FALLBACK_SPRITE;
  };

  // Authentic Pokémon GO 4-digit zero-padded Dex ID (0001, 0025, 0494)
  const formattedId = String(pokemon.id).padStart(4, '0');

  return (
    <div
      role="button"
      aria-pressed={selected}
      aria-label={`#${formattedId} ${pokemon.name}, ${pokemon.types.join(', ')}`}
      tabIndex={0}
      onClick={(e) => toggle(pokemon.id, e)}
      onKeyDown={handleKeyDown}
      className={`pogo-dex-tile cursor-pointer pt-2 pb-2 px-1.5 flex flex-col items-center justify-between select-none group/card min-h-[122px] sm:min-h-[132px] ${
        selected ? 'pogo-dex-tile-selected' : ''
      }`}
    >
      {/* Top Row: Mini Circular Type Dots + Family Action */}
      <div className="w-full flex items-center justify-between gap-1 px-0.5 z-10 min-h-[18px]">
        <div className="flex items-center gap-1">
          {pokemon.types.map((t) => (
            <span
              key={t}
              title={t}
              className={`w-4 h-4 rounded-full inline-flex items-center justify-center text-white border border-white/75 shadow-2xs bg-type-${t}`}
            >
              <PogoTypeIcon type={t} className="w-2.5 h-2.5" />
            </span>
          ))}
        </div>

        <button
          type="button"
          onClick={handleFamilyClick}
          title={`Select evolution family for ${pokemon.name}`}
          aria-label={`Select evolution family for ${pokemon.name}`}
          className="pogo-tile-actions compact-inline-chip text-[9px] bg-white/95 hover:bg-[#0d7da8] text-[#0b698e] hover:text-white font-extrabold px-1.5 py-0.5 rounded-full border border-[#0d7da8]/30 cursor-pointer shadow-2xs leading-none"
        >
          +Fam
        </button>
      </div>

      {/* Center Sprite Stage */}
      <div className="relative w-16 h-16 sm:w-[72px] sm:h-[72px] flex items-center justify-center my-0.5">
        <img
          src={pokemon.sprite}
          alt={pokemon.name}
          onError={handleImageError}
          className="w-16 h-16 sm:w-[70px] sm:h-[70px] object-contain rendering-pixelated relative z-10 drop-shadow-[0_3px_5px_rgba(9,65,92,0.22)] transition-transform duration-200 group-hover/card:scale-110"
          loading="lazy"
          width="70"
          height="70"
        />
      </div>

      {/* Bottom Name + Authentic 4-Digit Dex Number (0494) */}
      <div className="w-full text-center px-0.5 leading-tight">
        <div className="text-[10px] sm:text-[11px] font-bold capitalize text-[#194a5d] truncate w-full">
          {pokemon.name.replace(/-/g, ' ')}
        </div>
        <div className="font-display text-xs sm:text-[13px] font-bold text-[#255f75] tracking-wider mt-0.5">
          {formattedId}
        </div>
      </div>

      {/* Selected Badge (Non-color state indicator + Pokéball) */}
      {selected && (
        <div
          aria-hidden="true"
          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#0d7da8] text-white border-2 border-white flex items-center justify-center text-[10px] font-black shadow-md z-20"
        >
          ✓
        </div>
      )}
    </div>
  );
});

const RegionSection = React.memo(
  ({
    region,
    pokemons,
    selectedIds,
    togglePokemon,
    handleRegionSelection,
    isCollapsed,
    toggleCollapse,
    onSelectFamily,
  }) => {
    const selectedCount = pokemons.filter((p) => selectedIds.has(p.id)).length;
    const totalCount = pokemons.length;

    if (totalCount === 0) return null;

    return (
      <section
        id={`region-${region}`}
        aria-label={`${region} Pokédex section`}
        className="scroll-mt-44 mb-7 region-section-optimized space-y-3"
        style={{ contentVisibility: 'auto', containIntrinsicSize: '0 520px' }}
      >
        {/* Screenshot 3 Regional Banner Card */}
        <PogoRegionBanner
          region={region}
          selectedCount={selectedCount}
          totalCount={totalCount}
          isCollapsed={isCollapsed}
          onToggleCollapse={() => toggleCollapse(region)}
          onSelectAll={() => handleRegionSelection(pokemons.map((p) => p.id), true)}
          onDeselectAll={() => handleRegionSelection(pokemons.map((p) => p.id), false)}
        />

        {/* Screenshot 2 Uppercase Section Label + Dense Frosted Ice-Glass Grid */}
        {!isCollapsed && (
          <div className="space-y-2 pt-0.5">
            <div className="flex items-center justify-between px-1">
              <span className="font-display text-xs sm:text-sm font-extrabold uppercase tracking-wider text-[#0c749c]">
                {region}
              </span>
              <span className="text-[11px] font-bold text-[#285d72]">
                {selectedCount} / {totalCount} selected
              </span>
            </div>

            <div
              id={`region-grid-${region}`}
              className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2 sm:gap-2.5"
            >
              {pokemons.map((p) => (
                <PokemonCard
                  key={p.id}
                  pokemon={p}
                  selected={selectedIds.has(p.id)}
                  toggle={togglePokemon}
                  onSelectFamily={onSelectFamily}
                />
              ))}
            </div>
          </div>
        )}
      </section>
    );
  },
  areRegionPropsEqual
);

function PokemonGrid({
  pokemonList,
  selectedIds,
  togglePokemon,
  handleRegionSelection,
  searchQuery,
  setSearchQuery,
  selectedOnly,
  setSelectedOnly,
  filters,
  setFilters,
  onRegionVisible,
  onOpenFilters,
}) {
  const [collapsedRegions, setCollapsedRegions] = useState({});
  const lastClickedId = useRef(null);

  const visibleListRef = useRef([]);
  const selectedIdsRef = useRef(selectedIds);

  useEffect(() => {
    selectedIdsRef.current = selectedIds;
  }, [selectedIds]);

  // Group and Filter Pokémon (supports 4-digit Dex #, Name, and Type filter)
  const filterTypes = filters?.types;
  const { groupedRegions, visibleList } = useMemo(() => {
    const grouped = {};
    const visible = [];
    const query = searchQuery.toLowerCase().trim();
    const numericQuery = query.replace(/^#?0+/, '');
    const activeTypeSet = filterTypes?.length ? new Set(filterTypes) : null;

    pokemonList.forEach((p) => {
      const padded4 = String(p.id).padStart(4, '0');
      const matchesSearch =
        !query ||
        p.name.toLowerCase().includes(query) ||
        String(p.id) === query ||
        (numericQuery && String(p.id) === numericQuery) ||
        padded4.includes(query) ||
        p.types.some((t) => t.toLowerCase().includes(query));

      const matchesSelected = !selectedOnly || selectedIds.has(p.id);
      const matchesTypeFilter = !activeTypeSet || p.types.some((t) => activeTypeSet.has(t));

      if (matchesSearch && matchesSelected && matchesTypeFilter) {
        if (!grouped[p.region]) grouped[p.region] = [];
        grouped[p.region].push(p);
        visible.push(p);
      }
    });

    return { groupedRegions: grouped, visibleList: visible };
  }, [pokemonList, searchQuery, selectedOnly, selectedIds, filterTypes]);

  useEffect(() => {
    visibleListRef.current = visibleList;
  }, [visibleList]);

  const toggleCollapse = useCallback((region) => {
    setCollapsedRegions((prev) => ({
      ...prev,
      [region]: !prev[region],
    }));
  }, []);

  const handleSelectFamily = useCallback(
    (familyIds) => {
      handleRegionSelection(familyIds, true);
    },
    [handleRegionSelection]
  );

  // Shift + Click range selection support
  const handleToggleCard = useCallback(
    (id, event) => {
      if (
        event &&
        event.shiftKey &&
        lastClickedId.current !== null &&
        lastClickedId.current !== id
      ) {
        const currentVisible = visibleListRef.current;
        const idx1 = currentVisible.findIndex((p) => p.id === lastClickedId.current);
        const idx2 = currentVisible.findIndex((p) => p.id === id);

        if (idx1 !== -1 && idx2 !== -1) {
          const start = Math.min(idx1, idx2);
          const end = Math.max(idx1, idx2);
          const rangeIds = currentVisible.slice(start, end + 1).map((p) => p.id);

          const targetSelection = selectedIdsRef.current.has(lastClickedId.current);
          handleRegionSelection(rangeIds, targetSelection);

          lastClickedId.current = id;
          return;
        }
      }

      togglePokemon(id);
      lastClickedId.current = id;
    },
    [togglePokemon, handleRegionSelection]
  );

  // Track visible region via IntersectionObserver
  useEffect(() => {
    if (!onRegionVisible) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const intersectingEntry = entries.find((entry) => entry.isIntersecting);
        if (intersectingEntry) {
          const regionName = intersectingEntry.target.id.replace('region-', '');
          onRegionVisible(regionName);
        }
      },
      {
        root: null,
        rootMargin: '-200px 0px -50% 0px',
        threshold: 0,
      }
    );

    const regionElements = document.querySelectorAll('.region-section-optimized');
    regionElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [groupedRegions, onRegionVisible]);

  // Quick Modifier Toggles matching Screenshot 2's SHINY / LUCKY / XXL / XXS / ★ 100% strip
  const toggleQuickAttr = useCallback(
    (attr) => {
      if (!setFilters) return;
      setFilters((prev) => ({
        ...prev,
        [attr]: prev[attr] === true ? null : true,
      }));
    },
    [setFilters]
  );

  const togglePerfect4Star = useCallback(() => {
    if (!setFilters) return;
    setFilters((prev) => ({
      ...prev,
      appraisal: prev.appraisal.includes('4*')
        ? prev.appraisal.filter((s) => s !== '4*')
        : [...prev.appraisal, '4*'],
    }));
  }, [setFilters]);

  const is4StarActive = Boolean(filters?.appraisal?.includes('4*'));
  const shinyFilter = filters?.shiny;
  const luckyFilter = filters?.lucky;
  const xxlFilter = filters?.xxl;
  const xxsFilter = filters?.xxs;

  const summaryStats = useMemo(
    () => [
      {
        label: 'SHINY',
        value: shinyFilter === true ? 'ON' : shinyFilter === false ? '!OFF' : '—',
        active: shinyFilter === true,
        onClick: () => toggleQuickAttr('shiny'),
      },
      {
        label: 'LUCKY',
        value: luckyFilter === true ? 'ON' : luckyFilter === false ? '!OFF' : '—',
        active: luckyFilter === true,
        onClick: () => toggleQuickAttr('lucky'),
      },
      {
        label: 'XXL',
        value: xxlFilter === true ? 'ON' : xxlFilter === false ? '!OFF' : '—',
        active: xxlFilter === true,
        onClick: () => toggleQuickAttr('xxl'),
      },
      {
        label: 'XXS',
        value: xxsFilter === true ? 'ON' : xxsFilter === false ? '!OFF' : '—',
        active: xxsFilter === true,
        onClick: () => toggleQuickAttr('xxs'),
      },
      {
        label: '★ 100%',
        value: is4StarActive ? '4*' : '—',
        active: is4StarActive,
        onClick: togglePerfect4Star,
      },
    ],
    [shinyFilter, luckyFilter, xxlFilter, xxsFilter, is4StarActive, toggleQuickAttr, togglePerfect4Star]
  );

  const activeFilterBadgeCount = useMemo(() => {
    if (!filters) return 0;
    let c = (filters.appraisal?.length || 0) + (filters.types?.length || 0);
    if (filters.ageMin !== '' || filters.ageMax !== '') c += 1;
    Object.keys(filters).forEach((k) => {
      if (!['appraisal', 'ageMin', 'ageMax', 'types', 'attributeLogic'].includes(k) && filters[k] !== null) {
        c += 1;
      }
    });
    return c;
  }, [filters]);

  return (
    <div className="space-y-4 pb-36 px-3 sm:px-5 max-w-7xl mx-auto pt-4">
      {/* Screenshot 2 Frosted Pokédex Summary Card */}
      <PogoSummaryCard
        title="POKÉDEX OVERVIEW"
        pillText={`${selectedIds.size} / ${pokemonList.length}`}
        stats={summaryStats}
      />

      {/* Screenshot 1 Pure White Pill Search + Screenshot 2/3 Frosted Pill Controls */}
      <div className="space-y-2.5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <PogoSearchInput
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClear={() => setSearchQuery('')}
            placeholder="Search by Name, 0494 Dex #, or Type"
            ariaLabel="Search Pokémon by Name, Dex Number, or Type"
            className="flex-1"
          />

          <div className="flex items-center gap-2 shrink-0">
            {/* Mobile / Tablet Filter Trigger with Screenshot 1 Funnel Icon */}
            <button
              type="button"
              onClick={onOpenFilters}
              aria-label="Open Filter By panel"
              className={`lg:hidden flex-1 sm:flex-none px-4 py-2.5 text-xs uppercase inline-flex items-center justify-center gap-1.5 cursor-pointer ${
                activeFilterBadgeCount > 0 ? 'pogo-pill-active' : 'pogo-pill'
              }`}
            >
              <PogoCategoryIcon name="funnel" className="w-4 h-4" />
              <span>FILTER BY{activeFilterBadgeCount > 0 ? ` (${activeFilterBadgeCount})` : ''}</span>
            </button>

            {visibleList.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  const visibleIds = visibleList.map((p) => p.id);
                  const hasAnySelected = visibleIds.some((id) => selectedIds.has(id));
                  handleRegionSelection(visibleIds, !hasAnySelected);
                }}
                className="flex-1 sm:flex-none pogo-pill px-4 py-2.5 text-xs uppercase cursor-pointer whitespace-nowrap"
              >
                {visibleList.some((p) => selectedIds.has(p.id)) ? 'CLEAR VISIBLE' : 'SELECT VISIBLE'}
              </button>
            )}
          </div>
        </div>

        {/* Screenshot 2 & 3 Floating Horizontal Category Pill Strip (POKÉMON, SHINY, LUCKY, XXL, XXS, ★ 100%) */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 select-none">
          <button
            type="button"
            onClick={() => setSelectedOnly(false)}
            aria-pressed={!selectedOnly}
            className={`px-4 py-1.5 text-xs uppercase shrink-0 cursor-pointer ${
              !selectedOnly ? 'pogo-pill-active' : 'pogo-pill'
            }`}
          >
            POKÉMON
          </button>

          <button
            type="button"
            onClick={() => setSelectedOnly((v) => !v)}
            aria-pressed={selectedOnly}
            className={`px-4 py-1.5 text-xs uppercase shrink-0 cursor-pointer ${
              selectedOnly ? 'pogo-pill-active' : 'pogo-pill'
            }`}
          >
            SELECTED ({selectedIds.size})
          </button>

          <button
            type="button"
            onClick={() => toggleQuickAttr('shiny')}
            aria-pressed={filters?.shiny === true}
            className={`px-4 py-1.5 text-xs uppercase shrink-0 cursor-pointer ${
              filters?.shiny === true ? 'pogo-pill-active' : 'pogo-pill'
            }`}
          >
            SHINY
          </button>

          <button
            type="button"
            onClick={() => toggleQuickAttr('lucky')}
            aria-pressed={filters?.lucky === true}
            className={`px-4 py-1.5 text-xs uppercase shrink-0 cursor-pointer ${
              filters?.lucky === true ? 'pogo-pill-active' : 'pogo-pill'
            }`}
          >
            LUCKY
          </button>

          <button
            type="button"
            onClick={() => toggleQuickAttr('xxl')}
            aria-pressed={filters?.xxl === true}
            className={`px-4 py-1.5 text-xs uppercase shrink-0 cursor-pointer ${
              filters?.xxl === true ? 'pogo-pill-active' : 'pogo-pill'
            }`}
          >
            XXL
          </button>

          <button
            type="button"
            onClick={() => toggleQuickAttr('xxs')}
            aria-pressed={filters?.xxs === true}
            className={`px-4 py-1.5 text-xs uppercase shrink-0 cursor-pointer ${
              filters?.xxs === true ? 'pogo-pill-active' : 'pogo-pill'
            }`}
          >
            XXS
          </button>

          <button
            type="button"
            onClick={togglePerfect4Star}
            aria-pressed={is4StarActive}
            className={`px-4 py-1.5 text-xs uppercase shrink-0 cursor-pointer ${
              is4StarActive ? 'pogo-pill-active' : 'pogo-pill'
            }`}
          >
            ★ 100%
          </button>
        </div>
      </div>

      {/* Empty State */}
      {visibleList.length === 0 && (
        <div className="pogo-summary-card p-10 text-center">
          <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-[#0d7da8]/12 text-[#0b698e] flex items-center justify-center">
            <PogoCategoryIcon name="pokedex" className="w-7 h-7" />
          </div>
          <h3 className="font-display text-base font-extrabold text-[#123c4d] uppercase tracking-wider">
            No Pokémon Found
          </h3>
          <p className="text-xs text-[#285d72] mt-1 max-w-sm mx-auto font-medium">
            Try clearing your search query, toggling off &ldquo;SELECTED&rdquo;, or resetting active type filters.
          </p>
        </div>
      )}

      {/* Region Banner + Frosted Tile Sections */}
      <div>
        {Object.entries(groupedRegions).map(([region, pokemons]) => (
          <RegionSection
            key={region}
            region={region}
            pokemons={pokemons}
            selectedIds={selectedIds}
            togglePokemon={handleToggleCard}
            handleRegionSelection={handleRegionSelection}
            isCollapsed={collapsedRegions[region]}
            toggleCollapse={toggleCollapse}
            onSelectFamily={handleSelectFamily}
          />
        ))}
      </div>
    </div>
  );
}

export default React.memo(PokemonGrid);
