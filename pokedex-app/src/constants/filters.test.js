import { expect, test } from "bun:test";
import { INITIAL_FILTERS, ATTRIBUTES, TYPES } from "./filters";

test("INITIAL_FILTERS should have all attributes set to null", () => {
  ATTRIBUTES.forEach(attr => {
    expect(INITIAL_FILTERS[attr]).toBe(null);
  });
});

test("INITIAL_FILTERS should have empty arrays for appraisal and types", () => {
  expect(INITIAL_FILTERS.appraisal).toEqual([]);
  expect(INITIAL_FILTERS.types).toEqual([]);
});

test("INITIAL_FILTERS should have empty strings for age range", () => {
  expect(INITIAL_FILTERS.ageMin).toBe('');
  expect(INITIAL_FILTERS.ageMax).toBe('');
});

test("TYPES should be correctly defined", () => {
  expect(TYPES).toContain('fire');
  expect(TYPES).toContain('water');
  expect(TYPES.length).toBe(18);
});
