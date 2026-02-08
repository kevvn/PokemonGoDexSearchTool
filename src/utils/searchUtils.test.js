import { expect, test, describe } from "bun:test";
import { compressIdRanges, generateSearchString, ATTRIBUTES } from "./searchUtils";

describe("compressIdRanges", () => {
  test("should handle empty input", () => {
    expect(compressIdRanges([])).toBe("");
    expect(compressIdRanges(new Set())).toBe("");
    expect(compressIdRanges(null)).toBe("");
    expect(compressIdRanges(undefined)).toBe("");
  });

  test("should handle single ID", () => {
    expect(compressIdRanges([1])).toBe("1");
    expect(compressIdRanges(new Set([5]))).toBe("5");
  });

  test("should compress continuous range", () => {
    expect(compressIdRanges([1, 2, 3])).toBe("1-3");
    expect(compressIdRanges(new Set([4, 5, 6, 7]))).toBe("4-7");
  });

  test("should handle discontinuous ranges", () => {
    expect(compressIdRanges([1, 3, 5])).toBe("1,3,5");
    expect(compressIdRanges([1, 2, 4, 5])).toBe("1-2,4-5");
  });

  test("should handle mixed ranges and single numbers", () => {
    expect(compressIdRanges([1, 2, 3, 5, 7, 8])).toBe("1-3,5,7-8");
  });

  test("should handle unsorted input", () => {
    expect(compressIdRanges([3, 1, 2])).toBe("1-3");
    expect(compressIdRanges([5, 1, 3])).toBe("1,3,5");
  });

  test("should handle string inputs that are numbers", () => {
    expect(compressIdRanges(["1", "2", "3"])).toBe("1-3");
    expect(compressIdRanges(["1", "3"])).toBe("1,3");
  });

  test("should handle duplicates gracefully", () => {
      expect(compressIdRanges([1, 1, 2, 3])).toBe("1-3");
      expect(compressIdRanges([1, 2, 2, 3])).toBe("1-3");
      expect(compressIdRanges([1, 3, 3, 5])).toBe("1,3,5");
  });
});

describe("generateSearchString", () => {
  const emptyFilters = {
    appraisal: [],
    ageMin: '',
    ageMax: '',
    types: [],
    shiny: null,
    shadow: null,
    purified: null,
    lucky: null,
    legendary: null,
    mythical: null,
    'ultra beasts': null,
    costume: null,
    evolve: null,
    alola: null,
    galar: null,
    hisui: null,
    paldea: null,
  };

  test("should return empty string for empty inputs", () => {
    expect(generateSearchString(new Set(), emptyFilters)).toBe("");
    expect(generateSearchString(new Set(), {})).toBe("");
    expect(generateSearchString(new Set(), null)).toBe("");
  });

  test("should include compressed IDs", () => {
    expect(generateSearchString(new Set([1, 2, 3]), emptyFilters)).toBe("1-3");
    expect(generateSearchString(new Set([1, 3]), emptyFilters)).toBe("1,3");
  });

  test("should include appraisal", () => {
    const filters = { ...emptyFilters, appraisal: ['3*', '4*'] };
    expect(generateSearchString(new Set(), filters)).toBe("3*,4*");
  });

  test("should include age ranges", () => {
    // Min only
    expect(generateSearchString(new Set(), { ...emptyFilters, ageMin: '2016' })).toBe("age2016-");
    // Max only
    expect(generateSearchString(new Set(), { ...emptyFilters, ageMax: '2023' })).toBe("age-2023");
    // Range
    expect(generateSearchString(new Set(), { ...emptyFilters, ageMin: '2016', ageMax: '2023' })).toBe("age2016-2023");
    // Exact year
    expect(generateSearchString(new Set(), { ...emptyFilters, ageMin: '2016', ageMax: '2016' })).toBe("age2016");
  });

  test("should include attributes (true)", () => {
    const filters = { ...emptyFilters, shiny: true };
    expect(generateSearchString(new Set(), filters)).toBe("shiny");
  });

  test("should include attributes (false)", () => {
    const filters = { ...emptyFilters, shiny: false };
    expect(generateSearchString(new Set(), filters)).toBe("!shiny");
  });

  test("should ignore null attributes", () => {
    const filters = { ...emptyFilters, shiny: null };
    expect(generateSearchString(new Set(), filters)).toBe("");
  });

  test("should include multiple attributes in defined order", () => {
    // ATTRIBUTES order: shiny, shadow, purified, lucky...
    const filters = { ...emptyFilters, shiny: true, shadow: false, lucky: true };
    expect(generateSearchString(new Set(), filters)).toBe("shiny&!shadow&lucky");
  });

  test("should include types", () => {
    const filters = { ...emptyFilters, types: ['fire', 'water'] };
    expect(generateSearchString(new Set(), filters)).toBe("fire,water");
  });

  test("should combine all parts with &", () => {
     const ids = new Set([1, 2]);
     const filters = {
        appraisal: ['4*'],
        ageMin: '2020',
        ageMax: '2021',
        shiny: true,
        types: ['dragon']
     };
     // Expected order based on implementation: IDs -> Appraisal -> Age -> Attributes -> Types
     expect(generateSearchString(ids, filters)).toBe("1-2&4*&age2020-2021&shiny&dragon");
  });
});
