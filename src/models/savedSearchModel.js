import { createPersistentStore } from './storage/createPersistentStore';

export const SAVED_SEARCHES_VERSION = 2;

let idCounter = 0;

function generateSavedSearchId() {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  idCounter += 1;
  return `ss-${Date.now()}-${idCounter}-${Math.random().toString(36).slice(2, 8)}`;
}

export function normalizeSavedSearchEntry(item) {
  if (!item || typeof item !== 'object') return null;
  const name =
    typeof item.name === 'string'
      ? item.name.trim()
      : typeof item.label === 'string'
        ? item.label.trim()
        : '';
  const query =
    typeof item.query === 'string'
      ? item.query
      : typeof item.value === 'string'
        ? item.value
        : '';
  if (!name) return null;
  const hasValidId =
    (typeof item.id === 'string' && item.id.trim().length > 0) ||
    (typeof item.id === 'number' && Number.isFinite(item.id));
  return {
    id: hasValidId ? item.id : generateSavedSearchId(),
    name,
    query,
    createdAt: typeof item.createdAt === 'string' && item.createdAt ? item.createdAt : new Date().toISOString(),
  };
}

export function migrateSavedSearches(raw) {
  if (!Array.isArray(raw)) return [];
  const seenIds = new Set();
  const normalized = [];
  for (const entry of raw) {
    const item = normalizeSavedSearchEntry(entry);
    if (!item) continue;
    const idKey = String(item.id);
    if (seenIds.has(idKey)) {
      item.id = generateSavedSearchId();
    }
    seenIds.add(String(item.id));
    normalized.push(item);
  }
  return normalized;
}

export const savedSearchStore = createPersistentStore({
  key: 'pokedex_saved_searches',
  schemaVersion: SAVED_SEARCHES_VERSION,
  getDefaultValue: () => [],
  deserialize: (raw) => migrateSavedSearches(JSON.parse(raw)),
  migrate: (oldData) => migrateSavedSearches(oldData),
});

export function addSavedSearch(name, query) {
  const trimmed = String(name || '').trim();
  if (!trimmed) return null;
  const entry = {
    id: generateSavedSearchId(),
    name: trimmed,
    query: query || '',
    createdAt: new Date().toISOString(),
  };
  savedSearchStore.setState((prev) => [entry, ...prev]);
  return entry;
}

export function deleteSavedSearch(id) {
  savedSearchStore.setState((prev) => prev.filter((s) => s.id !== id));
}

export function createSavedSearchesExportPayload(savedSearches) {
  return {
    schemaVersion: SAVED_SEARCHES_VERSION,
    exportedAt: new Date().toISOString(),
    searches: savedSearches,
  };
}

export function importSavedSearchesPayload(parsed) {
  const list = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed?.searches)
      ? parsed.searches
      : null;

  if (!list) {
    return { ok: false, error: 'Invalid JSON backup format.' };
  }

  const imported = migrateSavedSearches(list);
  if (imported.length === 0) {
    return { ok: false, error: 'No valid searches found in file.' };
  }

  let addedCount = 0;

  savedSearchStore.setState((prev) => {
    const existingKeys = new Set(prev.map((s) => `${s.name.toLowerCase()}::${s.query}`));
    const existingIds = new Set(prev.map((s) => String(s.id)));
    const additions = [];

    for (const s of imported) {
      const dedupeKey = `${s.name.toLowerCase()}::${s.query}`;
      if (existingKeys.has(dedupeKey)) continue;
      existingKeys.add(dedupeKey);

      const safeEntry = existingIds.has(String(s.id))
        ? { ...s, id: generateSavedSearchId() }
        : s;
      existingIds.add(String(safeEntry.id));
      additions.push(safeEntry);
    }

    addedCount = additions.length;
    return additions.length > 0 ? [...additions, ...prev] : prev;
  });

  return {
    ok: true,
    count: addedCount,
    skipped: imported.length - addedCount,
  };
}
