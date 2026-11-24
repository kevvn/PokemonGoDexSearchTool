import React from 'react';
import { getPixelSpriteUrl } from '../../models/spriteUrls';
import PokemonSprite from '../shared/PokemonSprite';
import EventCopyChip from './EventCopyChip';

/**
 * Frosted Ice-Glass Major Event Card featuring Pokédex Tile Sprites and 1-Tap Copy Pills.
 */
function MajorEventCard({
  ev,
  built,
  onToggleAttended,
  onEdit,
  onDelete,
  onSelectSpeciesInGrid,
  onLoadToBar,
}) {
  if (!built) return null;
  const spriteIds = built.allSpecialIds.slice(0, 7);

  return (
    <div
      className={`pogo-glass-card p-3.5 space-y-2.5 transition-opacity ${
        ev.attended ? '' : 'opacity-75'
      }`}
    >
      {/* Top Meta Row */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${
                ev.scope === 'in-person'
                  ? 'bg-[#8d52b5] text-white'
                  : ev.scope === 'global'
                    ? 'bg-[#0d7da8] text-white'
                    : 'bg-amber-400 text-[#123c4d]'
              }`}
            >
              {ev.scope === 'raid-max-day' ? 'Raid / Max' : ev.scope}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-[#073b50] text-[#bfeaf6] font-mono text-[10px] font-bold">
              {built.ageCalc.ageToken}
            </span>
            <span className="text-[10px] font-bold text-[#285d72]">
              {ev.start}{ev.end !== ev.start ? ` → ${ev.end}` : ''}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
            <h4 className="font-display text-[13px] font-extrabold text-[#123c4d] leading-snug">
              {ev.name}
            </h4>
            <span className="px-2 py-0.5 rounded-full bg-[#dff4fb] text-[#0b698e] border border-[#0d7da8]/25 font-mono text-[10px] font-bold">
              #{ev.tag}
            </span>
          </div>
          <p className="text-[11px] text-[#285d72] font-semibold">{ev.location}</p>
        </div>

        {/* Spaced controls so .mwg-icon-hit hitboxes never overlap */}
        <div className="flex items-center gap-3 shrink-0">
          <label className="compact-inline-chip inline-flex items-center gap-1 text-[10px] font-extrabold text-[#1b4d60] bg-white/90 px-2.5 py-1 rounded-full border border-white shadow-2xs cursor-pointer">
            <input
              type="checkbox"
              checked={ev.attended}
              onChange={() => onToggleAttended(ev.id)}
              className="w-3.5 h-3.5 rounded"
            />
            <span>Played</span>
          </label>
          <button
            type="button"
            onClick={() => onEdit(ev)}
            aria-label={`Edit ${ev.name}`}
            className="compact-inline-chip mwg-icon-hit pogo-circle-btn w-7 h-7 text-xs"
          >
            ✏️
          </button>
          {ev.isCustom && (
            <button
              type="button"
              onClick={() => onDelete(ev.id)}
              aria-label={`Delete ${ev.name}`}
              className="compact-inline-chip mwg-icon-hit w-7 h-7 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 flex items-center justify-center text-xs cursor-pointer"
            >
              🗑️
            </button>
          )}
        </div>
      </div>

      {/* Special Pokémon Frosted Pokédex Tile Strip */}
      {spriteIds.length > 0 && (
        <div className="bg-[#dff4fb]/75 rounded-2xl p-1.5 border border-white flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {spriteIds.map((id) => (
              <PokemonSprite
                key={id}
                src={getPixelSpriteUrl(id)}
                alt={`Pokédex #${String(id).padStart(4, '0')}`}
                width={32}
                height={32}
                className="w-8 h-8 object-contain bg-white/85 rounded-xl border border-white shrink-0"
              />
            ))}
            {built.allSpecialIds.length > spriteIds.length && (
              <span className="text-[10px] font-extrabold text-[#0b698e] px-1">
                +{built.allSpecialIds.length - spriteIds.length}
              </span>
            )}
          </div>
          {onSelectSpeciesInGrid && (
            <button
              type="button"
              onClick={() => onSelectSpeciesInGrid(built.allSpecialIds)}
              className="compact-inline-chip pogo-pill text-[10px] px-2.5 py-1 shrink-0 cursor-pointer"
            >
              🔍 DEX ({built.allSpecialIds.length})
            </button>
          )}
        </div>
      )}

      {/* 1-Tap Event Search Copy Chips */}
      <div className="flex flex-wrap gap-1.5 pt-0.5">
        <EventCopyChip
          label="🔥 Raids & Megas"
          text={built.raidAndMegaString}
          ariaLabel={`Copy Raid and Mega search string for ${ev.name}`}
          variant="teal"
        />

        {built.regionalAndRareTradeString && (
          <EventCopyChip
            label="🌍 Regionals / Rotom"
            text={built.regionalAndRareTradeString}
            ariaLabel={`Copy Regionals, Rotom, and Unown trade string for ${ev.name}`}
            variant="indigo"
          />
        )}

        {built.backgroundKeepString && (
          <EventCopyChip
            label={ev.backgroundType === 'locationbackground' ? '🖼️ Location BG' : '🌌 Special BG'}
            text={built.backgroundKeepString}
            ariaLabel={`Copy Background search string for ${ev.name}`}
            variant="purple"
          />
        )}

        {built.backgroundSurplusString && (
          <EventCopyChip
            label="🧹 Surplus BG (!#)"
            text={built.backgroundSurplusString}
            ariaLabel={`Copy Surplus Global Background cleanup string for ${ev.name}`}
            variant="rose"
          />
        )}

        {built.mightyCheckString && (
          <EventCopyChip
            label="💪 Mighty 3*-4*"
            text={built.mightyCheckString}
            ariaLabel={`Copy Mighty Pokémon search string for ${ev.name}`}
            variant="amber"
          />
        )}

        <EventCopyChip
          label="⚔️ PvP IVs"
          text={built.pvpIvCheckString}
          ariaLabel={`Copy PvP low-attack IV string for ${ev.name}`}
          variant="emerald"
        />

        <EventCopyChip
          label="🧹 Safe 0*-2* Trash"
          text={built.eventLeftoverTrashString}
          ariaLabel={`Copy Safe 0 to 2 star Trash string excluding special Pokémon for ${ev.name}`}
          variant="dark"
        />
      </div>

      {/* Consolidated Species Roster & Raw String Drawer */}
      <details className="text-[11px] pt-0.5">
        <summary className="text-[10px] font-bold text-[#285d72] hover:text-[#0b698e] cursor-pointer select-none">
          📋 Species roster &amp; raw strings
        </summary>
        <div className="mt-1.5 space-y-1.5">
          {(ev.raidSummary || ev.specialSummary || ev.featuredSpecies) && (
            <div className="bg-white/85 rounded-xl p-2 border border-white text-[11px] leading-snug space-y-0.5">
              {ev.raidSummary && (
                <div className="text-[#123c4d]">
                  <span className="font-extrabold text-[#0b698e]">⚔️ Raids/Megas: </span>
                  <span className="font-medium">{ev.raidSummary}</span>
                </div>
              )}
              {ev.specialSummary && (
                <div className="text-[#123c4d]">
                  <span className="font-extrabold text-[#3b6fd4]">🌍 Special/Regionals: </span>
                  <span className="font-medium">{ev.specialSummary}</span>
                </div>
              )}
              {!ev.raidSummary && !ev.specialSummary && ev.featuredSpecies && (
                <div className="text-[#1b4d60] font-medium">{ev.featuredSpecies}</div>
              )}
            </div>
          )}

          <div className="space-y-1 bg-[#073b50] text-[#bfeaf6] p-2.5 rounded-xl font-mono text-[10px]">
            <button
              type="button"
              onClick={() => onLoadToBar?.(built.raidAndMegaString)}
              className="compact-inline-chip block w-full text-left truncate cursor-pointer hover:text-white"
              title="Tap to load into bottom bar"
            >
              <span className="text-[#88d7f0]">Raids: </span>
              {built.raidAndMegaString}
            </button>
            {built.regionalAndRareTradeString && (
              <button
                type="button"
                onClick={() => onLoadToBar?.(built.regionalAndRareTradeString)}
                className="compact-inline-chip block w-full text-left truncate cursor-pointer hover:text-white"
                title="Tap to load into bottom bar"
              >
                <span className="text-[#88d7f0]">Special: </span>
                {built.regionalAndRareTradeString}
              </button>
            )}
            {built.backgroundKeepString && (
              <button
                type="button"
                onClick={() => onLoadToBar?.(built.backgroundKeepString)}
                className="compact-inline-chip block w-full text-left truncate cursor-pointer hover:text-white"
                title="Tap to load into bottom bar"
              >
                <span className="text-[#88d7f0]">BG: </span>
                {built.backgroundKeepString}
              </button>
            )}
            <button
              type="button"
              onClick={() => onLoadToBar?.(built.eventLeftoverTrashString)}
              className="compact-inline-chip block w-full text-left truncate cursor-pointer hover:text-white"
              title="Tap to load into bottom bar"
            >
              <span className="text-rose-300">Safe Trash: </span>
              {built.eventLeftoverTrashString}
            </button>
          </div>
        </div>
      </details>
    </div>
  );
}

export default React.memo(MajorEventCard);
