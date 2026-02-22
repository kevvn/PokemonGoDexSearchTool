import React, { useState, useEffect, useCallback, useRef } from 'react';
import SavedSearchMenu from './SavedSearchMenu';

function SearchStringDisplay({ searchString, onSearchUpdate }) {
  const [copied, setCopied] = useState(false);
  const [inputValue, setInputValue] = useState(searchString);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  const prevSearchString = useRef(searchString);

  // Sync input value when searchString prop changes (e.g. from clicking grid)
  useEffect(() => {
    // Only update if prop actually changed to avoid overwriting user input when typing stops (isTyping -> false)
    if (prevSearchString.current !== searchString) {
      prevSearchString.current = searchString;
      // If user is actively typing, don't overwrite their input with prop updates
      if (!isTyping) {
        setInputValue(searchString);
      }
    }
  }, [searchString, isTyping]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(searchString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [searchString]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      onSearchUpdate(inputValue);
      e.currentTarget.blur();
      setIsTyping(false);
    }
  };

  const handleBlur = () => {
    setIsTyping(false);
    if (inputValue !== searchString) {
      onSearchUpdate(inputValue);
    }
  };

  const handleChange = (e) => {
    setInputValue(e.target.value);
    setIsTyping(true);

    // Debounce the "isTyping" state release
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
       setIsTyping(false);
    }, 1000); // 1s after last keystroke, we consider typing stopped
  };

  const handleSelect = useCallback((val) => {
    onSearchUpdate(val);
    setInputValue(val);
    setIsMenuOpen(false);
  }, [onSearchUpdate]);

  return (
    <div className="bg-white/95 backdrop-blur-md border-t border-gray-200 p-2 sm:p-4 sticky bottom-0 z-50 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] pb-safe-area-inset-bottom">
      <div className="max-w-7xl mx-auto flex items-stretch gap-2 sm:gap-4 relative">
        <div className="flex-1 relative group">
          <input
            type="text"
            value={inputValue}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            placeholder="Search Pokemon"
            className="w-full h-full pl-3 sm:pl-4 pr-8 sm:pr-12 py-3 border border-gray-300 rounded-xl bg-gray-50/50 text-sm font-mono focus:ring-2 sm:focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm group-hover:bg-white"
          />
          {/* Clear button if input has text */}
          {inputValue && (
            <button
              onClick={() => {
                 setInputValue('');
                 onSearchUpdate('');
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200 transition-colors"
              title="Clear search"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>

        <div className="relative flex-shrink-0">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`h-full px-3 sm:px-5 rounded-xl font-medium transition-all flex items-center justify-center gap-2 border select-none active:scale-95 ${
              isMenuOpen
                ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-inner'
                : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700 shadow-sm hover:border-gray-300'
            }`}
            title="Saved Searches"
          >
            <span className="text-lg">⭐️</span>
            <span className="hidden sm:inline text-sm font-semibold">Saved</span>
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
          className={`h-full px-4 sm:px-8 rounded-xl font-semibold transition-all shadow-md active:scale-95 flex items-center justify-center min-w-[3rem] sm:min-w-[100px] ${
            copied
              ? 'bg-green-500 hover:bg-green-600 text-white shadow-green-200'
              : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white shadow-blue-200'
          }`}
          title="Copy to Clipboard"
        >
          {copied ? (
             <span className="flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                   <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="hidden sm:inline">Copied</span>
             </span>
          ) : (
            <>
              <span className="hidden sm:inline">Copy</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                 <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default React.memo(SearchStringDisplay);
