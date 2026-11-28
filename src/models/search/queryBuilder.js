/**
 * Canonical Pokémon GO CNF Query Builder, Parser, Serializer & Filter Counter.
 * Driven declaratively by `operatorRegistry.js` so new attributes and range operators
 * propagate automatically across parsing, serialization, and active-filter counting.
 */
import {
  APPRAISAL_SET,
  ATTRIBUTES,
  ATTRIBUTE_ALIASES,
  ATTRIBUTE_SET,
  RANGE_OPERATORS,
  TYPE_SET,
} from './operatorRegistry';
import {
  NUNDO_EXCLUDE_CLAUSE,
  PVP_IV_EXCLUDE_CLAUSE,
  compressIds,
  expandIds,
} from './idRanges';

/**
 * Shared CNF clause joiner (`&` = AND) with deduplication and empty-clause pruning.
 */
export function joinClauses(...clauses) {
  const seen = new Set();
  const out = [];
  for (const raw of clauses) {
    if (!raw) continue;
    const item = String(raw).trim();
    if (!item || seen.has(item)) continue;
    seen.add(item);
    out.push(item);
  }
  return out.join('&');
}

/**
 * Shared OR atom joiner (`,` = OR) with deduplication and empty-atom pruning.
 */
export function joinOr(...atoms) {
  const seen = new Set();
  const out = [];
  for (const raw of atoms) {
    if (!raw) continue;
    const item = String(raw).trim();
    if (!item || seen.has(item)) continue;
    seen.add(item);
    out.push(item);
  }
  return out.join(',');
}

export function createDefaultFilters() {
  const attrs = {};
  for (const attr of ATTRIBUTES) {
    attrs[attr] = null;
  }
  const ranges = {};
  for (const r of RANGE_OPERATORS) {
    ranges[r.minKey] = '';
    ranges[r.maxKey] = '';
  }
  return {
    appraisal: [],
    ...ranges,
    megaLevel: '',
    moveQuery: '',
    types: [],
    attributeLogic: 'AND',
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
 * remove space after `!`, canonicalize aliases like `ultra beasts` -> `ultrabeast`).
 */
export function normalizeSearchString(searchString) {
  if (!searchString || typeof searchString !== 'string') return '';
  const ast = parseToAst(searchString);
  const normalizedClauses = ast.clauses.map((clause) =>
    clause.atoms
      .map((atom) => {
        const canonical = ATTRIBUTE_ALIASES[atom.value];
        if (canonical) {
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

  let lo = hasMin ? String(min).trim() : '';
  let hi = hasMax ? String(max).trim() : '';

  if (lo !== '' && hi !== '') {
    const loNum = Number(lo);
    const hiNum = Number(hi);
    if (!Number.isNaN(loNum) && !Number.isNaN(hiNum) && loNum > hiNum) {
      [lo, hi] = [String(hiNum), String(loNum)];
    }
  }

  if (lo !== '' && hi !== '' && lo === hi) {
    if (forceOpenTrailingHyphen) {
      return `${prefix}${lo}-${hi}`;
    }
    return `${prefix}${lo}`;
  }
  return `${prefix}${lo}-${hi}`;
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
  let lo = hasMin ? Number(min) : 0;
  let hi = hasMax ? Number(max) : 4;
  if (Number.isNaN(lo)) lo = 0;
  if (Number.isNaN(hi)) hi = 4;
  lo = Math.max(0, Math.min(4, lo));
  hi = Math.max(0, Math.min(4, hi));
  if (lo > hi) {
    [lo, hi] = [hi, lo];
  }
  if (lo === hi) return `${lo}${stat}`;
  return `${lo}-${hi}${stat}`;
}

function resolvePositiveOrAttributeKey(atom) {
  const canonical = ATTRIBUTE_ALIASES[atom.value] || atom.value;
  if (atom.negated && canonical === '@3mov') {
    return '!@3mov';
  }
  if (!atom.negated && ATTRIBUTE_SET.has(canonical) && canonical !== '!@3mov') {
    return canonical;
  }
  return null;
}

/**
 * Parse a Pokémon GO search string into structured `{ selectedIds, filters, ast }`.
 * Preserves unknown, repeated, negated-complex, or custom OR clauses in `filters.rawClauses`
 * so round-tripping never silently drops or overwrites user syntax.
 */
export function parseSearchString(searchString) {
  const filters = createDefaultFilters();
  const selectedIds = new Set();
  const ast = parseToAst(searchString);

  if (!searchString || ast.clauses.length === 0) {
    return { selectedIds, filters, ast };
  }

  let singlePositiveAttrCount = 0;
  let multiPositiveAttrClauseCount = 0;

  for (const clause of ast.clauses) {
    if (clause.atoms.length === 1) {
      if (resolvePositiveOrAttributeKey(clause.atoms[0])) {
        singlePositiveAttrCount += 1;
      }
    } else if (clause.atoms.every((a) => resolvePositiveOrAttributeKey(a) !== null)) {
      multiPositiveAttrClauseCount += 1;
    }
  }

  const canLiftAttributeOrClause =
    multiPositiveAttrClauseCount === 1 && singlePositiveAttrCount === 0;

  let hasAppraisalClause = false;
  let hasTypeClause = false;
  let hasDexClause = false;
  let hasAttrOrClause = false;
  let hasMegaClause = false;
  const seenRanges = new Set();
  const seenIvStats = new Set();

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

    // 1. Multi-atom OR clauses
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

      const orAttributeKeys = atoms.map(resolvePositiveOrAttributeKey);
      if (orAttributeKeys.every((k) => k !== null) && canLiftAttributeOrClause && !hasAttrOrClause) {
        hasAttrOrClause = true;
        filters.attributeLogic = 'OR';
        for (const key of orAttributeKeys) {
          filters[key] = true;
        }
        continue;
      }

      filters.rawClauses.push(clause.raw);
      continue;
    }

    // 2. Single-atom clauses
    const atom = atoms[0];
    const canonicalValue = ATTRIBUTE_ALIASES[atom.value] || atom.value;

    // 2a. Special 2nd charged move token (`!@3mov` vs `@3mov`)
    if (canonicalValue === '@3mov') {
      filters['!@3mov'] = atom.negated ? true : false;
      continue;
    }

    // 2b. Tag umbrella `#` / `!#`
    if (canonicalValue === '#') {
      filters['#'] = atom.negated ? false : true;
      continue;
    }

    // 2c. Appraisal
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

    // 2d. Declarative numeric ranges (age, distance, cp, year, buddy, count)
    let matchedRange = false;
    for (const rangeOp of RANGE_OPERATORS) {
      if (rangeOp.id === 'count' && ATTRIBUTE_SET.has(canonicalValue)) {
        continue;
      }
      const pLen = rangeOp.prefix.length;
      if (
        canonicalValue.startsWith(rangeOp.prefix) &&
        canonicalValue !== rangeOp.prefix &&
        canonicalValue !== `${rangeOp.prefix}-`
      ) {
        const rest = canonicalValue.slice(pLen);
        if (/^\d*(?:-\d*)?$/.test(rest)) {
          matchedRange = true;
          if (!atom.negated && !seenRanges.has(rangeOp.id)) {
            seenRanges.add(rangeOp.id);
            if (rangeOp.bareIsMax && !rest.includes('-')) {
              filters[rangeOp.minKey] = '';
              filters[rangeOp.maxKey] = rest;
            } else {
              const { min, max } = parseRangeValue(rest);
              filters[rangeOp.minKey] = min;
              filters[rangeOp.maxKey] = max;
            }
          } else {
            filters.rawClauses.push(clause.raw);
          }
          break;
        }
      }
    }
    if (matchedRange) continue;

    // 2e. Positive Mega level
    if (/^mega[0-4](?:-[0-4]?)?$/.test(canonicalValue)) {
      if (!atom.negated && !hasMegaClause) {
        hasMegaClause = true;
        filters.megaLevel = canonicalValue;
      } else {
        filters.rawClauses.push(clause.raw);
      }
      continue;
    }

    // 2f. Positive IV Stat Bar
    const ivStat = parseIvStatAtom(canonicalValue);
    if (ivStat) {
      if (!atom.negated && !seenIvStats.has(ivStat.stat)) {
        seenIvStats.add(ivStat.stat);
        filters.ivStats[`${ivStat.stat}Min`] = ivStat.min;
        filters.ivStats[`${ivStat.stat}Max`] = ivStat.max;
      } else {
        filters.rawClauses.push(clause.raw);
      }
      continue;
    }

    // 2g. Known Tri-State Attributes
    if (ATTRIBUTE_SET.has(canonicalValue) && canonicalValue !== '!@3mov') {
      filters[canonicalValue] = atom.negated ? false : true;
      continue;
    }

    // 2h. Positive Types
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

    // 2i. Positive Single Dex ID or Range
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

    // 2i-b. Positive Move Filter (@1Shadow Claw, @ice, etc., preserving @frustration/@return in rawClauses)
    if (
      !atom.negated &&
      clause.raw.startsWith('@') &&
      !['@frustration', '@return', '@special', '@weather', '@3mov'].includes(canonicalValue) &&
      !filters.moveQuery
    ) {
      filters.moveQuery = clause.raw.trim();
      continue;
    }

    // 2j. Fallback (preserves #tag, @frustration, countcandyxl, complex clauses losslessly)
    filters.rawClauses.push(clause.raw);
  }

  return { selectedIds, filters, ast };
}

/**
 * Generate a canonical Pokémon GO CNF search string from `(selectedIds, filters)`.
 * Emits zero whitespace around `&`, `,`, `!` and normalizes inverted numeric/IV ranges.
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

  // 3. Declarative numeric ranges (age, distance, cp, year, buddy)
  for (const rangeOp of RANGE_OPERATORS) {
    const min = filters[rangeOp.minKey];
    const max = filters[rangeOp.maxKey];
    if (
      rangeOp.id === 'distance' &&
      min !== '' &&
      min != null &&
      (max === '' || max == null)
    ) {
      pushUnique(`distance${String(min).trim()}-`);
    } else {
      pushUnique(
        formatRange(rangeOp.prefix, min, max, {
          forceOpenTrailingHyphen: rangeOp.forceOpenTrailingHyphen,
        })
      );
    }
  }

  // 4. Mega Level
  if (filters.megaLevel && /^mega[0-4](?:-[0-4]?)?$/.test(String(filters.megaLevel))) {
    pushUnique(String(filters.megaLevel));
  }

  // 5. Structured Move Query (`@dragon`, `@1lick`, `@frustration`, etc.)
  if (typeof filters.moveQuery === 'string' && filters.moveQuery.trim()) {
    const cleanMove = filters.moveQuery.trim();
    pushUnique(cleanMove.startsWith('@') || cleanMove.startsWith('!@') ? cleanMove : `@${cleanMove}`);
  }

  // 6. IV Stat Bars & De Morgan Exclusion Shields
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

  // 7. Single-pass tri-state attributes
  const useOrAttributes = filters.attributeLogic === 'OR';
  const positiveAttrTokens = [];
  const negatedAttrTokens = [];

  for (const attr of ATTRIBUTES) {
    const val = filters[attr];
    if (val === null || val === undefined) continue;

    let token;
    let isPositive;
    if (attr === '!@3mov') {
      token = val === true ? '!@3mov' : '@3mov';
      isPositive = val === true;
    } else if (attr === '#') {
      token = val === true ? '#' : '!#';
      isPositive = val === true;
    } else {
      token = val === true ? attr : `!${attr}`;
      isPositive = val === true;
    }

    if (useOrAttributes) {
      if (isPositive) positiveAttrTokens.push(token);
      else negatedAttrTokens.push(token);
    } else {
      pushUnique(token);
    }
  }

  if (useOrAttributes) {
    if (positiveAttrTokens.length > 0) {
      pushUnique(positiveAttrTokens.join(','));
    }
    for (const negToken of negatedAttrTokens) {
      pushUnique(negToken);
    }
  }

  // 8. Types
  if (Array.isArray(filters.types) && filters.types.length > 0) {
    const validTypes = filters.types.filter((t) => TYPE_SET.has(t));
    if (validTypes.length > 0) {
      pushUnique(validTypes.join(','));
    }
  }

  // 9. Preserved raw clauses
  if (Array.isArray(filters.rawClauses)) {
    for (const raw of filters.rawClauses) {
      pushUnique(raw);
    }
  }

  return parts.join('&');
}

/**
 * Declarative active filter counter derived directly from `ATTRIBUTES` & `RANGE_OPERATORS`
 * (replaces the brittle `SKIP_FILTER_COUNT_KEYS` denylist).
 */
export function countActiveFilters(filters) {
  if (!filters) return 0;
  let count = (filters.appraisal?.length || 0) + (filters.types?.length || 0);

  for (const rangeOp of RANGE_OPERATORS) {
    const hasMin = filters[rangeOp.minKey] !== '' && filters[rangeOp.minKey] != null;
    const hasMax = filters[rangeOp.maxKey] !== '' && filters[rangeOp.maxKey] != null;
    if (hasMin || hasMax) count += 1;
  }

  if (filters.megaLevel) count += 1;
  if (typeof filters.moveQuery === 'string' && filters.moveQuery.trim()) count += 1;

  if (filters.ivStats) {
    const iv = filters.ivStats;
    if (iv.attackMin || iv.attackMax) count += 1;
    if (iv.defenseMin || iv.defenseMax) count += 1;
    if (iv.hpMin || iv.hpMax) count += 1;
    if (iv.excludePvpIv) count += 1;
    if (iv.excludeNundo) count += 1;
  }

  if (Array.isArray(filters.rawClauses)) {
    count += filters.rawClauses.length;
  }

  for (const attr of ATTRIBUTES) {
    if (filters[attr] !== null && filters[attr] !== undefined) {
      count += 1;
    }
  }

  return count;
}
