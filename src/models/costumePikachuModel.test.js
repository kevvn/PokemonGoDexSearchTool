import { describe, expect, test } from 'vitest';
import {
  COSTUME_PIKACHU_REGISTRY,
  TOTAL_DISTINCT_PIKACHU_COSTUMES,
  buildCostumeEntrySearchString,
  compressYearTokens,
  computePikachuStorageBudget,
  filterCostumePikachuCatalog,
  getAvailablePikachuYears,
  getPikachuYearSlices,
} from './costumePikachuModel';
import { buildTriageFunnels } from './triageFunnelModel';
import { validateSearchString } from './searchEngine';
import { createDefaultTagMap } from './tagModel';

describe('costumePikachuModel & Mode E safety invariants', () => {
  test('registry has unique IDs, valid years, and covers 75+ distinct Costume Pikachu variants (2016–2026)', () => {
    const ids = COSTUME_PIKACHU_REGISTRY.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(TOTAL_DISTINCT_PIKACHU_COSTUMES).toBeGreaterThanOrEqual(75);

    const years = getAvailablePikachuYears();
    expect(years[0]).toBeGreaterThanOrEqual(2026);
    expect(years[years.length - 1]).toBe(2016);
  });

  test('compressYearTokens collapses contiguous year ranges cleanly', () => {
    expect(compressYearTokens([2018])).toBe('year2018');
    expect(compressYearTokens([2016, 2017, 2018, 2019, 2021, 2026])).toBe(
      'year2016-2019,year2021,year2026'
    );
    expect(compressYearTokens([2022, 2020, 2021])).toBe('year2020-2022');
  });

  test('computePikachuStorageBudget calculates ≤6 per costume cap & estimated savings from 1,000', () => {
    const budget6 = computePikachuStorageBudget(6, 1000);
    expect(budget6.keepCap).toBe(6);
    expect(budget6.perGenderCap).toBe(3);
    expect(budget6.maxTotalSlots).toBe(TOTAL_DISTINCT_PIKACHU_COSTUMES * 6);
    expect(budget6.estimatedSavings).toBe(Math.max(0, 1000 - TOTAL_DISTINCT_PIKACHU_COSTUMES * 6));
    expect(budget6.recommendedSplit).toContain('≤3M / ≤3F');

    const budget2 = computePikachuStorageBudget(2, 1000);
    expect(budget2.perGenderCap).toBe(1);
    expect(budget2.estimatedSavings).toBeGreaterThan(budget6.estimatedSavings);
  });

  test('EVERY per-costume search string in the catalog passes validateSearchString with 0 errors and 0 warnings', () => {
    for (const includeFamily of [false, true]) {
      for (const entry of COSTUME_PIKACHU_REGISTRY) {
        const query = buildCostumeEntrySearchString(entry, { includeFamily });
        const res = validateSearchString(query, { isTrashContext: false });
        expect(res.errors, `Catalog errors for ${entry.id}: ${query}`).toEqual([]);
        expect(res.warnings, `Catalog warnings for ${entry.id}: ${query}`).toEqual([]);
        expect(query).not.toContain('+25');
        expect(query).not.toMatch(/count[2-9]/i);
      }
    }

    const libre = COSTUME_PIKACHU_REGISTRY.find((e) => e.id === 'pikachu-libre');
    const libreQuery = buildCostumeEntrySearchString(libre);
    expect(libreQuery).toContain('gbl');
    expect(libreQuery).toContain('@flying press');
    expect(libreQuery).toContain('female');

    const fragment = COSTUME_PIKACHU_REGISTRY.find((e) => e.id === 'fragment-hat');
    const fragmentQuery = buildCostumeEntrySearchString(fragment);
    expect(fragmentQuery).toBe('25&costume&year2018&evolve');
  });

  test('filterCostumePikachuCatalog filters accurately by search, rarity, year slice, and trait', () => {
    const ultraRare = filterCostumePikachuCatalog(COSTUME_PIKACHU_REGISTRY, {
      rarity: 'ultra-rare',
    });
    expect(ultraRare.some((e) => e.id === 'fragment-hat')).toBe(true);
    expect(ultraRare.some((e) => e.id === 'pikachu-libre')).toBe(true);
    expect(ultraRare.some((e) => e.id === 'cake-costume')).toBe(false);

    const evolvable = filterCostumePikachuCatalog(COSTUME_PIKACHU_REGISTRY, {
      trait: 'evolvable',
    });
    expect(evolvable.length).toBeGreaterThanOrEqual(12);
    expect(evolvable.every((e) => e.canEvolve)).toBe(true);

    const batik = filterCostumePikachuCatalog(COSTUME_PIKACHU_REGISTRY, {
      search: 'batik',
      trait: 'background',
    });
    expect(batik.map((e) => e.id)).toContain('batik-shirt');

    const vintage = filterCostumePikachuCatalog(COSTUME_PIKACHU_REGISTRY, {
      yearSlice: 'year2016-2020',
    });
    expect(vintage.some((e) => e.id === 'santa-hat')).toBe(true);
    expect(vintage.some((e) => e.id === 'hat-capelet-halloween-2026')).toBe(false);
  });

  test('Mode E steps P1–P7 validate cleanly across all year slices, gender splits, and family toggles', () => {
    const slices = getPikachuYearSlices();
    const genders = ['', 'male', 'female'];

    for (const slice of slices) {
      for (const gender of genders) {
        for (const includeFamily of [false, true]) {
          const funnels = buildTriageFunnels({}, createDefaultTagMap(), {
            pikachuKeepCap: 6,
            pikachuYearSlice: slice.token,
            pikachuGender: gender,
            pikachuIncludeFamily: includeFamily,
          });
          const modeE = funnels.modes.modeE;
          expect(modeE.steps).toHaveLength(7);

          for (const step of modeE.steps) {
            const res = validateSearchString(step.query, { isTrashContext: step.isTrash });
            expect(res.errors, `Mode E errors in ${step.id} (${slice.token}/${gender}): ${step.query}`).toEqual([]);
            expect(res.warnings, `Mode E warnings in ${step.id} (${slice.token}/${gender}): ${step.query}`).toEqual([]);
            expect(step.query).not.toMatch(/count[2-9]/i);

            if (step.isTrash) {
              expect(step.query).toContain('!#');
              expect(step.query).toContain('!favorite');
              expect(step.query).toContain('!shiny');
              expect(step.query).toContain('!background');
              expect(step.query).toContain('!year2016-2020');
              expect(step.query).toContain('!gbl');
              expect(step.query).toContain('@3mov');
              expect(step.query).not.toContain('!@3mov');
              // Must NEVER contradict !year2016-2020 with positive year2016-2020
              expect(step.query).not.toMatch(/(?:^|&)year2016-2020(?:&|$)/);
            }

            if (step.subQueries) {
              for (const sq of step.subQueries) {
                const sqRes = validateSearchString(sq.query, {
                  isTrashContext: sq.isTrash ?? step.isTrash,
                });
                expect(sqRes.errors, `Mode E subQuery errors in ${step.id}/${sq.label}: ${sq.query}`).toEqual([]);
                expect(sqRes.warnings, `Mode E subQuery warnings in ${step.id}/${sq.label}: ${sq.query}`).toEqual([]);
              }
            }
          }
        }
      }
    }
  });
});
