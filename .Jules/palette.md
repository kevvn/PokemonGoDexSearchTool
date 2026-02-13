## 2026-02-13 - Custom Toggle Focus States
**Learning:** Custom toggles using `sr-only` inputs are invisible to keyboard users when focused, as default outlines are hidden. This breaks accessibility significantly.
**Action:** Use `peer` on the input and `peer-focus-visible` on the visual sibling to restore focus indicators.
