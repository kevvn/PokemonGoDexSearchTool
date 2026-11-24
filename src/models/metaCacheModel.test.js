import { afterEach, describe, expect, test } from 'vitest';
import pokedex from '../data/pokedex.json';
import {
  buildNameToIdMap,
  commitSyncedMetaCache,
  computeMetaIdSets,
  formatMoveName,
  getActiveMetaCache,
  getActiveMetaSnapshot,
  mergeSyncedPvPokeCache,
  resetMetaCacheToBundled,
  resolveDexId,
} from './metaCacheModel';

describe('metaCacheModel unified meta store & live PvPoke sync', () => {
  afterEach(() => {
    resetMetaCacheToBundled();
  });

  test('normalizes bundled PvE entries so speciesName and type are always populated', () => {
    const cache = getActiveMetaCache();
    expect(cache.pve.entries.length).toBeGreaterThan(20);
    expect(cache.pve.entries[0].speciesName).toBeTruthy();
    expect(cache.pve.entries[0].type).toBeTruthy();
  });

  test('resolves multi-word / underscore species IDs accurately before splitting', () => {
    const nameMap = buildNameToIdMap(pokedex);
    expect(resolveDexId('porygon_z', 'Porygon-Z', nameMap)).toBe(474);
    expect(resolveDexId('nidoran_male', 'Nidoran♂', nameMap)).toBe(32);
    expect(resolveDexId('mr_mime', 'Mr. Mime', nameMap)).toBe(122);
    expect(resolveDexId('tapu_fini', 'Tapu Fini', nameMap)).toBe(788);
    expect(resolveDexId('clodsire_shadow', 'Clodsire (Shadow)', nameMap)).toBe(980);
  });

  test('formats hyphenated & Weather Ball move slugs cleanly', () => {
    expect(formatMoveName('LOCK_ON')).toBe('Lock-On');
    expect(formatMoveName('MUD_SLAP')).toBe('Mud-Slap');
    expect(formatMoveName('WEATHER_BALL_FIRE')).toBe('Weather Ball');
    expect(formatMoveName('SHADOW_CLAW')).toBe('Shadow Claw');
  });

  test('mergeSyncedPvPokeCache validates payloads and propagates live rankings into getActiveMetaSnapshot', () => {
    expect(() => mergeSyncedPvPokeCache({ great_league: 'not-an-array' }, pokedex)).toThrow();

    const samplePayload = {
      great_league: [
        { speciesId: 'clodsire', speciesName: 'Clodsire', score: 95, moveset: ['POISON_STING', 'EARTHQUAKE'] },
        { speciesId: 'lickitung', speciesName: 'Lickitung', score: 92, moveset: ['LICK', 'BODY_SLAM'] },
      ],
      ultra_league: [
        { speciesId: 'tinkaton', speciesName: 'Tinkaton', score: 94, moveset: ['FAIRY_WIND', 'PLAY_ROUGH'] },
      ],
      master_league: [
        { speciesId: 'mewtwo_shadow', speciesName: 'Mewtwo (Shadow)', score: 96, moveset: ['PSYCHO_CUT', 'PSYSTRIKE'] },
      ],
    };

    const gamemaster = [
      { speciesId: 'clodsire', dex: 980, defaultIVs: { cp1500: [30, 0, 14, 13] }, tags: [] },
      { speciesId: 'lickitung', dex: 108, defaultIVs: { cp1500: [50, 8, 14, 15] }, tags: [] },
      { speciesId: 'tinkaton', dex: 959, defaultIVs: { cp2500: [50, 15, 15, 15] }, tags: [] },
      { speciesId: 'mewtwo_shadow', dex: 150, tags: ['legendary', 'shadow'] },
    ];

    const merged = mergeSyncedPvPokeCache(samplePayload, pokedex, gamemaster);
    expect(merged.isLiveSynced).toBe(true);
    expect(merged.metaSnapshot.pvp.gl.top100.lowAtk).toContain(980);
    expect(merged.metaSnapshot.pvp.gl.top100.highAtk).toContain(108);
    expect(merged.metaSnapshot.pvp.ul.top100.highAtk).toContain(959);
    expect(merged.metaSnapshot.pvp.ml.top100.shadow).toContain(150);

    commitSyncedMetaCache(merged);
    const activeSnap = getActiveMetaSnapshot();
    expect(activeSnap.isLiveSynced).toBe(true);
    expect(activeSnap.pvp.gl.top100.highAtk).toContain(108);

    const sets = computeMetaIdSets(merged, pokedex);
    expect(sets.glFamilyIds).toContain(194); // Wooper expanded from Clodsire
    expect(sets.strictNonMetaIds.length).toBeGreaterThan(200);
  });
});
