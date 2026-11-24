import React, { useMemo, useState, useSyncExternalStore } from 'react';
import { useEventsArchiveController } from '../../controllers/events/useEventsArchiveController';
import {
  addTravelTrip,
  calculateAgeSearchString,
  clearTravelTrips,
  deleteTravelTrip,
  getTodayPlainDateString,
  restoreSampleTravelTrips,
  travelTripsStore,
} from '../../models/eventArchiveModel';
import { PogoSearchInput } from '../shared/PogoDesignSystem';
import SearchRecipeCard from '../shared/SearchRecipeCard';
import { EventEditorDialog } from './EventDialogs';
import MajorEventCard from './MajorEventCard';

const SERIES_FILTERS = ['ALL', 'GO Tour', 'GO Fest', 'Wild Area', 'City & Special', 'Raid & Max'];

function EventsArchivePanel({
  referenceDate,
  bufferMode,
  untaggedOnly,
  onLoadSearchString,
  onSelectSpeciesInGrid,
}) {
  const {
    availableYearFilters,
    filteredEvents,
    eventActionsById,
    eventDbSearch,
    setEventDbSearch,
    eventYearFilter,
    setEventYearFilter,
    eventSeriesFilter,
    setEventSeriesFilter,
    dbStatusBanner,
    confirmReset,
    customEventName,
    setCustomEventName,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
    customExcludeRemote,
    setCustomExcludeRemote,
    customRequireLocationBg,
    setCustomRequireLocationBg,
    customAgeResult,
    eventModalState,
    eventDialogRef,
    fileImportRef,
    dialogId,
    dialogHeadingId,
    openAddEventModal,
    openEditEventModal,
    closeEventModal,
    handleDialogClosed,
    updateEventFormField,
    saveEventModal,
    handleToggleEventAttended,
    handleDeleteCustomEvent,
    handleExportEventsJson,
    handleImportEventsJson,
    handleResetEventsDb,
  } = useEventsArchiveController({ referenceDate, bufferMode, untaggedOnly });

  const travelTrips = useSyncExternalStore(
    travelTripsStore.subscribe,
    travelTripsStore.getSnapshot,
    travelTripsStore.getServerSnapshot
  );

  const [newTripName, setNewTripName] = useState('');
  const [newTripTag, setNewTripTag] = useState('');
  const [newTripStart, setNewTripStart] = useState(() => getTodayPlainDateString());
  const [newTripEnd, setNewTripEnd] = useState(() => getTodayPlainDateString());
  const [newTripLocation, setNewTripLocation] = useState('');
  const [tripFormError, setTripFormError] = useState('');

  const tripsWithAge = useMemo(
    () =>
      travelTrips.map((trip) => ({
        trip,
        calc: calculateAgeSearchString(trip.start, trip.end, referenceDate, {
          bufferMode,
          untaggedOnly,
          excludeRemote: true,
        }),
      })),
    [travelTrips, referenceDate, bufferMode, untaggedOnly]
  );

  const handleAddTripSubmit = (e) => {
    e.preventDefault();
    const res = addTravelTrip({
      event_name: newTripName,
      tag: newTripTag,
      start: newTripStart,
      end: newTripEnd,
      location: newTripLocation,
    });
    if (!res.ok) {
      setTripFormError(res.error);
      return;
    }
    setTripFormError('');
    setNewTripName('');
    setNewTripTag('');
    setNewTripLocation('');
  };

  return (
    <div className="pt-3.5 space-y-3 mwg-card-container">
      {/* Frosted Search + Action Row */}
      <div className="pogo-summary-card p-3.5 space-y-2.5">
        <div className="flex items-center gap-2">
          <PogoSearchInput
            value={eventDbSearch}
            onChange={(e) => setEventDbSearch(e.target.value)}
            onClear={() => setEventDbSearch('')}
            placeholder="Search event, Rotom, regional, Mega, city..."
            ariaLabel="Search major events and special Pokémon"
            className="flex-1 min-w-0"
          />
          <button
            type="button"
            onClick={openAddEventModal}
            className="compact-inline-chip pogo-pill-active min-h-[40px] px-4 py-1.5 text-xs uppercase cursor-pointer shrink-0"
          >
            + EVENT
          </button>
        </div>

        {/* Single-Line Scrollable Series & Year Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {availableYearFilters.map((yr) => {
            const active = eventYearFilter === String(yr);
            return (
              <button
                key={String(yr)}
                type="button"
                aria-pressed={active}
                onClick={() => setEventYearFilter(String(yr))}
                className={`compact-inline-chip min-h-[28px] px-3 py-0.5 text-[11px] uppercase shrink-0 cursor-pointer ${
                  active ? 'pogo-pill-active' : 'pogo-pill'
                }`}
              >
                {yr === 'ALL' ? 'All Years' : yr}
              </button>
            );
          })}
          <span className="text-[#0d7da8]/40 select-none" aria-hidden="true">
            |
          </span>
          {SERIES_FILTERS.map((series) => {
            const active = eventSeriesFilter === series;
            return (
              <button
                key={series}
                type="button"
                aria-pressed={active}
                onClick={() => setEventSeriesFilter(series)}
                className={`compact-inline-chip min-h-[28px] px-3 py-0.5 text-[11px] uppercase shrink-0 cursor-pointer ${
                  active ? 'pogo-pill-active' : 'pogo-pill'
                }`}
              >
                {series === 'ALL' ? 'All Series' : series}
              </button>
            );
          })}
        </div>

        {dbStatusBanner && (
          <div
            role="status"
            className="px-3 py-1.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-[11px] font-bold text-emerald-950"
          >
            {dbStatusBanner}
          </div>
        )}
      </div>

      {/* Major Event Cards Grid */}
      <div className="mwg-card-grid">
        {filteredEvents.map((ev) => (
          <MajorEventCard
            key={ev.id}
            ev={ev}
            built={eventActionsById[ev.id]}
            onToggleAttended={handleToggleEventAttended}
            onEdit={openEditEventModal}
            onDelete={handleDeleteCustomEvent}
            onSelectSpeciesInGrid={onSelectSpeciesInGrid}
            onLoadToBar={onLoadSearchString}
          />
        ))}
      </div>

      {/* Collapsible Custom Date Calculator, Editable Personal Trips & JSON Backup */}
      <div className="mwg-accordion space-y-2.5 pt-1">
        <details className="pogo-summary-card overflow-hidden">
          <summary className="px-4 py-3 text-xs sm:text-sm font-display font-extrabold text-[#123c4d] select-none">
            <span>🧮 Custom Date Range → ageX-Y Calculator &amp; JSON Backup</span>
          </summary>
          <div className="p-3.5 border-t border-[#0d7da8]/12 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="bg-white/85 px-3 py-2 rounded-2xl border border-white">
                <label htmlFor="custom-ev-lbl" className="text-[10px] font-extrabold uppercase text-[#0b698e]">
                  Tag Label
                </label>
                <input
                  id="custom-ev-lbl"
                  type="text"
                  value={customEventName}
                  onChange={(e) => setCustomEventName(e.target.value)}
                  className="w-full text-base sm:text-xs font-bold text-[#123c4d] bg-transparent"
                />
              </div>
              <div className="bg-white/85 px-3 py-2 rounded-2xl border border-white">
                <label htmlFor="custom-ev-start" className="text-[10px] font-extrabold uppercase text-[#0b698e]">
                  Start Date
                </label>
                <input
                  id="custom-ev-start"
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full text-base sm:text-xs font-bold text-[#123c4d] bg-transparent"
                />
              </div>
              <div className="bg-white/85 px-3 py-2 rounded-2xl border border-white">
                <label htmlFor="custom-ev-end" className="text-[10px] font-extrabold uppercase text-[#0b698e]">
                  End Date
                </label>
                <input
                  id="custom-ev-end"
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full text-base sm:text-xs font-bold text-[#123c4d] bg-transparent"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3 text-xs">
              <label className="inline-flex items-center gap-1.5 font-bold text-[#1b4d60] cursor-pointer">
                <input
                  type="checkbox"
                  checked={customExcludeRemote}
                  onChange={(e) => setCustomExcludeRemote(e.target.checked)}
                  className="w-4 h-4 rounded"
                />
                <span>!remoteraid</span>
              </label>
              <label className="inline-flex items-center gap-1.5 font-bold text-[#1b4d60] cursor-pointer">
                <input
                  type="checkbox"
                  checked={customRequireLocationBg}
                  onChange={(e) => setCustomRequireLocationBg(e.target.checked)}
                  className="w-4 h-4 rounded"
                />
                <span>locationbackground</span>
              </label>
            </div>

            <SearchRecipeCard
              badge={`${customAgeResult.ageToken} • ${customAgeResult.humanSpan}`}
              title={`${customEventName} (${customStartDate} → ${customEndDate})`}
              tagSuggestion={customEventName.slice(0, 12)}
              searchString={customAgeResult.fullSearchString}
              accent="teal"
              onLoadToBar={onLoadSearchString}
            />

            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[#0d7da8]/12">
              <button
                type="button"
                onClick={handleExportEventsJson}
                className="compact-inline-chip pogo-pill min-h-[32px] px-3 py-1 text-[11px] cursor-pointer"
              >
                ⬇️ Export Archive JSON
              </button>
              <button
                type="button"
                onClick={() => fileImportRef.current?.click()}
                className="compact-inline-chip pogo-pill min-h-[32px] px-3 py-1 text-[11px] cursor-pointer"
              >
                ⬆️ Import JSON
              </button>
              <input
                ref={fileImportRef}
                type="file"
                accept="application/json"
                onChange={handleImportEventsJson}
                className="hidden"
                aria-label="Import event database JSON"
              />
              <button
                type="button"
                onClick={handleResetEventsDb}
                className={`compact-inline-chip min-h-[32px] px-3 py-1 rounded-full text-[11px] font-extrabold border cursor-pointer ${
                  confirmReset
                    ? 'bg-rose-600 text-white border-white shadow-sm'
                    : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                }`}
              >
                {confirmReset ? 'Click Again to Reset' : 'Reset Defaults'}
              </button>
            </div>
          </div>
        </details>

        <details className="pogo-summary-card overflow-hidden">
          <summary className="px-4 py-3 text-xs sm:text-sm font-display font-extrabold text-[#123c4d] select-none">
            <span>✈️ Personal Travel Trips ({travelTrips.length})</span>
          </summary>
          <div className="p-3.5 border-t border-[#0d7da8]/12 space-y-3">
            <form onSubmit={handleAddTripSubmit} className="bg-white/75 p-3 rounded-2xl border border-white space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#0b698e]">
                  Add Personal Trip (Stored Locally)
                </span>
                <div className="flex items-center gap-1.5">
                  {travelTrips.length > 0 && (
                    <button
                      type="button"
                      onClick={clearTravelTrips}
                      className="compact-inline-chip px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 cursor-pointer"
                    >
                      Clear All
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={restoreSampleTravelTrips}
                    className="compact-inline-chip px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-white hover:bg-[#e6f6fc] text-[#0b698e] border border-[#0d7da8]/25 cursor-pointer"
                  >
                    Load Sample Trips
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                <input
                  type="text"
                  required
                  value={newTripName}
                  onChange={(e) => setNewTripName(e.target.value)}
                  placeholder="Trip Name (e.g. Tokyo)"
                  aria-label="Personal trip name"
                  className="sm:col-span-2 px-3 py-1.5 pogo-search-pill text-base sm:text-xs font-bold"
                />
                <input
                  type="text"
                  maxLength={16}
                  value={newTripTag}
                  onChange={(e) => setNewTripTag(e.target.value)}
                  placeholder="Tag (optional)"
                  aria-label="Personal trip tag"
                  className="px-3 py-1.5 pogo-search-pill text-base sm:text-xs font-mono font-bold"
                />
                <input
                  type="date"
                  required
                  value={newTripStart}
                  onChange={(e) => setNewTripStart(e.target.value)}
                  aria-label="Personal trip start date"
                  className="px-2.5 py-1.5 pogo-search-pill text-base sm:text-xs font-bold"
                />
                <input
                  type="date"
                  required
                  value={newTripEnd}
                  onChange={(e) => setNewTripEnd(e.target.value)}
                  aria-label="Personal trip end date"
                  className="px-2.5 py-1.5 pogo-search-pill text-base sm:text-xs font-bold"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newTripLocation}
                  onChange={(e) => setNewTripLocation(e.target.value)}
                  placeholder="Location (optional)"
                  aria-label="Personal trip location"
                  className="flex-1 px-3 py-1.5 pogo-search-pill text-base sm:text-xs font-bold"
                />
                <button
                  type="submit"
                  className="compact-inline-chip pogo-pill-active px-4 py-1.5 text-xs uppercase cursor-pointer shrink-0"
                >
                  + Add Trip
                </button>
              </div>
              {tripFormError && (
                <p role="alert" className="text-[11px] font-bold text-rose-700">
                  {tripFormError}
                </p>
              )}
            </form>

            {tripsWithAge.length === 0 ? (
              <p className="text-xs text-[#285d72] text-center py-4 font-medium">
                No personal travel trips logged. Add your own trips above or load sample trips.
              </p>
            ) : (
              <div className="mwg-card-grid mwg-card-grid-3">
                {tripsWithAge.map(({ trip, calc }) => (
                  <SearchRecipeCard
                    key={`${trip.tag}-${trip.start}`}
                    badge={calc.ageToken}
                    title={trip.event_name}
                    tagSuggestion={trip.tag}
                    subtitle={`${trip.location} (${trip.start}${trip.end !== trip.start ? ` → ${trip.end}` : ''})`}
                    searchString={calc.fullSearchString}
                    accent="teal"
                    onLoadToBar={onLoadSearchString}
                  >
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => deleteTravelTrip(trip.tag, trip.start)}
                        aria-label={`Remove trip ${trip.event_name}`}
                        className="compact-inline-chip text-[10px] font-extrabold text-rose-700 hover:underline cursor-pointer"
                      >
                        Remove Trip
                      </button>
                    </div>
                  </SearchRecipeCard>
                ))}
              </div>
            )}
          </div>
        </details>
      </div>

      <EventEditorDialog
        eventDialogRef={eventDialogRef}
        dialogId={dialogId}
        dialogHeadingId={dialogHeadingId}
        eventModalState={eventModalState}
        closeEventModal={closeEventModal}
        handleDialogClosed={handleDialogClosed}
        updateEventFormField={updateEventFormField}
        saveEventModal={saveEventModal}
      />
    </div>
  );
}

export default React.memo(EventsArchivePanel);
