import React, { useState, useEffect } from 'react';

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

  useEffect(() => {
    localStorage.setItem('pokedex_saved_searches', JSON.stringify(savedSearches));
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

  return (
    <div className="absolute bottom-full mb-2 right-0 w-80 bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-50">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-gray-800">Saved Searches</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
      </div>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          placeholder="Label (e.g. 'My Team')"
          className="flex-1 p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        />
        <button
          onClick={handleSave}
          disabled={!newLabel.trim()}
          className="px-3 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Save
        </button>
      </div>

      <div className="max-h-60 overflow-y-auto space-y-2">
        {savedSearches.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">No saved searches yet.</p>
        ) : (
          savedSearches.map(search => (
            <div
              key={search.id}
              onClick={() => onSelect(search.value)}
              className="group p-2 hover:bg-gray-50 rounded cursor-pointer border border-transparent hover:border-gray-200 transition-all flex justify-between items-center"
            >
              <div className="flex-1 min-w-0 mr-2">
                <div className="font-medium text-sm text-gray-800 truncate" title={search.label}>{search.label}</div>
                <div className="text-xs text-gray-500 truncate font-mono" title={search.value}>{search.value}</div>
              </div>
              <button
                onClick={(e) => handleDelete(search.id, e)}
                className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-all"
                title="Delete"
              >
                🗑️
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default React.memo(SavedSearchMenu);
