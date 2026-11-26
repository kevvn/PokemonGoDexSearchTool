import React from 'react';
import { useCostumePikachuCatalogController } from '../../controllers/useCostumePikachuCatalogController';
import {
  COSTUME_PIKACHU_RARITY_TIERS,
  PIKACHU_CATALOG_TRAIT_FILTERS,
  PIKACHU_GENDER_OPTIONS,
  PIKACHU_KEEP_CAPS,
} from '../../models/costumePikachuModel';
import CopyActionButton from '../shared/CopyActionButton';
import { BuilderIcon, CheckIcon, CopyIcon } from '../shared/Icons';
import TriageStepCard from './TriageStepCard';

const RARITY_BADGE_CLASSES = {
  'ultra-rare': 'bg-purple-100 text-[#5d3696] border-purple-300',
  regional: 'bg-amber-100 text-amber-900 border-amber-300',
  event: 'bg-[#dff4fb] text-[#0b698e] border-[#0d7da8]/30',
  annual: 'bg-rose-100 text-rose-800 border-rose-300',
};

const RARITY_LABEL_MAP = Object.fromEntries(
  COSTUME_PIKACHU_RARITY_TIERS.map((tier) => [tier.id, tier.label])
);

function CostumePikachuPanel({
  modeE,
  resolvedTags,
  onLoadQuery,
  keepCap,
  onKeepCapChange,
  yearSlice,
  onYearSliceChange,
  gender,
  onGenderChange,
  includeFamily,
  onToggleIncludeFamily,
}) {
  const {
    search,
    setSearch,
    rarity,
    setRarity,
    trait,
    setTrait,
    catalogOpen,
    toggleCatalogOpen,
    resetCatalogFilters,
    yearSlices,
    filteredEntries,
    totalEntries,
    hasActiveFilters,
  } = useCostumePikachuCatalogController({ yearSlice, includeFamily });

  const budget = modeE?.budget;

  return (
    <div className="space-y-5">
      {/* Interactive Slicer Controls & Storage Budget Card */}
      <section
        aria-label="Costume Pikachu cleanup controls and storage budget"
        className="pogo-summary-card p-4 sm:p-5 space-y-4"
      >
        {budget && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="pogo-glass-card p-3.5 space-y-1">
              <div className="font-display text-[10px] font-extrabold uppercase tracking-wider text-[#0c6c91]">
                Target Cap / Costume
              </div>
              <div className="font-display text-lg font-extrabold text-[#123c4d]">
                ≤ {budget.keepCap} per costume
              </div>
              <p className="text-[11px] text-[#285d72] font-medium leading-snug">
                {budget.recommendedSplit}
              </p>
            </div>

            <div className="pogo-glass-card p-3.5 space-y-1">
              <div className="font-display text-[10px] font-extrabold uppercase tracking-wider text-[#0c6c91]">
                Max Box Budget ({budget.distinctCostumes} Variants)
              </div>
              <div className="font-display text-lg font-extrabold text-[#123c4d]">
                ≤ {budget.maxTotalSlots.toLocaleString()} slots
              </div>
              <p className="text-[11px] text-[#285d72] font-medium leading-snug">
                If you own every Costume Pikachu ever released (2016–2026) at max cap.
              </p>
            </div>

            <div className="pogo-glass-card p-3.5 space-y-1 border-emerald-300/80 bg-emerald-50/70">
              <div className="font-display text-[10px] font-extrabold uppercase tracking-wider text-[#1d7a4d]">
                Estimated Space Freed (from 1,000)
              </div>
              <div className="font-display text-lg font-extrabold text-[#1d7a4d]">
                ~{budget.estimatedSavings.toLocaleString()}+ slots
              </div>
              <p className="text-[11px] text-[#285d72] font-medium leading-snug">
                More if you keep only 1–2 of recurring annual hats (Cake, Party, Dapper, Team Hats).
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-1 border-t border-[#0d7da8]/15">
          {/* Keep Cap + Gender Split */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <div className="font-display text-[11px] font-extrabold uppercase tracking-wider text-[#0c6c91]">
                Max Keepers Per Costume
              </div>
              <div className="flex flex-wrap gap-1.5" role="group" aria-label="Max keepers per costume">
                {PIKACHU_KEEP_CAPS.map((cap) => {
                  const active = keepCap === cap;
                  return (
                    <button
                      key={cap}
                      type="button"
                      aria-pressed={active}
                      onClick={() => onKeepCapChange(cap)}
                      className={`px-3.5 py-1.5 text-xs cursor-pointer ${
                        active ? 'pogo-pill-active' : 'pogo-pill'
                      }`}
                    >
                      Max {cap}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="font-display text-[11px] font-extrabold uppercase tracking-wider text-[#0c6c91]">
                Gender Split (Halves Review Screens — Count to ≤{budget?.perGenderCap || 3}!)
              </div>
              <div className="flex flex-wrap gap-1.5" role="group" aria-label="Gender split filter">
                {PIKACHU_GENDER_OPTIONS.map((opt) => {
                  const active = gender === opt.token;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => onGenderChange(opt.token)}
                      className={`px-3 py-1.5 text-xs cursor-pointer ${
                        active ? 'pogo-pill-active' : 'pogo-pill'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Year Slice + Family Toggle */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <div className="font-display text-[11px] font-extrabold uppercase tracking-wider text-[#0c6c91]">
                Year Slice (Break 1,000 Pikachus Into Manageable Batches)
              </div>
              <div className="flex flex-wrap gap-1.5" role="group" aria-label="Year slice selector">
                {yearSlices.map((slice) => {
                  const active = yearSlice === slice.token;
                  return (
                    <button
                      key={slice.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => onYearSliceChange(slice.token)}
                      className={`px-3 py-1.5 text-xs cursor-pointer ${
                        active ? 'pogo-pill-active' : 'pogo-pill'
                      }`}
                    >
                      {slice.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <button
                type="button"
                role="switch"
                aria-checked={includeFamily}
                onClick={onToggleIncludeFamily}
                className={`compact-inline-chip px-3.5 py-1.5 rounded-full text-xs font-extrabold border transition-all cursor-pointer ${
                  includeFamily
                    ? 'bg-[#0d7da8] text-white border-white shadow-2xs'
                    : 'bg-white/85 text-[#1b4d60] border-[#0d7da8]/25 hover:bg-white'
                }`}
              >
                {includeFamily
                  ? 'Scope: Pichu + Pikachu + Raichu (172,25,26)'
                  : 'Scope: Pikachu Only (25) — Tap to Include Pichu/Raichu'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 7-Step Costume Pikachu Reduction Funnel */}
      <div className="space-y-3">
        {modeE.steps.map((step) => (
          <TriageStepCard
            key={step.id}
            step={step}
            resolvedTags={resolvedTags}
            onLoadQuery={onLoadQuery}
          />
        ))}
      </div>

      {/* Searchable Costume Pikachu Field Guide (2016–2026) */}
      <section
        aria-label="Costume Pikachu Reference Catalog"
        className="pogo-summary-card p-4 sm:p-5 space-y-4"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h4 className="font-display text-sm sm:text-base font-extrabold text-[#0b698e] uppercase tracking-wide">
              Costume Pikachu Field Guide (2016–2026 · {budget?.distinctCostumes || totalEntries} Variants)
            </h4>
            <p className="text-xs text-[#285d72] mt-0.5 font-medium">
              Check debut/return dates, evolution eligibility, signature moves, and rarity before transferring.
              Each card includes a 1-tap PoGO search string to locate that costume in your box.
            </p>
          </div>
          <button
            type="button"
            onClick={toggleCatalogOpen}
            aria-expanded={catalogOpen}
            className="pogo-pill px-3.5 py-1.5 text-xs uppercase cursor-pointer"
          >
            {catalogOpen ? 'Hide Guide' : `Show Guide (${totalEntries})`}
          </button>
        </div>

        {catalogOpen && (
          <div className="space-y-3.5">
            {/* Search & Filters */}
            <div className="space-y-2.5">
              <div className="flex flex-col sm:flex-row gap-2">
                <label htmlFor="pikachu-catalog-search" className="sr-only">
                  Search Costume Pikachu catalog
                </label>
                <input
                  id="pikachu-catalog-search"
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search costume, event, city, move, or year (e.g. Fragment, Batik, Fly, 2026)..."
                  className="flex-1 rounded-full bg-white border-2 border-white shadow-sm px-4 py-2 text-base sm:text-xs font-bold text-[#123c4d] placeholder:text-[#4d7c8e] focus:border-[#0d7da8] focus:outline-none"
                />
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={resetCatalogFilters}
                    className="pogo-pill px-3.5 py-2 text-xs text-[#0b698e] cursor-pointer shrink-0"
                  >
                    Reset Filters
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Rarity tier filter">
                <button
                  type="button"
                  aria-pressed={rarity === 'all'}
                  onClick={() => setRarity('all')}
                  className={`compact-inline-chip px-2.5 py-1 rounded-full text-[11px] font-extrabold border cursor-pointer ${
                    rarity === 'all'
                      ? 'bg-[#0d7da8] text-white border-white shadow-2xs'
                      : 'bg-white/85 text-[#1b4d60] border-[#0d7da8]/20 hover:bg-white'
                  }`}
                >
                  All Rarities
                </button>
                {COSTUME_PIKACHU_RARITY_TIERS.map((tier) => {
                  const active = rarity === tier.id;
                  return (
                    <button
                      key={tier.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setRarity(tier.id)}
                      title={tier.description}
                      className={`compact-inline-chip px-2.5 py-1 rounded-full text-[11px] font-extrabold border cursor-pointer ${
                        active
                          ? 'bg-[#0d7da8] text-white border-white shadow-2xs'
                          : 'bg-white/85 text-[#1b4d60] border-[#0d7da8]/20 hover:bg-white'
                      }`}
                    >
                      {tier.label}
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Costume trait filter">
                {PIKACHU_CATALOG_TRAIT_FILTERS.map((f) => {
                  const active = trait === f.id;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setTrait(f.id)}
                      className={`compact-inline-chip px-2.5 py-1 rounded-full text-[11px] font-bold border cursor-pointer ${
                        active
                          ? 'bg-emerald-700 text-white border-white shadow-2xs'
                          : 'bg-white/75 text-[#285d72] border-[#0d7da8]/20 hover:bg-white'
                      }`}
                    >
                      {f.label}
                    </button>
                  );
                })}
                <span className="ml-auto text-[11px] font-mono font-bold text-[#285d72]">
                  Showing {filteredEntries.length} / {totalEntries} entries
                  {yearSlice ? ` (${yearSlice})` : ''}
                </span>
              </div>
            </div>

            {/* Catalog Cards Grid */}
            {filteredEntries.length === 0 ? (
              <div className="pogo-glass-card p-6 text-center text-xs text-[#285d72] font-semibold">
                No Costume Pikachus match your current filters. Try clearing the search or switching Year Slice to &ldquo;All Years&rdquo;.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredEntries.map((entry) => (
                  <article
                    key={entry.id}
                    className="pogo-glass-card p-3.5 flex flex-col justify-between gap-2.5"
                  >
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-start justify-between gap-1.5">
                        <h5 className="font-display text-sm font-extrabold text-[#123c4d] leading-snug">
                          {entry.name}
                        </h5>
                        <span
                          className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                            RARITY_BADGE_CLASSES[entry.rarity] || RARITY_BADGE_CLASSES.event
                          }`}
                        >
                          {RARITY_LABEL_MAP[entry.rarity] || entry.rarity}
                        </span>
                      </div>

                      <div className="text-[11px] font-bold text-[#0b698e] leading-snug">
                        {entry.appearances}
                      </div>

                      <div className="flex flex-wrap gap-1">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#e6f6fc] text-[#123c4d] border border-[#0d7da8]/20">
                          Debut {entry.debutYear}
                        </span>
                        {entry.canEvolve && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-[#1d7a4d] border border-emerald-300">
                            Evolves → Raichu
                          </span>
                        )}
                        {entry.hasPichu && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-900 border border-amber-300">
                            Egg Pichu
                          </span>
                        )}
                        {entry.signatureMove && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 text-indigo-900 border border-indigo-300">
                            Move: {entry.signatureMove}
                          </span>
                        )}
                        {entry.backgroundPossible && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-pink-50 text-pink-900 border border-pink-300">
                            BG Possible
                          </span>
                        )}
                        {entry.genderLock && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-800 border border-slate-300 capitalize">
                            {entry.genderLock} Only
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-[#285d72] leading-relaxed font-medium">
                        {entry.notes}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-[#0d7da8]/10 flex flex-wrap items-center justify-between gap-2">
                      <code className="font-mono text-[11px] font-bold text-[#0b698e] bg-[#e6f6fc] px-2 py-0.5 rounded-lg break-all">
                        {entry.searchQuery}
                      </code>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <CopyActionButton
                          text={entry.searchQuery}
                          ariaLabel={`Copy search string for ${entry.name}`}
                          className="compact-inline-chip inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-[#0d7da8] hover:bg-[#0b698e] text-white border border-white/85"
                          idleContent={
                            <>
                              <CopyIcon />
                              <span>Copy</span>
                            </>
                          }
                          copiedContent={
                            <>
                              <CheckIcon />
                              <span>Copied</span>
                            </>
                          }
                        />
                        {typeof onLoadQuery === 'function' && (
                          <button
                            type="button"
                            onClick={() => onLoadQuery(entry.searchQuery)}
                            aria-label={`Load search string for ${entry.name} in Builder`}
                            className="compact-inline-chip inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-white/95 hover:bg-white text-[#0b698e] border border-[#0d7da8]/30 cursor-pointer"
                          >
                            <BuilderIcon />
                            <span>Load</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

export default React.memo(CostumePikachuPanel);
