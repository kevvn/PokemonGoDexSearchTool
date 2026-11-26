import {
  compressIds,
  negateCompressedRanges,
  joinClauses,
  joinOr,
  PVP_IV_EXCLUDE_CLAUSE,
  NUNDO_EXCLUDE_CLAUSE,
  SCARCE_RARE_SPECIES_IDS,
  SCARCE_RARE_SPECIES_RANGES,
  RARE_SPECIES_EXCLUDE_CLAUSE,
  TYPES,
} from './searchEngine';
import { ALL_COMMUNITY_DAY_PRE_EVO_IDS } from './communityDayModel';
import { MAX_POKEDEX_ID } from './familyModel';
import {
  CANDY_12_FODDER_IDS,
  TRADE_EVOLVE_IDS,
  CLASSIC_GL_XL_FLOOR_IDS,
  CLASSIC_PVE_TYPE_SHADOW_IDS,
  DEFAULT_FAST_MOVES_500MS,
} from '../data/speciesConstants';
import {
  createDefaultTagMap,
  mergeTagMap,
  getTagHash,
  getNamespaceHashes,
  getNamespaceExclusions,
} from './tagModel';
import { buildCostumePikachuMode } from './costumePikachuModel';

export { DEFAULT_FAST_MOVES_500MS };
export const DEFAULT_CANDY_12_FODDER = CANDY_12_FODDER_IDS;
export const DEFAULT_TRADE_EVOLVE_DEX = TRADE_EVOLVE_IDS;

export const AGE_SCOPES = [
  { id: 'age0', label: 'Today (24h)', token: 'age0' },
  { id: 'age0-1', label: 'Last 48h (age0-1)', token: 'age0-1' },
  { id: 'age0-2', label: 'Weekend (0–2d)', token: 'age0-2' },
  { id: 'age0-7', label: 'Last 7 Days', token: 'age0-7' },
  { id: 'all', label: 'All Time', token: '' },
];

export const SAFETY_SHIELD_DEFINITIONS = [
  { id: 'untagged', label: 'Untagged Only (!#)', token: '!#', defaultEnabled: true, category: 'lock', placement: 'prefix' },
  { id: 'favorite', label: 'Protect Favorites (!favorite)', token: '!favorite', defaultEnabled: true, category: 'lock', placement: 'prefix' },
  { id: 'shiny', label: 'Protect Shinies (!shiny)', token: '!shiny', defaultEnabled: true, category: 'rarity', placement: 'body' },
  { id: 'background', label: 'Protect Backgrounds (!background)', token: '!background', defaultEnabled: true, category: 'rarity', placement: 'body' },
  { id: 'costume', label: 'Protect Costumes (!costume)', token: '!costume', defaultEnabled: true, category: 'rarity', placement: 'body' },
  { id: 'legendary', label: 'Protect Legendaries (!legendary)', token: '!legendary', defaultEnabled: true, category: 'rarity', placement: 'body' },
  { id: 'mythical', label: 'Protect Mythicals (!mythical)', token: '!mythical', defaultEnabled: true, category: 'rarity', placement: 'body' },
  { id: 'ultrabeast', label: 'Protect Ultra Beasts (!ultrabeast)', token: '!ultrabeast', defaultEnabled: true, category: 'rarity', placement: 'body' },
  { id: 'shadow', label: 'Protect Shadows (!shadow)', token: '!shadow', defaultEnabled: true, category: 'mechanics', placement: 'body' },
  { id: 'max', label: 'Protect All Max Battle (!maxmove1-)', token: '!maxmove1-', defaultEnabled: true, category: 'mechanics', placement: 'body' },
  { id: 'xxl', label: 'Protect XXL (!xxl)', token: '!xxl', defaultEnabled: true, category: 'size', placement: 'body' },
  { id: 'xxs', label: 'Protect XXS (!xxs)', token: '!xxs', defaultEnabled: true, category: 'size', placement: 'body' },
  { id: 'specialMove', label: 'Protect Legacy/Elite (@special)', token: '!@special', defaultEnabled: true, category: 'investment', placement: 'body' },
  { id: 'lucky', label: 'Protect Luckies (!lucky)', token: '!lucky', defaultEnabled: true, category: 'rarity', placement: 'body' },
  { id: 'eggsonly', label: 'Protect Babies (!eggsonly)', token: '!eggsonly', defaultEnabled: true, category: 'rarity', placement: 'body' },
  { id: 'distance100', label: 'Protect 100km+ Distance (!distance100-)', token: '!distance100-', defaultEnabled: true, category: 'rarity', placement: 'body' },
  { id: 'fusion', label: 'Protect Fusions (!fusion)', token: '!fusion', defaultEnabled: true, category: 'mechanics', placement: 'body' },
  { id: 'adventureEffect', label: 'Protect Adventure Effects (!adventureeffect)', token: '!adventureeffect', defaultEnabled: true, category: 'mechanics', placement: 'body' },
  { id: 'buddy', label: 'Protect Buddies (!buddy1-)', token: '!buddy1-', defaultEnabled: true, category: 'investment', placement: 'body' },
  { id: 'candyxl', label: 'Protect XL-Powered (!candyxl)', token: '!candyxl', defaultEnabled: true, category: 'investment', placement: 'body' },
  { id: 'rareSpecies', label: 'Protect Unown, Rotom, Regionals & Pseudos', token: RARE_SPECIES_EXCLUDE_CLAUSE, defaultEnabled: true, category: 'rarity', placement: 'body' },
  { id: 'singleMoveOnly', label: 'Protect 2nd-Moved (@3mov)', token: '@3mov', defaultEnabled: true, category: 'investment', placement: 'suffix' },
  { id: 'pvpIv', label: 'Protect PvP IVs (2-4atk,0-2def,0-2hp)', token: PVP_IV_EXCLUDE_CLAUSE, defaultEnabled: true, category: 'iv', placement: 'iv' },
  { id: 'nundo', label: 'Protect 0% Nundos (1-4atk,1-4def,1-4hp)', token: NUNDO_EXCLUDE_CLAUSE, defaultEnabled: true, category: 'iv', placement: 'iv' },
];

export function createDefaultSafetyShields() {
  const shields = {};
  for (const def of SAFETY_SHIELD_DEFINITIONS) {
    shields[def.id] = def.defaultEnabled;
  }
  return shields;
}

/**
 * Build a safe trash/mass-transfer query declaratively from `SAFETY_SHIELD_DEFINITIONS`,
 * honoring age scope, star scope, and customizable safety shields.
 */
export function buildSafeTrashQuery({
  ageScope = 'age0',
  starScope = '0*,1*,2*',
  countDuplicate = false,
  excludeTraded = false,
  includeIvShields = true,
  includePvpIvShield,
  includeNundoShield,
  extraExclusions = [],
  safetyShields = {},
} = {}) {
  const shields = { ...createDefaultSafetyShields(), ...safetyShields };
  const usePvpIv = includePvpIvShield !== undefined ? includePvpIvShield : includeIvShields;
  const useNundo = includeNundoShield !== undefined ? includeNundoShield : includeIvShields;
  const parts = [];

  if (ageScope) parts.push(ageScope);
  for (const def of SAFETY_SHIELD_DEFINITIONS) {
    if (def.placement === 'prefix' && shields[def.id] && def.token) {
      parts.push(def.token);
    }
  }
  if (countDuplicate) parts.push('count2-');
  if (starScope) parts.push(starScope);

  for (const def of SAFETY_SHIELD_DEFINITIONS) {
    if (def.placement === 'body' && shields[def.id] && def.token) {
      parts.push(def.token);
    }
  }
  if (excludeTraded) parts.push('!traded');

  if (Array.isArray(extraExclusions)) {
    for (const ex of extraExclusions) {
      if (ex) parts.push(ex);
    }
  }

  for (const def of SAFETY_SHIELD_DEFINITIONS) {
    if (def.placement === 'suffix' && shields[def.id] && def.token) {
      parts.push(def.token);
    }
  }

  if (usePvpIv && shields.pvpIv) parts.push(PVP_IV_EXCLUDE_CLAUSE);
  if (useNundo && shields.nundo) parts.push(NUNDO_EXCLUDE_CLAUSE);

  return joinClauses(...parts);
}

export function computeStrictNonMetaIdsFromSnapshot(metaSnapshot = {}, maxDexId = MAX_POKEDEX_ID) {
  const pvp = metaSnapshot?.pvp || {};
  const pve = metaSnapshot?.pve || {};
  const max = metaSnapshot?.maxBattles || {};
  const special = metaSnapshot?.specialLists || {};

  const byTypeFlat = pve.byType ? Object.values(pve.byType).flat() : [];
  const protectedSet = new Set([
    ...(pvp.gl?.top100?.all || []),
    ...(pvp.gl?.top100?.lowAtk || []),
    ...(pvp.gl?.top100?.highAtk || []),
    ...(pvp.ul?.top100?.all || []),
    ...(pvp.ul?.top100?.lowAtk || []),
    ...(pvp.ul?.top100?.highAtk || []),
    ...(pvp.ml?.top100?.all || []),
    ...(pvp.allShadow || []),
    ...(pvp.allTradeReroll || []),
    ...(pve.top30Overall || []),
    ...(pve.topShadow || []),
    ...(pve.topMegaEvolved || []),
    ...(pve.topMegaFamily || []),
    ...byTypeFlat,
    ...(max.attackers || []),
    ...(max.tanksAndHealers || []),
    ...(special.tradeEvolve || TRADE_EVOLVE_IDS),
    ...CLASSIC_GL_XL_FLOOR_IDS,
    ...CLASSIC_PVE_TYPE_SHADOW_IDS,
    ...SCARCE_RARE_SPECIES_IDS,
  ]);

  const nonMeta = [];
  for (let id = 1; id <= maxDexId; id++) {
    if (!protectedSet.has(id)) nonMeta.push(id);
  }
  return nonMeta;
}

function buildModeA(ctx) {
  const {
    ageScope,
    safetyShields,
    tagMap,
    glLowDex,
    ulLowDex,
    glUlLowDex,
    glUlHighDex,
    highIvMetaDex,
    mirrorMetaDex,
  } = ctx;

  const stepA1 = {
    id: 'A1',
    title: 'Lock Grails, 4★ Hundos, Shinies & Backgrounds',
    query: joinClauses(ageScope, '!#', '4*,shiny,background'),
    subQueries: [
      {
        label: 'Lock 0% Collector Nundos (0/0/0)',
        query: joinClauses(ageScope, '!#', '0attack', '0defense', '0hp'),
        isTrash: false,
      },
    ],
    action: `Favorite (★) all keepers. Route combat 4★ Hundos → ${tagMap.pve_wip.name} / ${tagMap.pve_megawip.name} / ${tagMap.pvp_ml.name} / ${tagMap.max_wip.name} (not just ${tagMap.keep_trophy.name}!). Tag ${tagMap.ev_shbg.name} (shiny&background), ${tagMap.ev_locbg.name} (locationbackground), or ${tagMap.ev_global.name} (specialbackground); sort by # and tag spare shinies/BGs → ${tagMap.tr_spec.name}.`,
    isTrash: false,
  };

  const stepA2 = {
    id: 'A2',
    title: 'Screen Raid Bosses, Shadows, Max Pokémon & Legacy Moves',
    query: joinClauses(
      ageScope,
      '!#',
      'legendary,mythical,ultrabeast,maxmove1-,shadow,fusion,adventureeffect,costume'
    ),
    subQueries: [
      {
        label: 'True Legacy / Event Moves (Excludes Frustration & Return)',
        query: joinClauses(ageScope, '!#', '@special', '!@frustration', '!@return'),
        isTrash: false,
      },
      {
        label: 'Max Battles Only (D-Max / G-Max / Crowned)',
        query: joinClauses(ageScope, '!#', 'maxmove1-'),
        isTrash: false,
      },
      {
        label: 'Shadows Only',
        query: joinClauses(ageScope, '!#', 'shadow'),
        isTrash: false,
      },
    ],
    action: `Tag viable Max mons (${tagMap.max_wip.name}/${tagMap.max_candy.name}), Shadows (${tagMap.pve_wip.name}/${tagMap.pvp_wip.name}/${tagMap.op_tmfrust.name}), spare Legendaries (${tagMap.tr_spec.name}/${tagMap.op_2xxfer.name}), and keeper Costumes (${tagMap.keep_trophy.name}/${tagMap.tr_spec.name}). Sort leftover 0★–2★ non-meta Shadows/D-Max/Costumes by # and transfer excess now so !# stays clean.`,
    isTrash: false,
  };

  const stepA3 = {
    id: 'A3',
    title: 'Meta PvP IV Sweep (Top-100 GL & UL — Low-Atk + XL High-Atk)',
    query: joinClauses(ageScope, '!#', '0-1attack', '3-4defense', '3-4hp', 'cp-2500', glUlLowDex),
    subQueries: [
      ...(glUlHighDex
        ? [
            {
              label: 'GL & UL XL / High-Atk Meta Families (Lickitung, Medicham, Corsola, Tinkaton)',
              query: joinClauses(ageScope, '!#', '2-4attack', '3-4defense', '3-4hp', 'cp-2500', glUlHighDex),
              isTrash: false,
            },
          ]
        : []),
      ...(glLowDex
        ? [
            {
              label: `Great League Only — Top-100 Low-Atk (≤1500 CP → Tag ${tagMap.pvp_gl.name})`,
              query: joinClauses(ageScope, '!#', '0-1attack', '3-4defense', '3-4hp', 'cp-1500', glLowDex),
              isTrash: false,
            },
          ]
        : []),
      ...(ulLowDex
        ? [
            {
              label: `Ultra League Only — Top-100 Low-Atk (≤2500 CP → Tag ${tagMap.pvp_ul.name})`,
              query: joinClauses(ageScope, '!#', '0-1attack', '3-4defense', '3-4hp', 'cp-2500', ulLowDex),
              isTrash: false,
            },
          ]
        : []),
      {
        label: 'All-Species Broad Low-Atk Spread (Limited Cup Spice)',
        query: joinClauses(ageScope, '!#', '0-1attack', '3-4defense', '3-4hp', 'cp-2500'),
        isTrash: false,
      },
    ],
    action: `Tag directly by target league (${tagMap.pvp_gl.name} for ≤1500 CP, ${tagMap.pvp_ul.name} for ≤2500 CP) AND add ${tagMap.pvp_wip.name} (or ${tagMap.op_evocd.name}) if it still needs powering up, evolving, or a 2nd Charged Move.`,
    isTrash: false,
  };

  const stepA4 = {
    id: 'A4',
    title: 'Meta PvE Raid, Mega & Master League 3★ (11–15 Atk)',
    query: highIvMetaDex
      ? joinClauses(ageScope, '!#', '3*', '3-4attack', highIvMetaDex)
      : joinClauses(ageScope, '!#', '3*', '3-4attack', '3-4defense', '3-4hp'),
    subQueries: [
      {
        label: 'All-Species 91–98% High 3★ (Living Dex / Trophy Check)',
        query: joinClauses(ageScope, '!#', '3*', '3-4attack', '3-4defense', '3-4hp'),
        isTrash: false,
      },
      {
        label: 'New Pokédex Evolutions',
        query: joinClauses(ageScope, '!#', 'evolvenew'),
        isTrash: false,
      },
    ],
    action: `Scoped to Raid, Mega, Max, and Master League families without requiring 3-4defense/hp — catches 15/10/15 glass-cannon raiders while skipping 3★ Raticates. Tag keepers → ${tagMap.pve_wip.name}, ${tagMap.pve_megawip.name}, ${tagMap.pvp_wip.name}, or ${tagMap.op_evocd.name}.`,
    isTrash: false,
  };

  const stepA5 = {
    id: 'A5',
    title: 'Route Rare Spawns, 100km+ Distance, Mirror XL & XXL Showcases',
    query: joinClauses(ageScope, '!#', '!traded', joinOr('eggsonly', SCARCE_RARE_SPECIES_RANGES)),
    subQueries: [
      {
        label: 'Distance Trades (100km+ → 3 Candy + Guaranteed XL)',
        query: joinClauses(ageScope, '!#', 'distance100-', '!traded', '!shadow', '!fusion'),
        isTrash: false,
      },
      ...(mirrorMetaDex
        ? [
            {
              label: 'Meta, Pseudo & CD Mirror Spares (0★–2★)',
              query: joinClauses(ageScope, '!#', '!traded', '!shadow', '!fusion', '0*,1*,2*', mirrorMetaDex),
              isTrash: false,
            },
          ]
        : []),
      {
        label: 'XXL & XXS Showcase / Size Medal Check',
        query: joinClauses(ageScope, '!#', 'xxl,xxs'),
        isTrash: false,
      },
    ],
    action: `Tag Unown/Rotom/Regionals → ${tagMap.tr_spec.name} (keep 1 anchor in ${tagMap.keep_trophy.name}), 100km+ catches & foreign 7km hatches → ${tagMap.tr_dist.name}, meta/pseudo spares → ${tagMap.tr_mirror.name}, and ONLY your largest 1–2 XXL/species → ${tagMap.op_xxl.name}.`,
    isTrash: false,
  };

  const stepA6 = {
    id: 'A6',
    title: 'Ultra-Safe Shielded Trash Purge (0★–2★)',
    query: buildSafeTrashQuery({
      ageScope,
      starScope: '0*,1*,2*',
      includeIvShields: true,
      safetyShields,
    }),
    action: 'Safe even if you skipped Steps A3–A5: shields Shinies, Backgrounds, Costumes, Legendaries/Mythicals/UBs, Shadows, Max, Babies, Unown/Rotom/Regionals/Pseudos, 100km+ Distance, XXL/XXS, Buddies, XL-Powered, @special, 2nd-moved (@3mov), PvP IVs, and 0% Nundos.',
    isTrash: true,
  };

  const stepA7 = {
    id: 'A7',
    title: 'Post-Screening Final Sweep (Clear Rejected 0★–3★ Commons → Inbox Zero)',
    query: buildSafeTrashQuery({
      ageScope,
      starScope: '0*,1*,2*,3*',
      includePvpIvShield: false,
      includeNundoShield: true,
      safetyShields: {
        ...safetyShields,
        xxl: false,
        xxs: false,
      },
    }),
    subQueries: [
      {
        label: 'Verify !# Inbox Zero (Inspect Any Remaining Untagged)',
        query: joinClauses(ageScope, '!#', '!favorite'),
        isTrash: false,
      },
    ],
    action: 'Run ONLY after completing Steps A1–A5: sweeps non-meta 0-1atk commons rejected in A3, rejected XL/3★ commons from A3–A4, and small XXL/XXS spares rejected in A5 (still shielding Nundos, Buddies, XL-Powered, @3mov, Rares, and 100km+) so !# genuinely reaches zero.',
    isTrash: true,
  };

  return {
    id: 'modeA',
    title: 'Post-Catch & Event-Day Inbox-Zero Funnel',
    subtitle: 'Exact meta-scoped screening from Grails → Raid/Shadow/Max → PvP (Low-Atk + XL) → PvE 3★ → Trades/Showcases → True !# Inbox Zero.',
    steps: [stepA1, stepA2, stepA3, stepA4, stepA5, stepA6, stepA7],
    stepA6Query: stepA6.query,
  };
}

function buildEmergencyDump(ageScope, stepA6Query) {
  return {
    id: 'emergency',
    title: '15-Second Mid-Event Emergency Dump',
    subtitle: 'Paste Step E1 directly mid-GO Fest or Comm Day — 100% self-shielded (protects 3★–4★, Shinies, BGs, Unown/Rotom/Regionals/Pseudos, Babies, 100km+, Max, Shadows, XXL/XXS, Buddies, XL-Powered, PvP IVs, Nundos & @3mov) with zero pre-tagging required.',
    steps: [
      {
        id: 'E1',
        title: '1-Tap Self-Shielded 0★–2★ Dump (Paste → Select All → Transfer)',
        query: stepA6Query,
        action: 'Transfer in batches of 50–100 to prevent client lag. Mathematically excludes every grail, regional, rare spawn, PvP spread, nundo, buddy, and invested build automatically.',
        isTrash: true,
      },
      {
        id: 'E2',
        title: "Optional: Favorite Today's Grails (4★, Shiny, BG)",
        query: joinClauses(ageScope, '!favorite', '4*,shiny,background'),
        action: 'Optional pocket-tap lock: star (★) newly caught 4★, Shinies, and Backgrounds while walking; full tagging can wait until post-event Mode A.',
        isTrash: false,
      },
      {
        id: 'E3',
        title: "Optional: Favorite Today's 0% Nundos",
        query: joinClauses(ageScope, '!favorite', '0attack', '0defense', '0hp'),
        action: 'Optional pocket-tap lock: star (★) any 0/0/0 Nundo caught today (already excluded from E1 via 1-4atk,1-4def,1-4hp).',
        isTrash: false,
      },
    ],
  };
}

function buildModeB(ctx) {
  const {
    safetyShields,
    tagMap,
    notT,
    nsExc,
    strictNonMetaDex,
    b4MetaNegation,
    pveShadowNegation,
  } = ctx;

  const shadowProtectedOpTags = [
    notT('op_tmfrust'),
    notT('op_evocd'),
    notT('op_powerwip'),
    notT('op_powerup'),
    notT('op_buddy'),
    notT('op_xxl'),
    notT('op_2xxfer'),
    notT('op_purify1k'),
  ].filter(Boolean);

  const steps = [
    {
      id: 'B1',
      title: 'Untagged Backlog Inbox',
      query: '!#&!favorite',
      action: 'Bootstrap existing storage with the 6-Stage Hydration Walkthrough (Tag System tab) or run Mode A with "All Time" scope until !#&!favorite hits zero.',
      isTrash: false,
    },
    {
      id: 'B2',
      title: 'True 1-of-1 Living Dex Singletons (Protect)',
      query: '!#&count1',
      action: `count1 matches National Dex #s where you own literally 1 copy in your entire box. Tag Living Dex anchors → ${tagMap.keep_trophy.name} + ★ before duplicate pruning.`,
      isTrash: false,
    },
    {
      id: 'B3',
      title: 'Duplicate Non-Keeper Commons (0★–2★)',
      query: buildSafeTrashQuery({
        ageScope: '',
        starScope: '0*,1*,2*',
        countDuplicate: true,
        excludeTraded: true,
        includeIvShields: true,
        safetyShields,
      }),
      subQueries: strictNonMetaDex
        ? [
            {
              label: 'Strict Non-Meta Species Purge (0★–3★ — Zero PvP/PvE/Max/Rare Overlap)',
              query: joinClauses(
                buildSafeTrashQuery({
                  ageScope: '',
                  starScope: '0*,1*,2*,3*',
                  countDuplicate: false,
                  excludeTraded: true,
                  includePvpIvShield: false,
                  includeNundoShield: true,
                  safetyShields,
                }),
                strictNonMetaDex
              ),
              isTrash: true,
            },
          ]
        : [],
      action: 'Important: count2- returns ALL copies of any species with ≥2 in storage (not N−1). If maintaining a Living Dex, Sort by # and leave 1 copy per species; otherwise use the Strict Non-Meta 0★–3★ companion query.',
      isTrash: true,
    },
    {
      id: 'B4',
      title: 'Duplicate Non-Meta 3★ Bloat',
      query: buildSafeTrashQuery({
        ageScope: '',
        starScope: '3*',
        countDuplicate: true,
        excludeTraded: false,
        includePvpIvShield: false,
        includeNundoShield: false,
        extraExclusions: b4MetaNegation ? [b4MetaNegation] : [],
        safetyShields,
      }),
      action: 'Excludes Top PvE Raid/Mega/Max/ML staples, XL GL/UL meta species (Lickitung/Corsola/Tinkaton), and scarce rares so multi-attacker raid teams are protected. Sort by Number (#): keep your best specimen per non-meta family and transfer lower duplicates.',
      isTrash: true,
    },
    {
      id: 'B5',
      title: 'XXL / XXS Hoard Audit',
      query: joinClauses('xxl,xxs', '!shiny', '!4*', '!background', '!favorite', notT('op_xxl')),
      subQueries: [
        {
          label: 'Safe Evolve Spares for Platinum Size Medals',
          query: joinClauses(
            'xxl,xxs', 'evolve', '!favorite', '!shiny', '!4*', '!background',
            '!legendary', '!mythical', '!ultrabeast', '!shadow', '!maxmove1-', notT('op_xxl')
          ),
          isTrash: false,
        },
      ],
      action: `Sort by # → tag ONLY your 1–2 largest XXL per species into ${tagMap.op_xxl.name}; evolve spares first for Platinum XXL/XXS medals, then transfer. (!maxmove1- shields non-evolving G-Max Pikachu/Meowth/Eevee from PoGO's evolve bug.)`,
      isTrash: false,
    },
    {
      id: 'B6',
      title: 'Untagged Costumes Audit (Sort by #)',
      query: 'costume&!shiny&!4*&!background&!favorite&!#',
      action: `Never combine costume with count2-/count3- (all Pikachu hats share Dex #25, flagging 1-of-1 costumes!). Instead, Sort by # so identical outfits group together, tag 1–2 keepers (${tagMap.keep_trophy.name}/${tagMap.tr_spec.name}), then transfer remaining !# extras.`,
      isTrash: false,
    },
    {
      id: 'B7',
      title: 'Duplicate Legendaries & Ultra Beasts',
      query: joinClauses(
        'legendary,ultrabeast', 'count2-', '!shiny', '!4*', '!background', '!favorite',
        '!fusion', '!adventureeffect', '!@special',
        ...nsExc('pve'), ...nsExc('pvp'), ...nsExc('max'), notT('tr_spec'), notT('op_2xxfer')
      ),
      subQueries: [
        {
          label: 'Untagged @special Legacy Legendaries (Sort by # to Review)',
          query: joinClauses(
            'legendary,ultrabeast', '@special', '!shiny', '!4*', '!background', '!favorite',
            '!fusion', '!adventureeffect',
            ...nsExc('pve'), ...nsExc('pvp'), ...nsExc('max'), notT('tr_spec'), notT('op_2xxfer')
          ),
          isTrash: false,
        },
      ],
      action: `Protects Fusions, Adventure Effects, and @special moves from plain raid clutter. Keep top 1–6 PvE/ML specimens + ${tagMap.tr_spec.name} trade stock; route excess to ${tagMap.op_2xxfer.name}. (Legacy sub-query omits count2- so 1-of-1 legacy moves are reviewed cleanly sorted by #.)`,
      isTrash: false,
    },
    {
      id: 'B8',
      title: 'Expendable Low-IV Non-Meta Shadows',
      query: joinClauses(
        'shadow', '0*,1*,2*', '!shiny', '!legendary', '!mythical', '!background', '!costume', '!favorite',
        '!xxl', '!xxs', '!distance100-', '!buddy1-', '!candyxl',
        RARE_SPECIES_EXCLUDE_CLAUSE,
        ...nsExc('pvp'), ...nsExc('pve'), ...nsExc('keep'), ...nsExc('ev'), ...nsExc('tr'),
        ...shadowProtectedOpTags,
        pveShadowNegation,
        '@3mov', PVP_IV_EXCLUDE_CLAUSE, NUNDO_EXCLUDE_CLAUSE
      ),
      action: 'Purges junk 0★–2★ shadows while shielding Top PvE/PvP Shadow families (+20% shadow DPS), Rares, 100km+ Distance, XXL/XXS, Buddies, XL-Powered, 0-1atk PvP IVs, Nundos, 2nd-moved builds, and all Rocket TM / Showcase / 2x Xfer / Purify queues. (!@special is intentionally omitted because Frustration counts as @special.)',
      isTrash: true,
    },
    {
      id: 'B9',
      title: 'Expendable Un-Upgraded Dynamax Clutter',
      query: joinClauses(
        '!#', '!favorite', 'dynamax', '!shiny', '!background', '!costume',
        '!legendary', '!mythical', '!ultrabeast', '!lucky', '!xxl', '!xxs',
        '!distance100-', '!@special', '!fusion', '!adventureeffect', '!buddy1-', '!candyxl',
        '0*,1*,2*',
        RARE_SPECIES_EXCLUDE_CLAUSE,
        '@3mov', '!maxmove2-', '!maxguard1-', '!maxspirit1-',
        PVP_IV_EXCLUDE_CLAUSE, NUNDO_EXCLUDE_CLAUSE
      ),
      action: `Sort by # first to keep 1–3 best per useful Max species (${tagMap.max_wip.name}/${tagMap.max_candy.name}), then clear leftover 0★–2★ common D-Max clutter. Protects G-Max, Toxtricity/rares, XXL/XXS, 100km+, @special, Buddies, XL-Powered, PvP IVs, Nundos, 2nd-moved builds, and any upgraded Max Move.`,
      isTrash: true,
    },
    {
      id: 'B10',
      title: 'Event & Background Collection Review',
      query: 'locationbackground&!#',
      subQueries: [
        { label: 'Global Special Backgrounds', query: 'specialbackground&!#', isTrash: false },
        { label: 'Shiny + Any Background (Grails)', query: 'shiny&background&!#', isTrash: false },
        { label: 'Profile Backgrounds', query: 'profilebackground&!#', isTrash: false },
      ],
      action: `Sort by # and route every background catch to ${tagMap.ev_shbg.name}, ${tagMap.ev_locbg.name}, ${tagMap.ev_global.name}, or ${tagMap.tr_spec.name} and dual-lock keepers (★).`,
      isTrash: false,
    },
  ];

  return {
    id: 'modeB',
    title: 'Deep Storage Cleanout',
    subtitle: 'Full-box audit with strict non-meta species isolation, safe # sorting for variants, and shadow/Max protections.',
    steps,
  };
}

function buildModeC(ctx) {
  const {
    tagMap,
    pveType,
    t,
    glLowDex,
    glHighDex,
    ulLowDex,
    ulHighDex,
    mlAllDex,
    pvpShadowDex,
    pvpTradeDex,
    pveTopDex,
    pveTypeDex,
    pveShadowDex,
    pveMegaEvolvedDex,
    pveMegaPreEvoDex,
    maxAtkDex,
    maxTankHealDex,
    fastMoves,
  } = ctx;

  const modeCPvp = [
    {
      id: 'C1_gl_low',
      title: 'GL Meta — Low-Atk Species (Top 100, ≤1500 CP)',
      query: joinClauses('!#', '0-1attack', '3-4defense', '3-4hp', 'cp-1500', glLowDex),
      action: 'Covers Great League Top 100 low-attack families (defaultIVs Atk ≤ 5), capped at cp-1500 so over-leveled catches never clutter results.',
      isTrash: false,
    },
    {
      id: 'C1_gl_high',
      title: 'GL Meta — High-Atk / XL Species (≤1500 CP)',
      query: joinClauses('!#', '2-4attack', '3-4defense', '3-4hp', 'cp-1500', glHighDex),
      action: 'Catches XL/raid-floor GL staples (Lickitung, Medicham, Bastiodon, Sableye, Carbink, Corsola, Pachirisu, Florges).',
      isTrash: false,
    },
    {
      id: 'C1_ul_low',
      title: 'UL Meta — Low-Atk Species (Top 100, ≤2500 CP)',
      query: joinClauses('!#', '0-1attack', '3-4defense', '3-4hp', 'cp-2500', ulLowDex),
      action: 'Covers Ultra League Top 100 low-attack families (defaultIVs Atk ≤ 5), capped at cp-2500.',
      isTrash: false,
    },
    {
      id: 'C1_ul_high',
      title: 'UL Meta — High-Atk / XL / Hundo-Cap (≤2500 CP)',
      query: joinClauses('!#', '3*,4*', 'cp-2500', ulHighDex),
      action: 'Catches XL-capped UL powerhouses (Tinkaton, Zygarde, Virizion, Jellicent, Talonflame, Umbreon, Mandibuzz).',
      isTrash: false,
    },
    {
      id: 'C1_ml',
      title: 'ML Meta — Top IV Breakpoint Screen (Top 100)',
      query: joinClauses('!#', '3*,4*', '4attack', '3-4defense', '3-4hp', mlAllDex),
      action: 'Prioritizes 15 Attack (4attack) + 93–100% IVs for Master League CMP ties and fast-move breakpoints.',
      isTrash: false,
    },
    {
      id: 'C1_shadow',
      title: 'PvP Shadow Meta Candidates (All Leagues)',
      query: joinClauses('!#', 'shadow', pvpShadowDex),
      subQueries: [
        {
          label: 'GL/UL Low-Atk Shadow Spreads (≤2500 CP)',
          query: joinClauses('!#', 'shadow', '0-1attack', '3-4defense', '3-4hp', 'cp-2500', pvpShadowDex),
          isTrash: false,
        },
        {
          label: 'ML & XL 3★–4★ Shadow Spreads',
          query: joinClauses('!#', 'shadow', '3*,4*', pvpShadowDex),
          isTrash: false,
        },
      ],
      action: `Screen untagged shadows of Top-100 PvP Shadow families; tag keepers → ${tagMap.pvp_wip.name} + ${tagMap.op_tmfrust.name}.`,
      isTrash: false,
    },
    {
      id: 'C1_trade',
      title: 'PvP Trade Reroll Targets (Low-IV Hunts)',
      query: joinClauses('!#', '!traded', '!shadow', '!fusion', '!shiny', '!4*', pvpTradeDex),
      action: 'Raid/research Legendaries & Ultra Beasts needing trade IV rerolls to dip under GL/UL CP caps.',
      isTrash: false,
    },
    {
      id: 'C1_xl_ready',
      title: 'PvP Build Queue Audits (XL-Ready, Needs 2nd Move, Needs Evo)',
      query: joinClauses(
        joinOr(t('pvp_wip'), t('pvp_gl'), t('pvp_ul'), t('pvp_ml')) || '#pvp-wip,#pvp-gl,#pvp-ul,#pvp-ml',
        'countcandyxl296-'
      ),
      subQueries: [
        {
          label: 'League-Tagged Needing 2nd Charged Move (@3mov)',
          query: joinClauses(
            joinOr(t('pvp_gl'), t('pvp_ul'), t('pvp_ml'), t('pvp_cup'), t('pvp_wip')) || '#pvp-gl,#pvp-ul,#pvp-ml,#pvp-cup,#pvp-wip',
            '@3mov'
          ),
          isTrash: false,
        },
        {
          label: 'League-Tagged Needing Evolution',
          query: joinClauses(
            joinOr(t('pvp_gl'), t('pvp_ul'), t('pvp_ml'), t('pvp_cup'), t('pvp_wip')) || '#pvp-gl,#pvp-ul,#pvp-ml,#pvp-cup,#pvp-wip',
            'evolve'
          ),
          isTrash: false,
        },
      ],
      action: `Audits your league-tagged pool (${tagMap.pvp_gl.name} / ${tagMap.pvp_ul.name} / ${tagMap.pvp_ml.name} / ${tagMap.pvp_wip.name}) for specimens with 296+ XL candy banked, still missing a 2nd Charged Move (@3mov), or still needing evolution.`,
      isTrash: false,
    },
  ];

  const modeCPve = [
    {
      id: 'C2_overall',
      title: 'Top Regular / Legendary Raid Candidates',
      query: joinClauses('!#', '!shadow', '3*,4*', '4attack', pveTopDex),
      action: '15-Attack 3★/4★ candidates across Top 30 overall S/A-tier PvE families.',
      isTrash: false,
    },
    {
      id: 'C2_by_type',
      title: `Top 10 ${pveType.charAt(0).toUpperCase() + pveType.slice(1)}-Type Raid Attackers`,
      query: joinClauses('!#', '3*,4*', '4attack', pveTypeDex),
      action: 'Per-type Top 10 attacker families from clean-room eDPS/ER snapshot.',
      isTrash: false,
    },
    {
      id: 'C2_shadow',
      title: 'Protect ALL Top Shadow PvE Attackers',
      query: joinClauses('!#', 'shadow', pveShadowDex),
      action: 'Catches 0★–4★ shadows of S/A-tier raid attackers (+20% shadow DPS outperforms 4★ non-shadows).',
      isTrash: false,
    },
    {
      id: 'C2_mega_leveling',
      title: 'Daily Free Mega Leveling (to Lv3 Max / Lv4 Super Max)',
      query: 'mega1-2&megaevolve',
      subQueries: [
        { label: 'Lv4 Super Max Target (mega1-3)', query: 'mega1-3&megaevolve', isTrash: false },
        { label: 'Tagged Mega Queue', query: joinClauses(t('op_mega') || '#op-mega', 'megaevolve'), isTrash: false },
      ],
      action: `Evolves active Mega leveling roster on free cooldown; remove ${tagMap.op_mega.name} once maxed (mega3 or mega4).`,
      isTrash: false,
    },
    {
      id: 'C2_mega_candidates',
      title: "Un-Mega'd High-IV Mega Candidates",
      query: joinClauses('!#', '!shadow', 'mega0', '3*,4*', '4attack', pveMegaEvolvedDex),
      subQueries: [
        {
          label: 'Mega Pre-Evolutions Only (Strict Pre-Evo Dexes)',
          query: pveMegaPreEvoDex
            ? joinClauses('!#', '!shadow', '3*,4*', '4attack', pveMegaPreEvoDex)
            : joinClauses('!#', '!shadow', 'evolve', '3*,4*', '4attack'),
          isTrash: false,
        },
        {
          label: 'Tagged WIP Megas',
          query: t('pve_megawip') || '#pve-megawip',
          isTrash: false,
        },
      ],
      action: `mega0 matches un-Mega'd fully evolved forms, while the Pre-Evolutions sub-query targets ONLY unevolved pre-evos (Charmander, Beldum, Riolu) so already-Mega'd mega1–4 forms never leak in. Tag → ${tagMap.pve_megawip.name}.`,
      isTrash: false,
    },
    {
      id: 'C2_lobby_lookup',
      title: `Built Raid Party Lookup (@${pveType})`,
      query: joinClauses(t('pve_raid') || '#pve-raid', `@${pveType}`),
      action: 'Rapid raid-lobby filtering by move type without needing 18 separate type tags.',
      isTrash: false,
    },
  ];

  const fastMoveInclude = fastMoves.map((m) => `@1${m}`).join(',');
  const fastMoveExcludeClauses = fastMoves.map((m) => `!@1${m}`);
  const tankHealTags = joinOr(t('max_tank'), t('max_heal'));

  const maxAuditSubQueries = [
    {
      label: 'Tanks Needing Max Guard Lv3 (!maxguard3)',
      query: joinClauses(t('max_tank') || '#max-tank', '!maxguard3'),
      isTrash: false,
    },
  ];
  if (t('max_heal')) {
    maxAuditSubQueries.push({
      label: 'Healers Needing Max Spirit Lv3 (!maxspirit3)',
      query: joinClauses(t('max_heal'), '!maxspirit3'),
      isTrash: false,
    });
  }

  const modeCMax = [
    {
      id: 'C3_inbox',
      title: 'All Max-Battle-Eligible Inbox',
      query: '!#&maxmove1-',
      action: 'Complete umbrella — catches Dynamax, Gigantamax, Crowned Zacian, Crowned Zamazenta, and Eternatus.',
      isTrash: false,
    },
    {
      id: 'C3_attackers',
      title: 'Max Attacker Candidates (15 Atk)',
      query: joinClauses('!#', 'maxmove1-', '4attack', '3*,4*', maxAtkDex),
      action: 'Prioritizes G-Max (450 BP), Eternatus, Crowned Zacian, and top D-Max Attackers.',
      isTrash: false,
    },
    {
      id: 'C3_tanks',
      title: 'Max Tank & Healer Candidates (High Bulk)',
      query: joinClauses('!#', 'maxmove1-', '3-4defense', '3-4hp', maxTankHealDex),
      action: 'High Def/HP Blissey/Chansey, Zamazenta, Metagross, Corviknight, Excadrill, Lapras, Blastoise, Snorlax.',
      isTrash: false,
    },
    {
      id: 'C3_fast_with',
      title: 'Max Pokémon WITH a 0.5s Fast Move',
      query: joinClauses('maxmove1-', fastMoveInclude),
      action: `Verifies fast-charging Tanks/Healers across all ${fastMoves.length} collision-free 500ms fast moves (@1 targets Fast Move slot).`,
      isTrash: false,
    },
    {
      id: 'C3_fast_missing',
      title: 'Tagged Tanks MISSING a 0.5s Fast Move (Need Fast TM)',
      query: joinClauses(tankHealTags || 'maxmove1-', ...fastMoveExcludeClauses),
      action: `Instant Fast-TM audit for Tanks & Healers using De Morgan negation of all ${fastMoves.length} 500ms moves.`,
      isTrash: false,
    },
    {
      id: 'C3_audits',
      title: 'Max Move Investment Audits (Not Yet Lv3)',
      query: joinClauses(t('max_atk') || '#max-atk', 'maxmove1-2'),
      subQueries: maxAuditSubQueries,
      action: 'Finds tagged Attackers, Tanks (!maxguard3), and Healers (!maxspirit3) that are locked or Lv1–2 (scoped by #max-* tags so regular non-Max storage never leaks in).',
      isTrash: false,
    },
  ];

  return {
    id: 'modeC',
    title: 'Competitive & Endgame Meta Triage',
    subtitle: 'Auto-generated family-expanded species lists from PvPoke Top 100, clean-room PvE Top 10/type, and PokéChespin Max Battles.',
    sections: {
      pvp: { title: 'PvP — GO Battle League (Top 100)', steps: modeCPvp },
      pve: { title: 'PvE Raid Attackers & Mega Engine', steps: modeCPve },
      maxBattles: { title: 'Max Battles — Dynamax, Gigantamax & Crowned Legends', steps: modeCMax },
    },
  };
}

function buildModeD(ctx) {
  const { tagMap, t, notT, nsInc, nsExc, candy12Dex, tradeEvoDex, tradeEvoNegation } = ctx;

  const badTradeTagExclusions = [
    ...nsExc('pvp'),
    ...nsExc('pve'),
    ...nsExc('max'),
    ...nsExc('keep'),
    ...nsExc('ev'),
    notT('op_xxl'),
    notT('op_mega'),
    notT('op_evocd'),
    notT('op_evoxp'),
    notT('op_powerwip'),
    notT('op_powerup'),
    notT('op_2xxfer'),
  ].filter(Boolean);

  const steps = [
    {
      id: 'D1_2xxfer',
      title: '2x Transfer Candy Spotlight Hour',
      query: joinClauses(t('op_2xxfer') || '#op-2xxfer', '!favorite'),
      action: 'Mass-transfer queued rares, legendaries, and bad legendary rerolls in 50–100 batches.',
      isTrash: true,
    },
    {
      id: 'D2_bad_trades',
      title: 'Failed Common Trade Rerolls Cleanup (0★–2★)',
      query: joinClauses(
        'traded', '0*,1*,2*', '!lucky', '!4*', '!shiny', '!background', '!costume',
        '!legendary', '!mythical', '!ultrabeast', '!favorite', '!@special',
        '!maxmove1-', '!fusion', '!adventureeffect', '!xxl', '!xxs', '!eggsonly',
        '!buddy1-', '!candyxl',
        RARE_SPECIES_EXCLUDE_CLAUSE,
        '@3mov',
        PVP_IV_EXCLUDE_CLAUSE, NUNDO_EXCLUDE_CLAUSE,
        tradeEvoNegation,
        ...badTradeTagExclusions
      ),
      subQueries: [
        {
          label: `Failed 0★–2★ Legendary / UB Rerolls → Tag ${tagMap.op_2xxfer.name}`,
          query: joinClauses(
            'traded', '0*,1*,2*', 'legendary,ultrabeast', '!lucky', '!shiny', '!background',
            '!favorite', '!@special', '!fusion', '!adventureeffect', '!buddy1-', '!candyxl', '@3mov',
            PVP_IV_EXCLUDE_CLAUSE,
            ...badTradeTagExclusions
          ),
          isTrash: false,
        },
      ],
      action: `Safely clears failed 0★–2★ common trades while protecting non-lucky 3★ rerolls, Regionals/Unowns/Pseudos, Babies, XXL/XXS, Buddies, XL-Powered, 0-1atk PvP rerolls, Nundos, free 0-candy trade evolutions, and Legendaries/UBs (route failed Legendaries via the companion query to ${tagMap.op_2xxfer.name} for 2x Candy!).`,
      isTrash: true,
    },
    {
      id: 'D3_distance',
      title: 'Distance Trade Prep (100km+)',
      query: 'distance100-&!traded&!shadow&!fusion&!shiny&!legendary&!mythical&!ultrabeast&!4*&!favorite&!#',
      subQueries: [
        {
          label: 'S2 Cell Edge-Safe (101km+)',
          query: 'distance101-&!traded&!shadow&!fusion&!shiny&!legendary&!mythical&!ultrabeast&!4*&!favorite&!#',
          isTrash: false,
        },
      ],
      action: `Tag into ${tagMap.tr_dist.name}; during trade sessions search ${t('tr_dist') || '#tr-dist'}&!traded.`,
      isTrash: false,
    },
    {
      id: 'D4_mirror_session',
      title: 'Daily Mirror / Distance Trade Session',
      query: joinClauses(joinOr(t('tr_mirror'), t('tr_dist')) || '#tr-mirror,#tr-dist', '!traded'),
      action: 'Pulls all un-traded regular trade fodder in one tap.',
      isTrash: false,
    },
    {
      id: 'D5_special_trade',
      title: 'Special / Lucky Trade Showcase',
      query: joinClauses(t('tr_spec') || '#tr-spec', '!traded'),
      action: 'Ready-to-show trade binder for Lucky Friends and meetups.',
      isTrash: false,
    },
    {
      id: 'D6_frustration',
      title: 'Team GO Rocket Takeover (Frustration TM)',
      query: joinClauses(
        'shadow',
        '@frustration',
        joinOr('3*', '4*', ...nsInc('pvp'), ...nsInc('pve'), t('op_tmfrust'))
      ),
      action: `Prioritizes tagged and high-IV shadows; remove ${tagMap.op_tmfrust.name} once Frustration is TM'd away.`,
      isTrash: false,
    },
    {
      id: 'D7_commday_evo',
      title: 'Comm Day / Legacy Move Evolution',
      query: joinClauses(t('op_evocd') || '#op-evocd', 'evolve'),
      action: `Evolve queued candidates during move window, then re-tag to ${tagMap.pvp_gl.name}/${tagMap.pvp_ul.name}/${tagMap.pve_raid.name}.`,
      isTrash: false,
    },
    {
      id: 'D8_evoxp',
      title: '2x Evolution XP Spotlight Hour',
      query: joinClauses(t('op_evoxp') || '#op-evoxp', 'evolve'),
      subQueries: [
        {
          label: '12-Candy Fodder',
          query: joinClauses('!#', '!favorite', 'evolve', candy12Dex),
          isTrash: false,
        },
        {
          label: 'Already-Traded Free Evos (0 Candy)',
          query: joinClauses('traded', 'evolve', tradeEvoDex),
          isTrash: false,
        },
        {
          label: 'Un-Traded Trade-Evos (Send to Friend)',
          query: 'tradeevolve&!traded',
          isTrash: false,
        },
      ],
      action: 'Pop Lucky Egg → evolve → transfer! Note: tradeevolve never matches already-traded Pokémon — use the explicit Dex list for free 0-candy evolves.',
      isTrash: false,
    },
    {
      id: 'D9_buddy',
      title: 'Daily Best Buddy Swap',
      query: joinClauses(t('op_buddy') || '#op-buddy', '!buddy5'),
      action: `Cycles active buddy rotation; remove ${tagMap.op_buddy.name} once buddy5.`,
      isTrash: false,
    },
    {
      id: 'D10_party',
      title: 'Party Play Catches Review',
      query: 'party&!#',
      action: 'Uses verified `party` keyword (never `partyplay`).',
      isTrash: false,
    },
    {
      id: 'D11_powerwip',
      title: 'Active Power-Up WIP Roster',
      query: t('op_powerwip') || '#op-powerwip',
      subQueries: [
        {
          label: 'XL-Ready Power-Up WIPs (296+ XL)',
          query: joinClauses(t('op_powerwip') || '#op-powerwip', 'countcandyxl296-'),
          isTrash: false,
        },
        {
          label: 'Field Research Power-Up Queue',
          query: t('op_powerup') || '#op-powerup',
          isTrash: false,
        },
      ],
      action: `Track active Stardust/Candy builds in ${tagMap.op_powerwip.name} (remove once they hit target CP/Lv40/Lv50); keep ${tagMap.op_powerup.name} for "Power up X times" Field Research.`,
      isTrash: false,
    },
  ];

  return {
    id: 'modeD',
    title: 'Event-Hour & Trading Ops',
    subtitle: 'Spotlight Hours, Rocket Takeovers, Comm Day moves, and daily trade/buddy routines.',
    steps,
  };
}

export function buildTriageFunnels(metaSnapshot = {}, customTagMap = null, options = {}) {
  const tagMap = customTagMap ? mergeTagMap(customTagMap) : createDefaultTagMap();
  const ageScope = options.ageScope !== undefined ? options.ageScope : 'age0';
  const safetyShields = { ...createDefaultSafetyShields(), ...(options.safetyShields || {}) };
  const pveType = TYPES.includes(options.pveType) ? options.pveType : 'fire';

  const t = (id) => getTagHash(id, tagMap);
  const notT = (id) => {
    const hash = t(id);
    return hash ? `!${hash}` : '';
  };
  const nsInc = (ns) => getNamespaceHashes(ns, tagMap);
  const nsExc = (ns) => getNamespaceExclusions(ns, tagMap);

  const dexClause = (arr) => (Array.isArray(arr) && arr.length > 0 ? compressIds(arr) : '');

  const pvp = metaSnapshot?.pvp || {};
  const pve = metaSnapshot?.pve || {};
  const max = metaSnapshot?.maxBattles || {};
  const special = metaSnapshot?.specialLists || {};

  const fastMoves =
    Array.isArray(max.fastMoves500ms) && max.fastMoves500ms.length > 0
      ? max.fastMoves500ms
      : DEFAULT_FAST_MOVES_500MS;
  const candy12Dex = dexClause(
    Array.isArray(special.candy12Fodder) && special.candy12Fodder.length > 0
      ? special.candy12Fodder
      : CANDY_12_FODDER_IDS
  );
  const tradeEvoIds =
    Array.isArray(special.tradeEvolve) && special.tradeEvolve.length > 0
      ? special.tradeEvolve
      : TRADE_EVOLVE_IDS;
  const tradeEvoDex = dexClause(tradeEvoIds);
  const tradeEvoNegation = negateCompressedRanges(tradeEvoDex);

  const glLowList = Array.isArray(pvp.gl?.top100?.lowAtk) ? pvp.gl.top100.lowAtk : [];
  const rawGlHighList = Array.isArray(pvp.gl?.top100?.highAtk) ? pvp.gl.top100.highAtk : [];
  const glHighList =
    rawGlHighList.length > 0 ? [...rawGlHighList, ...CLASSIC_GL_XL_FLOOR_IDS] : rawGlHighList;
  const ulLowList = Array.isArray(pvp.ul?.top100?.lowAtk) ? pvp.ul.top100.lowAtk : [];
  const ulHighList = Array.isArray(pvp.ul?.top100?.highAtk) ? pvp.ul.top100.highAtk : [];
  const mlAllList = Array.isArray(pvp.ml?.top100?.all) ? pvp.ml.top100.all : [];

  const glLowDex = dexClause(glLowList);
  const glHighDex = dexClause(glHighList);
  const ulLowDex = dexClause(ulLowList);
  const ulHighDex = dexClause(ulHighList);
  const mlAllDex = dexClause(mlAllList);
  const pvpShadowList = Array.isArray(pvp.allShadow) ? pvp.allShadow : [];
  const pvpShadowDex = dexClause(pvpShadowList);
  const pvpTradeDex = dexClause(pvp.allTradeReroll);

  const glUlLowDex = dexClause([...glLowList, ...ulLowList]);
  const glUlHighDex = dexClause([...glHighList, ...ulHighList]);

  const pveTopList = Array.isArray(pve.top30Overall) ? pve.top30Overall : [];
  const rawPveShadowList = Array.isArray(pve.topShadow) ? pve.topShadow : [];
  const pveShadowList =
    rawPveShadowList.length > 0
      ? [...rawPveShadowList, ...CLASSIC_PVE_TYPE_SHADOW_IDS]
      : rawPveShadowList;
  const pveMegaEvolvedList = Array.isArray(pve.topMegaEvolved) ? pve.topMegaEvolved : [];
  const pveMegaFamList = Array.isArray(pve.topMegaFamily) ? pve.topMegaFamily : [];
  const pveMegaEvolvedSet = new Set(pveMegaEvolvedList);
  const pveMegaPreEvoList = pveMegaFamList.filter((id) => !pveMegaEvolvedSet.has(id));
  const pveByTypeFlat = pve.byType ? Object.values(pve.byType).flat() : [];

  const pveTopDex = dexClause(pveTopList);
  const pveTypeDex = dexClause(pve.byType?.[pveType]);
  const pveShadowDex = dexClause(pveShadowList);
  const allMetaShadowDex = dexClause([...pveShadowList, ...pvpShadowList]);
  const pveShadowNegation = negateCompressedRanges(allMetaShadowDex || pveShadowDex);
  const pveMegaEvolvedDex = dexClause(pveMegaEvolvedList);
  const pveMegaPreEvoDex = dexClause(pveMegaPreEvoList);

  const maxAtkList = Array.isArray(max.attackers) ? max.attackers : [];
  const maxTankHealList = Array.isArray(max.tanksAndHealers) ? max.tanksAndHealers : [];
  const maxAtkDex = dexClause(maxAtkList);
  const maxTankHealDex = dexClause(maxTankHealList);

  const highIvMetaIds = [
    ...pveTopList,
    ...pveMegaFamList,
    ...pveByTypeFlat,
    ...mlAllList,
    ...maxAtkList,
    ...maxTankHealList,
  ];
  const highIvMetaDex = dexClause(highIvMetaIds);

  // Mode B4 protects all High-IV Raid/Mega/Max/ML staples AND XL GL/UL 3* species
  const b4MetaDex = dexClause([...highIvMetaIds, ...glHighList, ...ulHighList]);
  const b4MetaNegation = negateCompressedRanges(b4MetaDex);

  const mirrorMetaDex = dexClause([
    ...SCARCE_RARE_SPECIES_IDS,
    ...ALL_COMMUNITY_DAY_PRE_EVO_IDS,
    ...pveTopList,
    ...glHighList,
    ...ulHighList,
    ...mlAllList,
  ]);

  const hasMetaLists =
    glUlLowDex.length > 0 || pveTopDex.length > 0 || maxAtkDex.length > 0;
  const strictNonMetaDex = hasMetaLists
    ? dexClause(computeStrictNonMetaIdsFromSnapshot(metaSnapshot))
    : '';

  const ctx = {
    ageScope,
    safetyShields,
    tagMap,
    pveType,
    t,
    notT,
    nsInc,
    nsExc,
    glLowDex,
    glHighDex,
    ulLowDex,
    ulHighDex,
    mlAllDex,
    pvpShadowDex,
    pvpTradeDex,
    glUlLowDex,
    glUlHighDex,
    pveTopDex,
    pveTypeDex,
    pveShadowDex,
    pveShadowNegation,
    pveMegaEvolvedDex,
    pveMegaPreEvoDex,
    maxAtkDex,
    maxTankHealDex,
    highIvMetaDex,
    b4MetaNegation,
    mirrorMetaDex,
    strictNonMetaDex,
    candy12Dex,
    tradeEvoDex,
    tradeEvoNegation,
    fastMoves,
  };

  const modeAResult = buildModeA(ctx);
  const emergencyDump = buildEmergencyDump(ageScope, modeAResult.stepA6Query);
  const modeA = {
    id: modeAResult.id,
    title: modeAResult.title,
    subtitle: modeAResult.subtitle,
    steps: modeAResult.steps,
  };

  const modeE = buildCostumePikachuMode({
    buildSafeTrashQuery,
    safetyShields,
    customTagMap: tagMap,
    keepCap: options.pikachuKeepCap ?? 6,
    yearSlice: options.pikachuYearSlice ?? '',
    gender: options.pikachuGender ?? '',
    includeFamily: Boolean(options.pikachuIncludeFamily),
  });

  return {
    emergencyDump,
    modes: {
      modeA,
      modeB: buildModeB(ctx),
      modeC: buildModeC(ctx),
      modeD: buildModeD(ctx),
      modeE,
    },
  };
}
