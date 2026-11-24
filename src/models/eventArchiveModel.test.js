import { afterEach, describe, expect, test } from 'vitest';
import {
  BUNDLED_EVENTS_ARCHIVE,
  TRAVEL_TRIPS,
  buildEventActionStrings,
  calculateAgeSearchString,
  computeYearSlicerPlan,
  deleteCustomEvent,
  eventArchiveStore,
  exportEventDatabasePayload,
  formatIntervalToAgeToken,
  importEventDatabasePayload,
  mergeAgeIntervals,
  resetEventDatabase,
  saveEventEntry,
  toggleEventAttended,
} from './eventArchiveModel';
import { COMMUNITY_DAY_EVENTS } from './communityDayModel';

describe('eventArchiveModel date & interval calculations', () => {
  afterEach(() => {
    resetEventDatabase();
  });

  test('computes exact, evening-safe, plus-minus-1, PRESENT, and upcoming age ranges without external polyfills', () => {
    const exact = calculateAgeSearchString('2026-06-06', '2026-06-07', '2026-06-10', {
      bufferMode: 'exact',
      untaggedOnly: true,
      excludeRemote: true,
      extraTokens: ['locationbackground'],
    });
    expect(exact.ageToken).toBe('age3-4');
    expect(exact.minAge).toBe(3);
    expect(exact.maxAge).toBe(4);
    expect(exact.isUpcoming).toBe(false);
    expect(exact.fullSearchString).toBe('!#&age3-4&locationbackground&!remoteraid');

    const eveningSafe = calculateAgeSearchString('2026-06-06', '2026-06-07', '2026-06-10', {
      bufferMode: 'evening-safe',
    });
    expect(eveningSafe.ageToken).toBe('age2-4');

    const plusMinus = calculateAgeSearchString('2026-06-06', '2026-06-07', '2026-06-10', {
      bufferMode: 'plus-minus-1',
    });
    expect(plusMinus.ageToken).toBe('age2-5');

    const ongoing = calculateAgeSearchString('2026-06-01', 'PRESENT', '2026-06-05', {
      bufferMode: 'exact',
    });
    expect(ongoing.ageToken).toBe('age0-4');

    const upcoming = calculateAgeSearchString('2026-12-20', '2026-12-21', '2026-06-10', {
      bufferMode: 'exact',
    });
    expect(upcoming.isUpcoming).toBe(true);
    expect(upcoming.ageToken).toBe('age0');
  });

  test('mergeAgeIntervals merges touching/overlapping intervals cleanly', () => {
    const merged = mergeAgeIntervals([
      { minAge: 10, maxAge: 12 },
      { minAge: 13, maxAge: 15 },
      { minAge: 2, maxAge: 4 },
      { minAge: 3, maxAge: 6 },
    ]);
    expect(merged).toEqual([
      { minAge: 2, maxAge: 6 },
      { minAge: 10, maxAge: 15 },
    ]);
    expect(merged.map(formatIntervalToAgeToken)).toEqual(['age2-6', 'age10-15']);
  });

  test('builds event action strings & year slicer plan for 2026', () => {
    const sampleEv = BUNDLED_EVENTS_ARCHIVE[0];
    const actions = buildEventActionStrings(sampleEv, '2026-11-22', {
      untaggedOnly: true,
      bufferMode: 'exact',
    });
    expect(actions.raidAndMegaString).toContain(actions.ageCalc.ageToken);
    expect(actions.eventLeftoverTrashString).toContain('!#');

    const seededEvents = BUNDLED_EVENTS_ARCHIVE.map((ev) => ({
      ...ev,
      attended: Boolean(ev.attendedDefault),
    }));
    const plan = computeYearSlicerPlan({
      year: 2026,
      storedEvents: seededEvents,
      communityDays: COMMUNITY_DAY_EVENTS,
      trips: TRAVEL_TRIPS,
      refDateStr: '2026-11-22',
    });
    expect(plan.year).toBe(2026);
    expect(plan.monthlySlices).toHaveLength(12);
    expect(plan.strings.everydayNonEventTrash0to2).toContain('year2026');
  });

  test('handles eventArchiveStore CRUD, import/export, and reset', () => {
    const created = saveEventEntry({
      id: 'custom-safari-test',
      name: 'Safari Test',
      tag: 'SafariTest',
      start: '2026-07-10',
      end: '2026-07-12',
      scope: 'in-person',
      series: 'City & Special',
      backgroundType: 'locationbackground',
      location: 'Seattle',
      raidMegaIdsText: '150, 384',
      regionalRareIdsText: '201, 479',
      attended: true,
      hasMighty: false,
    });
    expect(created.dexIds).toEqual([150, 384, 201, 479]);
    expect(eventArchiveStore.getSnapshot().customEvents.some((c) => c.id === 'custom-safari-test')).toBe(
      true
    );

    toggleEventAttended('custom-safari-test');
    expect(eventArchiveStore.getSnapshot().attendedById['custom-safari-test']).toBe(false);

    const exported = exportEventDatabasePayload({
      events: [created],
      ...eventArchiveStore.getSnapshot(),
    });
    expect(exported.customEvents).toHaveLength(1);

    deleteCustomEvent('custom-safari-test');
    expect(eventArchiveStore.getSnapshot().customEvents).toHaveLength(0);

    const restored = importEventDatabasePayload(exported);
    expect(restored.ok).toBe(true);
    expect(restored.snapshot.customEvents).toHaveLength(1);

    // Malformed / corrupt JSON imports are cleanly rejected without throwing
    expect(importEventDatabasePayload(null).ok).toBe(false);
    expect(importEventDatabasePayload([]).ok).toBe(false);
    expect(importEventDatabasePayload({ unrelated: true }).ok).toBe(false);
    expect(importEventDatabasePayload({ customEvents: [{ bad: true }] }).ok).toBe(false);

    resetEventDatabase();
    expect(eventArchiveStore.getSnapshot().customEvents).toEqual([]);
  });

  test('protects cross-month trips, excludes ongoing PRESENT venues from wiping out Year Slicer, and shields backgroundSurplusString', () => {
    const seededEvents = BUNDLED_EVENTS_ARCHIVE.map((ev) => ({
      ...ev,
      attended: true,
    }));

    // Cross-month trip: Japan Vacation 2026 runs 2026-06-17 -> 2026-07-01
    const plan = computeYearSlicerPlan({
      year: 2026,
      storedEvents: seededEvents,
      communityDays: COMMUNITY_DAY_EVENTS,
      trips: TRAVEL_TRIPS,
      includeTrips: true,
      refDateStr: '2026-11-22',
    });
    const julySlice = plan.monthlySlices.find((m) => m.monthNum === 7);
    expect(julySlice.tripsInMonth.some((t) => t.tag === 'Japan 26')).toBe(true);

    // Ongoing PRESENT event (e.g. pokepark-kanto-2026) must NOT blanket-exclude months into non-event trash
    const augustSlice = plan.monthlySlices.find((m) => m.monthNum === 8);
    expect(augustSlice.monthEverydayTrashString).not.toContain('!age0-');

    // Global specialbackground surplus trash must shield mythical, shadow, maxmove1-, fusion, adventureeffect, @special, costume, xxl, xxs, eggsonly, distance100-
    const globalBgEv = BUNDLED_EVENTS_ARCHIVE.find((ev) => ev.backgroundType === 'specialbackground');
    const actions = buildEventActionStrings(globalBgEv, '2026-11-22');
    for (const shield of [
      '!mythical',
      '!shadow',
      '!maxmove1-',
      '!fusion',
      '!adventureeffect',
      '!@special',
      '!costume',
      '!xxl',
      '!xxs',
      '!eggsonly',
      '!distance100-',
      '!buddy1-',
      '!candyxl',
    ]) {
      expect(actions.backgroundSurplusString).toContain(shield);
      expect(plan.strings.globalBgPurgeCombined).toContain(shield);
    }
  });
});
