import { test, expect } from "bun:test";
import { areRegionPropsEqual } from '../utils/gridUtils';

test('areRegionPropsEqual should optimize re-renders for identical content', () => {
    const region = 'Kanto';
    // Pokemon objects are stable references in the app
    const p1 = { id: 1, name: 'bulbasaur' };
    const p2 = { id: 2, name: 'ivysaur' };

    // Simulating re-generation of region arrays (e.g. via showSelectedOnly logic)
    const prevPokemons = [p1, p2];
    const nextPokemons = [p1, p2]; // New array reference, same content

    const selectedIds = new Set([1]);

    const prevProps = {
        region,
        pokemons: prevPokemons,
        selectedIds,
        isCollapsed: false,
        togglePokemon: () => {},
        handleRegionSelection: () => {},
        toggleCollapse: () => {}
    };

    const nextProps = {
        ...prevProps,
        pokemons: nextPokemons, // New ref
        selectedIds: new Set([1]) // New ref Set, same content
    };

    // Current implementation checks `prev.pokemons !== next.pokemons` strictly.
    // Since arrays are different references, it returns FALSE (re-render).
    // The optimization goal is to return TRUE (skip render) because content is identical.

    const result = areRegionPropsEqual(prevProps, nextProps);

    expect(result).toBe(true);
});
