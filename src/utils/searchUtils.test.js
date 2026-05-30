import { expect, test, describe } from "bun:test";
import { compressIdRanges, parseSearchString } from "./searchUtils";

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
      // Current implementation might produce weird results with duplicates if not handled.
      // If we decide to support array with duplicates, we should expect unique ranges.
      // For now, let's verify what happens or expect the robust behavior if I fix it.
      // I'll assume I will fix it.
      expect(compressIdRanges([1, 1, 2, 3])).toBe("1-3");
      expect(compressIdRanges([1, 2, 2, 3])).toBe("1-3");
      expect(compressIdRanges([1, 3, 3, 5])).toBe("1,3,5");
  });
});

describe("parseSearchString", () => {
  test("should handle empty or null string", () => {
    const empty = parseSearchString("");
    expect(empty.selectedIds.size).toBe(0);
    expect(empty.filters.appraisal.length).toBe(0);
    expect(empty.filters.ageMin).toBe("");
    expect(empty.filters.ageMax).toBe("");
    expect(empty.filters.shiny).toBe(null);

    const nul = parseSearchString(null);
    expect(nul.selectedIds.size).toBe(0);
  });

  test("should parse IDs and ranges", () => {
    const result = parseSearchString("1,3-5,10");
    const ids = Array.from(result.selectedIds).sort((a, b) => a - b);
    expect(ids).toEqual([1, 3, 4, 5, 10]);
  });

  test("should parse attributes", () => {
    const result = parseSearchString("shiny");
    expect(result.filters.shiny).toBe(true);
    expect(result.filters.legendary).toBe(null);
  });

  test("should parse negated attributes", () => {
    const result = parseSearchString("!legendary");
    expect(result.filters.legendary).toBe(false);
  });

  test("should parse types", () => {
    const result = parseSearchString("fire");
    expect(result.filters.types).toContain("fire");
  });

  test("should parse multiple types", () => {
    const result = parseSearchString("fire&water");
    expect(result.filters.types).toContain("fire");
    expect(result.filters.types).toContain("water");
    expect(result.filters.types.length).toBe(2);
  });

  test("should parse appraisal", () => {
    const result = parseSearchString("4*");
    expect(result.filters.appraisal).toContain("4*");
  });

  test("should parse age range", () => {
    const result = parseSearchString("age0-10");
    expect(result.filters.ageMin).toBe("0");
    expect(result.filters.ageMax).toBe("10");
  });

  test("should parse exact age", () => {
    const result = parseSearchString("age5");
    expect(result.filters.ageMin).toBe("5");
    expect(result.filters.ageMax).toBe("5");
  });

  test("should parse complex combination", () => {
    const result = parseSearchString("shiny&!mythical&1-3&fire&4*&age1");

    // IDs
    const ids = Array.from(result.selectedIds).sort((a, b) => a - b);
    expect(ids).toEqual([1, 2, 3]);

    // Filters
    expect(result.filters.shiny).toBe(true);
    expect(result.filters.mythical).toBe(false);
    expect(result.filters.types).toContain("fire");
    expect(result.filters.appraisal).toContain("4*");
    expect(result.filters.ageMin).toBe("1");
    expect(result.filters.ageMax).toBe("1");
  });

  test("should handle whitespace and case insensitivity", () => {
    const result = parseSearchString(" Shiny & FIRE & ! Shadow ");
    expect(result.filters.shiny).toBe(true);
    expect(result.filters.types).toContain("fire");
    expect(result.filters.shadow).toBe(false);
  });

  test("should handle whitespace in ID list", () => {
    const result = parseSearchString("1, 2, 3");
    const ids = Array.from(result.selectedIds).sort((a, b) => a - b);
    expect(ids).toEqual([1, 2, 3]);
  });
});
