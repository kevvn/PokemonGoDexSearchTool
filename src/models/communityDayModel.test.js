import { describe, expect, test } from 'vitest';
import {
  ALL_COMMUNITY_DAY_PRE_EVO_IDS,
  COMMUNITY_DAY_EVENTS,
  getCommunityDaysByYear,
} from './communityDayModel';

describe('communityDayModel preEvoIds accuracy (evolveCandy-driven)', () => {
  test('never includes final evolutions and never drops cross-gen babies or split pre-evos', () => {
    const preEvoSet = new Set(ALL_COMMUNITY_DAY_PRE_EVO_IDS);

    // Cross-gen babies MUST be included
    expect(preEvoSet.has(172)).toBe(true); // Pichu
    expect(preEvoSet.has(440)).toBe(true); // Happiny
    expect(preEvoSet.has(25)).toBe(true); // Pikachu
    expect(preEvoSet.has(113)).toBe(true); // Chansey
    expect(preEvoSet.has(133)).toBe(true); // Eevee
    expect(preEvoSet.has(280)).toBe(true); // Ralts
    expect(preEvoSet.has(281)).toBe(true); // Kirlia
    expect(preEvoSet.has(588)).toBe(true); // Karrablast
    expect(preEvoSet.has(616)).toBe(true); // Shelmet

    // Final evolutions MUST NEVER appear in preEvoIds
    for (const finalDex of [
      26, // Raichu
      242, // Blissey
      134, 135, 136, 196, 197, 470, 471, 700, // All 8 Eeveelutions
      282, 475, // Gardevoir, Gallade
      62, 186, // Poliwrath, Politoed
      80, 199, // Slowbro, Slowking
      195, 980, // Quagsire, Clodsire
      589, 617, // Escavalier, Accelgor
    ]) {
      expect(preEvoSet.has(finalDex), `Final evolution #${finalDex} leaked into preEvoIds`).toBe(false);
    }
  });

  test('groups Community Day events cleanly by descending year', () => {
    const byYear = getCommunityDaysByYear();
    expect(byYear.length).toBeGreaterThanOrEqual(8);
    expect(byYear[0].year).toBeGreaterThanOrEqual(2026);
    expect(COMMUNITY_DAY_EVENTS.every((ev) => Array.isArray(ev.familyIds) && ev.familyIds.length >= 2)).toBe(
      true
    );
  });
});
