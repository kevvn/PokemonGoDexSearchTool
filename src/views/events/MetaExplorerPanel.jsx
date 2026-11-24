import React, { useMemo } from 'react';
import { useMetaExplorerController } from '../../controllers/events/useMetaExplorerController';
import { compressIdRanges } from '../../models/searchEngine';
import { getPixelSpriteUrl } from '../../models/spriteUrls';
import { PogoSearchInput } from '../shared/PogoDesignSystem';
import PokemonSprite from '../shared/PokemonSprite';
import EventCopyChip from './EventCopyChip';

const LEAGUE_TABS = [
  { id: 'great_league', label: '🔵 Great (1500)' },
  { id: 'ultra_league', label: '🟡 Ultra (2500)' },
  { id: 'master_league', label: '🟣 Master' },
  { id: 'pve', label: '🔥 Raid Attacker' },
];

function MetaExplorerPanel({ pokemonList, untaggedOnly }) {
  const {
    panelRef,
    metaCache,
    metaSets,
    metaSyncState,
    handleSyncMeta,
    activeMetaLeagueTab,
    setActiveMetaLeagueTab,
    metaSearchFilter,
    setMetaSearchFilter,
  } = useMetaExplorerController({ pokemonList });

  const prefix = untaggedOnly ? '!#&' : '';
  const isSyncing = metaSyncState.status === 'syncing';

  const filteredEntries = useMemo(() => {
    const rawEntries =
      activeMetaLeagueTab === 'pve'
        ? metaCache.pve.entries
        : metaCache.pvp[activeMetaLeagueTab]?.entries || [];

    const q = metaSearchFilter.trim().toLowerCase();
    if (!q) return rawEntries;

    return rawEntries.filter((item) => {
      const nameMatch = (item.speciesName || item.species || item.name || '').toLowerCase().includes(q);
      const moveMatch =
        (item.fastMove || '').toLowerCase().includes(q) ||
        (item.chargedMoves || []).some((m) => m.toLowerCase().includes(q));
      const typeMatch = (item.type || item.role || '').toLowerCase().includes(q);
      return nameMatch || moveMatch || typeMatch || String(item.dexId).includes(q);
    });
  }, [activeMetaLeagueTab, metaCache, metaSearchFilter]);

  return (
    <div ref={panelRef} className="pt-3.5 space-y-3">
      <div className="pogo-summary-card p-3.5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-display text-sm sm:text-base font-extrabold uppercase tracking-wider text-[#0c6c91]">
              PvPoke Top 100 &amp; DialgaDex Raiders
            </h3>
            <p className="text-[11px] text-[#285d72] font-medium">
              {metaSets.allProtectedMetaIds.length} protected meta/regional IDs •{' '}
              {metaSets.strictNonMetaIds.length} strict non-meta IDs.
            </p>
          </div>
          <button
            type="button"
            disabled={isSyncing}
            onClick={handleSyncMeta}
            className="compact-inline-chip pogo-pill-active min-h-[34px] px-4 py-1.5 text-[11px] uppercase disabled:opacity-50 cursor-pointer"
          >
            {isSyncing ? '⏳ Syncing...' : '🔄 Sync Live'}
          </button>
        </div>

        {metaSyncState.message && (
          <div
            role={metaSyncState.status === 'error' ? 'alert' : 'status'}
            className={`p-2.5 rounded-2xl text-[11px] font-bold border ${
              metaSyncState.status === 'synced'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : 'bg-amber-50 border-amber-300 text-amber-900'
            }`}
          >
            {metaSyncState.message}
          </div>
        )}

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {LEAGUE_TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              aria-pressed={activeMetaLeagueTab === t.id}
              onClick={() => setActiveMetaLeagueTab(t.id)}
              className={`compact-inline-chip min-h-[30px] px-3 py-1 text-[11px] uppercase shrink-0 cursor-pointer ${
                activeMetaLeagueTab === t.id ? 'pogo-pill-active' : 'pogo-pill'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <PogoSearchInput
          value={metaSearchFilter}
          onChange={(e) => setMetaSearchFilter(e.target.value)}
          onClear={() => setMetaSearchFilter('')}
          placeholder="Search species, type, or move..."
          ariaLabel="Filter ranked meta Pokémon"
        />
      </div>

      {/* Mobile-Friendly Ranked Species List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {filteredEntries.map((item, idx) => {
          const displayName = item.speciesName || item.species || item.name || `#${item.dexId}`;
          const roleOrType = item.type || item.role || '';
          const famRange = compressIdRanges(item.familyIds || [item.dexId]);
          const ivFilter =
            activeMetaLeagueTab === 'great_league' || activeMetaLeagueTab === 'ultra_league'
              ? '0-1attack&3-4defense&3-4hp'
              : '3*,4*';
          const quickString = `${prefix}${famRange}&${ivFilter}`;

          return (
            <div
              key={`${activeMetaLeagueTab}-${item.speciesId || displayName}-${item.rank || idx}`}
              className="pogo-glass-card p-2.5 flex items-center justify-between gap-2"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <PokemonSprite
                  src={getPixelSpriteUrl(item.dexId)}
                  alt={displayName}
                  width={40}
                  height={40}
                  className="w-10 h-10 object-contain pogo-dex-tile p-0.5 shrink-0"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-mono text-[11px] font-black text-[#0b698e]">
                      {item.rank ? `#${item.rank}` : item.tier}
                    </span>
                    <span className="font-display text-xs font-extrabold text-[#123c4d] truncate">
                      {displayName}
                    </span>
                    {item.tier && activeMetaLeagueTab === 'pve' && (
                      <span className="px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-800 font-mono text-[9px] font-black border border-rose-200">
                        {item.tier}
                      </span>
                    )}
                    {roleOrType && (
                      <span className="px-1.5 py-0.2 rounded-full bg-[#dff4fb] text-[#0b698e] text-[9px] font-extrabold">
                        {roleOrType}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] font-semibold text-[#285d72] truncate">
                    {item.fastMove}
                    {item.chargedMoves?.length > 0 ? ` + ${item.chargedMoves.join(' / ')}` : ''}
                  </div>
                </div>
              </div>

              <EventCopyChip
                label="COPY"
                text={quickString}
                ariaLabel={`Copy search string for ${displayName}`}
                variant="teal"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default React.memo(MetaExplorerPanel);
