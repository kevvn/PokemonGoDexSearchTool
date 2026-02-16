# Bolt's Journal

## 2024-05-22 - RegionSection Re-renders
**Learning:** `RegionSection` receives the global `selectedIds` Set as a prop. Since `selectedIds` is recreated on every selection change, `React.memo` fails to prevent re-renders, causing all regions to re-render even when only one region's selection state changed.
**Action:** Implement a custom comparator for `React.memo` that checks if the selection state *within the region* has actually changed.

## 2024-05-24 - Efficient Set to Array Conversion
**Learning:** `Array.from(set).map(Number)` creates an intermediate array and iterates twice. `Array.from(set, Number)` is more efficient as it maps during creation. Also, avoiding `new Set(set)` when input is already a Set saves an allocation.
**Action:** Use `Array.from(set, mapFn)` pattern and check `instanceof Set` before cloning in utility functions.
