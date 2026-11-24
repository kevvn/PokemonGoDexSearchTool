import { describe, expect, test } from 'vitest';
import {
  MAX_POKEDEX_ID,
  TOTAL_POKEDEX_COUNT,
  canSpeciesEvolve,
  getFamilyIds,
  getFamilyIdsByDexId,
  getPokemonFamilyIds,
} from './familyModel';

describe('familyModel (data-driven from pokedex.json)', () => {
  test('derives dynamic Pokédex count and max ID without hardcoded 1025 limits', () => {
    expect(TOTAL_POKEDEX_COUNT).toBeGreaterThanOrEqual(1025);
    expect(MAX_POKEDEX_ID).toBe(TOTAL_POKEDEX_COUNT);
  });

  test('returns frozen connected-component families for cross-gen & split lines', () => {
    const pikaFam = getFamilyIdsByDexId(25);
    expect(pikaFam).toEqual([25, 26, 172]);
    expect(Object.isFrozen(pikaFam)).toBe(true);

    expect(getFamilyIdsByDexId(133)).toEqual([133, 134, 135, 136, 196, 197, 470, 471, 700]);
    expect(getFamilyIdsByDexId(980)).toEqual([194, 195, 980]);
    expect(getFamilyIdsByDexId(902)).toEqual([550, 902]);
    expect(getPokemonFamilyIds({ id: 25 })).toEqual([25, 26, 172]);
    expect(getFamilyIds(null)).toEqual([]);
  });

  test('accurately distinguishes evolving pre-evos from final evolutions via evolveCandy', () => {
    expect(canSpeciesEvolve(172)).toBe(true); // Pichu
    expect(canSpeciesEvolve(25)).toBe(true); // Pikachu
    expect(canSpeciesEvolve(26)).toBe(false); // Raichu
    expect(canSpeciesEvolve(133)).toBe(true); // Eevee
    expect(canSpeciesEvolve(700)).toBe(false); // Sylveon
  });
});
