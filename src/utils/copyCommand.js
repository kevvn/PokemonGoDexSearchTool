/**
 * Unified Accessible Copy Engine implementing modern-web-guidance `copy-button`:
 * - Declarative Invoker Commands (`command="--copy"` + `commandfor="<id>"`) with capture-phase listener
 *   and single-path click fallback when `CommandEvent` is unsupported.
 * - Async Clipboard API with synchronous `document.execCommand('copy')` last-resort fallback for HTTP LAN mobile testing.
 * - WeakMap timer cleanup, `data-copied` / `data-failed` state attributes (never disabling the button),
 *   and `\u00A0` deduplication so iOS VoiceOver announces consecutive copies.
 */

const copyTimers = new WeakMap();
let lastAnnouncedMessage = '';
let listenersRegistered = false;

export function legacyCopy(text) {
  const field = Object.assign(document.createElement('textarea'), { value: text });
  field.setAttribute('readonly', '');
  field.style.cssText = 'position:fixed;inset-block-start:0;opacity:0';
  document.body.append(field);
  field.select();
  try {
    return document.execCommand('copy');
  } finally {
    field.remove();
  }
}

export async function writeClipboardText(text) {
  if (!text) return false;
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return legacyCopy(text);
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
    requestAnimationFrame(() => {
      tip.textContent = message;
    });
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
  const text = target.matches('input, textarea')
    ? target.value
    : (target.dataset?.copyText ?? target.innerText.trim());
  if (!text) return false;

  const ok = await writeClipboardText(text);
  reportCopyFeedback(button, ok);

  if (ok && typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('pogo-copied-string', { detail: { text } }));
  }
  return ok;
}

export function ensureCopyCommandRegistered() {
  if (listenersRegistered || typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }
  listenersRegistered = true;

  // Register ONLY ONE path so a click never copies twice (mwg: copy-button)
  if ('CommandEvent' in window) {
    document.addEventListener(
      'command',
      (event) => {
        if (event.command && event.command.startsWith('--copy')) {
          copyElementText(event.source, event.target);
        }
      },
      true
    );
  } else {
    document.addEventListener('click', (event) => {
      const button = event.target.closest?.('button[command^="--copy"]');
      if (!button) return;
      const targetId = button.getAttribute('commandfor');
      const target = targetId ? document.getElementById(targetId) : null;
      if (target) {
        copyElementText(button, target);
      }
    });
  }
}
