import React, { useState } from 'react';
import { ATTRIBUTES, TYPES } from '../utils/searchUtils';

const ATTRIBUTE_CATEGORIES = [
  {
    name: 'Status & Rarities',
    items: ['shiny', 'lucky', 'legendary', 'mythical', 'ultra beasts', 'shadow', 'purified', 'favorite']
  },
  {
    name: 'Forms & Battle Modes',
    items: ['mega', 'megaevolve', 'dynamax', 'gigantamax', 'evolve', 'costume']
  },
  {
    name: 'Origin & Encounters',
    items: ['traded', 'hatched', 'raid', 'remoteraid', 'research', 'defender', 'background', 'locationcard']
  },
  {
    name: 'Size & Buddy Levels',
    items: ['xxs', 'xxl', 'buddy0', 'buddy1', 'buddy2', 'buddy3', 'buddy4', 'buddy5']
  },
  {
    name: 'Regional Forms',
    items: ['alola', 'galar', 'hisui', 'paldea']
  }
];

function FilterPanel({ filters, setFilters, onClose, handleInvertSelection }) {
  const [activeTab, setActiveTab] = useState('Status & Rarities');

  const toggleAppraisal = (star) => {
    setFilters(prev => ({
      ...prev,
      appraisal: prev.appraisal.includes(star)
        ? prev.appraisal.filter(s => s !== star)
        : [...prev.appraisal, star]
    }));
  };

  const setAttribute = (attr, value) => {
    setFilters(prev => ({ ...prev, [attr]: value }));
  };

  const toggleType = (type) => {
    setFilters(prev => ({
      ...prev,
      types: prev.types.includes(type)
        ? prev.types.filter(t => t !== type)
        : [...prev.types, type]
    }));
  };

  const resetFilters = () => {
    setFilters({
      appraisal: [],
      ageMin: '',
      ageMax: '',
      types: [],
      ...ATTRIBUTES.reduce((acc, attr) => ({ ...acc, [attr]: null }), {})
    });
  };

  const applyPreset = (presetName) => {
    resetFilters();
    
    switch (presetName) {
      case 'perfect':
        setFilters(prev => ({ ...prev, appraisal: ['4*'] }));
        break;
      case 'trash':
        setFilters(prev => ({
          ...prev,
          appraisal: ['0*', '1*', '2*'],
          shiny: false,
          legendary: false,
          mythical: false,
          lucky: false,
          costume: false,
          favorite: false,
          background: false
        }));
        break;
      case 'pvp':
        setFilters(prev => ({
          ...prev,
          evolve: true,
          legendary: false,
          mythical: false
        }));
        break;
      case 'legendary':
        setFilters(prev => ({
          ...prev,
          legendary: true
        }));
        break;
      case 'trade':
        setFilters(prev => ({
          ...prev,
          traded: false,
          mythical: false,
          favorite: false
        }));
        break;
      case 'dynamax':
        setFilters(prev => ({
          ...prev,
          dynamax: true
        }));
        break;
      default:
        break;
    }
  };

  const applyAgePreset = (days) => {
    if (days === 'today') {
      setFilters(prev => ({ ...prev, ageMin: '0', ageMax: '0' }));
    } else if (days === 'yesterday') {
      setFilters(prev => ({ ...prev, ageMin: '1', ageMax: '1' }));
    } else if (days === 'week') {
      setFilters(prev => ({ ...prev, ageMin: '0', ageMax: '7' }));
    } else if (days === 'month') {
      setFilters(prev => ({ ...prev, ageMin: '0', ageMax: '30' }));
    }
  };

  return (
    <div className="glass-panel border-b lg:border-b-0 lg:border-r border-slate-800/80 shadow-2xl relative">
      
      {/* Mobile Drawer Trigger Header */}
      <div className="flex lg:hidden items-center justify-between p-4 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-2.5 select-none">
          <span className="text-blue-400">⚙️</span>
          <h3 className="font-extrabold text-sm text-slate-200 tracking-wide uppercase">
            Filter Controls & Presets
          </h3>
        </div>
        <button 
          onClick={onClose}
          aria-label="Close filter drawer"
          className="text-slate-400 text-xs font-bold bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 hover:text-slate-200 cursor-pointer"
        >
          Close ✕
        </button>
      </div>

      <div className="p-5 md:p-6 space-y-6">
        
        {/* Header Block (Desktop) */}
        <div className="hidden lg:flex justify-between items-center pb-4 border-b border-slate-800/80">
          <h3 className="text-sm font-black text-slate-100 flex items-center gap-2.5">
            <span className="text-blue-400 animate-pulse-ring">⚙️</span>
            FILTERS
          </h3>
          <button
            onClick={resetFilters}
            aria-label="Reset all active search filters"
            className="text-xs font-bold text-rose-400 hover:text-rose-350 hover:underline transition-colors bg-rose-500/5 hover:bg-rose-500/10 px-2.5 py-1 rounded-lg border border-rose-500/10 cursor-pointer"
          >
            Reset All
          </button>
        </div>

        {/* Mobile-only Reset */}
        <div className="flex lg:hidden justify-end">
          <button
            onClick={resetFilters}
            aria-label="Reset all active search filters"
            className="text-xs font-bold text-rose-400 bg-rose-500/5 hover:bg-rose-500/10 px-2.5 py-1 rounded-lg border border-rose-500/10 cursor-pointer"
          >
            Reset All
          </button>
        </div>

        {/* Quick Actions (Invert selection option) */}
        <div className="space-y-2">
          <h4 className="font-extrabold text-slate-400 text-[10px] tracking-widest uppercase border-b border-slate-800/50 pb-1">
            Selection Quick Actions
          </h4>
          <div className="pt-1 select-none">
            <button
              onClick={handleInvertSelection}
              aria-label="Invert current Pokémon selection"
              className="w-full py-2 px-3 rounded-xl text-center text-xs font-bold bg-blue-500/10 hover:bg-blue-500/25 border border-blue-500/20 text-blue-400 hover:text-blue-300 transition-all cursor-pointer"
            >
              🔄 Invert Current Selection
            </button>
          </div>
        </div>

        {/* Quick Presets Section */}
        <div className="space-y-2">
          <h4 className="font-extrabold text-slate-400 text-[10px] tracking-widest uppercase border-b border-slate-800/50 pb-1">
            Player Quick Presets
          </h4>
          <div className="grid grid-cols-2 gap-1.5 pt-1.5">
            <button
              onClick={() => applyPreset('perfect')}
              aria-label="Apply Perfect 100% IVs Preset"
              className="py-2 px-2.5 rounded-xl text-left text-[11px] font-bold bg-slate-950/40 hover:bg-emerald-500/10 border border-slate-850 hover:border-emerald-500/20 text-slate-300 hover:text-emerald-400 transition-all cursor-pointer"
            >
              💎 Perfect 100% IVs
            </button>
            <button
              onClick={() => applyPreset('trash')}
              aria-label="Apply Mass Transfer Trash Preset"
              className="py-2 px-2.5 rounded-xl text-left text-[11px] font-bold bg-slate-950/40 hover:bg-rose-500/10 border border-slate-850 hover:border-rose-500/20 text-slate-300 hover:text-rose-400 transition-all cursor-pointer"
            >
              🗑️ Mass Transfer Trash
            </button>
            <button
              onClick={() => applyPreset('pvp')}
              aria-label="Apply PVP Evolves Preset"
              className="py-2 px-2.5 rounded-xl text-left text-[11px] font-bold bg-slate-950/40 hover:bg-indigo-500/10 border border-slate-850 hover:border-indigo-500/20 text-slate-300 hover:text-indigo-400 transition-all cursor-pointer"
            >
              ⚔️ PVP Evolves
            </button>
            <button
              onClick={() => applyPreset('legendary')}
              aria-label="Apply Raid Boss Legendary Flex Preset"
              className="py-2 px-2.5 rounded-xl text-left text-[11px] font-bold bg-slate-950/40 hover:bg-amber-500/10 border border-slate-850 hover:border-amber-500/20 text-slate-300 hover:text-amber-400 transition-all cursor-pointer"
            >
              👑 Raid Boss Flex
            </button>
            <button
              onClick={() => applyPreset('trade')}
              aria-label="Apply Trade Eligible Preset"
              className="py-2 px-2.5 rounded-xl text-left text-[11px] font-bold bg-slate-950/40 hover:bg-cyan-500/10 border border-slate-850 hover:border-cyan-500/20 text-slate-300 hover:text-cyan-400 transition-all cursor-pointer"
            >
              🔄 Trade Eligible
            </button>
            <button
              onClick={() => applyPreset('dynamax')}
              aria-label="Apply Dynamax Preset"
              className="py-2 px-2.5 rounded-xl text-left text-[11px] font-bold bg-slate-950/40 hover:bg-purple-500/10 border border-slate-850 hover:border-purple-500/20 text-slate-300 hover:text-purple-400 transition-all cursor-pointer"
            >
              ⚡ Dynamax Only
            </button>
          </div>
        </div>

        {/* Appraisal Section */}
        <div className="space-y-2.5">
          <h4 className="font-extrabold text-slate-400 text-[10px] tracking-widest uppercase border-b border-slate-800/50 pb-1">
            Storage Appraisal (IV)
          </h4>
          <div className="flex gap-1.5 flex-wrap pt-1 select-none">
            {['0*', '1*', '2*', '3*', '4*'].map(star => {
              const isActive = filters.appraisal.includes(star);
              return (
                <button
                  key={star}
                  onClick={() => toggleAppraisal(star)}
                  aria-pressed={isActive}
                  aria-label={`Appraisal rating ${star}`}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all border cursor-pointer ${
                    isActive
                      ? 'bg-blue-500 text-slate-950 border-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.4)]'
                      : 'bg-slate-950/50 border-slate-850 text-slate-400 hover:bg-slate-850 hover:text-slate-200'
                  }`}
                >
                  {star}
                </button>
              );
            })}
          </div>
        </div>

        {/* Attributes Segmented Control with Category Tabs */}
        <div className="space-y-2.5">
          <h4 className="font-extrabold text-slate-400 text-[10px] tracking-widest uppercase border-b border-slate-800/50 pb-1">
            Attributes & Modifiers
          </h4>

          {/* Category Tabs */}
          <div className="flex gap-1 overflow-x-auto no-scrollbar pb-1 select-none">
            {ATTRIBUTE_CATEGORIES.map(cat => (
              <button
                key={cat.name}
                onClick={() => setActiveTab(cat.name)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all border cursor-pointer ${
                  activeTab === cat.name
                    ? 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                    : 'bg-slate-950/40 text-slate-400 border-slate-850 hover:text-slate-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
          
          <div className="grid grid-cols-1 gap-1.5 pt-1">
            {ATTRIBUTE_CATEGORIES.find(c => c.name === activeTab)?.items.map(attr => {
              const currentVal = filters[attr];
              
              return (
                <div key={attr} className="bg-slate-950/30 p-2 rounded-xl border border-slate-850/80 flex items-center justify-between gap-3">
                  <span className="capitalize text-xs font-bold text-slate-300 truncate" title={attr}>
                    {attr}
                  </span>
                  
                  {/* Segmented Tri-State Control */}
                  <div className="flex rounded-lg overflow-hidden border border-slate-850 bg-slate-950 text-xs shrink-0 select-none">
                    <button
                      onClick={() => setAttribute(attr, currentVal === true ? null : true)}
                      aria-label={`Require ${attr}`}
                      aria-pressed={currentVal === true}
                      className={`px-2.5 py-1 font-extrabold transition-all border-r border-slate-850 cursor-pointer ${
                        currentVal === true 
                          ? 'bg-emerald-500 text-slate-950 shadow-inner' 
                          : 'text-slate-500 hover:bg-slate-900 hover:text-slate-350'
                      }`}
                      title={`Require ${attr}`}
                    >
                      ✓
                    </button>
                    
                    <button
                      onClick={() => setAttribute(attr, null)}
                      aria-label={`Ignore ${attr} filter`}
                      aria-pressed={currentVal === null}
                      className={`px-2.5 py-1 font-bold transition-all border-r border-slate-850 cursor-pointer ${
                        currentVal === null 
                          ? 'bg-slate-800 text-slate-300' 
                          : 'text-slate-500 hover:bg-slate-900 hover:text-slate-350'
                      }`}
                      title={`Ignore ${attr} filter`}
                    >
                      —
                    </button>

                    <button
                      onClick={() => setAttribute(attr, currentVal === false ? null : false)}
                      aria-label={`Exclude ${attr}`}
                      aria-pressed={currentVal === false}
                      className={`px-2.5 py-1 font-extrabold transition-all cursor-pointer ${
                        currentVal === false 
                          ? 'bg-rose-500 text-slate-950 shadow-inner' 
                          : 'text-slate-500 hover:bg-slate-900 hover:text-slate-350'
                      }`}
                      title={`Exclude ${attr}`}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Age Filter Block */}
        <div className="space-y-2.5">
          <h4 className="font-extrabold text-slate-400 text-[10px] tracking-widest uppercase border-b border-slate-800/50 pb-1">
            Caught Age (Days)
          </h4>
          
          <div className="flex gap-1.5 flex-wrap pt-1 select-none">
            <button
              onClick={() => applyAgePreset('today')}
              aria-label="Filter caught today (0 days)"
              className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-950/40 hover:bg-slate-850 text-slate-400 hover:text-slate-200 border border-slate-850 cursor-pointer"
            >
              Today
            </button>
            <button
              onClick={() => applyAgePreset('yesterday')}
              aria-label="Filter caught yesterday (1 day)"
              className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-950/40 hover:bg-slate-850 text-slate-400 hover:text-slate-200 border border-slate-850 cursor-pointer"
            >
              Yesterday
            </button>
            <button
              onClick={() => applyAgePreset('week')}
              aria-label="Filter caught in last 7 days"
              className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-950/40 hover:bg-slate-850 text-slate-400 hover:text-slate-200 border border-slate-850 cursor-pointer"
            >
              Last 7d
            </button>
            <button
              onClick={() => applyAgePreset('month')}
              aria-label="Filter caught in last 30 days"
              className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-950/40 hover:bg-slate-850 text-slate-400 hover:text-slate-200 border border-slate-850 cursor-pointer"
            >
              Last 30d
            </button>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <div className="relative flex-1">
              <span className="absolute left-2.5 top-2 text-[9px] font-extrabold text-slate-500 uppercase tracking-widest">MIN</span>
              <input
                type="number"
                placeholder="0"
                value={filters.ageMin}
                onChange={e => setFilters(prev => ({ ...prev, ageMin: e.target.value }))}
                aria-label="Minimum caught age in days"
                className="w-full pl-9 pr-2 py-2 rounded-xl bg-slate-950 border border-slate-850 text-xs text-slate-200 placeholder-slate-650 focus:outline-none focus:border-blue-500 font-bold"
              />
            </div>
            <span className="text-slate-600 font-bold">-</span>
            <div className="relative flex-1">
              <span className="absolute left-2.5 top-2 text-[9px] font-extrabold text-slate-500 uppercase tracking-widest">MAX</span>
              <input
                type="number"
                placeholder="Any"
                value={filters.ageMax}
                onChange={e => setFilters(prev => ({ ...prev, ageMax: e.target.value }))}
                aria-label="Maximum caught age in days"
                className="w-full pl-9 pr-2 py-2 rounded-xl bg-slate-950 border border-slate-850 text-xs text-slate-200 placeholder-slate-650 focus:outline-none focus:border-blue-500 font-bold"
              />
            </div>
          </div>
        </div>

        {/* Types Filter Block */}
        <div className="space-y-2.5 pb-4">
          <h4 className="font-extrabold text-slate-400 text-[10px] tracking-widest uppercase border-b border-slate-800/50 pb-1">
            Types Selection
          </h4>
          <div className="flex gap-1.5 flex-wrap pt-1 select-none">
            {TYPES.map(type => {
              const isSelected = filters.types.includes(type);
              
              return (
                <button
                  key={type}
                  onClick={() => toggleType(type)}
                  aria-pressed={isSelected}
                  aria-label={`${type} type filter`}
                  className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold text-white capitalize transition-all duration-200 hover:scale-105 shadow-sm border border-white/5 cursor-pointer ${
                    isSelected
                      ? `bg-type-${type} shadow-type-${type} opacity-100 scale-105`
                      : `bg-type-${type} opacity-25 hover:opacity-50`
                  }`}
                >
                  {type}
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}

export default React.memo(FilterPanel);
