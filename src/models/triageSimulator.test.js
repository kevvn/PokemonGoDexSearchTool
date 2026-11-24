import { describe, test, expect } from 'vitest';
import realMetaSnapshot from '../data/meta_snapshot.json';
import { parseToAst, validateSearchString } from './searchEngine';
import { buildTriageFunnels } from './triageFunnelModel';
import { getAllTagHydrationSteps, createDefaultTagMap } from './tagModel';
import {
  BUNDLED_EVENTS_ARCHIVE,
  TRAVEL_TRIPS,
  buildEventActionStrings,
  computeYearSlicerPlan,
} from './eventArchiveModel';
import { COMMUNITY_DAY_EVENTS } from './communityDayModel';

function parseRangeExpr(expr, bareIsMax = false) {
  if (expr === '') return { min: -Infinity, max: Infinity };
  if (/^\d+$/.test(expr)) {
    const n = Number(expr);
    return bareIsMax ? { min: -Infinity, max: n } : { min: n, max: n };
  }
  const m = expr.match(/^(\d*)-(\d*)$/);
  if (!m) return null;
  const min = m[1] === '' ? -Infinity : Number(m[1]);
  const max = m[2] === '' ? Infinity : Number(m[2]);
  return { min, max };
}

function inRange(val, range) {
  return range !== null && val >= range.min && val <= range.max;
}

function ivToBar(iv) {
  if (iv === 0) return 0;
  if (iv <= 5) return 1;
  if (iv <= 10) return 2;
  if (iv <= 14) return 3;
  return 4;
}

function ivSumToStar(sum) {
  if (sum === 45) return '4*';
  if (sum >= 37) return '3*';
  if (sum >= 30) return '2*';
  if (sum >= 23) return '1*';
  return '0*';
}

function normalizeMoveKey(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function evaluateAtom(mon, atom, dexCounts) {
  const rawVal = atom.value.trim().toLowerCase();
  const negated = atom.negated;

  const ivBarMatch = rawVal.match(/^([0-4](?:-[0-4])?)(attack|defense|hp)$/);
  if (ivBarMatch) {
    const range = parseRangeExpr(ivBarMatch[1], false);
    const statName = ivBarMatch[2];
    const statVal =
      statName === 'attack' ? mon.atk : statName === 'defense' ? mon.def : mon.hp;
    return inRange(ivToBar(statVal), range);
  }

  const megaMatch = rawVal.match(/^mega([0-4](?:-[0-4])?)$/);
  if (megaMatch) {
    if (!mon.megaCapable) return false;
    const range = parseRangeExpr(megaMatch[1], false);
    const matchesLevel = inRange(mon.megaLevel ?? 0, range);
    return negated ? !matchesLevel : matchesLevel;
  }

  const evalPositive = () => {
    if (rawVal === '#') {
      return Array.isArray(mon.tags) && mon.tags.length > 0;
    }
    if (rawVal.startsWith('#')) {
      const prefix = rawVal.slice(1);
      return (mon.tags || []).some((t) =>
        t.toLowerCase().replace(/[^a-z0-9-]/g, '').startsWith(prefix.replace(/[^a-z0-9-]/g, '')) ||
        t.toLowerCase().startsWith(prefix)
      );
    }

    if (/^\d+(?:-\d+)?$/.test(rawVal) || /^-\d+$/.test(rawVal) || /^\d+-$/.test(rawVal)) {
      return inRange(mon.dex, parseRangeExpr(rawVal, false));
    }

    if (/^[0-4]\*$/.test(rawVal)) {
      return ivSumToStar(mon.atk + mon.def + mon.hp) === rawVal;
    }

    if (rawVal === 'favorite') return Boolean(mon.favorite);
    if (rawVal === 'shiny') return Boolean(mon.shiny);
    if (rawVal === 'lucky') return Boolean(mon.lucky);
    if (rawVal === 'traded') return Boolean(mon.traded);
    if (rawVal === 'shadow') return Boolean(mon.shadow);
    if (rawVal === 'purified') return Boolean(mon.purified);
    if (rawVal === 'costume') return Boolean(mon.costume);
    if (rawVal === 'legendary') return Boolean(mon.legendary);
    if (rawVal === 'mythical') return Boolean(mon.mythical);
    if (rawVal === 'ultrabeast' || rawVal === 'ultra beasts') return Boolean(mon.ultrabeast);
    if (rawVal === 'eggsonly') return Boolean(mon.eggsonly);
    if (rawVal === 'xxl') return Boolean(mon.xxl);
    if (rawVal === 'xxs') return Boolean(mon.xxs);
    if (rawVal === 'fusion') return Boolean(mon.fusion);
    if (rawVal === 'adventureeffect') return Boolean(mon.adventureeffect);
    if (rawVal === 'dynamax') return Boolean(mon.dynamax);
    if (rawVal === 'gigantamax') return Boolean(mon.gigantamax);
    if (rawVal === 'evolvenew') return Boolean(mon.evolvenew);
    if (rawVal === 'evolve') return Boolean(mon.canEvolve);
    if (rawVal === 'tradeevolve') return Boolean(mon.tradeEvolveSpecies && !mon.traded);
    if (rawVal === 'megaevolve') return Boolean(mon.megaCapable && !mon.shadow);
    if (rawVal === 'raid') return Boolean(mon.raid);
    if (rawVal === 'remoteraid') return Boolean(mon.remoteraid);
    if (rawVal === 'party') return Boolean(mon.party);
    if (rawVal === 'candyxl') return Boolean(mon.candyxl);
    if (rawVal.startsWith('candykm')) {
      return inRange(mon.candyKm ?? 3, parseRangeExpr(rawVal.slice('candykm'.length), false));
    }

    if (rawVal === 'locationbackground') return Boolean(mon.locationbackground);
    if (rawVal === 'specialbackground') return Boolean(mon.specialbackground);
    if (rawVal === 'profilebackground') return Boolean(mon.profilebackground);
    if (rawVal === 'background') {
      return Boolean(mon.locationbackground || mon.specialbackground || mon.profilebackground);
    }

    if (rawVal.startsWith('countcandyxl')) {
      const range = parseRangeExpr(rawVal.slice('countcandyxl'.length), true);
      return inRange(mon.candyXl ?? 0, range);
    }
    if (rawVal.startsWith('countcandy')) {
      const range = parseRangeExpr(rawVal.slice('countcandy'.length), true);
      return inRange(mon.candy ?? 0, range);
    }
    if (rawVal.startsWith('count')) {
      const range = parseRangeExpr(rawVal.slice('count'.length), false);
      return inRange(dexCounts.get(mon.dex) || 0, range);
    }

    if (rawVal.startsWith('age')) {
      return inRange(mon.age ?? 0, parseRangeExpr(rawVal.slice(3), false));
    }
    if (rawVal.startsWith('year')) {
      return inRange(mon.year ?? 2026, parseRangeExpr(rawVal.slice(4), false));
    }
    if (rawVal.startsWith('cp')) {
      return inRange(mon.cp ?? 500, parseRangeExpr(rawVal.slice(2), false));
    }
    if (rawVal.startsWith('distance')) {
      const expr = rawVal.slice('distance'.length);
      return inRange(mon.distance ?? 0, parseRangeExpr(expr, /^\d+$/.test(expr)));
    }
    if (rawVal.startsWith('buddy')) {
      return inRange(mon.buddy ?? 0, parseRangeExpr(rawVal.slice(5), false));
    }

    if (rawVal.startsWith('maxmove')) {
      const lvl = mon.maxMove ?? (mon.dynamax || mon.gigantamax || mon.crownedMax ? 1 : 0);
      if (lvl === 0) return false;
      return inRange(lvl, parseRangeExpr(rawVal.slice('maxmove'.length), false));
    }
    if (rawVal.startsWith('maxguard')) {
      const lvl = mon.maxGuard ?? 0;
      if (!(mon.dynamax || mon.gigantamax || mon.crownedMax)) return false;
      return inRange(lvl, parseRangeExpr(rawVal.slice('maxguard'.length), false));
    }
    if (rawVal.startsWith('maxspirit')) {
      const lvl = mon.maxSpirit ?? 0;
      if (!(mon.dynamax || mon.gigantamax || mon.crownedMax)) return false;
      return inRange(lvl, parseRangeExpr(rawVal.slice('maxspirit'.length), false));
    }

    if (rawVal.startsWith('@')) {
      const moveQuery = rawVal.slice(1);
      if (moveQuery.startsWith('3mov')) {
        return !mon.hasSecondMove;
      }
      if (moveQuery === 'special') {
        const moves = [mon.fastMove, mon.charged1, mon.charged2].filter(Boolean).map(normalizeMoveKey);
        return Boolean(mon.legacyMove) || moves.includes('frustration') || moves.includes('return');
      }
      if (moveQuery.startsWith('1')) {
        const fastTarget = normalizeMoveKey(moveQuery.slice(1));
        return normalizeMoveKey(mon.fastMove).startsWith(fastTarget);
      }
      const target = normalizeMoveKey(moveQuery);
      const allMoves = [mon.fastMove, mon.charged1, mon.charged2].filter(Boolean).map(normalizeMoveKey);
      const moveTypes = (mon.moveTypes || []).map((t) => t.toLowerCase());
      return allMoves.some((m) => m.startsWith(target)) || moveTypes.includes(target);
    }

    throw new Error(`Unhandled PoGO search token in simulator: "${atom.raw}" (parsed "${rawVal}")`);
  };

  const pos = evalPositive();
  return negated ? !pos : pos;
}

export function evaluatePogoBox(box, queryString) {
  const dexCounts = new Map();
  for (const mon of box) {
    dexCounts.set(mon.dex, (dexCounts.get(mon.dex) || 0) + 1);
  }

  const ast = parseToAst(queryString);
  return box.filter((mon) =>
    ast.clauses.every((clause) =>
      clause.atoms.some((atom) => evaluateAtom(mon, atom, dexCounts))
    )
  );
}

function createMon(overrides) {
  return {
    id: overrides.id,
    dex: overrides.dex,
    atk: 10,
    def: 10,
    hp: 10,
    cp: 800,
    age: 0,
    year: 2026,
    distance: 2,
    tags: [],
    favorite: false,
    shiny: false,
    lucky: false,
    traded: false,
    shadow: false,
    purified: false,
    costume: false,
    legendary: false,
    mythical: false,
    ultrabeast: false,
    eggsonly: false,
    xxl: false,
    xxs: false,
    fusion: false,
    adventureeffect: false,
    dynamax: false,
    gigantamax: false,
    crownedMax: false,
    megaCapable: false,
    megaLevel: 0,
    hasSecondMove: false,
    legacyMove: false,
    fastMove: 'tackle',
    charged1: 'struggle',
    charged2: null,
    canEvolve: false,
    tradeEvolveSpecies: false,
    ...overrides,
  };
}

describe('Leidwesen v0.435.1 Pokémon GO Box Simulator — End-to-End Triage Verification', () => {
  test('proves PoGO count{N} specimen-variant trap & verifies 0% grail casualties in Emergency Dump (E1)', () => {
    const tagMap = createDefaultTagMap();
    const funnels = buildTriageFunnels(realMetaSnapshot, tagMap, { ageScope: 'age0' });

    const box = [
      createMon({ id: 'necro_bg_1of1', dex: 800, atk: 10, def: 11, hp: 10, legendary: true, specialbackground: true }),
      ...Array.from({ length: 5 }, (_, i) =>
        createMon({ id: `necro_plain_${i}`, dex: 800, atk: 11, def: 11, hp: 11, legendary: true })
      ),
      createMon({ id: 'beldum_shiny_1of1', dex: 374, atk: 4, def: 8, hp: 6, shiny: true }),
      ...Array.from({ length: 4 }, (_, i) =>
        createMon({ id: `beldum_plain_${i}`, dex: 374, atk: 8, def: 8, hp: 8 })
      ),
      createMon({ id: 'pika_costume_1of1', dex: 25, atk: 5, def: 5, hp: 5, costume: true }),
      ...Array.from({ length: 10 }, (_, i) =>
        createMon({ id: `pika_plain_${i}`, dex: 25, atk: 7, def: 7, hp: 7 })
      ),
      createMon({ id: 'licki_xl_gl', dex: 108, atk: 8, def: 14, hp: 15, cp: 1380 }),
      createMon({ id: 'corsola_xl_gl', dex: 222, atk: 7, def: 15, hp: 15, cp: 1420 }),
      createMon({ id: 'marill_pvp_0_15_15', dex: 183, atk: 0, def: 15, hp: 15, cp: 410 }),
      createMon({ id: 'nundo_0_0_0', dex: 19, atk: 0, def: 0, hp: 0 }),
      createMon({ id: 'unown_1star', dex: 201, atk: 8, def: 9, hp: 8 }),
      createMon({ id: 'rotom_1star', dex: 479, atk: 9, def: 8, hp: 9 }),
      createMon({ id: 'hawlucha_1star', dex: 701, atk: 7, def: 9, hp: 9 }),
      createMon({ id: 'frigibax_1star', dex: 996, atk: 8, def: 8, hp: 9 }),
      createMon({ id: 'larvesta_1star', dex: 636, atk: 9, def: 9, hp: 8 }),
      createMon({ id: 'toxel_baby', dex: 848, atk: 10, def: 10, hp: 10, eggsonly: true }),
      createMon({ id: 'tokyo_7km_hatch', dex: 52, atk: 10, def: 10, hp: 10, distance: 8950 }),
      createMon({ id: 'built_azumarill_untagged', dex: 184, atk: 8, def: 12, hp: 12, cp: 1498, hasSecondMove: true }),
      createMon({ id: 'shadow_swinub', dex: 220, atk: 6, def: 6, hp: 6, shadow: true, fastMove: 'powdersnow', charged1: 'frustration' }),
      createMon({ id: 'dmax_chansey', dex: 113, atk: 10, def: 10, hp: 10, dynamax: true, fastMove: 'pound' }),
      createMon({ id: 'trash_yungoos', dex: 734, atk: 9, def: 7, hp: 8 }),
      createMon({ id: 'trash_pidove', dex: 519, atk: 6, def: 9, hp: 5 }),
      createMon({ id: 'trash_bidoof', dex: 399, atk: 12, def: 4, hp: 6 }),
    ];

    expect(evaluatePogoBox(box, 'specialbackground&count4-').map((m) => m.id)).toContain('necro_bg_1of1');
    expect(evaluatePogoBox(box, 'shiny&count4-').map((m) => m.id)).toContain('beldum_shiny_1of1');
    expect(evaluatePogoBox(box, 'costume&count3-').map((m) => m.id)).toContain('pika_costume_1of1');

    const e1Query = funnels.emergencyDump.steps[0].query;
    const dumpedIds = evaluatePogoBox(box, e1Query).map((m) => m.id);

    const protectedIds = [
      'necro_bg_1of1',
      'beldum_shiny_1of1',
      'pika_costume_1of1',
      'licki_xl_gl',
      'corsola_xl_gl',
      'marill_pvp_0_15_15',
      'nundo_0_0_0',
      'unown_1star',
      'rotom_1star',
      'hawlucha_1star',
      'frigibax_1star',
      'larvesta_1star',
      'toxel_baby',
      'tokyo_7km_hatch',
      'built_azumarill_untagged',
      'shadow_swinub',
      'dmax_chansey',
    ];
    for (const id of protectedIds) {
      expect(dumpedIds, `E1 must NEVER dump ${id}`).not.toContain(id);
    }

    expect(dumpedIds).toContain('trash_yungoos');
    expect(dumpedIds).toContain('trash_pidove');
    expect(dumpedIds).toContain('trash_bidoof');
  });

  test('executes Mode A (A1 -> A7) end-to-end with zero dead zones and reaches exact !# Inbox Zero', () => {
    const tagMap = createDefaultTagMap();
    const funnels = buildTriageFunnels(realMetaSnapshot, tagMap, { ageScope: 'age0' });
    const steps = Object.fromEntries(funnels.modes.modeA.steps.map((s) => [s.id, s]));

    let box = [
      createMon({ id: 'hundo_gible', dex: 443, atk: 15, def: 15, hp: 15 }),
      createMon({ id: 'nundo_rattata', dex: 19, atk: 0, def: 0, hp: 0 }),
      createMon({ id: 'shiny_bg_zacian', dex: 888, atk: 14, def: 14, hp: 14, shiny: true, legendary: true, locationbackground: true }),
      createMon({ id: 'shadow_swinub', dex: 220, atk: 13, def: 12, hp: 11, shadow: true, charged1: 'frustration' }),
      createMon({ id: 'junk_shadow_zubat', dex: 41, atk: 4, def: 7, hp: 6, shadow: true, charged1: 'frustration' }),
      createMon({ id: 'dmax_blissey', dex: 242, atk: 12, def: 15, hp: 15, dynamax: true }),
      createMon({ id: 'gl_marill_low_atk', dex: 183, atk: 0, def: 15, hp: 15, cp: 420 }),
      createMon({ id: 'gl_lickitung_xl_3star', dex: 108, atk: 8, def: 14, hp: 15, cp: 1390 }),
      createMon({ id: 'nonmeta_yungoos_0_14_14', dex: 734, atk: 0, def: 14, hp: 14, cp: 350 }),
      createMon({ id: 'pve_bagon_glass_3star', dex: 371, atk: 15, def: 10, hp: 15, cp: 900 }),
      createMon({ id: 'nonmeta_raticate_3star', dex: 20, atk: 14, def: 13, hp: 13, cp: 1100 }),
      createMon({ id: 'unown_rare', dex: 201, atk: 7, def: 8, hp: 7 }),
      createMon({ id: 'dist_100km_catch', dex: 16, atk: 5, def: 6, hp: 7, distance: 450 }),
      createMon({ id: 'xxl_largest_pumpkaboo', dex: 710, atk: 8, def: 8, hp: 8, xxl: true }),
      createMon({ id: 'xxl_small_spare_pidgey', dex: 16, atk: 6, def: 5, hp: 6, xxl: true }),
      createMon({ id: 'plain_trash_lechonker', dex: 915, atk: 8, def: 6, hp: 7 }),
    ];

    for (const m of evaluatePogoBox(box, steps.A1.query)) {
      m.favorite = true;
      m.tags.push(m.shiny && m.locationbackground ? 'EV-ShBG' : 'PVE-WIP');
    }
    for (const m of evaluatePogoBox(box, steps.A1.subQueries[0].query)) {
      m.favorite = true;
      m.tags.push('KEEP-Trophy');
    }

    const a2Matches = evaluatePogoBox(box, steps.A2.query).map((m) => m.id);
    expect(a2Matches).toEqual(expect.arrayContaining(['shadow_swinub', 'junk_shadow_zubat', 'dmax_blissey']));
    box.find((m) => m.id === 'shadow_swinub').tags.push('PVE-WIP', 'OP-TMFrust');
    box.find((m) => m.id === 'dmax_blissey').tags.push('MAX-Tank');
    box = box.filter((m) => m.id !== 'junk_shadow_zubat');

    const a3PrimaryIds = evaluatePogoBox(box, steps.A3.query).map((m) => m.id);
    expect(a3PrimaryIds).toContain('gl_marill_low_atk');
    expect(a3PrimaryIds).not.toContain('nonmeta_yungoos_0_14_14');
    box.find((m) => m.id === 'gl_marill_low_atk').tags.push('PVP-WIP');

    const a3XlIds = evaluatePogoBox(box, steps.A3.subQueries[0].query).map((m) => m.id);
    expect(a3XlIds).toContain('gl_lickitung_xl_3star');
    box.find((m) => m.id === 'gl_lickitung_xl_3star').tags.push('PVP-WIP');

    const a4Ids = evaluatePogoBox(box, steps.A4.query).map((m) => m.id);
    expect(a4Ids).toContain('pve_bagon_glass_3star');
    expect(a4Ids).not.toContain('nonmeta_raticate_3star');
    box.find((m) => m.id === 'pve_bagon_glass_3star').tags.push('PVE-WIP');

    const a5RareIds = evaluatePogoBox(box, steps.A5.query).map((m) => m.id);
    expect(a5RareIds).toContain('unown_rare');
    box.find((m) => m.id === 'unown_rare').tags.push('TR-Spec');

    const a5DistIds = evaluatePogoBox(box, steps.A5.subQueries[0].query).map((m) => m.id);
    expect(a5DistIds).toContain('dist_100km_catch');
    box.find((m) => m.id === 'dist_100km_catch').tags.push('TR-Dist');

    const a5XxlIds = evaluatePogoBox(box, steps.A5.subQueries[2].query).map((m) => m.id);
    expect(a5XxlIds).toEqual(expect.arrayContaining(['xxl_largest_pumpkaboo', 'xxl_small_spare_pidgey']));
    box.find((m) => m.id === 'xxl_largest_pumpkaboo').tags.push('ShowcaseXXL');

    const a6Trash = new Set(evaluatePogoBox(box, steps.A6.query).map((m) => m.id));
    expect(a6Trash.has('plain_trash_lechonker')).toBe(true);
    expect(a6Trash.has('nundo_rattata')).toBe(false);
    box = box.filter((m) => !a6Trash.has(m.id));

    const a7Trash = new Set(evaluatePogoBox(box, steps.A7.query).map((m) => m.id));
    expect(a7Trash.has('nonmeta_yungoos_0_14_14')).toBe(true);
    expect(a7Trash.has('nonmeta_raticate_3star')).toBe(true);
    expect(a7Trash.has('xxl_small_spare_pidgey')).toBe(true);
    expect(a7Trash.has('nundo_rattata')).toBe(false);
    box = box.filter((m) => !a7Trash.has(m.id));

    const inboxRemaining = evaluatePogoBox(box, steps.A7.subQueries[0].query);
    expect(inboxRemaining).toHaveLength(0);
  });

  test('verifies 6-Stage Tag Hydration stage ordering without @frustration, mega1-2, or common count2- hijacking', () => {
    const tagMap = createDefaultTagMap();
    const flatItems = getAllTagHydrationSteps(tagMap, realMetaSnapshot);
    const byId = Object.fromEntries(flatItems.map((it) => [it.tagId, it]));

    const box = [
      createMon({ id: 'shadow_mamoswine_frust', dex: 473, atk: 15, def: 14, hp: 14, shadow: true, charged1: 'frustration' }),
      createMon({ id: 'purified_sableye_return', dex: 302, atk: 3, def: 15, hp: 15, cp: 1480, purified: true, charged1: 'return' }),
      createMon({ id: 'legacy_mewtwo_psystrike', dex: 150, atk: 15, def: 15, hp: 14, legendary: true, legacyMove: true, charged1: 'psystrike' }),
      createMon({ id: 'mega1_charizard', dex: 6, atk: 15, def: 14, hp: 15, megaCapable: true, megaLevel: 1 }),
      createMon({ id: 'preevo_charmander', dex: 4, atk: 15, def: 15, hp: 14, canEvolve: true }),
      createMon({ id: 'dup_yungoos_1', dex: 734, atk: 6, def: 7, hp: 6 }),
      createMon({ id: 'dup_yungoos_2', dex: 734, atk: 8, def: 5, hp: 7 }),
      createMon({ id: 'dup_frigibax_1', dex: 996, atk: 10, def: 10, hp: 10 }),
      createMon({ id: 'dup_frigibax_2', dex: 996, atk: 11, def: 10, hp: 10 }),
    ];

    const trophyIds = evaluatePogoBox(box, byId.keep_trophy.queries[2].query).map((m) => m.id);
    expect(trophyIds).not.toContain('shadow_mamoswine_frust');
    expect(trophyIds).not.toContain('purified_sableye_return');

    const megaPreEvoIds = evaluatePogoBox(box, byId.pve_megawip.queries[1].query).map((m) => m.id);
    expect(megaPreEvoIds).toContain('preevo_charmander');
    expect(megaPreEvoIds).not.toContain('mega1_charizard');

    const opMegaIds = evaluatePogoBox(box, byId.op_mega.queries[0].query).map((m) => m.id);
    expect(opMegaIds).toContain('mega1_charizard');

    const mirrorIds = evaluatePogoBox(box, byId.tr_mirror.queries[0].query).map((m) => m.id);
    expect(mirrorIds).toContain('dup_frigibax_1');
    expect(mirrorIds).not.toContain('dup_yungoos_1');
  });

  test('protects PvE Shadows & #op-tmfrust in Mode B8 and protects 3* / PvP / Nundo / Free Trade-Evos in Mode D2', () => {
    const tagMap = createDefaultTagMap();
    const funnels = buildTriageFunnels(realMetaSnapshot, tagMap, { ageScope: 'age0' });
    const b8 = funnels.modes.modeB.steps.find((s) => s.id === 'B8');
    const d2 = funnels.modes.modeD.steps.find((s) => s.id === 'D2_bad_trades');

    const box = [
      createMon({ id: 'shadow_swinub_top_pve', dex: 220, atk: 8, def: 8, hp: 8, shadow: true, charged1: 'frustration' }),
      createMon({ id: 'shadow_feraligatr_tm_queue', dex: 160, atk: 6, def: 9, hp: 8, shadow: true, tags: ['OP-TMFrust'], charged1: 'frustration' }),
      createMon({ id: 'shadow_rattata_pvp_iv', dex: 19, atk: 0, def: 15, hp: 15, shadow: true, charged1: 'frustration' }),
      createMon({ id: 'shadow_rattata_junk', dex: 19, atk: 7, def: 6, hp: 8, shadow: true, charged1: 'frustration' }),
      createMon({ id: 'traded_96_machop_3star', dex: 66, atk: 15, def: 14, hp: 14, traded: true }),
      createMon({ id: 'traded_pvp_marill', dex: 183, atk: 1, def: 15, hp: 15, traded: true }),
      createMon({ id: 'traded_nundo', dex: 16, atk: 0, def: 0, hp: 0, traded: true }),
      createMon({ id: 'traded_phantump_free_evo', dex: 708, atk: 6, def: 7, hp: 6, traded: true, canEvolve: true, tradeEvolveSpecies: true }),
      createMon({ id: 'traded_cresselia_failed_leg', dex: 488, atk: 6, def: 7, hp: 8, traded: true, legendary: true }),
      createMon({ id: 'traded_pidgey_failed_common', dex: 16, atk: 8, def: 7, hp: 6, traded: true }),
    ];

    const b8Purged = evaluatePogoBox(box, b8.query).map((m) => m.id);
    expect(b8Purged).toEqual(['shadow_rattata_junk']);

    const d2Purged = evaluatePogoBox(box, d2.query).map((m) => m.id);
    expect(d2Purged).toEqual(['traded_pidgey_failed_common']);

    const d2LegTo2x = evaluatePogoBox(box, d2.subQueries[0].query).map((m) => m.id);
    expect(d2LegTo2x).toEqual(['traded_cresselia_failed_leg']);
  });

  test('validates ALL generated strings in Events & Trips Registry and Timeline Year Slicer (2023-2026) with zero errors/warnings', () => {
    const refDate = '2026-11-22';

    for (const ev of BUNDLED_EVENTS_ARCHIVE) {
      const actions = buildEventActionStrings(ev, refDate);
      const candidates = [
        { q: actions.raidAndMegaString, isTrash: false, label: 'raidAndMegaString' },
        { q: actions.regionalAndRareTradeString, isTrash: false, label: 'regionalAndRareTradeString' },
        { q: actions.backgroundKeepString, isTrash: false, label: 'backgroundKeepString' },
        { q: actions.backgroundSurplusString, isTrash: true, label: 'backgroundSurplusString' },
        { q: actions.pvpIvCheckString, isTrash: false, label: 'pvpIvCheckString' },
        { q: actions.mightyCheckString, isTrash: false, label: 'mightyCheckString' },
        { q: actions.eventKeepersString, isTrash: false, label: 'eventKeepersString' },
        { q: actions.eventLeftoverTrashString, isTrash: true, label: 'eventLeftoverTrashString' },
      ].filter((c) => Boolean(c.q));

      for (const { q, isTrash, label } of candidates) {
        const res = validateSearchString(q, { isTrashContext: isTrash });
        expect(res.errors, `${ev.id} ${label} errors: ${q}`).toEqual([]);
        expect(res.warnings, `${ev.id} ${label} warnings: ${q}`).toEqual([]);
        expect(res.charCount).toBeLessThan(4000);
      }
    }

    const seededEvents = BUNDLED_EVENTS_ARCHIVE.map((ev) => ({
      ...ev,
      attended: Boolean(ev.attendedDefault),
    }));

    for (const year of [2023, 2024, 2025, 2026]) {
      const plan = computeYearSlicerPlan({
        year,
        storedEvents: seededEvents,
        communityDays: COMMUNITY_DAY_EVENTS,
        trips: TRAVEL_TRIPS,
        refDateStr: refDate,
      });

      const planStrings = [
        { q: plan.strings.inPersonBgCombined, isTrash: false, label: 'inPersonBgCombined' },
        { q: plan.strings.globalBgKeepCombined, isTrash: false, label: 'globalBgKeepCombined' },
        { q: plan.strings.globalBgPurgeCombined, isTrash: true, label: 'globalBgPurgeCombined' },
        { q: plan.strings.unmappedBgAudit, isTrash: false, label: 'unmappedBgAudit' },
        { q: plan.strings.allAttendedEventsUnion, isTrash: false, label: 'allAttendedEventsUnion' },
        { q: plan.strings.everydayNonEventAll, isTrash: false, label: 'everydayNonEventAll' },
        { q: plan.strings.everydayNonEventTrash0to2, isTrash: true, label: 'everydayNonEventTrash0to2' },
        ...plan.monthlySlices.flatMap((ms) => [
          { q: ms.monthAllString, isTrash: false, label: `${ms.monthName}_all` },
          { q: ms.monthEverydayTrashString, isTrash: true, label: `${ms.monthName}_trash` },
        ]),
      ];

      for (const { q, isTrash, label } of planStrings) {
        const res = validateSearchString(q, { isTrashContext: isTrash });
        expect(res.errors, `Year ${year} ${label} errors: ${q}`).toEqual([]);
        expect(res.warnings, `Year ${year} ${label} warnings: ${q}`).toEqual([]);
        expect(res.charCount).toBeLessThan(4000);
      }
    }
  });
});
