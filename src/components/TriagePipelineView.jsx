import React, { useState, useEffect, useMemo, useRef, useCallback, useId } from 'react';
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
import { compressIdRanges } from '../utils/searchUtils';

const GLOBAL_REGIONAL_NEGATION = GLOBAL_REGIONAL_ROTOM_UNOWN_RANGES
  .split(',')
  .filter(Boolean)
  .map((r) => `!${r}`)
  .join('&');

/**
 * Compact Accessible Copy Chip using modern-web-guidance `copy-button` (`command="--copy"` + `role="status"`).
 */
function CopyChip({ label, text, ariaLabel, variant = 'dark' }) {
  const targetId = useId();

  const styles = {
    purple: 'bg-purple-600 hover:bg-purple-700 text-white border-purple-700',
    indigo: 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-700',
    teal: 'bg-teal-600 hover:bg-teal-700 text-white border-teal-700',
    amber: 'bg-amber-500 hover:bg-amber-600 text-slate-950 border-amber-600',
    emerald: 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700',
    rose: 'bg-rose-600 hover:bg-rose-700 text-white border-rose-700',
    dark: 'bg-slate-800 hover:bg-slate-900 text-white border-slate-900',
  }[variant] || 'bg-slate-800 hover:bg-slate-900 text-white border-slate-900';

  return (
    <span className="mwg-copy">
      <span id={targetId} data-copy-text={text} hidden>
        {text}
      </span>
      <button
        type="button"
        {...{ command: '--copy', commandfor: targetId }}
        aria-label={ariaLabel || `Copy ${label}`}
        className={`mwg-copy-btn compact-inline-chip min-h-[34px] px-2.5 py-1 rounded-xl text-[11px] font-extrabold border transition-colors shadow-2xs ${styles}`}
      >
        <span className="icon-copy" aria-hidden="true">{label}</span>
        <span className="icon-check" aria-hidden="true">✓ {label}</span>
      </button>
      <span className="mwg-copy-tip" role="status" />
    </span>
  );
}

/**
 * Compact Mobile-First Search Recipe Card (~96–115px tall so 4+ fit above the fold on mobile).
 */
function SearchRecipeCard({
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

  const accentStyles = {
    teal: 'border-teal-200/90 bg-white',
    amber: 'border-amber-300/90 bg-amber-50/35',
    purple: 'border-purple-300/90 bg-purple-50/35',
    indigo: 'border-indigo-300/90 bg-indigo-50/35',
    emerald: 'border-emerald-300/90 bg-emerald-50/35',
    rose: 'border-rose-300/90 bg-rose-50/35',
  }[accent] || 'border-teal-200/90 bg-white';

  const badgeStyles = {
    teal: 'bg-teal-600 text-white',
    amber: 'bg-amber-500 text-slate-950',
    purple: 'bg-purple-600 text-white',
    indigo: 'bg-indigo-600 text-white',
    emerald: 'bg-emerald-600 text-white',
    rose: 'bg-rose-600 text-white',
  }[accent] || 'bg-teal-600 text-white';

  return (
    <div className={`rounded-2xl border p-3 shadow-2xs space-y-2 ${accentStyles}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1 space-y-0.5">
          <div className="flex flex-wrap items-center gap-1.5">
            {badge && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide ${badgeStyles}`}>
                {badge}
              </span>
            )}
            {tagSuggestion && (
              <span className="px-1.5 py-0.5 rounded bg-slate-900 text-teal-300 font-mono text-[10px] font-bold">
                #{tagSuggestion}
              </span>
            )}
          </div>
          <h4 className="text-[13px] font-black text-slate-900 leading-snug">{title}</h4>
          {subtitle && (
            <p className="text-[11px] text-slate-600 font-medium leading-snug">{subtitle}</p>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {speciesIds.length > 0 && onSelectSpeciesInGrid && (
            <button
              type="button"
              onClick={() => onSelectSpeciesInGrid(speciesIds)}
              aria-label={`View ${speciesIds.length} species in Pokédex Grid`}
              className="compact-inline-chip min-h-[34px] px-2 py-1 rounded-xl text-[11px] font-extrabold bg-slate-100 hover:bg-teal-100 text-slate-700 border border-slate-300 cursor-pointer"
              title="Open species in Pokédex Grid"
            >
              🔍 {speciesIds.length}
            </button>
          )}
          <span className="mwg-copy">
            <button
              type="button"
              {...{ command: '--copy', commandfor: inputId }}
              aria-label={`Copy search string for ${title}`}
              className="mwg-copy-btn compact-inline-chip min-h-[34px] px-3 py-1 rounded-xl text-[11px] font-black uppercase tracking-wide bg-slate-900 hover:bg-teal-700 text-white border border-slate-900 shadow-2xs"
            >
              <span className="icon-copy" aria-hidden="true">📋</span>
              <span className="icon-check" aria-hidden="true">✓</span>
              <span>Copy</span>
            </button>
            <span className="mwg-copy-tip" role="status" />
          </span>
        </div>
      </div>

      {children && <div>{children}</div>}

      <input
        id={inputId}
        type="text"
        readOnly
        value={searchString}
        onClick={(e) => {
          e.target.select();
          if (onLoadToBar) onLoadToBar(searchString);
        }}
        aria-label={`Search string for ${title}`}
        className="w-full font-mono text-[11px] font-bold bg-slate-900 text-teal-300 px-2.5 py-1.5 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-400 truncate cursor-pointer"
      />
    </div>
  );
}

/**
 * Compact Major Event Card featuring Sprites + Poké Daxi / LuckyBunz 1-Tap Search Strings.
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
      className={`rounded-2xl border p-3 bg-white shadow-2xs space-y-2 transition-opacity ${
        ev.attended ? 'border-teal-300/90' : 'border-slate-200 opacity-75'
      }`}
    >
      {/* Top Meta Row */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wide ${
                ev.scope === 'in-person'
                  ? 'bg-purple-600 text-white'
                  : ev.scope === 'global'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-amber-500 text-slate-950'
              }`}
            >
              {ev.scope === 'raid-max-day' ? 'Raid / Max' : ev.scope}
            </span>
            <span className="px-1.5 py-0.5 rounded bg-slate-900 text-teal-300 font-mono text-[10px] font-bold">
              {built.ageCalc.ageToken}
            </span>
            <span className="text-[10px] font-bold text-slate-500">
              {ev.start}{ev.end !== ev.start ? ` → ${ev.end}` : ''}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
            <h4 className="text-[13px] font-black text-slate-900 leading-snug">{ev.name}</h4>
            <span className="px-1.5 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200 font-mono text-[10px] font-bold">
              #{ev.tag}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-semibold">{ev.location}</p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <label className="compact-inline-chip inline-flex items-center gap-1 text-[10px] font-extrabold text-slate-700 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200 cursor-pointer">
            <input
              type="checkbox"
              checked={ev.attended}
              onChange={() => onToggleAttended(ev.id)}
              className="w-3.5 h-3.5 accent-teal-600 rounded"
            />
            <span>Played</span>
          </label>
          <button
            type="button"
            onClick={() => onEdit(ev)}
            aria-label={`Edit ${ev.name}`}
            className="compact-inline-chip mwg-icon-hit w-7 h-7 rounded-lg bg-slate-100 hover:bg-teal-50 text-slate-600 flex items-center justify-center text-xs cursor-pointer"
          >
            ✏️
          </button>
          {ev.isCustom && (
            <button
              type="button"
              onClick={() => onDelete(ev.id)}
              aria-label={`Delete ${ev.name}`}
              className="compact-inline-chip mwg-icon-hit w-7 h-7 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center text-xs cursor-pointer"
            >
              🗑️
            </button>
          )}
        </div>
      </div>

      {/* Special Pokémon Sprite Strip */}
      {spriteIds.length > 0 && (
        <div className="bg-slate-50/90 rounded-xl p-1.5 border border-slate-200/80 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            {spriteIds.map((id) => (
              <img
                key={id}
                src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`}
                alt={`Pokédex #${id}`}
                loading="lazy"
                width="30"
                height="30"
                className="w-7 h-7 object-contain bg-white rounded-lg border border-slate-200 shrink-0"
              />
            ))}
            {built.allSpecialIds.length > spriteIds.length && (
              <span className="text-[10px] font-black text-slate-500 px-1">
                +{built.allSpecialIds.length - spriteIds.length}
              </span>
            )}
          </div>
          {onSelectSpeciesInGrid && (
            <button
              type="button"
              onClick={() => onSelectSpeciesInGrid(built.allSpecialIds)}
              className="compact-inline-chip text-[10px] font-extrabold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-2 py-1 rounded-lg shrink-0 cursor-pointer"
            >
              🔍 Grid ({built.allSpecialIds.length})
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
        <summary className="text-[10px] font-bold text-slate-500 hover:text-teal-700 cursor-pointer select-none">
          📋 Species roster & raw strings
        </summary>
        <div className="mt-1.5 space-y-1.5">
          {(ev.raidSummary || ev.specialSummary || ev.featuredSpecies) && (
            <div className="bg-slate-50 rounded-xl p-2 border border-slate-200 text-[11px] leading-snug space-y-0.5">
              {ev.raidSummary && (
                <div className="text-slate-800">
                  <span className="font-black text-teal-800">⚔️ Raids/Megas: </span>
                  <span className="font-medium">{ev.raidSummary}</span>
                </div>
              )}
              {ev.specialSummary && (
                <div className="text-slate-800">
                  <span className="font-black text-indigo-800">🌍 Special/Regionals: </span>
                  <span className="font-medium">{ev.specialSummary}</span>
                </div>
              )}
              {!ev.raidSummary && !ev.specialSummary && ev.featuredSpecies && (
                <div className="text-slate-700 font-medium">{ev.featuredSpecies}</div>
              )}
            </div>
          )}

          <div className="space-y-1 bg-slate-900 text-teal-300 p-2.5 rounded-xl font-mono text-[10px]">
            <div
              onClick={() => onLoadToBar?.(built.raidAndMegaString)}
              className="truncate cursor-pointer hover:text-white"
              title="Tap to load into bottom bar"
            >
              <span className="text-slate-400">Raids: </span>{built.raidAndMegaString}
            </div>
            {built.regionalAndRareTradeString && (
              <div
                onClick={() => onLoadToBar?.(built.regionalAndRareTradeString)}
                className="truncate cursor-pointer hover:text-white"
              >
                <span className="text-slate-400">Special: </span>{built.regionalAndRareTradeString}
              </div>
            )}
            {built.backgroundKeepString && (
              <div
                onClick={() => onLoadToBar?.(built.backgroundKeepString)}
                className="truncate cursor-pointer hover:text-white"
              >
                <span className="text-slate-400">BG: </span>{built.backgroundKeepString}
              </div>
            )}
            <div
              onClick={() => onLoadToBar?.(built.eventLeftoverTrashString)}
              className="truncate cursor-pointer hover:text-white"
            >
              <span className="text-rose-300">Safe Trash: </span>{built.eventLeftoverTrashString}
            </div>
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
    <div className="max-w-7xl mx-auto w-full pb-24">
      {/* Sticky Single-Row Tablist + Compact Quick Controls */}
      <div className="sticky top-[48px] sm:top-[52px] z-30 bg-white/95 backdrop-blur-md border-b border-teal-200/90 shadow-2xs">
        <div className="max-w-7xl mx-auto px-2 sm:px-4">
          {/* Single-Row Horizontally Scrolling Tablist (mwg: tabs) */}
          <div
            ref={tablistRef}
            className="mwg-tablist border-b border-slate-100"
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

          {/* Slim 36px Toolbar: !# Untagged Toggle + Active Summary + Options Modal Trigger */}
          <div className="flex items-center justify-between gap-2 py-1.5 px-1 text-xs">
            <div className="flex items-center gap-1.5 min-w-0">
              <button
                type="button"
                onClick={() => setUntaggedOnly((v) => !v)}
                aria-pressed={untaggedOnly}
                className={`compact-inline-chip min-h-[30px] px-2.5 py-0.5 rounded-full text-[11px] font-black border transition-colors cursor-pointer inline-flex items-center gap-1 ${
                  untaggedOnly
                    ? 'bg-teal-600 text-white border-teal-700'
                    : 'bg-slate-100 text-slate-600 border-slate-300'
                }`}
              >
                <span>{untaggedOnly ? '✓ !# Untagged' : '!# Off'}</span>
              </button>

              <span className="text-[11px] font-bold text-slate-500 truncate">
                {bufferLabel} • Caps {cdShinyKeepCap}/{globalBgKeepCap}/{costumeKeepCap}
              </span>
            </div>

            <button
              type="button"
              onClick={() => optionsDialogRef.current?.showModal()}
              className="compact-inline-chip min-h-[30px] px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-slate-100 hover:bg-teal-50 text-slate-700 border border-slate-300 cursor-pointer shrink-0 inline-flex items-center gap-1"
            >
              <span aria-hidden="true">⚙️</span>
              <span>Options</span>
            </button>
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
          <div className="pt-3 space-y-2.5 mwg-accordion mwg-card-container">
            {/* Phase 1: Trophies */}
            <details open className="rounded-2xl border border-amber-300/80 bg-white/95 overflow-hidden shadow-2xs">
              <summary className="px-3.5 py-2.5 bg-amber-50/70 text-xs font-black text-slate-900 select-none">
                <span className="flex-1 flex items-center justify-between gap-2">
                  <span>1. Hard Trophies & 0% Nundos</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-950">
                    #Trophy
                  </span>
                </span>
              </summary>
              <div className="p-2.5 border-t border-amber-100 mwg-card-grid">
                <SearchRecipeCard
                  badge="1A • Crown Jewels"
                  title="4*, Gigantamax, Shiny Shadows, Shiny Legendaries & Shiny Location BGs"
                  tagSuggestion="Trophy"
                  subtitle="Permanent account locks across 100% IVs, G-Max factor, and apex shiny variants."
                  searchString={`${prefix}4*,gigantamax,shiny&shadow,shiny&legendary,shiny&mythical,shiny&ultra beasts,shiny&locationbackground`}
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
            <details className="rounded-2xl border border-purple-300/80 bg-white/95 overflow-hidden shadow-2xs">
              <summary className="px-3.5 py-2.5 bg-purple-50/70 text-xs font-black text-slate-900 select-none">
                <span className="flex-1 flex items-center justify-between gap-2">
                  <span>2. High-Demand Tradeables (BGs, Regionals, Rotom, Shinies)</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-200/80 text-purple-950">
                    #TradeRare
                  </span>
                </span>
              </summary>
              <div className="p-2.5 border-t border-purple-100 mwg-card-grid">
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
                    className="w-full bg-white border border-purple-200 rounded-xl px-2.5 py-1 text-[11px] font-bold text-slate-800"
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
            <details className="rounded-2xl border border-indigo-300/80 bg-white/95 overflow-hidden shadow-2xs">
              <summary className="px-3.5 py-2.5 bg-indigo-50/70 text-xs font-black text-slate-900 select-none">
                <span className="flex-1 flex items-center justify-between gap-2">
                  <span>3. Capped Trade Stock vs. Excess Clutter</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-200/80 text-indigo-950">
                    count-{cdShinyKeepCap}
                  </span>
                </span>
              </summary>
              <div className="p-2.5 border-t border-indigo-100 space-y-2.5">
                <div className="flex items-center gap-2 bg-indigo-50/60 px-2.5 py-1.5 rounded-xl border border-indigo-200">
                  <span className="text-[11px] font-extrabold text-indigo-950 shrink-0">Global BG Window:</span>
                  <select
                    aria-label="Scope Global Special Backgrounds by event window"
                    value={selectedGlobalBgScopeId}
                    onChange={(e) => setSelectedGlobalBgScopeId(e.target.value)}
                    className="flex-1 min-w-0 bg-white border border-indigo-200 rounded-lg px-2 py-1 text-[11px] font-bold text-slate-800"
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
            <details className="rounded-2xl border border-teal-300/80 bg-white/95 overflow-hidden shadow-2xs">
              <summary className="px-3.5 py-2.5 bg-teal-50/70 text-xs font-black text-slate-900 select-none">
                <span className="flex-1 flex items-center justify-between gap-2">
                  <span>4. Mirror & Special Trade Rerolls</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-200/80 text-teal-950">
                    #TradeMirror
                  </span>
                </span>
              </summary>
              <div className="p-2.5 border-t border-teal-100 mwg-card-grid">
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
            <details className="rounded-2xl border border-emerald-300/80 bg-white/95 overflow-hidden shadow-2xs">
              <summary className="px-3.5 py-2.5 bg-emerald-50/70 text-xs font-black text-slate-900 select-none">
                <span className="flex-1 flex items-center justify-between gap-2">
                  <span>5. PvPoke Top 100 (GL/UL/ML) & DialgaDex Raiders</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-950">
                    #PvP / #PvE
                  </span>
                </span>
              </summary>
              <div className="p-2.5 border-t border-emerald-100 mwg-card-grid">
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
            <details className="rounded-2xl border border-rose-300 bg-white/95 overflow-hidden shadow-2xs">
              <summary className="px-3.5 py-2.5 bg-rose-50/80 text-xs font-black text-rose-950 select-none">
                <span className="flex-1 flex items-center justify-between gap-2">
                  <span>6. Safe Mass Transfer (Zero Meta / Regional Conflict)</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-600 text-white">
                    #Transfer
                  </span>
                </span>
              </summary>
              <div className="p-2.5 border-t border-rose-100 mwg-card-grid">
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
          <div className="pt-3 space-y-3 mwg-card-container">
            {/* Compact Search + Action Row */}
            <div className="bg-white rounded-2xl border border-teal-200/90 p-2.5 shadow-2xs space-y-2">
              <div className="flex items-center gap-1.5">
                <input
                  type="search"
                  placeholder="Search event, Rotom, regional, Mega, city..."
                  value={eventDbSearch}
                  onChange={(e) => setEventDbSearch(e.target.value)}
                  aria-label="Search major events and special Pokémon"
                  className="flex-1 min-w-0 px-3 py-1.5 rounded-xl border border-slate-300 text-base sm:text-xs font-bold text-slate-800 bg-slate-50 focus:outline-none focus:bg-white focus:border-teal-500"
                />
                <button
                  type="button"
                  onClick={openAddEventModal}
                  className="compact-inline-chip min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-black bg-teal-600 hover:bg-teal-700 text-white cursor-pointer shrink-0"
                >
                  + Event
                </button>
              </div>

              {/* Single-Line Scrollable Series & Year Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                {['ALL', 2026, 2025, 2024, 2023].map((yr) => (
                  <button
                    key={String(yr)}
                    type="button"
                    onClick={() => setEventYearFilter(String(yr))}
                    className={`compact-inline-chip min-h-[28px] px-2.5 py-0.5 rounded-full text-[11px] font-black shrink-0 border cursor-pointer ${
                      eventYearFilter === String(yr)
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {yr === 'ALL' ? 'All Years' : yr}
                  </button>
                ))}
                <span className="text-slate-300 select-none" aria-hidden="true">|</span>
                {['ALL', 'GO Tour', 'GO Fest', 'Wild Area', 'City & Special', 'Raid & Max'].map((series) => (
                  <button
                    key={series}
                    type="button"
                    onClick={() => setEventSeriesFilter(series)}
                    className={`compact-inline-chip min-h-[28px] px-2.5 py-0.5 rounded-full text-[11px] font-black shrink-0 border cursor-pointer ${
                      eventSeriesFilter === series
                        ? 'bg-teal-600 text-white border-teal-700'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    {series === 'ALL' ? 'All Series' : series}
                  </button>
                ))}
              </div>

              {dbStatusBanner && (
                <div className="px-2.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-300 text-[11px] font-bold text-emerald-950">
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
            <div className="mwg-accordion space-y-2 pt-1">
              <details className="rounded-2xl border border-teal-200 bg-white overflow-hidden shadow-2xs">
                <summary className="px-3.5 py-2.5 text-xs font-black text-slate-800 select-none">
                  <span>🧮 Custom Date Range → ageX-Y Calculator & JSON Backup</span>
                </summary>
                <div className="p-3 border-t border-slate-100 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
                      <label htmlFor="custom-ev-lbl" className="text-[10px] font-black uppercase text-slate-500">
                        Tag Label
                      </label>
                      <input
                        id="custom-ev-lbl"
                        type="text"
                        value={customEventName}
                        onChange={(e) => setCustomEventName(e.target.value)}
                        className="w-full text-base sm:text-xs font-bold text-slate-900 bg-transparent focus:outline-none"
                      />
                    </div>
                    <div className="bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
                      <label htmlFor="custom-ev-start" className="text-[10px] font-black uppercase text-slate-500">
                        Start Date
                      </label>
                      <input
                        id="custom-ev-start"
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className="w-full text-base sm:text-xs font-bold text-slate-900 bg-transparent focus:outline-none"
                      />
                    </div>
                    <div className="bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
                      <label htmlFor="custom-ev-end" className="text-[10px] font-black uppercase text-slate-500">
                        End Date
                      </label>
                      <input
                        id="custom-ev-end"
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className="w-full text-base sm:text-xs font-bold text-slate-900 bg-transparent focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 text-xs">
                    <label className="inline-flex items-center gap-1.5 font-bold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={customExcludeRemote}
                        onChange={(e) => setCustomExcludeRemote(e.target.checked)}
                        className="w-4 h-4 accent-teal-600 rounded"
                      />
                      <span>!remoteraid</span>
                    </label>
                    <label className="inline-flex items-center gap-1.5 font-bold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={customRequireLocationBg}
                        onChange={(e) => setCustomRequireLocationBg(e.target.checked)}
                        className="w-4 h-4 accent-teal-600 rounded"
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

                  <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={handleExportEventsJson}
                      className="compact-inline-chip min-h-[32px] px-3 py-1 rounded-xl text-[11px] font-black bg-slate-100 hover:bg-teal-50 text-slate-800 border border-slate-300 cursor-pointer"
                    >
                      ⬇️ Export Archive JSON
                    </button>
                    <button
                      type="button"
                      onClick={() => fileImportRef.current?.click()}
                      className="compact-inline-chip min-h-[32px] px-3 py-1 rounded-xl text-[11px] font-black bg-slate-100 hover:bg-teal-50 text-slate-800 border border-slate-300 cursor-pointer"
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
                      className="compact-inline-chip min-h-[32px] px-3 py-1 rounded-xl text-[11px] font-black bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 cursor-pointer"
                    >
                      Reset Defaults
                    </button>
                  </div>
                </div>
              </details>

              <details className="rounded-2xl border border-teal-200 bg-white overflow-hidden shadow-2xs">
                <summary className="px-3.5 py-2.5 text-xs font-black text-slate-800 select-none">
                  <span>✈️ Personal Travel Trips ({TRAVEL_TRIPS.length})</span>
                </summary>
                <div className="p-2.5 border-t border-slate-100 mwg-card-grid mwg-card-grid-3">
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
          <div className="pt-3 space-y-3 mwg-card-container">
            <div className="bg-white rounded-2xl border border-teal-200/90 p-3 shadow-2xs space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    Yearly & Monthly Storage Slicer
                  </h3>
                  <p className="text-[11px] text-slate-600">
                    Separates played event windows from everyday catches using merged <code className="font-mono font-bold">!ageX-Y</code> ranges.
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  {[2026, 2025, 2024, 2023].map((yr) => (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => setSlicerYear(yr)}
                      className={`compact-inline-chip min-h-[32px] px-2.5 py-1 rounded-xl text-xs font-black border cursor-pointer ${
                        slicerYear === yr
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {yr}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs">
                <label className="inline-flex items-center gap-1.5 font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeTripsInSlicer}
                    onChange={(e) => setIncludeTripsInSlicer(e.target.checked)}
                    className="w-4 h-4 accent-teal-600 rounded"
                  />
                  <span>Protect Trips</span>
                </label>
                <label className="inline-flex items-center gap-1.5 font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeCdsInSlicer}
                    onChange={(e) => setIncludeCdsInSlicer(e.target.checked)}
                    className="w-4 h-4 accent-teal-600 rounded"
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
                  className={`rounded-2xl border p-3 bg-white shadow-2xs space-y-2 ${
                    ms.isUpcoming ? 'border-slate-200 opacity-55' : 'border-teal-200/80'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-black text-slate-900">
                      {ms.monthName} {slicerYear}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-900 text-teal-300 font-mono text-[10px] font-bold">
                      {ms.isUpcoming ? 'Upcoming' : ms.ageToken}
                    </span>
                  </div>

                  <div className="text-[10px] text-slate-600 space-y-0.5">
                    {ms.eventsInMonth.length === 0 && ms.cdsInMonth.length === 0 && ms.tripsInMonth.length === 0 ? (
                      <span className="italic text-slate-400">No major events logged</span>
                    ) : (
                      <>
                        {ms.eventsInMonth.slice(0, 3).map((e) => (
                          <div key={e.id} className="truncate font-semibold text-slate-700">
                            • {e.name}
                          </div>
                        ))}
                        {ms.cdsInMonth.map((c) => (
                          <div key={c.id} className="truncate font-semibold text-indigo-700">
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
          <div className="pt-3 space-y-3 mwg-card-container">
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
              className="mwg-accordion bg-white rounded-2xl border border-teal-200/90 p-3 shadow-2xs space-y-2.5"
            >
              <div className="flex flex-wrap items-center gap-1.5">
                <input
                  type="search"
                  placeholder="Filter CD species, move, or month..."
                  value={cdSearchFilter}
                  onChange={(e) => setCdSearchFilter(e.target.value)}
                  aria-label="Filter Community Day species"
                  className="flex-1 min-w-[160px] px-3 py-1.5 rounded-xl border border-slate-300 text-base sm:text-xs font-bold text-slate-800 bg-slate-50 focus:outline-none focus:border-teal-500"
                />
                <button
                  type="button"
                  onClick={() => setSelectedCdEventIds(new Set(COMMUNITY_DAY_EVENTS.map((ev) => ev.id)))}
                  className="compact-inline-chip min-h-[34px] px-2.5 py-1 rounded-xl text-[11px] font-black bg-teal-50 text-teal-800 border border-teal-300 cursor-pointer"
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCdEventIds(new Set())}
                  className="compact-inline-chip min-h-[34px] px-2.5 py-1 rounded-xl text-[11px] font-black bg-slate-100 text-slate-700 border border-slate-300 cursor-pointer"
                >
                  None
                </button>
                <button
                  ref={toggleBtnRef}
                  type="button"
                  {...{ commandfor: 'cd-year-accordion', command: '--toggle-all' }}
                  aria-expanded={allYearsExpanded ? 'true' : 'false'}
                  className="compact-inline-chip min-h-[34px] px-2.5 py-1 rounded-xl text-[11px] font-black bg-slate-900 text-white cursor-pointer"
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
                      className="rounded-xl border border-slate-200 bg-slate-50/60 overflow-hidden"
                    >
                      <summary className="px-3 py-2 bg-white text-xs font-black text-slate-900 select-none">
                        <span className="flex-1 flex items-center justify-between gap-2">
                          <span>{year} Community Days</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-teal-100 text-teal-900">
                            {selectedInYear}/{filtered.length}
                          </span>
                        </span>
                      </summary>

                      <div className="p-2.5 border-t border-slate-200 space-y-2">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => toggleCdYear(filtered, !allYearSelected)}
                            className="compact-inline-chip min-h-[28px] px-2.5 py-0.5 rounded-lg text-[10px] font-black bg-white text-teal-800 border border-teal-300 cursor-pointer"
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
                                className={`flex items-center gap-2.5 p-2 rounded-xl border cursor-pointer select-none ${
                                  isChecked ? 'bg-white border-teal-400' : 'bg-slate-100/70 border-slate-200 opacity-65'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => toggleCdEvent(ev.id)}
                                  className="w-4 h-4 accent-teal-600 rounded shrink-0"
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
                                    <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-slate-900 text-white">
                                      {ev.month.slice(0, 3)}
                                    </span>
                                    {ev.isClassic && (
                                      <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-200 text-amber-950">
                                        Classic
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-xs font-black text-slate-900 truncate">{ev.species}</div>
                                  <div className="text-[10px] text-indigo-700 font-bold truncate">
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
          <div className="pt-3 space-y-3">
            <div className="bg-white rounded-2xl border border-teal-200/90 p-3 shadow-2xs space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    PvPoke Top 100 & DialgaDex Raiders
                  </h3>
                  <p className="text-[11px] text-slate-600">
                    {metaSets.allProtectedMetaIds.length} protected meta/regional IDs • {metaSets.strictNonMetaIds.length} strict non-meta IDs.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={isSyncingMeta}
                  onClick={handleSyncMeta}
                  className="compact-inline-chip min-h-[34px] px-3 py-1.5 rounded-xl text-[11px] font-black bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white cursor-pointer"
                >
                  {isSyncingMeta ? '⏳ Syncing...' : '🔄 Sync Live'}
                </button>
              </div>

              {syncMessage && (
                <div
                  className={`p-2 rounded-xl text-[11px] font-bold border ${
                    syncMessage.type === 'success'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                      : 'bg-amber-50 border-amber-300 text-amber-900'
                  }`}
                >
                  {syncMessage.text}
                </div>
              )}

              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
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
                    className={`compact-inline-chip min-h-[30px] px-2.5 py-1 rounded-xl text-[11px] font-black shrink-0 border cursor-pointer ${
                      activeMetaLeagueTab === t.id
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <input
                type="search"
                placeholder="Search species, type, or move..."
                value={metaSearchFilter}
                onChange={(e) => setMetaSearchFilter(e.target.value)}
                aria-label="Filter ranked meta Pokémon"
                className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-base sm:text-xs font-bold text-slate-800 bg-slate-50 focus:outline-none focus:border-teal-500"
              />
            </div>

            {/* Mobile-Friendly Ranked Species List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
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
                      className="bg-white rounded-2xl border border-slate-200 p-2.5 flex items-center justify-between gap-2 shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${item.dexId}.png`}
                          alt={displayName}
                          loading="lazy"
                          width="36"
                          height="36"
                          className="w-9 h-9 object-contain bg-slate-50 rounded-xl border border-slate-200 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[11px] font-black text-teal-700">
                              {item.rank ? `#${item.rank}` : item.tier}
                            </span>
                            <span className="text-xs font-black text-slate-900 truncate">{displayName}</span>
                          </div>
                          <div className="text-[10px] font-semibold text-slate-600 truncate">
                            {item.fastMove}
                            {item.chargedMoves?.length > 0 ? ` + ${item.chargedMoves.join(' / ')}` : ''}
                          </div>
                        </div>
                      </div>

                      <CopyChip
                        label="Copy"
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
        className="rounded-3xl border-2 border-teal-200 p-0 max-w-md w-[calc(100%-1.5rem)] bg-white text-slate-900 shadow-2xl"
      >
        <div className="p-4 border-b border-teal-100 flex items-center justify-between bg-[#edf7f4]">
          <h2 id={optionsHeadingId} className="text-sm font-black text-slate-900 uppercase tracking-wide">
            ⚙️ Triage & Age Options
          </h2>
          <form method="dialog">
            <button
              value="close"
              aria-label="Close options dialog"
              className="pogo-close-btn w-7 h-7 rounded-full flex items-center justify-center text-white font-black text-xs cursor-pointer"
            >
              ✕
            </button>
          </form>
        </div>

        <div className="p-4 space-y-3 text-xs">
          <label className="flex items-center justify-between gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200 cursor-pointer">
            <div>
              <div className="font-black text-slate-900">Prepend !# (Untagged Only)</div>
              <div className="text-[11px] text-slate-500">Hides Pokémon you already tagged</div>
            </div>
            <input
              type="checkbox"
              checked={untaggedOnly}
              onChange={(e) => setUntaggedOnly(e.target.checked)}
              className="w-4 h-4 accent-teal-600 rounded"
            />
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
              <label htmlFor="opt-ref-date" className="text-[10px] font-black uppercase text-slate-500 block">
                Reference Date (Today)
              </label>
              <input
                id="opt-ref-date"
                type="date"
                value={referenceDate}
                onChange={(e) => setReferenceDate(e.target.value || getTodayPlainDateString())}
                className="w-full text-base sm:text-xs font-black text-slate-900 bg-transparent focus:outline-none mt-0.5"
              />
            </div>

            <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
              <label htmlFor="opt-age-buffer" className="text-[10px] font-black uppercase text-slate-500 block">
                24h Age Precision
              </label>
              <select
                id="opt-age-buffer"
                value={bufferMode}
                onChange={(e) => setBufferMode(e.target.value)}
                className="w-full text-base sm:text-xs font-black text-slate-900 bg-transparent focus:outline-none mt-0.5"
              >
                <option value="exact">Exact Calendar Day</option>
                <option value="evening-safe">-1d Evening Catch Safe</option>
                <option value="plus-minus-1">±1d Timezone Buffer</option>
              </select>
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-500">
              Trade Stockpile Keep Caps
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-200 text-center space-y-1">
                <label htmlFor="cap-cd" className="text-[10px] font-extrabold text-slate-600 block">
                  CD Shinies
                </label>
                <select
                  id="cap-cd"
                  value={cdShinyKeepCap}
                  onChange={(e) => setCdShinyKeepCap(Number(e.target.value))}
                  className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-black"
                >
                  {[1, 2, 3, 4].map((n) => (
                    <option key={n} value={n}>1–{n}</option>
                  ))}
                </select>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-200 text-center space-y-1">
                <label htmlFor="cap-bg" className="text-[10px] font-extrabold text-slate-600 block">
                  Global BGs
                </label>
                <select
                  id="cap-bg"
                  value={globalBgKeepCap}
                  onChange={(e) => setGlobalBgKeepCap(Number(e.target.value))}
                  className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-black"
                >
                  {[1, 2, 3].map((n) => (
                    <option key={n} value={n}>1–{n}</option>
                  ))}
                </select>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-200 text-center space-y-1">
                <label htmlFor="cap-costume" className="text-[10px] font-extrabold text-slate-600 block">
                  Costumes
                </label>
                <select
                  id="cap-costume"
                  value={costumeKeepCap}
                  onChange={(e) => setCostumeKeepCap(Number(e.target.value))}
                  className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-black"
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
              className="w-full py-2.5 rounded-2xl font-black bg-teal-600 hover:bg-teal-700 text-white cursor-pointer"
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
        className="rounded-3xl border-2 border-teal-200 p-0 max-w-lg w-[calc(100%-1.5rem)] bg-white text-slate-900 shadow-2xl"
      >
        <div className="p-4 border-b border-teal-100 flex items-center justify-between bg-[#edf7f4]">
          <h2 id={dialogHeadingId} className="text-sm font-black text-slate-900 uppercase tracking-wide">
            {isEditingExisting ? '✏️ Edit Event' : '➕ Add Event'}
          </h2>
          <form method="dialog">
            <button
              value="cancel"
              aria-label="Close event dialog"
              className="pogo-close-btn w-7 h-7 rounded-full flex items-center justify-center text-white font-black text-xs cursor-pointer"
            >
              ✕
            </button>
          </form>
        </div>

        <form onSubmit={handleSaveEventModal} className="p-4 space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="sm:col-span-2 space-y-1">
              <label htmlFor="ev-name" className="font-black text-slate-700 uppercase text-[10px]">
                Event Name
              </label>
              <input
                id="ev-name"
                type="text"
                required
                value={eventForm.name}
                onChange={(e) => setEventForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Pokémon GO Fest: Global"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-base sm:text-xs font-bold"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="ev-tag" className="font-black text-slate-700 uppercase text-[10px]">
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
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-base sm:text-xs font-mono font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label htmlFor="ev-start" className="font-black text-slate-700 uppercase text-[10px]">
                Start Date
              </label>
              <input
                id="ev-start"
                type="date"
                required
                value={eventForm.start}
                onChange={(e) => setEventForm((f) => ({ ...f, start: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-base sm:text-xs font-bold"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="ev-end" className="font-black text-slate-700 uppercase text-[10px]">
                End Date
              </label>
              <input
                id="ev-end"
                type="date"
                required
                value={eventForm.end === 'PRESENT' ? getTodayPlainDateString() : eventForm.end}
                onChange={(e) => setEventForm((f) => ({ ...f, end: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-base sm:text-xs font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="space-y-1">
              <label htmlFor="ev-scope" className="font-black text-slate-700 uppercase text-[10px]">
                Scope
              </label>
              <select
                id="ev-scope"
                value={eventForm.scope}
                onChange={(e) => setEventForm((f) => ({ ...f, scope: e.target.value }))}
                className="w-full px-2.5 py-2 rounded-xl border border-slate-300 text-base sm:text-xs font-bold bg-white"
              >
                <option value="global">Global</option>
                <option value="in-person">In-Person</option>
                <option value="raid-max-day">Raid / Max Day</option>
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="ev-bg" className="font-black text-slate-700 uppercase text-[10px]">
                Background
              </label>
              <select
                id="ev-bg"
                value={eventForm.backgroundType}
                onChange={(e) => setEventForm((f) => ({ ...f, backgroundType: e.target.value }))}
                className="w-full px-2.5 py-2 rounded-xl border border-slate-300 text-base sm:text-xs font-bold bg-white"
              >
                <option value="locationbackground">locationbackground</option>
                <option value="specialbackground">specialbackground</option>
                <option value="none">None</option>
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="ev-series" className="font-black text-slate-700 uppercase text-[10px]">
                Series
              </label>
              <select
                id="ev-series"
                value={eventForm.series}
                onChange={(e) => setEventForm((f) => ({ ...f, series: e.target.value }))}
                className="w-full px-2.5 py-2 rounded-xl border border-slate-300 text-base sm:text-xs font-bold bg-white"
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
              <label htmlFor="ev-raid-ids" className="font-black text-slate-700 uppercase text-[10px]">
                Raid / Mega Dex IDs
              </label>
              <input
                id="ev-raid-ids"
                type="text"
                value={eventForm.raidMegaIdsText}
                onChange={(e) => setEventForm((f) => ({ ...f, raidMegaIdsText: e.target.value }))}
                placeholder="e.g. 150, 384, 483, 484"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-base sm:text-xs font-mono font-bold"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="ev-reg-ids" className="font-black text-slate-700 uppercase text-[10px]">
                Regional / Rotom / Unown IDs
              </label>
              <input
                id="ev-reg-ids"
                type="text"
                value={eventForm.regionalRareIdsText}
                onChange={(e) => setEventForm((f) => ({ ...f, regionalRareIdsText: e.target.value }))}
                placeholder="e.g. 479, 201, 701, 764"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-base sm:text-xs font-mono font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label htmlFor="ev-loc" className="font-black text-slate-700 uppercase text-[10px]">
                Location
              </label>
              <input
                id="ev-loc"
                type="text"
                value={eventForm.location}
                onChange={(e) => setEventForm((f) => ({ ...f, location: e.target.value }))}
                placeholder="Worldwide or City"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-base sm:text-xs font-bold"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="ev-raid-sum" className="font-black text-slate-700 uppercase text-[10px]">
                Raid / Special Notes
              </label>
              <input
                id="ev-raid-sum"
                type="text"
                value={eventForm.raidSummary}
                onChange={(e) => setEventForm((f) => ({ ...f, raidSummary: e.target.value }))}
                placeholder="Mega Mewtwo, Wash Rotom, Comfey..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-base sm:text-xs font-bold"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-4 pt-1">
            <label className="inline-flex items-center gap-1.5 font-bold text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={eventForm.attended}
                onChange={(e) => setEventForm((f) => ({ ...f, attended: e.target.checked }))}
                className="w-4 h-4 accent-teal-600 rounded"
              />
              <span>Played</span>
            </label>
            <label className="inline-flex items-center gap-1.5 font-bold text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={eventForm.hasMighty}
                onChange={(e) => setEventForm((f) => ({ ...f, hasMighty: e.target.checked }))}
                className="w-4 h-4 accent-teal-600 rounded"
              />
              <span>Has Mighty Spawns</span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={() => eventDialogRef.current?.close('cancel')}
              className="px-4 py-2 rounded-xl font-black bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl font-black bg-teal-600 hover:bg-teal-700 text-white cursor-pointer"
            >
              Save Event
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}

export default React.memo(TriagePipelineView);
