import React, { useState, useEffect, useCallback, useRef } from 'react';
import SavedSearchMenu from './SavedSearchMenu';

// Robust cross-browser clipboard copy with fallback
const copyToClipboard = async (text) => {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.warn('navigator.clipboard failed, attempting fallback...', err);
    }
  }

  // Textarea fallback
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.left = '-999999px';
  textArea.style.top = '-999999px';
  textArea.setAttribute('readonly', '');
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    const successful = document.execCommand('copy');
    textArea.remove();
    return successful;
  } catch (err) {
    textArea.remove();
    console.error('execCommand copy fallback failed:', err);
    return false;
  }
};

function SearchStringDisplay({ searchString, selectedCount, onClearSelection, onSearchUpdate, onOpenFilters }) {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('Search string copied to clipboard!');
  const [inputValue, setInputValue] = useState(searchString);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);

  // Sync input value when searchString prop changes (e.g. from clicking grid)
  useEffect(() => {
    if (!isTyping) {
      setInputValue(searchString);
    }
  }, [searchString, isTyping]);

  const handleCopy = useCallback(async () => {
    if (!searchString) return;
    const success = await copyToClipboard(searchString);
    if (success) {
      setToastMessage('Search string copied to clipboard!');
      setCopied(true);
      setShowToast(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      setToastMessage('Unable to copy automatically. Please copy manually.');
      setShowToast(true);
    }
  }, [searchString]);

  // Auto-hide toast
  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  // Close modals on Escape key
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (showQR) setShowQR(false);
        if (isMenuOpen) setIsMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [showQR, isMenuOpen]);

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

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 1000); // 1s debounce
  };

  const handleSelect = useCallback((val) => {
    onSearchUpdate(val);
    setInputValue(val);
    setIsMenuOpen(false);
  }, [onSearchUpdate]);

  // Character length evaluation for Pokémon GO limits
  const charLength = inputValue.length;
  const isHighLength = charLength > 600;
  const isVeryHighLength = charLength > 1000;

  return (
    <>
      {/* Toast Notification (PoGo Achievement Banner Style) */}
      <div 
        role="status"
        aria-live="polite"
        className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] transition-all duration-300 transform flex items-center gap-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black px-6 py-3 rounded-full shadow-[0_10px_25px_-5px_rgba(0,180,155,0.5)] border-2 border-white ${
          showToast ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0 pointer-events-none'
        }`}
      >
        <span className="text-lg">✨</span>
        <span className="tracking-wide text-xs uppercase font-black">{toastMessage}</span>
      </div>

      {/* QR Code Popover Modal */}
      {showQR && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[99] flex items-center justify-center p-4"
          onClick={() => setShowQR(false)}
          aria-modal="true"
          role="dialog"
        >
          <div 
            className="bg-white border-2 border-teal-200 rounded-3xl p-6 max-w-sm w-full text-center relative shadow-2xl animate-float"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowQR(false)}
              aria-label="Close QR Code dialog"
              className="pogo-close-btn absolute top-4 right-4 w-7 h-7 rounded-full flex items-center justify-center text-white font-black text-xs cursor-pointer shadow-md"
            >
              ✕
            </button>

            <div className="text-4xl mb-2">📱</div>
            <h3 className="text-base font-black text-slate-800 mb-1 uppercase tracking-wider">
              Scan to Mobile
            </h3>
            
            <p className="text-[11px] text-slate-600 mb-5 max-w-[280px] mx-auto leading-relaxed font-medium">
              Scan with your phone's camera to instantly get your generated Pokémon GO search string!
            </p>

            {searchString ? (
              <div className="bg-slate-50 p-3.5 rounded-2xl inline-block shadow-inner border border-slate-200 mb-5 relative group">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(searchString)}`}
                  alt="Pokémon GO search query QR Code"
                  className="w-48 h-48 block rounded-lg select-none"
                  width="192"
                  height="192"
                />
              </div>
            ) : (
              <div className="bg-slate-100 p-6 rounded-2xl mb-5 border border-slate-200 text-slate-500 text-xs font-bold">
                Select some filters to generate a QR code!
              </div>
            )}

            <div className="bg-slate-50 border border-teal-200 rounded-2xl p-3 max-h-20 overflow-y-auto font-mono text-[10px] text-teal-800 no-scrollbar break-all text-left font-bold">
              {searchString || 'No active query filters...'}
            </div>
          </div>
        </div>
      )}

      {/* Floating Sticky Bottom Bar */}
      <div className="bg-white/95 border-t-2 border-teal-200 p-3 md:p-3.5 sticky bottom-0 z-40 shadow-[0_-8px_25px_rgba(20,80,70,0.12)] backdrop-blur-md pb-safe-area-inset-bottom">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center gap-3">
          
          {/* Stats Summary Panel */}
          <div className="flex items-center gap-2 shrink-0 select-none">
            <div className="bg-teal-50 border border-teal-300 text-teal-900 font-black text-xs px-4 py-2.5 rounded-full flex items-center gap-2 shadow-xs">
              <span className="text-sm">🎯</span>
              <span className="uppercase tracking-wider">{selectedCount} Selected</span>
            </div>
            
            {selectedCount > 0 && (
              <button
                onClick={onClearSelection}
                aria-label="Clear all selected Pokémon"
                className="text-xs font-black uppercase tracking-wider text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3.5 py-2.5 rounded-full border border-rose-200 transition-all cursor-pointer shadow-xs"
                title="Clear current selection"
              >
                Clear
              </button>
            )}
          </div>

          {/* Dynamic Bidirectional Capsule Input */}
          <div className="relative flex-1 w-full group">
            <input
              type="text"
              value={inputValue}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              aria-label="Search string generator and editor"
              placeholder="Search terms, IDs, ranges or paste expressions here..."
              className="w-full pl-5 pr-28 py-2.5 rounded-full bg-slate-50 border border-teal-200 text-xs text-slate-800 placeholder-slate-400 font-mono focus:outline-none focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-400/20 truncate font-bold shadow-inner"
            />
            {inputValue && (
              <div className="absolute right-3 top-2 flex items-center gap-1.5 select-none">
                <span 
                  className={`text-[9px] border font-black px-2 py-0.5 rounded-full transition-colors ${
                    isVeryHighLength
                      ? 'bg-rose-100 text-rose-700 border-rose-300'
                      : isHighLength
                        ? 'bg-amber-100 text-amber-800 border-amber-300'
                        : 'bg-white border-teal-300 text-teal-800'
                  }`}
                  title={isVeryHighLength ? 'Long query (>1000 chars) — Some game versions may truncate' : `${charLength} characters`}
                >
                  {charLength} chars
                </span>
                
                {/* Clear button inside input */}
                <button
                  onClick={() => {
                    setInputValue('');
                    onSearchUpdate('');
                  }}
                  aria-label="Clear input query"
                  className="text-slate-400 hover:text-slate-700 bg-white border border-slate-300 w-5 h-5 flex items-center justify-center rounded-full cursor-pointer text-xs"
                  title="Clear input"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 w-full sm:flex sm:w-auto shrink-0 relative">
            
            {/* Mobile Filters Trigger */}
            <button
              onClick={onOpenFilters}
              aria-label="Open filter settings modal"
              className="lg:hidden flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full font-black text-xs uppercase tracking-wider transition-all duration-150 border bg-teal-600 text-white hover:bg-teal-500 cursor-pointer select-none active:scale-95 shadow-sm"
              title="Open filter panel settings"
            >
              <span>⚙️</span>
              <span>Filters</span>
            </button>

            {/* Saved Searches Drawer Trigger */}
            <div className="relative flex-1 sm:flex-initial">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label="Toggle Saved Searches menu"
                aria-expanded={isMenuOpen}
                className={`w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full font-black text-xs uppercase tracking-wider transition-all duration-150 border cursor-pointer select-none active:scale-95 ${
                  isMenuOpen
                    ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md font-black'
                    : 'bg-white hover:bg-slate-50 border-teal-200 text-slate-700 hover:text-slate-900 shadow-xs'
                }`}
                title="Saved Searches Menu"
              >
                <span>⭐</span>
                <span>Saved</span>
              </button>
              
              {isMenuOpen && (
                <SavedSearchMenu
                  currentSearch={inputValue}
                  onSelect={handleSelect}
                  onClose={() => setIsMenuOpen(false)}
                />
              )}
            </div>

            {/* Scan to Phone Button */}
            <button
              onClick={() => setShowQR(true)}
              aria-label="Generate QR Code to scan on mobile"
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full font-black text-xs uppercase tracking-wider transition-all duration-150 border bg-white hover:bg-slate-50 border-teal-200 text-slate-700 hover:text-slate-900 cursor-pointer shadow-xs"
              title="Generate QR code to scan with your phone"
            >
              <span>📱</span>
              <span>QR Code</span>
            </button>

            {/* Copy Clipboard Button */}
            <button
              onClick={handleCopy}
              disabled={!searchString}
              aria-label="Copy search query to clipboard"
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-2.5 rounded-full font-black text-xs uppercase tracking-wider transition-all duration-200 ${
                !searchString
                  ? 'bg-slate-200 border border-slate-300 text-slate-400 cursor-not-allowed'
                  : copied
                    ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)] cursor-pointer'
                    : 'bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white hover:scale-[1.03] active:scale-[0.98] shadow-md cursor-pointer'
              }`}
            >
              {copied ? (
                <>
                  <span>✓</span>
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <span>📋</span>
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

        </div>
      </div>
    </>
  );
}

export default React.memo(SearchStringDisplay);
