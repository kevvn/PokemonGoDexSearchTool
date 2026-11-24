# PokéSearch — Pokémon GO Pokédex & Search String Builder

Offline-first React 19 Progressive Web App (PWA) for building, linting, and organizing Pokémon GO storage search strings (`Leidwesen/SearchPhrases` CNF semantics), managing an opinionated 30-tag box taxonomy, slicing event/travel date windows, and triaging post-catch storage.

## Getting Started

- **Prerequisites**: Node.js 20+ and npm.
- **Install**: `npm install`
- **Dev server**: `npm run dev`
- **Tests**: `npm run test:run` (unit, box simulator, and data pipeline suites)
- **Lint**: `npm run lint` (also enforces zero `useEffect`/`useLayoutEffect` via `no-restricted-imports`)
- **Production PWA build & offline preview**: `npm run build && npm run preview`

## Architecture (MVC + Explicit State Machines)

The codebase adheres to a strict separation of concerns across `src/`:

- **`src/data/`**: Pure static data snapshots and canonical species registries (zero model imports):
  - `pokedex.json`, `meta_snapshot.json`, `meta_cache.json`, `events_archive.json`
  - `speciesConstants.js` — Single canonical source of truth for regions, starters, scarce/regional IDs, 12-candy fodder, trade-evolves, XL PvP staples, 500ms fast moves, and move formatting.
  - `communityDayRegistry.js` — Pure Community Day catalog (`RAW_COMMUNITY_DAYS`).
  - `travelTripsData.js` — Optional starter sample trips for the editable personal trips store.
- **`src/models/`**: Pure domain logic, explicit finite state machines (`src/models/machines/`), and React 19 `useSyncExternalStore`-compatible persistent stores (`src/models/storage/createPersistentStore.js`):
  - **Search Engine (`src/models/search/` + `searchEngine.js` facade)**: `operatorRegistry.js`, `idRanges.js`, `queryBuilder.js`, `validator.js`, `cnfCompiler.js`.
  - **Tag System (`src/models/tags/` + `tagModel.js` facade)**: `tagDefinitions.js`, `tagLinter.js`, `tagHydration.js`.
  - **Domain Models**: `triageFunnelModel.js`, `eventArchiveModel.js`, `metaCacheModel.js` (unified live-syncable meta store), `communityDayModel.js`, `familyModel.js` (data-driven from `pokedex.json`), `savedSearchModel.js`, `pokedexModel.js`, `filterPresets.js`, `spriteUrls.js`, `pwaModel.js`.
  - **Explicit Finite State Machines (`src/models/machines/`)**: `workspaceMachine.js`, `searchDockMachine.js`, `triStateMachine.js`, `resetConfirmMachine.js`, `metaSyncMachine.js`, `eventModalMachine.js`, `pwaMachine.js`.
- **`src/controllers/`**: React hooks binding views to models/services with **zero `useEffect` / `useLayoutEffect` hooks** (enforced by ESLint). Includes per-panel Events Hub controllers (`src/controllers/events/`) so typing in one `hidden="until-found"` panel never re-renders the other 4 panels.
- **`src/services/`**: Browser/network side-effect boundaries (`copyService.js`, `pwaService.js`, `qrCodeService.js`, `metaNetworkService.js`, `fileTransferService.js`).
- **`src/views/`**: Presentation components grouped by feature (`builder/`, `dock/`, `events/`, `layout/`, `shared/`, `tags/`, `triage/`), wrapped in `<ErrorBoundary>` with `React.lazy` tab code-splitting.

## Where to Make Changes

| Task | Files to Edit |
| --- | --- |
| Add a new Pokémon GO search keyword/operator | `src/models/search/operatorRegistry.js` (automatically flows into `queryBuilder.js`, `validator.js`, `tagLinter.js`, and `FilterPanel.jsx`) |
| Add a new Pokémon generation / species | Run `npm run update:data` (`scripts/fetch_data.js`) — `familyModel.js`, `communityDayModel.js`, and max Dex IDs derive dynamically from `pokedex.json` |
| Add a new Community Day | Append an entry to `src/data/communityDayRegistry.js` — `familyIds` and `preEvoIds` compute automatically from `pokedex.json` `evolveCandy` |
| Add a new Global/In-Person event | Add to `src/data/events_archive.json` (or click `+ EVENT` in the UI) — year filters derive dynamically |
| Refresh PvP/PvE/Max meta rankings | Run `npm run update:meta` (`scripts/fetch_meta.js`), or click **Sync Live** in Events & Trips → Meta (propagates live PvPoke Top 100 across all 4 tabs) |
| Add/adjust a Triage step or safety shield | `src/models/triageFunnelModel.js` (verify with `src/models/triageFunnelModel.test.js` & `src/models/triageSimulator.test.js`) |

## Pokémon GO Domain & Codebase Glossary

- **CNF (Conjunctive Normal Form) & Precedence**: In Pokémon GO, `,` (OR) binds **tighter** than `&` (AND). Writing `A,B&C` means `(A OR B) AND C`. To express `(A AND B) OR C`, the CNF compiler distributes OR over AND (`A,C&B,C`) with superset absorption and tautology elimination.
- **De Morgan IV Shields**: Pokémon GO ignores `!` before IV stat bars (`!0-1attack` is silently broken). To protect PvP IVs (`0-1attack&3-4defense&3-4hp`), trash strings emit the exact logical complement `2-4attack,0-2defense,0-2hp`. To protect 0% Nundos (`0attack&0defense&0hp`), they emit `1-4attack,1-4defense,1-4hp`.
- **`@3mov` vs `!@3mov` (Inverted Semantics)**: In Pokémon GO, `@3mov` matches Pokémon with **no** 2nd charged move (only 1 charged move), whereas `!@3mov` matches Pokémon that **do** have a 2nd charged move unlocked. Trash queries therefore use positive `@3mov` to shield double-moved investments.
- **Box Hydration**: The 6-stage initial tagging workflow (`TagSystemView` → `TagHydrationWalkthrough`) that tags an existing unorganized Pokémon GO box top-to-bottom using `!#` (untagged) so earlier keeper tags are automatically skipped by later stages.
- **Invoker Commands (`copyService.js`)**: `CopyActionButton` uses declarative `command="--copy"` + `commandfor="<id>"` attributes handled globally by `src/services/copyService.js` (single-path native `CommandEvent` or click fallback), automatically syncing copied queries into the bottom `SearchStringDock` unless `data-sync-dock="false"`.
- **`mwg-*` CSS Classes**: Modern Web Guidance progressive-enhancement primitives in `src/index.css` (coarse-pointer touch targets `.mwg-touch-scope`, scroll-driven `.mwg-tablist`, native `<details>` `.mwg-accordion`, `.mwg-copy` live-region bubbles).

## Offline Service Worker & Storage Keys

- **Workbox Precaching (`vite-plugin-pwa`)**: `registerType: 'prompt'` + `injectRegister: false` (explicitly managed by `src/services/pwaService.js` + `PwaStatusBadge.jsx`).
- **CORS-Safe Sprite Caching**: `PokemonSprite` sets `crossOrigin="anonymous"` and Workbox caches only `statuses: [200]` (`maxEntries: 3000`, `CacheFirst`), preventing opaque-response quota bloat on iOS Safari. Live PvPoke sync uses `NetworkOnly` so **Sync Live** always fetches fresh rankings.
- **`localStorage` Keys**: `pokedex_viewMode`, `pokedex_selectedIds`, `pokedex_filters`, `pokedex_saved_searches`, `pokedex_custom_tags`, `pogo_tag_hydration_checked_v1`, `pogo_stored_event_db_v2`, `pogo_personal_travel_trips_v1`, `pogo_live_meta_cache_v1`.

## Tooling & Deployment Files

- `wrangler.toml` — Cloudflare Pages/Workers static asset deployment configuration serving `dist/`.
- `test_mobile.py` — Standalone Playwright mobile E2E smoke test script covering all 4 workspace tabs, tag collision linting, hydration walkthrough, QR dialog, and mobile Filter By drawer.
