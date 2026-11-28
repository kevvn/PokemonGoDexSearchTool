import { beforeEach, describe, expect, test } from 'vitest';
import metaSnapshot from '../../data/meta_snapshot.json';
import pokedexData from '../../data/pokedex.json';
import { compileSpeciesTraitWishlist, validateSearchString } from '../searchEngine';
import {
  addWishlistSpecies,
  buildGroupWishlistQueries,
  clearPersonalWishlist,
  compileMyWishlist,
  parseImportedFriendWishlist,
  sanitizeWishlistState,
  toggleWishlistSpeciesTrait,
  tradeWishlistStore,
} from './tradeWishlistModel';

describe('compileSpeciesTraitWishlist (Fly33 exclusion-filter algebra)', () => {
  test('compiles mixed species and traits (including &-split traits) into compact linear PoGO CNF', () => {
    const res = compileSpeciesTraitWishlist(
      [
        { dexId: 384, traits: [] },
        { dexId: 4, traits: ['shiny&costume'] },
        { dexId: 757, traits: ['female', 'shiny'] },
      ],
      ['!traded', '!shadow', '!fusion']
    );

    expect(res.query).toBe(
      '!traded&!shadow&!fusion&4,384,757&!4,shiny&!4,costume&!757,female&!757,shiny'
    );
    expect(res.speciesIds).toEqual([4, 384, 757]);
    const validation = validateSearchString(res.query);
    expect(validation.valid).toBe(true);
    expect(validation.errors).toEqual([]);
    expect(validation.warnings).toEqual([]);
  });

  test('returns empty query when entries are empty', () => {
    const res = compileSpeciesTraitWishlist([], ['!traded']);
    expect(res.query).toBe('');
    expect(res.speciesIds).toEqual([]);
  });
});

describe('tradeWishlistStore lifecycle & actions', () => {
  beforeEach(() => {
    tradeWishlistStore.reset();
  });

  test('returns valid default state on fresh load, SSR snapshot, and reset (getDefaultValue)', () => {
    expect(tradeWishlistStore.getServerSnapshot()).toEqual({
      myWishlist: [],
      friendWishlists: [],
    });
    expect(tradeWishlistStore.getSnapshot()).toEqual({
      myWishlist: [],
      friendWishlists: [],
    });
  });

  test('enforces female/male mutual exclusion when toggling wishlist traits', () => {
    addWishlistSpecies(757);
    toggleWishlistSpeciesTrait(757, 'female');
    expect(tradeWishlistStore.getSnapshot().myWishlist[0].traits).toEqual(['female']);

    toggleWishlistSpeciesTrait(757, 'male');
    expect(tradeWishlistStore.getSnapshot().myWishlist[0].traits).toEqual(['male']);

    clearPersonalWishlist();
    expect(tradeWishlistStore.getSnapshot().myWishlist).toEqual([]);
  });
});

describe('tradeWishlistModel', () => {
  test('compileMyWishlist adds age30- and !defender when remoteReady is enabled', () => {
    const localRes = compileMyWishlist([{ dexId: 201, traits: ['shiny'] }], { remoteReady: false });
    expect(localRes.query).toBe('!traded&!shadow&!fusion&!favorite&201&!201,shiny');
    expect(localRes.qrLimitExceeded).toBe(false);

    const remoteRes = compileMyWishlist([{ dexId: 201, traits: ['lucky2020'] }], { remoteReady: true });
    expect(remoteRes.query).toBe(
      'age30-&!traded&!shadow&!mythical&!fusion&!defender&!favorite&201&!201,year2016-2020'
    );
  });

  test('parseImportedFriendWishlist validates syntax, enforces 4000-char cap, and resolves species names', () => {
    expect(parseImportedFriendWishlist('', '201,384').ok).toBe(false);
    expect(parseImportedFriendWishlist('Alex', '').ok).toBe(false);
    expect(parseImportedFriendWishlist('Alex', '!0-1attack').ok).toBe(false);
    expect(parseImportedFriendWishlist('Alex', '1,'.repeat(2500)).ok).toBe(false);

    const parsed = parseImportedFriendWishlist('Alex', '!traded&201,384,757&!757,female', pokedexData);
    expect(parsed.ok).toBe(true);
    expect(parsed.entry.speciesIds).toEqual([201, 384, 757]);

    // Resolves species names, +family prefixes, and mixed Dex-ID + name/trait clauses cleanly
    const byName = parseImportedFriendWishlist('Sam', 'rayquaza,+gible', pokedexData);
    expect(byName.ok).toBe(true);
    expect(byName.entry.speciesIds).toEqual([384, 443, 444, 445]);

    const mixed = parseImportedFriendWishlist('Mixed', '757,rayquaza&shiny,133', pokedexData);
    expect(mixed.ok).toBe(true);
    expect(mixed.entry.speciesIds).toEqual([133, 384, 757]);
  });

  test('buildGroupWishlistQueries preserves single-friend Fly33 traits and shields 2016-2020 Guaranteed Luckies in cleanup', () => {
    const f1 = parseImportedFriendWishlist('Alex', '!traded&201,384,757&!757,female', pokedexData).entry;
    const single = buildGroupWishlistQueries([f1], { metaSnapshot });
    expect(single.tagGroupWantsQuery).toContain('!757,female');
    expect(single.tagGroupWantsQuery).toContain('!mythical,808-809');
    expect(single.cleanUnwantedQuery).toContain('!year2016-2020');

    const f2 = parseImportedFriendWishlist('Sam', '479,999', pokedexData).entry;
    const f3 = parseImportedFriendWishlist('TraitOnly', 'locationbackground', pokedexData).entry;
    const f4 = { ...parseImportedFriendWishlist('Inactive', '1', pokedexData).entry, active: false };

    const merged = buildGroupWishlistQueries([f1, f2, f3, f4], {
      remoteReady: true,
      metaSnapshot,
    });

    expect(merged.activeCount).toBe(3);
    expect(merged.wantedSpeciesIds).toEqual([201, 384, 479, 757, 999]);
    expect(merged.unindexedFriends.map((f) => f.name)).toEqual(['TraitOnly']);
    expect(merged.tagGroupWantsQuery).toContain('age30-');
    expect(merged.tagGroupWantsQuery).not.toContain(',1,');

    const wantsVal = validateSearchString(merged.tagGroupWantsQuery);
    expect(wantsVal.valid).toBe(true);
    expect(wantsVal.errors).toEqual([]);

    const cleanVal = validateSearchString(merged.cleanUnwantedQuery, { isTrashContext: true });
    expect(cleanVal.valid).toBe(true);
    expect(cleanVal.errors).toEqual([]);
    expect(cleanVal.warnings).toEqual([]);
    expect(merged.cleanUnwantedQuery).toContain('!year2016-2020');
    expect(merged.cleanUnwantedQuery).toContain('!201');
    expect(merged.cleanUnwantedQuery).toMatch(/!384\b|!38\d-38\d/);
    expect(merged.cleanUnwantedQuery).toMatch(/!999\b|!996-1000/);
    expect(merged.cleanUnwantedQuery).toContain('@3mov');
    // Deduplicated SCARCE_RARE_SPECIES_IDS: !201 appears only once
    expect(merged.cleanUnwantedQuery.match(/!201\b/g)?.length).toBe(1);
  });

  test('sanitizeWishlistState safely handles malformed payloads and mutually exclusive genders', () => {
    expect(sanitizeWishlistState(null)).toEqual({ myWishlist: [], friendWishlists: [] });
    expect(sanitizeWishlistState([])).toEqual({ myWishlist: [], friendWishlists: [] });

    const sanitized = sanitizeWishlistState({
      myWishlist: [
        { dexId: 757, traits: ['female', 'male', 'invalid_trait', 'female'] },
        { dexId: -5, traits: [] },
        { dexId: 757, traits: ['background'] },
      ],
      friendWishlists: [
        { id: 'f1', name: 'Alex', rawQuery: '201,384', speciesIds: [384, 201, -1] },
        { id: 'f2', name: '', rawQuery: '201' },
      ],
    });

    expect(sanitized.myWishlist).toEqual([{ dexId: 757, traits: ['female'] }]);
    expect(sanitized.friendWishlists).toHaveLength(1);
    expect(sanitized.friendWishlists[0].speciesIds).toEqual([201, 384]);
  });
});
