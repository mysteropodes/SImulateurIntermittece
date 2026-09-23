import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { IntermittenceProvider } from './context/IntermittenceContext';
import { useSimulation } from './hooks/useSimulation';

import SynthesePage from './pages/SynthesePage';
import MonAJPage from './pages/MonAJPage';
import ContratsPage from './pages/ContratsPage';
import SuiviMensuelPage from './pages/SuiviMensuelPage';
import TableauDeBordPage from './pages/TableauDeBordPage';
import ExportExcelPage from './pages/ExportExcelPage';
import HistoriquePage from './pages/HistoriquePage';

import Navigation from './components/Navigation';
import ImportExportBar from './components/ImportExportBar';
import { eur, nb } from './components/ui';
import { SEUIL_HEURES, formatDateFR } from './lib/calculs';

/** Résumé toujours visible : l'essentiel de la simulation en trois lignes. */
function Resume() {
  const sim = useSimulation();
  const aff = sim.affiliation;
  const pct = Math.min(100, (aff.heuresAffiliation / SEUIL_HEURES) * 100);
  return (
    <div className="space-y-3 rounded-xl bg-white/10 p-3 text-sm">
      <div>
        <div className="text-xs text-brand-200">Allocation journalière</div>
        <div className="num text-lg font-semibold text-white">{sim.ajBrute > 0 ? `${eur(sim.ajBrute)}` : '—'}</div>
        {sim.ajBrute > 0 && <div className="num text-xs text-brand-200">{eur(sim.retenues.net)} net / jour</div>}
      </div>
      <div>
        <div className="flex justify-between text-xs text-brand-200">
          <span>Heures (507)</span>
          <span className="num">{nb(aff.heuresAffiliation, 0)} h</span>
        </div>
        <div className="mt-1 h-1.5 rounded-full bg-white/15">
          <div className={`h-1.5 rounded-full ${aff.eligible ? 'bg-emerald-400' : 'bg-amber-400'}`} style={{ width: `${pct}%` }} />
        </div>
      </div>
      <div className="flex justify-between text-xs text-brand-200">
        <span>Date anniversaire</span>
        <span className="num text-white">{formatDateFR(sim.dateAnniversaire)}</span>
      </div>
    </div>
  );
}

function Shell() {
  return (
    <div className="min-h-screen lg:flex">
      {/* Barre latérale (bureau) */}
      <aside className="hidden w-64 flex-shrink-0 flex-col gap-6 bg-brand-900 px-4 py-6 lg:sticky lg:top-0 lg:flex lg:h-screen">
        <div className="px-2">
          <div className="text-lg font-semibold text-white">🎭 Intermittence</div>
          <div className="text-xs text-brand-200">Simulateur annexes 8 et 10</div>
        </div>
        <Navigation />
        <Resume />
        <div className="mt-auto space-y-3">
          <ImportExportBar />
          <p className="px-3 text-[11px] leading-snug text-brand-300">Vos données restent dans ce navigateur. Exportez-les pour les garder.</p>
        </div>
      </aside>

      {/* En-tête (mobile / tablette) */}
      <header className="sticky top-0 z-20 bg-brand-900 px-4 pb-2 pt-3 lg:hidden">
        <div className="mb-2 flex items-center justify-between">
          <div className="whitespace-nowrap font-semibold text-white">🎭 Intermittence</div>
          <ImportExportBar compact />
        </div>
        <Navigation variant="top" />
      </header>

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
        <div className="mx-auto max-w-6xl">
          <Routes>
            <Route path="/" element={<SynthesePage />} />
            <Route path="/mon-aj" element={<MonAJPage />} />
            <Route path="/contrats" element={<ContratsPage />} />
            <Route path="/suivi-mensuel" element={<SuiviMensuelPage />} />
            <Route path="/tableau-de-bord" element={<TableauDeBordPage />} />
            <Route path="/historique" element={<HistoriquePage />} />
            <Route path="/export" element={<ExportExcelPage />} />
          </Routes>
          <footer className="mt-10 border-t border-slate-200 pt-4 text-xs text-slate-400">
            Règles du guide « Intermittents du spectacle » de France Travail. Montants indicatifs : seule votre notification fait foi.
          </footer>
        </div>
      </main>
    </div>
  );
}

function App() {
  const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/';
  return (
    <IntermittenceProvider>
      <Router basename={basename}>
        <Shell />
      </Router>
    </IntermittenceProvider>
  );
}

export default App;
