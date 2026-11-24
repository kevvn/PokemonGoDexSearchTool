import React, { useState } from 'react';
import { FALLBACK_SPRITE } from '../../models/spriteUrls';

/**
 * Offline-resilient CORS-safe sprite renderer:
 * - Uses `crossOrigin="anonymous"` so Workbox `CacheFirst` stores verified `200` responses
 *   (avoiding 7 MB opaque-response quota bloat on iOS Safari).
 * - Uses pure React derived fallback state (resets cleanly whenever `src` changes; zero DOM mutation).
 */
function PokemonSprite({
  src,
  fallbackSrc = '',
  alt,
  className = '',
  width,
  height,
  loading = 'lazy',
}) {
  const [fallbackState, setFallbackState] = useState({ forSrc: src, step: 0 });
  const activeStep = fallbackState.forSrc === src ? fallbackState.step : 0;

  let resolvedSrc = src || FALLBACK_SPRITE;
  if (activeStep === 1 && fallbackSrc && fallbackSrc !== src) {
    resolvedSrc = fallbackSrc;
  } else if (activeStep >= 2 || (activeStep === 1 && (!fallbackSrc || fallbackSrc === src))) {
    resolvedSrc = FALLBACK_SPRITE;
  }

  const handleError = () => {
    if (resolvedSrc === FALLBACK_SPRITE) return;
    setFallbackState({
      forSrc: src,
      step: activeStep === 0 && fallbackSrc && fallbackSrc !== src ? 1 : 2,
    });
  };

  return (
    <img
      src={resolvedSrc}
      crossOrigin={resolvedSrc.startsWith('data:') ? undefined : 'anonymous'}
      alt={alt}
      onError={handleError}
      className={className}
      width={width}
      height={height}
      loading={loading}
    />
  );
}

export default React.memo(PokemonSprite);
