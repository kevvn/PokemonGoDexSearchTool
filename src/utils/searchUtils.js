export const ATTRIBUTES = [
  'shiny',
  'shadow',
  'purified',
  'lucky',
  'legendary',
  'mythical',
  'ultra beasts',
  'mega',
  'megaevolve',
  'dynamax',
  'gigantamax',
  'costume',
  'evolve',
  'traded',
  'hatched',
  'raid',
  'remoteraid',
  'research',
  'defender',
  'favorite',
  'background',
  'locationbackground',
  'specialbackground',
  'profilebackground',
  'locationcard',
  'xxs',
  'xxl',
  'buddy0',
  'buddy1',
  'buddy2',
  'buddy3',
  'buddy4',
  'buddy5',
  'alola',
  'galar',
  'hisui',
  'paldea'
];

export const TYPES = [
  'normal', 'fire', 'water', 'electric', 'grass', 'ice', 'fighting', 'poison', 'ground',
  'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'steel', 'dark', 'fairy'
];

// Normalized aliases map for game search query terms
const ATTRIBUTE_ALIASES = {
  'ultrabeasts': 'ultra beasts',
  'ultra-beasts': 'ultra beasts',
  'ultra_beasts': 'ultra beasts',
  'gmax': 'gigantamax',
  'dmax': 'dynamax',
  'fav': 'favorite',
  'favs': 'favorite',
  'bestbuddy': 'buddy5',
  'best-buddy': 'buddy5',
  'best_buddy': 'buddy5',
  'location-card': 'locationcard',
  'location_card': 'locationcard',
  'location-background': 'locationbackground',
  'location_background': 'locationbackground',
  'special-background': 'specialbackground',
  'special_background': 'specialbackground',
  'profile-background': 'profilebackground',
  'profile_background': 'profilebackground'
};

export function compressIdRanges(selectedIds) {
  if (!selectedIds) return '';

  const uniqueIds = selectedIds instanceof Set ? selectedIds : new Set(selectedIds);
  if (uniqueIds.size === 0) return '';

  const validNumbers = [];
  for (const val of uniqueIds) {
    const num = typeof val === 'number' ? val : parseInt(val, 10);
    if (!isNaN(num) && num > 0) {
      validNumbers.push(num);
    }
  }
  if (validNumbers.length === 0) return '';

  // Sort numerical unique values
  const sorted = Array.from(new Set(validNumbers)).sort((a, b) => a - b);
  const ranges = [];
  const len = sorted.length;

  if (len > 0) {
    let start = sorted[0];
    let prev = sorted[0];

    for (let i = 1; i < len; i++) {
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
  return '';
}

/**
 * Removes any OR-clause that is a superset of another OR-clause in the CNF conjunction:
 * Absorption Law: C1 & (C1 , X) === C1
 */
function absorbSupersetClauses(clauses) {
  // Sort by clause size ascending so smaller clauses absorb larger ones
  const unique = [];
  const seenKeys = new Set();

  const sorted = [...clauses].sort((a, b) => a.size - b.size);
  for (const clause of sorted) {
    if (clause.size === 0) continue;
    const key = Array.from(clause).join(',');
    if (seenKeys.has(key)) continue;

    // Check if any already-kept smaller clause is a subset of `clause`
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
 * Why this is needed:
 * In Pokémon GO's search bar, OR (`,`, `:`) has HIGHER precedence than AND (`&`, `|`).
 * Writing `4*,gigantamax,shiny&shadow,shiny&locationbackground` is parsed by Pokémon GO as:
 *   (4* OR gigantamax OR shiny) AND (shadow OR shiny) AND (locationbackground)
 * which forces `locationbackground` on every match (only respecting the last entry after the comma).
 *
 * By applying the Boolean Distributive Law (X OR (Y AND Z) === (X,Y) & (X,Z)) and the
 * Absorption Law (A & (A,B) === A) at each step, this function converts any union of
 * compound AND-conditions into a single valid Pokémon GO search string.
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

      // Each AND factor is a Set of atomic comma-separated OR literals
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

  // Start with the first branch's CNF clauses
  let cnfClauses = parsedBranches[0];

  // Incrementally distribute OR over AND across each subsequent branch, applying Absorption at each step
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

  // Separate leading global AND prefixes that have no commas (e.g. `!#`, `!traded`, `age0-5`)
  // before the first comma-bearing segment, UNLESS the very first comma-bearing segment is a `term,term&term` bridge.
  const ampParts = trimmed.split('&').map((s) => s.trim()).filter(Boolean);

  // Detect if the user wrote comma-separated compound `&` expressions like:
  // `!#&4*,gigantamax,shiny&shadow,shiny&legendary` or `shiny&shadow,shiny&legendary`
  // Specifically: when splitting by `,`, at least one middle/later comma-item contains `&` AND
  // the raw string is NOT already a valid absorbed CNF (where `&`-clauses share a common distributed prefix).
  const leadingGlobalPrefixes = [];
  let idx = 0;
  while (idx < ampParts.length && !ampParts[idx].includes(',')) {
    // Wait: if ampParts[idx] is the left side of `shiny&shadow,shiny&legendary`, then `ampParts[idx + 1]` has `,`!
    // Only treat `ampParts[idx]` as a global prefix if it starts with `!` (like `!#`, `!traded`) or `year` or `age`
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

  // Check if splitting `remainder` by `,` yields compound `&` branches
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

  // Check if the query is ALREADY a distributed CNF (e.g. `4*,gigantamax,shiny&4*,gigantamax,shadow,legendary`)
  // In a valid distributed CNF, every `&`-clause in `remainder` is a pure comma-OR list, and compiling `remainder` as CNF equals itself.
  const remainderAmpClauses = remainder.split('&').map((c) => c.trim()).filter(Boolean);
  const firstClauseLiterals = remainderAmpClauses[0].split(',').map((s) => s.trim());
  const secondClauseLiterals = (remainderAmpClauses[1] || '').split(',').map((s) => s.trim());
  const sharedDistributedBase = firstClauseLiterals.filter((lit) => secondClauseLiterals.includes(lit));

  // If the first and second `&` clauses share distributed base terms (and there is no trailing single-literal `&token` trap),
  // or if one of the `&` clauses is a pure ID/appraisal/negation filter (`0*,1*,2*`, `!shiny`, `1-9,12-15`), it is already valid CNF!
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

export function parseSearchString(searchString) {
  // Initialize defaults structure
  const filters = {
    appraisal: [],
    ageMin: '',
    ageMax: '',
    types: [],
    attributeLogic: 'AND',
    ...ATTRIBUTES.reduce((acc, attr) => ({ ...acc, [attr]: null }), {})
  };
  const selectedIds = new Set();

  if (!searchString) return { selectedIds, filters };

  const parts = searchString.split('&');
  let sawCommaJoinedPositiveAttributes = false;

  parts.forEach(part => {
    part = part.trim();
    if (!part) return;

    // Check if the part is comma-delimited (OR condition in PoGo, e.g. 3*,4* or fire,water or shiny,lucky or 1,2,3)
    const subTokens = part.split(',').map(s => s.trim()).filter(Boolean);
    if (subTokens.length === 0) return;

    // 1. Appraisal tokens (e.g. 0*, 1*, 2*, 3*, 4*)
    const allAppraisal = subTokens.every(t => /^[0-4]\*$/.test(t.replace(/^!/, '')));
    if (allAppraisal) {
      subTokens.forEach(t => {
        if (!t.startsWith('!') && !filters.appraisal.includes(t)) {
          filters.appraisal.push(t);
        }
      });
      return;
    }

    // 2. Types list (e.g. fire, water, grass)
    const allTypes = subTokens.every(t => TYPES.includes(t.toLowerCase().replace(/^!/, '')));
    if (allTypes) {
      subTokens.forEach(t => {
        const typeClean = t.toLowerCase().replace(/^!/, '');
        if (!t.startsWith('!') && !filters.types.includes(typeClean)) {
          filters.types.push(typeClean);
        }
      });
      return;
    }

    // 3. ID / Numerical Range list (e.g. 1-151, 25, 172-174)
    const allIdsOrRanges = subTokens.every(t => /^[\d]+(-[\d]+)?$/.test(t));
    if (allIdsOrRanges) {
      subTokens.forEach(range => {
        if (range.includes('-')) {
          const [startStr, endStr] = range.split('-');
          const start = parseInt(startStr, 10);
          const end = parseInt(endStr, 10);
          if (!isNaN(start) && !isNaN(end)) {
            const min = Math.min(start, end);
            const max = Math.max(start, end);
            for (let i = min; i <= max; i++) {
              selectedIds.add(i);
            }
          }
        } else {
          const id = parseInt(range, 10);
          if (!isNaN(id) && id > 0) {
            selectedIds.add(id);
          }
        }
      });
      return;
    }

    // Check if multiple positive attributes are joined by `,` (OR) in this clause
    const positiveAttrTokensInClause = subTokens.filter((token) => {
      if (token.startsWith('!')) return false;
      const clean = ATTRIBUTE_ALIASES[token.toLowerCase()] || token.toLowerCase();
      return ATTRIBUTES.includes(clean);
    });
    if (positiveAttrTokensInClause.length > 1) {
      sawCommaJoinedPositiveAttributes = true;
    }

    // 4. Handle individual subTokens (attributes, age, or mixed tokens)
    const ageBoundsMin = [];
    const ageBoundsMax = [];

    subTokens.forEach(token => {
      let isNegated = false;
      let value = token;
      if (token.startsWith('!')) {
        isNegated = true;
        value = token.substring(1);
      }
      value = value.trim().toLowerCase();

      // Normalize aliases
      if (ATTRIBUTE_ALIASES[value]) {
        value = ATTRIBUTE_ALIASES[value];
      }

      // Age range (e.g. age0, age0-7, age30-, age-7, or comma-separated age0-2,age10-12)
      if (value.startsWith('age') && !isNegated) {
        const agePart = value.substring(3).trim();
        if (agePart.includes('-')) {
          const [min, max] = agePart.split('-');
          if (min !== '' && !isNaN(Number(min))) ageBoundsMin.push(Number(min));
          if (max !== '' && !isNaN(Number(max))) ageBoundsMax.push(Number(max));
        } else if (agePart !== '' && !isNaN(Number(agePart))) {
          ageBoundsMin.push(Number(agePart));
          ageBoundsMax.push(Number(agePart));
        }
        return;
      }

      // Known attributes
      if (ATTRIBUTES.includes(value)) {
        filters[value] = isNegated ? false : true;
        return;
      }

      // Single appraisal
      if (/^[0-4]\*$/.test(value)) {
        if (!isNegated && !filters.appraisal.includes(value)) {
          filters.appraisal.push(value);
        }
        return;
      }

      // Single type
      if (TYPES.includes(value)) {
        if (!isNegated && !filters.types.includes(value)) {
          filters.types.push(value);
        }
        return;
      }

      // Single ID or Range
      if (/^\d+(-\d+)?$/.test(value)) {
        if (value.includes('-')) {
          const [startStr, endStr] = value.split('-');
          const start = parseInt(startStr, 10);
          const end = parseInt(endStr, 10);
          if (!isNaN(start) && !isNaN(end)) {
            const min = Math.min(start, end);
            const max = Math.max(start, end);
            for (let i = min; i <= max; i++) {
              selectedIds.add(i);
            }
          }
        } else {
          const id = parseInt(value, 10);
          if (!isNaN(id) && id > 0) {
            selectedIds.add(id);
          }
        }
      }
    });

    if (ageBoundsMin.length > 0 || ageBoundsMax.length > 0) {
      filters.ageMin = ageBoundsMin.length > 0 ? String(Math.min(...ageBoundsMin)) : '';
      filters.ageMax = ageBoundsMax.length > 0 ? String(Math.max(...ageBoundsMax)) : '';
    }
  });

  if (sawCommaJoinedPositiveAttributes) {
    filters.attributeLogic = 'OR';
  }

  return { selectedIds, filters };
}
