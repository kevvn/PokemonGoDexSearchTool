/**
 * Data-driven evolutionary family lookup model derived directly from `src/data/pokedex.json`.
 * Scales automatically to Gen 10+ and new cross-generation evolutions with zero hardcoded ID tables,
 * and returns frozen arrays so callers cannot mutate shared lookup state.
 */
import pokedexData from '../data/pokedex.json';
import { REGIONS_CONFIG } from '../data/speciesConstants';

const FALLBACK_MAX_DEX_ID = Math.max(...REGIONS_CONFIG.map((r) => r.end));

const FAMILY_MAP = new Map();
const CAN_EVOLVE_SET = new Set();
const POKEDEX_BY_ID = new Map();

let maxDexId = 0;

for (const entry of pokedexData) {
  if (!entry || typeof entry.id !== 'number') continue;
  POKEDEX_BY_ID.set(entry.id, entry);
  if (entry.id > maxDexId) {
    maxDexId = entry.id;
  }
  if (entry.evolveCandy !== null && entry.evolveCandy !== undefined) {
    CAN_EVOLVE_SET.add(entry.id);
  }
  const rawFamily =
    Array.isArray(entry.familyDexes) && entry.familyDexes.length > 0
      ? entry.familyDexes
      : [entry.id];
  const frozenFamily = Object.freeze(
    Array.from(new Set(rawFamily.filter((n) => Number.isInteger(n) && n > 0))).sort((a, b) => a - b)
  );
  FAMILY_MAP.set(entry.id, frozenFamily);
}

export const MAX_POKEDEX_ID = maxDexId || FALLBACK_MAX_DEX_ID;
export const TOTAL_POKEDEX_COUNT = pokedexData.length;

export function getPokedexEntryById(dexId) {
  return POKEDEX_BY_ID.get(Number(dexId)) || null;
}

export function canSpeciesEvolve(dexId) {
  return CAN_EVOLVE_SET.has(Number(dexId));
}

export function getFamilyIdsByDexId(pokemonId) {
  if (pokemonId === null || pokemonId === undefined || pokemonId === '') return Object.freeze([]);
  const idNum = Number(pokemonId);
  if (!Number.isInteger(idNum) || idNum <= 0) return Object.freeze([]);
  const found = FAMILY_MAP.get(idNum);
  return found || Object.freeze([idNum]);
}

export function getPokemonFamilyIds(pokemon) {
  if (!pokemon) return Object.freeze([]);
  if (Array.isArray(pokemon.familyDexes) && pokemon.familyDexes.length > 0) {
    return Object.freeze([...pokemon.familyDexes]);
  }
  return typeof pokemon.id === 'number' ? getFamilyIdsByDexId(pokemon.id) : Object.freeze([]);
}

/**
 * Accepts either a numeric Pokédex ID or a Pokémon object from `pokedex.json`.
 */
export function getFamilyIds(pokemonOrId) {
  if (!pokemonOrId) return Object.freeze([]);
  if (typeof pokemonOrId === 'object') {
    return getPokemonFamilyIds(pokemonOrId);
  }
  return getFamilyIdsByDexId(pokemonOrId);
}

export default getFamilyIds;
