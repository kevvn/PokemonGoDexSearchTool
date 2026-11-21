import fs from 'fs';
import path from 'path';
import process from 'node:process';
import { fileURLToPath } from 'url';
import {
  fetchWithRetry,
  writeJsonAtomically,
  VALID_TYPES,
  EXPECTED_POKEDEX_COUNT,
} from './fetch_data.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const ALL_TYPES = [...VALID_TYPES].sort();

export const PVPOKE_BASE = 'https://raw.githubusercontent.com/pvpoke/pvpoke/master/src/data';
export const PVPOKE_URLS = {
  gamemaster: `${PVPOKE_BASE}/gamemaster/pokemon.json`,
  gl: `${PVPOKE_BASE}/rankings/all/overall/rankings-1500.json`,
  ul: `${PVPOKE_BASE}/rankings/all/overall/rankings-2500.json`,
  ml: `${PVPOKE_BASE}/rankings/all/overall/rankings-10000.json`,
};

export const POKEBATTLER_URLS = {
  pokemon: 'https://fight.pokebattler.com/pokemon',
  moves: 'https://fight.pokebattler.com/moves',
};

export const POKEMINERS_GAMEMASTER_URL =
  'https://raw.githubusercontent.com/PokeMiners/game_masters/master/latest/latest.json';

export const POKECHESPIN_CALC_URL =
  'https://raw.githubusercontent.com/CreatorBeastGD/pokechespin/main/lib/calculations.ts';

export const SPECIAL_LISTS = {
  candy12Fodder: [10, 13, 16, 265, 293, 519],
  tradeEvolve: [64, 67, 75, 93, 525, 533, 588, 616, 708, 710],
};

// Level 40 CPM in Pokémon GO
const LEVEL_40_CPM = 0.79030001;
const SHADOW_ATK_MULT = 1.2;
const SHADOW_DEF_MULT = 1 / 1.2;
const STAB_MULT = 1.2;
const SUPER_EFFECTIVE_MULT = 1.6;
const BOSS_DEF_BENCHMARK = 180;
const BOSS_INCOMING_Y_NUM = 1340;
const BOSS_INCOMING_CM_NUM = 11670;
const BOSS_HP_BENCHMARK = 15000;
const RESPAWN_TIME_S = 1.0;
const RELOBBY_TIME_S = 10.0;

// G-Max signature move types (locked to one type per G-Max species)
const GMAX_MOVE_TYPE_MAP = {
  VENUSAUR_GIGANTAMAX: 'grass',
  CHARIZARD_GIGANTAMAX: 'fire',
  BLASTOISE_GIGANTAMAX: 'water',
  BUTTERFREE_GIGANTAMAX: 'bug',
  PIKACHU_GIGANTAMAX: 'electric',
  MEOWTH_GIGANTAMAX: 'normal',
  MACHAMP_GIGANTAMAX: 'fighting',
  GENGAR_GIGANTAMAX: 'ghost',
  KINGLER_GIGANTAMAX: 'water',
  LAPRAS_GIGANTAMAX: 'ice',
  EEVEE_GIGANTAMAX: 'normal',
  SNORLAX_GIGANTAMAX: 'normal',
  GARBODOR_GIGANTAMAX: 'poison',
  MELMETAL_GIGANTAMAX: 'steel',
  RILLABOOM_GIGANTAMAX: 'grass',
  CINDERACE_GIGANTAMAX: 'fire',
  INTELEON_GIGANTAMAX: 'water',
  CORVIKNIGHT_GIGANTAMAX: 'flying',
  ORBEETLE_GIGANTAMAX: 'psychic',
  DREDNAW_GIGANTAMAX: 'water',
  COALOSSAL_GIGANTAMAX: 'rock',
  FLAPPLE_GIGANTAMAX: 'grass',
  APPLETUN_GIGANTAMAX: 'grass',
  SANDACONDA_GIGANTAMAX: 'ground',
  TOXTRICITY_GIGANTAMAX: 'electric',
  CENTISKORCH_GIGANTAMAX: 'fire',
  HATTERENE_GIGANTAMAX: 'fairy',
  GRIMMSNARL_GIGANTAMAX: 'dark',
  ALCREMIE_GIGANTAMAX: 'fairy',
  COPPERAJAH_GIGANTAMAX: 'steel',
  DURALUDON_GIGANTAMAX: 'dragon',
  URSHIFU_SINGLE_STRIKE_GIGANTAMAX: 'dark',
  URSHIFU_RAPID_STRIKE_GIGANTAMAX: 'water',
};

const SPECIAL_MOVE_NAME_OVERRIDES = {
  LOCK_ON_FAST: 'Lock-On',
  X_SCISSOR: 'X-Scissor',
  V_CREATE: 'V-create',
  MULTI_ATTACK: 'Multi-Attack',
  POWER_UP_PUNCH: 'Power-Up Punch',
  FREEZE_DRY: 'Freeze-Dry',
  MUD_SLAP_FAST: 'Mud-Slap',
  DOUBLE_IRON_BASH: 'Double Iron Bash',
};

export function normalizeType(rawType) {
  if (!rawType) return null;
  const cleaned = String(rawType).replace(/^POKEMON_TYPE_/i, '').toLowerCase();
  return VALID_TYPES.has(cleaned) ? cleaned : null;
}

export function formatMoveDisplayName(moveId) {
  if (!moveId) return '';
  if (SPECIAL_MOVE_NAME_OVERRIDES[moveId]) {
    return SPECIAL_MOVE_NAME_OVERRIDES[moveId];
  }
  const stripped = String(moveId).replace(/_FAST$/, '');
  return stripped
    .split('_')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export function sortUniqueInts(arr) {
  return [...new Set(arr.filter((n) => Number.isInteger(n) && n >= 1 && n <= EXPECTED_POKEDEX_COUNT))].sort(
    (a, b) => a - b
  );
}

export function expandFamilyDexes(dexIds, pokedexById) {
  const expanded = [];
  for (const dex of dexIds) {
    const entry = pokedexById.get(dex);
    if (entry && Array.isArray(entry.familyDexes) && entry.familyDexes.length > 0) {
      expanded.push(...entry.familyDexes);
    } else if (Number.isInteger(dex) && dex >= 1 && dex <= EXPECTED_POKEDEX_COUNT) {
      expanded.push(dex);
    }
  }
  return sortUniqueInts(expanded);
}

// ============================================================================
// 1. PvP Pipeline (PvPoke MIT)
// ============================================================================

export function buildPvpMeta(gamemasterPokemon, rankingsByLeague, pokedexById, topN = 100) {
  const gmById = new Map();
  for (const p of gamemasterPokemon) {
    if (p?.speciesId) gmById.set(p.speciesId, p);
  }

  const processCappedLeague = (rankings, cpKey) => {
    const slice = (rankings || []).slice(0, topN);
    const allRaw = [];
    const lowAtkRaw = [];
    const highAtkRaw = [];
    const shadowRaw = [];
    const tradeRerollRaw = [];

    for (const entry of slice) {
      const gm = gmById.get(entry.speciesId);
      if (!gm || !Number.isInteger(gm.dex)) continue;
      const dex = gm.dex;
      const tags = Array.isArray(gm.tags) ? gm.tags : [];
      const isShadow = tags.includes('shadow') || entry.speciesId.endsWith('_shadow');
      const isUntradeable = tags.includes('untradeable');
      const pokedexEntry = pokedexById.get(dex);
      const isSpecialClass =
        tags.includes('legendary') ||
        tags.includes('mythical') ||
        tags.includes('ultrabeast') ||
        (pokedexEntry && pokedexEntry.pokemonClass !== 'standard');

      allRaw.push(dex);
      if (isShadow) shadowRaw.push(dex);

      const defaultIv = gm.defaultIVs?.[cpKey];
      if (Array.isArray(defaultIv) && typeof defaultIv[1] === 'number') {
        if (defaultIv[1] <= 5) lowAtkRaw.push(dex);
        else highAtkRaw.push(dex);
      } else {
        // Fallback when defaultIVs is omitted: assume standard low-atk build
        lowAtkRaw.push(dex);
      }

      if (!isShadow && !isUntradeable && isSpecialClass) {
        tradeRerollRaw.push(dex);
      }
    }

    return {
      all: expandFamilyDexes(allRaw, pokedexById),
      lowAtk: expandFamilyDexes(lowAtkRaw, pokedexById),
      highAtk: expandFamilyDexes(highAtkRaw, pokedexById),
      shadow: expandFamilyDexes(shadowRaw, pokedexById),
      tradeReroll: expandFamilyDexes(tradeRerollRaw, pokedexById),
    };
  };

  const processMasterLeague = (rankings) => {
    const slice = (rankings || []).slice(0, topN);
    const allRaw = [];
    const shadowRaw = [];

    for (const entry of slice) {
      const gm = gmById.get(entry.speciesId);
      if (!gm || !Number.isInteger(gm.dex)) continue;
      const tags = Array.isArray(gm.tags) ? gm.tags : [];
      const isShadow = tags.includes('shadow') || entry.speciesId.endsWith('_shadow');
      allRaw.push(gm.dex);
      if (isShadow) shadowRaw.push(gm.dex);
    }

    return {
      all: expandFamilyDexes(allRaw, pokedexById),
      shadow: expandFamilyDexes(shadowRaw, pokedexById),
    };
  };

  const glTop100 = processCappedLeague(rankingsByLeague.gl, 'cp1500');
  const ulTop100 = processCappedLeague(rankingsByLeague.ul, 'cp2500');
  const mlTop100 = processMasterLeague(rankingsByLeague.ml);

  return {
    gl: { top100: glTop100 },
    ul: { top100: ulTop100 },
    ml: { top100: mlTop100 },
    allShadow: sortUniqueInts([...glTop100.shadow, ...ulTop100.shadow, ...mlTop100.shadow]),
    allTradeReroll: sortUniqueInts([...glTop100.tradeReroll, ...ulTop100.tradeReroll]),
  };
}

// ============================================================================
// 2. Clean-Room PvE Raid Attacker Calculator (Pokebattler / PokeMiners)
// ============================================================================

export function isShadowPokemonId(pokemonId) {
  return /_SHADOW(_FORM)?$/.test(pokemonId || '');
}

export function isMegaOrPrimalPokemonId(pokemonId) {
  return /(_MEGA(_[XYZ])?|_PRIMAL)$/.test(pokemonId || '');
}

export function isExcludedPveForm(pokemonId) {
  if (!pokemonId) return true;
  return (
    /_GIGANTAMAX$/.test(pokemonId) ||
    /_PURIFIED(_FORM)?$/.test(pokemonId) ||
    /_3_PERCENT_MEGA/.test(pokemonId) ||
    /_ETERNAMAX/.test(pokemonId) ||
    /_ULTRA_FORM$/.test(pokemonId) ||
    /_ZEN_FORM$/.test(pokemonId) ||
    /_SHADOW_RIDER_FORM$/.test(pokemonId) ||
    /_ICE_RIDER_FORM$/.test(pokemonId) ||
    /_HERO_FORM$/.test(pokemonId) ||
    /_MEGA_Z$/.test(pokemonId) ||
    /_MEGA_COMPLETE$/.test(pokemonId) ||
    /_MEGA_C$/.test(pokemonId) ||
    /MEWTWO_A_FORM/.test(pokemonId) ||
    /COSTUME|FALL_2019|GOFEST|WINTER_|SPRING_|SUMMER_|WILDAREA|SWIM_/.test(pokemonId)
  );
}

/**
 * Clean-room Comprehensive DPS, TDO, ER (DPS^0.75 * TDO^0.25), and relobby-adjusted eDPS
 * based on public Pokémon GO combat damage mechanics at Level 40 (15/15/15 IVs).
 */
export function computeComprehensiveDpsTdo(attacker, fastMove, chargedMove, attackingType = null) {
  if (!attacker?.stats || !fastMove || !chargedMove) return null;

  const baseAtk = Number(attacker.stats.baseAttack || 0);
  const baseDef = Number(attacker.stats.baseDefense || 0);
  const baseSta = Number(attacker.stats.baseStamina || 0);
  if (baseAtk <= 0 || baseDef <= 0 || baseSta <= 0) return null;

  const isShadow = Boolean(attacker.isShadow);

  const effAtk = (baseAtk + 15) * LEVEL_40_CPM * (isShadow ? SHADOW_ATK_MULT : 1);
  const effDef = (baseDef + 15) * LEVEL_40_CPM * (isShadow ? SHADOW_DEF_MULT : 1);
  const effHp = Math.floor((baseSta + 15) * LEVEL_40_CPM);

  const fDur = (fastMove.durationMs || 0) / 1000;
  const cDur = (chargedMove.durationMs || 0) / 1000;
  const fPower = Number(fastMove.power || 0);
  const cPower = Number(chargedMove.power || 0);
  const fEnergy = Number(fastMove.energyDelta || 0);
  const cEnergyCost = Math.abs(Number(chargedMove.energyDelta || 0));

  if (fDur <= 0 || cDur <= 0 || cPower <= 0 || cEnergyCost <= 0) return null;

  const fType = normalizeType(fastMove.type);
  const cType = normalizeType(chargedMove.type);
  const attackerTypes = attacker.types || [];

  const fStab = fType && attackerTypes.includes(fType) ? STAB_MULT : 1.0;
  const cStab = cType && attackerTypes.includes(cType) ? STAB_MULT : 1.0;

  // Against a raid boss weak to attackingType (or neutral 1.0 if overall)
  const fEff = attackingType ? (fType === attackingType ? SUPER_EFFECTIVE_MULT : 1.0) : 1.0;
  const cEff = attackingType ? (cType === attackingType ? SUPER_EFFECTIVE_MULT : 1.0) : 1.0;

  const fDmg = 0.5 * fPower * (effAtk / BOSS_DEF_BENCHMARK) * fStab * fEff + 0.5;
  const cDmg = 0.5 * cPower * (effAtk / BOSS_DEF_BENCHMARK) * cStab * cEff + 0.5;

  const fDps = fDmg / fDur;
  const fEps = Math.max(fEnergy, 0.1) / fDur;
  const cDps = cDmg / cDur;

  const incomingY = BOSS_INCOMING_Y_NUM / effDef;
  const incomingCmDmg = BOSS_INCOMING_CM_NUM / effDef;
  const dws = (chargedMove.damageWindowStartMs || cDur * 500) / 1000;
  const effectiveCEnergy = cEnergyCost >= 100 ? cEnergyCost + 0.5 * fEnergy + 0.5 * incomingY * dws : cEnergyCost;
  const cEps = effectiveCEnergy / cDur;

  // Cycle DPS + energy-on-hit adjustment (penalizing glassy attackers that faint with wasted energy)
  const cycleDps = (fDps * cEps + cDps * fEps) / (cEps + fEps);
  const x = 0.5 * cEnergyCost + 0.5 * fEnergy + 0.5 * incomingCmDmg;
  const rawCompDps = cycleDps + ((cDps - fDps) / (cEps + fEps)) * (0.5 - x / effHp) * incomingY;
  const compDps = Math.max(fDps, Math.min(Math.max(fDps, cDps), rawCompDps));

  const timeOnField = effHp / incomingY;
  const tdo = compDps * timeOnField;
  const er = Math.pow(compDps, 0.75) * Math.pow(Math.max(tdo, 1), 0.25);

  // Relobby-adjusted eDPS across a standard 6-slot raid party
  const teamSize = 6;
  const lives = BOSS_HP_BENCHMARK / Math.max(tdo, 1);
  const deaths = Math.max(0, lives - 0.5);
  const relobbies = Math.max(0, deaths / teamSize - 0.5);
  const ttw = lives * timeOnField + Math.max(0, deaths - relobbies) * RESPAWN_TIME_S + relobbies * RELOBBY_TIME_S;
  const edps = BOSS_HP_BENCHMARK / Math.max(ttw, 1);

  return { dps: compDps, tdo, er, edps };
}

export function pokebattlerShadowToPvpokeId(pokemonId) {
  return String(pokemonId || '')
    .replace(/_SHADOW_FORM$/, '_SHADOW')
    .replace(/_FORM$/, '')
    .replace(/_ALOLA_SHADOW$/, '_alolan_shadow')
    .replace(/_GALARIAN_SHADOW$/, '_galarian_shadow')
    .replace(/_HISUIAN_SHADOW$/, '_hisuian_shadow')
    .toLowerCase();
}

export function buildPveMeta(pbPokemon, pbMoves, pokedex, releasedSets) {
  const pokedexById = new Map(pokedex.map((p) => [p.id, p]));
  const moveById = new Map();
  for (const m of pbMoves || []) {
    if (m?.moveId) moveById.set(m.moveId, m);
  }

  const releasedDexes = releasedSets?.releasedDexes || new Set(pokedex.map((p) => p.id));
  const releasedShadowIds = releasedSets?.releasedShadowIds || null;
  const releasedShadows = releasedSets?.releasedShadows || new Set();
  const releasedMegas = releasedSets?.releasedMegas || new Set(pokedex.filter((p) => p.hasMega).map((p) => p.id));

  // Normalize eligible attacker forms
  const candidates = [];
  for (const raw of pbPokemon || []) {
    const pid = raw?.pokemonId;
    const dex = raw?.pokedex?.pokemonNum;
    if (!pid || !Number.isInteger(dex) || dex < 1 || dex > EXPECTED_POKEDEX_COUNT) continue;
    if (isExcludedPveForm(pid)) continue;
    if (!releasedDexes.has(dex)) continue;

    const isShadow = isShadowPokemonId(pid);
    const isMega = isMegaOrPrimalPokemonId(pid);
    if (isShadow) {
      if (releasedShadowIds) {
        const pvpId = pokebattlerShadowToPvpokeId(pid);
        if (!releasedShadowIds.has(pvpId)) continue;
      } else if (!releasedShadows.has(dex)) {
        continue;
      }
    }
    if (isMega && !releasedMegas.has(dex)) continue;

    const types = [normalizeType(raw.type), normalizeType(raw.type2)].filter(Boolean);
    const fastMoveIds = [...new Set([...(raw.quickMoves || []), ...(raw.eliteQuickMove || [])])].filter(
      (id) => id && id !== 'TRANSFORM_FAST' && id !== 'HIDDEN_POWER_FAST' && id !== 'SPLASH_FAST'
    );
    const chargedMoveIds = [...new Set([...(raw.cinematicMoves || []), ...(raw.eliteCinematicMove || [])])].filter(
      (id) => id && id !== 'FRUSTRATION' && id !== 'RETURN' && id !== 'STRUGGLE'
    );

    if (fastMoveIds.length === 0 || chargedMoveIds.length === 0) continue;

    candidates.push({
      pokemonId: pid,
      dex,
      types,
      isShadow,
      isMega,
      stats: raw.stats,
      fastMoves: fastMoveIds.map((id) => moveById.get(id)).filter(Boolean),
      chargedMoves: chargedMoveIds.map((id) => moveById.get(id)).filter(Boolean),
    });
  }

  const scoreCandidate = (cand, targetType) => {
    let best = null;
    for (const fm of cand.fastMoves) {
      const fType = normalizeType(fm.type);
      for (const cm of cand.chargedMoves) {
        const cType = normalizeType(cm.type);
        // For per-type attacker lists, require charged move to match the attacking type
        // (and prefer same-type fast move, though off-type fast moves with massive charged moves like Dragon Ascent/Moongeist Beam/Sunsteel Strike are allowed!)
        if (targetType && cType !== targetType) continue;
        // Avoid junk off-type fast moves unless charged move gets STAB or huge power
        if (targetType && fType !== targetType && !cand.types.includes(targetType)) continue;

        const metrics = computeComprehensiveDpsTdo(cand, fm, cm, targetType);
        if (!metrics) continue;
        // Blend ER and eDPS cleanly so both burst DPS and real raid survivability shine
        const score = metrics.er * 0.65 + metrics.edps * 0.35;
        if (!best || score > best.score) {
          best = { ...metrics, score, fm: fm.moveId, cm: cm.moveId };
        }
      }
    }
    return best;
  };

  // 1. Top 10 unique species (dex) per type across all 18 types -> family-expanded
  const byType = {};
  const debugTopByType = {};
  for (const type of ALL_TYPES) {
    const bestByDex = new Map();
    for (const cand of candidates) {
      const res = scoreCandidate(cand, type);
      if (!res) continue;
      const existing = bestByDex.get(cand.dex);
      if (!existing || res.score > existing.score) {
        bestByDex.set(cand.dex, { dex: cand.dex, pokemonId: cand.pokemonId, score: res.score, fm: res.fm, cm: res.cm });
      }
    }
    const top10 = [...bestByDex.values()].sort((a, b) => b.score - a.score).slice(0, 10);
    byType[type] = expandFamilyDexes(
      top10.map((x) => x.dex),
      pokedexById
    );
    debugTopByType[type] = top10.slice(0, 5).map((x) => `${x.pokemonId}(#${x.dex})`);
  }

  // 2. Top 30 Overall Raid Attackers (best neutral / type-agnostic performance, unique by dex)
  const overallByDex = new Map();
  const shadowByDex = new Map();
  const megaByDex = new Map();

  for (const cand of candidates) {
    // Score each candidate at its strongest attacking type (reflecting how players use type-specialist raiders)
    const candidateTypes = [...new Set([...cand.types, ...cand.chargedMoves.map((m) => normalizeType(m.type)).filter(Boolean)])];
    let bestAcrossTypes = null;
    for (const t of candidateTypes) {
      if (t === 'normal') continue; // Normal is never super-effective in raids
      const res = scoreCandidate(cand, t);
      if (res && (!bestAcrossTypes || res.score > bestAcrossTypes.score)) {
        bestAcrossTypes = { ...res, type: t };
      }
    }
    if (!bestAcrossTypes) continue;

    const record = { dex: cand.dex, pokemonId: cand.pokemonId, score: bestAcrossTypes.score, type: bestAcrossTypes.type };

    const curOverall = overallByDex.get(cand.dex);
    if (!curOverall || record.score > curOverall.score) overallByDex.set(cand.dex, record);

    if (cand.isShadow) {
      const curShadow = shadowByDex.get(cand.dex);
      if (!curShadow || record.score > curShadow.score) shadowByDex.set(cand.dex, record);
    }
    if (cand.isMega) {
      const curMega = megaByDex.get(cand.dex);
      if (!curMega || record.score > curMega.score) megaByDex.set(cand.dex, record);
    }
  }

  const top30OverallRaw = [...overallByDex.values()].sort((a, b) => b.score - a.score).slice(0, 30);
  const topShadowRaw = [...shadowByDex.values()].sort((a, b) => b.score - a.score).slice(0, 25);
  const topMegaRaw = [...megaByDex.values()].sort((a, b) => b.score - a.score).slice(0, 25);

  const topMegaEvolved = sortUniqueInts(topMegaRaw.map((x) => x.dex));

  return {
    meta: {
      top30Overall: expandFamilyDexes(
        top30OverallRaw.map((x) => x.dex),
        pokedexById
      ),
      topShadow: expandFamilyDexes(
        topShadowRaw.map((x) => x.dex),
        pokedexById
      ),
      topMegaEvolved,
      topMegaFamily: expandFamilyDexes(topMegaEvolved, pokedexById),
      byType,
    },
    debug: {
      topByType: debugTopByType,
      top10Overall: top30OverallRaw.slice(0, 10).map((x) => `${x.pokemonId}(#${x.dex})`),
      top10Shadow: topShadowRaw.slice(0, 10).map((x) => `${x.pokemonId}(#${x.dex})`),
      top10Mega: topMegaRaw.slice(0, 10).map((x) => `${x.pokemonId}(#${x.dex})`),
    },
  };
}

// ============================================================================
// 3. Max Battles Pipeline (PokéChespin MIT + Pokebattler)
// ============================================================================

export function parsePokechespinMaxLists(tsSource) {
  if (typeof tsSource !== 'string' || tsSource.length < 100) {
    throw new Error('Invalid PokéChespin calculations.ts payload');
  }

  const parseArray = (varName) => {
    const regex = new RegExp(`static\\s+${varName}\\s*=\\s*\\[([\\s\\S]*?)\\]`, 'm');
    const match = tsSource.match(regex);
    if (!match) {
      throw new Error(`Could not find ${varName} array in PokéChespin calculations.ts`);
    }
    const items = [];
    const strRegex = /"([A-Z0-9_]+)"/g;
    let m;
    while ((m = strRegex.exec(match[1])) !== null) {
      items.push(m[1]);
    }
    return [...new Set(items)];
  };

  const dynamaxPokemon = parseArray('DynamaxPokemon');
  const upcomingGmaxPokemon = parseArray('UpcomingGMaxPokemon');

  // Strict anchor assertions so silent upstream refactors fail fast
  const requiredAnchors = [
    'BLISSEY',
    'CHARIZARD_GIGANTAMAX',
    'ZACIAN_CROWNED_SWORD_FORM',
    'ZAMAZENTA_CROWNED_SHIELD_FORM',
    'ETERNATUS',
  ];
  for (const anchor of requiredAnchors) {
    if (!dynamaxPokemon.includes(anchor)) {
      throw new Error(`PokéChespin DynamaxPokemon missing required anchor: ${anchor}`);
    }
  }
  if (dynamaxPokemon.length < 100) {
    throw new Error(`PokéChespin DynamaxPokemon unexpectedly short (${dynamaxPokemon.length})`);
  }

  return { dynamaxPokemon, upcomingGmaxPokemon };
}

export function extractFastMoves500ms(pbMoves) {
  const names = new Set();
  for (const m of pbMoves || []) {
    if (
      m?.moveId?.endsWith('_FAST') &&
      m.durationMs === 500 &&
      m.moveId !== 'HIDDEN_POWER_FAST' &&
      m.moveId !== 'TRANSFORM_FAST'
    ) {
      names.add(formatMoveDisplayName(m.moveId));
    }
  }
  return [...names].sort((a, b) => a.localeCompare(b));
}

export function buildMaxBattlesMeta(dynamaxIds, pbPokemon, pbMoves, pokedexById) {
  const pbById = new Map();
  for (const p of pbPokemon || []) {
    if (p?.pokemonId) pbById.set(p.pokemonId, p);
  }
  const moveById = new Map();
  for (const m of pbMoves || []) {
    if (m?.moveId) moveById.set(m.moveId, m);
  }

  const fastMoves500ms = extractFastMoves500ms(pbMoves);

  const attackerScoresByType = new Map();
  const overallAttackerScores = new Map();
  const tankScores = new Map();
  const healerScores = new Map();

  for (const pid of dynamaxIds) {
    const p = pbById.get(pid);
    if (!p?.stats || !Number.isInteger(p.pokedex?.pokemonNum)) continue;
    const dex = p.pokedex.pokemonNum;
    const types = [normalizeType(p.type), normalizeType(p.type2)].filter(Boolean);
    const effAtk = (p.stats.baseAttack + 15) * LEVEL_40_CPM;
    const effDef = (p.stats.baseDefense + 15) * LEVEL_40_CPM;
    const effSta = Math.floor((p.stats.baseStamina + 15) * LEVEL_40_CPM);

    const quickMoves = [...new Set([...(p.quickMoves || []), ...(p.eliteQuickMove || [])])]
      .map((id) => moveById.get(id))
      .filter(Boolean);
    const has500msMove = quickMoves.some((m) => m.durationMs === 500);

    // 1. Max Attacker Scoring
    const isGmax = pid.endsWith('_GIGANTAMAX');
    const isEternatus = pid === 'ETERNATUS';
    const isCrownedZacian = pid === 'ZACIAN_CROWNED_SWORD_FORM';
    const isCrownedZamazenta = pid === 'ZAMAZENTA_CROWNED_SHIELD_FORM';

    const maxBasePower = isGmax || isEternatus ? 450 : 350;
    let attackTypes = [];
    if (isGmax && GMAX_MOVE_TYPE_MAP[pid]) {
      attackTypes = [GMAX_MOVE_TYPE_MAP[pid]];
    } else if (isEternatus) {
      attackTypes = ['dragon'];
    } else if (isCrownedZacian || isCrownedZamazenta) {
      attackTypes = ['steel'];
    } else {
      attackTypes = [...new Set(quickMoves.map((m) => normalizeType(m.type)).filter(Boolean))];
    }

    for (const aType of attackTypes) {
      const stab = types.includes(aType) ? STAB_MULT : 1.0;
      const atkScore = effAtk * maxBasePower * stab;

      if (!attackerScoresByType.has(aType)) attackerScoresByType.set(aType, new Map());
      const typeMap = attackerScoresByType.get(aType);
      const prev = typeMap.get(dex);
      if (!prev || atkScore > prev.score) {
        typeMap.set(dex, { dex, pid, score: atkScore });
      }

      const prevOverall = overallAttackerScores.get(dex);
      if (!prevOverall || atkScore > prevOverall.score) {
        overallAttackerScores.set(dex, { dex, pid, score: atkScore });
      }
    }

    // 2. Max Tank Scoring (Bulk = effDef * effSta; 0.5s fast move is critical for Max Meter charging)
    // Crowned Shield Zamazenta starts with an extra free shield in Max Battles
    const speedMultiplier = has500msMove ? 1.65 : 0.75;
    const shieldBonus = isCrownedZamazenta ? 1.35 : 1.0;
    const bulkScore = effDef * effSta * speedMultiplier * shieldBonus;
    const prevTank = tankScores.get(dex);
    if (!prevTank || bulkScore > prevTank.score) {
      tankScores.set(dex, { dex, pid, score: bulkScore, has500msMove });
    }

    // 3. Max Healer Scoring (Max Spirit Lv3 heals 16% of caster's Max HP -> effSta dominates!)
    const healScore = effSta * (has500msMove ? 1.25 : 0.85);
    const prevHealer = healerScores.get(dex);
    if (!prevHealer || healScore > prevHealer.score) {
      healerScores.set(dex, { dex, pid, score: healScore, effSta, has500msMove });
    }
  }

  // Pick top 2 attackers per type + top 12 overall attackers
  const topAttackerDexes = new Set();
  for (const [type, typeMap] of attackerScoresByType.entries()) {
    if (type === 'normal') continue;
    const sorted = [...typeMap.values()].sort((a, b) => b.score - a.score).slice(0, 2);
    for (const item of sorted) topAttackerDexes.add(item.dex);
  }
  const topOverallAtk = [...overallAttackerScores.values()].sort((a, b) => b.score - a.score).slice(0, 12);
  for (const item of topOverallAtk) topAttackerDexes.add(item.dex);

  const topTanks = [...tankScores.values()].sort((a, b) => b.score - a.score).slice(0, 14);
  const topHealers = [...healerScores.values()].sort((a, b) => b.score - a.score).slice(0, 6);

  const attackers = expandFamilyDexes([...topAttackerDexes], pokedexById);
  const tanks = expandFamilyDexes(
    topTanks.map((x) => x.dex),
    pokedexById
  );
  const healers = expandFamilyDexes(
    topHealers.map((x) => x.dex),
    pokedexById
  );
  const tanksAndHealers = sortUniqueInts([...tanks, ...healers]);

  return {
    meta: {
      attackers,
      tanks,
      healers,
      tanksAndHealers,
      fastMoves500ms,
    },
    debug: {
      top10Attackers: topOverallAtk.slice(0, 10).map((x) => `${x.pid}(#${x.dex})`),
      top10Tanks: topTanks.slice(0, 10).map((x) => `${x.pid}(#${x.dex})`),
      top6Healers: topHealers.map((x) => `${x.pid}(#${x.dex}, hp=${x.effSta})`),
    },
  };
}

// ============================================================================
// 4. PokeMiners Game Master Fallback (if Pokebattler is unavailable)
// ============================================================================

export function parsePokeMinersFallback(gameMasterEntries) {
  const pokemon = [];
  const moves = [];

  for (const entry of gameMasterEntries || []) {
    const data = entry?.data;
    if (!data) continue;

    if (data.moveSettings) {
      const m = data.moveSettings;
      moves.push({
        moveId: m.movementId,
        type: m.pokemonType,
        power: m.power || 0,
        durationMs: m.durationMs || 0,
        damageWindowStartMs: m.damageWindowStartMs || 0,
        energyDelta: m.energyDelta || 0,
      });
    } else if (data.pokemonSettings) {
      const p = data.pokemonSettings;
      const dexMatch = String(entry.templateId || '').match(/^V(\d{4})_POKEMON_/);
      if (!dexMatch || !p.stats) continue;
      const dex = parseInt(dexMatch[1], 10);
      const pokemonId = p.form || p.pokemonId;
      pokemon.push({
        pokemonId,
        type: p.type,
        type2: p.type2,
        stats: p.stats,
        quickMoves: p.quickMoves || [],
        cinematicMoves: p.cinematicMoves || [],
        eliteQuickMove: p.eliteQuickMove || [],
        eliteCinematicMove: p.eliteCinematicMove || [],
        pokedex: { pokemonId: p.pokemonId, pokemonNum: dex },
      });
    }
  }

  return { pokemon, moves };
}

// ============================================================================
// 5. Strict Schema Validator
// ============================================================================

export function validateMetaSnapshot(snapshot) {
  const errors = [];
  if (!snapshot || typeof snapshot !== 'object') {
    return { valid: false, errors: ['Snapshot must be an object'] };
  }
  if (snapshot.schemaVersion !== 1) {
    errors.push(`Invalid schemaVersion: ${snapshot.schemaVersion}`);
  }
  if (typeof snapshot.generatedAt !== 'string' || Number.isNaN(Date.parse(snapshot.generatedAt))) {
    errors.push(`Invalid generatedAt: ${snapshot.generatedAt}`);
  }
  if (!snapshot.sources || typeof snapshot.sources !== 'object') {
    errors.push('Missing sources object');
  }

  const checkDexArray = (arr, label, minLen = 1) => {
    if (!Array.isArray(arr)) {
      errors.push(`${label} must be an array`);
      return;
    }
    if (arr.length < minLen) {
      errors.push(`${label} too small (${arr.length} < ${minLen})`);
    }
    for (let i = 0; i < arr.length; i++) {
      const val = arr[i];
      if (!Number.isInteger(val) || val < 1 || val > EXPECTED_POKEDEX_COUNT) {
        errors.push(`${label}[${i}] invalid dex ID: ${val}`);
        break;
      }
      if (i > 0 && val <= arr[i - 1]) {
        errors.push(`${label} is not strictly sorted/deduplicated at index ${i}`);
        break;
      }
    }
  };

  // PvP checks
  checkDexArray(snapshot.pvp?.gl?.top100?.all, 'pvp.gl.top100.all', 50);
  checkDexArray(snapshot.pvp?.gl?.top100?.lowAtk, 'pvp.gl.top100.lowAtk', 30);
  checkDexArray(snapshot.pvp?.gl?.top100?.highAtk, 'pvp.gl.top100.highAtk', 5);
  checkDexArray(snapshot.pvp?.gl?.top100?.shadow, 'pvp.gl.top100.shadow', 10);
  checkDexArray(snapshot.pvp?.gl?.top100?.tradeReroll, 'pvp.gl.top100.tradeReroll', 1);

  checkDexArray(snapshot.pvp?.ul?.top100?.all, 'pvp.ul.top100.all', 50);
  checkDexArray(snapshot.pvp?.ul?.top100?.lowAtk, 'pvp.ul.top100.lowAtk', 20);
  checkDexArray(snapshot.pvp?.ul?.top100?.highAtk, 'pvp.ul.top100.highAtk', 10);
  checkDexArray(snapshot.pvp?.ul?.top100?.shadow, 'pvp.ul.top100.shadow', 10);
  checkDexArray(snapshot.pvp?.ul?.top100?.tradeReroll, 'pvp.ul.top100.tradeReroll', 1);

  checkDexArray(snapshot.pvp?.ml?.top100?.all, 'pvp.ml.top100.all', 40);
  checkDexArray(snapshot.pvp?.ml?.top100?.shadow, 'pvp.ml.top100.shadow', 5);
  checkDexArray(snapshot.pvp?.allShadow, 'pvp.allShadow', 20);
  checkDexArray(snapshot.pvp?.allTradeReroll, 'pvp.allTradeReroll', 3);

  // PvE checks
  checkDexArray(snapshot.pve?.top30Overall, 'pve.top30Overall', 25);
  checkDexArray(snapshot.pve?.topShadow, 'pve.topShadow', 20);
  checkDexArray(snapshot.pve?.topMegaEvolved, 'pve.topMegaEvolved', 15);
  checkDexArray(snapshot.pve?.topMegaFamily, 'pve.topMegaFamily', 25);

  if (
    Array.isArray(snapshot.pve?.topMegaEvolved) &&
    Array.isArray(snapshot.pve?.topMegaFamily) &&
    snapshot.pve.topMegaFamily.length <= snapshot.pve.topMegaEvolved.length
  ) {
    errors.push('pve.topMegaFamily should expand beyond pve.topMegaEvolved');
  }

  for (const type of ALL_TYPES) {
    checkDexArray(snapshot.pve?.byType?.[type], `pve.byType.${type}`, 8);
  }

  // Max Battles checks
  checkDexArray(snapshot.maxBattles?.attackers, 'maxBattles.attackers', 15);
  checkDexArray(snapshot.maxBattles?.tanks, 'maxBattles.tanks', 10);
  checkDexArray(snapshot.maxBattles?.healers, 'maxBattles.healers', 4);
  checkDexArray(snapshot.maxBattles?.tanksAndHealers, 'maxBattles.tanksAndHealers', 12);

  if (!Array.isArray(snapshot.maxBattles?.fastMoves500ms) || snapshot.maxBattles.fastMoves500ms.length < 20) {
    errors.push(`maxBattles.fastMoves500ms must have >= 20 moves`);
  } else {
    for (const requiredMove of ['Pound', 'Metal Claw', 'Lock-On', 'Bug Bite', 'Water Gun']) {
      if (!snapshot.maxBattles.fastMoves500ms.includes(requiredMove)) {
        errors.push(`maxBattles.fastMoves500ms missing required move: ${requiredMove}`);
      }
    }
  }

  // Max Battle domain sanity: Blissey (#242) in healers, Zamazenta (#889) in tanks, Eternatus (#890) in attackers
  if (Array.isArray(snapshot.maxBattles?.healers) && !snapshot.maxBattles.healers.includes(242)) {
    errors.push('maxBattles.healers missing Blissey (#242)');
  }
  if (Array.isArray(snapshot.maxBattles?.tanks) && !snapshot.maxBattles.tanks.includes(889)) {
    errors.push('maxBattles.tanks missing Zamazenta (#889)');
  }
  if (Array.isArray(snapshot.maxBattles?.attackers) && !snapshot.maxBattles.attackers.includes(890)) {
    errors.push('maxBattles.attackers missing Eternatus (#890)');
  }

  // Special lists
  if (JSON.stringify(snapshot.specialLists?.candy12Fodder) !== JSON.stringify(SPECIAL_LISTS.candy12Fodder)) {
    errors.push('specialLists.candy12Fodder mismatch');
  }
  if (JSON.stringify(snapshot.specialLists?.tradeEvolve) !== JSON.stringify(SPECIAL_LISTS.tradeEvolve)) {
    errors.push('specialLists.tradeEvolve mismatch');
  }

  return { valid: errors.length === 0, errors };
}

// ============================================================================
// 6. Main Orchestrator
// ============================================================================

export async function fetchMeta(
  pokedexPath = path.join(__dirname, '../src/data/pokedex.json'),
  outputPath = path.join(__dirname, '../src/data/meta_snapshot.json')
) {
  if (!fs.existsSync(pokedexPath)) {
    throw new Error(`Missing ${pokedexPath}. Run scripts/fetch_data.js first.`);
  }
  const pokedex = JSON.parse(fs.readFileSync(pokedexPath, 'utf8'));
  const pokedexById = new Map(pokedex.map((p) => [p.id, p]));

  console.log('Fetching PvPoke gamemaster & GL/UL/ML rankings...');
  const [gmRes, glRes, ulRes, mlRes] = await Promise.all([
    fetchWithRetry(PVPOKE_URLS.gamemaster),
    fetchWithRetry(PVPOKE_URLS.gl),
    fetchWithRetry(PVPOKE_URLS.ul),
    fetchWithRetry(PVPOKE_URLS.ml),
  ]);
  const [gamemasterPokemon, glRankings, ulRankings, mlRankings] = await Promise.all([
    gmRes.json(),
    glRes.json(),
    ulRes.json(),
    mlRes.json(),
  ]);

  const pvp = buildPvpMeta(gamemasterPokemon, { gl: glRankings, ul: ulRankings, ml: mlRankings }, pokedexById, 100);

  // Build released sets from PvPoke gamemaster + pokedex.json
  const releasedDexes = new Set(gamemasterPokemon.filter((p) => p.released !== false).map((p) => p.dex));
  const releasedShadowIds = new Set(
    gamemasterPokemon
      .filter((p) => p.released !== false && (p.tags || []).includes('shadow'))
      .map((p) => p.speciesId)
  );
  const releasedShadows = new Set(
    gamemasterPokemon.filter((p) => p.released !== false && (p.tags || []).includes('shadow')).map((p) => p.dex)
  );
  const releasedMegas = new Set(pokedex.filter((p) => p.hasMega).map((p) => p.id));

  // Fetch Pokebattler JSON (with PokeMiners Game Master fallback)
  let pbPokemon;
  let pbMoves;
  let pveSourceLabel = 'https://fight.pokebattler.com/pokemon & /moves';
  try {
    console.log('Fetching Pokebattler pokemon & moves JSON...');
    const [pbPkmRes, pbMovesRes] = await Promise.all([
      fetchWithRetry(POKEBATTLER_URLS.pokemon),
      fetchWithRetry(POKEBATTLER_URLS.moves),
    ]);
    pbPokemon = (await pbPkmRes.json()).pokemon;
    pbMoves = (await pbMovesRes.json()).move;
  } catch (pbErr) {
    console.warn(`Pokebattler unavailable (${pbErr.message}); falling back to PokeMiners Game Master...`);
    const pmRes = await fetchWithRetry(POKEMINERS_GAMEMASTER_URL);
    const pmJson = await pmRes.json();
    const parsed = parsePokeMinersFallback(pmJson);
    pbPokemon = parsed.pokemon;
    pbMoves = parsed.moves;
    pveSourceLabel = POKEMINERS_GAMEMASTER_URL;
  }

  console.log('Computing clean-room PvE Top 10 per type & Overall/Shadow/Mega rankings...');
  const pveResult = buildPveMeta(pbPokemon, pbMoves, pokedex, {
    releasedDexes,
    releasedShadowIds,
    releasedShadows,
    releasedMegas,
  });

  console.log('Fetching PokéChespin Max Battle roster & scoring Attackers/Tanks/Healers...');
  const pcRes = await fetchWithRetry(POKECHESPIN_CALC_URL);
  const pcTsSource = await pcRes.text();
  const { dynamaxPokemon } = parsePokechespinMaxLists(pcTsSource);
  const maxResult = buildMaxBattlesMeta(dynamaxPokemon, pbPokemon, pbMoves, pokedexById);

  const snapshot = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    sources: {
      pvpoke: 'https://github.com/pvpoke/pvpoke (MIT)',
      pokebattler: pveSourceLabel,
      pokechespin: 'https://github.com/CreatorBeastGD/pokechespin (MIT)',
      pokemonGoApi: 'https://pokemon-go-api.github.io/pokemon-go-api/api/pokedex.json',
    },
    pvp,
    pve: pveResult.meta,
    maxBattles: maxResult.meta,
    specialLists: SPECIAL_LISTS,
  };

  writeJsonAtomically(outputPath, snapshot, validateMetaSnapshot);

  const bytes = fs.statSync(outputPath).size;
  console.log(`Saved validated meta snapshot to ${outputPath} (${(bytes / 1024).toFixed(1)} KB)`);
  console.log('Sanity check — Top 5 PvE Overall:', pveResult.debug.top10Overall.slice(0, 5).join(', '));
  console.log('Sanity check — Top 5 PvE Shadow:', pveResult.debug.top10Shadow.slice(0, 5).join(', '));
  console.log('Sanity check — Top 5 PvE Mega:', pveResult.debug.top10Mega.slice(0, 5).join(', '));
  console.log('Sanity check — Top 5 Max Attackers:', maxResult.debug.top10Attackers.slice(0, 5).join(', '));
  console.log('Sanity check — Top 5 Max Tanks:', maxResult.debug.top10Tanks.slice(0, 5).join(', '));
  console.log('Sanity check — Top 5 Max Healers:', maxResult.debug.top6Healers.slice(0, 5).join(', '));
  return { snapshot, debug: { pve: pveResult.debug, max: maxResult.debug } };
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  fetchMeta().catch((err) => {
    console.error('Fatal error updating meta_snapshot.json (existing file preserved):', err);
    process.exit(1);
  });
}
