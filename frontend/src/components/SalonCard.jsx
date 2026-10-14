import React from 'react';
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import { useT } from '../i18n';
import { money } from '../i18n/format';
import { sized, srcSetFor } from '../lib/images';
import { openState } from '../utils/time';
import SafeImage from './SafeImage';

/** Area is the part of the address after the last comma ("…, Bandra West"). */
export const areaOf = (salon) => {
  const parts = String(salon?.address || '').split(',').map((p) => p.trim()).filter(Boolean);
  return parts.length > 1 ? parts[parts.length - 1] : parts[0] || '';
};

export function SalonCardSkeleton({ className = '' }) {
  return (
    <div className={className} aria-hidden="true">
      <div className="skeleton aspect-[4/3] rounded-xl" />
      <div className="skeleton mt-3 h-4 w-2/3" />
      <div className="skeleton mt-2 h-3.5 w-1/2" />
      <div className="skeleton mt-2 h-3.5 w-1/3" />
    </div>
  );
}

/**
 * Listing card. `width` is the rendered CSS width used to request a right-sized image.
 * Hovering shows the second photo, so people can judge a place without opening it.
 */
export default function SalonCard({ salon, width = 360, className = '', onHover }) {
  const t = useT();
  const images = salon.images || [];
  const [cover, alt] = images;
  const rating = Number(salon.averageRating || 0);
  const state = openState(salon.openTime, salon.closeTime, new Date(), t);
  const distance = Number(salon.distanceKm);
  const area = areaOf(salon);

  return (
    <Link
      to={`/salon/${salon.id}`}
      className={`group block rounded-xl focus-visible:outline-none ${className}`}
      onMouseEnter={onHover}
      aria-label={salon.name}
    >
      <div className="relative overflow-hidden rounded-xl bg-sunken ring-offset-2 ring-offset-paper group-focus-visible:ring-2 group-focus-visible:ring-accent">
        <SafeImage
          src={cover ? sized(cover, width, Math.round(width * 0.75)) : null}
          srcSet={srcSetFor(cover, width, 0.75)}
          sizes={`${width}px`}
          label={salon.name?.[0] || 'S'}
          className="aspect-[4/3] w-full object-cover"
        />
        {alt && (
          <img
            src={sized(alt, width, Math.round(width * 0.75))}
            alt=""
            loading="lazy"
            decoding="async"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
            className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          />
        )}
        <div className="pointer-events-none absolute left-2.5 top-2.5 flex gap-1.5">
          {Number.isFinite(distance) && salon.distanceKm != null && (
            <span className="num rounded-full bg-white/95 px-2.5 py-1 text-[12px] font-semibold text-[#18181b] shadow-sm">
              {distance < 1
                ? t('salons.metres', { n: Math.round(distance * 1000) })
                : t('salons.km', { n: distance.toFixed(1) })}
            </span>
          )}
          {state?.open && (
            <span className="rounded-full bg-white/95 px-2.5 py-1 text-[12px] font-semibold text-[#0f7a3d] shadow-sm">
              {t('card.openNow')}
            </span>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-start justify-between gap-3">
        <h3 className="min-w-0 truncate text-[15.5px] font-semibold tracking-[-0.01em] text-ink">{salon.name}</h3>
        {rating > 0 ? (
          <span className="num flex shrink-0 items-center gap-1 text-[14px] font-semibold text-ink">
            <Star size={13} className="fill-gold text-gold" aria-hidden="true" />
            {rating.toFixed(1)}
            <span className="font-normal text-ink-3">({salon.reviewCount})</span>
          </span>
        ) : (
          <span className="shrink-0 rounded-full bg-accent-soft px-2 py-0.5 text-[11.5px] font-semibold text-accent">
            {t('salons.new')}
          </span>
        )}
      </div>
      <p className="mt-0.5 truncate text-[14px] text-ink-2">{[area, salon.city].filter(Boolean).join(', ')}</p>
      <p className="mt-0.5 text-[14px] text-ink-2">
        {salon.minPrice != null ? (
          <>
            {t('card.from')} <span className="num font-semibold text-ink">{money(salon.minPrice)}</span>
          </>
        ) : (
          t('salons.serviceCount', { count: salon.serviceCount || 0 })
        )}
      </p>
    </Link>
  );
}
