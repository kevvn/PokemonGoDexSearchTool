import React, { useState, useEffect } from 'react';
import SavedSearchMenu from './SavedSearchMenu';

function SearchStringDisplay({ searchString, onSearchUpdate }) {
  const [copied, setCopied] = useState(false);
  const [inputValue, setInputValue] = useState(searchString);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Sync input value when searchString prop changes (e.g. from clicking grid)
  useEffect(() => {
    setInputValue(searchString);
  }, [searchString]);

  const handleCopy = () => {
    navigator.clipboard.writeText(searchString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      onSearchUpdate(inputValue);
      e.currentTarget.blur();
    }
  };

  const handleBlur = () => {
    // Only update if value changed to avoid unnecessary re-renders/logic
    if (inputValue !== searchString) {
      onSearchUpdate(inputValue);
    }
  };

  const handleChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleSelect = (val) => {
    onSearchUpdate(val);
    setInputValue(val);
    setIsMenuOpen(false);
  };

  return (
    <div className="bg-white border-t border-gray-200 p-4 sticky bottom-0 z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
      <div className="max-w-7xl mx-auto flex items-center gap-4">
        <input
          type="text"
          value={inputValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder="Select Pokemon or type search string (e.g. 'fire&legendary' or '1-151')"
          className="flex-1 p-3 border border-gray-300 rounded-lg bg-gray-50 text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />

        <div className="relative">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`px-4 py-3 rounded-lg font-medium transition-all flex items-center gap-2 border ${
              isMenuOpen
                ? 'bg-gray-100 border-gray-300 text-gray-800 shadow-inner'
                : 'bg-white border-gray-300 hover:bg-gray-50 text-gray-700 shadow-sm'
            }`}
            title="Saved Searches"
          >
            <span>⭐️</span>
            <span className="hidden sm:inline">Saved</span>
          </button>
          {isMenuOpen && (
            <SavedSearchMenu
              currentSearch={inputValue}
              onSelect={handleSelect}
              onClose={() => setIsMenuOpen(false)}
            />
          )}
        </div>

        <button
          onClick={handleCopy}
          className={`px-6 py-3 rounded-lg font-medium transition-all ${
            copied
              ? 'bg-green-500 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
    </div>
  );
}

export default React.memo(SearchStringDisplay);
