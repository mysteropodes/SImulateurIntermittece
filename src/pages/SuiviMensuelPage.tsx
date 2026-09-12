import React, { useState } from 'react';
import { useIntermittence } from '../context/IntermittenceContext';
import { useSimulation } from '../hooks/useSimulation';
import { Calendar, Info, AlertTriangle } from 'lucide-react';
import ImportExportBar from '../components/ImportExportBar';
import { Notice, eur, nb } from '../components/ui';
import { COEF_NON_INDEMNISABLE, DIVISEUR_JOUR, SEUIL_JOURS_TRAVAIL, plafondCumul, formatDateFR } from '../lib/calculs';

const SuiviMensuelPage: React.FC = () => {
  const { data } = useIntermittence();
  const sim = useSimulation();
  const [afficherInfos, setAfficherInfos] = useState(false);
  const { mois, totaux } = sim.suivi;
  const nbPlafond = mois.filter((m) => m.plafondApplique).length;
  const nbSeuil = mois.filter((m) => m.seuilAtteint).length;
  const annexe = data.annexe;

  const td = (v: number, cls = '', dec = 0, hide0 = true) => (
    <td className={`py-2 px-2 text-right ${v > 0 ? cls : ''}`}>{v > 0 || !hide0 ? nb(v, dec) : '-'}</td>
  );

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Suivi mensuel</h1>
        <p className="text-gray-600">
          Mois par mois : activité déclarée, jours non indemnisables, délai et franchises, ARE brute puis nette, plafond de cumul.
        </p>
      </div>

      <ImportExportBar />

      <div className="bg-amber-50 rounded-lg p-4 border border-amber-200 mb-6">
        <div className="flex items-start">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 mr-2 flex-shrink-0" />
          <div className="text-sm">
            <h3 className="font-semibold text-amber-800 mb-1 flex items-center">
              Comment est calculé chaque mois
              <button onClick={() => setAfficherInfos(!afficherInfos)} className="ml-2 text-sm text-amber-600 hover:text-amber-800">
                {afficherInfos ? 'Masquer' : 'Afficher'}
              </button>
            </h3>
            {afficherInfos && (
              <ol className="text-amber-700 mt-2 space-y-1 list-decimal list-inside">
                <li>
                  Jours de travail = heures du mois / {DIVISEUR_JOUR[annexe]}. Si ≥ {SEUIL_JOURS_TRAVAIL[annexe]} jours : aucune ARE ce mois-là.
                </li>
                <li>
                  Jours non indemnisables (JNI) = ⌊jours de travail × {COEF_NON_INDEMNISABLE[annexe]}⌋, déduits des jours du mois situés dans le droit.
                </li>
                <li>Sur les jours restants, dans l'ordre : délai d'attente (7 j, une fois), forfait congés payés, forfait salaires, puis reliquats reportés.</li>
                <li>ARE brute = jours indemnisés × AJ brute ({eur(sim.ajBrute)}).</li>
                <li>
                  Plafond de cumul : salaires bruts + ARE ≤ 118 % du PMSS ({eur(plafondCumul(mois[0]?.annee ?? new Date().getFullYear()))} en {mois[0]?.annee}). Au-delà,
                  l'ARE est réduite et les jours recalculés (arrondi supérieur).
                </li>
                <li>
                  ARE nette = brute × {nb(sim.ratioNetAJ * 100, 1)} % (retraite complémentaire, CSG/CRDS), puis prélèvement à la source de {data.tauxPrelevement || 0} %.
                  Salaires nets estimés à {100 - (parseFloat(data.tauxCotisationsSalaire) || 0)} % du brut.
                </li>
              </ol>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
        <div className="p-4 flex items-center bg-blue-50 border-b border-blue-200">
          <Calendar className="w-5 h-5 text-blue-600 mr-2" />
          <h2 className="text-lg font-semibold text-blue-800">
            Droit du {formatDateFR(sim.dateIndem)} au {formatDateFR(sim.dateFinDroit)}
          </h2>
          <span className="text-sm text-blue-600 ml-auto">
            {sim.ajBrute > 0 ? `AJ brute ${eur(sim.ajBrute)} ${sim.sourceAJ === 'notifiee' ? '(notifiée)' : '(calculée)'} — nette ${eur(sim.retenues.net)}` : 'AJ non définie (non éligible)'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full bg-white text-sm">
            <thead>
              <tr className="bg-gray-800 text-white">
                <th className="py-2 px-2 text-left">Mois</th>
                <th className="py-2 px-2 text-right">Jours</th>
                <th className="py-2 px-2 text-right" title="Jours du mois hors période de droit">Hors droit</th>
                <th className="py-2 px-2 text-right">Heures</th>
                <th className="py-2 px-2 text-right">Brut (€)</th>
                <th className="py-2 px-2 text-right">Net (€)</th>
                <th className="py-2 px-2 text-right" title={`Heures / ${DIVISEUR_JOUR[annexe]}`}>J. trav.</th>
                <th className="py-2 px-2 text-right" title={`× ${COEF_NON_INDEMNISABLE[annexe]}`}>JNI</th>
                <th className="py-2 px-2 text-right">Délai</th>
                <th className="py-2 px-2 text-right">Fr. CP</th>
                <th className="py-2 px-2 text-right">Fr. Sal.</th>
                <th className="py-2 px-2 text-right">J. ind.</th>
                <th className="py-2 px-2 text-right">ARE brute</th>
                <th className="py-2 px-2 text-right">ARE nette</th>
                <th className="py-2 px-2 text-right">Total net</th>
              </tr>
            </thead>
            <tbody>
              {mois.map((m, index) => (
                <tr
                  key={m.cle}
                  className={`border-b ${index % 2 === 0 ? 'bg-gray-50' : ''} ${m.plafondApplique || m.seuilAtteint ? 'bg-amber-50' : ''} ${
                    m.joursHorsDroit === m.joursDansMois ? 'bg-gray-100 text-gray-400' : ''
                  }`}
                >
                  <td className="py-2 px-2 text-left font-semibold">{m.label}</td>
                  <td className="py-2 px-2 text-right">{m.joursDansMois}</td>
                  {td(m.joursHorsDroit, 'bg-red-50')}
                  {td(m.heures, 'bg-green-50', 1)}
                  {td(m.brut, 'bg-green-50', 2)}
                  {td(m.net, 'bg-green-50', 2)}
                  {td(m.joursTravail, 'bg-yellow-50', 1)}
                  <td className={`py-2 px-2 text-right ${m.joursNonIndemnisables > 0 ? 'bg-yellow-50' : ''}`}>
                    {m.seuilAtteint ? <span className="text-amber-700 font-semibold" title="Seuil de jours de travail atteint : aucune ARE">seuil</span> : m.joursNonIndemnisables > 0 ? m.joursNonIndemnisables : '-'}
                  </td>
                  {td(m.delaiAttente, 'bg-orange-50')}
                  {td(m.franchiseCP, 'bg-orange-50')}
                  {td(m.franchiseSal, 'bg-orange-50')}
                  {td(m.joursIndemnises, 'bg-blue-50')}
                  <td className={`py-2 px-2 text-right ${m.areBrute > 0 ? 'bg-blue-50' : ''} ${m.plafondApplique ? 'bg-amber-100' : ''}`}>
                    {m.areBrute > 0 ? (
                      <>
                        {nb(m.areBrute, 2)}
                        {m.plafondApplique && <span className="text-amber-600 ml-1">*</span>}
                      </>
                    ) : (
                      '-'
                    )}
                  </td>
                  {td(m.areVersee, 'bg-blue-50', 2)}
                  <td className={`py-2 px-2 text-right font-semibold ${m.totalNet > 0 ? 'bg-blue-100' : ''}`}>{nb(m.totalNet, 2)}</td>
                </tr>
              ))}

              <tr className="bg-gray-100 font-bold border-t-2 border-gray-400">
                <td className="py-2 px-2 text-left">Total</td>
                <td className="py-2 px-2 text-right">-</td>
                <td className="py-2 px-2 text-right">-</td>
                <td className="py-2 px-2 text-right">{nb(totaux.heures, 1)}</td>
                <td className="py-2 px-2 text-right">{nb(totaux.brut, 2)}</td>
                <td className="py-2 px-2 text-right">{nb(totaux.net, 2)}</td>
                <td className="py-2 px-2 text-right">{nb(totaux.joursTravail, 1)}</td>
                <td className="py-2 px-2 text-right">-</td>
                <td className="py-2 px-2 text-right">{totaux.delaiAttente}</td>
                <td className="py-2 px-2 text-right">{totaux.franchiseCP}</td>
                <td className="py-2 px-2 text-right">{totaux.franchiseSal}</td>
                <td className="py-2 px-2 text-right">{totaux.joursIndemnises}</td>
                <td className="py-2 px-2 text-right">{nb(totaux.areBrute, 2)}</td>
                <td className="py-2 px-2 text-right">{nb(totaux.areVersee, 2)}</td>
                <td className="py-2 px-2 text-right">{nb(totaux.totalNet, 2)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {(nbPlafond > 0 || nbSeuil > 0 || sim.suivi.franchiseCPRestante > 0 || sim.suivi.franchiseSalRestante > 0) && (
          <div className="px-4 py-2 text-xs text-amber-700 bg-amber-50 border-t border-amber-200 space-y-1">
            {nbPlafond > 0 && <p>* Plafond de cumul salaires + ARE (118 % du PMSS) atteint sur {nbPlafond} mois : ARE réduite.</p>}
            {nbSeuil > 0 && <p>Seuil de {SEUIL_JOURS_TRAVAIL[annexe]} jours de travail atteint sur {nbSeuil} mois : aucune ARE, forfaits de franchise reportés.</p>}
            {(sim.suivi.franchiseCPRestante > 0 || sim.suivi.franchiseSalRestante > 0) && (
              <p>
                Franchises non consommées à la fin du droit : {sim.suivi.franchiseCPRestante} j CP, {sim.suivi.franchiseSalRestante} j salaires → un trop-perçu équivalent
                serait notifié.
              </p>
            )}
          </div>
        )}
      </div>

      <Notice icon={<Info className="w-5 h-5 text-blue-600" />}>
        <p className="font-semibold mb-1">Légende</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          <div className="flex items-center"><div className="w-4 h-4 bg-green-50 rounded border border-green-200 mr-1"></div><span>Revenus du travail</span></div>
          <div className="flex items-center"><div className="w-4 h-4 bg-yellow-50 rounded border border-yellow-200 mr-1"></div><span>Jours de travail / JNI</span></div>
          <div className="flex items-center"><div className="w-4 h-4 bg-orange-50 rounded border border-orange-200 mr-1"></div><span>Délai / franchises</span></div>
          <div className="flex items-center"><div className="w-4 h-4 bg-red-50 rounded border border-red-200 mr-1"></div><span>Hors période de droit</span></div>
          <div className="flex items-center"><div className="w-4 h-4 bg-blue-50 rounded border border-blue-200 mr-1"></div><span>Indemnisation</span></div>
          <div className="flex items-center"><div className="w-4 h-4 bg-amber-50 rounded border border-amber-200 mr-1"></div><span>Plafond / seuil</span></div>
        </div>
      </Notice>
    </div>
  );
};

export default SuiviMensuelPage;
