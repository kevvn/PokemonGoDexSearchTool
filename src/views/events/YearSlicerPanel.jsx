import React from 'react';
import { useYearSlicerController } from '../../controllers/events/useYearSlicerController';
import SearchRecipeCard from '../shared/SearchRecipeCard';
import EventCopyChip from './EventCopyChip';

function YearSlicerPanel({
  referenceDate,
  bufferMode,
  untaggedOnly,
  tagMap,
  onLoadSearchString,
}) {
  const {
    slicerYear,
    setSlicerYear,
    availableSlicerYears,
    includeTripsInSlicer,
    setIncludeTripsInSlicer,
    includeCdsInSlicer,
    setIncludeCdsInSlicer,
    yearSlicerPlan,
  } = useYearSlicerController({ referenceDate, bufferMode, untaggedOnly });

  const prefix = untaggedOnly ? '!#&' : '';

  return (
    <div className="pt-3.5 space-y-3 mwg-card-container">
      <div className="pogo-summary-card p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-display text-sm sm:text-base font-extrabold uppercase tracking-wider text-[#0c6c91]">
              Yearly &amp; Monthly Storage Slicer
            </h3>
            <p className="text-[11px] text-[#285d72] font-medium">
              Separates played event windows from everyday catches using ±1d timezone-safe{' '}
              <code className="font-mono font-bold">!ageX-Y</code> exclusions.
            </p>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {availableSlicerYears.map((yr) => (
              <button
                key={yr}
                type="button"
                aria-pressed={slicerYear === yr}
                onClick={() => setSlicerYear(yr)}
                className={`compact-inline-chip min-h-[32px] px-3 py-1 text-xs cursor-pointer ${
                  slicerYear === yr ? 'pogo-pill-active' : 'pogo-pill'
                }`}
              >
                {yr}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <label className="inline-flex items-center gap-1.5 font-bold text-[#1b4d60] cursor-pointer">
            <input
              type="checkbox"
              checked={includeTripsInSlicer}
              onChange={(e) => setIncludeTripsInSlicer(e.target.checked)}
              className="w-4 h-4 rounded"
            />
            <span>Protect Personal Trips</span>
          </label>
          <label className="inline-flex items-center gap-1.5 font-bold text-[#1b4d60] cursor-pointer">
            <input
              type="checkbox"
              checked={includeCdsInSlicer}
              onChange={(e) => setIncludeCdsInSlicer(e.target.checked)}
              className="w-4 h-4 rounded"
            />
            <span>Protect Comm Days</span>
          </label>
          <EventCopyChip
            label={`🔍 Hoards (year${slicerYear}&count10-)`}
            text={`${prefix}year${slicerYear}&count10-`}
            variant="indigo"
          />
        </div>

        <div className="mwg-card-grid">
          <SearchRecipeCard
            badge={`year${slicerYear} • Everyday Trash`}
            title="Non-Event 0*–2* Wild Clutter"
            tagSuggestion="Transfer"
            subtitle={`Skips ${yearSlicerPlan.mergedProtectedWindowsCount} merged event/CD/trip age ranges (±1d safe) + full PvP-IV, Nundo, @3mov, Buddy, XL, 100km+ & Regional/Rare shields.`}
            searchString={yearSlicerPlan.strings.everydayNonEventTrash0to2}
            accent="rose"
            onLoadToBar={onLoadSearchString}
          />
          <SearchRecipeCard
            badge={`year${slicerYear} • Venue BGs`}
            title="Attended In-Person Location Backgrounds"
            tagSuggestion={tagMap.ev_locbg.name}
            subtitle={`Combined age union across played ${slicerYear} in-person events.`}
            searchString={yearSlicerPlan.strings.inPersonBgCombined}
            accent="purple"
            onLoadToBar={onLoadSearchString}
          />
          <SearchRecipeCard
            badge={`year${slicerYear} • Global BGs`}
            title="Attended Global Special Backgrounds (Tag Keepers)"
            tagSuggestion={tagMap.ev_global.name}
            subtitle={`Sort by # → tag keepers (${tagMap.ev_global.name}/${tagMap.tr_spec.name}) first; never rely on count-N (which counts non-BG copies).`}
            searchString={yearSlicerPlan.strings.globalBgKeepCombined}
            accent="indigo"
            onLoadToBar={onLoadSearchString}
          />
          <SearchRecipeCard
            badge={`year${slicerYear} • BG Audit`}
            title="Unmapped Date Backgrounds"
            tagSuggestion={tagMap.ev_global.name}
            subtitle="Finds Location or Special Backgrounds caught outside listed event windows."
            searchString={yearSlicerPlan.strings.unmappedBgAudit}
            accent="amber"
            onLoadToBar={onLoadSearchString}
          />
        </div>
      </div>

      {/* Compact 12 Monthly Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {yearSlicerPlan.monthlySlices.map((ms) => (
          <div
            key={ms.monthNum}
            className={`pogo-glass-card p-3.5 space-y-2 ${ms.isUpcoming ? 'opacity-60' : ''}`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-display text-xs font-extrabold uppercase tracking-wider text-[#123c4d]">
                {ms.monthName} {slicerYear}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#073b50] text-[#bfeaf6] font-mono text-[10px] font-bold">
                {ms.isUpcoming ? 'Upcoming' : ms.ageToken}
              </span>
            </div>

            <div className="text-[10px] text-[#285d72] space-y-0.5">
              {ms.eventsInMonth.length === 0 &&
              ms.cdsInMonth.length === 0 &&
              (!includeTripsInSlicer || ms.tripsInMonth.length === 0) ? (
                <span className="italic text-[#396d82]">No major events logged</span>
              ) : (
                <>
                  {ms.eventsInMonth.slice(0, 3).map((e) => (
                    <div key={e.id} className="truncate font-semibold text-[#123c4d]">
                      • {e.name}
                    </div>
                  ))}
                  {ms.cdsInMonth.map((c) => (
                    <div key={c.id} className="truncate font-semibold text-[#0b698e]">
                      • ✨ {c.species} CD
                    </div>
                  ))}
                  {includeTripsInSlicer &&
                    ms.tripsInMonth.slice(0, 2).map((tr) => (
                      <div key={`${tr.tag}-${tr.start}`} className="truncate font-semibold text-[#1d7a4d]">
                        • ✈️ {tr.event_name}
                      </div>
                    ))}
                </>
              )}
            </div>

            {!ms.isUpcoming && (
              <div className="flex flex-wrap gap-1.5">
                <EventCopyChip
                  label="📦 Month"
                  text={ms.monthAllString}
                  ariaLabel={`Copy all ${ms.monthName} ${slicerYear} Pokémon`}
                  variant="teal"
                />
                <EventCopyChip
                  label="🧹 Non-Event Trash"
                  text={ms.monthEverydayTrashString}
                  ariaLabel={`Copy safe non-event trash for ${ms.monthName} ${slicerYear}`}
                  variant="rose"
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default React.memo(YearSlicerPanel);
