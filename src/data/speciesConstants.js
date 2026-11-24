/**
 * Canonical shared Pokémon GO domain constants, region metadata, species curations,
 * and move display-name formatting shared across models, views, and data scripts.
 */

export const REGIONS_CONFIG = [
  { name: 'Kanto', start: 1, end: 151, starters: [7, 4, 1], formToken: null },
  { name: 'Johto', start: 152, end: 251, starters: [152, 158, 155], formToken: null },
  { name: 'Hoenn', start: 252, end: 386, starters: [258, 252, 255], formToken: null },
  { name: 'Sinnoh', start: 387, end: 493, starters: [393, 390, 387], formToken: null },
  { name: 'Unova', start: 494, end: 649, starters: [498, 495, 501], formToken: null },
  { name: 'Kalos', start: 650, end: 721, starters: [656, 650, 653], formToken: null },
  { name: 'Alola', start: 722, end: 809, starters: [728, 722, 725], formToken: 'alola' },
  { name: 'Galar', start: 810, end: 898, starters: [816, 810, 813], formToken: 'galar' },
  { name: 'Hisui', start: 899, end: 905, starters: [899, 900, 901], formToken: 'hisui' },
  { name: 'Paldea', start: 906, end: 1025, starters: [912, 906, 909], formToken: 'paldea' },
];

export const REGIONS = REGIONS_CONFIG.map((r) => r.name);

export const REGION_STARTERS = Object.fromEntries(
  REGIONS_CONFIG.map((r) => [r.name, r.starters])
);

export const CANDY_12_FODDER_IDS = [10, 13, 16, 265, 293, 519];
export const TRADE_EVOLVE_IDS = [64, 67, 75, 93, 525, 533, 588, 616, 708, 710];

// Regionals, Unown, Rotom, Spinda, Vivillon, Furfrou, Oricorio, and regional-variant/rare form families
export const GLOBAL_REGIONAL_ROTOM_UNOWN_IDS = [
  83, 865, // Farfetch'd, Sirfetch'd
  115, // Kangaskhan
  122, 439, 866, // Mr. Mime, Mime Jr., Mr. Rime
  128, // Tauros & Paldean Tauros breeds
  201, // Unown
  214, // Heracross
  222, 864, // Corsola, Cursola
  313, 314, // Volbeat, Illumise
  324, // Torkoal
  327, // Spinda
  335, 336, 337, 338, // Zangoose, Seviper, Lunatone, Solrock
  352, // Kecleon
  357, // Tropius
  369, // Relicanth
  417, // Pachirisu
  422, 423, // East/West Sea Shellos, Gastrodon
  441, // Chatot
  455, // Carnivine
  479, // Rotom
  480, 481, 482, // Lake Trio
  511, 512, 513, 514, 515, 516, // Pansage, Pansear, Panpour lines
  538, 539, // Throh, Sawk
  550, 902, // Basculin, Basculegion
  556, // Maractus
  561, // Sigilyph
  626, // Bouffalant
  631, 632, // Heatmor, Durant
  664, 665, 666, // Scatterbug, Spewpa, Vivillon (18 regional patterns)
  669, 670, 671, // Flabébé regional colors
  672, 673, // Skiddo, Gogoat
  676, // Furfrou
  701, // Hawlucha
  707, // Klefki
  741, // Oricorio (4 regional styles)
  764, // Comfey
  854, 855, // Sinistea, Polteageist (Antique/Phony)
  874, // Stonjourner
  924, 925, // Tandemaus, Maushold (Family of 3)
  978, // Tatsugiri (3 regional forms)
  1012, 1013, // Poltchageist, Sinistcha (Artisan/Counterfeit)
];

// Scarce non-regional rare hatches, pseudos, and rare spawns protected in safe trash strings
export const SCARCE_NON_REGIONAL_RARE_IDS = [
  447, 448, // Riolu, Lucario
  551, 552, 553, // Sandile, Krokorok, Krookodile
  624, 625, 983, // Pawniard, Bisharp, Kingambit
  636, 637, // Larvesta, Volcarona
  757, 758, // Salandit, Salazzle
  776, // Turtonator
  780, // Drampa
  782, 783, 784, // Jangmo-o, Hakamo-o, Kommo-o
  840, 841, 842, 1011, 1019, // Applin family
  848, 849, // Toxel, Toxtricity
  884, 1018, // Duraludon, Archaludon
  885, 886, 887, // Dreepy, Drakloak, Dragapult
  935, 936, 937, // Charcadet, Armarouge, Ceruledge
  957, 958, 959, // Tinkatink, Tinkatuff, Tinkaton
  965, 966, // Varoom, Revavroom
  996, 997, 998, // Frigibax, Arctibax, Baxcalibur
  999, 1000, // Gimmighoul, Gholdengo
];

// Unified scarce/regional protection list used across Triage Funnels and Event Trash builders
export const SCARCE_RARE_SPECIES_IDS = Array.from(
  new Set([...GLOBAL_REGIONAL_ROTOM_UNOWN_IDS, ...SCARCE_NON_REGIONAL_RARE_IDS])
).sort((a, b) => a - b);

// XL / Egg-Floor / Research-Floor GL staples whose optimal builds use 2-4 Atk bars
export const CLASSIC_GL_XL_FLOOR_IDS = [
  108, 463, // Lickitung, Lickilicky
  222, 864, // Corsola, Cursola
  302, // Sableye
  307, 308, // Meditite, Medicham
  410, 411, // Shieldon, Bastiodon
  417, // Pachirisu
  659, 660, // Bunnelby, Diggersby
  703, // Carbink
];

// S-Tier Per-Type Raid Specialist Shadow Families
export const CLASSIC_PVE_TYPE_SHADOW_IDS = [
  81, 82, 462, // Magnemite line
  111, 112, 464, // Rhyhorn line
  220, 221, 473, // Swinub line
  408, 409, // Cranidos line
  529, 530, // Drilbur line
  607, 608, 609, // Litwick line
];

// GL/UL species that max out near Level 50 (require high IVs / 3*-4* instead of 0-1 Attack)
export const PVP_MAX_OUT_XL_BASE_IDS = [
  308, 411, 302, 703, 108, 202, 660, 417, 222, 594, 113, 663, 197, 630,
  18, 618, 227, 593, 460, 832, 820, 346, 208, 426, 863, 959,
];

export const RARE_TRADE_REROLL_BASE_IDS = [
  996, 636, 885, 782, 935, 957, 965, 757, 769, 703, 374, 443, 633, 447,
  246, 371, 147, 610, 704, 884, 840, 999,
];

export const STAPLE_META_BASE_IDS = [
  980, 195, 160, 630, 423, 663, 687, 982, 105, 702, 40, 703, 411, 108, 308, 497, 979,
  260, 340, 709, 184, 227, 28, 38, 488, 379, 799, 593, 334, 675, 477, 68, 660, 832,
  877, 706, 748, 346, 279, 171, 460, 452, 110, 618, 3, 6, 197, 302, 62, 395, 131,
  36, 911, 671, 487, 638, 640, 365, 18, 181, 73, 212, 472, 788, 208, 768, 820, 658,
  149, 468, 862, 699, 157, 143, 983, 130, 823,
  800, 484, 483, 645, 250, 718, 888, 889, 150, 383, 382, 384, 791, 792, 249, 445,
  376, 809, 716, 717, 464, 473, 530, 635, 998, 644, 643, 646, 730, 485, 491, 649,
  893, 901, 784, 612, 787, 786, 639, 798, 448, 248, 373, 409, 609, 534, 796, 806,
  793, 905, 637, 555, 94, 282, 257, 254, 719, 214, 9, 466, 462, 461, 407, 243, 244,
  146, 812, 815, 818, 242,
];

// Collision-free 0.5s Fast Moves for Max Battle Meter Charging
export const DEFAULT_FAST_MOVES_500MS = [
  'Bite', 'Bug Bite', 'Cut', 'Dragon Breath', 'Fury Cutter', 'Leafage', 'Lick',
  'Lock-On', 'Low Kick', 'Metal Claw', 'Metal Sound', 'Mud Shot', 'Poison Sting',
  'Pound', 'Psycho Cut', 'Psywave', 'Sand Attack', 'Scratch', 'Shadow Claw',
  'Spark', 'Sucker Punch', 'Tackle', 'Thunder Shock', 'Vine Whip', 'Water Gun',
];

export const SPECIAL_MOVE_NAME_OVERRIDES = {
  LOCK_ON: 'Lock-On',
  LOCK_ON_FAST: 'Lock-On',
  X_SCISSOR: 'X-Scissor',
  V_CREATE: 'V-create',
  MULTI_ATTACK: 'Multi-Attack',
  POWER_UP_PUNCH: 'Power-Up Punch',
  FREEZE_DRY: 'Freeze-Dry',
  MUD_SLAP: 'Mud-Slap',
  MUD_SLAP_FAST: 'Mud-Slap',
  DOUBLE_IRON_BASH: 'Double Iron Bash',
  WEATHER_BALL_FIRE: 'Weather Ball',
  WEATHER_BALL_WATER: 'Weather Ball',
  WEATHER_BALL_ICE: 'Weather Ball',
  WEATHER_BALL_ROCK: 'Weather Ball',
  WEATHER_BALL_NORMAL: 'Weather Ball',
  TECHNO_BLAST_BURN: 'Techno Blast',
  TECHNO_BLAST_CHILL: 'Techno Blast',
  TECHNO_BLAST_DOUSE: 'Techno Blast',
  TECHNO_BLAST_SHOCK: 'Techno Blast',
  TECHNO_BLAST_NORMAL: 'Techno Blast',
};

export function formatMoveDisplayName(moveSlug) {
  if (!moveSlug) return '';
  const upper = String(moveSlug).trim().toUpperCase().replace(/[\s-]+/g, '_');
  if (SPECIAL_MOVE_NAME_OVERRIDES[upper]) {
    return SPECIAL_MOVE_NAME_OVERRIDES[upper];
  }
  const stripped = upper.replace(/_FAST$/, '');
  if (SPECIAL_MOVE_NAME_OVERRIDES[stripped]) {
    return SPECIAL_MOVE_NAME_OVERRIDES[stripped];
  }
  return stripped
    .split('_')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
