import React from 'react';

function PwaStatusBadge({
  status,
  isOnline,
  errorMessage,
  bannerDismissed,
  onApplyUpdate,
  onDismiss,
}) {
  let content = null;

  if (!isOnline) {
    content = (
      <span
        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-100 text-amber-950 border border-amber-300 shadow-2xs shrink-0"
        title="Running offline from local Service Worker cache"
      >
        <span className="w-2 h-2 rounded-full bg-amber-500" aria-hidden="true" />
        <span>Offline Mode</span>
      </span>
    );
  } else if (status === 'update-available') {
    content = (
      <button
        type="button"
        onClick={onApplyUpdate}
        className="compact-inline-chip inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#1d7a4d] hover:bg-[#16603c] text-white border border-white shadow-sm cursor-pointer shrink-0"
        title="A new offline version is ready. Click to reload."
      >
        <span aria-hidden="true">↻</span>
        <span>Update Ready</span>
      </button>
    );
  } else if (status === 'updating') {
    content = (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#dff4fb] text-[#0b698e] border border-[#0d7da8]/30 shrink-0">
        Updating…
      </span>
    );
  } else if (status === 'error' && !bannerDismissed) {
    content = (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-800 border border-rose-300 shadow-2xs shrink-0"
        title={errorMessage || 'Offline cache sync failed'}
      >
        <span>Offline Cache Error</span>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss offline error badge"
          className="compact-inline-chip ml-0.5 text-rose-700 hover:text-rose-950 cursor-pointer leading-none"
        >
          ✕
        </button>
      </span>
    );
  } else if (status === 'offline-ready' && !bannerDismissed) {
    content = (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50/95 text-[#1d7a4d] border border-emerald-300/80 shadow-2xs shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-[#1d7a4d]" aria-hidden="true" />
        <span>Offline Ready</span>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss offline ready badge"
          className="compact-inline-chip ml-0.5 text-[#1d7a4d]/80 hover:text-[#123c4d] cursor-pointer leading-none"
        >
          ✕
        </button>
      </span>
    );
  }

  return (
    <span role="status" aria-live="polite" className="inline-flex items-center shrink-0">
      {content}
    </span>
  );
}

export default React.memo(PwaStatusBadge);
