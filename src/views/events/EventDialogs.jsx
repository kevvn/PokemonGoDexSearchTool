import React, { useMemo } from 'react';
import { getTodayPlainDateString } from '../../models/eventArchiveModel';
import { PogoCloseButton } from '../shared/PogoDesignSystem';
import { createDialogRefHandler } from '../shared/dialogRef';

export const AgeOptionsDialog = React.memo(function AgeOptionsDialog({
  optionsDialogRef,
  optionsHeadingId,
  untaggedOnly,
  setUntaggedOnly,
  referenceDate,
  setReferenceDate,
  bufferMode,
  setBufferMode,
}) {
  const attachOptionsDialogRef = useMemo(
    () => createDialogRefHandler(optionsDialogRef),
    [optionsDialogRef]
  );

  return (
    <dialog
      ref={attachOptionsDialogRef}
      aria-labelledby={optionsHeadingId}
      {...{ closedby: 'any' }}
      className="pogo-summary-card p-0 max-w-md w-[calc(100%-1.5rem)] max-h-[calc(100dvh-2rem)] overflow-y-auto text-[#123c4d] shadow-2xl"
    >
      <div className="pogo-summary-card-header p-4 border-b border-[#0d7da8]/15 flex items-center justify-between bg-[#d5f2fc]/70 rounded-t-[1.25rem]">
        <h2
          id={optionsHeadingId}
          className="font-display text-sm font-extrabold text-[#0b698e] uppercase tracking-wider"
        >
          ⚙️ Event &amp; Age Options
        </h2>
        <form method="dialog">
          <PogoCloseButton type="submit" value="close" ariaLabel="Close options dialog" size="sm" />
        </form>
      </div>

      <div className="p-4 space-y-3 text-xs">
        <label className="flex items-center justify-between gap-2 bg-white/85 p-3 rounded-2xl border border-white cursor-pointer">
          <div>
            <div className="font-extrabold text-[#123c4d]">Prepend !# (Untagged Only)</div>
            <div className="text-[11px] text-[#285d72]">Hides Pokémon you already tagged</div>
          </div>
          <input
            type="checkbox"
            checked={untaggedOnly}
            onChange={(e) => setUntaggedOnly(e.target.checked)}
            className="w-4 h-4 rounded"
          />
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div className="bg-white/85 p-2.5 rounded-2xl border border-white">
            <label htmlFor="opt-ref-date" className="text-[10px] font-extrabold uppercase text-[#0b698e] block">
              Reference Date (Today)
            </label>
            <input
              id="opt-ref-date"
              type="date"
              value={referenceDate}
              onChange={(e) => setReferenceDate(e.target.value || getTodayPlainDateString())}
              className="w-full text-base sm:text-xs font-extrabold text-[#123c4d] bg-transparent mt-0.5"
            />
          </div>

          <div className="bg-white/85 p-2.5 rounded-2xl border border-white">
            <label htmlFor="opt-age-buffer" className="text-[10px] font-extrabold uppercase text-[#0b698e] block">
              24h Age Precision
            </label>
            <select
              id="opt-age-buffer"
              value={bufferMode}
              onChange={(e) => setBufferMode(e.target.value)}
              className="w-full text-base sm:text-xs font-extrabold text-[#123c4d] bg-transparent mt-0.5"
            >
              <option value="evening-safe">24h Rolling Safe (Recommended)</option>
              <option value="exact">Exact Calendar Day</option>
              <option value="plus-minus-1">±1d International TZ Buffer</option>
            </select>
          </div>
        </div>

        <p className="text-[11px] text-[#285d72] bg-white/75 p-2.5 rounded-2xl border border-white leading-relaxed">
          <strong>Why 24h Rolling Safe?</strong> Pokémon GO increments{' '}
          <code className="font-mono font-bold text-[#0b698e]">age</code> strictly 24 hours after
          catch (not at midnight), so afternoon catches on an event&apos;s final day stay at{' '}
          <code className="font-mono font-bold text-[#0b698e]">age(N−1)</code> until the
          following afternoon.
        </p>

        <form method="dialog" className="pt-2">
          <button
            value="done"
            className="w-full py-2.5 pogo-pill-active text-xs uppercase cursor-pointer"
          >
            Done
          </button>
        </form>
      </div>
    </dialog>
  );
});

export const EventEditorDialog = React.memo(function EventEditorDialog({
  eventDialogRef,
  dialogId,
  dialogHeadingId,
  eventModalState,
  closeEventModal,
  handleDialogClosed,
  updateEventFormField,
  saveEventModal,
}) {
  const attachEventDialogRef = useMemo(
    () => createDialogRefHandler(eventDialogRef, handleDialogClosed),
    [eventDialogRef, handleDialogClosed]
  );

  const eventForm = eventModalState.form;
  const isEditingExisting = eventModalState.mode === 'edit';

  return (
    <dialog
      ref={attachEventDialogRef}
      id={dialogId}
      aria-labelledby={dialogHeadingId}
      {...{ closedby: 'any' }}
      className="pogo-summary-card p-0 max-w-lg w-[calc(100%-1.5rem)] max-h-[calc(100dvh-2rem)] overflow-y-auto text-[#123c4d] shadow-2xl"
    >
      <div className="p-4 border-b border-[#0d7da8]/15 flex items-center justify-between bg-[#d5f2fc]/70 rounded-t-[1.25rem]">
        <h2
          id={dialogHeadingId}
          className="font-display text-sm font-extrabold text-[#0b698e] uppercase tracking-wider"
        >
          {isEditingExisting ? '✏️ Edit Event' : '➕ Add Event'}
        </h2>
        <form method="dialog">
          <PogoCloseButton type="submit" value="cancel" ariaLabel="Close event dialog" size="sm" />
        </form>
      </div>

      <form onSubmit={saveEventModal} className="p-4 space-y-3 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div className="sm:col-span-2 space-y-1">
            <label htmlFor="ev-name" className="font-extrabold text-[#1b4d60] uppercase text-[10px]">
              Event Name
            </label>
            <input
              id="ev-name"
              type="text"
              required
              value={eventForm.name}
              onChange={(e) => updateEventFormField('name', e.target.value)}
              placeholder="Pokémon GO Fest: Global"
              className="w-full px-3.5 py-2 pogo-search-pill text-base sm:text-xs font-bold"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="ev-tag" className="font-extrabold text-[#1b4d60] uppercase text-[10px]">
              Tag (≤12c)
            </label>
            <input
              id="ev-tag"
              type="text"
              maxLength={12}
              required
              value={eventForm.tag}
              onChange={(e) => updateEventFormField('tag', e.target.value)}
              placeholder="GOFest"
              className="w-full px-3.5 py-2 pogo-search-pill text-base sm:text-xs font-mono font-bold"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="space-y-1">
            <label htmlFor="ev-start" className="font-extrabold text-[#1b4d60] uppercase text-[10px]">
              Start Date
            </label>
            <input
              id="ev-start"
              type="date"
              required
              value={eventForm.start}
              onChange={(e) => updateEventFormField('start', e.target.value)}
              className="w-full px-3.5 py-2 pogo-search-pill text-base sm:text-xs font-bold"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="ev-end" className="font-extrabold text-[#1b4d60] uppercase text-[10px]">
              End Date
            </label>
            <input
              id="ev-end"
              type="date"
              required
              value={eventForm.end === 'PRESENT' ? getTodayPlainDateString() : eventForm.end}
              onChange={(e) => updateEventFormField('end', e.target.value)}
              className="w-full px-3.5 py-2 pogo-search-pill text-base sm:text-xs font-bold"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div className="space-y-1">
            <label htmlFor="ev-scope" className="font-extrabold text-[#1b4d60] uppercase text-[10px]">
              Scope
            </label>
            <select
              id="ev-scope"
              value={eventForm.scope}
              onChange={(e) => updateEventFormField('scope', e.target.value)}
              className="w-full px-3 py-2 pogo-search-pill text-base sm:text-xs font-bold bg-white"
            >
              <option value="global">Global</option>
              <option value="in-person">In-Person</option>
              <option value="raid-max-day">Raid / Max Day</option>
            </select>
          </div>

          <div className="space-y-1">
            <label htmlFor="ev-bg" className="font-extrabold text-[#1b4d60] uppercase text-[10px]">
              Background
            </label>
            <select
              id="ev-bg"
              value={eventForm.backgroundType}
              onChange={(e) => updateEventFormField('backgroundType', e.target.value)}
              className="w-full px-3 py-2 pogo-search-pill text-base sm:text-xs font-bold bg-white"
            >
              <option value="locationbackground">locationbackground</option>
              <option value="specialbackground">specialbackground</option>
              <option value="none">None</option>
            </select>
          </div>

          <div className="space-y-1">
            <label htmlFor="ev-series" className="font-extrabold text-[#1b4d60] uppercase text-[10px]">
              Series
            </label>
            <select
              id="ev-series"
              value={eventForm.series}
              onChange={(e) => updateEventFormField('series', e.target.value)}
              className="w-full px-3 py-2 pogo-search-pill text-base sm:text-xs font-bold bg-white"
            >
              <option value="GO Tour">GO Tour</option>
              <option value="GO Fest">GO Fest</option>
              <option value="Wild Area">Wild Area</option>
              <option value="City & Special">City &amp; Special</option>
              <option value="Raid & Max">Raid &amp; Max</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div className="space-y-1">
            <label htmlFor="ev-raid-ids" className="font-extrabold text-[#1b4d60] uppercase text-[10px]">
              Raid / Mega Dex IDs
            </label>
            <input
              id="ev-raid-ids"
              type="text"
              value={eventForm.raidMegaIdsText}
              onChange={(e) => updateEventFormField('raidMegaIdsText', e.target.value)}
              placeholder="e.g. 150, 384, 483, 484"
              className="w-full px-3.5 py-2 pogo-search-pill text-base sm:text-xs font-mono font-bold"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="ev-reg-ids" className="font-extrabold text-[#1b4d60] uppercase text-[10px]">
              Regional / Rotom / Unown IDs
            </label>
            <input
              id="ev-reg-ids"
              type="text"
              value={eventForm.regionalRareIdsText}
              onChange={(e) => updateEventFormField('regionalRareIdsText', e.target.value)}
              placeholder="e.g. 479, 201, 701, 764"
              className="w-full px-3.5 py-2 pogo-search-pill text-base sm:text-xs font-mono font-bold"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div className="space-y-1">
            <label htmlFor="ev-loc" className="font-extrabold text-[#1b4d60] uppercase text-[10px]">
              Location
            </label>
            <input
              id="ev-loc"
              type="text"
              value={eventForm.location}
              onChange={(e) => updateEventFormField('location', e.target.value)}
              placeholder="Worldwide or City"
              className="w-full px-3.5 py-2 pogo-search-pill text-base sm:text-xs font-bold"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="ev-raid-sum" className="font-extrabold text-[#1b4d60] uppercase text-[10px]">
              Raid / Special Notes
            </label>
            <input
              id="ev-raid-sum"
              type="text"
              value={eventForm.raidSummary}
              onChange={(e) => updateEventFormField('raidSummary', e.target.value)}
              placeholder="Mega Mewtwo, Wash Rotom, Comfey..."
              className="w-full px-3.5 py-2 pogo-search-pill text-base sm:text-xs font-bold"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-4 pt-1">
          <label className="inline-flex items-center gap-1.5 font-bold text-[#123c4d] cursor-pointer">
            <input
              type="checkbox"
              checked={eventForm.attended}
              onChange={(e) => updateEventFormField('attended', e.target.checked)}
              className="w-4 h-4 rounded"
            />
            <span>Played</span>
          </label>
          <label className="inline-flex items-center gap-1.5 font-bold text-[#123c4d] cursor-pointer">
            <input
              type="checkbox"
              checked={eventForm.hasMighty}
              onChange={(e) => updateEventFormField('hasMighty', e.target.checked)}
              className="w-4 h-4 rounded"
            />
            <span>Has Mighty Spawns</span>
          </label>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#0d7da8]/15">
          <button
            type="button"
            onClick={() => closeEventModal('cancel')}
            className="pogo-pill px-4 py-2 text-xs uppercase cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="pogo-pill-active px-4 py-2 text-xs uppercase cursor-pointer"
          >
            Save Event
          </button>
        </div>
      </form>
    </dialog>
  );
});

export default EventEditorDialog;
