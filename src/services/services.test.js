import { describe, expect, test, vi } from 'vitest';
import pokedex from '../data/pokedex.json';
import { MAX_IMPORT_FILE_BYTES, readJsonFile } from './fileTransferService';
import { fetchLivePvPokeMeta } from './metaNetworkService';
import { QR_TOO_LONG_ERROR, generateOfflineQrDataUrl } from './qrCodeService';

describe('services boundary unit tests', () => {
  test('readJsonFile enforces 5 MB safety limit and parses valid JSON blobs', async () => {
    await expect(readJsonFile(null)).rejects.toThrow(/No file selected/);
    await expect(
      readJsonFile({ size: MAX_IMPORT_FILE_BYTES + 1, text: async () => '{}' })
    ).rejects.toThrow(/5 MB/);

    const parsed = await readJsonFile({
      size: 20,
      text: async () => JSON.stringify({ hello: 'pogo' }),
    });
    expect(parsed).toEqual({ hello: 'pogo' });
  });

  test('fetchLivePvPokeMeta fetches all leagues in parallel and stays pure (no store mutation)', async () => {
    const requestedUrls = [];
    const mockFetch = vi.fn(async (url) => {
      requestedUrls.push(url);
      if (url.includes('gamemaster')) {
        return {
          ok: true,
          status: 200,
          json: async () => [{ speciesId: 'clodsire', dex: 980, defaultIVs: { cp1500: [30, 0, 14, 13] } }],
        };
      }
      return {
        ok: true,
        status: 200,
        json: async () => [
          { speciesId: 'clodsire', speciesName: 'Clodsire', score: 95, moveset: ['POISON_STING', 'EARTHQUAKE'] },
        ],
      };
    });

    const result = await fetchLivePvPokeMeta(pokedex, { fetchImpl: mockFetch, timeoutMs: 2000 });
    expect(requestedUrls).toHaveLength(4);
    expect(result.isLiveSynced).toBe(true);
    expect(result.pvp.great_league.entries[0].dexId).toBe(980);
  });

  test('generateOfflineQrDataUrl lazily generates PNG data URLs and handles empty/oversized strings', async () => {
    const empty = await generateOfflineQrDataUrl('');
    expect(empty.ok).toBe(false);

    const valid = await generateOfflineQrDataUrl('4*&shiny&!#');
    expect(valid.ok).toBe(true);
    expect(valid.dataUrl.startsWith('data:image/png;base64,')).toBe(true);

    const tooLong = await generateOfflineQrDataUrl('a'.repeat(5000));
    expect(tooLong.ok).toBe(false);
    expect(tooLong.error).toBe(QR_TOO_LONG_ERROR);
  });
});
