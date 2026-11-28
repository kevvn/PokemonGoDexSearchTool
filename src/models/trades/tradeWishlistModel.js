/**
 * Offline Friend & Group Trade Wishlist Model + Persistent Store.
 *
 * Solves "not knowing what other players want" with zero backend:
 * 1. Build & share your personal Wishlist using Fly33-style compact exclusion filters + Offline QR.
 * 2. Import 1..N friends' wishlist strings, merge them into "Tag What Friends Want",
 *    and generate a transfer-safe "Clean Up Unwanted Surplus" string for everything else.
 */
import {
  GUARANTEED_LUCKY_CUTOFF_YEAR,
  GUARANTEED_LUCKY_YEAR_RANGE,
  REMOTE_TRADE_ELIGIBILITY_GUARDS,
  TRADEABLE_MYTHICAL_IDS,
  TRADE_ELIGIBILITY_GUARDS,
} from '../../data/speciesConstants';
import { getFamilyIdsByDexId } from '../familyModel';
import {
  compileSpeciesTraitWishlist,
  compressIds,
  expandIds,
  joinClauses,
  negateCompressedRanges,
  parseSearchString,
  parseToAst,
  validateSearchString,
} from '../searchEngine';
import { createPersistentStore } from '../storage/createPersistentStore';
import { buildSafeTrashQuery, createDefaultSafetyShields } from '../triageFunnelModel';
import { getTradeTierSpecies } from './tradeValueModel';

export const WISHLIST_STORAGE_KEY = 'pogo_trade_wishlists_v1';
export const QR_SAFE_CHAR_LIMIT = 2900;
export const POGO_SAFE_CHAR_LIMIT = 4000;

export const WISHLIST_TRAIT_OPTIONS = [
  { id: 'shiny', label: 'Shiny', token: 'shiny' },
  { id: 'background', label: 'Any BG', token: 'background' },
  { id: 'locationbackground', label: 'Loc BG', token: 'locationbackground' },
  { id: 'gigantamax', label: 'G-Max', token: 'gigantamax' },
  { id: 'costume', label: 'Costume', token: 'costume' },
  { id: 'female', label: '♀ Female', token: 'female' },
  { id: 'male', label: '♂ Male', token: 'male' },
  { id: 'lucky2020', label: `2016–${GUARANTEED_LUCKY_CUTOFF_YEAR} Lucky`, token: GUARANTEED_LUCKY_YEAR_RANGE },
];

const TRAIT_TOKEN_BY_ID = Object.fromEntries(
  WISHLIST_TRAIT_OPTIONS.map((opt) => [opt.id, opt.token])
);

const VALID_TRAIT_IDS = new Set(WISHLIST_TRAIT_OPTIONS.map((opt) => opt.id));

const MUTUALLY_EXCLUSIVE_TRAITS = {
  female: 'male',
  male: 'female',
};

function generateWishlistEntryId() {
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.randomUUID) {
    return `fw_${globalThis.crypto.randomUUID()}`;
  }
  return `fw_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function createDefaultWishlistState() {
  return {
    myWishlist: [],
    friendWishlists: [],
  };
}

function sanitizeMyWishlist(raw) {
  if (!Array.isArray(raw)) return [];
  const seen = new Set();
  const out = [];
  for (const item of raw) {
    const dexId = Number(item?.dexId);
    if (!Number.isInteger(dexId) || dexId <= 0 || seen.has(dexId)) continue;
    seen.add(dexId);
    const traits = Array.isArray(item.traits)
      ? Array.from(new Set(item.traits.filter((t) => VALID_TRAIT_IDS.has(t))))
      : [];
    // Ensure female and male are never simultaneously set in persisted state
    const cleanTraits =
      traits.includes('female') && traits.includes('male')
        ? traits.filter((t) => t !== 'male')
        : traits;
    out.push({ dexId, traits: cleanTraits });
  }
  return out;
}

function sanitizeFriendWishlists(raw) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  const seenIds = new Set();
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const id = String(item.id || '').trim();
    const name = String(item.name || '').trim().slice(0, 60);
    const rawQuery = String(item.rawQuery || '').trim().slice(0, POGO_SAFE_CHAR_LIMIT);
    if (!id || seenIds.has(id) || !name || !rawQuery) continue;
    seenIds.add(id);
    const speciesIds = Array.isArray(item.speciesIds)
      ? Array.from(
          new Set(item.speciesIds.map(Number).filter((n) => Number.isInteger(n) && n > 0))
        ).sort((a, b) => a - b)
      : [];
    out.push({
      id,
      name,
      rawQuery,
      speciesIds,
      active: item.active !== false,
      updatedAt: typeof item.updatedAt === 'string' ? item.updatedAt : '',
    });
  }
  return out;
}

export function sanitizeWishlistState(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return createDefaultWishlistState();
  }
  return {
    myWishlist: sanitizeMyWishlist(raw.myWishlist),
    friendWishlists: sanitizeFriendWishlists(raw.friendWishlists),
  };
}

export const tradeWishlistStore = createPersistentStore({
  key: WISHLIST_STORAGE_KEY,
  schemaVersion: 1,
  getDefaultValue: createDefaultWishlistState,
  deserialize: (rawText) => sanitizeWishlistState(JSON.parse(rawText)),
  serialize: (state) => JSON.stringify(sanitizeWishlistState(state)),
  migrate: (raw) => sanitizeWishlistState(raw),
});

function withStorageResult(mutate) {
  tradeWishlistStore.setState(mutate);
  const err = tradeWishlistStore.getLastWriteError();
  return {
    ok: !err,
    storageError: err
      ? 'Could not save wishlist to browser storage (storage quota full or private mode).'
      : '',
  };
}

/**
 * Pure species autocomplete selector for My Wishlist builder.
 */
export function searchWishlistSpeciesSuggestions(pokemonList, query, existingDexIds = [], limit = 8) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return [];
  const existingSet = new Set(existingDexIds);
  const matches = [];
  for (const p of pokemonList || []) {
    if (existingSet.has(p.id)) continue;
    if (String(p.id) === q || p.name.toLowerCase().includes(q)) {
      matches.push(p);
      if (matches.length >= limit) break;
    }
  }
  return matches;
}

export function addWishlistSpecies(dexId) {
  const id = Number(dexId);
  if (!Number.isInteger(id) || id <= 0) return { ok: false, storageError: '' };
  return withStorageResult((prev) => {
    if (prev.myWishlist.some((item) => item.dexId === id)) return prev;
    return {
      ...prev,
      myWishlist: [...prev.myWishlist, { dexId: id, traits: [] }],
    };
  });
}

export function removeWishlistSpecies(dexId) {
  const id = Number(dexId);
  if (!Number.isInteger(id) || id <= 0) return { ok: false, storageError: '' };
  return withStorageResult((prev) => ({
    ...prev,
    myWishlist: prev.myWishlist.filter((item) => item.dexId !== id),
  }));
}

export function toggleWishlistSpeciesTrait(dexId, traitId) {
  const id = Number(dexId);
  if (!Number.isInteger(id) || id <= 0 || !VALID_TRAIT_IDS.has(traitId)) {
    return { ok: false, storageError: '' };
  }
  const opposite = MUTUALLY_EXCLUSIVE_TRAITS[traitId];
  return withStorageResult((prev) => ({
    ...prev,
    myWishlist: prev.myWishlist.map((item) => {
      if (item.dexId !== id) return item;
      const exists = item.traits.includes(traitId);
      const nextTraits = exists
        ? item.traits.filter((t) => t !== traitId)
        : [...item.traits.filter((t) => t !== opposite), traitId];
      return { ...item, traits: nextTraits };
    }),
  }));
}

export function clearPersonalWishlist() {
  return withStorageResult((prev) => ({
    ...prev,
    myWishlist: [],
  }));
}

export function addFriendWishlistEntry(entry) {
  return withStorageResult((prev) => ({
    ...prev,
    friendWishlists: [entry, ...prev.friendWishlists],
  }));
}

export function toggleFriendWishlistActive(id) {
  return withStorageResult((prev) => ({
    ...prev,
    friendWishlists: prev.friendWishlists.map((f) =>
      f.id === id ? { ...f, active: !f.active } : f
    ),
  }));
}

export function removeFriendWishlistEntry(id) {
  return withStorageResult((prev) => ({
    ...prev,
    friendWishlists: prev.friendWishlists.filter((f) => f.id !== id),
  }));
}

/**
 * Compiles the user's personal wishlist entries into a compact Fly33-style PoGO search string
 * ready for a friend to paste directly into Pokémon GO (or scan via offline QR).
 */
export function compileMyWishlist(
  entries,
  { remoteReady = false, excludeFavorite = true } = {}
) {
  const mappedEntries = (entries || []).map((entry) => ({
    dexId: entry.dexId,
    traits: (entry.traits || []).map((id) => TRAIT_TOKEN_BY_ID[id]).filter(Boolean),
  }));

  const guards = remoteReady
    ? [...REMOTE_TRADE_ELIGIBILITY_GUARDS]
    : [...TRADE_ELIGIBILITY_GUARDS];
  if (excludeFavorite) {
    guards.push('!favorite');
  }

  const compiled = compileSpeciesTraitWishlist(mappedEntries, guards, {
    maxChars: POGO_SAFE_CHAR_LIMIT,
  });

  return {
    ...compiled,
    qrLimitExceeded: compiled.charCount > QR_SAFE_CHAR_LIMIT,
  };
}

function extractPositiveSpeciesIdsFromQuery(rawQuery, pokemonList) {
  const nameToId = new Map();
  if (Array.isArray(pokemonList)) {
    for (const p of pokemonList) {
      if (p?.name && Number.isInteger(p.id)) {
        nameToId.set(p.name.toLowerCase(), p.id);
      }
    }
  }
  const ast = parseToAst(rawQuery);
  const resolved = new Set();
  for (const clause of ast.clauses) {
    for (const atom of clause.atoms) {
      if (atom.negated) continue;
      if (/^\d+(?:-\d+)?$/.test(atom.value)) {
        for (const id of expandIds(atom.value)) {
          resolved.add(id);
        }
        continue;
      }
      const isFamily = atom.value.startsWith('+');
      const cleanName = isFamily ? atom.value.slice(1).trim() : atom.value;
      const matchedId = nameToId.get(cleanName);
      if (matchedId) {
        if (isFamily) {
          for (const famId of getFamilyIdsByDexId(matchedId)) {
            resolved.add(famId);
          }
        } else {
          resolved.add(matchedId);
        }
      }
    }
  }
  return Array.from(resolved);
}

/**
 * Parses a pasted friend wishlist search string into a validated friend wishlist record.
 * Resolves numeric Dex IDs/ranges (even in mixed OR clauses like `757,rayquaza` or `shiny,757`)
 * and Pokémon species names (e.g., `rayquaza,charmander`, `+gible`).
 */
export function parseImportedFriendWishlist(name, rawQuery, pokemonList = []) {
  const cleanName = String(name || '').trim().slice(0, 60);
  const cleanQuery = String(rawQuery || '').trim();
  if (!cleanName) {
    return { ok: false, error: 'Enter a friend or group name.' };
  }
  if (!cleanQuery) {
    return { ok: false, error: 'Paste a Pokémon GO search string or wishlist.' };
  }
  if (cleanQuery.length > POGO_SAFE_CHAR_LIMIT) {
    return {
      ok: false,
      error: `Wishlist exceeds Pokémon GO's ${POGO_SAFE_CHAR_LIMIT}-character limit (${cleanQuery.length} chars).`,
    };
  }

  const validation = validateSearchString(cleanQuery);
  if (!validation.valid && validation.errors.length > 0) {
    return {
      ok: false,
      error: `Invalid Pokémon GO syntax: ${validation.errors[0].message}`,
    };
  }

  const parsed = parseSearchString(cleanQuery);
  const extracted = extractPositiveSpeciesIdsFromQuery(cleanQuery, pokemonList);
  const speciesIds = Array.from(
    new Set([...(parsed.selectedIds || []), ...extracted])
  ).sort((a, b) => a - b);

  return {
    ok: true,
    entry: {
      id: generateWishlistEntryId(),
      name: cleanName,
      rawQuery: cleanQuery,
      speciesIds,
      active: true,
      updatedAt: new Date().toISOString(),
    },
    validation,
  };
}

const LOCAL_MYTHICAL_GUARD = `!mythical,${compressIds(TRADEABLE_MYTHICAL_IDS)}`;

/**
 * Merges active friends' wishlists into two complementary anti-hoarding queries:
 * 1. `tagGroupWantsQuery`: Everything tradeable in your box wanted by any active friend
 *    (preserving exact Fly33 traits for single-friend mode, and unioning species IDs + surfacing
 *    trait-only friends when merging multiple friends).
 * 2. `cleanUnwantedQuery`: Transfer-safe cleanup string negating all friend-wanted species,
 *    2016–2020 Guaranteed Luckies, Tier S/A protections, and all `buildSafeTrashQuery` shields.
 */
export function buildGroupWishlistQueries(
  friendWishlists,
  {
    remoteReady = false,
    metaSnapshot = {},
    safetyShields = {},
  } = {}
) {
  const activeFriends = (friendWishlists || []).filter((f) => f && f.active !== false);
  if (activeFriends.length === 0) {
    return {
      activeCount: 0,
      wantedSpeciesIds: [],
      unindexedFriends: [],
      tagGroupWantsQuery: '',
      cleanUnwantedQuery: '',
    };
  }

  const wantedSet = new Set();
  const unindexedFriends = [];
  for (const friend of activeFriends) {
    const ids = Array.isArray(friend.speciesIds) ? friend.speciesIds : [];
    if (ids.length === 0) {
      unindexedFriends.push({ id: friend.id, name: friend.name, rawQuery: friend.rawQuery });
    }
    for (const id of ids) {
      const n = Number(id);
      if (Number.isInteger(n) && n > 0) wantedSet.add(n);
    }
  }
  const wantedSpeciesIds = Array.from(wantedSet).sort((a, b) => a - b);

  const guards = remoteReady
    ? [...REMOTE_TRADE_ELIGIBILITY_GUARDS, '!favorite']
    : [...TRADE_ELIGIBILITY_GUARDS, LOCAL_MYTHICAL_GUARD, '!favorite'];

  let tagGroupWantsQuery = '';
  if (activeFriends.length === 1) {
    // Preserve full single-friend query (including Fly33 !dexId,trait clauses) while deduplicating guards
    const friendClauses = activeFriends[0].rawQuery
      .split(/[&|]/)
      .map((c) => c.trim())
      .filter(Boolean);
    tagGroupWantsQuery = joinClauses(...guards, ...friendClauses);
  } else if (wantedSpeciesIds.length > 0) {
    tagGroupWantsQuery = joinClauses(...guards, compressIds(wantedSpeciesIds));
  }

  // Build safe cleanup string for everything NOT wanted by active friends,
  // NOT 2016-2020 Guaranteed Lucky, and NOT Tier S/A
  const tiers = getTradeTierSpecies(metaSnapshot);
  const protectedIds = Array.from(new Set([...wantedSpeciesIds, ...tiers.tierSAndA])).sort(
    (a, b) => a - b
  );
  const protectedNegation = negateCompressedRanges(compressIds(protectedIds));
  const shields = { ...createDefaultSafetyShields(), ...safetyShields };
  // Deduplicate SCARCE_RARE_SPECIES_IDS since tiers.tierSAndA already includes all scarce/regional IDs
  const dedupedShields = shields.rareSpecies
    ? { ...shields, rareSpecies: false }
    : shields;

  const cleanUnwantedQuery = buildSafeTrashQuery({
    ageScope: '',
    starScope: '0*,1*,2*',
    excludeTraded: true,
    extraExclusions: [`!${GUARANTEED_LUCKY_YEAR_RANGE}`, protectedNegation].filter(Boolean),
    safetyShields: dedupedShields,
  });

  return {
    activeCount: activeFriends.length,
    wantedSpeciesIds,
    unindexedFriends,
    tagGroupWantsQuery,
    cleanUnwantedQuery,
  };
}
