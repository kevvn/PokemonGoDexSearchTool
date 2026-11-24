import bundledMetaCache from '../data/meta_cache.json';
import bundledMetaSnapshot from '../data/meta_snapshot.json';
import {
  GLOBAL_REGIONAL_ROTOM_UNOWN_IDS,
  PVP_MAX_OUT_XL_BASE_IDS,
  RARE_TRADE_REROLL_BASE_IDS,
  STAPLE_META_BASE_IDS,
  formatMoveDisplayName,
} from '../data/speciesConstants';
import { getFamilyIdsByDexId, MAX_POKEDEX_ID } from './familyModel';
import { compressIdRanges } from './searchEngine';
import { createPersistentStore } from './storage/createPersistentStore';

const LOCAL_STORAGE_META_KEY = 'pogo_live_meta_cache_v1';

export const PVPOKE_ENDPOINTS = {
  great_league: 'https://raw.githubusercontent.com/pvpoke/pvpoke/master/src/data/rankings/all/overall/rankings-1500.json',
  ultra_league: 'https://raw.githubusercontent.com/pvpoke/pvpoke/master/src/data/rankings/all/overall/rankings-2500.json',
  master_league: 'https://raw.githubusercontent.com/pvpoke/pvpoke/master/src/data/rankings/all/overall/rankings-10000.json',
};

export const PVPOKE_GAMEMASTER_ENDPOINT =
  'https://raw.githubusercontent.com/pvpoke/pvpoke/master/src/data/gamemaster/pokemon.json';

function expandToFamilies(baseIds) {
  const set = new Set();
  for (const id of baseIds) {
    for (const fid of getFamilyIdsByDexId(id)) {
      set.add(fid);
    }
  }
  return Array.from(set).sort((a, b) => a - b);
}

export const PVP_MAX_OUT_XL_FAMILY_IDS = expandToFamilies(PVP_MAX_OUT_XL_BASE_IDS);
export const RARE_TRADE_REROLL_FAMILY_IDS = expandToFamilies(RARE_TRADE_REROLL_BASE_IDS);
const STAPLE_META_FAMILY_IDS = expandToFamilies(STAPLE_META_BASE_IDS);
const GLOBAL_REGIONAL_FAMILY_IDS = expandToFamilies(GLOBAL_REGIONAL_ROTOM_UNOWN_IDS);

function normalizePveSection(pveSection) {
  const raw = pveSection && typeof pveSection === 'object' ? pveSection : {};
  const entries = Array.isArray(raw.entries)
    ? raw.entries.map((entry) => ({
        ...entry,
        speciesName: entry.speciesName || entry.species || entry.name || '',
        type: entry.type || entry.role || '',
      }))
    : [];
  return {
    ...raw,
    entries,
    familyIds: Array.isArray(raw.familyIds) ? raw.familyIds : [],
  };
}

const NORMALIZED_BUNDLED_CACHE = Object.freeze({
  ...bundledMetaCache,
  pve: normalizePveSection(bundledMetaCache.pve),
  isLiveSynced: false,
  metaSnapshot: bundledMetaSnapshot,
});

export function buildNameToIdMap(pokedex) {
  const map = new Map();
  for (const p of pokedex || []) {
    if (!p?.name || !Number.isInteger(p.id)) continue;
    const clean = p.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    map.set(clean, p.id);
    const base = p.name.toLowerCase().split('-')[0].replace(/[^a-z0-9]/g, '');
    if (!map.has(base)) {
      map.set(base, p.id);
    }
  }

  const manualOverrides = {
    nidoranfemale: 29,
    nidoranf: 29,
    nidoranmale: 32,
    nidoranm: 32,
    farfetchd: 83,
    sirfetchd: 865,
    mrmime: 122,
    mrrime: 866,
    mimejr: 439,
    hooh: 250,
    porygonz: 474,
    porygon2: 233,
    jangmoo: 782,
    hakamoo: 783,
    kommoo: 784,
    tapukoko: 785,
    tapulele: 786,
    tapubulu: 787,
    tapufini: 788,
    typenull: 772,
    flabebe: 669,
    tinglu: 1003,
    chienpao: 1002,
    wochien: 1001,
    chiyu: 1004,
  };
  for (const [k, v] of Object.entries(manualOverrides)) {
    map.set(k, v);
  }
  return map;
}

export function resolveDexId(speciesId, speciesName, nameMap, gmById = null) {
  if (gmById && speciesId && gmById.has(speciesId)) {
    const gmDex = gmById.get(speciesId)?.dex;
    if (Number.isInteger(gmDex) && gmDex >= 1) return gmDex;
  }

  const raw = String(speciesId || speciesName || '').toLowerCase();
  const withoutSuffixes = raw
    .replace(/_shadow$/i, '')
    .replace(/_xl$/i, '');

  // Check full stripped slug BEFORE splitting on '_' so porygon_z, nidoran_male, mr_mime, tapu_fini match cleanly
  const fullSlug = withoutSuffixes.replace(/[^a-z0-9]/g, '');
  if (nameMap.has(fullSlug)) {
    return nameMap.get(fullSlug);
  }

  const firstToken = withoutSuffixes.split('_')[0].replace(/[^a-z0-9]/g, '');
  if (nameMap.has(firstToken)) {
    return nameMap.get(firstToken);
  }

  const fullClean = raw
    .replace(/shadow/g, '')
    .replace(
      /alolan|galarian|hisuian|paldean|origin|altered|therian|incarnate|complete|hero|crowned|dusk|dawn|mane|wings|standard|zen|ordinary|resolute|aria|pirouette|burn|chill|douse|shock|wash|heat|frost|fan|mow|plant|sandy|trash|sunny|rainy|snowy|attack|defense|speed|black|white|female|male|large|small|super|average|50|10|apex/g,
      ''
    )
    .replace(/[^a-z0-9]/g, '');

  if (nameMap.has(fullClean)) {
    return nameMap.get(fullClean);
  }

  for (const [k, id] of nameMap.entries()) {
    if (k.length >= 4 && (raw.startsWith(k) || fullClean.startsWith(k))) {
      return id;
    }
  }
  return null;
}

export function formatMoveName(moveSlug) {
  return formatMoveDisplayName(moveSlug);
}

/**
 * Builds a unified `metaSnapshot` from live-synced PvPoke rankings (overlaying onto the
 * build-time PvE / Max Battles / specialLists snapshot) so all 4 tabs stay synchronized.
 */
function buildLiveMetaSnapshotOverlay(leagues, gmById, pokedexById, generatedAt) {
  const xlFallbackSet = new Set([
    ...PVP_MAX_OUT_XL_FAMILY_IDS,
    ...(bundledMetaSnapshot.pvp?.gl?.top100?.highAtk || []),
    ...(bundledMetaSnapshot.pvp?.ul?.top100?.highAtk || []),
  ]);

  const classifyCappedLeague = (entries, cpKey) => {
    const allRaw = [];
    const lowAtkRaw = [];
    const highAtkRaw = [];
    const shadowRaw = [];
    const tradeRerollRaw = [];

    for (const entry of entries || []) {
      const dex = entry.dexId;
      if (!Number.isInteger(dex)) continue;
      allRaw.push(dex);
      if (entry.isShadow) shadowRaw.push(dex);

      const gm = gmById?.get(entry.speciesId);
      const defaultIv = gm?.defaultIVs?.[cpKey];
      if (Array.isArray(defaultIv) && typeof defaultIv[1] === 'number') {
        if (defaultIv[1] <= 5) lowAtkRaw.push(dex);
        else highAtkRaw.push(dex);
      } else if (xlFallbackSet.has(dex)) {
        highAtkRaw.push(dex);
      } else {
        lowAtkRaw.push(dex);
      }

      const tags = Array.isArray(gm?.tags) ? gm.tags : [];
      const pokedexEntry = pokedexById.get(dex);
      const isSpecialClass =
        tags.includes('legendary') ||
        tags.includes('mythical') ||
        tags.includes('ultrabeast') ||
        (pokedexEntry && pokedexEntry.pokemonClass && pokedexEntry.pokemonClass !== 'standard');
      const isUntradeable = tags.includes('untradeable');
      if (!entry.isShadow && !isUntradeable && isSpecialClass) {
        tradeRerollRaw.push(dex);
      }
    }

    return {
      all: expandToFamilies(allRaw),
      lowAtk: expandToFamilies(lowAtkRaw),
      highAtk: expandToFamilies(highAtkRaw),
      shadow: expandToFamilies(shadowRaw),
      tradeReroll: expandToFamilies(tradeRerollRaw),
    };
  };

  const classifyMasterLeague = (entries) => {
    const allRaw = [];
    const shadowRaw = [];
    for (const entry of entries || []) {
      if (!Number.isInteger(entry.dexId)) continue;
      allRaw.push(entry.dexId);
      if (entry.isShadow) shadowRaw.push(entry.dexId);
    }
    return {
      all: expandToFamilies(allRaw),
      shadow: expandToFamilies(shadowRaw),
    };
  };

  const glTop100 = leagues.great_league?.entries?.length
    ? classifyCappedLeague(leagues.great_league.entries, 'cp1500')
    : bundledMetaSnapshot.pvp.gl.top100;
  const ulTop100 = leagues.ultra_league?.entries?.length
    ? classifyCappedLeague(leagues.ultra_league.entries, 'cp2500')
    : bundledMetaSnapshot.pvp.ul.top100;
  const mlTop100 = leagues.master_league?.entries?.length
    ? classifyMasterLeague(leagues.master_league.entries)
    : bundledMetaSnapshot.pvp.ml.top100;

  const allShadow = Array.from(
    new Set([...glTop100.shadow, ...ulTop100.shadow, ...mlTop100.shadow])
  ).sort((a, b) => a - b);
  const allTradeReroll = Array.from(
    new Set([...glTop100.tradeReroll, ...ulTop100.tradeReroll])
  ).sort((a, b) => a - b);

  return {
    ...bundledMetaSnapshot,
    generatedAt,
    isLiveSynced: true,
    pvp: {
      gl: { top100: glTop100 },
      ul: { top100: ulTop100 },
      ml: { top100: mlTop100 },
      allShadow,
      allTradeReroll,
    },
  };
}

export function mergeSyncedPvPokeCache(leaguePayloads, pokedex, gamemasterPokemon = null) {
  if (!leaguePayloads || typeof leaguePayloads !== 'object') {
    throw new Error('Invalid PvPoke sync payload.');
  }

  const nameMap = buildNameToIdMap(pokedex);
  const pokedexById = new Map((pokedex || []).map((p) => [p.id, p]));
  const gmById = new Map();
  if (Array.isArray(gamemasterPokemon)) {
    for (const gm of gamemasterPokemon) {
      if (gm?.speciesId) gmById.set(gm.speciesId, gm);
    }
  }

  const leagues = {};
  const allPvpFamilyIds = new Set();

  for (const [leagueKey, data] of Object.entries(leaguePayloads)) {
    if (!Array.isArray(data)) {
      throw new Error(`Invalid PvPoke rankings array for "${leagueKey}".`);
    }

    const topEntries = [];
    const leagueDexIds = new Set();
    const leagueFamilyIds = new Set();

    for (let i = 0; i < data.length && (topEntries.length < 100 || leagueDexIds.size < 85) && i < 160; i++) {
      const item = data[i];
      if (!item || typeof item !== 'object' || typeof item.speciesId !== 'string') continue;

      const dexId = resolveDexId(item.speciesId, item.speciesName, nameMap, gmById);
      if (!dexId) continue;

      const familyIds = getFamilyIdsByDexId(dexId);
      leagueDexIds.add(dexId);
      for (const fid of familyIds) {
        leagueFamilyIds.add(fid);
        allPvpFamilyIds.add(fid);
      }

      if (topEntries.length < 100) {
        const moveset = Array.isArray(item.moveset) ? item.moveset : [];
        topEntries.push({
          rank: topEntries.length + 1,
          speciesId: item.speciesId,
          speciesName: item.speciesName || item.speciesId.replace(/_/g, ' '),
          dexId,
          familyIds,
          score: typeof item.score === 'number' ? item.score : 0,
          fastMove: moveset[0] ? formatMoveName(moveset[0]) : '',
          chargedMoves: moveset.slice(1).map(formatMoveName),
          isShadow: item.speciesId.includes('_shadow'),
        });
      }
    }

    leagues[leagueKey] = {
      entries: topEntries,
      dexIds: Array.from(leagueDexIds).sort((a, b) => a - b),
      familyIds: Array.from(leagueFamilyIds).sort((a, b) => a - b),
    };
  }

  const nowIso = new Date().toISOString();
  const normalizedPve = normalizePveSection(bundledMetaCache.pve);
  const pveFamilyIds = new Set(normalizedPve.familyIds || []);
  const combinedMetaFamilyIds = new Set([
    ...allPvpFamilyIds,
    ...pveFamilyIds,
    ...STAPLE_META_FAMILY_IDS,
  ]);

  const metaSnapshot = buildLiveMetaSnapshotOverlay(leagues, gmById, pokedexById, nowIso);

  return {
    lastUpdated: nowIso,
    source: {
      pvp: 'PvPoke Live GitHub Sync (Top 100 GL/UL/ML)',
      pve: 'DialgaDex eDPS / DPS Raid Meta Benchmarks',
    },
    pvp: leagues,
    pve: normalizedPve,
    combinedMetaFamilyIds: Array.from(combinedMetaFamilyIds).sort((a, b) => a - b),
    isLiveSynced: true,
    metaSnapshot,
  };
}

function hydrateStoredMetaCache(parsed) {
  if (!parsed || typeof parsed !== 'object' || !parsed.pvp || !parsed.pve) {
    return NORMALIZED_BUNDLED_CACHE;
  }
  const normalizedPve = normalizePveSection(parsed.pve);
  const hasSnapshot = parsed.metaSnapshot && parsed.metaSnapshot.pvp && parsed.metaSnapshot.pve;
  return {
    ...parsed,
    pve: normalizedPve,
    isLiveSynced: true,
    metaSnapshot: hasSnapshot
      ? parsed.metaSnapshot
      : buildLiveMetaSnapshotOverlay(parsed.pvp, null, new Map(), parsed.lastUpdated || bundledMetaSnapshot.generatedAt),
  };
}

export const metaCacheStore = createPersistentStore({
  key: LOCAL_STORAGE_META_KEY,
  getDefaultValue: () => NORMALIZED_BUNDLED_CACHE,
  deserialize: (raw) => hydrateStoredMetaCache(JSON.parse(raw)),
});

export function commitSyncedMetaCache(updatedCache) {
  metaCacheStore.setState(updatedCache);
  return updatedCache;
}

export function resetMetaCacheToBundled() {
  return metaCacheStore.reset();
}

export function getActiveMetaCache() {
  return metaCacheStore.getSnapshot();
}

export function getActiveMetaSnapshot(metaCache = metaCacheStore.getSnapshot()) {
  if (metaCache?.isLiveSynced && metaCache?.metaSnapshot?.pvp) {
    return metaCache.metaSnapshot;
  }
  return bundledMetaSnapshot;
}

export function computeMetaIdSets(metaCache, allPokedex = []) {
  const glIds = metaCache?.pvp?.great_league?.familyIds || [];
  const ulIds = metaCache?.pvp?.ultra_league?.familyIds || [];
  const mlIds = metaCache?.pvp?.master_league?.familyIds || [];
  const pveIds = metaCache?.pve?.familyIds || [];

  const glUlFamilySet = new Set([...glIds, ...ulIds]);
  const mlAndPveFamilySet = new Set([...mlIds, ...pveIds]);

  const allProtectedMetaSet = new Set([
    ...glIds,
    ...ulIds,
    ...mlIds,
    ...pveIds,
    ...STAPLE_META_FAMILY_IDS,
    ...PVP_MAX_OUT_XL_FAMILY_IDS,
    ...RARE_TRADE_REROLL_FAMILY_IDS,
    ...GLOBAL_REGIONAL_FAMILY_IDS,
  ]);

  const maxDexId = allPokedex.length > 0 ? allPokedex.length : MAX_POKEDEX_ID;
  const strictNonMetaIds = [];
  for (let id = 1; id <= maxDexId; id++) {
    if (!allProtectedMetaSet.has(id)) {
      strictNonMetaIds.push(id);
    }
  }

  const glUlFamilyIds = Array.from(glUlFamilySet).sort((a, b) => a - b);
  const mlAndPveFamilyIds = Array.from(mlAndPveFamilySet).sort((a, b) => a - b);
  const allProtectedMetaIds = Array.from(allProtectedMetaSet).sort((a, b) => a - b);

  const highIvRelevantSet = new Set([
    ...mlIds,
    ...pveIds,
    ...PVP_MAX_OUT_XL_FAMILY_IDS,
    ...RARE_TRADE_REROLL_FAMILY_IDS,
  ]);
  const pureCappedPvpFamilyIds = glUlFamilyIds.filter((id) => !highIvRelevantSet.has(id));

  return {
    glFamilyIds: glIds,
    ulFamilyIds: ulIds,
    mlFamilyIds: mlIds,
    pveFamilyIds: pveIds,
    glUlFamilyIds,
    mlAndPveFamilyIds,
    pureCappedPvpFamilyIds,
    pvpMaxOutXlFamilyIds: PVP_MAX_OUT_XL_FAMILY_IDS,
    rareTradeRerollFamilyIds: RARE_TRADE_REROLL_FAMILY_IDS,
    allProtectedMetaIds,
    strictNonMetaIds,
    ranges: {
      glUl: compressIdRanges(glUlFamilyIds),
      mlAndPve: compressIdRanges(mlAndPveFamilyIds),
      pureCappedPvp: compressIdRanges(pureCappedPvpFamilyIds),
      pvpMaxOutXl: compressIdRanges(PVP_MAX_OUT_XL_FAMILY_IDS),
      rareTradeReroll: compressIdRanges(RARE_TRADE_REROLL_FAMILY_IDS),
      allProtectedMeta: compressIdRanges(allProtectedMetaIds),
      strictNonMeta: compressIdRanges(strictNonMetaIds),
    },
  };
}
