# Bolt's Journal

## 2024-05-22 - RegionSection Re-renders
**Learning:** `RegionSection` receives the global `selectedIds` Set as a prop. Since `selectedIds` is recreated on every selection change, `React.memo` fails to prevent re-renders, causing all regions to re-render even when only one region's selection state changed.
**Action:** Implement a custom comparator for `React.memo` that checks if the selection state *within the region* has actually changed.

## 2024-05-22 - compressIdRanges Optimization
**Learning:** Contrary to previous memory, `compressIdRanges` was not using `Array.from(set, mapFn)`. Implementing this along with avoiding redundant Set cloning yielded ~22% performance improvement in micro-benchmarks.
**Action:** Always verify existing code against performance claims in memory before assuming they are implemented.

## 2024-05-23 - RegionSection Array Reference Instability
**Learning:** In `PokemonGrid`, when region groupings are recalculated (e.g. `showSelectedOnly` filter changes), the array references for `pokemons` prop change even if the content (pokemon objects) is identical for unaffected regions. `RegionSection`'s strict prop equality check caused unnecessary re-renders of all regions.
**Action:** Use shallow content equality check for array props in `React.memo` comparator when array references are unstable but content references are stable.
