import { REGION_KEYWORDS, TYPES } from './searchUtils';

// Complete 28-tag, 7-namespace opinionated taxonomy (+ optional 29th OP-Purify1k)
// Verified collision-free against Leidwesen/SearchPhrases v0.435.1.

export const TAG_NAMESPACES = [
  { id: 'ev', label: 'Events & Backgrounds', defaultPrefix: 'EV-', color: 'purple', description: 'In-person events, location backgrounds, global events, and shiny backgrounds.' },
  { id: 'keep', label: 'Collection & Trophies', defaultPrefix: 'KEEP-', color: 'yellow', description: 'Permanent non-combat keepers: nundos, Level 1s, Living Dex, museum pieces.' },
  { id: 'pvp', label: 'PvP / GO Battle League', defaultPrefix: 'PVP-', color: 'blue', description: 'Built league rosters (GL, UL, ML, Cups) and unbuilt PvP IV candidates.' },
  { id: 'pve', label: 'PvE Raid Attackers', defaultPrefix: 'PVE-', color: 'red', description: 'Built raid attackers and high-IV/Shadow PvE investment projects.' },
  { id: 'max', label: 'Max Battles (D-Max / G-Max)', defaultPrefix: 'MAX-', color: 'pink', description: 'Max Battle attackers, 0.5s-move tanks, healers, WIPs, and Power Spot candy mules.' },
  { id: 'tr', label: 'Trading Queues', defaultPrefix: 'TR-', color: 'green', description: 'Mirror trades, 100km+ distance trades, and Special/Lucky trade showcases.' },
  { id: 'op', label: 'Operational Queues', defaultPrefix: 'OP-', color: 'orange', description: 'Actionable housekeeping queues flushed on Spotlight Hours, Rocket Takeovers, and daily loops.' },
];

export const CORE_TAGS = [
  // Namespace 1: Events & Backgrounds (#ev)
  {
    id: 'ev_inperson',
    namespace: 'ev',
    defaultName: 'EV-InPerson',
    color: 'purple',
    dragOrder: 7,
    purpose: 'Catches from in-person ticketed events (City GO Fest, Live GO Tour, City Safari, Safari Zone) — city-stamped shinies, costumes, Unowns, regionals, even without a background.',
    nativeSearchSynergy: 'year2026, costume, shiny',
  },
  {
    id: 'ev_locbg',
    namespace: 'ev',
    defaultName: 'EV-LocBG',
    color: 'purple',
    dragOrder: 6,
    purpose: 'In-Person Location Backgrounds (city/venue cards from live events). Kept distinct from global backgrounds due to extreme scarcity and high trade value.',
    nativeSearchSynergy: 'locationbackground',
  },
  {
    id: 'ev_global',
    namespace: 'ev',
    defaultName: 'EV-Global',
    color: 'blue',
    dragOrder: 8,
    purpose: 'Global Events (Global GO Fest, GO Tour, Wild Area, Seasonal Research) and Special Backgrounds.',
    nativeSearchSynergy: 'specialbackground',
  },
  {
    id: 'ev_shbg',
    namespace: 'ev',
    defaultName: 'EV-ShBG',
    color: 'yellow',
    dragOrder: 5,
    purpose: 'Shinies with Backgrounds (Location or Special BG). Ultimate grail / centerpiece tier — always dual-locked with Favorite (★).',
    nativeSearchSynergy: 'shiny&background',
  },

  // Namespace 2: Collection (#keep)
  {
    id: 'keep_trophy',
    namespace: 'keep',
    defaultName: 'KEEP-Trophy',
    color: 'yellow',
    dragOrder: 13,
    purpose: 'Permanent non-combat keepers: 0% Nundos, Level 1s, Living Dex anchors, sentimental catches, museum @special / costume / regional 1-ofs.',
    nativeSearchSynergy: '0attack&0defense&0hp, count1, @special',
  },

  // Namespace 3: PvP / GBL (#pvp)
  {
    id: 'pvp_gl',
    namespace: 'pvp',
    defaultName: 'PVP-GL',
    color: 'blue',
    dragOrder: 14,
    purpose: 'Built Great League (≤1500 CP, double-moved, battle-ready).',
    nativeSearchSynergy: '#pvp-gl&cp-1500',
  },
  {
    id: 'pvp_ul',
    namespace: 'pvp',
    defaultName: 'PVP-UL',
    color: 'yellow',
    dragOrder: 15,
    purpose: 'Built Ultra League (≤2500 CP, double-moved, battle-ready).',
    nativeSearchSynergy: '#pvp-ul&cp-2500',
  },
  {
    id: 'pvp_ml',
    namespace: 'pvp',
    defaultName: 'PVP-ML',
    color: 'purple',
    dragOrder: 16,
    purpose: 'Built Master League (L50 / hundo or functional 15-Atk hundo, double-moved).',
    nativeSearchSynergy: '#pvp-ml&4attack',
  },
  {
    id: 'pvp_cup',
    namespace: 'pvp',
    defaultName: 'PVP-Cup',
    color: 'blue',
    dragOrder: 17,
    purpose: 'Built Little Cup (≤500 CP) & Themed/Limited Cup specialists kept outside Open GL/UL.',
    nativeSearchSynergy: '#pvp-cup&cp-500',
  },
  {
    id: 'pvp_wip',
    namespace: 'pvp',
    defaultName: 'PVP-WIP',
    color: 'orange',
    dragOrder: 9,
    purpose: 'Unbuilt PvP IV Candidates (top GL/UL/ML spreads awaiting Stardust, XL Candy, Frustration TM, or CD evolution).',
    nativeSearchSynergy: '#pvp-wip&countcandyxl296-',
  },

  // Namespace 4: PvE Raids (#pve)
  {
    id: 'pve_raid',
    namespace: 'pve',
    defaultName: 'PVE-Raid',
    color: 'red',
    dragOrder: 18,
    purpose: 'Built PvE Raid Attackers (powered-up Shadows, Legendaries, Fusions, Megas ready for lobbies). Filter by move type (#pve-raid&@ice) instead of 18 type tags.',
    nativeSearchSynergy: '#pve-raid&@fire, #pve-raid&shadow',
  },
  {
    id: 'pve_wip',
    namespace: 'pve',
    defaultName: 'PVE-WIP',
    color: 'red',
    dragOrder: 10,
    purpose: 'Unbuilt PvE Projects (15-Atk 3★/4★ regulars, S/A-tier Shadows, un-Mega\'d candidates awaiting investment).',
    nativeSearchSynergy: '#pve-wip&countcandyxl296-',
  },

  // Namespace 5: Max Battles (#max)
  {
    id: 'max_atk',
    namespace: 'max',
    defaultName: 'MAX-Atk',
    color: 'pink',
    dragOrder: 19,
    purpose: 'Built Max Attackers (G-Max, Eternatus, Crowned Zacian, top D-Max with Max Attack Lv2–3).',
    nativeSearchSynergy: '#max-atk&maxmove3',
  },
  {
    id: 'max_tank',
    namespace: 'max',
    defaultName: 'MAX-Tank',
    color: 'green',
    dragOrder: 20,
    purpose: 'Built Max Tanks / Chargers (Zamazenta, Blissey, Metagross, Corviknight, Excadrill, Lapras w/ 0.5s Fast Move + Max Guard Lv2–3).',
    nativeSearchSynergy: '#max-tank&maxguard2-',
  },
  {
    id: 'max_heal',
    namespace: 'max',
    defaultName: 'MAX-Heal',
    color: 'green',
    dragOrder: 21,
    purpose: 'Dedicated Max Healers (Blissey, Chansey w/ Max Spirit Lv3). Casual players may fold into MAX-Tank.',
    nativeSearchSynergy: '#max-heal&maxspirit3',
  },
  {
    id: 'max_wip',
    namespace: 'max',
    defaultName: 'MAX-WIP',
    color: 'pink',
    dragOrder: 11,
    purpose: 'Unbuilt D-Max / G-Max Candidates awaiting Max Particles, Fast TM, evolution, or G-Max outclass review.',
    nativeSearchSynergy: '#max-wip&maxmove1-',
  },
  {
    id: 'max_candy',
    namespace: 'max',
    defaultName: 'MAX-Candy',
    color: 'grey',
    dragOrder: 22,
    purpose: 'Power Spot Candy Mules — disposable Lv1 D-Max of scarce families kept solely to drop in Power Spots for passive candy.',
    nativeSearchSynergy: '#max-candy&dynamax',
  },

  // Namespace 6: Trading (#tr)
  {
    id: 'tr_mirror',
    namespace: 'tr',
    defaultName: 'TR-Mirror',
    color: 'green',
    dragOrder: 2,
    purpose: 'Mirror Trade Queue — meta/rare/Comm-Day/D-Max spares for IV/Lucky rerolls + guaranteed XL candy.',
    nativeSearchSynergy: '#tr-mirror&!traded',
  },
  {
    id: 'tr_dist',
    namespace: 'tr',
    defaultName: 'TR-Dist',
    color: 'green',
    dragOrder: 3,
    purpose: 'Distance Trade Queue (distance100- / 7km hatches) swapped against local mons for 3 Candy + 1 XL + Pilot medal. Cap ~100–150.',
    nativeSearchSynergy: '#tr-dist&!traded',
  },
  {
    id: 'tr_spec',
    namespace: 'tr',
    defaultName: 'TR-Spec',
    color: 'green',
    dragOrder: 4,
    purpose: 'Special / Lucky Trade Queue — spare Shinies, Legendaries, Ultra Beasts, Costumes, Regionals, and spare Location/Special BGs.',
    nativeSearchSynergy: '#tr-spec&!traded',
  },

  // Namespace 7: Operations (#op)
  {
    id: 'op_2xxfer',
    namespace: 'op',
    defaultName: 'OP-2xXfer',
    color: 'black',
    dragOrder: 1,
    purpose: '2x Transfer Candy Queue — expendable Legendaries, rare spawns, bad trade rerolls held for 2x Transfer Candy Spotlight Hour.',
    nativeSearchSynergy: '#op-2xxfer&!favorite',
  },
  {
    id: 'op_evocd',
    namespace: 'op',
    defaultName: 'OP-EvoCD',
    color: 'orange',
    dragOrder: 23,
    purpose: 'Wait-for-Move Evolution Queue — PvP/PvE pre-evolutions waiting for Comm Day / Legacy Move event (saves Elite TMs).',
    nativeSearchSynergy: '#op-evocd&evolve',
  },
  {
    id: 'op_evoxp',
    namespace: 'op',
    defaultName: 'OP-EvoXP',
    color: 'orange',
    dragOrder: 24,
    purpose: 'Mass-Evolve XP Queue — 12-candy fodder, traded trade-evolutions, spare XXLs for 2x Evolution XP Spotlight Hour + Lucky Egg.',
    nativeSearchSynergy: '#op-evoxp&evolve',
  },
  {
    id: 'op_mega',
    namespace: 'op',
    defaultName: 'OP-Mega',
    color: 'blue',
    dragOrder: 25,
    purpose: 'Mega Leveling Grind — active mega1-2 (or mega1-3 for Lv4 Super Max) mons cycling free cooldown evolves; remove tag once maxed.',
    nativeSearchSynergy: '#op-mega&megaevolve',
  },
  {
    id: 'op_xxl',
    namespace: 'op',
    defaultName: 'OP-XXL',
    color: 'blue',
    dragOrder: 12,
    purpose: 'Curated Showcase Keepers — strict 1–2 largest XXL per species (prevents hoarding 300 junk XXLs).',
    nativeSearchSynergy: '#op-xxl&xxl',
  },
  {
    id: 'op_powerup',
    namespace: 'op',
    defaultName: 'OP-PowerUp',
    color: 'orange',
    dragOrder: 26,
    purpose: 'Power-Up Priority Queue — pre-selected mons for "Power up X times" Field Research so dust is never wasted.',
    nativeSearchSynergy: '#op-powerup',
  },
  {
    id: 'op_tmfrust',
    namespace: 'op',
    defaultName: 'OP-TMFrust',
    color: 'red',
    dragOrder: 27,
    purpose: 'Remove Frustration Queue — viable Shadows waiting for Team GO Rocket Takeover.',
    nativeSearchSynergy: '#op-tmfrust&@frustration',
  },
  {
    id: 'op_buddy',
    namespace: 'op',
    defaultName: 'OP-Buddy',
    color: 'yellow',
    dragOrder: 28,
    purpose: 'Best Buddy Rotation — 5–20 active buddy projects; remove once buddy5.',
    nativeSearchSynergy: '#op-buddy&!buddy5',
  },
];

export const OPTIONAL_TAGS = [
  {
    id: 'op_purify1k',
    namespace: 'op',
    defaultName: 'OP-Purify1k',
    color: 'grey',
    dragOrder: 29,
    optional: true,
    purpose: '1,000-stardust shadow catches held exclusively for "Purify X Shadow Pokémon" research tasks.',
    nativeSearchSynergy: '#op-purify1k&shadow',
  },
];

export const DEFAULT_TAGS = CORE_TAGS;
export const ALL_TAG_DEFINITIONS = [...CORE_TAGS, ...OPTIONAL_TAGS];

export const TAG_DEFINITION_BY_ID = Object.fromEntries(
  ALL_TAG_DEFINITIONS.map((t) => [t.id, t])
);

// Authoritative Leidwesen/SearchPhrases v0.435.1 English keywords that MUST NOT be used as exact tag names
export const NATIVE_POGO_KEYWORDS = new Set([
  'shiny', 'shadow', 'purified', 'lucky', 'legendary', 'mythical',
  'ultrabeast', 'ultra beasts', 'costume',
  'background', 'locationbackground', 'specialbackground', 'profilebackground',
  'dynamax', 'gigantamax', 'maxmove', 'maxguard', 'maxspirit',
  'mega', 'megaevolve',
  'evolve', 'evolvenew', 'evolvequest', 'tradeevolve', 'item',
  'traded', 'favorite', 'favourite', 'defender',
  'candyxl', 'candykm', 'count', 'countcandy', 'countcandyxl',
  'hypertraining', 'fusion', 'adventureeffect',
  'xxs', 'xs', 'xl', 'xxl',
  'male', 'female', 'genderunknown',
  'eggsonly', 'hatched', 'raid', 'remoteraid', 'megaraid', 'exraid', 'primalraid',
  'research', 'gbl', 'rocket', 'snapshot', 'party',
  'age', 'year', 'distance', 'cp', 'hp', 'buddy', 'attack', 'defense',
  '0*', '1*', '2*', '3*', '4*',
  ...TYPES,
  ...REGION_KEYWORDS,
]);

// Shortcut range keywords that trigger PoGO's shortcut hijacking bug if used as tag prefixes
export const SHORTCUT_KEYWORDS = ['mega', 'count', 'dynamax', 'gigantamax'];

// Forbidden search operator characters in tag names (explicitly ALLOWS internal `-`)
export const FORBIDDEN_TAG_CHAR_REGEX = /[&|,;:!@#<>=+]/;

/**
 * Create the default custom tag map keyed by stable tag ID.
 * Core 28 tags enabled by default; optional OP-Purify1k enabled=false by default.
 */
export function createDefaultTagMap() {
  const map = {};
  for (const def of ALL_TAG_DEFINITIONS) {
    map[def.id] = {
      name: def.defaultName,
      enabled: !def.optional,
    };
  }
  return map;
}

/**
 * Merge a saved user tag map safely with current defaults (handles schema additions cleanly).
 */
export function mergeTagMap(savedMap) {
  const base = createDefaultTagMap();
  if (!savedMap || typeof savedMap !== 'object') return base;

  for (const def of ALL_TAG_DEFINITIONS) {
    const entry = savedMap[def.id];
    if (entry && typeof entry === 'object') {
      base[def.id] = {
        name: typeof entry.name === 'string' ? entry.name : def.defaultName,
        enabled: typeof entry.enabled === 'boolean' ? entry.enabled : !def.optional,
      };
    }
  }
  return base;
}

/**
 * Lint a single tag name against Pokémon GO search rules and optionally against peer tag names.
 * Returns `{ valid: boolean, errors: Issue[], warnings: Issue[] }`.
 */
export function lintTagName(name, otherNames = []) {
  const errors = [];
  const warnings = [];

  if (typeof name !== 'string' || name.trim().length === 0) {
    errors.push({
      code: 'EMPTY_NAME',
      message: 'Tag name cannot be empty.',
    });
    return { valid: false, errors, warnings };
  }

  if (name !== name.trim()) {
    errors.push({
      code: 'EDGE_WHITESPACE',
      message: 'Remove leading or trailing spaces (mobile autocorrect trailing spaces break #tag searches).',
    });
  }

  const trimmed = name.trim();
  const lower = trimmed.toLowerCase();

  if (FORBIDDEN_TAG_CHAR_REGEX.test(trimmed)) {
    const match = trimmed.match(FORBIDDEN_TAG_CHAR_REGEX)?.[0] || '';
    errors.push({
      code: 'FORBIDDEN_CHAR',
      message: `Character "${match}" is a Pokémon GO search operator and cannot be used in tag names. (Internal hyphens "-" are safe.)`,
    });
  }

  if (NATIVE_POGO_KEYWORDS.has(lower)) {
    errors.push({
      code: 'NATIVE_KEYWORD_COLLISION',
      message: `"${trimmed}" collides with a native Pokémon GO search keyword and will hijack/break built-in searches.`,
    });
  }

  // Check range-style native keywords like mega1, count2, age0, buddy5, cp1500
  if (/^(?:mega|count|dynamax|gigantamax|maxmove|maxguard|maxspirit|age|year|distance|cp|hp|buddy|candykm|countcandy|countcandyxl)\d/.test(lower)) {
    errors.push({
      code: 'NATIVE_KEYWORD_COLLISION',
      message: `"${trimmed}" collides with a native Pokémon GO range search phrase.`,
    });
  }

  if (trimmed.startsWith('-')) {
    warnings.push({
      code: 'LEADING_HYPHEN',
      message: 'Avoid starting a tag name with "-" (internal hyphens like "PVP-GL" are safe).',
    });
  }

  if (/\s/.test(trimmed)) {
    warnings.push({
      code: 'INTERNAL_WHITESPACE',
      message: 'Spaces inside tag names are harder to type quickly on mobile; consider using "-" instead.',
    });
  }

  // Leading non-ASCII (e.g., emoji at start slows down mobile # typing)
  if (/^[^\x20-\x7E]/.test(trimmed)) {
    warnings.push({
      code: 'LEADING_EMOJI',
      message: 'Putting emojis or non-ASCII symbols at the start slows down #tag typing; put icons at the end instead.',
    });
  }

  // Shortcut prefix warning (e.g. "MegaLevel" starts with shortcut "mega")
  for (const shortcut of SHORTCUT_KEYWORDS) {
    if (lower !== shortcut && lower.startsWith(shortcut) && !lower.startsWith(`${shortcut}-`)) {
      warnings.push({
        code: 'SHORTCUT_PREFIX_COLLISION',
        message: `Tag starts with Pokémon GO shortcut "${shortcut}" — always query with "#" prefix to avoid shortcut coercion.`,
      });
      break;
    }
  }

  // Check against peer active tags for exact duplicates & unintended # prefix overlap
  for (const peerRaw of otherNames) {
    if (typeof peerRaw !== 'string') continue;
    const peerTrimmed = peerRaw.trim();
    if (!peerTrimmed) continue;
    const peerLower = peerTrimmed.toLowerCase();

    if (peerLower === lower) {
      errors.push({
        code: 'DUPLICATE_TAG',
        message: `Duplicate tag name "${trimmed}" (tag search is case-insensitive).`,
      });
      break;
    }

    if (peerLower.startsWith(lower)) {
      warnings.push({
        code: 'PREFIX_OVERLAP',
        message: `Searching "#${lower}" will also match "${peerTrimmed}" because Pokémon GO prefix-matches tags.`,
      });
    } else if (lower.startsWith(peerLower)) {
      warnings.push({
        code: 'PREFIX_OVERLAP',
        message: `Searching "#${peerLower}" will also match "${trimmed}" because Pokémon GO prefix-matches tags.`,
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Lint an entire tag map across all enabled tags.
 * Returns `{ valid, byId: Record<tagId, LintResult>, errorCount, warningCount }`.
 */
export function lintTagMap(tagMap) {
  const merged = mergeTagMap(tagMap);
  const byId = {};
  let errorCount = 0;
  let warningCount = 0;

  const enabledEntries = ALL_TAG_DEFINITIONS
    .filter((def) => merged[def.id]?.enabled)
    .map((def) => ({ id: def.id, name: merged[def.id].name }));

  for (const def of ALL_TAG_DEFINITIONS) {
    const entry = merged[def.id];
    if (!entry.enabled) {
      byId[def.id] = { valid: true, errors: [], warnings: [] };
      continue;
    }
    const peers = enabledEntries
      .filter((e) => e.id !== def.id)
      .map((e) => e.name);
    const result = lintTagName(entry.name, peers);
    byId[def.id] = result;
    errorCount += result.errors.length;
    warningCount += result.warnings.length;
  }

  return {
    valid: errorCount === 0,
    byId,
    errorCount,
    warningCount,
  };
}

/**
 * Resolve `#<tagname>` (lowercase) for a single tag ID, or `''` if disabled/empty.
 */
export function getTagHash(tagId, tagMap) {
  const merged = tagMap ? mergeTagMap(tagMap) : createDefaultTagMap();
  const entry = merged[tagId];
  if (!entry || !entry.enabled) return '';
  const name = (entry.name || '').trim().toLowerCase();
  return name ? `#${name}` : '';
}

/**
 * Smart namespace resolver:
 * If all enabled tags in `namespaceId` share a clean prefix (e.g. "pvp-") and NO enabled tag
 * outside `namespaceId` starts with that prefix, returns a single umbrella hash (e.g. `['#pvp']`).
 * Otherwise falls back to each individual enabled tag hash so custom renames stay 100% accurate.
 */
export function getNamespaceHashes(namespaceId, tagMap) {
  const merged = tagMap ? mergeTagMap(tagMap) : createDefaultTagMap();
  const nsDefs = ALL_TAG_DEFINITIONS.filter((d) => d.namespace === namespaceId && merged[d.id]?.enabled);
  const nsNames = nsDefs.map((d) => (merged[d.id].name || '').trim().toLowerCase()).filter(Boolean);

  if (nsNames.length === 0) return [];
  if (nsNames.length === 1) return [`#${nsNames[0]}`];

  const nsMeta = TAG_NAMESPACES.find((n) => n.id === namespaceId);
  const defaultPrefix = nsMeta ? nsMeta.defaultPrefix.toLowerCase() : '';
  const umbrella = defaultPrefix.endsWith('-') ? defaultPrefix.slice(0, -1) : defaultPrefix;

  if (umbrella && nsNames.every((n) => n.startsWith(defaultPrefix))) {
    // Verify no enabled tag outside this namespace starts with `umbrella`
    const outsideCollision = ALL_TAG_DEFINITIONS.some((d) => {
      if (d.namespace === namespaceId || !merged[d.id]?.enabled) return false;
      const otherName = (merged[d.id].name || '').trim().toLowerCase();
      return otherName.startsWith(umbrella);
    });
    if (!outsideCollision) {
      return [`#${umbrella}`];
    }
  }

  return nsNames.map((n) => `#${n}`);
}

/**
 * Returns `!#...` exclusion terms for a namespace (e.g. `['!#pvp']` or `['!#gl', '!#ul']`).
 */
export function getNamespaceExclusions(namespaceId, tagMap) {
  return getNamespaceHashes(namespaceId, tagMap).map((h) => `!${h}`);
}

/**
 * Returns sorted tag list by recommended manual drag-and-drop triage order.
 */
export function getRecommendedDragOrder(tagMap) {
  const merged = mergeTagMap(tagMap);
  return [...ALL_TAG_DEFINITIONS]
    .sort((a, b) => a.dragOrder - b.dragOrder)
    .map((def) => ({
      ...def,
      name: merged[def.id].name,
      enabled: merged[def.id].enabled,
    }));
}
