import { afterEach, describe, expect, test } from 'vitest';
import {
  SAVED_SEARCHES_VERSION,
  addSavedSearch,
  createSavedSearchesExportPayload,
  deleteSavedSearch,
  importSavedSearchesPayload,
  migrateSavedSearches,
  savedSearchStore,
} from './savedSearchModel';

describe('savedSearchModel', () => {
  afterEach(() => {
    savedSearchStore.reset();
  });

  test('generates unique IDs even on rapid consecutive saves and deletes cleanly', () => {
    const a = addSavedSearch('CD Trash', 'age0&!#&0*,1*,2*');
    const b = addSavedSearch('PvP Check', '0-1attack&3-4defense&3-4hp');
    expect(a.id).not.toBe(b.id);
    expect(savedSearchStore.getSnapshot()).toHaveLength(2);

    deleteSavedSearch(a.id);
    expect(savedSearchStore.getSnapshot().map((s) => s.id)).toEqual([b.id]);
  });

  test('deduplicates both against existing searches and within imported backup files', () => {
    addSavedSearch('Existing', '4*');

    const res = importSavedSearchesPayload({
      schemaVersion: SAVED_SEARCHES_VERSION,
      searches: [
        { id: 'dup-1', name: 'Existing', query: '4*' },
        { id: 'dup-2', name: 'New One', query: 'shiny&background' },
        { id: 'dup-2', name: 'new one', query: 'shiny&background' },
        { id: 'dup-2', name: 'Third One', query: 'maxmove1-' },
      ],
    });

    expect(res.ok).toBe(true);
    expect(res.count).toBe(2);
    expect(res.skipped).toBe(2);
    const ids = savedSearchStore.getSnapshot().map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('rejects invalid import formats and migrates legacy label/value shape', () => {
    expect(importSavedSearchesPayload({ invalid: true }).ok).toBe(false);
    expect(importSavedSearchesPayload([]).ok).toBe(false);

    const migrated = migrateSavedSearches([{ label: 'Legacy Label', value: '3*,4*' }, null, { name: '' }]);
    expect(migrated).toHaveLength(1);
    expect(migrated[0].name).toBe('Legacy Label');
    expect(migrated[0].query).toBe('3*,4*');

    const exported = createSavedSearchesExportPayload(migrated);
    expect(exported.schemaVersion).toBe(SAVED_SEARCHES_VERSION);
    expect(exported.searches).toHaveLength(1);
  });
});
