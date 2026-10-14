import React, { useCallback, useState } from 'react';
import { ImageOff } from 'lucide-react';

/**
 * The one way the app renders remote photos.
 *
 * - Fades in on load, and checks `complete` on mount so an image served from cache
 *   (whose load event fired before React attached) is never left invisible.
 * - On error (CDN blocked, offline, bad URL) it swaps to a neutral tile so cards keep
 *   their shape — the parent decides the aspect ratio, this fills it.
 */
export default function SafeImage({ src, srcSet, sizes, alt = '', className = '', loading = 'lazy', label, ...rest }) {
  const [status, setStatus] = useState(src ? 'loading' : 'error');
  const [shownSrc, setShownSrc] = useState(src);
  // New source → start over (render-time reset; an effect would race the cached-image check below).
  if (src !== shownSrc) {
    setShownSrc(src);
    setStatus(src ? 'loading' : 'error');
  }

  const ref = useCallback((img) => {
    if (img && img.complete) setStatus(img.naturalWidth > 0 ? 'loaded' : 'error');
  }, []);

  if (status === 'error') {
    return (
      <div
        role={alt ? 'img' : undefined}
        aria-label={alt || undefined}
        className={`flex items-center justify-center bg-gradient-to-br from-sunken to-line text-ink-3 ${className}`}
      >
        {label ? (
          <span className="text-[28px] font-semibold tracking-[-0.02em]">{label}</span>
        ) : (
          <ImageOff size={22} strokeWidth={1.5} aria-hidden="true" />
        )}
      </div>
    );
  }

  return (
    <img
      ref={ref}
      src={src}
      srcSet={srcSet}
      sizes={sizes}
      alt={alt}
      loading={loading}
      decoding="async"
      onLoad={() => setStatus('loaded')}
      onError={() => setStatus('error')}
      className={`transition-opacity duration-500 ${status === 'loaded' ? 'opacity-100' : 'opacity-0'} ${className}`}
      {...rest}
    />
  );
}
