import React, { useCallback, useMemo } from 'react';
import { getPokemonFamilyIds } from '../../models/familyModel';
import { areRegionPropsEqual } from '../../models/pokedexModel';
import { TYPES } from '../../models/searchEngine';
import {
  PogoCategoryIcon,
  PogoRegionBanner,
  PogoSearchInput,
  PogoSummaryCard,
  PogoTypeIcon,
} from '../shared/PogoDesignSystem';
import PokemonSprite from '../shared/PokemonSprite';

const PokemonCard = React.memo(({ pokemon, selected, toggle, onSelectFamily, familyMode }) => {
  const hasMultiFamily = Array.isArray(pokemon.familyDexes) && pokemon.familyDexes.length > 1;

  const handleFamilyClick = (e) => {
    e.stopPropagation();
    const familyIds = getPokemonFamilyIds(pokemon);
    onSelectFamily(familyIds, true);
  };

  const handleCardClick = (e) => {
    if (familyMode) {
      const familyIds = getPokemonFamilyIds(pokemon);
      onSelectFamily(familyIds, !selected);
      return;
    }
    toggle(pokemon.id, e);
  };

  const formattedId = String(pokemon.id).padStart(4, '0');

  return (
    <div
      className={`pogo-dex-tile relative pt-2 pb-2 px-1.5 flex flex-col items-center justify-between select-none group/card min-h-[122px] sm:min-h-[132px] ${
        selected ? 'pogo-dex-tile-selected' : ''
      }`}
    >
      {/* Stretched native button for tile selection (avoids nested interactive controls) */}
      <button
        type="button"
        aria-pressed={selected}
        aria-label={`#${formattedId} ${pokemon.name}, ${pokemon.types.join(', ')}`}
        onClick={handleCardClick}
        className="absolute inset-0 w-full h-full rounded-[inherit] cursor-pointer z-0 bg-transparent border-0"
      />

      <div className="w-full flex items-center justify-between gap-1 px-0.5 relative z-10 min-h-[18px] pointer-events-none">
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

        {hasMultiFamily && (
          <button
            type="button"
            onClick={handleFamilyClick}
            title={`Select full evolution family (${pokemon.familyDexes.length} species)`}
            aria-label={`Select evolution family for ${pokemon.name}`}
            className="pointer-events-auto relative z-20 pogo-tile-actions compact-inline-chip text-[9px] bg-white/95 hover:bg-[#0d7da8] text-[#0b698e] hover:text-white font-extrabold px-1.5 py-0.5 rounded-full border border-[#0d7da8]/30 cursor-pointer shadow-2xs leading-none"
          >
            + Fam
          </button>
        )}
      </div>

      <div className="relative w-16 h-16 sm:w-[72px] sm:h-[72px] flex items-center justify-center my-0.5 pointer-events-none">
        <PokemonSprite
          src={pokemon.sprite}
          alt=""
          className="w-16 h-16 sm:w-[70px] sm:h-[70px] object-contain rendering-pixelated relative z-10 drop-shadow-[0_3px_5px_rgba(9,65,92,0.22)] transition-transform duration-200 group-hover/card:scale-110"
          width="70"
          height="70"
        />
      </div>

      <div className="w-full text-center px-0.5 leading-tight pointer-events-none relative z-10">
        <div className="text-[10px] sm:text-[11px] font-bold capitalize text-[#194a5d] truncate w-full">
          {pokemon.name.replace(/-/g, ' ')}
        </div>
        <div className="font-display text-xs sm:text-[13px] font-bold text-[#255f75] tracking-wider mt-0.5">
          {formattedId}
        </div>
      </div>

      {selected && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#0d7da8] text-white border-2 border-white flex items-center justify-center text-[10px] font-black shadow-md z-20"
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
    familyMode,
    observeRegionRef,
  }) => {
    const selectedCount = pokemons.filter((p) => selectedIds.has(p.id)).length;
    const totalCount = pokemons.length;

    if (totalCount === 0) return null;

    return (
      <section
        id={`region-${region}`}
        ref={observeRegionRef}
        data-region={region}
        aria-label={`${region} Pokédex section`}
        className="scroll-mt-44 mb-7 region-section-optimized space-y-3"
        style={{ contentVisibility: 'auto', containIntrinsicSize: '0 520px' }}
      >
        <PogoRegionBanner
          region={region}
          selectedCount={selectedCount}
          totalCount={totalCount}
          isCollapsed={isCollapsed}
          onToggleCollapse={() => toggleCollapse(region)}
          onSelectAll={() => handleRegionSelection(pokemons.map((p) => p.id), true)}
          onDeselectAll={() => handleRegionSelection(pokemons.map((p) => p.id), false)}
        />

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
                  familyMode={familyMode}
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

const META_TONE_CLASSES = {
  teal: 'bg-white/90 hover:bg-[#0d7da8] text-[#0b698e] hover:text-white border-[#0d7da8]/30',
  amber: 'bg-amber-50/95 hover:bg-amber-500 text-amber-900 hover:text-white border-amber-300/80',
  purple: 'bg-purple-50/95 hover:bg-[#7c52b5] text-[#5c3791] hover:text-white border-purple-300/80',
  rose: 'bg-rose-50/95 hover:bg-rose-600 text-rose-800 hover:text-white border-rose-300/80',
  emerald: 'bg-emerald-50/95 hover:bg-[#1d7a4d] text-emerald-900 hover:text-white border-emerald-300/80',
  slate: 'bg-white/85 hover:bg-[#1b4d60] text-[#1b4d60] hover:text-white border-[#0d7da8]/20',
};

function PokemonGrid({
  pokemonList,
  metaSnapshot,
  selectedIds,
  handleRegionSelection,
  filters,
  setFilters,
  onOpenFilters,
  controller,
}) {
  const {
    searchQuery,
    selectedOnly,
    collapsedRegions,
    familyMode,
    pveType,
    activeMetaLabel,
    groupedRegions,
    visibleList,
    activeFilterBadgeCount,
    setSearchQuery,
    setSelectedOnly,
    toggleFamilyMode,
    toggleCollapse,
    setPveType,
    handleSelectFamily,
    applyMetaQuickSelect,
    clearMetaQuickSelect,
    handleToggleCard,
    observeRegionRef,
  } = controller;

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

  const pvp = metaSnapshot?.pvp || {};
  const pve = metaSnapshot?.pve || {};
  const max = metaSnapshot?.maxBattles || {};
  const special = metaSnapshot?.specialLists || {};

  const metaPresets = [
    { label: 'GL Top 100', ids: pvp.gl?.top100?.all, tone: 'teal' },
    { label: 'UL Top 100', ids: pvp.ul?.top100?.all, tone: 'amber' },
    { label: 'ML Top 100', ids: pvp.ml?.top100?.all, tone: 'purple' },
    { label: 'Max Attackers', ids: max.attackers, tone: 'rose' },
    { label: 'Max Tanks/Healers', ids: max.tanksAndHealers, tone: 'emerald' },
    { label: '12-Candy Fodder', ids: special.candy12Fodder, tone: 'slate' },
    { label: 'Trade Evos', ids: special.tradeEvolve, tone: 'slate' },
  ];

  return (
    <div className="space-y-4 pb-36 px-3 sm:px-5 max-w-7xl mx-auto pt-4">
      <PogoSummaryCard
        title="POKÉDEX OVERVIEW"
        pillText={`${selectedIds.size} / ${pokemonList.length}`}
        stats={summaryStats}
      />

      {metaSnapshot && (
        <section
          aria-label="Meta quick-select bar"
          className="pogo-summary-card px-4 py-3 space-y-2.5"
        >
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="font-display text-[11px] font-extrabold uppercase tracking-wider text-[#0b698e] flex items-center gap-1.5">
              <span aria-hidden="true">⚡</span>
              <span>Meta Quick-Select (Family-Expanded)</span>
            </span>
            <div className="flex items-center gap-2">
              {activeMetaLabel && selectedIds.size > 0 && (
                <span className="text-[11px] font-extrabold text-[#0d7da8]">
                  Loaded: {activeMetaLabel} ({selectedIds.size})
                </span>
              )}
              {selectedIds.size > 0 && (
                <button
                  type="button"
                  onClick={clearMetaQuickSelect}
                  className="compact-inline-chip text-[10px] font-extrabold text-rose-700 bg-white/95 hover:bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200 cursor-pointer"
                >
                  Clear Selection
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {metaPresets.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => applyMetaQuickSelect(preset.label, preset.ids)}
                className={`compact-inline-chip px-3 py-1 rounded-full text-[11px] font-extrabold border shadow-2xs transition-colors cursor-pointer ${
                  META_TONE_CLASSES[preset.tone]
                }`}
              >
                {preset.label}
              </button>
            ))}

            <div className="inline-flex items-center rounded-full border border-rose-300/80 bg-rose-50/95 overflow-hidden shadow-2xs">
              <button
                type="button"
                onClick={() =>
                  applyMetaQuickSelect(
                    `PvE Top 10 ${pveType.charAt(0).toUpperCase() + pveType.slice(1)}`,
                    pve.byType?.[pveType]
                  )
                }
                className="compact-inline-chip px-3 py-1 text-[11px] font-extrabold text-rose-800 hover:bg-rose-100 cursor-pointer"
              >
                PvE Top 10:
              </button>
              <select
                value={pveType}
                onChange={(e) => {
                  const nextType = e.target.value;
                  setPveType(nextType);
                  applyMetaQuickSelect(
                    `PvE Top 10 ${nextType.charAt(0).toUpperCase() + nextType.slice(1)}`,
                    pve.byType?.[nextType]
                  );
                }}
                aria-label="Select PvE attacker type"
                className="bg-white text-[#123c4d] text-base sm:text-[11px] font-extrabold px-2.5 py-1 capitalize cursor-pointer border-l border-rose-200"
              >
                {TYPES.map((typeName) => (
                  <option key={typeName} value={typeName}>
                    {typeName}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>
      )}

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

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 select-none">
          <button
            type="button"
            onClick={toggleFamilyMode}
            aria-pressed={familyMode}
            title="When ON, tapping any Pokémon selects or deselects its entire evolution family"
            className={`px-3.5 py-1.5 text-xs uppercase shrink-0 cursor-pointer inline-flex items-center gap-1.5 ${
              familyMode ? 'pogo-pill-active' : 'pogo-pill'
            }`}
          >
            <span aria-hidden="true">🧬</span>
            <span>FAMILY TAP {familyMode ? 'ON' : 'OFF'}</span>
          </button>

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
            familyMode={familyMode}
            observeRegionRef={observeRegionRef}
          />
        ))}
      </div>
    </div>
  );
}

export default React.memo(PokemonGrid);
