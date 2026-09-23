import React, { useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, List, PieChart, Calendar, SlidersHorizontal, FileSpreadsheet, History, LifeBuoy } from 'lucide-react';

export const PAGES = [
  { to: '/', label: 'Synthèse', icon: Home },
  { to: '/contrats', label: 'Contrats', icon: List },
  { to: '/mon-aj', label: 'Mon droit', icon: SlidersHorizontal },
  { to: '/suivi-mensuel', label: 'Suivi mensuel', icon: Calendar },
  { to: '/tableau-de-bord', label: 'Tableau de bord', icon: PieChart },
  { to: '/historique', label: 'Historique', icon: History },
  { to: '/mes-droits', label: 'Mes droits', icon: LifeBuoy },
  { to: '/export', label: 'Export Excel', icon: FileSpreadsheet },
];

const Navigation: React.FC<{ variant?: 'side' | 'top' }> = ({ variant = 'side' }) => {
  const location = useLocation();
  const navRef = useRef<HTMLElement>(null);
  // mobile : garder l'onglet actif visible dans la barre défilante
  useEffect(() => {
    const actif = navRef.current?.querySelector<HTMLElement>('[aria-current="page"]');
    if (actif && navRef.current) {
      navRef.current.scrollTo({ left: actif.offsetLeft - navRef.current.clientWidth / 2 + actif.clientWidth / 2, behavior: 'smooth' });
    }
  }, [location.pathname]);

  if (variant === 'top') {
    return (
      <nav ref={navRef} className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
        {PAGES.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
                isActive ? 'bg-lime-300 text-brand-900' : 'text-brand-100 hover:bg-white/10'
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
            `flex items-center gap-3 rounded-full px-4 py-2.5 text-sm font-semibold transition ${
              isActive ? 'bg-lime-300 text-brand-900' : 'text-brand-100 hover:bg-white/10 hover:text-white'
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
