import React from 'react';

/** Logo : rideau de scène ouvert sur un projecteur, en aplats. */
export const Logo: React.FC<{ size?: number; className?: string }> = ({ size = 36, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" className={className} aria-hidden="true">
    <rect width="40" height="40" rx="12" fill="#d2ec9c" />
    <rect x="7" y="7" width="26" height="3" rx="1.5" fill="#0c3834" />
    <path d="M8 10h11c-1.6 7.2-5 12.6-11 16z" fill="#155a53" />
    <path d="M32 10H21c1.6 7.2 5 12.6 11 16z" fill="#155a53" />
    <circle cx="20" cy="24" r="3" fill="#0c3834" />
    <rect x="7" y="30" width="26" height="3" rx="1.5" fill="#0c3834" />
  </svg>
);

export const Marque: React.FC<{ compact?: boolean }> = ({ compact }) => (
  <div className="flex items-center gap-2.5">
    <Logo size={compact ? 30 : 36} />
    <div className="leading-tight">
      <div className={`font-bold tracking-tight text-white ${compact ? 'text-base' : 'text-lg'}`}>Intermittence</div>
      {!compact && <div className="text-[11px] text-brand-200">Annexes 8 et 10</div>}
    </div>
  </div>
);
