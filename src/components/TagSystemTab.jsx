import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  TAG_NAMESPACES,
  getNamespaceHashes,
  getRecommendedDragOrder,
} from '../utils/tagSystem';

const COLOR_SWATCHES = {
  purple: {
    dot: 'bg-[#7c52b5]',
    badge: 'bg-purple-100/90 text-[#5d3696] border-purple-300/80 hover:bg-purple-200/80',
    label: 'Purple',
  },
  yellow: {
    dot: 'bg-amber-400',
    badge: 'bg-amber-100/90 text-amber-900 border-amber-300/90 hover:bg-amber-200/80',
    label: 'Yellow',
  },
  blue: {
    dot: 'bg-[#0d7da8]',
    badge: 'bg-[#dff4fb] text-[#0b698e] border-[#0d7da8]/30 hover:bg-[#c8ecf8]',
    label: 'Blue',
  },
  red: {
    dot: 'bg-rose-600',
    badge: 'bg-rose-100/90 text-rose-800 border-rose-300/80 hover:bg-rose-200/80',
    label: 'Red',
  },
  pink: {
    dot: 'bg-pink-500',
    badge: 'bg-pink-100/90 text-pink-800 border-pink-300/80 hover:bg-pink-200/80',
    label: 'Pink',
  },
  green: {
    dot: 'bg-[#2b9e66]',
    badge: 'bg-emerald-100/90 text-emerald-900 border-emerald-300/80 hover:bg-emerald-200/80',
    label: 'Green',
  },
  orange: {
    dot: 'bg-orange-500',
    badge: 'bg-orange-100/90 text-orange-900 border-orange-300/80 hover:bg-orange-200/80',
    label: 'Orange',
  },
  black: {
    dot: 'bg-[#123c4d] ring-2 ring-[#0d7da8]/35',
    badge: 'bg-[#123c4d] text-white border-[#0b698e] hover:bg-[#073b50]',
    label: 'Black',
  },
  grey: {
    dot: 'bg-[#648897]',
    badge: 'bg-white/95 text-[#285d72] border-[#0d7da8]/25 hover:bg-[#e6f6fc]',
    label: 'Grey',
  },
};

function copyTextToClipboard(text) {
  if (!text) return Promise.resolve(false);
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    return navigator.clipboard
      .writeText(text)
      .then(() => true)
      .catch(() => fallbackCopy(text));
  }
  return Promise.resolve(fallbackCopy(text));
}

function fallbackCopy(text) {
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

function CopyIcon({ className = 'w-3.5 h-3.5' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon({ className = 'w-3.5 h-3.5' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function ResetIcon({ className = 'w-3.5 h-3.5' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  );
}

export function TagSystemTab({ customTags }) {
  const {
    tagMap = {},
    resolvedTags = [],
    lintResults = { valid: true, byId: {}, errorCount: 0, warningCount: 0 },
    updateTagName,
    toggleTag,
    resetTags,
    getTagHash,
  } = customTags || {};

  const [copiedId, setCopiedId] = useState(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const copyTimerRef = useRef(null);
  const resetTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    };
  }, []);

  const triggerCopy = useCallback((id, text, syncToDock = false) => {
    copyTextToClipboard(text).then((ok) => {
      if (!ok) return;
      setCopiedId(id);
      if (syncToDock && typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('pogo-copied-string', { detail: { text } }));
      }
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopiedId(null), 1800);
    });
  }, []);

  const enabledCount = useMemo(
    () => resolvedTags.filter((t) => t.enabled).length,
    [resolvedTags]
  );

  const recommendedTop12 = useMemo(
    () => getRecommendedDragOrder(tagMap).slice(0, 12),
    [tagMap]
  );

  const handleCopySetupList = useCallback(() => {
    const ordered = getRecommendedDragOrder(tagMap).filter((t) => t.enabled);
    const lines = [
      'Pokémon GO Tag Setup List (Recommended Drag-and-Drop Order)',
      '===========================================================',
      ...ordered.map((tag, idx) => {
        const swatch = COLOR_SWATCHES[tag.color]?.label || tag.color;
        return `${String(idx + 1).padStart(2, '0')}. ${tag.name}  [${swatch}]  (${
          getTagHash ? getTagHash(tag.id) : `#${tag.name.toLowerCase()}`
        }) — ${tag.purpose}`;
      }),
    ];
    triggerCopy('setup-list', lines.join('\n'), false);
  }, [tagMap, getTagHash, triggerCopy]);

  const handleResetClick = useCallback(() => {
    if (!confirmReset) {
      setConfirmReset(true);
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
      resetTimerRef.current = setTimeout(() => setConfirmReset(false), 3500);
      return;
    }
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    setConfirmReset(false);
    resetTags?.();
  }, [confirmReset, resetTags]);

  const errorCount = lintResults?.errorCount || 0;
  const warningCount = lintResults?.warningCount || 0;

  return (
    <div className="space-y-5 pb-28 text-[#123c4d]">
      {/* Header Summary Card */}
      <section
        aria-label="Tag system summary and actions"
        className="pogo-summary-card p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
      >
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-base sm:text-lg font-extrabold text-[#0b698e] uppercase tracking-wider">
              Opinionated Tag System
            </h2>
            <span className="pogo-counter-pill text-xs">
              {enabledCount} / {resolvedTags.length} Enabled
            </span>

            {errorCount > 0 ? (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-rose-100 text-rose-800 border border-rose-300">
                {errorCount} Collision {errorCount === 1 ? 'Error' : 'Errors'}
              </span>
            ) : warningCount > 0 ? (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                {warningCount} {warningCount === 1 ? 'Warning' : 'Warnings'}
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-100 text-[#1d7a4d] border border-emerald-300">
                Linter Clean ✓
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-[#285d72] leading-relaxed font-medium">
            Rename any tag below to match your personal Pokémon GO box — every Triage Funnel search
            string updates live and is linted against native PoGO keywords &amp;{' '}
            <code className="font-mono font-bold text-[#0b698e]">#</code> prefix collisions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleCopySetupList}
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs uppercase cursor-pointer ${
              copiedId === 'setup-list'
                ? 'rounded-full bg-[#2b9e66] text-white border-2 border-white font-extrabold shadow-sm'
                : 'pogo-pill-active'
            }`}
          >
            {copiedId === 'setup-list' ? <CheckIcon /> : <CopyIcon />}
            <span>{copiedId === 'setup-list' ? 'Setup List Copied!' : 'Copy Tag Setup List'}</span>
          </button>

          <button
            type="button"
            onClick={handleResetClick}
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs uppercase cursor-pointer ${
              confirmReset
                ? 'rounded-full bg-rose-600 hover:bg-rose-700 text-white border-2 border-white font-extrabold shadow-sm'
                : 'pogo-pill'
            }`}
          >
            <ResetIcon />
            <span>{confirmReset ? 'Click Again to Reset' : 'Reset All to Defaults'}</span>
          </button>
        </div>
      </section>

      {/* Dual-Lock & !# Inbox Zero Rules + Recommended Top-12 Drag-and-Drop Order */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Core Rules Callout */}
        <div className="lg:col-span-5 pogo-glass-card p-4 sm:p-5 space-y-2.5">
          <h3 className="font-display text-xs font-extrabold uppercase tracking-wider text-[#0c6c91]">
            Dual-Lock (★ + #) &amp; !# Inbox Zero Rules
          </h3>
          <ul className="space-y-2.5 text-xs text-[#1b4d60] leading-relaxed font-medium">
            <li className="flex items-start gap-2">
              <span className="text-amber-500 font-black shrink-0">★</span>
              <span>
                <strong className="text-[#123c4d]">Dual-Lock Keepers:</strong> Favorite (
                <code className="font-mono font-bold text-amber-800">★</code>) permanent grails +
                apply a <code className="font-mono font-bold text-[#0b698e]">#tag</code>. Favorites
                are an engine-enforced transfer lock even with <em>Expanded Group Transfer</em>{' '}
                enabled.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#2b9e66] font-black shrink-0">!#</span>
              <span>
                <strong className="text-[#123c4d]">Untagged = Unprocessed Inbox:</strong> Every kept
                Pokémon gets at least one tag. Anything left in{' '}
                <code className="font-mono font-bold text-[#1d7a4d]">!#&amp;!favorite</code> is safe
                to mass-transfer.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#7c52b5] font-black shrink-0">#</span>
              <span>
                <strong className="text-[#123c4d]">Prefix Superpower:</strong> Unique namespaces (
                <code className="font-mono font-bold text-[#0b698e]">EV-</code>,{' '}
                <code className="font-mono font-bold text-[#0b698e]">PVP-</code>,{' '}
                <code className="font-mono font-bold text-[#0b698e]">MAX-</code>,{' '}
                <code className="font-mono font-bold text-[#0b698e]">TR-</code>,{' '}
                <code className="font-mono font-bold text-[#0b698e]">OP-</code>) let{' '}
                <code className="font-mono font-bold text-[#5d3696]">#pvp</code> or{' '}
                <code className="font-mono font-bold text-[#5d3696]">!#tr</code> match whole groups
                without colliding with native PoGO keywords.
              </span>
            </li>
          </ul>
        </div>

        {/* Recommended Top-12 Manual Drag-and-Drop Sort Order */}
        <div className="lg:col-span-7 pogo-glass-card p-4 sm:p-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-display text-xs font-extrabold uppercase tracking-wider text-[#1d7a4d]">
              Recommended Top-12 Manual Drag-and-Drop Order
            </h3>
            <span className="text-[11px] text-[#285d72] font-semibold">
              Put highest-frequency event triage tags at the top of PoGO&apos;s Tags tab
            </span>
          </div>

          <ol className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {recommendedTop12.map((tag, index) => {
              const swatch = COLOR_SWATCHES[tag.color] || COLOR_SWATCHES.grey;
              return (
                <li
                  key={tag.id}
                  className={`flex items-center gap-2 rounded-2xl px-2.5 py-2 border text-xs shadow-2xs ${
                    tag.enabled
                      ? 'bg-white/90 border-white text-[#123c4d]'
                      : 'bg-white/45 border-white/60 text-[#396d82] opacity-60 line-through'
                  }`}
                >
                  <span className="font-mono text-[10px] font-extrabold text-[#0b698e] w-5 shrink-0">
                    #{index + 1}
                  </span>
                  <span
                    className={`w-2.5 h-2.5 rounded-full shrink-0 ${swatch.dot}`}
                    aria-hidden="true"
                  />
                  <span className="font-bold truncate" title={tag.name}>
                    {tag.name || tag.defaultName}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* 7 Namespace Sections */}
      <div className="space-y-5">
        {TAG_NAMESPACES.map((ns) => {
          const nsTags = resolvedTags.filter((t) => t.namespace === ns.id);
          const nsEnabled = nsTags.filter((t) => t.enabled).length;
          const nsHashes = getNamespaceHashes(ns.id, tagMap);
          const nsSwatch = COLOR_SWATCHES[ns.color] || COLOR_SWATCHES.grey;

          return (
            <section
              key={ns.id}
              aria-label={`${ns.label} tags`}
              className="pogo-summary-card overflow-hidden"
            >
              {/* Namespace Header */}
              <div className="px-4 py-3.5 sm:px-5 bg-[#dff5fc]/80 border-b border-white/85 flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex items-start gap-2.5 min-w-0">
                  <span
                    className={`w-3.5 h-3.5 rounded-full mt-1 shrink-0 ring-2 ring-white shadow-2xs ${nsSwatch.dot}`}
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-sm sm:text-base font-extrabold text-[#0b698e] uppercase tracking-wide">
                        {ns.label}
                      </h3>
                      <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-white/90 text-[#1b4d60] border border-white shadow-2xs">
                        {nsEnabled}/{nsTags.length} active
                      </span>
                    </div>
                    <p className="text-xs text-[#285d72] mt-0.5 font-medium">{ns.description}</p>
                  </div>
                </div>

                {nsHashes.length > 0 && (
                  <button
                    type="button"
                    onClick={() => triggerCopy(`ns-${ns.id}`, nsHashes.join(','), true)}
                    className="compact-inline-chip inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-white/95 hover:bg-white text-[#0b698e] border border-[#0d7da8]/30 shadow-2xs transition-colors cursor-pointer"
                    title="Copy namespace umbrella search"
                  >
                    {copiedId === `ns-${ns.id}` ? (
                      <CheckIcon className="w-3 h-3 text-[#2b9e66]" />
                    ) : (
                      <CopyIcon className="w-3 h-3" />
                    )}
                    <span className="truncate max-w-[180px] sm:max-w-[260px]">
                      {nsHashes.join(',')}
                    </span>
                  </button>
                )}
              </div>

              {/* Tag Rows */}
              <div className="divide-y divide-[#0d7da8]/12">
                {nsTags.map((tag) => {
                  const swatch = COLOR_SWATCHES[tag.color] || COLOR_SWATCHES.grey;
                  const lint = lintResults?.byId?.[tag.id] || {
                    valid: true,
                    errors: [],
                    warnings: [],
                  };
                  const hasErrors = lint.errors.length > 0;
                  const hasWarnings = lint.warnings.length > 0;
                  const hashPreview = getTagHash ? getTagHash(tag.id) : '';
                  const isRenamed = tag.name !== tag.defaultName;

                  return (
                    <div
                      key={tag.id}
                      className={`p-4 sm:px-5 transition-colors ${
                        !tag.enabled
                          ? 'bg-[#e6f6fc]/40 opacity-65'
                          : hasErrors
                            ? 'bg-rose-50/75'
                            : hasWarnings
                              ? 'bg-amber-50/70'
                              : 'hover:bg-white/60'
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                        {/* Left: Enable Toggle + Color + Editable Name + Live Hash */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 md:w-[350px] lg:w-[390px] shrink-0">
                          <div className="flex items-center gap-2.5">
                            {/* Accessible Switch Toggle */}
                            <button
                              type="button"
                              role="switch"
                              aria-checked={tag.enabled}
                              aria-label={`Toggle ${tag.defaultName} tag`}
                              onClick={() => toggleTag?.(tag.id)}
                              className={`compact-inline-chip relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors cursor-pointer ${
                                tag.enabled
                                  ? 'bg-[#0d7da8] border-[#0b698e]'
                                  : 'bg-[#c4e4f0] border-[#0d7da8]/25'
                              }`}
                            >
                              <span
                                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform ${
                                  tag.enabled ? 'translate-x-4' : 'translate-x-0.5'
                                }`}
                              />
                            </button>

                            <span
                              className={`w-3 h-3 rounded-full shrink-0 ring-2 ring-white shadow-2xs ${swatch.dot}`}
                              title={`Suggested PoGO tag color: ${swatch.label}`}
                              aria-label={`Color: ${swatch.label}`}
                            />

                            {/* Editable Custom Tag Name Input */}
                            <div className="relative flex-1 min-w-[140px]">
                              <input
                                type="text"
                                value={tag.name}
                                disabled={!tag.enabled}
                                onChange={(e) => updateTagName?.(tag.id, e.target.value)}
                                aria-label={`Custom name for ${tag.defaultName}`}
                                placeholder={tag.defaultName}
                                className={`w-full rounded-full bg-white px-3.5 py-1.5 text-sm font-extrabold text-[#123c4d] border-2 focus:outline-none transition-colors disabled:opacity-55 disabled:cursor-not-allowed shadow-2xs ${
                                  hasErrors
                                    ? 'border-rose-500 focus:border-rose-600 ring-2 ring-rose-200'
                                    : hasWarnings
                                      ? 'border-amber-400 focus:border-amber-500 ring-2 ring-amber-200'
                                      : 'border-[#0d7da8]/25 focus:border-[#0d7da8]'
                                }`}
                              />
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5 pl-11 sm:pl-0">
                            {hashPreview && (
                              <button
                                type="button"
                                onClick={() => triggerCopy(`tag-${tag.id}`, hashPreview, true)}
                                className={`compact-inline-chip inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold border transition-colors cursor-pointer ${swatch.badge}`}
                                title={`Copy ${hashPreview}`}
                              >
                                {copiedId === `tag-${tag.id}` ? (
                                  <CheckIcon className="w-3 h-3" />
                                ) : (
                                  <CopyIcon className="w-3 h-3 opacity-80" />
                                )}
                                <span>{hashPreview}</span>
                              </button>
                            )}

                            {tag.optional && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-white/90 text-[#285d72] border border-[#0d7da8]/20">
                                Optional
                              </span>
                            )}

                            {isRenamed && tag.enabled && (
                              <button
                                type="button"
                                onClick={() => updateTagName?.(tag.id, tag.defaultName)}
                                className="compact-inline-chip px-2 py-0.5 rounded-full text-[10px] font-extrabold text-[#0b698e] bg-white hover:bg-[#e6f6fc] border border-[#0d7da8]/30 cursor-pointer"
                                title={`Restore default "${tag.defaultName}"`}
                              >
                                Reset ({tag.defaultName})
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Right: Placement Criteria + Native Search Synergy */}
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <p className="text-xs sm:text-[13px] text-[#1b4d60] leading-relaxed font-medium">
                            {tag.purpose}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 text-[11px]">
                            <span className="text-[#285d72] font-extrabold uppercase tracking-wide text-[10px]">
                              Synergy:
                            </span>
                            <code className="px-2.5 py-0.5 rounded-full bg-[#073b50] text-[#dff6fc] font-mono font-bold">
                              {tag.nativeSearchSynergy}
                            </code>
                            <span className="text-[#285d72] font-mono font-bold">
                              Drag #{tag.dragOrder}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Inline Real-Time Collision Linter Feedback */}
                      {tag.enabled && (hasErrors || hasWarnings) && (
                        <div className="mt-3 space-y-1.5 pl-0 md:pl-11">
                          {lint.errors.map((err, idx) => (
                            <div
                              key={`err-${idx}`}
                              role="alert"
                              className="flex items-start gap-2 rounded-2xl bg-rose-100/95 border border-rose-300 px-3.5 py-2 text-xs text-rose-900 font-semibold"
                            >
                              <span className="font-black text-rose-700 shrink-0">ERROR:</span>
                              <span>{err.message}</span>
                            </div>
                          ))}
                          {lint.warnings.map((warn, idx) => (
                            <div
                              key={`warn-${idx}`}
                              className="flex items-start gap-2 rounded-2xl bg-amber-100/90 border border-amber-300 px-3.5 py-2 text-xs text-amber-950 font-semibold"
                            >
                              <span className="font-black text-amber-800 shrink-0">WARN:</span>
                              <span>{warn.message}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

export default TagSystemTab;
