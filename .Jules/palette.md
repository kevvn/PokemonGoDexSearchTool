## 2025-05-23 - Focus States on Custom Navigation Components
**Learning:** Custom interactive components like `RegionSelector` and `FilterPanel` consistently lack default focus indicators because they use custom button styles that suppress default browser outlines. This makes keyboard navigation impossible without explicit `focus-visible` styles.
**Action:** When implementing new custom interactive components, always include `focus-visible:ring-2` (or similar) from the start to ensure keyboard accessibility.
