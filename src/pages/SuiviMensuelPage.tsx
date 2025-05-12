import React from 'react';
import { useIntermittence } from '../context/IntermittenceContext';
import { Calendar, Info } from 'lucide-react';
import ImportExportBar from '../components/ImportExportBar';

// Interface pour les données mensuelles
interface Mois {
  label: string;
  moisNum: number;
  anneeNum: number;
  joursDansMois: number;
  heuresTravaillees: number;
  revenusBruts: number;
  revenusNets: number;
  joursTravailles: number;
  franchiseReportee: number;
  delaiAttente?: number;
  franchiseCP?: number;
  franchiseSalaires?: number;
  joursNonIndemnises?: number;
  joursIndemnises?: number;
  indemnisationMensuelle?: number;
  totalNet?: number;
}

const SuiviMensuelPage: React.FC = () => {
  const { data } = useIntermittence();
  
  // Fonction pour calculer les détails de suivi mensuel
  const calculSuiviMensuel = (): Mois[] => {
    // On part de la date de fin de contrat (ou date courante si non définie)
    const dateDepart = data.dateFinContrat 
      ? new Date(data.dateFinContrat) 
      : new Date();
    
    // Générer les données pour 12 mois
    const moisData: Mois[] = [];
    for (let i = 0; i < 12; i++) {
      const currentDate = new Date(dateDepart);
      currentDate.setMonth(currentDate.getMonth() + i);
      
      const moisNum = currentDate.getMonth() + 1;
      const anneeNum = currentDate.getFullYear();
      const joursDansMois = new Date(anneeNum, moisNum, 0).getDate();
      
      // Trouver les contrats pour ce mois
      const contratsFiltered = data.contrats.filter(contrat => {
        const dateContrat = new Date(contrat.date);
        return (
          dateContrat.getMonth() + 1 === moisNum && 
          dateContrat.getFullYear() === anneeNum
        );
      });
      
      // Calculer les heures et revenus pour ce mois
      const heuresTravaillees = contratsFiltered.reduce(
        (acc, c) => acc + (c.type === 'Cachet' ? c.nombre * 12 : c.nombre), 
        0
      );
      
      const revenusBruts = contratsFiltered.reduce(
        (acc, c) => acc + c.brut, 
        0
      );
      
      const revenusNets = contratsFiltered.reduce(
        (acc, c) => acc + (c.brut * 0.77), 
        0
      );
      
      const joursTravailles = Math.round(heuresTravaillees / 8);
      
      moisData.push({
        label: `${moisNum.toString().padStart(2, '0')}/${anneeNum}`,
        moisNum,
        anneeNum,
        joursDansMois,
        heuresTravaillees,
        revenusBruts,
        revenusNets,
        joursTravailles,
        franchiseReportee: 0, // Initialisation du report de franchise
        delaiAttente: 0,
        franchiseCP: 0,
        franchiseSalaires: 0,
        joursNonIndemnises: 0,
        joursIndemnises: 0,
        indemnisationMensuelle: 0,
        totalNet: 0
      });
    }
    
    // Ajouter le calcul des franchises et du délai d'attente
    let resteCP = data.franchiseConges ? parseInt(data.franchiseConges, 10) : 0;
    let resteSalaires = data.franchiseSalaires ? parseInt(data.franchiseSalaires, 10) : 0;
    const joursCPParMois = data.joursConges ? parseInt(data.joursConges, 10) : 2;
    const joursSalairesParMois = data.joursSalaires ? parseInt(data.joursSalaires, 10) : 2;
    
    // Calcul des franchises pour chaque mois avec report si nécessaire
    let franchiseReportPrecedent = 0;
    
    moisData.forEach((mois, idx) => {
      // Délai d'attente uniquement le premier mois
      const delaiAttente = idx === 0 && data.delaiAttente ? 7 : 0;
      
      // Franchise CP
      let franchiseCP = 0;
      if (resteCP > 0) {
        franchiseCP = Math.min(joursCPParMois, resteCP);
        resteCP -= franchiseCP;
      }
      
      // Franchise Salaires
      let franchiseSalaires = 0;
      if (resteSalaires > 0) {
        franchiseSalaires = Math.min(joursSalairesParMois, resteSalaires);
        resteSalaires -= franchiseSalaires;
      }
      
      // Application du report de franchise du mois précédent
      mois.franchiseReportee = franchiseReportPrecedent;
      
      // Jours non indemnisés = délai + franchises + jours travaillés + franchise reportée
      const joursNonIndemnises = delaiAttente + franchiseCP + franchiseSalaires + mois.joursTravailles + mois.franchiseReportee;
      
      // Jours indemnisés = jours du mois - jours non indemnisés (minimum 0)
      const joursIndemnises = Math.max(0, mois.joursDansMois - joursNonIndemnises);
      
      // Si le nombre de jours non indemnisés dépasse le nombre de jours du mois, report de l'excédent
      franchiseReportPrecedent = Math.max(0, joursNonIndemnises - mois.joursDansMois);
      
      // Indemnisation mensuelle (avant impôts) = jours indemnisés * AJ
      const ajNette = data.ajNette ? parseFloat(data.ajNette) : 0;
      const indemnisationMensuelle = joursIndemnises * ajNette;
      
      // Total mensuel = revenus nets + indemnisation
      const totalNet = mois.revenusNets + indemnisationMensuelle;
      
      // Mettre à jour les propriétés du mois
      mois.delaiAttente = delaiAttente;
      mois.franchiseCP = franchiseCP;
      mois.franchiseSalaires = franchiseSalaires;
      mois.joursNonIndemnises = joursNonIndemnises;
      mois.joursIndemnises = joursIndemnises;
      mois.indemnisationMensuelle = indemnisationMensuelle;
      mois.totalNet = totalNet;
    });
    
    return moisData;
  };
  
  const moisData = calculSuiviMensuel();
  
  // Calculer les totaux pour la ligne de résumé
  const totaux = {
    heuresTravaillees: moisData.reduce((acc, m) => acc + m.heuresTravaillees, 0),
    revenusBruts: moisData.reduce((acc, m) => acc + m.revenusBruts, 0),
    revenusNets: moisData.reduce((acc, m) => acc + m.revenusNets, 0),
    joursTravailles: moisData.reduce((acc, m) => acc + m.joursTravailles, 0),
    delaiAttente: moisData.reduce((acc, m) => acc + (m.delaiAttente || 0), 0),
    franchiseCP: moisData.reduce((acc, m) => acc + (m.franchiseCP || 0), 0),
    franchiseSalaires: moisData.reduce((acc, m) => acc + (m.franchiseSalaires || 0), 0),
    franchiseReportee: moisData.reduce((acc, m) => acc + m.franchiseReportee, 0),
    joursNonIndemnises: moisData.reduce((acc, m) => acc + (m.joursNonIndemnises || 0), 0),
    joursIndemnises: moisData.reduce((acc, m) => acc + (m.joursIndemnises || 0), 0),
    indemnisationMensuelle: moisData.reduce((acc, m) => acc + (m.indemnisationMensuelle || 0), 0),
    totalNet: moisData.reduce((acc, m) => acc + (m.totalNet || 0), 0)
  };
  
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Suivi Mensuel</h1>
        <p className="text-gray-600">
          Cette page affiche mois par mois vos revenus, franchises et indemnités calculées.
        </p>
      </div>
      
      <ImportExportBar />
      
      <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
        <div className="p-4 flex items-center bg-blue-50 border-b border-blue-200">
          <Calendar className="w-5 h-5 text-blue-600 mr-2" />
          <h2 className="text-lg font-semibold text-blue-800">Suivi sur 12 mois</h2>
          <span className="text-sm text-blue-600 ml-auto">
            {data.ajNette ? `AJ : ${data.ajNette}€/jour` : 'AJ non définie'}
          </span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr className="bg-gray-800 text-white">
                <th className="py-2 px-3 text-left">Mois</th>
                <th className="py-2 px-3 text-right">Jours</th>
                <th className="py-2 px-3 text-right">Heures</th>
                <th className="py-2 px-3 text-right">Brut (€)</th>
                <th className="py-2 px-3 text-right">Net (€)</th>
                <th className="py-2 px-3 text-right">J. trav.</th>
                <th className="py-2 px-3 text-right">Délai att.</th>
                <th className="py-2 px-3 text-right">Fr. CP</th>
                <th className="py-2 px-3 text-right">Fr. Sal.</th>
                <th className="py-2 px-3 text-right">Fr. Report</th>
                <th className="py-2 px-3 text-right">J. non ind.</th>
                <th className="py-2 px-3 text-right">J. ind.</th>
                <th className="py-2 px-3 text-right">Indemn. (€)</th>
                <th className="py-2 px-3 text-right">Total (€)</th>
              </tr>
            </thead>
            <tbody>
              {moisData.map((mois, index) => (
                <tr 
                  key={index} 
                  className={`border-b ${index % 2 === 0 ? 'bg-gray-50' : ''}`}
                >
                  <td className="py-2 px-3 text-left font-semibold">{mois.label}</td>
                  <td className="py-2 px-3 text-right">{mois.joursDansMois}</td>
                  <td className={`py-2 px-3 text-right ${mois.heuresTravaillees > 0 ? 'bg-green-50' : ''}`}>
                    {mois.heuresTravaillees > 0 ? mois.heuresTravaillees.toFixed(0) : '-'}
                  </td>
                  <td className={`py-2 px-3 text-right ${mois.revenusBruts > 0 ? 'bg-green-50' : ''}`}>
                    {mois.revenusBruts > 0 ? mois.revenusBruts.toFixed(2) : '-'}
                  </td>
                  <td className={`py-2 px-3 text-right ${mois.revenusNets > 0 ? 'bg-green-50' : ''}`}>
                    {mois.revenusNets > 0 ? mois.revenusNets.toFixed(2) : '-'}
                  </td>
                  <td className={`py-2 px-3 text-right ${mois.joursTravailles > 0 ? 'bg-yellow-50' : ''}`}>
                    {mois.joursTravailles > 0 ? mois.joursTravailles : '-'}
                  </td>
                  <td className={`py-2 px-3 text-right ${(mois.delaiAttente || 0) > 0 ? 'bg-orange-50' : ''}`}>
                    {(mois.delaiAttente || 0) > 0 ? mois.delaiAttente : '-'}
                  </td>
                  <td className={`py-2 px-3 text-right ${(mois.franchiseCP || 0) > 0 ? 'bg-orange-50' : ''}`}>
                    {(mois.franchiseCP || 0) > 0 ? mois.franchiseCP : '-'}
                  </td>
                  <td className={`py-2 px-3 text-right ${(mois.franchiseSalaires || 0) > 0 ? 'bg-orange-50' : ''}`}>
                    {(mois.franchiseSalaires || 0) > 0 ? mois.franchiseSalaires : '-'}
                  </td>
                  <td className={`py-2 px-3 text-right ${mois.franchiseReportee > 0 ? 'bg-orange-50' : ''}`}>
                    {mois.franchiseReportee > 0 ? mois.franchiseReportee : '-'}
                  </td>
                  <td className="py-2 px-3 text-right">
                    {mois.joursNonIndemnises || 0}
                  </td>
                  <td className={`py-2 px-3 text-right ${(mois.joursIndemnises || 0) > 0 ? 'bg-blue-50' : ''}`}>
                    {mois.joursIndemnises || 0}
                  </td>
                  <td className={`py-2 px-3 text-right ${(mois.indemnisationMensuelle || 0) > 0 ? 'bg-blue-50' : ''}`}>
                    {(mois.indemnisationMensuelle || 0) > 0 ? (mois.indemnisationMensuelle || 0).toFixed(2) : '-'}
                  </td>
                  <td className={`py-2 px-3 text-right font-semibold ${(mois.totalNet || 0) > 0 ? 'bg-blue-100' : ''}`}>
                    {(mois.totalNet || 0).toFixed(2)}
                  </td>
                </tr>
              ))}
              
              {/* Ligne des totaux */}
              <tr className="bg-gray-100 font-bold border-t-2 border-gray-400">
                <td className="py-2 px-3 text-left">Total</td>
                <td className="py-2 px-3 text-right">-</td>
                <td className="py-2 px-3 text-right">{totaux.heuresTravaillees.toFixed(0)}</td>
                <td className="py-2 px-3 text-right">{totaux.revenusBruts.toFixed(2)}</td>
                <td className="py-2 px-3 text-right">{totaux.revenusNets.toFixed(2)}</td>
                <td className="py-2 px-3 text-right">{totaux.joursTravailles}</td>
                <td className="py-2 px-3 text-right">{totaux.delaiAttente}</td>
                <td className="py-2 px-3 text-right">{totaux.franchiseCP}</td>
                <td className="py-2 px-3 text-right">{totaux.franchiseSalaires}</td>
                <td className="py-2 px-3 text-right">{totaux.franchiseReportee}</td>
                <td className="py-2 px-3 text-right">{totaux.joursNonIndemnises}</td>
                <td className="py-2 px-3 text-right">{totaux.joursIndemnises}</td>
                <td className="py-2 px-3 text-right">{totaux.indemnisationMensuelle.toFixed(2)}</td>
                <td className="py-2 px-3 text-right">{totaux.totalNet.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <div className="flex items-start">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">Légende :</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-green-50 rounded border border-green-200 mr-1"></div>
                <span>Revenus du travail</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-yellow-50 rounded border border-yellow-200 mr-1"></div>
                <span>Jours travaillés</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-orange-50 rounded border border-orange-200 mr-1"></div>
                <span>Franchises/Délai</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-blue-50 rounded border border-blue-200 mr-1"></div>
                <span>Indemnisation</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-blue-100 rounded border border-blue-200 mr-1"></div>
                <span>Total mensuel</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuiviMensuelPage; 