import React from 'react';
import { useIntermittence } from '../context/IntermittenceContext';
import { useSimulation } from '../hooks/useSimulation';
import { Plus, Trash, HelpCircle, AlertTriangle } from 'lucide-react';
import ImportExportBar from '../components/ImportExportBar';
import { Notice, eur, nb } from '../components/ui';
import { heuresContrat, finContrat, SEUIL_HEURES, PLAFOND_HEURES_MOIS, formatDateFR } from '../lib/calculs';

const ContratsPage: React.FC = () => {
  const { data, updateContrat, addContrat, removeContrat } = useIntermittence();
  const sim = useSimulation();
  const { affiliation: aff } = sim;
  const dansPRA = new Set(aff.contrats.map((c) => c.id));
  const contrats = [...data.contrats].sort((a, b) => a.date.localeCompare(b.date));

  const totalHeures = data.contrats.reduce((acc, c) => acc + heuresContrat(c), 0);
  const totalBrut = data.contrats.reduce((acc, c) => acc + c.brut, 0);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Liste des contrats</h1>
        <p className="text-gray-600">
          Saisissez tous vos contrats (1 cachet = 12 h). Seuls ceux situés dans la période de référence de 12 mois — du{' '}
          <b>{formatDateFR(aff.periode.debut)}</b> au <b>{formatDateFR(aff.periode.fin)}</b> — comptent pour les 507 h et pour l'AJ ; les
          autres servent au suivi mensuel.
        </p>
      </div>

      <ImportExportBar />

      <div className="bg-white rounded-lg shadow mb-6 overflow-x-auto">
        <div className="min-w-[900px]">
          <div className="grid grid-cols-12 bg-gray-800 text-white font-semibold p-3 text-sm">
            <div className="col-span-2">Début</div>
            <div className="col-span-2">Fin (facultatif)</div>
            <div className="col-span-2">Employeur</div>
            <div className="col-span-1">Type</div>
            <div className="col-span-1">Nombre</div>
            <div className="col-span-1">Brut (€)</div>
            <div className="col-span-1 text-center">Heures</div>
            <div className="col-span-1 text-center">Net est.</div>
            <div className="col-span-1 text-center">PRA</div>
          </div>

          {contrats.map((contrat, index) => {
            const heures = heuresContrat(contrat);
            const net = contrat.brut * sim.ratioNetSalaire;
            const inPRA = dansPRA.has(contrat.id);
            return (
              <div
                key={contrat.id}
                className={`grid grid-cols-12 items-center p-3 border-b text-sm ${index % 2 === 0 ? 'bg-green-50' : 'bg-green-100'} ${
                  inPRA ? '' : 'opacity-70'
                }`}
              >
                <div className="col-span-2 pr-2">
                  <input type="date" value={contrat.date} onChange={(e) => updateContrat(contrat.id, 'date', e.target.value)} className="w-full p-1 border rounded" />
                </div>
                <div className="col-span-2 pr-2">
                  <input
                    type="date"
                    value={contrat.dateFin ?? ''}
                    min={contrat.date}
                    onChange={(e) => updateContrat(contrat.id, 'dateFin', e.target.value || undefined)}
                    className="w-full p-1 border rounded"
                  />
                </div>
                <div className="col-span-2 pr-2">
                  <input
                    type="text"
                    value={contrat.employeur}
                    onChange={(e) => updateContrat(contrat.id, 'employeur', e.target.value)}
                    className="w-full p-1 border rounded"
                    placeholder="Nom de l'employeur"
                  />
                </div>
                <div className="col-span-1 pr-2">
                  <select
                    value={contrat.type}
                    onChange={(e) => updateContrat(contrat.id, 'type', e.target.value === 'Cachet' ? 'Cachet' : 'Heures')}
                    className="w-full p-1 border rounded"
                  >
                    <option value="Cachet">Cachet</option>
                    <option value="Heures">Heures</option>
                  </select>
                </div>
                <div className="col-span-1 pr-2">
                  <input
                    type="number"
                    value={contrat.nombre}
                    onChange={(e) => updateContrat(contrat.id, 'nombre', Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full p-1 border rounded"
                    min="0"
                    step={contrat.type === 'Cachet' ? 1 : 0.5}
                  />
                </div>
                <div className="col-span-1 pr-2">
                  <input
                    type="number"
                    value={contrat.brut}
                    onChange={(e) => updateContrat(contrat.id, 'brut', Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full p-1 border rounded"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="col-span-1 bg-orange-100 p-1 text-center rounded mr-1">{nb(heures, 1)}</div>
                <div className="col-span-1 bg-orange-100 p-1 text-center rounded mr-1">{nb(net, 0)}</div>
                <div className="col-span-1 flex items-center justify-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded ${inPRA ? 'bg-blue-100 text-blue-800' : 'bg-gray-200 text-gray-600'}`} title={inPRA ? 'Dans la période de référence' : 'Hors période de référence'}>
                    {inPRA ? 'oui' : 'non'}
                  </span>
                  <button onClick={() => removeContrat(contrat.id)} className="p-1 text-red-600 hover:bg-red-100 rounded" title="Supprimer">
                    <Trash className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}

          <div className="p-3 border-t">
            <button onClick={addContrat} className="flex items-center text-green-600 hover:bg-green-50 p-2 rounded">
              <Plus className="w-4 h-4 mr-1" />
              Ajouter un contrat
            </button>
          </div>
        </div>
      </div>

      {aff.moisPlafonnes.length > 0 && (
        <Notice tone="warn" icon={<AlertTriangle className="w-5 h-5 text-amber-600" />} className="mb-4">
          Plafond mensuel appliqué ({PLAFOND_HEURES_MOIS[data.annexe]} h{data.annexe === 'A8' ? ', 250 h avec plusieurs employeurs' : ' = 28 cachets'}) sur :{' '}
          {aff.moisPlafonnes.join(', ')}. Heures retenues : {nb(aff.nht, 1)} au lieu de {nb(aff.heuresBrutes, 1)}.
        </Notice>
      )}

      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <h2 className="text-lg font-semibold mb-2 flex items-center">
          <HelpCircle className="w-4 h-4 mr-1 text-blue-600" />
          Récapitulatif
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-3 rounded border shadow-sm">
            <div className="text-sm text-gray-600">Heures dans la PRA (NHT)</div>
            <div className="text-xl font-bold">{nb(aff.nht, 1)} h</div>
            <div className="text-xs text-gray-500">
              {aff.eligible ? `✅ Seuil de ${SEUIL_HEURES} h atteint` : `❌ Il manque ${nb(aff.heuresManquantes, 1)} h pour atteindre ${SEUIL_HEURES} h`}
            </div>
          </div>
          <div className="bg-white p-3 rounded border shadow-sm">
            <div className="text-sm text-gray-600">Salaire de référence (SR)</div>
            <div className="text-xl font-bold">{eur(aff.sr)}</div>
            <div className="text-xs text-gray-500">bruts dans la PRA</div>
          </div>
          <div className="bg-white p-3 rounded border shadow-sm">
            <div className="text-sm text-gray-600">Tous contrats : heures</div>
            <div className="text-xl font-bold">{nb(totalHeures, 1)} h</div>
            <div className="text-xs text-gray-500">{data.contrats.length} contrat(s)</div>
          </div>
          <div className="bg-white p-3 rounded border shadow-sm">
            <div className="text-sm text-gray-600">Tous contrats : brut / net estimé</div>
            <div className="text-xl font-bold">{eur(totalBrut)}</div>
            <div className="text-xs text-gray-500">≈ {eur(totalBrut * sim.ratioNetSalaire)} net ({data.tauxCotisationsSalaire} % de cotisations)</div>
          </div>
        </div>
        {contrats.some((c) => finContrat(c) < c.date) && <p className="text-xs text-red-600 mt-2">Une date de fin est antérieure à la date de début : elle est ignorée.</p>}
      </div>
    </div>
  );
};

export default ContratsPage;
