/**
 * Responsive image helpers. Unsplash (and imgix-style CDNs) resize on the fly via
 * query params, so we request the size a slot actually needs instead of one 1200px file.
 */
const RESIZABLE = /images\.unsplash\.com|plus\.unsplash\.com/;

export const sized = (url, width, height) => {
  if (!url || !RESIZABLE.test(url)) return url;
  try {
    const u = new URL(url);
    u.searchParams.set('w', String(width));
    if (height) u.searchParams.set('h', String(height));
    u.searchParams.set('q', '72');
    u.searchParams.set('auto', 'format');
    u.searchParams.set('fit', 'crop');
    return u.toString();
  } catch {
    return url;
  }
};

/** srcSet for a slot rendered at `base` CSS px wide (1x / 1.5x / 2x). */
export const srcSetFor = (url, base, ratio) => {
  if (!url || !RESIZABLE.test(url)) return undefined;
  return [1, 1.5, 2]
    .map((d) => {
      const w = Math.round(base * d);
      return `${sized(url, w, ratio ? Math.round(w * ratio) : undefined)} ${w}w`;
    })
    .join(', ');
};
