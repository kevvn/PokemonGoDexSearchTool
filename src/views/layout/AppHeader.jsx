import React from 'react';
import { PogoCategoryIcon } from '../shared/PogoDesignSystem';
import RegionSelector from '../builder/RegionSelector';
import PwaStatusBadge from './PwaStatusBadge';

function AppHeader({
  activeTab,
  selectedIds,
  pokemonList,
  tagErrors,
  tagWarnings,
  pwa,
  onSelectTab,
  onSelectRegionBatch,
}) {
  return (
    <header className="pogo-pokedex-header z-40 sticky top-0 safe-top-header pb-2">
      <div className="mwg-header-row max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-2 select-none">
        {/* Brand Title + Selected Counter + Offline PWA Status */}
        <div className="flex items-center justify-between gap-2.5 min-w-0 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className="w-8 h-8 rounded-full bg-[#0d7da8] text-white flex items-center justify-center shadow-sm border-2 border-white/85 shrink-0"
              aria-hidden="true"
            >
              <PogoCategoryIcon name="pokedex" className="w-[18px] h-[18px]" />
            </span>
            <div className="min-w-0">
              <div className="flex items-baseline gap-2.5 flex-wrap">
                <h1 className="font-display text-base sm:text-lg font-extrabold tracking-wider uppercase text-[#0b698e] leading-tight whitespace-nowrap">
                  POKÉDEX
                </h1>
                <span className="text-xs font-bold text-[#0c749c] tracking-wide whitespace-nowrap">
                  Selected: {selectedIds.size} / {pokemonList.length}
                </span>
                <PwaStatusBadge
                  status={pwa.status}
                  isOnline={pwa.isOnline}
                  errorMessage={pwa.errorMessage}
                  bannerDismissed={pwa.bannerDismissed}
                  onApplyUpdate={pwa.applyUpdate}
                  onDismiss={pwa.dismissBanner}
                />
              </div>
              <div className="hidden md:block text-[10px] font-bold text-[#285d72] tracking-wider uppercase leading-none mt-0.5">
                Pokémon GO Search String &amp; Storage Triage
              </div>
            </div>
          </div>
        </div>

        {/* 4-Tab Primary Workspace Navigation */}
        <nav
          aria-label="Primary workspace navigation"
          className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 shrink-0"
        >
          <button
            type="button"
            onClick={() => onSelectTab('triage')}
            aria-current={activeTab === 'triage' ? 'page' : undefined}
            className={`h-8 sm:h-9 px-3 sm:px-3.5 text-[11px] sm:text-xs uppercase inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'triage' ? 'pogo-pill-active' : 'pogo-pill'
            }`}
          >
            <span aria-hidden="true">⚡</span>
            <span>Triage Funnels</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('events')}
            aria-current={activeTab === 'events' ? 'page' : undefined}
            className={`h-8 sm:h-9 px-3 sm:px-3.5 text-[11px] sm:text-xs uppercase inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'events' ? 'pogo-pill-active' : 'pogo-pill'
            }`}
          >
            <span aria-hidden="true">📅</span>
            <span>Events &amp; Trips</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('tags')}
            aria-current={activeTab === 'tags' ? 'page' : undefined}
            className={`h-8 sm:h-9 px-3 sm:px-3.5 text-[11px] sm:text-xs uppercase inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'tags' ? 'pogo-pill-active' : 'pogo-pill'
            }`}
          >
            <span aria-hidden="true">🏷️</span>
            <span>Tag System</span>
            {tagErrors > 0 ? (
              <span
                className="bg-rose-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full border border-white/80"
                title={`${tagErrors} tag collision error(s)`}
              >
                {tagErrors}
              </span>
            ) : tagWarnings > 0 ? (
              <span
                className="bg-amber-400 text-[#123c4d] text-[9px] font-black px-1.5 py-0.2 rounded-full border border-white/80"
                title={`${tagWarnings} tag warning(s)`}
              >
                {tagWarnings}
              </span>
            ) : null}
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('builder', { resetDock: true })}
            aria-current={activeTab === 'builder' ? 'page' : undefined}
            className={`h-8 sm:h-9 px-3 sm:px-3.5 text-[11px] sm:text-xs uppercase inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'builder' ? 'pogo-pill-active' : 'pogo-pill'
            }`}
          >
            <span aria-hidden="true">🧭</span>
            <span>Pokédex Builder ({selectedIds.size})</span>
          </button>
        </nav>
      </div>

      {/* 10-Region Pill Selector (Only in Pokédex Builder Mode) */}
      {activeTab === 'builder' && (
        <div className="mt-2">
          <RegionSelector
            selectedIds={selectedIds}
            pokemonList={pokemonList}
            handleRegionSelection={onSelectRegionBatch}
          />
        </div>
      )}
    </header>
  );
}

export default React.memo(AppHeader);
