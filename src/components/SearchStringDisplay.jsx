import React, { useState, useEffect, useCallback, useRef, useId, useMemo } from 'react';
import SavedSearchMenu from './SavedSearchMenu';
import { PogoCloseButton, PogoCategoryIcon } from './ui/PogoDesignSystem';
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
        className="pogo-summary-card p-5 max-w-sm w-[calc(100%-2rem)] text-center relative shadow-2xl text-[#123c4d]"
      >
        <PogoCloseButton
          onClick={() => setShowQR(false)}
          ariaLabel="Close QR Code dialog"
          size="sm"
          className="absolute top-3.5 right-3.5"
        />

        <h3 id={qrHeadingId} className="font-display text-sm font-extrabold text-[#0b698e] mb-1 uppercase tracking-wider">
          Scan Search String
        </h3>
        <p className="text-xs text-[#285d72] mb-4 font-medium">
          Scan from another device to copy this Pokémon GO query.
        </p>

        {inputValue ? (
          <div className="bg-white p-3 rounded-2xl inline-block border-2 border-white shadow-sm mb-3">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(inputValue)}`}
              alt="Pokémon GO search query QR Code"
              className="w-44 h-44 block rounded-lg select-none"
              width="176"
              height="176"
            />
          </div>
        ) : (
          <div className="bg-white/80 p-5 rounded-2xl mb-3 border border-white text-[#285d72] text-xs font-bold">
            Choose or enter a search string first.
          </div>
        )}

        <div className="bg-[#073b50] border border-[#0d7da8]/40 rounded-xl p-2.5 max-h-20 overflow-y-auto font-mono text-[10px] text-[#bfeaf6] break-all text-left font-bold">
          {inputValue || 'Empty query'}
        </div>
      </dialog>

      {/* Frosted Sky-Glass Bottom Dock (Matches Screenshots 1, 2 & 3 Floating Controls) */}
      <div className="mwg-touch-scope bg-[#d7f3fc]/92 border-t-2 border-white/85 pt-2 sticky bottom-0 z-40 shadow-[0_-6px_22px_rgba(8,82,114,0.14)] backdrop-blur-lg safe-bottom-dock">
        <div className="max-w-7xl mx-auto flex flex-col gap-1.5">
          {/* PoGO `,` (OR) vs `&` (AND) Precedence Auto-Fixer Banner */}
          {precedenceCheck.hasPrecedenceTrap && (
            <div className="flex items-center justify-between gap-2 bg-amber-50/95 border border-amber-300 rounded-2xl px-3 py-1 text-[11px]">
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
                className="compact-inline-chip shrink-0 px-2.5 py-0.5 rounded-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-[10px] uppercase tracking-wide cursor-pointer"
              >
                ✨ Fix Precedence
              </button>
            </div>
          )}

          {/* Secondary Strip — ONLY rendered in Pokédex Grid mode so Triage stays 1 single compact row */}
          {viewMode === 'grid' && (
            <div className="flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="pogo-counter-pill text-[11px] py-0.5 px-3">
                  {selectedCount} Selected
                </span>
                {selectedCount > 0 && (
                  <button
                    type="button"
                    onClick={onClearSelection}
                    className="compact-inline-chip text-[11px] font-extrabold text-rose-700 bg-white/90 hover:bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200 cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={onOpenFilters}
                className="compact-inline-chip lg:hidden pogo-pill inline-flex items-center gap-1.5 px-3 py-1 text-[11px] uppercase cursor-pointer"
              >
                <PogoCategoryIcon name="funnel" className="w-3.5 h-3.5" />
                <span>FILTER BY</span>
              </button>
            </div>
          )}

          {/* Primary Single-Row Search Bar + Saved + QR + Copy */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Pure White Pill Search String Input (Screenshot 1 Capsule Style) */}
            <div className="pogo-search-pill relative flex-1 min-w-0 flex items-center">
              <span className="pl-3 pr-1.5 flex items-center pointer-events-none text-[#0b698e]" aria-hidden="true">
                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round">
                  <circle cx="8.5" cy="8.5" r="5.2" />
                  <path d="m12.5 12.5 4.2 4.2" />
                </svg>
              </span>
              <input
                id={dockInputId}
                type="text"
                value={inputValue}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                onBlur={handleBlur}
                aria-label="Active Pokémon GO search string"
                placeholder="Tap Pokémon or enter a PoGO search query..."
                className="w-full pr-20 py-2 bg-transparent text-base sm:text-xs text-[#123c4d] placeholder-[#28708c]/70 font-mono focus:outline-none truncate font-bold"
              />
              {inputValue && (
                <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1 select-none">
                  <span
                    className={`text-[9px] border font-black px-1.5 py-0.5 rounded-full ${
                      isVeryHighLength
                        ? 'bg-rose-100 text-rose-700 border-rose-300'
                        : isHighLength
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : 'bg-[#e6f6fc] border-[#0d7da8]/25 text-[#0b698e]'
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
                    className="compact-inline-chip mwg-icon-hit text-[#245364] hover:text-[#073b50] bg-[#e6f6fc] border border-[#0d7da8]/30 w-5 h-5 flex items-center justify-center rounded-full cursor-pointer text-[10px] font-bold"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            {/* Saved Searches Trigger */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setIsMenuOpen((v) => !v)}
                aria-label="Saved search strings"
                aria-expanded={isMenuOpen}
                className={`px-3 py-2 text-xs uppercase cursor-pointer inline-flex items-center justify-center gap-1 ${
                  isMenuOpen ? 'pogo-pill-active' : 'pogo-pill'
                }`}
              >
                <span aria-hidden="true">★</span>
                <span className="hidden sm:inline">SAVED</span>
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
              className="hidden sm:inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs uppercase pogo-pill cursor-pointer shrink-0"
            >
              <span aria-hidden="true">📱</span>
              <span>QR</span>
            </button>

            {/* Primary Accessible Copy Button (Cerulean Active Pill Style) */}
            <span className="mwg-copy">
              <button
                type="button"
                {...{ command: '--copy', commandfor: dockInputId }}
                className="mwg-copy-btn pogo-pill-active px-4 sm:px-5 py-2 text-xs uppercase"
              >
                <span className="icon-copy" aria-hidden="true">📋</span>
                <span className="icon-check" aria-hidden="true">✓</span>
                <span>COPY</span>
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
