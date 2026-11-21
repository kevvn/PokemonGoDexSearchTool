import React, { useState, useEffect, useMemo, useRef, useCallback, useId, createContext, useContext } from 'react';
import {
  COMMUNITY_DAY_EVENTS,
  getCommunityDaysByYear,
  ALL_COMMUNITY_DAY_PRE_EVO_IDS,
} from '../data/communityDayRegistry';
import {
  ensureTemporalReady,
  getTodayPlainDateString,
  calculateAgeSearchString,
  buildEventActionStrings,
  loadStoredEventDatabase,
  persistEventDatabaseState,
  resetStoredEventDatabase,
  computeYearSlicerPlan,
  GLOBAL_REGIONAL_ROTOM_UNOWN_IDS,
  GLOBAL_REGIONAL_ROTOM_UNOWN_RANGES,
  TRAVEL_TRIPS,
} from '../data/eventAndTripRegistry';
import {
  getActiveMetaCache,
  syncLivePvPokeAndDialgaDex,
  computeMetaIdSets,
} from '../utils/metaSyncService';
import { compressIdRanges, compileDnfToPogoCnf } from '../utils/searchUtils';
import { PogoCloseButton, PogoSummaryCard, PogoSearchInput } from './ui/PogoDesignSystem';

const GLOBAL_REGIONAL_NEGATION = GLOBAL_REGIONAL_ROTOM_UNOWN_RANGES
  .split(',')
  .filter(Boolean)
  .map((r) => `!${r}`)
  .join('&');

const TriageSessionContext = createContext({
  doneCards: new Set(),
  markCardDone: () => {},
  toggleCardDone: () => {},
});

/**
 * Compact Accessible Copy Chip using Pokémon GO Pill Design Language + mwg `copy-button`.
 */
function CopyChip({ label, text, ariaLabel, variant = 'teal' }) {
  const targetId = useId();

  const styles = {
    purple: 'bg-[#7c52b5] hover:bg-[#6941a1] text-white border-white/80',
    indigo: 'bg-[#3b6fd4] hover:bg-[#2d5ec0] text-white border-white/80',
    teal: 'bg-[#0d7da8] hover:bg-[#0b698e] text-white border-white/85',
    amber: 'bg-amber-400 hover:bg-amber-500 text-[#123c4d] border-white/90',
    emerald: 'bg-[#2b9e66] hover:bg-[#228655] text-white border-white/80',
    rose: 'bg-rose-600 hover:bg-rose-700 text-white border-white/80',
    dark: 'bg-[#094f6c] hover:bg-[#073b50] text-white border-white/80',
  }[variant] || 'bg-[#0d7da8] hover:bg-[#0b698e] text-white border-white/85';

  return (
    <span className="mwg-copy">
      <span id={targetId} data-copy-text={text} hidden>
        {text}
      </span>
      <button
        type="button"
        {...{ command: '--copy', commandfor: targetId }}
        aria-label={ariaLabel || `Copy ${label}`}
        className={`mwg-copy-btn compact-inline-chip min-h-[40px] sm:min-h-[34px] px-3 py-1 rounded-full text-[11px] font-extrabold border shadow-2xs ${styles}`}
      >
        <span className="icon-copy" aria-hidden="true">{label}</span>
        <span className="icon-check" aria-hidden="true">✓ {label}</span>
      </button>
      <span className="mwg-copy-tip" role="status" />
    </span>
  );
}

/**
 * Frosted Ice-Glass Search Recipe Card consuming the Pokémon GO Pokédex Design System.
 */
function SearchRecipeCard({
  recipeKey,
  badge,
  title,
  tagSuggestion,
  subtitle,
  searchString,
  speciesIds = [],
  accent = 'teal',
  onLoadToBar,
  onSelectSpeciesInGrid,
  children,
}) {
  const inputId = useId();
  const [isExpanded, setIsExpanded] = useState(false);
  const { doneCards, markCardDone, toggleCardDone } = useContext(TriageSessionContext);
  const cardKey = recipeKey || `${badge || ''}::${title}`;
  const isDone = doneCards.has(cardKey);
  const isTransfer = accent === 'rose';

  const accentStyles = {
    teal: 'pogo-glass-card',
    amber: 'pogo-glass-card ring-1 ring-amber-300/70',
    purple: 'pogo-glass-card ring-1 ring-[#ab6ac8]/45',
    indigo: 'pogo-glass-card ring-1 ring-[#5090d6]/45',
    emerald: 'pogo-glass-card ring-1 ring-[#63bc5a]/50',
    rose: 'pogo-glass-card pogo-transfer-card ring-1 ring-rose-300/75',
  }[accent] || 'pogo-glass-card';

  const badgeStyles = {
    teal: 'bg-[#0d7da8] text-white',
    amber: 'bg-amber-400 text-[#123c4d]',
    purple: 'bg-[#8d52b5] text-white',
    indigo: 'bg-[#3b6fd4] text-white',
    emerald: 'bg-[#2b9e66] text-white',
    rose: 'bg-rose-600 text-white',
  }[accent] || 'bg-[#0d7da8] text-white';

  return (
    <div
      className={`min-w-0 max-w-full overflow-hidden flex flex-col justify-between gap-2.5 p-3.5 transition-opacity ${accentStyles} ${
        isDone ? 'opacity-80' : ''
      }`}
    >
      <div className="space-y-2 min-w-0">
        {/* Top Meta Row: Badge + Tag on left, Done toggle on right */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5 min-w-0">
            {badge && (
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider leading-tight ${badgeStyles}`}>
                {badge}
              </span>
            )}
            {tagSuggestion && (
              <span className="px-2 py-0.5 rounded-full bg-[var(--pogo-tag-bg)] text-[var(--pogo-accent-ink)] border border-[var(--pogo-tag-border)] font-mono text-[11px] font-bold leading-tight">
                #{tagSuggestion}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => toggleCardDone(cardKey)}
            aria-pressed={isDone}
            aria-label={isDone ? `Mark ${title} as not done` : `Mark ${title} as done`}
            className={`compact-inline-chip mwg-icon-hit shrink-0 min-h-[30px] px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border cursor-pointer transition-colors ${
              isDone
                ? 'bg-emerald-600 text-white border-white/85'
                : 'pogo-pill'
            }`}
          >
            {isDone ? '✓ Done' : '○ Done'}
          </button>
        </div>

        {/* Full-Width Title & Subtitle (never squeezed by action buttons) */}
        <div className="space-y-1 min-w-0">
          <h4 className="font-display text-sm font-extrabold text-[var(--pogo-ink-strong)] leading-snug">
            {title}
          </h4>
          {subtitle && (
            <p className="text-xs text-[var(--pogo-ink-secondary)] font-medium leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>

        {children && <div className="pt-0.5">{children}</div>}
      </div>

      {/* Bottom Stack: Expandable Query Preview + Full-Width Action Bar */}
      <div className="space-y-2 min-w-0 pt-0.5">
        <span id={inputId} data-copy-text={searchString} hidden>
          {searchString}
        </span>
        <button
          type="button"
          onClick={() => {
            setIsExpanded((v) => !v);
            if (onLoadToBar) onLoadToBar(searchString);
          }}
          aria-expanded={isExpanded}
          aria-label={`Search string preview for ${title}. Tap to ${isExpanded ? 'collapse' : 'expand'} and load into bottom bar.`}
          className={`w-full min-w-0 flex items-center justify-between gap-2 text-left font-mono text-[11px] font-bold bg-[#073b50] text-[#c6effa] px-3 py-2 border border-[#0d7da8]/45 focus:outline-none focus:ring-2 focus:ring-[#3bb4e0] cursor-pointer select-none min-h-[38px] ${
            isExpanded ? 'rounded-2xl items-start' : 'rounded-full'
          }`}
        >
          <span className={`min-w-0 flex-1 ${isExpanded ? 'break-all whitespace-normal' : 'truncate'}`}>
            {searchString}
          </span>
          <span className="shrink-0 inline-flex items-center gap-1 text-[10px] text-[#88d7f0] font-sans font-extrabold">
            <span>{searchString.length}c</span>
            <span aria-hidden="true">{isExpanded ? '▴' : '▾'}</span>
          </span>
        </button>

        <div className="flex items-center gap-2 min-w-0">
          <span className="mwg-copy mwg-copy-full">
            <button
              type="button"
              {...{ command: '--copy', commandfor: inputId }}
              onClick={() => markCardDone(cardKey)}
              aria-label={`${isTransfer ? 'Copy transfer search string' : 'Copy search string'} for ${title}`}
              className={`mwg-copy-btn w-full min-h-[42px] sm:min-h-[36px] px-4 py-1.5 text-xs font-extrabold uppercase rounded-full border shadow-2xs ${
                isTransfer
                  ? 'bg-rose-600 hover:bg-rose-700 text-white border-white/85'
                  : 'pogo-pill-active'
              }`}
            >
              <span className="icon-copy" aria-hidden="true">📋</span>
              <span className="icon-check" aria-hidden="true">✓</span>
              <span>{isTransfer ? 'COPY TRANSFER' : 'COPY'}</span>
            </button>
            <span className="mwg-copy-tip" role="status" />
          </span>

          {speciesIds.length > 0 && onSelectSpeciesInGrid && (
            <button
              type="button"
              onClick={() => onSelectSpeciesInGrid(speciesIds)}
              aria-label={`View ${speciesIds.length} species in Pokédex Grid`}
              className="compact-inline-chip pogo-pill shrink-0 min-h-[42px] sm:min-h-[36px] px-3 py-1.5 text-xs font-extrabold cursor-pointer inline-flex items-center gap-1"
              title="Open species in Pokédex Grid"
            >
              <span aria-hidden="true">🔍</span>
              <span>{speciesIds.length}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Frosted Ice-Glass Major Event Card featuring Pokédex Tile Sprites + 1-Tap Pill Chips.
 */
function MajorEventCard({
  ev,
  built,
  globalBgKeepCap,
  onToggleAttended,
  onEdit,
  onDelete,
  onSelectSpeciesInGrid,
  onLoadToBar,
}) {
  const spriteIds = built.allSpecialIds.slice(0, 7);

  return (
    <div
      className={`min-w-0 max-w-full overflow-hidden pogo-glass-card p-3.5 space-y-2.5 transition-opacity ${
        ev.attended ? '' : 'opacity-75'
      }`}
    >
      {/* Top Meta Row */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
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
            <span className="text-[11px] font-bold text-[var(--pogo-ink-secondary)]">
              {ev.start}{ev.end !== ev.start ? ` → ${ev.end}` : ''}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 mt-1">
            <h4 className="font-display text-sm font-extrabold text-[var(--pogo-ink-strong)] leading-snug">{ev.name}</h4>
            <span className="px-2 py-0.5 rounded-full bg-[var(--pogo-tag-bg)] text-[var(--pogo-accent-ink)] border border-[var(--pogo-tag-border)] font-mono text-[11px] font-bold">
              #{ev.tag}
            </span>
          </div>
          <p className="text-xs text-[var(--pogo-ink-secondary)] font-semibold">{ev.location}</p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <label className="compact-inline-chip inline-flex items-center gap-1 text-[11px] font-extrabold text-[var(--pogo-ink-primary)] bg-[var(--pogo-pill-bg)] px-2.5 py-1 rounded-full border border-[var(--pogo-pill-border)] shadow-2xs cursor-pointer">
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
              <img
                key={id}
                src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`}
                alt={`Pokédex #${String(id).padStart(4, '0')}`}
                loading="lazy"
                width="32"
                height="32"
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

      {/* 1-Tap Poké Daxi / LuckyBunz Event Search Chips */}
      <div className="flex flex-wrap gap-1.5 pt-0.5">
        <CopyChip
          label="🔥 Raids & Megas"
          text={built.raidAndMegaString}
          ariaLabel={`Copy Raid and Mega search string for ${ev.name}`}
          variant="teal"
        />

        {built.regionalAndRareTradeString && (
          <CopyChip
            label="🌍 Regionals / Rotom"
            text={built.regionalAndRareTradeString}
            ariaLabel={`Copy Regionals, Rotom, and Unown trade string for ${ev.name}`}
            variant="indigo"
          />
        )}

        {built.backgroundKeepString && (
          <CopyChip
            label={ev.backgroundType === 'locationbackground' ? '🖼️ Location BG' : `🌌 Special BG (≤${globalBgKeepCap})`}
            text={built.backgroundKeepString}
            ariaLabel={`Copy Background search string for ${ev.name}`}
            variant="purple"
          />
        )}

        {built.mightyCheckString && (
          <CopyChip
            label="💪 Mighty 3*-4*"
            text={built.mightyCheckString}
            ariaLabel={`Copy Mighty Pokémon search string for ${ev.name}`}
            variant="amber"
          />
        )}

        <CopyChip
          label="⚔️ PvP IVs"
          text={built.pvpIvCheckString}
          ariaLabel={`Copy PvP low-attack IV string for ${ev.name}`}
          variant="emerald"
        />

        <CopyChip
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

          <div className="space-y-1 bg-[#073b50] text-[#bfeaf6] p-2.5 rounded-xl font-mono text-[11px]">
            <button
              type="button"
              onClick={() => onLoadToBar?.(built.raidAndMegaString)}
              className="block w-full text-left truncate cursor-pointer hover:text-white focus:outline-none focus:underline py-0.5"
              title="Tap to load into bottom bar"
            >
              <span className="text-[#88d7f0]">Raids: </span>{built.raidAndMegaString}
            </button>
            {built.regionalAndRareTradeString && (
              <button
                type="button"
                onClick={() => onLoadToBar?.(built.regionalAndRareTradeString)}
                className="block w-full text-left truncate cursor-pointer hover:text-white focus:outline-none focus:underline py-0.5"
                title="Tap to load into bottom bar"
              >
                <span className="text-[#88d7f0]">Special: </span>{built.regionalAndRareTradeString}
              </button>
            )}
            {built.backgroundKeepString && (
              <button
                type="button"
                onClick={() => onLoadToBar?.(built.backgroundKeepString)}
                className="block w-full text-left truncate cursor-pointer hover:text-white focus:outline-none focus:underline py-0.5"
                title="Tap to load into bottom bar"
              >
                <span className="text-[#88d7f0]">BG: </span>{built.backgroundKeepString}
              </button>
            )}
            <button
              type="button"
              onClick={() => onLoadToBar?.(built.eventLeftoverTrashString)}
              className="block w-full text-left truncate cursor-pointer hover:text-white focus:outline-none focus:underline py-0.5"
              title="Tap to load into bottom bar"
            >
              <span className="text-rose-300">Safe Trash: </span>{built.eventLeftoverTrashString}
            </button>
          </div>
        </div>
      </details>
    </div>
  );
}

const EMPTY_EVENT_FORM = {
  id: '',
  name: '',
  tag: '',
  year: 2026,
  start: '2026-11-14',
  end: '2026-11-15',
  scope: 'global',
  series: 'GO Fest',
  backgroundType: 'specialbackground',
  location: '',
  raidMegaIdsText: '',
  regionalRareIdsText: '',
  raidSummary: '',
  specialSummary: '',
  hasMighty: false,
  attended: true,
};

const TABS = [
  { id: 'pipeline', icon: '⚡', label: 'Triage' },
  { id: 'events-db', icon: '🎟️', label: 'Events' },
  { id: 'year-slicer', icon: '🗓️', label: 'Timeline' },
  { id: 'community-days', icon: '✨', label: 'Comm Days' },
  { id: 'meta-sync', icon: '⚔️', label: 'Meta' },
];

function TriagePipelineView({
  pokemonList,
  onLoadSearchString,
  onSelectSpeciesInGrid,
}) {
  const [activeSubTab, setActiveSubTab] = useState('pipeline');
  const [untaggedOnly, setUntaggedOnly] = useState(true);
  const [referenceDate, setReferenceDate] = useState(() => getTodayPlainDateString());
  const [bufferMode, setBufferMode] = useState('exact');
  const [temporalReady, setTemporalReady] = useState(false);

  // Dismissible "How Triage Works" micro-banner
  const [guideDismissed, setGuideDismissed] = useState(() => {
    try {
      return localStorage.getItem('pogo_triage_guide_dismissed') === '1';
    } catch {
      return false;
    }
  });
  const dismissGuide = useCallback(() => {
    setGuideDismissed(true);
    try {
      localStorage.setItem('pogo_triage_guide_dismissed', '1');
    } catch {
      // ignore storage errors
    }
  }, []);

  // Session check-off state persisted across Pokémon GO app switches
  const [doneCards, setDoneCards] = useState(() => {
    try {
      const raw = sessionStorage.getItem('pogo_triage_done_cards');
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? new Set(parsed) : new Set();
    } catch {
      return new Set();
    }
  });

  useEffect(() => {
    try {
      sessionStorage.setItem('pogo_triage_done_cards', JSON.stringify([...doneCards]));
    } catch {
      // ignore storage errors
    }
  }, [doneCards]);

  const markCardDone = useCallback((key) => {
    setDoneCards((prev) => {
      if (prev.has(key)) return prev;
      const next = new Set(prev);
      next.add(key);
      return next;
    });
  }, []);

  const toggleCardDone = useCallback((key) => {
    setDoneCards((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const resetSession = useCallback(() => {
    setDoneCards(new Set());
  }, []);

  const sessionContextValue = useMemo(
    () => ({ doneCards, markCardDone, toggleCardDone }),
    [doneCards, markCardDone, toggleCardDone]
  );

  // Trade stock caps
  const [cdShinyKeepCap, setCdShinyKeepCap] = useState(3);
  const [globalBgKeepCap, setGlobalBgKeepCap] = useState(3);
  const [costumeKeepCap, setCostumeKeepCap] = useState(2);

  // Persistent Event Archive
  const [eventDb, setEventDb] = useState(() => loadStoredEventDatabase());

  // Triage dynamic Background scope selectors (generic defaults — no prompt hardcoding!)
  const [selectedLocBgScopeId, setSelectedLocBgScopeId] = useState('ALL_ANY_DATE');
  const [selectedGlobalBgScopeId, setSelectedGlobalBgScopeId] = useState('ALL_ANY_DATE');

  // Events Tab filters
  const [eventDbSearch, setEventDbSearch] = useState('');
  const [eventYearFilter, setEventYearFilter] = useState('ALL');
  const [eventSeriesFilter, setEventSeriesFilter] = useState('ALL');
  const [dbStatusBanner, setDbStatusBanner] = useState(null);

  // Custom Date Range Calculator
  const [customEventName, setCustomEventName] = useState('Custom Window');
  const [customStartDate, setCustomStartDate] = useState(() => getTodayPlainDateString());
  const [customEndDate, setCustomEndDate] = useState(() => getTodayPlainDateString());
  const [customExcludeRemote, setCustomExcludeRemote] = useState(false);
  const [customRequireLocationBg, setCustomRequireLocationBg] = useState(false);

  // Timeline Tab state
  const [slicerYear, setSlicerYear] = useState(() => Number(getTodayPlainDateString().slice(0, 4)) || 2026);
  const [includeTripsInSlicer, setIncludeTripsInSlicer] = useState(true);
  const [includeCdsInSlicer, setIncludeCdsInSlicer] = useState(true);

  // Dialog refs
  const optionsDialogRef = useRef(null);
  const optionsHeadingId = useId();
  const eventDialogRef = useRef(null);
  const fileImportRef = useRef(null);
  const dialogId = useId();
  const dialogHeadingId = useId();
  const [eventForm, setEventForm] = useState(EMPTY_EVENT_FORM);
  const [isEditingExisting, setIsEditingExisting] = useState(false);

  // Tablist & Panel refs (mwg: tabs)
  const tabBaseId = useId();
  const tablistRef = useRef(null);
  const tabRefs = useRef({});
  const panelRefs = useRef({});

  // Community Day state
  const [selectedCdEventIds, setSelectedCdEventIds] = useState(
    () => new Set(COMMUNITY_DAY_EVENTS.map((ev) => ev.id))
  );
  const [cdSearchFilter, setCdSearchFilter] = useState('');
  const accordionRef = useRef(null);
  const toggleBtnRef = useRef(null);
  const [allYearsExpanded, setAllYearsExpanded] = useState(false);

  // Meta Cache state
  const [metaCache, setMetaCache] = useState(() => getActiveMetaCache());
  const [isSyncingMeta, setIsSyncingMeta] = useState(false);
  const [syncMessage, setSyncMessage] = useState(null);
  const [activeMetaLeagueTab, setActiveMetaLeagueTab] = useState('great_league');
  const [metaSearchFilter, setMetaSearchFilter] = useState('');

  // Interactive AND (&) / OR (,) CNF Rule Combiner state
  const [cnfBranches, setCnfBranches] = useState([
    '4*',
    'gigantamax',
    'shiny&shadow',
    'shiny&legendary',
    'shiny&mythical',
    'shiny&ultra beasts',
    'shiny&locationbackground',
  ]);
  const [newBranchInput, setNewBranchInput] = useState('');

  // Load Temporal + Focusgroup polyfill (mwg: tabs & calculate-event-differentials)
  useEffect(() => {
    ensureTemporalReady().then(() => {
      setTemporalReady(true);
      setReferenceDate(getTodayPlainDateString());
    });

    if (typeof HTMLElement !== 'undefined' && !Object.hasOwn(HTMLElement.prototype, 'focusGroup')) {
      import('https://esm.sh/@microsoft/focusgroup-polyfill')
        .then((mod) => {
          if (mod?.polyfill) mod.polyfill();
        })
        .catch(() => {});
    }
  }, []);

  // Scroll-driven animation fallback for `.mwg-tablist` edge fades (mwg: tabs)
  useEffect(() => {
    const scroller = tablistRef.current;
    if (!scroller || typeof CSS === 'undefined' || CSS.supports('animation-timeline', 'scroll()')) {
      return;
    }
    const first = scroller.firstElementChild;
    const last = scroller.lastElementChild;
    if (!first || !last) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const { target, intersectionRatio } of entries) {
          scroller.classList.toggle(
            target === first ? 'more-start' : 'more-end',
            intersectionRatio < 1
          );
        }
      },
      { root: scroller, threshold: 1, rootMargin: '1px' }
    );
    observer.observe(first);
    observer.observe(last);
    return () => observer.disconnect();
  }, []);

  // Scroll selected tab into view without scrolling page + sync `beforematch` on `hidden="until-found"` panels (mwg: tabs)
  useEffect(() => {
    const activeTabEl = tabRefs.current[activeSubTab];
    if (activeTabEl?.scrollIntoView) {
      try {
        activeTabEl.scrollIntoView({ block: 'nearest', inline: 'nearest', container: 'nearest' });
      } catch {
        activeTabEl.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      }
    }
  }, [activeSubTab]);

  useEffect(() => {
    const cleanups = [];
    TABS.forEach((tab) => {
      const panel = panelRefs.current[tab.id];
      if (!panel) return;
      const onBeforeMatch = () => setActiveSubTab(tab.id);
      panel.addEventListener('beforematch', onBeforeMatch);
      cleanups.push(() => panel.removeEventListener('beforematch', onBeforeMatch));
    });
    return () => cleanups.forEach((fn) => fn());
  }, []);

  // Keyboard arrow fallback when focusgroup polyfill is offline
  const handleTabKeyDown = (e, idx) => {
    if (Object.hasOwn(HTMLElement.prototype, 'focusGroup')) return;
    let nextIdx = null;
    if (e.key === 'ArrowRight') nextIdx = (idx + 1) % TABS.length;
    else if (e.key === 'ArrowLeft') nextIdx = (idx - 1 + TABS.length) % TABS.length;
    else if (e.key === 'Home') nextIdx = 0;
    else if (e.key === 'End') nextIdx = TABS.length - 1;

    if (nextIdx !== null) {
      e.preventDefault();
      const targetTab = TABS[nextIdx];
      setActiveSubTab(targetTab.id);
      tabRefs.current[targetTab.id]?.focus();
    }
  };

  // Native <dialog> light-dismiss fallback helper (mwg: dialog)
  useEffect(() => {
    const attachDialogBehavior = (dialog) => {
      if (!dialog) return () => {};
      const handleClose = () => {
        dialog.returnValue = '';
      };
      dialog.addEventListener('close', handleClose);

      let cleanupOutside = null;
      if (!('closedBy' in HTMLDialogElement.prototype)) {
        const outside = (e) => {
          const r = dialog.getBoundingClientRect();
          return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
        };
        let pressedOutside = false;
        const onDown = (e) => {
          pressedOutside = outside(e);
        };
        const onUp = (e) => {
          if (pressedOutside && outside(e)) dialog.close();
        };
        dialog.addEventListener('pointerdown', onDown);
        dialog.addEventListener('pointerup', onUp);
        cleanupOutside = () => {
          dialog.removeEventListener('pointerdown', onDown);
          dialog.removeEventListener('pointerup', onUp);
        };
      }

      return () => {
        dialog.removeEventListener('close', handleClose);
        if (cleanupOutside) cleanupOutside();
      };
    };

    const c1 = attachDialogBehavior(eventDialogRef.current);
    const c2 = attachDialogBehavior(optionsDialogRef.current);
    return () => {
      c1();
      c2();
    };
  }, []);

  // Community Day Accordion Invoker Command + fallback
  useEffect(() => {
    const accordion = accordionRef.current;
    const toggleBtn = toggleBtnRef.current;
    if (!accordion || !toggleBtn) return;

    const getDetails = () => Array.from(accordion.querySelectorAll('details'));
    const toggleAll = () => {
      const details = getDetails();
      const shouldOpen = !details.every((d) => d.open);
      details.forEach((d) => {
        d.open = shouldOpen;
      });
      setAllYearsExpanded(shouldOpen);
    };

    const handleCommand = (e) => {
      if (e.command === '--toggle-all') toggleAll();
    };
    const handleToggleCapture = () => {
      const details = getDetails();
      const everyOpen = details.length > 0 && details.every((d) => d.open);
      toggleBtn.setAttribute('aria-expanded', String(everyOpen));
      setAllYearsExpanded(everyOpen);
    };

    accordion.addEventListener('command', handleCommand);
    accordion.addEventListener('toggle', handleToggleCapture, { capture: true });

    const supportsInvokerCommand = Object.hasOwn(HTMLButtonElement.prototype, 'commandForElement');
    if (!supportsInvokerCommand) {
      toggleBtn.addEventListener('click', toggleAll);
    }

    return () => {
      accordion.removeEventListener('command', handleCommand);
      accordion.removeEventListener('toggle', handleToggleCapture, { capture: true });
      if (!supportsInvokerCommand) {
        toggleBtn.removeEventListener('click', toggleAll);
      }
    };
  }, []);

  // Event Archive Mutations
  const handleToggleEventAttended = useCallback((eventId) => {
    setEventDb((prev) => {
      const current = prev.events.find((e) => e.id === eventId);
      const nextVal = current ? !current.attended : true;
      const nextAttendedById = { ...prev.attendedById, [eventId]: nextVal };
      persistEventDatabaseState({
        attendedById: nextAttendedById,
        customEvents: prev.customEvents,
        editedBundledById: prev.editedBundledById,
      });
      return loadStoredEventDatabase();
    });
  }, []);

  const openAddEventModal = () => {
    setIsEditingExisting(false);
    setEventForm({
      ...EMPTY_EVENT_FORM,
      id: `custom-${Date.now()}`,
      start: referenceDate,
      end: referenceDate,
      year: Number(referenceDate.slice(0, 4)) || 2026,
    });
    eventDialogRef.current?.showModal();
  };

  const openEditEventModal = (ev) => {
    setIsEditingExisting(true);
    setEventForm({
      id: ev.id,
      name: ev.name,
      tag: ev.tag,
      year: ev.year,
      start: ev.start,
      end: ev.end,
      scope: ev.scope,
      series: ev.series || 'City & Special',
      backgroundType: ev.backgroundType || 'none',
      location: ev.location || '',
      raidMegaIdsText: (ev.raidMegaIds || ev.dexIds || []).join(', '),
      regionalRareIdsText: (ev.regionalRareIds || []).join(', '),
      raidSummary: ev.raidSummary || ev.featuredSpecies || '',
      specialSummary: ev.specialSummary || '',
      hasMighty: Boolean(ev.hasMighty),
      attended: Boolean(ev.attended),
      isCustom: Boolean(ev.isCustom),
    });
    eventDialogRef.current?.showModal();
  };

  const parseIdList = (str) =>
    (str || '')
      .split(/[\s,]+/)
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isInteger(n) && n >= 1 && n <= 1025);

  const handleSaveEventModal = (e) => {
    e.preventDefault();
    const raidMegaIds = parseIdList(eventForm.raidMegaIdsText);
    const regionalRareIds = parseIdList(eventForm.regionalRareIdsText);
    const dexIds = Array.from(new Set([...raidMegaIds, ...regionalRareIds]));
    const yearFromStart = Number((eventForm.start || '').slice(0, 4)) || Number(eventForm.year) || 2026;

    const cleanEntry = {
      id: eventForm.id || `custom-${Date.now()}`,
      name: eventForm.name.trim() || 'Untitled Event',
      tag: (eventForm.tag.trim() || 'Event').slice(0, 12),
      year: yearFromStart,
      start: eventForm.start,
      end: eventForm.end || eventForm.start,
      scope: eventForm.scope,
      series: eventForm.series || 'City & Special',
      backgroundType: eventForm.backgroundType,
      location: eventForm.location.trim() || 'Worldwide',
      raidMegaIds,
      regionalRareIds,
      dexIds,
      raidSummary: eventForm.raidSummary.trim(),
      specialSummary: eventForm.specialSummary.trim(),
      featuredSpecies: [eventForm.raidSummary.trim(), eventForm.specialSummary.trim()].filter(Boolean).join(' • '),
      hasMighty: Boolean(eventForm.hasMighty),
      attended: Boolean(eventForm.attended),
    };

    setEventDb((prev) => {
      const nextAttendedById = { ...prev.attendedById, [cleanEntry.id]: cleanEntry.attended };
      const nextCustom = [...prev.customEvents];
      const nextEditedBundled = { ...prev.editedBundledById };

      const isBundled = prev.events.some((item) => item.id === cleanEntry.id && !item.isCustom);
      if (isBundled) {
        nextEditedBundled[cleanEntry.id] = cleanEntry;
      } else {
        const existingIdx = nextCustom.findIndex((c) => c.id === cleanEntry.id);
        if (existingIdx >= 0) nextCustom[existingIdx] = { ...cleanEntry, isCustom: true };
        else nextCustom.unshift({ ...cleanEntry, isCustom: true });
      }

      persistEventDatabaseState({
        attendedById: nextAttendedById,
        customEvents: nextCustom,
        editedBundledById: nextEditedBundled,
      });
      return loadStoredEventDatabase();
    });

    setDbStatusBanner(`Saved "${cleanEntry.name}".`);
    eventDialogRef.current?.close('saved');
  };

  const handleDeleteCustomEvent = (eventId) => {
    setEventDb((prev) => {
      const nextCustom = prev.customEvents.filter((c) => c.id !== eventId);
      persistEventDatabaseState({
        attendedById: prev.attendedById,
        customEvents: nextCustom,
        editedBundledById: prev.editedBundledById,
      });
      return loadStoredEventDatabase();
    });
    setDbStatusBanner('Deleted custom event.');
  };

  const handleExportEventsJson = () => {
    const payload = JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        events: eventDb.events,
        attendedById: eventDb.attendedById,
        customEvents: eventDb.customEvents,
        editedBundledById: eventDb.editedBundledById,
      },
      null,
      2
    );
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pogo-events-${referenceDate}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportEventsJson = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      persistEventDatabaseState({
        attendedById: parsed.attendedById || {},
        customEvents: Array.isArray(parsed.customEvents) ? parsed.customEvents : [],
        editedBundledById: parsed.editedBundledById || {},
      });
      setEventDb(loadStoredEventDatabase());
      setDbStatusBanner(`Imported ${file.name}.`);
    } catch (err) {
      setDbStatusBanner(`Import failed: ${err.message}`);
    } finally {
      e.target.value = '';
    }
  };

  const handleResetEventsDb = () => {
    setEventDb(resetStoredEventDatabase());
    setDbStatusBanner('Restored default event archive.');
  };

  // Computed Meta & CD Sets
  const metaSets = useMemo(
    () => computeMetaIdSets(metaCache, pokemonList),
    [metaCache, pokemonList]
  );

  const communityDaysByYear = useMemo(() => getCommunityDaysByYear(), []);

  const selectedCdFamilyIds = useMemo(() => {
    const idSet = new Set();
    COMMUNITY_DAY_EVENTS.forEach((ev) => {
      if (selectedCdEventIds.has(ev.id)) {
        ev.familyIds.forEach((fid) => idSet.add(fid));
      }
    });
    return Array.from(idSet).sort((a, b) => a - b);
  }, [selectedCdEventIds]);

  const selectedCdFamilyRanges = useMemo(
    () => compressIdRanges(selectedCdFamilyIds),
    [selectedCdFamilyIds]
  );

  const allCdPreEvoRanges = useMemo(
    () => compressIdRanges(ALL_COMMUNITY_DAY_PRE_EVO_IDS),
    []
  );

  const nonCdShinyNegationTokens = useMemo(() => {
    if (!selectedCdFamilyRanges) return '';
    return selectedCdFamilyRanges
      .split(',')
      .map((rng) => `!${rng}`)
      .join('&');
  }, [selectedCdFamilyRanges]);

  const prefix = untaggedOnly ? '!#&' : '';

  const crownJewelsCnfString = useMemo(
    () =>
      compileDnfToPogoCnf(
        [
          '4*',
          'gigantamax',
          'shiny&shadow',
          'shiny&legendary',
          'shiny&mythical',
          'shiny&ultra beasts',
          'shiny&locationbackground',
        ],
        untaggedOnly ? ['!#'] : []
      ),
    [untaggedOnly]
  );

  const customCompiledCnfString = useMemo(
    () => compileDnfToPogoCnf(cnfBranches, untaggedOnly ? ['!#'] : []),
    [cnfBranches, untaggedOnly]
  );

  // Timeline Year Slicer Plan
  const yearSlicerPlan = useMemo(
    () =>
      computeYearSlicerPlan({
        year: slicerYear,
        storedEvents: eventDb.events,
        communityDays: COMMUNITY_DAY_EVENTS,
        trips: TRAVEL_TRIPS,
        includeTrips: includeTripsInSlicer,
        includeCommunityDays: includeCdsInSlicer,
        refDateStr: referenceDate,
        bufferMode,
        untaggedOnly,
        globalBgKeepCap,
        temporalReady,
      }),
    [
      slicerYear,
      eventDb.events,
      includeTripsInSlicer,
      includeCdsInSlicer,
      referenceDate,
      bufferMode,
      untaggedOnly,
      globalBgKeepCap,
      temporalReady,
    ]
  );

  // Location & Global Background dynamic scope options (data-driven from archive)
  const allLocationBgEvents = useMemo(
    () => eventDb.events.filter((e) => e.backgroundType === 'locationbackground'),
    [eventDb.events]
  );
  const allGlobalBgEvents = useMemo(
    () => eventDb.events.filter((e) => e.backgroundType === 'specialbackground'),
    [eventDb.events]
  );

  const activeLocBgRecipe = useMemo(() => {
    if (selectedLocBgScopeId === 'ALL_ANY_DATE') {
      return {
        badge: 'Location BG • All Dates',
        tag: 'TradeLocBG',
        subtitle: 'Untraded venue Location Backgrounds across all in-person events.',
        searchString: `${prefix}!traded&locationbackground&!4*`,
        speciesIds: [],
      };
    }
    const ev = allLocationBgEvents.find((e) => e.id === selectedLocBgScopeId) || allLocationBgEvents[0];
    const built = buildEventActionStrings(ev, referenceDate, { untaggedOnly, bufferMode, temporalReady });
    return {
      badge: `${built.ageCalc.ageToken} • ${ev.start}`,
      tag: ev.tag,
      subtitle: `${ev.name} (${ev.location})`,
      searchString: built.backgroundKeepString,
      speciesIds: built.allSpecialIds,
    };
  }, [selectedLocBgScopeId, allLocationBgEvents, referenceDate, untaggedOnly, bufferMode, prefix, temporalReady]);

  const activeGlobalBgRecipe = useMemo(() => {
    if (selectedGlobalBgScopeId === 'ALL_ANY_DATE') {
      return {
        keepString: `${prefix}!traded&specialbackground&!locationbackground&!shiny&!4*&count-${globalBgKeepCap}`,
        purgeString: `${prefix}specialbackground&!locationbackground&!shiny&!4*&0*,1*,2*&count${globalBgKeepCap + 1}-&!favorite&!lucky`,
        subtitle: `Keep 1–${globalBgKeepCap} untraded copies; purge ${globalBgKeepCap + 1}+ low-IV duplicates.`,
      };
    }
    const ev = allGlobalBgEvents.find((e) => e.id === selectedGlobalBgScopeId) || allGlobalBgEvents[0];
    const built = buildEventActionStrings(ev, referenceDate, {
      untaggedOnly,
      bufferMode,
      globalBgKeepCap,
      temporalReady,
    });
    return {
      keepString: built.backgroundKeepString,
      purgeString: built.backgroundSurplusString,
      subtitle: `${ev.name} (${built.ageCalc.ageToken}, ${ev.start} → ${ev.end}).`,
    };
  }, [selectedGlobalBgScopeId, allGlobalBgEvents, referenceDate, untaggedOnly, bufferMode, globalBgKeepCap, prefix, temporalReady]);

  // Filtered Major Events for Events Tab
  const filteredEvents = useMemo(() => {
    return eventDb.events.filter((ev) => {
      if (eventYearFilter !== 'ALL' && Number(ev.year) !== Number(eventYearFilter)) return false;
      if (eventSeriesFilter !== 'ALL' && ev.series !== eventSeriesFilter) return false;
      if (eventDbSearch.trim()) {
        const q = eventDbSearch.toLowerCase();
        const hay = [
          ev.name,
          ev.location,
          ev.tag,
          ev.series,
          ev.raidSummary,
          ev.specialSummary,
          ev.featuredSpecies,
          String(ev.year),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return hay.includes(q);
      }
      return true;
    });
  }, [eventDb.events, eventYearFilter, eventSeriesFilter, eventDbSearch]);

  // Custom Age Calculator
  const customAgeResult = useMemo(() => {
    const extraTokens = [];
    if (customRequireLocationBg) extraTokens.push('locationbackground');
    return calculateAgeSearchString(
      customStartDate || referenceDate,
      customEndDate || customStartDate || referenceDate,
      referenceDate,
      {
        bufferMode,
        untaggedOnly,
        extraTokens,
        excludeRemote: customExcludeRemote,
        temporalReady,
      }
    );
  }, [
    customStartDate,
    customEndDate,
    referenceDate,
    bufferMode,
    untaggedOnly,
    customExcludeRemote,
    customRequireLocationBg,
    temporalReady,
  ]);

  // CD Selection Handlers
  const toggleCdEvent = useCallback((eventId) => {
    setSelectedCdEventIds((prev) => {
      const next = new Set(prev);
      if (next.has(eventId)) next.delete(eventId);
      else next.add(eventId);
      return next;
    });
  }, []);

  const toggleCdYear = useCallback((yearEvents, shouldSelect) => {
    setSelectedCdEventIds((prev) => {
      const next = new Set(prev);
      yearEvents.forEach((ev) => {
        if (shouldSelect) next.add(ev.id);
        else next.delete(ev.id);
      });
      return next;
    });
  }, []);

  const handleSyncMeta = async () => {
    setIsSyncingMeta(true);
    setSyncMessage(null);
    try {
      const updated = await syncLivePvPokeAndDialgaDex(pokemonList);
      setMetaCache(updated);
      setSyncMessage({
        type: 'success',
        text: `Synced PvPoke Top 100 (GL/UL/ML) & ${updated.pve.entries.length} PvE raiders.`,
      });
    } catch (err) {
      setSyncMessage({
        type: 'error',
        text: `Offline / sync error (${err.message}). Using cached rankings.`,
      });
    } finally {
      setIsSyncingMeta(false);
    }
  };

  const cdKeepCountToken = `count-${cdShinyKeepCap}`;
  const cdSurplusCountToken = `count${cdShinyKeepCap + 1}-`;
  const costumeKeepCountToken = `count-${costumeKeepCap}`;
  const costumeSurplusCountToken = `count${costumeKeepCap + 1}-`;

  const bufferLabel =
    bufferMode === 'evening-safe' ? '-1d Eve' : bufferMode === 'plus-minus-1' ? '±1d TZ' : 'Exact Age';

  return (
    <TriageSessionContext.Provider value={sessionContextValue}>
    <div className="max-w-7xl mx-auto w-full pb-24">
      {/* Sticky Single-Row Pokémon GO Pill Tablist */}
      <div className="sticky top-[var(--app-header-height,52px)] z-30 pogo-pokedex-header">
        <div className="max-w-7xl mx-auto px-2 sm:px-4">
          {/* Single-Row Horizontally Scrolling Pill Tablist (mwg: tabs) */}
          <div
            ref={tablistRef}
            className="mwg-tablist"
            role="tablist"
            aria-label="Inventory organization tools"
            {...{ focusgroup: 'tablist nomemory' }}
          >
            {TABS.map((tab, idx) => {
              const isSelected = activeSubTab === tab.id;
              const domId = `${tabBaseId}-tab-${tab.id}`;
              return (
                <button
                  key={tab.id}
                  ref={(el) => {
                    tabRefs.current[tab.id] = el;
                  }}
                  type="button"
                  role="tab"
                  id={domId}
                  aria-selected={isSelected ? 'true' : 'false'}
                  tabIndex={isSelected ? 0 : -1}
                  {...(isSelected ? { focusgroupstart: '' } : {})}
                  onClick={() => setActiveSubTab(tab.id)}
                  onKeyDown={(e) => handleTabKeyDown(e, idx)}
                >
                  <span aria-hidden="true">{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab Panels Container — NO gap/padding on tabpanel elements themselves so `hidden="until-found"` leaves zero phantom strip (mwg: tabs) */}
      <div className="px-3 sm:px-5">
        {/* ===================================================================
            PANEL 1: STEP-BY-STEP TRIAGE FUNNEL (!#)
           =================================================================== */}
        <div
          ref={(el) => {
            panelRefs.current.pipeline = el;
          }}
          role="tabpanel"
          aria-labelledby={`${tabBaseId}-tab-pipeline`}
          hidden={activeSubTab !== 'pipeline' ? 'until-found' : undefined}
        >
          <div className="pt-3 space-y-3 mwg-accordion mwg-card-container">
            {/* Compact Dismissible "How Triage Works" Micro-Banner */}
            {!guideDismissed && (
              <div className="pogo-glass-card px-3 py-2 flex items-center justify-between gap-2 text-xs text-[var(--pogo-ink-strong)]">
                <p className="font-semibold leading-snug">
                  <span className="font-extrabold text-[var(--pogo-accent-ink)]">How Triage Works: </span>
                  Copy phases 1→6 in order, tag matches in Pokémon GO, then safely mass-transfer in Phase 6.
                </p>
                <button
                  type="button"
                  onClick={dismissGuide}
                  aria-label="Dismiss how triage works banner"
                  className="compact-inline-chip mwg-icon-hit w-7 h-7 rounded-full bg-[var(--pogo-pill-bg)] hover:bg-[var(--pogo-pill-hover-bg)] text-[var(--pogo-ink-strong)] border border-[var(--pogo-ui-border)] flex items-center justify-center text-xs font-extrabold shrink-0 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Non-Sticky Control Strip right above STORAGE TRIAGE */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-0.5 text-xs">
              <div className="flex flex-wrap items-center gap-2 min-w-0">
                <button
                  type="button"
                  onClick={() => setUntaggedOnly((v) => !v)}
                  aria-pressed={untaggedOnly}
                  className={`compact-inline-chip min-h-[40px] sm:min-h-[32px] px-3 py-1 text-[11px] cursor-pointer inline-flex items-center gap-1 font-extrabold ${
                    untaggedOnly ? 'pogo-pill-active' : 'pogo-pill'
                  }`}
                >
                  <span>{untaggedOnly ? '✓ Untagged only (!#)' : 'Untagged only (!#): Off'}</span>
                </button>

                <span className="text-[11px] font-bold text-[var(--pogo-ink-primary)] truncate">
                  {bufferLabel} • Caps {cdShinyKeepCap}/{globalBgKeepCap}/{costumeKeepCap}
                </span>

                {doneCards.size > 0 && (
                  <span className="inline-flex items-center gap-1.5">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[11px] font-extrabold">
                      {doneCards.size} done
                    </span>
                    <button
                      type="button"
                      onClick={resetSession}
                      className="compact-inline-chip pogo-pill min-h-[40px] sm:min-h-[32px] px-2.5 py-1 text-[11px] font-extrabold cursor-pointer"
                    >
                      Reset Session
                    </button>
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => optionsDialogRef.current?.showModal()}
                className="compact-inline-chip pogo-pill min-h-[40px] sm:min-h-[32px] px-3 py-1 text-[11px] font-extrabold cursor-pointer shrink-0 inline-flex items-center gap-1"
              >
                <span aria-hidden="true">⚙️</span>
                <span>Options</span>
              </button>
            </div>

            {/* Screenshot 2 Frosted Pokédex Summary Card for Inventory Triage */}
            <PogoSummaryCard
              title="STORAGE TRIAGE"
              pillText={untaggedOnly ? 'Untagged only (!#)' : 'ALL STORAGE'}
              stats={[
                {
                  label: 'CD SHINY',
                  value: `≤${cdShinyKeepCap}`,
                  onClick: () => optionsDialogRef.current?.showModal(),
                },
                {
                  label: 'GLOBAL BG',
                  value: `≤${globalBgKeepCap}`,
                  onClick: () => optionsDialogRef.current?.showModal(),
                },
                {
                  label: 'COSTUME',
                  value: `≤${costumeKeepCap}`,
                  onClick: () => optionsDialogRef.current?.showModal(),
                },
                {
                  label: 'META SAFE',
                  value: metaSets.allProtectedMetaIds.length,
                  onClick: () => setActiveSubTab('meta-sync'),
                },
                {
                  label: 'NON-META',
                  value: metaSets.strictNonMetaIds.length,
                  onClick: () => setActiveSubTab('meta-sync'),
                },
              ]}
            />

            {/* Phase 1: Trophies */}
            <details open className="pogo-summary-card overflow-hidden">
              <summary className="px-4 py-3 text-xs sm:text-sm font-display font-extrabold text-[var(--pogo-ink-strong)] select-none">
                <span className="flex-1 flex items-center justify-between gap-2">
                  <span>1. Hard Trophies &amp; 0% Nundos</span>
                  <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-amber-400 text-[#123c4d]">
                    #Trophy
                  </span>
                </span>
              </summary>
              <div className="p-3 border-t border-[#0d7da8]/12 mwg-card-grid">
                <SearchRecipeCard
                  badge="1A • Crown Jewels"
                  title="4*, Gigantamax, Shiny Shadows, Shiny Legendaries & Shiny Location BGs"
                  tagSuggestion="Trophy"
                  subtitle="Distributed CNF (X,Y & X,Z) so PoGO matches any 4*, any G-Max, OR any Shiny Shadow/Legendary/Mythical/UB/Location BG."
                  searchString={crownJewelsCnfString}
                  accent="amber"
                  onLoadToBar={onLoadSearchString}
                />
                <SearchRecipeCard
                  badge="1B • 0/0/0 Collector"
                  title="True Nundos (0 Attack / 0 Defense / 0 HP)"
                  tagSuggestion="Nundo"
                  subtitle="1/4096 unboosted wild odds; rarer than 4* hundos."
                  searchString={`${prefix}0attack&0defense&0hp`}
                  accent="amber"
                  onLoadToBar={onLoadSearchString}
                />
              </div>
            </details>

            {/* Phase 2: High-Demand Tradeables */}
            <details className="pogo-summary-card overflow-hidden">
              <summary className="px-4 py-3 text-xs sm:text-sm font-display font-extrabold text-[var(--pogo-ink-strong)] select-none">
                <span className="flex-1 flex items-center justify-between gap-2">
                  <span>2. High-Demand Tradeables (BGs, Regionals, Rotom, Shinies)</span>
                  <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-[#8d52b5] text-white">
                    #TradeRare
                  </span>
                </span>
              </summary>
              <div className="p-3 border-t border-[#0d7da8]/12 mwg-card-grid">
                <SearchRecipeCard
                  badge={activeLocBgRecipe.badge}
                  title="In-Person Venue Location Backgrounds"
                  tagSuggestion={activeLocBgRecipe.tag}
                  subtitle={activeLocBgRecipe.subtitle}
                  searchString={activeLocBgRecipe.searchString}
                  speciesIds={activeLocBgRecipe.speciesIds}
                  accent="purple"
                  onLoadToBar={onLoadSearchString}
                  onSelectSpeciesInGrid={onSelectSpeciesInGrid}
                >
                  <select
                    aria-label="Scope Location Backgrounds by event date window"
                    value={selectedLocBgScopeId}
                    onChange={(e) => setSelectedLocBgScopeId(e.target.value)}
                    className="w-full pogo-search-pill px-3 py-1.5 text-[11px] font-bold text-[#123c4d]"
                  >
                    <option value="ALL_ANY_DATE">All Venue Location Backgrounds (Any Date)</option>
                    {allLocationBgEvents.map((ev) => (
                      <option key={ev.id} value={ev.id}>
                        {ev.name} ({ev.start}) → #{ev.tag}
                      </option>
                    ))}
                  </select>
                </SearchRecipeCard>

                <SearchRecipeCard
                  badge="2B • Regionals, Rotom & Unown"
                  title="Untraded Regionals, Rotom (#479), Unown (#201) & Ticket Exclusives"
                  tagSuggestion="TradeReg"
                  subtitle="High trade demand even at 0*–2*: Hawlucha, Klefki, Comfey, Pachirisu, Sigilyph, Relicanth, Tropius, Torkoal, Skiddo, Rotom, Unown."
                  searchString={`${prefix}!traded&${GLOBAL_REGIONAL_ROTOM_UNOWN_RANGES}&!4*&!shiny`}
                  speciesIds={GLOBAL_REGIONAL_ROTOM_UNOWN_IDS}
                  accent="purple"
                  onLoadToBar={onLoadSearchString}
                  onSelectSpeciesInGrid={onSelectSpeciesInGrid}
                />

                <SearchRecipeCard
                  badge="2C • Shiny Costumes"
                  title="Untraded Shiny Event Costumes"
                  tagSuggestion="TradeRare"
                  subtitle="Time-limited shiny costumes hold top collector value."
                  searchString={`${prefix}!traded&shiny&costume&!4*`}
                  accent="purple"
                  onLoadToBar={onLoadSearchString}
                />

                <SearchRecipeCard
                  badge="2D • Full-Odds / Raid Shinies"
                  title="Untraded Non-Community-Day Shinies"
                  tagSuggestion="TradeShiny"
                  subtitle={`Excludes ${selectedCdFamilyIds.length} selected Community Day family IDs.`}
                  searchString={`${prefix}!traded&shiny${nonCdShinyNegationTokens ? `&${nonCdShinyNegationTokens}` : ''}&!4*`}
                  accent="purple"
                  onLoadToBar={onLoadSearchString}
                />
              </div>
            </details>

            {/* Phase 3: Capped Trade Stock vs Excess Purge */}
            <details className="pogo-summary-card overflow-hidden">
              <summary className="px-4 py-3 text-xs sm:text-sm font-display font-extrabold text-[var(--pogo-ink-strong)] select-none">
                <span className="flex-1 flex items-center justify-between gap-2">
                  <span>3. Capped Trade Stock vs. Excess Clutter</span>
                  <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-[#3b6fd4] text-white">
                    count-{cdShinyKeepCap}
                  </span>
                </span>
              </summary>
              <div className="p-3 border-t border-[#0d7da8]/12 space-y-2.5">
                <div className="flex items-center gap-2 bg-white/75 px-3 py-1.5 rounded-full border border-white">
                  <span className="text-[11px] font-extrabold text-[#123c4d] shrink-0">Global BG Window:</span>
                  <select
                    aria-label="Scope Global Special Backgrounds by event window"
                    value={selectedGlobalBgScopeId}
                    onChange={(e) => setSelectedGlobalBgScopeId(e.target.value)}
                    className="flex-1 min-w-0 bg-transparent text-[11px] font-bold text-[#0b698e] focus:outline-none"
                  >
                    <option value="ALL_ANY_DATE">All Global Special Backgrounds (Any Date)</option>
                    {allGlobalBgEvents.map((ev) => (
                      <option key={ev.id} value={ev.id}>
                        {ev.name} ({ev.start})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mwg-card-grid">
                  <SearchRecipeCard
                    badge={`3A • Keep 1–${globalBgKeepCap}`}
                    title="Global Special Backgrounds — Keep Stock"
                    tagSuggestion="TradeBG"
                    subtitle={activeGlobalBgRecipe.subtitle}
                    searchString={activeGlobalBgRecipe.keepString}
                    accent="indigo"
                    onLoadToBar={onLoadSearchString}
                  />
                  <SearchRecipeCard
                    badge={`3B • Purge ${globalBgKeepCap + 1}+`}
                    title="Excess 0*–2* Global Special Backgrounds"
                    tagSuggestion="Transfer"
                    subtitle={`Surplus non-shiny 0*–2* Global Backgrounds when holding ${globalBgKeepCap + 1}+ copies.`}
                    searchString={activeGlobalBgRecipe.purgeString}
                    accent="rose"
                    onLoadToBar={onLoadSearchString}
                  />
                  <SearchRecipeCard
                    badge={`3C • Keep 1–${cdShinyKeepCap}`}
                    title={`Community Day Shinies — Keep (${cdKeepCountToken})`}
                    tagSuggestion="TradeCD"
                    subtitle={`Untraded CD shinies with ≤${cdShinyKeepCap} copies.`}
                    searchString={`${prefix}!traded&shiny&${cdKeepCountToken}&${selectedCdFamilyRanges || '1-9'}`}
                    speciesIds={selectedCdFamilyIds}
                    accent="indigo"
                    onLoadToBar={onLoadSearchString}
                    onSelectSpeciesInGrid={onSelectSpeciesInGrid}
                  />
                  <SearchRecipeCard
                    badge={`3D • Purge ${cdShinyKeepCap + 1}+`}
                    title={`Surplus Community Day Shinies (${cdSurplusCountToken})`}
                    tagSuggestion="HOME / Transfer"
                    subtitle={`Tag 1–${cdShinyKeepCap} best first, then send excess to HOME or Professor.`}
                    searchString={`${prefix}shiny&${cdSurplusCountToken}&${selectedCdFamilyRanges || '1-9'}&!4*&!locationbackground&!costume&!shadow&!favorite&!lucky`}
                    speciesIds={selectedCdFamilyIds}
                    accent="rose"
                    onLoadToBar={onLoadSearchString}
                    onSelectSpeciesInGrid={onSelectSpeciesInGrid}
                  />
                  <SearchRecipeCard
                    badge={`3E • Keep 1–${costumeKeepCap}`}
                    title={`Non-Shiny Costumes — Keep (${costumeKeepCountToken})`}
                    tagSuggestion="TradeCostume"
                    subtitle={`Untraded non-shiny costumes with ≤${costumeKeepCap} copies.`}
                    searchString={`${prefix}!traded&costume&!shiny&!4*&${costumeKeepCountToken}`}
                    accent="indigo"
                    onLoadToBar={onLoadSearchString}
                  />
                  <SearchRecipeCard
                    badge={`3F • Purge ${costumeKeepCap + 1}+`}
                    title={`Excess 0*–2* Non-Shiny Costumes (${costumeSurplusCountToken})`}
                    tagSuggestion="Transfer"
                    subtitle={`Low-IV costume duplicates beyond ${costumeKeepCap} copies.`}
                    searchString={`${prefix}costume&!shiny&!4*&0*,1*,2*&${costumeSurplusCountToken}&!locationbackground&!favorite&!lucky`}
                    accent="rose"
                    onLoadToBar={onLoadSearchString}
                  />
                </div>
              </div>
            </details>

            {/* Phase 4: Mirror Rerolls */}
            <details className="pogo-summary-card overflow-hidden">
              <summary className="px-4 py-3 text-xs sm:text-sm font-display font-extrabold text-[var(--pogo-ink-strong)] select-none">
                <span className="flex-1 flex items-center justify-between gap-2">
                  <span>4. Mirror &amp; Special Trade Rerolls</span>
                  <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-[#0d7da8] text-white">
                    #TradeMirror
                  </span>
                </span>
              </summary>
              <div className="p-3 border-t border-[#0d7da8]/12 mwg-card-grid">
                <SearchRecipeCard
                  badge="4A • Pseudo & 10km Eggs"
                  title="Low-IV Rare Spawns for Mirror / Distance XL Trades"
                  tagSuggestion="TradeMirror"
                  subtitle="Frigibax, Larvesta, Dreepy, Jangmo-o, Charcadet, Tinkatink, Varoom, Duraludon, Gimmighoul, Beldum, Gible, Riolu."
                  searchString={`${prefix}!traded&${metaSets.ranges.rareTradeReroll}&0*,1*,2*&!shiny&!shadow`}
                  speciesIds={metaSets.rareTradeRerollFamilyIds}
                  accent="teal"
                  onLoadToBar={onLoadSearchString}
                  onSelectSpeciesInGrid={onSelectSpeciesInGrid}
                />
                <SearchRecipeCard
                  badge="4B • Special Trade Stock"
                  title="0*–2* Legendaries & Ultra Beasts (Up to 6 Copies)"
                  tagSuggestion="TradeSpecial"
                  subtitle="Save for daily Special Trades or Lucky Friend rerolls."
                  searchString={`${prefix}!traded&legendary,ultra beasts&0*,1*,2*&count-6&!shiny&!shadow&!locationbackground`}
                  accent="teal"
                  onLoadToBar={onLoadSearchString}
                />
              </div>
            </details>

            {/* Phase 5: PvP & PvE Meta */}
            <details className="pogo-summary-card overflow-hidden">
              <summary className="px-4 py-3 text-xs sm:text-sm font-display font-extrabold text-[var(--pogo-ink-strong)] select-none">
                <span className="flex-1 flex items-center justify-between gap-2">
                  <span>5. PvPoke Top 100 (GL/UL/ML) &amp; DialgaDex Raiders</span>
                  <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-[#2b9e66] text-white">
                    #PvP / #PvE
                  </span>
                </span>
              </summary>
              <div className="p-3 border-t border-[#0d7da8]/12 mwg-card-grid">
                <SearchRecipeCard
                  badge="5A • GL & UL Bulk"
                  title={`Top 100 GL/UL Low-Attack IVs (${metaSets.glUlFamilyIds.length} IDs)`}
                  tagSuggestion="PvP Check"
                  subtitle="0–1 Attack & 3–4 Def/HP across Top 100 Great & Ultra League families."
                  searchString={`${prefix}${metaSets.ranges.glUl}&0-1attack&3-4defense&3-4hp&cp-2500`}
                  speciesIds={metaSets.glUlFamilyIds}
                  accent="emerald"
                  onLoadToBar={onLoadSearchString}
                  onSelectSpeciesInGrid={onSelectSpeciesInGrid}
                />
                <SearchRecipeCard
                  badge="5B • L50 XL Max-Outs"
                  title="GL & UL XL Max-Out Species (3*, 4*)"
                  tagSuggestion="PvP XL"
                  subtitle="Medicham, Bastiodon, Sableye, Carbink, Lickitung, Diggersby, Talonflame, Umbreon, Mandibuzz."
                  searchString={`${prefix}${metaSets.ranges.pvpMaxOutXl}&3*,4*&cp-2500`}
                  speciesIds={metaSets.pvpMaxOutXlFamilyIds}
                  accent="emerald"
                  onLoadToBar={onLoadSearchString}
                  onSelectSpeciesInGrid={onSelectSpeciesInGrid}
                />
                <SearchRecipeCard
                  badge="5C • ML & Raid Meta"
                  title={`Top 100 Master League & DialgaDex PvE — 3*, 4* (${metaSets.mlAndPveFamilyIds.length} IDs)`}
                  tagSuggestion="PvE / ML"
                  subtitle="High-IV raiders and uncapped Master League contenders."
                  searchString={`${prefix}${metaSets.ranges.mlAndPve}&3*,4*`}
                  speciesIds={metaSets.mlAndPveFamilyIds}
                  accent="emerald"
                  onLoadToBar={onLoadSearchString}
                  onSelectSpeciesInGrid={onSelectSpeciesInGrid}
                />
                <SearchRecipeCard
                  badge="5D • Shadow DPS & CD Hold"
                  title="3–4 Attack Shadow Raiders"
                  tagSuggestion="ShadowPvE"
                  subtitle={`CD pre-evo hold query: ${prefix}${allCdPreEvoRanges}&3*,4*&!@special`}
                  searchString={`${prefix}${metaSets.ranges.mlAndPve}&shadow&3-4attack`}
                  speciesIds={metaSets.mlAndPveFamilyIds}
                  accent="emerald"
                  onLoadToBar={onLoadSearchString}
                  onSelectSpeciesInGrid={onSelectSpeciesInGrid}
                />
              </div>
            </details>

            {/* Phase 6: Safe Mass Transfer */}
            <details className="pogo-summary-card overflow-hidden">
              <summary className="px-4 py-3 text-xs sm:text-sm font-display font-extrabold text-[var(--pogo-ink-strong)] select-none">
                <span className="flex-1 flex items-center justify-between gap-2">
                  <span>6. Safe Mass Transfer (Zero Meta / Regional Conflict)</span>
                  <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-rose-600 text-white">
                    #Transfer
                  </span>
                </span>
              </summary>
              <div className="p-3 border-t border-[#0d7da8]/12 mwg-card-grid">
                <SearchRecipeCard
                  badge={`6A • 0*–3* Non-Meta (${metaSets.strictNonMetaIds.length} IDs)`}
                  title="All 0*, 1*, 2*, 3* Strictly Non-Meta Species"
                  tagSuggestion="Transfer"
                  subtitle="Zero overlap with PvPoke Top 100 (GL/UL/ML), DialgaDex PvE, or Regionals/Rotom/Unown. Does not hold XXL/XXS."
                  searchString={`${prefix}${metaSets.ranges.strictNonMeta}&0*,1*,2*,3*&!shiny&!background&!locationbackground&!specialbackground&!costume&!shadow&!purified&!dynamax&!gigantamax&!favorite&!lucky&!4*&!legendary&!mythical&!ultra beasts&!@special`}
                  speciesIds={metaSets.strictNonMetaIds}
                  accent="rose"
                  onLoadToBar={onLoadSearchString}
                  onSelectSpeciesInGrid={onSelectSpeciesInGrid}
                />

                <SearchRecipeCard
                  badge="6B • 0*–2* High-Attack"
                  title="0*, 1*, 2* With 2–4 Attack (Bad Raid & Bad PvP Bulk)"
                  tagSuggestion="Transfer"
                  subtitle="Too weak for Raids/ML and too attack-heavy for GL/UL. Excludes Regionals, Rotom & Unown."
                  searchString={`${prefix}0*,1*,2*&2-4attack&${GLOBAL_REGIONAL_NEGATION}&!shiny&!background&!locationbackground&!specialbackground&!costume&!shadow&!purified&!dynamax&!gigantamax&!favorite&!lucky&!4*&!legendary&!mythical&!ultra beasts&!@special`}
                  accent="rose"
                  onLoadToBar={onLoadSearchString}
                />

                <SearchRecipeCard
                  badge={`6C • Pure GL/UL 3* (${metaSets.pureCappedPvpFamilyIds.length} IDs)`}
                  title="3* With 2–4 Attack on Pure GL/UL Bulk Species"
                  tagSuggestion="Transfer"
                  subtitle="Species only viable in CP-capped leagues (never ML, PvE, or L50 XL hundos)."
                  searchString={`${prefix}${metaSets.ranges.pureCappedPvp}&3*&2-4attack&!shiny&!background&!locationbackground&!specialbackground&!costume&!shadow&!purified&!dynamax&!gigantamax&!favorite&!lucky&!4*&!@special`}
                  speciesIds={metaSets.pureCappedPvpFamilyIds}
                  accent="rose"
                  onLoadToBar={onLoadSearchString}
                  onSelectSpeciesInGrid={onSelectSpeciesInGrid}
                />

                <SearchRecipeCard
                  badge="6D • D-Max & Dead-End Males"
                  title="4th+ 0*–2* Dynamax & Male Combee/Salandit"
                  tagSuggestion="Transfer"
                  subtitle={`Max Battles cap at 3 per team. Male Combee/Salandit: ${prefix}415,757&male&!shiny&!4*&!favorite`}
                  searchString={`${prefix}dynamax&!gigantamax&count4-&0*,1*,2*&!shiny&!background&!costume&!favorite&!lucky`}
                  accent="rose"
                  onLoadToBar={onLoadSearchString}
                />
              </div>
            </details>

            {/* Phase 7: Interactive OR / AND Rule Combiner */}
            <details className="pogo-summary-card overflow-hidden">
              <summary className="px-4 py-3 text-xs sm:text-sm font-display font-extrabold text-[var(--pogo-ink-strong)] select-none">
                <span className="flex-1 flex items-center justify-between gap-2">
                  <span>🔗 OR / AND Rule Combiner</span>
                  <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-[#0d7da8] text-white">
                    (X,Y)&amp;(X,Z)
                  </span>
                </span>
              </summary>
              <div className="p-3.5 border-t border-[#0d7da8]/12 space-y-2.5 text-xs">
                <p className="text-[11px] text-[#285d72] leading-snug">
                  In Pokémon GO, <code className="font-mono font-bold text-[#123c4d]">,</code> (OR) has <strong>higher precedence</strong> than <code className="font-mono font-bold text-[#123c4d]">&amp;</code> (AND). Writing <code className="font-mono text-rose-700">A,B&amp;C</code> is parsed as <code className="font-mono text-rose-700">(A OR B) AND C</code>. This compiler distributes <code className="font-mono font-bold">OR</code> over <code className="font-mono font-bold">AND</code> (<code className="font-mono font-bold text-[#0b698e]">A,B &amp; A,C</code>) so every branch works properly.
                </p>

                {/* Quick Presets */}
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      setCnfBranches([
                        '4*',
                        'gigantamax',
                        'shiny&shadow',
                        'shiny&legendary',
                        'shiny&mythical',
                        'shiny&ultra beasts',
                        'shiny&locationbackground',
                      ])
                    }
                    className="compact-inline-chip pogo-pill min-h-[28px] px-3 py-0.5 text-[10px] cursor-pointer"
                  >
                    Preset: Crown Jewels
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setCnfBranches([
                        'shiny&legendary',
                        '4*&legendary',
                        'locationbackground&legendary',
                      ])
                    }
                    className="compact-inline-chip pogo-pill min-h-[28px] px-3 py-0.5 text-[10px] cursor-pointer"
                  >
                    Preset: Trophy Legendaries
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setCnfBranches([
                        '3*,4*&shadow',
                        '0-1attack&3-4defense&3-4hp&cp-2500',
                      ])
                    }
                    className="compact-inline-chip pogo-pill min-h-[28px] px-3 py-0.5 text-[10px] cursor-pointer"
                  >
                    Preset: Shadow 3*-4* OR PvP Bulk
                  </button>
                </div>

                {/* Active OR Branches */}
                <div className="flex flex-wrap items-center gap-1.5 bg-white/80 p-2.5 rounded-2xl border border-white">
                  {cnfBranches.map((br, idx) => (
                    <React.Fragment key={`${br}-${idx}`}>
                      {idx > 0 && (
                        <span className="text-[10px] font-black text-[#0b698e] px-0.5">OR</span>
                      )}
                      <span className="inline-flex items-center gap-1 bg-[#dff4fb] border border-[#0d7da8]/30 rounded-full px-2.5 py-0.5 font-mono text-[11px] font-bold text-[#123c4d]">
                        <span>({br})</span>
                        <button
                          type="button"
                          onClick={() => setCnfBranches((prev) => prev.filter((_, i) => i !== idx))}
                          aria-label={`Remove branch ${br}`}
                          className="compact-inline-chip text-rose-600 hover:text-rose-800 font-black ml-0.5 cursor-pointer"
                        >
                          ✕
                        </button>
                      </span>
                    </React.Fragment>
                  ))}
                </div>

                {/* Add New AND-Branch Input */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newBranchInput}
                    onChange={(e) => setNewBranchInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newBranchInput.trim()) {
                        e.preventDefault();
                        setCnfBranches((prev) => [...prev, newBranchInput.trim()]);
                        setNewBranchInput('');
                      }
                    }}
                    placeholder="Add branch (e.g. shiny&costume or 4*)"
                    aria-label="Add OR branch with AND conditions"
                    className="flex-1 min-w-0 px-4 py-2 pogo-search-pill text-base sm:text-xs font-mono font-bold text-[#123c4d] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newBranchInput.trim()) {
                        setCnfBranches((prev) => [...prev, newBranchInput.trim()]);
                        setNewBranchInput('');
                      }
                    }}
                    className="compact-inline-chip pogo-pill-active min-h-[36px] px-4 py-1.5 text-xs uppercase cursor-pointer shrink-0"
                  >
                    + OR Branch
                  </button>
                </div>

                <SearchRecipeCard
                  badge={`${customCompiledCnfString.split('&').filter(Boolean).length} AND-Clauses`}
                  title="Combined Pokémon GO Search String"
                  subtitle="Distributes OR (,) over AND (&) and absorbs redundant supersets."
                  searchString={customCompiledCnfString}
                  accent="teal"
                  onLoadToBar={onLoadSearchString}
                />
              </div>
            </details>
          </div>
        </div>

        {/* ===================================================================
            PANEL 2: MAJOR EVENTS & SPECIAL POKÉMON ARCHIVE (POKÉ DAXI / LUCKYBUNZ)
           =================================================================== */}
        <div
          ref={(el) => {
            panelRefs.current['events-db'] = el;
          }}
          role="tabpanel"
          aria-labelledby={`${tabBaseId}-tab-events-db`}
          hidden={activeSubTab !== 'events-db' ? 'until-found' : undefined}
        >
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
                {['ALL', 2026, 2025, 2024, 2023].map((yr) => (
                  <button
                    key={String(yr)}
                    type="button"
                    onClick={() => setEventYearFilter(String(yr))}
                    className={`compact-inline-chip min-h-[28px] px-3 py-0.5 text-[11px] uppercase shrink-0 cursor-pointer ${
                      eventYearFilter === String(yr) ? 'pogo-pill-active' : 'pogo-pill'
                    }`}
                  >
                    {yr === 'ALL' ? 'All Years' : yr}
                  </button>
                ))}
                <span className="text-[#0d7da8]/40 select-none" aria-hidden="true">|</span>
                {['ALL', 'GO Tour', 'GO Fest', 'Wild Area', 'City & Special', 'Raid & Max'].map((series) => (
                  <button
                    key={series}
                    type="button"
                    onClick={() => setEventSeriesFilter(series)}
                    className={`compact-inline-chip min-h-[28px] px-3 py-0.5 text-[11px] uppercase shrink-0 cursor-pointer ${
                      eventSeriesFilter === series ? 'pogo-pill-active' : 'pogo-pill'
                    }`}
                  >
                    {series === 'ALL' ? 'All Series' : series}
                  </button>
                ))}
              </div>

              {dbStatusBanner && (
                <div className="px-3 py-1.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-[11px] font-bold text-emerald-950">
                  {dbStatusBanner}
                </div>
              )}
            </div>

            {/* Major Event Cards Grid */}
            <div className="mwg-card-grid">
              {filteredEvents.map((ev) => {
                const built = buildEventActionStrings(ev, referenceDate, {
                  untaggedOnly,
                  bufferMode,
                  globalBgKeepCap,
                });
                return (
                  <MajorEventCard
                    key={ev.id}
                    ev={ev}
                    built={built}
                    globalBgKeepCap={globalBgKeepCap}
                    onToggleAttended={handleToggleEventAttended}
                    onEdit={openEditEventModal}
                    onDelete={handleDeleteCustomEvent}
                    onSelectSpeciesInGrid={onSelectSpeciesInGrid}
                    onLoadToBar={onLoadSearchString}
                  />
                );
              })}
            </div>

            {/* Collapsible Custom Date Calculator, Trips & JSON Backup */}
            <div className="mwg-accordion space-y-2.5 pt-1">
              <details className="pogo-summary-card overflow-hidden">
                <summary className="px-4 py-3 text-xs sm:text-sm font-display font-extrabold text-[var(--pogo-ink-strong)] select-none">
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
                        className="w-full text-base sm:text-xs font-bold text-[#123c4d] bg-transparent focus:outline-none"
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
                        className="w-full text-base sm:text-xs font-bold text-[#123c4d] bg-transparent focus:outline-none"
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
                        className="w-full text-base sm:text-xs font-bold text-[#123c4d] bg-transparent focus:outline-none"
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
                    />
                    <button
                      type="button"
                      onClick={handleResetEventsDb}
                      className="compact-inline-chip min-h-[32px] px-3 py-1 rounded-full text-[11px] font-extrabold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 cursor-pointer"
                    >
                      Reset Defaults
                    </button>
                  </div>
                </div>
              </details>

              <details className="pogo-summary-card overflow-hidden">
                <summary className="px-4 py-3 text-xs sm:text-sm font-display font-extrabold text-[var(--pogo-ink-strong)] select-none">
                  <span>✈️ Personal Travel Trips ({TRAVEL_TRIPS.length})</span>
                </summary>
                <div className="p-3 border-t border-[#0d7da8]/12 mwg-card-grid mwg-card-grid-3">
                  {TRAVEL_TRIPS.map((trip) => {
                    const calc = calculateAgeSearchString(trip.start, trip.end, referenceDate, {
                      bufferMode,
                      untaggedOnly,
                      excludeRemote: true,
                    });
                    return (
                      <SearchRecipeCard
                        key={`${trip.tag}-${trip.start}`}
                        badge={`${calc.ageToken}`}
                        title={trip.event_name}
                        tagSuggestion={trip.tag}
                        subtitle={`${trip.location} (${trip.start})`}
                        searchString={calc.fullSearchString}
                        accent="teal"
                        onLoadToBar={onLoadSearchString}
                      />
                    );
                  })}
                </div>
              </details>
            </div>
          </div>
        </div>

        {/* ===================================================================
            PANEL 3: YEAR & MONTH TIMELINE SLICER
           =================================================================== */}
        <div
          ref={(el) => {
            panelRefs.current['year-slicer'] = el;
          }}
          role="tabpanel"
          aria-labelledby={`${tabBaseId}-tab-year-slicer`}
          hidden={activeSubTab !== 'year-slicer' ? 'until-found' : undefined}
        >
          <div className="pt-3.5 space-y-3 mwg-card-container">
            <div className="pogo-summary-card p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="font-display text-sm sm:text-base font-extrabold uppercase tracking-wider text-[#0c6c91]">
                    Yearly &amp; Monthly Storage Slicer
                  </h3>
                  <p className="text-[11px] text-[#285d72] font-medium">
                    Separates played event windows from everyday catches using merged <code className="font-mono font-bold">!ageX-Y</code> ranges.
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  {[2026, 2025, 2024, 2023].map((yr) => (
                    <button
                      key={yr}
                      type="button"
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
                  <span>Protect Trips</span>
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
                <CopyChip
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
                  subtitle={`Skips ${yearSlicerPlan.mergedProtectedWindowsCount} merged event/trip/CD age ranges AND protects Regionals, Rotom & Unown.`}
                  searchString={yearSlicerPlan.strings.everydayNonEventTrash0to2}
                  accent="rose"
                  onLoadToBar={onLoadSearchString}
                />
                <SearchRecipeCard
                  badge={`year${slicerYear} • Venue BGs`}
                  title="Attended In-Person Location Backgrounds"
                  tagSuggestion="TradeLocBG"
                  subtitle={`Combined age union across played ${slicerYear} in-person events.`}
                  searchString={yearSlicerPlan.strings.inPersonBgCombined}
                  accent="purple"
                  onLoadToBar={onLoadSearchString}
                />
                <SearchRecipeCard
                  badge={`year${slicerYear} • Global BGs`}
                  title={`Attended Global Special Backgrounds (Keep 1–${globalBgKeepCap})`}
                  tagSuggestion="TradeBG"
                  subtitle={`Combined age union across played ${slicerYear} global events.`}
                  searchString={yearSlicerPlan.strings.globalBgKeepCombined}
                  accent="indigo"
                  onLoadToBar={onLoadSearchString}
                />
                <SearchRecipeCard
                  badge={`year${slicerYear} • BG Audit`}
                  title="Unmapped Date Backgrounds"
                  tagSuggestion="TradeBG"
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
                  className={`pogo-glass-card p-3.5 space-y-2 ${
                    ms.isUpcoming ? 'opacity-60' : ''
                  }`}
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
                    {ms.eventsInMonth.length === 0 && ms.cdsInMonth.length === 0 && ms.tripsInMonth.length === 0 ? (
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
                      </>
                    )}
                  </div>

                  {!ms.isUpcoming && (
                    <div className="flex flex-wrap gap-1.5">
                      <CopyChip
                        label="📦 Month"
                        text={ms.monthAllString}
                        ariaLabel={`Copy all ${ms.monthName} ${slicerYear} Pokémon`}
                        variant="teal"
                      />
                      <CopyChip
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
        </div>

        {/* ===================================================================
            PANEL 4: COLLAPSIBLE COMMUNITY DAY DIRECTORY (BY YEAR & MONTH)
           =================================================================== */}
        <div
          ref={(el) => {
            panelRefs.current['community-days'] = el;
          }}
          role="tabpanel"
          aria-labelledby={`${tabBaseId}-tab-community-days`}
          hidden={activeSubTab !== 'community-days' ? 'until-found' : undefined}
        >
          <div className="pt-3.5 space-y-3 mwg-card-container">
            <div className="mwg-card-grid">
              <SearchRecipeCard
                badge={`Keep 1–${cdShinyKeepCap}`}
                title={`Community Day Shinies — Keep (${selectedCdFamilyIds.length} IDs)`}
                tagSuggestion="TradeCD"
                subtitle={`Untraded shinies from ${selectedCdEventIds.size} selected CDs with ≤${cdShinyKeepCap} copies.`}
                searchString={`${prefix}!traded&shiny&${cdKeepCountToken}&${selectedCdFamilyRanges || '1-9'}`}
                speciesIds={selectedCdFamilyIds}
                accent="indigo"
                onLoadToBar={onLoadSearchString}
                onSelectSpeciesInGrid={onSelectSpeciesInGrid}
              />
              <SearchRecipeCard
                badge={`Purge ${cdShinyKeepCap + 1}+`}
                title={`Community Day Shinies — Surplus (${cdSurplusCountToken})`}
                tagSuggestion="HOME / Transfer"
                subtitle="Surplus CD shinies excluding 4*, Location Backgrounds & Costumes."
                searchString={`${prefix}shiny&${cdSurplusCountToken}&${selectedCdFamilyRanges || '1-9'}&!4*&!locationbackground&!costume&!shadow&!favorite&!lucky`}
                speciesIds={selectedCdFamilyIds}
                accent="rose"
                onLoadToBar={onLoadSearchString}
                onSelectSpeciesInGrid={onSelectSpeciesInGrid}
              />
            </div>

            <section
              ref={accordionRef}
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
                  onClick={() => setSelectedCdEventIds(new Set(COMMUNITY_DAY_EVENTS.map((ev) => ev.id)))}
                  className="compact-inline-chip pogo-pill min-h-[34px] px-3 py-1 text-[11px] uppercase cursor-pointer"
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCdEventIds(new Set())}
                  className="compact-inline-chip pogo-pill min-h-[34px] px-3 py-1 text-[11px] uppercase cursor-pointer"
                >
                  None
                </button>
                <button
                  ref={toggleBtnRef}
                  type="button"
                  {...{ commandfor: 'cd-year-accordion', command: '--toggle-all' }}
                  aria-expanded={allYearsExpanded ? 'true' : 'false'}
                  className="compact-inline-chip pogo-pill-active min-h-[34px] px-3.5 py-1 text-[11px] uppercase cursor-pointer"
                >
                  <span className="expand-text">Expand All</span>
                  <span className="collapse-text">Collapse All</span>
                </button>
              </div>

              <div className="space-y-2">
                {communityDaysByYear.map(({ year, events }) => {
                  const filtered = events.filter((ev) => {
                    if (!cdSearchFilter.trim()) return true;
                    const q = cdSearchFilter.toLowerCase();
                    return (
                      ev.species.toLowerCase().includes(q) ||
                      ev.month.toLowerCase().includes(q) ||
                      ev.exclusiveMove.toLowerCase().includes(q) ||
                      ev.finalEvolution.toLowerCase().includes(q)
                    );
                  });
                  if (filtered.length === 0) return null;

                  const selectedInYear = filtered.filter((ev) => selectedCdEventIds.has(ev.id)).length;
                  const allYearSelected = selectedInYear === filtered.length;

                  return (
                    <details
                      key={year}
                      open={year === 2026 || Boolean(cdSearchFilter.trim())}
                      className="rounded-2xl border border-white bg-white/75 overflow-hidden shadow-2xs"
                    >
                      <summary className="px-3.5 py-2.5 bg-white/90 text-xs font-display font-extrabold text-[#123c4d] select-none">
                        <span className="flex-1 flex items-center justify-between gap-2">
                          <span>{year} Community Days</span>
                          <span className="pogo-counter-pill text-[10px] py-0.5 px-2.5">
                            {selectedInYear}/{filtered.length}
                          </span>
                        </span>
                      </summary>

                      <div className="p-2.5 border-t border-[#0d7da8]/12 space-y-2">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => toggleCdYear(filtered, !allYearSelected)}
                            className="compact-inline-chip pogo-pill min-h-[28px] px-3 py-0.5 text-[10px] uppercase cursor-pointer"
                          >
                            {allYearSelected ? `Deselect ${year}` : `Select ${year}`}
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {filtered.map((ev) => {
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
                                <img
                                  src={ev.sprite}
                                  alt={ev.species}
                                  loading="lazy"
                                  width="36"
                                  height="36"
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
                                  <div className="text-xs font-extrabold text-[#123c4d] truncate">{ev.species}</div>
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
        </div>

        {/* ===================================================================
            PANEL 5: PVPOKE TOP 100 & DIALGADEX PVE META EXPLORER
           =================================================================== */}
        <div
          ref={(el) => {
            panelRefs.current['meta-sync'] = el;
          }}
          role="tabpanel"
          aria-labelledby={`${tabBaseId}-tab-meta-sync`}
          hidden={activeSubTab !== 'meta-sync' ? 'until-found' : undefined}
        >
          <div className="pt-3.5 space-y-3">
            <div className="pogo-summary-card p-3.5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="font-display text-sm sm:text-base font-extrabold uppercase tracking-wider text-[#0c6c91]">
                    PvPoke Top 100 &amp; DialgaDex Raiders
                  </h3>
                  <p className="text-[11px] text-[#285d72] font-medium">
                    {metaSets.allProtectedMetaIds.length} protected meta/regional IDs • {metaSets.strictNonMetaIds.length} strict non-meta IDs.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={isSyncingMeta}
                  onClick={handleSyncMeta}
                  className="compact-inline-chip pogo-pill-active min-h-[34px] px-4 py-1.5 text-[11px] uppercase disabled:opacity-50 cursor-pointer"
                >
                  {isSyncingMeta ? '⏳ Syncing...' : '🔄 Sync Live'}
                </button>
              </div>

              {syncMessage && (
                <div
                  className={`p-2.5 rounded-2xl text-[11px] font-bold border ${
                    syncMessage.type === 'success'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                      : 'bg-amber-50 border-amber-300 text-amber-900'
                  }`}
                >
                  {syncMessage.text}
                </div>
              )}

              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                {[
                  { id: 'great_league', label: '🔵 Great (1500)' },
                  { id: 'ultra_league', label: '🟡 Ultra (2500)' },
                  { id: 'master_league', label: '🟣 Master' },
                  { id: 'pve', label: '🔥 Raid Attacker' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActiveMetaLeagueTab(t.id)}
                    className={`compact-inline-chip min-h-[30px] px-3 py-1 text-[11px] uppercase shrink-0 cursor-pointer ${
                      activeMetaLeagueTab === t.id ? 'pogo-pill-active' : 'pogo-pill'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <PogoSearchInput
                value={metaSearchFilter}
                onChange={(e) => setMetaSearchFilter(e.target.value)}
                onClear={() => setMetaSearchFilter('')}
                placeholder="Search species, type, or move..."
                ariaLabel="Filter ranked meta Pokémon"
              />
            </div>

            {/* Mobile-Friendly Ranked Species List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {(activeMetaLeagueTab === 'pve'
                ? metaCache.pve.entries
                : metaCache.pvp[activeMetaLeagueTab]?.entries || []
              )
                .filter((item) => {
                  if (!metaSearchFilter.trim()) return true;
                  const q = metaSearchFilter.toLowerCase();
                  const nameMatch = (item.speciesName || item.name || '').toLowerCase().includes(q);
                  const moveMatch =
                    (item.fastMove || '').toLowerCase().includes(q) ||
                    (item.chargedMoves || []).some((m) => m.toLowerCase().includes(q));
                  const typeMatch = (item.type || '').toLowerCase().includes(q);
                  return nameMatch || moveMatch || typeMatch || String(item.dexId).includes(q);
                })
                .map((item, idx) => {
                  const displayName = item.speciesName || item.name;
                  const famRange = compressIdRanges(item.familyIds || [item.dexId]);
                  const ivFilter =
                    activeMetaLeagueTab === 'great_league' || activeMetaLeagueTab === 'ultra_league'
                      ? '0-1attack&3-4defense&3-4hp'
                      : '3*,4*';
                  const quickString = `${prefix}${famRange}&${ivFilter}`;

                  return (
                    <div
                      key={`${displayName}-${idx}`}
                      className="pogo-glass-card p-2.5 flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${item.dexId}.png`}
                          alt={displayName}
                          loading="lazy"
                          width="40"
                          height="40"
                          className="w-10 h-10 object-contain pogo-dex-tile p-0.5 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[11px] font-black text-[#0b698e]">
                              {item.rank ? `#${item.rank}` : item.tier}
                            </span>
                            <span className="font-display text-xs font-extrabold text-[#123c4d] truncate">
                              {displayName}
                            </span>
                          </div>
                          <div className="text-[10px] font-semibold text-[#285d72] truncate">
                            {item.fastMove}
                            {item.chargedMoves?.length > 0 ? ` + ${item.chargedMoves.join(' / ')}` : ''}
                          </div>
                        </div>
                      </div>

                      <CopyChip
                        label="COPY"
                        text={quickString}
                        ariaLabel={`Copy search string for ${displayName}`}
                        variant="teal"
                      />
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================================
          OPTIONS DIALOG (Reference Date, 24h Rolling Age Precision, Trade Caps)
         ===================================================================== */}
      <dialog
        ref={optionsDialogRef}
        aria-labelledby={optionsHeadingId}
        {...{ closedby: 'any' }}
        className="pogo-summary-card p-0 max-w-md w-[calc(100%-1.5rem)] text-[#123c4d] shadow-2xl"
      >
        <div className="p-4 border-b border-[#0d7da8]/15 flex items-center justify-between bg-[#d5f2fc]/70 rounded-t-[1.25rem]">
          <h2 id={optionsHeadingId} className="font-display text-sm font-extrabold text-[#0b698e] uppercase tracking-wider">
            ⚙️ Triage &amp; Age Options
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
                className="w-full text-base sm:text-xs font-extrabold text-[#123c4d] bg-transparent focus:outline-none mt-0.5"
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
                className="w-full text-base sm:text-xs font-extrabold text-[#123c4d] bg-transparent focus:outline-none mt-0.5"
              >
                <option value="exact">Exact Calendar Day</option>
                <option value="evening-safe">-1d Evening Catch Safe</option>
                <option value="plus-minus-1">±1d Timezone Buffer</option>
              </select>
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#0b698e]">
              Trade Stockpile Keep Caps
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white/85 p-2.5 rounded-2xl border border-white text-center space-y-1">
                <label htmlFor="cap-cd" className="text-[10px] font-extrabold text-[#1b4d60] block">
                  CD Shinies
                </label>
                <select
                  id="cap-cd"
                  value={cdShinyKeepCap}
                  onChange={(e) => setCdShinyKeepCap(Number(e.target.value))}
                  className="bg-[#eef9fd] border border-[#0d7da8]/30 rounded-full px-2.5 py-1 text-xs font-extrabold text-[#123c4d]"
                >
                  {[1, 2, 3, 4].map((n) => (
                    <option key={n} value={n}>1–{n}</option>
                  ))}
                </select>
              </div>

              <div className="bg-white/85 p-2.5 rounded-2xl border border-white text-center space-y-1">
                <label htmlFor="cap-bg" className="text-[10px] font-extrabold text-[#1b4d60] block">
                  Global BGs
                </label>
                <select
                  id="cap-bg"
                  value={globalBgKeepCap}
                  onChange={(e) => setGlobalBgKeepCap(Number(e.target.value))}
                  className="bg-[#eef9fd] border border-[#0d7da8]/30 rounded-full px-2.5 py-1 text-xs font-extrabold text-[#123c4d]"
                >
                  {[1, 2, 3].map((n) => (
                    <option key={n} value={n}>1–{n}</option>
                  ))}
                </select>
              </div>

              <div className="bg-white/85 p-2.5 rounded-2xl border border-white text-center space-y-1">
                <label htmlFor="cap-costume" className="text-[10px] font-extrabold text-[#1b4d60] block">
                  Costumes
                </label>
                <select
                  id="cap-costume"
                  value={costumeKeepCap}
                  onChange={(e) => setCostumeKeepCap(Number(e.target.value))}
                  className="bg-[#eef9fd] border border-[#0d7da8]/30 rounded-full px-2.5 py-1 text-xs font-extrabold text-[#123c4d]"
                >
                  {[1, 2, 3].map((n) => (
                    <option key={n} value={n}>1–{n}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

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

      {/* =====================================================================
          ADD / EDIT EVENT DIALOG
         ===================================================================== */}
      <dialog
        ref={eventDialogRef}
        id={dialogId}
        aria-labelledby={dialogHeadingId}
        {...{ closedby: 'any' }}
        className="pogo-summary-card p-0 max-w-lg w-[calc(100%-1.5rem)] text-[#123c4d] shadow-2xl"
      >
        <div className="p-4 border-b border-[#0d7da8]/15 flex items-center justify-between bg-[#d5f2fc]/70 rounded-t-[1.25rem]">
          <h2 id={dialogHeadingId} className="font-display text-sm font-extrabold text-[#0b698e] uppercase tracking-wider">
            {isEditingExisting ? '✏️ Edit Event' : '➕ Add Event'}
          </h2>
          <form method="dialog">
            <PogoCloseButton type="submit" value="cancel" ariaLabel="Close event dialog" size="sm" />
          </form>
        </div>

        <form onSubmit={handleSaveEventModal} className="p-4 space-y-3 text-xs">
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
                onChange={(e) => setEventForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Pokémon GO Fest: Global"
                className="w-full px-3.5 py-2 pogo-search-pill text-base sm:text-xs font-bold focus:outline-none"
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
                onChange={(e) => setEventForm((f) => ({ ...f, tag: e.target.value }))}
                placeholder="GOFest"
                className="w-full px-3.5 py-2 pogo-search-pill text-base sm:text-xs font-mono font-bold focus:outline-none"
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
                onChange={(e) => setEventForm((f) => ({ ...f, start: e.target.value }))}
                className="w-full px-3.5 py-2 pogo-search-pill text-base sm:text-xs font-bold focus:outline-none"
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
                onChange={(e) => setEventForm((f) => ({ ...f, end: e.target.value }))}
                className="w-full px-3.5 py-2 pogo-search-pill text-base sm:text-xs font-bold focus:outline-none"
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
                onChange={(e) => setEventForm((f) => ({ ...f, scope: e.target.value }))}
                className="w-full px-3 py-2 pogo-search-pill text-base sm:text-xs font-bold bg-white focus:outline-none"
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
                onChange={(e) => setEventForm((f) => ({ ...f, backgroundType: e.target.value }))}
                className="w-full px-3 py-2 pogo-search-pill text-base sm:text-xs font-bold bg-white focus:outline-none"
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
                onChange={(e) => setEventForm((f) => ({ ...f, series: e.target.value }))}
                className="w-full px-3 py-2 pogo-search-pill text-base sm:text-xs font-bold bg-white focus:outline-none"
              >
                <option value="GO Tour">GO Tour</option>
                <option value="GO Fest">GO Fest</option>
                <option value="Wild Area">Wild Area</option>
                <option value="City & Special">City & Special</option>
                <option value="Raid & Max">Raid & Max</option>
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
                onChange={(e) => setEventForm((f) => ({ ...f, raidMegaIdsText: e.target.value }))}
                placeholder="e.g. 150, 384, 483, 484"
                className="w-full px-3.5 py-2 pogo-search-pill text-base sm:text-xs font-mono font-bold focus:outline-none"
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
                onChange={(e) => setEventForm((f) => ({ ...f, regionalRareIdsText: e.target.value }))}
                placeholder="e.g. 479, 201, 701, 764"
                className="w-full px-3.5 py-2 pogo-search-pill text-base sm:text-xs font-mono font-bold focus:outline-none"
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
                onChange={(e) => setEventForm((f) => ({ ...f, location: e.target.value }))}
                placeholder="Worldwide or City"
                className="w-full px-3.5 py-2 pogo-search-pill text-base sm:text-xs font-bold focus:outline-none"
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
                onChange={(e) => setEventForm((f) => ({ ...f, raidSummary: e.target.value }))}
                placeholder="Mega Mewtwo, Wash Rotom, Comfey..."
                className="w-full px-3.5 py-2 pogo-search-pill text-base sm:text-xs font-bold focus:outline-none"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-4 pt-1">
            <label className="inline-flex items-center gap-1.5 font-bold text-[#123c4d] cursor-pointer">
              <input
                type="checkbox"
                checked={eventForm.attended}
                onChange={(e) => setEventForm((f) => ({ ...f, attended: e.target.checked }))}
                className="w-4 h-4 rounded"
              />
              <span>Played</span>
            </label>
            <label className="inline-flex items-center gap-1.5 font-bold text-[#123c4d] cursor-pointer">
              <input
                type="checkbox"
                checked={eventForm.hasMighty}
                onChange={(e) => setEventForm((f) => ({ ...f, hasMighty: e.target.checked }))}
                className="w-4 h-4 rounded"
              />
              <span>Has Mighty Spawns</span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#0d7da8]/15">
            <button
              type="button"
              onClick={() => eventDialogRef.current?.close('cancel')}
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
    </div>
    </TriageSessionContext.Provider>
  );
}

export default React.memo(TriagePipelineView);
