/**
 * Declarative Pokémon GO Search Operator Registry (Leidwesen/SearchPhrases v0.435.1).
 * Single source of truth for tri-state attributes, types, appraisals, ranges, aliases,
 * and native keyword collision linting shared across `searchEngine`, `tagModel`, and `FilterPanel`.
 */
import { REGIONS } from '../../data/speciesConstants';

export { REGIONS };

export const REGION_KEYWORDS = REGIONS.map((r) => r.toLowerCase());

export const TYPES = [
  'normal', 'fire', 'water', 'electric', 'grass', 'ice', 'fighting', 'poison', 'ground',
  'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'steel', 'dark', 'fairy',
];

export const APPRAISALS = ['0*', '1*', '2*', '3*', '4*'];

/**
 * Declarative tri-state attribute groups.
 * Adding a new Pokémon GO search attribute here automatically wires:
 * - `ATTRIBUTES` & `ATTRIBUTE_SET`
 * - `createDefaultFilters()`
 * - `parseSearchString()` & `generateSearchString()`
 * - `countActiveFilters()`
 * - `FilterPanel` UI controls
 * - `NATIVE_POGO_KEYWORDS` tag linter protection
 */
export const ATTRIBUTE_GROUPS = [
  {
    id: 'core',
    label: 'Rarity & Status',
    items: [
      { key: 'shiny', label: 'Shiny' },
      { key: 'shadow', label: 'Shadow' },
      { key: 'purified', label: 'Purified' },
      { key: 'lucky', label: 'Lucky' },
      { key: 'legendary', label: 'Legendary' },
      { key: 'mythical', label: 'Mythical' },
      { key: 'ultrabeast', label: 'Ultra Beast' },
      { key: 'costume', label: 'Costume' },
      { key: 'favorite', label: 'Favorite' },
      { key: 'traded', label: 'Traded' },
      { key: 'candyxl', label: 'Powered w/ Candy XL' },
      { key: 'candykm1', label: '1km Buddy (1k Purify)' },
      { key: 'candykm20', label: '20km Buddy (Leg/Myth/UB)' },
      { key: '#', label: 'Tagged (# / !#)' },
    ],
  },
  {
    id: 'backgrounds',
    label: 'Backgrounds',
    items: [
      { key: 'background', label: 'Any Background' },
      { key: 'locationbackground', label: 'Location BG (In-Person)' },
      { key: 'specialbackground', label: 'Special BG (Global)' },
      { key: 'profilebackground', label: 'Profile BG' },
    ],
  },
  {
    id: 'max',
    label: 'Max Battles',
    items: [
      { key: 'maxmove1-', label: 'All Max Eligible (maxmove1-)' },
      { key: 'dynamax', label: 'Dynamax Only' },
      { key: 'gigantamax', label: 'Gigantamax Only' },
    ],
  },
  {
    id: 'moves_evo',
    label: 'Moves, Evolutions & Mega',
    items: [
      { key: '@special', label: 'Legacy / Elite (@special)' },
      { key: '!@3mov', label: '2nd Charged Move (!@3mov / @3mov)' },
      { key: '@weather', label: 'Weather Boosted Move (@weather)' },
      { key: 'evolve', label: 'Can Evolve' },
      { key: 'evolvenew', label: 'New Dex Evolve' },
      { key: 'tradeevolve', label: 'Free Trade Evolve' },
      { key: 'evolvequest', label: 'Adventure / Quest Evolve' },
      { key: 'megaevolve', label: 'Can Mega Evolve' },
      { key: 'item', label: 'Item Evolve' },
      { key: 'fusion', label: 'Fusion (Necrozma/Kyurem)' },
      { key: 'adventureeffect', label: 'Adventure Effect' },
    ],
  },
  {
    id: 'sizes_counts',
    label: 'Sizes, Gender & Duplicates',
    items: [
      { key: 'xxl', label: 'XXL' },
      { key: 'xxs', label: 'XXS' },
      { key: 'xl', label: 'XL' },
      { key: 'xs', label: 'XS' },
      { key: 'male', label: 'Male' },
      { key: 'female', label: 'Female' },
      { key: 'count2-', label: 'Duplicates (count2-)' },
      { key: 'count1', label: 'Singletons (count1)' },
    ],
  },
  {
    id: 'origins',
    label: 'Encounter Origins & Status',
    items: [
      { key: 'raid', label: 'Raid' },
      { key: 'remoteraid', label: 'Remote Raid' },
      { key: 'shadowraid', label: 'Shadow Raid' },
      { key: 'hatched', label: 'Hatched' },
      { key: 'eggsonly', label: 'Baby (eggsonly)' },
      { key: 'research', label: 'Research' },
      { key: 'gbl', label: 'GBL Reward' },
      { key: 'rocket', label: 'Team GO Rocket' },
      { key: 'snapshot', label: 'GO Snapshot' },
      { key: 'party', label: 'Party Play (party)' },
      { key: 'defender', label: 'Gym Defender' },
    ],
  },
  {
    id: 'regions',
    label: 'Region / Regional Forms',
    items: [
      { key: 'alola', label: 'Alola (Gen 7 + Alolan)' },
      { key: 'galar', label: 'Galar (Gen 8 + Galarian)' },
      { key: 'hisui', label: 'Hisui (Hisuian)' },
      { key: 'paldea', label: 'Paldea (Gen 9 + Paldean)' },
    ],
  },
];

export const ATTRIBUTES = ATTRIBUTE_GROUPS.flatMap((group) => group.items.map((item) => item.key));

export const ATTRIBUTE_SET = new Set(ATTRIBUTES);
export const TYPE_SET = new Set(TYPES);
export const APPRAISAL_SET = new Set(APPRAISALS);

// Canonical aliases accepted during parsing (leading `!` is already parsed into `atom.negated`)
export const ATTRIBUTE_ALIASES = {
  'ultra beasts': 'ultrabeast',
  favourite: 'favorite',
  '@3move_name_0000': '@3mov',
};

// Structured numeric range descriptors
export const RANGE_OPERATORS = [
  { id: 'age', prefix: 'age', minKey: 'ageMin', maxKey: 'ageMax', bareIsMax: false, forceOpenTrailingHyphen: false },
  { id: 'distance', prefix: 'distance', minKey: 'distanceMin', maxKey: 'distanceMax', bareIsMax: true, forceOpenTrailingHyphen: true },
  { id: 'cp', prefix: 'cp', minKey: 'cpMin', maxKey: 'cpMax', bareIsMax: false, forceOpenTrailingHyphen: false },
  { id: 'year', prefix: 'year', minKey: 'yearMin', maxKey: 'yearMax', bareIsMax: false, forceOpenTrailingHyphen: false },
  { id: 'buddy', prefix: 'buddy', minKey: 'buddyMin', maxKey: 'buddyMax', bareIsMax: false, forceOpenTrailingHyphen: false },
];

// Additional native PoGO keywords (range prefixes, stats, legacy/extra search phrases) for tag linting
const EXTRA_NATIVE_KEYWORDS = [
  'age', 'year', 'distance', 'cp', 'hp', 'count', 'countcandy', 'countcandyxl',
  'buddy', 'mega', 'mega0', 'mega1', 'mega2', 'mega3', 'mega4',
  'maxmove', 'maxguard', 'maxspirit', 'attack', 'defense',
  'eliteraid', 'exraid', 'megaraid', 'primals', 'unidentified',
  'genderunknown', 'interactable', 'showcase', 'routes', 'research',
  'candykm3', 'candykm5', '0*', '1*', '2*', '3*', '4*',
];

export const NATIVE_POGO_KEYWORDS = new Set([
  ...ATTRIBUTES.filter((k) => !k.startsWith('!') && !k.startsWith('@') && k !== '#' && !k.includes('-')),
  ...TYPES,
  ...REGION_KEYWORDS,
  ...EXTRA_NATIVE_KEYWORDS,
]);
