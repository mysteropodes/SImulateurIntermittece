import React from 'react';
import { useIntermittence } from '../context/IntermittenceContext';
import { useSimulation } from '../hooks/useSimulation';
import { Info, Database, CheckCircle, Calculator, Scissors } from 'lucide-react';
import ImportExportBar from '../components/ImportExportBar';
import { Card, Notice, eur, nb } from '../components/ui';
import { AJ_MIN, AJ_MAX, PLANCHER, formatDateFR, repartitionFranchiseSalaires } from '../lib/calculs';

const input = 'border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500';

const MonAJPage: React.FC = () => {
  const { data, updateField } = useIntermittence();
  const sim = useSimulation();
  const { affiliation: aff, ajCalculee } = sim;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Mon allocation journalière</h1>
        <p className="text-gray-600">
          Paramètres de votre droit. L'AJ, les franchises et le suivi mensuel se calculent à partir des contrats saisis dans
          l'onglet Contrats.
        </p>
      </div>

      <ImportExportBar />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card
          title={
            <>
              <Database className="w-5 h-5 mr-2 text-blue-600" />
              Situation
            </>
          }
        >
          <label className="block text-sm font-medium mb-1">Annexe</label>
          <select value={data.annexe} onChange={(e) => updateField('annexe', e.target.value === 'A10' ? 'A10' : 'A8')} className={`w-full mb-4 ${input}`}>
            <option value="A8">Ouvrier / Technicien (annexe 8)</option>
            <option value="A10">Artiste (annexe 10)</option>
          </select>

          <label className="block text-sm font-medium mb-1">Fin du contrat ayant ouvert le droit</label>
          <input type="date" value={data.dateFinContrat} onChange={(e) => updateField('dateFinContrat', e.target.value)} className={`w-full ${input}`} />
          <p className="text-xs text-gray-500 mt-1 mb-4">Facultatif : sert de valeur par défaut au début du droit (lendemain).</p>

          <label className="block text-sm font-medium mb-1">Indemnisable à partir du</label>
          <input type="date" value={data.dateIndem} onChange={(e) => updateField('dateIndem', e.target.value)} className={`w-full ${input}`} />
          <p className="text-xs text-gray-500 mt-1 mb-4">Début du droit en cours. Vide = lendemain du contrat ayant ouvert le droit, sinon du dernier contrat.</p>

          <label className="block text-sm font-medium mb-1">Figer la fin de la période de référence</label>
          <input type="date" value={data.dateFinPRA} onChange={(e) => updateField('dateFinPRA', e.target.value)} className={`w-full ${input}`} />
          <p className="text-xs text-gray-500 mt-1 mb-4">
            Facultatif. Par défaut, les 507 h sont recherchées sur les 12 mois qui précèdent la fin de votre dernier contrat — c'est ce que France Travail
            examinera à la date anniversaire. Renseignez une date pour figer la période (ex. rejouer l'ouverture d'un ancien droit).
          </p>

          <div className="flex items-center">
            <span className="mr-3 text-sm font-medium">Délai d'attente de 7 jours</span>
            <button
              type="button"
              className={`px-3 py-1 rounded-l ${data.delaiAttente ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
              onClick={() => updateField('delaiAttente', true)}
            >
              Oui
            </button>
            <button
              type="button"
              className={`px-3 py-1 rounded-r ${!data.delaiAttente ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
              onClick={() => updateField('delaiAttente', false)}
            >
              Non
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">S'applique à chaque ouverture ou réadmission, au plus 7 jours par période de 12 mois.</p>
        </Card>

        <Card
          title={
            <>
              <Calculator className="w-5 h-5 mr-2 text-green-600" />
              AJ calculée ({data.annexe === 'A8' ? 'annexe 8' : 'annexe 10'})
            </>
          }
        >
          <div className="text-xs text-gray-500 mb-2">
            PRA du {formatDateFR(aff.periode.debut)} au {formatDateFR(aff.periode.fin)} — NHT {nb(aff.nht, 1)} h, SR {eur(aff.sr)}
          </div>
          {aff.eligible ? (
            <table className="w-full text-sm">
              <tbody>
                <tr>
                  <td className="py-1 text-gray-600">Partie A (salaires)</td>
                  <td className="py-1 text-right">{eur(ajCalculee.A)}</td>
                </tr>
                <tr>
                  <td className="py-1 text-gray-600">Partie B (heures)</td>
                  <td className="py-1 text-right">{eur(ajCalculee.B)}</td>
                </tr>
                <tr>
                  <td className="py-1 text-gray-600">Partie C (fixe, {eur(AJ_MIN)} × {data.annexe === 'A8' ? '0,40' : '0,70'})</td>
                  <td className="py-1 text-right">{eur(ajCalculee.C)}</td>
                </tr>
                <tr className="border-t">
                  <td className="py-1 text-gray-600">A + B + C</td>
                  <td className="py-1 text-right">{eur(ajCalculee.brutCalcule)}</td>
                </tr>
                <tr className="border-t font-bold">
                  <td className="py-2">AJ brute retenue</td>
                  <td className="py-2 text-right text-blue-700 text-lg">{eur(ajCalculee.aj)}</td>
                </tr>
                <tr>
                  <td className="py-1 text-gray-600">AJ nette estimée (avant impôt)</td>
                  <td className="py-1 text-right">{eur(sim.sourceAJ === 'calculee' ? sim.retenues.net : ajCalculee.aj * sim.ratioNetAJ)}</td>
                </tr>
              </tbody>
            </table>
          ) : (
            <Notice tone="error">
              Seuil de 507 h non atteint dans la période de référence ({nb(aff.nht, 1)} h, il manque {nb(aff.heuresManquantes, 1)} h).
            </Notice>
          )}
          <p className="text-xs text-gray-500 mt-2">
            Plancher {eur(PLANCHER[data.annexe])}, plafond {eur(AJ_MAX)}.{' '}
            {ajCalculee.plancherApplique && aff.eligible && <span className="text-amber-700">Plancher appliqué.</span>}
            {ajCalculee.plafondApplique && aff.eligible && <span className="text-amber-700">Plafond appliqué.</span>}
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card
          title={
            <>
              <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
              Droit notifié par France Travail (facultatif)
            </>
          }
        >
          <label className="block text-sm font-medium mb-1">AJ brute figurant sur votre notification</label>
          <div className="flex items-center mb-1">
            <input
              type="number"
              step="0.01"
              min="0"
              value={data.ajBruteNotifiee}
              onChange={(e) => updateField('ajBruteNotifiee', e.target.value)}
              className={`w-32 mr-2 ${input}`}
              placeholder={aff.eligible ? ajCalculee.aj.toFixed(2) : ''}
            />
            <span>€ / jour</span>
          </div>
          <p className="text-xs text-gray-500 mb-4">
            Si renseignée, cette AJ remplace l'AJ calculée dans le suivi mensuel. Utile pour un droit déjà ouvert.
            {sim.sourceAJ === 'notifiee' && (
              <span className="block text-blue-700 mt-1">
                AJ utilisée : {eur(sim.ajBrute)} (notifiée) — l'AJ calculée sur vos contrats serait {eur(ajCalculee.aj)}.
              </span>
            )}
          </p>

          <label className="block text-sm font-medium mb-1">Taux de prélèvement à la source</label>
          <div className="flex items-center mb-4">
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={data.tauxPrelevement}
              onChange={(e) => updateField('tauxPrelevement', e.target.value)}
              className={`w-24 mr-2 ${input}`}
            />
            <span>%</span>
          </div>

          <label className="block text-sm font-medium mb-1">CSG sur l'ARE</label>
          <select value={data.tauxCSG} onChange={(e) => updateField('tauxCSG', e.target.value === '3.8' ? '3.8' : '6.2')} className={`w-full mb-4 ${input}`}>
            <option value="6.2">Taux plein (6,2 %)</option>
            <option value="3.8">Taux réduit (3,8 %)</option>
          </select>

          <label className="block text-sm font-medium mb-1">Cotisations salariales sur les salaires (estimation)</label>
          <div className="flex items-center">
            <input
              type="number"
              min="0"
              max="100"
              step="0.5"
              value={data.tauxCotisationsSalaire}
              onChange={(e) => updateField('tauxCotisationsSalaire', e.target.value)}
              className={`w-24 mr-2 ${input}`}
            />
            <span>% du brut</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Sert uniquement à estimer vos salaires nets (≈ 22 % technicien, ≈ 20 % artiste avec abattement).</p>
        </Card>

        <Card
          title={
            <>
              <Scissors className="w-5 h-5 mr-2 text-orange-600" />
              Franchises
            </>
          }
        >
          <div className="flex items-center mb-3">
            <span className="mr-3 text-sm font-medium">Calcul</span>
            <button
              type="button"
              className={`px-3 py-1 rounded-l ${data.franchisesAuto ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
              onClick={() => updateField('franchisesAuto', true)}
            >
              Automatique
            </button>
            <button
              type="button"
              className={`px-3 py-1 rounded-r ${!data.franchisesAuto ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
              onClick={() => updateField('franchisesAuto', false)}
            >
              Notification
            </button>
          </div>

          {data.franchisesAuto ? (
            <table className="w-full text-sm">
              <tbody>
                <tr>
                  <td className="py-1 text-gray-600">Franchise congés payés</td>
                  <td className="py-1 text-right">
                    <b>{sim.franchiseCPAuto.total} j</b> — {sim.franchiseCPAuto.forfaitMensuel} j / mois
                  </td>
                </tr>
                <tr>
                  <td className="py-1 text-xs text-gray-500" colSpan={2}>
                    ⌊{nb(aff.joursTravail, 1)} jours travaillés × 2,5 / 24⌋, plafonnée à 30 jours ; 2 j/mois jusqu'à 24 j, 3 j/mois au-delà.
                  </td>
                </tr>
                <tr>
                  <td className="py-1 text-gray-600">Franchise salaires</td>
                  <td className="py-1 text-right">
                    <b>{sim.franchiseSalAuto.total} j</b>
                    {sim.franchiseSalAuto.total > 0 && <> — {repartitionFranchiseSalaires(sim.franchiseSalAuto).join(' + ')} j</>}
                  </td>
                </tr>
                <tr>
                  <td className="py-1 text-xs text-gray-500" colSpan={2}>
                    ⌊(SR / SMIC mensuel) × (SJM / (3 × SMIC journalier))⌋ − 27, étalée sur 8 mois. SJM {eur(sim.sjm)}, SMIC au{' '}
                    {formatDateFR(aff.periode.fin)} : {eur(sim.smic.horaire)}/h.
                  </td>
                </tr>
              </tbody>
            </table>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm">
                Franchise CP (total)
                <input type="number" min="0" value={data.franchiseConges} onChange={(e) => updateField('franchiseConges', e.target.value)} className={`w-full ${input}`} />
              </label>
              <label className="text-sm">
                jours / mois
                <input type="number" min="0" value={data.joursConges} onChange={(e) => updateField('joursConges', e.target.value)} className={`w-full ${input}`} placeholder="2 ou 3" />
              </label>
              <label className="text-sm">
                Franchise salaires (total)
                <input type="number" min="0" value={data.franchiseSalaires} onChange={(e) => updateField('franchiseSalaires', e.target.value)} className={`w-full ${input}`} />
              </label>
              <label className="text-sm">
                jours / mois
                <input type="number" min="0" value={data.joursSalaires} onChange={(e) => updateField('joursSalaires', e.target.value)} className={`w-full ${input}`} placeholder="total / 8" />
              </label>
            </div>
          )}
        </Card>
      </div>

      <Notice icon={<Info className="w-5 h-5 text-blue-600" />}>
        <p className="font-semibold mb-1">Rappels</p>
        <ul className="list-disc list-inside space-y-1">
          <li>
            AJ brute = A + B + C avec AJ minimale {eur(AJ_MIN)}. Plancher {eur(PLANCHER.A8)} (annexe 8) / {eur(PLANCHER.A10)} (annexe 10), plafond {eur(AJ_MAX)}.
          </li>
          <li>AJ nette : aucune retenue jusqu'à {eur(AJ_MIN)} ; retraite complémentaire 0,93 % du SJM au-delà ; CSG + CRDS au-delà de 60 €.</li>
          <li>Les franchises ne se consomment que sur des jours indemnisables, après le délai d'attente ; le forfait non appliqué est reporté.</li>
          <li>L'indemnisation court jusqu'à la date anniversaire (début du droit + 12 mois) : {formatDateFR(sim.dateAnniversaire)}.</li>
        </ul>
      </Notice>
    </div>
  );
};

export default MonAJPage;
