import React, { useCallback, useId, useRef } from 'react';
import { useTriageFunnelsController } from '../../controllers/useTriageFunnelsController';
import { TYPES } from '../../models/searchEngine';
import { AGE_SCOPES, SAFETY_SHIELD_DEFINITIONS } from '../../models/triageFunnelModel';
import { PogoTypeIcon } from '../shared/PogoDesignSystem';
import CostumePikachuPanel from './CostumePikachuPanel';
import TriageStepCard, { QueryActionRow } from './TriageStepCard';

const MODE_TABS = [
  { id: 'modeA', shortLabel: 'Mode A', label: 'Post-Catch Triage', badge: '7 steps' },
  { id: 'modeB', shortLabel: 'Mode B', label: 'Deep Cleanout', badge: '10 steps' },
  { id: 'modeC', shortLabel: 'Mode C', label: 'Competitive Meta', badge: 'PvP · PvE · Max' },
  { id: 'modeD', shortLabel: 'Mode D', label: 'Event & Trade Ops', badge: '11 routines' },
  { id: 'modeE', shortLabel: 'Mode E', label: 'Costume Pikachu', badge: '7 steps · ≤6' },
];

const SHIELD_CATEGORIES = [
  { id: 'lock', label: 'Core Locks' },
  { id: 'rarity', label: 'Rarity & Events' },
  { id: 'mechanics', label: 'Special Mechanics' },
  { id: 'investment', label: 'Move Investment' },
  { id: 'size', label: 'Sizes' },
  { id: 'iv', label: 'IV Protections' },
];

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

function TriageFunnelsView({ metaSnapshot, customTagMap, customTags, onLoadQuery }) {
  const {
    activeMode,
    setActiveMode,
    ageScope,
    setAgeScope,
    pveType,
    setPveType,
    safetyShields,
    shieldsOpen,
    emergencyOpen,
    pikachuKeepCap,
    setPikachuKeepCap,
    pikachuYearSlice,
    setPikachuYearSlice,
    pikachuGender,
    setPikachuGender,
    pikachuIncludeFamily,
    togglePikachuIncludeFamily,
    enabledShieldCount,
    missingCoreLock,
    resolvedTags,
    tagErrorCount,
    funnels,
    toggleShield,
    resetShields,
    toggleShieldsPanel,
    toggleEmergencyPanel,
  } = useTriageFunnelsController({ metaSnapshot, customTagMap, customTags });

  const modeTabBaseId = useId();
  const modeTabRefs = useRef({});

  const handleModeTabKeyDown = useCallback(
    (e, idx) => {
      let nextIdx = null;
      if (e.key === 'ArrowRight') nextIdx = (idx + 1) % MODE_TABS.length;
      else if (e.key === 'ArrowLeft') nextIdx = (idx - 1 + MODE_TABS.length) % MODE_TABS.length;
      else if (e.key === 'Home') nextIdx = 0;
      else if (e.key === 'End') nextIdx = MODE_TABS.length - 1;
      if (nextIdx !== null) {
        e.preventDefault();
        const nextId = MODE_TABS[nextIdx].id;
        setActiveMode(nextId);
        modeTabRefs.current[nextId]?.focus();
      }
    },
    [setActiveMode]
  );

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
            onClick={toggleEmergencyPanel}
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
                    aria-pressed={active}
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

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={toggleShieldsPanel}
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
                      : 'w-4 h-4 text-[#1d7a4d]'
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
            protection from E1/A6/A7/B3/B4/P6/P7 trash queries!
          </div>
        )}

        {shieldsOpen && (
          <div className="pt-3 border-t border-[#0d7da8]/15 space-y-3">
            <p className="text-xs text-[#285d72] font-medium">
              Toggle shields to live-update{' '}
              <strong className="text-[#123c4d]">E1, A6, A7, B3, B4, P6, and P7</strong> mass-transfer
              strings. Double-moved protection uses{' '}
              <code className="font-mono font-bold text-[#0b698e]">@3mov</code> (never inverted{' '}
              <code className="font-mono font-bold text-rose-700">!@3mov</code>).
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {SHIELD_CATEGORIES.map((cat) => {
                const defs = SAFETY_SHIELD_DEFINITIONS.filter((d) => d.category === cat.id);
                if (defs.length === 0) return null;
                return (
                  <div key={cat.id} className="pogo-glass-card p-3 space-y-2">
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

      {/* 5 Mode Sub-Tabs */}
      <div
        role="tablist"
        aria-label="Triage funnel modes"
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5"
      >
        {MODE_TABS.map((tab, idx) => {
          const isActive = activeMode === tab.id;
          return (
            <button
              key={tab.id}
              id={`${modeTabBaseId}-tab-${tab.id}`}
              ref={(el) => {
                modeTabRefs.current[tab.id] = el;
              }}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`${modeTabBaseId}-panel`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => setActiveMode(tab.id)}
              onKeyDown={(e) => handleModeTabKeyDown(e, idx)}
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
      <section
        id={`${modeTabBaseId}-panel`}
        role="tabpanel"
        aria-labelledby={`${modeTabBaseId}-tab-${activeMode}`}
        className="space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 px-1">
          <div>
            <h3 className="font-display text-base sm:text-lg font-extrabold text-[#0b698e] uppercase tracking-wide">
              {currentMode.title}
            </h3>
            <p className="text-xs sm:text-sm text-[#1b4d60] mt-0.5 font-medium">
              {currentMode.subtitle}
            </p>
          </div>
          {tagErrorCount > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-rose-100 text-rose-800 border border-rose-300 shadow-2xs">
              {tagErrorCount} Tag Linter Error
              {tagErrorCount === 1 ? '' : 's'} — check Tag System tab
            </span>
          )}
        </div>

        {activeMode !== 'modeC' && activeMode !== 'modeE' && Array.isArray(currentMode.steps) && (
          <div className="space-y-3">
            {currentMode.steps.map((step) => (
              <TriageStepCard
                key={step.id}
                step={step}
                resolvedTags={resolvedTags}
                onLoadQuery={onLoadQuery}
              />
            ))}
          </div>
        )}

        {activeMode === 'modeE' && (
          <CostumePikachuPanel
            modeE={currentMode}
            resolvedTags={resolvedTags}
            onLoadQuery={onLoadQuery}
            keepCap={pikachuKeepCap}
            onKeepCapChange={setPikachuKeepCap}
            yearSlice={pikachuYearSlice}
            onYearSliceChange={setPikachuYearSlice}
            gender={pikachuGender}
            onGenderChange={setPikachuGender}
            includeFamily={pikachuIncludeFamily}
            onToggleIncludeFamily={togglePikachuIncludeFamily}
          />
        )}

        {activeMode === 'modeC' && currentMode.sections && (
          <div className="space-y-7">
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
                  <TriageStepCard
                    key={step.id}
                    step={step}
                    resolvedTags={resolvedTags}
                    onLoadQuery={onLoadQuery}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b-2 border-white/75">
                <h4 className="font-display text-sm sm:text-base font-extrabold text-rose-700 uppercase tracking-wider">
                  {currentMode.sections.pve.title}
                </h4>
                <div className="flex items-center gap-2">
                  <label htmlFor="pve-type-select" className="text-xs font-extrabold text-[#1b4d60]">
                    PvE Attacking Type:
                  </label>
                  <select
                    id="pve-type-select"
                    value={pveType}
                    onChange={(e) => setPveType(e.target.value)}
                    className="rounded-full bg-white border-2 border-white shadow-sm px-3.5 py-1.5 text-base sm:text-xs font-extrabold text-[#123c4d] capitalize focus:border-[#0d7da8] cursor-pointer"
                  >
                    {TYPES.map((typeName) => (
                      <option key={typeName} value={typeName} className="capitalize">
                        {typeName.charAt(0).toUpperCase() + typeName.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

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
                  <TriageStepCard
                    key={step.id}
                    step={step}
                    resolvedTags={resolvedTags}
                    onLoadQuery={onLoadQuery}
                  />
                ))}
              </div>
            </div>

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
                  <TriageStepCard
                    key={step.id}
                    step={step}
                    resolvedTags={resolvedTags}
                    onLoadQuery={onLoadQuery}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      <footer className="pogo-summary-card px-4 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#285d72]">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#1d7a4d]" aria-hidden="true" />
          <span className="font-extrabold text-[#123c4d]">
            {metaSnapshot?.isLiveSynced ? 'Live PvPoke Sync:' : 'Offline Meta Snapshot:'}
          </span>
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

export default React.memo(TriageFunnelsView);
