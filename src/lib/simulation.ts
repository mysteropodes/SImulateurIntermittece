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
  const franchiseSalAuto = franchiseSalaires(aff.srBrut + aff.brutEnseignement + aff.brutAutres, sjmValeur, smic, 12);
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
    tauxHoraireMoyen: aff.heuresBrutes > 0 ? aff.srBrut / aff.heuresBrutes : 0,
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

// ---------------------------------------------------------------------------
// Historique des droits (progression d'une date anniversaire à l'autre)
// ---------------------------------------------------------------------------

export type StatutDroit = 'passe' | 'en-cours' | 'projection';

export interface LigneHistorique {
  id: string;
  statut: StatutDroit;
  dateDebut: string;
  dateAnniversaire: string;
  /** AJ brute (notifiée pour les droits passés / en cours, recalculée pour la projection). */
  ajBrute: number | null;
  /** Heures retenues pour l'AJ et salaire de référence, s'ils sont connus. */
  heures: number | null;
  salaires: number | null;
  /** D'où viennent heures et salaires : saisis, ou déduits des contrats (éventuellement partiels). */
  source: 'saisie' | 'contrats' | 'contrats-partiels' | null;
  /** AJ selon la formule actuelle, quand heures et salaires sont connus. */
  ajFormule: ResultatAJ | null;
  /** Écart d'AJ avec le droit précédent. */
  variation: number | null;
}

/** Heures et salaires de la PRA qui précède un droit, déduits des contrats saisis. */
function depuisContrats(data: IntermittenceData, dateDebut: string) {
  const finPRA = toISODate(addDays(parseDate(dateDebut), -1));
  const aff = affiliation(data.contrats, data.annexe, finPRA, { plus50ans: data.plus50ans });
  if (aff.heuresAffiliation <= 0) return null;
  return { heures: aff.nht, salaires: aff.sr, complet: aff.eligible };
}

export function historiqueDroits(data: IntermittenceData, sim: Simulation): LigneHistorique[] {
  const lignes: Omit<LigneHistorique, 'variation'>[] = [];
  const anniversaire = (d: string) => toISODate(addMonths(parseDate(d), 12));

  for (const h of data.historique) {
    let heures: number | null = h.heures ?? null;
    let salaires: number | null = h.salaires ?? null;
    let source: LigneHistorique['source'] = heures != null && salaires != null ? 'saisie' : null;
    if (source == null) {
      const c = depuisContrats(data, h.dateDebut);
      if (c) {
        heures = heures ?? c.heures;
        salaires = salaires ?? c.salaires;
        source = c.complet ? 'contrats' : 'contrats-partiels';
      }
    }
    lignes.push({
      id: h.id,
      statut: 'passe',
      dateDebut: h.dateDebut,
      dateAnniversaire: anniversaire(h.dateDebut),
      ajBrute: h.ajBrute > 0 ? h.ajBrute : null,
      heures,
      salaires,
      source,
      ajFormule: heures != null && salaires != null && heures > 0 ? calculAJ(data.annexe, salaires, heures) : null,
    });
  }

  // droit en cours
  const c = depuisContrats(data, sim.dateIndem);
  lignes.push({
    id: 'en-cours',
    statut: 'en-cours',
    dateDebut: sim.dateIndem,
    dateAnniversaire: sim.dateAnniversaire,
    ajBrute: sim.ajBrute > 0 ? sim.ajBrute : null,
    heures: c?.heures ?? null,
    salaires: c?.salaires ?? null,
    source: c ? (c.complet ? 'contrats' : 'contrats-partiels') : null,
    ajFormule: c && c.heures > 0 ? calculAJ(data.annexe, c.salaires, c.heures) : null,
  });

  // prochaine date anniversaire : AJ recalculée sur la période de référence actuelle
  const aff = sim.affiliation;
  lignes.push({
    id: 'projection',
    statut: 'projection',
    dateDebut: sim.dateAnniversaire,
    dateAnniversaire: anniversaire(sim.dateAnniversaire),
    ajBrute: aff.eligible ? sim.ajCalculee.aj : null,
    heures: aff.nht,
    salaires: aff.sr,
    source: 'contrats',
    ajFormule: aff.eligible ? sim.ajCalculee : null,
  });

  lignes.sort((a, b) => a.dateDebut.localeCompare(b.dateDebut) || (a.statut === 'projection' ? 1 : b.statut === 'projection' ? -1 : 0));
  let precedente: number | null = null;
  return lignes.map((l) => {
    const variation = l.ajBrute != null && precedente != null ? l.ajBrute - precedente : null;
    if (l.ajBrute != null) precedente = l.ajBrute;
    return { ...l, variation };
  });
}
