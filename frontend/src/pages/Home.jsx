/**
 * @author Prahlad Yadav
 * @version 4.0
 * @since 2026-02-16
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getDashboardPathByRole } from '../utils/roleRouting';
import { Rich, useI18n } from '../i18n';
import { formatDate, formatTime, money } from '../i18n/format';
import heroImage from '../assets/hero-salon.jpg';
import craftImage from '../assets/detail-tools.jpg';
import studioImage from '../assets/owner-studio.jpg';

const STEPS = ['01', '02', '03'];
const OWNER_POINTS = ['menu', 'calendar', 'conversations', 'numbers'];
const SERVICES = ['threading', 'hairSpa', 'keratin', 'facial', 'bridal', 'mehendi', 'beard', 'champi', 'manicure', 'colour'];

// A fixed upcoming Friday, 3:30 pm — only the day/time words are localised.
const ticketDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + ((5 - d.getDay() + 7) % 7 || 7));
  d.setHours(15, 30, 0, 0);
  return d;
};

function AppointmentTicket() {
  const { t } = useI18n();
  const when = ticketDate();
  const lines = [
    [t('home.ticket.service1'), 799],
    [t('home.ticket.service2'), 399],
  ];
  return (
    <div className="w-[300px] rounded-lg border border-line bg-surface p-5 shadow-pop">
      <div className="flex items-baseline justify-between">
        <p className="eyebrow">{t('home.ticket.eyebrow')}</p>
        <span className="tag-success">
          <span className="dot" /> {t('status.CONFIRMED')}
        </span>
      </div>
      <p className="display mt-4 text-[36px] leading-none text-ink">
        {formatDate(when, { weekday: 'short' })}, <span className="italic">{formatTime(when)}</span>
      </p>
      <p className="mt-1 text-sm text-ink-2">{t('home.ticket.salon')}</p>
      <div className="mt-5 space-y-2 border-t border-dashed border-line-strong pt-4 text-sm">
        {lines.map(([label, price]) => (
          <div key={label} className="flex justify-between gap-4">
            <span className="text-ink-2">{label}</span>
            <span className="num">{money(price)}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex justify-between border-t border-line pt-3 text-sm font-semibold">
        <span>{t('home.ticket.total', { minutes: 75 })}</span>
        <span className="num">{money(1198)}</span>
      </div>
    </div>
  );
}

/** Every language we support, set in its own script — the switcher doubles as a statement. */
function LanguageBand() {
  const { t, language, setLanguage, languages } = useI18n();
  return (
    <section className="border-t border-line">
      <div className="shell py-16 lg:py-20">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="eyebrow">{t('home.lang.eyebrow')}</p>
            <h2 className="display mt-4 max-w-xl text-[40px] text-ink sm:text-[48px]">
              <Rich text={t('home.lang.title')} emClassName="italic text-accent" />
            </h2>
          </div>
          <p className="max-w-sm text-ink-2">{t('home.lang.body')}</p>
        </div>
        <ul className="mt-10 grid grid-cols-2 border-l border-t border-line sm:grid-cols-3 lg:grid-cols-5">
          {languages.map((l) => {
            const active = l.code === language;
            return (
              <li key={l.code} className="border-b border-r border-line">
                <button
                  type="button"
                  onClick={() => setLanguage(l.code)}
                  aria-pressed={active}
                  className={`group flex h-full w-full flex-col items-start gap-1 px-5 py-6 text-left transition-colors ${
                    active ? 'bg-ink text-paper' : 'hover:bg-surface'
                  }`}
                >
                  <span lang={l.code} className="font-display text-[30px] leading-tight">
                    {l.native}
                  </span>
                  <span className={`text-[12.5px] ${active ? 'text-paper/60' : 'text-ink-3'}`}>{l.name}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

export default function Home() {
  const { user } = useAuth();
  const { t } = useI18n();
  const workspacePath = user ? getDashboardPathByRole(user.role) : '/signup';

  return (
    <div>
      {/* Hero */}
      <section className="shell grid items-center gap-14 pb-20 pt-14 lg:grid-cols-[1.05fr_1fr] lg:gap-20 lg:pb-28 lg:pt-20">
        <div className="animate-fade">
          <p className="eyebrow">{t('home.hero.eyebrow')}</p>
          <h1 className="display mt-6 text-[52px] text-ink sm:text-[72px] lg:text-[84px]">
            <Rich text={t('home.hero.title')} emClassName="italic text-accent" />
          </h1>
          <p className="lede mt-7 max-w-[30rem]">{t('home.hero.lede')}</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link to={user ? '/salons' : '/signup'} className="btn-primary btn-lg">
              {t('home.hero.find')} <ArrowRight size={17} />
            </Link>
            <Link to={user ? workspacePath : '/signup'} className="btn-secondary btn-lg">
              {user ? t('home.hero.workspace') : t('footer.listSalon')}
            </Link>
          </div>

          <dl className="mt-14 grid max-w-lg grid-cols-3 divide-x divide-line border-y border-line">
            {['live', 'clear', 'direct'].map((k) => (
              <div key={k} className="py-4 pl-4 first:pl-0">
                <dt className="font-display text-[22px] leading-none text-ink">{t(`home.proof.${k}`)}</dt>
                <dd className="mt-1.5 text-[13px] text-ink-3">{t(`home.proof.${k}Body`)}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative animate-fade" style={{ animationDelay: '90ms' }}>
          <div className="overflow-hidden rounded-lg">
            <img
              src={heroImage}
              alt={t('home.hero.imageAlt')}
              className="aspect-[4/5] w-full object-cover lg:aspect-[5/6]"
            />
          </div>
          <div className="absolute -bottom-10 -left-4 hidden sm:block lg:-left-14">
            <AppointmentTicket />
          </div>
        </div>
      </section>

      {/* The Indian menu */}
      <section className="border-t border-line">
        <div className="shell flex flex-col gap-6 py-10 md:flex-row md:items-center md:gap-10">
          <p className="shrink-0 text-sm font-semibold text-ink">{t('home.menu.title')}</p>
          <ul className="flex flex-wrap gap-2">
            {SERVICES.map((key) => (
              <li key={key} className="rounded-full border border-line-strong px-3.5 py-1.5 text-[13.5px] text-ink-2">
                {t(`home.menu.${key}`)}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-line bg-surface">
        <div className="shell py-20 lg:py-24">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <h2 className="display max-w-xl text-[44px] text-ink sm:text-[52px]">
              <Rich text={t('home.steps.title')} />
            </h2>
            <p className="max-w-sm text-ink-2">{t('home.steps.body')}</p>
          </div>

          <ol className="mt-14 grid gap-10 md:grid-cols-3 md:gap-0 md:divide-x md:divide-line">
            {STEPS.map((n) => (
              <li key={n} className="md:px-8 md:first:pl-0 md:last:pr-0">
                <span className="num font-mono text-[13px] text-accent">{n}</span>
                <h3 className="mt-4 text-[20px] font-semibold text-ink">{t(`home.steps.${n}.title`)}</h3>
                <p className="mt-3 leading-relaxed text-ink-2">{t(`home.steps.${n}.body`)}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <LanguageBand />

      {/* Craft band */}
      <section className="shell border-t border-line py-20 lg:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <img
            src={craftImage}
            alt={t('home.craft.imageAlt')}
            className="aspect-[4/5] w-full rounded-lg object-cover"
            loading="lazy"
          />
          <div>
            <p className="eyebrow">{t('home.craft.eyebrow')}</p>
            <p className="display mt-6 text-[38px] text-ink sm:text-[50px]">
              <Rich text={t('home.craft.quote')} emClassName="italic text-accent" />
            </p>
            <p className="mt-8 max-w-md leading-relaxed text-ink-2">{t('home.craft.body')}</p>
            <Link to={user ? '/salons' : '/signup'} className="link mt-8 inline-flex items-center gap-1.5">
              {t('home.craft.cta')} <ArrowUpRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* For owners */}
      <section className="bg-ink text-paper">
        <div className="shell grid gap-14 py-20 lg:grid-cols-2 lg:gap-20 lg:py-28">
          <div>
            <p className="eyebrow !text-paper/50">{t('home.owner.eyebrow')}</p>
            <h2 className="display mt-6 text-[44px] sm:text-[56px]">
              <Rich text={t('home.owner.title')} emClassName="italic text-[rgb(222_146_124)]" />
            </h2>
            <p className="mt-6 max-w-md text-[17px] leading-relaxed text-paper/70">{t('home.owner.body')}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link to={user ? workspacePath : '/signup'} className="btn btn-lg bg-paper text-ink hover:bg-paper/90">
                {user ? t('home.owner.go') : t('footer.listSalon')} <ArrowRight size={17} />
              </Link>
            </div>
            <img
              src={studioImage}
              alt={t('home.owner.imageAlt')}
              className="mt-14 hidden aspect-[16/10] w-full rounded-lg object-cover opacity-90 lg:block"
              loading="lazy"
            />
          </div>

          <ul className="self-center border-t border-paper/15">
            {OWNER_POINTS.map((key, index) => (
              <li key={key} className="grid grid-cols-[3rem_1fr] gap-4 border-b border-paper/15 py-7">
                <span className="num pt-1 font-mono text-[13px] text-paper/40">0{index + 1}</span>
                <div>
                  <p className="text-[18px] font-semibold">{t(`home.owner.${key}.title`)}</p>
                  <p className="mt-2 leading-relaxed text-paper/65">{t(`home.owner.${key}.body`)}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Closing */}
      <section className="shell py-24 text-center lg:py-32">
        <h2 className="display mx-auto max-w-3xl text-[46px] text-ink sm:text-[64px]">
          <Rich text={t('home.close.title')} emClassName="italic text-accent" />
        </h2>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link to={user ? '/salons' : '/signup'} className="btn-primary btn-lg">
            {user ? t('notFound.browse') : t('home.close.create')}
          </Link>
          {!user && (
            <Link to="/login" className="btn-ghost btn-lg">
              {t('home.close.haveAccount')}
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
