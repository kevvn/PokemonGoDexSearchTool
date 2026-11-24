import React, { useId } from 'react';
import CopyActionButton from './CopyActionButton';

const ACCENT_STYLES = {
  teal: 'pogo-glass-card',
  amber: 'pogo-glass-card ring-1 ring-amber-300/70',
  purple: 'pogo-glass-card ring-1 ring-[#ab6ac8]/45',
  indigo: 'pogo-glass-card ring-1 ring-[#5090d6]/45',
  emerald: 'pogo-glass-card ring-1 ring-[#63bc5a]/50',
  rose: 'pogo-glass-card ring-1 ring-rose-300/75',
};

const BADGE_STYLES = {
  teal: 'bg-[#0d7da8] text-white',
  amber: 'bg-amber-400 text-[#123c4d]',
  purple: 'bg-[#8d52b5] text-white',
  indigo: 'bg-[#3b6fd4] text-white',
  emerald: 'bg-[#1d7a4d] text-white',
  rose: 'bg-rose-600 text-white',
};

function SearchRecipeCard({
  badge,
  title,
  tagSuggestion,
  subtitle,
  searchString,
  speciesIds = [],
  accent = 'teal',
  onLoadToBar,
  onSelectSpeciesInGrid,
  children,
}) {
  const inputId = useId();
  const accentClass = ACCENT_STYLES[accent] || 'pogo-glass-card';
  const badgeClass = BADGE_STYLES[accent] || 'bg-[#0d7da8] text-white';

  return (
    <div className={`p-3.5 space-y-2 ${accentClass}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1 space-y-0.5">
          <div className="flex flex-wrap items-center gap-1.5">
            {badge && (
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${badgeClass}`}>
                {badge}
              </span>
            )}
            {tagSuggestion && (
              <span className="px-2 py-0.5 rounded-full bg-[#dff4fb] text-[#0b698e] border border-[#0d7da8]/25 font-mono text-[10px] font-bold">
                #{tagSuggestion}
              </span>
            )}
          </div>
          <h4 className="font-display text-[13px] font-extrabold text-[#123c4d] leading-snug">{title}</h4>
          {subtitle && (
            <p className="text-[11px] text-[#285d72] font-medium leading-snug">{subtitle}</p>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {speciesIds.length > 0 && onSelectSpeciesInGrid && (
            <button
              type="button"
              onClick={() => onSelectSpeciesInGrid(speciesIds)}
              aria-label={`View ${speciesIds.length} species in Pokédex Grid`}
              className="compact-inline-chip pogo-pill min-h-[34px] px-2.5 py-1 text-[11px] cursor-pointer"
              title="Open species in Pokédex Grid"
            >
              🔍 {speciesIds.length}
            </button>
          )}
          <CopyActionButton
            targetId={inputId}
            ariaLabel={`Copy search string for ${title}`}
            className="compact-inline-chip pogo-pill-active min-h-[34px] px-3.5 py-1 text-[11px] uppercase"
            idleContent={
              <>
                <span aria-hidden="true">📋</span>
                <span>COPY</span>
              </>
            }
            copiedContent={
              <>
                <span aria-hidden="true">✓</span>
                <span>Copied</span>
              </>
            }
          />
        </div>
      </div>

      {children && <div>{children}</div>}

      <input
        id={inputId}
        type="text"
        readOnly
        value={searchString}
        onClick={(e) => {
          e.target.select();
          onLoadToBar?.(searchString);
        }}
        aria-label={`Search string for ${title}`}
        className="w-full font-mono text-base sm:text-[11px] font-bold bg-[#073b50] text-[#c6effa] px-3 py-1.5 rounded-full border border-[#0d7da8]/45 focus:ring-2 focus:ring-[#3bb4e0] truncate cursor-pointer"
      />
    </div>
  );
}

export default React.memo(SearchRecipeCard);
