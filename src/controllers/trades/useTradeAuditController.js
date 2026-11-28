import { useCallback, useMemo, useState } from 'react';
import {
  DEFAULT_DUPLICATE_CAP,
  buildTradeHoardAudit,
  getDefaultStaleMaxYear,
  getStaleYearOptions,
  getTradeTierSpecies,
} from '../../models/trades/tradeValueModel';

export function useTradeAuditController({ tagMap, metaSnapshot }) {
  const staleYearOptions = useMemo(() => getStaleYearOptions(), []);
  const defaultStaleYear = useMemo(() => getDefaultStaleMaxYear(), []);

  const [duplicateCap, setDuplicateCap] = useState(DEFAULT_DUPLICATE_CAP);
  const [staleMaxYear, setStaleMaxYear] = useState(defaultStaleYear);

  // Precompute tiers once per metaSnapshot so toggling duplicateCap/staleMaxYear
  // preserves stable `speciesIds` array references for React.memo SearchRecipeCards.
  const tiers = useMemo(() => getTradeTierSpecies(metaSnapshot), [metaSnapshot]);

  const audit = useMemo(
    () =>
      buildTradeHoardAudit({
        tagMap,
        metaSnapshot,
        precomputedTiers: tiers,
        duplicateCap,
        staleMaxYear,
      }),
    [tagMap, metaSnapshot, tiers, duplicateCap, staleMaxYear]
  );

  const selectDuplicateCap = useCallback((cap) => {
    setDuplicateCap(Number(cap) || DEFAULT_DUPLICATE_CAP);
  }, []);

  const selectStaleMaxYear = useCallback(
    (year) => {
      setStaleMaxYear(Number(year) || defaultStaleYear);
    },
    [defaultStaleYear]
  );

  return useMemo(
    () => ({
      duplicateCap,
      selectDuplicateCap,
      staleMaxYear,
      staleYearOptions,
      selectStaleMaxYear,
      audit,
    }),
    [duplicateCap, selectDuplicateCap, staleMaxYear, staleYearOptions, selectStaleMaxYear, audit]
  );
}
