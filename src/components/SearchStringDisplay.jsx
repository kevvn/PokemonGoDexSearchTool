import React, { useState } from 'react';

function SearchStringDisplay({ searchString }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(searchString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white border-t border-gray-200 p-4 sticky bottom-0 z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
      <div className="max-w-7xl mx-auto flex items-center gap-4">
        <input
          type="text"
          readOnly
          value={searchString}
          placeholder="Select Pokemon or Filters..."
          className="flex-1 p-3 border border-gray-300 rounded-lg bg-gray-50 text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
        <button
          onClick={handleCopy}
          className={`px-6 py-3 rounded-lg font-medium transition-all ${
            copied
              ? 'bg-green-500 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
    </div>
  );
}

export default React.memo(SearchStringDisplay);
