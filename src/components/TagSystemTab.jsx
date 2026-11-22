import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  TAG_NAMESPACES,
  CORE_TAGS,
  HYDRATION_STAGES,
  getNamespaceHashes,
  getRecommendedDragOrder,
  buildTagHydrationQueries,
  getAllTagHydrationSteps,
} from '../utils/tagSystem';

const HYDRATION_PROGRESS_STORAGE_KEY = 'pogo_tag_hydration_checked_v1';

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

function fallbackCopy(text) {
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.top = '0';
    textarea.style.left = '-9999px';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, text.length);
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

function copyText(text, syncToDock = true) {
  if (!text) return Promise.resolve(false);
  const finalize = (ok) => {
    if (syncToDock && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('pogo-copied-string', { detail: { text } }));
    }
    return ok;
  };

  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    return navigator.clipboard
      .writeText(text)
      .then(() => finalize(true))
      .catch(() => finalize(fallbackCopy(text)));
  }
  return Promise.resolve(finalize(fallbackCopy(text)));
}

function loadCheckedTags() {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(HYDRATION_PROGRESS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function resolveSynergyQueries(tag, hashPreview) {
  const raw = tag.nativeSearchSynergy || '';
  if (!raw) return [];
  const defaultHash = `#${(tag.defaultName || '').trim().toLowerCase()}`;
  const liveHash = hashPreview || defaultHash;

  return raw
    .split(/,\s+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((query) =>
      defaultHash && liveHash && defaultHash !== liveHash
        ? query.split(defaultHash).join(liveHash)
        : query
    );
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

function BuilderIcon({ className = 'w-3.5 h-3.5' }) {
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
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
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

function ChevronIcon({ open, className = 'w-4 h-4' }) {
  return (
    <svg
      className={`${className} transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export function TagSystemTab({ customTags, metaSnapshot, onLoadQuery }) {
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
  const [walkthroughOpen, setWalkthroughOpen] = useState(false);
  const [checkedTags, setCheckedTags] = useState(loadCheckedTags);
  const copyTimerRef = useRef(null);
  const resetTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(HYDRATION_PROGRESS_STORAGE_KEY, JSON.stringify(checkedTags));
    } catch {
      // Ignore storage quota / private mode failures
    }
  }, [checkedTags]);

  const triggerCopy = useCallback((id, text, syncToDock = true) => {
    copyText(text, syncToDock).then((ok) => {
      if (!ok) return;
      setCopiedId(id);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopiedId(null), 1800);
    });
  }, []);

  const toggleCheckedTag = useCallback((tagId) => {
    setCheckedTags((prev) => ({
      ...prev,
      [tagId]: !prev[tagId],
    }));
  }, []);

  const resetHydrationProgress = useCallback(() => {
    setCheckedTags({});
  }, []);

  const enabledCount = useMemo(
    () => resolvedTags.filter((t) => t.enabled).length,
    [resolvedTags]
  );

  const recommendedTop12 = useMemo(
    () => getRecommendedDragOrder(tagMap).slice(0, 12),
    [tagMap]
  );

  const allHydrationSteps = useMemo(
    () => getAllTagHydrationSteps(tagMap, metaSnapshot),
    [tagMap, metaSnapshot]
  );

  const hydrationStagesGrouped = useMemo(() => {
    const byStage = new Map();
    for (const stage of HYDRATION_STAGES) {
      byStage.set(stage.id, { ...stage, steps: [] });
    }
    for (const step of allHydrationSteps) {
      byStage.get(step.stageId)?.steps.push(step);
    }
    return Array.from(byStage.values());
  }, [allHydrationSteps]);

  const enabledHydrationSteps = useMemo(
    () => allHydrationSteps.filter((s) => s.enabled),
    [allHydrationSteps]
  );

  const completedHydrationCount = useMemo(
    () => enabledHydrationSteps.filter((s) => Boolean(checkedTags[s.tagId])).length,
    [enabledHydrationSteps, checkedTags]
  );

  const hydrationPct =
    enabledHydrationSteps.length > 0
      ? Math.round((completedHydrationCount / enabledHydrationSteps.length) * 100)
      : 0;

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
            Rename any tag below to match your personal Pokémon GO box, then 1-tap copy the verified{' '}
            <strong className="text-[#123c4d]">Hydrate in Pokémon GO</strong> search strings to
            bootstrap your entire existing storage box.
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

      {/* Collapsible Quick-Hydrate Your Box Walkthrough */}
      <section
        aria-label={`Quick-Hydrate Your Box (${CORE_TAGS.length}-Tag Walkthrough)`}
        className="pogo-summary-card overflow-hidden border border-[#0d7da8]/25"
      >
        <button
          type="button"
          onClick={() => setWalkthroughOpen((prev) => !prev)}
          aria-expanded={walkthroughOpen}
          className="w-full px-4 py-3.5 sm:px-5 bg-gradient-to-r from-[#dff5fc]/95 via-[#e8f8fd]/90 to-[#e3f7ee]/85 hover:from-[#d4f0fa] hover:to-[#d8f3e6] transition-colors flex flex-wrap items-center justify-between gap-3 text-left cursor-pointer"
        >
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-display text-sm sm:text-base font-extrabold text-[#0b698e] uppercase tracking-wide">
                Quick-Hydrate Your Box ({CORE_TAGS.length}-Tag Walkthrough)
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-white/95 text-[#1d7a4d] border border-[#2b9e66]/35 shadow-2xs">
                {completedHydrationCount} / {enabledHydrationSteps.length} Done ({hydrationPct}%)
              </span>
            </div>
            <p className="text-xs text-[#285d72] font-medium">
              Run Stages 1 → 6 top-to-bottom: each{' '}
              <code className="font-mono font-bold text-[#0b698e]">!#</code> query automatically
              skips Pokémon you already tagged in earlier stages.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="hidden sm:inline-block w-24 h-2 rounded-full bg-white/90 border border-[#0d7da8]/20 overflow-hidden">
              <span
                className="block h-full bg-[#2b9e66] transition-all duration-300"
                style={{ width: `${hydrationPct}%` }}
              />
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase bg-white/95 text-[#0b698e] border border-[#0d7da8]/30 shadow-2xs">
              <span>{walkthroughOpen ? 'Hide' : 'Open'}</span>
              <ChevronIcon open={walkthroughOpen} className="w-3.5 h-3.5" />
            </span>
          </div>
        </button>

        {walkthroughOpen && (
          <div className="p-4 sm:p-5 space-y-4 bg-white/55 border-t border-white/85">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#285d72]">
              <p className="font-medium">
                Tap <strong className="text-[#123c4d]">Copy</strong>, paste into Pokémon GO, apply
                the tag, then check it off to track your initial box setup.
              </p>
              {completedHydrationCount > 0 && (
                <button
                  type="button"
                  onClick={resetHydrationProgress}
                  className="compact-inline-chip inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold text-[#0b698e] bg-white hover:bg-[#e6f6fc] border border-[#0d7da8]/30 cursor-pointer"
                >
                  <ResetIcon className="w-3 h-3" />
                  <span>Reset Checklist</span>
                </button>
              )}
            </div>

            <div className="space-y-3.5">
              {hydrationStagesGrouped.map((stage) => {
                const stageEnabled = stage.steps.filter((s) => s.enabled);
                const stageDone = stageEnabled.filter((s) => Boolean(checkedTags[s.tagId])).length;

                return (
                  <div
                    key={stage.id}
                    className="pogo-glass-card overflow-hidden border border-[#0d7da8]/20"
                  >
                    <div className="px-3.5 py-2.5 bg-[#dff5fc]/75 border-b border-white/85 flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-display text-xs sm:text-sm font-extrabold text-[#0b698e] uppercase tracking-wide">
                          {stage.title}
                        </h3>
                        <p className="text-[11px] text-[#285d72] font-medium">{stage.subtitle}</p>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-white/95 text-[#1b4d60] border border-white shadow-2xs shrink-0">
                        {stageDone}/{stageEnabled.length}
                      </span>
                    </div>

                    <ol className="divide-y divide-[#0d7da8]/10">
                      {stage.steps.map((step) => {
                        const swatch = COLOR_SWATCHES[step.color] || COLOR_SWATCHES.grey;
                        const isChecked = Boolean(checkedTags[step.tagId]);

                        return (
                          <li
                            key={step.tagId}
                            className={`px-3.5 py-2.5 flex flex-col gap-2 transition-colors ${
                              !step.enabled
                                ? 'bg-[#e6f6fc]/35 opacity-60'
                                : isChecked
                                  ? 'bg-emerald-50/75'
                                  : 'hover:bg-white/60'
                            }`}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <label className="flex items-center gap-2.5 min-w-0 cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  disabled={!step.enabled}
                                  onChange={() => toggleCheckedTag(step.tagId)}
                                  aria-label={`Mark ${step.tagName} hydrated`}
                                  className="h-4 w-4 rounded border-[#0d7da8]/40 text-[#2b9e66] focus:ring-[#0d7da8] cursor-pointer disabled:cursor-not-allowed"
                                />
                                <span className="font-mono text-[11px] font-extrabold text-[#0b698e] w-6 shrink-0">
                                  {String(step.stepNumber).padStart(2, '0')}.
                                </span>
                                <span
                                  className={`w-2.5 h-2.5 rounded-full shrink-0 ${swatch.dot}`}
                                  aria-hidden="true"
                                />
                                <span
                                  className={`text-xs sm:text-sm font-extrabold truncate ${
                                    isChecked ? 'line-through text-[#2b7a55]' : 'text-[#123c4d]'
                                  }`}
                                >
                                  {step.tagName}
                                </span>
                                {step.tagHash && (
                                  <span
                                    className={`hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${swatch.badge}`}
                                  >
                                    {step.tagHash}
                                  </span>
                                )}
                                {step.optional && (
                                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-white/90 text-[#285d72] border border-[#0d7da8]/20">
                                    {step.enabled ? 'Optional' : 'Optional · Off'}
                                  </span>
                                )}
                              </label>
                            </div>

                            <div className="pl-6 sm:pl-9 flex flex-wrap items-center gap-1.5">
                              {step.queries.map((q) => {
                                const copyKey = `walk-${q.id}`;
                                const isCopied = copiedId === copyKey;
                                const showLabel = step.queries.length > 1;

                                return (
                                  <div
                                    key={q.id}
                                    className="inline-flex flex-wrap items-center gap-1 max-w-full"
                                  >
                                    <button
                                      type="button"
                                      onClick={() => triggerCopy(copyKey, q.query, true)}
                                      className={`compact-inline-chip inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold border shadow-2xs transition-colors cursor-pointer ${
                                        isCopied
                                          ? 'bg-[#2b9e66] text-white border-white'
                                          : q.isSecondary
                                            ? 'bg-white/95 hover:bg-white text-[#0b698e] border-[#0d7da8]/35'
                                            : 'bg-[#0d7da8] hover:bg-[#0b698e] text-white border-white/85'
                                      }`}
                                      aria-label={`Copy walkthrough query ${q.label} for ${step.tagName}`}
                                      title={q.query}
                                    >
                                      {isCopied ? (
                                        <CheckIcon className="w-3 h-3 shrink-0" />
                                      ) : (
                                        <CopyIcon className="w-3 h-3 shrink-0" />
                                      )}
                                      <span>
                                        {isCopied
                                          ? '✓ Copied'
                                          : showLabel
                                            ? `Copy ${q.label}`
                                            : 'Copy'}
                                      </span>
                                    </button>

                                    {typeof onLoadQuery === 'function' && (
                                      <button
                                        type="button"
                                        onClick={() => onLoadQuery(q.query)}
                                        className="compact-inline-chip inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-extrabold bg-white/90 hover:bg-white text-[#0b698e] border border-[#0d7da8]/25 cursor-pointer"
                                        aria-label={`Load walkthrough query ${q.label} for ${step.tagName} in Builder`}
                                        title="Load in Pokédex Builder"
                                      >
                                        <BuilderIcon className="w-3 h-3" />
                                        <span className="hidden sm:inline">Builder</span>
                                      </button>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </li>
                        );
                      })}
                    </ol>
                  </div>
                );
              })}
            </div>
          </div>
        )}
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
                    className={`compact-inline-chip inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold border shadow-2xs transition-colors cursor-pointer ${
                      copiedId === `ns-${ns.id}`
                        ? 'bg-[#2b9e66] text-white border-white'
                        : 'bg-white/95 hover:bg-white text-[#0b698e] border-[#0d7da8]/30'
                    }`}
                    title="Copy namespace umbrella search"
                  >
                    {copiedId === `ns-${ns.id}` ? (
                      <CheckIcon className="w-3 h-3" />
                    ) : (
                      <CopyIcon className="w-3 h-3" />
                    )}
                    <span className="truncate max-w-[180px] sm:max-w-[260px]">
                      {copiedId === `ns-${ns.id}` ? '✓ Copied' : nsHashes.join(',')}
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
                  const hydrationQueries = buildTagHydrationQueries(tag.id, tagMap, metaSnapshot);
                  const synergyQueries = resolveSynergyQueries(tag, hashPreview);

                  return (
                    <div
                      key={tag.id}
                      className={`p-4 sm:px-5 transition-colors space-y-3 ${
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
                                className={`compact-inline-chip inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold border transition-colors cursor-pointer ${
                                  copiedId === `tag-${tag.id}`
                                    ? 'bg-[#2b9e66] text-white border-white'
                                    : swatch.badge
                                }`}
                                title={`Copy ${hashPreview}`}
                                aria-label={`Copy tag search ${hashPreview}`}
                              >
                                {copiedId === `tag-${tag.id}` ? (
                                  <CheckIcon className="w-3 h-3" />
                                ) : (
                                  <CopyIcon className="w-3 h-3 opacity-80" />
                                )}
                                <span>
                                  {copiedId === `tag-${tag.id}` ? '✓ Copied' : hashPreview}
                                </span>
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

                        {/* Right: Placement Criteria + 1-Tap Copyable Post-Tagging Synergy */}
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <p className="text-xs sm:text-[13px] text-[#1b4d60] leading-relaxed font-medium">
                            {tag.purpose}
                          </p>
                          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                            <span className="text-[#285d72] font-extrabold uppercase tracking-wide text-[10px]">
                              Synergy:
                            </span>
                            {synergyQueries.map((synQuery, synIdx) => {
                              const synKey = `syn-${tag.id}-${synIdx}`;
                              const synCopied = copiedId === synKey;
                              return (
                                <button
                                  key={synKey}
                                  type="button"
                                  onClick={() => triggerCopy(synKey, synQuery, true)}
                                  className={`compact-inline-chip inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-mono font-bold transition-colors cursor-pointer border ${
                                    synCopied
                                      ? 'bg-[#2b9e66] text-white border-white'
                                      : 'bg-[#073b50] hover:bg-[#0b506b] text-[#dff6fc] border-[#0d7da8]/40'
                                  }`}
                                  title={`Copy synergy search: ${synQuery}`}
                                  aria-label={`Copy synergy search ${synQuery}`}
                                >
                                  {synCopied ? (
                                    <CheckIcon className="w-3 h-3 shrink-0" />
                                  ) : (
                                    <CopyIcon className="w-3 h-3 shrink-0 opacity-80" />
                                  )}
                                  <span>{synCopied ? '✓ Copied' : synQuery}</span>
                                </button>
                              );
                            })}
                            <span className="text-[#285d72] font-mono font-bold ml-0.5">
                              Drag #{tag.dragOrder}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Hydrate in Pokémon GO Row */}
                      {hydrationQueries.length > 0 && (
                        <div className="rounded-2xl bg-[#dff5fc]/55 border border-[#0d7da8]/20 p-3 space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-display text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-[#0b698e]">
                              Hydrate in Pokémon GO
                            </span>
                            <span className="text-[10px] font-semibold text-[#285d72]">
                              Paste into PoGO → Select All → Apply{' '}
                              <strong className="text-[#123c4d]">{tag.name || tag.defaultName}</strong>
                            </span>
                          </div>

                          <div className="space-y-2">
                            {hydrationQueries.map((item) => {
                              const copyKey = `hydrate-${item.id}`;
                              const isCopied = copiedId === copyKey;
                              return (
                                <div key={item.id} className="space-y-1">
                                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                    <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-1.5">
                                      <span
                                        className={`self-start sm:self-auto shrink-0 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${
                                          item.isSecondary
                                            ? 'bg-white/90 text-[#285d72] border-[#0d7da8]/25'
                                            : 'bg-[#0d7da8]/12 text-[#0b698e] border-[#0d7da8]/30'
                                        }`}
                                      >
                                        {item.label}
                                      </span>
                                      <code className="block flex-1 min-w-0 px-2.5 py-1.5 rounded-xl bg-[#073b50] text-[#dff6fc] font-mono text-[11px] sm:text-xs font-bold break-all select-all max-h-20 overflow-y-auto shadow-inner">
                                        {item.query}
                                      </code>
                                    </div>

                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <button
                                        type="button"
                                        onClick={() => triggerCopy(copyKey, item.query, true)}
                                        className={`compact-inline-chip inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold border shadow-2xs transition-all cursor-pointer ${
                                          isCopied
                                            ? 'bg-[#2b9e66] text-white border-white'
                                            : 'bg-[#0d7da8] hover:bg-[#0b698e] text-white border-white/85'
                                        }`}
                                        aria-label={`Copy hydration query ${item.label} for ${tag.defaultName}`}
                                      >
                                        {isCopied ? (
                                          <CheckIcon className="w-3.5 h-3.5" />
                                        ) : (
                                          <CopyIcon className="w-3.5 h-3.5" />
                                        )}
                                        <span>{isCopied ? '✓ Copied' : 'Copy'}</span>
                                      </button>

                                      {typeof onLoadQuery === 'function' && (
                                        <button
                                          type="button"
                                          onClick={() => onLoadQuery(item.query)}
                                          className="compact-inline-chip inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-extrabold bg-white/95 hover:bg-white text-[#0b698e] border border-[#0d7da8]/30 shadow-2xs transition-colors cursor-pointer"
                                          aria-label={`Load hydration query ${item.label} for ${tag.defaultName} in Builder`}
                                        >
                                          <BuilderIcon className="w-3.5 h-3.5" />
                                          <span>Builder</span>
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  {item.note && (
                                    <p className="text-[11px] text-[#285d72] font-medium pl-1">
                                      Tip: {item.note}
                                    </p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Inline Real-Time Collision Linter Feedback */}
                      {tag.enabled && (hasErrors || hasWarnings) && (
                        <div className="mt-2 space-y-1.5 pl-0 md:pl-11">
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
