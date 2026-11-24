import React, { useMemo } from 'react';
import { useSearchDockController } from '../../controllers/useSearchDockController';
import SavedSearchMenu from './SavedSearchMenu';
import CopyActionButton from '../shared/CopyActionButton';
import { PogoCloseButton, PogoCategoryIcon } from '../shared/PogoDesignSystem';
import { createDialogRefHandler } from '../shared/dialogRef';

function SearchStringDock({
  viewMode = 'triage',
  searchString,
  selectedCount,
  rawClauses = [],
  onRemoveRawClause,
  onClearSelection,
  onSearchUpdate,
  onOpenFilters,
}) {
  const {
    dockInputId,
    qrHeadingId,
    qrDialogRef,
    displayValue,
    validation,
    precedenceCheck,
    isMenuOpen,
    qrOverlay,
    changeDraft,
    commitDraft,
    clearQuery,
    fixPrecedence,
    toggleSavedMenu,
    closeOverlay,
    selectSavedSearch,
    openQrModal,
    closeQrModal,
    handleDockInputKeyDown,
    handleDockContainerKeyDown,
  } = useSearchDockController({ searchString, onSearchUpdate });

  const attachQrDialogRef = useMemo(
    () => createDialogRefHandler(qrDialogRef, closeQrModal),
    [qrDialogRef, closeQrModal]
  );

  const charBadgeClass =
    validation.charCount > 5000
      ? 'bg-rose-100 text-rose-800 border-rose-300'
      : validation.charCount > 4000
        ? 'bg-amber-100 text-amber-900 border-amber-300'
        : 'bg-[#e6f6fc] border-[#0d7da8]/25 text-[#0b698e]';

  return (
    <>
      {/* Native <dialog> 100% Offline QR Modal */}
      <dialog
        ref={attachQrDialogRef}
        aria-labelledby={qrHeadingId}
        {...{ closedby: 'any' }}
        className="pogo-summary-card p-5 max-w-sm w-[calc(100%-2rem)] max-h-[calc(100dvh-2rem)] overflow-y-auto text-center relative shadow-2xl text-[#123c4d]"
      >
        <PogoCloseButton
          onClick={closeQrModal}
          ariaLabel="Close QR modal"
          size="sm"
          className="absolute top-3.5 right-3.5"
        />

        <h3
          id={qrHeadingId}
          className="font-display text-sm font-extrabold text-[#0b698e] mb-1 uppercase tracking-wider"
        >
          Scan Search String (Offline QR)
        </h3>
        <p className="text-xs text-[#285d72] mb-4 font-medium">
          Generated 100% locally on your device — works offline with zero external requests.
        </p>

        {displayValue ? (
          qrOverlay?.status === 'error' ? (
            <div className="bg-rose-50 border border-rose-300 text-rose-800 p-4 rounded-2xl mb-3 text-xs font-bold">
              {qrOverlay.error}
            </div>
          ) : qrOverlay?.status === 'ready' && qrOverlay.dataUrl ? (
            <div className="bg-white p-3 rounded-2xl inline-block border-2 border-white shadow-sm mb-3">
              <img
                src={qrOverlay.dataUrl}
                alt="Offline search query QR code"
                className="w-44 h-44 block rounded-lg select-none"
                width="176"
                height="176"
              />
            </div>
          ) : (
            <div className="bg-white/80 p-5 rounded-2xl mb-3 border border-white text-[#285d72] text-xs font-bold">
              Generating offline QR code...
            </div>
          )
        ) : (
          <div className="bg-white/80 p-5 rounded-2xl mb-3 border border-white text-[#285d72] text-xs font-bold">
            Choose or enter a search string first.
          </div>
        )}

        <div className="bg-[#073b50] border border-[#0d7da8]/40 rounded-xl p-2.5 max-h-20 overflow-y-auto font-mono text-[10px] text-[#bfeaf6] break-all text-left font-bold">
          {displayValue || 'Empty query'}
        </div>
      </dialog>

      {/* Frosted Sky-Glass Bottom Dock */}
      <div
        onKeyDown={handleDockContainerKeyDown}
        className="bg-[#d7f3fc]/92 border-t-2 border-white/85 pt-2 sticky bottom-0 z-40 shadow-[0_-6px_22px_rgba(8,82,114,0.14)] backdrop-blur-lg safe-bottom-dock"
      >
        <div className="max-w-7xl mx-auto flex flex-col gap-1.5">
          {precedenceCheck.hasPrecedenceTrap && (
            <div className="flex items-center justify-between gap-2 bg-amber-50/95 border border-amber-300 rounded-2xl px-3 py-1 text-[11px]">
              <span className="font-bold text-amber-950 truncate">
                ⚠️ PoGO evaluates <code className="font-mono font-black">,</code> (OR) before{' '}
                <code className="font-mono font-black">&amp;</code> (AND).
              </span>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={fixPrecedence}
                className="compact-inline-chip shrink-0 px-2.5 py-0.5 rounded-full bg-amber-400 hover:bg-amber-500 text-[#123c4d] font-extrabold text-[10px] uppercase tracking-wide cursor-pointer"
              >
                ✨ Fix Precedence
              </button>
            </div>
          )}

          {(validation.errors.length > 0 || validation.warnings.length > 0) && (
            <div className="flex flex-wrap gap-1.5 text-[11px]">
              {validation.errors.map((err, idx) => (
                <div
                  key={`err-${idx}`}
                  role="alert"
                  className="bg-rose-50/95 border border-rose-300 text-rose-800 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1"
                >
                  <span aria-hidden="true">⛔</span>
                  <span>{err.message}</span>
                </div>
              ))}
              {validation.warnings.map((warn, idx) => (
                <div
                  key={`warn-${idx}`}
                  className="bg-amber-50/95 border border-amber-300 text-amber-900 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1"
                >
                  <span aria-hidden="true">⚠️</span>
                  <span>{warn.message}</span>
                </div>
              ))}
            </div>
          )}

          {rawClauses.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#285d72] shrink-0">
                Custom Terms:
              </span>
              {rawClauses.map((clause, idx) => (
                <span
                  key={`${clause}-${idx}`}
                  className="inline-flex items-center gap-1 bg-white/90 border border-[#7c52b5]/35 text-[#5b3591] text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full shrink-0 shadow-2xs"
                >
                  <span className="max-w-[180px] truncate" title={clause}>
                    {clause}
                  </span>
                  {onRemoveRawClause && (
                    <button
                      type="button"
                      onClick={() => onRemoveRawClause(idx)}
                      className="compact-inline-chip text-[#7c52b5] hover:text-rose-600 cursor-pointer font-black"
                      aria-label={`Remove clause ${clause}`}
                    >
                      ✕
                    </button>
                  )}
                </span>
              ))}
            </div>
          )}

          {viewMode === 'builder' && (
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
                    Clear Dex
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

          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="pogo-search-pill relative flex-1 min-w-0 flex items-center">
              <span
                className="pl-3 pr-1.5 flex items-center pointer-events-none text-[#0b698e]"
                aria-hidden="true"
              >
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.3"
                  strokeLinecap="round"
                >
                  <circle cx="8.5" cy="8.5" r="5.2" />
                  <path d="m12.5 12.5 4.2 4.2" />
                </svg>
              </span>
              <input
                id={dockInputId}
                type="text"
                value={displayValue}
                onChange={(e) => changeDraft(e.target.value)}
                onKeyDown={handleDockInputKeyDown}
                onBlur={commitDraft}
                aria-label="Active Pokémon GO search string"
                placeholder="Tap Pokémon, #tags, or paste any PoGO query..."
                className="w-full pr-20 py-2 bg-transparent text-base sm:text-xs text-[#123c4d] placeholder-[#28708c]/70 font-mono focus:outline-none truncate font-bold"
              />
              {displayValue && (
                <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1 select-none">
                  <span
                    className={`text-[9px] border font-black px-1.5 py-0.5 rounded-full ${charBadgeClass}`}
                    title={`${validation.charCount.toLocaleString()} characters`}
                  >
                    {validation.charCount}c
                  </span>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={clearQuery}
                    aria-label="Clear search string"
                    className="compact-inline-chip mwg-icon-hit text-[#245364] hover:text-[#073b50] bg-[#e6f6fc] border border-[#0d7da8]/30 w-5 h-5 flex items-center justify-center rounded-full cursor-pointer text-[10px] font-bold"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            <div className="relative shrink-0">
              <button
                type="button"
                onClick={toggleSavedMenu}
                aria-label="Saved search strings"
                aria-expanded={isMenuOpen}
                className={`px-2.5 sm:px-3 py-2 text-xs uppercase cursor-pointer inline-flex items-center justify-center gap-1 ${
                  isMenuOpen ? 'pogo-pill-active' : 'pogo-pill'
                }`}
              >
                <span aria-hidden="true">★</span>
                <span className="hidden sm:inline">SAVED</span>
              </button>

              {isMenuOpen && (
                <SavedSearchMenu
                  currentSearch={displayValue}
                  onSelect={selectSavedSearch}
                  onClose={closeOverlay}
                />
              )}
            </div>

            <button
              type="button"
              onClick={openQrModal}
              aria-label="Show offline QR code"
              className="inline-flex items-center justify-center gap-1 px-2.5 sm:px-3.5 py-2 text-xs uppercase pogo-pill cursor-pointer shrink-0"
            >
              <span aria-hidden="true">📱</span>
              <span className="hidden sm:inline">QR</span>
            </button>

            <CopyActionButton
              targetId={dockInputId}
              ariaLabel="Copy active Pokémon GO search string"
              className="pogo-pill-active px-3.5 sm:px-5 py-2 text-xs uppercase"
              idleContent={
                <>
                  <span aria-hidden="true">📋</span>
                  <span>COPY</span>
                </>
              }
              copiedContent={
                <>
                  <span aria-hidden="true">✓</span>
                  <span>COPY</span>
                </>
              }
            />
          </div>
        </div>
      </div>
    </>
  );
}

export default React.memo(SearchStringDock);
