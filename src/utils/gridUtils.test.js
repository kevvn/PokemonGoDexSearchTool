import { expect, test, describe } from "bun:test";
import { areRegionPropsEqual } from "./gridUtils";

describe("areRegionPropsEqual", () => {
  const commonProps = {
    region: "Kanto",
    isCollapsed: false,
    handleRegionSelection: () => {},
    togglePokemon: () => {},
    toggleCollapse: () => {},
    selectedIds: new Set([1, 2]),
  };

  const pikachu = { id: 25, name: "pikachu" };
  const bulbasaur = { id: 1, name: "bulbasaur" };

  test("should return true for identical props (same array reference)", () => {
    const pokemons = [bulbasaur, pikachu];
    const prev = { ...commonProps, pokemons };
    const next = { ...commonProps, pokemons };
    expect(areRegionPropsEqual(prev, next)).toBe(true);
  });

  test("should return true for different array reference but same content", () => {
    // This simulates the scenario where parent re-renders and creates new array with same items
    const prev = { ...commonProps, pokemons: [bulbasaur, pikachu] };
    const next = { ...commonProps, pokemons: [bulbasaur, pikachu] };

    // This should be true for optimized performance, but false in naive implementation
    expect(areRegionPropsEqual(prev, next)).toBe(true);
  });
});
