# Bolt's Journal

## 2024-05-22 - RegionSection Re-renders
**Learning:** `RegionSection` receives the global `selectedIds` Set as a prop. Since `selectedIds` is recreated on every selection change, `React.memo` fails to prevent re-renders, causing all regions to re-render even when only one region's selection state changed.
**Action:** Implement a custom comparator for `React.memo` that checks if the selection state *within the region* has actually changed.

## 2024-05-22 - compressIdRanges Optimization
**Learning:** Contrary to previous memory, `compressIdRanges` was not using `Array.from(set, mapFn)`. Implementing this along with avoiding redundant Set cloning yielded ~22% performance improvement in micro-benchmarks.
**Action:** Always verify existing code against performance claims in memory before assuming they are implemented.

## 2024-05-23 - Avoid .filter().length in Render Cycle
**Learning:** Using `.filter(condition).length` inside React render paths dynamically forces unnecessary array allocations, increasing memory pressure and triggering frequent garbage collection on large collections like a full Pokemon dataset.
**Action:** Replace `.filter().length` with standard counting loop (e.g., `let count = 0; for (...) count++;`) in component render paths to avoid unnecessary array instantiation and keep memory steady.
