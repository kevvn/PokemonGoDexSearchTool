/**
 * Unified Accessible Copy Service implementing `modern-web-guidance` `copy-button`:
 * - Single-path registration: native Invoker Commands (`command="--copy"` + `commandfor="<id>"`)
 *   with capture-phase listener when `CommandEvent` is supported, or single-path click fallback otherwise.
 * - Synchronous fallback (`legacyCopy`) executed immediately when `navigator.clipboard.writeText`
 *   is unavailable (preserves iOS Safari user-gesture activation), plus Top Layer `<dialog>` hosting.
 * - `WeakMap` timer cleanup, `data-copied` / `data-failed` state attributes (never disabling buttons),
 *   and `\u00A0` deduplication so iOS VoiceOver announces consecutive identical copies.
 */

const copyTimers = new WeakMap();
let lastAnnouncedMessage = '';
let listenersRegistered = false;
let onCopiedHandler = null;
let teardownListeners = null;

export function legacyCopy(text, sourceButton = null) {
  if (typeof document === 'undefined') return false;
  const host = sourceButton?.closest?.('dialog[open]') || document.body;
  if (!host) return false;

  const field = Object.assign(document.createElement('textarea'), { value: text });
  // Avoid `readonly` blocking selection on iOS Safari; prevent focus scroll & keyboard flash
  field.setAttribute('aria-hidden', 'true');
  field.setAttribute('tabindex', '-1');
  field.style.cssText =
    'position:fixed;inset-block-start:0;inset-inline-start:0;width:2em;height:2em;padding:0;border:0;outline:none;box-shadow:none;background:transparent;opacity:0;font-size:16px;';
  host.append(field);

  const prevFocus = document.activeElement;
  try {
    field.focus({ preventScroll: true });
    field.select();
    field.setSelectionRange(0, text.length);
    return document.execCommand('copy');
  } catch {
    return false;
  } finally {
    field.remove();
    if (prevFocus && typeof prevFocus.focus === 'function' && prevFocus.isConnected) {
      try {
        prevFocus.focus({ preventScroll: true });
      } catch {
        // Ignore focus restoration error
      }
    }
  }
}

export async function writeClipboardText(text, sourceButton = null) {
  if (!text) return false;
  // Check synchronously BEFORE any `await` so HTTP LAN / legacy browsers preserve user-gesture stack
  const canUseAsyncClipboard =
    typeof navigator !== 'undefined' &&
    typeof navigator.clipboard?.writeText === 'function' &&
    (typeof window === 'undefined' || window.isSecureContext !== false);

  if (!canUseAsyncClipboard) {
    return legacyCopy(text, sourceButton);
  }

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return legacyCopy(text, sourceButton);
  }
}

export function reportCopyFeedback(button, ok) {
  if (!button) return;
  const tip =
    button.nextElementSibling?.getAttribute('role') === 'status'
      ? button.nextElementSibling
      : null;

  clearTimeout(copyTimers.get(button));
  button.removeAttribute('data-copied');
  button.removeAttribute('data-failed');

  let message = ok ? 'Copied' : 'Copy failed';
  if (message === lastAnnouncedMessage) {
    message += '\u00A0';
  }
  lastAnnouncedMessage = message;

  if (tip) tip.textContent = '';
  void button.offsetWidth;
  button.setAttribute(ok ? 'data-copied' : 'data-failed', '');
  if (tip) {
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => {
        tip.textContent = message;
      });
    } else {
      tip.textContent = message;
    }
  }

  copyTimers.set(
    button,
    setTimeout(() => {
      button.removeAttribute('data-copied');
      button.removeAttribute('data-failed');
      if (tip) tip.textContent = '';
    }, 2000)
  );
}

export async function copyElementText(button, target) {
  if (!target) return false;
  const text = target.matches?.('input, textarea')
    ? target.value
    : (target.dataset?.copyText ?? target.innerText?.trim() ?? target.textContent?.trim() ?? '');
  if (!text) return false;

  const ok = await writeClipboardText(text, button);
  reportCopyFeedback(button, ok);

  if (ok && target.dataset?.syncDock !== 'false') {
    onCopiedHandler?.(text);
  }
  return ok;
}

export function initializeCopyService({ onCopied } = {}) {
  if (typeof onCopied === 'function') {
    onCopiedHandler = onCopied;
  }

  if (listenersRegistered || typeof window === 'undefined' || typeof document === 'undefined') {
    return teardownListeners || (() => {});
  }
  listenersRegistered = true;

  // Register ONLY ONE path so a click never copies twice (mwg: copy-button)
  if ('CommandEvent' in window) {
    const handleCommand = (event) => {
      if (event.command && event.command.startsWith('--copy')) {
        copyElementText(event.source, event.target);
      }
    };
    document.addEventListener('command', handleCommand, true);
    teardownListeners = () => {
      document.removeEventListener('command', handleCommand, true);
      listenersRegistered = false;
      teardownListeners = null;
    };
  } else {
    const handleClick = (event) => {
      const button = event.target?.closest?.('button[command^="--copy"]');
      if (!button) return;
      const targetId = button.getAttribute('commandfor');
      const target = targetId ? document.getElementById(targetId) : null;
      if (target) {
        copyElementText(button, target);
      }
    };
    document.addEventListener('click', handleClick);
    teardownListeners = () => {
      document.removeEventListener('click', handleClick);
      listenersRegistered = false;
      teardownListeners = null;
    };
  }

  return teardownListeners;
}
