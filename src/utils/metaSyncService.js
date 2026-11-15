import bundledMetaCache from '../data/meta_cache.json';
import { getFamilyIds } from './familyUtils';
import { compressIdRanges } from './searchUtils';
import { GLOBAL_REGIONAL_ROTOM_UNOWN_IDS } from '../data/eventAndTripRegistry';

const LOCAL_STORAGE_META_KEY = 'pogo_live_meta_cache_v1';

const PVPOKE_ENDPOINTS = {
  great_league: 'https://raw.githubusercontent.com/pvpoke/pvpoke/master/src/data/rankings/all/overall/rankings-1500.json',
  ultra_league: 'https://raw.githubusercontent.com/pvpoke/pvpoke/master/src/data/rankings/all/overall/rankings-2500.json',
  master_league: 'https://raw.githubusercontent.com/pvpoke/pvpoke/master/src/data/rankings/all/overall/rankings-10000.json',
};

// Level 50 XL Max-Out PvP Species where 3*,4* (near-hundo/hundo) is optimal in GL/UL instead of 0-1 Attack
const PVP_MAX_OUT_XL_BASE_IDS = [
  308, // Medicham
  411, // Bastiodon
  302, // Sableye
  703, // Carbink
  108, // Lickitung
  202, // Wobbuffet
  660, // Diggersby
  417, // Pachirisu
  222, // Corsola
  594, // Alomomola
  113, // Chansey
  663, // Talonflame
  197, // Umbreon
  630, // Mandibuzz
  18,  // Pidgeot
  618, // Stunfisk / Galarian Stunfisk
  227, // Skarmory
  593, // Jellicent
  460, // Abomasnow
  832, // Dubwool
  820, // Greedent
  346, // Cradily
  208, // Steelix
  426, // Drifblim
  863, // Perrserker
];

// Rare 10km egg / pseudo-legendary / special trade reroll species (worth mirror trading when 0*-2*)
const RARE_TRADE_REROLL_BASE_IDS = [
  996, // Frigibax -> Baxcalibur
  636, // Larvesta -> Volcarona
  885, // Dreepy -> Dragapult
  782, // Jangmo-o -> Kommo-o
  935, // Charcadet -> Armarouge / Ceruledge
  957, // Tinkatink -> Tinkaton
  965, // Varoom -> Revavroom
  757, // Salandit (Female)
  769, // Sandygast -> Palossand
  703, // Carbink
  374, // Beldum
  443, // Gible
  633, // Deino
  447, // Riolu -> Lucario
  246, // Larvitar
  371, // Bagon
  147, // Dratini
  610, // Axew
  704, // Goomy
  884, // Duraludon -> Archaludon
  840, // Applin -> Hydrapple
  999, // Gimmighoul -> Gholdengo
];

// Core staple PvP & PvE base IDs from meta_registry.py to guarantee zero season-rotation blind spots
const STAPLE_META_BASE_IDS = [
  // GL / UL Staples
  980, 195, 160, 630, 423, 663, 687, 982, 105, 702, 40, 703, 411, 108, 308, 497, 979,
  260, 340, 709, 184, 227, 28, 38, 488, 379, 799, 593, 334, 675, 477, 68, 660, 832,
  877, 706, 748, 346, 279, 171, 460, 452, 110, 618, 3, 6, 197, 302, 62, 395, 131,
  36, 911, 671, 487, 638, 640, 365, 18, 181, 73, 212, 472, 788, 208, 768, 820, 658,
  149, 468, 862, 699, 157, 143, 983, 130, 823,
  // ML & PvE Staples
  800, 484, 483, 645, 250, 718, 888, 889, 150, 383, 382, 384, 791, 792, 249, 445,
  376, 809, 716, 717, 464, 473, 530, 635, 998, 644, 643, 646, 730, 485, 491, 649,
  893, 901, 784, 612, 787, 786, 639, 798, 448, 248, 373, 409, 609, 534, 796, 806,
  793, 905, 637, 555, 94, 282, 257, 254, 719, 214, 9, 466, 462, 461, 407, 243, 244,
  146, 812, 815, 818, 242,
];

function expandToFamilies(baseIds) {
  const set = new Set();
  baseIds.forEach((id) => {
    getFamilyIds(id).forEach((fid) => set.add(fid));
  });
  return Array.from(set).sort((a, b) => a - b);
}

export const PVP_MAX_OUT_XL_FAMILY_IDS = expandToFamilies(PVP_MAX_OUT_XL_BASE_IDS);
export const RARE_TRADE_REROLL_FAMILY_IDS = expandToFamilies(RARE_TRADE_REROLL_BASE_IDS);
const STAPLE_META_FAMILY_IDS = expandToFamilies(STAPLE_META_BASE_IDS);

function buildNameToIdMap(pokedex) {
  const map = new Map();
  pokedex.forEach((p) => {
    const clean = p.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    map.set(clean, p.id);
    const base = p.name.toLowerCase().split('-')[0].replace(/[^a-z0-9]/g, '');
    if (!map.has(base)) {
      map.set(base, p.id);
    }
  });

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
  Object.entries(manualOverrides).forEach(([k, v]) => map.set(k, v));
  return map;
}

function resolveDexId(speciesId, speciesName, nameMap) {
  const raw = (speciesId || speciesName || '').toLowerCase();
  const stripped = raw
    .replace(/_shadow$/i, '')
    .replace(/_xl$/i, '')
    .split('_')[0]
    .replace(/[^a-z0-9]/g, '');

  if (nameMap.has(stripped)) {
    return nameMap.get(stripped);
  }

  const fullClean = raw
    .replace(/shadow/g, '')
    .replace(/alolan|galarian|hisuian|paldean|origin|altered|therian|incarnate|complete|hero|crowned|dusk|dawn|mane|wings|standard|zen|ordinary|resolute|aria|pirouette|burn|chill|douse|shock|wash|heat|frost|fan|mow|plant|sandy|trash|sunny|rainy|snowy|attack|defense|speed|black|white|female|male|large|small|super|average|50|10|apex/g, '')
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

function formatMoveName(moveSlug) {
  if (!moveSlug) return '';
  return moveSlug
    .toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/**
 * Loads the active Meta Cache (from localStorage if synced live, falling back to bundled meta_cache.json).
 */
export function getActiveMetaCache() {
  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_META_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.pvp && parsed.pve) {
        return { ...parsed, isLiveSynced: true };
      }
    }
  } catch (err) {
    console.warn('Failed to read live meta cache from localStorage:', err);
  }
  return { ...bundledMetaCache, isLiveSynced: false };
}

/**
 * Fetches Top 100 Great League, Top 100 Ultra League, and Top 100 Master League live from PvPoke GitHub,
 * merges with DialgaDex PvE benchmarks, expands all evolutionary families, and caches in localStorage.
 */
export async function syncLivePvPokeAndDialgaDex(pokedex) {
  const nameMap = buildNameToIdMap(pokedex);
  const leagues = {};
  const allPvpFamilyIds = new Set();

  for (const [leagueKey, url] of Object.entries(PVPOKE_ENDPOINTS)) {
    const res = await fetch(url, { cache: 'no-cache' });
    if (!res.ok) {
      throw new Error(`PvPoke HTTP ${res.status} for ${leagueKey}`);
    }
    const data = await res.json();

    const topEntries = [];
    const leagueDexIds = new Set();
    const leagueFamilyIds = new Set();

    // Collect until we have 100 ranked entries AND at least 85 unique species
    for (let i = 0; i < data.length && (topEntries.length < 100 || leagueDexIds.size < 85) && i < 160; i++) {
      const item = data[i];
      const dexId = resolveDexId(item.speciesId, item.speciesName, nameMap);
      if (!dexId) continue;

      const familyIds = getFamilyIds(dexId);
      leagueDexIds.add(dexId);
      familyIds.forEach((fid) => {
        leagueFamilyIds.add(fid);
        allPvpFamilyIds.add(fid);
      });

      if (topEntries.length < 100) {
        const moveset = item.moveset || [];
        topEntries.push({
          rank: topEntries.length + 1,
          speciesId: item.speciesId,
          speciesName: item.speciesName || item.speciesId.replace(/_/g, ' '),
          dexId,
          familyIds,
          score: item.score || 0,
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

  const pveFamilyIds = new Set(bundledMetaCache.pve.familyIds || []);
  const combinedMetaFamilyIds = new Set([
    ...allPvpFamilyIds,
    ...pveFamilyIds,
    ...STAPLE_META_FAMILY_IDS,
  ]);

  const updatedCache = {
    lastUpdated: new Date().toISOString(),
    source: {
      pvp: 'PvPoke Live GitHub Sync (Top 100 GL/UL/ML)',
      pve: 'DialgaDex eDPS / DPS Raid Meta Benchmarks',
    },
    pvp: leagues,
    pve: bundledMetaCache.pve,
    combinedMetaFamilyIds: Array.from(combinedMetaFamilyIds).sort((a, b) => a - b),
    isLiveSynced: true,
  };

  try {
    window.localStorage.setItem(LOCAL_STORAGE_META_KEY, JSON.stringify(updatedCache));
  } catch (err) {
    console.warn('Could not save synced meta cache to localStorage:', err);
  }

  return updatedCache;
}

/**
 * Computes conflict-free ID sets and compressed search string ranges from the active Meta Cache:
 * - Great + Ultra League Top 100 Family IDs
 * - Master League Top 100 + DialgaDex PvE Family IDs
 * - All Protected Meta Family IDs (GL ∪ UL ∪ ML ∪ PvE ∪ Rare Trade Rerolls)
 * - Strict Non-Meta IDs (Every Pokédex ID 1..1025 that has ZERO overlap with GL, UL, ML, PvE, or Rare Trade Rerolls)
 */
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
    ...expandToFamilies(GLOBAL_REGIONAL_ROTOM_UNOWN_IDS),
  ]);

  const maxDexId = allPokedex.length > 0 ? allPokedex.length : 1025;
  const strictNonMetaIds = [];
  for (let id = 1; id <= maxDexId; id++) {
    if (!allProtectedMetaSet.has(id)) {
      strictNonMetaIds.push(id);
    }
  }

  const glUlFamilyIds = Array.from(glUlFamilySet).sort((a, b) => a - b);
  const mlAndPveFamilyIds = Array.from(mlAndPveFamilySet).sort((a, b) => a - b);
  const allProtectedMetaIds = Array.from(allProtectedMetaSet).sort((a, b) => a - b);

  // Pure CP-capped PvP bulk families (in GL/UL Top 100, but NEVER in ML Top 100, DialgaDex PvE, XL Max-Out, or Rare Trade)
  // On these species, 3* catches with high attack (2-4attack) have neither Raid/ML utility nor optimal PvP stat product.
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
