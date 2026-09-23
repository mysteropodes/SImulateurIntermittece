import type { IntermittenceData } from '../context/IntermittenceContext';
import {
  affiliation,
  calculAJ,
  sjm,
  ajNette,
  smicAt,
  franchiseCP,
  franchiseSalaires,
  suiviMensuel,
  projectionEligibilite,
  paliers,
  parseDate,
  toISODate,
  addMonths,
  addDays,
  type Affiliation,
  type ResultatAJ,
  type RetenuesAJ,
  type Smic,
  type FranchiseCP,
  type FranchiseSalaires,
  type ResultatSuivi,
  type Projection,
  type Paliers,
} from './calculs';

export interface Simulation {
  affiliation: Affiliation;
  ajCalculee: ResultatAJ;
  sjm: number;
  smic: Smic;
  /** 'notifiee' si l'utilisateur a saisi l'AJ de sa notification, sinon 'calculee'. */
  sourceAJ: 'notifiee' | 'calculee';
  /** AJ brute utilisée pour le suivi mensuel (0 si non éligible et rien de notifié). */
  ajBrute: number;
  retenues: RetenuesAJ;
  ratioNetAJ: number;
  ratioNetSalaire: number;
  franchiseCPAuto: FranchiseCP;
  franchiseSalAuto: FranchiseSalaires;
  franchiseCP: FranchiseCP;
  franchiseSal: FranchiseSalaires;
  /** Premier jour indemnisable retenu. */
  dateIndem: string;
  /** Date anniversaire = début du droit + 12 mois (fin de l'indemnisation). */
  dateAnniversaire: string;
  dateFinDroit: string;
  suivi: ResultatSuivi;
  projection: Projection;
  paliers: Paliers;
  /** Taux horaire brut moyen des contrats retenus (hors enseignement). */
  tauxHoraireMoyen: number;
}

const toNum = (s: string, fallback = 0): number => {
  const n = parseFloat(String(s).replace(',', '.'));
  return Number.isFinite(n) ? n : fallback;
};

export function simulation(data: IntermittenceData, aujourdHui = new Date()): Simulation {
  const aff = affiliation(data.contrats, data.annexe, data.dateFinPRA || undefined, { plus50ans: data.plus50ans });
  const ajCalculee = calculAJ(data.annexe, aff.sr, aff.nht);
  const sjmValeur = sjm(data.annexe, aff.sr, aff.nht);
  const smic = smicAt(aff.periode.fin);

  const ajNotifiee = toNum(data.ajBruteNotifiee);
  const sourceAJ = ajNotifiee > 0 ? 'notifiee' : 'calculee';
  const ajBrute = sourceAJ === 'notifiee' ? ajNotifiee : aff.eligible ? ajCalculee.aj : 0;
  const retenues = ajNette(ajBrute, sjmValeur, toNum(data.tauxCSG, 6.2) / 100);
  const ratioNetAJ = ajBrute > 0 ? retenues.net / ajBrute : 1;
  const ratioNetSalaire = 1 - Math.min(100, Math.max(0, toNum(data.tauxCotisationsSalaire, 22))) / 100;

  const franchiseCPAuto = franchiseCP(aff.joursTravail);
  // « salaires de la PRA » = toutes rémunérations, enseignement compris ; le SJM reste sur le SR
  const franchiseSalAuto = franchiseSalaires(aff.sr + aff.brutEnseignement, sjmValeur, smic, 12);
  let fcp = franchiseCPAuto;
  let fsal = franchiseSalAuto;
  if (!data.franchisesAuto) {
    const totalCP = Math.max(0, Math.floor(toNum(data.franchiseConges)));
    const forfaitCP = Math.max(0, Math.floor(toNum(data.joursConges))) || (totalCP <= 24 ? 2 : 3);
    fcp = { total: totalCP, forfaitMensuel: forfaitCP };
    const totalSal = Math.max(0, Math.floor(toNum(data.franchiseSalaires)));
    const mensuelle = Math.max(0, Math.floor(toNum(data.joursSalaires))) || (totalSal > 0 ? Math.ceil(totalSal / 8) : 0);
    fsal = { total: totalSal, mensuelle };
  }

  const dateIndem =
    data.dateIndem ||
    (data.dateFinContrat ? toISODate(addDays(parseDate(data.dateFinContrat), 1)) : toISODate(addDays(parseDate(aff.periode.fin), 1)));
  const anniversaire = addMonths(parseDate(dateIndem), 12);
  const dateAnniversaire = toISODate(anniversaire);
  const dateFinDroit = toISODate(addDays(anniversaire, -1));

  const debut = parseDate(dateIndem);
  const suivi = suiviMensuel({
    annexe: data.annexe,
    contrats: data.contrats,
    ajBrute,
    ratioNetAJ,
    tauxPrelevement: Math.min(100, Math.max(0, toNum(data.tauxPrelevement))),
    ratioNetSalaire,
    dateDebut: toISODate(new Date(debut.getFullYear(), debut.getMonth(), 1)),
    dateIndem,
    dateFinDroit,
    delaiAttente: data.delaiAttente,
    franchiseCP: fcp,
    franchiseSal: fsal,
    nbMois: 13,
  });

  const projection = projectionEligibilite(data.contrats, aff.heuresManquantes, aujourdHui);

  return {
    paliers: paliers(data.annexe, aff.sr, aff.nht),
    tauxHoraireMoyen: aff.heuresBrutes > 0 ? aff.sr / aff.heuresBrutes : 0,
    affiliation: aff,
    ajCalculee,
    sjm: sjmValeur,
    smic,
    sourceAJ,
    ajBrute,
    retenues,
    ratioNetAJ,
    ratioNetSalaire,
    franchiseCPAuto,
    franchiseSalAuto,
    franchiseCP: fcp,
    franchiseSal: fsal,
    dateIndem,
    dateAnniversaire,
    dateFinDroit,
    suivi,
    projection,
  };
}
