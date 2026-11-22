import {
  REGION_KEYWORDS,
  TYPES,
  compressIds,
  SCARCE_RARE_SPECIES_IDS,
  PVP_IV_EXCLUDE_CLAUSE,
} from './searchUtils';
import { ALL_COMMUNITY_DAY_PRE_EVO_IDS } from '../data/communityDayRegistry';

// Complete 30-tag, 7-namespace opinionated taxonomy (+ optional 31st OP-Purify1k)
// Verified collision-free against Leidwesen/SearchPhrases v0.435.1.

export const TAG_NAMESPACES = [
  { id: 'ev', label: 'Events & Backgrounds', defaultPrefix: 'EV-', color: 'purple', description: 'In-person events, location backgrounds, global events, and shiny backgrounds.' },
  { id: 'keep', label: 'Collection & Trophies', defaultPrefix: 'KEEP-', color: 'yellow', description: 'Permanent non-combat keepers: nundos, Level 1s, Living Dex, museum pieces.' },
  { id: 'pvp', label: 'PvP / GO Battle League', defaultPrefix: 'PVP-', color: 'blue', description: 'Built league rosters (GL, UL, ML, Cups) and unbuilt PvP IV candidates.' },
  { id: 'pve', label: 'PvE Raid Attackers', defaultPrefix: 'PVE-', color: 'red', description: 'Built raid attackers, high-IV/Shadow PvE investment projects, and work-in-progress Mega candidates.' },
  { id: 'max', label: 'Max Battles (D-Max / G-Max)', defaultPrefix: 'MAX-', color: 'pink', description: 'Max Battle attackers, 0.5s-move tanks, healers, WIPs, and Power Spot candy mules.' },
  { id: 'tr', label: 'Trading Queues', defaultPrefix: 'TR-', color: 'green', description: 'Mirror trades, 100km+ distance trades, and Special/Lucky trade showcases.' },
  { id: 'op', label: 'Operational Queues', defaultPrefix: 'OP-', color: 'orange', description: 'Actionable housekeeping & investment queues (Power-Up WIPs, Mega grind, Spotlight Hours, Rocket Takeovers, daily loops).' },
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
    dragOrder: 15,
    purpose: 'Permanent non-combat keepers: 0% Nundos, Level 1s, Living Dex anchors, sentimental catches, museum @special / costume / regional 1-ofs.',
    nativeSearchSynergy: '0attack&0defense&0hp, count1, @special',
  },

  // Namespace 3: PvP / GBL (#pvp)
  {
    id: 'pvp_gl',
    namespace: 'pvp',
    defaultName: 'PVP-GL',
    color: 'blue',
    dragOrder: 16,
    purpose: 'Great League Roster & Candidates (≤1500 CP Top-100 meta + built double-moved roster; audit unbuilt needs via #pvp-gl&@3mov or #pvp-gl&evolve).',
    nativeSearchSynergy: '#pvp-gl&cp-1500, #pvp-gl&@3mov, #pvp-gl&!@3mov',
  },
  {
    id: 'pvp_ul',
    namespace: 'pvp',
    defaultName: 'PVP-UL',
    color: 'yellow',
    dragOrder: 17,
    purpose: 'Ultra League Roster & Candidates (≤2500 CP Top-100 meta + built double-moved roster; audit unbuilt needs via #pvp-ul&@3mov or #pvp-ul&evolve).',
    nativeSearchSynergy: '#pvp-ul&cp-2500, #pvp-ul&@3mov, #pvp-ul&!@3mov',
  },
  {
    id: 'pvp_ml',
    namespace: 'pvp',
    defaultName: 'PVP-ML',
    color: 'purple',
    dragOrder: 18,
    purpose: 'Master League Roster & Candidates (Top-100 ML 15-Atk 3★/4★ at any CP from Lv20 raid bosses up to Lv50 double-moved builds).',
    nativeSearchSynergy: '#pvp-ml&4attack, #pvp-ml&@3mov, #pvp-ml&countcandyxl296-',
  },
  {
    id: 'pvp_cup',
    namespace: 'pvp',
    defaultName: 'PVP-Cup',
    color: 'blue',
    dragOrder: 19,
    purpose: 'Little Cup (≤500 CP) & Limited/Themed Cup specialists outside the Open GL/UL Top 100.',
    nativeSearchSynergy: '#pvp-cup&cp-500, #pvp-cup&cp-1500',
  },
  {
    id: 'pvp_wip',
    namespace: 'pvp',
    defaultName: 'PVP-WIP',
    color: 'orange',
    dragOrder: 9,
    purpose: 'PvP Build Queue — pair alongside PVP-GL / PVP-UL / PVP-ML on candidates that still need Stardust, a 2nd Charged Move (@3mov), Evolution, or XL Candy; remove once battle-ready.',
    nativeSearchSynergy: '#pvp-wip&countcandyxl296-, #pvp-gl,#pvp-ul,#pvp-ml&@3mov',
  },

  // Namespace 4: PvE Raids (#pve)
  {
    id: 'pve_raid',
    namespace: 'pve',
    defaultName: 'PVE-Raid',
    color: 'red',
    dragOrder: 20,
    purpose: 'Built PvE Raid Attackers (powered-up Shadows, Legendaries, Fusions, Megas ready for lobbies). Filter by move type (#pve-raid&@ice) instead of 18 type tags.',
    nativeSearchSynergy: '#pve-raid&@fire, #pve-raid&shadow',
  },
  {
    id: 'pve_wip',
    namespace: 'pve',
    defaultName: 'PVE-WIP',
    color: 'red',
    dragOrder: 10,
    purpose: 'Unbuilt PvE Projects (15-Atk 3★/4★ regulars, S/A-tier Shadows, Legendaries & Fusions awaiting investment).',
    nativeSearchSynergy: '#pve-wip&countcandyxl296-',
  },
  {
    id: 'pve_megawip',
    namespace: 'pve',
    defaultName: 'PVE-MegaWIP',
    color: 'blue',
    dragOrder: 13,
    purpose: 'Work-in-Progress Megas — un-Mega\'d high-IV candidates & pre-evos awaiting Mega Energy, evolution, or stardust before joining the OP-Mega cooldown grind.',
    nativeSearchSynergy: '#pve-megawip&mega0, #pve-megawip&evolve',
  },

  // Namespace 5: Max Battles (#max)
  {
    id: 'max_atk',
    namespace: 'max',
    defaultName: 'MAX-Atk',
    color: 'pink',
    dragOrder: 21,
    purpose: 'Built Max Attackers (G-Max, Eternatus, Crowned Zacian, top D-Max with Max Attack Lv2–3).',
    nativeSearchSynergy: '#max-atk&maxmove3',
  },
  {
    id: 'max_tank',
    namespace: 'max',
    defaultName: 'MAX-Tank',
    color: 'green',
    dragOrder: 22,
    purpose: 'Built Max Tanks / Chargers (Zamazenta, Blissey, Metagross, Corviknight, Excadrill, Lapras w/ 0.5s Fast Move + Max Guard Lv2–3).',
    nativeSearchSynergy: '#max-tank&maxguard2-',
  },
  {
    id: 'max_heal',
    namespace: 'max',
    defaultName: 'MAX-Heal',
    color: 'green',
    dragOrder: 23,
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
    dragOrder: 24,
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
    dragOrder: 25,
    purpose: 'Wait-for-Move Evolution Queue — PvP/PvE pre-evolutions waiting for Comm Day / Legacy Move event (saves Elite TMs).',
    nativeSearchSynergy: '#op-evocd&evolve',
  },
  {
    id: 'op_evoxp',
    namespace: 'op',
    defaultName: 'OP-EvoXP',
    color: 'orange',
    dragOrder: 26,
    purpose: 'Mass-Evolve XP Queue — 12-candy fodder, traded trade-evolutions, spare XXLs for 2x Evolution XP Spotlight Hour + Lucky Egg.',
    nativeSearchSynergy: '#op-evoxp&evolve',
  },
  {
    id: 'op_mega',
    namespace: 'op',
    defaultName: 'OP-Mega',
    color: 'blue',
    dragOrder: 27,
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
    id: 'op_powerwip',
    namespace: 'op',
    defaultName: 'OP-PowerWIP',
    color: 'orange',
    dragOrder: 14,
    purpose: 'Work-in-Progress Power-Up Projects — active builds currently receiving Stardust & Candy/XL toward target CP/Lv40/Lv50 (remove once finished; distinct from the OP-PowerUp research queue).',
    nativeSearchSynergy: '#op-powerwip&countcandyxl296-, #op-powerwip&candyxl',
  },
  {
    id: 'op_powerup',
    namespace: 'op',
    defaultName: 'OP-PowerUp',
    color: 'orange',
    dragOrder: 28,
    purpose: 'Power-Up Research Queue — pre-selected mons for "Power up X times" Field Research so dust is never wasted.',
    nativeSearchSynergy: '#op-powerup',
  },
  {
    id: 'op_tmfrust',
    namespace: 'op',
    defaultName: 'OP-TMFrust',
    color: 'red',
    dragOrder: 29,
    purpose: 'Remove Frustration Queue — viable Shadows waiting for Team GO Rocket Takeover.',
    nativeSearchSynergy: '#op-tmfrust&@frustration',
  },
  {
    id: 'op_buddy',
    namespace: 'op',
    defaultName: 'OP-Buddy',
    color: 'yellow',
    dragOrder: 30,
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
    dragOrder: 31,
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
 * Core 30 tags enabled by default; optional OP-Purify1k enabled=false by default.
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

// Local fallback dex lists (avoids circular import with triageFunnels.js)
const DEFAULT_CANDY_12_FODDER_IDS = [10, 13, 16, 265, 293, 519];
const DEFAULT_TRADE_EVOLVE_IDS = [64, 67, 75, 93, 525, 533, 588, 616, 708, 710];
const CLASSIC_GL_XL_FLOOR_IDS = [108, 463, 222, 864, 302, 307, 308, 410, 411, 417, 659, 660, 703];
const COMPRESSED_CD_PRE_EVO_DEX = compressIds(ALL_COMMUNITY_DAY_PRE_EVO_IDS);

/**
 * 6-stage top-to-bottom initial box hydration walkthrough order covering all 31 tags
 * (30 core + optional OP-Purify1k). Running in this order ensures `!#` cascades cleanly
 * from highest-priority grails & built rosters down to WIPs, trade queues, and daily ops.
 */
export const HYDRATION_STAGES = [
  {
    id: 'stage_1_events',
    stageNumber: 1,
    title: 'Stage 1: Events & Backgrounds',
    subtitle: 'Lock irreplaceable shiny backgrounds, location cards, global BGs, and live-event souvenirs first.',
    tagIds: ['ev_shbg', 'ev_locbg', 'ev_global', 'ev_inperson'],
  },
  {
    id: 'stage_2_collection',
    stageNumber: 2,
    title: 'Stage 2: Collection & Trophies',
    subtitle: 'Protect 0% nundos, Living Dex singletons, and museum costumes/legacy moves before combat sweeps.',
    tagIds: ['keep_trophy'],
  },
  {
    id: 'stage_3_built',
    stageNumber: 3,
    title: 'Stage 3: Built Competitive Rosters',
    subtitle: 'Tag already-built double-moved PvP teams, powered-up PvE raiders, and upgraded Max Battle squads.',
    tagIds: ['pvp_gl', 'pvp_ul', 'pvp_ml', 'pvp_cup', 'pve_raid', 'max_atk', 'max_tank', 'max_heal'],
  },
  {
    id: 'stage_4_wip',
    stageNumber: 4,
    title: 'Stage 4: Unbuilt WIP & Candy Mules',
    subtitle: 'Sweep untagged meta PvP spreads, 15-Atk/Shadow PvE projects, un-Mega\'d Mega candidates, Max WIPs, and Power Spot mules.',
    tagIds: ['pvp_wip', 'pve_wip', 'pve_megawip', 'max_wip', 'max_candy'],
  },
  {
    id: 'stage_5_trading',
    stageNumber: 5,
    title: 'Stage 5: Trading Queues',
    subtitle: 'Route remaining untagged tradeables into Special/Lucky, 100km+ Distance, and Mirror queues.',
    tagIds: ['tr_spec', 'tr_dist', 'tr_mirror'],
  },
  {
    id: 'stage_6_ops',
    stageNumber: 6,
    title: 'Stage 6: Operational Queues',
    subtitle: 'Populate daily & event housekeeping queues (Mega grind, XXLs, Rocket TM, Buddy, CD/XP Evos, Power-Up WIPs & Research, 2x Xfer).',
    tagIds: ['op_mega', 'op_xxl', 'op_tmfrust', 'op_buddy', 'op_evocd', 'op_evoxp', 'op_powerwip', 'op_powerup', 'op_2xxfer', 'op_purify1k'],
  },
];

/**
 * Build verified, Leidwesen v0.435.1-compliant initial box hydration search string(s) for a single tag ID.
 * Returns an array of `{ id, label, query, note?, isSecondary? }`.
 */
export function buildTagHydrationQueries(tagId, tagMap = null, metaSnapshot = null) {
  const merged = tagMap ? mergeTagMap(tagMap) : createDefaultTagMap();
  const pvp = metaSnapshot?.pvp || {};
  const pve = metaSnapshot?.pve || {};
  const special = metaSnapshot?.specialLists || {};

  switch (tagId) {
    // --- Stage 1: Events & Backgrounds ---
    case 'ev_shbg':
      return [
        {
          id: 'ev_shbg_primary',
          label: 'Shiny + Background',
          query: 'shiny&background&!#',
          note: 'Dual-lock every hit with Favorite (★) + tag.',
        },
      ];

    case 'ev_locbg':
      return [
        {
          id: 'ev_locbg_primary',
          label: 'Location Backgrounds',
          query: 'locationbackground&!#',
        },
      ];

    case 'ev_global':
      return [
        {
          id: 'ev_global_primary',
          label: 'Special Backgrounds',
          query: 'specialbackground&!#',
        },
        {
          id: 'ev_global_profile',
          label: 'Profile Backgrounds',
          query: 'profilebackground&!#',
          isSecondary: true,
        },
      ];

    case 'ev_inperson':
      return [
        {
          id: 'ev_inperson_primary',
          label: 'Travel & Live Event Souvenirs (100km+)',
          query: 'distance100-&shiny,costume,201,479&!traded&!#',
          note: 'Surfaces untraded travel/venue shinies, costumes, Unowns (#201), and Rotoms (#479) caught 100km+ from home. For local live events, copy the exact ageX-Y window from Events & Trips.',
        },
        {
          id: 'ev_inperson_unown_rotom',
          label: 'Untraded Unown & Rotom',
          query: '201,479&!traded&!#',
          isSecondary: true,
        },
      ];

    // --- Stage 2: Collection & Trophies ---
    case 'keep_trophy':
      return [
        {
          id: 'keep_trophy_nundos',
          label: 'Nundos (0%)',
          query: '0attack&0defense&0hp&!#',
        },
        {
          id: 'keep_trophy_singletons',
          label: 'True 1-of-1 Singletons',
          query: 'count1&!#',
          note: 'count1 matches species where you own literally 1 copy in your entire storage.',
        },
        {
          id: 'keep_trophy_legacy',
          label: 'Singleton True Legacy Moves',
          query: '@special&!@frustration&!@return&!shadow&!purified&count1&!#',
          note: 'Excludes Shadow Frustration and Purified Return (which PoGO counts as @special) so combat shadows and raid squads stay free for Stages 3–6.',
        },
        {
          id: 'keep_trophy_vintage',
          label: 'Vintage 2016–2019 Catches',
          query: 'year2016-2019&!#',
          isSecondary: true,
        },
      ];

    // --- Stage 3: Built Competitive Rosters & League-Assigned Candidates ---
    case 'pvp_gl': {
      const glLow = Array.isArray(pvp.gl?.top100?.lowAtk) ? pvp.gl.top100.lowAtk : [];
      const rawGlHigh = Array.isArray(pvp.gl?.top100?.highAtk) ? pvp.gl.top100.highAtk : [];
      const glHigh = rawGlHigh.length > 0 ? [...rawGlHigh, ...CLASSIC_GL_XL_FLOOR_IDS] : [];
      const glLowDex = compressIds(glLow);
      const glHighDex = compressIds(glHigh);
      const glHash = getTagHash('pvp_gl', merged) || '#pvp-gl';

      const queries = [];
      if (glLowDex) {
        queries.push({
          id: 'pvp_gl_meta_low',
          label: 'GL Top-100 Low-Atk Candidates (≤1500 CP)',
          query: `!#&0-1attack&3-4defense&3-4hp&cp-1500&${glLowDex}`,
          note: 'Uses cp-1500 (no minimum CP floor) so low-level wild catches and pre-evolutions that need powering up, evolving, or a 2nd move are included.',
        });
      }
      if (glHighDex) {
        queries.push({
          id: 'pvp_gl_meta_high',
          label: 'GL Top-100 XL / High-Atk Candidates (≤1500 CP)',
          query: `!#&2-4attack&3-4defense&3-4hp&cp-1500&${glHighDex}`,
          note: 'Catches XL and egg/raid-floor GL staples (Lickitung, Medicham, Corsola, Bastiodon, Sableye, Carbink, Pachirisu, Diggersby, Florges) at any CP ≤ 1500.',
        });
      }
      queries.push({
        id: 'pvp_gl_primary',
        label: 'Built Double-Moved GL (≤1500 CP)',
        query: 'cp-1500&!@3mov&!#',
      });
      queries.push({
        id: 'pvp_gl_needs_work',
        label: 'Tagged GL Needing 2nd Move / Evo',
        query: `${glHash}&@3mov,evolve`,
        isSecondary: true,
        note: 'Audits your tagged Great League pool for Pokémon that still need their 2nd Charged Move (@3mov) or evolution.',
      });
      return queries;
    }

    case 'pvp_ul': {
      const ulLow = Array.isArray(pvp.ul?.top100?.lowAtk) ? pvp.ul.top100.lowAtk : [];
      const ulHigh = Array.isArray(pvp.ul?.top100?.highAtk) ? pvp.ul.top100.highAtk : [];
      const ulLowDex = compressIds(ulLow);
      const ulHighDex = compressIds(ulHigh);
      const ulHash = getTagHash('pvp_ul', merged) || '#pvp-ul';

      const queries = [];
      if (ulLowDex) {
        queries.push({
          id: 'pvp_ul_meta_low',
          label: 'UL Top-100 Low-Atk Candidates (≤2500 CP)',
          query: `!#&0-1attack&3-4defense&3-4hp&cp-2500&${ulLowDex}`,
          note: 'Uses cp-2500 (no minimum CP floor) so under-leveled catches, Lv20 Raid Bosses, and pre-evolutions needing power-up or 2nd move are surfaced.',
        });
      }
      if (ulHighDex) {
        queries.push({
          id: 'pvp_ul_meta_high',
          label: 'UL Top-100 XL / Hundo-Cap Candidates (≤2500 CP)',
          query: `!#&3*,4*&cp-2500&${ulHighDex}`,
          note: 'Catches XL-capped UL staples (Tinkaton, Talonflame, Umbreon, Mandibuzz, Jellicent, Zygarde, Virizion) at any CP ≤ 2500.',
        });
      }
      queries.push({
        id: 'pvp_ul_primary',
        label: 'Built Double-Moved UL (1501–2500 CP)',
        query: 'cp1501-2500&!@3mov&!#',
      });
      queries.push({
        id: 'pvp_ul_needs_work',
        label: 'Tagged UL Needing 2nd Move / Evo',
        query: `${ulHash}&@3mov,evolve`,
        isSecondary: true,
        note: 'Audits your tagged Ultra League pool for Pokémon that still need their 2nd Charged Move (@3mov) or evolution.',
      });
      return queries;
    }

    case 'pvp_ml': {
      const mlAll = Array.isArray(pvp.ml?.top100?.all) ? pvp.ml.top100.all : [];
      const mlAllDex = compressIds(mlAll);
      const mlHash = getTagHash('pvp_ml', merged) || '#pvp-ml';

      const queries = [];
      if (mlAllDex) {
        queries.push({
          id: 'pvp_ml_meta_candidates',
          label: 'ML Top-100 15-Atk Candidates (Any CP)',
          query: `!#&3*,4*&4attack&3-4defense&3-4hp&${mlAllDex}`,
          note: 'No minimum CP filter — catches Level 20 Raid Bosses, hatches, and pre-evolutions that need powering up and a 2nd move.',
        });
        queries.push({
          id: 'pvp_ml_meta_hundos',
          label: 'ML Top-100 4★ Hundos (Any CP)',
          query: `!#&4*&${mlAllDex}`,
        });
      }
      queries.push({
        id: 'pvp_ml_primary',
        label: 'Built Double-Moved ML (3000+ CP)',
        query: 'cp3000-&!@3mov&3*,4*&4attack&!#',
      });
      queries.push({
        id: 'pvp_ml_needs_work',
        label: 'Tagged ML Needing 2nd Move / Evo',
        query: `${mlHash}&@3mov,evolve`,
        isSecondary: true,
      });
      return queries;
    }

    case 'pvp_cup':
      return [
        {
          id: 'pvp_cup_primary',
          label: 'Built Little Cup (≤500 CP Double-Moved)',
          query: 'cp-500&!@3mov&!#',
        },
        {
          id: 'pvp_cup_little_candidates',
          label: 'Little Cup Low-Atk Candidates (≤500 CP)',
          query: '0-1attack&3-4defense&3-4hp&cp-500&!#',
        },
        {
          id: 'pvp_cup_limited_spice',
          label: 'Limited Cup Low-Atk Spice (≤1500 CP)',
          query: '0-1attack&3-4defense&3-4hp&cp-1500&!#',
          isSecondary: true,
        },
      ];

    case 'pve_raid': {
      const byTypeFlat = pve.byType ? Object.values(pve.byType).flat() : [];
      const allPveIds = [
        ...(Array.isArray(pve.top30Overall) ? pve.top30Overall : []),
        ...(Array.isArray(pve.topShadow) ? pve.topShadow : []),
        ...(Array.isArray(pve.topMegaEvolved) ? pve.topMegaEvolved : []),
        ...byTypeFlat,
      ];
      const allPveDex = compressIds(allPveIds);
      if (allPveDex) {
        return [
          {
            id: 'pve_raid_primary',
            label: 'Powered-Up Meta Raiders',
            query: `cp2500-,candyxl,mega3-&3*,4*,shadow&!#&${allPveDex}`,
            note: 'Scoped to verified PvE raid families so high-CP non-raiders (Slaking, Blissey, Regigigas) are filtered out.',
          },
          {
            id: 'pve_raid_broad',
            label: 'Broad High-CP / XL Raiders',
            query: 'cp3000-,candyxl,mega3-&3*,4*,shadow&!#',
            isSecondary: true,
          },
        ];
      }
      return [
        {
          id: 'pve_raid_primary',
          label: 'Built Raid Attackers',
          query: 'cp3000-,candyxl,mega3-&3*,4*,shadow&!#',
        },
      ];
    }

    case 'max_atk':
      return [
        {
          id: 'max_atk_primary',
          label: 'Max Attack Lv2–3 (Dedicated Attackers)',
          query: 'maxmove2-&!maxguard2-&!maxspirit2-&!#',
          note: 'Skips upgraded Max Guard / Max Spirit builds so dedicated Tanks and Healers cascade cleanly to MAX-Tank and MAX-Heal.',
        },
        {
          id: 'max_atk_gmax',
          label: 'Powered-Up Gigantamax',
          query: 'gigantamax&cp2000-&!#',
          isSecondary: true,
        },
      ];

    case 'max_tank':
      return [
        {
          id: 'max_tank_primary',
          label: 'Max Guard Unlocked',
          query: 'maxmove1-&maxguard1-&!#',
        },
      ];

    case 'max_heal':
      return [
        {
          id: 'max_heal_primary',
          label: 'Max Spirit Unlocked',
          query: 'maxmove1-&maxspirit1-&!#',
        },
        {
          id: 'max_heal_blissey',
          label: 'Chansey / Blissey Max',
          query: '113,242&maxmove1-&!#',
          isSecondary: true,
        },
      ];

    // --- Stage 4: Unbuilt WIP & Candy Mules ---
    case 'pvp_wip': {
      const glLow = Array.isArray(pvp.gl?.top100?.lowAtk) ? pvp.gl.top100.lowAtk : [];
      const ulLow = Array.isArray(pvp.ul?.top100?.lowAtk) ? pvp.ul.top100.lowAtk : [];
      const rawGlHigh = Array.isArray(pvp.gl?.top100?.highAtk) ? pvp.gl.top100.highAtk : [];
      const glHigh = rawGlHigh.length > 0 ? [...rawGlHigh, ...CLASSIC_GL_XL_FLOOR_IDS] : [];
      const ulHigh = Array.isArray(pvp.ul?.top100?.highAtk) ? pvp.ul.top100.highAtk : [];
      const mlAll = Array.isArray(pvp.ml?.top100?.all) ? pvp.ml.top100.all : [];

      const glUlLowAtkDex = compressIds([...glLow, ...ulLow]);
      const glUlHighAtkDex = compressIds([...glHigh, ...ulHigh]);
      const mlAllDex = compressIds(mlAll);
      const leagueHashes = [
        getTagHash('pvp_gl', merged),
        getTagHash('pvp_ul', merged),
        getTagHash('pvp_ml', merged),
        getTagHash('pvp_cup', merged),
      ]
        .filter(Boolean)
        .join(',') || '#pvp-gl,#pvp-ul,#pvp-ml,#pvp-cup';
      const queries = [];

      if (glUlLowAtkDex) {
        queries.push({
          id: 'pvp_wip_meta',
          label: 'Meta GL/UL Low-Atk',
          query: `!#&0-1attack&3-4defense&3-4hp&cp-2500&${glUlLowAtkDex}`,
        });
      }
      if (glUlHighAtkDex) {
        queries.push({
          id: 'pvp_wip_xl',
          label: 'Meta GL/UL XL High-Atk',
          query: `!#&2-4attack&3-4defense&3-4hp&cp-2500&${glUlHighAtkDex}`,
          note: 'Catches XL/hundo-cap GL & UL staples (Lickitung, Medicham, Corsola, Tinkaton, Talonflame, Umbreon).',
        });
      }
      queries.push({
        id: 'pvp_wip_league_needs_move',
        label: 'League-Tagged Needing 2nd Move (@3mov)',
        query: `${leagueHashes}&@3mov`,
        note: 'Finds Pokémon already tagged PVP-GL / PVP-UL / PVP-ML whose 2nd Charged Move is still locked (@3mov). Dual-tag with PVP-WIP until built.',
      });
      queries.push({
        id: 'pvp_wip_league_needs_evo',
        label: 'League-Tagged Needing Evolution',
        query: `${leagueHashes}&evolve`,
        isSecondary: true,
      });
      if (mlAllDex) {
        queries.push({
          id: 'pvp_wip_ml',
          label: 'Meta Master League (15-Atk)',
          query: `!#&3*,4*&4attack&${mlAllDex}`,
          isSecondary: true,
        });
      }
      queries.push({
        id: 'pvp_wip_broad',
        label: glUlLowAtkDex ? 'Broad Spicy Low-Atk' : 'Low-Atk PvP IVs',
        query: '0-1attack&3-4defense&3-4hp&cp-2500&!#',
        isSecondary: Boolean(glUlLowAtkDex),
      });
      return queries;
    }

    case 'pve_wip': {
      const pveTop30Dex = compressIds(Array.isArray(pve.top30Overall) ? pve.top30Overall : []);
      const pveShadowDex = compressIds(Array.isArray(pve.topShadow) ? pve.topShadow : []);
      return [
        {
          id: 'pve_wip_regulars',
          label: 'Top PvE Regulars',
          query: pveTop30Dex
            ? `!#&!shadow&3*,4*&4attack&${pveTop30Dex}`
            : '!#&!shadow&3*,4*&4attack',
        },
        {
          id: 'pve_wip_shadows',
          label: 'Top PvE Shadows',
          query: pveShadowDex ? `!#&shadow&${pveShadowDex}` : '!#&shadow',
        },
      ];
    }

    case 'pve_megawip': {
      const evolvedList = Array.isArray(pve.topMegaEvolved) ? pve.topMegaEvolved : [];
      const evolvedSet = new Set(evolvedList);
      const familyList = Array.isArray(pve.topMegaFamily) ? pve.topMegaFamily : [];
      const preEvoList = familyList.filter((id) => !evolvedSet.has(id));

      const pveMegaEvolvedDex = compressIds(evolvedList);
      const pveMegaPreEvoDex = compressIds(preEvoList);
      return [
        {
          id: 'pve_megawip_candidates',
          label: "Un-Mega'd Evolved Candidates",
          query: pveMegaEvolvedDex
            ? `!#&!shadow&mega0&3*,4*&4attack&${pveMegaEvolvedDex}`
            : '!#&!shadow&mega0&3*,4*&4attack',
          note: 'mega0 matches fully evolved Mega-capable species that have never been Mega Evolved.',
        },
        {
          id: 'pve_megawip_preevos',
          label: 'Mega Pre-Evolutions Only',
          query: pveMegaPreEvoDex
            ? `!#&!shadow&3*,4*&4attack&${pveMegaPreEvoDex}`
            : '!#&!shadow&evolve&3*,4*&4attack',
          isSecondary: true,
          note: 'Uses strict pre-evolution Dex IDs (topMegaFamily minus topMegaEvolved) so already-Mega-Evolved mega1–3 forms never leak into PVE-MegaWIP before Stage 6 OP-Mega.',
        },
      ];
    }

    case 'max_wip':
      return [
        {
          id: 'max_wip_primary',
          label: 'Unbuilt High-Value Max',
          query: 'maxmove1-&!maxmove2-&!maxguard1-&!maxspirit1-&3*,4*,gigantamax,legendary&!#',
        },
      ];

    case 'max_candy':
      return [
        {
          id: 'max_candy_primary',
          label: 'Power Spot Candy Mules',
          query: 'dynamax&!maxmove2-&!maxguard1-&!maxspirit1-&0*,1*,2*&!shiny&!background&!#',
        },
      ];

    // --- Stage 5: Trading Queues ---
    case 'tr_spec':
      return [
        {
          id: 'tr_spec_primary',
          label: 'Special / Lucky Tradeables',
          query: 'shiny,legendary,ultrabeast,costume,background&!traded&!favorite&!4*&!#',
        },
      ];

    case 'tr_dist':
      return [
        {
          id: 'tr_dist_primary',
          label: '100km+ Distance Tradeables',
          query: 'distance100-&!traded&!shiny&!legendary&!mythical&!ultrabeast&!4*&!favorite&!#',
        },
      ];

    case 'tr_mirror': {
      const mirrorIds = [
        ...SCARCE_RARE_SPECIES_IDS,
        ...ALL_COMMUNITY_DAY_PRE_EVO_IDS,
        ...(Array.isArray(pve.top30Overall) ? pve.top30Overall : []),
        ...(Array.isArray(pvp.gl?.top100?.highAtk) ? pvp.gl.top100.highAtk : []),
        ...(Array.isArray(pvp.ul?.top100?.highAtk) ? pvp.ul.top100.highAtk : []),
        ...(Array.isArray(pvp.ml?.top100?.all) ? pvp.ml.top100.all : []),
      ];
      const mirrorDex = compressIds(mirrorIds);
      return [
        {
          id: 'tr_mirror_primary',
          label: 'Meta, Pseudo & CD Mirror Spares',
          query: mirrorDex
            ? `!traded&!favorite&!shiny&!4*&!background&0*,1*,2*&!#&${mirrorDex}`
            : '!traded&!favorite&!shiny&!4*&!background&0*,1*,2*&count2-&!#',
          note: 'Scoped to PvE/PvP meta, pseudo-legendaries, egg rares, and CD pre-evos so common wild fodder does not flood TR-Mirror.',
        },
        {
          id: 'tr_mirror_max',
          label: 'Untraded Low-IV Max Spares',
          query: 'maxmove1-&!traded&!favorite&!shiny&!4*&!background&0*,1*,2*&!#',
          isSecondary: true,
        },
      ];
    }

    // --- Stage 6: Operational Queues ---
    case 'op_mega':
      return [
        {
          id: 'op_mega_primary',
          label: 'Mega Lv1–2 Grind',
          query: 'mega1-2&!#',
        },
        {
          id: 'op_mega_lv4',
          label: 'Lv4 Super Max Target',
          query: 'mega1-3&!#',
          isSecondary: true,
        },
      ];

    case 'op_xxl':
      return [
        {
          id: 'op_xxl_primary',
          label: 'Untagged XXLs',
          query: 'xxl&!#',
        },
      ];

    case 'op_tmfrust':
      return [
        {
          id: 'op_tmfrust_highiv',
          label: 'High-IV Shadows',
          query: 'shadow&@frustration&3*,4*&!#',
        },
        {
          id: 'op_tmfrust_pvp',
          label: 'PvP IVs',
          query: 'shadow&@frustration&0-1attack&3-4defense&3-4hp&!#',
        },
      ];

    case 'op_buddy':
      return [
        {
          id: 'op_buddy_primary',
          label: 'Active Buddies (Lv1–4)',
          query: 'buddy1-4&!#',
        },
      ];

    case 'op_evocd': {
      const wipEvoHashes = [
        getTagHash('pvp_wip', merged),
        getTagHash('pve_wip', merged),
        getTagHash('pve_megawip', merged),
      ].filter(Boolean);
      return [
        {
          id: 'op_evocd_cd',
          label: 'High-IV & Shiny CD Pre-Evos',
          query: `evolve&!#&!favorite&!@special&3*,4*,shiny&${COMPRESSED_CD_PRE_EVO_DEX}`,
          note: 'Filters out 0★–2★ non-shiny common clutter so only worthy Community Day pre-evolutions enter OP-EvoCD.',
        },
        {
          id: 'op_evocd_pvp',
          label: 'PvP-IV CD Pre-Evos',
          query: `evolve&!#&!favorite&!@special&0-1attack&3-4defense&3-4hp&cp-2500&${COMPRESSED_CD_PRE_EVO_DEX}`,
          isSecondary: true,
        },
        {
          id: 'op_evocd_wip',
          label: 'WIP Evolves',
          query: wipEvoHashes.length > 0 ? `${wipEvoHashes.join(',')}&evolve` : 'evolve&!#&3*,4*',
        },
      ];
    }

    case 'op_evoxp': {
      const candy12Ids =
        Array.isArray(special.candy12Fodder) && special.candy12Fodder.length > 0
          ? special.candy12Fodder
          : DEFAULT_CANDY_12_FODDER_IDS;
      const tradeEvoIds =
        Array.isArray(special.tradeEvolve) && special.tradeEvolve.length > 0
          ? special.tradeEvolve
          : DEFAULT_TRADE_EVOLVE_IDS;
      return [
        {
          id: 'op_evoxp_candy12',
          label: '12-Candy Fodder',
          query: `evolve&!favorite&!shiny&!4*&!shadow&!maxmove1-&!#&${compressIds(candy12Ids)}`,
        },
        {
          id: 'op_evoxp_traded',
          label: 'Already-Traded Free Evos',
          query: `traded&evolve&!favorite&!#&${compressIds(tradeEvoIds)}`,
        },
      ];
    }

    case 'op_powerwip': {
      const wipHashes = [
        getTagHash('pvp_wip', merged),
        getTagHash('pve_wip', merged),
        getTagHash('pve_megawip', merged),
        getTagHash('max_wip', merged),
      ].filter(Boolean);
      const opPowerWipHash = getTagHash('op_powerwip', merged);
      let primaryQuery;
      if (wipHashes.length > 0 && opPowerWipHash) {
        primaryQuery = `${wipHashes.join(',')}&!${opPowerWipHash}`;
      } else if (wipHashes.length > 0) {
        primaryQuery = wipHashes.join(',');
      } else if (opPowerWipHash) {
        primaryQuery = `3*,4*&!${opPowerWipHash}`;
      } else {
        primaryQuery = '3*,4*&!#';
      }
      return [
        {
          id: 'op_powerwip_wips',
          label: 'Tagged WIP Builds',
          query: primaryQuery,
          note: 'Pick the WIP builds you are actively spending Stardust/Candy on right now; remove once they reach target CP/Lv40/Lv50.',
        },
        {
          id: 'op_powerwip_xl',
          label: 'Partially XL-Powered (Lv41–49)',
          query: opPowerWipHash ? `candyxl&3*,4*&!${opPowerWipHash}` : 'candyxl&3*,4*&!#',
          isSecondary: true,
          note: 'Surfaces Pokémon you already started investing XL Candy into so half-finished projects stay tracked.',
        },
      ];
    }

    case 'op_powerup': {
      const wipHashes = [
        getTagHash('pvp_wip', merged),
        getTagHash('pve_wip', merged),
        getTagHash('pve_megawip', merged),
        getTagHash('max_wip', merged),
        getTagHash('op_powerwip', merged),
      ].filter(Boolean);
      const opPowerupHash = getTagHash('op_powerup', merged);
      let query;
      if (wipHashes.length > 0 && opPowerupHash) {
        query = `${wipHashes.join(',')}&!${opPowerupHash}`;
      } else if (wipHashes.length > 0) {
        query = wipHashes.join(',');
      } else if (opPowerupHash) {
        query = `3*,4*&!${opPowerupHash}`;
      } else {
        query = '3*,4*&!#';
      }
      return [
        {
          id: 'op_powerup_primary',
          label: 'Tagged WIPs Not Yet Queued',
          query,
          note: 'Run after Stage 4 WIP tags (and OP-PowerWIP) are populated so only genuine build projects enter your Field Research Power-Up queue.',
        },
      ];
    }

    case 'op_2xxfer':
      return [
        {
          id: 'op_2xxfer_primary',
          label: '0★–2★ Excess Legendaries & UBs',
          query: `legendary,ultrabeast&0*,1*,2*&!lucky&!shiny&!4*&!background&!favorite&!fusion&!adventureeffect&!@special&@3mov&${PVP_IV_EXCLUDE_CLAUSE}&!#`,
          note: 'Protects Mythicals, 3★–4★s, Fusions, Adventure Effects, Legacy Moves, PvP-IV rerolls, and double-moved builds (@3mov).',
        },
        {
          id: 'op_2xxfer_dup3star',
          label: 'Duplicate Non-15-Atk 3★ Legendaries',
          query: 'legendary,ultrabeast&3*&0-3attack&count2-&!lucky&!shiny&!4*&!background&!favorite&!fusion&!adventureeffect&!@special&@3mov&!#',
          isSecondary: true,
        },
      ];

    case 'op_purify1k':
      return [
        {
          id: 'op_purify1k_primary',
          label: '1k Stardust Shadows',
          query: 'shadow&candykm1&!shiny&!4*&!favorite&!#',
        },
      ];

    default:
      return [];
  }
}

/**
 * Returns all 31 tag hydration steps (30 core + optional OP-Purify1k) in the exact
 * recommended top-to-bottom 6-stage hydration order.
 */
export function getAllTagHydrationSteps(tagMap = null, metaSnapshot = null) {
  const merged = tagMap ? mergeTagMap(tagMap) : createDefaultTagMap();
  const steps = [];
  let stepNumber = 1;

  for (const stage of HYDRATION_STAGES) {
    for (const tagId of stage.tagIds) {
      const def = TAG_DEFINITION_BY_ID[tagId];
      if (!def) continue;
      const entry = merged[tagId];
      steps.push({
        stepNumber: stepNumber++,
        stageId: stage.id,
        stageNumber: stage.stageNumber,
        stageTitle: stage.title,
        stageSubtitle: stage.subtitle,
        tagId: def.id,
        tagName: entry?.name || def.defaultName,
        defaultName: def.defaultName,
        tagHash: getTagHash(def.id, merged),
        color: def.color,
        namespace: def.namespace,
        enabled: Boolean(entry?.enabled),
        optional: Boolean(def.optional),
        purpose: def.purpose,
        queries: buildTagHydrationQueries(def.id, merged, metaSnapshot),
      });
    }
  }

  return steps;
}
