import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  List, 
  PieChart, 
  Calendar, 
  Database, 
  ChevronRight 
} from 'lucide-react';

const Navigation: React.FC = () => {
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100';
  };

  return (
    <nav className="flex flex-col space-y-1 px-2 w-full">
      <Link to="/" className={`flex items-center px-4 py-2 rounded-md ${isActive('/')}`}>
        <Home className="w-5 h-5 mr-3" />
        <span>Synthèse</span>
        <ChevronRight className="w-4 h-4 ml-auto" />
      </Link>
      
      <Link to="/mon-aj" className={`flex items-center px-4 py-2 rounded-md ${isActive('/mon-aj')}`}>
        <Database className="w-5 h-5 mr-3" />
        <span>Mon AJ</span>
        <ChevronRight className="w-4 h-4 ml-auto" />
      </Link>
      
      <Link to="/contrats" className={`flex items-center px-4 py-2 rounded-md ${isActive('/contrats')}`}>
        <List className="w-5 h-5 mr-3" />
        <span>Contrats</span>
        <ChevronRight className="w-4 h-4 ml-auto" />
      </Link>
      
      <Link to="/suivi-mensuel" className={`flex items-center px-4 py-2 rounded-md ${isActive('/suivi-mensuel')}`}>
        <Calendar className="w-5 h-5 mr-3" />
        <span>Suivi Mensuel</span>
        <ChevronRight className="w-4 h-4 ml-auto" />
      </Link>
      
      <Link to="/tableau-de-bord" className={`flex items-center px-4 py-2 rounded-md ${isActive('/tableau-de-bord')}`}>
        <PieChart className="w-5 h-5 mr-3" />
        <span>Tableau de Bord</span>
        <ChevronRight className="w-4 h-4 ml-auto" />
      </Link>
    </nav>
  );
};

export default Navigation; 