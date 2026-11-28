/**
 * Shared React 19 ref cleanup helpers for sticky pill tablists and `hidden="until-found"` panels.
 * Replaces duplicated DOM observer / `beforematch` logic across EventsHubView and TradesHubView.
 */

export function attachBeforeMatch(panel, onMatch) {
  if (!panel) return undefined;
  panel.addEventListener('beforematch', onMatch);
  return () => panel.removeEventListener('beforematch', onMatch);
}

export function attachTablistFadeObserver(el) {
  if (!el || typeof CSS === 'undefined' || CSS.supports('animation-timeline', 'scroll()')) {
    return undefined;
  }
  const first = el.firstElementChild;
  const last = el.lastElementChild;
  if (!first || !last || typeof IntersectionObserver === 'undefined') {
    return undefined;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.target === first) {
          el.classList.toggle('more-start', !entry.isIntersecting);
        }
        if (entry.target === last) {
          el.classList.toggle('more-end', !entry.isIntersecting);
        }
      }
    },
    { root: el, threshold: 0.95 }
  );

  observer.observe(first);
  observer.observe(last);
  return () => observer.disconnect();
}
