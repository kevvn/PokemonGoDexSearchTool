import {
  PVPOKE_ENDPOINTS,
  PVPOKE_GAMEMASTER_ENDPOINT,
  mergeSyncedPvPokeCache,
} from '../models/metaCacheModel';

async function fetchJsonWithTimeout(url, { fetchImpl, timeoutMs, externalSignal, label }) {
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  let timeoutId = null;

  const onExternalAbort = () => controller?.abort();
  if (externalSignal) {
    if (externalSignal.aborted) {
      throw new DOMException('Request aborted', 'AbortError');
    }
    externalSignal.addEventListener('abort', onExternalAbort, { once: true });
  }

  if (controller && timeoutMs > 0) {
    timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  }

  try {
    const response = await fetchImpl(url, {
      cache: 'no-cache',
      signal: controller?.signal,
    });
    if (!response.ok) {
      throw new Error(`PvPoke HTTP ${response.status} for ${label}`);
    }
    return await response.json();
  } finally {
    if (timeoutId !== null) clearTimeout(timeoutId);
    if (externalSignal) externalSignal.removeEventListener('abort', onExternalAbort);
  }
}

/**
 * Pure network service: fetches all 3 PvPoke league rankings (and best-effort gamemaster
 * metadata for exact Dex IDs + defaultIVs) in parallel and returns the merged cache payload.
 * Store mutation is delegated to the controller so services remain stateless and testable.
 */
export async function fetchLivePvPokeMeta(
  pokedex,
  { fetchImpl = fetch, timeoutMs = 10000, signal = null, includeGamemaster = true } = {}
) {
  const leagueEntries = Object.entries(PVPOKE_ENDPOINTS);

  const leaguePromises = leagueEntries.map(async ([leagueKey, url]) => {
    const data = await fetchJsonWithTimeout(url, {
      fetchImpl,
      timeoutMs,
      externalSignal: signal,
      label: leagueKey,
    });
    return [leagueKey, data];
  });

  const gamemasterPromise = includeGamemaster
    ? fetchJsonWithTimeout(PVPOKE_GAMEMASTER_ENDPOINT, {
        fetchImpl,
        timeoutMs,
        externalSignal: signal,
        label: 'gamemaster',
      }).catch(() => null)
    : Promise.resolve(null);

  const [resolvedLeagues, gamemasterPokemon] = await Promise.all([
    Promise.all(leaguePromises),
    gamemasterPromise,
  ]);

  const leaguePayloads = Object.fromEntries(resolvedLeagues);
  return mergeSyncedPvPokeCache(leaguePayloads, pokedex, gamemasterPokemon);
}
