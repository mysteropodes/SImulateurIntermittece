import React from 'react';
import { useIntermittence } from '../context/IntermittenceContext';
import { Plus, Trash, HelpCircle } from 'lucide-react';
import ImportExportBar from '../components/ImportExportBar';

const ContratsPage: React.FC = () => {
  const { data, updateContrat, addContrat, removeContrat } = useIntermittence();
  
  // Calcul des heures et totaux
  const totalHeures = data.contrats.reduce(
    (acc, c) => acc + (c.type === 'Cachet' ? c.nombre * 12 : c.nombre), 
    0
  );
  
  const totalBrut = data.contrats.reduce((acc, c) => acc + c.brut, 0);
  
  const getHeuresConverties = (contrat: { type: string, nombre: number }) => {
    return contrat.type === 'Cachet' ? contrat.nombre * 12 : contrat.nombre;
  };
  
  const getCotisations = (brut: number) => brut * 0.23;
  
  const getNet = (brut: number) => brut - getCotisations(brut);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Liste des contrats</h1>
        <p className="text-gray-600">
          Saisissez ici tous vos contrats. Les cachets sont automatiquement convertis (12h par cachet).
        </p>
      </div>
      
      <ImportExportBar />
      
      <div className="bg-white rounded-lg shadow mb-6 overflow-hidden">
        <div className="grid grid-cols-12 bg-gray-800 text-white font-semibold p-3">
          <div className="col-span-2">Date</div>
          <div className="col-span-3">Employeur</div>
          <div className="col-span-1">Type</div>
          <div className="col-span-1">Nombre</div>
          <div className="col-span-1">Brut (€)</div>
          <div className="col-span-1">Heures</div>
          <div className="col-span-1">Cotisations</div>
          <div className="col-span-1">Net</div>
          <div className="col-span-1">Actions</div>
        </div>
        
        {data.contrats.map((contrat, index) => {
          const heuresConverties = getHeuresConverties(contrat);
          const cotisations = getCotisations(contrat.brut);
          const net = getNet(contrat.brut);
          
          return (
            <div 
              key={index} 
              className={`grid grid-cols-12 items-center p-3 border-b ${
                index % 2 === 0 ? 'bg-green-50' : 'bg-green-100'
              }`}
            >
              <div className="col-span-2">
                <input
                  type="date"
                  value={contrat.date}
                  onChange={(e) => updateContrat(index, 'date', e.target.value)}
                  className="w-full p-1 border rounded"
                />
              </div>
              <div className="col-span-3">
                <input
                  type="text"
                  value={contrat.employeur}
                  onChange={(e) => updateContrat(index, 'employeur', e.target.value)}
                  className="w-full p-1 border rounded"
                  placeholder="Nom de l'employeur"
                />
              </div>
              <div className="col-span-1">
                <select
                  value={contrat.type}
                  onChange={(e) => updateContrat(index, 'type', e.target.value as 'Cachet' | 'Heures')}
                  className="w-full p-1 border rounded"
                >
                  <option value="Cachet">Cachet</option>
                  <option value="Heures">Heures</option>
                </select>
              </div>
              <div className="col-span-1">
                <input
                  type="number"
                  value={contrat.nombre}
                  onChange={(e) => updateContrat(index, 'nombre', parseInt(e.target.value) || 0)}
                  className="w-full p-1 border rounded"
                  min="0"
                />
              </div>
              <div className="col-span-1">
                <input
                  type="number"
                  value={contrat.brut}
                  onChange={(e) => updateContrat(index, 'brut', parseFloat(e.target.value) || 0)}
                  className="w-full p-1 border rounded"
                  min="0"
                />
              </div>
              <div className="col-span-1 bg-orange-100 p-1 text-center rounded">
                {heuresConverties}
              </div>
              <div className="col-span-1 bg-orange-100 p-1 text-center rounded">
                {cotisations.toFixed(2)}
              </div>
              <div className="col-span-1 bg-orange-100 p-1 text-center rounded">
                {net.toFixed(2)}
              </div>
              <div className="col-span-1 flex justify-center">
                <button 
                  onClick={() => removeContrat(index)}
                  className="p-1 text-red-600 hover:bg-red-100 rounded"
                >
                  <Trash className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
        
        {/* Bouton ajouter */}
        <div className="p-3 border-t">
          <button 
            onClick={addContrat}
            className="flex items-center text-green-600 hover:bg-green-50 p-2 rounded"
          >
            <Plus className="w-4 h-4 mr-1" />
            Ajouter un contrat
          </button>
        </div>
      </div>
      
      {/* Résumé des heures et des montants */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <h2 className="text-lg font-semibold mb-2 flex items-center">
          <HelpCircle className="w-4 h-4 mr-1 text-blue-600" />
          Récapitulatif
        </h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white p-3 rounded border shadow-sm">
            <div className="text-sm text-gray-600">Total heures</div>
            <div className="text-xl font-bold">{totalHeures.toFixed(2)} heures</div>
            <div className="text-xs text-gray-500">
              {totalHeures >= 507 
                ? "✅ Seuil de 507h atteint" 
                : `❌ Il manque ${(507 - totalHeures).toFixed(2)}h pour atteindre le seuil de 507h`}
            </div>
          </div>
          <div className="bg-white p-3 rounded border shadow-sm">
            <div className="text-sm text-gray-600">Total brut</div>
            <div className="text-xl font-bold">{totalBrut.toFixed(2)} €</div>
          </div>
          <div className="bg-white p-3 rounded border shadow-sm">
            <div className="text-sm text-gray-600">Total net estimé</div>
            <div className="text-xl font-bold">{(totalBrut * 0.77).toFixed(2)} €</div>
            <div className="text-xs text-gray-500">Après déduction des cotisations sociales (~23%)</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContratsPage; 