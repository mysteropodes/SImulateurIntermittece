import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { IntermittenceProvider } from './context/IntermittenceContext';

// Pages
import SynthesePage from './pages/SynthesePage';
import MonAJPage from './pages/MonAJPage';
import ContratsPage from './pages/ContratsPage';
import SuiviMensuelPage from './pages/SuiviMensuelPage';
import TableauDeBordPage from './pages/TableauDeBordPage';

// Components
import Navigation from './components/Navigation';

function App() {
  return (
    <IntermittenceProvider>
      <Router>
        <div className="min-h-screen bg-gray-100">
          <div className="flex flex-col md:flex-row">
            {/* Sidebar pour la navigation */}
            <div className="w-full md:w-64 bg-white border-r md:min-h-screen p-4">
              <div className="mb-4">
                <h1 className="text-xl font-bold text-blue-700">Simulateur d'Intermittence</h1>
                <p className="text-sm text-gray-500">Gérez votre intermittence du spectacle</p>
              </div>
              <Navigation />
            </div>
            
            {/* Contenu principal */}
            <div className="flex-grow">
              <Routes>
                <Route path="/" element={<SynthesePage />} />
                <Route path="/mon-aj" element={<MonAJPage />} />
                <Route path="/contrats" element={<ContratsPage />} />
                <Route path="/suivi-mensuel" element={<SuiviMensuelPage />} />
                <Route path="/tableau-de-bord" element={<TableauDeBordPage />} />
              </Routes>
            </div>
          </div>
        </div>
      </Router>
    </IntermittenceProvider>
  );
}

export default App; 