/**
 * Costume Pikachu Triage & Cleanup Model (Mode E).
 *
 * Pure domain logic for slicing, auditing, and safely pruning large Costume Pikachu
 * collections (e.g., 1,000+ inventory slots) down to a configurable per-costume cap
 * (default: ≤6 per costume) without ever using broken `costume&count2-` syntax.
 */
import {
  COSTUME_PIKACHU_REGISTRY,
  COSTUME_PIKACHU_RARITY_TIERS,
  TOTAL_DISTINCT_PIKACHU_COSTUMES,
} from '../data/costumePikachuRegistry';
import { joinClauses, joinOr } from './searchEngine';
import { createDefaultTagMap, mergeTagMap } from './tagModel';

export {
  COSTUME_PIKACHU_REGISTRY,
  COSTUME_PIKACHU_RARITY_TIERS,
  TOTAL_DISTINCT_PIKACHU_COSTUMES,
};

export const PIKACHU_KEEP_CAPS = [2, 4, 6, 8];

export const PIKACHU_GENDER_OPTIONS = [
  { id: 'all', label: 'Both Genders', token: '' },
  { id: 'male', label: 'Male Only (Flat Tail)', token: 'male' },
  { id: 'female', label: 'Female Only (Heart Tail)', token: 'female' },
];

export const PIKACHU_CATALOG_TRAIT_FILTERS = [
  { id: 'all', label: 'All Traits' },
  { id: 'evolvable', label: 'Can Evolve → Raichu' },
  { id: 'signature-move', label: 'Signature / Legacy Move' },
  { id: 'background', label: 'Background Eligible' },
  { id: 'pichu', label: 'Has Costume Pichu' },
];

const ALWAYS_KNOWN_MOVES = new Set([
  'Fly',
  'Flying Press',
  'Meteor Mash',
  'Draining Kiss',
  'Volt Tackle',
]);

const VINTAGE_CUTOFF_YEAR = 2020;

/**
 * Dynamically derive sorted distinct years from `COSTUME_PIKACHU_REGISTRY`
 * (zero hardcoded year arrays).
 */
export function getAvailablePikachuYears(registry = COSTUME_PIKACHU_REGISTRY) {
  const yearSet = new Set();
  for (const entry of registry) {
    if (Array.isArray(entry.years)) {
      for (const y of entry.years) {
        if (Number.isInteger(y)) yearSet.add(y);
      }
    }
  }
  return Array.from(yearSet).sort((a, b) => b - a);
}

/**
 * Build interactive year-slice selector pills dynamically from registry data.
 */
export function getPikachuYearSlices(registry = COSTUME_PIKACHU_REGISTRY) {
  const years = getAvailablePikachuYears(registry);
  const modernYears = years.filter((y) => y > VINTAGE_CUTOFF_YEAR);
  const minYear = years.length > 0 ? years[years.length - 1] : 2016;

  return [
    { id: 'all', label: 'All Years', token: '' },
    ...modernYears.map((y) => ({
      id: `year${y}`,
      label: String(y),
      token: `year${y}`,
    })),
    {
      id: `year${minYear}-${VINTAGE_CUTOFF_YEAR}`,
      label: `${minYear}–${VINTAGE_CUTOFF_YEAR} Vintage`,
      token: `year${minYear}-${VINTAGE_CUTOFF_YEAR}`,
    },
  ];
}

/**
 * Compress an array of integer years into compact PoGO `yearYYYY` / `yearYYYY-YYYY` OR tokens.
 */
export function compressYearTokens(years = []) {
  const unique = Array.from(new Set(years.filter((y) => Number.isInteger(y)))).sort((a, b) => a - b);
  if (unique.length === 0) return '';

  const ranges = [];
  let start = unique[0];
  let end = unique[0];
  for (let i = 1; i < unique.length; i++) {
    if (unique[i] === end + 1) {
      end = unique[i];
    } else {
      ranges.push(start === end ? `year${start}` : `year${start}-${end}`);
      start = unique[i];
      end = unique[i];
    }
  }
  ranges.push(start === end ? `year${start}` : `year${start}-${end}`);
  return joinOr(...ranges);
}

/**
 * Compute storage-reduction budget for a target per-costume cap (default: 6).
 */
export function computePikachuStorageBudget(keepCap = 6, currentCount = 1000) {
  const safeCap = Math.max(1, Math.min(20, Number(keepCap) || 6));
  const perGenderCap = Math.max(1, Math.floor(safeCap / 2));
  const maxTotalSlots = TOTAL_DISTINCT_PIKACHU_COSTUMES * safeCap;
  const estimatedSavings = Math.max(0, currentCount - maxTotalSlots);

  let recommendedSplit;
  if (safeCap <= 2) {
    recommendedSplit = '1 Male + 1 Female (Living Gender Dex only)';
  } else if (safeCap <= 4) {
    recommendedSplit = '1M + 1F Keepers + up to 2 Shiny/BG/Trade Spares (≤2M / ≤2F)';
  } else if (safeCap <= 6) {
    recommendedSplit = '1M + 1F Keepers + up to 4 Shiny/BG/Trade Spares (≤3M / ≤3F)';
  } else {
    recommendedSplit = `1M + 1F Keepers + up to ${safeCap - 2} Trade/BG Spares (≤${perGenderCap}M / ≤${perGenderCap}F)`;
  }

  return {
    keepCap: safeCap,
    perGenderCap,
    distinctCostumes: TOTAL_DISTINCT_PIKACHU_COSTUMES,
    maxTotalSlots,
    currentCount,
    estimatedSavings,
    recommendedSplit,
  };
}

/**
 * Generate the tightest verified Pokémon GO search string to locate a specific
 * costume entry in storage (combining year(s), evolution eligibility, always-known
 * signature moves, gender locks, and GBL origin).
 */
export function buildCostumeEntrySearchString(entry, { includeFamily = false } = {}) {
  if (!entry) return '25&costume';
  const speciesToken = includeFamily ? '172,25,26' : '25';
  const parts = [speciesToken, 'costume'];

  const yearClause = compressYearTokens(entry.years);
  if (yearClause) parts.push(yearClause);

  if (entry.originHint === 'gbl') {
    parts.push('gbl');
  }
  if (entry.signatureMove && ALWAYS_KNOWN_MOVES.has(entry.signatureMove)) {
    parts.push(`@${entry.signatureMove.toLowerCase()}`);
  }
  if (entry.canEvolve && !includeFamily) {
    parts.push('evolve');
  }
  if (entry.genderLock === 'male' || entry.genderLock === 'female') {
    parts.push(entry.genderLock);
  }

  return joinClauses(...parts);
}

/**
 * Filter the Costume Pikachu catalog by free-text search, rarity tier, year slice, and trait.
 */
export function filterCostumePikachuCatalog(
  registry = COSTUME_PIKACHU_REGISTRY,
  { search = '', rarity = 'all', yearSlice = '', trait = 'all' } = {}
) {
  const q = String(search || '').trim().toLowerCase();

  return registry.filter((entry) => {
    if (rarity && rarity !== 'all' && entry.rarity !== rarity) {
      return false;
    }

    if (yearSlice) {
      const rangeMatch = yearSlice.match(/^year(\d{4})-(\d{4})$/);
      const singleMatch = yearSlice.match(/^year(\d{4})$/);
      if (rangeMatch) {
        const minY = Number(rangeMatch[1]);
        const maxY = Number(rangeMatch[2]);
        if (!entry.years.some((y) => y >= minY && y <= maxY)) return false;
      } else if (singleMatch) {
        const targetY = Number(singleMatch[1]);
        if (!entry.years.includes(targetY)) return false;
      }
    }

    if (trait === 'evolvable' && !entry.canEvolve) return false;
    if (trait === 'signature-move' && !entry.signatureMove) return false;
    if (trait === 'background' && !entry.backgroundPossible) return false;
    if (trait === 'pichu' && !entry.hasPichu) return false;

    if (q) {
      const haystack = `${entry.name} ${entry.appearances} ${entry.notes} ${entry.signatureMove || ''} ${entry.years.join(' ')}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }

    return true;
  });
}

/**
 * Build Mode E: Costume Pikachu Triage & Storage Reduction Funnel (7 steps: P1–P7).
 *
 * Accepts `buildSafeTrashQuery` via dependency injection from `triageFunnelModel.js`
 * to guarantee strictly acyclic imports in `src/models/`.
 */
export function buildCostumePikachuMode({
  buildSafeTrashQuery,
  safetyShields = {},
  customTagMap = null,
  keepCap = 6,
  yearSlice = '',
  gender = '',
  includeFamily = false,
} = {}) {
  const tagMap = customTagMap ? mergeTagMap(customTagMap) : createDefaultTagMap();
  const budget = computePikachuStorageBudget(keepCap);
  const speciesToken = includeFamily ? '172,25,26' : '25';
  const genderToken = gender === 'male' || gender === 'female' ? gender : '';
  const yearToken = typeof yearSlice === 'string' && /^year\d{4}(?:-\d{4})?$/.test(yearSlice)
    ? yearSlice
    : '';
  const isVintageSlice = yearToken === 'year2016-2020' || /^year20(?:1[6-9]|20)$/.test(yearToken);

  const availableYears = getAvailablePikachuYears();
  const latestYear = availableYears[0] || 2026;
  const prevYear = availableYears[1] || latestYear - 1;

  // For Pikachu-scoped mass-transfer strings (P6 & P7), disable irrelevant species-class shields
  // and `costume` (since we are intentionally cleaning untagged surplus costumes), while keeping
  // EVERY Pikachu-relevant grail shield active (`!#`, `!favorite`, `!shiny`, `!background`,
  // `!lucky`, `!xxl`, `!xxs`, `!distance100-`, `!@special`, `!buddy1-`, `!candyxl`, `!maxmove1-`,
  // `!shadow`, `!eggsonly`, `@3mov`, PvP IVs, Nundos) plus vintage & origin locks!
  const pikachuTrashShields = {
    ...safetyShields,
    costume: false,
    rareSpecies: false,
    legendary: false,
    mythical: false,
    ultrabeast: false,
    fusion: false,
    adventureEffect: false,
  };

  const trashScopeExclusions = [
    speciesToken,
    'costume',
    '!year2016-2020',
    '!gbl',
    '!snapshot',
    '!hatched',
    '!party',
    ...(yearToken && !isVintageSlice ? [yearToken] : []),
    ...(genderToken ? [genderToken] : []),
  ];

  const stepP1 = {
    id: 'P1',
    title: 'Lock Untouchable Pikachu Grails (4★, Shiny, BG, Lucky, XXL/XXS & Nundos)',
    query: joinClauses(speciesToken, 'costume', '!#', '4*,shiny,background,lucky,xxl,xxs'),
    subQueries: [
      {
        label: 'Lock 0% Nundo Costume Pikachus (0/0/0)',
        query: joinClauses(speciesToken, 'costume', '!#', '0attack', '0defense', '0hp'),
        isTrash: false,
      },
      {
        label: 'All Background Costume Pikachus (Location, Special & Profile BGs)',
        query: joinClauses(speciesToken, 'costume', '!#', 'locationbackground,specialbackground,profilebackground'),
        isTrash: false,
      },
    ],
    action: `Favorite (★) and tag all grails first: ${tagMap.ev_shbg.name} (shiny&background), ${tagMap.ev_locbg.name} (locationbackground), ${tagMap.ev_global.name} (specialbackground), ${tagMap.keep_trophy.name} (4★/Nundo/Lucky/Shiny keepers), ${tagMap.op_xxl.name} (largest XXL per costume), and spare shinies/BGs → ${tagMap.tr_spec.name}.`,
    isTrash: false,
  };

  const stepP2 = {
    id: 'P2',
    title: 'Lock Signature-Move, Origin-Locked & Regional/Foreign Pikachus',
    query: joinClauses(
      speciesToken,
      'costume',
      '!#',
      '@special,@fly,@surf,@present,@flying press,@meteor mash,@draining kiss,@volt tackle,@grass knot'
    ),
    subQueries: [
      {
        label: 'Origin-Locked Grails (GBL Libre, Snapshot Clone/2019 Detective, Hatched, Party)',
        query: joinClauses(speciesToken, 'costume', '!#', 'gbl,snapshot,hatched,party'),
        isTrash: false,
      },
      {
        label: 'Foreign / Regional Travel Pikachus (100km+ Distance, Un-Traded)',
        query: joinClauses(speciesToken, 'costume', '!#', 'distance100-', '!traded'),
        isTrash: false,
      },
    ],
    action: `Instantly separates irreplaceable movesets (Flying Balloons, Libre, Pop/Rock Star, Cap's Hat Volt Tackle, 2022 Grass Knot Shaymin Scarf, 2017 Present Santa), 1-per-account/origin exclusives, and foreign regional Pikachus (Kariyushi, Batik, Saree, Kurta, Jeju, Taipei, Singapore, PokéXciting!, Hanbok, Baseball, Excavator). Tag up to ${budget.keepCap} per costume (${tagMap.keep_trophy.name} + ${tagMap.tr_spec.name}).`,
    isTrash: false,
  };

  const stepP3 = {
    id: 'P3',
    title: 'Audit Vintage 2016–2020 Pikachus (Lucky Trade Value & One-Off Collabs)',
    query: joinClauses(speciesToken, 'costume', 'year2016-2020', genderToken, '!#'),
    subQueries: [
      {
        label: '2016–2019 Classics (Fragment Hat, Straw Hat, 2019 Detective, OG Hats)',
        query: joinClauses(speciesToken, 'costume', 'year2016-2019', genderToken, '!#'),
        isTrash: false,
      },
      {
        label: '2020 One-Offs (Clone, Throwback Caps, Safari, World Cap, Explorer)',
        query: joinClauses(speciesToken, 'costume', 'year2020', genderToken, '!#'),
        isTrash: false,
      },
    ],
    action: `Sort by #. 2016–2020 catches carry guaranteed/elevated Lucky trade odds and include never-returned collabs (Fragment Hat, Straw Hat, Clone, Throwback Caps). Keep up to ${budget.keepCap} per costume (${budget.recommendedSplit}) in ${tagMap.keep_trophy.name}/${tagMap.tr_spec.name}; Steps P6–P7 automatically shield !year2016-2020.`,
    isTrash: false,
  };

  const stepP4 = {
    id: 'P4',
    title: 'Audit Evolvable Costume Pikachus (Only ~14 Costumes Evolve → Raichu)',
    query: joinClauses('25', 'costume', 'evolve', yearToken, genderToken, '!#'),
    subQueries: [
      {
        label: 'Unregistered Costume Raichu Evolutions (evolvenew)',
        query: joinClauses('25', 'costume', 'evolvenew'),
        isTrash: false,
      },
      {
        label: 'Costume Pichu (#172 Egg-Exclusive) & Costume Raichu (#26) Audit',
        query: joinClauses('172,26', 'costume', '!#'),
        isTrash: false,
      },
    ],
    action: `evolve narrows 95+ costumes down to ONLY the ~14 that can become Costume Raichu (Santa, Purple Party, Ash/Original Cap, Witch, Summer, Fragment, Flower Crown, 2019/2023 Detective, Winter Beanie, World Cap, NYE 2021, Cherry Blossom, Holiday Attire). Sort by #, evolve 1–2 for Raichu Dex, and tag ≤${budget.keepCap} Pikachu per costume.`,
    isTrash: false,
  };

  const stepP5 = {
    id: 'P5',
    title: `Year & Gender Slicer — Cap Each Costume at ≤${budget.keepCap} (Sort by #)`,
    query: joinClauses(speciesToken, 'costume', yearToken, genderToken, '!#'),
    subQueries: [
      {
        label: 'Raid & Research 10/10/10 IV Floor Copies (Pick Best IV Keepers First)',
        query: joinClauses(speciesToken, 'costume', 'raid,research', yearToken, genderToken, '!#'),
        isTrash: false,
      },
      {
        label: `${latestYear} Non-Evolvable Bloat Slice (10th Anniv, Kalos Tour, GO Fest Team Hats)`,
        query: joinClauses(speciesToken, 'costume', `year${latestYear}`, '!evolve', genderToken, '!#'),
        isTrash: false,
      },
      {
        label: `${prevYear} Non-Evolvable Bloat Slice (Unova Tour, GO Fest Dapper/Formal, Worlds)`,
        query: joinClauses(speciesToken, 'costume', `year${prevYear}`, '!evolve', genderToken, '!#'),
        isTrash: false,
      },
    ],
    action: `NEVER use count2- or count7- on 25&costume (PoGO counts all Dex #25 together!). Sort by # so identical outfits sit side-by-side (sub-sorted by CP). Toggle Male/Female above to keep ≤${budget.perGenderCap} per gender (≤${budget.keepCap} total: ${budget.recommendedSplit}), tag them ${tagMap.keep_trophy.name}/${tagMap.tr_spec.name}, and leave extras untagged for P6/P7.`,
    isTrash: false,
  };

  const stepP6 = {
    id: 'P6',
    title: 'Ultra-Safe Untagged Surplus Purge (0★–2★ Non-Vintage Costume Pikachus)',
    query: buildSafeTrashQuery({
      ageScope: '',
      starScope: '0*,1*,2*',
      includeIvShields: true,
      extraExclusions: trashScopeExclusions,
      safetyShields: pikachuTrashShields,
    }),
    action: `Run ONLY after tagging your ≤${budget.keepCap} keepers per costume in Steps P1–P5! Safely mass-transfers leftover untagged 0★–2★ Costume Pikachus (2021–${latestYear}) while shielding !#, !favorite, Shinies, BGs, Luckies, XXL/XXS, 100km+ Regionals, @special, G-Max (!maxmove1-), Costume Pichu (!eggsonly), Vintage 2016–2020, GBL Libre, Snapshots, Party, Buddies, XL-Powered, @3mov, PvP IVs & Nundos.`,
    isTrash: true,
  };

  const stepP7 = {
    id: 'P7',
    title: 'Post-Screening Final Costume Pikachu Sweep (0★–3★ Untagged Excess)',
    query: buildSafeTrashQuery({
      ageScope: '',
      starScope: '0*,1*,2*,3*',
      includePvpIvShield: false,
      includeNundoShield: true,
      extraExclusions: trashScopeExclusions,
      safetyShields: pikachuTrashShields,
    }),
    subQueries: [
      {
        label: 'Verify Untagged Costume Pikachu Inbox Zero (Inspect Any Remaining !#)',
        query: joinClauses(speciesToken, 'costume', '!#', '!favorite'),
        isTrash: false,
      },
    ],
    action: `Run ONLY after tagging your best 3★ Raid/Research keepers (up to ${budget.keepCap} per costume) in Steps P1–P5! Sweeps leftover untagged 0★–3★ duplicates (including rejected 3★ raid extras and 0–1atk spreads) while still shielding 4★, Shinies, BGs, Luckies, XXL/XXS, 100km+ Regionals, @special, Vintage 2016–2020, GBL/Snapshot/Hatched/Party, Buddies, XL-Powered, @3mov, and Nundos.`,
    isTrash: true,
  };

  return {
    id: 'modeE',
    title: 'Costume Pikachu Cleanup & 6-Per-Costume Reduction Funnel',
    subtitle: `Built to cut 1,000+ Costume Pikachus down to ≤${budget.keepCap} per costume (~${budget.maxTotalSlots.toLocaleString()} max across ~${budget.distinctCostumes} variants) using safe date, move, evolution, and gender slicing.`,
    budget,
    steps: [stepP1, stepP2, stepP3, stepP4, stepP5, stepP6, stepP7],
  };
}
