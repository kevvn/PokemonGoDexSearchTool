/**
 * Pokédex ID range compression/expansion and De Morgan IV complement helpers.
 */
import { SCARCE_RARE_SPECIES_IDS } from '../../data/speciesConstants';

export const MAX_DEX_RANGE_EXPANSION = 5000;

export const PVP_IV_EXCLUDE_CLAUSE = '2-4attack,0-2defense,0-2hp';
export const NUNDO_EXCLUDE_CLAUSE = '1-4attack,1-4defense,1-4hp';

/**
 * Compress numeric Dex IDs into sorted, deduplicated PoGO range syntax (e.g. "1-3,5,7-8").
 */
export function compressIds(selectedIds) {
  if (!selectedIds) return '';

  const uniqueIds = selectedIds instanceof Set ? selectedIds : new Set(selectedIds);
  if (uniqueIds.size === 0) return '';

  const numeric = [];
  for (const val of uniqueIds) {
    const n = Number(val);
    if (Number.isInteger(n) && n > 0) {
      numeric.push(n);
    }
  }
  if (numeric.length === 0) return '';

  const sorted = new Float64Array(numeric).sort();
  const ranges = [];
  let start = sorted[0];
  let prev = sorted[0];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    if (current === prev) continue;
    if (current === prev + 1) {
      prev = current;
    } else {
      ranges.push(start === prev ? `${start}` : `${start}-${prev}`);
      start = current;
      prev = current;
    }
  }
  ranges.push(start === prev ? `${start}` : `${start}-${prev}`);
  return ranges.join(',');
}

export const compressIdRanges = compressIds;

/**
 * Convert a compressed Dex range string (e.g. "83,115,313-314") into &-joined `!` clauses.
 */
export function negateCompressedRanges(rangeString) {
  if (!rangeString || typeof rangeString !== 'string') return '';
  return rangeString
    .split(',')
    .map((r) => r.trim())
    .filter(Boolean)
    .map((r) => `!${r}`)
    .join('&');
}

export { SCARCE_RARE_SPECIES_IDS };
export const SCARCE_RARE_SPECIES_RANGES = compressIds(SCARCE_RARE_SPECIES_IDS);
export const RARE_SPECIES_EXCLUDE_CLAUSE = negateCompressedRanges(SCARCE_RARE_SPECIES_RANGES);

/**
 * Expand a Dex ID / range string (e.g., "1-3,25-26,172") into a Set<number>.
 */
export function expandIds(rangeString) {
  const result = new Set();
  if (!rangeString || typeof rangeString !== 'string') return result;

  const cleaned = rangeString.replace(/\s+/g, '');
  if (!/^[\d,-]+$/.test(cleaned)) return result;

  for (const token of cleaned.split(',')) {
    if (!token) continue;
    if (token.includes('-')) {
      const [startStr, endStr] = token.split('-');
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      if (!Number.isNaN(start) && !Number.isNaN(end) && start > 0 && end > 0) {
        const min = Math.min(start, end);
        const max = Math.max(start, end);
        const cappedMax = Math.min(max, MAX_DEX_RANGE_EXPANSION);
        for (let i = min; i <= cappedMax; i++) {
          result.add(i);
        }
      }
    } else {
      const id = parseInt(token, 10);
      if (!Number.isNaN(id) && id > 0) {
        result.add(id);
      }
    }
  }
  return result;
}

/**
 * Compute De Morgan / complement positive range(s) for an IV stat (0..4) since
 * Pokemon GO ignores `!` on `{N}attack`, `{N}defense`, `{N}hp`.
 */
export function invertIvStatRange(stat, minVal, maxVal) {
  const min = Math.max(0, Math.min(4, Number(minVal)));
  const max = Math.max(0, Math.min(4, Number(maxVal)));
  const lo = Math.min(min, max);
  const hi = Math.max(min, max);

  const kept = [];
  for (let v = 0; v <= 4; v++) {
    if (v < lo || v > hi) kept.push(v);
  }
  if (kept.length === 0) return '';

  const ranges = [];
  let s = kept[0];
  let p = kept[0];
  for (let i = 1; i < kept.length; i++) {
    if (kept[i] === p + 1) {
      p = kept[i];
    } else {
      ranges.push(s === p ? `${s}${stat}` : `${s}-${p}${stat}`);
      s = kept[i];
      p = kept[i];
    }
  }
  ranges.push(s === p ? `${s}${stat}` : `${s}-${p}${stat}`);
  return ranges.join(',');
}
