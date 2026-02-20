export const areRegionPropsEqual = (prev, next) => {
  if (prev.region !== next.region) return false;
  if (prev.isCollapsed !== next.isCollapsed) return false;

  // Optimization: Check for content equality of pokemons array instead of strict reference equality.
  // This prevents re-renders when the array is regenerated but contains the same pokemon references
  // (e.g. when other regions update or filtering logic runs but this region is unchanged).
  if (prev.pokemons !== next.pokemons) {
    if (prev.pokemons.length !== next.pokemons.length) return false;
    for (let i = 0; i < prev.pokemons.length; i++) {
      if (prev.pokemons[i] !== next.pokemons[i]) return false;
    }
  }

  if (prev.handleRegionSelection !== next.handleRegionSelection) return false;
  if (prev.togglePokemon !== next.togglePokemon) return false;
  if (prev.toggleCollapse !== next.toggleCollapse) return false;

  // Check if selection state changed for ANY pokemon in this region
  // Since pokemons array is stable (checked above), we can iterate it.
  const prevSel = prev.selectedIds;
  const nextSel = next.selectedIds;

  // Optimization: if reference is same (unlikely), return true
  if (prevSel === nextSel) return true;

  for (const p of prev.pokemons) {
    if (prevSel.has(p.id) !== nextSel.has(p.id)) {
      return false;
    }
  }
  return true;
};
