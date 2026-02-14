## 2026-02-14 - Accessible Custom Toggles
**Learning:** Custom toggle buttons (using `div` or `button` without native checkbox semantics) require explicit `aria-pressed` state management to communicate their state to screen readers. `role="button"` alone is insufficient for toggles.
**Action:** Always pair custom toggle buttons with `aria-pressed={isActive}` and ensure they have descriptive `aria-label`s if the visual label is icon-based.
