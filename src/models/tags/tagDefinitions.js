/**
 * Complete 30-tag, 7-namespace opinionated taxonomy (+ optional 31st OP-Purify1k).
 * Verified collision-free against Leidwesen/SearchPhrases.
 */

export const TAG_NAMESPACES = [
  { id: 'ev', label: 'Events & Backgrounds', defaultPrefix: 'EV-', color: 'purple', description: 'In-person events, location backgrounds, global events, and shiny backgrounds.' },
  { id: 'keep', label: 'Collection & Trophies', defaultPrefix: 'KEEP-', color: 'yellow', description: 'Permanent non-combat keepers: nundos, Level 1s, Living Dex, museum pieces.' },
  { id: 'pvp', label: 'PvP / GO Battle League', defaultPrefix: 'PVP-', color: 'blue', description: 'Built league rosters (GL, UL, ML, Cups) and unbuilt PvP IV candidates.' },
  { id: 'pve', label: 'PvE Raid Attackers', defaultPrefix: 'PVE-', color: 'red', description: 'Built raid attackers, high-IV/Shadow PvE investment projects, and work-in-progress Mega candidates.' },
  { id: 'max', label: 'Max Battles (D-Max / G-Max)', defaultPrefix: 'MAX-', color: 'pink', description: 'Max Battle attackers, 0.5s-move tanks, healers, WIPs, and Power Spot candy mules.' },
  { id: 'tr', label: 'Trading Queues', defaultPrefix: 'TR-', color: 'green', description: 'Mirror trades, 100km+ distance trades, and Special/Lucky trade showcases.' },
  { id: 'op', label: 'Operational Queues', defaultPrefix: 'OP-', color: 'orange', description: 'Actionable housekeeping & investment queues (Power-Up WIPs, Mega grind, Spotlight Hours, Rocket Takeovers, daily loops).' },
];

export const TAG_COLOR_LABELS = {
  purple: 'Purple',
  yellow: 'Yellow',
  blue: 'Blue',
  red: 'Red',
  pink: 'Pink',
  green: 'Green',
  orange: 'Orange',
  black: 'Black',
  grey: 'Grey',
};

export const CORE_TAGS = [
  // Namespace 1: Events & Backgrounds (#ev-)
  {
    id: 'ev_inperson',
    namespace: 'ev',
    defaultName: 'EV-InPerson',
    color: 'purple',
    dragOrder: 7,
    purpose: 'Catches from in-person ticketed events (City GO Fest, Live GO Tour, City Safari, Safari Zone) — city-stamped shinies, costumes, Unowns, regionals, even without a background.',
    nativeSearchSynergy: 'distance100-, costume, shiny',
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

  // Namespace 2: Collection (#keep-)
  {
    id: 'keep_trophy',
    namespace: 'keep',
    defaultName: 'KEEP-Trophy',
    color: 'yellow',
    dragOrder: 15,
    purpose: 'Permanent non-combat keepers: 0% Nundos, Level 1s, Living Dex anchors, sentimental catches, museum @special / costume / regional 1-ofs.',
    nativeSearchSynergy: '0attack&0defense&0hp, count1, @special',
  },

  // Namespace 3: PvP / GBL (#pvp-)
  {
    id: 'pvp_gl',
    namespace: 'pvp',
    defaultName: 'PVP-GL',
    color: 'blue',
    dragOrder: 16,
    purpose: 'Built Great League (≤1500 CP, double-moved, battle-ready).',
    nativeSearchSynergy: '#pvp-gl&cp-1500',
  },
  {
    id: 'pvp_ul',
    namespace: 'pvp',
    defaultName: 'PVP-UL',
    color: 'yellow',
    dragOrder: 17,
    purpose: 'Built Ultra League (≤2500 CP, double-moved, battle-ready).',
    nativeSearchSynergy: '#pvp-ul&cp-2500',
  },
  {
    id: 'pvp_ml',
    namespace: 'pvp',
    defaultName: 'PVP-ML',
    color: 'purple',
    dragOrder: 18,
    purpose: 'Built Master League (L50 / hundo or functional 15-Atk hundo, double-moved).',
    nativeSearchSynergy: '#pvp-ml&4attack',
  },
  {
    id: 'pvp_cup',
    namespace: 'pvp',
    defaultName: 'PVP-Cup',
    color: 'blue',
    dragOrder: 19,
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

  // Namespace 4: PvE Raids (#pve-)
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
    purpose: "Work-in-Progress Megas — un-Mega'd high-IV candidates & pre-evos awaiting Mega Energy, evolution, or stardust before joining the OP-Mega cooldown grind.",
    nativeSearchSynergy: '#pve-megawip&mega0, #pve-megawip&evolve',
  },

  // Namespace 5: Max Battles (#max-)
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

  // Namespace 6: Trading (#tr-)
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

  // Namespace 7: Operations (#op-)
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
    subtitle: 'Tag already-built double-moved PvP teams, powered-up PvE raiders, and upgraded Max Battle squads (Healers before Tanks so Spirit+Guard Blissey routes cleanly).',
    tagIds: ['pvp_gl', 'pvp_ul', 'pvp_ml', 'pvp_cup', 'pve_raid', 'max_atk', 'max_heal', 'max_tank'],
  },
  {
    id: 'stage_4_wip',
    stageNumber: 4,
    title: 'Stage 4: Unbuilt WIP & Candy Mules',
    subtitle: "Sweep untagged meta PvP spreads, 15-Atk/Shadow PvE projects, un-Mega'd Mega candidates, Max WIPs, and Power Spot mules.",
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
