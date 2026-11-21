import { expect, test, describe } from 'vitest';
import {
  TAG_NAMESPACES,
  CORE_TAGS,
  OPTIONAL_TAGS,
  ALL_TAG_DEFINITIONS,
  createDefaultTagMap,
  lintTagName,
  lintTagMap,
  getTagHash,
  getNamespaceHashes,
  getNamespaceExclusions,
  getRecommendedDragOrder,
} from './tagSystem';

describe('28-tag, 7-namespace blueprint', () => {
  test('defines exactly 28 core tags across 7 namespaces + optional 29th OP-Purify1k', () => {
    expect(TAG_NAMESPACES).toHaveLength(7);
    expect(CORE_TAGS).toHaveLength(28);
    expect(OPTIONAL_TAGS).toHaveLength(1);
    expect(ALL_TAG_DEFINITIONS).toHaveLength(29);
    expect(OPTIONAL_TAGS[0].id).toBe('op_purify1k');
  });

  test('all default 28 core tags (and optional 29th enabled) pass lintTagMap with ZERO errors and ZERO warnings', () => {
    const defaultMap = createDefaultTagMap();
    const res = lintTagMap(defaultMap);
    expect(res.valid).toBe(true);
    expect(res.errorCount).toBe(0);
    expect(res.warningCount).toBe(0);

    // Enable optional 29th tag too
    const allEnabled = { ...defaultMap, op_purify1k: { ...defaultMap.op_purify1k, enabled: true } };
    const resAll = lintTagMap(allEnabled);
    expect(resAll.valid).toBe(true);
    expect(resAll.errorCount).toBe(0);
    expect(resAll.warningCount).toBe(0);
  });

  test('recommended drag order starts with OP-2xXfer, TR-Mirror, TR-Dist, TR-Spec, EV-ShBG', () => {
    const ordered = getRecommendedDragOrder();
    expect(ordered.slice(0, 5).map((t) => t.id)).toEqual([
      'op_2xxfer',
      'tr_mirror',
      'tr_dist',
      'tr_spec',
      'ev_shbg',
    ]);
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
  test('uses clean namespace umbrellas for default tags', () => {
    const map = createDefaultTagMap();
    expect(getTagHash('pvp_gl', map)).toBe('#pvp-gl');
    expect(getNamespaceHashes('pvp', map)).toEqual(['#pvp']);
    expect(getNamespaceExclusions('ev', map)).toEqual(['!#ev']);
    expect(getTagHash('op_purify1k', map)).toBe(''); // optional disabled by default
  });

  test('falls back to explicit tag hashes when user renames tags outside namespace prefix', () => {
    const map = createDefaultTagMap();
    map.pvp_gl = { name: 'GreatLeague', enabled: true };
    const hashes = getNamespaceHashes('pvp', map);
    expect(hashes).toContain('#greatleague');
    expect(hashes).toContain('#pvp-ul');
    expect(hashes).not.toEqual(['#pvp']);
  });
});
