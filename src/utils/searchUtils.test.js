import { expect, test, describe } from "bun:test";
import { compressIdRanges } from "./searchUtils";

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
