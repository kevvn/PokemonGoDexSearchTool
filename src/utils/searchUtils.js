export const ATTRIBUTES = [
  'shiny', 'shadow', 'purified', 'lucky', 'legendary', 'mythical',
  'ultra beasts', 'costume', 'evolve', 'alola', 'galar', 'hisui', 'paldea'
];

export function compressIdRanges(selectedIds) {
  if (!selectedIds) return '';
  // Ensure unique sorted numbers
  const uniqueIds = new Set(selectedIds);
  if (uniqueIds.size === 0) return '';

  const sorted = Array.from(uniqueIds).map(Number).sort((a, b) => a - b);
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

export function generateSearchString(selectedIds, filters) {
  if (!filters) filters = {};
  const parts = [];

  // Pokemon IDs
  const idString = compressIdRanges(selectedIds);
  if (idString) {
    parts.push(idString);
  }

  // Appraisal
  if (filters.appraisal && filters.appraisal.length > 0) {
    parts.push(filters.appraisal.join(','));
  }

  // Age
  // Check if ageMin/ageMax are present. We treat empty string as absent.
  const hasMin = filters.ageMin !== undefined && filters.ageMin !== '';
  const hasMax = filters.ageMax !== undefined && filters.ageMax !== '';

  if (hasMin || hasMax) {
    const min = hasMin ? filters.ageMin : '';
    const max = hasMax ? filters.ageMax : '';
    if (min !== '' && max !== '' && min === max) {
       parts.push(`age${min}`);
    } else {
       parts.push(`age${min}-${max}`);
    }
  }

  // Attributes
  ATTRIBUTES.forEach(attr => {
    if (filters[attr] === true) parts.push(attr);
    if (filters[attr] === false) parts.push(`!${attr}`);
  });

  // Types
  if (filters.types && filters.types.length > 0) {
     parts.push(filters.types.join(','));
  }

  return parts.join('&');
}
