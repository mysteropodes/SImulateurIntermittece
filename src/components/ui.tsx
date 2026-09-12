import React from 'react';

export const Card: React.FC<{ title?: React.ReactNode; className?: string; children: React.ReactNode }> = ({ title, className = '', children }) => (
  <div className={`bg-white rounded-lg shadow p-4 ${className}`}>
    {title && <h2 className="font-semibold text-lg mb-3 pb-2 border-b flex items-center">{title}</h2>}
    {children}
  </div>
);

export const Stat: React.FC<{ label: string; value: React.ReactNode; hint?: React.ReactNode; className?: string }> = ({ label, value, hint, className = '' }) => (
  <div className={className}>
    <div className="text-sm text-gray-600">{label}</div>
    <div className="text-lg font-bold">{value}</div>
    {hint && <div className="text-xs text-gray-500">{hint}</div>}
  </div>
);

export const Notice: React.FC<{ tone?: 'info' | 'warn' | 'error' | 'success'; icon?: React.ReactNode; children: React.ReactNode; className?: string }> = ({
  tone = 'info',
  icon,
  children,
  className = '',
}) => {
  const tones = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    warn: 'bg-amber-50 border-amber-200 text-amber-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    success: 'bg-green-50 border-green-200 text-green-800',
  } as const;
  return (
    <div className={`rounded-lg p-4 border text-sm ${tones[tone]} ${className}`}>
      <div className="flex items-start">
        {icon && <span className="mt-0.5 mr-2 flex-shrink-0">{icon}</span>}
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
};

export const eur = (n: number, dec = 2): string =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: dec, maximumFractionDigits: dec }).format(n);

export const nb = (n: number, dec = 0): string =>
  new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: dec }).format(n);
