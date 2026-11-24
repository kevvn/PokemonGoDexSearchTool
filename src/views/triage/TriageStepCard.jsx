import React, { useMemo } from 'react';
import { validateSearchString } from '../../models/searchEngine';
import CopyActionButton from '../shared/CopyActionButton';
import { BuilderIcon, CheckIcon, CopyIcon } from '../shared/Icons';

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

export function QueryActionRow({
  copyKey,
  query,
  isTrash = false,
  onLoadQuery,
  compact = false,
}) {
  const validation = useMemo(
    () => validateSearchString(query, { isTrashContext: isTrash }),
    [query, isTrash]
  );

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
          <CopyActionButton
            text={query}
            ariaLabel={`Copy search string ${copyKey}`}
            className="compact-inline-chip inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all border shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed bg-[#0d7da8] hover:bg-[#0b698e] text-white border-white/85"
            idleContent={
              <>
                <CopyIcon />
                <span>Copy</span>
              </>
            }
            copiedContent={
              <>
                <CheckIcon />
                <span>Copied</span>
              </>
            }
          />
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

function TriageStepCard({ step, resolvedTags, onLoadQuery, compact = false }) {
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
              step.isTrash ? 'bg-amber-400 text-[#123c4d]' : 'bg-[#0d7da8] text-white'
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

export default React.memo(TriageStepCard);
