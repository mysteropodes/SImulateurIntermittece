import React from 'react';

type Tone = 'neutral' | 'brand' | 'green' | 'amber' | 'red' | 'blue';

const toneText: Record<Tone, string> = {
  neutral: 'text-slate-600',
  brand: 'text-brand-600',
  green: 'text-emerald-600',
  amber: 'text-amber-600',
  red: 'text-rose-600',
  blue: 'text-sky-600',
};

const toneBg: Record<Tone, string> = {
  neutral: 'bg-slate-100 text-slate-700',
  brand: 'bg-brand-50 text-brand-700',
  green: 'bg-emerald-50 text-emerald-700',
  amber: 'bg-amber-50 text-amber-800',
  red: 'bg-rose-50 text-rose-700',
  blue: 'bg-sky-50 text-sky-700',
};

export const PageHeader: React.FC<{ title: string; description?: React.ReactNode; actions?: React.ReactNode }> = ({ title, description, actions }) => (
  <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
      {description && <p className="mt-1 max-w-3xl text-sm text-slate-500">{description}</p>}
    </div>
    {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
  </div>
);

export const Card: React.FC<{
  title?: React.ReactNode;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
}> = ({ title, icon, action, className = '', bodyClassName = 'p-5', children }) => (
  <section className={`rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}>
    {title && (
      <header className="flex items-center gap-2 border-b border-slate-100 px-5 py-3.5">
        {icon && <span className="text-slate-400">{icon}</span>}
        <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
        {action && <div className="ml-auto">{action}</div>}
      </header>
    )}
    <div className={bodyClassName}>{children}</div>
  </section>
);

export const Kpi: React.FC<{
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  tone?: Tone;
  icon?: React.ReactNode;
  footer?: React.ReactNode;
}> = ({ label, value, sub, tone = 'neutral', icon, footer }) => (
  <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
    <div className="flex items-start justify-between gap-2">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      {icon && <span className={`rounded-lg p-1.5 ${toneBg[tone]}`}>{icon}</span>}
    </div>
    <p className={`num mt-2 text-2xl font-semibold tracking-tight ${tone === 'neutral' ? 'text-slate-900' : toneText[tone]}`}>{value}</p>
    {sub && <p className="mt-0.5 text-xs text-slate-500">{sub}</p>}
    {footer && <div className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-600">{footer}</div>}
  </div>
);

export const Stat: React.FC<{ label: string; value: React.ReactNode; hint?: React.ReactNode; className?: string }> = ({ label, value, hint, className = '' }) => (
  <div className={className}>
    <dt className="text-xs text-slate-500">{label}</dt>
    <dd className="num mt-0.5 text-base font-semibold text-slate-900">{value}</dd>
    {hint && <dd className="text-xs text-slate-400">{hint}</dd>}
  </div>
);

export const Notice: React.FC<{ tone?: 'info' | 'warn' | 'error' | 'success'; icon?: React.ReactNode; title?: string; children: React.ReactNode; className?: string }> = ({
  tone = 'info',
  icon,
  title,
  children,
  className = '',
}) => {
  const tones = {
    info: 'bg-sky-50 border-sky-200 text-sky-900',
    warn: 'bg-amber-50 border-amber-200 text-amber-900',
    error: 'bg-rose-50 border-rose-200 text-rose-900',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-900',
  } as const;
  return (
    <div className={`rounded-xl border p-4 text-sm ${tones[tone]} ${className}`}>
      <div className="flex items-start gap-2.5">
        {icon && <span className="mt-0.5 flex-shrink-0 opacity-80">{icon}</span>}
        <div className="flex-1 space-y-1">
          {title && <p className="font-semibold">{title}</p>}
          <div className="opacity-90">{children}</div>
        </div>
      </div>
    </div>
  );
};

export const Badge: React.FC<{ tone?: Tone; children: React.ReactNode; title?: string }> = ({ tone = 'neutral', children, title }) => (
  <span title={title} className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${toneBg[tone]}`}>
    {children}
  </span>
);

export const Progress: React.FC<{ value: number; max: number; tone?: 'brand' | 'green' | 'amber'; marker?: number; className?: string }> = ({
  value,
  max,
  tone = 'brand',
  marker,
  className = '',
}) => {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const color = { brand: 'bg-brand-500', green: 'bg-emerald-500', amber: 'bg-amber-500' }[tone];
  return (
    <div className={`relative h-2 w-full rounded-full bg-slate-100 ${className}`}>
      <div className={`h-2 rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      {marker != null && max > 0 && (
        <div className="absolute -top-1 h-4 w-0.5 rounded bg-slate-700" style={{ left: `${Math.min(100, (marker / max) * 100)}%` }} />
      )}
    </div>
  );
};

export function Segmented<T extends string | boolean>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex rounded-lg bg-slate-100 p-0.5">
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          onClick={() => onChange(o.value)}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
            o.value === value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export const Field: React.FC<{ label: string; hint?: React.ReactNode; children: React.ReactNode; className?: string }> = ({ label, hint, children, className = '' }) => (
  <label className={`block ${className}`}>
    <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
    {children}
    {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
  </label>
);

export const InputSuffix: React.FC<{ suffix: string; children: React.ReactNode }> = ({ suffix, children }) => (
  <div className="relative">
    {children}
    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-slate-400">{suffix}</span>
  </div>
);

export const eur = (n: number, dec = 2): string =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: dec, maximumFractionDigits: dec }).format(n);

export const nb = (n: number, dec = 0): string => new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: dec }).format(n);
