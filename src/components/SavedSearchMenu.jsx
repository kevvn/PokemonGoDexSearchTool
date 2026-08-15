import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';

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
      value: currentSearch
    };
    setSavedSearches(prev => [newSearch, ...prev]);
    setNewLabel('');
  };

  const handleDelete = useCallback((id, e) => {
    e.stopPropagation();
    setSavedSearches(prev => prev.filter(s => s.id !== id));
  }, [setSavedSearches]);

  const renderedList = useMemo(() => (
    <div className="max-h-60 overflow-y-auto space-y-2 pr-1 no-scrollbar">
      {savedSearches.length === 0 ? (
        <div className="text-center py-8 text-slate-500">
          <div className="text-4xl mb-2 select-none animate-float">📭</div>
          <p className="text-xs font-black uppercase tracking-wider text-slate-700">No saved searches yet</p>
          <p className="text-[10px] text-slate-500 mt-1 max-w-[200px] mx-auto leading-relaxed font-medium">
            Save your active filters and selections to find them here later.
          </p>
        </div>
      ) : (
        savedSearches.map(search => (
          <div
            key={search.id}
            onClick={() => onSelect(search.value)}
            className="group flex items-center justify-between p-3 bg-slate-50 hover:bg-teal-50 rounded-2xl cursor-pointer transition-all duration-150 border border-slate-200 hover:border-teal-300 active:scale-[0.98] shadow-xs"
          >
            <div className="flex-1 min-w-0 mr-3">
              <div className="font-black text-xs text-slate-800 truncate group-hover:text-teal-700 transition-colors uppercase tracking-tight" title={search.label}>
                {search.label}
              </div>
              <div className="text-[10px] text-teal-700 truncate font-mono mt-0.5 font-bold" title={search.value}>
                {search.value}
              </div>
            </div>
            <button
              onClick={(e) => handleDelete(search.id, e)}
              className="text-slate-400 hover:text-rose-600 p-1.5 rounded-full hover:bg-rose-50 transition-colors cursor-pointer"
              title="Delete Saved Search"
              aria-label="Delete saved search"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
              </svg>
            </button>
          </div>
        ))
      )}
    </div>
  ), [savedSearches, onSelect, handleDelete]);

  return (
    <>
      {/* Mobile Backdrop */}
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm sm:hidden z-40" onClick={onClose} aria-hidden="true" />

      {/* Modal container */}
      <div
        ref={menuRef}
        className="fixed bottom-[88px] left-0 right-0 mx-4 sm:mx-0 sm:absolute sm:bottom-full sm:right-0 sm:left-auto sm:mb-4 sm:w-96 bg-white border-2 border-teal-200 rounded-3xl p-5 z-50 shadow-2xl animate-float backdrop-blur-xl text-slate-800"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-teal-100">
          <h3 className="font-black text-slate-900 text-sm flex items-center gap-2 uppercase tracking-wider">
            <span className="text-amber-500">⭐️</span> Saved Searches
          </h3>
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="pogo-close-btn w-7 h-7 rounded-full flex items-center justify-center text-white font-black text-xs cursor-pointer shadow-md"
          >
            ✕
          </button>
        </div>

        {/* New Saved Input Form */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="Label (e.g. 'PVP Great League')"
            className="flex-1 px-4 py-2 bg-slate-50 border border-teal-200 rounded-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-teal-500 font-bold"
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          />
          <button
            onClick={handleSave}
            disabled={!newLabel.trim()}
            className="px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-full text-xs font-black uppercase tracking-wider hover:from-teal-400 hover:to-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer select-none shadow-sm"
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
