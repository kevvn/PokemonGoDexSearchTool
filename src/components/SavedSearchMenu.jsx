import React, { useState, useEffect, useMemo, useRef } from 'react';

function SavedSearchMenu({ currentSearch, onSelect, onClose }) {
  const [savedSearches, setSavedSearches] = useState(() => {
    try {
      const saved = localStorage.getItem('pokedex_saved_searches');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Failed to load saved searches:', e);
      return [];
    }
  });
  const [newLabel, setNewLabel] = useState('');
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    // Also handle touch start for mobile
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [onClose]);

  useEffect(() => {
    try {
      localStorage.setItem('pokedex_saved_searches', JSON.stringify(savedSearches));
    } catch (e) {
      console.error('Failed to save searches:', e);
    }
  }, [savedSearches]);

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

  const handleDelete = (id, e) => {
    e.stopPropagation();
    setSavedSearches(prev => prev.filter(s => s.id !== id));
  };

  const renderedList = useMemo(() => (
    <div className="max-h-60 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
      {savedSearches.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
           <div className="text-2xl mb-2">📭</div>
           <p className="text-sm">No saved searches yet.</p>
           <p className="text-xs text-gray-300 mt-1">Save your current filter to find it here later.</p>
        </div>
      ) : (
        savedSearches.map(search => (
          <div
            key={search.id}
            onClick={() => onSelect(search.value)}
            className="group flex items-center justify-between p-3 bg-gray-50 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-blue-100 touch-manipulation"
          >
            <div className="flex-1 min-w-0 mr-3">
              <div className="font-semibold text-sm text-gray-800 truncate" title={search.label}>{search.label}</div>
              <div className="text-xs text-gray-500 truncate font-mono mt-0.5" title={search.value}>{search.value}</div>
            </div>
            <button
              onClick={(e) => handleDelete(search.id, e)}
              className="text-gray-300 hover:text-red-500 p-2 rounded-md hover:bg-red-50 transition-all sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 opacity-100"
              title="Delete"
              aria-label="Delete saved search"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 sm:w-4 sm:h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
              </svg>
            </button>
          </div>
        ))
      )}
    </div>
  ), [savedSearches, onSelect]);

  return (
    <>
        {/* Backdrop for mobile */}
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm sm:hidden z-40" onClick={onClose} aria-hidden="true" />

        <div
           ref={menuRef}
           className="fixed bottom-[72px] left-0 right-0 mx-2 sm:mx-0 sm:absolute sm:bottom-full sm:right-0 sm:left-auto sm:mb-3 sm:w-96 bg-white rounded-t-xl sm:rounded-xl shadow-2xl border border-gray-100 p-5 z-50 transform origin-bottom transition-all animate-fade-in-up sm:origin-bottom-right"
        >
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-100">
            <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
               <span className="text-xl">⭐️</span> Saved Searches
            </h3>
            <button
               onClick={onClose}
               className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
               aria-label="Close menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
               <input
                 type="text"
                 value={newLabel}
                 onChange={(e) => setNewLabel(e.target.value)}
                 placeholder="Label (e.g. 'My Team')"
                 className="w-full pl-3 pr-3 py-3 sm:py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
                 onKeyDown={(e) => e.key === 'Enter' && handleSave()}
               />
            </div>
            <button
              onClick={handleSave}
              disabled={!newLabel.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm active:scale-95 transform whitespace-nowrap"
            >
              Save
            </button>
          </div>

          {renderedList}

          <style>{`
            .custom-scrollbar::-webkit-scrollbar {
              width: 6px;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
              background: #f1f1f1;
              border-radius: 4px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
              background: #d1d5db;
              border-radius: 4px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
              background: #9ca3af;
            }
            @keyframes fadeInUp {
                from { opacity: 0; transform: translateY(10px) scale(0.95); }
                to { opacity: 1; transform: translateY(0) scale(1); }
            }
            .animate-fade-in-up {
                animation: fadeInUp 0.2s ease-out forwards;
            }
          `}</style>
        </div>
    </>
  );
}

export default React.memo(SavedSearchMenu);
