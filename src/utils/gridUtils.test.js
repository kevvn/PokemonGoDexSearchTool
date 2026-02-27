import { expect, test, describe } from "bun:test";
import { areRegionPropsEqual } from "./gridUtils";

describe("areRegionPropsEqual", () => {
  const commonProps = {
    region: "Kanto",
    isCollapsed: false,
    handleRegionSelection: () => {},
    togglePokemon: () => {},
    toggleCollapse: () => {},
  };

  const pokemons = [
    { id: 1, name: "bulbasaur" },
    { id: 2, name: "ivysaur" },
  ];

  test("should return true when all props are referentially equal", () => {
    const selectedIds = new Set([1]);
    const prev = { ...commonProps, pokemons, selectedIds };
    const next = { ...commonProps, pokemons, selectedIds };
    expect(areRegionPropsEqual(prev, next)).toBe(true);
  });

  test("should return false when region changes", () => {
    const selectedIds = new Set([1]);
    const prev = { ...commonProps, pokemons, selectedIds, region: "Kanto" };
    const next = { ...commonProps, pokemons, selectedIds, region: "Johto" };
    expect(areRegionPropsEqual(prev, next)).toBe(false);
  });

  test("should return false when isCollapsed changes", () => {
    const selectedIds = new Set([1]);
    const prev = { ...commonProps, pokemons, selectedIds, isCollapsed: false };
    const next = { ...commonProps, pokemons, selectedIds, isCollapsed: true };
    expect(areRegionPropsEqual(prev, next)).toBe(false);
  });

  test("should return false when selection changes for pokemon in region", () => {
    const prevSel = new Set([1]);
    const nextSel = new Set([1, 2]); // Added 2
    const prev = { ...commonProps, pokemons, selectedIds: prevSel };
    const next = { ...commonProps, pokemons, selectedIds: nextSel };
    expect(areRegionPropsEqual(prev, next)).toBe(false);
  });

  test("should return true when selection changes for pokemon NOT in region", () => {
    const prevSel = new Set([1, 100]);
    const nextSel = new Set([1, 100, 101]); // 101 is not in pokemons list
    const prev = { ...commonProps, pokemons, selectedIds: prevSel };
    const next = { ...commonProps, pokemons, selectedIds: nextSel };
    expect(areRegionPropsEqual(prev, next)).toBe(true);
  });

  // This is the failing test case for current implementation
  test("should return true when pokemons array reference changes but content is identical", () => {
    const selectedIds = new Set([1]);
    const pokemonsCopy = [...pokemons]; // New array reference, same content (shallow copy of array, elements are same refs)

    const prev = { ...commonProps, pokemons, selectedIds };
    const next = { ...commonProps, pokemons: pokemonsCopy, selectedIds };

    // Expectation: true (because content is same)
    // Current implementation: false (because reference check fails)
    expect(areRegionPropsEqual(prev, next)).toBe(true);
  });
});
