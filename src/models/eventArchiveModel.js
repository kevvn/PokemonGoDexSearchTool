/**
 * Event, Background, Special Pokémon & Travel Trip Registry + Offline Age Slicer Model.
 * Uses native `globalThis.Temporal` when supported and falls back to exact pure-calendar Rata Die
 * + local wall-clock 24h rolling calculations with zero external CDN dependencies.
 */
import eventsArchiveJson from '../data/events_archive.json';
import { TRAVEL_TRIPS } from '../data/travelTripsData';
import { GLOBAL_REGIONAL_ROTOM_UNOWN_IDS } from '../data/speciesConstants';
import { MAX_POKEDEX_ID } from './familyModel';
import {
  compressIdRanges,
  negateCompressedRanges,
} from './searchEngine';
import { buildSafeTrashQuery } from './triageFunnelModel';
import { createPersistentStore } from './storage/createPersistentStore';

export { TRAVEL_TRIPS, GLOBAL_REGIONAL_ROTOM_UNOWN_IDS };

const EVENT_DB_STORAGE_KEY = 'pogo_stored_event_db_v2';
const LEGACY_EVENT_DB_KEY = 'pogo_stored_event_db_v1';
const TRAVEL_TRIPS_STORAGE_KEY = 'pogo_personal_travel_trips_v1';

export const GLOBAL_REGIONAL_ROTOM_UNOWN_RANGES = compressIdRanges(GLOBAL_REGIONAL_ROTOM_UNOWN_IDS);
const GLOBAL_REGIONAL_NEGATION = negateCompressedRanges(GLOBAL_REGIONAL_ROTOM_UNOWN_RANGES);

const MS_PER_HOUR = 60 * 60 * 1000;
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export function isValidIsoDateString(str) {
  if (typeof str !== 'string' || !ISO_DATE_REGEX.test(str)) return false;
  const [y, m, d] = str.split('-').map(Number);
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  const check = new Date(Date.UTC(y, m - 1, d));
  return (
    check.getUTCFullYear() === y &&
    check.getUTCMonth() === m - 1 &&
    check.getUTCDate() === d
  );
}

/**
 * Pure calendar Rata Die day count avoiding Date('YYYY-MM-DD') UTC-midnight timezone shift bugs.
 */
function calendarDaysFromYMD(isoStr) {
  const safeStr = isValidIsoDateString(isoStr) ? isoStr : getTodayPlainDateString();
  const [y, m, d] = safeStr.split('-').map(Number);
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

function parseYmdParts(isoStr) {
  const safeStr = isValidIsoDateString(isoStr) ? isoStr : getTodayPlainDateString();
  const [year, month, day] = safeStr.split('-').map(Number);
  return { year, month, day };
}

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
 * Calculates Pokémon GO `ageX-Y` search string for [startDateStr, endDateStr] relative to refDateStr.
 */
export function calculateAgeSearchString(startDateStr, endDateStr, refDateStr = null, options = {}) {
  const todayStr = getTodayPlainDateString();
  const effectiveRef = isValidIsoDateString(refDateStr) ? refDateStr : todayStr;
  const safeStart = isValidIsoDateString(startDateStr) ? startDateStr : effectiveRef;
  const rawEnd = endDateStr === 'PRESENT' ? effectiveRef : endDateStr || safeStart;
  const effectiveEnd = isValidIsoDateString(rawEnd) ? rawEnd : safeStart;
  const bufferMode = options.bufferMode || 'evening-safe';

  let moreDaysAgo = 0;
  let fewerDaysAgo = 0;
  let humanSpan = '';
  let isUpcoming = false;
  let usedLiveZonedRolling = false;

  if (typeof globalThis.Temporal !== 'undefined') {
    const Temporal = globalThis.Temporal;
    const refDate = Temporal.PlainDate.from(effectiveRef);
    const startDate = Temporal.PlainDate.from(safeStart);
    const endDate = Temporal.PlainDate.from(effectiveEnd);

    const sinceStart = refDate.since(startDate, { largestUnit: 'day' });
    const sinceEnd = refDate.since(endDate, { largestUnit: 'day' });

    isUpcoming = sinceStart.sign < 0;
    moreDaysAgo = Math.max(0, sinceStart.days);
    fewerDaysAgo = Math.max(0, sinceEnd.days);

    if (!isUpcoming && effectiveRef === todayStr && bufferMode === 'evening-safe') {
      try {
        const nowZdt = Temporal.Now.zonedDateTimeISO();
        const tz = nowZdt.timeZoneId;
        const startZdt = startDate.toZonedDateTime({ timeZone: tz, plainTime: '00:00:00' });
        const endZdt = endDate.toZonedDateTime({ timeZone: tz, plainTime: '23:59:59' });
        const hoursSinceStart = nowZdt.since(startZdt, { largestUnit: 'hour' }).hours;
        const hoursSinceEnd = nowZdt.since(endZdt, { largestUnit: 'hour' }).hours;
        moreDaysAgo = Math.max(0, Math.floor(hoursSinceStart / 24));
        fewerDaysAgo = Math.max(0, Math.floor(hoursSinceEnd / 24));
        usedLiveZonedRolling = true;
      } catch {
        // Fall back to calendar envelope below
      }
    }

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
    const startJd = calendarDaysFromYMD(safeStart);
    const endJd = calendarDaysFromYMD(effectiveEnd);
    isUpcoming = refJd - startJd < 0;
    moreDaysAgo = Math.max(0, refJd - startJd);
    fewerDaysAgo = Math.max(0, refJd - endJd);

    if (!isUpcoming && effectiveRef === todayStr && bufferMode === 'evening-safe') {
      const s = parseYmdParts(safeStart);
      const e = parseYmdParts(effectiveEnd);
      const nowMs = Date.now();
      const startWall = new Date(s.year, s.month - 1, s.day, 0, 0, 0, 0).getTime();
      const endWall = new Date(e.year, e.month - 1, e.day, 23, 59, 59, 999).getTime();
      if (Number.isFinite(startWall) && Number.isFinite(endWall)) {
        moreDaysAgo = Math.max(0, Math.floor((nowMs - startWall) / (24 * MS_PER_HOUR)));
        fewerDaysAgo = Math.max(0, Math.floor((nowMs - endWall) / (24 * MS_PER_HOUR)));
        usedLiveZonedRolling = true;
      }
    }

    if (isUpcoming) {
      humanSpan = `In ${Math.abs(refJd - startJd)}d`;
    } else if (moreDaysAgo === 0) {
      humanSpan = 'Today';
    } else {
      humanSpan = `${moreDaysAgo}d ago`;
    }
  }

  let minAge = Math.min(fewerDaysAgo, moreDaysAgo);
  let maxAge = Math.max(fewerDaysAgo, moreDaysAgo);

  if (!isUpcoming) {
    if (bufferMode === 'evening-safe' && !usedLiveZonedRolling) {
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
    startDate: safeStart,
    endDate: effectiveEnd,
    humanSpan,
    isUpcoming,
  };
}

/**
 * Helper for safe Global Special Background surplus purging — routes through `buildSafeTrashQuery`
 * so Mythicals, Shadows, Max Battle (G-Max/Eternatus), Fusions, Adventure Effects, @special,
 * Costumes, XXL/XXS, Babies, 100km+ Distance, Buddies, XL-Powered, PvP IVs & Nundos are ALWAYS shielded.
 */
function buildGlobalBgSurplusTrashQuery({ scopePrefix, ageOrUnionToken, speciesRange = '', untaggedOnly = true }) {
  const extra = [
    ...(speciesRange ? [speciesRange] : []),
    'specialbackground',
    '!locationbackground',
    ...(ageOrUnionToken ? [ageOrUnionToken] : []),
  ];
  return buildSafeTrashQuery({
    ageScope: scopePrefix || '',
    starScope: '0*,1*,2*',
    includeIvShields: true,
    extraExclusions: extra,
    safetyShields: {
      untagged: untaggedOnly,
      background: false,
      legendary: false,
      ultrabeast: false,
      rareSpecies: false,
    },
  });
}

export function buildEventActionStrings(eventItem, refDateStr, options = {}) {
  const {
    untaggedOnly = true,
    bufferMode = 'evening-safe',
    constrainFeaturedSpecies = false,
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

  const raidAndMegaString = raidMegaRange
    ? `${prefix}${ageCalc.ageToken}&${raidMegaRange}`
    : `${prefix}${ageCalc.ageToken}&raid,maxmove1-,legendary,mythical,ultrabeast`;

  const regionalAndRareTradeString = regionalRareRange
    ? `${prefix}!traded&${ageCalc.ageToken}&${regionalRareRange}`
    : null;

  let backgroundKeepString = null;
  let backgroundSurplusString = null;

  if (eventItem.backgroundType === 'locationbackground') {
    backgroundKeepString = `${prefix}${speciesPart}locationbackground&${ageCalc.ageToken}`;
  } else if (eventItem.backgroundType === 'specialbackground') {
    backgroundKeepString = `${prefix}${speciesPart}specialbackground&!locationbackground&${ageCalc.ageToken}`;
    backgroundSurplusString = buildGlobalBgSurplusTrashQuery({
      scopePrefix: '',
      ageOrUnionToken: ageCalc.ageToken,
      speciesRange: constrainFeaturedSpecies && allSpecialRange ? allSpecialRange : '',
      untaggedOnly: true,
    });
  }

  const pvpIvCheckString = `${prefix}${ageCalc.ageToken}&0-1attack&3-4defense&3-4hp&cp-2500`;
  // Mighty Pokémon have a guaranteed 13/13/13 IV floor (3-4attack&3-4defense&3-4hp) regardless of base-stat CP!
  const mightyCheckString = eventItem.hasMighty
    ? `${prefix}${ageCalc.ageToken}&3*,4*&3-4attack&3-4defense&3-4hp`
    : null;

  const remoteGuard =
    eventItem.scope === 'in-person' || eventItem.scope === 'personal-trip' ? '&!remoteraid' : '';
  const eventKeepersString = `${prefix}${ageCalc.ageToken}&shiny,4*,background,costume,maxmove1-,legendary,mythical,ultrabeast${remoteGuard}`;

  const protectedEventNegations = negateCompressedRanges(allSpecialRange);
  const extraExclusions = [
    GLOBAL_REGIONAL_NEGATION,
    ...(protectedEventNegations ? [protectedEventNegations] : []),
  ].filter(Boolean);

  const eventLeftoverTrashString = buildSafeTrashQuery({
    ageScope: ageCalc.ageToken,
    starScope: '0*,1*,2*',
    includeIvShields: true,
    extraExclusions,
    safetyShields: { untagged: untaggedOnly },
  });

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

export const BUNDLED_EVENTS_ARCHIVE = eventsArchiveJson.events;

function createDefaultRawEventState() {
  return {
    attendedById: {},
    customEvents: [],
    editedBundledById: {},
  };
}

function sanitizeDexIdArray(arr) {
  if (!Array.isArray(arr)) return [];
  const maxAllowed = Math.max(MAX_POKEDEX_ID, 2000);
  return Array.from(
    new Set(
      arr
        .map((n) => Number(n))
        .filter((n) => Number.isInteger(n) && n >= 1 && n <= maxAllowed)
    )
  ).sort((a, b) => a - b);
}

function sanitizeEventRecord(ev, fallbackDate) {
  if (!ev || typeof ev !== 'object' || Array.isArray(ev)) return null;
  if (typeof ev.id !== 'string' || !ev.id.trim()) return null;
  if (typeof ev.name !== 'string' || !ev.name.trim()) return null;

  const start = isValidIsoDateString(ev.start) ? ev.start : fallbackDate;
  const end =
    ev.end === 'PRESENT' || isValidIsoDateString(ev.end) ? ev.end : start;
  const year = Number(start.slice(0, 4)) || Number(ev.year) || new Date().getFullYear();

  const raidMegaIds = sanitizeDexIdArray(ev.raidMegaIds ?? ev.dexIds);
  const regionalRareIds = sanitizeDexIdArray(ev.regionalRareIds);
  const dexIds = Array.from(
    new Set([...raidMegaIds, ...regionalRareIds, ...sanitizeDexIdArray(ev.dexIds)])
  ).sort((a, b) => a - b);

  return {
    id: ev.id.trim(),
    name: ev.name.trim(),
    tag: String(ev.tag || 'Event').trim().slice(0, 16) || 'Event',
    year,
    start,
    end,
    scope: ['in-person', 'global', 'personal-trip'].includes(ev.scope) ? ev.scope : 'global',
    series: typeof ev.series === 'string' && ev.series.trim() ? ev.series.trim() : 'City & Special',
    backgroundType: ['locationbackground', 'specialbackground', 'none'].includes(ev.backgroundType)
      ? ev.backgroundType
      : 'none',
    location: typeof ev.location === 'string' && ev.location.trim() ? ev.location.trim() : 'Worldwide',
    raidMegaIds,
    regionalRareIds,
    dexIds,
    raidSummary: typeof ev.raidSummary === 'string' ? ev.raidSummary.trim() : '',
    specialSummary: typeof ev.specialSummary === 'string' ? ev.specialSummary.trim() : '',
    featuredSpecies:
      typeof ev.featuredSpecies === 'string'
        ? ev.featuredSpecies.trim()
        : [ev.raidSummary, ev.specialSummary].filter((s) => typeof s === 'string' && s.trim()).join(' • '),
    hasMighty: Boolean(ev.hasMighty),
    attended: typeof ev.attended === 'boolean' ? ev.attended : true,
  };
}

function normalizeRawEventState(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return createDefaultRawEventState();
  const fallbackDate = getTodayPlainDateString();

  const attendedById = {};
  if (raw.attendedById && typeof raw.attendedById === 'object' && !Array.isArray(raw.attendedById)) {
    for (const [k, v] of Object.entries(raw.attendedById)) {
      if (typeof k === 'string' && k.trim()) {
        attendedById[k] = Boolean(v);
      }
    }
  }

  const customEvents = Array.isArray(raw.customEvents)
    ? raw.customEvents.map((ev) => sanitizeEventRecord(ev, fallbackDate)).filter(Boolean)
    : [];

  const editedBundledById = {};
  if (
    raw.editedBundledById &&
    typeof raw.editedBundledById === 'object' &&
    !Array.isArray(raw.editedBundledById)
  ) {
    for (const [k, v] of Object.entries(raw.editedBundledById)) {
      const sanitized = sanitizeEventRecord(v && typeof v === 'object' ? { ...v, id: v.id || k } : null, fallbackDate);
      if (sanitized) {
        editedBundledById[k] = sanitized;
      }
    }
  }

  return { attendedById, customEvents, editedBundledById };
}

export function buildEventDatabaseSnapshot(rawState) {
  const saved = normalizeRawEventState(rawState);
  const attendedOverrides = saved.attendedById;
  const customEvents = saved.customEvents;
  const editedBundledById = saved.editedBundledById;

  const mergedBundled = BUNDLED_EVENTS_ARCHIVE.map((ev) => {
    const edited = editedBundledById[ev.id] || {};
    const merged = { ...ev, ...edited, isCustom: false };
    merged.attended =
      merged.id in attendedOverrides
        ? Boolean(attendedOverrides[merged.id])
        : Boolean(merged.attendedDefault);
    return merged;
  });

  const normalizedCustom = customEvents.map((ev) => ({
    ...ev,
    raidMegaIds: ev.raidMegaIds || ev.dexIds || [],
    regionalRareIds: ev.regionalRareIds || [],
    isCustom: true,
    attended:
      ev.id in attendedOverrides ? Boolean(attendedOverrides[ev.id]) : Boolean(ev.attended ?? true),
  }));

  const allEvents = [...normalizedCustom, ...mergedBundled].sort((a, b) =>
    String(b.start || '').localeCompare(String(a.start || ''))
  );

  return {
    events: allEvents,
    attendedById: attendedOverrides,
    customEvents: normalizedCustom,
    editedBundledById,
  };
}

export const eventArchiveStore = createPersistentStore({
  key: EVENT_DB_STORAGE_KEY,
  legacyKeys: [LEGACY_EVENT_DB_KEY],
  getDefaultValue: createDefaultRawEventState,
  deserialize: (raw) => normalizeRawEventState(JSON.parse(raw)),
  serialize: (val) =>
    JSON.stringify({
      updatedAt: new Date().toISOString(),
      ...normalizeRawEventState(val),
    }),
});

/**
 * Editable personal travel trips store (starts empty or user-loaded with sample trips
 * so another player's trips never silently alter unrelated users' timelines).
 */
function sanitizeTravelTrip(trip) {
  if (!trip || typeof trip !== 'object') return null;
  const eventName = String(trip.event_name || trip.name || '').trim();
  const tag = String(trip.tag || '').trim();
  if (!eventName || !isValidIsoDateString(trip.start)) return null;
  const end = isValidIsoDateString(trip.end) ? trip.end : trip.start;
  return {
    tag: (tag || eventName.slice(0, 12)).slice(0, 16),
    event_name: eventName,
    start: trip.start,
    end: end < trip.start ? trip.start : end,
    location: String(trip.location || '').trim() || 'Travel',
  };
}

export const travelTripsStore = createPersistentStore({
  key: TRAVEL_TRIPS_STORAGE_KEY,
  schemaVersion: 1,
  getDefaultValue: () => TRAVEL_TRIPS.map((t) => ({ ...t })),
  deserialize: (raw) => {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(sanitizeTravelTrip).filter(Boolean);
  },
  migrate: (oldData) =>
    Array.isArray(oldData) ? oldData.map(sanitizeTravelTrip).filter(Boolean) : [],
});

export function addTravelTrip(tripForm) {
  const clean = sanitizeTravelTrip(tripForm);
  if (!clean) return { ok: false, error: 'Trip requires a valid name and YYYY-MM-DD start date.' };
  travelTripsStore.setState((prev) =>
    [clean, ...prev].sort((a, b) => String(b.start).localeCompare(String(a.start)))
  );
  return { ok: true, trip: clean };
}

export function deleteTravelTrip(tag, start) {
  travelTripsStore.setState((prev) =>
    prev.filter((t) => !(t.tag === tag && t.start === start))
  );
}

export function clearTravelTrips() {
  travelTripsStore.setState([]);
}

export function restoreSampleTravelTrips() {
  travelTripsStore.setState(TRAVEL_TRIPS.map((t) => ({ ...t })));
}

export function parseDexIdListInput(str) {
  const maxAllowed = Math.max(MAX_POKEDEX_ID, 2000);
  return String(str || '')
    .split(/[\s,]+/)
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isInteger(n) && n >= 1 && n <= maxAllowed);
}

export function toggleEventAttended(eventId) {
  eventArchiveStore.setState((prev) => {
    const currentDb = buildEventDatabaseSnapshot(prev);
    const current = currentDb.events.find((e) => e.id === eventId);
    const nextVal = current ? !current.attended : true;
    return {
      ...prev,
      attendedById: { ...prev.attendedById, [eventId]: nextVal },
    };
  });
}

export function saveEventEntry(eventForm) {
  const fallbackDate = getTodayPlainDateString();
  const safeStart = isValidIsoDateString(eventForm.start) ? eventForm.start : fallbackDate;
  const safeEnd =
    eventForm.end === 'PRESENT' || isValidIsoDateString(eventForm.end)
      ? eventForm.end
      : safeStart;

  const raidMegaIds = parseDexIdListInput(eventForm.raidMegaIdsText);
  const regionalRareIds = parseDexIdListInput(eventForm.regionalRareIdsText);
  const dexIds = Array.from(new Set([...raidMegaIds, ...regionalRareIds]));
  const yearFromStart =
    Number(safeStart.slice(0, 4)) || Number(eventForm.year) || new Date().getFullYear();

  const cleanEntry = {
    id: eventForm.id || `custom-${Date.now()}`,
    name: (eventForm.name || '').trim() || 'Untitled Event',
    tag: ((eventForm.tag || '').trim() || 'Event').slice(0, 12),
    year: yearFromStart,
    start: safeStart,
    end: safeEnd,
    scope: eventForm.scope || 'global',
    series: eventForm.series || 'City & Special',
    backgroundType: eventForm.backgroundType || 'none',
    location: (eventForm.location || '').trim() || 'Worldwide',
    raidMegaIds,
    regionalRareIds,
    dexIds,
    raidSummary: (eventForm.raidSummary || '').trim(),
    specialSummary: (eventForm.specialSummary || '').trim(),
    featuredSpecies: [(eventForm.raidSummary || '').trim(), (eventForm.specialSummary || '').trim()]
      .filter(Boolean)
      .join(' • '),
    hasMighty: Boolean(eventForm.hasMighty),
    attended: Boolean(eventForm.attended),
  };

  eventArchiveStore.setState((prev) => {
    const currentDb = buildEventDatabaseSnapshot(prev);
    const nextAttendedById = { ...prev.attendedById, [cleanEntry.id]: cleanEntry.attended };
    const nextCustom = [...prev.customEvents];
    const nextEditedBundled = { ...prev.editedBundledById };

    const isBundled = currentDb.events.some((item) => item.id === cleanEntry.id && !item.isCustom);
    if (isBundled) {
      nextEditedBundled[cleanEntry.id] = cleanEntry;
    } else {
      const existingIdx = nextCustom.findIndex((c) => c.id === cleanEntry.id);
      if (existingIdx >= 0) nextCustom[existingIdx] = { ...cleanEntry, isCustom: true };
      else nextCustom.unshift({ ...cleanEntry, isCustom: true });
    }

    return {
      attendedById: nextAttendedById,
      customEvents: nextCustom,
      editedBundledById: nextEditedBundled,
    };
  });

  return cleanEntry;
}

export function deleteCustomEvent(eventId) {
  eventArchiveStore.setState((prev) => ({
    ...prev,
    customEvents: prev.customEvents.filter((c) => c.id !== eventId),
  }));
}

export function importEventDatabasePayload(parsed) {
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { ok: false, error: 'Invalid event database JSON: expected an object payload.' };
  }

  const hasRecognizedKey =
    'attendedById' in parsed || 'customEvents' in parsed || 'editedBundledById' in parsed;
  if (!hasRecognizedKey) {
    return {
      ok: false,
      error: 'Invalid event database JSON: missing attendedById, customEvents, or editedBundledById.',
    };
  }

  if (parsed.customEvents !== undefined && !Array.isArray(parsed.customEvents)) {
    return { ok: false, error: 'Invalid event database JSON: customEvents must be an array.' };
  }

  const rawCustomCount = Array.isArray(parsed.customEvents) ? parsed.customEvents.length : 0;
  const nextRaw = normalizeRawEventState({
    attendedById: parsed.attendedById || {},
    customEvents: Array.isArray(parsed.customEvents) ? parsed.customEvents : [],
    editedBundledById: parsed.editedBundledById || {},
  });

  if (rawCustomCount > 0 && nextRaw.customEvents.length === 0) {
    return {
      ok: false,
      error: 'Invalid event database JSON: none of the customEvents entries had valid id/name fields.',
    };
  }

  eventArchiveStore.setState(nextRaw);
  const snapshot = buildEventDatabaseSnapshot(nextRaw);
  return {
    ok: true,
    snapshot,
    droppedCustomCount: rawCustomCount - nextRaw.customEvents.length,
  };
}

export function exportEventDatabasePayload(eventDb) {
  return {
    exportedAt: new Date().toISOString(),
    events: eventDb.events,
    attendedById: eventDb.attendedById,
    customEvents: eventDb.customEvents,
    editedBundledById: eventDb.editedBundledById,
  };
}

export function resetEventDatabase() {
  const raw = eventArchiveStore.reset();
  return buildEventDatabaseSnapshot(raw);
}

/**
 * Derive available years dynamically from bundled/custom events, Community Days, and Trips
 * so future years (2027+) appear automatically without editing hardcoded UI arrays.
 */
export function getAvailableEventYears({ events = [], communityDays = [], trips = [] } = {}) {
  const years = new Set([new Date().getFullYear()]);
  for (const ev of events) {
    const y = Number(ev?.year || String(ev?.start || '').slice(0, 4));
    if (Number.isInteger(y) && y >= 2016) years.add(y);
  }
  for (const cd of communityDays) {
    const y = Number(cd?.year);
    if (Number.isInteger(y) && y >= 2016) years.add(y);
  }
  for (const tr of trips) {
    const y = Number(String(tr?.start || '').slice(0, 4));
    if (Number.isInteger(y) && y >= 2016) years.add(y);
  }
  return Array.from(years).sort((a, b) => b - a);
}

function dateRangeOverlaps(startA, endA, startB, endB) {
  if (!startA || !endA || !startB || !endB) return false;
  return startA <= endB && endA >= startB;
}

export function computeYearSlicerPlan({
  year = new Date().getFullYear(),
  storedEvents = [],
  communityDays = [],
  trips = [],
  includeTrips = false,
  includeCommunityDays = true,
  refDateStr = null,
  bufferMode = 'evening-safe',
  untaggedOnly = true,
}) {
  const effectiveRef = isValidIsoDateString(refDateStr) ? refDateStr : getTodayPlainDateString();
  const prefix = untaggedOnly ? '!#&' : '';
  const yearToken = `year${year}`;
  const yearStart = `${year}-01-01`;
  const yearEnd = `${year}-12-31`;

  // Always use ±1d safety buffer for protective `!ageX-Y` exclusions so timezone / remote raid
  // shifts NEVER leak protected event catches into everyday non-event trash queries.
  const protectiveBufferMode = 'plus-minus-1';

  const yearEvents = storedEvents.filter((ev) => {
    const evStart = ev.start || '';
    const evEnd = ev.end === 'PRESENT' ? effectiveRef : ev.end || evStart;
    return Number(ev.year) === Number(year) || dateRangeOverlaps(evStart, evEnd, yearStart, yearEnd);
  });
  const attendedEvents = yearEvents.filter((ev) => ev.attended);

  const inPersonBgIntervals = [];
  const globalBgIntervals = [];
  const allKnownBgIntervals = [];
  const allProtectedEventIntervals = [];

  yearEvents.forEach((ev) => {
    const isOngoingVenue = ev.end === 'PRESENT';
    const calc = calculateAgeSearchString(ev.start, ev.end, effectiveRef, { bufferMode });
    if (calc.isUpcoming) return;

    if (ev.backgroundType !== 'none' && !isOngoingVenue) {
      allKnownBgIntervals.push(calc);
    }

    if (ev.attended) {
      // Ongoing multi-month venues (e.g., end === 'PRESENT') must NOT blanket-exclude the entire
      // rest of the year from Everyday Non-Event Trash; their location backgrounds are already
      // shielded by `!background` in buildSafeTrashQuery!
      if (!isOngoingVenue) {
        const protectedCalc = calculateAgeSearchString(ev.start, ev.end, effectiveRef, {
          bufferMode: protectiveBufferMode,
        });
        if (!protectedCalc.isUpcoming) {
          allProtectedEventIntervals.push(protectedCalc);
        }
      }
      if (ev.backgroundType === 'locationbackground') {
        inPersonBgIntervals.push(calc);
      } else if (ev.backgroundType === 'specialbackground') {
        globalBgIntervals.push(calc);
      }
    }
  });

  if (includeTrips) {
    trips
      .filter((t) => dateRangeOverlaps(t.start, t.end || t.start, yearStart, yearEnd))
      .forEach((tr) => {
        const clampedStart = tr.start < yearStart ? yearStart : tr.start;
        const clampedEnd = (tr.end || tr.start) > yearEnd ? yearEnd : tr.end || tr.start;
        const protectedCalc = calculateAgeSearchString(clampedStart, clampedEnd, effectiveRef, {
          bufferMode: protectiveBufferMode,
        });
        if (!protectedCalc.isUpcoming) {
          allProtectedEventIntervals.push(protectedCalc);
        }
      });
  }

  if (includeCommunityDays) {
    communityDays
      .filter((cd) => Number(cd.year) === Number(year))
      .forEach((cd) => {
        const protectedCalc = calculateAgeSearchString(cd.date, cd.date, effectiveRef, {
          bufferMode: protectiveBufferMode,
        });
        if (!protectedCalc.isUpcoming) {
          allProtectedEventIntervals.push(protectedCalc);
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
    const calc = calculateAgeSearchString(monthStart, clampedEnd, effectiveRef, { bufferMode });

    const eventsInMonth = yearEvents.filter((ev) => {
      const evStart = ev.start || '';
      const evEnd = ev.end === 'PRESENT' ? effectiveRef : ev.end || evStart;
      return dateRangeOverlaps(evStart, evEnd, monthStart, monthEnd);
    });
    const cdsInMonth = communityDays.filter((cd) => Number(cd.year) === Number(year) && cd.monthNum === m);
    const tripsInMonth = trips.filter((tr) =>
      dateRangeOverlaps(tr.start, tr.end || tr.start, monthStart, monthEnd)
    );

    const monthEventIntervals = [];
    eventsInMonth
      .filter((e) => e.attended && e.end !== 'PRESENT')
      .forEach((ev) => {
        const c = calculateAgeSearchString(ev.start, ev.end, effectiveRef, {
          bufferMode: protectiveBufferMode,
        });
        if (!c.isUpcoming) monthEventIntervals.push(c);
      });
    if (includeCommunityDays) {
      cdsInMonth.forEach((cd) => {
        const c = calculateAgeSearchString(cd.date, cd.date, effectiveRef, {
          bufferMode: protectiveBufferMode,
        });
        if (!c.isUpcoming) monthEventIntervals.push(c);
      });
    }
    if (includeTrips) {
      tripsInMonth.forEach((tr) => {
        const c = calculateAgeSearchString(tr.start, tr.end, effectiveRef, {
          bufferMode: protectiveBufferMode,
        });
        if (!c.isUpcoming) monthEventIntervals.push(c);
      });
    }
    const mergedMonthExclusions = mergeAgeIntervals(monthEventIntervals);
    const monthNegationClauses = mergedMonthExclusions.map(
      (iv) => `!${formatIntervalToAgeToken(iv)}`
    );

    const monthTrashString = buildSafeTrashQuery({
      ageScope: `${yearToken}&${calc.ageToken}`,
      starScope: '0*,1*,2*',
      includeIvShields: true,
      extraExclusions: [...monthNegationClauses, GLOBAL_REGIONAL_NEGATION],
      safetyShields: { untagged: untaggedOnly },
    });

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
      monthEverydayTrashString: monthTrashString,
    });
  }

  const everydayNonEventTrash0to2 = buildSafeTrashQuery({
    ageScope: nonEventAgeNegations ? `${yearToken}&${nonEventAgeNegations}` : yearToken,
    starScope: '0*,1*,2*',
    includeIvShields: true,
    extraExclusions: [GLOBAL_REGIONAL_NEGATION],
    safetyShields: { untagged: untaggedOnly },
  });

  const globalBgPurgeCombined = buildGlobalBgSurplusTrashQuery({
    scopePrefix: yearToken,
    ageOrUnionToken: globalAgeUnion,
    untaggedOnly: true,
  });

  return {
    year,
    attendedEventsCount: attendedEvents.length,
    totalYearEventsCount: yearEvents.length,
    mergedProtectedWindowsCount: mergedProtectedWindows.length,
    strings: {
      inPersonBgCombined: inPersonAgeUnion
        ? `${prefix}${yearToken}&locationbackground&${inPersonAgeUnion}`
        : `${prefix}${yearToken}&locationbackground`,
      globalBgKeepCombined: globalAgeUnion
        ? `${prefix}${yearToken}&specialbackground&!locationbackground&${globalAgeUnion}`
        : `${prefix}${yearToken}&specialbackground&!locationbackground`,
      globalBgPurgeCombined,
      unmappedBgAudit: unmappedBgNegations
        ? `${prefix}${yearToken}&background&${unmappedBgNegations}`
        : `${prefix}${yearToken}&background`,
      allAttendedEventsUnion: allProtectedAgeUnion
        ? `${prefix}${yearToken}&${allProtectedAgeUnion}`
        : `${prefix}${yearToken}`,
      everydayNonEventAll: nonEventAgeNegations
        ? `${prefix}${yearToken}&${nonEventAgeNegations}`
        : `${prefix}${yearToken}`,
      everydayNonEventTrash0to2,
    },
    monthlySlices,
  };
}
