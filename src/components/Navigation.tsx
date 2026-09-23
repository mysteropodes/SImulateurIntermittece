import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, List, PieChart, Calendar, SlidersHorizontal, FileSpreadsheet } from 'lucide-react';

export const PAGES = [
  { to: '/', label: 'Synthèse', icon: Home },
  { to: '/contrats', label: 'Contrats', icon: List },
  { to: '/mon-aj', label: 'Mon droit', icon: SlidersHorizontal },
  { to: '/suivi-mensuel', label: 'Suivi mensuel', icon: Calendar },
  { to: '/tableau-de-bord', label: 'Tableau de bord', icon: PieChart },
  { to: '/export', label: 'Export Excel', icon: FileSpreadsheet },
];

const Navigation: React.FC<{ variant?: 'side' | 'top' }> = ({ variant = 'side' }) => {
  if (variant === 'top') {
    return (
      <nav className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1">
        {PAGES.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition ${
                isActive ? 'bg-white text-brand-700 shadow-sm' : 'text-brand-100 hover:bg-white/10'
              }`
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>
    );
  }
  return (
    <nav className="flex flex-col gap-0.5">
      {PAGES.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
              isActive ? 'bg-white/15 text-white' : 'text-brand-100 hover:bg-white/10 hover:text-white'
            }`
          }
        >
          <Icon className="h-4 w-4" />
          {label}
        </NavLink>
      ))}
    </nav>
  );
};

export default Navigation;
