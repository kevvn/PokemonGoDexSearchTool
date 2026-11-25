---
name: mvc-react-zero-effect
description: >-
  Runbook for building or refactoring React 19 views, controllers, persistent
  stores, and finite state machines under PokéSearch's strict MVC boundaries,
  zero-useEffect rule, and preserved React.memo performance patterns.
---

# MVC, Zero-`useEffect` & React 19 Implementation Runbook

Use this procedure whenever creating or editing files in `src/models/`, `src/controllers/`, `src/services/`, or `src/views/`.

## 1. Layer Placement Checklist

Before writing code, place each responsibility in the exact right layer:
- **Pure calculation, schema validation, query generation, or FSM transition** → `src/models/` (never import React or services).
- **Browser API, network fetch, clipboard, SW registration, file I/O** → `src/services/` (never import React or views).
- **Subscribing to stores, coordinating services, memoizing view-model props** → `src/controllers/`.
- **Rendering markup & firing controller callbacks** → `src/views/` (never import `src/services/` or run heavy domain builders inside `.map()`).

## 2. Replacing `useEffect` / `useLayoutEffect` (Zero-Effect Recipes)

`eslint.config.js` forbids importing `useEffect` or `useLayoutEffect` from `'react'`. Use:

1. **Persisted or cross-tab state** → `createPersistentStore` (`src/models/storage/createPersistentStore.js`) + `useSyncExternalStore`:
   - Automatically handles `storage` events, `localStorage.clear()` (`event.key === null`), and `QuotaExceededError`.
   - Always pass a `validate` / sanitizer function for user-imported JSON so corrupt payloads cannot brick renders.
2. **Imperative DOM lifecycle (`<dialog>`, `IntersectionObserver`, `ResizeObserver`, `requestAnimationFrame`)** → React 19 ref cleanup callback:
   - Return a cleanup function directly from the `ref` callback (see `src/views/shared/dialogRef.js` and `RegionSelector.jsx`).
   - Respect `prefers-reduced-motion` on smooth scrolling and guard `<dialog>` backdrop clicks with `e.target === dialog` + `pointercancel`.
3. **Async workflows & multi-step modals** → Explicit FSM in `src/models/machines/`:
   - Define pure `(state, event) => nextState` transitions and test every edge in `src/models/machines/stateMachines.test.js`.
4. **Resetting local state when a prop changes** → Derive during render or key the child component (`key={src}`), never sync via an effect.
5. **Global copy-to-clipboard + Search Dock sync** → Render `CopyActionButton` with declarative `command="--copy"` + `commandfor` (handled by `src/services/copyService.js`; pass `syncDock={false}` / `data-sync-dock="false"` when a copy button should not overwrite the dock).

## 3. Preserving `React.memo` & Render Performance

- Never pass freshly created controller wrapper objects or inline `[]` / `{}` defaults into `React.memo` children — pass primitives/memoized slices or stable callbacks (`useCallback`).
- Never compute `buildEventActionStrings` or `buildTagHydrationQueries` inside a view's `.map()` loop; precompute once in the controller via `useMemo`.
- Keep high-churn UI state (e.g., `activeRegion` scroll spy, `selectedCount`) isolated from heavy list/filter controllers so scrolling or clicking one tile does not re-render 1,000+ cards or a 700-line filter panel.
- When adding a new Events Hub sub-panel (mounted with `hidden="until-found"`), create an isolated controller in `src/controllers/events/` so typing in one panel never re-renders sibling panels.
- Never pair controlled `<details open={isSearching || expanded}>` with native toggle state without syncing cleanly on `onToggle` (otherwise clearing search can trap the accordion closed).

## 4. Verification

```zsh
npm run test:run && npm run lint && npm run build
```

Verify `src/architecture.test.js` passes (layer boundaries + zero `useEffect`), ESLint reports 0 errors/warnings, and lazy tab chunks still split cleanly in `vite build`.
