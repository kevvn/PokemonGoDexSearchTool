/**
 * Persistent Event, Background, Special Pokémon & Travel Trip Registry + Temporal Age Slicer.
 * Uses Temporal.PlainDate + Temporal.Duration (.since / .until with largestUnit: 'day') and Intl.DurationFormat
 * to compute exact relative `ageX-Y` search strings across Major Events, Trips, and Yearly/Monthly timelines.
 */
import eventsArchiveJson from './events_archive.json';
import { compressIdRanges } from '../utils/searchUtils';

const EVENT_DB_STORAGE_KEY = 'pogo_stored_event_db_v2';
const LEGACY_EVENT_DB_KEY = 'pogo_stored_event_db_v1';

/**
 * Canonical National Dex IDs for Regionals, Rotom (#479), Unown (#201), and Rare Egg/Ticket Tradeables.
 * Used both to isolate high-demand trade stock (even at 0*-2* IVs) and to guard Safe Trash sweeps.
 */
export const GLOBAL_REGIONAL_ROTOM_UNOWN_IDS = [
  83,  // Farfetch'd
  115, // Kangaskhan
  122, // Mr. Mime
  128, // Tauros (Kanto & Paldean Combat/Blaze/Aqua)
  201, // Unown (All Letters, !, ?)
  214, // Heracross
  222, // Corsola
  313, // Volbeat
  314, // Illumise
  324, // Torkoal
  335, // Zangoose
  336, // Seviper
  337, // Lunatone
  338, // Solrock
  352, // Kecleon
  357, // Tropius
  369, // Relicanth
  417, // Pachirisu
  439, // Mime Jr.
  441, // Chatot
  455, // Carnivine
  479, // Rotom (Base, Wash, Heat, Frost, Fan, Mow)
  480, // Uxie
  481, // Mesprit
  482, // Azelf
  511, // Pansage
  513, // Pansear
  515, // Panpour
  538, // Throh
  539, // Sawk
  550, // Basculin (Red/Blue/White-Striped)
  556, // Maractus
  561, // Sigilyph
  626, // Bouffalant
  631, // Heatmor
  632, // Durant
  636, // Larvesta
  669, // Flabébé
  672, // Skiddo
  676, // Furfrou
  701, // Hawlucha
  707, // Klefki
  741, // Oricorio
  764, // Comfey
  848, // Toxel
  978, // Tatsugiri
];

export const GLOBAL_REGIONAL_ROTOM_UNOWN_RANGES = compressIdRanges(GLOBAL_REGIONAL_ROTOM_UNOWN_IDS);

const GLOBAL_REGIONAL_NEGATION = GLOBAL_REGIONAL_ROTOM_UNOWN_RANGES
  .split(',')
  .filter(Boolean)
  .map((r) => `!${r}`)
  .join('&');

let temporalLoadPromise = null;

/**
 * Dynamically loads temporal-polyfill in browsers where native Temporal is not yet available.
 */
export async function ensureTemporalReady() {
  if (typeof globalThis.Temporal !== 'undefined') {
    return globalThis.Temporal;
  }
  if (!temporalLoadPromise) {
    temporalLoadPromise = import('https://esm.sh/temporal-polyfill')
      .then((module) => {
        globalThis.Temporal = module.Temporal;
        if (module.toTemporalInstant && !Date.prototype.toTemporalInstant) {
          Date.prototype.toTemporalInstant = module.toTemporalInstant;
        }
        return globalThis.Temporal;
      })
      .catch(() => null);
  }
  return temporalLoadPromise;
}

/**
 * Pure calendar Rata Die day count for synchronous initial render before async Temporal polyfill resolves,
 * avoiding legacy Date('YYYY-MM-DD') UTC-midnight timezone shift bugs.
 */
function calendarDaysFromYMD(isoStr) {
  const [y, m, d] = isoStr.split('-').map(Number);
  const a = Math.floor((14 - m) / 12);
  const yr = y + 4800 - a;
  const mo = m + 12 * a - 3;
  return (
    d +
    Math.floor((153 * mo + 2) / 5) +
    365 * yr +
    Math.floor(yr / 4) -
    Math.floor(yr / 100) +
    Math.floor(yr / 400) -
    32045
  );
}

/**
 * Returns today's calendar date as YYYY-MM-DD in the local time zone using Temporal.Now.plainDateISO().
 */
export function getTodayPlainDateString() {
  if (typeof globalThis.Temporal !== 'undefined') {
    return globalThis.Temporal.Now.plainDateISO().toString();
  }
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Merges overlapping or adjacent [minAge, maxAge] integer intervals so combined `age` unions
 * and `!age` negations stay compact and well under Pokémon GO search bar length limits.
 */
export function mergeAgeIntervals(intervals) {
  if (!intervals || intervals.length === 0) return [];
  const valid = intervals
    .filter((iv) => iv && Number.isFinite(iv.minAge) && Number.isFinite(iv.maxAge))
    .map((iv) => ({
      minAge: Math.max(0, Math.min(iv.minAge, iv.maxAge)),
      maxAge: Math.max(0, Math.max(iv.minAge, iv.maxAge)),
    }))
    .sort((a, b) => a.minAge - b.minAge || a.maxAge - b.maxAge);

  if (valid.length === 0) return [];

  const merged = [valid[0]];
  for (let i = 1; i < valid.length; i++) {
    const prev = merged[merged.length - 1];
    const curr = valid[i];
    if (curr.minAge <= prev.maxAge + 1) {
      prev.maxAge = Math.max(prev.maxAge, curr.maxAge);
    } else {
      merged.push(curr);
    }
  }
  return merged;
}

export function formatIntervalToAgeToken(iv) {
  return iv.minAge === iv.maxAge ? `age${iv.minAge}` : `age${iv.minAge}-${iv.maxAge}`;
}

/**
 * Calculates Pokémon GO `ageX-Y` search string for an event window [startDateStr, endDateStr]
 * relative to refDateStr (default: today).
 */
export function calculateAgeSearchString(startDateStr, endDateStr, refDateStr = null, options = {}) {
  const effectiveRef = refDateStr || getTodayPlainDateString();
  const effectiveEnd = endDateStr === 'PRESENT' ? effectiveRef : endDateStr || startDateStr;
  const bufferMode = options.bufferMode || 'exact';

  let moreDaysAgo = 0;
  let fewerDaysAgo = 0;
  let humanSpan = '';
  let isUpcoming = false;

  if (typeof globalThis.Temporal !== 'undefined') {
    const Temporal = globalThis.Temporal;
    const refDate = Temporal.PlainDate.from(effectiveRef);
    const startDate = Temporal.PlainDate.from(startDateStr);
    const endDate = Temporal.PlainDate.from(effectiveEnd);

    const sinceStart = refDate.since(startDate, { largestUnit: 'day' });
    const sinceEnd = refDate.since(endDate, { largestUnit: 'day' });

    isUpcoming = sinceStart.sign < 0;
    moreDaysAgo = Math.max(0, sinceStart.days);
    fewerDaysAgo = Math.max(0, sinceEnd.days);

    try {
      if (sinceStart.sign >= 0) {
        const balanced = refDate.since(startDate, { largestUnit: 'year', smallestUnit: 'day' });
        humanSpan =
          balanced.days === 0 && balanced.months === 0 && balanced.years === 0
            ? 'Today'
            : `${balanced.toLocaleString('en-US', { style: 'short' })} ago`;
      } else {
        const untilStart = refDate.until(startDate, { largestUnit: 'month', smallestUnit: 'day' });
        humanSpan = `In ${untilStart.toLocaleString('en-US', { style: 'short' })}`;
      }
    } catch {
      humanSpan = isUpcoming ? 'Upcoming' : `${moreDaysAgo}d ago`;
    }
  } else {
    const refJd = calendarDaysFromYMD(effectiveRef);
    const startJd = calendarDaysFromYMD(startDateStr);
    const endJd = calendarDaysFromYMD(effectiveEnd);
    isUpcoming = refJd - startJd < 0;
    moreDaysAgo = Math.max(0, refJd - startJd);
    fewerDaysAgo = Math.max(0, refJd - endJd);
    humanSpan = isUpcoming ? 'Upcoming' : `${moreDaysAgo}d ago`;
  }

  let minAge = Math.min(fewerDaysAgo, moreDaysAgo);
  let maxAge = Math.max(fewerDaysAgo, moreDaysAgo);

  if (!isUpcoming) {
    if (bufferMode === 'evening-safe') {
      minAge = Math.max(0, minAge - 1);
    } else if (bufferMode === 'plus-minus-1') {
      minAge = Math.max(0, minAge - 1);
      maxAge = maxAge + 1;
    }
  }

  const ageToken = minAge === maxAge ? `age${minAge}` : `age${minAge}-${maxAge}`;

  const parts = [];
  if (options.untaggedOnly) parts.push('!#');
  if (options.yearFilter) parts.push(`year${options.yearFilter}`);
  if (options.dexIds && options.dexIds.length > 0) {
    parts.push(compressIdRanges(options.dexIds));
  }
  parts.push(ageToken);
  if (options.extraTokens && options.extraTokens.length > 0) {
    parts.push(...options.extraTokens);
  }
  if (options.excludeRemote) {
    parts.push('!remoteraid');
  }

  return {
    ageToken,
    fullSearchString: parts.join('&'),
    minAge,
    maxAge,
    startDate: startDateStr,
    endDate: effectiveEnd,
    humanSpan,
    isUpcoming,
  };
}

/**
 * Generates Poké Daxi / LuckyBunz "Tag First, Sweep Last" surgical search strings for a Major Event,
 * anchored to its exact relative `ageX-Y` window:
 * 1. raidAndMegaString: Raid Bosses, Primal/Origin/Fusion/Crowned, Mega/Super Mega, G-Max/D-Max catches.
 * 2. regionalAndRareTradeString: Untraded Event Regionals, Rotom (#479), Unown (#201), Mythicals, & Egg Rares.
 * 3. backgroundKeepString (& backgroundSurplusString): Venue Location Backgrounds or Global Special Backgrounds.
 * 4. pvpAndMightyString: Low-Attack PvP bulk (`0-1attack&3-4defense&3-4hp`) or Wild Area Mighty (`3*,4*&cp2200-`).
 * 5. eventKeepersString: Catch-all keeper scan (Shiny, 4*, Backgrounds, Costumes, G-Max, Legendaries/UBs).
 * 6. eventLeftoverTrashString: Safe 0*-2* wild trash sweep that explicitly NEGATES the event's Regionals,
 *    Rotom, Unown, and Raid/Mega species so low-IV tradeables are never accidentally transferred!
 */
export function buildEventActionStrings(eventItem, refDateStr, options = {}) {
  const {
    untaggedOnly = true,
    bufferMode = 'exact',
    constrainFeaturedSpecies = false,
    globalBgKeepCap = 3,
  } = options;

  const ageCalc = calculateAgeSearchString(eventItem.start, eventItem.end, refDateStr, {
    bufferMode,
    untaggedOnly: false,
  });

  const prefix = untaggedOnly ? '!#&' : '';

  const raidMegaIds = Array.isArray(eventItem.raidMegaIds)
    ? eventItem.raidMegaIds
    : Array.isArray(eventItem.dexIds)
      ? eventItem.dexIds
      : [];

  const regionalRareIds = Array.isArray(eventItem.regionalRareIds) ? eventItem.regionalRareIds : [];

  const allSpecialIds = Array.from(
    new Set([...raidMegaIds, ...regionalRareIds, ...(eventItem.dexIds || [])])
  ).sort((a, b) => a - b);

  const raidMegaRange = compressIdRanges(raidMegaIds);
  const regionalRareRange = compressIdRanges(regionalRareIds);
  const allSpecialRange = compressIdRanges(allSpecialIds);

  const speciesPart =
    constrainFeaturedSpecies && allSpecialRange ? `${allSpecialRange}&` : '';

  // 1. Raids, Megas & Max Bosses
  const raidAndMegaString = raidMegaRange
    ? `${prefix}${ageCalc.ageToken}&${raidMegaRange}`
    : `${prefix}${ageCalc.ageToken}&legendary,mythical,ultra beasts,gigantamax,dynamax,mega1-3`;

  // 2. Regionals, Rotom (#479), Unown (#201) & Special Spawns (Untraded Trade Gold)
  const regionalAndRareTradeString = regionalRareRange
    ? `${prefix}!traded&${ageCalc.ageToken}&${regionalRareRange}`
    : null;

  // 3. Backgrounds
  let backgroundKeepString = null;
  let backgroundSurplusString = null;

  if (eventItem.backgroundType === 'locationbackground') {
    backgroundKeepString = `${prefix}!traded&${speciesPart}locationbackground&${ageCalc.ageToken}&!4*`;
  } else if (eventItem.backgroundType === 'specialbackground') {
    backgroundKeepString = `${prefix}!traded&${speciesPart}specialbackground&!locationbackground&${ageCalc.ageToken}&!shiny&!4*&count-${globalBgKeepCap}`;
    backgroundSurplusString = `${prefix}${speciesPart}specialbackground&!locationbackground&${ageCalc.ageToken}&!shiny&!4*&0*,1*,2*&count${globalBgKeepCap + 1}-&!favorite&!lucky`;
  }

  // 4. PvP IV Check & Mighty Spawns
  const pvpIvCheckString = `${prefix}${ageCalc.ageToken}&0-1attack&3-4defense&3-4hp&cp-2500`;
  const mightyCheckString = eventItem.hasMighty
    ? `${prefix}${ageCalc.ageToken}&3*,4*&cp2200-`
    : null;

  // 5. Broad Event Keepers
  const remoteGuard =
    eventItem.scope === 'in-person' || eventItem.scope === 'personal-trip' ? '&!remoteraid' : '';
  const eventKeepersString = `${prefix}${ageCalc.ageToken}&shiny,4*,locationbackground,specialbackground,costume,gigantamax,legendary,mythical,ultra beasts${remoteGuard}`;

  // 6. Safe Event 0*-2* Trash Sweep (Negates all event-featured Regionals, Rotom, Unown & Special Bosses!)
  const protectedEventNegations = allSpecialRange
    ? `${allSpecialRange
        .split(',')
        .filter(Boolean)
        .map((r) => `!${r}`)
        .join('&')}&`
    : '';

  const eventLeftoverTrashString = `${prefix}${ageCalc.ageToken}&0*,1*,2*&${protectedEventNegations}!shiny&!background&!locationbackground&!specialbackground&!costume&!shadow&!purified&!dynamax&!gigantamax&!favorite&!lucky&!4*&!legendary&!mythical&!ultra beasts&!@special`;

  return {
    ageCalc,
    allSpecialIds,
    raidMegaIds,
    regionalRareIds,
    raidAndMegaString,
    regionalAndRareTradeString,
    backgroundKeepString,
    backgroundSurplusString,
    pvpIvCheckString,
    mightyCheckString,
    eventKeepersString,
    eventLeftoverTrashString,
  };
}

/**
 * Canonical bundled copy of Event Data (`src/data/events_archive.json`).
 */
export const BUNDLED_EVENTS_ARCHIVE = eventsArchiveJson.events;

/**
 * Loads the user's persisted Event Database (merging bundled `events_archive.json` with any
 * attended-flag toggles or custom user-added events stored in localStorage).
 */
export function loadStoredEventDatabase() {
  let saved = null;
  try {
    const raw =
      window.localStorage.getItem(EVENT_DB_STORAGE_KEY) ||
      window.localStorage.getItem(LEGACY_EVENT_DB_KEY);
    if (raw) saved = JSON.parse(raw);
  } catch (err) {
    console.warn('Could not read stored event database:', err);
  }

  const attendedOverrides = saved?.attendedById || {};
  const customEvents = Array.isArray(saved?.customEvents) ? saved.customEvents : [];
  const editedBundledById = saved?.editedBundledById || {};

  const mergedBundled = BUNDLED_EVENTS_ARCHIVE.map((ev) => {
    const edited = editedBundledById[ev.id] || {};
    const merged = { ...ev, ...edited, isCustom: false };
    merged.attended =
      merged.id in attendedOverrides ? Boolean(attendedOverrides[merged.id]) : Boolean(merged.attendedDefault);
    return merged;
  });

  const normalizedCustom = customEvents.map((ev) => ({
    ...ev,
    raidMegaIds: ev.raidMegaIds || ev.dexIds || [],
    regionalRareIds: ev.regionalRareIds || [],
    isCustom: true,
    attended: ev.id in attendedOverrides ? Boolean(attendedOverrides[ev.id]) : Boolean(ev.attended ?? true),
  }));

  const allEvents = [...normalizedCustom, ...mergedBundled].sort((a, b) =>
    b.start.localeCompare(a.start)
  );

  return {
    events: allEvents,
    attendedById: attendedOverrides,
    customEvents: normalizedCustom,
    editedBundledById,
  };
}

export function persistEventDatabaseState({ attendedById, customEvents, editedBundledById }) {
  try {
    window.localStorage.setItem(
      EVENT_DB_STORAGE_KEY,
      JSON.stringify({
        updatedAt: new Date().toISOString(),
        attendedById,
        customEvents,
        editedBundledById,
      })
    );
  } catch (err) {
    console.warn('Failed to persist event database:', err);
  }
}

export function resetStoredEventDatabase() {
  try {
    window.localStorage.removeItem(EVENT_DB_STORAGE_KEY);
    window.localStorage.removeItem(LEGACY_EVENT_DB_KEY);
  } catch (err) {
    console.warn('Failed to clear event database:', err);
  }
  return loadStoredEventDatabase();
}

/**
 * Builds a complete Year & Month Timeline Slicer Plan for any catch year (2023–2026+):
 * - Combined relative-age union string for attended In-Person Location Backgrounds
 * - Combined relative-age union string for attended Global Special Backgrounds
 * - Unmapped / Mystery-Date Background audit string
 * - Non-Event "Everyday Catches" 0*-2* Safe Trash (negating attended Events, Trips, CDs, AND Regionals/Rotom/Unown)
 * - 12 Monthly `ageX-Y` slices (`Jan`..`Dec`)
 */
export function computeYearSlicerPlan({
  year = 2026,
  storedEvents = [],
  communityDays = [],
  trips = [],
  includeTrips = true,
  includeCommunityDays = true,
  refDateStr = null,
  bufferMode = 'exact',
  untaggedOnly = true,
  globalBgKeepCap = 3,
}) {
  const effectiveRef = refDateStr || getTodayPlainDateString();
  const prefix = untaggedOnly ? '!#&' : '';
  const yearToken = `year${year}`;

  const yearEvents = storedEvents.filter((ev) => Number(ev.year) === Number(year));
  const attendedEvents = yearEvents.filter((ev) => ev.attended);

  const inPersonBgIntervals = [];
  const globalBgIntervals = [];
  const allKnownBgIntervals = [];
  const allProtectedEventIntervals = [];

  yearEvents.forEach((ev) => {
    const calc = calculateAgeSearchString(ev.start, ev.end, effectiveRef, { bufferMode });
    if (calc.isUpcoming) return;

    if (ev.backgroundType !== 'none') {
      allKnownBgIntervals.push(calc);
    }

    if (ev.attended) {
      allProtectedEventIntervals.push(calc);
      if (ev.backgroundType === 'locationbackground') {
        inPersonBgIntervals.push(calc);
      } else if (ev.backgroundType === 'specialbackground') {
        globalBgIntervals.push(calc);
      }
    }
  });

  if (includeTrips) {
    trips
      .filter((t) => t.start.startsWith(`${year}-`))
      .forEach((tr) => {
        const calc = calculateAgeSearchString(tr.start, tr.end, effectiveRef, { bufferMode });
        if (!calc.isUpcoming) {
          allProtectedEventIntervals.push(calc);
        }
      });
  }

  if (includeCommunityDays) {
    communityDays
      .filter((cd) => Number(cd.year) === Number(year))
      .forEach((cd) => {
        const calc = calculateAgeSearchString(cd.date, cd.date, effectiveRef, { bufferMode });
        if (!calc.isUpcoming) {
          allProtectedEventIntervals.push(calc);
        }
      });
  }

  const mergedInPersonBg = mergeAgeIntervals(inPersonBgIntervals);
  const mergedGlobalBg = mergeAgeIntervals(globalBgIntervals);
  const mergedAllKnownBg = mergeAgeIntervals(allKnownBgIntervals);
  const mergedProtectedWindows = mergeAgeIntervals(allProtectedEventIntervals);

  const inPersonAgeUnion = mergedInPersonBg.map(formatIntervalToAgeToken).join(',');
  const globalAgeUnion = mergedGlobalBg.map(formatIntervalToAgeToken).join(',');
  const allProtectedAgeUnion = mergedProtectedWindows.map(formatIntervalToAgeToken).join(',');
  const nonEventAgeNegations = mergedProtectedWindows
    .map((iv) => `!${formatIntervalToAgeToken(iv)}`)
    .join('&');
  const unmappedBgNegations = mergedAllKnownBg
    .map((iv) => `!${formatIntervalToAgeToken(iv)}`)
    .join('&');

  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];

  const monthlySlices = [];
  for (let m = 1; m <= 12; m++) {
    const mm = String(m).padStart(2, '0');
    const monthStart = `${year}-${mm}-01`;

    let daysInMonth = 30;
    if (typeof globalThis.Temporal !== 'undefined') {
      daysInMonth = globalThis.Temporal.PlainDate.from(monthStart).daysInMonth;
    } else {
      daysInMonth = new Date(year, m, 0).getDate();
    }
    const monthEnd = `${year}-${mm}-${String(daysInMonth).padStart(2, '0')}`;

    const clampedEnd = monthEnd > effectiveRef ? effectiveRef : monthEnd;
    const calc = calculateAgeSearchString(monthStart, clampedEnd, effectiveRef, { bufferMode: 'exact' });

    const eventsInMonth = yearEvents.filter(
      (ev) => ev.start.slice(0, 7) === `${year}-${mm}` || (ev.end !== 'PRESENT' && ev.end.slice(0, 7) === `${year}-${mm}`)
    );
    const cdsInMonth = communityDays.filter((cd) => Number(cd.year) === Number(year) && cd.monthNum === m);
    const tripsInMonth = trips.filter((tr) => tr.start.slice(0, 7) === `${year}-${mm}`);

    const monthEventIntervals = [];
    eventsInMonth.filter((e) => e.attended).forEach((ev) => {
      const c = calculateAgeSearchString(ev.start, ev.end, effectiveRef, { bufferMode });
      if (!c.isUpcoming) monthEventIntervals.push(c);
    });
    if (includeCommunityDays) {
      cdsInMonth.forEach((cd) => {
        const c = calculateAgeSearchString(cd.date, cd.date, effectiveRef, { bufferMode });
        if (!c.isUpcoming) monthEventIntervals.push(c);
      });
    }
    if (includeTrips) {
      tripsInMonth.forEach((tr) => {
        const c = calculateAgeSearchString(tr.start, tr.end, effectiveRef, { bufferMode });
        if (!c.isUpcoming) monthEventIntervals.push(c);
      });
    }
    const mergedMonthExclusions = mergeAgeIntervals(monthEventIntervals);
    const monthNegationPart = mergedMonthExclusions
      .map((iv) => `&!${formatIntervalToAgeToken(iv)}`)
      .join('');

    monthlySlices.push({
      monthNum: m,
      monthName: monthNames[m - 1],
      startDate: monthStart,
      endDate: clampedEnd,
      isUpcoming: calc.isUpcoming,
      ageToken: calc.ageToken,
      eventsInMonth,
      cdsInMonth,
      tripsInMonth,
      monthAllString: `${prefix}${yearToken}&${calc.ageToken}`,
      monthEverydayTrashString: `${prefix}${yearToken}&${calc.ageToken}${monthNegationPart}&0*,1*,2*&${GLOBAL_REGIONAL_NEGATION}&!shiny&!background&!locationbackground&!specialbackground&!costume&!shadow&!purified&!dynamax&!gigantamax&!favorite&!lucky&!4*&!legendary&!mythical&!ultra beasts&!@special`,
    });
  }

  const baseTrashTail = `0*,1*,2*&${GLOBAL_REGIONAL_NEGATION}&!shiny&!background&!locationbackground&!specialbackground&!costume&!shadow&!purified&!dynamax&!gigantamax&!favorite&!lucky&!4*&!legendary&!mythical&!ultra beasts&!@special`;

  return {
    year,
    attendedEventsCount: attendedEvents.length,
    totalYearEventsCount: yearEvents.length,
    mergedProtectedWindowsCount: mergedProtectedWindows.length,
    strings: {
      inPersonBgCombined: inPersonAgeUnion
        ? `${prefix}!traded&${yearToken}&locationbackground&${inPersonAgeUnion}&!4*`
        : `${prefix}!traded&${yearToken}&locationbackground&!4*`,
      globalBgKeepCombined: globalAgeUnion
        ? `${prefix}!traded&${yearToken}&specialbackground&!locationbackground&${globalAgeUnion}&!shiny&!4*&count-${globalBgKeepCap}`
        : `${prefix}!traded&${yearToken}&specialbackground&!locationbackground&!shiny&!4*&count-${globalBgKeepCap}`,
      globalBgPurgeCombined: globalAgeUnion
        ? `${prefix}${yearToken}&specialbackground&!locationbackground&${globalAgeUnion}&!shiny&!4*&0*,1*,2*&count${globalBgKeepCap + 1}-&!favorite&!lucky`
        : `${prefix}${yearToken}&specialbackground&!locationbackground&!shiny&!4*&0*,1*,2*&count${globalBgKeepCap + 1}-&!favorite&!lucky`,
      unmappedBgAudit: unmappedBgNegations
        ? `${prefix}${yearToken}&background&${unmappedBgNegations}`
        : `${prefix}${yearToken}&background`,
      allAttendedEventsUnion: allProtectedAgeUnion
        ? `${prefix}${yearToken}&${allProtectedAgeUnion}`
        : `${prefix}${yearToken}`,
      everydayNonEventAll: nonEventAgeNegations
        ? `${prefix}${yearToken}&${nonEventAgeNegations}`
        : `${prefix}${yearToken}`,
      everydayNonEventTrash0to2: nonEventAgeNegations
        ? `${prefix}${yearToken}&${nonEventAgeNegations}&${baseTrashTail}`
        : `${prefix}${yearToken}&${baseTrashTail}`,
    },
    monthlySlices,
  };
}

export const LOCATION_BACKGROUND_EVENTS = BUNDLED_EVENTS_ARCHIVE.filter(
  (ev) => ev.backgroundType === 'locationbackground'
).map((ev) => ({
  ...ev,
  category: ev.series,
  extraTokens: ['locationbackground', '!traded'],
}));

/**
 * Personal Travel Trips Registry (2022–2026, synchronized with src/trip_registry.py)
 */
export const TRAVEL_TRIPS = [
  // 2026
  { tag: 'Japan 26', event_name: 'Japan Vacation 2026', start: '2026-06-17', end: '2026-07-01', location: 'Tokyo, Kyoto, Osaka, Hokkaido, Okinawa' },
  { tag: 'Kyla Wed 26', event_name: 'Kyla Wedding', start: '2026-06-13', end: '2026-06-13', location: 'Boulder, Colorado' },
  { tag: 'GF Chi 26', event_name: 'GO Fest Chicago', start: '2026-06-05', end: '2026-06-07', location: 'Chicago, Illinois' },
  { tag: 'EDC 26', event_name: 'EDC Las Vegas 2026', start: '2026-05-15', end: '2026-05-18', location: 'Las Vegas, Nevada' },
  { tag: 'Dis Ana 26', event_name: 'Disney Anaheim', start: '2026-05-01', end: '2026-05-01', location: 'Anaheim, California' },
  { tag: 'Chella 26', event_name: 'Coachella 2026', start: '2026-04-16', end: '2026-04-19', location: 'Indio, California' },
  { tag: 'GT LA 26', event_name: 'GO Tour: Kalos - LA', start: '2026-02-20', end: '2026-02-22', location: 'Pasadena / LA, California' },
  { tag: 'Tiff Wed 26', event_name: 'Tiffany Wedding', start: '2026-01-16', end: '2026-01-18', location: 'Houston, Texas' },

  // 2025
  { tag: 'Alex Wed 25', event_name: 'Alex Wedding', start: '2025-12-17', end: '2025-12-17', location: 'Riverside, California' },
  { tag: 'LGR LA 25', event_name: 'LGR LA', start: '2025-12-13', end: '2025-12-13', location: 'Los Angeles, California' },
  { tag: 'SF 25', event_name: 'San Francisco', start: '2025-12-05', end: '2025-12-07', location: 'San Francisco, California' },
  { tag: 'Nitehart 25', event_name: 'Niteharts SD', start: '2025-10-11', end: '2025-10-12', location: 'San Diego, California' },
  { tag: 'Lolla 25', event_name: 'Lollapalooza Chicago', start: '2025-07-31', end: '2025-08-04', location: 'Chicago, Illinois' },
  { tag: 'SDCC 25', event_name: 'Comic-Con San Diego', start: '2025-07-24', end: '2025-07-27', location: 'San Diego, California' },
  { tag: 'Pride SD 25', event_name: 'SD Pride', start: '2025-07-19', end: '2025-07-19', location: 'San Diego, California' },
  { tag: 'Kdot LA 25', event_name: 'Kendrick LA', start: '2025-05-23', end: '2025-05-24', location: 'Los Angeles, California' },
  { tag: 'EDC 25', event_name: 'EDC Las Vegas 2025', start: '2025-05-16', end: '2025-05-19', location: 'Las Vegas, Nevada' },
  { tag: 'Hana SD 25', event_name: 'Hana John SD', start: '2025-05-09', end: '2025-05-11', location: 'San Diego, California' },
  { tag: 'Macy OC 25', event_name: 'Macys OC', start: '2025-03-15', end: '2025-03-15', location: 'Orange County, California' },
  { tag: 'GT LA 25', event_name: 'GO Tour: Unova - LA', start: '2025-02-21', end: '2025-02-23', location: 'Pasadena / LA, California' },
  { tag: 'BigBear 25', event_name: 'Big Bear Trip', start: '2025-02-14', end: '2025-02-16', location: 'Big Bear, California' },

  // 2024
  { tag: 'Carat LA 24', event_name: 'Seventeen Concert LA', start: '2024-11-09', end: '2024-11-09', location: 'Los Angeles, California' },
  { tag: 'SM 24', event_name: 'Santa Monica Trip', start: '2024-10-20', end: '2024-10-20', location: 'Santa Monica, California' },
  { tag: 'Yosemite 24', event_name: 'Yosemite Trip', start: '2024-09-27', end: '2024-09-29', location: 'Yosemite, California' },
  { tag: 'NYC 24', event_name: 'New York Trip', start: '2024-09-12', end: '2024-09-14', location: 'New York, NYC' },
  { tag: 'AX LA 24', event_name: 'Anime Expo LA 2024', start: '2024-07-03', end: '2024-07-07', location: 'Los Angeles, California' },
  { tag: 'Odesza 24', event_name: 'Odesza LA', start: '2024-06-08', end: '2024-06-08', location: 'Los Angeles, California' },
  { tag: 'EDC 24', event_name: 'EDC Las Vegas 2024', start: '2024-05-17', end: '2024-05-19', location: 'Las Vegas, Nevada' },
  { tag: 'Chella 24', event_name: 'Coachella 2024', start: '2024-04-12', end: '2024-04-14', location: 'Indio, California' },
  { tag: 'Japan 24', event_name: 'Japan Trip 2024', start: '2024-03-21', end: '2024-04-07', location: 'Tokyo, Kyoto, Osaka' },
  { tag: 'Ori Wed 24', event_name: 'Oriessa Wedding', start: '2024-02-23', end: '2024-02-23', location: 'Fallbrook, California' },
  { tag: 'GT LA 24', event_name: 'GO Tour: Sinnoh - LA', start: '2024-02-17', end: '2024-02-18', location: 'Pasadena / LA, California' },

  // 2023
  { tag: 'Dis LA 23', event_name: 'Disney LA', start: '2023-12-20', end: '2023-12-22', location: 'Anaheim, California' },
  { tag: 'Japan 23', event_name: 'Japan Trip 2023', start: '2023-10-23', end: '2023-11-10', location: 'Tokyo, Kyoto, Osaka' },
  { tag: 'SEA 23', event_name: 'Seattle Trip (Sep)', start: '2023-09-22', end: '2023-09-24', location: 'Seattle, Washington' },
  { tag: 'Val LA 23', event_name: 'Valorant Finals LA', start: '2023-08-25', end: '2023-08-25', location: 'Los Angeles, California' },
  { tag: 'Lolla 23', event_name: 'Lollapalooza Chicago', start: '2023-08-03', end: '2023-08-07', location: 'Chicago, Illinois' },
  { tag: 'AX LA 23', event_name: 'Anime Expo LA 2023', start: '2023-06-30', end: '2023-07-04', location: 'Los Angeles, California' },
  { tag: 'SEA 23', event_name: 'Seattle Trip (May)', start: '2023-05-26', end: '2023-05-29', location: 'Seattle, Washington' },
  { tag: 'OAK 23', event_name: 'Oakland Trip', start: '2023-03-17', end: '2023-03-19', location: 'Oakland, California' },

  // 2022
  { tag: 'SF 22', event_name: 'San Francisco (Nov)', start: '2022-11-14', end: '2022-11-17', location: 'San Francisco, California' },
  { tag: 'LA 22', event_name: 'Los Angeles', start: '2022-11-04', end: '2022-11-04', location: 'Los Angeles, California' },
  { tag: 'Korea 22', event_name: 'Korea Trip 2022', start: '2022-09-12', end: '2022-09-28', location: 'Seoul, Incheon, Busan' },
];

export const MAJOR_GLOBAL_EVENTS = BUNDLED_EVENTS_ARCHIVE.filter((ev) => ev.scope === 'global').map(
  (ev) => ({
    tag: ev.tag,
    event_name: ev.name,
    start: ev.start,
    end: ev.end,
    backgroundType: ev.backgroundType,
  })
);
