import { expect, test, describe } from 'vitest';
import {
  REGIONS,
  TYPES,
  ATTRIBUTES,
  PVP_IV_EXCLUDE_CLAUSE,
  NUNDO_EXCLUDE_CLAUSE,
  compressIds,
  compressIdRanges,
  expandIds,
  invertIvStatRange,
  parseToAst,
  parseSearchString,
  generateSearchString,
  normalizeSearchString,
  validateSearchString,
  createDefaultFilters,
  compileDnfToPogoCnf,
  compileDnfToPogoCnfSafe,
  inspectAndFixPogoQuery,
} from './searchEngine';

describe('constants', () => {
  test('includes all 10 regions including Hisui', () => {
    expect(REGIONS).toHaveLength(10);
    expect(REGIONS).toContain('Hisui');
    expect(REGIONS).toContain('Galar');
    expect(REGIONS).toContain('Paldea');
  });

  test('uses canonical ultrabeast and party spellings', () => {
    expect(ATTRIBUTES).toContain('ultrabeast');
    expect(ATTRIBUTES).not.toContain('ultrabeasts');
    expect(ATTRIBUTES).toContain('party');
    expect(ATTRIBUTES).not.toContain('partyplay');
    expect(ATTRIBUTES).toContain('background');
    expect(ATTRIBUTES).toContain('locationbackground');
    expect(ATTRIBUTES).toContain('specialbackground');
    expect(ATTRIBUTES).toContain('profilebackground');
    expect(ATTRIBUTES).toContain('maxmove1-');
    expect(ATTRIBUTES).toContain('!@3mov');
    expect(TYPES).toHaveLength(18);
  });
});

describe('compressIds / expandIds', () => {
  test('handles empty, null, and single IDs', () => {
    expect(compressIds([])).toBe('');
    expect(compressIds(new Set())).toBe('');
    expect(compressIds(null)).toBe('');
    expect(compressIds(undefined)).toBe('');
    expect(compressIds([1])).toBe('1');
    expect(compressIdRanges(new Set([5]))).toBe('5');
  });

  test('compresses continuous, discontinuous, unsorted, string, and duplicate inputs', () => {
    expect(compressIds([1, 2, 3])).toBe('1-3');
    expect(compressIds([1, 2, 3, 5, 7, 8])).toBe('1-3,5,7-8');
    expect(compressIds([3, 1, 2])).toBe('1-3');
    expect(compressIds(['1', '2', '3'])).toBe('1-3');
    expect(compressIds([1, 1, 2, 2, 3, 5, 5])).toBe('1-3,5');
  });

  test('expandIds round-trips compressed ranges', () => {
    const expanded = expandIds('1-3, 25-26, 172');
    expect(Array.from(expanded).sort((a, b) => a - b)).toEqual([1, 2, 3, 25, 26, 172]);
  });
});

describe('invertIvStatRange', () => {
  test('inverts IV ranges into valid positive complement clauses (never !{N}attack)', () => {
    expect(invertIvStatRange('attack', 0, 1)).toBe('2-4attack');
    expect(invertIvStatRange('defense', 3, 4)).toBe('0-2defense');
    expect(invertIvStatRange('hp', 0, 0)).toBe('1-4hp');
    expect(invertIvStatRange('attack', 2, 2)).toBe('0-1attack,3-4attack');
    expect(invertIvStatRange('hp', 0, 4)).toBe('');
  });
});

describe('parseSearchString & generateSearchString round-trip (CNF)', () => {
  test('round-trips comma-joined appraisals (0*,1*,2*) and comma-joined types (fire,water)', () => {
    const input = '1-3,25&0*,1*,2*&fire,water&shiny&!legendary';
    const { selectedIds, filters } = parseSearchString(input);

    expect(Array.from(selectedIds).sort((a, b) => a - b)).toEqual([1, 2, 3, 25]);
    expect(filters.appraisal).toEqual(['0*', '1*', '2*']);
    expect(filters.types).toEqual(['fire', 'water']);
    expect(filters.shiny).toBe(true);
    expect(filters.legendary).toBe(false);

    const out = generateSearchString(selectedIds, filters);
    expect(out).toContain('1-3,25');
    expect(out).toContain('0*,1*,2*');
    expect(out).toContain('fire,water');
    expect(out).toContain('shiny');
    expect(out).toContain('!legendary');
  });

  test('supports attributeLogic OR generation and clean round-tripping', () => {
    const filters = createDefaultFilters();
    filters.attributeLogic = 'OR';
    filters.shiny = true;
    filters.lucky = true;
    filters.shadow = false;
    filters['#'] = false;

    const generated = generateSearchString(new Set([25]), filters);
    expect(generated).toBe('25&shiny,lucky&!shadow&!#');

    const parsed = parseSearchString(generated);
    expect(parsed.filters.attributeLogic).toBe('OR');
    expect(parsed.filters.shiny).toBe(true);
    expect(parsed.filters.lucky).toBe(true);
    expect(parsed.filters.shadow).toBe(false);
    expect(parsed.filters['#']).toBe(false);
    expect(parsed.filters.rawClauses).toEqual([]);
    expect(generateSearchString(parsed.selectedIds, parsed.filters)).toBe(generated);
  });

  test('preserves (A OR B) AND C semantics safely in rawClauses when mixed with single positive attributes', () => {
    const mixed = parseSearchString('shiny,lucky&legendary');
    expect(mixed.filters.attributeLogic).toBe('AND');
    expect(mixed.filters.legendary).toBe(true);
    expect(mixed.filters.rawClauses).toEqual(['shiny,lucky']);
    expect(generateSearchString(mixed.selectedIds, mixed.filters)).toBe('legendary&shiny,lucky');
  });

  test('preserves dual-type AND semantics (dragon&flying) without collapsing to OR (dragon,flying)', () => {
    const dualAnd = parseSearchString('dragon&flying');
    expect(dualAnd.filters.types).toEqual(['dragon']);
    expect(dualAnd.filters.rawClauses).toEqual(['flying']);
    expect(generateSearchString(dualAnd.selectedIds, dualAnd.filters)).toBe('dragon&flying');

    const dualOr = parseSearchString('dragon,flying');
    expect(dualOr.filters.types).toEqual(['dragon', 'flying']);
    expect(dualOr.filters.rawClauses).toEqual([]);
    expect(generateSearchString(dualOr.selectedIds, dualOr.filters)).toBe('dragon,flying');

    const multiDexAnd = parseSearchString('1-151&25');
    expect(multiDexAnd.selectedIds.size).toBe(151);
    expect(multiDexAnd.filters.rawClauses).toEqual(['25']);
    expect(generateSearchString(multiDexAnd.selectedIds, multiDexAnd.filters)).toBe('1-151&25');
  });

  test('preserves negated IDs, negated age, negated appraisal, and negated types in rawClauses instead of stripping !', () => {
    const { selectedIds, filters } = parseSearchString('!1-151&!age0-7&!4*&!fire');
    expect(selectedIds.size).toBe(0);
    expect(filters.ageMin).toBe('');
    expect(filters.ageMax).toBe('');
    expect(filters.appraisal).toEqual([]);
    expect(filters.types).toEqual([]);
    expect(filters.rawClauses).toEqual(['!1-151', '!age0-7', '!4*', '!fire']);
    expect(generateSearchString(selectedIds, filters)).toBe('!1-151&!age0-7&!4*&!fire');
  });

  test('preserves unknown/complex PoGO clauses (#tag, @frustration, 4*,shiny,background, countcandyxl296-)', () => {
    const input = 'age0&!#&4*,shiny,background&#pvp-gl&@frustration&countcandyxl296-';
    const { selectedIds, filters } = parseSearchString(input);
    expect(filters.ageMin).toBe('0');
    expect(filters.ageMax).toBe('0');
    expect(filters['#']).toBe(false);
    expect(filters.rawClauses).toEqual(['4*,shiny,background', '#pvp-gl', '@frustration', 'countcandyxl296-']);

    const regenerated = generateSearchString(selectedIds, filters);
    expect(regenerated).toContain('age0');
    expect(regenerated).toContain('!#');
    expect(regenerated).toContain('4*,shiny,background');
    expect(regenerated).toContain('#pvp-gl');
    expect(regenerated).toContain('@frustration');
    expect(regenerated).toContain('countcandyxl296-');
  });

  test('handles !@3mov (has 2nd move) and @3mov (single-move shield) without double negation', () => {
    const hasSecond = parseSearchString('!@3mov');
    expect(hasSecond.filters['!@3mov']).toBe(true);
    expect(generateSearchString(hasSecond.selectedIds, hasSecond.filters)).toBe('!@3mov');

    const singleOnly = parseSearchString('@3mov');
    expect(singleOnly.filters['!@3mov']).toBe(false);
    expect(generateSearchString(singleOnly.selectedIds, singleOnly.filters)).toBe('@3mov');
  });

  test('handles IV stat bar filters and De Morgan PvP/Nundo shields cleanly', () => {
    const pvpScreen = parseSearchString('0-1attack&3-4defense&3-4hp');
    expect(pvpScreen.filters.ivStats).toMatchObject({
      attackMin: '0', attackMax: '1',
      defenseMin: '3', defenseMax: '4',
      hpMin: '3', hpMax: '4',
    });
    expect(generateSearchString(pvpScreen.selectedIds, pvpScreen.filters)).toBe('0-1attack&3-4defense&3-4hp');

    const shielded = parseSearchString(`0*,1*,2*&${PVP_IV_EXCLUDE_CLAUSE}&${NUNDO_EXCLUDE_CLAUSE}`);
    expect(shielded.filters.ivStats.excludePvpIv).toBe(true);
    expect(shielded.filters.ivStats.excludeNundo).toBe(true);
    expect(generateSearchString(shielded.selectedIds, shielded.filters)).toBe(
      `0*,1*,2*&${PVP_IV_EXCLUDE_CLAUSE}&${NUNDO_EXCLUDE_CLAUSE}`
    );
  });

  test('parses legacy alias "ultra beasts" to canonical "ultrabeast"', () => {
    const parsed = parseSearchString('!ultra beasts');
    expect(parsed.filters.ultrabeast).toBe(false);
    expect(generateSearchString(parsed.selectedIds, parsed.filters)).toBe('!ultrabeast');
  });

  test('handles distance100- open minimum range properly', () => {
    const parsed = parseSearchString('distance100-&!traded');
    expect(parsed.filters.distanceMin).toBe('100');
    expect(parsed.filters.distanceMax).toBe('');
    expect(generateSearchString(parsed.selectedIds, parsed.filters)).toBe('distance100-&!traded');

    const bare = parseSearchString('distance100');
    expect(bare.filters.distanceMin).toBe('');
    expect(bare.filters.distanceMax).toBe('100');
  });

  test('normalizeSearchString converts | -> &, ;/: -> ,, strips space after !', () => {
    expect(normalizeSearchString('0*;1*:2* | ! shiny & !ultra beasts')).toBe('0*,1*,2*&!shiny&!ultrabeast');
  });

  test('parseToAst handles CNF combinators', () => {
    const ast = parseToAst('a,b&!c|d;e');
    expect(ast.clauses).toHaveLength(3);
    expect(ast.clauses[0].atoms.map((a) => a.value)).toEqual(['a', 'b']);
    expect(ast.clauses[1].atoms[0]).toMatchObject({ value: 'c', negated: true });
    expect(ast.clauses[2].atoms.map((a) => a.value)).toEqual(['d', 'e']);
  });
});

describe('validateSearchString guardrails', () => {
  test('accepts valid ultra-safe trash string with @3mov and De Morgan shields', () => {
    const validTrash =
      'age0&!#&!favorite&0*,1*,2*&!shiny&!background&!costume&!legendary&!mythical&!ultrabeast&!shadow&!maxmove1-&!xxl&!xxs&!@special&!lucky&!fusion&!adventureeffect&@3mov&2-4attack,0-2defense,0-2hp&1-4attack,1-4defense,1-4hp';
    const res = validateSearchString(validTrash, { isTrashContext: true });
    expect(res.valid).toBe(true);
    expect(res.errors).toHaveLength(0);
    expect(res.warnings).toHaveLength(0);
  });

  test('catches ultrabeasts, partyplay, negated IV stats, +dex, invalid star range, and space after !', () => {
    expect(validateSearchString('!ultrabeasts').errors.map((e) => e.code)).toContain('INVALID_ULTRABEASTS');
    expect(validateSearchString('partyplay').errors.map((e) => e.code)).toContain('INVALID_PARTYPLAY');
    expect(validateSearchString('!0-1attack').errors.map((e) => e.code)).toContain('NEGATED_IV_STAT');
    expect(validateSearchString('!4hp').errors.map((e) => e.code)).toContain('NEGATED_IV_STAT');
    expect(validateSearchString('+25').errors.map((e) => e.code)).toContain('PLUS_ON_DEX');
    expect(validateSearchString('0-2*').errors.map((e) => e.code)).toContain('INVALID_STAR_RANGE');
    expect(validateSearchString('! shiny').errors.map((e) => e.code)).toContain('SPACE_AFTER_NOT');
  });

  test('catches !mega and inverted !@3mov in trash context', () => {
    const resMega = validateSearchString('0*,1*,2*&!shiny&!favorite&!mega1-3', { isTrashContext: true });
    expect(resMega.errors.map((e) => e.code)).toContain('NEGATED_MEGA_IN_TRASH');

    const res3Mov = validateSearchString('0*,1*,2*&!shiny&!favorite&!@3mov', { isTrashContext: true });
    expect(res3Mov.errors.map((e) => e.code)).toContain('INVERTED_3MOV_IN_TRASH');
  });

  test('warns on bare distance100, pipe |, grouping (), and >4000 / >5000 chars', () => {
    expect(validateSearchString('distance100').warnings.map((w) => w.code)).toContain('BARE_DISTANCE');
    expect(validateSearchString('a|b').warnings.map((w) => w.code)).toContain('PIPE_IS_AND');
    expect(validateSearchString('(a,b)&c').warnings.map((w) => w.code)).toContain('UNSUPPORTED_GROUPING');

    const warnStr = '1,'.repeat(2050) + '2';
    expect(validateSearchString(warnStr).warnings.map((w) => w.code)).toContain('LENGTH_WARNING');

    const errStr = '1,'.repeat(2600) + '2';
    expect(validateSearchString(errStr).errors.map((e) => e.code)).toContain('LENGTH_ERROR');
  });

  test('warns on VARIANT_COUNT_TRAP and UNSCOPED_NEGATED_MAX', () => {
    expect(validateSearchString('shiny&count4-').warnings.map((w) => w.code)).toContain('VARIANT_COUNT_TRAP');
    expect(validateSearchString('specialbackground&count-3').warnings.map((w) => w.code)).toContain('VARIANT_COUNT_TRAP');
    expect(validateSearchString('costume&count3-').warnings.map((w) => w.code)).toContain('VARIANT_COUNT_TRAP');
    expect(validateSearchString('shiny&count1').warnings.map((w) => w.code)).not.toContain('VARIANT_COUNT_TRAP');
    expect(validateSearchString('legendary&count2-').warnings.map((w) => w.code)).not.toContain('VARIANT_COUNT_TRAP');

    expect(validateSearchString('!maxguard3').warnings.map((w) => w.code)).toContain('UNSCOPED_NEGATED_MAX');
    expect(validateSearchString('maxmove1-&!maxguard3').warnings.map((w) => w.code)).not.toContain('UNSCOPED_NEGATED_MAX');
    expect(validateSearchString('#max-tank&!maxguard3').warnings.map((w) => w.code)).not.toContain('UNSCOPED_NEGATED_MAX');
  });

  test('createDefaultFilters returns clean isolated state with attributeLogic AND', () => {
    const f1 = createDefaultFilters();
    const f2 = createDefaultFilters();
    expect(f1.attributeLogic).toBe('AND');
    f1.appraisal.push('4*');
    expect(f2.appraisal).toEqual([]);
  });
});

describe('compileDnfToPogoCnf & inspectAndFixPogoQuery', () => {
  test('compiles DNF branches with global AND prefixes into minimal absorbed PoGO CNF', () => {
    const cnf = compileDnfToPogoCnf(
      ['4*', 'gigantamax', 'shiny&shadow', 'shiny&legendary'],
      ['!#']
    );
    expect(cnf).toBe('!#&4*,gigantamax,shiny&4*,gigantamax,shadow,legendary');
  });

  test('detects and fixes comma-vs-ampersand precedence traps while leaving valid CNF untouched', () => {
    const trapped = inspectAndFixPogoQuery('!#&4*,shiny&shadow,shiny&legendary');
    expect(trapped.hasPrecedenceTrap).toBe(true);
    expect(trapped.fixedCnfQuery).toBe('!#&4*,shiny&4*,shadow,legendary');

    const alreadyCnf = inspectAndFixPogoQuery('!#&4*,shiny&4*,shadow,legendary');
    expect(alreadyCnf.hasPrecedenceTrap).toBe(false);
    expect(alreadyCnf.fixedCnfQuery).toBe('!#&4*,shiny&4*,shadow,legendary');

    const standardTrash = inspectAndFixPogoQuery('!#&0*,1*,2*&!shiny');
    expect(standardTrash.hasPrecedenceTrap).toBe(false);

    // Regression: valid CNF queries with trailing scope/negations must NEVER be falsely flagged!
    for (const validCnf of [
      '!#&3*,4*&4attack&3-4defense&3-4hp',
      'shiny,lucky&!shadow',
      'distance100-&shiny,costume,201,479&!traded&!#',
      'legendary,ultrabeast&count2-&!shiny&!4*',
    ]) {
      const check = inspectAndFixPogoQuery(validCnf);
      expect(check.hasPrecedenceTrap, `False positive on valid CNF: ${validCnf}`).toBe(false);
    }
  });

  test('bounds combinatorial CNF expansion and eliminates X,!X tautologies', () => {
    const taut = compileDnfToPogoCnfSafe(['shiny&!shiny', '4*']);
    expect(taut.truncated).toBe(false);
    expect(taut.query).toBe('4*');

    const hugeBranches = Array.from({ length: 12 }, (_, i) => `a${i}&b${i}&c${i}`);
    const bounded = compileDnfToPogoCnfSafe(hugeBranches, [], { maxClauses: 32, maxChars: 1000 });
    expect(bounded.truncated).toBe(true);
    expect(bounded.clauseCount).toBeLessThanOrEqual(32);
  });

  test('round-trips year, buddy, and moveQuery filters and auto-swaps inverted ranges', () => {
    const parsed = parseSearchString('year2016-2019&buddy1-4&@1Shadow Claw');
    expect(parsed.filters.yearMin).toBe('2016');
    expect(parsed.filters.yearMax).toBe('2019');
    expect(parsed.filters.buddyMin).toBe('1');
    expect(parsed.filters.buddyMax).toBe('4');
    expect(parsed.filters.moveQuery).toBe('@1Shadow Claw');
    expect(generateSearchString(parsed.selectedIds, parsed.filters)).toBe(
      'year2016-2019&buddy1-4&@1Shadow Claw'
    );

    // Repeated range clauses preserve both instead of silently overwriting
    const multiAge = parseSearchString('age0-2&age5-7');
    expect(multiAge.filters.ageMin).toBe('0');
    expect(multiAge.filters.ageMax).toBe('2');
    expect(multiAge.filters.rawClauses).toContain('age5-7');

    // Inverted ranges auto-swap cleanly in generator and warn in validator
    const inverted = createDefaultFilters();
    inverted.cpMin = '2500';
    inverted.cpMax = '1500';
    expect(generateSearchString(new Set(), inverted)).toBe('cp1500-2500');
    expect(validateSearchString('cp2500-1500').warnings.map((w) => w.code)).toContain('INVERTED_RANGE');
    expect(validateSearchString('!-1attack').errors.map((e) => e.code)).toContain('NEGATED_IV_STAT');
    expect(validateSearchString('!distance100').warnings[0].message).toContain('exclude');
  });

  test('round-trips count range filters while preserving count1 and count2- tri-state chips', () => {
    const parsedRange = parseSearchString('count4-&legendary');
    expect(parsedRange.filters.countMin).toBe('4');
    expect(parsedRange.filters.countMax).toBe('');
    expect(generateSearchString(parsedRange.selectedIds, parsedRange.filters)).toBe(
      'count4-&legendary'
    );

    const parsedBounded = parseSearchString('count2-50');
    expect(parsedBounded.filters.countMin).toBe('2');
    expect(parsedBounded.filters.countMax).toBe('50');
    expect(generateSearchString(parsedBounded.selectedIds, parsedBounded.filters)).toBe('count2-50');

    const parsedLegacy = parseSearchString('count2-&!count1');
    expect(parsedLegacy.filters['count2-']).toBe(true);
    expect(parsedLegacy.filters.count1).toBe(false);

    expect(validateSearchString('count10-5').warnings.map((w) => w.code)).toContain('INVERTED_RANGE');
    expect(
      inspectAndFixPogoQuery('!traded&4,384,757&!4,shiny&!757,female').hasPrecedenceTrap
    ).toBe(false);
    expect(
      inspectAndFixPogoQuery(
        'shiny,background&!traded&!shadow&!fusion&!mythical,808-809&!favorite&!4*&!#'
      ).hasPrecedenceTrap
    ).toBe(false);
    expect(
      inspectAndFixPogoQuery(
        '!traded&!shadow&!fusion&!mythical,808-809&!favorite&!4*&shiny,locationbackground,gigantamax,144-146,384&background,gigantamax,144-146,384&!144-146,galar,shiny,background,dynamax'
      ).hasPrecedenceTrap
    ).toBe(false);
  });
});
