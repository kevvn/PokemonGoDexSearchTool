/**
 * Pure offline Temporal / Rata Die calendar ageX-Y calculation & interval merging helpers.
 * Kept dependency-free of tagModel and triageFunnelModel to prevent circular imports.
 */
import { compressIdRanges } from '../searchEngine';

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
