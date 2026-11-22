import {
  compressIds,
  PVP_IV_EXCLUDE_CLAUSE,
  NUNDO_EXCLUDE_CLAUSE,
  TYPES,
} from './searchUtils';
import {
  createDefaultTagMap,
  mergeTagMap,
  getTagHash,
  getNamespaceHashes,
  getNamespaceExclusions,
} from './tagSystem';

export const DEFAULT_FAST_MOVES_500MS = [
  'Bite', 'Bug Bite', 'Cut', 'Dragon Breath', 'Fury Cutter', 'Leafage', 'Lick',
  'Lock-On', 'Low Kick', 'Metal Claw', 'Metal Sound', 'Mud Shot', 'Poison Sting',
  'Pound', 'Psycho Cut', 'Psywave', 'Sand Attack', 'Scratch', 'Shadow Claw',
  'Spark', 'Sucker Punch', 'Tackle', 'Thunder Shock', 'Vine Whip', 'Water Gun',
];

export const DEFAULT_CANDY_12_FODDER = [10, 13, 16, 265, 293, 519];
export const DEFAULT_TRADE_EVOLVE_DEX = [64, 67, 75, 93, 525, 533, 588, 616, 708, 710];

export const AGE_SCOPES = [
  { id: 'age0', label: 'Today (24h)', token: 'age0' },
  { id: 'age0-2', label: 'Weekend (0–2d)', token: 'age0-2' },
  { id: 'age0-7', label: 'Last 7 Days', token: 'age0-7' },
  { id: 'all', label: 'All Time', token: '' },
];

export const SAFETY_SHIELD_DEFINITIONS = [
  { id: 'untagged', label: 'Untagged Only (!#)', token: '!#', defaultEnabled: true, category: 'lock' },
  { id: 'favorite', label: 'Protect Favorites (!favorite)', token: '!favorite', defaultEnabled: true, category: 'lock' },
  { id: 'shiny', label: 'Protect Shinies (!shiny)', token: '!shiny', defaultEnabled: true, category: 'rarity' },
  { id: 'background', label: 'Protect Backgrounds (!background)', token: '!background', defaultEnabled: true, category: 'rarity' },
  { id: 'costume', label: 'Protect Costumes (!costume)', token: '!costume', defaultEnabled: true, category: 'rarity' },
  { id: 'legendary', label: 'Protect Legendaries (!legendary)', token: '!legendary', defaultEnabled: true, category: 'rarity' },
  { id: 'mythical', label: 'Protect Mythicals (!mythical)', token: '!mythical', defaultEnabled: true, category: 'rarity' },
  { id: 'ultrabeast', label: 'Protect Ultra Beasts (!ultrabeast)', token: '!ultrabeast', defaultEnabled: true, category: 'rarity' },
  { id: 'shadow', label: 'Protect Shadows (!shadow)', token: '!shadow', defaultEnabled: true, category: 'mechanics' },
  { id: 'max', label: 'Protect All Max Battle (!maxmove1-)', token: '!maxmove1-', defaultEnabled: true, category: 'mechanics' },
  { id: 'xxl', label: 'Protect XXL (!xxl)', token: '!xxl', defaultEnabled: true, category: 'size' },
  { id: 'xxs', label: 'Protect XXS (!xxs)', token: '!xxs', defaultEnabled: true, category: 'size' },
  { id: 'specialMove', label: 'Protect Legacy/Elite (@special)', token: '!@special', defaultEnabled: true, category: 'investment' },
  { id: 'lucky', label: 'Protect Luckies (!lucky)', token: '!lucky', defaultEnabled: true, category: 'rarity' },
  { id: 'fusion', label: 'Protect Fusions (!fusion)', token: '!fusion', defaultEnabled: true, category: 'mechanics' },
  { id: 'adventureEffect', label: 'Protect Adventure Effects (!adventureeffect)', token: '!adventureeffect', defaultEnabled: true, category: 'mechanics' },
  { id: 'singleMoveOnly', label: 'Protect 2nd-Moved (@3mov)', token: '@3mov', defaultEnabled: true, category: 'investment' },
  { id: 'pvpIv', label: 'Protect PvP IVs (2-4atk,0-2def,0-2hp)', token: PVP_IV_EXCLUDE_CLAUSE, defaultEnabled: true, category: 'iv' },
  { id: 'nundo', label: 'Protect 0% Nundos (1-4atk,1-4def,1-4hp)', token: NUNDO_EXCLUDE_CLAUSE, defaultEnabled: true, category: 'iv' },
];

export function createDefaultSafetyShields() {
  const shields = {};
  for (const def of SAFETY_SHIELD_DEFINITIONS) {
    shields[def.id] = def.defaultEnabled;
  }
  return shields;
}

function joinClauses(...clauses) {
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

function joinOr(...atoms) {
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

/**
 * Build a safe trash/mass-transfer query honoring age scope, star scope, and customizable safety shields.
 * NEVER emits `!@3mov` (uses `@3mov` for single-move protection) and NEVER emits `!mega{N}`.
 */
export function buildSafeTrashQuery({
  ageScope = 'age0',
  starScope = '0*,1*,2*',
  countDuplicate = false,
  excludeTraded = false,
  includeIvShields = true,
  safetyShields = {},
} = {}) {
  const shields = { ...createDefaultSafetyShields(), ...safetyShields };
  const parts = [];

  if (ageScope) parts.push(ageScope);
  if (shields.untagged) parts.push('!#');
  if (shields.favorite) parts.push('!favorite');
  if (countDuplicate) parts.push('count2-');
  if (starScope) parts.push(starScope);

  if (shields.shiny) parts.push('!shiny');
  if (shields.background) parts.push('!background');
  if (shields.costume) parts.push('!costume');
  if (shields.legendary) parts.push('!legendary');
  if (shields.mythical) parts.push('!mythical');
  if (shields.ultrabeast) parts.push('!ultrabeast');
  if (shields.shadow) parts.push('!shadow');
  if (shields.max) parts.push('!maxmove1-');
  if (shields.xxl) parts.push('!xxl');
  if (shields.xxs) parts.push('!xxs');
  if (shields.specialMove) parts.push('!@special');
  if (shields.lucky) parts.push('!lucky');
  if (excludeTraded) parts.push('!traded');
  if (shields.fusion) parts.push('!fusion');
  if (shields.adventureEffect) parts.push('!adventureeffect');
  // Single-move-only shield (`@3mov` matches empty 2nd charged move slot -> protects double-moved builds!)
  if (shields.singleMoveOnly) parts.push('@3mov');

  if (includeIvShields) {
    if (shields.pvpIv) parts.push(PVP_IV_EXCLUDE_CLAUSE);
    if (shields.nundo) parts.push(NUNDO_EXCLUDE_CLAUSE);
  }

  return joinClauses(...parts);
}

/**
 * Build all 4 triage funnel modes + pinned 30-second Mid-Event Emergency Dump
 * dynamically from `(metaSnapshot, customTagMap, options)`.
 */
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
      : DEFAULT_CANDY_12_FODDER
  );
  const tradeEvoDex = dexClause(
    Array.isArray(special.tradeEvolve) && special.tradeEvolve.length > 0
      ? special.tradeEvolve
      : DEFAULT_TRADE_EVOLVE_DEX
  );

  // --- Mode A: Quick Post-Catch / Event-Day Rapid Triage ---
  const stepA1 = {
    id: 'A1',
    title: 'Lock Grails, Hundos & Backgrounds',
    query: joinClauses(ageScope, '!#', '4*,shiny,background'),
    action: `Favorite (★) all keepers. Tag ${tagMap.ev_shbg.name} (shiny&background), ${tagMap.ev_locbg.name} (locationbackground), ${tagMap.ev_global.name} (specialbackground), ${tagMap.ev_inperson.name}, or ${tagMap.keep_trophy.name}. Move spare shinies/BGs to ${tagMap.tr_spec.name}.`,
    isTrash: false,
  };

  const stepA1b = {
    id: 'A1b',
    title: 'Lock 0% Nundos',
    query: joinClauses(ageScope, '!#', '0attack', '0defense', '0hp'),
    action: `Favorite (★) and tag ${tagMap.keep_trophy.name}.`,
    isTrash: false,
  };

  const stepA2 = {
    id: 'A2',
    title: 'Screen Special Mechanics & Legacy Moves',
    query: joinClauses(
      ageScope,
      '!#',
      'costume,maxmove1-,legendary,mythical,ultrabeast,shadow,@special,fusion,adventureeffect'
    ),
    action: `Tag viable Max mons (${tagMap.max_wip.name}/${tagMap.max_atk.name}/${tagMap.max_tank.name}/${tagMap.max_candy.name}), Shadows (${tagMap.pve_wip.name}/${tagMap.pvp_wip.name}/${tagMap.op_tmfrust.name}), extra Legendaries (${tagMap.tr_spec.name}/${tagMap.op_2xxfer.name}), and Costumes.`,
    isTrash: false,
  };

  const stepA3 = {
    id: 'A3',
    title: 'PvP IV Sweep (Low-Atk High-Bulk)',
    query: joinClauses(ageScope, '!#', '0-1attack', '3-4defense', '3-4hp'),
    action: `Quick-check species relevance (or pair with Mode C meta dex list). Tag keepers → ${tagMap.pvp_wip.name} (or ${tagMap.op_evocd.name}). Leave non-meta commons untagged.`,
    isTrash: false,
  };

  const stepA4 = {
    id: 'A4',
    title: 'High-IV 3★ (PvE / ML) & New Dex',
    query: joinClauses(ageScope, '!#', '3*', '3-4attack', '3-4defense', '3-4hp'),
    subQueries: [
      { label: 'New Pokédex Evolutions', query: joinClauses(ageScope, '!#', 'evolvenew') },
    ],
    action: `Tag meta 15-Atk / 93–98% mons → ${tagMap.pve_wip.name}, ${tagMap.pve_megawip.name}, ${tagMap.pvp_wip.name}, ${tagMap.op_powerwip.name}, or ${tagMap.op_evocd.name}.`,
    isTrash: false,
  };

  const stepA5 = {
    id: 'A5',
    title: 'Route Size (XXL) & Distance Trade Queues',
    query: joinClauses(ageScope, '!#', 'xxl'),
    subQueries: [
      { label: 'Distance Trades (100km+)', query: joinClauses(ageScope, '!#', 'distance100-', '!traded') },
    ],
    action: `Tag best 1–2 XXL/species → ${tagMap.op_xxl.name}; 100km+ fodder → ${tagMap.tr_dist.name}; meta species → ${tagMap.tr_mirror.name} or ${tagMap.op_2xxfer.name}.`,
    isTrash: false,
  };

  const stepA6 = {
    id: 'A6',
    title: 'Ultra-Safe Rapid Trash Purge (0★–2★)',
    query: buildSafeTrashQuery({
      ageScope,
      starScope: '0*,1*,2*',
      includeIvShields: true,
      safetyShields,
    }),
    action: 'Glance over results → Select All in 50–100 batches → Transfer. Shielded with De Morgan PvP-IV, Nundo, and @3mov single-move protections.',
    isTrash: true,
  };

  const stepA6b = {
    id: 'A6b',
    title: 'Optional Non-Keeper 3★ Purge (Run After A4)',
    query: buildSafeTrashQuery({
      ageScope,
      starScope: '3*',
      includeIvShields: false,
      safetyShields,
    }),
    action: 'Clears junk 82–89% common 3★ spawns after you already tagged meta 3★ keepers in Step A4.',
    isTrash: true,
  };

  // --- Pinned 30-Second Mid-Event Emergency Dump ---
  const emergencyDump = {
    id: 'emergency',
    title: '30-Second Mid-Event Emergency Dump',
    subtitle: 'Free 100–300 storage slots mid-GO Fest or Community Day in 3 taps with full PvP-IV, Nundo & 2nd-move shields.',
    steps: [stepA1, stepA1b, stepA6],
  };

  // --- Mode B: Deep Storage Cleanout ---
  const modeBSteps = [
    {
      id: 'B1',
      title: 'Untagged Backlog Inbox',
      query: '!#&!favorite',
      action: 'Run Mode A Steps A1–A6 with "All Time" scope until !#&!favorite reaches zero.',
      isTrash: false,
    },
    {
      id: 'B2',
      title: 'Living Dex Singletons (Protect)',
      query: '!#&count1',
      action: `Inspect unique 1-of species before deep pruning; tag Living Dex anchors ${tagMap.keep_trophy.name}.`,
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
      action: 'Safe all-time purge of duplicate 0★–2★ clutter.',
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
        includeIvShields: false,
        safetyShields,
      }),
      action: 'Sort by Number (#); keep single highest IV per species if maintaining a Living Dex, dump extras.',
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
        },
      ],
      action: 'Enforce 1–2 XXL per relevant species; evolve spares first for Platinum size medals, then transfer. (!maxmove1- shields non-evolving G-Max Pikachu/Meowth from the evolve bug.)',
      isTrash: false,
    },
    {
      id: 'B6',
      title: 'Duplicate Costumes & Event Spawns',
      query: 'costume&count2-&!shiny&!4*&!background&!favorite&!#',
      action: 'Sort by Number (#); keep 1–2 best (or M/F pair), cut excess.',
      isTrash: false,
    },
    {
      id: 'B7',
      title: 'Duplicate Legendaries / Ultra Beasts',
      query: joinClauses(
        'legendary,ultrabeast', 'count2-', '!shiny', '!4*', '!background', '!favorite',
        ...nsExc('pve'), ...nsExc('pvp'), ...nsExc('max'), notT('tr_spec')
      ),
      action: `Keep top 1–6 PvE/ML specimens + capped ${tagMap.tr_spec.name} quota; move excess to ${tagMap.op_2xxfer.name}.`,
      isTrash: false,
    },
    {
      id: 'B8',
      title: 'Expendable Low-IV Shadows',
      query: joinClauses(
        'shadow', '0*,1*,2*', '!shiny', '!legendary', '!mythical', '!background', '!costume', '!favorite',
        ...nsExc('pvp'), ...nsExc('pve'), ...nsExc('keep'), ...nsExc('ev'), ...nsExc('tr'),
        notT('op_purify1k'), '@3mov', NUNDO_EXCLUDE_CLAUSE
      ),
      action: 'Sort by #; purge non-meta low-IV shadows (protects nundos, double-moved, background/costume, and tagged shadows). Note: !@special is intentionally omitted because Frustration counts as @special.',
      isTrash: true,
    },
    {
      id: 'B9',
      title: 'Expendable Dynamax Clutter',
      query: joinClauses(
        '!#', '!favorite', 'dynamax', '!shiny', '!background', '!costume',
        '!legendary', '!mythical', '!ultrabeast', '!lucky', '0*,1*,2*',
        '@3mov', '!maxmove2-', '!maxguard1-', '!maxspirit1-'
      ),
      action: 'Protects G-Max (excluded by dynamax), Legendaries/UBs, Shinies, Hundos, Backgrounds, Costumes, Luckies, double-moved builds, AND any D-Max with upgraded Max Moves.',
      isTrash: true,
    },
    {
      id: 'B10',
      title: 'Event & Background Collection Review',
      query: 'locationbackground&!#',
      subQueries: [
        { label: 'Global Special Backgrounds', query: 'specialbackground&!#' },
        { label: 'Shiny + Any Background (Grails)', query: 'shiny&background&!#' },
        { label: 'Profile Backgrounds', query: 'profilebackground&!#' },
      ],
      action: `Route every background catch to ${tagMap.ev_shbg.name}, ${tagMap.ev_locbg.name}, ${tagMap.ev_global.name}, or ${tagMap.tr_spec.name} and dual-lock (★).`,
      isTrash: false,
    },
  ];

  // --- Mode C: Competitive & Endgame Meta Triage ---
  const glLowDex = dexClause(pvp.gl?.top100?.lowAtk);
  const glHighDex = dexClause(pvp.gl?.top100?.highAtk);
  const ulLowDex = dexClause(pvp.ul?.top100?.lowAtk);
  const ulHighDex = dexClause(pvp.ul?.top100?.highAtk);
  const mlAllDex = dexClause(pvp.ml?.top100?.all);
  const pvpShadowDex = dexClause(pvp.allShadow);
  const pvpTradeDex = dexClause(pvp.allTradeReroll);

  const modeCPvp = [
    {
      id: 'C1_gl_low',
      title: 'GL Meta — Low-Atk Species (Top 100)',
      query: joinClauses('!#', '0-1attack', '3-4defense', '3-4hp', glLowDex),
      action: 'Covers ~86% of Great League Top 100 (defaultIVs Atk ≤ 5), family-expanded.',
      isTrash: false,
    },
    {
      id: 'C1_gl_high',
      title: 'GL Meta — High-Atk / XL Species',
      query: joinClauses('!#', '2-4attack', '3-4defense', '3-4hp', glHighDex),
      action: 'Catches XL/raid-floor GL staples (Medicham, Bastiodon, Sableye, Deoxys-D, Florges, Pachirisu).',
      isTrash: false,
    },
    {
      id: 'C1_ul_low',
      title: 'UL Meta — Low-Atk Species (Top 100)',
      query: joinClauses('!#', '0-1attack', '3-4defense', '3-4hp', ulLowDex),
      action: 'Covers ~67% of Ultra League Top 100 (defaultIVs Atk ≤ 5), family-expanded.',
      isTrash: false,
    },
    {
      id: 'C1_ul_high',
      title: 'UL Meta — High-Atk / XL / Hundo-Cap',
      query: joinClauses('!#', '3*,4*', ulHighDex),
      action: 'Catches XL-capped UL powerhouses (Tinkaton, Zygarde, Virizion, Mimikyu, Jellicent, Talonflame, Umbreon).',
      isTrash: false,
    },
    {
      id: 'C1_ml',
      title: 'ML Meta — Top IV Breakpoint Screen (Top 100)',
      query: joinClauses('!#', '3*,4*', '4attack', '3-4defense', '3-4hp', mlAllDex),
      action: 'Prioritizes 15 Attack (4attack) + 93–100% IVs for CMP ties and fast-move breakpoints.',
      isTrash: false,
    },
    {
      id: 'C1_shadow',
      title: 'PvP Shadow Meta Candidates (All Leagues)',
      query: joinClauses('!#', 'shadow', pvpShadowDex),
      action: 'Inspect all untagged shadows of Top-100 Shadow families (~30% of every league).',
      isTrash: false,
    },
    {
      id: 'C1_trade',
      title: 'PvP Trade Reroll Targets (Low-IV Hunts)',
      query: joinClauses('!#', '!traded', '!shiny', '!4*', pvpTradeDex),
      action: 'Raid/research legendaries needing trade IV rerolls for GL/UL.',
      isTrash: false,
    },
    {
      id: 'C1_xl_ready',
      title: 'Ready-to-Build XL PvP Candidates',
      query: joinClauses(t('pvp_wip') || '#pvp-wip', 'countcandyxl296-'),
      action: 'Spots PvP WIP projects that already have full Level 50 XL candy banked.',
      isTrash: false,
    },
  ];

  const pveTopDex = dexClause(pve.top30Overall);
  const pveTypeDex = dexClause(pve.byType?.[pveType]);
  const pveShadowDex = dexClause(pve.topShadow);
  const pveMegaEvolvedDex = dexClause(pve.topMegaEvolved);
  const pveMegaFamDex = dexClause(pve.topMegaFamily);

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
      title: 'Daily Free Mega Leveling (to Lv3 / Lv4)',
      query: 'mega1-2&megaevolve',
      subQueries: [
        { label: 'Lv4 Super Max Target', query: 'mega1-3&megaevolve' },
        { label: 'Tagged Mega Queue', query: joinClauses(t('op_mega') || '#op-mega', 'megaevolve') },
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
          label: 'Pre-Evos & Evolved Mega Families (no mega0)',
          query: joinClauses('!#', '!shadow', '3*,4*', '4attack', pveMegaFamDex),
        },
        {
          label: 'Tagged WIP Megas',
          query: t('pve_megawip') || '#pve-megawip',
        },
      ],
      action: `mega0 only matches fully evolved Mega-capable forms — use the Pre-Evos & Evolved sub-query to catch Charmander/Beldum/etc. Tag candidates → ${tagMap.pve_megawip.name} until Mega Evolved (then move to ${tagMap.op_mega.name}).`,
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

  const maxAtkDex = dexClause(max.attackers);
  const maxTankHealDex = dexClause(max.tanksAndHealers);
  const fastMoveInclude = fastMoves.map((m) => `@1${m}`).join(',');
  const fastMoveExcludeClauses = fastMoves.map((m) => `!@1${m}`);
  const tankHealTags = joinOr(t('max_tank'), t('max_heal'));

  const maxAuditSubQueries = [
    { label: 'Need Max Guard', query: joinClauses(t('max_tank') || '#max-tank', '!maxguard1-') },
  ];
  if (t('max_heal')) {
    maxAuditSubQueries.push({
      label: 'Need Max Spirit',
      query: joinClauses(t('max_heal'), '!maxspirit1-'),
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
      action: 'Verifies fast-charging Tanks/Healers across all 25 verified 500ms fast moves (@1 targets Fast Move slot).',
      isTrash: false,
    },
    {
      id: 'C3_fast_missing',
      title: 'Tagged Tanks MISSING a 0.5s Fast Move (Need Fast TM)',
      query: joinClauses(tankHealTags || 'maxmove1-', ...fastMoveExcludeClauses),
      action: 'Instant Fast-TM audit for Tanks & Healers using De Morgan negation of all 25 500ms moves.',
      isTrash: false,
    },
    {
      id: 'C3_audits',
      title: 'Max Move Investment Audits',
      query: joinClauses(t('max_atk') || '#max-atk', 'maxmove1-2'),
      subQueries: maxAuditSubQueries,
      action: 'Tracks which tagged Max mons still need Max Particle upgrades (scoped by #max-* to prevent non-Max leakage).',
      isTrash: false,
    },
  ];

  // --- Mode D: Event-Hour & Trading Ops ---
  const modeDSteps = [
    {
      id: 'D1_2xxfer',
      title: '2x Transfer Candy Spotlight Hour',
      query: joinClauses(t('op_2xxfer') || '#op-2xxfer', '!favorite'),
      action: 'Mass-transfer queued rares, legendaries, and bad rerolled trades in 50–100 batches.',
      isTrash: true,
    },
    {
      id: 'D2_bad_trades',
      title: 'Bad Rerolled Trades Cleanup',
      query: joinClauses(
        'traded', '!lucky', '!4*', '!shiny', '!background', '!favorite', '!@special', '@3mov',
        ...nsExc('pvp'), ...nsExc('pve'), ...nsExc('max'), ...nsExc('keep'), ...nsExc('ev'),
        notT('op_xxl'), notT('op_mega'), notT('op_evocd'), notT('op_evoxp'), notT('op_powerwip'), notT('op_powerup')
      ),
      action: `Flush post-trade failures straight to ${tagMap.op_2xxfer.name} or transfer immediately (shields event, XXL, Mega, Power-Up WIP, legacy-move, double-moved, and evolution-queued trades).`,
      isTrash: true,
    },
    {
      id: 'D3_distance',
      title: 'Distance Trade Prep (100km+)',
      query: 'distance100-&!traded&!shiny&!legendary&!mythical&!ultrabeast&!4*&!favorite&!#',
      subQueries: [
        { label: 'S2 Cell Edge-Safe (101km+)', query: 'distance101-&!traded&!shiny&!legendary&!mythical&!ultrabeast&!4*&!favorite&!#' },
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
        { label: '12-Candy Fodder', query: joinClauses('!#', '!favorite', 'evolve', candy12Dex) },
        { label: 'Already-Traded Free Evos (0 Candy)', query: joinClauses('traded', 'evolve', tradeEvoDex) },
        { label: 'Un-Traded Trade-Evos (Send to Friend)', query: 'tradeevolve&!traded' },
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
        },
        {
          label: 'Field Research Power-Up Queue',
          query: t('op_powerup') || '#op-powerup',
        },
      ],
      action: `Track active Stardust/Candy builds in ${tagMap.op_powerwip.name} (remove once they hit target CP/Lv40/Lv50); keep ${tagMap.op_powerup.name} for "Power up X times" Field Research.`,
      isTrash: false,
    },
  ];

  return {
    emergencyDump,
    modes: {
      modeA: {
        id: 'modeA',
        title: 'Event-Day & Post-Catch Rapid Triage',
        subtitle: 'Strict priority inbox-zero funnel: lock grails & screen combat roles first, purge untagged remainder last.',
        steps: [stepA1, stepA1b, stepA2, stepA3, stepA4, stepA5, stepA6, stepA6b],
      },
      modeB: {
        id: 'modeB',
        title: 'Deep Storage Cleanout',
        subtitle: 'Full-box audit using count2- duplicate detection to clear backlog and hidden bloat.',
        steps: modeBSteps,
      },
      modeC: {
        id: 'modeC',
        title: 'Competitive & Endgame Meta Triage',
        subtitle: 'Auto-generated family-expanded species lists from PvPoke Top 100, clean-room PvE Top 10/type, and PokéChespin Max Battles.',
        sections: {
          pvp: { title: 'PvP — GO Battle League (Top 100)', steps: modeCPvp },
          pve: { title: 'PvE Raid Attackers & Mega Engine', steps: modeCPve },
          maxBattles: { title: 'Max Battles — Dynamax, Gigantamax & Crowned Legends', steps: modeCMax },
        },
      },
      modeD: {
        id: 'modeD',
        title: 'Event-Hour & Trading Ops',
        subtitle: 'Spotlight Hours, Rocket Takeovers, Comm Day moves, and daily trade/buddy routines.',
        steps: modeDSteps,
      },
    },
  };
}
