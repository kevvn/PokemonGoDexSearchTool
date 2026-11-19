import React, { useState, useMemo } from 'react';
import { ATTRIBUTES, TYPES } from '../utils/searchUtils';
import {
  PogoTypeIcon,
  PogoCategoryIcon,
  PogoMedallionBadge,
  PogoCloseButton,
} from './ui/PogoDesignSystem';

const SPECIAL_MEDALLIONS = [
  { attr: 'legendary', label: 'Legendary', icon: 'legendary', bg: '#5b5668' },
  { attr: 'mythical', label: 'Mythical', icon: 'mythical', bg: '#ea8ce2' },
  { attr: 'shiny', label: 'Shiny', icon: 'shiny', bg: '#e5a91a' },
  { attr: 'lucky', label: 'Lucky', icon: 'lucky', bg: '#eb8c1e' },
  { attr: 'shadow', label: 'Shadow', icon: 'shadow', bg: '#6e48a3' },
  { attr: 'traded', label: 'Traded', icon: 'caught', bg: '#86898c' },
  { attr: 'costume', label: 'Costume', icon: 'seen', bg: '#86898c' },
  { attr: 'favorite', label: 'Favorite', icon: 'favorite', bg: '#d99b16' },
];

const ATTRIBUTE_CATEGORIES = [
  {
    name: 'Status & Rarities',
    items: ['shiny', 'lucky', 'legendary', 'mythical', 'ultra beasts', 'shadow', 'purified', 'favorite'],
  },
  {
    name: 'Forms & Battle',
    items: ['mega', 'megaevolve', 'dynamax', 'gigantamax', 'evolve', 'costume'],
  },
  {
    name: 'Origin & BGs',
    items: [
      'traded',
      'hatched',
      'raid',
      'remoteraid',
      'research',
      'defender',
      'background',
      'locationbackground',
      'specialbackground',
      'profilebackground',
      'locationcard',
    ],
  },
  {
    name: 'Size & Buddy',
    items: ['xxs', 'xxl', 'buddy0', 'buddy1', 'buddy2', 'buddy3', 'buddy4', 'buddy5'],
  },
  {
    name: 'Regional',
    items: ['alola', 'galar', 'hisui', 'paldea'],
  },
];

function FilterPanel({
  filters,
  setFilters,
  pokemonList = [],
  selectedCount = 0,
  onClose,
  handleInvertSelection,
}) {
  const [activeTab, setActiveTab] = useState('Status & Rarities');

  // Compute real species count per Pokémon Type (matches Screenshot 1 counts under each type circle)
  const typeCounts = useMemo(() => {
    const counts = {};
    TYPES.forEach((t) => {
      counts[t] = 0;
    });
    pokemonList.forEach((p) => {
      p.types.forEach((t) => {
        if (counts[t] !== undefined) counts[t] += 1;
      });
    });
    return counts;
  }, [pokemonList]);

  const toggleAppraisal = (star) => {
    setFilters((prev) => ({
      ...prev,
      appraisal: prev.appraisal.includes(star)
        ? prev.appraisal.filter((s) => s !== star)
        : [...prev.appraisal, star],
    }));
  };

  const setAttribute = (attr, value) => {
    setFilters((prev) => ({ ...prev, [attr]: value }));
  };

  const cycleMedallionAttribute = (attr) => {
    setFilters((prev) => {
      const cur = prev[attr];
      const next = cur === null ? true : cur === true ? false : null;
      return { ...prev, [attr]: next };
    });
  };

  const toggleType = (type) => {
    setFilters((prev) => ({
      ...prev,
      types: prev.types.includes(type)
        ? prev.types.filter((t) => t !== type)
        : [...prev.types, type],
    }));
  };

  const resetFilters = () => {
    setFilters({
      appraisal: [],
      ageMin: '',
      ageMax: '',
      types: [],
      attributeLogic: 'AND',
      ...ATTRIBUTES.reduce((acc, attr) => ({ ...acc, [attr]: null }), {}),
    });
  };

  const applyPreset = (presetName) => {
    resetFilters();

    switch (presetName) {
      case 'perfect':
        setFilters((prev) => ({ ...prev, appraisal: ['4*'] }));
        break;
      case 'trash':
        setFilters((prev) => ({
          ...prev,
          appraisal: ['0*', '1*', '2*'],
          shiny: false,
          legendary: false,
          mythical: false,
          lucky: false,
          costume: false,
          favorite: false,
          background: false,
        }));
        break;
      case 'pvp':
        setFilters((prev) => ({
          ...prev,
          evolve: true,
          legendary: false,
          mythical: false,
        }));
        break;
      case 'legendary':
        setFilters((prev) => ({
          ...prev,
          legendary: true,
        }));
        break;
      case 'trade':
        setFilters((prev) => ({
          ...prev,
          traded: false,
          mythical: false,
          favorite: false,
        }));
        break;
      case 'dynamax':
        setFilters((prev) => ({
          ...prev,
          dynamax: true,
        }));
        break;
      default:
        break;
    }
  };

  const applyAgePreset = (days) => {
    if (days === 'today') {
      setFilters((prev) => ({ ...prev, ageMin: '0', ageMax: '0' }));
    } else if (days === 'yesterday') {
      setFilters((prev) => ({ ...prev, ageMin: '1', ageMax: '1' }));
    } else if (days === 'week') {
      setFilters((prev) => ({ ...prev, ageMin: '0', ageMax: '7' }));
    } else if (days === 'month') {
      setFilters((prev) => ({ ...prev, ageMin: '0', ageMax: '30' }));
    }
  };

  return (
    <div className="pogo-pokedex-canvas rounded-t-3xl lg:rounded-3xl lg:border-2 lg:border-white/85 lg:shadow-pogo-glass relative max-h-[85dvh] lg:max-h-none h-full flex flex-col overflow-hidden text-[#123c4d]">
      {/* Mobile Drag-Handle Pill */}
      <div className="lg:hidden flex justify-center pt-2.5 pb-1 bg-[#c4effa]/90 backdrop-blur-md shrink-0" aria-hidden="true">
        <div className="w-10 h-1.5 rounded-full bg-[#0d7da8]/30" />
      </div>

      {/* Screenshot 1 Top Header: FILTER BY: + Reset + Circular Close */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/60 bg-[#c4effa]/90 backdrop-blur-md shrink-0 lg:rounded-t-3xl">
        <div className="flex items-center gap-2 select-none">
          <PogoCategoryIcon name="funnel" className="w-4 h-4 text-[#1b4d60]" />
          <div>
            <h3 className="font-display font-extrabold text-xs sm:text-sm text-[#1b4d60] tracking-wider uppercase leading-none">
              FILTER BY:
            </h3>
            <span className="text-[10px] text-[#285d72] font-semibold">
              Selected: {selectedCount}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={resetFilters}
            aria-label="Reset all search filters"
            className="compact-inline-chip text-[11px] font-extrabold uppercase tracking-wider text-[#0b698e] bg-white/85 hover:bg-white px-3 py-1 rounded-full border border-white shadow-2xs cursor-pointer"
          >
            Reset
          </button>

          <PogoCloseButton
            onClick={onClose}
            ariaLabel="Close filters sheet"
            size="sm"
            className="lg:hidden"
          />
        </div>
      </div>

      {/* Scrollable Pokédex Medallion & Modifier Sections */}
      <div className="px-4 py-4 space-y-6 overflow-y-auto flex-1 pb-6">
        {/* Screenshot 1: Special & Status Circular Medallions */}
        <section className="space-y-2.5">
          <div className="flex items-baseline justify-between">
            <h4 className="font-display font-bold text-sm text-[#1b4d60]">
              Special &amp; Status
            </h4>
            <span className="text-[11px] font-semibold text-[#285d72]">
              Tap: ✓ Require • ✕ Exclude
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {SPECIAL_MEDALLIONS.map((item) => {
              const val = filters[item.attr];
              const triState = val === true ? 'include' : val === false ? 'exclude' : 'off';
              return (
                <div key={item.attr} className="flex flex-col items-center">
                  <PogoMedallionBadge
                    label={item.label}
                    colorStyle={{ backgroundColor: item.bg }}
                    triState={triState}
                    onClick={() => cycleMedallionAttribute(item.attr)}
                    ariaLabel={`${item.label} filter (${
                      triState === 'include' ? 'required' : triState === 'exclude' ? 'excluded' : 'off'
                    })`}
                  >
                    <PogoCategoryIcon name={item.icon} className="w-6 h-6" />
                  </PogoMedallionBadge>
                  {triState !== 'off' && (
                    <span
                      className={`text-[11px] font-extrabold leading-none mt-0.5 ${
                        triState === 'include' ? 'text-[#0b698e]' : 'text-rose-600'
                      }`}
                    >
                      {triState === 'include' ? 'Require' : 'Exclude'}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Screenshot 1: Pokémon Type Circular Medallions (4-Column Grid with Species Counts) */}
        <section className="space-y-2.5">
          <div className="flex items-baseline justify-between">
            <h4 className="font-display font-bold text-sm text-[#1b4d60]">
              Pokémon Type
            </h4>
            {filters.types.length > 0 && (
              <button
                type="button"
                onClick={() => setFilters((prev) => ({ ...prev, types: [] }))}
                className="compact-inline-chip text-[11px] font-bold text-[#0b698e] hover:underline cursor-pointer"
              >
                Clear ({filters.types.length})
              </button>
            )}
          </div>

          <div className="grid grid-cols-4 gap-y-3 gap-x-1.5">
            {TYPES.map((type) => {
              const isSelected = filters.types.includes(type);
              return (
                <PogoMedallionBadge
                  key={type}
                  label={type}
                  count={typeCounts[type] || 0}
                  colorClass={`bg-type-${type}`}
                  active={isSelected}
                  onClick={() => toggleType(type)}
                  ariaLabel={`${type} type filter (${typeCounts[type] || 0} species)`}
                >
                  <PogoTypeIcon type={type} className="w-6 h-6" />
                </PogoMedallionBadge>
              );
            })}
          </div>
        </section>

        {/* Appraisal IV Rating */}
        <section className="space-y-2">
          <h4 className="font-display font-bold text-sm text-[#1b4d60]">
            Appraisal Rating
          </h4>
          <div className="grid grid-cols-5 gap-1.5 select-none">
            {['0*', '1*', '2*', '3*', '4*'].map((star) => {
              const isActive = filters.appraisal.includes(star);
              return (
                <button
                  key={star}
                  type="button"
                  onClick={() => toggleAppraisal(star)}
                  aria-pressed={isActive}
                  aria-label={`Appraisal rating ${star}`}
                  className={`py-2 rounded-2xl text-xs font-extrabold flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                    isActive ? 'pogo-pill-active' : 'pogo-pill'
                  }`}
                >
                  <span className="text-[12px]" aria-hidden="true">
                    {star === '4*' ? '★' : '☆'}
                  </span>
                  <span>{star}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Player Quick Presets + Invert Selection */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-display font-bold text-sm text-[#1b4d60]">
              Quick Presets
            </h4>
            <button
              type="button"
              onClick={handleInvertSelection}
              aria-label="Invert current Pokémon selection"
              className="compact-inline-chip px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-white/85 hover:bg-white text-[#0b698e] border border-white shadow-2xs cursor-pointer"
            >
              ⇄ Invert Dex
            </button>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {[
              { id: 'perfect', label: '★ 4* (100% IV)' },
              { id: 'trash', label: '🧹 0*-2* Transfer' },
              { id: 'pvp', label: '⚔️ PvP Evolves' },
              { id: 'legendary', label: '👑 Legendaries' },
              { id: 'trade', label: '🔄 Trade Eligible' },
              { id: 'dynamax', label: '⚡ Dynamax' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => applyPreset(p.id)}
                className="pogo-glass-card py-2 px-3 text-left text-[11px] font-extrabold text-[#123c4d] hover:bg-white cursor-pointer"
              >
                {p.label}
              </button>
            ))}
          </div>
        </section>

        {/* Caught Date / Age */}
        <section className="pogo-summary-card p-3.5 space-y-2.5">
          <h4 className="font-display font-bold text-xs uppercase tracking-wider text-[#0c6c91]">
            Caught Age (Days)
          </h4>

          <div className="grid grid-cols-4 gap-1.5 select-none">
            {[
              { id: 'today', label: 'Today' },
              { id: 'yesterday', label: '1d' },
              { id: 'week', label: '0-7d' },
              { id: 'month', label: '0-30d' },
            ].map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => applyAgePreset(b.id)}
                className="compact-inline-chip py-1.5 rounded-full text-[11px] font-extrabold uppercase bg-white hover:bg-[#e6f6fc] text-[#1b4d60] border border-[#0d7da8]/20 cursor-pointer text-center"
              >
                {b.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-extrabold text-[#0b698e] uppercase tracking-wider pointer-events-none">
                MIN
              </span>
              <input
                type="number"
                placeholder="0"
                value={filters.ageMin}
                onChange={(e) => setFilters((prev) => ({ ...prev, ageMin: e.target.value }))}
                aria-label="Minimum caught age in days"
                className="w-full pl-12 pr-2 py-2 rounded-full bg-white border border-[#0d7da8]/25 text-base sm:text-xs text-[#123c4d] placeholder-[#396d82]/60 focus:outline-none focus:border-[#0d7da8] font-bold"
              />
            </div>
            <span className="text-[#285d72] font-bold">–</span>
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-extrabold text-[#0b698e] uppercase tracking-wider pointer-events-none">
                MAX
              </span>
              <input
                type="number"
                placeholder="Any"
                value={filters.ageMax}
                onChange={(e) => setFilters((prev) => ({ ...prev, ageMax: e.target.value }))}
                aria-label="Maximum caught age in days"
                className="w-full pl-12 pr-2 py-2 rounded-full bg-white border border-[#0d7da8]/25 text-base sm:text-xs text-[#123c4d] placeholder-[#396d82]/60 focus:outline-none focus:border-[#0d7da8] font-bold"
              />
            </div>
          </div>
        </section>

        {/* All Advanced Modifiers (Tri-State Drawer) */}
        <section className="pogo-summary-card p-3.5 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-display font-bold text-xs uppercase tracking-wider text-[#0c6c91]">
              All Modifiers
            </h4>

            <div className="inline-flex items-center rounded-full bg-[#dff3fb] p-0.5 border border-[#0d7da8]/20 text-[11px] font-extrabold select-none">
              <button
                type="button"
                onClick={() => setFilters((prev) => ({ ...prev, attributeLogic: 'AND' }))}
                aria-pressed={(filters.attributeLogic || 'AND') === 'AND'}
                className={`compact-inline-chip px-2 py-0.5 rounded-full cursor-pointer ${
                  (filters.attributeLogic || 'AND') === 'AND'
                    ? 'bg-[#0d7da8] text-white'
                    : 'text-[#1b4d60]'
                }`}
              >
                &amp; AND
              </button>
              <button
                type="button"
                onClick={() => setFilters((prev) => ({ ...prev, attributeLogic: 'OR' }))}
                aria-pressed={filters.attributeLogic === 'OR'}
                className={`compact-inline-chip px-2 py-0.5 rounded-full cursor-pointer ${
                  filters.attributeLogic === 'OR'
                    ? 'bg-[#0d7da8] text-white'
                    : 'text-[#1b4d60]'
                }`}
              >
                , OR
              </button>
            </div>
          </div>

          <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1 select-none">
            {ATTRIBUTE_CATEGORIES.map((cat) => (
              <button
                key={cat.name}
                type="button"
                onClick={() => setActiveTab(cat.name)}
                className={`compact-inline-chip px-3 py-1 text-[11px] uppercase whitespace-nowrap cursor-pointer ${
                  activeTab === cat.name ? 'pogo-pill-active' : 'pogo-pill'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-1.5">
            {ATTRIBUTE_CATEGORIES.find((c) => c.name === activeTab)?.items.map((attr) => {
              const currentVal = filters[attr];

              return (
                <div
                  key={attr}
                  className="bg-white/85 px-3 py-2 rounded-2xl border border-white flex items-center justify-between gap-2 shadow-2xs"
                >
                  <span className="capitalize text-xs font-bold text-[#123c4d] truncate" title={attr}>
                    {attr}
                  </span>

                  <div className="flex rounded-full overflow-hidden border border-[#0d7da8]/25 bg-[#eef9fd] text-xs shrink-0 select-none">
                    <button
                      type="button"
                      onClick={() => setAttribute(attr, currentVal === true ? null : true)}
                      aria-label={`Require ${attr}`}
                      aria-pressed={currentVal === true}
                      className={`compact-inline-chip min-h-[36px] px-3 py-1 flex items-center justify-center font-black border-r border-[#0d7da8]/15 cursor-pointer ${
                        currentVal === true
                          ? 'bg-[#0d7da8] text-white'
                          : 'text-[#396d82] hover:bg-white'
                      }`}
                    >
                      ✓
                    </button>

                    <button
                      type="button"
                      onClick={() => setAttribute(attr, null)}
                      aria-label={`Ignore ${attr} filter`}
                      aria-pressed={currentVal === null}
                      className={`compact-inline-chip min-h-[36px] px-3 py-1 flex items-center justify-center font-bold border-r border-[#0d7da8]/15 cursor-pointer ${
                        currentVal === null
                          ? 'bg-white text-[#123c4d] font-black'
                          : 'text-[#396d82] hover:bg-white'
                      }`}
                    >
                      —
                    </button>

                    <button
                      type="button"
                      onClick={() => setAttribute(attr, currentVal === false ? null : false)}
                      aria-label={`Exclude ${attr}`}
                      aria-pressed={currentVal === false}
                      className={`compact-inline-chip min-h-[36px] px-3 py-1 flex items-center justify-center font-black cursor-pointer ${
                        currentVal === false
                          ? 'bg-rose-600 text-white'
                          : 'text-[#396d82] hover:bg-white'
                      }`}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Mobile Sticky Bottom Done / Apply Bar */}
      <div className="lg:hidden sticky bottom-0 inset-x-0 px-4 py-3 bg-[#c4effa]/95 backdrop-blur-md border-t border-white/60 shrink-0 safe-bottom-dock">
        <button
          type="button"
          onClick={onClose}
          className="w-full pogo-pill-active py-2.5 text-xs uppercase tracking-wider font-extrabold cursor-pointer"
        >
          Done / Apply
        </button>
      </div>
    </div>
  );
}

export default React.memo(FilterPanel);
