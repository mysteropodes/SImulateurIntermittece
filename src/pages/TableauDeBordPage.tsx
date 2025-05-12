import React from 'react';
import { useIntermittence } from '../context/IntermittenceContext';
import { BarChart3, PieChart, Calendar, TrendingUp, AlertCircle, Check, Clock } from 'lucide-react';
import ImportExportBar from '../components/ImportExportBar';

// Interface pour le type de données par mois
interface ContratParMois {
  Cachet: number;
  Heures: number;
  total: number;
  brut: number;
}

// Interface pour la map des contrats par mois
interface ContratsParMoisMap {
  [key: string]: ContratParMois;
}

const TableauDeBordPage: React.FC = () => {
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
  
  const calculeMoisParTypes = () => {
    // Créer un mapping par mois des heures par type
    const contratsParMois: ContratsParMoisMap = {};
    data.contrats.forEach(contrat => {
      const date = new Date(contrat.date);
      const moisKey = `${date.getMonth() + 1}/${date.getFullYear()}`;
      
      if (!contratsParMois[moisKey]) {
        contratsParMois[moisKey] = { 
          Cachet: 0, 
          Heures: 0,
          total: 0,
          brut: 0
        };
      }
      
      const heures = contrat.type === 'Cachet' ? contrat.nombre * 12 : contrat.nombre;
      contratsParMois[moisKey][contrat.type] += heures;
      contratsParMois[moisKey].total += heures;
      contratsParMois[moisKey].brut += contrat.brut;
    });
    
    // Convertir en tableau trié par date
    const moisKeys = Object.keys(contratsParMois);
    moisKeys.sort((a, b) => {
      const [moisA, anneeA] = a.split('/').map(Number);
      const [moisB, anneeB] = b.split('/').map(Number);
      
      if (anneeA !== anneeB) return anneeA - anneeB;
      return moisA - moisB;
    });
    
    return moisKeys.map(mois => ({
      mois,
      ...contratsParMois[mois]
    }));
  };
  
  const calculResteAvantEligibilite = () => {
    const totalHeures = calculHeures();
    const manquant = Math.max(0, 507 - totalHeures);
    
    // Calcul du nombre de mois estimé avant d'être éligible
    // Basé sur la moyenne des 3 derniers mois
    const moisData = calculeMoisParTypes();
    const derniersMois = moisData.slice(-3);
    
    let moyenneHeuresParMois = 0;
    if (derniersMois.length > 0) {
      moyenneHeuresParMois = derniersMois.reduce((acc, m) => acc + m.total, 0) / derniersMois.length;
    }
    
    const moisAvantEligibilite = moyenneHeuresParMois > 0 
      ? Math.ceil(manquant / moyenneHeuresParMois) 
      : 0;
    
    // Estimation de la date d'éligibilité
    const dateEstimee = new Date();
    dateEstimee.setMonth(dateEstimee.getMonth() + moisAvantEligibilite);
    
    return {
      heuresManquantes: manquant,
      moisEstimes: moisAvantEligibilite,
      dateEstimee: dateEstimee.toISOString().split('T')[0],
      moyenneHeuresParMois
    };
  };
  
  const calculerAJ = () => {
    const heures = calculHeures();
    const sjr = calculeSJR();
    
    if (heures < 507 || sjr <= 0) return { eligible: false, aj: 0, ajBrute: 0, plafond: 0, plancher: 0 };
    
    const ajBrute = 31.98 + sjr * 0.404;
    const plafond = sjr * 0.75;
    const plancher = Math.max(sjr * 0.57, 31.98);
    const aj = Math.min(plafond, Math.max(plancher, ajBrute));
    
    return {
      eligible: true,
      aj,
      ajBrute,
      plafond,
      plancher
    };
  };
  
  // Fonction pour déterminer les dates clés de la frise chronologique
  const calculerDatesReperes = () => {
    // Utiliser la date de fin de contrat spécifiée dans MonAJ si disponible, sinon utiliser le dernier contrat trouvé
    const dernierContrat = data.dateFinContrat 
      ? new Date(data.dateFinContrat)
      : (data.contrats.length > 0 
        ? new Date(Math.max(...data.contrats.map(c => new Date(c.date).getTime())))
        : new Date());
    
    // Date indemnisable (on utilise data.dateIndem si définie, sinon on prend la date après le dernier contrat)
    const dateIndemnisable = data.dateIndem 
      ? new Date(data.dateIndem) 
      : new Date(dernierContrat.getTime() + 24 * 60 * 60 * 1000); // Lendemain du dernier contrat
    
    // Date anniversaire (1 an après la date indemnisable)
    const dateAnniversaire = new Date(dateIndemnisable);
    dateAnniversaire.setFullYear(dateAnniversaire.getFullYear() + 1);
    
    // Début de la période glissante de référence (1 an avant aujourd'hui)
    const debutPeriodeGlissante = new Date();
    debutPeriodeGlissante.setFullYear(debutPeriodeGlissante.getFullYear() - 1);

    // Calculer les mois intermédiaires de manière plus précise
    const moisIntermediaires = [];
    const dateAujourdhui = new Date();
    
    // On commence par le mois suivant celui du dernier contrat
    let dateCourante = new Date(dernierContrat);
    dateCourante.setDate(1); // Premier jour du mois
    dateCourante.setMonth(dateCourante.getMonth() + 1); // Mois suivant
    
    // On s'arrête au dernier mois avant la date anniversaire
    const dateFin = new Date(dateAnniversaire);
    
    // Générer tous les premiers jours de chaque mois entre le début et la fin
    while (dateCourante < dateFin) {
      moisIntermediaires.push(new Date(dateCourante));
      dateCourante.setMonth(dateCourante.getMonth() + 1);
    }
    
    return {
      dernierContrat,
      dateIndemnisable,
      dateAnniversaire,
      debutPeriodeGlissante,
      moisIntermediaires,
      aujourdhui: dateAujourdhui
    };
  };
  
  const totalHeures = calculHeures();
  const totalBrut = calculBrut();
  const joursTravailles = calculJoursTravailles();
  const sjr = calculeSJR();
  const { eligible, aj } = calculerAJ();
  const { heuresManquantes, moisEstimes, dateEstimee, moyenneHeuresParMois } = calculResteAvantEligibilite();
  const moisData = calculeMoisParTypes();
  const datesReperes = calculerDatesReperes();
  
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Tableau de Bord</h1>
        <p className="text-gray-600">
          Vue d'ensemble de vos statistiques et projections d'intermittence.
        </p>
      </div>
      
      <ImportExportBar />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600">Heures travaillées</p>
              <h3 className="text-2xl font-bold">{totalHeures.toFixed(0)}</h3>
              <p className="text-xs text-gray-500">sur 507h requises</p>
            </div>
            <div className={`rounded-full p-2 ${totalHeures >= 507 ? 'bg-green-100' : 'bg-orange-100'}`}>
              <BarChart3 className={`w-6 h-6 ${totalHeures >= 507 ? 'text-green-600' : 'text-orange-600'}`} />
            </div>
          </div>
          <div className="mt-2 pt-2 border-t">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className={`h-2.5 rounded-full ${totalHeures >= 507 ? 'bg-green-600' : 'bg-orange-600'}`}
                style={{ width: `${Math.min(100, (totalHeures / 507) * 100)}%` }}
              ></div>
            </div>
            <p className="text-xs text-right mt-1">{Math.min(100, (totalHeures / 507) * 100).toFixed(1)}%</p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600">Jours travaillés</p>
              <h3 className="text-2xl font-bold">{joursTravailles}</h3>
              <p className="text-xs text-gray-500">jours sur 12 mois</p>
            </div>
            <div className="rounded-full p-2 bg-blue-100">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-2 pt-2 border-t">
            <p className="text-sm">SJR : <span className="font-bold">{sjr.toFixed(2)} €</span></p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600">Allocation journalière</p>
              <h3 className="text-2xl font-bold">{eligible ? `${aj.toFixed(2)} €` : 'Non éligible'}</h3>
              <p className="text-xs text-gray-500">{eligible ? `${(aj * 20).toFixed(2)} € estimés/mois` : 'Seuil 507h non atteint'}</p>
            </div>
            <div className={`rounded-full p-2 ${eligible ? 'bg-green-100' : 'bg-red-100'}`}>
              <TrendingUp className={`w-6 h-6 ${eligible ? 'text-green-600' : 'text-red-600'}`} />
            </div>
          </div>
          <div className="mt-2 pt-2 border-t">
            <p className="text-sm">Durée max : <span className="font-bold">{eligible ? '243 jours' : '-'}</span></p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600">Revenus bruts</p>
              <h3 className="text-2xl font-bold">{totalBrut.toFixed(2)} €</h3>
              <p className="text-xs text-gray-500">sur 12 mois glissants</p>
            </div>
            <div className="rounded-full p-2 bg-purple-100">
              <PieChart className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-2 pt-2 border-t">
            <p className="text-sm">Net estimé : <span className="font-bold">{(totalBrut * 0.77).toFixed(2)} €</span></p>
          </div>
        </div>
      </div>
      
      {/* Nouvelle section: Frise chronologique */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-lg font-bold mb-4 flex items-center border-b pb-2">
          <Clock className="w-5 h-5 mr-2 text-blue-600" />
          Frise chronologique de référence
        </h2>
        
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">
            Cette frise représente votre période de référence pour le calcul des droits, basée sur votre dernier contrat et la date anniversaire.
            <span className="font-medium ml-1">
              Durée totale : {Math.round((datesReperes.dateAnniversaire.getTime() - datesReperes.dernierContrat.getTime()) / (1000 * 60 * 60 * 24))} jours
            </span>
          </p>
        </div>
        
        <div className="relative pt-16 pb-10 h-36">
          {/* Ligne de temps */}
          <div className="absolute top-16 left-0 right-0 h-2 bg-gray-200"></div>
          
          {/* Marqueurs de mois intermédiaires */}
          {datesReperes.moisIntermediaires.map((date, index) => {
            // Calculer la position relative en pourcentage entre dernier contrat et date anniversaire
            const debut = datesReperes.dernierContrat.getTime();
            const fin = datesReperes.dateAnniversaire.getTime();
            const current = date.getTime();
            const duree = fin - debut;
            // Position proportionnelle à la durée écoulée depuis le début
            const position = ((current - debut) / duree) * 100;
            
            return (
              <div 
                key={index} 
                className="absolute -translate-x-1/2" 
                style={{ left: `${position}%` }}
              >
                <div className="w-1 h-4 bg-gray-400 mx-auto -mt-1"></div>
                <div className="text-[10px] text-gray-600 font-medium text-center mt-1">
                  {new Intl.DateTimeFormat('fr-FR', { month: 'short', year: 'numeric' }).format(date)}
                </div>
              </div>
            );
          })}
          
          {/* Période active pour le calcul - segment bleu */}
          <div 
            className="absolute h-2 bg-blue-600 z-10" 
            style={{ 
              left: '0%', 
              width: '25%', 
              top: '4rem',
              borderRadius: '4px'
            }}
          ></div>
          
          {/* Marqueurs de dates */}
          <div className="relative">
            {/* Dernier contrat */}
            <div className="absolute -translate-x-1/2" style={{ left: '0%' }}>
              <div className="w-5 h-5 bg-red-500 rounded-full -mt-1.5 mx-auto z-20 relative border-2 border-white"></div>
              <div className="text-xs font-medium text-center mt-2">
                <span className="font-bold">Dernier contrat</span><br />
                {new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(datesReperes.dernierContrat)}
              </div>
            </div>
            
            {/* Date indemnisable */}
            <div className="absolute -translate-x-1/2" style={{ left: '25%' }}>
              <div className="w-5 h-5 bg-blue-500 rounded-full -mt-1.5 mx-auto z-20 relative border-2 border-white"></div>
              <div className="text-xs font-medium text-center mt-2">
                <span className="font-bold">Date indemnisable</span><br />
                {new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(datesReperes.dateIndemnisable)}
              </div>
            </div>
            
            {/* Aujourd'hui */}
            <div className="absolute -translate-x-1/2" style={{ left: '60%' }}>
              <div className="w-5 h-5 bg-green-500 rounded-full -mt-1.5 mx-auto z-20 relative border-2 border-white"></div>
              <div className="text-xs font-medium text-center mt-2">
                <span className="font-bold">Aujourd'hui</span><br />
                {new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(datesReperes.aujourdhui)}
              </div>
            </div>
            
            {/* Date anniversaire / Fin des droits */}
            <div className="absolute -translate-x-1/2" style={{ left: '100%' }}>
              <div className="w-5 h-5 bg-purple-500 rounded-full -mt-1.5 mx-auto z-20 relative border-2 border-white"></div>
              <div className="text-xs font-medium text-center mt-2">
                <span className="font-bold">Date anniversaire</span><br />
                <span className="font-bold text-red-600">Fin des droits</span><br />
                {new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(datesReperes.dateAnniversaire)}
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="text-sm font-bold mb-2">Période de référence</h3>
            <p className="text-xs text-gray-700">
              Pour l'ouverture de droits, Pôle Emploi étudie vos heures travaillées sur une période de 12 mois, 
              jusqu'à la fin de votre dernier contrat de travail.
            </p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="text-sm font-bold mb-2">Date anniversaire et fin des droits</h3>
            <p className="text-xs text-gray-700">
              Votre date anniversaire correspond à la date d'indemnisation + 12 mois.
              C'est aussi la date de fin de vos droits actuels et la date à laquelle un réexamen de vos droits sera effectué.
            </p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-bold mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
            Évolution des heures par mois
          </h2>
          
          <div className="space-y-3">
            {moisData.map((mois, index) => (
              <div key={index}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">{mois.mois}</span>
                  <span>{mois.total.toFixed(0)} heures</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 flex">
                  {mois.Cachet > 0 && (
                    <div 
                      className="h-2.5 rounded-l-full bg-blue-600"
                      style={{ width: `${(mois.Cachet / mois.total) * 100}%` }}
                    ></div>
                  )}
                  {mois.Heures > 0 && (
                    <div 
                      className={`h-2.5 ${mois.Cachet > 0 ? '' : 'rounded-l-full'} rounded-r-full bg-green-500`}
                      style={{ width: `${(mois.Heures / mois.total) * 100}%` }}
                    ></div>
                  )}
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <span>Cachets: {mois.Cachet.toFixed(0)}h</span>
                  <span>Heures: {mois.Heures.toFixed(0)}h</span>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 pt-2 border-t">
            <div className="flex justify-between text-sm">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-600 rounded-full mr-1"></div>
                <span>Cachets</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
                <span>Heures</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-bold mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
            Projections
          </h2>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Moyenne d'heures mensuelles</p>
              <p className="text-xl font-bold">{moyenneHeuresParMois.toFixed(1)} heures</p>
              <p className="text-xs text-gray-500">calculée sur les 3 derniers mois actifs</p>
            </div>
            
            {totalHeures < 507 ? (
              <>
                <div>
                  <p className="text-sm font-medium text-gray-600">Heures manquantes</p>
                  <p className="text-xl font-bold">{heuresManquantes.toFixed(1)} heures</p>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                    <div 
                      className="h-2.5 rounded-full bg-orange-500"
                      style={{ width: `${(totalHeures / 507) * 100}%` }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-600">Temps estimé avant éligibilité</p>
                  {moyenneHeuresParMois > 0 ? (
                    <>
                      <p className="text-xl font-bold">{moisEstimes} mois</p>
                      <p className="text-sm">Date estimée : <span className="font-semibold">{new Date(dateEstimee).toLocaleDateString()}</span></p>
                    </>
                  ) : (
                    <p className="text-red-500">Impossible à estimer (activité insuffisante)</p>
                  )}
                </div>
                
                <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                  <div className="flex">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0" />
                    <p className="text-sm text-yellow-800">
                      Pour atteindre les 507h plus rapidement, vous devez travailler au moins {Math.ceil(heuresManquantes / 4)} heures par mois pendant 4 mois.
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                <div className="flex">
                  <Check className="w-5 h-5 text-green-600 mr-2 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-green-800">Félicitations !</p>
                    <p className="text-sm text-green-700">
                      Vous avez atteint le seuil de 507 heures nécessaire pour l'ouverture de droits.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h2 className="text-lg font-bold mb-4 flex items-center border-b pb-2">
          <PieChart className="w-5 h-5 mr-2 text-purple-600" />
          Répartition des revenus
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-md font-semibold mb-3">Par mois</h3>
            <div className="space-y-2">
              {moisData.map((mois, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm">{mois.mois}</span>
                  <div className="flex-1 mx-4">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="h-2.5 rounded-full bg-purple-500"
                        style={{ width: `${(mois.brut / totalBrut) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <span className="text-sm font-medium">{mois.brut.toFixed(0)} €</span>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-md font-semibold mb-3">Par type</h3>
            
            {/* Statistiques par type */}
            <div className="space-y-4">
              {/* Total des revenus par type */}
              {(() => {
                const revenus = {
                  Cachet: 0,
                  Heures: 0
                };
                
                data.contrats.forEach(c => {
                  revenus[c.type] += c.brut;
                });
                
                const totalRev = revenus.Cachet + revenus.Heures;
                
                return (
                  <div>
                    <div className="w-full bg-gray-200 rounded-full h-4 flex">
                      {revenus.Cachet > 0 && (
                        <div 
                          className="h-4 rounded-l-full bg-blue-500 flex items-center justify-center px-2 text-white text-xs"
                          style={{ width: `${(revenus.Cachet / totalRev) * 100}%` }}
                        >
                          {totalRev > 0 ? `${((revenus.Cachet / totalRev) * 100).toFixed(0)}%` : '0%'}
                        </div>
                      )}
                      {revenus.Heures > 0 && (
                        <div 
                          className={`h-4 ${revenus.Cachet > 0 ? '' : 'rounded-l-full'} rounded-r-full bg-green-500 flex items-center justify-center px-2 text-white text-xs`}
                          style={{ width: `${(revenus.Heures / totalRev) * 100}%` }}
                        >
                          {totalRev > 0 ? `${((revenus.Heures / totalRev) * 100).toFixed(0)}%` : '0%'}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex justify-between mt-2">
                      <div>
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-blue-500 rounded-full mr-1"></div>
                          <span className="text-sm">Cachets: {revenus.Cachet.toFixed(0)} €</span>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
                          <span className="text-sm">Heures: {revenus.Heures.toFixed(0)} €</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TableauDeBordPage; 