## 2025-05-18 - [Accessibility: Invisible Focus on Custom Toggles]
**Learning:** Custom toggles using `sr-only` inputs must ensure the focus state is visible. The `peer` class on the input combined with `peer-focus-visible:ring-*` on the sibling visual element is a robust pattern for this in Tailwind.
**Action:** Always check custom form controls with keyboard navigation. If the input is hidden, verify that focus is transferred visually to the control surface.
