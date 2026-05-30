import React, { useState } from 'react';

const ATTRIBUTES = [
  'shiny',
  'shadow',
  'purified',
  'lucky',
  'legendary',
  'mythical',
  'ultra beasts',
  'costume',
  'evolve',
  'alola',
  'galar',
  'hisui',
  'paldea'
];

const TYPES = [
  'normal', 'fire', 'water', 'electric', 'grass', 'ice', 'fighting', 'poison', 'ground',
  'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'steel', 'dark', 'fairy'
];

function FilterPanel({ filters, setFilters }) {
  const [isOpen, setIsOpen] = useState(false); // Mobile drawer state

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
      // Attributes
      shiny: null,
      shadow: null,
      purified: null,
      lucky: null,
      legendary: null,
      mythical: null,
      'ultra beasts': null,
      costume: null,
      evolve: null,
      alola: null,
      galar: null,
      hisui: null,
      paldea: null,
    });
  };

  // High-value search shortcuts for players
  const applyPreset = (presetName) => {
    resetFilters();
    
    switch (presetName) {
      case 'perfect': // 4*
        setFilters(prev => ({ ...prev, appraisal: ['4*'] }));
        break;
      case 'trash': // 0*, 1*, 2* & not special
        setFilters(prev => ({
          ...prev,
          appraisal: ['0*', '1*', '2*'],
          shiny: false,
          legendary: false,
          mythical: false,
          lucky: false,
          costume: false
        }));
        break;
      case 'pvp': // Evolveable + not legendary/mythical
        setFilters(prev => ({
          ...prev,
          evolve: true,
          legendary: false,
          mythical: false
        }));
        break;
      case 'legendary': // Legendary + Mythical
        setFilters(prev => ({
          ...prev,
          legendary: true
        }));
        break;
      case 'shiny-hunter':
        setFilters(prev => ({
          ...prev,
          shiny: true
        }));
        break;
      default:
        break;
    }
  };

  // Age quick presets
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
      
      {/* Mobile Drawer Trigger Bar */}
      <div 
        onClick={() => setIsOpen(prev => !prev)}
        className="flex lg:hidden items-center justify-between p-4 cursor-pointer bg-slate-900/60 hover:bg-slate-900/90 transition-all select-none border-b border-slate-800/50"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-blue-400">⚙️</span>
          <h3 className="font-extrabold text-sm text-slate-200 tracking-wide uppercase">
            Filter Controls & Presets
          </h3>
        </div>
        <span className="text-slate-400 text-xs font-bold bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-700/60">
          {isOpen ? 'Close ✕' : 'Open ▼'}
        </span>
      </div>

      {/* Main Filter Content (responsive hidden on mobile if closed) */}
      <div className={`p-5 md:p-6 space-y-6 lg:block ${isOpen ? 'block' : 'hidden'}`}>
        
        {/* Header Block */}
        <div className="hidden lg:flex justify-between items-center pb-4 border-b border-slate-800/80">
          <h3 className="text-lg font-black text-slate-100 flex items-center gap-2.5">
            <span className="text-blue-400 animate-pulse-ring">⚙️</span>
            FILTERS
          </h3>
          <button
            onClick={resetFilters}
            className="text-xs font-bold text-rose-400 hover:text-rose-350 hover:underline transition-colors bg-rose-500/5 hover:bg-rose-500/10 px-2.5 py-1 rounded-lg border border-rose-500/10"
          >
            Reset All
          </button>
        </div>

        {/* Mobile-only Reset */}
        <div className="flex lg:hidden justify-end">
          <button
            onClick={resetFilters}
            className="text-xs font-bold text-rose-400 bg-rose-500/5 hover:bg-rose-500/10 px-2.5 py-1 rounded-lg border border-rose-500/10"
          >
            Reset All
          </button>
        </div>

        {/* Quick Presets Section */}
        <div className="space-y-2">
          <h4 className="font-extrabold text-slate-400 text-[10px] tracking-widest uppercase border-b border-slate-800/50 pb-1">
            Player Quick Presets
          </h4>
          <div className="grid grid-cols-2 gap-1.5 pt-1.5">
            <button
              onClick={() => applyPreset('perfect')}
              className="py-2 px-2.5 rounded-xl text-left text-[11px] font-bold bg-slate-950/40 hover:bg-emerald-500/10 border border-slate-850 hover:border-emerald-500/20 text-slate-300 hover:text-emerald-400 transition-all"
            >
              💎 Perfect 100% IVs
            </button>
            <button
              onClick={() => applyPreset('trash')}
              className="py-2 px-2.5 rounded-xl text-left text-[11px] font-bold bg-slate-950/40 hover:bg-rose-500/10 border border-slate-850 hover:border-rose-500/20 text-slate-300 hover:text-rose-400 transition-all"
            >
              🗑️ Mass Transfer Trash
            </button>
            <button
              onClick={() => applyPreset('pvp')}
              className="py-2 px-2.5 rounded-xl text-left text-[11px] font-bold bg-slate-950/40 hover:bg-indigo-500/10 border border-slate-850 hover:border-indigo-500/20 text-slate-300 hover:text-indigo-400 transition-all"
            >
              ⚔️ PVP Evolves
            </button>
            <button
              onClick={() => applyPreset('legendary')}
              className="py-2 px-2.5 rounded-xl text-left text-[11px] font-bold bg-slate-950/40 hover:bg-amber-500/10 border border-slate-850 hover:border-amber-500/20 text-slate-300 hover:text-amber-400 transition-all"
            >
              👑 Raid Boss Flex
            </button>
          </div>
        </div>

        {/* Appraisal Section */}
        <div className="space-y-2.5">
          <h4 className="font-extrabold text-slate-400 text-[10px] tracking-widest uppercase border-b border-slate-800/50 pb-1">
            Storage Appraisal (IV)
          </h4>
          <div className="flex gap-1.5 flex-wrap pt-1">
            {['0*', '1*', '2*', '3*', '4*'].map(star => {
              const isActive = filters.appraisal.includes(star);
              return (
                <button
                  key={star}
                  onClick={() => toggleAppraisal(star)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all border ${
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

        {/* Attributes Segmented Control */}
        <div className="space-y-2.5">
          <h4 className="font-extrabold text-slate-400 text-[10px] tracking-widest uppercase border-b border-slate-800/50 pb-1">
            Attributes & Filters
          </h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2 pt-1">
            {ATTRIBUTES.map(attr => {
              const currentVal = filters[attr]; // true, false, or null
              
              return (
                <div key={attr} className="bg-slate-950/30 p-2 rounded-xl border border-slate-850/80 flex items-center justify-between gap-3">
                  <span className="capitalize text-xs font-bold text-slate-300 truncate" title={attr}>
                    {attr}
                  </span>
                  
                  {/* Segmented Row */}
                  <div className="flex rounded-lg overflow-hidden border border-slate-850 bg-slate-950 text-xs shrink-0 select-none">
                    {/* Include Stage (✓) */}
                    <button
                      onClick={() => setAttribute(attr, currentVal === true ? null : true)}
                      className={`px-2.5 py-1 font-extrabold transition-all border-r border-slate-850 ${
                        currentVal === true 
                          ? 'bg-emerald-500 text-slate-950 shadow-inner' 
                          : 'text-slate-500 hover:bg-slate-900 hover:text-slate-350'
                      }`}
                      title={`Require ${attr}`}
                    >
                      ✓
                    </button>
                    
                    {/* Neutral/Ignore Stage (—) */}
                    <button
                      onClick={() => setAttribute(attr, null)}
                      className={`px-2.5 py-1 font-bold transition-all border-r border-slate-850 ${
                        currentVal === null 
                          ? 'bg-slate-800 text-slate-300' 
                          : 'text-slate-500 hover:bg-slate-900 hover:text-slate-350'
                      }`}
                      title="Ignore filter"
                    >
                      —
                    </button>

                    {/* Exclude Stage (✕) */}
                    <button
                      onClick={() => setAttribute(attr, currentVal === false ? null : false)}
                      className={`px-2.5 py-1 font-extrabold transition-all ${
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
          
          {/* Age Presets */}
          <div className="flex gap-1.5 flex-wrap pt-1 select-none">
            <button
              onClick={() => applyAgePreset('today')}
              className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-950/40 hover:bg-slate-850 text-slate-400 hover:text-slate-200 border border-slate-850"
            >
              Today
            </button>
            <button
              onClick={() => applyAgePreset('yesterday')}
              className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-950/40 hover:bg-slate-850 text-slate-400 hover:text-slate-200 border border-slate-850"
            >
              Yesterday
            </button>
            <button
              onClick={() => applyAgePreset('week')}
              className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-950/40 hover:bg-slate-850 text-slate-400 hover:text-slate-200 border border-slate-850"
            >
              Last 7d
            </button>
            <button
              onClick={() => applyAgePreset('month')}
              className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-950/40 hover:bg-slate-850 text-slate-400 hover:text-slate-200 border border-slate-850"
            >
              Last 30d
            </button>
          </div>

          {/* Age input boxes */}
          <div className="flex items-center gap-2 pt-1">
            <div className="relative flex-1">
              <span className="absolute left-2.5 top-2 text-[9px] font-extrabold text-slate-500 uppercase tracking-widest">MIN</span>
              <input
                type="number"
                placeholder="0"
                value={filters.ageMin}
                onChange={e => setFilters(prev => ({ ...prev, ageMin: e.target.value }))}
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
          <div className="flex gap-1.5 flex-wrap pt-1">
            {TYPES.map(type => {
              const isSelected = filters.types.includes(type);
              
              return (
                 <button
                  key={type}
                  onClick={() => toggleType(type)}
                  className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold text-white capitalize transition-all duration-200 hover:scale-105 shadow-sm border border-white/5 ${
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
