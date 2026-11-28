import React, { useMemo } from 'react';
import { useTradeWishlistController } from '../../controllers/trades/useTradeWishlistController';
import { GUARANTEED_LUCKY_CUTOFF_YEAR } from '../../data/speciesConstants';
import {
  POGO_SAFE_CHAR_LIMIT,
  QR_SAFE_CHAR_LIMIT,
  WISHLIST_TRAIT_OPTIONS,
} from '../../models/trades/tradeWishlistModel';
import CopyActionButton from '../shared/CopyActionButton';
import { createDialogRefHandler } from '../shared/dialogRef';
import { PogoCloseButton } from '../shared/PogoDesignSystem';
import SearchRecipeCard from '../shared/SearchRecipeCard';

function TradeWishlistPanel({
  pokemonList,
  metaSnapshot,
  tagMap,
  onLoadSearchString,
  onSelectSpeciesInGrid,
}) {
  const {
    myWishlist,
    friendWishlists,
    pokemonById,
    speciesSearch,
    setSpeciesSearch,
    speciesSuggestions,
    remoteReady,
    setRemoteReady,
    compiledMyWishlist,
    groupQueries,
    friendName,
    setFriendName,
    friendQueryInput,
    setFriendQueryInput,
    importError,
    storageError,
    dismissStorageError,
    qrState,
    qrDialogRef,
    qrHeadingId,
    speciesInputId,
    friendNameId,
    friendQueryId,
    addSpeciesToWishlist,
    removeSpeciesFromWishlist,
    toggleWishlistTrait,
    clearMyWishlist,
    importFriendWishlist,
    toggleFriendActive,
    removeFriendWishlist,
    openWishlistQrModal,
    closeWishlistQrModal,
  } = useTradeWishlistController({ pokemonList, metaSnapshot });

  const trSpecName = tagMap?.tr_spec?.name || 'TR-Spec';

  const attachQrDialogRef = useMemo(
    () => createDialogRefHandler(qrDialogRef, closeWishlistQrModal),
    [qrDialogRef, closeWishlistQrModal]
  );

  return (
    <div className="space-y-6">
      {/* Offline QR Dialog for Personal Wishlist */}
      <dialog
        ref={attachQrDialogRef}
        aria-labelledby={qrHeadingId}
        {...{ closedby: 'any' }}
        className="pogo-summary-card p-5 max-w-sm w-[calc(100%-2rem)] max-h-[calc(100dvh-2rem)] overflow-y-auto text-center relative shadow-2xl text-[#123c4d]"
      >
        <PogoCloseButton
          onClick={closeWishlistQrModal}
          ariaLabel="Close wishlist QR modal"
          size="sm"
          className="absolute top-3.5 right-3.5"
        />
        <h3
          id={qrHeadingId}
          className="font-display text-sm font-extrabold text-[#0b698e] mb-1 uppercase tracking-wider"
        >
          Share Wishlist (Offline QR)
        </h3>
        <p className="text-xs text-[#285d72] mb-4 font-medium">
          Friends scan this QR code and paste directly into Pokémon GO to see every tradeable match they own.
        </p>

        {qrState.status === 'error' ? (
          <div
            role="alert"
            className="bg-rose-50 border border-rose-300 text-rose-800 p-4 rounded-2xl mb-3 text-xs font-bold"
          >
            {qrState.error}
          </div>
        ) : qrState.status === 'ready' && qrState.dataUrl ? (
          <div className="bg-white p-3 rounded-2xl inline-block border-2 border-white shadow-sm mb-3">
            <img
              src={qrState.dataUrl}
              alt="Offline trade wishlist QR code"
              className="w-44 h-44 block rounded-lg select-none"
              width="176"
              height="176"
            />
          </div>
        ) : (
          <div
            role="status"
            aria-live="polite"
            className="bg-white/80 p-5 rounded-2xl mb-3 border border-white text-[#285d72] text-xs font-bold"
          >
            Generating offline QR code...
          </div>
        )}

        <div className="bg-[#073b50] border border-[#0d7da8]/40 rounded-xl p-2.5 max-h-24 overflow-y-auto font-mono text-[10px] text-[#bfeaf6] break-all text-left font-bold">
          {qrState.forString || compiledMyWishlist.query || 'Add species to your wishlist first.'}
        </div>
      </dialog>

      {/* Storage Quota Warning Banner */}
      {storageError && (
        <div
          role="alert"
          className="pogo-summary-card bg-amber-50/95 border border-amber-300 p-3.5 flex items-center justify-between gap-3 text-xs font-bold text-amber-950"
        >
          <span>{storageError}</span>
          <button
            type="button"
            onClick={dismissStorageError}
            className="pogo-pill min-h-[36px] px-3 py-1 text-[11px] uppercase cursor-pointer shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Shared Remote-Ready Toggle */}
      <section className="pogo-summary-card p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#1d7a4d] text-white">
              100% Offline Peer Matching
            </span>
            <span className="text-[11px] font-bold text-[#285d72]">
              Fly33 Compact Exclusion Filters + Local QR
            </span>
          </div>
          <h2 className="font-display text-base sm:text-lg font-extrabold text-[#123c4d]">
            Friend &amp; Group Wishlist Scanner
          </h2>
          <p className="text-xs text-[#285d72] font-medium leading-relaxed">
            Share what <em>you</em> want as a compact PoGO search string or QR code—and paste your friends&apos;
            wishlists to tag everything your group wants so you can confidently clean up the rest.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setRemoteReady((v) => !v)}
          aria-pressed={remoteReady}
          className={`min-h-[40px] px-4 py-2 text-xs uppercase cursor-pointer inline-flex items-center gap-1.5 ${
            remoteReady ? 'pogo-pill-active' : 'pogo-pill'
          }`}
        >
          {remoteReady && <span aria-hidden="true">✓</span>}
          <span>{remoteReady ? 'Remote Ready (age30-)' : 'Include age30- (Remote)'}</span>
        </button>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 items-start">
        {/* Column 1: Build & Share My Wishlist */}
        <section className="pogo-glass-card p-4 space-y-4" aria-label="Build and Share My Wishlist">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="font-display text-sm font-extrabold text-[#0b698e] uppercase tracking-wider">
                1. My Wishlist (&ldquo;What I Want&rdquo;)
              </h3>
              <p className="text-[11px] text-[#285d72] font-medium">
                Pick species and optional traits (Shiny, BG, G-Max, ♀/♂). Compiles to compact PoGO CNF.
              </p>
            </div>
            {myWishlist.length > 0 && (
              <button
                type="button"
                onClick={clearMyWishlist}
                className="pogo-pill min-h-[36px] px-3 py-1 text-[11px] uppercase text-rose-700 cursor-pointer"
              >
                Clear ({myWishlist.length})
              </button>
            )}
          </div>

          {/* Species Search Input */}
          <div className="space-y-1.5">
            <label htmlFor={speciesInputId} className="block text-[11px] font-extrabold text-[#123c4d] uppercase">
              Add Pokémon by Name or Dex #
            </label>
            <input
              id={speciesInputId}
              type="text"
              value={speciesSearch}
              onChange={(e) => setSpeciesSearch(e.target.value)}
              placeholder="e.g. Rayquaza, Salandit, 201..."
              className="w-full text-base sm:text-xs font-bold bg-white/90 text-[#123c4d] px-3.5 py-2 rounded-2xl border border-[#0d7da8]/30 focus:ring-2 focus:ring-[#0b698e]"
            />
            {speciesSuggestions.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1" role="group" aria-label="Matching Pokémon">
                {speciesSuggestions.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => addSpeciesToWishlist(p.id)}
                    className="compact-inline-chip pogo-pill min-h-[36px] px-3 py-1 text-[11px] cursor-pointer"
                  >
                    + #{p.id} {p.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Selected Wishlist Items with Per-Species Trait Pills */}
          {myWishlist.length === 0 ? (
            <div className="bg-white/60 border border-white rounded-2xl p-4 text-center text-xs text-[#285d72] font-semibold">
              No species added yet. Search above to build a compact wishlist friends can paste directly into Pokémon GO.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
              {myWishlist.map((entry) => {
                const mon = pokemonById.get(entry.dexId);
                return (
                  <div
                    key={entry.dexId}
                    className="bg-white/80 border border-white rounded-2xl p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-display text-xs font-extrabold text-[#123c4d]">
                        #{entry.dexId} {mon?.name || `Dex #${entry.dexId}`}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeSpeciesFromWishlist(entry.dexId)}
                        aria-label={`Remove ${mon?.name || entry.dexId} from wishlist`}
                        className="compact-inline-chip pogo-pill min-h-[36px] px-2.5 py-1 text-[11px] text-rose-700 cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5" role="group" aria-label={`Traits for ${mon?.name || entry.dexId}`}>
                      {WISHLIST_TRAIT_OPTIONS.map((trait) => {
                        const active = entry.traits.includes(trait.id);
                        return (
                          <button
                            key={trait.id}
                            type="button"
                            onClick={() => toggleWishlistTrait(entry.dexId, trait.id)}
                            aria-pressed={active}
                            className={`compact-inline-chip min-h-[36px] px-2.5 py-1 text-[11px] font-bold cursor-pointer inline-flex items-center gap-1 ${
                              active ? 'pogo-pill-active' : 'pogo-pill'
                            }`}
                          >
                            {active && <span aria-hidden="true">✓</span>}
                            <span>{trait.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Compiled Wishlist Output + QR Button */}
          {compiledMyWishlist.query && (
            <div className="space-y-2 pt-2 border-t border-[#0d7da8]/20">
              {(compiledMyWishlist.charLimitExceeded || compiledMyWishlist.qrLimitExceeded) && (
                <p role="alert" className="text-[11px] font-bold text-amber-900 bg-amber-50 border border-amber-300 rounded-xl px-3 py-1.5">
                  {compiledMyWishlist.charLimitExceeded
                    ? `Wishlist exceeds Pokémon GO's ${POGO_SAFE_CHAR_LIMIT}-char limit (${compiledMyWishlist.charCount} chars). Split into smaller lists.`
                    : `Wishlist exceeds the ~${QR_SAFE_CHAR_LIMIT}-byte single QR limit (${compiledMyWishlist.charCount} chars). Use Copy String instead.`}
                </p>
              )}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] font-extrabold text-[#0b698e] uppercase">
                  Shareable Wishlist ({compiledMyWishlist.charCount} chars)
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={openWishlistQrModal}
                    className="pogo-pill min-h-[38px] px-3.5 py-1.5 text-[11px] uppercase cursor-pointer inline-flex items-center gap-1"
                  >
                    <span aria-hidden="true">📱</span>
                    <span>Offline QR</span>
                  </button>
                  <CopyActionButton
                    text={compiledMyWishlist.query}
                    ariaLabel="Copy my trade wishlist search string"
                    className="pogo-pill-active min-h-[38px] px-4 py-1.5 text-[11px] uppercase"
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
              <input
                type="text"
                readOnly
                value={compiledMyWishlist.query}
                onClick={(e) => {
                  e.target.select();
                  onLoadSearchString?.(compiledMyWishlist.query);
                }}
                aria-label="Compiled personal trade wishlist search string"
                className="w-full font-mono text-base sm:text-[11px] font-bold bg-[#073b50] text-[#c6effa] px-3 py-1.5 rounded-full border border-[#0d7da8]/45 focus:ring-2 focus:ring-[#0b698e] truncate cursor-pointer"
              />
            </div>
          )}
        </section>

        {/* Column 2: Import Friends' Wishlists & Group Wants Merger */}
        <section className="pogo-glass-card p-4 space-y-4" aria-label="Friend and Group Wishlist Merger">
          <div>
            <h3 className="font-display text-sm font-extrabold text-[#0b698e] uppercase tracking-wider">
              2. Friend &amp; Group Wishlists (&ldquo;Who Wants My Stuff?&rdquo;)
            </h3>
            <p className="text-[11px] text-[#285d72] font-medium">
              Paste 1+ friends&apos; wishlist strings (Dex IDs or Pokémon names) to tag every match, then safely clean up everything else.
            </p>
          </div>

          <form onSubmit={importFriendWishlist} className="space-y-2.5 bg-white/70 border border-white rounded-2xl p-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="sm:col-span-1">
                <label htmlFor={friendNameId} className="block text-[10px] font-extrabold text-[#123c4d] uppercase mb-1">
                  Friend / Group Name
                </label>
                <input
                  id={friendNameId}
                  type="text"
                  value={friendName}
                  onChange={(e) => setFriendName(e.target.value)}
                  placeholder="e.g. Alex / Raid Group"
                  className="w-full text-base sm:text-xs font-bold bg-white text-[#123c4d] px-3 py-1.5 rounded-xl border border-[#0d7da8]/30 focus:ring-2 focus:ring-[#0b698e]"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor={friendQueryId} className="block text-[10px] font-extrabold text-[#123c4d] uppercase mb-1">
                  Wishlist Search String
                </label>
                <input
                  id={friendQueryId}
                  type="text"
                  value={friendQueryInput}
                  onChange={(e) => setFriendQueryInput(e.target.value)}
                  placeholder="e.g. 201,384,757&!757,female or rayquaza,salandit"
                  className="w-full font-mono text-base sm:text-xs font-bold bg-white text-[#123c4d] px-3 py-1.5 rounded-xl border border-[#0d7da8]/30 focus:ring-2 focus:ring-[#0b698e]"
                />
              </div>
            </div>

            {importError && (
              <p role="alert" className="text-xs font-bold text-rose-700">
                {importError}
              </p>
            )}

            <button
              type="submit"
              className="pogo-pill-active min-h-[40px] px-4 py-2 text-xs uppercase cursor-pointer"
            >
              + Save Friend Wishlist
            </button>
          </form>

          {/* Saved Friends List */}
          {friendWishlists.length > 0 && (
            <div className="space-y-2">
              <span className="text-[11px] font-extrabold text-[#123c4d] uppercase">
                Saved Friends ({groupQueries.activeCount}/{friendWishlists.length} active)
              </span>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {friendWishlists.map((fw) => (
                  <div
                    key={fw.id}
                    className="flex items-center justify-between gap-2 bg-white/80 border border-white rounded-xl px-3 py-2"
                  >
                    <button
                      type="button"
                      onClick={() => toggleFriendActive(fw.id)}
                      aria-pressed={fw.active}
                      className="flex items-center gap-2 min-w-0 text-left cursor-pointer"
                    >
                      <span
                        aria-hidden="true"
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                          fw.active ? 'bg-[#1d7a4d] text-white' : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {fw.active ? '✓' : ''}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-xs font-extrabold text-[#123c4d] truncate">
                          {fw.name}{' '}
                          <span className="text-[10px] font-bold text-[#285d72]">
                            ({fw.speciesIds.length > 0 ? `${fw.speciesIds.length} species` : 'trait filter'})
                          </span>
                        </span>
                        <span
                          aria-hidden="true"
                          className="block font-mono text-[10px] text-[#285d72] truncate max-w-[220px] sm:max-w-xs"
                        >
                          {fw.rawQuery}
                        </span>
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => removeFriendWishlist(fw.id)}
                      aria-label={`Remove ${fw.name}'s wishlist`}
                      className="compact-inline-chip pogo-pill min-h-[36px] px-2.5 py-1 text-[11px] text-rose-700 cursor-pointer shrink-0"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Merged Group Output Pair: Tag Keepers + Clean Unwanted Surplus */}
          {groupQueries.activeCount > 0 ? (
            <div className="space-y-3 pt-2 border-t border-[#0d7da8]/20">
              {groupQueries.unindexedFriends.length > 0 && groupQueries.activeCount > 1 && (
                <div
                  role="alert"
                  className="bg-amber-50 border border-amber-300 rounded-xl p-2.5 text-[11px] font-bold text-amber-950"
                >
                  Trait-only wishlist(s) ({groupQueries.unindexedFriends.map((f) => f.name).join(', ')}) cannot be
                  merged into a Dex-ID union—toggle them individually to run their exact filter before cleanup.
                </div>
              )}

              {groupQueries.tagGroupWantsQuery && (
                <SearchRecipeCard
                  badge={`Step 1 · ${groupQueries.activeCount} Friend(s)`}
                  title="Tag What Your Friends Want"
                  subtitle={`Paste into Pokémon GO → tag every hit into ${trSpecName} (or a friend tag) before cleaning up surplus.`}
                  tagSuggestion={trSpecName}
                  searchString={groupQueries.tagGroupWantsQuery}
                  speciesIds={groupQueries.wantedSpeciesIds}
                  accent="emerald"
                  onLoadToBar={onLoadSearchString}
                  onSelectSpeciesInGrid={onSelectSpeciesInGrid}
                />
              )}

              {groupQueries.cleanUnwantedQuery && (
                <SearchRecipeCard
                  badge="Step 2 · Safe Cleanup"
                  title="Clean Up Everything Nobody Wants"
                  subtitle={`Negates all active friends' wanted species + 2016–${GUARANTEED_LUCKY_CUTOFF_YEAR} Guaranteed Luckies + Tier S/A tradeables + all safety shields (4★, Shinies, BGs, Costumes, PvP IVs, Nundos).`}
                  searchString={groupQueries.cleanUnwantedQuery}
                  accent="rose"
                  onLoadToBar={onLoadSearchString}
                />
              )}
            </div>
          ) : (
            <div className="bg-white/60 border border-white rounded-2xl p-4 text-center text-xs text-[#285d72] font-semibold">
              Import at least one friend&apos;s wishlist above to generate your &ldquo;Tag Group Wants&rdquo; &amp; &ldquo;Clean Unwanted Surplus&rdquo; pair.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default React.memo(TradeWishlistPanel);
