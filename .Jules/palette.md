# Critical Learnings Only

## Performance
*   Use `content-visibility: auto` with `contain-intrinsic-size` for heavy lists (e.g. 1000+ items) to drastically improve initial render and scroll performance without complex virtualization libraries. This is a high-impact, low-effort optimization.

## Mobile UX
*   For mobile menus, prefer a fixed bottom drawer (sheet) with a backdrop over a small popover. This improves touch targets and usability on small screens.
*   Ensure input fields on mobile have adequate padding (e.g. `py-3`) and font size (>= 16px to prevent iOS zoom) for better touch interaction.
