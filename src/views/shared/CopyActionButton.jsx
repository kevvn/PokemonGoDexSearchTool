import React, { useId } from 'react';

/**
 * Unified declarative copy trigger consuming `copyService` (`command="--copy"` + `commandfor`).
 * Eliminates per-component clipboard state machines, timers, and `useEffect` hooks.
 * Keeps visible text labels exposed to assistive tech (never wraps labels in `aria-hidden="true"`).
 */
function CopyActionButton({
  text = '',
  targetId = '',
  syncToDock = true,
  ariaLabel,
  title,
  className = '',
  disabled = false,
  idleContent,
  copiedContent,
}) {
  const generatedId = useId();
  const resolvedTargetId = targetId || generatedId;
  const isDisabled = disabled || (!targetId && !text);

  return (
    <span className="mwg-copy">
      {!targetId && (
        <span
          id={generatedId}
          data-copy-text={text}
          data-sync-dock={syncToDock ? 'true' : 'false'}
          hidden
        >
          {text}
        </span>
      )}
      <button
        type="button"
        disabled={isDisabled}
        {...{ command: '--copy', commandfor: resolvedTargetId }}
        aria-label={ariaLabel}
        title={title}
        className={`mwg-copy-btn ${className}`}
      >
        <span className="icon-copy">
          {idleContent}
        </span>
        <span className="icon-check">
          {copiedContent}
        </span>
      </button>
      <span className="mwg-copy-tip" role="status" />
    </span>
  );
}

export default React.memo(CopyActionButton);
