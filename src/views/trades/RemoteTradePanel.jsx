import React from 'react';
import { useRemoteTradeController } from '../../controllers/trades/useRemoteTradeController';
import { REMOTE_TRADE_RULES } from '../../models/trades/tradeValueModel';
import SearchRecipeCard from '../shared/SearchRecipeCard';

function RemoteTradePanel({
  tagMap,
  metaSnapshot,
  onLoadSearchString,
  onSelectSpeciesInGrid,
}) {
  const { queries } = useRemoteTradeController({ tagMap, metaSnapshot });

  return (
    <div className="space-y-6">
      {/* Forever Friends Remote Trade Rules Summary */}
      <section className="pogo-summary-card p-4 sm:p-5 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#0d7da8] text-white">
            Forever Friends · Remote Trade
          </span>
          <span className="text-[11px] font-bold text-[#1d7a4d]">
            Does not count toward daily Special Trade limit
          </span>
        </div>
        <h2 className="font-display text-base sm:text-lg font-extrabold text-[#123c4d]">
          Curate Your Native Remote Trade Tag in Minutes
        </h2>
        <p className="text-xs sm:text-sm text-[#285d72] font-medium leading-relaxed">
          Forever Friends can browse every Pokémon you mark with Pokémon GO&apos;s native{' '}
          <strong className="text-[#123c4d]">Remote Trade</strong> tag and pick 3 wants. Avoid dumping common clutter—use
          these pre-guarded <code className="font-mono font-bold bg-[#dff4fb] px-1.5 py-0.5 rounded text-[#0b698e]">age30-</code>{' '}
          strings to showcase high-demand, eligible offers only.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-1">
          {REMOTE_TRADE_RULES.map((rule) => (
            <div
              key={rule.id}
              className="bg-white/75 border border-white rounded-2xl p-2.5 space-y-1"
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-[11px] font-extrabold text-[#123c4d]">{rule.label}</span>
              </div>
              <code className="block font-mono text-[10px] font-bold text-[#0b698e] bg-[#e6f6fc] px-2 py-0.5 rounded-lg truncate">
                {rule.token}
              </code>
              <p className="text-[10px] text-[#285d72] font-medium leading-snug">{rule.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Remote Trade Showcase Recipes */}
      <section className="space-y-3" aria-label="Remote Trade Showcase Queries">
        <h3 className="font-display text-sm sm:text-base font-extrabold text-[#0b698e] uppercase tracking-wider">
          1-Tap Remote Trade Showcase Queries
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {queries.map((card) => (
            <SearchRecipeCard
              key={card.id}
              badge={card.badge}
              title={card.title}
              subtitle={card.subtitle}
              tagSuggestion={card.tagSuggestion}
              searchString={card.query}
              speciesIds={card.speciesIds}
              accent={card.accent}
              onLoadToBar={onLoadSearchString}
              onSelectSpeciesInGrid={onSelectSpeciesInGrid}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

export default React.memo(RemoteTradePanel);
