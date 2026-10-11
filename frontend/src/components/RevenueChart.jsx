import React, { useMemo, useState } from 'react';
import { money } from './ui';

const W = 640;
const H = 220;
const PAD = { top: 12, right: 8, bottom: 26, left: 48 };

const niceMax = (value) => {
  if (value <= 0) return 100;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 2.5, 5, 10].find((s) => s * magnitude >= value / 4) * magnitude;
  return Math.ceil(value / step) * step;
};

/** Dependency-free daily bar chart with gridlines, axis labels and a hover readout. */
export default function RevenueChart({ trend }) {
  const [hover, setHover] = useState(null);
  const max = useMemo(() => niceMax(Math.max(0, ...trend.map((p) => p.revenue))), [trend]);
  const empty = trend.every((p) => !p.revenue && !p.bookings);

  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const band = innerW / Math.max(trend.length, 1);
  const barW = Math.max(2, band * 0.62);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * max);
  const labelEvery = Math.ceil(trend.length / 6);
  const fmtDay = (iso) => new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

  const active = hover != null ? trend[hover] : null;

  return (
    <div className="relative">
      <div className="mb-3 h-5 text-sm text-ink-2" aria-live="polite">
        {active ? (
          <span>
            <span className="font-medium text-ink">{fmtDay(active.date)}</span> · {money(active.revenue)} ·{' '}
            {active.bookings} {active.bookings === 1 ? 'booking' : 'bookings'}
          </span>
        ) : empty ? (
          <span className="text-ink-3">No bookings in this window yet.</span>
        ) : (
          <span className="text-ink-3">Hover a day for details</span>
        )}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Daily booked value">
        {ticks.map((t) => {
          const y = PAD.top + innerH - (t / max) * innerH;
          return (
            <g key={t}>
              <line x1={PAD.left} x2={W - PAD.right} y1={y} y2={y} className="stroke-line" strokeDasharray={t === 0 ? '' : '2 4'} />
              <text x={PAD.left - 8} y={y + 4} textAnchor="end" className="fill-ink-3 text-[10px]" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {t >= 1000 ? `$${(t / 1000).toFixed(t % 1000 ? 1 : 0)}k` : `$${Math.round(t)}`}
              </text>
            </g>
          );
        })}
        {trend.map((p, i) => {
          const h = (p.revenue / max) * innerH;
          const x = PAD.left + i * band + (band - barW) / 2;
          const isActive = hover === i;
          return (
            <g key={p.date} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              <rect x={PAD.left + i * band} y={PAD.top} width={band} height={innerH} fill="transparent" />
              <rect
                x={x}
                y={PAD.top + innerH - Math.max(h, p.revenue ? 2 : 0)}
                width={barW}
                height={Math.max(h, p.revenue ? 2 : 0)}
                rx={2}
                className={isActive ? 'fill-ink' : 'fill-accent'}
              />
              {i % labelEvery === 0 && (
                <text x={x + barW / 2} y={H - 8} textAnchor="middle" className="fill-ink-3 text-[10px]">
                  {fmtDay(p.date)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
