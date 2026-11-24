import { expect, test, describe } from 'vitest';
import { getFamilyIds } from './familyModel';
import {
  areRegionPropsEqual,
  countActiveFilters,
  filterAndGroupPokemon,
  migrateFilters,
  syncCopiedStringToDock,
  workspaceUiStore,
} from './pokedexModel';
import { createDefaultFilters } from './searchEngine';

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

describe('migrateFilters, filterAndGroupPokemon & countActiveFilters', () => {
  test('migrates legacy "ultra beasts" key and preserves attributeLogic', () => {
    const migrated = migrateFilters({ 'ultra beasts': true, attributeLogic: 'OR' });
    expect(migrated.ultrabeast).toBe(true);
    expect('ultra beasts' in migrated).toBe(false);
    expect(migrated.attributeLogic).toBe('OR');

    const fallback = migrateFilters(null);
    expect(fallback).toEqual(createDefaultFilters());
  });

  test('filters by name, padded dex ID, type, and selectedOnly, and groups by region', () => {
    const sample = [
      { id: 1, name: 'bulbasaur', region: 'Kanto', types: ['grass', 'poison'] },
      { id: 25, name: 'pikachu', region: 'Kanto', types: ['electric'] },
      { id: 443, name: 'gible', region: 'Sinnoh', types: ['dragon', 'ground'] },
    ];

    const byPaddedId = filterAndGroupPokemon(sample, { searchQuery: '0025' });
    expect(byPaddedId.visibleList.map((p) => p.id)).toEqual([25]);

    const byTypeAndSelected = filterAndGroupPokemon(sample, {
      selectedOnly: true,
      selectedIds: new Set([1, 443]),
      filterTypes: ['dragon'],
    });
    expect(byTypeAndSelected.visibleList.map((p) => p.id)).toEqual([443]);
    expect(Object.keys(byTypeAndSelected.groupedRegions)).toEqual(['Sinnoh']);
  });

  test('counts active filters accurately without counting attributeLogic toggle alone', () => {
    const filters = createDefaultFilters();
    expect(countActiveFilters(filters)).toBe(0);

    filters.attributeLogic = 'OR';
    expect(countActiveFilters(filters)).toBe(0);

    filters.appraisal = ['3*', '4*'];
    filters.shiny = true;
    filters.ivStats.excludePvpIv = true;
    filters.rawClauses = ['#pvp-gl'];
    expect(countActiveFilters(filters)).toBe(5);
  });

  test('syncCopiedStringToDock updates workspace dock ownership cleanly', () => {
    syncCopiedStringToDock('shiny&background&!#');
    expect(workspaceUiStore.getSnapshot().dockSource).toEqual({
      mode: 'custom',
      text: 'shiny&background&!#',
    });

    workspaceUiStore.dispatch({ type: 'SELECT_TAB', tab: 'triage', resetDock: true });
    expect(workspaceUiStore.getSnapshot().dockSource).toEqual({ mode: 'builder' });
  });
});
