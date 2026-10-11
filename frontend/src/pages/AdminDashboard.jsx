/**
 * @author Prahlad Yadav
 * @version 3.0
 * @since 2026-02-13
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../config/api';
import { Notice, PageHeader, PageLoader, Stat, money } from '../components/ui';
import RevenueChart from '../components/RevenueChart';
import { useT } from '../i18n';
import { formatNumber, statMoney } from '../i18n/format';

const STATUS_META = [
  ['CONFIRMED', 'bg-success'],
  ['PENDING', 'bg-gold'],
  ['COMPLETED', 'bg-ink'],
  ['CANCELLED', 'bg-danger/70'],
];

function Pipeline({ byStatus }) {
  const t = useT();
  const total = Object.values(byStatus).reduce((s, n) => s + n, 0);
  return (
    <div>
      <div className="flex h-3 overflow-hidden rounded-full bg-sunken">
        {STATUS_META.map(([key, color]) =>
          byStatus[key] ? (
            <div
              key={key}
              className={color}
              style={{ width: `${(byStatus[key] / total) * 100}%` }}
              title={`${t(`status.${key}`)}: ${byStatus[key]}`}
            />
          ) : null
        )}
      </div>
      <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4">
        {STATUS_META.map(([key, color]) => (
          <div key={key} className="flex items-baseline justify-between border-b border-line pb-3">
            <dt className="flex items-center gap-2 text-sm text-ink-2">
              <span className={`h-2 w-2 rounded-full ${color}`} />
              {t(`status.${key}`)}
            </dt>
            <dd className="num text-sm font-semibold text-ink">
              {byStatus[key] || 0}
              <span className="ml-1.5 font-normal text-ink-3">
                {total ? `${Math.round(((byStatus[key] || 0) / total) * 100)}%` : '–'}
              </span>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export default function AdminDashboard() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const t = useT();

  useEffect(() => {
    let active = true;
    setLoading(true);
    api
      .get(`/api/analytics/admin/overview?days=${days}`)
      .then((overview) => {
        if (!active) return;
        setData(overview);
        setError('');
      })
      .catch((err) => {
        if (active) setError(err?.response?.data?.error || t('admin.err.load'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  const windowTotals = useMemo(() => {
    const trend = data?.revenueTrend || [];
    return {
      revenue: trend.reduce((s, p) => s + p.revenue, 0),
      bookings: trend.reduce((s, p) => s + p.bookings, 0),
    };
  }, [data]);

  if (loading && !data) return <PageLoader label={t('admin.loading')} />;

  const popularMax = Math.max(1, ...(data?.popularServices || []).map((s) => s.count));

  return (
    <div className="page">
      <PageHeader
        eyebrow={t('admin.eyebrow')}
        title={t('title.admin')}
        description={t('admin.description')}
        actions={
          <div className="inline-flex rounded-md border border-line-strong p-1" role="radiogroup" aria-label={t('admin.window')}>
            {[7, 30, 90].map((d) => (
              <button
                key={d}
                type="button"
                role="radio"
                aria-checked={days === d}
                onClick={() => setDays(d)}
                className={`h-8 rounded px-3.5 text-sm font-medium transition ${
                  days === d ? 'bg-ink text-paper' : 'text-ink-2 hover:text-ink'
                }`}
              >
                {t('admin.days', { count: d })}
              </button>
            ))}
          </div>
        }
      />

      {error && (
        <div className="mt-6">
          <Notice tone="error">{error}</Notice>
        </div>
      )}

      {data && (
        <div className={loading ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
          <div className="mt-10 grid grid-cols-2 gap-y-8 border-b border-line pb-10 lg:grid-cols-4 lg:divide-x lg:divide-line">
            <Stat
              label={t('nav.salons')}
              value={formatNumber(data.totalSalons)}
              note={t('admin.publishedProfiles')}
              className="lg:pr-8"
            />
            <Stat
              label={t('admin.clients')}
              value={formatNumber(data.totalCustomers)}
              note={t('admin.customerAccounts')}
              className="lg:px-8"
            />
            <Stat
              label={t('admin.bookings')}
              value={formatNumber(data.totalBookings)}
              note={t('admin.inLastDays', { n: windowTotals.bookings, days })}
              className="lg:px-8"
            />
            <Stat
              label={t('admin.bookedValue')}
              value={statMoney(data.totalRevenue)}
              note={t('admin.valueNote', {
                completed: money(data.completedRevenue),
                rate: Number(data.repeatCustomerRate || 0).toFixed(0),
              })}
              className="lg:pl-8"
            />
          </div>

          <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            <section>
              <div className="flex items-baseline justify-between">
                <h2 className="text-[17px] font-semibold text-ink">{t('admin.bookedValue')}</h2>
                <p className="num text-sm text-ink-3">
                  {t('admin.windowValue', { amount: money(windowTotals.revenue), days })}
                </p>
              </div>
              <div className="mt-6">
                <RevenueChart trend={data.revenueTrend || []} />
              </div>
            </section>

            <section>
              <h2 className="text-[17px] font-semibold text-ink">{t('admin.pipeline')}</h2>
              <div className="mt-6">
                <Pipeline byStatus={data.bookingsByStatus || {}} />
              </div>
            </section>
          </div>

          <div className="mt-16 grid gap-12 lg:grid-cols-2">
            <section>
              <h2 className="mb-5 text-[17px] font-semibold text-ink">{t('admin.topSalons')}</h2>
              {(data.topSalons || []).length === 0 ? (
                <p className="text-sm text-ink-3">{t('admin.noBookings')}</p>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>{t('chat.salon')}</th>
                      <th className="text-right">{t('admin.bookings')}</th>
                      <th className="text-right">{t('admin.value')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topSalons.map((s, i) => (
                      <tr key={s.salonId}>
                        <td>
                          <span className="num mr-3 font-mono text-xs text-ink-3">{String(i + 1).padStart(2, '0')}</span>
                          <Link to={`/salon/${s.salonId}`} className="font-medium text-ink hover:underline">
                            {s.name}
                          </Link>
                          <span className="ml-2 text-ink-3">{s.city}</span>
                        </td>
                        <td className="num text-right">{s.bookings}</td>
                        <td className="num text-right font-medium">{money(s.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>

            <section>
              <h2 className="mb-5 text-[17px] font-semibold text-ink">{t('admin.popular')}</h2>
              {(data.popularServices || []).length === 0 ? (
                <p className="text-sm text-ink-3">{t('admin.noServices')}</p>
              ) : (
                <ul className="space-y-4">
                  {data.popularServices.map((s) => (
                    <li key={s.serviceId}>
                      <div className="flex items-baseline justify-between text-sm">
                        <span className="text-ink">{s.serviceName}</span>
                        <span className="num text-ink-3">{s.count}</span>
                      </div>
                      <div className="mt-1.5 h-1.5 rounded-full bg-sunken">
                        <div className="h-full rounded-full bg-accent" style={{ width: `${(s.count / popularMax) * 100}%` }} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
