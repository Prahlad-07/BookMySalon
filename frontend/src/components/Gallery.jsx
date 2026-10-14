import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Grid3x3, X } from 'lucide-react';
import { useT } from '../i18n';
import { sized, srcSetFor } from '../lib/images';
import SafeImage from './SafeImage';

/** Full-screen photo viewer: arrows / swipe-free buttons, Esc to close, focus kept inside. */
function Lightbox({ images, index, onIndex, onClose, label }) {
  const t = useT();
  const closeRef = useRef(null);
  const count = images.length;
  const go = useCallback((delta) => onIndex((index + delta + count) % count), [index, count, onIndex]);

  useEffect(() => {
    const previous = document.activeElement;
    closeRef.current?.focus();
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
      previous?.focus?.();
    };
  }, [go, onClose]);

  return (
    <div className="fixed inset-0 z-[80] flex flex-col bg-black/95 text-white" role="dialog" aria-modal="true" aria-label={label}>
      <div className="flex items-center justify-between px-4 py-3 sm:px-6">
        <span className="num text-sm text-white/70">
          {index + 1} / {count}
        </span>
        <button ref={closeRef} type="button" onClick={onClose} className="icon-btn text-white hover:bg-white/10 hover:text-white" aria-label={t('dialog.close')}>
          <X size={20} />
        </button>
      </div>
      <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-6 sm:px-16">
        <SafeImage
          key={images[index]}
          loading="eager"
          src={sized(images[index], 1600)}
          alt=""
          className="animate-fade max-h-full max-w-full rounded-lg object-contain"
        />
        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              className="absolute left-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 sm:left-4"
              aria-label={t('gallery.prev')}
            >
              <ChevronLeft size={22} />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 sm:right-4"
              aria-label={t('gallery.next')}
            >
              <ChevronRight size={22} />
            </button>
          </>
        )}
      </div>
      <div className="flex justify-center gap-2 overflow-x-auto px-4 pb-5 no-scrollbar">
        {images.map((src, i) => (
          <button
            key={src}
            type="button"
            onClick={() => onIndex(i)}
            className={`h-14 w-20 shrink-0 overflow-hidden rounded-md ring-2 transition ${i === index ? 'ring-white' : 'ring-transparent opacity-60 hover:opacity-100'}`}
            aria-label={t('gallery.photo', { n: i + 1 })}
          >
            <SafeImage src={sized(src, 160, 112)} alt="" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Salon photo grid: one hero plus up to four tiles (Airbnb-style) on desktop,
 * a swipeable strip on mobile. Any photo opens the full-screen viewer.
 */
export default function Gallery({ images = [], name }) {
  const t = useT();
  const [open, setOpen] = useState(null);
  if (!images.length) return null;
  const tiles = images.slice(1, 5);
  const label = t('salon.imageAlt', { name });

  return (
    <>
      {/* Mobile: horizontal snap strip */}
      <div className="-mx-5 flex snap-x snap-mandatory gap-2 overflow-x-auto px-5 no-scrollbar md:hidden">
        {images.map((src, i) => (
          <button key={src} type="button" onClick={() => setOpen(i)} className="w-[88%] shrink-0 snap-center overflow-hidden rounded-xl">
            <SafeImage
              src={sized(src, 600, 420)}
              srcSet={srcSetFor(src, 360, 0.7)}
              sizes="88vw"
              alt={i === 0 ? label : ''}
              loading={i === 0 ? 'eager' : 'lazy'}
              className="aspect-[10/7] w-full object-cover"
            />
          </button>
        ))}
      </div>

      {/* Desktop grid */}
      <div className={`relative hidden h-[420px] gap-2 overflow-hidden rounded-2xl md:grid ${tiles.length ? 'grid-cols-4 grid-rows-2' : 'grid-cols-1'}`}>
        <button type="button" onClick={() => setOpen(0)} className={`group relative overflow-hidden ${tiles.length ? 'col-span-2 row-span-2' : ''}`}>
          <SafeImage
            src={sized(images[0], 900, 840)}
            srcSet={srcSetFor(images[0], 640, 0.66)}
            sizes="50vw"
            alt={label}
            loading="eager"
            className="h-full w-full object-cover transition duration-500 group-hover:brightness-95"
          />
        </button>
        {tiles.map((src, i) => (
          <button
            key={src}
            type="button"
            onClick={() => setOpen(i + 1)}
            className={`group relative overflow-hidden ${tiles.length < 4 && i === tiles.length - 1 ? 'col-span-2' : ''} ${tiles.length < 3 ? 'row-span-2' : ''}`}
          >
            <SafeImage
              src={sized(src, 480, 420)}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover transition duration-500 group-hover:brightness-95"
            />
          </button>
        ))}
        {images.length > 1 && (
          <button
            type="button"
            onClick={() => setOpen(0)}
            className="absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-lg border border-[#18181b]/10 bg-white px-3.5 py-2 text-[13.5px] font-semibold text-[#18181b] shadow-sm hover:bg-white/90"
          >
            <Grid3x3 size={15} /> {t('gallery.showAll', { count: images.length })}
          </button>
        )}
      </div>

      {open != null && <Lightbox images={images} index={open} onIndex={setOpen} onClose={() => setOpen(null)} label={label} />}
    </>
  );
}
