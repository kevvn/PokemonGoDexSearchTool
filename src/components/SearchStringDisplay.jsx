import React, { useState, useEffect, useCallback, useRef, useId, useMemo } from 'react';
import SavedSearchMenu from './SavedSearchMenu';
import { inspectAndFixPogoQuery } from '../utils/searchUtils';

function SearchStringDisplay({
  viewMode = 'triage',
  searchString,
  selectedCount,
  onClearSelection,
  onSearchUpdate,
  onOpenFilters,
}) {
  const [showQR, setShowQR] = useState(false);
  const [draftValue, setDraftValue] = useState(searchString);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  const dockInputId = useId();
  const qrDialogRef = useRef(null);
  const qrHeadingId = useId();

  const inputValue = isTyping ? draftValue : searchString;

  // Native <dialog> light-dismiss fallback for QR modal
  useEffect(() => {
    const dialog = qrDialogRef.current;
    if (!dialog) return;
    const onClose = () => {
      dialog.returnValue = '';
      setShowQR(false);
    };
    dialog.addEventListener('close', onClose);
    return () => dialog.removeEventListener('close', onClose);
  }, []);

  useEffect(() => {
    const dialog = qrDialogRef.current;
    if (!dialog) return;
    if (showQR && !dialog.open) {
      dialog.showModal();
    } else if (!showQR && dialog.open) {
      dialog.close();
    }
  }, [showQR]);

  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (e.key === 'Escape' && isMenuOpen) {
        setIsMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isMenuOpen]);

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
    setDraftValue(e.target.value);
    setIsTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 1000);
  };

  const handleSelect = useCallback(
    (val) => {
      onSearchUpdate(val);
      setDraftValue(val);
      setIsTyping(false);
      setIsMenuOpen(false);
    },
    [onSearchUpdate]
  );

  const charLength = inputValue.length;
  const isHighLength = charLength > 600;
  const isVeryHighLength = charLength > 1000;

  const precedenceCheck = useMemo(() => inspectAndFixPogoQuery(inputValue), [inputValue]);

  return (
    <>
      {/* Native <dialog> QR Modal (Desktop -> Mobile Scan) */}
      <dialog
        ref={qrDialogRef}
        aria-labelledby={qrHeadingId}
        {...{ closedby: 'any' }}
        onClick={(e) => {
          if (e.target === qrDialogRef.current) setShowQR(false);
        }}
        className="bg-white border-2 border-teal-200 rounded-3xl p-5 max-w-sm w-[calc(100%-2rem)] text-center relative shadow-2xl"
      >
        <button
          type="button"
          onClick={() => setShowQR(false)}
          aria-label="Close QR Code dialog"
          className="pogo-close-btn absolute top-3.5 right-3.5 w-7 h-7 rounded-full flex items-center justify-center text-white font-black text-xs cursor-pointer shadow-md"
        >
          ✕
        </button>

        <h3 id={qrHeadingId} className="text-sm font-black text-slate-800 mb-1 uppercase tracking-wider">
          Scan Search String
        </h3>
        <p className="text-xs text-slate-600 mb-4">
          Scan from another device to copy this Pokémon GO query.
        </p>

        {inputValue ? (
          <div className="bg-slate-50 p-3 rounded-2xl inline-block border border-slate-200 mb-3">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(inputValue)}`}
              alt="Pokémon GO search query QR Code"
              className="w-44 h-44 block rounded-lg select-none"
              width="176"
              height="176"
            />
          </div>
        ) : (
          <div className="bg-slate-100 p-5 rounded-2xl mb-3 border border-slate-200 text-slate-500 text-xs font-bold">
            Choose or enter a search string first.
          </div>
        )}

        <div className="bg-slate-50 border border-teal-200 rounded-xl p-2.5 max-h-20 overflow-y-auto font-mono text-[10px] text-teal-800 break-all text-left font-bold">
          {inputValue || 'Empty query'}
        </div>
      </dialog>

      {/* Sleek Mobile-First Bottom Dock */}
      <div className="mwg-touch-scope bg-white/95 border-t border-teal-200 pt-2 sticky bottom-0 z-40 shadow-[0_-4px_18px_rgba(20,80,70,0.10)] backdrop-blur-md safe-bottom-dock">
        <div className="max-w-7xl mx-auto flex flex-col gap-1.5">
          {/* PoGO `,` (OR) vs `&` (AND) Precedence Auto-Fixer Banner (Only shown when a precedence trap is detected) */}
          {precedenceCheck.hasPrecedenceTrap && (
            <div className="flex items-center justify-between gap-2 bg-amber-50 border border-amber-300 rounded-xl px-2.5 py-1 text-[11px]">
              <span className="font-bold text-amber-950 truncate">
                ⚠️ PoGO evaluates <code className="font-mono font-black">,</code> (OR) before <code className="font-mono font-black">&amp;</code> (AND).
              </span>
              <button
                type="button"
                onClick={() => {
                  setDraftValue(precedenceCheck.fixedCnfQuery);
                  setIsTyping(false);
                  onSearchUpdate(precedenceCheck.fixedCnfQuery);
                }}
                className="compact-inline-chip shrink-0 px-2.5 py-0.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[10px] uppercase tracking-wide cursor-pointer"
              >
                ✨ Fix AND/OR Precedence
              </button>
            </div>
          )}

          {/* Secondary Strip — ONLY rendered in Pokédex Grid mode on mobile so Triage stays 1 single compact row */}
          {viewMode === 'grid' && (
            <div className="flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="bg-teal-50 border border-teal-200 text-teal-900 font-extrabold text-[11px] px-2.5 py-1 rounded-full">
                  {selectedCount} Selected
                </span>
                {selectedCount > 0 && (
                  <button
                    type="button"
                    onClick={onClearSelection}
                    className="compact-inline-chip text-[11px] font-extrabold text-rose-700 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-full border border-rose-200 cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={onOpenFilters}
                className="compact-inline-chip lg:hidden inline-flex items-center gap-1 px-3 py-1 rounded-full font-extrabold text-[11px] uppercase bg-teal-600 text-white cursor-pointer"
              >
                <span aria-hidden="true">⚙️</span>
                <span>Filters</span>
              </button>
            </div>
          )}

          {/* Primary Single-Row Search Bar + Saved + Copy */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Bidirectional Search String Input (16px on mobile prevents iOS Safari auto-zoom on focus) */}
            <div className="relative flex-1 min-w-0">
              <input
                id={dockInputId}
                type="text"
                value={inputValue}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                onBlur={handleBlur}
                aria-label="Active Pokémon GO search string"
                placeholder="Tap any card or type a PoGO query..."
                className="w-full pl-3.5 pr-20 py-2 rounded-full bg-slate-50 border border-teal-200 text-base sm:text-xs text-slate-800 placeholder-slate-400 font-mono focus:outline-none focus:bg-white focus:border-teal-500 truncate font-bold shadow-inner"
              />
              {inputValue && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 select-none">
                  <span
                    className={`text-[9px] border font-black px-1.5 py-0.5 rounded-full ${
                      isVeryHighLength
                        ? 'bg-rose-100 text-rose-700 border-rose-300'
                        : isHighLength
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : 'bg-white border-teal-200 text-teal-800'
                    }`}
                    title={`${charLength} characters`}
                  >
                    {charLength}c
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setDraftValue('');
                      setIsTyping(false);
                      onSearchUpdate('');
                    }}
                    aria-label="Clear search string"
                    className="compact-inline-chip mwg-icon-hit text-slate-500 hover:text-slate-800 bg-white border border-slate-300 w-5 h-5 flex items-center justify-center rounded-full cursor-pointer text-[10px]"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            {/* Saved Searches Popover Trigger */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setIsMenuOpen((v) => !v)}
                aria-label="Saved search strings"
                aria-expanded={isMenuOpen}
                className={`px-3 py-2 rounded-full font-black text-xs transition-colors border cursor-pointer inline-flex items-center justify-center gap-1 ${
                  isMenuOpen
                    ? 'bg-amber-400 text-slate-950 border-amber-300'
                    : 'bg-white hover:bg-slate-50 border-teal-200 text-slate-700'
                }`}
              >
                <span aria-hidden="true">⭐</span>
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

            {/* Desktop / Tablet QR Code Button */}
            <button
              type="button"
              onClick={() => setShowQR(true)}
              aria-label="Show QR code for mobile scan"
              className="hidden sm:inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-full font-black text-xs border bg-white hover:bg-slate-50 border-teal-200 text-slate-700 cursor-pointer shrink-0"
            >
              <span aria-hidden="true">📱</span>
              <span>QR</span>
            </button>

            {/* Primary Accessible Copy Button (mwg: copy-button) */}
            <span className="mwg-copy">
              <button
                type="button"
                {...{ command: '--copy', commandfor: dockInputId }}
                className="mwg-copy-btn px-4 sm:px-5 py-2 rounded-full font-black text-xs uppercase tracking-wider bg-gradient-to-r from-teal-600 to-emerald-500 hover:from-teal-500 hover:to-emerald-400 text-white shadow-sm border border-teal-600"
              >
                <span className="icon-copy" aria-hidden="true">📋</span>
                <span className="icon-check" aria-hidden="true">✓</span>
                <span>Copy</span>
              </button>
              <span className="mwg-copy-tip" role="status" />
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

export default React.memo(SearchStringDisplay);
