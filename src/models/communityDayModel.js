/**
 * Community Day domain model.
 * Derives family expansion and true pre-evolution IDs from `pokedex.json` (`canSpeciesEvolve`)
 * so cross-gen babies (Pichu #172, Happiny #440) are preserved and final evolutions
 * (Raichu, Blissey, Eeveelutions, Gardevoir, Poliwrath, Slowbro, Quagsire, Escavalier) are excluded.
 */
import { RAW_COMMUNITY_DAYS } from '../data/communityDayRegistry';
import { canSpeciesEvolve, getFamilyIdsByDexId } from './familyModel';
import { getPixelSpriteUrl } from './spriteUrls';

export const COMMUNITY_DAY_EVENTS = RAW_COMMUNITY_DAYS.map((entry) => {
  const baseFamily = getFamilyIdsByDexId(entry.dexId);
  const extra = entry.extraDexIds || [];
  const familyIds = Array.from(new Set([...baseFamily, ...extra])).sort((a, b) => a - b);

  // Use true directed evolution eligibility (`evolveCandy !== null` in pokedex.json)
  const evolvableIds = familyIds.filter((id) => canSpeciesEvolve(id));
  const preEvoIds = evolvableIds.length > 0 ? evolvableIds : [entry.dexId];

  return Object.freeze({
    ...entry,
    familyIds: Object.freeze(familyIds),
    preEvoIds: Object.freeze(preEvoIds),
    sprite: getPixelSpriteUrl(entry.dexId),
  });
});

export function getCommunityDaysByYear() {
  const byYear = new Map();
  for (const ev of COMMUNITY_DAY_EVENTS) {
    if (!byYear.has(ev.year)) {
      byYear.set(ev.year, []);
    }
    byYear.get(ev.year).push(ev);
  }
  return Array.from(byYear.entries())
    .sort((a, b) => b[0] - a[0])
    .map(([year, events]) => ({
      year,
      events,
      allFamilyIds: Array.from(new Set(events.flatMap((e) => e.familyIds))).sort((a, b) => a - b),
    }));
}

export const ALL_COMMUNITY_DAY_PRE_EVO_IDS = Object.freeze(
  Array.from(new Set(COMMUNITY_DAY_EVENTS.flatMap((e) => e.preEvoIds))).sort((a, b) => a - b)
);
