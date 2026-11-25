---
name: pogo-search-safety
description: >-
  Runbook for adding or modifying Pokémon GO search operators, CNF compilation,
  triage funnels, tag hydration queries, or event cleanup strings while preserving
  Leidwesen/SearchPhrases semantics and zero accidental mass-transfer regressions.
---

# Pokémon GO Search & Transfer Safety Runbook

Use this procedure whenever modifying `src/models/search/`, `src/models/tags/`, `src/models/triageFunnelModel.js`, `src/models/eventArchiveModel.js`, or `src/models/communityDayModel.js`.

## 1. Non-Negotiable Pokémon GO Syntax Invariants

1. **Operator Precedence (CNF)**: `,` (OR) binds **tighter** than `&` (AND).
   - `A,B&C` means `(A OR B) AND C`.
   - Never auto-rewrite valid CNF queries in the dock; only compile DNF→CNF explicitly via `compileDnfToPogoCnfSafe` (`src/models/search/cnfCompiler.js`), which enforces `maxClauses`, `maxChars`, sorted superset absorption, tautology removal, and contradiction pruning.
2. **De Morgan IV Shields (Never Negate IV Stat Bars)**:
   - Pokémon GO silently ignores `!` on stat bars (`!0-1attack` is invalid).
   - Protect PvP IVs (`0-1attack&3-4defense&3-4hp`) using `PVP_IV_EXCLUDE_CLAUSE` (`2-4attack,0-2defense,0-2hp`).
   - Protect 0% Nundos (`0attack&0defense&0hp`) using `1-4attack,1-4defense,1-4hp`.
3. **Inverted `@3mov` Semantics**:
   - `@3mov` = Pokémon with **no** 2nd charged move (1 charged move).
   - `!@3mov` = Pokémon **with** a 2nd charged move unlocked.
   - Trash/transfer strings MUST include positive `@3mov` (never `!@3mov`).
4. **Silent Filter Traps**:
   - Never emit `!mega...` (hides all non-Mega species in PoGO).
   - Never emit `!maxmove2-` without `maxmove1-` scoping (matches non-Max storage).
   - Never emit `!@special` on Community Day evolution queries (PoGO treats Shadow `Frustration` and Purified `Return` as `@special`).
   - Never combine `count2-` / `count-N` with variant filters (`costume`, `shiny`, `background`) — PoGO's `count` counts National Dex `#`, not variants.
   - Never use non-existent keywords like `ultrabeasts` (plural) or `partyplay` — use `ultrabeast` and `party`.

## 2. Where to Make Domain Changes

- **Add a new search operator**: Add it once in `src/models/search/operatorRegistry.js`. Verify it flows into `queryBuilder.js`, `validator.js`, `tagLinter.js`, and `FilterPanel.jsx`.
- **Add/update scarce, regional, XL, or fodder species**: Edit `src/data/speciesConstants.js` once — never duplicate arrays in models or scripts.
- **Add/edit a destructive/transfer query**:
  1. Route through `buildSafeTrashQuery` (only disabling the shield for the specific trait being cleaned, e.g., `xxl: false` in post-screening cleanup).
  2. Never silently fall back to a broad Dex range (e.g., `'1-9'`) when a selection is empty — disable the action instead.
  3. Keep trailing hyphens on umbrella namespace hashes (`#ev-`, `#tr-`, `#op-`, `#max-`) so external user tags (`Trade`, `Trash`, `Evolve`) never collide.
- **Add/edit a tag hydration query**: Update the builder entry in `src/models/tags/tagHydration.js` and matching metadata in `src/models/tags/tagDefinitions.js`.
  - Always declare `actionMode: 'select-all' | 'review'` (`'select-all'` only for zero-false-positive deterministic queries; `'review'` for variant/IV/duplicate picks).
  - For Stage 1 (`EV-*`), use `src/models/events/eventAgeUtils.js` to build merged `ageX-Y` unions of attended events (skipping `end === 'PRESENT'` venues), guard `EV-InPerson` with `!remoteraid&!hatched&!traded`, and guard `EV-Global` with `!locationbackground&!shiny`.
  - For Stage 2 (`KEEP-Trophy`), exclude combat classes from `count1` (`@3mov&!candyxl&!legendary&!mythical&!ultrabeast&!shadow&!maxmove1-`) and keep the untagged costume sweep before `TR-Spec`.
  - For Stage 5 (`TR-*`), always exclude untradeables (`!shadow&!fusion`), split `TR-Spec` into focused sub-buckets, and exclude `!background&!costume` from `TR-Dist`.

## 3. Mandatory Verification

Run targeted domain tests + full verification:
```zsh
npx vitest run src/models/searchEngine.test.js src/models/tagModel.test.js src/models/triageFunnelModel.test.js src/models/triageSimulator.test.js src/models/eventArchiveModel.test.js
npm run test:run && npm run lint
```

Confirm:
- Every generated query passes `validateSearchString(query, { isTrashContext })` with `valid: true`, `errors: []`, `warnings: []`, and `query.length < 4000`.
- `triageSimulator.test.js` confirms zero grails (4★, Shiny, Background, Nundo, PvP IV, Mythical, Fusion, Adventure Effect, Double-Moved, Buddy, XL-Powered, Regional/Rare) leak into trash funnels.
