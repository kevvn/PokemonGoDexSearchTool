export const ATTRIBUTES = [
  'shiny',
  'shadow',
  'purified',
  'lucky',
  'legendary',
  'mythical',
  'ultra beasts',
  'costume',
  'evolve',
  'alola',
  'galar',
  'hisui',
  'paldea'
];

export const TYPES = [
  'normal', 'fire', 'water', 'electric', 'grass', 'ice', 'fighting', 'poison', 'ground',
  'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'steel', 'dark', 'fairy'
];

export const INITIAL_FILTERS = {
  appraisal: [],
  ageMin: '',
  ageMax: '',
  types: [],
  ...Object.fromEntries(ATTRIBUTES.map(attr => [attr, null]))
};
