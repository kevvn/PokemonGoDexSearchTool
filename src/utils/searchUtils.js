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

export function compressIdRanges(selectedIds) {
  if (!selectedIds) return '';
  // Ensure unique sorted numbers
  // Optimization: use existing Set if available to avoid copying
  const uniqueIds = selectedIds instanceof Set ? selectedIds : new Set(selectedIds);
  if (uniqueIds.size === 0) return '';

  // Optimization: map to Number during Array creation to avoid intermediate array allocation
  const sorted = Array.from(uniqueIds, Number).sort((a, b) => a - b);
  const ranges = [];

  if (sorted.length > 0) {
    let start = sorted[0];
    let prev = sorted[0];

    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] === prev + 1) {
        prev = sorted[i];
      } else {
        ranges.push(start === prev ? `${start}` : `${start}-${prev}`);
        start = sorted[i];
        prev = sorted[i];
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

    // Negation check
    let isNegated = false;
    let value = part;
    if (part.startsWith('!')) {
      isNegated = true;
      value = part.substring(1);
    }

    value = value.trim().toLowerCase();
    const valueNoSpace = value.replace(/\s/g, '');

    // 1. Appraisal (0* - 4*)
    if (/^[0-4]\*$/.test(value)) {
       if (!isNegated) {
          filters.appraisal.push(value);
       }
       return;
    }

    // 2. Age (ageN or ageN-M)
    if (value.startsWith('age')) {
      const agePart = value.substring(3);
      if (agePart.includes('-')) {
        const [min, max] = agePart.split('-');
        filters.ageMin = min;
        filters.ageMax = max;
      } else {
        filters.ageMin = agePart;
        filters.ageMax = agePart;
      }
      return;
    }

    // 3. Attributes
    if (ATTRIBUTES.includes(value)) {
      filters[value] = isNegated ? false : true;
      return;
    }

    // 4. Types
    if (TYPES.includes(value)) {
       if (!isNegated) {
         filters.types.push(value);
       }
       return;
    }

    // 5. IDs and Ranges (1, 1-10, etc.)
    if (/^[\d,-]+$/.test(valueNoSpace)) {
        const ranges = valueNoSpace.split(',');
        ranges.forEach(range => {
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
                if (!isNaN(id)) {
                    selectedIds.add(id);
                }
            }
        });
        return;
    }
  });

  return { selectedIds, filters };
}
