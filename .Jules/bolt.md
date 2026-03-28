# Bolt's Journal

## 2024-05-22 - RegionSection Re-renders
**Learning:** `RegionSection` receives the global `selectedIds` Set as a prop. Since `selectedIds` is recreated on every selection change, `React.memo` fails to prevent re-renders, causing all regions to re-render even when only one region's selection state changed.
**Action:** Implement a custom comparator for `React.memo` that checks if the selection state *within the region* has actually changed.

## 2024-05-22 - compressIdRanges Optimization
**Learning:** Contrary to previous memory, `compressIdRanges` was not using `Array.from(set, mapFn)`. Implementing this along with avoiding redundant Set cloning yielded ~22% performance improvement in micro-benchmarks.
**Action:** Always verify existing code against performance claims in memory before assuming they are implemented.

## 2026-02-28 - Avoiding .filter().length GC Overhead
**Learning:** Using `.filter().length` in React render loops (e.g. `selectedCount` in `RegionSection`) allocates a new temporary array on every render, adding unnecessary garbage collection pressure and reducing rendering performance for large lists.
**Action:** Use a manual `for` loop to count subsets within render cycles instead to avoid array allocation.
