import React from 'react';
import { useTradeAuditController } from '../../controllers/trades/useTradeAuditController';
import { DUPLICATE_CAP_OPTIONS } from '../../models/trades/tradeValueModel';
import SearchRecipeCard from '../shared/SearchRecipeCard';

function TradeAuditPanel({
  tagMap,
  metaSnapshot,
  onLoadSearchString,
  onSelectSpeciesInGrid,
}) {
  const {
    duplicateCap,
    selectDuplicateCap,
    staleMaxYear,
    staleYearOptions,
    selectStaleMaxYear,
    audit,
  } = useTradeAuditController({ tagMap, metaSnapshot });

  return (
    <div className="space-y-6">
      {/* Intro Banner */}
      <section className="pogo-summary-card p-4 sm:p-5 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#1d7a4d] text-white">
            Anti-Hoarding Workflow
          </span>
          <span className="text-[11px] font-bold text-[#285d72]">
            Identify what players actually want → cap duplicates → liquidate dead/stale trade bait
          </span>
        </div>
        <h2 className="font-display text-base sm:text-lg font-extrabold text-[#123c4d]">
          Trade Hoard Audit &amp; Demand Tiers
        </h2>
        <p className="text-xs sm:text-sm text-[#285d72] font-medium leading-relaxed">
          Stop hoarding hundreds of low-demand spares &ldquo;just in case.&rdquo; Run these steps in order: clear
          already-traded leaks first, lock genuine Tier S/A tradeables, prune excess duplicates with{' '}
          <code className="font-mono font-bold bg-[#dff4fb] px-1.5 py-0.5 rounded text-[#0b698e]">Sort by #</code>,
          and sweep stale non-rare catches safely.
        </p>
      </section>

      {/* Step 1: Dead Trade Tag Audits */}
      <section className="space-y-3" aria-label="Step 1: Dead Trade Tag Audit">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-display text-sm sm:text-base font-extrabold text-[#0b698e] uppercase tracking-wider">
            1. Dead Trade Tag Audit
          </h3>
          <span className="text-[11px] font-bold text-rose-700 bg-rose-100 border border-rose-200 px-2.5 py-0.5 rounded-full">
            Zero-Value Leaks
          </span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {audit.deadTradeAudits.map((card) => (
            <SearchRecipeCard
              key={card.id}
              badge={card.badge}
              title={card.title}
              subtitle={card.subtitle}
              tagSuggestion={card.tagSuggestion}
              searchString={card.query}
              accent={card.accent}
              onLoadToBar={onLoadSearchString}
            />
          ))}
        </div>
      </section>

      {/* Step 2: Trade Demand Tiers (S / A / B) */}
      <section className="space-y-3" aria-label="Step 2: Trade Demand Tiers">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-display text-sm sm:text-base font-extrabold text-[#0b698e] uppercase tracking-wider">
            2. Trade Demand Tiers (What People Actually Want)
          </h3>
          <span className="text-[11px] font-bold text-[#123c4d] bg-white/80 border border-white px-2.5 py-0.5 rounded-full">
            Tier S ({audit.tiers.tierS.length}) · Tier A ({audit.tiers.tierA.length}) · Tier B ({audit.tiers.tierB.length})
          </span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {audit.demandTierCards.map((card) => (
            <SearchRecipeCard
              key={card.id}
              badge={card.badge}
              title={card.title}
              subtitle={card.subtitle}
              tagSuggestion={card.tagSuggestion}
              searchString={card.query}
              speciesIds={card.speciesIds}
              accent={card.accent}
              onLoadToBar={onLoadSearchString}
              onSelectSpeciesInGrid={onSelectSpeciesInGrid}
            />
          ))}
        </div>
      </section>

      {/* Step 3: Duplicate Cap Pruner */}
      <section className="space-y-3" aria-label="Step 3: Duplicate Cap Pruner">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-display text-sm sm:text-base font-extrabold text-[#0b698e] uppercase tracking-wider">
              3. Hoarded Duplicate Cap Pruner (Sort by #)
            </h3>
            <p className="text-[11px] text-[#285d72] font-medium">
              PoGO&apos;s <code className="font-mono font-bold">count</code> counts National Dex # — always review with Sort by # before transferring.
            </p>
          </div>
          <div className="flex items-center gap-1.5" role="group" aria-label="Duplicate threshold">
            <span className="text-[11px] font-bold text-[#123c4d]">Threshold:</span>
            {DUPLICATE_CAP_OPTIONS.map((cap) => (
              <button
                key={cap}
                type="button"
                onClick={() => selectDuplicateCap(cap)}
                aria-pressed={duplicateCap === cap}
                className={`min-h-[36px] px-3 py-1 text-[11px] font-extrabold cursor-pointer ${
                  duplicateCap === cap ? 'pogo-pill-active' : 'pogo-pill'
                }`}
              >
                {cap}+
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {audit.duplicatePruners.map((card) => (
            <SearchRecipeCard
              key={card.id}
              badge={card.badge}
              title={card.title}
              subtitle={card.subtitle}
              tagSuggestion={card.tagSuggestion}
              searchString={card.query}
              accent={card.accent}
              onLoadToBar={onLoadSearchString}
            />
          ))}
        </div>
      </section>

      {/* Step 4: Stale Non-Rare Hoard Cleanup */}
      <section className="space-y-3" aria-label="Step 4: Stale Non-Rare Hoard Cleanup">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-display text-sm sm:text-base font-extrabold text-rose-700 uppercase tracking-wider">
            4. Stale Non-Rare Hoard Cleanup (Safe Transfer)
          </h3>
          <div className="flex items-center gap-1.5" role="group" aria-label="Stale year upper bound">
            <span className="text-[11px] font-bold text-[#123c4d]">Through Year:</span>
            {staleYearOptions.map((yr) => (
              <button
                key={yr}
                type="button"
                onClick={() => selectStaleMaxYear(yr)}
                aria-pressed={staleMaxYear === yr}
                className={`min-h-[36px] px-3 py-1 text-[11px] font-extrabold cursor-pointer ${
                  staleMaxYear === yr ? 'pogo-pill-active' : 'pogo-pill'
                }`}
              >
                {yr}
              </button>
            ))}
          </div>
        </div>

        <SearchRecipeCard
          badge={audit.staleCleanup.badge}
          title={audit.staleCleanup.title}
          subtitle={audit.staleCleanup.subtitle}
          searchString={audit.staleCleanup.query}
          accent={audit.staleCleanup.accent}
          onLoadToBar={onLoadSearchString}
        />
      </section>
    </div>
  );
}

export default React.memo(TradeAuditPanel);
