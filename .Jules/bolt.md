# Bolt's Journal

## 2024-05-22 - RegionSection Re-renders
**Learning:** `RegionSection` receives the global `selectedIds` Set as a prop. Since `selectedIds` is recreated on every selection change, `React.memo` fails to prevent re-renders, causing all regions to re-render even when only one region's selection state changed.
**Action:** Implement a custom comparator for `React.memo` that checks if the selection state *within the region* has actually changed.

## 2024-05-22 - compressIdRanges Optimization
**Learning:** Contrary to previous memory, `compressIdRanges` was not using `Array.from(set, mapFn)`. Implementing this along with avoiding redundant Set cloning yielded ~22% performance improvement in micro-benchmarks.
**Action:** Always verify existing code against performance claims in memory before assuming they are implemented.

## 2024-05-22 - Array Filter vs Manual Iteration
**Learning:** Relying on `.filter().length` strictly for counting instances unnecessarily allocates intermediate arrays, causing a lot of garbage collection overhead inside a frequently invoked React render cycle (like `RegionSection`).
**Action:** Always use manual `for` loops and incremental counters to determine sizes/counts of subsets, avoiding memory allocation.
