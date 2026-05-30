import React, { useState, useEffect } from 'react';

function SearchStringDisplay({ searchString, selectedCount, onClearSelection }) {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const handleCopy = () => {
    if (!searchString) return;
    navigator.clipboard.writeText(searchString);
    setCopied(true);
    setShowToast(true);
    
    // Auto reset copy visual state
    setTimeout(() => setCopied(false), 2000);
  };

  // Auto-hide toast
  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  return (
    <>
      {/* Toast Notification */}
      <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] transition-all duration-300 transform flex items-center gap-2 bg-emerald-500 text-slate-950 font-bold px-4 py-2.5 rounded-2xl shadow-[0_10px_25px_-5px_rgba(16,185,129,0.5)] border border-emerald-400/30 ${
        showToast ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0 pointer-events-none'
      }`}>
        <span>✨</span>
        <span>Search string copied to clipboard!</span>
      </div>

      {/* QR Code Popover Modal */}
      {showQR && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[99] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full text-center relative shadow-2xl animate-float">
            
            {/* Close Button */}
            <button
              onClick={() => setShowQR(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-200 transition-colors w-7 h-7 flex items-center justify-center bg-slate-950/60 rounded-full border border-slate-800 cursor-pointer"
            >
              ✕
            </button>

            {/* QR Icon */}
            <div className="text-3xl mb-1">📱</div>
            <h3 className="text-md font-extrabold text-slate-200 mb-1.5 uppercase tracking-wide">
              Scan to Mobile
            </h3>
            
            <p className="text-[11px] text-slate-400 mb-5 max-w-[280px] mx-auto leading-relaxed">
              Scan with your phone's camera to instantly get your generated Pokémon GO search string on mobile!
            </p>

            {/* QR Image Container */}
            {searchString ? (
              <div className="bg-white p-3 rounded-2xl inline-block shadow-lg border border-slate-700/10 mb-5 relative group">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(searchString)}`}
                  alt="Search query QR Code"
                  className="w-48 h-48 block rounded-lg select-none"
                  width="192"
                  height="192"
                />
              </div>
            ) : (
              <div className="bg-slate-950/50 p-6 rounded-2xl mb-5 border border-slate-850 text-slate-500 text-xs">
                Select some filters to generate a QR code!
              </div>
            )}

            {/* Micro details */}
            <div className="bg-slate-950/40 border border-slate-850 rounded-xl p-2.5 max-h-16 overflow-y-auto font-mono text-[10px] text-slate-400 no-scrollbar break-all text-left">
              {searchString || 'No active query filters...'}
            </div>
          </div>
        </div>
      )}

      {/* Floating Sticky Bottom Bar */}
      <div className="bg-slate-900/85 backdrop-blur-lg border-t border-slate-800/80 p-4 sticky bottom-0 z-40 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center gap-3">
          
          {/* Stats Summary Panel */}
          <div className="flex items-center gap-2 shrink-0 select-none">
            <div className="bg-blue-500/10 border border-blue-500/20 text-blue-400 font-extrabold text-xs px-3.5 py-2.5 rounded-2xl flex items-center gap-2">
              <span>🎯</span>
              <span>{selectedCount} Selected</span>
            </div>
            
            {/* Clear selection button */}
            {selectedCount > 0 && (
              <button
                onClick={onClearSelection}
                className="text-xs font-bold text-slate-500 hover:text-rose-400 bg-slate-950/30 hover:bg-rose-500/5 px-3 py-2.5 rounded-2xl border border-slate-850 hover:border-rose-500/10 transition-all cursor-pointer"
                title="Clear current selection"
              >
                Clear
              </button>
            )}
          </div>

          {/* Active String Output Box */}
          <div className="relative flex-1 w-full">
            <input
              type="text"
              readOnly
              value={searchString}
              placeholder="Select Pokemon or Filters to generate query..."
              onClick={(e) => e.target.select()}
              className="w-full pl-4 pr-16 py-3 rounded-2xl bg-slate-950 border border-slate-850 text-xs text-slate-300 placeholder-slate-650 font-mono focus:outline-none focus:border-blue-500/60 truncate"
            />
            {searchString && (
              <div className="absolute right-3.5 top-2.5 flex gap-1">
                <span className="text-[10px] bg-slate-900 border border-slate-800 text-slate-500 font-extrabold px-2 py-0.5 rounded-lg select-none">
                  {searchString.length} chars
                </span>
              </div>
            )}
          </div>

          {/* Main Action buttons */}
          <div className="flex gap-2 w-full sm:w-auto shrink-0">
            {/* Scan to Phone Button */}
            <button
              onClick={() => setShowQR(true)}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-extrabold text-xs transition-all duration-200 border bg-slate-950 hover:bg-slate-850 border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white cursor-pointer"
              title="Generate QR code to scan with your phone"
            >
              <span>📱</span>
              <span>Mobile QR</span>
            </button>

            {/* Copy Clipboard Button */}
            <button
              onClick={handleCopy}
              disabled={!searchString}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-extrabold text-xs transition-all duration-300 ${
                !searchString
                  ? 'bg-slate-800 border border-slate-850 text-slate-600 cursor-not-allowed'
                  : copied
                    ? 'bg-emerald-500 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.4)] cursor-pointer'
                    : 'bg-blue-600 hover:bg-blue-500 text-slate-950 hover:scale-[1.03] active:scale-[0.98] shadow-[0_0_15px_rgba(37,99,235,0.4)] cursor-pointer'
              }`}
            >
              {copied ? (
                <>
                  <span>✓</span>
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <span>📋</span>
                  <span>Copy String</span>
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
