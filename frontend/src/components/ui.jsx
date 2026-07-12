import React from 'react';
import { Link } from 'react-router-dom';

/* ------------------------------------------------------------------ */
/* classnames helper                                                   */
/* ------------------------------------------------------------------ */
export function cx(...parts) {
  return parts.filter(Boolean).join(' ');
}

export const inputCls = 'input-base';

/* ------------------------------------------------------------------ */
/* Icon set (inline SVG, stroke based)                                 */
/* ------------------------------------------------------------------ */
const PATHS = {
  grid: 'M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z',
  truck: 'M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a9.79 9.79 0 00-1.09-4.135m-9.96 0A9.783 9.783 0 006.75 9.75V6.375c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v3.375m-9.96 0A9.79 9.79 0 013.375 12h.75m9.135-4.5c.621 0 1.125.504 1.125 1.125v3.375m0-6.75V3.75m0 9.75a9.79 9.79 0 01-1.09-4.135',
  user: 'M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z',
  route: 'M6 18a3 3 0 100-6 3 3 0 000 6zM18 6a3 3 0 100-6 3 3 0 000 6zM6 12h12M18 12v6',
  wrench: 'M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.84 4.84a1.5 1.5 0 01-2.12-2.12l4.84-4.84m4.173-1.367a3.75 3.75 0 10-5.304-5.304l4.84 4.84M12 12l-1.5-1.5m1.5 1.5l-1.5 1.5',
  fuel: 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z',
  receipt: 'M8.25 7.5V6.75a1.5 1.5 0 011.5-1.5h.75a1.5 1.5 0 011.5 1.5v.75m-6 0v-.75a1.5 1.5 0 011.5-1.5h.75a1.5 1.5 0 011.5 1.5v.75m-6 0h6m-6 0v6.75m6-6.75v6.75m0 0a1.5 1.5 0 001.5 1.5h.75a1.5 1.5 0 001.5-1.5v-.75m-3 4.5v-3m-6 3v-3',
  chart: 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z',
  plus: 'M12 4.5v15m7.5-7.5h-15',
  search: 'M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z',
  check: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  x: 'M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  arrow: 'M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3',
  flag: 'M3 3v18m0-13.5h12l-2.25 3 2.25 3H3',
  shield: 'M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z',
  sun: 'M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z',
  moon: 'M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z',
  logout: 'M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75',
  menu: 'M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5',
  chevron: 'M19.5 8.25l-7.5 7.5-7.5-7.5',
  bell: 'M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0',
  bolt: 'M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z',
  currency: 'M12 6v12m-3-2.25h6M12 3.75a3 3 0 00-3 3v.75m0 0h6m-6 0H9m3 0h.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  calendar: 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0V11.25c0-.621.504-1.125 1.125-1.125h17.25c.621 0 1.125.504 1.125 1.125v7.5',
  map: 'M9 6.75V15m6-6v8.25m.033-11.46a12.24 12.24 0 014.842 2.172c.965.657 1.773 1.464 2.4 2.382M7.5 6.75c-.621 0-1.125.504-1.125 1.125v11.25m0-11.25a12.24 12.24 0 00-4.5 1.5m4.5-1.5a12.24 12.24 0 014.5 1.5m0 0a12.24 12.24 0 014.5-1.5M7.5 18.75v-7.5',
  activity: 'M3.75 13.5l4.5-4.5 3 3 6-6',
  alert: 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z',
  info: 'M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z',
  download: 'M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12M12 16.5V3',
  sparkles: 'M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z',
  layers: 'M12 3l9 5-9 5-9-5 9-5zm0 7.5l9 5-9 5-9-5 9-5z',
  gauge: 'M3 13.5l1.5-1.5m15 0L21 13.5m-15 0a9 9 0 1115 0m-15 0A9 9 0 0112 3v6.75',
  clipboard: 'M9 12h6m-6 4h6m2.25-9.75V6a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6v12a2.25 2.25 0 002.25 2.25h7.5',
  home: 'M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75V21m7.5-9.75V21m-6 0h6m-12 0H3.375A1.125 1.125 0 012.25 18.75V9.75m19.5 0V18.75a1.125 1.125 0 01-1.125 1.125h-1.5',
  lock: 'M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-1.5 0h12a1.5 1.5 0 011.5 1.5v7.5a1.5 1.5 0 01-1.5 1.5H4.5a1.5 1.5 0 01-1.5-1.5v-7.5A1.5 1.5 0 014.5 10.5z',
  mail: 'M21.75 6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75z',
  eye: 'M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
  refresh: 'M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99',
  trendUp: 'M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941',
  trendDown: 'M2.25 6L9 12.75l4.306-4.307a11.95 11.95 0 015.814 5.519l2.74 1.22m0 0l-5.94 2.28m5.94-2.28l-2.28-5.941',
  settings: 'M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456c.516-.194 1.094.02 1.39.512l1.296 2.247a.984.984 0 01-.213 1.231l-1.009.692a1.073 1.073 0 00-.475.676l-.192 1.281c-.093.542-.56.94-1.11.94h-2.593c-.55 0-1.02-.398-1.11-.94l-.213-1.281a1.073 1.073 0 00-.475-.676l-1.009-.692a.984.984 0 01-.213-1.231l1.296-2.247c.296-.492.874-.706 1.39-.512l1.217.456c.355.133.75.072 1.075-.124a5.77 5.77 0 01.22-.127c.332-.183.582-.496.645-.87l.213-1.28zM15 12a3 3 0 11-6 0 3 3 0 016 0z',
};

export function Icon({ name, className = 'h-5 w-5', strokeWidth = 1.7 }) {
  const d = PATHS[name];
  if (!d) return null;
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Spinner                                                             */
/* ------------------------------------------------------------------ */
export function Spinner({ className = 'h-5 w-5' }) {
  return (
    <svg className={cx('animate-spin', className)} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Button                                                              */
/* ------------------------------------------------------------------ */
const BTN = {
  primary: 'bg-indigo-600 text-white hover:bg-indigo-500 focus-visible:ring-indigo-500 shadow-sm',
  secondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 focus-visible:ring-slate-400',
  outline: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 focus-visible:ring-slate-400',
  danger: 'bg-rose-600 text-white hover:bg-rose-500 focus-visible:ring-rose-500 shadow-sm',
  ghost: 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 focus-visible:ring-slate-400',
};
export function Button({ variant = 'primary', size = 'md', className = '', children, as: As = 'button', ...rest }) {
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm', lg: 'px-5 py-2.5 text-base' };
  return (
    <As
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-60',
        BTN[variant],
        sizes[size],
        className
      )}
      {...rest}
    >
      {children}
    </As>
  );
}

/* ------------------------------------------------------------------ */
/* Badge                                                               */
/* ------------------------------------------------------------------ */
const BADGE = {
  emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  sky: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
  amber: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  rose: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
  slate: 'bg-slate-100 text-slate-600 dark:bg-slate-700/40 dark:text-slate-300',
  violet: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
  indigo: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300',
};
const DOT = {
  emerald: 'bg-emerald-500', sky: 'bg-sky-500', amber: 'bg-amber-500', rose: 'bg-rose-500', slate: 'bg-slate-400', violet: 'bg-violet-500', indigo: 'bg-indigo-500',
};
export function Badge({ color = 'slate', children, dot = true, className = '' }) {
  return (
    <span className={cx('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize', BADGE[color] || BADGE.slate, className)}>
      {dot && <span className={cx('h-1.5 w-1.5 rounded-full', DOT[color] || DOT.slate)} />}
      {children}
    </span>
  );
}

export function RoleBadge({ role }) {
  const map = { fleet_manager: 'indigo', driver: 'sky', safety_officer: 'amber', financial_analyst: 'violet' };
  return <Badge color={map[role] || 'slate'}>{role ? role.replace('_', ' ') : '—'}</Badge>;
}

/* ------------------------------------------------------------------ */
/* Card / SectionTitle / PageHeader                                     */
/* ------------------------------------------------------------------ */
export function Card({ className = '', children, ...rest }) {
  return (
    <div className={cx('card', className)} {...rest}>
      {children}
    </div>
  );
}

export function SectionTitle({ title, subtitle, icon, action }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        {icon && (
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
            <Icon name={icon} className="h-5 w-5" />
          </span>
        )}
        <div>
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
          {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

export function PageHeader({ title, subtitle, action, icon }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        {icon && (
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl brand-gradient text-white shadow-sm">
            <Icon name={icon} className="h-6 w-6" />
          </span>
        )}
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">{title}</h1>
          {subtitle && <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* StatCard                                                            */
/* ------------------------------------------------------------------ */
const ACCENT = {
  indigo: 'from-indigo-500 to-indigo-600',
  emerald: 'from-emerald-500 to-emerald-600',
  sky: 'from-sky-500 to-sky-600',
  amber: 'from-amber-500 to-amber-600',
  rose: 'from-rose-500 to-rose-600',
  violet: 'from-violet-500 to-violet-600',
  slate: 'from-slate-400 to-slate-500',
};
export function StatCard({ label, value, sub, icon, accent = 'indigo', trend }) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{value}</p>
          {sub && <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{sub}</p>}
        </div>
        <span className={cx('flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-sm', ACCENT[accent] || ACCENT.indigo)}>
          <Icon name={icon} className="h-6 w-6" />
        </span>
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1 text-xs">
          <Icon name={trend.dir === 'up' ? 'trendUp' : 'trendDown'} className={cx('h-4 w-4', trend.dir === 'up' ? 'text-emerald-500' : 'text-rose-500')} />
          <span className={trend.dir === 'up' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>{trend.value}</span>
          <span className="text-slate-400">{trend.label}</span>
        </div>
      )}
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Field / inputs                                                      */
/* ------------------------------------------------------------------ */
export function Field({ label, error, hint, children, className = '' }) {
  return (
    <label className={cx('block', className)}>
      {label && <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>}
      {children}
      {error ? (
        <span className="mt-1 block text-xs text-rose-500">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-xs text-slate-400">{hint}</span>
      ) : null}
    </label>
  );
}

/* ------------------------------------------------------------------ */
/* Alert                                                               */
/* ------------------------------------------------------------------ */
const ALERT = {
  error: { wrap: 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-500/10 dark:border-rose-500/30 dark:text-rose-300', icon: 'alert' },
  success: { wrap: 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/30 dark:text-emerald-300', icon: 'check' },
  info: { wrap: 'bg-sky-50 border-sky-200 text-sky-700 dark:bg-sky-500/10 dark:border-sky-500/30 dark:text-sky-300', icon: 'info' },
  warning: { wrap: 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-500/10 dark:border-amber-500/30 dark:text-amber-300', icon: 'alert' },
};
export function Alert({ tone = 'info', children, className = '' }) {
  const a = ALERT[tone] || ALERT.info;
  return (
    <div className={cx('flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-sm', a.wrap, className)}>
      <Icon name={a.icon} className="mt-0.5 h-4 w-4 flex-shrink-0" />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Modal                                                               */
/* ------------------------------------------------------------------ */
export function Modal({ open, onClose, title, subtitle, footer, children, size = 'md' }) {
  if (!open) return null;
  const widths = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className={cx('relative z-10 w-full rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900', widths[size])}>
        <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h3>
            {subtitle && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800">
            <Icon name="x" className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-3.5 dark:border-slate-800">{footer}</div>}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Table                                                               */
/* ------------------------------------------------------------------ */
export function Table({ columns, rows, empty, className = '' }) {
  if (!rows || rows.length === 0) {
    return empty || <EmptyState title="Nothing here yet" desc="No records to show." />;
  }
  return (
    <div className={cx('overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800', className)}>
      <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
        <thead className="bg-slate-50 dark:bg-slate-800/50">
          <tr>
            {columns.map((c) => (
              <th key={c.key} className="whitespace-nowrap px-4 py-3 text-left font-semibold text-slate-500 dark:text-slate-400">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-900">
          {rows.map((r, i) => (
            <tr key={r.id || i} className="transition hover:bg-slate-50 dark:hover:bg-slate-800/40">
              {columns.map((c) => (
                <td key={c.key} className={cx('whitespace-nowrap px-4 py-3 text-slate-700 dark:text-slate-300', c.className)}>
                  {c.render ? c.render(r) : r[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* EmptyState / ProgressBar                                            */
/* ------------------------------------------------------------------ */
export function EmptyState({ title, desc, icon = 'clipboard', action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 px-6 py-12 text-center dark:border-slate-700">
      <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800">
        <Icon name={icon} className="h-6 w-6" />
      </span>
      <p className="font-medium text-slate-700 dark:text-slate-200">{title}</p>
      {desc && <p className="mt-1 max-w-sm text-sm text-slate-400">{desc}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ProgressBar({ value = 0, className = '' }) {
  return (
    <div className={cx('h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800', className)}>
      <div className="brand-gradient h-full rounded-full transition-all" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Timeline (vertical, used for workflow)                              */
/* ------------------------------------------------------------------ */
const STEP_COLOR = {
  done: 'bg-emerald-500 border-emerald-500 text-white',
  active: 'bg-indigo-600 border-indigo-600 text-white ring-4 ring-indigo-500/20',
  pending: 'bg-white border-slate-300 text-slate-400 dark:bg-slate-900 dark:border-slate-700',
};
export function Timeline({ steps }) {
  return (
    <ol className="relative space-y-6">
      {steps.map((s, i) => (
        <li key={s.n || i} className="relative flex gap-4">
          {i !== steps.length - 1 && (
            <span className={cx('absolute left-[15px] top-9 h-[calc(100%-1rem)] w-px', s.status === 'done' ? 'bg-emerald-400/60' : 'bg-slate-200 dark:bg-slate-700')} />
          )}
          <span className={cx('z-10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2', STEP_COLOR[s.status] || STEP_COLOR.pending)}>
            {s.status === 'done' ? <Icon name="check" className="h-4 w-4" /> : <Icon name={s.icon || 'bolt'} className="h-4 w-4" />}
          </span>
          <div className="pt-0.5">
            <div className="flex items-center gap-2">
              <p className={cx('text-sm font-semibold', s.status === 'pending' ? 'text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-slate-100')}>
                {s.title}
              </p>
              {s.status === 'active' && <Badge color="indigo">active</Badge>}
            </div>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{s.desc}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
