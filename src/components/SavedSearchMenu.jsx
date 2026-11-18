import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { PogoCloseButton } from './ui/PogoDesignSystem';

function SavedSearchMenu({ currentSearch, onSelect, onClose }) {
  const [savedSearches, setSavedSearches] = useLocalStorage('pokedex_saved_searches', []);
  const [newLabel, setNewLabel] = useState('');
  const menuRef = useRef(null);

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
    if (!newLabel.trim()) return;
    const newSearch = {
      id: Date.now(),
      label: newLabel.trim(),
      value: currentSearch,
    };
    setSavedSearches((prev) => [newSearch, ...prev]);
    setNewLabel('');
  };

  const handleDelete = useCallback(
    (id, e) => {
      e.stopPropagation();
      setSavedSearches((prev) => prev.filter((s) => s.id !== id));
    },
    [setSavedSearches]
  );

  const renderedList = useMemo(
    () => (
      <div className="max-h-60 overflow-y-auto space-y-2 pr-1 no-scrollbar">
        {savedSearches.length === 0 ? (
          <div className="text-center py-7 text-[#285d72]">
            <div className="text-3xl mb-2 select-none">★</div>
            <p className="font-display text-xs font-extrabold uppercase tracking-wider text-[#123c4d]">
              No saved searches yet
            </p>
            <p className="text-[11px] text-[#285d72] mt-1 max-w-[220px] mx-auto leading-relaxed font-medium">
              Save your favorite Pokédex filters and search strings for one-tap reuse.
            </p>
          </div>
        ) : (
          savedSearches.map((search) => (
            <div
              key={search.id}
              onClick={() => onSelect(search.value)}
              className="group flex items-center justify-between p-3 bg-white/90 hover:bg-white rounded-2xl cursor-pointer transition-all duration-150 border border-white hover:border-[#0d7da8]/50 shadow-2xs"
            >
              <div className="flex-1 min-w-0 mr-3">
                <div
                  className="font-display font-extrabold text-xs text-[#123c4d] truncate group-hover:text-[#0b698e] uppercase tracking-wide"
                  title={search.label}
                >
                  {search.label}
                </div>
                <div
                  className="text-[10px] text-[#0c749c] truncate font-mono mt-0.5 font-bold"
                  title={search.value}
                >
                  {search.value}
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => handleDelete(search.id, e)}
                className="compact-inline-chip text-[#396d82] hover:text-rose-600 p-1.5 rounded-full hover:bg-rose-50 transition-colors cursor-pointer"
                title="Delete Saved Search"
                aria-label={`Delete saved search ${search.label}`}
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
        <div className="flex justify-between items-center mb-3.5 pb-2.5 border-b border-[#0d7da8]/15">
          <h3 className="font-display font-extrabold text-[#0b698e] text-sm flex items-center gap-2 uppercase tracking-wider">
            <span className="text-amber-500" aria-hidden="true">★</span> Saved Searches
          </h3>
          <PogoCloseButton onClick={onClose} ariaLabel="Close saved searches menu" size="sm" />
        </div>

        {/* New Saved Input Form */}
        <div className="flex gap-2 mb-3.5">
          <input
            type="text"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="Label (e.g. 'PvP Great League')"
            className="flex-1 px-4 py-2 pogo-search-pill text-xs text-[#123c4d] placeholder-[#396d82]/70 focus:outline-none font-bold"
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          />
          <button
            type="button"
            onClick={handleSave}
            disabled={!newLabel.trim()}
            className="pogo-pill-active px-4 py-2 text-xs uppercase disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer select-none"
          >
            Save
          </button>
        </div>

        {/* List */}
        {renderedList}
      </div>
    </>
  );
}

export default React.memo(SavedSearchMenu);
