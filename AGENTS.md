# PokéSearch (`PokemonGoDexSearchTool`) — Agent Architecture & Engineering Contract

PokéSearch is an **offline-first React 19 PWA** built for one-handed mobile play during live Pokémon GO events (GO Fest, Wild Area, Community Day) on congested or offline cell networks. Every change must preserve **strict MVC boundaries**, **zero `useEffect`/`useLayoutEffect`**, **transfer-safe Pokémon GO search semantics**, **offline resilience**, and **iOS Safari / mobile accessibility**.

## 1. Strict MVC & Layered Dependency Contract

All application code lives under `src/` in five strictly acyclic layers (mechanically enforced by `src/architecture.test.js`):

| Layer | Path | Allowed Imports | Forbidden Imports |
| --- | --- | --- | --- |
| **Data** | `src/data/` | None (pure JSON & canonical constants) | `models`, `services`, `controllers`, `views`, `react` |
| **Models** | `src/models/` | `src/data/`, `src/models/` | `services`, `controllers`, `views`, `react`, `react-dom` |
| **Services** | `src/services/` | `src/models/`, browser/platform APIs (`qrcode`, `virtual:pwa-register`) | `controllers`, `views`, `react`, `react-dom` |
| **Controllers** | `src/controllers/` | `react`, `src/models/`, `src/services/` | `views` |
| **Views** | `src/views/` | `react`, `src/controllers/`, read-only `src/models/` constants/selectors, `src/data/speciesConstants` | `services` (all side effects go through controllers or declarative Invoker Commands) |

- **Acyclic model helpers**: `eventArchiveModel.js` imports `triageFunnelModel.js` (which imports `tagModel.js`). Keep shared pure date/age helpers (`calculateAgeSearchString`, `mergeAgeIntervals`, `formatIntervalToAgeToken`, `getTodayPlainDateString`) in `src/models/events/eventAgeUtils.js` so `tagHydration.js` and `eventArchiveModel.js` share them without a cycle. Controllers needing live event state (e.g., `useTagSystemController.js`) subscribe directly to `eventArchiveStore` via `useSyncExternalStore`.

## 2. Zero `useEffect` / `useLayoutEffect` (ESLint-Enforced)

`eslint.config.js` bans `useEffect` and `useLayoutEffect` from `'react'` via `no-restricted-imports`. Never bypass this rule. Use the sanctioned React 19 primitives:

- **External / persisted state**: `useSyncExternalStore` backed by `src/models/storage/createPersistentStore.js` (handles cross-tab `storage`, `localStorage.clear()`, and `QuotaExceededError`).
- **DOM observers, `<dialog>`, scroll centering**: React 19 ref cleanup callbacks (`ref={(node) => { ...; return () => cleanup(); }}`, see `src/views/shared/dialogRef.js`).
- **User-triggered actions & async flows**: Event handlers + explicit state machines in `src/models/machines/`.
- **Derived state**: Compute directly during render or via `useMemo` — never mirror props/stores into state.

## 3. Explicit Finite State Machines

Model every multi-step UI, async, or modal lifecycle as a pure reducer/transition table in `src/models/machines/` (tested in `stateMachines.test.js`):
- `workspaceMachine.js`, `searchDockMachine.js`, `triStateMachine.js`, `resetConfirmMachine.js`, `metaSyncMachine.js`, `eventModalMachine.js`, `pwaMachine.js`.
- Never scatter boolean flag bags (`isLoading`, `isConfirming`, `isOpen`, `hasError`) across components.

## 4. Single Sources of Truth & Zero Scaling Cliffs

- **New Pokémon GO search operators**: Add once in `src/models/search/operatorRegistry.js` — automatically wires `queryBuilder`, `validator`, `tagLinter`, `countActiveFilters`, and `FilterPanel`.
- **Canonical species & region lists**: Add once in `src/data/speciesConstants.js` (shared by models, views, and `scripts/`). Never duplicate species arrays.
- **No hardcoded ceilings**: Never hardcode Dex `1025` outside `REGIONS_CONFIG` in `src/data/speciesConstants.js`, and never hardcode year lists like `[2026, 2025, ...]`. Derive max Dex IDs, evolution families (`familyModel.js`), and Community Day pre-evos (`communityDayModel.js`) dynamically from `src/data/pokedex.json`.
- **Unified PvP/PvE/Max meta**: All tabs read from `metaCacheModel.js` (backed by `meta_snapshot.json` + live PvPoke sync). Validate all imported JSON payloads before persisting to `localStorage`.

## 5. Pokémon GO Search-String Safety Invariants

- **CNF precedence**: In Pokémon GO, `,` (OR) binds **tighter** than `&` (AND). Never auto-rewrite valid CNF queries; restrict DNF→CNF distribution to `compileDnfToPogoCnfSafe` (with clause/char caps, tautology elimination, and contradiction pruning).
- **De Morgan IV shields**: Pokémon GO ignores `!` on IV stat bars (`!0-1attack` is broken). Always emit exact complements (`2-4attack,0-2defense,0-2hp` for PvP IVs; `1-4attack,1-4defense,1-4hp` for Nundos).
- **Inverted `@3mov` semantics**: `@3mov` = single-moved (no 2nd charged move); `!@3mov` = double-moved. Trash/transfer queries MUST use positive `@3mov` to shield invested builds.
- **Destructive / transfer strings**: Route every trash/cleanup query through `buildSafeTrashQuery` (only opting out of the exact target trait) and assert **0 errors and 0 warnings** via `validateSearchString(..., { isTrashContext: true })`.
- **Silent traps**: Never emit `!mega...` (hides all non-Mega species), never emit `!maxmove2-` without `maxmove1-` scoping, never emit `!@special` on Community Day evolution queries (hides Shadow pre-evos with Frustration), and never combine `count2-` / `count-N` with variant filters (`costume`, `shiny`, `background` — `count` counts National Dex `#`, not variants).

### Deliberate Box Hydration & Event/Background Query Precision (`src/models/tags/tagHydration.js`)

- **Explicit `actionMode`**: Every hydration query must declare `actionMode: 'select-all' | 'review'`. Reserve `'select-all'` for 100% deterministic, zero-false-positive buckets (`EV-ShBG`, `EV-LocBG`, Nundos, built `!@3mov` leagues, `OP-Mega`, `OP-Buddy`, `OP-EvoXP`, `OP-Purify1k`); use `'review'` (**Sort by # & Pick**) for variant/IV/duplicate review buckets.
- **Stage 1 (`EV-*`) precision & year scoping**:
  - `EV-LocBG` always includes `!shiny` (order-independent from `EV-ShBG`).
  - `EV-Global` always includes `!locationbackground&!shiny` and splits **Keepers** (`3*,4*,legendary,mythical,ultrabeast,gigantamax,costume`), **Attended Global Event BGs** (merged `ageX-Y` windows), **0★–2★ Surplus**, and **Profile Backgrounds**.
  - `EV-InPerson` anchors to attended `scope === 'in-person'` `ageX-Y` windows (skipping ongoing `end === 'PRESENT'` venues) with `!remoteraid&!hatched&!traded&!#` plus an attended `regionalRareIds` sweep — never bare `distance100-` (misses local live events `<100km` and leaks remote raids/7km eggs) or bare `201,479` (leaks global Unown/Rotom). Keep `distance100-` only as a `!remoteraid&!hatched`-guarded fallback.
  - Combine `yearYYYY` with merged attended `ageX-Y` unions (~100–200 chars, well under PoGO's 4,000-char ceiling) rather than bare `yearYYYY`.
- **Stage 2–5 isolation**:
  - `KEEP-Trophy`: `count1` must exclude combat classes (`@3mov&!candyxl&!legendary&!mythical&!ultrabeast&!shadow&!maxmove1-`) so 1-of-1 combat Pokémon cascade cleanly to Stages 3–4; include a dedicated untagged costume sweep (`costume&!shiny&!background&!#`) before `TR-Spec`.
  - `PVP-WIP`: promote league-tagged dual-tag audits (`#pvp-gl,#pvp-ul,#pvp-ml,#pvp-cup&@3mov` and `&evolve`) as primary queries.
  - `TR-Spec` / `TR-Dist`: always exclude untradeables (`!shadow&!fusion`, plus `!mythical` where applicable); split `TR-Spec` into focused sub-buckets (Shinies/BGs, `count2-` Legendaries/UBs, Scarce Regionals/Unown/Rotom, Spare Costumes); exclude `!background&!costume` from `TR-Dist`.

## 6. React 19 Performance, Offline PWA & Mobile UX

- **Preserve `React.memo` boundaries**: Never pass fresh controller wrapper objects or inline `[]` literals to memoized children; never run query builders inside `.map()` during render; isolate high-churn state (e.g., `activeRegion`) and per-panel controllers (`src/controllers/events/`) so `hidden="until-found"` tabs stay fast.
- **Code splitting & resilience**: Keep lazy tab splitting (`React.lazy` + `<ErrorBoundary>`) and `vite.config.js` manual data chunks (`data-pokedex`, `data-meta`, `data-events`).
- **Offline PWA**: Zero external CDN runtime imports (`esm.sh`, etc. — bundle dependencies like `qrcode` locally). `PokemonSprite` must keep `crossOrigin="anonymous"` and Workbox `pokemon-sprites` must keep `statuses: [200]` (never opaque `status: 0`). Live PvPoke sync must use `NetworkOnly`. Keep `vite-plugin-pwa` in `devDependencies` and keep `package-lock.json` synced.
- **Mobile & iOS Safari**: Mobile inputs/selects must be `>= 16px` (prevent iOS zoom); apply `.mwg-touch-scope` for 44px coarse targets; keep off-screen mobile drawers `inert`; use `#1d7a4d` (≥4.5:1 WCAG contrast) for green badges; always give `CopyActionButton` a real accessible name; guard `@supports (animation-timeline: scroll())` for tablist fades; delay `URL.revokeObjectURL` for iOS downloads.

## 7. Deep Reference & On-Demand Workspace Skills

Consult `docs/ARCHITECTURE.md` for full system diagrams, store keys, and ADRs. Activate the specialized workspace skills in `.agents/skills/` when working in their domain:

| Skill | When to Consult |
| --- | --- |
| `pogo-search-safety` (`.agents/skills/pogo-search-safety/SKILL.md`) | Adding/editing search operators, CNF logic, triage funnels, tag hydration, or event cleanup strings |
| `mvc-react-zero-effect` (`.agents/skills/mvc-react-zero-effect/SKILL.md`) | Building views, controllers, persistent stores, FSMs, dialogs, or optimizing React 19 renders |
| `offline-pwa-mobile-qa` (`.agents/skills/offline-pwa-mobile-qa/SKILL.md`) | Modifying PWA/Workbox config, iOS Safari/mobile UX, accessibility, or running data/meta updates |

## 8. Mandatory Verification Gates

Before committing or opening a PR:
1. Run `npm run test:run` (all unit, simulator, data-pipeline, and `src/architecture.test.js` suites must pass; look up hydration queries by `q.id` rather than hardcoded array indices).
2. Run `npm run lint` (0 errors, 0 warnings; extract optional-chained store properties before `useMemo` deps to satisfy `react-hooks/preserve-manual-memoization`).
3. Run `npm run build` (clean Vite + Workbox `dist/sw.js` build).
4. Follow `.agents/rules/git-branch-hygiene.md`: `git fetch origin main`, fast-forward local `main`, and branch/rebase off `origin/main` (never reuse already-merged feature branches).
