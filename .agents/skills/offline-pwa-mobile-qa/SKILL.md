---
name: offline-pwa-mobile-qa
description: >-
  Runbook for Workbox PWA/Service Worker configuration, offline resilience,
  iOS Safari & mobile accessibility compliance, and updating Pokédex, Meta,
  Community Day, or Event data snapshots.
---

# Offline PWA, Mobile UX & Data Pipeline Runbook

Use this procedure when changing `vite.config.js`, `index.html`, `src/index.css`, `src/services/pwaService.js`, `src/views/shared/PokemonSprite.jsx`, `scripts/`, or `src/data/`.

## 1. Offline PWA & Service Worker Invariants

1. **CORS-Safe Sprite Caching**:
   - `PokemonSprite.jsx` MUST keep `crossOrigin="anonymous"` on `<img />`.
   - `vite.config.js` Workbox `pokemon-sprites` route MUST keep `cacheableResponse: { statuses: [200] }` (never include `0`, which caches opaque responses padded to ~7 MB each on Chromium/iOS and persists captive-portal/5xx errors for 30 days).
2. **Truthful Live Sync**:
   - `vite.config.js` PvPoke route MUST stay `handler: 'NetworkOnly'`. Offline fallback is handled explicitly by `metaCacheModel.js`.
3. **Zero External Runtime CDN Imports**:
   - Never import runtime libraries from `esm.sh`, `unpkg.com`, or `jsdelivr.net`. Bundle dependencies locally via npm (`package.json`) so features like QR code generation work in airplane mode.
4. **Dependency & Lockfile Hygiene**:
   - Keep `vite-plugin-pwa` in `devDependencies` (not `dependencies`). Whenever `package.json` changes, regenerate `package-lock.json` (`npm install --package-lock-only`) so CI `npm ci` passes cleanly.
5. **No Render-Blocking Assets**:
   - Keep fonts non-blocking and verify `dist/sw.js` precaches the app shell (`npm run build`).

## 2. iOS Safari & One-Handed Mobile Accessibility Checklist

- **Prevent iOS auto-zoom**: All mobile `<input>` and `<select>` elements must use `>= 16px` font size (`text-base` on mobile).
- **Coarse touch targets**: Scope buttons/chips inside `.mwg-touch-scope` (44px tap targets) and avoid overlapping `.mwg-icon-hit` hitboxes.
- **Accessible names**: Every `CopyActionButton` and icon-only button must expose a real accessible name (never `aria-hidden="true"` on the only label text).
- **Color contrast**: Green badges with white text must use `#1d7a4d` (5.3:1), never `#2b9e66` (3.39:1 fail). Never strip visible focus rings (`focus:outline-none` without replacement).
- **Off-screen drawers**: Apply `inert` (not just `-translate-x-full`) when mobile drawers are closed, support `Escape` dismissal, and respect safe-area insets (`env(safe-area-inset-top)` / `bottom`).
- **Scroll-driven animations**: Gate CSS scroll-timeline animations behind `@supports (animation-timeline: scroll())` so Safari/Firefox fallbacks work.
- **iOS downloads & `<dialog>` copy**: Delay `URL.revokeObjectURL` in `fileTransferService.js`, and append legacy clipboard textareas inside the open `<dialog>` (not inert `document.body`).

## 3. Scaling Data Updates (No Code Edits Needed)

| Update | Procedure |
| --- | --- |
| New Pokémon / Generation | Run `npm run update:data` (`scripts/fetch_data.js`). `familyModel.js`, `communityDayModel.js`, and max Dex IDs derive automatically from `src/data/pokedex.json`. |
| Refresh PvP/PvE/Max Meta | Run `npm run update:meta` (`scripts/fetch_meta.js`). Shared move formatting lives in `src/data/speciesConstants.js`. |
| New Community Day | Append entry to `src/data/communityDayRegistry.js`; `familyIds` and `preEvoIds` compute dynamically from `pokedex.json` `evolveCandy`. |
| New Global/In-Person Event | Add to `src/data/events_archive.json` (year filters derive dynamically; never hardcode year arrays). |

## 4. Verification

```zsh
npm run test:run && npm run lint && npm run build
```

For live PWA/mobile verification:
- Run `npm run preview` and verify Service Worker activation, offline reload, and chunk splitting.
- Optionally run `python3 test_mobile.py` against the local preview server for Playwright mobile smoke coverage.
