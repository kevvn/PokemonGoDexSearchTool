# Bolt's Journal

## 2024-05-22 - RegionSection Re-renders
**Learning:** `RegionSection` receives the global `selectedIds` Set as a prop. Since `selectedIds` is recreated on every selection change, `React.memo` fails to prevent re-renders, causing all regions to re-render even when only one region's selection state changed.
**Action:** Implement a custom comparator for `React.memo` that checks if the selection state *within the region* has actually changed.

## 2024-05-22 - compressIdRanges Optimization
**Learning:** Contrary to previous memory, `compressIdRanges` was not using `Array.from(set, mapFn)`. Implementing this along with avoiding redundant Set cloning yielded ~22% performance improvement in micro-benchmarks.
**Action:** Always verify existing code against performance claims in memory before assuming they are implemented.

## 2024-05-23 - Intermediate Array Allocations
**Learning:** `pokemons.filter(p => selectedIds.has(p.id)).length` in render cycles creates temporary array allocations for GC to clean up, degrading performance on long lists. Further, repeatedly mapping objects (`pokemonData.forEach(p => p.id)`) for bulk operations is slow.
**Action:** Replace `.filter().length` with standard `for` loops for counting. For mass operations like "Select All" or "Invert", pre-cache flat arrays of primitives (e.g. `ALL_POKEMON_IDS`) outside components to bypass property access overhead.
