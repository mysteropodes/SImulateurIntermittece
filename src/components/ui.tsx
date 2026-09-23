import React, { useEffect, useId, useRef, useState } from 'react';
import { GLOSSAIRE, type TermeGlossaire } from '../lib/glossaire';

type Tone = 'neutral' | 'brand' | 'green' | 'amber' | 'red' | 'blue' | 'lime';

const toneText: Record<Tone, string> = {
  neutral: 'text-slate-900',
  brand: 'text-brand-700',
  green: 'text-brand-600',
  amber: 'text-amber-600',
  red: 'text-rose-600',
  blue: 'text-sky-700',
  lime: 'text-lime-700',
};

const toneBg: Record<Tone, string> = {
  neutral: 'bg-slate-100 text-slate-600',
  brand: 'bg-brand-50 text-brand-700',
  green: 'bg-brand-50 text-brand-700',
  amber: 'bg-amber-50 text-amber-800',
  red: 'bg-rose-50 text-rose-700',
  blue: 'bg-sky-50 text-sky-700',
  lime: 'bg-lime-200 text-brand-900',
};

// ---------------------------------------------------------------------------
// Infobulle ⓘ : survol, focus clavier ou appui (mobile)
// ---------------------------------------------------------------------------

export const Aide: React.FC<{ terme?: TermeGlossaire; texte?: React.ReactNode; className?: string; dark?: boolean }> = ({ terme, texte, className = '', dark }) => {
  const [ouvert, setOuvert] = useState(false);
  const [bord, setBord] = useState<'gauche' | 'droite' | null>(null);
  const ref = useRef<HTMLSpanElement>(null);
  const id = useId();
  const contenu = texte ?? (terme ? GLOSSAIRE[terme] : null);

  useEffect(() => {
    if (!ouvert) return;
    const r = ref.current?.getBoundingClientRect();
    if (r) setBord(r.left < 150 ? 'gauche' : window.innerWidth - r.right < 150 ? 'droite' : null);
    const fermer = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOuvert(false);
    };
    const echap = (e: KeyboardEvent) => e.key === 'Escape' && setOuvert(false);
    document.addEventListener('mousedown', fermer);
    document.addEventListener('touchstart', fermer);
    document.addEventListener('keydown', echap);
    return () => {
      document.removeEventListener('mousedown', fermer);
      document.removeEventListener('touchstart', fermer);
      document.removeEventListener('keydown', echap);
    };
  }, [ouvert]);

  if (!contenu) return null;
  return (
    <span ref={ref} className={`relative inline-flex align-middle ${className}`} onMouseEnter={() => setOuvert(true)} onMouseLeave={() => setOuvert(false)}>
      <button
        type="button"
        aria-label="Explication"
        aria-describedby={ouvert ? id : undefined}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOuvert((o) => !o);
        }}
        onFocus={() => setOuvert(true)}
        onBlur={() => setOuvert(false)}
        className={`inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold leading-none transition ${
          dark ? 'bg-white/15 text-white/80 hover:bg-white/25' : 'bg-slate-200/80 text-slate-500 hover:bg-brand-600 hover:text-white'
        }`}
      >
        i
      </button>
      {ouvert && (
        <span
          role="tooltip"
          id={id}
          className={`absolute bottom-full z-50 mb-2 w-64 max-w-[80vw] rounded-2xl bg-brand-900 px-3.5 py-3 text-left text-xs font-normal normal-case leading-relaxed tracking-normal text-white shadow-xl ${
            bord === 'gauche' ? 'left-0' : bord === 'droite' ? 'right-0' : 'left-1/2 -translate-x-1/2'
          }`}
        >
          {contenu}
        </span>
      )}
    </span>
  );
};

// ---------------------------------------------------------------------------
// Mise en page
// ---------------------------------------------------------------------------

export const PageHeader: React.FC<{ title: string; accent?: string; description?: React.ReactNode; actions?: React.ReactNode }> = ({
  title,
  accent,
  description,
  actions,
}) => (
  <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
    <div>
      <h1 className="text-3xl font-semibold leading-[1.1] tracking-tight text-slate-900 sm:text-4xl">
        {title}
        {accent && <span className="block text-slate-400">{accent}</span>}
      </h1>
      {description && <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-500">{description}</p>}
    </div>
    {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
  </div>
);

export const Card: React.FC<{
  title?: React.ReactNode;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  aide?: TermeGlossaire;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
}> = ({ title, icon, action, aide, className = '', bodyClassName = 'px-5 pb-5 sm:px-6 sm:pb-6', children }) => (
  <section className={`rounded-4xl bg-white ${className}`}>
    {title && (
      <header className="flex flex-wrap items-center gap-2 px-5 pb-3 pt-5 sm:px-6 sm:pt-6">
        {icon && <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-brand-700">{icon}</span>}
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        {aide && <Aide terme={aide} />}
        {action && <div className="ml-auto">{action}</div>}
      </header>
    )}
    <div className={bodyClassName}>{children}</div>
  </section>
);

type KpiVariant = 'light' | 'dark' | 'lime';

export const Kpi: React.FC<{
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  tone?: Tone;
  icon?: React.ReactNode;
  footer?: React.ReactNode;
  aide?: TermeGlossaire;
  variant?: KpiVariant;
  className?: string;
}> = ({ label, value, sub, tone = 'neutral', icon, footer, aide, variant = 'light', className = '' }) => {
  const bg = { light: 'bg-white', dark: 'bg-brand-700 text-white', lime: 'bg-lime-300 text-brand-900' }[variant];
  const labelCls = { light: 'text-slate-500', dark: 'text-brand-100', lime: 'text-brand-800/70' }[variant];
  const valueCls = variant === 'dark' ? 'text-lime-300' : variant === 'lime' ? 'text-brand-900' : toneText[tone];
  const subCls = { light: 'text-slate-400', dark: 'text-brand-200', lime: 'text-brand-800/70' }[variant];
  return (
    <div className={`flex flex-col rounded-4xl p-5 sm:p-6 ${bg} ${className}`}>
      <div className="flex items-start justify-between gap-2">
        <p className={`flex items-center gap-1.5 text-sm ${labelCls}`}>
          {label}
          {aide && <Aide terme={aide} dark={variant === 'dark'} />}
        </p>
        {icon && (
          <span
            className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${
              variant === 'dark' ? 'bg-white/10 text-lime-300' : variant === 'lime' ? 'bg-brand-900/10 text-brand-900' : 'bg-slate-100 text-slate-500'
            }`}
          >
            {icon}
          </span>
        )}
      </div>
      <p className={`num mt-4 text-[2rem] font-medium leading-none tracking-tight sm:text-4xl ${valueCls}`}>{value}</p>
      {sub && <p className={`mt-2 text-sm ${subCls}`}>{sub}</p>}
      {footer && (
        <div className={`mt-auto pt-4 text-xs ${variant === 'light' ? 'text-slate-500' : subCls}`}>
          <div className={`border-t pt-3 ${variant === 'light' ? 'border-slate-100' : variant === 'dark' ? 'border-white/10' : 'border-brand-900/10'}`}>{footer}</div>
        </div>
      )}
    </div>
  );
};

export const Stat: React.FC<{ label: string; value: React.ReactNode; hint?: React.ReactNode; aide?: TermeGlossaire; className?: string }> = ({
  label,
  value,
  hint,
  aide,
  className = '',
}) => (
  <div className={className}>
    <dt className="flex items-center gap-1.5 text-xs text-slate-500">
      {label}
      {aide && <Aide terme={aide} />}
    </dt>
    <dd className="num mt-1 text-lg font-semibold tracking-tight text-slate-900">{value}</dd>
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
    info: 'bg-white/70 text-slate-700',
    warn: 'bg-amber-50 text-amber-900',
    error: 'bg-rose-50 text-rose-900',
    success: 'bg-lime-200 text-brand-900',
  } as const;
  return (
    <div className={`rounded-3xl p-4 text-sm sm:p-5 ${tones[tone]} ${className}`}>
      <div className="flex items-start gap-3">
        {icon && <span className="mt-0.5 flex-shrink-0 opacity-80">{icon}</span>}
        <div className="flex-1 space-y-1">
          {title && <p className="font-semibold">{title}</p>}
          <div className="leading-relaxed opacity-90">{children}</div>
        </div>
      </div>
    </div>
  );
};

export const Badge: React.FC<{ tone?: Tone; children: React.ReactNode; title?: string }> = ({ tone = 'neutral', children, title }) => (
  <span title={title} className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${toneBg[tone]}`}>
    {children}
  </span>
);

export const Progress: React.FC<{ value: number; max: number; tone?: 'brand' | 'green' | 'amber' | 'lime'; marker?: number; className?: string; dark?: boolean }> = ({
  value,
  max,
  tone = 'brand',
  marker,
  className = '',
  dark,
}) => {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const color = { brand: 'bg-brand-600', green: 'bg-brand-600', amber: 'bg-amber-400', lime: 'bg-lime-400' }[tone];
  return (
    <div className={`relative h-2.5 w-full rounded-full ${dark ? 'bg-white/15' : 'bg-slate-100'} ${className}`}>
      <div className={`h-2.5 rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      {marker != null && max > 0 && (
        <div className="absolute -top-1 h-[18px] w-1 rounded-full bg-slate-800" style={{ left: `calc(${Math.min(100, (marker / max) * 100)}% - 2px)` }} />
      )}
    </div>
  );
};

/** Anneau de progression (ex. heures sur 507). */
export const Ring: React.FC<{ value: number; max: number; size?: number; stroke?: number; children?: React.ReactNode; dark?: boolean }> = ({
  value,
  max,
  size = 132,
  stroke = 12,
  children,
  dark,
}) => {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = max > 0 ? Math.min(1, value / max) : 0;
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className={dark ? 'stroke-white/15' : 'stroke-slate-100'} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          className={pct >= 1 ? 'stroke-lime-400' : 'stroke-brand-600'}
          style={{ transition: 'stroke-dashoffset .6s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
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
    <div className="inline-flex max-w-full flex-wrap rounded-full bg-slate-100 p-1">
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          onClick={() => onChange(o.value)}
          className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
            o.value === value ? 'bg-brand-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export const Field: React.FC<{ label: string; hint?: React.ReactNode; aide?: TermeGlossaire; children: React.ReactNode; className?: string }> = ({
  label,
  hint,
  aide,
  children,
  className = '',
}) => (
  <div className={`block ${className}`}>
    <span className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700">
      {label}
      {aide && <Aide terme={aide} />}
    </span>
    {children}
    {hint && <span className="mt-1.5 block text-xs leading-relaxed text-slate-500">{hint}</span>}
  </div>
);

export const InputSuffix: React.FC<{ suffix: string; children: React.ReactNode }> = ({ suffix, children }) => (
  <div className="relative">
    {children}
    <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-sm text-slate-400">{suffix}</span>
  </div>
);

/** Onglets en pilules, défilables sur mobile. */
export function Tabs<T extends string>({ value, onChange, tabs }: { value: T; onChange: (v: T) => void; tabs: { value: T; label: string; icon?: React.ReactNode }[] }) {
  return (
    <div className="-mx-4 mb-6 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <div className="inline-flex gap-1 rounded-full bg-white p-1">
        {tabs.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => onChange(t.value)}
            className={`flex flex-shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition ${
              t.value === value ? 'bg-brand-700 text-white' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export const eur = (n: number, dec = 2): string =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: dec, maximumFractionDigits: dec }).format(n);

export const nb = (n: number, dec = 0): string => new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: dec }).format(n);
