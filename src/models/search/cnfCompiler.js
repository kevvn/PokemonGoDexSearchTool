/**
 * Bounded Pokémon GO DNF -> CNF Compiler & Safe Precedence Trap Inspector.
 *
 * Guarantees:
 * - Normalizes PoGO operator aliases (`|` -> `&`, `;`/`:` -> `,`)
 * - Deduplicates using canonical sorted literal keys & prunes tautologies (`x, !x`)
 * - Enforces hard clause/character caps so combinatorial inputs never freeze the UI
 * - Never falsely rewrites valid CNF queries (e.g. `3*,4*&4attack`, `legendary,ultrabeast&!shiny`,
 *   `shiny,lucky&!shadow`, `distance100-&shiny,costume&!traded`)
 */

const DEFAULT_MAX_CNF_CLAUSES = 256;
const DEFAULT_MAX_CNF_CHARS = 5000;

function isTautologicalClause(clauseSet) {
  for (const lit of clauseSet) {
    if (lit.startsWith('!')) {
      if (clauseSet.has(lit.slice(1))) return true;
    } else if (clauseSet.has(`!${lit}`)) {
      return true;
    }
  }
  return false;
}

function canonicalClauseKey(clauseSet) {
  return Array.from(clauseSet).sort().join(',');
}

function absorbSupersetClauses(clauses) {
  const unique = [];
  const seenKeys = new Set();

  const sorted = [...clauses].sort((a, b) => a.size - b.size);
  for (const clause of sorted) {
    if (clause.size === 0 || isTautologicalClause(clause)) continue;
    const key = canonicalClauseKey(clause);
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

function normalizeOperators(str) {
  return String(str || '')
    .replace(/\|/g, '&')
    .replace(/[;:]/g, ',')
    .replace(/!\s+/g, '!');
}

function isContradictoryBranch(branchFactors) {
  const unitLiterals = new Set();
  for (const factor of branchFactors) {
    if (factor.size === 1) {
      const [lit] = factor;
      const complement = lit.startsWith('!') ? lit.slice(1) : `!${lit}`;
      if (unitLiterals.has(complement)) return true;
      unitLiterals.add(lit);
    }
  }
  return false;
}

/**
 * Bounded DNF -> CNF compilation returning structured safety metadata.
 */
export function compileDnfToPogoCnfSafe(
  orBranches,
  globalAndTokens = [],
  { maxClauses = DEFAULT_MAX_CNF_CLAUSES, maxChars = DEFAULT_MAX_CNF_CHARS } = {}
) {
  const parsedBranches = (orBranches || [])
    .map((branch) => {
      const andParts = Array.isArray(branch)
        ? branch.flatMap((part) => normalizeOperators(part).split('&'))
        : normalizeOperators(branch).split('&');

      const factorSets = andParts
        .map((s) => s.trim())
        .filter(Boolean)
        .map((factor) => {
          const lits = factor
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
          return new Set(lits);
        })
        .filter((set) => set.size > 0);

      return absorbSupersetClauses(factorSets);
    })
    .filter((branchFactors) => branchFactors.length > 0 && !isContradictoryBranch(branchFactors));

  const prefixClean = (globalAndTokens || [])
    .map((t) => normalizeOperators(t).trim().replace(/&+$/, ''))
    .filter(Boolean);

  if (parsedBranches.length === 0) {
    const query = prefixClean.join('&');
    return {
      query,
      truncated: false,
      clauseCount: prefixClean.length,
      charLimitExceeded: query.length > maxChars,
    };
  }

  // Sort smallest-first so single-literal branches distribute early and maximize absorption
  const orderedBranches = [...parsedBranches].sort((a, b) => a.length - b.length);
  let cnfClauses = orderedBranches[0];
  let truncated = false;

  for (let i = 1; i < orderedBranches.length; i++) {
    const nextBranch = orderedBranches[i];
    const distributed = [];

    for (const existingClause of cnfClauses) {
      for (const branchFactor of nextBranch) {
        const merged = new Set([...existingClause, ...branchFactor]);
        if (!isTautologicalClause(merged)) {
          distributed.push(merged);
        }
        if (distributed.length >= maxClauses * 2) {
          truncated = true;
          break;
        }
      }
      if (truncated) break;
    }

    cnfClauses = absorbSupersetClauses(distributed);
    if (cnfClauses.length > maxClauses) {
      cnfClauses = cnfClauses.slice(0, maxClauses);
      truncated = true;
    }
    if (truncated) break;
  }

  const cnfStrings = cnfClauses.map((clauseSet) => Array.from(clauseSet).join(','));
  const query = [...prefixClean, ...cnfStrings].join('&');

  return {
    query,
    truncated,
    clauseCount: prefixClean.length + cnfStrings.length,
    charLimitExceeded: query.length > maxChars,
  };
}

/**
 * Compiles a Disjunctive Normal Form (DNF — an OR of AND-branches) into a minimal,
 * valid Pokémon GO Conjunctive Normal Form (CNF — an AND of OR-clauses) search string.
 */
export function compileDnfToPogoCnf(orBranches, globalAndTokens = [], options = {}) {
  return compileDnfToPogoCnfSafe(orBranches, globalAndTokens, options).query;
}

const SCOPE_OR_NEGATION_CLAUSE_REGEX =
  /^(?:!|#|@|age\d*|year\d*|distance\d*|cp\d*|count\d*|countcandy|buddy\d*|mega\d|maxmove|maxguard|maxspirit|[0-4](?:-[0-4])?(?:attack|defense|hp)$)/i;

function isScopeOrNegationClause(clause) {
  return !clause.includes(',') && SCOPE_OR_NEGATION_CLAUSE_REGEX.test(clause);
}

/**
 * Inspects a Pokémon GO search string for genuine `,` (OR) vs `&` (AND) precedence traps.
 *
 * Strictly avoids false positives on standard PoGO CNF queries (single OR-group + AND filters,
 * e.g., `!#&3*,4*&4attack&3-4defense&3-4hp`, `legendary,ultrabeast&count2-&!shiny`,
 * `shiny,lucky&!shadow`, `distance100-&shiny,costume,201,479&!traded&!#`).
 */
export function inspectAndFixPogoQuery(rawQuery) {
  const trimmed = String(rawQuery || '').trim();
  const normalized = normalizeOperators(trimmed);

  if (!normalized || !normalized.includes(',') || !normalized.includes('&')) {
    return {
      hasPrecedenceTrap: false,
      rawQuery: trimmed,
      pogoEvaluatedClauses: normalized ? normalized.split('&').filter(Boolean) : [],
      fixedCnfQuery: trimmed,
      extractedGlobalPrefixes: [],
      extractedOrBranches: [],
    };
  }

  const ampParts = normalized.split('&').map((s) => s.trim()).filter(Boolean);

  // Strip leading AND-scoped filters/negations (e.g., `!#`, `age0`, `year2026`, `distance100-`)
  const leadingGlobalPrefixes = [];
  let startIdx = 0;
  while (startIdx < ampParts.length && isScopeOrNegationClause(ampParts[startIdx])) {
    leadingGlobalPrefixes.push(ampParts[startIdx]);
    startIdx++;
  }

  // Strip trailing AND-scoped filters/negations (e.g., `&!traded&!#`, `&4attack&3-4defense&3-4hp`)
  const trailingGlobalSuffixes = [];
  let endIdx = ampParts.length - 1;
  while (endIdx >= startIdx && isScopeOrNegationClause(ampParts[endIdx])) {
    trailingGlobalSuffixes.unshift(ampParts[endIdx]);
    endIdx--;
  }

  const coreClauses = ampParts.slice(startIdx, endIdx + 1);
  const coreString = coreClauses.join('&');

  // If the core has no `,` or no `&`, it's standard CNF (e.g. `legendary,ultrabeast` or `3*,4*`)
  if (coreClauses.length < 2 || !coreString.includes(',')) {
    return {
      hasPrecedenceTrap: false,
      rawQuery: trimmed,
      pogoEvaluatedClauses: ampParts,
      fixedCnfQuery: trimmed,
      extractedGlobalPrefixes: leadingGlobalPrefixes,
      extractedOrBranches: [],
    };
  }

  const clausesWithComma = coreClauses.filter((c) => c.includes(','));

  // A single OR-clause at the start or end of core (e.g., `shiny,lucky&legendary` or `legendary&shiny,lucky`)
  // is standard PoGO CNF (`(A OR B) AND C`), NOT an accidental DNF trap.
  // A genuine DNF trap either has >= 2 comma clauses (e.g., `4*,shiny&shadow,shiny&legendary`)
  // OR an interior comma joining two AND-sides (e.g., `shiny&shadow,4*&legendary`, where `coreClauses`
  // has non-comma clauses BOTH before AND after a comma clause).
  const firstCommaIdx = coreClauses.findIndex((c) => c.includes(','));
  const lastCommaIdx = coreClauses.length - 1 - [...coreClauses].reverse().findIndex((c) => c.includes(','));
  const hasInteriorCommaSplit =
    clausesWithComma.length === 1 && firstCommaIdx > 0 && lastCommaIdx < coreClauses.length - 1;

  if (clausesWithComma.length < 2 && !hasInteriorCommaSplit) {
    return {
      hasPrecedenceTrap: false,
      rawQuery: trimmed,
      pogoEvaluatedClauses: ampParts,
      fixedCnfQuery: trimmed,
      extractedGlobalPrefixes: leadingGlobalPrefixes,
      extractedOrBranches: [],
    };
  }

  // Already-distributed valid CNF: every core clause has `,` and shares a distributed literal
  // OR every clause is a standard independent CNF filter (e.g. `0*,1*,2*&fire,water&1-151,201`)
  const isIndependentCnfClause = (cl) =>
    cl.startsWith('!') ||
    /^[0-4]\*(?:,[0-4]\*)*$/.test(cl) ||
    /^\d+(?:-\d+)?(?:,\d+(?:-\d+)?)*$/.test(cl) ||
    /^age\d*(?:-\d*)?(?:,age\d*(?:-\d*)?)*$/i.test(cl) ||
    /^[0-4](?:-[0-4])?(?:attack|defense|hp)(?:,[0-4](?:-[0-4])?(?:attack|defense|hp))*$/i.test(cl) ||
    /^#[a-z0-9-]+(?:,#[a-z0-9-]+)*$/i.test(cl) ||
    /^@[^,&]+(?:,@[^,&]+)*$/i.test(cl);

  const firstLiterals = coreClauses[0].split(',').map((s) => s.trim());
  const sharedAcrossAll =
    coreClauses.every((c) => c.includes(',')) &&
    firstLiterals.some((lit) =>
      coreClauses.slice(1).every((cl) => cl.split(',').map((s) => s.trim()).includes(lit))
    );

  if (sharedAcrossAll || coreClauses.every(isIndependentCnfClause)) {
    return {
      hasPrecedenceTrap: false,
      rawQuery: trimmed,
      pogoEvaluatedClauses: ampParts,
      fixedCnfQuery: trimmed,
      extractedGlobalPrefixes: leadingGlobalPrefixes,
      extractedOrBranches: [],
    };
  }

  const commaBranches = coreString.split(',').map((s) => s.trim()).filter(Boolean);
  const branchesWithAmp = commaBranches.filter((b) => b.includes('&'));
  if (branchesWithAmp.length === 0) {
    return {
      hasPrecedenceTrap: false,
      rawQuery: trimmed,
      pogoEvaluatedClauses: ampParts,
      fixedCnfQuery: trimmed,
      extractedGlobalPrefixes: leadingGlobalPrefixes,
      extractedOrBranches: [],
    };
  }

  const compiled = compileDnfToPogoCnfSafe(commaBranches, [
    ...leadingGlobalPrefixes,
    ...trailingGlobalSuffixes,
  ]);

  if (compiled.truncated || compiled.charLimitExceeded || compiled.query === normalized) {
    return {
      hasPrecedenceTrap: false,
      rawQuery: trimmed,
      pogoEvaluatedClauses: ampParts,
      fixedCnfQuery: trimmed,
      extractedGlobalPrefixes: leadingGlobalPrefixes,
      extractedOrBranches: commaBranches,
    };
  }

  return {
    hasPrecedenceTrap: true,
    rawQuery: trimmed,
    pogoEvaluatedClauses: ampParts,
    fixedCnfQuery: compiled.query,
    extractedGlobalPrefixes: leadingGlobalPrefixes,
    extractedOrBranches: commaBranches,
  };
}
