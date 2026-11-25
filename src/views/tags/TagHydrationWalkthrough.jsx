import React from 'react';
import { CORE_TAGS } from '../../models/tagModel';
import CopyActionButton from '../shared/CopyActionButton';
import { BuilderIcon, CheckIcon, CopyIcon } from '../shared/Icons';

function ResetIcon({ className = 'w-3 h-3' }) {
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

function ChevronIcon({ open, className = 'w-3.5 h-3.5' }) {
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

function TagHydrationWalkthrough({
  colorSwatches,
  walkthroughOpen,
  onToggleWalkthrough,
  hydrationStagesGrouped,
  enabledHydrationSteps,
  completedHydrationCount,
  hydrationPct,
  checkedTags,
  eventYearScope = 'ALL',
  availableEventYears = [],
  onSelectEventYear,
  onToggleCheckedTag,
  onResetProgress,
  onLoadQuery,
}) {
  return (
    <section
      aria-label={`Quick-Hydrate Your Box (${CORE_TAGS.length}-Tag Walkthrough)`}
      className="pogo-summary-card overflow-hidden border border-[#0d7da8]/25"
    >
      <button
        type="button"
        onClick={onToggleWalkthrough}
        aria-expanded={walkthroughOpen}
        className="w-full px-4 py-3.5 sm:px-5 bg-gradient-to-r from-[#dff5fc]/95 via-[#e8f8fd]/90 to-[#e3f7ee]/85 hover:from-[#d4f0fa] hover:to-[#d8f3e6] transition-colors flex flex-wrap items-center justify-between gap-3 text-left cursor-pointer"
      >
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-display text-sm sm:text-base font-extrabold text-[#0b698e] uppercase tracking-wide">
              Quick-Hydrate Your Box ({CORE_TAGS.length}-Tag Walkthrough)
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-white/95 text-[#1d7a4d] border border-[#1d7a4d]/35 shadow-2xs">
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
              className="block h-full bg-[#1d7a4d] transition-all duration-300"
              style={{ width: `${hydrationPct}%` }}
            />
          </span>
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase bg-white/95 text-[#0b698e] border border-[#0d7da8]/30 shadow-2xs">
            <span>{walkthroughOpen ? 'Hide' : 'Open'}</span>
            <ChevronIcon open={walkthroughOpen} />
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
                onClick={onResetProgress}
                className="compact-inline-chip inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold text-[#0b698e] bg-white hover:bg-[#e6f6fc] border border-[#0d7da8]/30 cursor-pointer"
              >
                <ResetIcon />
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
                    <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                      {stage.id === 'stage_1_events' && typeof onSelectEventYear === 'function' && (
                        <div
                          className="flex items-center gap-1"
                          role="group"
                          aria-label="Filter Stage 1 event queries by year"
                        >
                          {['ALL', ...availableEventYears].map((yr) => {
                            const yrVal = String(yr);
                            const active = eventYearScope === yrVal;
                            return (
                              <button
                                key={yrVal}
                                type="button"
                                onClick={() => onSelectEventYear(yrVal)}
                                className={`compact-inline-chip px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase cursor-pointer border transition-colors ${
                                  active
                                    ? 'bg-[#7c52b5] text-white border-white shadow-2xs'
                                    : 'bg-white/90 hover:bg-white text-[#5d3696] border-purple-300/80'
                                }`}
                              >
                                {yrVal === 'ALL' ? 'All Years' : yrVal}
                              </button>
                            );
                          })}
                        </div>
                      )}
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-white/95 text-[#1b4d60] border border-white shadow-2xs shrink-0">
                        {stageDone}/{stageEnabled.length}
                      </span>
                    </div>
                  </div>

                  <ol className="divide-y divide-[#0d7da8]/10">
                    {stage.steps.map((step) => {
                      const swatch = colorSwatches[step.color] || colorSwatches.grey;
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
                                onChange={() => onToggleCheckedTag(step.tagId)}
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
                              const showLabel = step.queries.length > 1;
                              return (
                                <div
                                  key={q.id}
                                  className="inline-flex flex-wrap items-center gap-1 max-w-full"
                                >
                                  <CopyActionButton
                                    text={q.query}
                                    ariaLabel={`Copy walkthrough query ${q.label} for ${step.tagName}`}
                                    title={q.query}
                                    className={`compact-inline-chip inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold border shadow-2xs transition-colors ${
                                      q.isSecondary
                                        ? 'bg-white/95 hover:bg-white text-[#0b698e] border-[#0d7da8]/35'
                                        : 'bg-[#0d7da8] hover:bg-[#0b698e] text-white border-white/85'
                                    }`}
                                    idleContent={
                                      <>
                                        <CopyIcon />
                                        <span>{showLabel ? `Copy ${q.label}` : 'Copy'}</span>
                                      </>
                                    }
                                    copiedContent={
                                      <>
                                        <CheckIcon />
                                        <span>✓ Copied</span>
                                      </>
                                    }
                                  />

                                  {typeof onLoadQuery === 'function' && (
                                    <button
                                      type="button"
                                      onClick={() => onLoadQuery(q.query)}
                                      className="compact-inline-chip inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-extrabold bg-white/90 hover:bg-white text-[#0b698e] border border-[#0d7da8]/25 cursor-pointer"
                                      aria-label={`Load walkthrough query ${q.label} for ${step.tagName} in Builder`}
                                      title="Load in Pokédex Builder"
                                    >
                                      <BuilderIcon />
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
  );
}

export default React.memo(TagHydrationWalkthrough);
