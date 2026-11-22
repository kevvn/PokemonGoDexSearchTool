import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { PogoCloseButton } from './ui/PogoDesignSystem';

const SAVED_SEARCHES_VERSION = 2;

function normalizeSavedSearchEntry(item, fallbackIdx = 0) {
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
  return {
    id: item.id ?? Date.now() + fallbackIdx,
    name,
    query,
    createdAt: item.createdAt || new Date().toISOString(),
  };
}

function migrateSavedSearches(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map((entry, i) => normalizeSavedSearchEntry(entry, i)).filter(Boolean);
}

const savedSearchStorageOptions = {
  schemaVersion: SAVED_SEARCHES_VERSION,
  deserialize: (raw) => migrateSavedSearches(JSON.parse(raw)),
  migrate: (oldData) => migrateSavedSearches(oldData),
};

function SavedSearchMenu({ currentSearch, onSelect, onClose }) {
  const [savedSearches, setSavedSearches] = useLocalStorage(
    'pokedex_saved_searches',
    [],
    savedSearchStorageOptions
  );
  const [newName, setNewName] = useState('');
  const [statusMsg, setStatusMsg] = useState(null);
  const menuRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [onClose]);

  const handleSave = () => {
    if (!newName.trim()) return;
    const entry = {
      id: Date.now(),
      name: newName.trim(),
      query: currentSearch || '',
      createdAt: new Date().toISOString(),
    };
    setSavedSearches((prev) => [entry, ...prev]);
    setNewName('');
    setStatusMsg({ type: 'ok', text: `Saved "${entry.name}"` });
  };

  const handleDelete = useCallback(
    (id, e) => {
      e.stopPropagation();
      setSavedSearches((prev) => prev.filter((s) => s.id !== id));
    },
    [setSavedSearches]
  );

  const handleExport = () => {
    const payload = {
      schemaVersion: SAVED_SEARCHES_VERSION,
      exportedAt: new Date().toISOString(),
      searches: savedSearches,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pokesearch-saved-searches.json';
    a.click();
    URL.revokeObjectURL(url);
    setStatusMsg({ type: 'ok', text: `Exported ${savedSearches.length} searches` });
  };

  const handleImportFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || ''));
        const list = Array.isArray(parsed)
          ? parsed
          : Array.isArray(parsed?.searches)
            ? parsed.searches
            : null;
        if (!list) {
          setStatusMsg({ type: 'err', text: 'Invalid JSON backup format.' });
          return;
        }
        const imported = migrateSavedSearches(list);
        if (imported.length === 0) {
          setStatusMsg({ type: 'err', text: 'No valid searches found in file.' });
          return;
        }
        setSavedSearches((prev) => {
          const existingKeys = new Set(
            prev.map((s) => `${s.name.toLowerCase()}::${s.query}`)
          );
          const additions = imported.filter(
            (s) => !existingKeys.has(`${s.name.toLowerCase()}::${s.query}`)
          );
          return [...additions, ...prev];
        });
        setStatusMsg({ type: 'ok', text: `Imported ${imported.length} search(es)` });
      } catch {
        setStatusMsg({ type: 'err', text: 'Failed to parse JSON file.' });
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const renderedList = useMemo(
    () => (
      <div className="max-h-60 overflow-y-auto space-y-2 pr-1 no-scrollbar">
        {savedSearches.length === 0 ? (
          <div className="text-center py-6 text-[#285d72]">
            <div className="text-3xl mb-2 select-none">★</div>
            <p className="font-display text-xs font-extrabold uppercase tracking-wider text-[#123c4d]">
              No saved searches yet
            </p>
            <p className="text-[11px] text-[#285d72] mt-1 max-w-[230px] mx-auto leading-relaxed font-medium">
              Save your favorite Pokédex search strings or import a JSON backup.
            </p>
          </div>
        ) : (
          savedSearches.map((search) => (
            <div
              key={search.id}
              onClick={() => onSelect(search.query)}
              className="group flex items-center justify-between p-3 bg-white/90 hover:bg-white rounded-2xl cursor-pointer transition-all duration-150 border border-white hover:border-[#0d7da8]/50 shadow-2xs"
            >
              <div className="flex-1 min-w-0 mr-3">
                <div
                  className="font-display font-extrabold text-xs text-[#123c4d] truncate group-hover:text-[#0b698e] uppercase tracking-wide"
                  title={search.name}
                >
                  {search.name}
                </div>
                <div
                  className="text-[10px] text-[#0c749c] truncate font-mono mt-0.5 font-bold"
                  title={search.query}
                >
                  {search.query || '(empty query)'}
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => handleDelete(search.id, e)}
                className="compact-inline-chip text-[#396d82] hover:text-rose-600 p-1.5 rounded-full hover:bg-rose-50 transition-colors cursor-pointer"
                title="Delete Saved Search"
                aria-label={`Delete saved search ${search.name}`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-4 h-4"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                  />
                </svg>
              </button>
            </div>
          ))
        )}
      </div>
    ),
    [savedSearches, onSelect, handleDelete]
  );

  return (
    <>
      {/* Mobile Backdrop */}
      <div
        className="fixed inset-0 bg-[#08344a]/45 backdrop-blur-xs sm:hidden z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Frosted Ice-White Popover Card */}
      <div
        ref={menuRef}
        className="fixed bottom-[88px] left-0 right-0 mx-4 sm:mx-0 sm:absolute sm:bottom-full sm:right-0 sm:left-auto sm:mb-3 sm:w-96 pogo-summary-card p-4 sm:p-5 z-50 shadow-2xl text-[#123c4d]"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-3 pb-2.5 border-b border-[#0d7da8]/15">
          <h3 className="font-display font-extrabold text-[#0b698e] text-sm flex items-center gap-2 uppercase tracking-wider">
            <span className="text-amber-500" aria-hidden="true">★</span> Saved Searches
          </h3>
          <PogoCloseButton onClick={onClose} ariaLabel="Close saved searches menu" size="sm" />
        </div>

        {/* New Saved Input Form */}
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Label (e.g. 'CDay Rapid Trash')"
            className="flex-1 px-4 py-2 pogo-search-pill text-xs text-[#123c4d] placeholder-[#396d82]/70 focus:outline-none font-bold"
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          />
          <button
            type="button"
            onClick={handleSave}
            disabled={!newName.trim()}
            className="pogo-pill-active px-4 py-2 text-xs uppercase disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer select-none"
          >
            Save
          </button>
        </div>

        {/* JSON Backup Export / Import Row */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleExport}
              disabled={savedSearches.length === 0}
              className="compact-inline-chip px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-white/90 hover:bg-white text-[#0b698e] border border-[#0d7da8]/25 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-2xs"
            >
              ⬇ Export JSON
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="compact-inline-chip px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-white/90 hover:bg-white text-[#0b698e] border border-[#0d7da8]/25 cursor-pointer shadow-2xs"
            >
              ⬆ Import JSON
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleImportFile}
              className="hidden"
              aria-label="Import saved searches JSON"
            />
          </div>
          {statusMsg && (
            <span
              className={`text-[10px] font-extrabold truncate ${
                statusMsg.type === 'err' ? 'text-rose-700' : 'text-[#2b9e66]'
              }`}
            >
              {statusMsg.text}
            </span>
          )}
        </div>

        {/* Saved Searches List */}
        {renderedList}
      </div>
    </>
  );
}

export default React.memo(SavedSearchMenu);
