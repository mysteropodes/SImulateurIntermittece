import React, { useState } from 'react';
import { useIntermittence } from '../context/IntermittenceContext';
import { useSimulation } from '../hooks/useSimulation';
import { BarChart3, ChevronDown, Table2 } from 'lucide-react';
import { Card, Kpi, Notice, PageHeader, Aide, eur, nb } from '../components/ui';
import { COEF_NON_INDEMNISABLE, DIVISEUR_JOUR, SEUIL_JOURS_TRAVAIL, cleMois, plafondCumul } from '../lib/calculs';

const MOIS_COURT = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

const SuiviMensuelPage: React.FC = () => {
  const { data } = useIntermittence();
  const sim = useSimulation();
  const [aide, setAide] = useState(false);
  const { mois, totaux } = sim.suivi;
  const annexe = data.annexe;
  const courant = cleMois(new Date());
  const max = Math.max(1, ...mois.map((m) => m.net + m.areVersee));

  const cell = (v: number, dec = 0) => (v > 0 ? nb(v, dec) : <span className="text-slate-300">–</span>);

  return (
    <div className="space-y-6">
      <PageHeader title="Suivi mensuel" accent="mois par mois" description="Ce que vous touchez mois par mois : salaires, jours non indemnisables, franchises et ARE." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi variant="dark" label="Total net sur le droit" value={eur(totaux.totalNet, 0)} sub="salaires + ARE versée" />
        <Kpi variant="lime" label="ARE versée" value={eur(totaux.areVersee, 0)} sub={`${totaux.joursIndemnises} jours indemnisés`} />
        <Kpi label="Salaires nets" value={eur(totaux.net, 0)} sub={`${nb(totaux.heures, 0)} h travaillées`} />
        <Kpi aide="franchiseCP" label="Délai et franchises" value={`${totaux.delaiAttente + totaux.franchiseCP + totaux.franchiseSal} j`} sub={`délai ${totaux.delaiAttente} · CP ${totaux.franchiseCP} · salaires ${totaux.franchiseSal}`} tone="amber" />
      </div>

      <Card title="Revenus nets par mois" icon={<BarChart3 className="h-4 w-4" />}>
        <div className="flex h-44 items-end gap-1 sm:gap-2.5">
          {mois.map((m) => {
            const hSal = (m.net / max) * 100;
            const hAre = (m.areVersee / max) * 100;
            return (
              <div key={m.cle} className="group flex min-w-0 flex-1 flex-col items-center gap-1" title={`${m.label} — salaires ${eur(m.net, 0)} + ARE ${eur(m.areVersee, 0)}`}>
                <div className="num hidden text-[10px] text-slate-500 group-hover:block">{nb(m.totalNet, 0)}</div>
                <div className="flex h-36 w-full flex-col justify-end overflow-hidden rounded-md bg-slate-50">
                  <div className="w-full bg-lime-400" style={{ height: `${hAre}%` }} />
                  <div className="w-full bg-brand-600" style={{ height: `${hSal}%` }} />
                </div>
                <div className={`w-full truncate text-center text-[10px] ${m.cle === courant ? 'font-semibold text-brand-700' : 'text-slate-400'}`}>{MOIS_COURT[m.mois - 1]}</div>
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-lime-400" /> ARE versée
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-brand-600" /> Salaires nets
          </span>
        </div>
      </Card>

      <Card
        title="Détail"
        icon={<Table2 className="h-4 w-4" />}
        bodyClassName=""
        action={
          <button onClick={() => setAide(!aide)} className="btn-ghost py-1 text-xs">
            Comment c'est calculé <ChevronDown className={`h-3.5 w-3.5 transition ${aide ? 'rotate-180' : ''}`} />
          </button>
        }
      >
        {aide && (
          <ol className="list-inside list-decimal space-y-1 border-b border-slate-100 bg-slate-50 px-5 py-4 text-xs text-slate-600">
            <li>
              Jours de travail = heures / {DIVISEUR_JOUR[annexe]}, quelle que soit la durée réelle des journées. À partir de {SEUIL_JOURS_TRAVAIL[annexe]} jours : pas
              d'ARE ce mois-là.
            </li>
            <li>Jours non indemnisables = ⌊jours de travail × {COEF_NON_INDEMNISABLE[annexe]}⌋, retirés des jours du mois compris dans le droit.</li>
            <li>
              <b>Marge</b> = heures encore possibles avant qu'un jour de plus devienne non indemnisable (un palier tous les{' '}
              {nb(DIVISEUR_JOUR[annexe] / COEF_NON_INDEMNISABLE[annexe], 2)} h).
            </li>
            <li>Puis dans l'ordre : délai d'attente, franchise congés payés, franchise salaires (le forfait non appliqué est reporté).</li>
            <li>
              ARE = jours indemnisés × {eur(sim.ajBrute)}. Salaires + ARE bruts limités à 118 % du plafond de la Sécu ({eur(plafondCumul(new Date().getFullYear()), 0)} en{' '}
              {new Date().getFullYear()}).
            </li>
            <li>
              Versé = ARE × {nb(sim.ratioNetAJ * 100, 1)} % (retenues sociales) − {nb(parseFloat(data.tauxPrelevement) || 0, 2)} % d'impôt. Salaires nets ≈{' '}
              {100 - (parseFloat(data.tauxCotisationsSalaire) || 0)} % du brut.
            </li>
          </ol>
        )}
        <div className="overflow-x-auto">
          <table className="num w-full min-w-[980px] text-sm">
            <thead className="text-xs font-medium text-slate-400">
              <tr>
                <th className="px-3 py-2.5 text-left">Mois</th>
                <th className="px-2 py-2.5 text-right">Heures</th>
                <th className="px-2 py-2.5 text-right">Brut</th>
                <th className="px-2 py-2.5 text-right" title={`Heures / ${DIVISEUR_JOUR[annexe]}`}>J. trav.</th>
                <th className="px-2 py-2.5 text-right">
                  <span className="inline-flex items-center gap-1">JNI <Aide terme="jni" /></span>
                </th>
                <th className="px-2 py-2.5 text-right">
                  <span className="inline-flex items-center gap-1">Marge <Aide terme="marge" /></span>
                </th>
                <th className="px-2 py-2.5 text-right">
                  <span className="inline-flex items-center gap-1">Délai <Aide terme="delai" /></span>
                </th>
                <th className="px-2 py-2.5 text-right">
                  <span className="inline-flex items-center gap-1">CP <Aide terme="franchiseCP" /></span>
                </th>
                <th className="px-2 py-2.5 text-right">
                  <span className="inline-flex items-center gap-1">Sal. <Aide terme="franchiseSal" /></span>
                </th>
                <th className="px-2 py-2.5 text-right">J. payés</th>
                <th className="px-2 py-2.5 text-right">
                  <span className="inline-flex items-center gap-1">ARE brute <Aide terme="plafondCumul" /></span>
                </th>
                <th className="px-2 py-2.5 text-right">ARE versée</th>
                <th className="px-3 py-2.5 text-right">Total net</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mois.map((m) => {
                const horsDroit = m.joursHorsDroit === m.joursDansMois;
                return (
                  <tr key={m.cle} className={`${horsDroit ? 'text-slate-300' : ''} ${m.cle === courant ? 'bg-lime-100' : 'hover:bg-slate-50/60'}`}>
                    <td className="px-3 py-2 text-left">
                      <span className="font-medium">{m.label}</span>
                      <span className="ml-1.5 text-xs text-slate-400">
                        {m.joursHorsDroit > 0 && !horsDroit ? `${m.joursDansMois - m.joursHorsDroit}/${m.joursDansMois} j` : `${m.joursDansMois} j`}
                        {m.joursArret > 0 && <span className="ml-1 text-amber-600">· {m.joursArret} j arrêt</span>}
                        {m.cle === sim.dateAnniversaire.slice(0, 7) && (
                          <span className="ml-1.5 inline-flex rounded-full bg-lime-300 px-2 py-0.5 text-[10px] font-semibold text-brand-900" title="Date anniversaire : évitez un contrat spectacle en cours ce jour-là">
                            anniversaire le {Number(sim.dateAnniversaire.slice(8, 10))}
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-right">{cell(m.heures, 1)}</td>
                    <td className="px-2 py-2 text-right">{cell(m.brut, 0)}</td>
                    <td className="px-2 py-2 text-right">{cell(m.joursTravail, 1)}</td>
                    <td className="px-2 py-2 text-right">
                      {m.seuilAtteint ? <span className="rounded bg-rose-50 px-1.5 text-xs font-medium text-rose-600">seuil</span> : cell(m.joursNonIndemnisables)}
                    </td>
                    <td className={`px-2 py-2 text-right text-xs ${!horsDroit && m.margeHeures < 2 ? 'font-semibold text-amber-600' : 'text-slate-500'}`}>
                      {horsDroit || m.seuilAtteint ? '' : `${nb(m.margeHeures, 1)} h`}
                    </td>
                    <td className="px-2 py-2 text-right text-amber-700">{cell(m.delaiAttente)}</td>
                    <td className="px-2 py-2 text-right text-amber-700">{cell(m.franchiseCP)}</td>
                    <td className="px-2 py-2 text-right text-amber-700">{cell(m.franchiseSal)}</td>
                    <td className="px-2 py-2 text-right font-medium">{cell(m.joursIndemnises)}</td>
                    <td className="px-2 py-2 text-right">
                      {cell(m.areBrute, 0)}
                      {m.plafondApplique && (
                        <span className="ml-1 text-amber-600" title="Plafond de cumul salaires + ARE atteint">
                          *
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-2 text-right text-brand-600">{cell(m.areVersee, 0)}</td>
                    <td className="px-3 py-2 text-right font-semibold">{m.totalNet > 0 ? eur(m.totalNet, 0) : <span className="text-slate-300">–</span>}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="border-t border-slate-200 font-semibold">
              <tr>
                <td className="px-3 py-2.5 text-left">Total</td>
                <td className="px-2 py-2.5 text-right">{nb(totaux.heures, 0)}</td>
                <td className="px-2 py-2.5 text-right">{nb(totaux.brut, 0)}</td>
                <td className="px-2 py-2.5 text-right">{nb(totaux.joursTravail, 1)}</td>
                <td colSpan={2}></td>
                <td className="px-2 py-2.5 text-right">{totaux.delaiAttente}</td>
                <td className="px-2 py-2.5 text-right">{totaux.franchiseCP}</td>
                <td className="px-2 py-2.5 text-right">{totaux.franchiseSal}</td>
                <td className="px-2 py-2.5 text-right">{totaux.joursIndemnises}</td>
                <td className="px-2 py-2.5 text-right">{nb(totaux.areBrute, 0)}</td>
                <td className="px-2 py-2.5 text-right">{nb(totaux.areVersee, 0)}</td>
                <td className="px-3 py-2.5 text-right">{eur(totaux.totalNet, 0)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      {(mois.some((m) => m.plafondApplique) || sim.suivi.franchiseCPRestante > 0 || sim.suivi.franchiseSalRestante > 0) && (
        <Notice tone="warn">
          {mois.some((m) => m.plafondApplique) && <p>* Plafond de cumul salaires + ARE atteint : l'ARE du mois est réduite.</p>}
          {(sim.suivi.franchiseCPRestante > 0 || sim.suivi.franchiseSalRestante > 0) && (
            <p>
              Franchises non consommées à la date anniversaire ({sim.suivi.franchiseCPRestante} j CP, {sim.suivi.franchiseSalRestante} j salaires) : un trop-perçu
              équivalent vous serait réclamé.
            </p>
          )}
        </Notice>
      )}
    </div>
  );
};

export default SuiviMensuelPage;
