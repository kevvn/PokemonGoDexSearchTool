import { useMemo } from 'react';
import { buildRemoteTradeShowcaseQueries } from '../../models/trades/tradeValueModel';

export function useRemoteTradeController({ tagMap, metaSnapshot }) {
  const queries = useMemo(
    () => buildRemoteTradeShowcaseQueries({ tagMap, metaSnapshot }),
    [tagMap, metaSnapshot]
  );

  return useMemo(() => ({ queries }), [queries]);
}
