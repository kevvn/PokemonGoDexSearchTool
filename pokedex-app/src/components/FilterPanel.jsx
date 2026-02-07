import React from 'react';

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

export default function FilterPanel({ filters, setFilters }) {
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

  return (
    <div className="bg-gray-50 border-b border-gray-200 p-4 md:p-6 shadow-sm space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <span>⚙️</span>
          Filters
        </h3>
        <button
            onClick={resetFilters}
            className="text-xs text-red-500 hover:underline"
        >
            Reset All
        </button>
      </div>

      {/* Appraisal */}
      <div>
        <h4 className="font-semibold text-gray-700 mb-2 text-sm uppercase tracking-wide">Appraisal</h4>
        <div className="flex gap-2 flex-wrap">
          {['0*', '1*', '2*', '3*', '4*'].map(star => (
            <button
              key={star}
              onClick={() => toggleAppraisal(star)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                filters.appraisal.includes(star)
                  ? 'bg-blue-500 text-white border-blue-600'
                  : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {star}
            </button>
          ))}
        </div>
      </div>

      {/* Attributes */}
      <div>
        <h4 className="font-semibold text-gray-700 mb-2 text-sm uppercase tracking-wide">Attributes</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {ATTRIBUTES.map(attr => (
            <div key={attr} className="bg-white p-2 rounded-lg border border-gray-200 flex flex-col gap-2 shadow-sm">
              <span className="capitalize text-xs font-medium text-gray-600 text-center truncate" title={attr}>{attr}</span>
              <div className="flex rounded-md overflow-hidden border border-gray-300">
                <button
                  onClick={() => setAttribute(attr, filters[attr] === true ? null : true)}
                  className={`flex-1 py-1 text-xs font-bold transition-colors ${
                    filters[attr] === true ? 'bg-green-500 text-white' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                  }`}
                  title={`Include ${attr}`}
                >
                  ✓
                </button>
                <div className="w-[1px] bg-gray-300"></div>
                <button
                  onClick={() => setAttribute(attr, filters[attr] === false ? null : false)}
                  className={`flex-1 py-1 text-xs font-bold transition-colors ${
                    filters[attr] === false ? 'bg-red-500 text-white' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                  }`}
                  title={`Exclude ${attr}`}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Age */}
      <div>
        <h4 className="font-semibold text-gray-700 mb-2 text-sm uppercase tracking-wide">Age (Days)</h4>
        <div className="flex items-center gap-2 max-w-xs">
          <input
            type="number"
            placeholder="Min (0)"
            value={filters.ageMin}
            onChange={e => setFilters(prev => ({ ...prev, ageMin: e.target.value }))}
            className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <span className="text-gray-400">-</span>
          <input
            type="number"
            placeholder="Max"
            value={filters.ageMax}
            onChange={e => setFilters(prev => ({ ...prev, ageMax: e.target.value }))}
            className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>

      {/* Types */}
      <div>
        <h4 className="font-semibold text-gray-700 mb-2 text-sm uppercase tracking-wide">Types</h4>
        <div className="flex gap-2 flex-wrap">
          {TYPES.map(type => (
             <button
              key={type}
              onClick={() => toggleType(type)}
              className={`px-3 py-1 rounded-full text-xs font-bold text-white capitalize transition-transform hover:scale-105 shadow-sm ${
                 filters.types.includes(type)
                 ? `bg-type-${type} ring-2 ring-offset-1 ring-gray-400 opacity-100`
                 : `bg-type-${type} opacity-40 hover:opacity-70`
              }`}
             >
               {type}
             </button>
          ))}
        </div>
      </div>

    </div>
  );
}
