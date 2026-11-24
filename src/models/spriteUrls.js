/**
 * Pure sprite URL helpers + offline inline SVG fallback.
 * Extracted from `pokedexModel.js` so views and models share sprite URLs without coupling to stores.
 */

export const FALLBACK_SPRITE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='45' fill='%23ff385c'/%3E%3Cpath d='M5 50h90A45 45 0 0 1 5 50' fill='%23f8fafc'/%3E%3Cpath d='M5 50h90' stroke='%230b4f6c' stroke-width='8'/%3E%3Ccircle cx='50' cy='50' r='16' fill='%230b4f6c'/%3E%3Ccircle cx='50' cy='50' r='10' fill='%23f8fafc'/%3E%3C/svg%3E";

export function getPixelSpriteUrl(dexId) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${dexId}.png`;
}

export function getHomeSpriteUrl(dexId) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/${dexId}.png`;
}
