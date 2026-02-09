## 2025-05-21 - Missing Focus Indicators on Custom Components
**Learning:** Custom navigation elements and form toggles built with `div`s and utility classes completely lack keyboard focus indicators by default, creating a "blind spot" for keyboard navigation.
**Action:** Systematically check all `onClick` handlers and custom inputs for `focus-visible` styles, using `peer-focus` for hidden inputs.
