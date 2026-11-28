/**
 * Public facade for the Pokémon GO Storage Search Engine (Leidwesen/SearchPhrases v0.435.1).
 * Composed from cohesive submodules under `src/models/search/`:
 * - `operatorRegistry.js`: Declarative vocabulary, ranges, aliases, and native keywords
 * - `idRanges.js`: Dex ID compression/expansion and De Morgan IV complements
 * - `queryBuilder.js`: CNF AST parser, structured filter round-tripper, and active filter counter
 * - `validator.js`: PoGO syntax & trap guardrails
 * - `cnfCompiler.js`: Bounded DNF -> CNF compiler & safe precedence inspector
 */

export {
  REGIONS,
  REGION_KEYWORDS,
  TYPES,
  APPRAISALS,
  ATTRIBUTES,
  ATTRIBUTE_GROUPS,
  ATTRIBUTE_ALIASES,
  RANGE_OPERATORS,
  NATIVE_POGO_KEYWORDS,
} from './search/operatorRegistry';

export {
  MAX_DEX_RANGE_EXPANSION,
  PVP_IV_EXCLUDE_CLAUSE,
  NUNDO_EXCLUDE_CLAUSE,
  SCARCE_RARE_SPECIES_IDS,
  SCARCE_RARE_SPECIES_RANGES,
  RARE_SPECIES_EXCLUDE_CLAUSE,
  compressIds,
  compressIdRanges,
  negateCompressedRanges,
  expandIds,
  invertIvStatRange,
} from './search/idRanges';

export {
  joinClauses,
  joinOr,
  createDefaultFilters,
  parseToAst,
  normalizeSearchString,
  parseSearchString,
  generateSearchString,
  countActiveFilters,
} from './search/queryBuilder';

export { validateSearchString } from './search/validator';

export {
  compileDnfToPogoCnf,
  compileDnfToPogoCnfSafe,
  compileSpeciesTraitWishlist,
  inspectAndFixPogoQuery,
} from './search/cnfCompiler';
