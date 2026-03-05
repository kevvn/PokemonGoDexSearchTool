# Bolt's Journal

## 2024-05-22 - RegionSection Re-renders
**Learning:** `RegionSection` receives the global `selectedIds` Set as a prop. Since `selectedIds` is recreated on every selection change, `React.memo` fails to prevent re-renders, causing all regions to re-render even when only one region's selection state changed.
**Action:** Implement a custom comparator for `React.memo` that checks if the selection state *within the region* has actually changed.

## 2024-05-22 - compressIdRanges Optimization
**Learning:** Contrary to previous memory, `compressIdRanges` was not using `Array.from(set, mapFn)`. Implementing this along with avoiding redundant Set cloning yielded ~22% performance improvement in micro-benchmarks.
**Action:** Always verify existing code against performance claims in memory before assuming they are implemented.

## 2024-05-23 - Toggle Switch Performance
**Learning:** Toggling "Show Selected Only" blocked the main thread while React synchronously filtered 1000+ items and re-rendered the grid, causing visual lag on the toggle switch animation itself.
**Action:** Used `useDeferredValue` on the `showSelectedOnly` state passed to the `PokemonGrid`. This allows React to immediately commit the toggle switch UI update (the fast part) while deferring the expensive grid filtering and rendering to a background transition.
