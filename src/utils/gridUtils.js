// Custom comparison function for React.memo to prevent unnecessary re-renders of RegionSection
// when the global selectedIds state changes but the selection status of pokemon IN THIS REGION hasn't changed.
export const areRegionPropsEqual = (prev, next) => {
  if (prev.region !== next.region) return false;
  if (prev.isCollapsed !== next.isCollapsed) return false;

  // Optimized: Shallow compare pokemons array to handle reference instability during filtering
  if (prev.pokemons !== next.pokemons) {
     if (prev.pokemons.length !== next.pokemons.length) return false;
     for (let i = 0; i < prev.pokemons.length; i++) {
        if (prev.pokemons[i] !== next.pokemons[i]) return false;
     }
  }

  if (prev.handleRegionSelection !== next.handleRegionSelection) return false;
  if (prev.togglePokemon !== next.togglePokemon) return false;
  if (prev.toggleCollapse !== next.toggleCollapse) return false;
  if (prev.fullList !== next.fullList) return false;
  if (prev.onSelectFamily !== next.onSelectFamily) return false;

  // Check if selection state changed for ANY pokemon in this region
  // Since pokemons array is stable (or content-equal), we can iterate it.
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
