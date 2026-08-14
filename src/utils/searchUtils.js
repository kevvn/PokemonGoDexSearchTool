export const ATTRIBUTES = [
  'shiny',
  'shadow',
  'purified',
  'lucky',
  'legendary',
  'mythical',
  'ultra beasts',
  'mega',
  'megaevolve',
  'dynamax',
  'gigantamax',
  'costume',
  'evolve',
  'traded',
  'hatched',
  'raid',
  'remoteraid',
  'research',
  'defender',
  'favorite',
  'background',
  'locationcard',
  'xxs',
  'xxl',
  'buddy0',
  'buddy1',
  'buddy2',
  'buddy3',
  'buddy4',
  'buddy5',
  'alola',
  'galar',
  'hisui',
  'paldea'
];

export const TYPES = [
  'normal', 'fire', 'water', 'electric', 'grass', 'ice', 'fighting', 'poison', 'ground',
  'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'steel', 'dark', 'fairy'
];

// Normalized aliases map for game search query terms
const ATTRIBUTE_ALIASES = {
  'ultrabeasts': 'ultra beasts',
  'ultra-beasts': 'ultra beasts',
  'ultra_beasts': 'ultra beasts',
  'gmax': 'gigantamax',
  'dmax': 'dynamax',
  'fav': 'favorite',
  'favs': 'favorite',
  'bestbuddy': 'buddy5',
  'best-buddy': 'buddy5',
  'best_buddy': 'buddy5',
  'location-card': 'locationcard',
  'location_card': 'locationcard'
};

export function compressIdRanges(selectedIds) {
  if (!selectedIds) return '';

  const uniqueIds = selectedIds instanceof Set ? selectedIds : new Set(selectedIds);
  if (uniqueIds.size === 0) return '';

  const validNumbers = [];
  for (const val of uniqueIds) {
    const num = typeof val === 'number' ? val : parseInt(val, 10);
    if (!isNaN(num) && num > 0) {
      validNumbers.push(num);
    }
  }
  if (validNumbers.length === 0) return '';

  // Sort numerical unique values
  const sorted = Array.from(new Set(validNumbers)).sort((a, b) => a - b);
  const ranges = [];
  const len = sorted.length;

  if (len > 0) {
    let start = sorted[0];
    let prev = sorted[0];

    for (let i = 1; i < len; i++) {
      const current = sorted[i];
      if (current === prev) continue;

      if (current === prev + 1) {
        prev = current;
      } else {
        ranges.push(start === prev ? `${start}` : `${start}-${prev}`);
        start = current;
        prev = current;
      }
    }
    ranges.push(start === prev ? `${start}` : `${start}-${prev}`);
    return ranges.join(',');
  }
  return '';
}

export function parseSearchString(searchString) {
  // Initialize defaults structure
  const filters = {
    appraisal: [],
    ageMin: '',
    ageMax: '',
    types: [],
    ...ATTRIBUTES.reduce((acc, attr) => ({ ...acc, [attr]: null }), {})
  };
  const selectedIds = new Set();

  if (!searchString) return { selectedIds, filters };

  const parts = searchString.split('&');

  parts.forEach(part => {
    part = part.trim();
    if (!part) return;

    // Check if the part is comma-delimited (OR condition in PoGo, e.g. 3*,4* or fire,water or shiny,lucky or 1,2,3)
    const subTokens = part.split(',').map(s => s.trim()).filter(Boolean);
    if (subTokens.length === 0) return;

    // 1. Appraisal tokens (e.g. 0*, 1*, 2*, 3*, 4*)
    const allAppraisal = subTokens.every(t => /^[0-4]\*$/.test(t.replace(/^!/, '')));
    if (allAppraisal) {
      subTokens.forEach(t => {
        if (!t.startsWith('!') && !filters.appraisal.includes(t)) {
          filters.appraisal.push(t);
        }
      });
      return;
    }

    // 2. Types list (e.g. fire, water, grass)
    const allTypes = subTokens.every(t => TYPES.includes(t.toLowerCase().replace(/^!/, '')));
    if (allTypes) {
      subTokens.forEach(t => {
        const typeClean = t.toLowerCase().replace(/^!/, '');
        if (!t.startsWith('!') && !filters.types.includes(typeClean)) {
          filters.types.push(typeClean);
        }
      });
      return;
    }

    // 3. ID / Numerical Range list (e.g. 1-151, 25, 172-174)
    const allIdsOrRanges = subTokens.every(t => /^[\d]+(-[\d]+)?$/.test(t));
    if (allIdsOrRanges) {
      subTokens.forEach(range => {
        if (range.includes('-')) {
          const [startStr, endStr] = range.split('-');
          const start = parseInt(startStr, 10);
          const end = parseInt(endStr, 10);
          if (!isNaN(start) && !isNaN(end)) {
            const min = Math.min(start, end);
            const max = Math.max(start, end);
            for (let i = min; i <= max; i++) {
              selectedIds.add(i);
            }
          }
        } else {
          const id = parseInt(range, 10);
          if (!isNaN(id) && id > 0) {
            selectedIds.add(id);
          }
        }
      });
      return;
    }

    // 4. Handle individual subTokens (attributes, age, or mixed tokens)
    subTokens.forEach(token => {
      let isNegated = false;
      let value = token;
      if (token.startsWith('!')) {
        isNegated = true;
        value = token.substring(1);
      }
      value = value.trim().toLowerCase();

      // Normalize aliases
      if (ATTRIBUTE_ALIASES[value]) {
        value = ATTRIBUTE_ALIASES[value];
      }

      // Age range (e.g. age0, age0-7, age30-, age-7)
      if (value.startsWith('age')) {
        const agePart = value.substring(3).trim();
        if (agePart.includes('-')) {
          const [min, max] = agePart.split('-');
          filters.ageMin = min !== undefined ? min : '';
          filters.ageMax = max !== undefined ? max : '';
        } else {
          filters.ageMin = agePart;
          filters.ageMax = agePart;
        }
        return;
      }

      // Known attributes
      if (ATTRIBUTES.includes(value)) {
        filters[value] = isNegated ? false : true;
        return;
      }

      // Single appraisal
      if (/^[0-4]\*$/.test(value)) {
        if (!isNegated && !filters.appraisal.includes(value)) {
          filters.appraisal.push(value);
        }
        return;
      }

      // Single type
      if (TYPES.includes(value)) {
        if (!isNegated && !filters.types.includes(value)) {
          filters.types.push(value);
        }
        return;
      }

      // Single ID or Range
      if (/^\d+(-\d+)?$/.test(value)) {
        if (value.includes('-')) {
          const [startStr, endStr] = value.split('-');
          const start = parseInt(startStr, 10);
          const end = parseInt(endStr, 10);
          if (!isNaN(start) && !isNaN(end)) {
            const min = Math.min(start, end);
            const max = Math.max(start, end);
            for (let i = min; i <= max; i++) {
              selectedIds.add(i);
            }
          }
        } else {
          const id = parseInt(value, 10);
          if (!isNaN(id) && id > 0) {
            selectedIds.add(id);
          }
        }
      }
    });
  });

  return { selectedIds, filters };
}
