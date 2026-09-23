import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, ClipboardCopy, Check, ExternalLink, ListChecks } from 'lucide-react';
import { useIntermittence } from '../context/IntermittenceContext';
import { useSimulation } from '../hooks/useSimulation';
import { Card, Kpi, Badge, PageHeader, Notice, eur, nb } from '../components/ui';
import ExamenAnniversaire from '../components/ExamenAnniversaire';
import { recapMois, recapTexte } from '../lib/actualisation';
import { TYPES } from '../lib/typesContrat';
import { cleMois, formatDateFR } from '../lib/calculs';

const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

/** Mois à actualiser : le mois courant à partir du 28, sinon le mois précédent. */
function moisParDefaut(d = new Date()): Date {
  return d.getDate() >= 28 ? new Date(d.getFullYear(), d.getMonth(), 1) : new Date(d.getFullYear(), d.getMonth() - 1, 1);
}

const ActualisationPage: React.FC = () => {
  const { data } = useIntermittence();
  const sim = useSimulation();
  const [mois, setMois] = useState<Date>(moisParDefaut());
  const [copie, setCopie] = useState(false);
  const cle = cleMois(mois);
  const libelle = `${MOIS[mois.getMonth()]} ${mois.getFullYear()}`;
  const recap = useMemo(() => recapMois(data.contrats, cle), [data.contrats, cle]);
  const suivi = sim.suivi.mois.find((m) => m.cle === cle);

  const decaler = (n: number) => setMois((m) => new Date(m.getFullYear(), m.getMonth() + n, 1));
  const copier = async () => {
    try {
      await navigator.clipboard.writeText(recapTexte(recap, libelle));
      setCopie(true);
      setTimeout(() => setCopie(false), 2000);
    } catch {
      alert(recapTexte(recap, libelle));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Actualisation"
        accent="du mois"
        description="Ce que vous déclarez à France Travail chaque mois, du 28 au 15 du mois suivant : heures et salaire brut, employeur par employeur."
        actions={
          <a href="https://www.francetravail.fr/accueil/" target="_blank" rel="noreferrer" className="btn-outline">
            Espace France Travail <ExternalLink className="h-4 w-4" />
          </a>
        }
      />

      <div className="flex items-center justify-between gap-3 rounded-full bg-white p-1.5">
        <button onClick={() => decaler(-1)} className="btn-ghost px-3" aria-label="Mois précédent">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-base font-semibold capitalize">{libelle}</span>
        <button onClick={() => decaler(1)} className="btn-ghost px-3" aria-label="Mois suivant">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <ExamenAnniversaire compact />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Kpi variant="dark" label="Heures à déclarer" value={`${nb(recap.heures, 2)} h`} sub={`${recap.lignes.length} employeur(s) / activité(s)`} />
        <Kpi variant="lime" label="Salaire brut à déclarer" value={eur(recap.brut)} sub="avant cotisations" />
        <Kpi
          aide="jni"
          label="ARE estimée ce mois"
          value={suivi && suivi.joursHorsDroit < suivi.joursDansMois ? eur(suivi.areVersee, 0) : '—'}
          sub={suivi ? `${suivi.joursIndemnises} jours payés · ${suivi.seuilAtteint ? 'seuil atteint' : `${suivi.joursNonIndemnisables} j non indemnisables`}` : 'hors période simulée'}
          className="sm:col-span-2 lg:col-span-1"
        />
      </div>

      <Card
        title="Détail à recopier"
        icon={<ListChecks className="h-4 w-4" />}
        action={
          <button onClick={copier} className="btn-primary py-2">
            {copie ? <Check className="h-4 w-4" /> : <ClipboardCopy className="h-4 w-4" />}
            {copie ? 'Copié' : 'Copier'}
          </button>
        }
        bodyClassName="pb-2"
      >
        {recap.lignes.length === 0 && recap.arrets.length === 0 && recap.formations.length === 0 ? (
          <p className="px-6 pb-6 text-sm text-slate-500">Aucune activité saisie pour ce mois : vous déclarez « non » à « Avez-vous travaillé ? ».</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="num w-full min-w-[560px] text-sm">
              <thead className="text-left text-xs text-slate-400">
                <tr>
                  <th className="px-6 py-2 font-medium">Employeur</th>
                  <th className="px-3 py-2 font-medium">Période</th>
                  <th className="px-3 py-2 text-right font-medium">Heures</th>
                  <th className="px-6 py-2 text-right font-medium">Brut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recap.lignes.map((l, i) => (
                  <tr key={i}>
                    <td className="px-6 py-3">
                      <div className="font-medium text-slate-800">{l.employeur}</div>
                      <Badge tone={TYPES[l.type].tone}>{TYPES[l.type].court}</Badge>
                    </td>
                    <td className="px-3 py-3 text-slate-500">
                      {formatDateFR(l.debut)}
                      {l.fin !== l.debut && ` → ${formatDateFR(l.fin)}`}
                    </td>
                    <td className="px-3 py-3 text-right">{nb(l.heures, 2)} h</td>
                    <td className="px-6 py-3 text-right font-semibold">{eur(l.brut)}</td>
                  </tr>
                ))}
                {recap.lignes.length > 0 && (
                  <tr className="font-semibold">
                    <td className="px-6 py-3">Total</td>
                    <td />
                    <td className="px-3 py-3 text-right">{nb(recap.heures, 2)} h</td>
                    <td className="px-6 py-3 text-right">{eur(recap.brut)}</td>
                  </tr>
                )}
                {recap.arrets.map((a, i) => (
                  <tr key={`a${i}`} className="text-amber-800">
                    <td className="px-6 py-3" colSpan={2}>
                      Arrêt / congé du {formatDateFR(a.debut)} au {formatDateFR(a.fin)}
                    </td>
                    <td className="px-3 py-3 text-right" colSpan={2}>
                      {a.jours} jours
                    </td>
                  </tr>
                ))}
                {recap.formations.map((f, i) => (
                  <tr key={`f${i}`} className="text-slate-600">
                    <td className="px-6 py-3" colSpan={2}>
                      Formation : {f.employeur}
                    </td>
                    <td className="px-3 py-3 text-right" colSpan={2}>
                      {nb(f.heures, 1)} h
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title="Les questions de l'actualisation">
        <ol className="space-y-3 text-sm text-slate-600">
          <li>
            <b className="text-slate-800">Avez-vous travaillé ?</b> {recap.lignes.length ? `Oui : ${nb(recap.heures, 2)} h pour ${eur(recap.brut)} brut.` : 'Non.'} Déclarez tout, y
            compris les cours et le travail hors spectacle.
          </li>
          <li>
            <b className="text-slate-800">Avez-vous été en arrêt maladie, congé maternité ou paternité ?</b> {recap.arrets.length ? 'Oui, avec les dates ci-dessus.' : 'Non.'}
          </li>
          <li>
            <b className="text-slate-800">Avez-vous suivi une formation ?</b> {recap.formations.length ? 'Oui.' : 'Non.'}
          </li>
          <li>
            <b className="text-slate-800">Êtes-vous toujours à la recherche d'un emploi ?</b> Oui, pour rester indemnisé(e).
          </li>
        </ol>
      </Card>

      <Notice>
        Les droits d'auteur et droits voisins ne se déclarent pas (ils se cumulent avec l'ARE). Pour chaque contrat, l'employeur doit envoyer une attestation
        (AEM) : vérifiez dans votre espace qu'elle est bien arrivée, sinon le paiement peut être bloqué.
      </Notice>
    </div>
  );
};

export default ActualisationPage;
