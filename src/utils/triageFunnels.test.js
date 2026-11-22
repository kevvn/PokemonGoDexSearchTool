import { expect, test, describe } from 'vitest';
import {
  buildTriageFunnels,
  buildSafeTrashQuery,
  createDefaultSafetyShields,
} from './triageFunnels';
import { validateSearchString, TYPES } from './searchUtils';
import { createDefaultTagMap } from './tagSystem';
import realMetaSnapshot from '../data/meta_snapshot.json';

const SAMPLE_META = {
  schemaVersion: 1,
  generatedAt: '2026-11-21T00:00:00Z',
  pvp: {
    gl: { top100: { all: [194, 195, 333, 334], lowAtk: [194, 195, 333, 334], highAtk: [307, 308, 410, 411], shadow: [194, 195], tradeReroll: [379, 488] } },
    ul: { top100: { all: [957, 958, 959], lowAtk: [258, 259, 260], highAtk: [957, 958, 959], shadow: [258, 259, 260], tradeReroll: [487, 640] } },
    ml: { top100: { all: [483, 484, 888, 800], shadow: [150, 376] } },
    allShadow: [150, 194, 195, 258, 259, 260, 376],
    allTradeReroll: [379, 487, 488, 640],
  },
  pve: {
    top30Overall: [150, 383, 384, 800, 888],
    topShadow: [150, 220, 221, 473, 374, 375, 376],
    topMegaEvolved: [6, 384, 448],
    topMegaFamily: [4, 5, 6, 384, 447, 448],
    byType: Object.fromEntries(TYPES.map((t) => [t, [4, 5, 6, 150]])),
  },
  maxBattles: {
    attackers: [6, 94, 888, 890],
    tanks: [113, 242, 374, 375, 376, 889],
    healers: [113, 242],
    tanksAndHealers: [113, 242, 374, 375, 376, 889],
    fastMoves500ms: [
      'Bite', 'Bug Bite', 'Cut', 'Dragon Breath', 'Fury Cutter', 'Leafage', 'Lick',
      'Lock-On', 'Low Kick', 'Metal Claw', 'Metal Sound', 'Mud Shot', 'Poison Sting',
      'Pound', 'Psycho Cut', 'Psywave', 'Sand Attack', 'Scratch', 'Shadow Claw',
      'Spark', 'Sucker Punch', 'Tackle', 'Thunder Shock', 'Vine Whip', 'Water Gun',
    ],
  },
  specialLists: {
    candy12Fodder: [10, 13, 16, 265, 293, 519],
    tradeEvolve: [64, 67, 75, 93, 525, 533, 588, 616, 708, 710],
  },
};

function collectAllSteps(funnels) {
  const steps = [
    ...funnels.emergencyDump.steps,
    ...funnels.modes.modeA.steps,
    ...funnels.modes.modeB.steps,
    ...funnels.modes.modeC.sections.pvp.steps,
    ...funnels.modes.modeC.sections.pve.steps,
    ...funnels.modes.modeC.sections.maxBattles.steps,
    ...funnels.modes.modeD.steps,
  ];
  return steps;
}

describe('triageFunnels exhaustive syntax & safety validation', () => {
  test('EVERY generated search string across all 4 modes, subQueries, and all 18 PvE types passes validateSearchString with zero errors and zero warnings', () => {
    for (const pveType of TYPES) {
      const funnels = buildTriageFunnels(SAMPLE_META, createDefaultTagMap(), {
        ageScope: 'age0',
        pveType,
      });

      for (const step of collectAllSteps(funnels)) {
        const res = validateSearchString(step.query, { isTrashContext: step.isTrash });
        expect(res.errors, `Errors in ${step.id} (${pveType}): ${step.query}`).toEqual([]);
        expect(res.warnings, `Warnings in ${step.id} (${pveType}): ${step.query}`).toEqual([]);

        if (step.subQueries) {
          for (const sq of step.subQueries) {
            const sqRes = validateSearchString(sq.query, { isTrashContext: sq.isTrash ?? step.isTrash });
            expect(sqRes.errors, `Errors in ${step.id}/${sq.label}: ${sq.query}`).toEqual([]);
            expect(sqRes.warnings, `Warnings in ${step.id}/${sq.label}: ${sq.query}`).toEqual([]);
          }
        }
      }
    }
  });

  test('trash strings NEVER emit inverted !@3mov, !mega, !0-1attack, ultrabeasts, or partyplay', () => {
    const funnels = buildTriageFunnels(SAMPLE_META);
    const trashSteps = collectAllSteps(funnels).filter((s) => s.isTrash);
    expect(trashSteps.length).toBeGreaterThanOrEqual(6);

    for (const step of trashSteps) {
      expect(step.query).not.toContain('!@3mov');
      expect(step.query).not.toMatch(/!mega/i);
      expect(step.query).not.toMatch(/![0-4](?:-[0-4])?(?:attack|defense|hp)/i);
      expect(step.query).not.toContain('ultrabeasts');
      expect(step.query).not.toContain('partyplay');
    }

    // Specifically verify A6 has @3mov, 100km+, eggsonly, rare species, and both De Morgan IV shields
    const a6 = funnels.modes.modeA.steps.find((s) => s.id === 'A6');
    expect(a6.query).toContain('&@3mov');
    expect(a6.query).toContain('!distance100-');
    expect(a6.query).toContain('!eggsonly');
    expect(a6.query).toContain('!201');
    expect(a6.query).toContain('2-4attack,0-2defense,0-2hp');
    expect(a6.query).toContain('1-4attack,1-4defense,1-4hp');
  });

  test('Mode C2 mega0 query uses evolved-only dexes while pre-evo sub-query strictly excludes evolved Mega forms', () => {
    const funnels = buildTriageFunnels(SAMPLE_META);
    const megaStep = funnels.modes.modeC.sections.pve.steps.find((s) => s.id === 'C2_mega_candidates');
    expect(megaStep.query).toContain('mega0');
    expect(megaStep.query).toContain('6,384,448');
    expect(megaStep.subQueries[0].query).not.toContain('mega0');
    expect(megaStep.subQueries[0].query).toBe('!#&!shadow&3*,4*&4attack&4-5,447');
    expect(megaStep.subQueries[1].query).toBe('#pve-megawip');
  });

  test('Mode B8 low-IV shadow query omits !@special (Frustration) while shielding PvE top shadows, PvP IVs, #op-tmfrust, @3mov & nundos', () => {
    const funnels = buildTriageFunnels(SAMPLE_META);
    const b8 = funnels.modes.modeB.steps.find((s) => s.id === 'B8');
    expect(b8.query).not.toContain('!@special');
    expect(b8.query).toContain('@3mov');
    expect(b8.query).toContain('2-4attack,0-2defense,0-2hp');
    expect(b8.query).toContain('1-4attack,1-4defense,1-4hp');
    expect(b8.query).toContain('!#op-tmfrust');
    expect(b8.query).toContain('!374-376');
    expect(b8.query).toContain('!#keep');
    expect(b8.query).toContain('!#ev');
  });

  test('Mode D 2x Evolution XP includes 12-candy, already-traded free evos, and tradeevolve&!traded', () => {
    const funnels = buildTriageFunnels(SAMPLE_META);
    const d8 = funnels.modes.modeD.steps.find((s) => s.id === 'D8_evoxp');
    const subStrings = d8.subQueries.map((sq) => sq.query);
    expect(subStrings).toContain('!#&!favorite&evolve&10,13,16,265,293,519');
    expect(subStrings).toContain('traded&evolve&64,67,75,93,525,533,588,616,708,710');
    expect(subStrings).toContain('tradeevolve&!traded');
  });

  test('dynamic ageScope and safetyShields toggles update generated strings accurately', () => {
    const shields = { ...createDefaultSafetyShields(), xxl: false, singleMoveOnly: false };
    const q = buildSafeTrashQuery({ ageScope: 'age0-7', safetyShields: shields });
    expect(q.startsWith('age0-7&')).toBe(true);
    expect(q).not.toContain('!xxl');
    expect(q).not.toContain('@3mov');

    const allTime = buildSafeTrashQuery({ ageScope: '' });
    expect(allTime.startsWith('!#&')).toBe(true);
  });

  test('custom tag renaming propagates automatically to Mode B, C, and D strings', () => {
    const customMap = createDefaultTagMap();
    customMap.op_2xxfer = { name: 'Transfer2x', enabled: true };
    customMap.op_xxl = { name: 'ShowcaseXXL', enabled: true };
    customMap.pve_megawip = { name: 'MegaBuild', enabled: true };
    customMap.op_powerwip = { name: 'DustBuild', enabled: true };
    customMap.max_heal = { name: 'MAX-Heal', enabled: false };

    const funnels = buildTriageFunnels(SAMPLE_META, customMap);
    const d1 = funnels.modes.modeD.steps.find((s) => s.id === 'D1_2xxfer');
    expect(d1.query).toBe('#transfer2x&!favorite');

    const d2 = funnels.modes.modeD.steps.find((s) => s.id === 'D2_bad_trades');
    expect(d2.query).toContain('!#dustbuild');

    const d11 = funnels.modes.modeD.steps.find((s) => s.id === 'D11_powerwip');
    expect(d11.query).toBe('#dustbuild');
    expect(d11.subQueries[0].query).toBe('#dustbuild&countcandyxl296-');

    const megaStep = funnels.modes.modeC.sections.pve.steps.find((s) => s.id === 'C2_mega_candidates');
    expect(megaStep.subQueries[1].query).toBe('#megabuild');

    const b5 = funnels.modes.modeB.steps.find((s) => s.id === 'B5');
    expect(b5.query).toContain('!#showcasexxl');

    const c3Missing = funnels.modes.modeC.sections.maxBattles.steps.find((s) => s.id === 'C3_fast_missing');
    expect(c3Missing.query.startsWith('#max-tank&')).toBe(true);
    expect(c3Missing.query).not.toContain('#max-heal');
  });

  test('validates EVERY generated string against the real committed src/data/meta_snapshot.json with zero errors/warnings and safe character length', () => {
    for (const pveType of TYPES) {
      const funnels = buildTriageFunnels(realMetaSnapshot, createDefaultTagMap(), {
        ageScope: 'age0',
        pveType,
      });

      for (const step of collectAllSteps(funnels)) {
        const res = validateSearchString(step.query, { isTrashContext: step.isTrash });
        expect(res.errors, `Real snapshot errors in ${step.id} (${pveType}): ${step.query}`).toEqual([]);
        expect(res.warnings, `Real snapshot warnings in ${step.id} (${pveType}): ${step.query}`).toEqual([]);
        expect(res.charCount).toBeLessThan(4000);

        if (step.subQueries) {
          for (const sq of step.subQueries) {
            const sqRes = validateSearchString(sq.query, { isTrashContext: sq.isTrash ?? step.isTrash });
            expect(sqRes.errors, `Real snapshot errors in ${step.id}/${sq.label}: ${sq.query}`).toEqual([]);
            expect(sqRes.warnings, `Real snapshot warnings in ${step.id}/${sq.label}: ${sq.query}`).toEqual([]);
            expect(sqRes.charCount).toBeLessThan(4000);
          }
        }
      }
    }
  });
});
