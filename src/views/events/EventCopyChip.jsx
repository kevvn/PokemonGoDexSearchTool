import React from 'react';
import CopyActionButton from '../shared/CopyActionButton';

const CHIP_VARIANT_STYLES = {
  purple: 'bg-[#7c52b5] hover:bg-[#6941a1] text-white border-white/80',
  indigo: 'bg-[#3b6fd4] hover:bg-[#2d5ec0] text-white border-white/80',
  teal: 'bg-[#0d7da8] hover:bg-[#0b698e] text-white border-white/85',
  amber: 'bg-amber-400 hover:bg-amber-500 text-[#123c4d] border-white/90',
  emerald: 'bg-[#1d7a4d] hover:bg-[#16603c] text-white border-white/80',
  rose: 'bg-rose-600 hover:bg-rose-700 text-white border-white/80',
  dark: 'bg-[#094f6c] hover:bg-[#073b50] text-white border-white/80',
};

/**
 * Compact colored copy pill backed by the unified `CopyActionButton` / `copyService`.
 */
function EventCopyChip({ label, text, ariaLabel, variant = 'teal' }) {
  const variantClass = CHIP_VARIANT_STYLES[variant] || CHIP_VARIANT_STYLES.teal;

  return (
    <CopyActionButton
      text={text}
      ariaLabel={ariaLabel || `Copy ${label}`}
      className={`compact-inline-chip min-h-[34px] px-3 py-1 rounded-full text-[11px] font-extrabold border shadow-2xs ${variantClass}`}
      idleContent={label}
      copiedContent={`✓ ${label}`}
    />
  );
}

export default React.memo(EventCopyChip);
