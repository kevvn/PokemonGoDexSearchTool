import React, { useCallback } from 'react';
import {
  TRADE_HUB_TABS,
  useTradesHubController,
} from '../../controllers/useTradesHubController';
import { attachBeforeMatch, attachTablistFadeObserver } from '../shared/tablistRef';
import RemoteTradePanel from './RemoteTradePanel';
import TradeAuditPanel from './TradeAuditPanel';
import TradeWishlistPanel from './TradeWishlistPanel';

function TradesHubView({
  pokemonList,
  metaSnapshot,
  customTagMap,
  onLoadSearchString,
  onSelectSpeciesInGrid,
}) {
  const {
    tabBaseId,
    tabRefHandlers,
    activeSubTab,
    selectSubTab,
    handleTabKeyDown,
    tagMap,
  } = useTradesHubController({ customTagMap });

  const attachAuditPanel = useCallback(
    (panel) => attachBeforeMatch(panel, () => selectSubTab('audit')),
    [selectSubTab]
  );
  const attachRemotePanel = useCallback(
    (panel) => attachBeforeMatch(panel, () => selectSubTab('remote')),
    [selectSubTab]
  );
  const attachWishlistsPanel = useCallback(
    (panel) => attachBeforeMatch(panel, () => selectSubTab('wishlists')),
    [selectSubTab]
  );

  return (
    <div className="max-w-7xl mx-auto w-full pb-24">
      {/* Sticky Single-Row Pill Sub-Tablist (clears coarse-pointer / notched iOS & iPad header) */}
      <div className="sticky top-[calc(106px+env(safe-area-inset-top,0px))] md:top-[calc(64px+env(safe-area-inset-top,0px))] z-30 bg-[#bfeaf6]/90 backdrop-blur-md border-b border-white/65">
        <div className="max-w-7xl mx-auto px-2 sm:px-4">
          <div
            ref={attachTablistFadeObserver}
            className="mwg-tablist"
            role="tablist"
            aria-label="Trade hoard audit, remote trade showcase, and friend wishlists"
          >
            {TRADE_HUB_TABS.map((tab, idx) => {
              const isSelected = activeSubTab === tab.id;
              const domId = `${tabBaseId}-tab-${tab.id}`;
              const panelId = `${tabBaseId}-panel-${tab.id}`;
              return (
                <button
                  key={tab.id}
                  ref={tabRefHandlers[tab.id]}
                  type="button"
                  role="tab"
                  id={domId}
                  aria-controls={panelId}
                  aria-selected={isSelected ? 'true' : 'false'}
                  tabIndex={isSelected ? 0 : -1}
                  onClick={() => selectSubTab(tab.id)}
                  onKeyDown={(e) => handleTabKeyDown(e, idx)}
                >
                  <span aria-hidden="true">{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab Panels — each panel owns its own isolated controller */}
      <div className="px-3 sm:px-5 pt-4">
        <div
          ref={attachAuditPanel}
          id={`${tabBaseId}-panel-audit`}
          role="tabpanel"
          aria-labelledby={`${tabBaseId}-tab-audit`}
          hidden={activeSubTab === 'audit' ? undefined : 'until-found'}
        >
          <TradeAuditPanel
            tagMap={tagMap}
            metaSnapshot={metaSnapshot}
            onLoadSearchString={onLoadSearchString}
            onSelectSpeciesInGrid={onSelectSpeciesInGrid}
          />
        </div>

        <div
          ref={attachRemotePanel}
          id={`${tabBaseId}-panel-remote`}
          role="tabpanel"
          aria-labelledby={`${tabBaseId}-tab-remote`}
          hidden={activeSubTab === 'remote' ? undefined : 'until-found'}
        >
          <RemoteTradePanel
            tagMap={tagMap}
            metaSnapshot={metaSnapshot}
            onLoadSearchString={onLoadSearchString}
            onSelectSpeciesInGrid={onSelectSpeciesInGrid}
          />
        </div>

        <div
          ref={attachWishlistsPanel}
          id={`${tabBaseId}-panel-wishlists`}
          role="tabpanel"
          aria-labelledby={`${tabBaseId}-tab-wishlists`}
          hidden={activeSubTab === 'wishlists' ? undefined : 'until-found'}
        >
          <TradeWishlistPanel
            pokemonList={pokemonList}
            metaSnapshot={metaSnapshot}
            tagMap={tagMap}
            onLoadSearchString={onLoadSearchString}
            onSelectSpeciesInGrid={onSelectSpeciesInGrid}
          />
        </div>
      </div>
    </div>
  );
}

export default React.memo(TradesHubView);
