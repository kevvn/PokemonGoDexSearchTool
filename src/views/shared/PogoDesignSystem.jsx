import React from 'react';
import { REGION_STARTERS } from '../../data/speciesConstants';
import { getHomeSpriteUrl, getPixelSpriteUrl } from '../../models/spriteUrls';
import PokemonSprite from './PokemonSprite';

export function PogoTypeIcon({ type, className = 'w-6 h-6' }) {
  switch (type) {
    case 'normal':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <circle cx="12" cy="12" r="6.5" stroke="currentColor" strokeWidth="3.8" />
        </svg>
      );
    case 'fighting':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
          <path d="M7.5 9.5a1.5 1.5 0 0 1 3 0v1h.5V8.5a1.5 1.5 0 0 1 3 0v2h.5V9.5a1.5 1.5 0 0 1 3 0v4.2a5.8 5.8 0 0 1-5.8 5.8h-1.4A4.8 4.8 0 0 1 6 14.7v-2.2a1.5 1.5 0 0 1 1.5-1.5v-1.5Z" />
        </svg>
      );
    case 'flying':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
          <path d="M19.5 6.5c-3.6.3-6.7 1.8-8.8 4.2 1.8-.3 3.6-.2 5.3.2-2.2 1.1-4.2 2-6.2 2.4 1.3.4 2.7.5 4.2.3-2.1 1.6-4.6 2.5-7.5 2.4-.9 0-1.5-.7-1.3-1.6.8-4.4 5.4-8.1 14.3-7.9Z" />
        </svg>
      );
    case 'poison':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
          <path d="M12 5a6.5 6.5 0 0 0-6.5 6.3c0 2.3 1.2 4.3 3 5.4v1.5a1 1 0 0 0 1.6.8l.9-.7 1 .8 1-.8.9.7a1 1 0 0 0 1.6-.8v-1.5c1.8-1.1 3-3.1 3-5.4A6.5 6.5 0 0 0 12 5Zm-2.3 6.8a1.6 1.6 0 1 1 0-3.2 1.6 1.6 0 0 1 0 3.2Zm4.6 0a1.6 1.6 0 1 1 0-3.2 1.6 1.6 0 0 1 0 3.2Z" />
        </svg>
      );
    case 'ground':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
          <path d="M4.5 17.5 8 8.5h2.2l-3.5 9H4.5Zm4.3 0L12.5 8h4.2l2.8 9.5H8.8Z" />
        </svg>
      );
    case 'rock':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
          <path d="m10.5 6 5.8 1.2 2.2 4.6-4.7 5.7-6.3-1.1-2-4.6L10.5 6Zm4.8 3.2-1.8 4.9 3.1-3.6-1.3-1.3Z" />
        </svg>
      );
    case 'bug':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
          <path d="M9.2 5.2 10.6 7a4.6 4.6 0 0 1 2.8 0l1.4-1.8a.8.8 0 1 1 1.2 1l-1.1 1.4a5.5 5.5 0 0 1 2.6 4.8v1.1a5.5 5.5 0 0 1-4.8 5.4V11h-1.4v7.9a5.5 5.5 0 0 1-4.8-5.4v-1.1a5.5 5.5 0 0 1 2.6-4.8L8 6.2a.8.8 0 1 1 1.2-1Z" />
        </svg>
      );
    case 'ghost':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
          <path d="M12 5.5a6.5 6.5 0 0 0-6.5 6.5c0 3.7 2.8 6.5 6.5 6.5 1.8 0 3.3-.6 4.5-1.6-.9.2-1.9 0-2.5-.6 1.5-.8 2.5-2.4 2.5-4.3A6.5 6.5 0 0 0 12 5.5Zm-2.2 6.3a1.2 1.2 0 1 1 0-2.4 1.2 1.2 0 0 1 0 2.4Zm4.2 0a1.2 1.2 0 1 1 0-2.4 1.2 1.2 0 0 1 0 2.4Z" />
        </svg>
      );
    case 'steel':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
          <path d="M8.2 5.5h7.6l3.8 6.5-3.8 6.5H8.2L4.4 12l3.8-6.5Zm3.8 9.3a2.8 2.8 0 1 0 0-5.6 2.8 2.8 0 0 0 0 5.6Z" />
        </svg>
      );
    case 'fire':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
          <path d="M12.8 4.5c.4 2.5-.8 4.2-2.2 5.6-1.5 1.5-2.6 3-2.6 5.1A4.8 4.8 0 0 0 12.8 20a5.2 5.2 0 0 0 5.2-5.2c0-2.8-1.6-5.2-3.6-6.7-.2 1.4-.9 2.3-1.8 2.8.8-1.8 1.2-4 .2-6.4Z" />
        </svg>
      );
    case 'water':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
          <path d="M12 4.8S6.8 11 6.8 14.6a5.2 5.2 0 0 0 10.4 0C17.2 11 12 4.8 12 4.8Zm-1.8 11.8a2.6 2.6 0 0 1-1.6-2.5.7.7 0 0 1 1.4 0c0 .6.4 1.1.9 1.3a.7.7 0 0 1-.7 1.2Z" />
        </svg>
      );
    case 'grass':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
          <path d="M18.2 5.8c-6.8.2-11.4 3.8-11.7 9.4-.1 1.2.3 2.3.9 3.2l4.7-4.7a.8.8 0 0 1 1.1 1.1l-4.6 4.6c1 .5 2.2.7 3.5.5 5.4-.7 7.8-5.9 6.1-14.1Z" />
        </svg>
      );
    case 'electric':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
          <path d="M13.6 4.5 6.8 13h4.5l-1.1 6.5L17.2 11h-4.6l1-6.5Z" />
        </svg>
      );
    case 'psychic':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" className={className} aria-hidden="true">
          <path d="M12 12a1.8 1.8 0 1 0 1.8-1.8A3.6 3.6 0 0 0 10.2 14a5.4 5.4 0 0 0 5.4 5.4A7.2 7.2 0 0 0 19 6.8 7.5 7.5 0 0 0 6 12" />
        </svg>
      );
    case 'ice':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
          <path d="M12 4.2 14.2 8 12 11.2 9.8 8 12 4.2Zm0 8.6 2.2 3.2L12 19.8 9.8 16l2.2-3.2ZM4.8 9.5l4.3-.3 2.1 2.8-2.1 2.8-4.3-.3 1.7-2.5-1.7-2.5Zm14.4 0-1.7 2.5 1.7 2.5-4.3.3-2.1-2.8 2.1-2.8 4.3.3Z" />
        </svg>
      );
    case 'dragon':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
          <path d="M17.8 6.2c-3.5-.6-7.2.7-9.4 3.4L6 9.2l1.6 2.3c-.9 2-.6 4.4 1 6.1 1.7 1.8 4.5 2.2 6.8 1-1.9-.2-3.5-1.3-4.1-3 1.5.5 3.2.2 4.4-.8l-1.9-1.1 3.1-.9-1.7-1.6 3.4-1.3-.8-3.7Z" />
        </svg>
      );
    case 'dark':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
          <path d="M14.8 5.2a7 7 0 1 0 4 10.6A6 6 0 0 1 14.8 5.2Z" />
        </svg>
      );
    case 'fairy':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
          <path d="m12 4.5 2.1 5.4 5.4 2.1-5.4 2.1L12 19.5l-2.1-5.4L4.5 12l5.4-2.1L12 4.5Z" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth="3" />
        </svg>
      );
  }
}

export function PogoCategoryIcon({ name, className = 'w-6 h-6' }) {
  switch (name) {
    case 'caught':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className={className} aria-hidden="true">
          <circle cx="12" cy="13" r="6.5" />
          <path d="M5.6 13h12.8" />
          <circle cx="12" cy="13" r="2" fill="currentColor" />
          <path d="m8 5.2.6 1.4 1.4.6-1.4.6L8 9.2l-.6-1.4-1.4-.6 1.4-.6.6-1.4Zm8.5-.7.5 1.1 1.1.5-1.1.5-.5 1.1-.5-1.1-1.1-.5 1.1-.5.5-1.1Z" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'seen':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" className={className} aria-hidden="true">
          <path d="M8.5 9.5 6.2 5l3.6 2.8h3.4L16.8 5l-2.3 4.5a4.8 4.8 0 0 1 1.5 3.6c0 2.7-2 4.9-4.5 4.9S7 15.8 7 13.1c0-1.4.6-2.7 1.5-3.6Z" />
          <path d="m16 14.5 3-1.8-1 2.8 2-.2-3.2 2.4" />
        </svg>
      );
    case 'legendary':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
          <path d="M18.5 7 13 8.2l2.2-2.7-5.6 2.8-3.8 3.9 3.7-.3-2.5 2.6 4.8.2-1.3 2.5 5.4-1.8 2.6-3.4-2.4-.5L18.5 7Zm-6.8 4.4 2.1-.6-.9 1.6-1.2-1Z" />
        </svg>
      );
    case 'mythical':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
          <path d="M13 6.2a2.8 2.8 0 0 0-2.8 2.8c0 1 .5 1.9 1.3 2.4-.8 1-1.2 2.3-1 3.6l-.8 3h1.6l.6-2.1h1.2l.6 2.1h1.6l-.8-3c.2-1.3-.2-2.6-1-3.6.8-.5 1.3-1.4 1.3-2.4A2.8 2.8 0 0 0 13 6.2Zm-4.8 1.6c-1.5.9-2 2.9-.8 4.5.8 1.1 1.8 1.8 2.6 2.2l.5-1.1c-.7-.4-1.5-.9-2.1-1.8-.7-1-.4-2.3.5-2.9l-.7-.9Z" />
        </svg>
      );
    case 'shiny':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
          <path d="m10.5 5 1.6 4.1L16.2 10.7l-4.1 1.6-1.6 4.1-1.6-4.1-4.1-1.6 4.1-1.6L10.5 5Zm6.8 8.2.9 2.2 2.2.9-2.2.9-.9 2.2-.9-2.2-2.2-.9 2.2-.9.9-2.2Z" />
        </svg>
      );
    case 'lucky':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
          <circle cx="9.5" cy="9.5" r="2.6" />
          <circle cx="14.5" cy="9.5" r="2.6" />
          <circle cx="9.5" cy="14.5" r="2.6" />
          <circle cx="14.5" cy="14.5" r="2.6" />
        </svg>
      );
    case 'shadow':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
          <path d="M12.4 4.5c.5 2.4-.9 4-2.1 5.4-1.4 1.5-2.3 2.9-2.3 4.8A4.5 4.5 0 0 0 12.5 19a4.8 4.8 0 0 0 4.8-4.8c0-2.6-1.4-4.8-3.3-6.2-.2 1.2-.8 2-1.6 2.5.7-1.6 1-3.6 0-6Z" />
        </svg>
      );
    case 'favorite':
    case '4*':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
          <path d="m12 4.8 2.2 4.6 5.1.7-3.7 3.6.9 5.1-4.5-2.4-4.5 2.4.9-5.1-3.7-3.6 5.1-.7L12 4.8Z" />
        </svg>
      );
    case 'funnel':
      return (
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" className={className} aria-hidden="true">
          <path d="M3 5.5h14M5.8 10h8.4M8.5 14.5h3" />
        </svg>
      );
    case 'pokedex':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className={className} aria-hidden="true">
          <rect x="6.5" y="3.5" width="11" height="17" rx="2.2" />
          <circle cx="12" cy="11" r="2.4" />
          <path d="M9 6.5h2M9 16.8h6" strokeLinecap="round" />
        </svg>
      );
    case 'regions':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
          <rect x="5" y="9" width="14" height="6" rx="1.5" />
          <path d="M8 5.5h8M8 18.5h8" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
          <circle cx="12" cy="12" r="5" />
        </svg>
      );
  }
}

export function PogoCloseButton({ onClick, ariaLabel = 'Close', size = 'md', className = '', type = 'button', value }) {
  const dims = size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-11 h-11' : 'w-9 h-9';
  const iconDims = size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-[18px] h-[18px]' : 'w-4 h-4';

  return (
    <button
      type={type}
      value={value}
      onClick={onClick}
      aria-label={ariaLabel}
      className={`pogo-close-btn ${dims} shrink-0 ${className}`}
    >
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" className={iconDims} aria-hidden="true">
        <path d="M5.5 5.5 14.5 14.5M14.5 5.5 5.5 14.5" />
      </svg>
    </button>
  );
}

export function PogoSearchInput({
  id,
  value,
  onChange,
  onClear,
  placeholder = 'Search',
  ariaLabel = 'Search',
  className = '',
  inputClassName = '',
  rightSlot = null,
  onKeyDown,
  onBlur,
}) {
  return (
    <div className={`pogo-search-pill relative flex items-center w-full ${className}`}>
      <span className="pl-3.5 pr-2 flex items-center pointer-events-none text-[#0b698e]" aria-hidden="true">
        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round">
          <circle cx="8.5" cy="8.5" r="5.2" />
          <path d="m12.5 12.5 4.2 4.2" />
        </svg>
      </span>
      <input
        id={id}
        type="text"
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        onBlur={onBlur}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className={`w-full py-2.5 pr-3 bg-transparent text-base sm:text-sm font-semibold text-[#123c4d] placeholder-[#28708c]/75 focus:outline-none ${inputClassName}`}
      />
      {rightSlot}
      {value && onClear && (
        <button
          type="button"
          onClick={onClear}
          aria-label="Clear search"
          className="compact-inline-chip mr-2 w-6 h-6 rounded-full bg-[#e6f6fc] hover:bg-[#d0eef9] text-[#1b4d60] flex items-center justify-center text-xs font-bold shrink-0 cursor-pointer"
        >
          ✕
        </button>
      )}
    </div>
  );
}

export function PogoMedallionBadge({
  label,
  count,
  colorStyle,
  colorClass = '',
  active = false,
  triState = undefined,
  onClick,
  ariaLabel,
  children,
}) {
  const isIncluded = triState ? triState === 'include' : active;
  const isExcluded = triState === 'exclude';

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={triState === undefined ? active : undefined}
      data-state={triState}
      aria-label={ariaLabel || label}
      className="pogo-medallion-btn flex flex-col items-center text-center gap-1 py-1 px-0.5 rounded-2xl cursor-pointer select-none group"
    >
      <span
        style={colorStyle}
        className={`pogo-medallion-circle w-[54px] h-[54px] sm:w-14 sm:h-14 ${colorClass} ${
          !isIncluded && !isExcluded && triState !== undefined ? 'opacity-80 group-hover:opacity-100' : ''
        }`}
      >
        {children}

        {isIncluded && (
          <span
            aria-hidden="true"
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#0d7da8] text-white border-2 border-white flex items-center justify-center text-[10px] font-black shadow-sm"
          >
            ✓
          </span>
        )}
        {isExcluded && (
          <span
            aria-hidden="true"
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-600 text-white border-2 border-white flex items-center justify-center text-[10px] font-black shadow-sm"
          >
            ✕
          </span>
        )}
      </span>

      <span className="text-[11px] sm:text-xs font-bold text-[#194a5d] leading-tight capitalize truncate max-w-full px-0.5">
        {label}
      </span>

      {count !== undefined && count !== null && (
        <span className="text-[10px] sm:text-[11px] font-semibold text-[#2d6980] leading-none -mt-0.5">
          {count}
        </span>
      )}
    </button>
  );
}

export function PogoSummaryCard({ title, pillText, stats = [], rightAction = null }) {
  return (
    <section className="pogo-summary-card px-4 py-3.5 sm:px-5 sm:py-4 select-none">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm sm:text-base font-extrabold uppercase tracking-wider text-[#0c6c91] truncate">
          {title}
        </h2>

        <span className="pogo-counter-pill text-xs sm:text-sm shrink-0">
          {pillText}
        </span>

        {rightAction || (
          <span
            className="w-8 h-8 rounded-full bg-[#0d7da8] text-white flex items-center justify-center shadow-sm shrink-0"
            aria-hidden="true"
          >
            <PogoCategoryIcon name="pokedex" className="w-[18px] h-[18px]" />
          </span>
        )}
      </div>

      {stats.length > 0 && (
        <div className="grid grid-cols-5 gap-1.5 sm:gap-3 mt-3 pt-2.5 border-t border-[#0d7da8]/12 text-center">
          {stats.map((st) => {
            const Wrapper = st.onClick ? 'button' : 'div';
            return (
              <Wrapper
                key={st.label}
                {...(st.onClick
                  ? {
                      type: 'button',
                      onClick: st.onClick,
                      'aria-pressed': st.active,
                      className: `rounded-xl py-1 px-0.5 transition-colors cursor-pointer ${
                        st.active ? 'bg-[#0d7da8]/14 ring-1 ring-[#0d7da8]/40' : 'hover:bg-white/60'
                      }`,
                    }
                  : { className: 'py-1 px-0.5' })}
              >
                <div className="font-display text-base sm:text-xl font-bold text-[#0c6c91] leading-tight">
                  {st.value}
                </div>
                <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-[#245669] truncate mt-0.5">
                  {st.label}
                </div>
              </Wrapper>
            );
          })}
        </div>
      )}
    </section>
  );
}

export function PogoRegionBanner({
  region,
  selectedCount,
  totalCount,
  isCollapsed,
  onToggleCollapse,
  onSelectAll,
  onDeselectAll,
}) {
  const starterIds = REGION_STARTERS[region] || [1, 4, 7];
  const allSelected = totalCount > 0 && selectedCount === totalCount;
  const someSelected = selectedCount > 0;
  const progressPct = totalCount > 0 ? Math.round((selectedCount / totalCount) * 100) : 0;

  return (
    <div className="pogo-region-banner flex items-stretch justify-between min-h-[104px] sm:min-h-[112px] select-none">
      <div className="relative z-10 flex flex-col justify-between py-3 pl-4 pr-2 sm:py-3.5 sm:pl-5 flex-1 min-w-0">
        <div>
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-expanded={!isCollapsed}
            aria-controls={`region-grid-${region}`}
            className="inline-flex items-center gap-2 text-left group cursor-pointer"
          >
            <h2 className="font-display text-lg sm:text-xl font-extrabold uppercase tracking-wider text-[#0c749c] group-hover:text-[#085878] leading-none">
              {region}
            </h2>
            <span
              aria-hidden="true"
              className={`text-[11px] text-[#0c749c] transition-transform duration-200 ${
                isCollapsed ? '-rotate-90' : 'rotate-0'
              }`}
            >
              ▼
            </span>
          </button>

          {allSelected ? (
            <div className="text-xs font-bold text-[#1584ae] mt-1 leading-tight">
              Complete!
            </div>
          ) : (
            <div
              className="w-28 sm:w-36 h-2 rounded-full bg-[#b9e3f2] overflow-hidden mt-1.5"
              role="progressbar"
              aria-valuenow={selectedCount}
              aria-valuemin={0}
              aria-valuemax={totalCount}
              aria-label={`${region} selection progress`}
            >
              <div
                className="h-full rounded-full bg-[#0d7da8] transition-all duration-300"
                style={{ width: `${Math.max(someSelected ? 8 : 0, progressPct)}%` }}
              />
            </div>
          )}

          <div className="font-display text-sm sm:text-[15px] font-bold text-[#0c749c] mt-0.5">
            {selectedCount} / {totalCount}
          </div>
        </div>

        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <span
            aria-hidden="true"
            className={`w-7 h-7 rounded-full flex items-center justify-center border-2 shadow-2xs ${
              allSelected
                ? 'bg-[#e2f5fc] border-[#0d7da8] text-[#0d7da8]'
                : someSelected
                  ? 'bg-amber-50 border-amber-400 text-amber-600'
                  : 'bg-white/80 border-[#9cbac7] text-[#6d92a1]'
            }`}
          >
            <PogoCategoryIcon name="pokedex" className="w-4 h-4" />
          </span>

          {!allSelected && (
            <button
              type="button"
              onClick={onSelectAll}
              className="compact-inline-chip px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider bg-[#0d7da8] hover:bg-[#0b698e] text-white shadow-2xs cursor-pointer"
            >
              Select All
            </button>
          )}
          {someSelected && (
            <button
              type="button"
              onClick={onDeselectAll}
              className="compact-inline-chip px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider bg-white/90 hover:bg-rose-50 text-[#1b4d60] hover:text-rose-700 border border-[#0d7da8]/25 cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div
        onClick={onToggleCollapse}
        aria-hidden="true"
        className="pogo-region-banner-stage w-[44%] sm:w-[46%] max-w-[290px] flex items-end justify-end pr-2 sm:pr-4 pb-1 cursor-pointer shrink-0"
      >
        <div className="flex items-end justify-end -space-x-3 sm:-space-x-2">
          {starterIds.map((id, idx) => (
            <PokemonSprite
              key={id}
              src={getHomeSpriteUrl(id)}
              fallbackSrc={getPixelSpriteUrl(id)}
              alt=""
              width="76"
              height="76"
              className={`w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow-[0_4px_8px_rgba(4,42,66,0.38)] transition-transform duration-200 hover:scale-105 ${
                idx === 1 ? 'z-20 -translate-y-1' : 'z-10'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
