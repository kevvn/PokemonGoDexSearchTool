// Authoritative Pokémon GO Storage Search Engine (Leidwesen/SearchPhrases v0.435.1)
// Supports CNF parsing/serialization, round-trip preservation of unknown clauses,
// De Morgan IV stat complements, and built-in PoGO syntax safety guardrails.

export const REGIONS = [
  'Kanto',
  'Johto',
  'Hoenn',
  'Sinnoh',
  'Unova',
  'Kalos',
  'Alola',
  'Galar',
  'Hisui',
  'Paldea',
];

export const REGION_KEYWORDS = REGIONS.map((r) => r.toLowerCase());

export const TYPES = [
  'normal', 'fire', 'water', 'electric', 'grass', 'ice', 'fighting', 'poison', 'ground',
  'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'steel', 'dark', 'fairy',
];

export const APPRAISALS = ['0*', '1*', '2*', '3*', '4*'];

// Canonical tri-state attribute tokens.
// Special token '!@3mov': true -> '!@3mov' (has 2nd charged move), false -> '@3mov' (single-move only).
// Special token '#': true -> '#' (tagged), false -> '!#' (untagged).
export const ATTRIBUTES = [
  // Core & Rarity
  'shiny',
  'shadow',
  'purified',
  'lucky',
  'legendary',
  'mythical',
  'ultrabeast',
  'costume',
  'favorite',
  'traded',
  'candykm20',
  // Backgrounds
  'background',
  'locationbackground',
  'specialbackground',
  'profilebackground',
  // Max Battles
  'maxmove1-',
  'dynamax',
  'gigantamax',
  // Sizes
  'xxl',
  'xxs',
  'xl',
  'xs',
  // Evolutions, Mega & Specials
  'evolve',
  'evolvenew',
  'megaevolve',
  'item',
  'fusion',
  'adventureeffect',
  // Moves & Investment
  '@special',
  '!@3mov',
  // Origins
  'eggsonly',
  'hatched',
  'raid',
  'research',
  'gbl',
  'party',
  // Counts & Tag Status
  'count2-',
  'count1',
  '#',
  // Regional Forms
  'alola',
  'galar',
  'hisui',
  'paldea',
];

export const ATTRIBUTE_GROUPS = [
  {
    id: 'core',
    label: 'Rarity & Status',
    items: [
      { key: 'shiny', label: 'Shiny' },
      { key: 'shadow', label: 'Shadow' },
      { key: 'purified', label: 'Purified' },
      { key: 'lucky', label: 'Lucky' },
      { key: 'legendary', label: 'Legendary' },
      { key: 'mythical', label: 'Mythical' },
      { key: 'ultrabeast', label: 'Ultra Beast' },
      { key: 'costume', label: 'Costume' },
      { key: 'favorite', label: 'Favorite' },
      { key: 'traded', label: 'Traded' },
      { key: 'candykm20', label: '20km Buddy (Leg/Myth/UB)' },
      { key: '#', label: 'Tagged (# / !#)' },
    ],
  },
  {
    id: 'backgrounds',
    label: 'Backgrounds',
    items: [
      { key: 'background', label: 'Any Background' },
      { key: 'locationbackground', label: 'Location BG (In-Person)' },
      { key: 'specialbackground', label: 'Special BG (Global)' },
      { key: 'profilebackground', label: 'Profile BG' },
    ],
  },
  {
    id: 'max',
    label: 'Max Battles',
    items: [
      { key: 'maxmove1-', label: 'All Max Eligible (maxmove1-)' },
      { key: 'dynamax', label: 'Dynamax Only' },
      { key: 'gigantamax', label: 'Gigantamax Only' },
    ],
  },
  {
    id: 'moves_evo',
    label: 'Moves, Evolutions & Mega',
    items: [
      { key: '@special', label: 'Legacy / Elite (@special)' },
      { key: '!@3mov', label: '2nd Charged Move (!@3mov / @3mov)' },
      { key: 'evolve', label: 'Can Evolve' },
      { key: 'evolvenew', label: 'New Dex Evolve' },
      { key: 'megaevolve', label: 'Can Mega Evolve' },
      { key: 'item', label: 'Item Evolve' },
      { key: 'fusion', label: 'Fusion (Necrozma/Kyurem)' },
      { key: 'adventureeffect', label: 'Adventure Effect' },
    ],
  },
  {
    id: 'sizes_counts',
    label: 'Sizes & Duplicates',
    items: [
      { key: 'xxl', label: 'XXL' },
      { key: 'xxs', label: 'XXS' },
      { key: 'xl', label: 'XL' },
      { key: 'xs', label: 'XS' },
      { key: 'count2-', label: 'Duplicates (count2-)' },
      { key: 'count1', label: 'Singletons (count1)' },
    ],
  },
  {
    id: 'origins',
    label: 'Encounter Origins',
    items: [
      { key: 'raid', label: 'Raid' },
      { key: 'hatched', label: 'Hatched' },
      { key: 'research', label: 'Research' },
      { key: 'gbl', label: 'GBL Reward' },
      { key: 'party', label: 'Party Play (party)' },
      { key: 'eggsonly', label: 'Baby (eggsonly)' },
    ],
  },
  {
    id: 'regions',
    label: 'Regional Forms',
    items: [
      { key: 'alola', label: 'Alola' },
      { key: 'galar', label: 'Galar' },
      { key: 'hisui', label: 'Hisui' },
      { key: 'paldea', label: 'Paldea' },
    ],
  },
];

// Canonical aliases accepted during parsing -> canonical ATTRIBUTES key
const ATTRIBUTE_ALIASES = {
  'ultra beasts': 'ultrabeast',
  favourite: 'favorite',
  '@3move_name_0000': '@3mov',
  '!@3move_name_0000': '!@3mov',
};

const ATTRIBUTE_SET = new Set(ATTRIBUTES);
const TYPE_SET = new Set(TYPES);
const APPRAISAL_SET = new Set(APPRAISALS);

export const PVP_IV_EXCLUDE_CLAUSE = '2-4attack,0-2defense,0-2hp';
export const NUNDO_EXCLUDE_CLAUSE = '1-4attack,1-4defense,1-4hp';

export function createDefaultFilters() {
  const attrs = {};
  for (const attr of ATTRIBUTES) {
    attrs[attr] = null;
  }
  return {
    appraisal: [],
    ageMin: '',
    ageMax: '',
    distanceMin: '',
    distanceMax: '',
    cpMin: '',
    cpMax: '',
    megaLevel: '',
    types: [],
    ivStats: {
      attackMin: '',
      attackMax: '',
      defenseMin: '',
      defenseMax: '',
      hpMin: '',
      hpMax: '',
      excludePvpIv: false,
      excludeNundo: false,
    },
    rawClauses: [],
    ...attrs,
  };
}

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

// Backward-compatible alias used by existing components/tests
export const compressIdRanges = compressIds;

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
        // Guard against runaway ranges like 1-99999999
        const cappedMax = Math.min(max, 2000);
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
 * Example: invertIvStatRange('attack', 0, 1) -> '2-4attack'
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

  // Collapse contiguous buckets in 0..4
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

/**
 * Parse a Pokémon GO search string into CNF AST:
 * AND clauses separated by `&` or `|`, each containing OR atoms separated by `,`, `;`, or `:`.
 */
export function parseToAst(searchString) {
  if (!searchString || typeof searchString !== 'string') {
    return { clauses: [] };
  }

  const rawClauses = searchString.split(/[&|]/);
  const clauses = [];

  for (const rawClause of rawClauses) {
    const trimmedClause = rawClause.trim();
    if (!trimmedClause) continue;

    const rawAtoms = trimmedClause.split(/[,;:]/);
    const atoms = [];
    for (const rawAtom of rawAtoms) {
      const trimmedAtom = rawAtom.trim();
      if (!trimmedAtom) continue;
      let negated = false;
      let body = trimmedAtom;
      if (body.startsWith('!')) {
        negated = true;
        body = body.slice(1).trim();
      }
      atoms.push({
        raw: trimmedAtom,
        value: body.toLowerCase(),
        negated,
      });
    }

    if (atoms.length > 0) {
      clauses.push({ raw: trimmedClause, atoms });
    }
  }

  return { clauses };
}

/**
 * Normalize whitespace and canonical operator characters (`|` -> `&`, `;`/`:` -> `,`,
 * remove space after `!`, canonicalize `ultra beasts` -> `ultrabeast`).
 */
export function normalizeSearchString(searchString) {
  if (!searchString || typeof searchString !== 'string') return '';
  const ast = parseToAst(searchString);
  const normalizedClauses = ast.clauses.map((clause) =>
    clause.atoms
      .map((atom) => {
        const canonical = ATTRIBUTE_ALIASES[atom.value] || atom.raw.replace(/^!\s+/, '!').trim();
        if (ATTRIBUTE_ALIASES[atom.value]) {
          return atom.negated ? `!${canonical}` : canonical;
        }
        return atom.raw.replace(/^!\s+/, '!').trim();
      })
      .join(',')
  );
  return normalizedClauses.join('&');
}

function parseRangeValue(rest) {
  if (rest.includes('-')) {
    const [min, max] = rest.split('-');
    return { min: min ?? '', max: max ?? '' };
  }
  return { min: rest, max: rest };
}

function formatRange(prefix, min, max, { forceOpenTrailingHyphen = false } = {}) {
  const hasMin = min !== '' && min !== null && min !== undefined;
  const hasMax = max !== '' && max !== null && max !== undefined;
  if (!hasMin && !hasMax) return '';
  if (hasMin && hasMax && String(min) === String(max)) {
    // Special rule: distance{N} without hyphen means <= N, never exact!
    if (forceOpenTrailingHyphen) {
      return `${prefix}${min}-${max}`;
    }
    return `${prefix}${min}`;
  }
  return `${prefix}${hasMin ? min : ''}-${hasMax ? max : ''}`;
}

function parseIvStatAtom(atomValue) {
  const m = atomValue.match(/^([0-4])(?:-([0-4]))?(attack|defense|hp)$/);
  if (!m) return null;
  const min = m[1];
  const max = m[2] ?? m[1];
  const stat = m[3];
  return { stat, min, max };
}

function formatIvStat(stat, min, max) {
  const hasMin = min !== '' && min !== null && min !== undefined;
  const hasMax = max !== '' && max !== null && max !== undefined;
  if (!hasMin && !hasMax) return '';
  const lo = hasMin ? String(min) : '0';
  const hi = hasMax ? String(max) : '4';
  if (lo === hi) return `${lo}${stat}`;
  return `${lo}-${hi}${stat}`;
}

/**
 * Parse a Pokémon GO search string into structured `{ selectedIds, filters, ast }`.
 * Preserves unknown, negated-complex, or custom OR clauses in `filters.rawClauses`
 * so round-tripping never silently drops user or triage syntax.
 */
export function parseSearchString(searchString) {
  const filters = createDefaultFilters();
  const selectedIds = new Set();
  const ast = parseToAst(searchString);

  if (!searchString || ast.clauses.length === 0) {
    return { selectedIds, filters, ast };
  }

  let hasAppraisalClause = false;
  let hasTypeClause = false;
  let hasDexClause = false;

  for (const clause of ast.clauses) {
    const atoms = clause.atoms;
    const normalizedClauseKey = atoms
      .map((a) => (a.negated ? `!${a.value}` : a.value))
      .join(',');

    // 0. Known De Morgan IV exclusion shields
    if (normalizedClauseKey === PVP_IV_EXCLUDE_CLAUSE) {
      filters.ivStats.excludePvpIv = true;
      continue;
    }
    if (normalizedClauseKey === NUNDO_EXCLUDE_CLAUSE) {
      filters.ivStats.excludeNundo = true;
      continue;
    }

    // 1. Multi-atom OR clauses (e.g., 0*,1*,2* | fire,water | 1-3,25-26,172)
    if (atoms.length > 1) {
      const allPositiveAppraisals = atoms.every((a) => !a.negated && APPRAISAL_SET.has(a.value));
      if (allPositiveAppraisals) {
        if (!hasAppraisalClause) {
          hasAppraisalClause = true;
          for (const a of atoms) {
            if (!filters.appraisal.includes(a.value)) {
              filters.appraisal.push(a.value);
            }
          }
        } else {
          filters.rawClauses.push(clause.raw);
        }
        continue;
      }

      const allPositiveTypes = atoms.every((a) => !a.negated && TYPE_SET.has(a.value));
      if (allPositiveTypes) {
        if (!hasTypeClause) {
          hasTypeClause = true;
          for (const a of atoms) {
            if (!filters.types.includes(a.value)) {
              filters.types.push(a.value);
            }
          }
        } else {
          filters.rawClauses.push(clause.raw);
        }
        continue;
      }

      const allPositiveDexRanges = atoms.every((a) => !a.negated && /^\d+(?:-\d+)?$/.test(a.value));
      if (allPositiveDexRanges) {
        if (!hasDexClause) {
          hasDexClause = true;
          for (const a of atoms) {
            for (const id of expandIds(a.value)) {
              selectedIds.add(id);
            }
          }
        } else {
          filters.rawClauses.push(clause.raw);
        }
        continue;
      }

      // Any other OR clause (e.g., 4*,shiny,background or #tr-mirror,#tr-dist) -> preserve verbatim!
      filters.rawClauses.push(clause.raw);
      continue;
    }

    // 2. Single-atom clauses
    const atom = atoms[0];
    const canonicalValue = ATTRIBUTE_ALIASES[atom.value] || atom.value;

    // 2a. Special 2nd charged move token (`!@3mov` = has 2nd move -> true; `@3mov` = single-move -> false)
    if (canonicalValue === '@3mov') {
      filters['!@3mov'] = atom.negated ? true : false;
      continue;
    }
    if (canonicalValue === '!@3mov') {
      filters['!@3mov'] = true;
      continue;
    }

    // 2b. Tag umbrella `#` / `!#` (only exact `#`, not `#tagname`)
    if (canonicalValue === '#') {
      filters['#'] = atom.negated ? false : true;
      continue;
    }

    // 2c. Appraisal (positive single star; negated like `!4*` or 2nd &-clause goes to rawClauses)
    if (APPRAISAL_SET.has(canonicalValue)) {
      if (!atom.negated && !hasAppraisalClause) {
        hasAppraisalClause = true;
        if (!filters.appraisal.includes(canonicalValue)) {
          filters.appraisal.push(canonicalValue);
        }
      } else {
        filters.rawClauses.push(clause.raw);
      }
      continue;
    }

    // 2d. Positive Age range (negated `!age0-7` preserved in rawClauses instead of stripping `!`)
    if (/^age\d*(?:-\d*)?$/.test(canonicalValue) && canonicalValue !== 'age' && canonicalValue !== 'age-') {
      if (!atom.negated) {
        const { min, max } = parseRangeValue(canonicalValue.slice(3));
        filters.ageMin = min;
        filters.ageMax = max;
      } else {
        filters.rawClauses.push(clause.raw);
      }
      continue;
    }

    // 2e. Positive Distance range (`distance100-`, `distance-50`, `distance10-100`; bare `distance100` means <=100)
    if (/^distance\d*(?:-\d*)?$/.test(canonicalValue) && canonicalValue !== 'distance' && canonicalValue !== 'distance-') {
      if (!atom.negated) {
        const rest = canonicalValue.slice(8);
        if (rest.includes('-')) {
          const { min, max } = parseRangeValue(rest);
          filters.distanceMin = min;
          filters.distanceMax = max;
        } else {
          // PoGO quirk: bare distance{N} means <= N
          filters.distanceMin = '';
          filters.distanceMax = rest;
        }
      } else {
        filters.rawClauses.push(clause.raw);
      }
      continue;
    }

    // 2f. Positive CP range (`cp-1500`, `cp1501-2500`, `cp2000-`, `cp1500`)
    if (/^cp\d*(?:-\d*)?$/.test(canonicalValue) && canonicalValue !== 'cp' && canonicalValue !== 'cp-') {
      if (!atom.negated) {
        const { min, max } = parseRangeValue(canonicalValue.slice(2));
        filters.cpMin = min;
        filters.cpMax = max;
      } else {
        filters.rawClauses.push(clause.raw);
      }
      continue;
    }

    // 2g. Positive Mega level (`mega0`, `mega1-2`, `mega1-3`, `mega3-`, `mega4`)
    if (/^mega[0-4](?:-[0-4]?)?$/.test(canonicalValue)) {
      if (!atom.negated) {
        filters.megaLevel = canonicalValue;
      } else {
        filters.rawClauses.push(clause.raw);
      }
      continue;
    }

    // 2h. Positive IV Stat Bar (`0-1attack`, `3-4defense`, `4hp`)
    const ivStat = parseIvStatAtom(canonicalValue);
    if (ivStat) {
      if (!atom.negated) {
        filters.ivStats[`${ivStat.stat}Min`] = ivStat.min;
        filters.ivStats[`${ivStat.stat}Max`] = ivStat.max;
      } else {
        filters.rawClauses.push(clause.raw);
      }
      continue;
    }

    // 2i. Known Tri-State Attributes
    if (ATTRIBUTE_SET.has(canonicalValue)) {
      filters[canonicalValue] = atom.negated ? false : true;
      continue;
    }

    // 2j. Positive Types (negated `!fire` or 2nd &-clause like `dragon&flying` preserved in rawClauses)
    if (TYPE_SET.has(canonicalValue)) {
      if (!atom.negated && !hasTypeClause) {
        hasTypeClause = true;
        if (!filters.types.includes(canonicalValue)) {
          filters.types.push(canonicalValue);
        }
      } else {
        filters.rawClauses.push(clause.raw);
      }
      continue;
    }

    // 2k. Positive Single Dex ID or Range (`25`, `1-151`; negated `!1-151` or 2nd &-clause preserved in rawClauses)
    if (/^\d+(?:-\d+)?$/.test(canonicalValue)) {
      if (!atom.negated && !hasDexClause) {
        hasDexClause = true;
        for (const id of expandIds(canonicalValue)) {
          selectedIds.add(id);
        }
      } else {
        filters.rawClauses.push(clause.raw);
      }
      continue;
    }

    // 2l. Fallback: preserve any unrecognized PoGO syntax (`#pvp-gl`, `@frustration`, `year2026`, `countcandyxl296-`, etc.)
    filters.rawClauses.push(clause.raw);
  }

  return { selectedIds, filters, ast };
}

/**
 * Generate a canonical Pokémon GO CNF search string from `(selectedIds, filters)`.
 * Emits zero whitespace around `&`, `,`, `!` and never emits negated IV stat bars.
 */
export function generateSearchString(selectedIds, filters = {}) {
  const parts = [];
  const seen = new Set();
  const pushUnique = (clause) => {
    if (!clause) return;
    const trimmed = clause.trim();
    if (!trimmed || seen.has(trimmed)) return;
    seen.add(trimmed);
    parts.push(trimmed);
  };

  // 1. Dex IDs
  pushUnique(compressIds(selectedIds));

  // 2. Appraisal
  if (Array.isArray(filters.appraisal) && filters.appraisal.length > 0) {
    const validStars = filters.appraisal.filter((s) => APPRAISAL_SET.has(s));
    if (validStars.length > 0) {
      pushUnique(validStars.join(','));
    }
  }

  // 3. Age
  pushUnique(formatRange('age', filters.ageMin, filters.ageMax));

  // 4. Distance (always emit trailing hyphen when only min is given; never bare distance{N} for min)
  if (filters.distanceMin !== '' && filters.distanceMin != null && (filters.distanceMax === '' || filters.distanceMax == null)) {
    pushUnique(`distance${filters.distanceMin}-`);
  } else {
    pushUnique(formatRange('distance', filters.distanceMin, filters.distanceMax, { forceOpenTrailingHyphen: true }));
  }

  // 5. CP
  pushUnique(formatRange('cp', filters.cpMin, filters.cpMax));

  // 6. Mega Level (positive only)
  if (filters.megaLevel && /^mega[0-4](?:-[0-4]?)?$/.test(String(filters.megaLevel))) {
    pushUnique(String(filters.megaLevel));
  }

  // 7. IV Stat Bars & De Morgan Exclusion Shields
  const iv = filters.ivStats || {};
  pushUnique(formatIvStat('attack', iv.attackMin, iv.attackMax));
  pushUnique(formatIvStat('defense', iv.defenseMin, iv.defenseMax));
  pushUnique(formatIvStat('hp', iv.hpMin, iv.hpMax));
  if (iv.excludePvpIv) {
    pushUnique(PVP_IV_EXCLUDE_CLAUSE);
  }
  if (iv.excludeNundo) {
    pushUnique(NUNDO_EXCLUDE_CLAUSE);
  }

  // 8. Attributes
  for (const attr of ATTRIBUTES) {
    const val = filters[attr];
    if (val === null || val === undefined) continue;

    if (attr === '!@3mov') {
      // true -> has 2nd charged move (!@3mov); false -> single-move only (@3mov)
      pushUnique(val === true ? '!@3mov' : '@3mov');
    } else if (attr === '#') {
      pushUnique(val === true ? '#' : '!#');
    } else {
      pushUnique(val === true ? attr : `!${attr}`);
    }
  }

  // 9. Types
  if (Array.isArray(filters.types) && filters.types.length > 0) {
    const validTypes = filters.types.filter((t) => TYPE_SET.has(t));
    if (validTypes.length > 0) {
      pushUnique(validTypes.join(','));
    }
  }

  // 10. Preserved raw clauses (tags, moves, custom OR clauses, etc.)
  if (Array.isArray(filters.rawClauses)) {
    for (const raw of filters.rawClauses) {
      pushUnique(raw);
    }
  }

  return parts.join('&');
}

/**
 * Validate a Pokémon GO search string against Leidwesen/SearchPhrases v0.435.1 rules.
 * Options: `{ isTrashContext?: boolean }` enables extra safety checks (`!mega{N}`, `!@3mov`).
 */
export function validateSearchString(searchString, options = {}) {
  const str = typeof searchString === 'string' ? searchString : '';
  const errors = [];
  const warnings = [];
  const charCount = str.length;

  if (!str.trim()) {
    return { valid: true, errors, warnings, charCount };
  }

  // Length guardrails
  if (charCount > 5000) {
    errors.push({
      code: 'LENGTH_ERROR',
      message: `Search string is ${charCount} characters (exceeds PoGO ~5,000-char ceiling). Split or collapse ranges.`,
      token: `${charCount} chars`,
    });
  } else if (charCount > 4000) {
    warnings.push({
      code: 'LENGTH_WARNING',
      message: `Search string is ${charCount} characters (>4,000 chars may lag or truncate on some mobile devices).`,
      token: `${charCount} chars`,
    });
  }

  // Structural checks on raw string
  if (/[()"]/.test(str)) {
    warnings.push({
      code: 'UNSUPPORTED_GROUPING',
      message: 'Parentheses () and quotes "" are not grouping operators in Pokémon GO (CNF precedence applies).',
      token: str.match(/[()"]/)?.[0] || '',
    });
  }

  if (str.includes('|')) {
    warnings.push({
      code: 'PIPE_IS_AND',
      message: '`|` means logical AND in Pokémon GO (not OR). Use `&` for AND and `,` for OR.',
      token: '|',
    });
  }

  if (/!\s+\S/.test(str)) {
    errors.push({
      code: 'SPACE_AFTER_NOT',
      message: 'Space after `!` breaks negation in Pokémon GO (use `!shiny`, never `! shiny`).',
      token: str.match(/!\s+\S+/)?.[0] || '!',
    });
  }

  const ast = parseToAst(str);
  const allAtomValues = ast.clauses.flatMap((c) => c.atoms.map((a) => (a.negated ? `!${a.value}` : a.value)));

  // Infer trash context if explicitly flagged or looks like a mass-transfer exclusion query
  const inferredTrash =
    Boolean(options.isTrashContext) ||
    (allAtomValues.includes('!favorite') &&
      allAtomValues.includes('!shiny') &&
      (allAtomValues.includes('0*') || allAtomValues.includes('!#')));

  for (const clause of ast.clauses) {
    for (const atom of clause.atoms) {
      const val = atom.value;
      const full = atom.negated ? `!${val}` : val;

      // 1. Invalid spelling: ultrabeasts
      if (val === 'ultrabeasts') {
        errors.push({
          code: 'INVALID_ULTRABEASTS',
          message: '`ultrabeasts` (plural without space) does not work in Pokémon GO. Use `ultrabeast`.',
          token: full,
        });
      }

      // 2. Invalid spelling: partyplay
      if (val === 'partyplay') {
        errors.push({
          code: 'INVALID_PARTYPLAY',
          message: '`partyplay` does not exist in Pokémon GO. Use `party`.',
          token: full,
        });
      }

      // 3. Negated IV stat bug: `!{N}attack` / `!{N}defense` / `!{N}hp`
      if (atom.negated && /^[0-4](?:-[0-4])?(?:attack|defense|hp)$/.test(val)) {
        errors.push({
          code: 'NEGATED_IV_STAT',
          message: `Pokémon GO ignores \`!\` on IV stat filters (\`${full}\` acts as \`${val}\`). Use the complement range instead.`,
          token: full,
        });
      }

      // 4. `+` before Pokédex numbers
      if (/^\+\d/.test(val)) {
        errors.push({
          code: 'PLUS_ON_DEX',
          message: `\`+\` does not work on Pokédex numbers (\`${full}\`). Expand family dex IDs explicitly or use species name.`,
          token: full,
        });
      }

      // 5. Invalid star range (e.g., `0-2*`)
      if (/^[0-4]-[0-4]\*$/.test(val)) {
        errors.push({
          code: 'INVALID_STAR_RANGE',
          message: `Appraisal stars do not support range hyphens (\`${full}\`). Use comma-separated stars (e.g., \`0*,1*,2*\`).`,
          token: full,
        });
      }

      // 6. Bare `distance{N}` without trailing `-`
      if (/^distance\d+$/.test(val)) {
        warnings.push({
          code: 'BARE_DISTANCE',
          message: `\`${full}\` without a trailing \`-\` means ≤ ${val.slice(8)} km. Use \`${val}-\` for ≥ ${val.slice(8)} km.`,
          token: full,
        });
      }

      // 7. `!mega{N}` in trash context
      if (inferredTrash && atom.negated && /^mega[0-4]?(?:-[0-4]?)?$/.test(val)) {
        errors.push({
          code: 'NEGATED_MEGA_IN_TRASH',
          message: `\`${full}\` only returns Mega-capable species and hides all non-Megas! Protect leveled Megas via \`!#\` instead.`,
          token: full,
        });
      }

      // 8. `!@3mov` in trash context (inverted!)
      if (inferredTrash && atom.negated && (val === '@3mov' || val === '@3move_name_0000')) {
        errors.push({
          code: 'INVERTED_3MOV_IN_TRASH',
          message: `\`!@3mov\` matches Pokémon WITH a 2nd charged move! Use \`@3mov\` in trash strings to shield double-moved builds.`,
          token: full,
        });
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    charCount,
  };
}

/**
 * Removes any OR-clause that is a superset of another OR-clause in the CNF conjunction:
 * Absorption Law: C1 & (C1 , X) === C1
 */
function absorbSupersetClauses(clauses) {
  const unique = [];
  const seenKeys = new Set();

  const sorted = [...clauses].sort((a, b) => a.size - b.size);
  for (const clause of sorted) {
    if (clause.size === 0) continue;
    const key = Array.from(clause).join(',');
    if (seenKeys.has(key)) continue;

    const isSupersetOfExisting = unique.some((kept) => {
      for (const lit of kept) {
        if (!clause.has(lit)) return false;
      }
      return true;
    });

    if (!isSupersetOfExisting) {
      unique.push(clause);
      seenKeys.add(key);
    }
  }
  return unique;
}

/**
 * Compiles a Disjunctive Normal Form (DNF — an OR of AND-branches) into a minimal,
 * valid Pokémon GO Conjunctive Normal Form (CNF — an AND of OR-clauses) search string.
 *
 * @param {Array<string | string[]>} orBranches - Array of OR branches. Each branch can be an `&`-delimited string (e.g. "shiny&shadow") or array of AND terms (e.g. ["shiny", "shadow"]).
 * @param {string[]} [globalAndTokens=[]] - Global AND tokens prepended to the entire query (e.g. ["!#", "!traded"]).
 * @returns {string} Valid Pokémon GO CNF search string.
 */
export function compileDnfToPogoCnf(orBranches, globalAndTokens = []) {
  const parsedBranches = (orBranches || [])
    .map((branch) => {
      const andParts = Array.isArray(branch)
        ? branch
        : String(branch || '')
            .split('&')
            .map((s) => s.trim())
            .filter(Boolean);

      const factorSets = andParts
        .map((factor) => {
          const lits = String(factor)
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
          return new Set(lits);
        })
        .filter((set) => set.size > 0);

      return absorbSupersetClauses(factorSets);
    })
    .filter((branchFactors) => branchFactors.length > 0);

  const prefixClean = (globalAndTokens || [])
    .map((t) => String(t || '').trim().replace(/&+$/, ''))
    .filter(Boolean);

  if (parsedBranches.length === 0) {
    return prefixClean.join('&');
  }

  let cnfClauses = parsedBranches[0];

  for (let i = 1; i < parsedBranches.length; i++) {
    const nextBranch = parsedBranches[i];
    const distributed = [];

    for (const existingClause of cnfClauses) {
      for (const branchFactor of nextBranch) {
        const mergedOrClause = new Set([...existingClause, ...branchFactor]);
        distributed.push(mergedOrClause);
      }
    }

    cnfClauses = absorbSupersetClauses(distributed);
  }

  const cnfStrings = cnfClauses.map((clauseSet) => Array.from(clauseSet).join(','));
  return [...prefixClean, ...cnfStrings].join('&');
}

/**
 * Inspects a Pokémon GO search string for the `,` (OR) vs `&` (AND) precedence trap
 * (where a user wrote `A, B&C, D&E` expecting `,` to be outer OR, but Pokémon GO evaluates `,` first
 * and `&` last, causing only the final `&` entry to dominate).
 */
export function inspectAndFixPogoQuery(rawQuery) {
  const trimmed = String(rawQuery || '').trim();
  if (!trimmed || !trimmed.includes(',') || !trimmed.includes('&')) {
    return {
      hasPrecedenceTrap: false,
      rawQuery: trimmed,
      pogoEvaluatedClauses: trimmed ? trimmed.split('&').filter(Boolean) : [],
      fixedCnfQuery: trimmed,
      extractedGlobalPrefixes: [],
      extractedOrBranches: [],
    };
  }

  const ampParts = trimmed.split('&').map((s) => s.trim()).filter(Boolean);

  const leadingGlobalPrefixes = [];
  let idx = 0;
  while (idx < ampParts.length && !ampParts[idx].includes(',')) {
    if (/^(!|year\d|age\d)/i.test(ampParts[idx])) {
      leadingGlobalPrefixes.push(ampParts[idx]);
      idx++;
    } else {
      break;
    }
  }

  const remainder = ampParts.slice(idx).join('&');
  if (!remainder.includes(',') || !remainder.includes('&')) {
    return {
      hasPrecedenceTrap: false,
      rawQuery: trimmed,
      pogoEvaluatedClauses: ampParts,
      fixedCnfQuery: trimmed,
      extractedGlobalPrefixes: leadingGlobalPrefixes,
      extractedOrBranches: [remainder].filter(Boolean),
    };
  }

  const commaBranches = remainder.split(',').map((s) => s.trim()).filter(Boolean);
  const branchesWithAmp = commaBranches.filter((b) => b.includes('&'));

  if (branchesWithAmp.length === 0) {
    return {
      hasPrecedenceTrap: false,
      rawQuery: trimmed,
      pogoEvaluatedClauses: ampParts,
      fixedCnfQuery: trimmed,
      extractedGlobalPrefixes: leadingGlobalPrefixes,
      extractedOrBranches: commaBranches,
    };
  }

  const remainderAmpClauses = remainder.split('&').map((c) => c.trim()).filter(Boolean);
  const firstClauseLiterals = remainderAmpClauses[0].split(',').map((s) => s.trim());
  const secondClauseLiterals = (remainderAmpClauses[1] || '').split(',').map((s) => s.trim());
  const sharedDistributedBase = firstClauseLiterals.filter((lit) => secondClauseLiterals.includes(lit));

  const isStandardCnfFilter = remainderAmpClauses.every(
    (cl) =>
      cl.startsWith('!') ||
      /^[0-4]\*(,[0-4]\*)*$/.test(cl) ||
      /^\d+(-\d+)?(,\d+(-\d+)?)*$/.test(cl) ||
      /^age\d+(-\d+)?(,age\d+(-\d+)?)*$/i.test(cl) ||
      /^[0-4]-[0-4](attack|defense|hp)$/i.test(cl) ||
      /^cp\d*-\d*$/i.test(cl) ||
      /^count\d*-\d*$/i.test(cl)
  );

  if (isStandardCnfFilter || (sharedDistributedBase.length > 0 && remainderAmpClauses.every((c) => c.includes(',')))) {
    return {
      hasPrecedenceTrap: false,
      rawQuery: trimmed,
      pogoEvaluatedClauses: ampParts,
      fixedCnfQuery: trimmed,
      extractedGlobalPrefixes: leadingGlobalPrefixes,
      extractedOrBranches: [],
    };
  }

  const compiledCnf = compileDnfToPogoCnf(commaBranches, leadingGlobalPrefixes);
  const hasTrap = compiledCnf !== trimmed;

  return {
    hasPrecedenceTrap: hasTrap,
    rawQuery: trimmed,
    pogoEvaluatedClauses: ampParts,
    fixedCnfQuery: compiledCnf,
    extractedGlobalPrefixes: leadingGlobalPrefixes,
    extractedOrBranches: commaBranches,
  };
}
