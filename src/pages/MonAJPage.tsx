import React from 'react';
import { useIntermittence } from '../context/IntermittenceContext';
import { Info, Database, CheckCircle } from 'lucide-react';
import ImportExportBar from '../components/ImportExportBar';

const MonAJPage: React.FC = () => {
  const { data, updateField } = useIntermittence();
  
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Mon allocation journalière</h1>
        <p className="text-gray-600">
          Saisissez ici vos informations d'indemnisation actuelles pour la simulation.
        </p>
      </div>
      
      <ImportExportBar />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Informations générales */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="font-semibold text-lg mb-4 flex items-center border-b pb-2">
            <Database className="w-5 h-5 mr-2 text-blue-600" />
            Informations générales
          </h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Annexe d'indemnisation *</label>
            <select 
              value={data.annexe} 
              onChange={e => updateField('annexe', e.target.value)} 
              className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option>Ouvrier/Technicien (Annexe 8)</option>
              <option>Artiste (Annexe 10)</option>
            </select>
          </div>
        </div>

        {/* Vos droits ouverts */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="font-semibold text-lg mb-4 flex items-center border-b pb-2">
            <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
            Vos droits ouverts
          </h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Montant Net *</label>
            <div className="flex items-center">
              <input 
                type="number" 
                value={data.montantNet} 
                onChange={e => updateField('montantNet', e.target.value)} 
                className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-32 mr-2" 
              />
              <span>€</span>
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Indemnisable à partir du *</label>
            <input 
              type="date" 
              value={data.dateIndem} 
              onChange={e => updateField('dateIndem', e.target.value)} 
              className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Sur base fin contrat de travail *</label>
            <input 
              type="date" 
              value={data.dateFinContrat} 
              onChange={e => updateField('dateFinContrat', e.target.value)} 
              className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Votre indemnisation tiendra compte de */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="font-semibold text-lg mb-4 flex items-center border-b pb-2">
            <Info className="w-5 h-5 mr-2 text-yellow-600" />
            Votre indemnisation tiendra compte de
          </h2>
          
          <div className="mb-4 flex items-center">
            <span className="mr-2">7 jours de délai d'attente :</span>
            <button
              type="button"
              className={`px-3 py-1 rounded-l ${data.delaiAttente ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
              onClick={() => updateField('delaiAttente', true)}
            >Oui</button>
            <button
              type="button"
              className={`px-3 py-1 rounded-r ${!data.delaiAttente ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
              onClick={() => updateField('delaiAttente', false)}
            >Non</button>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="mb-3">
              <label className="block text-sm">Franchise Congés Payés</label>
              <div className="flex items-center">
                <input 
                  type="number" 
                  value={data.franchiseConges} 
                  onChange={e => updateField('franchiseConges', e.target.value)} 
                  className="border rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 w-20 mr-2" 
                />
                <span className="text-sm">jours</span>
              </div>
            </div>
            
            <div className="mb-3">
              <label className="block text-sm">À raison de (jours par mois)</label>
              <input 
                type="number" 
                value={data.joursConges} 
                onChange={e => updateField('joursConges', e.target.value)} 
                className="border rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 w-20" 
              />
            </div>
            
            <div className="mb-3">
              <label className="block text-sm">Franchise Salaires</label>
              <div className="flex items-center">
                <input 
                  type="number" 
                  value={data.franchiseSalaires} 
                  onChange={e => updateField('franchiseSalaires', e.target.value)} 
                  className="border rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 w-20 mr-2" 
                />
                <span className="text-sm">jours</span>
              </div>
            </div>
            
            <div className="mb-3">
              <label className="block text-sm">À raison de (jours par mois)</label>
              <input 
                type="number" 
                value={data.joursSalaires} 
                onChange={e => updateField('joursSalaires', e.target.value)} 
                className="border rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 w-20" 
              />
            </div>
          </div>
        </div>

        {/* Calculs Automatiques */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="font-semibold text-lg mb-4 flex items-center border-b pb-2">
            <Info className="w-5 h-5 mr-2 text-blue-600" />
            Calculs Automatiques
          </h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">A.J. nette Imposable</label>
            <div className="flex items-center">
              <input 
                type="number" 
                value={data.ajNette} 
                onChange={e => updateField('ajNette', e.target.value)} 
                className="border bg-yellow-50 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-32 mr-2" 
              />
              <span>€</span>
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">A.J. Brute</label>
            <div className="flex items-center">
              <input 
                type="number" 
                value={data.ajBrute} 
                onChange={e => updateField('ajBrute', e.target.value)} 
                className="border bg-yellow-50 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-32 mr-2" 
              />
              <span>€</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <div className="flex items-start">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">Informations :</p>
            <ul className="list-disc list-inside space-y-1">
              <li>L'AJ nette est l'allocation journalière que vous percevez actuellement (après déduction de l'impôt à la source).</li>
              <li>L'AJ brute est l'allocation avant déduction de l'impôt.</li>
              <li>Le délai d'attente de 7 jours s'applique généralement lors de l'ouverture de droits après plus de 12 mois d'inactivité.</li>
              <li>Les franchises sont déduites progressivement chaque mois.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonAJPage; 