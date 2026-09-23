/**
 * Droits autour de l'intermittence : perte des 507 h, maternité / paternité,
 * Congés Spectacles, garantie santé Audiens.
 *
 * Sources :
 * - guide « Intermittents du spectacle » de France Travail (clause de
 *   rattrapage p. 20-22, congé maternité assimilé p. 9, SR aménagé p. 12) ;
 * - notice France Travail « Allocations de solidarité — intermittents du
 *   spectacle » (APS, AFD) ;
 * - ameli.fr, « Congé maternité : les indemnités journalières » (2026) ;
 * - Audiens, Congés Spectacles et Garantie santé intermittents.
 */
import {
  type Annexe,
  type Contrat,
  PMSS,
  AJ_MIN,
  SEUIL_HEURES,
  calculAJ,
  repartirContrat,
  parseDate,
  toISODate,
  addDays,
  joursDansMois,
  smicAt,
  estSpectacle,
  estSalaire,
} from './calculs';

// ---------------------------------------------------------------------------
// Perte de l'intermittence à la date anniversaire
// ---------------------------------------------------------------------------

/** Heures minimum pour la clause de rattrapage (2/3 de 507 h). */
export const SEUIL_RATTRAPAGE = 338;
/** Durée maximale de la clause de rattrapage. */
export const MOIS_RATTRAPAGE = 6;
/** Forfaits de franchise pendant le rattrapage : 2 j CP + 2 j salaires par mois, non reportables. */
export const FORFAIT_FRANCHISE_RATTRAPAGE = 2;
/** AFD : montant journalier net fixe. */
export const AFD_JOUR = 30;
/** Clause de sauvegarde : 182 jours à l'AJ minimale. */
export const SAUVEGARDE_JOURS = 182;

export interface ProfilDroits {
  /** Ancienneté continue d'indemnisation au titre des annexes 8/10 (ARE, rattrapage, APS, AFD), en années. */
  ancienneteAns: number;
  /** 5 ouvertures de droits A8/A10 (ou 2 535 h) dans les 10 ans précédant la fin de contrat de la dernière ouverture. */
  cinqAnsSur10: boolean;
  /** Nombre d'AFD déjà perçues. */
  afdDeja: number;
}

export type Issue = 'readmission' | 'rattrapage' | 'rattrapage-sans-anciennete' | 'solidarite';

export interface Diagnostic {
  issue: Issue;
  heures: number;
  manquantPour507: number;
  manquantPourRattrapage: number;
}

export function diagnosticAnniversaire(heures: number, profil: ProfilDroits): Diagnostic {
  const manquantPour507 = Math.max(0, SEUIL_HEURES - heures);
  const manquantPourRattrapage = Math.max(0, SEUIL_RATTRAPAGE - heures);
  let issue: Issue;
  if (heures >= SEUIL_HEURES) issue = 'readmission';
  else if (heures >= SEUIL_RATTRAPAGE) issue = profil.cinqAnsSur10 ? 'rattrapage' : 'rattrapage-sans-anciennete';
  else issue = 'solidarite';
  return { issue, heures, manquantPour507, manquantPourRattrapage };
}

export interface MoisRattrapage {
  cle: string;
  jours: number;
  franchiseCP: number;
  franchiseSal: number;
  joursIndemnises: number;
  montantBrut: number;
}

/**
 * Clause de rattrapage : 6 mois maximum à la dernière AJ, à partir du
 * lendemain de la date anniversaire, sans activité ; franchises au forfait
 * de 2 j chacune par mois, non reportables, dans la limite du reliquat.
 */
export function simulerRattrapage(
  dateAnniversaire: string,
  ajBrute: number,
  reliquatCP: number,
  reliquatSal: number,
  delaiAttente = 0
): { mois: MoisRattrapage[]; totalBrut: number; joursIndemnises: number; fin: string } {
  const debut = parseDate(dateAnniversaire);
  // du lendemain de la date anniversaire au même quantième 6 mois plus tard, veille incluse (guide : 31/12 → 30/06)
  const fin = addDays(new Date(debut.getFullYear(), debut.getMonth() + MOIS_RATTRAPAGE, debut.getDate()), -1);
  let cp = reliquatCP;
  let sal = reliquatSal;
  let delai = delaiAttente;
  const mois: MoisRattrapage[] = [];
  for (let d = new Date(debut.getFullYear(), debut.getMonth(), 1); d <= fin; d = new Date(d.getFullYear(), d.getMonth() + 1, 1)) {
    const premier = d < debut ? debut : d;
    const dernierMois = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    const dernier = dernierMois > fin ? fin : dernierMois;
    let jours = Math.round((dernier.getTime() - premier.getTime()) / 86400000) + 1;
    const dd = Math.min(delai, jours);
    delai -= dd;
    jours -= dd;
    const fcp = Math.min(FORFAIT_FRANCHISE_RATTRAPAGE, cp, jours);
    cp -= fcp;
    const fsal = Math.min(FORFAIT_FRANCHISE_RATTRAPAGE, sal, jours - fcp);
    sal -= fsal;
    const joursIndemnises = jours - fcp - fsal;
    mois.push({
      cle: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      jours: jours + dd,
      franchiseCP: fcp,
      franchiseSal: fsal,
      joursIndemnises,
      montantBrut: joursIndemnises * ajBrute,
    });
  }
  return {
    mois,
    totalBrut: mois.reduce((a, m) => a + m.montantBrut, 0),
    joursIndemnises: mois.reduce((a, m) => a + m.joursIndemnises, 0),
    fin: toISODate(fin),
  };
}

/** AFD : 61 j (< 5 ans), 92 j (≥ 5 ans), 182 j (≥ 10 ans) ; 1, 2 ou 3 fois selon l'ancienneté. */
export function afd(profil: ProfilDroits): { jours: number; total: number; maxOuvertures: number; possible: boolean } {
  const jours = profil.ancienneteAns >= 10 ? 182 : profil.ancienneteAns >= 5 ? 92 : 61;
  const maxOuvertures = profil.ancienneteAns >= 10 ? 3 : profil.ancienneteAns >= 5 ? 2 : 1;
  return { jours, total: jours * AFD_JOUR, maxOuvertures, possible: profil.afdDeja < maxOuvertures };
}

/** AFD, mois avec activité : jours indemnisables = jours du mois − brut / 50. */
export function joursAFDMois(joursMois: number, brutMois: number): number {
  return Math.max(0, joursMois - Math.floor(brutMois / 50));
}

// ---------------------------------------------------------------------------
// Maternité / paternité
// ---------------------------------------------------------------------------

export type TypeConge = 'maternite-1-2' | 'maternite-3' | 'maternite-jumeaux' | 'maternite-triples' | 'paternite' | 'paternite-multiple';

export const CONGES: Record<TypeConge, { label: string; jours: number; maternite: boolean }> = {
  'maternite-1-2': { label: 'Maternité — 1er ou 2e enfant (16 semaines)', jours: 112, maternite: true },
  'maternite-3': { label: 'Maternité — 3e enfant ou plus (26 semaines)', jours: 182, maternite: true },
  'maternite-jumeaux': { label: 'Maternité — jumeaux (34 semaines)', jours: 238, maternite: true },
  'maternite-triples': { label: 'Maternité — triplés ou plus (46 semaines)', jours: 322, maternite: true },
  paternite: { label: 'Paternité / 2e parent (25 jours)', jours: 25, maternite: false },
  'paternite-multiple': { label: 'Paternité / 2e parent, naissances multiples (32 jours)', jours: 32, maternite: false },
};

/** Taux forfaitaire retiré du salaire journalier de base (CSG, CRDS). */
export const FORFAIT_IJ = 0.21;
/** Heures assimilées par jour de congé maternité hors contrat, pour les 507 h. */
export const HEURES_ASSIMILEES_MATERNITE = 5;

function sommeSur(contrats: Contrat[], debut: string, fin: string, filtre: (c: Contrat) => boolean = () => true) {
  let heures = 0;
  let brut = 0;
  const kd = debut.slice(0, 7);
  const kf = fin.slice(0, 7);
  for (const c of contrats) {
    if (!filtre(c)) continue;
    for (const p of repartirContrat(c)) {
      if (p.cle < kd || p.cle > kf) continue;
      heures += p.heures;
      brut += p.brut;
    }
  }
  return { heures, brut };
}

export interface SimulationConge {
  jours: number;
  fin: string;
  /** Conditions d'ouverture (au moins une suffit). */
  conditions: { label: string; ok: boolean; detail: string }[];
  eligible: boolean;
  salaires12Mois: number;
  /** IJ = min(salaires 12 mois ; 12 PMSS) / 365 × (1 − 21 %). */
  ij: number;
  ijPlafond: number;
  total: number;
  /** Maternité uniquement : effet sur le prochain droit. */
  heuresAssimilees: number;
  srAmenage: number | null;
  ajSans: number | null;
  ajAvec: number | null;
}

/**
 * Indemnités journalières (activité discontinue : 12 mois civils avant le
 * congé) et, pour la maternité, heures assimilées (5 h / jour hors contrat)
 * et salaire de référence aménagé : SR × 365 / (365 − jours de congé).
 */
export function simulerConge(
  contrats: Contrat[],
  annexe: Annexe,
  dateDebut: string,
  type: TypeConge,
  affiliation: { nht: number; sr: number },
  indemniseARE: boolean
): SimulationConge {
  const def = CONGES[type];
  const debut = parseDate(dateDebut);
  const fin = toISODate(addDays(debut, def.jours - 1));
  const annee = debut.getFullYear();
  const pmss = PMSS[Math.min(Math.max(annee, 2018), 2026)];
  const smic = smicAt(dateDebut);

  // 12 mois civils précédant le congé
  const fin12 = toISODate(new Date(debut.getFullYear(), debut.getMonth(), 0));
  const debut12 = toISODate(new Date(debut.getFullYear() - 1, debut.getMonth(), 1));
  const debut3 = toISODate(new Date(debut.getFullYear(), debut.getMonth() - 3, 1));
  const debut6 = toISODate(new Date(debut.getFullYear(), debut.getMonth() - 6, 1));
  const s12 = sommeSur(contrats, debut12, fin12, estSalaire);
  const s3 = sommeSur(contrats, debut3, fin12, estSalaire);
  const s6 = sommeSur(contrats, debut6, fin12, estSalaire);

  const conditions = [
    { label: '150 h dans les 3 mois', ok: s3.heures >= 150, detail: `${Math.round(s3.heures)} h` },
    { label: '600 h dans les 12 mois (activité discontinue)', ok: s12.heures >= 600, detail: `${Math.round(s12.heures)} h` },
    {
      label: `cotisations sur ${Math.round(1015 * smic.horaire).toLocaleString('fr-FR')} € de salaires en 6 mois`,
      ok: s6.brut >= 1015 * smic.horaire,
      detail: `${Math.round(s6.brut).toLocaleString('fr-FR')} €`,
    },
    {
      label: `cotisations sur ${Math.round(2030 * smic.horaire).toLocaleString('fr-FR')} € de salaires en 12 mois`,
      ok: s12.brut >= 2030 * smic.horaire,
      detail: `${Math.round(s12.brut).toLocaleString('fr-FR')} €`,
    },
    { label: 'indemnisé(e) par France Travail (maintien des droits)', ok: indemniseARE, detail: indemniseARE ? 'oui' : 'non' },
  ];
  const eligible = conditions.some((c) => c.ok);

  const ijPlafond = ((12 * pmss) / 365) * (1 - FORFAIT_IJ);
  const ij = (Math.min(s12.brut, 12 * pmss) / 365) * (1 - FORFAIT_IJ);

  let heuresAssimilees = 0;
  let srAmenage: number | null = null;
  let ajSans: number | null = null;
  let ajAvec: number | null = null;
  if (def.maternite) {
    // jours de congé sans contrat (approximation : on retire les jours des mois couverts par un contrat au prorata des heures / 8)
    const pendant = sommeSur(contrats, dateDebut, fin, estSalaire);
    const joursTravailles = Math.min(def.jours, Math.round(pendant.heures / 8));
    heuresAssimilees = (def.jours - joursTravailles) * HEURES_ASSIMILEES_MATERNITE;
    const joursCongeDansPRA = Math.min(def.jours, 364);
    srAmenage = (affiliation.sr / (365 - joursCongeDansPRA)) * 365;
    ajSans = calculAJ(annexe, affiliation.sr, affiliation.nht).aj;
    ajAvec = calculAJ(annexe, srAmenage, affiliation.nht + heuresAssimilees).aj;
  }

  return {
    jours: def.jours,
    fin,
    conditions,
    eligible,
    salaires12Mois: s12.brut,
    ij,
    ijPlafond,
    total: eligible ? ij * def.jours : 0,
    heuresAssimilees,
    srAmenage,
    ajSans,
    ajAvec,
  };
}

// ---------------------------------------------------------------------------
// Congés Spectacles
// ---------------------------------------------------------------------------

export const TAUX_CONGES_SPECTACLES = 0.1;

export interface PeriodeConges {
  /** Du 1er avril au 31 mars. */
  debut: string;
  fin: string;
  salaires: number;
  indemniteBrute: number;
  /** Payable à partir du 1er mai suivant la fin de période. */
  payableDes: string;
  enCours: boolean;
}

/** Indemnité = 10 % des salaires bruts spectacle de la période 1er avril → 31 mars (hors enseignement). */
export function congesSpectacles(contrats: Contrat[], aujourdHui = new Date()): PeriodeConges[] {
  const cles = contrats.filter(estSpectacle).flatMap((c) => repartirContrat(c).map((p) => p.cle));
  if (cles.length === 0) return [];
  const exercice = (cle: string) => {
    const [y, m] = cle.split('-').map(Number);
    return m >= 4 ? y : y - 1;
  };
  const exercices = [...new Set(cles.map(exercice))].sort();
  const courant = aujourdHui.getMonth() + 1 >= 4 ? aujourdHui.getFullYear() : aujourdHui.getFullYear() - 1;
  return exercices.map((y) => {
    const debut = `${y}-04-01`;
    const fin = `${y + 1}-03-31`;
    const { brut } = sommeSur(contrats, debut, fin, estSpectacle);
    return {
      debut,
      fin,
      salaires: brut,
      indemniteBrute: brut * TAUX_CONGES_SPECTACLES,
      payableDes: `${y + 1}-05-01`,
      enCours: y === courant,
    };
  });
}

// ---------------------------------------------------------------------------
// Audiens : garantie santé
// ---------------------------------------------------------------------------

/** Heures d'une année civile (la réduction de cotisation santé demande 507 h l'année civile précédente). */
export function heuresAnneeCivile(contrats: Contrat[], annee: number): number {
  return sommeSur(contrats, `${annee}-01-01`, `${annee}-12-31`, (c) => estSpectacle(c) || c.type === 'Enseignement').heures;
}

export { AJ_MIN, joursDansMois };
