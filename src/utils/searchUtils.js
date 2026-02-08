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
