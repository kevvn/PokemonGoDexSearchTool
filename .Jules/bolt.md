# Bolt's Journal

## 2024-05-22 - RegionSection Re-renders
**Learning:** `RegionSection` receives the global `selectedIds` Set as a prop. Since `selectedIds` is recreated on every selection change, `React.memo` fails to prevent re-renders, causing all regions to re-render even when only one region's selection state changed.
**Action:** Implement a custom comparator for `React.memo` that checks if the selection state *within the region* has actually changed.

## 2024-05-22 - compressIdRanges Optimization
**Learning:** Contrary to previous memory, `compressIdRanges` was not using `Array.from(set, mapFn)`. Implementing this along with avoiding redundant Set cloning yielded ~22% performance improvement in micro-benchmarks.
**Action:** Always verify existing code against performance claims in memory before assuming they are implemented.

## 2025-02-19 - Preconnect Optimization
**Learning:** `index.html` was missing `preconnect` tags for `raw.githubusercontent.com`, which serves all Pokemon sprites. Adding `preconnect` and `dns-prefetch` reduces connection latency for these critical assets.
**Action:** Always audit `index.html` for missing resource hints for third-party domains used for LCP elements.
