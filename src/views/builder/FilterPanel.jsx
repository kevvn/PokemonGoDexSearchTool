import React, { useMemo, useState, useSyncExternalStore } from 'react';
import { VERIFIED_FILTER_PRESETS, getVerifiedFilterPresetQuery } from '../../models/filterPresets';
import {
  cycleTriState,
  toTriStateLabel,
  toggleTriStateTarget,
} from '../../models/machines/triStateMachine';
import { selectedIdsStore } from '../../models/pokedexModel';
import {
  APPRAISALS,
  ATTRIBUTE_GROUPS,
  TYPES,
  createDefaultFilters,
  parseSearchString,
} from '../../models/searchEngine';
import {
  PogoCategoryIcon,
  PogoCloseButton,
  PogoMedallionBadge,
  PogoTypeIcon,
} from '../shared/PogoDesignSystem';

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

const MEGA_LEVEL_OPTIONS = [
  { value: '', label: 'Any Mega Level' },
  { value: 'mega0', label: 'mega0 (Never Mega Evolved)' },
  { value: 'mega1-2', label: 'mega1-2 (Leveling to Lv3)' },
  { value: 'mega1-3', label: 'mega1-3 (Leveling to Lv4)' },
  { value: 'mega3-', label: 'mega3- (Maxed Lv3+)' },
  { value: 'mega4', label: 'mega4 (Super Max Lv4)' },
];

const IV_BUCKET_OPTIONS = [
  { value: '', label: 'Any' },
  { value: '0', label: '0 (0 IV)' },
  { value: '1', label: '1 (1–5)' },
  { value: '2', label: '2 (6–10)' },
  { value: '3', label: '3 (11–14)' },
  { value: '4', label: '4 (15 IV)' },
];

const BUDDY_LEVEL_OPTIONS = [
  { value: '', label: 'Any' },
  { value: '0', label: '0 (Never)' },
  { value: '1', label: '1 (Good)' },
  { value: '2', label: '2 (Great)' },
  { value: '3', label: '3 (Ultra)' },
  { value: '4', label: '4 (Ultra+)' },
  { value: '5', label: '5 (Best)' },
];

/**
 * Isolated subscriber so tapping Pokémon cards updates only this tiny counter span
 * instead of re-rendering the entire 700-line FilterPanel!
 */
function SelectedCountLabel() {
  const selectedIds = useSyncExternalStore(
    selectedIdsStore.subscribe,
    selectedIdsStore.getSnapshot,
    selectedIdsStore.getServerSnapshot
  );
  return (
    <span className="text-[10px] text-[#285d72] font-semibold">
      Selected: {selectedIds.size}
    </span>
  );
}

function FilterPanel({
  filters,
  setFilters,
  pokemonList = [],
  onClose,
  handleInvertSelection,
  onApplyQuery,
}) {
  const [activeGroupId, setActiveGroupId] = useState(ATTRIBUTE_GROUPS[0]?.id || 'core');

  const ivStats = filters.ivStats || createDefaultFilters().ivStats;

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
    setFilters((prev) => ({
      ...prev,
      [attr]: value === null ? null : toggleTriStateTarget(prev[attr], value),
    }));
  };

  const cycleMedallionAttribute = (attr) => {
    setFilters((prev) => ({
      ...prev,
      [attr]: cycleTriState(prev[attr]),
    }));
  };

  const toggleType = (type) => {
    setFilters((prev) => ({
      ...prev,
      types: prev.types.includes(type)
        ? prev.types.filter((t) => t !== type)
        : [...prev.types, type],
    }));
  };

  const updateIvStat = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      ivStats: {
        ...(prev.ivStats || createDefaultFilters().ivStats),
        [key]: value,
      },
    }));
  };

  const resetFilters = () => {
    setFilters(createDefaultFilters());
  };

  const applyVerifiedPreset = (presetId) => {
    const query = getVerifiedFilterPresetQuery(presetId);
    if (!query) return;
    if (onApplyQuery) {
      onApplyQuery(query);
    } else {
      const { filters: nextFilters } = parseSearchString(query);
      setFilters(nextFilters);
    }
  };

  const applyAgePreset = (preset) => {
    if (preset === 'today') {
      setFilters((prev) => ({ ...prev, ageMin: '0', ageMax: '0' }));
    } else if (preset === 'weekend') {
      setFilters((prev) => ({ ...prev, ageMin: '0', ageMax: '2' }));
    } else if (preset === 'week') {
      setFilters((prev) => ({ ...prev, ageMin: '0', ageMax: '7' }));
    } else if (preset === 'month') {
      setFilters((prev) => ({ ...prev, ageMin: '0', ageMax: '30' }));
    }
  };

  const activeGroup = ATTRIBUTE_GROUPS.find((g) => g.id === activeGroupId) || ATTRIBUTE_GROUPS[0];

  return (
    <div className="pogo-pokedex-canvas lg:rounded-3xl lg:border-2 lg:border-white/85 lg:shadow-pogo-glass relative h-full flex flex-col text-[#123c4d]">
      <div className="flex items-center justify-between px-4 pb-3.5 pt-[max(0.875rem,env(safe-area-inset-top,0px))] lg:pt-3.5 border-b border-white/60 bg-[#c4effa]/90 backdrop-blur-md shrink-0 lg:rounded-t-3xl">
        <div className="flex items-center gap-2 select-none">
          <PogoCategoryIcon name="funnel" className="w-4 h-4 text-[#1b4d60]" />
          <div>
            <h3 className="font-display font-extrabold text-xs sm:text-sm text-[#1b4d60] tracking-wider uppercase leading-none">
              FILTER BY:
            </h3>
            <SelectedCountLabel />
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

      <div className="px-4 py-4 space-y-5 overflow-y-auto flex-1 pb-[max(5.5rem,calc(env(safe-area-inset-bottom,0px)+4.5rem))] lg:pb-6">
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-display font-bold text-sm text-[#1b4d60]">
              Verified Safe Presets
            </h4>
            <button
              type="button"
              onClick={handleInvertSelection}
              aria-label="Invert current Pokémon selection"
              className="compact-inline-chip px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-white/85 hover:bg-white text-[#0b698e] border border-white shadow-2xs cursor-pointer"
            >
              ⇄ Invert Dex
            </button>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {VERIFIED_FILTER_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                title={preset.title}
                onClick={() => applyVerifiedPreset(preset.id)}
                className="pogo-glass-card py-2 px-3 text-left text-[11px] font-extrabold text-[#123c4d] hover:bg-white cursor-pointer"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-2.5">
          <div className="flex items-baseline justify-between">
            <h4 className="font-display font-bold text-sm text-[#1b4d60]">
              Special &amp; Status
            </h4>
            <span className="text-[10px] font-semibold text-[#285d72]">
              Tap: ✓ Require • ✕ Exclude
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {SPECIAL_MEDALLIONS.map((item) => {
              const triState = toTriStateLabel(filters[item.attr]);
              return (
                <PogoMedallionBadge
                  key={item.attr}
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
              );
            })}
          </div>
        </section>

        <section className="space-y-2">
          <h4 className="font-display font-bold text-sm text-[#1b4d60]">
            Appraisal Rating
          </h4>
          <div className="grid grid-cols-5 gap-1.5 select-none">
            {APPRAISALS.map((star) => {
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

        <section className="pogo-summary-card p-3.5 space-y-2.5">
          <h4 className="font-display font-bold text-xs uppercase tracking-wider text-[#0c6c91]">
            IV Stat Bars &amp; Safe Shields
          </h4>

          <div className="space-y-1.5">
            {['attack', 'defense', 'hp'].map((stat) => (
              <div key={stat} className="grid grid-cols-[54px_1fr_auto_1fr] items-center gap-1.5">
                <span className="text-[11px] font-extrabold capitalize text-[#1b4d60]">{stat}</span>
                <select
                  value={ivStats[`${stat}Min`]}
                  onChange={(e) => updateIvStat(`${stat}Min`, e.target.value)}
                  aria-label={`${stat} min IV bar`}
                  className="bg-white border border-[#0d7da8]/25 rounded-full px-2 py-1 text-base sm:text-[11px] text-[#123c4d] font-bold focus:border-[#0d7da8]"
                >
                  {IV_BUCKET_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <span className="text-[#285d72] text-xs font-bold">–</span>
                <select
                  value={ivStats[`${stat}Max`]}
                  onChange={(e) => updateIvStat(`${stat}Max`, e.target.value)}
                  aria-label={`${stat} max IV bar`}
                  className="bg-white border border-[#0d7da8]/25 rounded-full px-2 py-1 text-base sm:text-[11px] text-[#123c4d] font-bold focus:border-[#0d7da8]"
                >
                  {IV_BUCKET_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <div className="space-y-1.5 pt-1">
            <button
              type="button"
              onClick={() => updateIvStat('excludePvpIv', !ivStats.excludePvpIv)}
              aria-pressed={Boolean(ivStats.excludePvpIv)}
              className={`w-full px-3 py-2 rounded-2xl text-[11px] font-extrabold border text-left transition-all cursor-pointer flex items-center justify-between ${
                ivStats.excludePvpIv
                  ? 'bg-[#1d7a4d] border-white text-white shadow-sm'
                  : 'bg-white/90 border-[#0d7da8]/20 text-[#123c4d] hover:bg-white'
              }`}
            >
              <span>🛡️ Exclude PvP IVs (De Morgan)</span>
              <span className="font-mono text-[10px]">{ivStats.excludePvpIv ? 'ON' : 'OFF'}</span>
            </button>
            <button
              type="button"
              onClick={() => updateIvStat('excludeNundo', !ivStats.excludeNundo)}
              aria-pressed={Boolean(ivStats.excludeNundo)}
              className={`w-full px-3 py-2 rounded-2xl text-[11px] font-extrabold border text-left transition-all cursor-pointer flex items-center justify-between ${
                ivStats.excludeNundo
                  ? 'bg-[#1d7a4d] border-white text-white shadow-sm'
                  : 'bg-white/90 border-[#0d7da8]/20 text-[#123c4d] hover:bg-white'
              }`}
            >
              <span>🛡️ Exclude 0% Nundos</span>
              <span className="font-mono text-[10px]">{ivStats.excludeNundo ? 'ON' : 'OFF'}</span>
            </button>
            <p className="text-[10px] text-[#285d72] leading-snug font-medium">
              PoGO ignores <code className="font-mono font-bold text-[#0b698e]">!</code> on stat bars — these shields emit verified complement ranges automatically.
            </p>
          </div>
        </section>

        <section className="pogo-summary-card p-3.5 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-display font-bold text-xs uppercase tracking-wider text-[#0c6c91]">
              All Modifiers
            </h4>

            <div className="inline-flex items-center rounded-full bg-[#dff3fb] p-0.5 border border-[#0d7da8]/20 text-[10px] font-extrabold select-none">
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
            {ATTRIBUTE_GROUPS.map((group) => {
              const activeCount = group.items.filter(
                (i) => filters[i.key] !== null && filters[i.key] !== undefined
              ).length;
              const isSelected = activeGroupId === group.id;
              return (
                <button
                  key={group.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setActiveGroupId(group.id)}
                  className={`compact-inline-chip px-3 py-1 text-[10px] uppercase whitespace-nowrap cursor-pointer inline-flex items-center gap-1 ${
                    isSelected ? 'pogo-pill-active' : 'pogo-pill'
                  }`}
                >
                  <span>{group.label}</span>
                  {activeCount > 0 && (
                    <span
                      className={`px-1.5 rounded-full text-[9px] font-black ${
                        isSelected ? 'bg-white/25 text-white' : 'bg-[#0d7da8] text-white'
                      }`}
                    >
                      {activeCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 gap-1.5">
            {(activeGroup?.items || []).map(({ key, label }) => {
              const currentVal = filters[key] ?? null;

              return (
                <div
                  key={key}
                  className="bg-white/85 px-3 py-2 rounded-2xl border border-white flex items-center justify-between gap-2 shadow-2xs"
                >
                  <span className="text-xs font-bold text-[#123c4d] truncate" title={label}>
                    {label}
                  </span>

                  <div className="flex rounded-full overflow-hidden border border-[#0d7da8]/25 bg-[#eef9fd] text-xs shrink-0 select-none">
                    <button
                      type="button"
                      onClick={() => setAttribute(key, true)}
                      aria-label={
                        key === '!@3mov' ? 'Has 2nd Charged Move (!@3mov)' : `Require ${label}`
                      }
                      aria-pressed={currentVal === true}
                      title={
                        key === '!@3mov' ? 'Has 2nd Charged Move (!@3mov)' : `Require ${key}`
                      }
                      className={`compact-inline-chip px-2.5 py-0.5 font-black border-r border-[#0d7da8]/15 cursor-pointer ${
                        currentVal === true
                          ? 'bg-[#1d7a4d] text-white'
                          : 'text-[#396d82] hover:bg-white'
                      }`}
                    >
                      ✓
                    </button>

                    <button
                      type="button"
                      onClick={() => setAttribute(key, null)}
                      aria-label={`Ignore ${label} filter`}
                      aria-pressed={currentVal === null}
                      title="Ignore filter"
                      className={`compact-inline-chip px-2.5 py-0.5 font-bold border-r border-[#0d7da8]/15 cursor-pointer ${
                        currentVal === null
                          ? 'bg-white text-[#123c4d] font-black'
                          : 'text-[#396d82] hover:bg-white'
                      }`}
                    >
                      —
                    </button>

                    <button
                      type="button"
                      onClick={() => setAttribute(key, false)}
                      aria-label={
                        key === '!@3mov' ? 'Single-Move Only Shield (@3mov)' : `Exclude ${label}`
                      }
                      aria-pressed={currentVal === false}
                      title={
                        key === '!@3mov' ? 'Single-Move Only Shield (@3mov)' : `Exclude ${key}`
                      }
                      className={`compact-inline-chip px-2.5 py-0.5 font-black cursor-pointer ${
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

        <section className="pogo-summary-card p-3.5 space-y-2">
          <h4 className="font-display font-bold text-xs uppercase tracking-wider text-[#0c6c91]">
            Mega Level (Positive Only)
          </h4>
          <select
            value={filters.megaLevel || ''}
            onChange={(e) => setFilters((prev) => ({ ...prev, megaLevel: e.target.value }))}
            aria-label="Mega evolution level"
            className="w-full px-3 py-2 rounded-full bg-white border border-[#0d7da8]/25 text-base sm:text-xs text-[#123c4d] font-bold focus:border-[#0d7da8]"
          >
            {MEGA_LEVEL_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <p className="text-[10px] text-[#285d72] leading-snug font-medium">
            Negated <code className="font-mono font-bold text-[#0b698e]">!mega&#123;N&#125;</code> hides all non-Mega species in PoGO, so trash strings protect Megas via <code className="font-mono font-bold text-[#0b698e]">!#</code> instead.
          </p>
        </section>

        <section className="pogo-summary-card p-3.5 space-y-2.5">
          <h4 className="font-display font-bold text-xs uppercase tracking-wider text-[#0c6c91]">
            Caught Age (Days) &amp; Year
          </h4>

          <div className="grid grid-cols-4 gap-1.5 select-none">
            {[
              { id: 'today', label: 'Today' },
              { id: 'weekend', label: '0–2d' },
              { id: 'week', label: '0–7d' },
              { id: 'month', label: '0–30d' },
            ].map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => applyAgePreset(b.id)}
                className="compact-inline-chip py-1.5 rounded-full text-[10px] font-extrabold uppercase bg-white hover:bg-[#e6f6fc] text-[#1b4d60] border border-[#0d7da8]/20 cursor-pointer text-center"
              >
                {b.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-2.5 text-[9px] font-extrabold text-[#0b698e] uppercase tracking-wider">
                MIN
              </span>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={filters.ageMin}
                onChange={(e) => setFilters((prev) => ({ ...prev, ageMin: e.target.value }))}
                aria-label="Minimum caught age in days"
                className="w-full pl-11 pr-2 py-2 rounded-full bg-white border border-[#0d7da8]/25 text-base sm:text-xs text-[#123c4d] placeholder-[#396d82]/60 focus:border-[#0d7da8] font-bold"
              />
            </div>
            <span className="text-[#285d72] font-bold">–</span>
            <div className="relative flex-1">
              <span className="absolute left-3 top-2.5 text-[9px] font-extrabold text-[#0b698e] uppercase tracking-wider">
                MAX
              </span>
              <input
                type="number"
                min="0"
                placeholder="Any"
                value={filters.ageMax}
                onChange={(e) => setFilters((prev) => ({ ...prev, ageMax: e.target.value }))}
                aria-label="Maximum caught age in days"
                className="w-full pl-11 pr-2 py-2 rounded-full bg-white border border-[#0d7da8]/25 text-base sm:text-xs text-[#123c4d] placeholder-[#396d82]/60 focus:border-[#0d7da8] font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              min="2016"
              placeholder="Year Min (2016)"
              value={filters.yearMin || ''}
              onChange={(e) => setFilters((prev) => ({ ...prev, yearMin: e.target.value }))}
              aria-label="Minimum catch year"
              className="w-full px-3 py-1.5 rounded-full bg-white border border-[#0d7da8]/25 text-base sm:text-xs text-[#123c4d] placeholder-[#396d82]/60 focus:border-[#0d7da8] font-bold"
            />
            <input
              type="number"
              min="2016"
              placeholder="Year Max"
              value={filters.yearMax || ''}
              onChange={(e) => setFilters((prev) => ({ ...prev, yearMax: e.target.value }))}
              aria-label="Maximum catch year"
              className="w-full px-3 py-1.5 rounded-full bg-white border border-[#0d7da8]/25 text-base sm:text-xs text-[#123c4d] placeholder-[#396d82]/60 focus:border-[#0d7da8] font-bold"
            />
          </div>
        </section>

        <section className="pogo-summary-card p-3.5 space-y-2.5">
          <h4 className="font-display font-bold text-xs uppercase tracking-wider text-[#0c6c91]">
            Distance (km), CP, Buddy &amp; Move
          </h4>

          <div className="flex flex-wrap gap-1.5 select-none">
            <button
              type="button"
              onClick={() => setFilters((prev) => ({ ...prev, distanceMin: '100', distanceMax: '' }))}
              className="compact-inline-chip px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-white hover:bg-[#e6f6fc] text-[#1b4d60] border border-[#0d7da8]/20 cursor-pointer"
            >
              100km+ (XL Trade)
            </button>
            <button
              type="button"
              onClick={() => setFilters((prev) => ({ ...prev, cpMin: '', cpMax: '1500' }))}
              className="compact-inline-chip px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-white hover:bg-[#e6f6fc] text-[#1b4d60] border border-[#0d7da8]/20 cursor-pointer"
            >
              ≤1500 CP
            </button>
            <button
              type="button"
              onClick={() => setFilters((prev) => ({ ...prev, cpMin: '1501', cpMax: '2500' }))}
              className="compact-inline-chip px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-white hover:bg-[#e6f6fc] text-[#1b4d60] border border-[#0d7da8]/20 cursor-pointer"
            >
              1501–2500 CP
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              min="0"
              placeholder="Dist Min km"
              value={filters.distanceMin || ''}
              onChange={(e) => setFilters((prev) => ({ ...prev, distanceMin: e.target.value }))}
              aria-label="Minimum distance in km"
              className="w-full px-3 py-1.5 rounded-full bg-white border border-[#0d7da8]/25 text-base sm:text-xs text-[#123c4d] placeholder-[#396d82]/60 focus:border-[#0d7da8] font-bold"
            />
            <input
              type="number"
              min="0"
              placeholder="Dist Max km"
              value={filters.distanceMax || ''}
              onChange={(e) => setFilters((prev) => ({ ...prev, distanceMax: e.target.value }))}
              aria-label="Maximum distance in km"
              className="w-full px-3 py-1.5 rounded-full bg-white border border-[#0d7da8]/25 text-base sm:text-xs text-[#123c4d] placeholder-[#396d82]/60 focus:border-[#0d7da8] font-bold"
            />
            <input
              type="number"
              min="0"
              placeholder="CP Min"
              value={filters.cpMin || ''}
              onChange={(e) => setFilters((prev) => ({ ...prev, cpMin: e.target.value }))}
              aria-label="Minimum CP"
              className="w-full px-3 py-1.5 rounded-full bg-white border border-[#0d7da8]/25 text-base sm:text-xs text-[#123c4d] placeholder-[#396d82]/60 focus:border-[#0d7da8] font-bold"
            />
            <input
              type="number"
              min="0"
              placeholder="CP Max"
              value={filters.cpMax || ''}
              onChange={(e) => setFilters((prev) => ({ ...prev, cpMax: e.target.value }))}
              aria-label="Maximum CP"
              className="w-full px-3 py-1.5 rounded-full bg-white border border-[#0d7da8]/25 text-base sm:text-xs text-[#123c4d] placeholder-[#396d82]/60 focus:border-[#0d7da8] font-bold"
            />
          </div>

          <div className="grid grid-cols-[54px_1fr_auto_1fr] items-center gap-1.5 pt-1">
            <span className="text-[11px] font-extrabold text-[#1b4d60]">Buddy</span>
            <select
              value={filters.buddyMin || ''}
              onChange={(e) => setFilters((prev) => ({ ...prev, buddyMin: e.target.value }))}
              aria-label="Minimum buddy level"
              className="bg-white border border-[#0d7da8]/25 rounded-full px-2 py-1 text-base sm:text-[11px] text-[#123c4d] font-bold focus:border-[#0d7da8]"
            >
              {BUDDY_LEVEL_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <span className="text-[#285d72] text-xs font-bold">–</span>
            <select
              value={filters.buddyMax || ''}
              onChange={(e) => setFilters((prev) => ({ ...prev, buddyMax: e.target.value }))}
              aria-label="Maximum buddy level"
              className="bg-white border border-[#0d7da8]/25 rounded-full px-2 py-1 text-base sm:text-[11px] text-[#123c4d] font-bold focus:border-[#0d7da8]"
            >
              {BUDDY_LEVEL_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-[54px_1fr_auto_1fr] items-center gap-1.5 pt-1">
            <span className="text-[11px] font-extrabold text-[#1b4d60]">Count</span>
            <input
              type="number"
              min="1"
              placeholder="Min"
              value={filters.countMin || ''}
              onChange={(e) => setFilters((prev) => ({ ...prev, countMin: e.target.value }))}
              aria-label="Minimum species count"
              className="w-full px-3 py-1 rounded-full bg-white border border-[#0d7da8]/25 text-base sm:text-xs text-[#123c4d] placeholder-[#396d82]/60 focus:border-[#0d7da8] font-bold"
            />
            <span className="text-[#285d72] text-xs font-bold">–</span>
            <input
              type="number"
              min="1"
              placeholder="Max"
              value={filters.countMax || ''}
              onChange={(e) => setFilters((prev) => ({ ...prev, countMax: e.target.value }))}
              aria-label="Maximum species count"
              className="w-full px-3 py-1 rounded-full bg-white border border-[#0d7da8]/25 text-base sm:text-xs text-[#123c4d] placeholder-[#396d82]/60 focus:border-[#0d7da8] font-bold"
            />
          </div>

          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Duplicate count presets">
            {[
              { label: '3+ Dupes', min: '3' },
              { label: '4+ Dupes', min: '4' },
              { label: '6+ Dupes', min: '6' },
            ].map((preset) => {
              const isActive = filters.countMin === preset.min && !filters.countMax;
              return (
                <button
                  key={preset.min}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() =>
                    setFilters((prev) => ({
                      ...prev,
                      countMin: isActive ? '' : preset.min,
                      countMax: '',
                    }))
                  }
                  className={`min-h-[34px] px-2.5 py-1 text-[11px] font-extrabold cursor-pointer ${
                    isActive ? 'pogo-pill-active' : 'pogo-pill'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>

          <input
            type="text"
            placeholder="Move filter (e.g. @1Shadow Claw, @ice)"
            value={filters.moveQuery || ''}
            onChange={(e) => setFilters((prev) => ({ ...prev, moveQuery: e.target.value }))}
            aria-label="Move search filter"
            className="w-full px-3 py-1.5 rounded-full bg-white border border-[#0d7da8]/25 text-base sm:text-xs text-[#123c4d] placeholder-[#396d82]/60 focus:border-[#0d7da8] font-mono font-bold"
          />
        </section>

        <section className="space-y-2.5">
          <div className="flex items-baseline justify-between">
            <h4 className="font-display font-bold text-sm text-[#1b4d60]">
              Pokémon Type
            </h4>
            {filters.types.length > 0 && (
              <button
                type="button"
                onClick={() => setFilters((prev) => ({ ...prev, types: [] }))}
                className="compact-inline-chip text-[10px] font-bold text-[#0b698e] hover:underline cursor-pointer"
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
      </div>

      <div className="lg:hidden sticky bottom-3 inset-x-0 flex justify-center pointer-events-none pb-[max(0.25rem,env(safe-area-inset-bottom,0px))]">
        <div className="pointer-events-auto">
          <PogoCloseButton onClick={onClose} ariaLabel="Done and close filters" size="lg" />
        </div>
      </div>
    </div>
  );
}

export default React.memo(FilterPanel);
