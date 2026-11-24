import { useCallback, useMemo, useState, useSyncExternalStore } from 'react';
import { COMMUNITY_DAY_EVENTS } from '../../models/communityDayModel';
import {
  addTravelTrip,
  buildEventDatabaseSnapshot,
  calculateAgeSearchString,
  clearTravelTrips,
  computeYearSlicerPlan,
  deleteTravelTrip,
  eventArchiveStore,
  getAvailableEventYears,
  getTodayPlainDateString,
  restoreSampleTravelTrips,
  travelTripsStore,
} from '../../models/eventArchiveModel';

export function useYearSlicerController({ referenceDate, bufferMode, untaggedOnly }) {
  const rawEventState = useSyncExternalStore(
    eventArchiveStore.subscribe,
    eventArchiveStore.getSnapshot,
    eventArchiveStore.getServerSnapshot
  );
  const travelTrips = useSyncExternalStore(
    travelTripsStore.subscribe,
    travelTripsStore.getSnapshot,
    travelTripsStore.getServerSnapshot
  );

  const eventDb = useMemo(() => buildEventDatabaseSnapshot(rawEventState), [rawEventState]);

  const [slicerYear, setSlicerYear] = useState(
    () => Number(getTodayPlainDateString().slice(0, 4)) || new Date().getFullYear()
  );
  // Default false so personal trips are opt-in and never silently alter another player's trash queries
  const [includeTripsInSlicer, setIncludeTripsInSlicer] = useState(false);
  const [includeCdsInSlicer, setIncludeCdsInSlicer] = useState(true);

  const [tripDraft, setTripDraft] = useState({
    event_name: '',
    tag: '',
    start: getTodayPlainDateString(),
    end: getTodayPlainDateString(),
    location: '',
  });
  const [tripError, setTripError] = useState('');

  const availableSlicerYears = useMemo(
    () =>
      getAvailableEventYears({
        events: eventDb.events,
        communityDays: COMMUNITY_DAY_EVENTS,
        trips: travelTrips,
      }).slice(0, 6),
    [eventDb.events, travelTrips]
  );

  const yearSlicerPlan = useMemo(
    () =>
      computeYearSlicerPlan({
        year: slicerYear,
        storedEvents: eventDb.events,
        communityDays: COMMUNITY_DAY_EVENTS,
        trips: travelTrips,
        includeTrips: includeTripsInSlicer,
        includeCommunityDays: includeCdsInSlicer,
        refDateStr: referenceDate,
        bufferMode,
        untaggedOnly,
      }),
    [
      slicerYear,
      eventDb.events,
      travelTrips,
      includeTripsInSlicer,
      includeCdsInSlicer,
      referenceDate,
      bufferMode,
      untaggedOnly,
    ]
  );

  const tripsWithAge = useMemo(
    () =>
      travelTrips.map((tr) => ({
        trip: tr,
        calc: calculateAgeSearchString(tr.start, tr.end, referenceDate, {
          bufferMode,
          untaggedOnly,
          excludeRemote: true,
        }),
      })),
    [travelTrips, referenceDate, bufferMode, untaggedOnly]
  );

  const handleAddTrip = useCallback(
    (e) => {
      e.preventDefault();
      const res = addTravelTrip(tripDraft);
      if (!res.ok) {
        setTripError(res.error);
        return;
      }
      setTripError('');
      setTripDraft((prev) => ({ ...prev, event_name: '', tag: '', location: '' }));
    },
    [tripDraft]
  );

  return useMemo(
    () => ({
      slicerYear,
      setSlicerYear,
      availableSlicerYears,
      includeTripsInSlicer,
      setIncludeTripsInSlicer,
      includeCdsInSlicer,
      setIncludeCdsInSlicer,
      yearSlicerPlan,
      travelTrips,
      tripsWithAge,
      tripDraft,
      setTripDraft,
      tripError,
      handleAddTrip,
      handleDeleteTrip: deleteTravelTrip,
      handleClearTrips: clearTravelTrips,
      handleRestoreSampleTrips: restoreSampleTravelTrips,
    }),
    [
      slicerYear,
      availableSlicerYears,
      includeTripsInSlicer,
      includeCdsInSlicer,
      yearSlicerPlan,
      travelTrips,
      tripsWithAge,
      tripDraft,
      tripError,
      handleAddTrip,
    ]
  );
}
