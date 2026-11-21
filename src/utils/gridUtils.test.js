import { expect, test, describe } from 'vitest';
import { areRegionPropsEqual, getFamilyIds } from './gridUtils';

describe('areRegionPropsEqual', () => {
  const commonProps = {
    region: 'Kanto',
    isCollapsed: false,
    handleRegionSelection: () => {},
    togglePokemon: () => {},
    toggleCollapse: () => {},
    selectedIds: new Set([1, 2]),
  };

  const pikachu = { id: 25, name: 'pikachu', familyDexes: [25, 26, 172] };
  const bulbasaur = { id: 1, name: 'bulbasaur', familyDexes: [1, 2, 3] };

  test('returns true for identical props (same array reference)', () => {
    const pokemons = [bulbasaur, pikachu];
    const prev = { ...commonProps, pokemons };
    const next = { ...commonProps, pokemons };
    expect(areRegionPropsEqual(prev, next)).toBe(true);
  });

  test('returns true for different array reference with identical items', () => {
    const prev = { ...commonProps, pokemons: [bulbasaur, pikachu] };
    const next = { ...commonProps, pokemons: [bulbasaur, pikachu] };
    expect(areRegionPropsEqual(prev, next)).toBe(true);
  });

  test('returns false when selection changes for a pokemon inside this region', () => {
    const pokemons = [bulbasaur, pikachu];
    const prev = { ...commonProps, pokemons, selectedIds: new Set([1]) };
    const next = { ...commonProps, pokemons, selectedIds: new Set([1, 25]) };
    expect(areRegionPropsEqual(prev, next)).toBe(false);
  });

  test('returns true when selection changes only outside this region', () => {
    const pokemons = [bulbasaur, pikachu];
    const prev = { ...commonProps, pokemons, selectedIds: new Set([1]) };
    const next = { ...commonProps, pokemons, selectedIds: new Set([1, 150]) };
    expect(areRegionPropsEqual(prev, next)).toBe(true);
  });
});

describe('getFamilyIds', () => {
  test('returns precomputed familyDexes when present', () => {
    expect(getFamilyIds({ id: 25, familyDexes: [25, 26, 172] })).toEqual([25, 26, 172]);
  });

  test('falls back to singleton id when familyDexes is absent', () => {
    expect(getFamilyIds({ id: 150 })).toEqual([150]);
    expect(getFamilyIds(null)).toEqual([]);
  });
});
