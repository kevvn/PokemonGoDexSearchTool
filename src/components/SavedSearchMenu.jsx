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
           <div className="text-3xl mb-2 select-none">📭</div>
           <p className="text-xs font-bold">No saved searches yet</p>
           <p className="text-[10px] text-slate-600 mt-1 max-w-[200px] mx-auto leading-relaxed">
             Save your active filters and selections to find them here later.
           </p>
        </div>
      ) : (
        savedSearches.map(search => (
          <div
            key={search.id}
            onClick={() => onSelect(search.value)}
            className="group flex items-center justify-between p-3 bg-slate-950/40 hover:bg-blue-500/5 rounded-xl cursor-pointer transition-all duration-200 border border-slate-850 hover:border-blue-500/20 active:scale-[0.98]"
          >
            <div className="flex-1 min-w-0 mr-3">
              <div className="font-extrabold text-xs text-slate-200 truncate group-hover:text-blue-400 transition-colors" title={search.label}>
                {search.label}
              </div>
              <div className="text-[10px] text-slate-500 truncate font-mono mt-0.5" title={search.value}>
                {search.value}
              </div>
            </div>
            <button
              onClick={(e) => handleDelete(search.id, e)}
              className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
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
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm sm:hidden z-40" onClick={onClose} aria-hidden="true" />

        {/* Modal container */}
        <div
           ref={menuRef}
           className="fixed bottom-[88px] left-0 right-0 mx-4 sm:mx-0 sm:absolute sm:bottom-full sm:right-0 sm:left-auto sm:mb-4 sm:w-96 bg-slate-900 border border-slate-800 rounded-2xl p-5 z-50 shadow-2xl animate-float"
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-800/80">
            <h3 className="font-extrabold text-slate-100 text-sm flex items-center gap-2 uppercase tracking-wide">
               <span className="text-md">⭐️</span> Saved Searches
            </h3>
            <button
               onClick={onClose}
               className="text-slate-500 hover:text-slate-200 w-7 h-7 flex items-center justify-center bg-slate-950/60 rounded-full border border-slate-800 transition-colors cursor-pointer"
               aria-label="Close menu"
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
              placeholder="Label (e.g. 'My CDay Team')"
              className="flex-1 px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 font-bold"
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
            <button
              onClick={handleSave}
              disabled={!newLabel.trim()}
              className="px-4 py-2 bg-blue-600 text-slate-950 rounded-xl text-xs font-extrabold hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer select-none"
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
