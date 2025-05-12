import React, { useState } from 'react';
import { useIntermittence } from '../context/IntermittenceContext';
import { Calendar, Info, AlertTriangle } from 'lucide-react';
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
  indemnisationBrute?: number;
  plafondDepasse?: boolean;
  totalBrut?: number;
  totalNet?: number;
  nonIndemnisablePeriode: number;
}

// Plafonds mensuels de la sécurité sociale par année (118%)
const PLAFONDS_SECU = {
  2018: 3906.98,
  2019: 3984.86,
  2020: 4045.04,
  2021: 4045.04,
  2022: 4045.04,
  2023: 4325.88,
  2024: 4522.08, // Valeur estimée basée sur l'augmentation précédente
  2025: 4522.08  // Valeur par défaut pour les années futures
};

// Taux de conversion brut/net pour les salaires
const TAUX_NET_SALAIRE = 0.80; // 80% du brut selon mescachets.com

// Taux de conversion brut/net pour les allocations
const TAUX_NET_ALLOCATION = 0.93; // Estimation pour la conversion ARE brute en nette

// Fonction pour calculer le montant net après prélèvement à la source
const calculNetApresPrelevement = (montantBrut: number, tauxPrelevement: number, tauxNET: number): number => {
  const montantNet = montantBrut * tauxNET; // Conversion brut -> net
  return montantNet * (1 - tauxPrelevement / 100); // Application du prélèvement à la source
};

const SuiviMensuelPage: React.FC = () => {
  const { data } = useIntermittence();
  const [afficherInfos, setAfficherInfos] = useState(false);
  
  // Récupérer le plafond pour une année donnée
  const getPlafond = (annee: number): number => {
    return PLAFONDS_SECU[annee as keyof typeof PLAFONDS_SECU] || PLAFONDS_SECU[2025];
  };
  
  // Fonction pour calculer les détails de suivi mensuel
  const calculSuiviMensuel = (): Mois[] => {
    // On part de la date de fin de contrat (ou date courante si non définie)
    const dateDepart = data.dateFinContrat 
      ? new Date(data.dateFinContrat) 
      : new Date();
    
    // Récupérer le taux de prélèvement
    const tauxPrelevement = data.tauxPrelevement ? parseFloat(data.tauxPrelevement) : 0;
    
    // Date d'indemnisation (à partir de laquelle on peut être indemnisé)
    const dateIndemnisation = data.dateIndem ? new Date(data.dateIndem) : null;
    
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
      
      // Utiliser 80% du brut pour estimer le salaire net (règle mescachets.com)
      const revenusNets = revenusBruts * TAUX_NET_SALAIRE;
      
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
        indemnisationBrute: 0,
        plafondDepasse: false,
        totalBrut: 0,
        totalNet: 0,
        nonIndemnisablePeriode: 0 // Jours non indemnisables en raison de la date d'indemnisation
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
      // Calcul des jours non indemnisables en raison de la date d'indemnisation
      let nonIndemnisablePeriode = 0;
      
      if (dateIndemnisation) {
        // Vérifier si ce mois est avant la date d'indemnisation
        const debutMois = new Date(mois.anneeNum, mois.moisNum - 1, 1);
        const finMois = new Date(mois.anneeNum, mois.moisNum, 0);
        
        if (finMois < dateIndemnisation) {
          // Tout le mois est avant la date d'indemnisation
          nonIndemnisablePeriode = mois.joursDansMois;
        } else if (debutMois < dateIndemnisation && dateIndemnisation <= finMois) {
          // La date d'indemnisation tombe dans ce mois
          nonIndemnisablePeriode = dateIndemnisation.getDate() - 1; // Jours avant la date d'indemnisation
        }
      }
      
      mois.nonIndemnisablePeriode = nonIndemnisablePeriode;
      
      // Délai d'attente uniquement à partir du premier mois indemnisable
      const delaiAttente = idx === 0 && data.delaiAttente && nonIndemnisablePeriode < mois.joursDansMois ? 7 : 0;
      
      // Franchise CP
      let franchiseCP = 0;
      if (resteCP > 0 && nonIndemnisablePeriode < mois.joursDansMois) {
        franchiseCP = Math.min(joursCPParMois, resteCP);
        resteCP -= franchiseCP;
      }
      
      // Franchise Salaires
      let franchiseSalaires = 0;
      if (resteSalaires > 0 && nonIndemnisablePeriode < mois.joursDansMois) {
        franchiseSalaires = Math.min(joursSalairesParMois, resteSalaires);
        resteSalaires -= franchiseSalaires;
      }
      
      // Application du report de franchise du mois précédent
      mois.franchiseReportee = franchiseReportPrecedent;
      
      // Jours non indemnisés = jours non indemnisables + délai + franchises + jours travaillés + franchise reportée
      const joursNonIndemnises = nonIndemnisablePeriode + delaiAttente + franchiseCP + franchiseSalaires + mois.joursTravailles + mois.franchiseReportee;
      
      // Jours indemnisés = jours du mois - jours non indemnisés (minimum 0)
      const joursIndemnises = Math.max(0, mois.joursDansMois - joursNonIndemnises);
      
      // Si le nombre de jours non indemnisés dépasse le nombre de jours du mois, report de l'excédent
      // Mais on ne reporte pas les jours non indemnisables
      const joursNonIndemnisesHorsPeriode = joursNonIndemnises - nonIndemnisablePeriode;
      franchiseReportPrecedent = Math.max(0, joursNonIndemnisesHorsPeriode - (mois.joursDansMois - nonIndemnisablePeriode));
      
      // Indemnisation mensuelle nette = jours indemnisés * AJ nette
      const ajNette = data.ajNette ? parseFloat(data.ajNette) : 0;
      
      // Calculer l'indemnisation brute (estimation)
      const ajBrute = data.ajBrute ? parseFloat(data.ajBrute) : (ajNette / TAUX_NET_ALLOCATION);
      const indemnisationBrute = joursIndemnises * ajBrute;
      
      // Appliquer le plafond mensuel de la sécurité sociale (118%)
      const plafondMensuel = getPlafond(mois.anneeNum);
      const totalBrut = mois.revenusBruts + indemnisationBrute;
      let indemnisationBrutePlafonnee = indemnisationBrute;
      let plafondDepasse = false;
      
      // Si le total dépasse le plafond, réduire l'indemnisation
      if (totalBrut > plafondMensuel) {
        indemnisationBrutePlafonnee = Math.max(0, plafondMensuel - mois.revenusBruts);
        plafondDepasse = true;
      }
      
      // Convertir l'indemnisation brute plafonnée en nette avec application du prélèvement à la source
      const indemnisationMensuelle = calculNetApresPrelevement(indemnisationBrutePlafonnee, tauxPrelevement, TAUX_NET_ALLOCATION);
      
      // Total mensuel = revenus nets + indemnisation nette
      const totalNet = mois.revenusNets + indemnisationMensuelle;
      
      // Mettre à jour les propriétés du mois
      mois.delaiAttente = delaiAttente;
      mois.franchiseCP = franchiseCP;
      mois.franchiseSalaires = franchiseSalaires;
      mois.joursNonIndemnises = joursNonIndemnises;
      mois.joursIndemnises = joursIndemnises;
      mois.indemnisationBrute = indemnisationBrute;
      mois.indemnisationMensuelle = indemnisationMensuelle;
      mois.plafondDepasse = plafondDepasse;
      mois.totalBrut = totalBrut;
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
    nonIndemnisablePeriode: moisData.reduce((acc, m) => acc + m.nonIndemnisablePeriode, 0),
    delaiAttente: moisData.reduce((acc, m) => acc + (m.delaiAttente || 0), 0),
    franchiseCP: moisData.reduce((acc, m) => acc + (m.franchiseCP || 0), 0),
    franchiseSalaires: moisData.reduce((acc, m) => acc + (m.franchiseSalaires || 0), 0),
    franchiseReportee: moisData.reduce((acc, m) => acc + m.franchiseReportee, 0),
    joursNonIndemnises: moisData.reduce((acc, m) => acc + (m.joursNonIndemnises || 0), 0),
    joursIndemnises: moisData.reduce((acc, m) => acc + (m.joursIndemnises || 0), 0),
    indemnisationMensuelle: moisData.reduce((acc, m) => acc + (m.indemnisationMensuelle || 0), 0),
    totalNet: moisData.reduce((acc, m) => acc + (m.totalNet || 0), 0)
  };
  
  // Nombre de mois où le plafond est dépassé
  const moisPlafondDepasse = moisData.filter(m => m.plafondDepasse).length;
  
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Suivi Mensuel</h1>
        <p className="text-gray-600">
          Cette page affiche mois par mois vos revenus, franchises et indemnités calculées.
        </p>
      </div>
      
      <ImportExportBar />
      
      {/* Panneau d'informations sur les calculs */}
      <div className="bg-amber-50 rounded-lg p-4 border border-amber-200 mb-6">
        <div className="flex items-start">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 mr-2 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-amber-800 mb-1 flex items-center">
              Informations sur les calculs
              <button 
                onClick={() => setAfficherInfos(!afficherInfos)} 
                className="ml-2 text-sm text-amber-600 hover:text-amber-800"
              >
                {afficherInfos ? "Masquer" : "Afficher"}
              </button>
            </h3>
            {afficherInfos && (
              <div className="text-sm text-amber-700 mt-2 space-y-2">
                <p>
                  <span className="font-semibold">Estimation des salaires nets :</span> Les salaires nets sont estimés à 80% du montant brut selon la règle généralement admise pour évaluer un salaire après cotisations.
                </p>
                <p>
                  <span className="font-semibold">Plafonnement des revenus :</span> Le cumul Salaires + Allocations bruts est plafonné à 118% du montant mensuel du plafond de la sécurité sociale, soit 4 522,08 € en 2024.
                </p>
                <p>
                  <span className="font-semibold">Dépassement du plafond :</span> Si vous dépassez le plafond mensuel, l'indemnisation est automatiquement ajustée.
                </p>
                <p>
                  <span className="font-semibold">Prélèvement à la source :</span> Un taux de prélèvement de {data.tauxPrelevement || "0"}% est appliqué sur le montant des allocations nettes.
                </p>
                <p>
                  <span className="font-semibold">Date d'indemnisation :</span> Aucune indemnisation n'est calculée avant la date d'indemnisation que vous avez configurée ({data.dateIndem || "non configurée"}). Ces jours apparaissent dans la colonne "Non ind. période".
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      
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
                <th className="py-2 px-3 text-right">Non ind. période</th>
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
                  className={`border-b ${index % 2 === 0 ? 'bg-gray-50' : ''} ${mois.plafondDepasse ? 'bg-amber-50' : ''} ${mois.nonIndemnisablePeriode === mois.joursDansMois ? 'bg-gray-100' : ''}`}
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
                  <td className={`py-2 px-3 text-right ${mois.nonIndemnisablePeriode > 0 ? 'bg-red-50' : ''}`}>
                    {mois.nonIndemnisablePeriode > 0 ? mois.nonIndemnisablePeriode : '-'}
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
                  <td className={`py-2 px-3 text-right ${(mois.indemnisationMensuelle || 0) > 0 ? 'bg-blue-50' : ''} ${mois.plafondDepasse ? 'bg-amber-100' : ''}`}>
                    {(mois.indemnisationMensuelle || 0) > 0 ? 
                      <>
                        {(mois.indemnisationMensuelle || 0).toFixed(2)}
                        {mois.plafondDepasse && <span className="text-amber-600 ml-1">*</span>}
                      </> : '-'}
                  </td>
                  <td className={`py-2 px-3 text-right font-semibold ${(mois.totalNet || 0) > 0 ? 'bg-blue-100' : ''} ${mois.plafondDepasse ? 'bg-amber-100' : ''}`}>
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
                <td className="py-2 px-3 text-right">{totaux.nonIndemnisablePeriode}</td>
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
        
        {moisPlafondDepasse > 0 && (
          <div className="px-4 py-2 text-xs text-amber-700 bg-amber-50 border-t border-amber-200">
            * Le plafond mensuel de cumul revenus + allocations a été dépassé pour {moisPlafondDepasse} mois, entraînant une réduction des allocations.
          </div>
        )}
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
                <div className="w-4 h-4 bg-red-50 rounded border border-red-200 mr-1"></div>
                <span>Non indemnisable (date)</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-blue-50 rounded border border-blue-200 mr-1"></div>
                <span>Indemnisation</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-blue-100 rounded border border-blue-200 mr-1"></div>
                <span>Total mensuel</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-amber-50 rounded border border-amber-200 mr-1"></div>
                <span>Plafond dépassé</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuiviMensuelPage; 