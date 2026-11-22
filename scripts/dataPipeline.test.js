import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { describe, expect, it } from 'vitest';

import {
  EXPECTED_POKEDEX_COUNT,
  REGIONS,
  getRegion,
  getSpriteUrl,
  normalizePokemonClass,
  fetchWithRetry,
  transformPokedexData,
  validatePokedex,
  writeJsonAtomically,
} from './fetch_data.js';

import {
  ALL_TYPES,
  SPECIAL_LISTS,
  isShadowPokemonId,
  isMegaOrPrimalPokemonId,
  pokebattlerShadowToPvpokeId,
  formatMoveDisplayName,
  computeComprehensiveDpsTdo,
  parsePokechespinMaxLists,
  extractFastMoves500ms,
  parsePokeMinersFallback,
  validateMetaSnapshot,
} from './fetch_meta.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const pokedex = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/pokedex.json'), 'utf8'));
const metaSnapshot = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/meta_snapshot.json'), 'utf8'));

describe('pokedex.json build-time snapshot', () => {
  it('passes full schema validation with 1,025 contiguous entries', () => {
    const result = validatePokedex(pokedex);
    expect(result.errors).toEqual([]);
    expect(result.valid).toBe(true);
    expect(pokedex).toHaveLength(EXPECTED_POKEDEX_COUNT);
    expect(pokedex[0].id).toBe(1);
    expect(pokedex[1024].id).toBe(1025);
  });

  it('uses uniform PokeAPI pixel sprite URLs for every entry', () => {
    for (const p of pokedex) {
      expect(p.sprite).toBe(getSpriteUrl(p.id));
    }
  });

  it('splits 10 regions accurately including Hisui (#899–#905) separate from Galar (#810–#898)', () => {
    expect(REGIONS).toHaveLength(10);
    expect(getRegion(898)).toBe('Galar');
    expect(getRegion(899)).toBe('Hisui');
    expect(getRegion(902)).toBe('Hisui');
    expect(getRegion(905)).toBe('Hisui');
    expect(getRegion(906)).toBe('Paldea');

    const hisuiEntries = pokedex.filter((p) => p.region === 'Hisui');
    expect(hisuiEntries.map((p) => p.id)).toEqual([899, 900, 901, 902, 903, 904, 905]);
    const galarEntries = pokedex.filter((p) => p.region === 'Galar');
    expect(galarEntries).toHaveLength(89);
  });

  it('patches #902 Basculegion cleanly in Hisui with Basculin evolution family', () => {
    const basculegion = pokedex[901];
    expect(basculegion.id).toBe(902);
    expect(basculegion.name).toBe('Basculegion');
    expect(basculegion.region).toBe('Hisui');
    expect(basculegion.types).toEqual(['water', 'ghost']);
    expect(basculegion.familyId).toBe(550);
    expect(basculegion.familyDexes).toEqual([550, 902]);
  });

  it('computes true connected-component evolutionary families (Pikachu, Eevee, Wooper/Clodsire, Scyther/Kleavor)', () => {
    expect(pokedex[24].familyDexes).toEqual([25, 26, 172]); // Pikachu
    expect(pokedex[171].familyDexes).toEqual([25, 26, 172]); // Pichu
    expect(pokedex[132].familyDexes).toEqual([133, 134, 135, 136, 196, 197, 470, 471, 700]); // Eevee
    expect(pokedex[699].familyDexes).toEqual([133, 134, 135, 136, 196, 197, 470, 471, 700]); // Sylveon
    expect(pokedex[193].familyDexes).toEqual([194, 195, 980]); // Wooper -> Quagsire + Clodsire
    expect(pokedex[979].familyDexes).toEqual([194, 195, 980]); // Clodsire
    expect(pokedex[122].familyDexes).toEqual([123, 212, 900]); // Scyther -> Scizor + Kleavor
  });

  it('normalizes pokemonClass, evolveCandy, Mega/Gmax flags, and regional forms', () => {
    expect(normalizePokemonClass('POKEMON_CLASS_MYTHIC')).toBe('mythical');
    expect(normalizePokemonClass('POKEMON_CLASS_ULTRA_BEAST')).toBe('ultrabeast');
    expect(pokedex[9].evolveCandy).toBe(12); // Caterpie
    expect(pokedex[128].evolveCandy).toBe(400); // Magikarp
    expect(pokedex[383].pokemonClass).toBe('legendary'); // Rayquaza
    expect(pokedex[383].hasMega).toBe(true);
    expect(pokedex[792].pokemonClass).toBe('ultrabeast'); // Nihilego
    expect(pokedex[193].regionalForms).toContain('paldea'); // Wooper
  });
});

describe('atomic file writing & retry resilience', () => {
  it('aborts without clobbering existing file when validation fails', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pogo-atomic-test-'));
    const targetPath = path.join(tmpDir, 'snapshot.json');
    const originalContent = JSON.stringify({ sentinel: 'keep-me' });
    fs.writeFileSync(targetPath, originalContent, 'utf8');

    expect(() =>
      writeJsonAtomically(targetPath, { bad: true }, () => ({ valid: false, errors: ['corrupt payload'] }))
    ).toThrow(/Validation failed/);

    // Original file must remain intact and no temp files left behind
    expect(fs.readFileSync(targetPath, 'utf8')).toBe(originalContent);
    expect(fs.readdirSync(tmpDir)).toEqual(['snapshot.json']);
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('retries HTTP 503 responses with backoff and succeeds on recovery', async () => {
    let attempts = 0;
    const mockFetch = async () => {
      attempts++;
      if (attempts < 3) {
        return { ok: false, status: 503, statusText: 'Service Unavailable' };
      }
      return { ok: true, status: 200, json: async () => ({ ok: true }) };
    };

    const res = await fetchWithRetry('https://example.test/api', {
      retries: 3,
      baseDelayMs: 1,
      fetchImpl: mockFetch,
    });
    expect(attempts).toBe(3);
    expect(await res.json()).toEqual({ ok: true });
  });

  it('rejects non-array pokedex payloads', () => {
    expect(() => transformPokedexData({ invalid: true })).toThrow(/not an array/);
  });
});

describe('meta_snapshot.json build-time snapshot', () => {
  it('passes full schema & domain sanity validation', () => {
    const result = validateMetaSnapshot(metaSnapshot);
    expect(result.errors).toEqual([]);
    expect(result.valid).toBe(true);
    expect(metaSnapshot.schemaVersion).toBe(1);
    expect(metaSnapshot.specialLists).toEqual(SPECIAL_LISTS);
  });

  it('populates PvP Top 100 GL/UL/ML with Low-Atk vs High-Atk/XL split and family expansion', () => {
    expect(metaSnapshot.pvp.gl.top100.all.length).toBeGreaterThanOrEqual(80);
    expect(metaSnapshot.pvp.gl.top100.lowAtk.length).toBeGreaterThan(metaSnapshot.pvp.gl.top100.highAtk.length);
    expect(metaSnapshot.pvp.ul.top100.highAtk.length).toBeGreaterThanOrEqual(15);
    expect(metaSnapshot.pvp.ml.top100.all.length).toBeGreaterThanOrEqual(60);
    expect(metaSnapshot.pvp.allShadow.length).toBeGreaterThanOrEqual(40);
    expect(metaSnapshot.pvp.allTradeReroll.length).toBeGreaterThanOrEqual(5);

    // Every included dex in gl.top100.all must have its entire evolution family included
    const glSet = new Set(metaSnapshot.pvp.gl.top100.all);
    for (const dex of metaSnapshot.pvp.gl.top100.all) {
      for (const famDex of pokedex[dex - 1].familyDexes) {
        expect(glSet.has(famDex)).toBe(true);
      }
    }
  });

  it('populates PvE Top 10 for all 18 types with realistic raid staples & evolved-only Mega separation', () => {
    expect(Object.keys(metaSnapshot.pve.byType).sort()).toEqual(ALL_TYPES);
    expect(metaSnapshot.pve.byType.dragon).toContain(384); // Rayquaza
    expect(metaSnapshot.pve.byType.flying).toContain(384); // Rayquaza
    expect(metaSnapshot.pve.byType.ground).toContain(383); // Groudon
    expect(metaSnapshot.pve.byType.water).toContain(382); // Kyogre
    expect(metaSnapshot.pve.byType.psychic).toContain(150); // Mewtwo
    expect(metaSnapshot.pve.byType.fighting).toContain(448); // Lucario
    expect(metaSnapshot.pve.byType.ghost).toContain(800); // Necrozma Dawn Wings
    expect(metaSnapshot.pve.byType.steel).toContain(800); // Necrozma Dusk Mane
    expect(metaSnapshot.pve.byType.steel).toContain(888); // Zacian Crowned
    expect(metaSnapshot.pve.byType.ice).toContain(646); // Kyurem White/Black
    expect(metaSnapshot.pve.byType.ice).toContain(473); // Shadow Mamoswine

    // topMegaEvolved must be strictly evolved-only (e.g., Lucario #448 present, pre-evo Riolu #447 absent!)
    expect(metaSnapshot.pve.topMegaEvolved).toContain(448);
    expect(metaSnapshot.pve.topMegaEvolved).not.toContain(447);
    // topMegaFamily must expand to include pre-evos like Riolu #447
    expect(metaSnapshot.pve.topMegaFamily).toContain(448);
    expect(metaSnapshot.pve.topMegaFamily).toContain(447);
  });

  it('populates Max Battles Attackers, Tanks, Healers, and 25 verified 0.5s Fast Moves', () => {
    expect(metaSnapshot.maxBattles.attackers).toContain(890); // Eternatus
    expect(metaSnapshot.maxBattles.attackers).toContain(888); // Crowned Zacian
    expect(metaSnapshot.maxBattles.attackers).toContain(94); // G-Max Gengar
    expect(metaSnapshot.maxBattles.tanks).toContain(242); // Blissey
    expect(metaSnapshot.maxBattles.tanks).toContain(889); // Crowned Zamazenta
    expect(metaSnapshot.maxBattles.healers).toContain(242); // Blissey
    expect(metaSnapshot.maxBattles.healers).toContain(113); // Chansey
    expect(metaSnapshot.maxBattles.fastMoves500ms).toHaveLength(25);
    expect(metaSnapshot.maxBattles.fastMoves500ms).toEqual(
      expect.arrayContaining(['Bug Bite', 'Dragon Breath', 'Lock-On', 'Metal Claw', 'Pound', 'Shadow Claw', 'Water Gun'])
    );
  });
});

describe('fetch_meta.js pure calculator & parser helpers', () => {
  it('avoids false positives on MARSHADOW, MEGANIUM, and YANMEGA', () => {
    expect(isShadowPokemonId('MARSHADOW')).toBe(false);
    expect(isShadowPokemonId('MEWTWO_SHADOW_FORM')).toBe(true);
    expect(isMegaOrPrimalPokemonId('MEGANIUM')).toBe(false);
    expect(isMegaOrPrimalPokemonId('YANMEGA')).toBe(false);
    expect(isMegaOrPrimalPokemonId('RAYQUAZA_MEGA')).toBe(true);
    expect(isMegaOrPrimalPokemonId('GROUDON_PRIMAL')).toBe(true);
    expect(pokebattlerShadowToPvpokeId('PALKIA_ORIGIN_SHADOW_FORM')).toBe('palkia_origin_shadow');
  });

  it('formats special move names accurately', () => {
    expect(formatMoveDisplayName('LOCK_ON_FAST')).toBe('Lock-On');
    expect(formatMoveDisplayName('BUG_BITE_FAST')).toBe('Bug Bite');
    expect(formatMoveDisplayName('SHADOW_CLAW_FAST')).toBe('Shadow Claw');
  });

  it('scores Shadow attackers higher in DPS than non-Shadow of the same species', () => {
    const base = {
      stats: { baseAttack: 247, baseDefense: 146, baseStamina: 242 },
      types: ['ice', 'ground'],
      isMega: false,
    };
    const fm = { type: 'POKEMON_TYPE_ICE', power: 6, durationMs: 1000, energyDelta: 15 };
    const cm = { type: 'POKEMON_TYPE_ICE', power: 90, durationMs: 2500, damageWindowStartMs: 2000, energyDelta: -50 };
    const regular = computeComprehensiveDpsTdo({ ...base, isShadow: false }, fm, cm, 'ice');
    const shadow = computeComprehensiveDpsTdo({ ...base, isShadow: true }, fm, cm, 'ice');
    expect(shadow.dps).toBeGreaterThan(regular.dps);
    expect(shadow.edps).toBeGreaterThan(regular.edps);
  });

  it('fails fast when PokéChespin DynamaxPokemon is missing required anchors', () => {
    const badTs = `
      static UpcomingGMaxPokemon = ["EEVEE_GIGANTAMAX"];
      static DynamaxPokemon = ["WOOLOO", "SKWOVET"];
    `;
    expect(() => parsePokechespinMaxLists(badTs)).toThrow(/missing required anchor/);
  });

  it('extracts 500ms moves and parses PokeMiners fallback entries cleanly', () => {
    const fallback = parsePokeMinersFallback([
      {
        templateId: 'V0242_POKEMON_BLISSEY',
        data: {
          pokemonSettings: {
            pokemonId: 'BLISSEY',
            type: 'POKEMON_TYPE_NORMAL',
            stats: { baseAttack: 129, baseDefense: 169, baseStamina: 496 },
            quickMoves: ['POUND_FAST'],
            cinematicMoves: ['DAZZLING_GLEAM'],
          },
        },
      },
      {
        templateId: 'V0205_MOVE_POUND_FAST',
        data: {
          moveSettings: {
            movementId: 'POUND_FAST',
            pokemonType: 'POKEMON_TYPE_NORMAL',
            power: 7,
            durationMs: 500,
            energyDelta: 6,
          },
        },
      },
    ]);
    expect(fallback.pokemon).toHaveLength(1);
    expect(fallback.pokemon[0].pokedex.pokemonNum).toBe(242);
    expect(extractFastMoves500ms(fallback.moves)).toEqual(['Pound']);
  });
});
