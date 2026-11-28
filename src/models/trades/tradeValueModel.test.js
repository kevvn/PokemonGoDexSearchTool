import { describe, expect, test } from 'vitest';
import metaSnapshot from '../../data/meta_snapshot.json';
import { validateSearchString } from '../searchEngine';
import {
  buildRemoteTradeShowcaseQueries,
  buildTradeHoardAudit,
  getDefaultStaleMaxYear,
  getStaleYearOptions,
  getTradeTierSpecies,
} from './tradeValueModel';

describe('tradeValueModel', () => {
  test('computes non-overlapping Tier S, Tier A, and Tier B lists excluding untradeables (#718, #890)', () => {
    const tiers = getTradeTierSpecies(metaSnapshot);
    expect(tiers.tierS.length).toBeGreaterThan(10);
    expect(tiers.tierA.length).toBeGreaterThan(30);
    expect(tiers.tierB.length).toBeGreaterThan(10);

    // Untradeable 1-per-account species (#718 Zygarde, #890 Eternatus) must never appear
    expect(tiers.tierSAndA).not.toContain(718);
    expect(tiers.tierSAndA).not.toContain(890);

    const tierSSet = new Set(tiers.tierS);
    for (const id of tiers.tierA) {
      expect(tierSSet.has(id)).toBe(false);
    }
    const protectedSet = new Set(tiers.tierSAndA);
    for (const id of tiers.tierB) {
      expect(protectedSet.has(id)).toBe(false);
    }
  });

  test('derives stale year options dynamically from reference date without hardcoded arrays', () => {
    expect(getStaleYearOptions('2026-11-28')).toEqual([2021, 2022, 2023, 2024, 2025]);
    expect(getDefaultStaleMaxYear('2026-11-28')).toBe(2024);
    expect(getStaleYearOptions('2028-03-01')).toEqual([2021, 2022, 2023, 2024, 2025, 2026, 2027]);
  });

  test('every Hoard Audit query passes PoGO validator with 0 errors, 0 warnings, and <4000 chars', () => {
    const audit = buildTradeHoardAudit({
      metaSnapshot,
      duplicateCap: 4,
      staleMaxYear: 2024,
    });

    const allCards = [
      ...audit.deadTradeAudits,
      ...audit.demandTierCards,
      ...audit.duplicatePruners,
      audit.staleCleanup,
    ];

    for (const card of allCards) {
      const result = validateSearchString(card.query, { isTrashContext: Boolean(card.isTrash) });
      expect(result.valid, `${card.id}: ${result.errors.join('; ')}`).toBe(true);
      expect(result.errors, `${card.id} errors`).toEqual([]);
      expect(result.warnings, `${card.id} warnings`).toEqual([]);
      expect(card.query.length).toBeLessThan(4000);
    }

    // Meltan/Melmetal (#808-809) are tradeable Mythicals: must NOT be flagged as untradeable
    const untradeableAudit = audit.deadTradeAudits.find((c) => c.id === 'dead_untradeable_in_trade_tags');
    expect(untradeableAudit.query).toContain('&!808-809');

    // Tier S covers shiny&background via 2-clause CNF and guards plain Kanto Birds
    const tierSGrails = audit.demandTierCards.find((c) => c.id === 'tier_s_grails');
    expect(tierSGrails.query).toContain('!mythical,808-809');
    expect(tierSGrails.query).toContain('shiny,locationbackground,gigantamax,');
    expect(tierSGrails.query).toContain('background,gigantamax,');
    expect(tierSGrails.query).toContain('!144-146,galar,shiny,background,dynamax');

    // Verify 2016-2020 Guaranteed Lucky bait and stale 2021-2024 non-rare cleanup
    const luckyCard = audit.demandTierCards.find((c) => c.id === 'tier_s_guaranteed_lucky');
    expect(luckyCard.query).toContain('year2016-2020');
    expect(luckyCard.query).toContain('!mythical,808-809');

    expect(audit.staleCleanup.query).toContain('year2021-2024');
    expect(audit.staleCleanup.query).toContain('@3mov');
    expect(audit.staleCleanup.query).toContain('!shiny');
    expect(audit.staleCleanup.query).toContain('!background');
    // Verify SCARCE_RARE_SPECIES_IDS is not duplicated (only one !201 token)
    expect(audit.staleCleanup.query.match(/!201\b/g)?.length).toBe(1);
  });

  test('Dead Trade Audit resolves custom tag names cleanly', () => {
    const audit = buildTradeHoardAudit({
      tagMap: {
        tr_spec: { name: 'MySpecialTrade' },
        tr_mirror: { name: 'MyMirror' },
        tr_dist: { name: 'MyDist' },
      },
      metaSnapshot,
    });

    const tradedAudit = audit.deadTradeAudits.find((c) => c.id === 'dead_traded_in_trade_tags');
    expect(tradedAudit.query).toBe('#myspecialtrade,#mymirror,#mydist&traded');
  });

  test('all Remote Trade showcase queries enforce eligibility guards and pass validation', () => {
    const queries = buildRemoteTradeShowcaseQueries({ metaSnapshot });
    expect(queries.length).toBeGreaterThanOrEqual(5);

    for (const card of queries) {
      const result = validateSearchString(card.query);
      expect(result.valid, `${card.id}: ${result.errors.join('; ')}`).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.warnings).toEqual([]);
      expect(card.query).toContain('!traded');
      expect(card.query).toContain('!shadow');
      expect(card.query).toContain('!mythical');
      expect(card.query).toContain('!fusion');
      if (card.id !== 'remote_cooldown_preview') {
        expect(card.query).toContain('age30-');
        expect(card.query).toContain('!defender');
      } else {
        expect(card.query).toContain('age0-29');
      }
    }
  });
});
