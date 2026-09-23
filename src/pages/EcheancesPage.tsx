import React, { useMemo } from 'react';
import { CalendarPlus, Building2, Landmark, Flag } from 'lucide-react';
import { useIntermittence } from '../context/IntermittenceContext';
import { useSimulation } from '../hooks/useSimulation';
import { Card, Badge, PageHeader, Notice } from '../components/ui';
import { echeances, versICS, type TypeEcheance } from '../lib/echeances';
import { diagnosticAnniversaire } from '../lib/droits';
import { formatDateFR, parseDate, toISODate } from '../lib/calculs';

const STYLE: Record<TypeEcheance, { label: string; tone: 'brand' | 'lime' | 'amber'; icon: React.ReactNode }> = {
  'france-travail': { label: 'France Travail', tone: 'brand', icon: <Landmark className="h-4 w-4" /> },
  audiens: { label: 'Audiens', tone: 'lime', icon: <Building2 className="h-4 w-4" /> },
  droit: { label: 'Votre droit', tone: 'amber', icon: <Flag className="h-4 w-4" /> },
};

const EcheancesPage: React.FC = () => {
  const { data } = useIntermittence();
  const sim = useSimulation();
  const aujourdHui = toISODate(new Date());
  const diag = diagnosticAnniversaire(sim.affiliation.heuresAffiliation, data.profil);
  const liste = useMemo(
    () => echeances({ aujourdHui, dateAnniversaire: sim.dateAnniversaire, rattrapagePossible: diag.issue === 'rattrapage' }),
    [aujourdHui, sim.dateAnniversaire, diag.issue]
  );

  const telecharger = () => {
    const blob = new Blob([versICS(liste)], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'echeances-intermittence.ics';
    a.click();
    URL.revokeObjectURL(url);
  };

  const jours = (iso: string) => Math.round((parseDate(iso).getTime() - parseDate(aujourdHui).getTime()) / 86400000);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Échéances"
        accent="à ne pas rater"
        description="Actualisation, réexamen, Congés Spectacles : les dates clés de votre droit, à ajouter à votre agenda avec un rappel la veille."
        actions={
          <button onClick={telecharger} className="btn-primary">
            <CalendarPlus className="h-4 w-4" /> Ajouter à mon agenda (.ics)
          </button>
        }
      />

      <Card bodyClassName="p-2 sm:p-3">
        <ol className="relative">
          {liste.map((e, i) => {
            const s = STYLE[e.type];
            const j = jours(e.date);
            const proche = j >= 0 && j <= 30;
            return (
              <li key={e.id} className={`flex gap-4 rounded-3xl p-4 ${proche ? 'bg-lime-100' : ''}`}>
                <div className="flex flex-col items-center">
                  <span className={`flex h-10 w-10 items-center justify-center rounded-full ${proche ? 'bg-brand-700 text-lime-300' : 'bg-slate-100 text-slate-500'}`}>{s.icon}</span>
                  {i < liste.length - 1 && <span className="mt-2 w-px flex-1 bg-slate-200" />}
                </div>
                <div className="min-w-0 flex-1 pb-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="num text-sm font-semibold text-slate-900">{formatDateFR(e.date)}</span>
                    <span className="text-xs text-slate-500">{j === 0 ? "aujourd'hui" : j > 0 ? `dans ${j} jours` : `il y a ${-j} jours`}</span>
                    <Badge tone={s.tone}>{s.label}</Badge>
                    {e.mensuel && <Badge>chaque mois</Badge>}
                  </div>
                  <p className="mt-1 text-base font-semibold text-slate-900">{e.titre}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-slate-600">{e.detail}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </Card>

      <Notice>
        Le fichier .ics s'ouvre avec Calendrier (Mac, iPhone), Google Agenda ou Outlook. Si vos dates changent (nouveau droit, nouveau contrat), supprimez les anciens
        événements puis importez le nouveau fichier.
      </Notice>
    </div>
  );
};

export default EcheancesPage;
