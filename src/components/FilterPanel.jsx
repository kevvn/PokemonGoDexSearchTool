import React, { useState } from 'react';
import { ATTRIBUTES, TYPES } from '../utils/searchUtils';

const ATTRIBUTE_CATEGORIES = [
  {
    name: 'Status & Rarities',
    icon: '✨',
    items: ['shiny', 'lucky', 'legendary', 'mythical', 'ultra beasts', 'shadow', 'purified', 'favorite']
  },
  {
    name: 'Forms & Battle',
    icon: '⚡',
    items: ['mega', 'megaevolve', 'dynamax', 'gigantamax', 'evolve', 'costume']
  },
  {
    name: 'Origin & Encounters',
    icon: '📍',
    items: ['traded', 'hatched', 'raid', 'remoteraid', 'research', 'defender', 'background', 'locationbackground', 'specialbackground', 'profilebackground', 'locationcard']
  },
  {
    name: 'Size & Buddy Levels',
    icon: '📏',
    items: ['xxs', 'xxl', 'buddy0', 'buddy1', 'buddy2', 'buddy3', 'buddy4', 'buddy5']
  },
  {
    name: 'Regional Forms',
    icon: '🗺️',
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
    <div className="bg-white border-b lg:border-b-0 lg:border-r border-teal-200 shadow-2xl relative h-full flex flex-col text-slate-800">
      
      {/* Pokémon GO Modal Header */}
      <div className="flex items-center justify-between p-4 bg-[#edf7f4] border-b border-teal-200 shrink-0">
        <div className="flex items-center gap-2.5 select-none">
          <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
            ⚙️
          </div>
          <div>
            <h3 className="font-black text-sm text-slate-900 tracking-wider uppercase">
              Search Filters
            </h3>
            <span className="text-[10px] text-[#1b7a69] font-black tracking-wide">
              Pokémon GO Query Settings
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={resetFilters}
            aria-label="Reset all search filters"
            className="text-xs font-black text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-full border border-rose-200 transition-colors cursor-pointer"
          >
            Reset
          </button>
          
          <button 
            onClick={onClose}
            aria-label="Close filters sheet"
            className="pogo-close-btn w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-xs cursor-pointer shadow-md"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="p-5 md:p-6 space-y-6 overflow-y-auto flex-1">
        
        {/* Quick Invert Selection Action */}
        <div className="space-y-2">
          <h4 className="font-black text-slate-600 text-[10px] tracking-widest uppercase border-b border-teal-100 pb-1 flex items-center gap-1.5">
            <span>🔄</span> Quick Selection Action
          </h4>
          <div className="pt-1 select-none">
            <button
              onClick={handleInvertSelection}
              aria-label="Invert current Pokémon selection"
              className="w-full py-2.5 px-4 rounded-full text-center text-xs font-black uppercase tracking-wider bg-teal-50 hover:bg-teal-100 border border-teal-300 text-teal-800 hover:text-teal-900 transition-all cursor-pointer shadow-sm"
            >
              Invert Selection
            </button>
          </div>
        </div>

        {/* Player Quick Presets Section */}
        <div className="space-y-2">
          <h4 className="font-black text-slate-600 text-[10px] tracking-widest uppercase border-b border-teal-100 pb-1 flex items-center gap-1.5">
            <span>⚡</span> Player Quick Presets
          </h4>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => applyPreset('perfect')}
              aria-label="Apply Perfect 100% IVs Preset"
              className="py-2.5 px-3 rounded-2xl text-left text-[11px] font-black bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-slate-800 hover:text-emerald-800 transition-all cursor-pointer shadow-sm"
            >
              💎 4* (100% IV)
            </button>
            <button
              onClick={() => applyPreset('trash')}
              aria-label="Apply Mass Transfer Trash Preset"
              className="py-2.5 px-3 rounded-2xl text-left text-[11px] font-black bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-300 text-slate-800 hover:text-rose-800 transition-all cursor-pointer shadow-sm"
            >
              🗑️ Mass Transfer
            </button>
            <button
              onClick={() => applyPreset('pvp')}
              aria-label="Apply PVP Evolves Preset"
              className="py-2.5 px-3 rounded-2xl text-left text-[11px] font-black bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-slate-800 hover:text-indigo-800 transition-all cursor-pointer shadow-sm"
            >
              ⚔️ PVP Evolves
            </button>
            <button
              onClick={() => applyPreset('legendary')}
              aria-label="Apply Raid Boss Legendary Flex Preset"
              className="py-2.5 px-3 rounded-2xl text-left text-[11px] font-black bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-300 text-slate-800 hover:text-amber-800 transition-all cursor-pointer shadow-sm"
            >
              👑 Raid Legendaries
            </button>
            <button
              onClick={() => applyPreset('trade')}
              aria-label="Apply Trade Eligible Preset"
              className="py-2.5 px-3 rounded-2xl text-left text-[11px] font-black bg-slate-50 hover:bg-cyan-50 border border-slate-200 hover:border-cyan-300 text-slate-800 hover:text-cyan-800 transition-all cursor-pointer shadow-sm"
            >
              🔄 Trade Eligible
            </button>
            <button
              onClick={() => applyPreset('dynamax')}
              aria-label="Apply Dynamax Preset"
              className="py-2.5 px-3 rounded-2xl text-left text-[11px] font-black bg-slate-50 hover:bg-purple-50 border border-slate-200 hover:border-purple-300 text-slate-800 hover:text-purple-800 transition-all cursor-pointer shadow-sm"
            >
              ⚡ Dynamax Only
            </button>
          </div>
        </div>

        {/* Appraisal Section (Team Leader Appraisal Bar Style) */}
        <div className="space-y-2.5">
          <h4 className="font-black text-slate-600 text-[10px] tracking-widest uppercase border-b border-teal-100 pb-1 flex items-center gap-1.5">
            <span>⭐</span> Appraisal IV Rating
          </h4>
          <div className="grid grid-cols-5 gap-1.5 pt-1 select-none">
            {['0*', '1*', '2*', '3*', '4*'].map(star => {
              const isActive = filters.appraisal.includes(star);
              return (
                <button
                  key={star}
                  onClick={() => toggleAppraisal(star)}
                  aria-pressed={isActive}
                  aria-label={`Appraisal rating ${star}`}
                  className={`py-2 rounded-2xl text-xs font-black transition-all border cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                    isActive
                      ? 'bg-amber-400 text-slate-950 border-amber-500 shadow-[0_0_10px_rgba(251,191,36,0.6)] font-black scale-105'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-[13px]">{star === '4*' ? '👑' : '★'}</span>
                  <span>{star}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Attributes Segmented Control with Category Tabs */}
        <div className="space-y-2.5">
          <h4 className="font-black text-slate-600 text-[10px] tracking-widest uppercase border-b border-teal-100 pb-1 flex items-center gap-1.5">
            <span>🏷️</span> Attributes & Modifiers
          </h4>

          {/* Category Tabs */}
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1 select-none">
            {ATTRIBUTE_CATEGORIES.map(cat => (
              <button
                key={cat.name}
                onClick={() => setActiveTab(cat.name)}
                className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase whitespace-nowrap transition-all border cursor-pointer ${
                  activeTab === cat.name
                    ? 'bg-teal-600 text-white border-teal-700 shadow-sm'
                    : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                }`}
              >
                <span className="mr-1">{cat.icon}</span>
                {cat.name}
              </button>
            ))}
          </div>
          
          <div className="grid grid-cols-1 gap-1.5 pt-1">
            {ATTRIBUTE_CATEGORIES.find(c => c.name === activeTab)?.items.map(attr => {
              const currentVal = filters[attr];
              
              return (
                <div key={attr} className="bg-slate-50 p-2.5 rounded-2xl border border-slate-200 flex items-center justify-between gap-3 shadow-xs">
                  <span className="capitalize text-xs font-black text-slate-800 truncate" title={attr}>
                    {attr}
                  </span>
                  
                  {/* Segmented Tri-State Control */}
                  <div className="flex rounded-full overflow-hidden border border-slate-300 bg-white text-xs shrink-0 select-none shadow-xs">
                    <button
                      onClick={() => setAttribute(attr, currentVal === true ? null : true)}
                      aria-label={`Require ${attr}`}
                      aria-pressed={currentVal === true}
                      className={`px-3 py-1 font-black transition-all border-r border-slate-200 cursor-pointer ${
                        currentVal === true 
                          ? 'bg-emerald-500 text-white shadow-inner font-black' 
                          : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
                      }`}
                      title={`Require ${attr}`}
                    >
                      ✓
                    </button>
                    
                    <button
                      onClick={() => setAttribute(attr, null)}
                      aria-label={`Ignore ${attr} filter`}
                      aria-pressed={currentVal === null}
                      className={`px-3 py-1 font-bold transition-all border-r border-slate-200 cursor-pointer ${
                        currentVal === null 
                          ? 'bg-slate-200 text-slate-800 font-black' 
                          : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
                      }`}
                      title={`Ignore ${attr} filter`}
                    >
                      —
                    </button>

                    <button
                      onClick={() => setAttribute(attr, currentVal === false ? null : false)}
                      aria-label={`Exclude ${attr}`}
                      aria-pressed={currentVal === false}
                      className={`px-3 py-1 font-black transition-all cursor-pointer ${
                        currentVal === false 
                          ? 'bg-rose-500 text-white shadow-inner font-black' 
                          : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
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
          <h4 className="font-black text-slate-600 text-[10px] tracking-widest uppercase border-b border-teal-100 pb-1 flex items-center gap-1.5">
            <span>📅</span> Caught Date / Age
          </h4>
          
          <div className="grid grid-cols-4 gap-1.5 pt-1 select-none">
            <button
              onClick={() => applyAgePreset('today')}
              aria-label="Filter caught today"
              className="py-1.5 rounded-full text-[10px] font-black uppercase bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-900 border border-slate-200 hover:border-teal-300 cursor-pointer text-center"
            >
              Today
            </button>
            <button
              onClick={() => applyAgePreset('yesterday')}
              aria-label="Filter caught yesterday"
              className="py-1.5 rounded-full text-[10px] font-black uppercase bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-900 border border-slate-200 hover:border-teal-300 cursor-pointer text-center"
            >
              1d Ago
            </button>
            <button
              onClick={() => applyAgePreset('week')}
              aria-label="Filter caught in last 7 days"
              className="py-1.5 rounded-full text-[10px] font-black uppercase bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-900 border border-slate-200 hover:border-teal-300 cursor-pointer text-center"
            >
              Last 7d
            </button>
            <button
              onClick={() => applyAgePreset('month')}
              aria-label="Filter caught in last 30 days"
              className="py-1.5 rounded-full text-[10px] font-black uppercase bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-900 border border-slate-200 hover:border-teal-300 cursor-pointer text-center"
            >
              Last 30d
            </button>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <div className="relative flex-1">
              <span className="absolute left-3 top-2 text-[9px] font-black text-teal-700 uppercase tracking-widest">MIN</span>
              <input
                type="number"
                placeholder="0"
                value={filters.ageMin}
                onChange={e => setFilters(prev => ({ ...prev, ageMin: e.target.value }))}
                aria-label="Minimum caught age in days"
                className="w-full pl-11 pr-2 py-2 rounded-2xl bg-white border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 font-bold"
              />
            </div>
            <span className="text-slate-400 font-bold">-</span>
            <div className="relative flex-1">
              <span className="absolute left-3 top-2 text-[9px] font-black text-teal-700 uppercase tracking-widest">MAX</span>
              <input
                type="number"
                placeholder="Any"
                value={filters.ageMax}
                onChange={e => setFilters(prev => ({ ...prev, ageMax: e.target.value }))}
                aria-label="Maximum caught age in days"
                className="w-full pl-11 pr-2 py-2 rounded-2xl bg-white border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 font-bold"
              />
            </div>
          </div>
        </div>

        {/* Types Filter Block */}
        <div className="space-y-2.5 pb-4">
          <h4 className="font-black text-slate-600 text-[10px] tracking-widest uppercase border-b border-teal-100 pb-1 flex items-center gap-1.5">
            <span>🔥</span> Pokémon Types
          </h4>
          <div className="grid grid-cols-3 gap-1.5 pt-1 select-none">
            {TYPES.map(type => {
              const isSelected = filters.types.includes(type);
              
              return (
                <button
                  key={type}
                  onClick={() => toggleType(type)}
                  aria-pressed={isSelected}
                  aria-label={`${type} type filter`}
                  className={`py-1.5 px-2 rounded-full text-[10px] font-black text-white capitalize transition-all duration-150 hover:scale-105 shadow-sm border border-white/20 cursor-pointer text-center truncate ${
                    isSelected
                      ? `bg-type-${type} opacity-100 scale-105 ring-2 ring-slate-800 shadow-md`
                      : `bg-type-${type} opacity-40 hover:opacity-75`
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
