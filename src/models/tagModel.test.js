import { expect, test, describe, afterEach } from 'vitest';
import {
  TAG_NAMESPACES,
  CORE_TAGS,
  OPTIONAL_TAGS,
  ALL_TAG_DEFINITIONS,
  HYDRATION_STAGES,
  createDefaultTagMap,
  resolveTagsList,
  formatTagSetupListText,
  lintTagName,
  lintTagMap,
  getTagHash,
  getNamespaceHashes,
  getNamespaceExclusions,
  getRecommendedDragOrder,
  buildTagHydrationQueries,
  getAllTagHydrationSteps,
  tagStore,
  updateTagName,
  toggleTagEnabled,
  resetAllTags,
  hydrationProgressStore,
  toggleHydrationChecked,
  resetHydrationProgress,
} from './tagModel';
import {
  validateSearchString,
  parseSearchString,
  generateSearchString,
  compressIds,
} from './searchEngine';
import { ALL_COMMUNITY_DAY_PRE_EVO_IDS } from './communityDayModel';
import realMetaSnapshot from '../data/meta_snapshot.json';

describe('30-tag, 7-namespace blueprint', () => {
  test('defines exactly 30 core tags across 7 namespaces + optional 31st OP-Purify1k', () => {
    expect(TAG_NAMESPACES).toHaveLength(7);
    expect(CORE_TAGS).toHaveLength(30);
    expect(OPTIONAL_TAGS).toHaveLength(1);
    expect(ALL_TAG_DEFINITIONS).toHaveLength(31);
    expect(OPTIONAL_TAGS[0].id).toBe('op_purify1k');
  });

  test('all default 30 core tags (and optional 31st enabled) pass lintTagMap with ZERO errors and ZERO warnings', () => {
    const defaultMap = createDefaultTagMap();
    const res = lintTagMap(defaultMap);
    expect(res.valid).toBe(true);
    expect(res.errorCount).toBe(0);
    expect(res.warningCount).toBe(0);

    const allEnabled = { ...defaultMap, op_purify1k: { ...defaultMap.op_purify1k, enabled: true } };
    const resAll = lintTagMap(allEnabled);
    expect(resAll.valid).toBe(true);
    expect(resAll.errorCount).toBe(0);
    expect(resAll.warningCount).toBe(0);
  });

  test('recommended drag order starts with OP-2xXfer, TR-Mirror, TR-Dist, TR-Spec, EV-ShBG and has unique 1..31 slots', () => {
    const ordered = getRecommendedDragOrder();
    expect(ordered.slice(0, 5).map((t) => t.id)).toEqual([
      'op_2xxfer',
      'tr_mirror',
      'tr_dist',
      'tr_spec',
      'ev_shbg',
    ]);
    expect(ordered.map((t) => t.dragOrder)).toEqual(
      Array.from({ length: ALL_TAG_DEFINITIONS.length }, (_, idx) => idx + 1)
    );
  });

  test('resolveTagsList & formatTagSetupListText reflect enabled tags and custom names', () => {
    const map = createDefaultTagMap();
    map.op_2xxfer = { name: 'Xfer2x', enabled: true };
    const resolved = resolveTagsList(map);
    expect(resolved).toHaveLength(31);
    expect(resolved.find((t) => t.id === 'op_2xxfer').name).toBe('Xfer2x');

    const text = formatTagSetupListText(map);
    expect(text).toContain('01. Xfer2x');
    expect(text).toContain('#xfer2x');
    expect(text).not.toContain('OP-Purify1k');
  });
});

describe('lintTagName collision & syntax rules', () => {
  test('allows internal hyphens (like PVP-GL, OP-2xXfer)', () => {
    const res = lintTagName('PVP-GL');
    expect(res.valid).toBe(true);
    expect(res.errors).toHaveLength(0);
    expect(res.warnings).toHaveLength(0);
  });

  test('forbids PoGO search operator characters (&|,;:!@#<>=+)', () => {
    for (const ch of ['&', '|', ',', ';', ':', '!', '@', '#', '<', '>', '=', '+']) {
      const res = lintTagName(`My${ch}Tag`);
      expect(res.valid).toBe(false);
      expect(res.errors.map((e) => e.code)).toContain('FORBIDDEN_CHAR');
    }
  });

  test('catches exact native PoGO keyword & range collisions', () => {
    for (const kw of ['shiny', 'Shadow', 'MEGA', 'count', 'dynamax', 'evolve', 'background', 'party', 'fire', 'kanto', '4*']) {
      const res = lintTagName(kw);
      expect(res.valid).toBe(false);
      expect(res.errors.map((e) => e.code)).toContain('NATIVE_KEYWORD_COLLISION');
    }
    expect(lintTagName('mega1').errors.map((e) => e.code)).toContain('NATIVE_KEYWORD_COLLISION');
    expect(lintTagName('count2').errors.map((e) => e.code)).toContain('NATIVE_KEYWORD_COLLISION');
    expect(lintTagName('4attack').errors.map((e) => e.code)).toContain('NATIVE_KEYWORD_COLLISION');
    expect(lintTagName('0hp').errors.map((e) => e.code)).toContain('NATIVE_KEYWORD_COLLISION');
    expect(lintTagName('100').errors.map((e) => e.code)).toContain('NUMERIC_DEX_COLLISION');
    expect(lintTagName('1500').errors.map((e) => e.code)).toContain('NUMERIC_DEX_COLLISION');
  });

  test('catches empty name, leading/trailing spaces, and duplicate names', () => {
    expect(lintTagName('').errors.map((e) => e.code)).toContain('EMPTY_NAME');
    expect(lintTagName('PVP-GL ').errors.map((e) => e.code)).toContain('EDGE_WHITESPACE');
    expect(lintTagName(' PVP-GL').errors.map((e) => e.code)).toContain('EDGE_WHITESPACE');
    expect(lintTagName('pvp-gl', ['PVP-GL']).errors.map((e) => e.code)).toContain('DUPLICATE_TAG');
  });

  test('warns on # prefix overlap, leading hyphen, leading emoji, internal spaces, and shortcut prefix', () => {
    expect(lintTagName('Trade', ['TradeDist']).warnings.map((w) => w.code)).toContain('PREFIX_OVERLAP');
    expect(lintTagName('PVP-GL', ['PVP']).warnings.map((w) => w.code)).toContain('PREFIX_OVERLAP');
    expect(lintTagName('-PVP').warnings.map((w) => w.code)).toContain('LEADING_HYPHEN');
    expect(lintTagName('✨ShBG').warnings.map((w) => w.code)).toContain('LEADING_EMOJI');
    expect(lintTagName('My Tag').warnings.map((w) => w.code)).toContain('INTERNAL_WHITESPACE');
    expect(lintTagName('MegaProject').warnings.map((w) => w.code)).toContain('SHORTCUT_PREFIX_COLLISION');
  });
});

describe('tag hash & smart namespace umbrella resolution', () => {
  test('uses trailing-hyphen namespace umbrellas for default tags so external user tags never collide', () => {
    const map = createDefaultTagMap();
    expect(getTagHash('pvp_gl', map)).toBe('#pvp-gl');
    expect(getNamespaceHashes('pvp', map)).toEqual(['#pvp-']);
    expect(getNamespaceExclusions('ev', map)).toEqual(['!#ev-']);
    expect(getNamespaceExclusions('tr', map)).toEqual(['!#tr-']);
    expect(getTagHash('op_purify1k', map)).toBe('');
  });

  test('falls back to explicit tag hashes when user renames tags outside namespace prefix', () => {
    const map = createDefaultTagMap();
    map.pvp_gl = { name: 'GreatLeague', enabled: true };
    const hashes = getNamespaceHashes('pvp', map);
    expect(hashes).toContain('#greatleague');
    expect(hashes).toContain('#pvp-ul');
    expect(hashes).not.toEqual(['#pvp-']);
  });
});

describe('Initial Tag Hydration queries (all 31 tags, 6-stage walkthrough)', () => {
  const defaultMap = createDefaultTagMap();
  const customRenamedMap = {
    ...createDefaultTagMap(),
    pvp_wip: { name: 'BuildPvP', enabled: true },
    pve_wip: { name: 'BuildRaid', enabled: true },
    pve_megawip: { name: 'BuildMega', enabled: true },
    max_wip: { name: 'BuildMax', enabled: true },
    op_powerwip: { name: 'DustWIP', enabled: true },
    op_powerup: { name: 'DustQueue', enabled: true },
    op_purify1k: { name: 'PurifyCheap', enabled: true },
  };

  test('covers all 31 tags in exact Stage 1 -> Stage 6 order', () => {
    expect(HYDRATION_STAGES).toHaveLength(6);
    expect(HYDRATION_STAGES.map((s) => s.stageNumber)).toEqual([1, 2, 3, 4, 5, 6]);

    const steps = getAllTagHydrationSteps(defaultMap, realMetaSnapshot);
    expect(steps).toHaveLength(31);

    const uniqueIds = new Set(steps.map((s) => s.tagId));
    expect(uniqueIds.size).toBe(31);
    for (const def of ALL_TAG_DEFINITIONS) {
      expect(uniqueIds.has(def.id), `Missing hydration step for ${def.id}`).toBe(true);
    }

    let prevStage = 1;
    for (const step of steps) {
      expect(step.stageNumber).toBeGreaterThanOrEqual(prevStage);
      prevStage = step.stageNumber;
      expect(step.queries.length).toBeGreaterThanOrEqual(1);
    }

    expect(steps.slice(0, 4).map((s) => s.tagId)).toEqual([
      'ev_shbg',
      'ev_locbg',
      'ev_global',
      'ev_inperson',
    ]);
    expect(steps[4].tagId).toBe('keep_trophy');
    expect(steps.slice(5, 13).map((s) => s.tagId)).toEqual([
      'pvp_gl',
      'pvp_ul',
      'pvp_ml',
      'pvp_cup',
      'pve_raid',
      'max_atk',
      'max_heal',
      'max_tank',
    ]);
    expect(steps.slice(13, 18).map((s) => s.tagId)).toEqual([
      'pvp_wip',
      'pve_wip',
      'pve_megawip',
      'max_wip',
      'max_candy',
    ]);
    expect(steps.slice(18, 21).map((s) => s.tagId)).toEqual([
      'tr_spec',
      'tr_dist',
      'tr_mirror',
    ]);
    expect(steps.slice(21).map((s) => s.tagId)).toEqual([
      'op_mega',
      'op_xxl',
      'op_tmfrust',
      'op_buddy',
      'op_evocd',
      'op_evoxp',
      'op_powerwip',
      'op_powerup',
      'op_2xxfer',
      'op_purify1k',
    ]);
  });

  test('ALL 31 tags produce valid non-empty queries with 0 validateSearchString errors/warnings, 0 banned patterns, and < 4000 chars', () => {
    const configs = [
      { label: 'default + realMetaSnapshot', map: defaultMap, meta: realMetaSnapshot },
      { label: 'default + empty metaSnapshot', map: defaultMap, meta: {} },
      { label: 'custom renamed + realMetaSnapshot', map: customRenamedMap, meta: realMetaSnapshot },
    ];

    for (const { label, map, meta } of configs) {
      const steps = getAllTagHydrationSteps(map, meta);
      expect(steps).toHaveLength(31);

      for (const step of steps) {
        const direct = buildTagHydrationQueries(step.tagId, map, meta);
        expect(direct.length, `${label} ${step.tagId} queries`).toBeGreaterThan(0);
        expect(direct).toEqual(step.queries);

        for (const item of step.queries) {
          expect(typeof item.query).toBe('string');
          expect(item.query.trim().length).toBeGreaterThan(0);
          expect(item.query.length).toBeLessThan(4000);
          expect(['select-all', 'review']).toContain(item.actionMode);
          expect(item.query).not.toContain('ultrabeasts');
          expect(item.query).not.toContain('partyplay');
          expect(item.query).not.toMatch(/![0-4](?:-[0-4])?(?:attack|defense|hp)/i);
          expect(item.query).not.toMatch(/!mega/i);

          const isTrash = step.tagId === 'op_2xxfer';
          const res = validateSearchString(item.query, { isTrashContext: isTrash });
          expect(res.valid).toBe(true);
          expect(res.errors).toEqual([]);
          expect(res.warnings).toEqual([]);
        }
      }
    }
  });

  test('verifies exact semantics for refined hydration queries', () => {
    const fixedRef = '2026-11-24';

    const shbg = buildTagHydrationQueries('ev_shbg', defaultMap, realMetaSnapshot, { refDateStr: fixedRef });
    expect(shbg[0].query).toBe('shiny&background&!#');
    expect(shbg[0].actionMode).toBe('select-all');

    const locbg = buildTagHydrationQueries('ev_locbg', defaultMap, realMetaSnapshot, { refDateStr: fixedRef });
    expect(locbg[0].query).toBe('locationbackground&!shiny&!#');
    expect(locbg[0].actionMode).toBe('select-all');

    const globalQueries = buildTagHydrationQueries('ev_global', defaultMap, realMetaSnapshot, {
      eventYear: 2026,
      refDateStr: fixedRef,
    });
    expect(globalQueries[0].query).toBe(
      'year2026&specialbackground&!locationbackground&!shiny&3*,4*,legendary,mythical,ultrabeast,gigantamax,costume&!#'
    );
    expect(globalQueries[0].actionMode).toBe('review');
    expect(globalQueries[1].id).toBe('ev_global_attended');
    expect(globalQueries[1].query).toMatch(/^year2026&specialbackground&!locationbackground&!shiny&age\d+/);
    expect(globalQueries[2].query).toBe(
      'year2026&specialbackground&!locationbackground&!shiny&0*,1*,2*&!favorite&!#'
    );
    expect(globalQueries[3].query).toBe('year2026&profilebackground&!#');
    expect(globalQueries[3].actionMode).toBe('select-all');

    const inPerson2026 = buildTagHydrationQueries('ev_inperson', defaultMap, realMetaSnapshot, {
      eventYear: 2026,
      refDateStr: fixedRef,
    });
    expect(inPerson2026[0].id).toBe('ev_inperson_attended');
    expect(inPerson2026[0].query).toMatch(
      /^year2026&age\d+-\d+(?:,age\d+-\d+)*&shiny,costume,201,479&!remoteraid&!hatched&!traded&!#$/
    );
    expect(inPerson2026[1].id).toBe('ev_inperson_regionals');
    expect(inPerson2026[1].query).toContain('!remoteraid&!traded&!#');
    expect(inPerson2026[2].query).toBe(
      'year2026&distance100-&shiny,costume,201,479&!remoteraid&!hatched&!traded&!#'
    );

    expect(buildTagHydrationQueries('keep_trophy', defaultMap, realMetaSnapshot).map((q) => q.query)).toEqual([
      '0attack&0defense&0hp&!#',
      'costume&!shiny&!background&!#',
      'count1&@3mov&!candyxl&!legendary&!mythical&!ultrabeast&!shadow&!maxmove1-&!#',
      '@special&!@frustration&!@return&!shadow&!purified&count1&!#',
      'year2016-2019&!#',
    ]);

    const pvpWipQueries = buildTagHydrationQueries('pvp_wip', defaultMap, realMetaSnapshot);
    expect(pvpWipQueries[0].query).toBe('#pvp-gl,#pvp-ul,#pvp-ml,#pvp-cup&@3mov');
    expect(pvpWipQueries[1].query).toBe('#pvp-gl,#pvp-ul,#pvp-ml,#pvp-cup&evolve');

    const trSpecQueries = buildTagHydrationQueries('tr_spec', defaultMap, realMetaSnapshot);
    expect(trSpecQueries.map((q) => q.id)).toEqual([
      'tr_spec_shinies_bgs',
      'tr_spec_legends',
      'tr_spec_rares',
      'tr_spec_costumes',
    ]);
    expect(trSpecQueries[0].query).toContain('!shadow&!fusion&!mythical');
    expect(trSpecQueries[1].query).toBe(
      'legendary,ultrabeast&count2-&!traded&!shadow&!fusion&!favorite&!4*&!#'
    );
    expect(trSpecQueries[2].query).toContain('!traded&!shadow&!fusion&!favorite&!4*&!#&');
    expect(trSpecQueries[3].query).toBe('costume&!traded&!shadow&!fusion&!favorite&!4*&!#');

    expect(buildTagHydrationQueries('tr_dist', defaultMap, realMetaSnapshot)[0].query).toBe(
      'distance100-&!traded&!shadow&!fusion&!shiny&!legendary&!mythical&!ultrabeast&!background&!costume&!4*&!favorite&!#'
    );

    // PvP league tags embed Top-100 species with non-naive cp-1500 / cp-2500 / any-CP bounds + built !@3mov + @3mov,evolve audits
    const glQueries = buildTagHydrationQueries('pvp_gl', defaultMap, realMetaSnapshot).map((q) => q.query);
    expect(glQueries[0]).toContain('!#&0-1attack&3-4defense&3-4hp&cp-1500&');
    expect(glQueries[1]).toContain('!#&2-4attack&3-4defense&3-4hp&cp-1500&');
    expect(glQueries[2]).toBe('cp-1500&!@3mov&!#');
    expect(glQueries[3]).toBe('#pvp-gl&@3mov,evolve');

    const ulQueries = buildTagHydrationQueries('pvp_ul', defaultMap, realMetaSnapshot).map((q) => q.query);
    expect(ulQueries[0]).toContain('!#&0-1attack&3-4defense&3-4hp&cp-2500&');
    expect(ulQueries[1]).toContain('!#&3*,4*&cp-2500&');
    expect(ulQueries[2]).toBe('cp1501-2500&!@3mov&!#');
    expect(ulQueries[3]).toBe('#pvp-ul&@3mov,evolve');

    const mlQueries = buildTagHydrationQueries('pvp_ml', defaultMap, realMetaSnapshot).map((q) => q.query);
    expect(mlQueries[0]).toContain('!#&3*,4*&4attack&3-4defense&3-4hp&');
    expect(mlQueries[1]).toContain('!#&4*&');
    expect(mlQueries[2]).toBe('cp3000-&!@3mov&3*,4*&4attack&!#');
    expect(mlQueries[3]).toBe('#pvp-ml&@3mov,evolve');

    expect(buildTagHydrationQueries('pvp_cup', defaultMap, realMetaSnapshot)[0].query).toBe(
      'cp-500&!@3mov&!#'
    );

    const xferQuery = buildTagHydrationQueries('op_2xxfer', defaultMap, realMetaSnapshot)[0].query;
    expect(xferQuery).toBe(
      'legendary,ultrabeast&0*,1*,2*&!lucky&!shiny&!4*&!background&!favorite&!fusion&!adventureeffect&!@special&@3mov&2-4attack,0-2defense,0-2hp&!#'
    );
    expect(xferQuery).toContain('&@3mov&');
    expect(xferQuery).not.toContain('!@3mov');
    expect(xferQuery).not.toContain('mythical');

    expect(buildTagHydrationQueries('op_purify1k', defaultMap, realMetaSnapshot)[0].query).toBe(
      'shadow&candykm1&0*,1*,2*&!shiny&!4*&!favorite&2-4attack,0-2defense,0-2hp&!#'
    );

    expect(buildTagHydrationQueries('tr_spec', defaultMap, realMetaSnapshot)[0].query).toContain('!shadow&!fusion&!mythical');
    expect(buildTagHydrationQueries('tr_dist', defaultMap, realMetaSnapshot)[0].query).toContain('!shadow&!fusion');

    const megaWip = buildTagHydrationQueries('pve_megawip', defaultMap, realMetaSnapshot);
    expect(megaWip).toHaveLength(2);
    expect(megaWip[0].query).toContain('!#&!shadow&mega0&3*,4*&4attack&');
    expect(megaWip[1].query).not.toContain('mega0');
    expect(megaWip[1].query).toContain('!#&!shadow&3*,4*&4attack&');

    const evoCd = buildTagHydrationQueries('op_evocd', defaultMap, realMetaSnapshot);
    expect(evoCd[0].query).toBe(
      `evolve&!#&!favorite&3*,4*,shiny&${compressIds(ALL_COMMUNITY_DAY_PRE_EVO_IDS)}`
    );
    expect(evoCd[0].query).not.toContain('!@special');
    expect(evoCd[2].query).toBe('#pvp-wip,#pve-wip,#pve-megawip&evolve');

    const powerWip = buildTagHydrationQueries('op_powerwip', defaultMap, realMetaSnapshot);
    expect(powerWip.map((q) => q.query)).toEqual([
      '#pvp-wip,#pve-wip,#pve-megawip,#max-wip&!#op-powerwip',
      'candyxl&3*,4*&!#op-powerwip',
    ]);

    expect(buildTagHydrationQueries('op_powerup', defaultMap, realMetaSnapshot)[0].query).toBe(
      '#pvp-wip,#pve-wip,#pve-megawip,#max-wip,#op-powerwip&!#op-powerup'
    );

    expect(buildTagHydrationQueries('nonexistent_tag', defaultMap, realMetaSnapshot)).toEqual([]);
  });

  test('dynamically updates op_powerwip, op_powerup, and op_evocd queries when user renames tags in tagMap', () => {
    const powerWipRenamed = buildTagHydrationQueries('op_powerwip', customRenamedMap, realMetaSnapshot);
    expect(powerWipRenamed.map((q) => q.query)).toEqual([
      '#buildpvp,#buildraid,#buildmega,#buildmax&!#dustwip',
      'candyxl&3*,4*&!#dustwip',
    ]);

    const powerupRenamed = buildTagHydrationQueries('op_powerup', customRenamedMap, realMetaSnapshot);
    expect(powerupRenamed[0].query).toBe('#buildpvp,#buildraid,#buildmega,#buildmax,#dustwip&!#dustqueue');

    const evoCdRenamed = buildTagHydrationQueries('op_evocd', customRenamedMap, realMetaSnapshot);
    expect(evoCdRenamed[2].query).toBe('#buildpvp,#buildraid,#buildmega&evolve');
  });

  test('ALL 31 hydration queries achieve full parseSearchString -> generateSearchString round-trip stability', () => {
    for (const map of [defaultMap, customRenamedMap]) {
      const steps = getAllTagHydrationSteps(map, realMetaSnapshot);

      for (const step of steps) {
        const isTrash = step.tagId === 'op_2xxfer';
        for (const item of step.queries) {
          const parsed1 = parseSearchString(item.query);
          const regenerated1 = generateSearchString(parsed1.selectedIds, parsed1.filters);

          expect(regenerated1.length).toBeGreaterThan(0);
          const val1 = validateSearchString(regenerated1, { isTrashContext: isTrash });
          expect(val1.errors).toEqual([]);
          expect(val1.warnings).toEqual([]);

          const parsed2 = parseSearchString(regenerated1);
          const regenerated2 = generateSearchString(parsed2.selectedIds, parsed2.filters);
          expect(regenerated2).toBe(regenerated1);

          expect(Array.from(parsed2.selectedIds).sort((a, b) => a - b)).toEqual(
            Array.from(parsed1.selectedIds).sort((a, b) => a - b)
          );
        }
      }
    }
  });
});

describe('tagStore & hydrationProgressStore mutations', () => {
  afterEach(() => {
    resetAllTags();
    resetHydrationProgress();
  });

  test('updates, toggles, and resets tags cleanly', () => {
    updateTagName('op_2xxfer', 'Xfer2x');
    expect(tagStore.getSnapshot().op_2xxfer.name).toBe('Xfer2x');

    toggleTagEnabled('op_purify1k');
    expect(tagStore.getSnapshot().op_purify1k.enabled).toBe(true);

    resetAllTags();
    expect(tagStore.getSnapshot().op_2xxfer.name).toBe('OP-2xXfer');
    expect(tagStore.getSnapshot().op_purify1k.enabled).toBe(false);
  });

  test('toggles and resets hydration progress checklist cleanly', () => {
    toggleHydrationChecked('ev_shbg');
    expect(hydrationProgressStore.getSnapshot().ev_shbg).toBe(true);

    toggleHydrationChecked('ev_shbg');
    expect(hydrationProgressStore.getSnapshot().ev_shbg).toBe(false);

    toggleHydrationChecked('pvp_gl');
    resetHydrationProgress();
    expect(hydrationProgressStore.getSnapshot()).toEqual({});
  });
});
