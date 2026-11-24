import React, { useMemo } from 'react';
import { useCommunityDaysController } from '../../controllers/events/useCommunityDaysController';
import { ALL_COMMUNITY_DAY_PRE_EVO_IDS } from '../../models/communityDayModel';
import { NUNDO_EXCLUDE_CLAUSE, PVP_IV_EXCLUDE_CLAUSE } from '../../models/searchEngine';
import { getPixelSpriteUrl } from '../../models/spriteUrls';
import { PogoSearchInput } from '../shared/PogoDesignSystem';
import PokemonSprite from '../shared/PokemonSprite';
import SearchRecipeCard from '../shared/SearchRecipeCard';

function CommunityDaysPanel({ untaggedOnly, tagMap, onLoadSearchString, onSelectSpeciesInGrid }) {
  const {
    communityDaysByYear,
    selectedCdEventIds,
    selectedCdFamilyIds,
    selectedCdFamilyRanges,
    allCdPreEvoRanges,
    cdSearchFilter,
    setCdSearchFilter,
    isCdYearOpen,
    setCdYearExpanded,
    toggleAllCdYears,
    toggleCdEvent,
    toggleCdYear,
    selectAllCdEvents,
    clearAllCdEvents,
  } = useCommunityDaysController();

  const prefix = untaggedOnly ? '!#&' : '';

  const yearGroups = useMemo(() => {
    const q = cdSearchFilter.trim().toLowerCase();
    return communityDaysByYear
      .map(({ year, events }) => {
        const filtered = !q
          ? events
          : events.filter(
              (ev) =>
                ev.species.toLowerCase().includes(q) ||
                ev.month.toLowerCase().includes(q) ||
                ev.exclusiveMove.toLowerCase().includes(q) ||
                ev.finalEvolution.toLowerCase().includes(q)
            );
        return { year, events: filtered };
      })
      .filter((group) => group.events.length > 0);
  }, [communityDaysByYear, cdSearchFilter]);

  const visibleYears = useMemo(() => yearGroups.map((g) => g.year), [yearGroups]);
  const allYearsExpanded =
    visibleYears.length > 0 && visibleYears.every((y) => isCdYearOpen(y));

  const hasSelectedFamilies = selectedCdFamilyIds.length > 0 && Boolean(selectedCdFamilyRanges);
  const step1SearchString = hasSelectedFamilies ? `${prefix}shiny&${selectedCdFamilyRanges}` : '';
  const step2SearchString = hasSelectedFamilies
    ? `!#&!favorite&shiny&!4*&!background&!costume&!shadow&!lucky&!maxmove1-&!eggsonly&!xxl&!xxs&!distance100-&!buddy1-&!candyxl&@3mov&${PVP_IV_EXCLUDE_CLAUSE}&${NUNDO_EXCLUDE_CLAUSE}&${selectedCdFamilyRanges}`
    : '';

  return (
    <div className="pt-3.5 space-y-3 mwg-card-container">
      <div className="mwg-card-grid">
        <SearchRecipeCard
          badge="Step 1 • Review & Tag Keepers"
          title={`Community Day Shinies — Tag Keepers (${selectedCdFamilyIds.length} IDs)`}
          tagSuggestion={tagMap.tr_spec.name}
          subtitle={
            hasSelectedFamilies
              ? `Sort by Number (#) in Pokémon GO so each CD family groups together. Favorite (★) + tag your best keepers (${tagMap.keep_trophy.name}) and 1–3 trade spares (${tagMap.tr_spec.name}).`
              : 'Select at least one Community Day event below to generate a shiny review query.'
          }
          searchString={step1SearchString}
          speciesIds={selectedCdFamilyIds}
          accent="indigo"
          onLoadToBar={onLoadSearchString}
          onSelectSpeciesInGrid={onSelectSpeciesInGrid}
        />
        <SearchRecipeCard
          badge="Step 2 • True Surplus (!#)"
          title="Untagged Surplus CD Shinies (HOME / Transfer)"
          tagSuggestion="HOME / Transfer"
          subtitle={
            hasSelectedFamilies
              ? 'Run AFTER Step 1: !# isolates ONLY genuine surplus CD shinies while shielding 4★, Backgrounds, Costumes, Shadows, Max, Babies, XXL/XXS, 100km+, Buddies, XL, PvP IVs, Nundos & @3mov.'
              : 'Select at least one Community Day event below to generate a surplus transfer query.'
          }
          searchString={step2SearchString}
          speciesIds={selectedCdFamilyIds}
          accent="rose"
          onLoadToBar={onLoadSearchString}
          onSelectSpeciesInGrid={onSelectSpeciesInGrid}
        />
        <SearchRecipeCard
          badge="Step 3 • Legacy Move Hold"
          title="High-IV CD Pre-Evos Missing Exclusive Move"
          tagSuggestion={tagMap.op_evocd.name}
          subtitle="Un-evolved 3★/4★ Community Day pre-evolutions ready to hold for December CD recap moves (omits !@special so Shadow/Purified pre-evos are included!)."
          searchString={`${prefix}evolve&3*,4*&${allCdPreEvoRanges}`}
          speciesIds={ALL_COMMUNITY_DAY_PRE_EVO_IDS}
          accent="emerald"
          onLoadToBar={onLoadSearchString}
          onSelectSpeciesInGrid={onSelectSpeciesInGrid}
        />
      </div>

      <section
        id="cd-year-accordion"
        aria-label="Community Day species by year and month"
        className="mwg-accordion pogo-summary-card p-3.5 space-y-3"
      >
        <div className="flex flex-wrap items-center gap-2">
          <PogoSearchInput
            value={cdSearchFilter}
            onChange={(e) => setCdSearchFilter(e.target.value)}
            onClear={() => setCdSearchFilter('')}
            placeholder="Filter CD species, move, or month..."
            ariaLabel="Filter Community Day species"
            className="flex-1 min-w-[180px]"
          />
          <button
            type="button"
            onClick={selectAllCdEvents}
            className="compact-inline-chip pogo-pill min-h-[34px] px-3 py-1 text-[11px] uppercase cursor-pointer"
          >
            All
          </button>
          <button
            type="button"
            onClick={clearAllCdEvents}
            className="compact-inline-chip pogo-pill min-h-[34px] px-3 py-1 text-[11px] uppercase cursor-pointer"
          >
            None
          </button>
          <button
            type="button"
            onClick={() => toggleAllCdYears(visibleYears)}
            aria-expanded={allYearsExpanded}
            className="compact-inline-chip pogo-pill-active min-h-[34px] px-3.5 py-1 text-[11px] uppercase cursor-pointer"
          >
            {allYearsExpanded ? 'Collapse All' : 'Expand All'}
          </button>
        </div>

        <div className="space-y-2">
          {yearGroups.map(({ year, events }) => {
            const selectedInYear = events.filter((ev) => selectedCdEventIds.has(ev.id)).length;
            const allYearSelected = selectedInYear === events.length;
            const isOpen = isCdYearOpen(year);

            return (
              <details
                key={year}
                open={isOpen}
                onToggle={(e) => setCdYearExpanded(year, e.currentTarget.open)}
                className="rounded-2xl border border-white bg-white/75 overflow-hidden shadow-2xs"
              >
                <summary className="px-3.5 py-2.5 bg-white/90 text-xs font-display font-extrabold text-[#123c4d] select-none">
                  <span className="flex-1 flex items-center justify-between gap-2">
                    <span>{year} Community Days</span>
                    <span className="pogo-counter-pill text-[10px] py-0.5 px-2.5">
                      {selectedInYear}/{events.length}
                    </span>
                  </span>
                </summary>

                <div className="p-2.5 border-t border-[#0d7da8]/12 space-y-2">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => toggleCdYear(events, !allYearSelected)}
                      className="compact-inline-chip pogo-pill min-h-[28px] px-3 py-0.5 text-[10px] uppercase cursor-pointer"
                    >
                      {allYearSelected ? `Deselect ${year}` : `Select ${year}`}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {events.map((ev) => {
                      const isChecked = selectedCdEventIds.has(ev.id);
                      return (
                        <label
                          key={ev.id}
                          className={`pogo-dex-tile flex items-center gap-2.5 p-2 cursor-pointer select-none ${
                            isChecked ? 'pogo-dex-tile-selected' : 'opacity-70'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleCdEvent(ev.id)}
                            className="w-4 h-4 rounded shrink-0"
                          />
                          <PokemonSprite
                            src={ev.sprite || getPixelSpriteUrl(ev.dexId)}
                            alt={ev.species}
                            width={36}
                            height={36}
                            className="w-9 h-9 object-contain shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1">
                              <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#0d7da8] text-white">
                                {ev.month.slice(0, 3)}
                              </span>
                              {ev.isClassic && (
                                <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-300 text-[#123c4d]">
                                  Classic
                                </span>
                              )}
                            </div>
                            <div className="text-xs font-extrabold text-[#123c4d] truncate">
                              {ev.species}
                            </div>
                            <div className="text-[10px] text-[#0b698e] font-bold truncate">
                              {ev.exclusiveMove}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </details>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export default React.memo(CommunityDaysPanel);
