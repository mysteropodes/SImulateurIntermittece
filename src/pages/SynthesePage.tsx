import React from 'react';
import { useIntermittence } from '../context/IntermittenceContext';
import { AlertCircle, ArrowRight, Calendar, Clock, FileSpreadsheet } from 'lucide-react';
import ImportExportBar from '../components/ImportExportBar';

const SynthesePage: React.FC = () => {
  const { data } = useIntermittence();
  
  // Calculs globaux
  const calculHeures = () => {
    return data.contrats.reduce((acc, c) => acc + (c.type === 'Cachet' ? c.nombre * 12 : c.nombre), 0);
  };
  
  const calculBrut = () => {
    return data.contrats.reduce((acc, c) => acc + c.brut, 0);
  };
  
  const calculJoursTravailles = () => {
    return Math.round(calculHeures() / 8);
  };
  
  const calculeSJR = () => {
    const joursTrav = calculJoursTravailles();
    return joursTrav > 0 ? calculBrut() / joursTrav : 0;
  };
  
  const calculerAJ = () => {
    const heures = calculHeures();
    const sjr = calculeSJR();
    
    if (heures < 507 || sjr <= 0) return { eligible: false, aj: 0, ajBrute: 0, plafond: 0, plancher: 0, ajApresPrelevement: 0 };
    
    const ajBrute = 31.98 + sjr * 0.404;
    const plafond = sjr * 0.75;
    const plancher = Math.max(sjr * 0.57, 31.98);
    const aj = Math.min(plafond, Math.max(plancher, ajBrute));
    
    // Calcul de l'AJ après prélèvement à la source
    const tauxPrelevement = data.tauxPrelevement ? parseFloat(data.tauxPrelevement) : 0;
    const ajApresPrelevement = aj * (1 - tauxPrelevement / 100);
    
    return {
      eligible: true,
      aj,
      ajBrute,
      plafond,
      plancher,
      ajApresPrelevement
    };
  };
  
  const totalHeures = calculHeures();
  const joursTravailles = calculJoursTravailles();
  const sjr = calculeSJR();
  const { eligible, aj, plafond, plancher, ajApresPrelevement } = calculerAJ();
  
  // Période de référence
  const periodeRef = () => {
    // Récupérer la date du dernier contrat, ou aujourd'hui s'il n'y a pas de contrat
    const contratsSorted = [...data.contrats].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    const lastContratDate = contratsSorted.length > 0 
      ? new Date(contratsSorted[0].date) 
      : new Date();
    
    // Date de début = lendemain du dernier contrat
    const refStart = new Date(lastContratDate);
    refStart.setDate(refStart.getDate() + 1);
    
    return {
      debut: refStart.toISOString().split('T')[0],
      fin: new Date().toISOString().split('T')[0]
    };
  };
  
  const periode = periodeRef();
  
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Synthèse d'indemnisation</h1>
        <p className="text-gray-600">
          Vue d'ensemble de votre simulation d'intermittence du spectacle.
        </p>
      </div>
      
      <ImportExportBar />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4 pb-2 border-b">Indemnisation en cours</h2>
          
          <div className="grid grid-cols-2 gap-y-4 mb-6">
            <div className="col-span-2 flex items-center mb-2">
              <Calendar className="w-5 h-5 text-blue-600 mr-2" />
              <span className="font-semibold">Période de référence :</span>
              <span className="ml-2">{periode.debut} au {periode.fin}</span>
            </div>
            
            <div>
              <div className="text-sm text-gray-600">Heures travaillées</div>
              <div className="text-lg font-bold">{totalHeures.toFixed(2)} heures</div>
            </div>
            
            <div>
              <div className="text-sm text-gray-600">Statut</div>
              <div className={`text-lg font-bold ${totalHeures >= 507 ? 'text-green-600' : 'text-red-600'}`}>
                {totalHeures >= 507 ? 'Éligible ARE' : 'Non éligible'}
              </div>
            </div>
            
            <div>
              <div className="text-sm text-gray-600">Jours travaillés</div>
              <div className="text-lg font-bold">{joursTravailles}</div>
            </div>
            
            <div>
              <div className="text-sm text-gray-600">Salaire Journalier (SJR)</div>
              <div className="text-lg font-bold">{sjr.toFixed(2)} €</div>
            </div>
            
            <div>
              <div className="text-sm text-gray-600">AJ nette (saisie)</div>
              <div className="text-lg font-bold">{data.ajNette ? `${data.ajNette} €` : '-'}</div>
            </div>
            
            <div>
              <div className="text-sm text-gray-600">AJ brute (saisie)</div>
              <div className="text-lg font-bold">{data.ajBrute ? `${data.ajBrute} €` : '-'}</div>
            </div>
            
            <div>
              <div className="text-sm text-gray-600">Taux prélèvement</div>
              <div className="text-lg font-bold">{data.tauxPrelevement ? `${data.tauxPrelevement} %` : '0 %'}</div>
            </div>
          </div>
          
          {totalHeures < 507 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
                <div>
                  <p className="text-sm text-red-800 font-semibold">Seuil non atteint</p>
                  <p className="text-sm text-red-700">
                    Il vous manque {(507 - totalHeures).toFixed(2)} heures pour atteindre le seuil des 507h.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4 pb-2 border-b">ARE simulée (calcul)</h2>
          
          <div className="grid grid-cols-2 gap-y-4 mb-6">
            <div className="col-span-2">
              <div className="text-sm text-gray-600">Allocation Journalière calculée</div>
              <div className="text-2xl font-bold text-blue-600">
                {eligible ? `${aj.toFixed(2)} €/jour` : 'Non éligible'}
              </div>
            </div>
            
            {eligible && (
              <>
                <div>
                  <div className="text-sm text-gray-600">Partie fixe</div>
                  <div className="text-base">31,98 €</div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-600">Partie proportionnelle</div>
                  <div className="text-base">{(sjr * 0.404).toFixed(2)} €</div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-600">Plancher (57% du SJR)</div>
                  <div className="text-base">{plancher.toFixed(2)} €</div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-600">Plafond (75% du SJR)</div>
                  <div className="text-base">{plafond.toFixed(2)} €</div>
                </div>
                
                <div className="col-span-2">
                  <div className="text-sm text-gray-600">AJ après prélèvement à la source ({data.tauxPrelevement || "0"}%)</div>
                  <div className="text-lg font-bold">{ajApresPrelevement.toFixed(2)} €/jour</div>
                </div>
                
                <div className="col-span-2">
                  <div className="text-sm text-gray-600">ARE mensuelle estimée (20j)</div>
                  <div className="text-lg font-bold">{(ajApresPrelevement * 20).toFixed(2)} €/mois</div>
                </div>
              </>
            )}
          </div>
          
          {eligible && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-start">
                <Clock className="w-5 h-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                <div>
                  <p className="text-sm text-blue-800 font-semibold">Durée d'indemnisation</p>
                  <p className="text-sm text-blue-700">
                    Vous pouvez bénéficier de 243 jours d'indemnisation maximum.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="mt-6">
            <p className="text-sm text-gray-600 mb-4">Consultez les autres onglets pour voir le détail des calculs et suivre vos contrats.</p>
            <div className="flex gap-3">
              <button className="flex items-center px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-200">
                <ArrowRight className="w-4 h-4 mr-2" />
                Voir les détails
              </button>
              <button className="flex items-center px-3 py-2 bg-gray-100 text-gray-800 rounded hover:bg-gray-200 transition duration-200">
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Exporter Excel
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
        <div className="flex items-start">
          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
          <div className="text-sm text-yellow-800">
            <p className="font-semibold mb-1">Important :</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Ce simulateur est basé sur les règles 2024 de l'intermittence.</li>
              <li>Les calculs sont indicatifs - consultez Pôle Emploi pour une simulation officielle.</li>
              <li>Pensez à mettre à jour régulièrement vos contrats pour obtenir une simulation précise.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SynthesePage; 