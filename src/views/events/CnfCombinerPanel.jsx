import React from 'react';
import { useCnfCombinerController } from '../../controllers/events/useCnfCombinerController';
import SearchRecipeCard from '../shared/SearchRecipeCard';

const CNF_PRESETS = [
  {
    id: 'crown-jewels',
    label: 'Preset: Crown Jewels',
    branches: [
      '4*',
      'gigantamax',
      'shiny&shadow',
      'shiny&legendary',
      'shiny&mythical',
      'shiny&ultrabeast',
      'shiny&locationbackground',
    ],
  },
  {
    id: 'trophy-legendaries',
    label: 'Preset: Trophy Legendaries',
    branches: ['shiny&legendary', '4*&legendary', 'locationbackground&legendary'],
  },
  {
    id: 'shadow-pvp',
    label: 'Preset: Shadow 3*-4* OR PvP Bulk',
    branches: ['3*,4*&shadow', '0-1attack&3-4defense&3-4hp&cp-2500'],
  },
];

function CnfCombinerPanel({ untaggedOnly, onLoadSearchString }) {
  const {
    cnfBranches,
    setCnfBranches,
    newBranchInput,
    setNewBranchInput,
    addCnfBranch,
    removeCnfBranch,
    customCompiledCnfString,
    cnfClauseCount,
    cnfTruncated,
    cnfTruncatedReason,
  } = useCnfCombinerController({ untaggedOnly });

  return (
    <div className="pt-3.5 space-y-3 mwg-card-container">
      <div className="pogo-summary-card p-4 space-y-3 text-xs">
        <div>
          <h3 className="font-display text-sm sm:text-base font-extrabold uppercase tracking-wider text-[#0c6c91]">
            🔗 AND (&amp;) / OR (,) Rule Combiner (PoGO CNF Compiler)
          </h3>
          <p className="text-[11px] text-[#285d72] leading-snug mt-0.5 font-medium">
            In Pokémon GO, <code className="font-mono font-bold text-[#123c4d]">,</code> (OR) has{' '}
            <strong>higher precedence</strong> than{' '}
            <code className="font-mono font-bold text-[#123c4d]">&amp;</code> (AND) — writing{' '}
            <code className="font-mono text-rose-700">A,B&amp;C</code> evaluates as{' '}
            <code className="font-mono text-rose-700">(A OR B) AND C</code>. Add independent
            AND-branches below and this compiler distributes OR over AND (
            <code className="font-mono font-bold text-[#0b698e]">A,B &amp; A,C</code>) with
            superset absorption and tautology elimination so every branch surfaces accurately.
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {CNF_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => setCnfBranches(preset.branches)}
              className="compact-inline-chip pogo-pill min-h-[28px] px-3 py-0.5 text-[10px] cursor-pointer"
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-1.5 bg-white/80 p-2.5 rounded-2xl border border-white">
          {cnfBranches.map((br, idx) => (
            <React.Fragment key={`${br}-${idx}`}>
              {idx > 0 && <span className="text-[10px] font-black text-[#0b698e] px-0.5">OR</span>}
              <span className="inline-flex items-center gap-1 bg-[#dff4fb] border border-[#0d7da8]/30 rounded-full px-2.5 py-0.5 font-mono text-[11px] font-bold text-[#123c4d]">
                <span>({br})</span>
                <button
                  type="button"
                  onClick={() => removeCnfBranch(idx)}
                  aria-label={`Remove branch ${br}`}
                  className="compact-inline-chip text-rose-600 hover:text-rose-800 font-black ml-0.5 cursor-pointer"
                >
                  ✕
                </button>
              </span>
            </React.Fragment>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newBranchInput}
            onChange={(e) => setNewBranchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newBranchInput.trim()) {
                e.preventDefault();
                addCnfBranch();
              }
            }}
            placeholder="Add branch (e.g. shiny&costume or 4*)"
            aria-label="Add OR branch with AND conditions"
            className="flex-1 min-w-0 px-4 py-2 pogo-search-pill text-base sm:text-xs font-mono font-bold text-[#123c4d]"
          />
          <button
            type="button"
            onClick={addCnfBranch}
            className="compact-inline-chip pogo-pill-active min-h-[36px] px-4 py-1.5 text-xs uppercase cursor-pointer shrink-0"
          >
            + OR Branch
          </button>
        </div>

        {cnfTruncated && (
          <div
            role="alert"
            className="px-3 py-2 rounded-2xl bg-amber-50 border border-amber-300 text-[11px] font-bold text-amber-950"
          >
            ⚠️ {cnfTruncatedReason || 'Combinatorial limit reached — simplify or split your OR branches into separate queries.'}
          </div>
        )}

        <SearchRecipeCard
          badge={`${cnfClauseCount} CNF AND-Clauses`}
          title="Compiled Pokémon GO CNF Search String"
          subtitle="Distributes OR (,) over AND (&) and absorbs redundant supersets."
          searchString={customCompiledCnfString}
          accent="teal"
          onLoadToBar={onLoadSearchString}
        />
      </div>
    </div>
  );
}

export default React.memo(CnfCombinerPanel);
