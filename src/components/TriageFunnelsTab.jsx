import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  AGE_SCOPES,
  SAFETY_SHIELD_DEFINITIONS,
  createDefaultSafetyShields,
  buildTriageFunnels,
} from '../utils/triageFunnels';
import { TYPES, validateSearchString } from '../utils/searchUtils';
import { PogoTypeIcon } from './ui/PogoDesignSystem';

const MODE_TABS = [
  { id: 'modeA', shortLabel: 'Mode A', label: 'Post-Catch Triage', badge: '7 steps' },
  { id: 'modeB', shortLabel: 'Mode B', label: 'Deep Cleanout', badge: '10 steps' },
  { id: 'modeC', shortLabel: 'Mode C', label: 'Competitive Meta', badge: 'PvP · PvE · Max' },
  { id: 'modeD', shortLabel: 'Mode D', label: 'Event & Trade Ops', badge: '11 routines' },
];

const SHIELD_CATEGORIES = [
  { id: 'lock', label: 'Core Locks' },
  { id: 'rarity', label: 'Rarity & Events' },
  { id: 'mechanics', label: 'Special Mechanics' },
  { id: 'investment', label: 'Move Investment' },
  { id: 'size', label: 'Sizes' },
  { id: 'iv', label: 'IV Protections' },
];

const TAG_COLOR_CLASSES = {
  purple: 'bg-purple-100/90 text-[#5d3696] border-purple-300/80',
  yellow: 'bg-amber-100/90 text-amber-900 border-amber-300/90',
  blue: 'bg-[#dff4fb] text-[#0b698e] border-[#0d7da8]/30',
  red: 'bg-rose-100/90 text-rose-800 border-rose-300/80',
  pink: 'bg-pink-100/90 text-pink-800 border-pink-300/80',
  green: 'bg-emerald-100/90 text-emerald-900 border-emerald-300/80',
  orange: 'bg-orange-100/90 text-orange-900 border-orange-300/80',
  black: 'bg-[#123c4d] text-white border-[#0b698e]',
  grey: 'bg-white/90 text-[#285d72] border-[#0d7da8]/25',
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

function formatGeneratedAt(iso) {
  if (!iso) return 'Bundled Snapshot';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function extractReferencedTags(step, resolvedTags) {
  if (!Array.isArray(resolvedTags) || resolvedTags.length === 0) return [];
  const haystack = `${step.action || ''} ${step.query || ''} ${(step.subQueries || [])
    .map((sq) => sq.query)
    .join(' ')}`.toLowerCase();

  const matches = [];
  const seen = new Set();
  for (const tag of resolvedTags) {
    if (!tag.enabled || !tag.name) continue;
    const lowerName = tag.name.trim().toLowerCase();
    if (!lowerName || seen.has(tag.id)) continue;
    if (haystack.includes(lowerName) || haystack.includes(`#${lowerName}`)) {
      seen.add(tag.id);
      matches.push(tag);
    }
  }
  return matches.slice(0, 6);
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

function ShieldIcon({ className = 'w-4 h-4' }) {
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
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function BoltIcon({ className = 'w-4 h-4' }) {
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
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
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

function ValidationBadge({ validation }) {
  const { valid, errors, warnings, charCount } = validation;
  const hasWarnings = warnings.length > 0;
  const charTone =
    charCount > 5000
      ? 'text-rose-800 border-rose-300 bg-rose-50'
      : charCount > 4000
        ? 'text-amber-900 border-amber-300 bg-amber-50'
        : 'text-[#0b698e] border-[#0d7da8]/25 bg-[#e6f6fc]';

  return (
    <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
      <span className={`px-2 py-0.5 rounded-full border font-mono font-bold ${charTone}`}>
        {charCount.toLocaleString()} chars
      </span>
      {!valid ? (
        <span
          className="px-2 py-0.5 rounded-full border border-rose-300 bg-rose-100 text-rose-800 font-extrabold"
          title={errors.map((e) => e.message).join(' | ')}
        >
          {errors.length} {errors.length === 1 ? 'Error' : 'Errors'}
        </span>
      ) : hasWarnings ? (
        <span
          className="px-2 py-0.5 rounded-full border border-amber-300 bg-amber-100 text-amber-900 font-extrabold"
          title={warnings.map((w) => w.message).join(' | ')}
        >
          {warnings.length} {warnings.length === 1 ? 'Warning' : 'Warnings'}
        </span>
      ) : (
        <span className="px-2 py-0.5 rounded-full border border-emerald-300 bg-emerald-50 text-[#1d7a4d] font-extrabold">
          Verified ✓
        </span>
      )}
    </div>
  );
}

function QueryActionRow({
  copyKey,
  query,
  isTrash = false,
  copiedKey,
  onCopy,
  onLoadQuery,
  compact = false,
}) {
  const validation = useMemo(
    () => validateSearchString(query, { isTrashContext: isTrash }),
    [query, isTrash]
  );
  const isCopied = copiedKey === copyKey;

  return (
    <div className="space-y-2">
      <div
        className={`rounded-2xl bg-[#073b50] border ${
          !validation.valid
            ? 'border-rose-400 ring-1 ring-rose-400/50'
            : isTrash
              ? 'border-amber-300/70'
              : 'border-[#0d7da8]/40'
        } ${compact ? 'p-2.5' : 'p-3'} shadow-inner`}
      >
        <code className="block font-mono text-xs sm:text-[13px] text-[#dff6fc] break-all leading-relaxed select-all max-h-28 overflow-y-auto font-bold">
          {query || '—'}
        </code>
      </div>

      {(!validation.valid || validation.warnings.length > 0) && (
        <div className="space-y-1">
          {validation.errors.map((err, idx) => (
            <p
              key={`e-${idx}`}
              role="alert"
              className="text-xs text-rose-800 bg-rose-50 border border-rose-300 rounded-xl px-2.5 py-1.5 font-semibold"
            >
              {err.message}
            </p>
          ))}
          {validation.warnings.map((warn, idx) => (
            <p
              key={`w-${idx}`}
              className="text-xs text-amber-900 bg-amber-50 border border-amber-300 rounded-xl px-2.5 py-1.5 font-semibold"
            >
              {warn.message}
            </p>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <ValidationBadge validation={validation} />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onCopy(copyKey, query)}
            disabled={!query}
            className={`compact-inline-chip inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all border shadow-2xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
              isCopied
                ? 'bg-[#2b9e66] text-white border-white'
                : 'bg-[#0d7da8] hover:bg-[#0b698e] text-white border-white/85'
            }`}
            aria-label={`Copy search string ${copyKey}`}
          >
            {isCopied ? <CheckIcon /> : <CopyIcon />}
            <span>{isCopied ? 'Copied' : 'Copy'}</span>
          </button>
          {typeof onLoadQuery === 'function' && (
            <button
              type="button"
              onClick={() => onLoadQuery(query)}
              disabled={!query}
              className="compact-inline-chip inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold bg-white/95 hover:bg-white text-[#0b698e] border border-[#0d7da8]/30 shadow-2xs transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label={`Load search string ${copyKey} in Builder`}
            >
              <BuilderIcon />
              <span>Load in Builder</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function StepCard({ step, resolvedTags, copiedKey, onCopy, onLoadQuery, compact = false }) {
  const referencedTags = useMemo(
    () => extractReferencedTags(step, resolvedTags),
    [step, resolvedTags]
  );

  return (
    <article
      className={`pogo-glass-card transition-colors ${
        step.isTrash ? 'ring-1 ring-amber-400/75' : ''
      } ${compact ? 'p-3.5' : 'p-4 sm:p-5'} space-y-3`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-start gap-2.5 min-w-0">
          <span
            className={`shrink-0 px-2.5 py-0.5 rounded-full text-xs font-extrabold tracking-wide shadow-2xs ${
              step.isTrash
                ? 'bg-amber-400 text-[#123c4d]'
                : 'bg-[#0d7da8] text-white'
            }`}
          >
            {step.id}
          </span>
          <div className="min-w-0">
            <h4 className="font-display text-sm sm:text-base font-extrabold text-[#123c4d] leading-snug">
              {step.title}
            </h4>
            {step.action && (
              <p className="text-xs sm:text-[13px] text-[#285d72] mt-1 leading-relaxed font-medium">
                {step.action}
              </p>
            )}
          </div>
        </div>

        {step.isTrash && (
          <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-300">
            Transfer Step
          </span>
        )}
      </div>

      {referencedTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#285d72] mr-0.5">
            Tags:
          </span>
          {referencedTags.map((tag) => (
            <span
              key={tag.id}
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-mono font-bold border ${
                TAG_COLOR_CLASSES[tag.color] || TAG_COLOR_CLASSES.grey
              }`}
            >
              #{tag.name.trim().toLowerCase()}
            </span>
          ))}
        </div>
      )}

      <QueryActionRow
        copyKey={step.id}
        query={step.query}
        isTrash={step.isTrash}
        copiedKey={copiedKey}
        onCopy={onCopy}
        onLoadQuery={onLoadQuery}
        compact={compact}
      />

      {Array.isArray(step.subQueries) && step.subQueries.length > 0 && (
        <div className="pt-3 mt-2 border-t border-[#0d7da8]/15 space-y-2.5">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#0c6c91]">
            Companion Queries
          </div>
          {step.subQueries.map((sub, index) => {
            const subIsTrash = sub.isTrash !== undefined ? sub.isTrash : step.isTrash;
            return (
              <div
                key={`${step.id}-sub-${index}`}
                className="rounded-2xl bg-[#eef9fd]/90 border border-white p-3 space-y-2 shadow-2xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs font-extrabold text-[#123c4d]">{sub.label}</div>
                  {subIsTrash && (
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-400 text-[#123c4d]">
                      Purge
                    </span>
                  )}
                </div>
                <QueryActionRow
                  copyKey={`${step.id}-sub-${index}`}
                  query={sub.query}
                  isTrash={subIsTrash}
                  copiedKey={copiedKey}
                  onCopy={onCopy}
                  onLoadQuery={onLoadQuery}
                  compact
                />
              </div>
            );
          })}
        </div>
      )}
    </article>
  );
}

export function TriageFunnelsTab({ metaSnapshot, customTags, onLoadQuery }) {
  const [activeMode, setActiveMode] = useState('modeA');
  const [ageScope, setAgeScope] = useState('age0');
  const [pveType, setPveType] = useState('fire');
  const [safetyShields, setSafetyShields] = useState(createDefaultSafetyShields);
  const [shieldsOpen, setShieldsOpen] = useState(false);
  const [emergencyOpen, setEmergencyOpen] = useState(true);
  const [copiedKey, setCopiedKey] = useState(null);
  const copyTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  const handleCopy = useCallback((key, text) => {
    copyTextToClipboard(text).then((ok) => {
      if (!ok) return;
      setCopiedKey(key);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('pogo-copied-string', { detail: { text } }));
      }
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopiedKey(null), 1800);
    });
  }, []);

  const toggleShield = useCallback((shieldId) => {
    setSafetyShields((prev) => ({
      ...prev,
      [shieldId]: !prev[shieldId],
    }));
  }, []);

  const resetShields = useCallback(() => {
    setSafetyShields(createDefaultSafetyShields());
  }, []);

  const enabledShieldCount = useMemo(
    () => SAFETY_SHIELD_DEFINITIONS.filter((d) => safetyShields[d.id]).length,
    [safetyShields]
  );

  const missingCoreLock = !safetyShields.untagged || !safetyShields.favorite;

  const funnels = useMemo(
    () =>
      buildTriageFunnels(metaSnapshot, customTags?.tagMap, {
        ageScope,
        safetyShields,
        pveType,
      }),
    [metaSnapshot, customTags?.tagMap, ageScope, safetyShields, pveType]
  );

  const resolvedTags = customTags?.resolvedTags || [];
  const currentMode = funnels.modes[activeMode];

  return (
    <div className="space-y-5 pb-28 text-[#123c4d]">
      {/* Pinned 30-Second Mid-Event Emergency Dump Card */}
      <section
        aria-label="30-Second Mid-Event Emergency Dump"
        className="pogo-summary-card ring-2 ring-rose-400/60 bg-gradient-to-br from-rose-50/95 via-[#f4fcff]/95 to-amber-50/90 overflow-hidden"
      >
        <div className="p-4 sm:p-5 flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-rose-600 text-white border-2 border-white shadow-sm flex items-center justify-center shrink-0 mt-0.5">
              <BoltIcon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-rose-600 text-white shadow-2xs">
                  Pinned Quick Action
                </span>
                <span className="text-[11px] font-bold text-amber-900 bg-amber-100/90 border border-amber-300 px-2.5 py-0.5 rounded-full">
                  Tip: Transfer in batches of 50–100 to prevent client lag/crashes
                </span>
              </div>
              <h2 className="font-display text-base sm:text-lg font-extrabold text-[#123c4d] mt-1.5">
                {funnels.emergencyDump.title}
              </h2>
              <p className="text-xs sm:text-sm text-[#285d72] mt-0.5 leading-relaxed font-medium">
                {funnels.emergencyDump.subtitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setEmergencyOpen((v) => !v)}
            className="pogo-pill inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs uppercase cursor-pointer"
            aria-expanded={emergencyOpen}
          >
            <span>{emergencyOpen ? 'Collapse' : 'Show 3 Steps'}</span>
            <ChevronIcon open={emergencyOpen} />
          </button>
        </div>

        {emergencyOpen && (
          <div className="px-4 pb-4 sm:px-5 sm:pb-5 grid grid-cols-1 lg:grid-cols-3 gap-3">
            {funnels.emergencyDump.steps.map((step, idx) => (
              <div
                key={`emerg-${step.id}`}
                className="pogo-glass-card p-3.5 flex flex-col justify-between gap-2.5"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-rose-700">
                      <span className="w-5 h-5 rounded-full bg-rose-600 text-white inline-flex items-center justify-center text-[11px] font-black shadow-2xs">
                        {idx + 1}
                      </span>
                      <span>{step.id}</span>
                    </span>
                    {step.isTrash && (
                      <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-400 text-[#123c4d]">
                        Purge
                      </span>
                    )}
                  </div>
                  <h3 className="font-display text-sm font-extrabold text-[#123c4d]">
                    {step.title}
                  </h3>
                  <p className="text-[11px] text-[#285d72] leading-relaxed font-medium">
                    {step.action}
                  </p>
                </div>

                <QueryActionRow
                  copyKey={`emergency-${step.id}`}
                  query={step.query}
                  isTrash={step.isTrash}
                  copiedKey={copiedKey}
                  onCopy={handleCopy}
                  onLoadQuery={onLoadQuery}
                  compact
                />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Interactive Controls Bar */}
      <section
        aria-label="Triage funnel controls"
        className="pogo-summary-card p-4 sm:p-5 space-y-3.5"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Age Scope Selector */}
          <div className="space-y-1.5">
            <div className="font-display text-[11px] font-extrabold uppercase tracking-wider text-[#0c6c91]">
              Event / Catch Age Scope (Mode A &amp; Emergency Dump)
            </div>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Age scope selector">
              {AGE_SCOPES.map((scope) => {
                const active = ageScope === scope.token;
                return (
                  <button
                    key={scope.id}
                    type="button"
                    onClick={() => setAgeScope(scope.token)}
                    className={`px-3.5 py-1.5 text-xs cursor-pointer ${
                      active ? 'pogo-pill-active' : 'pogo-pill'
                    }`}
                  >
                    {scope.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Safety Shields Collapsible Trigger */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShieldsOpen((v) => !v)}
              aria-expanded={shieldsOpen}
              className={`inline-flex items-center gap-2 px-4 py-2 text-xs cursor-pointer ${
                missingCoreLock
                  ? 'rounded-full bg-rose-600 text-white border-2 border-white font-extrabold shadow-sm'
                  : shieldsOpen
                    ? 'pogo-pill-active'
                    : 'pogo-pill'
              }`}
            >
              <ShieldIcon
                className={
                  missingCoreLock
                    ? 'w-4 h-4 text-white'
                    : shieldsOpen
                      ? 'w-4 h-4 text-white'
                      : 'w-4 h-4 text-[#2b9e66]'
                }
              />
              <span>
                Safety Shields ({enabledShieldCount}/{SAFETY_SHIELD_DEFINITIONS.length})
              </span>
              <ChevronIcon open={shieldsOpen} />
            </button>

            {enabledShieldCount < SAFETY_SHIELD_DEFINITIONS.length && (
              <button
                type="button"
                onClick={resetShields}
                className="pogo-pill px-3 py-2 text-xs text-[#0b698e] cursor-pointer"
              >
                Restore All
              </button>
            )}
          </div>
        </div>

        {missingCoreLock && (
          <div
            role="alert"
            className="rounded-2xl bg-rose-50 border border-rose-300 px-3.5 py-2.5 text-xs text-rose-900 font-semibold"
          >
            <strong>Warning:</strong> Disabling <code className="font-mono font-black">!#</code>{' '}
            (Untagged) or <code className="font-mono font-black">!favorite</code> removes Dual-Lock
            protection from E1/A6/A7/B3/B4 trash queries!
          </div>
        )}

        {/* Collapsible Safety Shield Chips */}
        {shieldsOpen && (
          <div className="pt-3 border-t border-[#0d7da8]/15 space-y-3">
            <p className="text-xs text-[#285d72] font-medium">
              Toggle shields to live-update{' '}
              <strong className="text-[#123c4d]">E1, A6, A7, B3, and B4</strong> mass-transfer strings.
              Double-moved protection uses{' '}
              <code className="font-mono font-bold text-[#0b698e]">@3mov</code> (never inverted{' '}
              <code className="font-mono font-bold text-rose-700">!@3mov</code>).
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {SHIELD_CATEGORIES.map((cat) => {
                const defs = SAFETY_SHIELD_DEFINITIONS.filter((d) => d.category === cat.id);
                if (defs.length === 0) return null;
                return (
                  <div
                    key={cat.id}
                    className="pogo-glass-card p-3 space-y-2"
                  >
                    <div className="font-display text-[10px] font-extrabold uppercase tracking-wider text-[#0c6c91]">
                      {cat.label}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {defs.map((def) => {
                        const on = Boolean(safetyShields[def.id]);
                        return (
                          <button
                            key={def.id}
                            type="button"
                            onClick={() => toggleShield(def.id)}
                            aria-pressed={on}
                            className={`compact-inline-chip px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all cursor-pointer text-left ${
                              on
                                ? 'bg-emerald-50 text-[#1d7a4d] border-emerald-400/80 hover:bg-emerald-100'
                                : 'bg-white/60 text-[#396d82] border-[#0d7da8]/20 line-through hover:bg-white'
                            }`}
                            title={def.token}
                          >
                            {def.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* 4 Mode Sub-Tabs */}
      <div
        role="tablist"
        aria-label="Triage funnel modes"
        className="grid grid-cols-2 lg:grid-cols-4 gap-2.5"
      >
        {MODE_TABS.map((tab) => {
          const isActive = activeMode === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveMode(tab.id)}
              className={`rounded-2xl px-4 py-3 text-left border-2 transition-all cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-b from-[#1189b8] to-[#0b749e] text-white border-white shadow-[0_6px_16px_rgba(9,108,146,0.28)]'
                  : 'pogo-glass-card text-[#123c4d] hover:bg-white'
              }`}
            >
              <div className="flex items-center justify-between gap-1.5">
                <span
                  className={`font-display text-[10px] font-extrabold uppercase tracking-wider ${
                    isActive ? 'text-[#dff6fc]' : 'text-[#0c6c91]'
                  }`}
                >
                  {tab.shortLabel}
                </span>
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                    isActive ? 'bg-white/20 text-white' : 'bg-[#e6f6fc] text-[#285d72]'
                  }`}
                >
                  {tab.badge}
                </span>
              </div>
              <div className="font-display text-xs sm:text-sm font-extrabold mt-1 truncate">
                {tab.label}
              </div>
            </button>
          );
        })}
      </div>

      {/* Mode Content */}
      <section aria-label={currentMode.title} className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 px-1">
          <div>
            <h3 className="font-display text-base sm:text-lg font-extrabold text-[#0b698e] uppercase tracking-wide">
              {currentMode.title}
            </h3>
            <p className="text-xs sm:text-sm text-[#1b4d60] mt-0.5 font-medium">
              {currentMode.subtitle}
            </p>
          </div>
          {customTags?.lintResults?.errorCount > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-rose-100 text-rose-800 border border-rose-300 shadow-2xs">
              {customTags.lintResults.errorCount} Tag Linter Error
              {customTags.lintResults.errorCount === 1 ? '' : 's'} — check Tag System tab
            </span>
          )}
        </div>

        {/* Standard Step List (Modes A, B, D) */}
        {activeMode !== 'modeC' && Array.isArray(currentMode.steps) && (
          <div className="space-y-3">
            {currentMode.steps.map((step) => (
              <StepCard
                key={step.id}
                step={step}
                resolvedTags={resolvedTags}
                copiedKey={copiedKey}
                onCopy={handleCopy}
                onLoadQuery={onLoadQuery}
              />
            ))}
          </div>
        )}

        {/* Mode C: 3 Competitive Sections (PvP, PvE with 18-Type Selector, Max Battles) */}
        {activeMode === 'modeC' && currentMode.sections && (
          <div className="space-y-7">
            {/* C1: PvP */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b-2 border-white/75">
                <h4 className="font-display text-sm sm:text-base font-extrabold text-[#0b698e] uppercase tracking-wider">
                  {currentMode.sections.pvp.title}
                </h4>
                <span className="text-[11px] font-mono font-bold text-[#1b4d60] bg-white/80 px-2.5 py-0.5 rounded-full border border-white">
                  Family-Expanded · Low-Atk vs XL Split
                </span>
              </div>
              <div className="space-y-3">
                {currentMode.sections.pvp.steps.map((step) => (
                  <StepCard
                    key={step.id}
                    step={step}
                    resolvedTags={resolvedTags}
                    copiedKey={copiedKey}
                    onCopy={handleCopy}
                    onLoadQuery={onLoadQuery}
                  />
                ))}
              </div>
            </div>

            {/* C2: PvE with 18-Type Attacking Selector */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b-2 border-white/75">
                <h4 className="font-display text-sm sm:text-base font-extrabold text-rose-700 uppercase tracking-wider">
                  {currentMode.sections.pve.title}
                </h4>
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="pve-type-select"
                    className="text-xs font-extrabold text-[#1b4d60]"
                  >
                    PvE Attacking Type:
                  </label>
                  <select
                    id="pve-type-select"
                    value={pveType}
                    onChange={(e) => setPveType(e.target.value)}
                    className="rounded-full bg-white border-2 border-white shadow-sm px-3.5 py-1.5 text-xs font-extrabold text-[#123c4d] capitalize focus:outline-none focus:border-[#0d7da8] cursor-pointer"
                  >
                    {TYPES.map((typeName) => (
                      <option key={typeName} value={typeName} className="capitalize">
                        {typeName.charAt(0).toUpperCase() + typeName.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Official PoGO Type Pill Selector */}
              <div
                className="flex flex-wrap gap-1.5"
                role="group"
                aria-label="PvE attacking type quick pills"
              >
                {TYPES.map((typeName) => {
                  const selected = pveType === typeName;
                  return (
                    <button
                      key={typeName}
                      type="button"
                      onClick={() => setPveType(typeName)}
                      aria-pressed={selected}
                      className={`compact-inline-chip inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold capitalize border-2 transition-all cursor-pointer ${
                        selected
                          ? 'bg-[#0d7da8] text-white border-white shadow-sm'
                          : 'bg-white/85 text-[#1b4d60] border-white/90 hover:bg-white'
                      }`}
                    >
                      <span
                        className={`w-4 h-4 rounded-full inline-flex items-center justify-center text-white bg-type-${typeName}`}
                      >
                        <PogoTypeIcon type={typeName} className="w-2.5 h-2.5" />
                      </span>
                      <span>{typeName}</span>
                    </button>
                  );
                })}
              </div>

              <div className="space-y-3">
                {currentMode.sections.pve.steps.map((step) => (
                  <StepCard
                    key={step.id}
                    step={step}
                    resolvedTags={resolvedTags}
                    copiedKey={copiedKey}
                    onCopy={handleCopy}
                    onLoadQuery={onLoadQuery}
                  />
                ))}
              </div>
            </div>

            {/* C3: Max Battles */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b-2 border-white/75">
                <h4 className="font-display text-sm sm:text-base font-extrabold text-[#7c52b5] uppercase tracking-wider">
                  {currentMode.sections.maxBattles.title}
                </h4>
                <span className="text-[11px] font-mono font-bold text-[#5d3696] bg-white/85 px-2.5 py-0.5 rounded-full border border-white">
                  {metaSnapshot?.maxBattles?.fastMoves500ms?.length || 25} Verified 0.5s Fast Moves
                </span>
              </div>
              <div className="space-y-3">
                {currentMode.sections.maxBattles.steps.map((step) => (
                  <StepCard
                    key={step.id}
                    step={step}
                    resolvedTags={resolvedTags}
                    copiedKey={copiedKey}
                    onCopy={handleCopy}
                    onLoadQuery={onLoadQuery}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Footer: Snapshot Freshness & Open-Source Attribution */}
      <footer className="pogo-summary-card px-4 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#285d72]">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#2b9e66]" aria-hidden="true" />
          <span className="font-extrabold text-[#123c4d]">Offline Meta Snapshot:</span>
          <time
            dateTime={metaSnapshot?.generatedAt || undefined}
            className="font-mono font-bold text-[#0b698e]"
          >
            {formatGeneratedAt(metaSnapshot?.generatedAt)}
          </time>
        </div>
        <div className="text-[11px] text-[#285d72] leading-relaxed font-medium">
          Data attribution: <span className="font-bold text-[#123c4d]">PvPoke</span> (MIT),{' '}
          <span className="font-bold text-[#123c4d]">PokéChespin</span> (MIT),{' '}
          <span className="font-bold text-[#123c4d]">Pokebattler</span>,{' '}
          <span className="font-bold text-[#123c4d]">pokemon-go-api</span>, &amp;{' '}
          <span className="font-bold text-[#123c4d]">Leidwesen/SearchPhrases</span>.
        </div>
      </footer>
    </div>
  );
}

export default TriageFunnelsTab;
