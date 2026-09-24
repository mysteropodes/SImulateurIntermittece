/**
 * Règles d'indemnisation des intermittents du spectacle (annexes 8 et 10).
 *
 * Source : Guide « Intermittents du spectacle » de France Travail
 * (GUIDE-INTERMITTENT.pdf à la racine du dépôt) et flyer « Franchises,
 * délai d'attente… ». Les numéros d'exemples cités dans les tests
 * renvoient à ce guide.
 *
 * Ce module est pur (aucune dépendance React) : toutes les pages et
 * l'export Excel s'appuient dessus pour ne jamais diverger.
 */

export type Annexe = 'A8' | 'A10';
/**
 * Enseignement : heures dispensées dans un établissement agréé. Elles comptent
 * pour les 507 h (70 h max, 120 h à 50 ans et plus) mais ni dans le SR ni
 * dans les NHT du calcul de l'AJ (guide p. 7 et 11). Elles restent une
 * activité déclarée pour le cumul mensuel.
 */
export type TypeContrat =
  | 'Cachet'
  | 'Heures'
  | 'Enseignement'
  /** Salarié hors spectacle (régime général) : réduit l'ARE du mois, ne compte pas pour les 507 h. */
  | 'RegimeGeneral'
  /** Activité non salariée (auto-entreprise…) : heures = revenu brut ÷ SMIC horaire (guide p. 16). */
  | 'NonSalarie'
  /** Arrêt maladie longue durée, accident du travail prolongé, maternité / adoption hors contrat : 5 h par jour (guide p. 9). `nombre` = jours. */
  | 'Arret'
  /** Formation non rémunérée par l'assurance chômage (Afdas…) : compte pour les 507 h, avec l'enseignement, jusqu'à 338 h. */
  | 'Formation';

/** Contrats du spectacle (annexes 8 et 10) : comptent dans le SR, les NHT et les Congés Spectacles. */
export const estSpectacle = (c: Pick<Contrat, 'type'>) => c.type === 'Cachet' || c.type === 'Heures';
/** Activités qui réduisent l'ARE du mois (cumul) : tout travail rémunéré. */
export const estActivite = (c: Pick<Contrat, 'type'>) => c.type !== 'Arret' && c.type !== 'Formation';
/** Salaires (toutes rémunérations salariées), pour la franchise salaires, les IJ et la retraite. */
export const estSalaire = (c: Pick<Contrat, 'type'>) => estSpectacle(c) || c.type === 'Enseignement' || c.type === 'RegimeGeneral';

export interface Contrat {
  id: string;
  date: string; // début (YYYY-MM-DD)
  dateFin?: string; // fin (YYYY-MM-DD) — optionnel, = date si absent
  employeur: string;
  type: TypeContrat;
  nombre: number;
  brut: number;
  /** Annexe du contrat, si différente de l'annexe générale (activités mixtes). */
  annexe?: Annexe;
}

// ---------------------------------------------------------------------------
// Paramètres réglementaires
// ---------------------------------------------------------------------------

/** Allocation journalière minimale (paramètre central A + B + C), depuis le 1er juillet 2023. */
export const AJ_MIN = 31.96;
/** Allocation journalière maximale, depuis le 1er janvier 2024. */
export const AJ_MAX = 174.8;
/** Plancher de l'AJ calculée. */
export const PLANCHER: Record<Annexe, number> = { A8: 38, A10: 44 };
/** Heures requises dans la période de référence affiliation (PRA). */
export const SEUIL_HEURES = 507;
/** Un cachet = 12 heures, quelle que soit sa qualification. */
export const HEURES_PAR_CACHET = 12;
/** Diviseur heures → jours de travail (SJM, seuil mensuel, jours non indemnisables). */
export const DIVISEUR_JOUR: Record<Annexe, number> = { A8: 8, A10: 10 };
/** Coefficient jours de travail → jours non indemnisables. */
export const COEF_NON_INDEMNISABLE: Record<Annexe, number> = { A8: 1.4, A10: 1.3 };
/** Seuil mensuel de jours de travail au-delà duquel aucune ARE n'est due. */
export const SEUIL_JOURS_TRAVAIL: Record<Annexe, number> = { A8: 26, A10: 27 };
/** Plafond d'heures retenues par mois civil dans la PRA. */
export const PLAFOND_HEURES_MOIS: Record<Annexe, number> = {
  A8: 208, // 250 si plusieurs employeurs dans le mois
  A10: 28 * HEURES_PAR_CACHET, // 28 cachets
};
export const PLAFOND_HEURES_MOIS_A8_MULTI = 250;
/** Heures d'enseignement retenues pour les 507 h (120 h à 50 ans et plus). */
export const PLAFOND_ENSEIGNEMENT = 70;
export const PLAFOND_ENSEIGNEMENT_50_ANS = 120;
/** Seuils de la formule : au-delà, la partie A (salaire) et la partie B (heures) progressent beaucoup moins. */
export const SEUIL_SR: Record<Annexe, number> = { A8: 14400, A10: 13700 };
export const SEUIL_NHT: Record<Annexe, number> = { A8: 720, A10: 690 };
/** Formation + enseignement retenus au plus pour 338 h (2/3 de 507 h). */
export const PLAFOND_FORMATION_ENSEIGNEMENT = 338;
/** Heures par jour d'arrêt assimilé (maladie longue, AT, maternité hors contrat). */
export const HEURES_PAR_JOUR_ARRET = 5;
/** Délai d'attente à chaque ouverture / réadmission (max 7 j par 12 mois). */
export const DELAI_ATTENTE = 7;
/** Franchise congés payés : 2,5 jours par 24 jours travaillés, plafonnée à 30 jours. */
export const FRANCHISE_CP_MAX = 30;
/** Franchise salaires : étalée sur les 8 premiers mois d'indemnisation. */
export const FRANCHISE_SAL_MOIS = 8;

/** Plafond mensuel de la sécurité sociale (PMSS) par année. */
export const PMSS: Record<number, number> = {
  2018: 3311,
  2019: 3377,
  2020: 3428,
  2021: 3428,
  2022: 3428,
  2023: 3666,
  2024: 3864,
  2025: 3925,
  2026: 4005,
};

/** Plafond de cumul mensuel salaires bruts + ARE brute = 118 % du PMSS. */
export function plafondCumul(annee: number): number {
  const annees = Object.keys(PMSS).map(Number);
  const a = Math.min(Math.max(annee, Math.min(...annees)), Math.max(...annees));
  return Math.round(PMSS[a] * 1.18 * 100) / 100;
}

/** SMIC horaire brut par date d'entrée en vigueur (ordre chronologique). */
export const SMIC_HORAIRE: { depuis: string; horaire: number }[] = [
  { depuis: '2022-01-01', horaire: 10.57 },
  { depuis: '2022-05-01', horaire: 10.85 },
  { depuis: '2022-08-01', horaire: 11.07 },
  { depuis: '2023-01-01', horaire: 11.27 },
  { depuis: '2023-05-01', horaire: 11.52 },
  { depuis: '2024-01-01', horaire: 11.65 },
  { depuis: '2024-11-01', horaire: 11.88 },
  { depuis: '2026-01-01', horaire: 12.02 },
  { depuis: '2026-06-01', horaire: 12.31 },
];

export interface Smic {
  horaire: number;
  /** 151,67 h */
  mensuel: number;
  /** 7 h */
  journalier: number;
}

/** SMIC en vigueur à une date donnée (valeur à la fin de la PRA pour la franchise salaires). */
export function smicAt(date: string | Date): Smic {
  const iso = typeof date === 'string' ? date : toISODate(date);
  let horaire = SMIC_HORAIRE[0].horaire;
  for (const s of SMIC_HORAIRE) {
    if (s.depuis <= iso) horaire = s.horaire;
  }
  return {
    horaire,
    mensuel: Math.round(horaire * 151.67 * 100) / 100,
    journalier: Math.round(horaire * 7 * 100) / 100,
  };
}

// ---------------------------------------------------------------------------
// Dates (sans surprise de fuseau horaire : tout en local)
// ---------------------------------------------------------------------------

export function parseDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function addMonths(d: Date, n: number): Date {
  const r = new Date(d.getFullYear(), d.getMonth() + n, 1);
  const lastDay = new Date(r.getFullYear(), r.getMonth() + 1, 0).getDate();
  r.setDate(Math.min(d.getDate(), lastDay));
  return r;
}

export function addDays(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

export function joursDansMois(annee: number, mois1a12: number): number {
  return new Date(annee, mois1a12, 0).getDate();
}

export function cleMois(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function formatDateFR(d: Date | string): string {
  const date = typeof d === 'string' ? parseDate(d) : d;
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
}

// ---------------------------------------------------------------------------
// Contrats
// ---------------------------------------------------------------------------

export function heuresContrat(c: Pick<Contrat, 'type' | 'nombre'> & Partial<Pick<Contrat, 'brut' | 'date'>>): number {
  switch (c.type) {
    case 'Cachet':
      return c.nombre * HEURES_PAR_CACHET;
    case 'Arret':
      return c.nombre * HEURES_PAR_JOUR_ARRET;
    case 'NonSalarie':
      return (c.brut ?? 0) / smicAt(c.date ?? toISODate(new Date())).horaire;
    default:
      return c.nombre;
  }
}

export function finContrat(c: Contrat): string {
  if (c.dateFin && c.dateFin >= c.date) return c.dateFin;
  // un arrêt sans date de fin dure `nombre` jours
  if (c.type === 'Arret' && c.nombre > 1) return toISODate(addDays(parseDate(c.date), Math.round(c.nombre) - 1));
  return c.date;
}

/** Jours d'un contrat (ou d'un arrêt) compris entre deux dates incluses. */
export function joursEntre(c: Contrat, debut: string, fin: string): number {
  const a = c.date > debut ? c.date : debut;
  const b = finContrat(c) < fin ? finContrat(c) : fin;
  return b >= a ? Math.round((parseDate(b).getTime() - parseDate(a).getTime()) / 86400000) + 1 : 0;
}

export interface PartMois {
  cle: string; // YYYY-MM
  annee: number;
  mois: number;
  heures: number;
  brut: number;
  cachets: number;
  employeur: string;
}

/**
 * Répartit un contrat sur les mois civils qu'il couvre, au prorata des jours
 * calendaires (un contrat sans dateFin est entièrement affecté à son mois).
 */
export function repartirContrat(c: Contrat): PartMois[] {
  const debut = parseDate(c.date);
  const fin = parseDate(finContrat(c));
  const totalJours = Math.max(1, Math.round((fin.getTime() - debut.getTime()) / 86400000) + 1);
  const heures = heuresContrat(c);
  const parts: PartMois[] = [];
  let cursor = new Date(debut.getFullYear(), debut.getMonth(), 1);
  while (cursor <= fin) {
    const y = cursor.getFullYear();
    const m = cursor.getMonth();
    const premier = new Date(y, m, 1);
    const dernier = new Date(y, m + 1, 0);
    const from = debut > premier ? debut : premier;
    const to = fin < dernier ? fin : dernier;
    const jours = Math.round((to.getTime() - from.getTime()) / 86400000) + 1;
    const ratio = jours / totalJours;
    parts.push({
      cle: cleMois(cursor),
      annee: y,
      mois: m + 1,
      heures: heures * ratio,
      brut: c.brut * ratio,
      cachets: c.type === 'Cachet' ? c.nombre * ratio : 0,
      employeur: c.employeur,
    });
    cursor = new Date(y, m + 1, 1);
  }
  return parts;
}

/** Agrège les contrats par mois civil (sans plafonnement). */
export function agregerParMois(
  contrats: Contrat[],
  filtre: (c: Contrat) => boolean = estActivite
): Map<string, PartMois & { employeurs: Set<string> }> {
  const map = new Map<string, PartMois & { employeurs: Set<string> }>();
  for (const c of contrats) {
    if (!filtre(c)) continue;
    for (const p of repartirContrat(c)) {
      const cur = map.get(p.cle);
      if (cur) {
        cur.heures += p.heures;
        cur.brut += p.brut;
        cur.cachets += p.cachets;
        if (p.employeur) cur.employeurs.add(p.employeur);
      } else {
        map.set(p.cle, { ...p, employeurs: new Set(p.employeur ? [p.employeur] : []) });
      }
    }
  }
  return map;
}

export interface PeriodeReference {
  /** Premier jour de la PRA (fin − 12 mois + 1 jour). */
  debut: string;
  /** Dernier jour de la PRA (fin du contrat de référence). */
  fin: string;
}

/**
 * Période de référence affiliation : 12 mois glissants qui précèdent la fin
 * du contrat de référence (ou, à défaut, la fin du contrat le plus récent).
 */
export function periodeReference(contrats: Contrat[], dateFinContrat?: string): PeriodeReference {
  let fin = dateFinContrat && dateFinContrat.length === 10 ? dateFinContrat : '';
  if (!fin) {
    // fin du dernier contrat du spectacle (un arrêt, une formation ou un emploi hors spectacle ne fixe pas la période)
    const spectacle = contrats.filter(estSpectacle);
    fin = (spectacle.length ? spectacle : contrats).reduce((max, c) => (finContrat(c) > max ? finContrat(c) : max), '');
  }
  if (!fin) fin = toISODate(new Date());
  const finDate = parseDate(fin);
  const debut = addDays(addMonths(finDate, -12), 1);
  return { debut: toISODate(debut), fin };
}

export interface Affiliation {
  periode: PeriodeReference;
  /** Contrats retenus (au moins partiellement) dans la PRA. */
  contrats: Contrat[];
  /** Heures travaillées retenues pour l'AJ (NHT), après plafonnement mensuel, hors enseignement. */
  nht: number;
  /** Heures avant plafonnement mensuel, hors enseignement. */
  heuresBrutes: number;
  /** Heures d'enseignement dans la PRA, et la part retenue pour les 507 h. */
  heuresEnseignement: number;
  heuresEnseignementRetenues: number;
  /** Heures comptées pour la condition des 507 h = NHT + enseignement retenu. */
  heuresAffiliation: number;
  /** Salaire de référence (SR) : bruts des contrats retenus, hors enseignement. */
  sr: number;
  /** SR avant aménagement pour arrêt (égal à sr sans arrêt). */
  srBrut: number;
  /** Salaires d'enseignement dans la PRA (hors SR, mais comptés pour la franchise salaires). */
  brutEnseignement: number;
  /** Salaires hors spectacle dans la PRA (régime général). */
  brutAutres: number;
  heuresFormation: number;
  heuresFormationRetenues: number;
  /** Arrêts assimilés : jours dans la PRA et heures retenues (5 h / jour). */
  heuresArret: number;
  joursArret: number;
  /** Heures spectacle par annexe, et annexe qui en a le plus (guide, exemple 3). */
  heuresParAnnexe: Record<Annexe, number>;
  annexeMajoritaire: Annexe;
  /** Jours de travail = NHT / 8 (A8) ou / 10 (A10). */
  joursTravail: number;
  eligible: boolean;
  heuresManquantes: number;
  /** Mois où le plafond d'heures a été appliqué. */
  moisPlafonnes: string[];
}

export interface OptionsAffiliation {
  /** 50 ans ou plus à la fin du contrat retenu : 120 h d'enseignement au lieu de 70. */
  plus50ans?: boolean;
  /**
   * Fin du contrat qui a ouvert le droit en cours : pour le réexamen, seules les heures
   * postérieures comptent (« seules sont retenues les heures n'ayant pas déjà été prises
   * en compte au titre d'une précédente ouverture de droits ou réadmission »).
   */
  apres?: string;
}

/** Part d'un contrat comprise entre deux dates (heures et salaire au prorata des jours). */
function rogner(c: Contrat, debut: string, fin: string): Contrat {
  const f = finContrat(c);
  if (c.date >= debut && f <= fin) return c;
  const total = joursEntre(c, c.date, f);
  const dedans = joursEntre(c, debut, fin);
  const r = total > 0 ? dedans / total : 0;
  return {
    ...c,
    date: c.date > debut ? c.date : debut,
    dateFin: f < fin ? f : fin,
    nombre: c.type === 'Arret' ? dedans : c.nombre * r,
    brut: c.brut * r,
  };
}

/**
 * Décompte des heures et des salaires dans la PRA, avec le plafond mensuel
 * (208 h / 250 h multi‑employeurs en annexe 8, 28 cachets en annexe 10).
 */
export function affiliation(
  contrats: Contrat[],
  annexe: Annexe,
  dateFinContrat?: string,
  options: OptionsAffiliation = {}
): Affiliation {
  const periode = periodeReference(contrats, dateFinContrat);
  if (options.apres && options.apres >= periode.debut) periode.debut = toISODate(addDays(parseDate(options.apres), 1));
  const retenus =
    periode.debut > periode.fin
      ? []
      : contrats.filter((c) => finContrat(c) >= periode.debut && c.date <= periode.fin).map((c) => rogner(c, periode.debut, periode.fin));
  const cleDebut = periode.debut.slice(0, 7);
  const cleFin = periode.fin.slice(0, 7);

  // On ne garde que la part des contrats située dans la PRA.
  const parMois = new Map<string, { heures: number; brut: number; employeurs: Set<string> }>();
  let heuresBrutes = 0;
  let sr = 0;
  let heuresEnseignement = 0;
  let brutEnseignement = 0;
  let heuresFormation = 0;
  let heuresArret = 0;
  let joursArret = 0;
  let brutAutres = 0;
  const heuresParAnnexe: Record<Annexe, number> = { A8: 0, A10: 0 };
  for (const c of retenus) {
    if (c.type === 'Arret') {
      const j = joursEntre(c, periode.debut, periode.fin);
      joursArret += j;
      heuresArret += j * HEURES_PAR_JOUR_ARRET;
      continue;
    }
    for (const p of repartirContrat(c)) {
      if (p.cle < cleDebut || p.cle > cleFin) continue;
      if (c.type === 'Enseignement') {
        heuresEnseignement += p.heures;
        brutEnseignement += p.brut;
        continue;
      }
      if (c.type === 'Formation') {
        heuresFormation += p.heures;
        continue;
      }
      if (!estSpectacle(c)) {
        if (c.type === 'RegimeGeneral') brutAutres += p.brut;
        continue;
      }
      heuresBrutes += p.heures;
      heuresParAnnexe[c.annexe ?? annexe] += p.heures;
      sr += p.brut;
      const cur = parMois.get(p.cle) ?? { heures: 0, brut: 0, employeurs: new Set<string>() };
      cur.heures += p.heures;
      cur.brut += p.brut;
      if (p.employeur) cur.employeurs.add(p.employeur);
      parMois.set(p.cle, cur);
    }
  }

  let nht = 0;
  const moisPlafonnes: string[] = [];
  for (const [cle, m] of parMois) {
    const plafond =
      annexe === 'A8'
        ? m.employeurs.size > 1
          ? PLAFOND_HEURES_MOIS_A8_MULTI
          : PLAFOND_HEURES_MOIS.A8
        : PLAFOND_HEURES_MOIS.A10;
    if (m.heures > plafond) moisPlafonnes.push(cle);
    nht += Math.min(m.heures, plafond);
  }
  // arrêts assimilés : comptent pour les 507 h et les NHT (guide p. 12)
  nht += heuresArret;

  const plafondEns = options.plus50ans ? PLAFOND_ENSEIGNEMENT_50_ANS : PLAFOND_ENSEIGNEMENT;
  const heuresEnseignementRetenues = Math.min(heuresEnseignement, plafondEns);
  const heuresFormationRetenues = Math.min(heuresFormation, Math.max(0, PLAFOND_FORMATION_ENSEIGNEMENT - heuresEnseignementRetenues));
  const heuresAffiliation = nht + heuresEnseignementRetenues + heuresFormationRetenues;
  // salaire de référence aménagé (SAR) quand un arrêt hors contrat est retenu (guide p. 12, exemple 7)
  const joursPRA = Math.round((parseDate(periode.fin).getTime() - parseDate(periode.debut).getTime()) / 86400000) + 1;
  const srBrut = sr;
  if (joursArret > 0 && joursArret < joursPRA) sr = (sr / (joursPRA - joursArret)) * joursPRA;
  const annexeMajoritaire: Annexe = heuresParAnnexe.A10 > heuresParAnnexe.A8 ? 'A10' : heuresParAnnexe.A8 > heuresParAnnexe.A10 ? 'A8' : annexe;
  const joursTravail = nht / DIVISEUR_JOUR[annexe];
  return {
    periode,
    contrats: retenus,
    nht,
    heuresBrutes,
    heuresEnseignement,
    heuresEnseignementRetenues,
    heuresAffiliation,
    sr,
    srBrut,
    brutEnseignement,
    brutAutres,
    heuresFormation,
    heuresFormationRetenues,
    heuresArret,
    joursArret,
    heuresParAnnexe,
    annexeMajoritaire,
    joursTravail,
    eligible: heuresAffiliation >= SEUIL_HEURES,
    heuresManquantes: Math.max(0, SEUIL_HEURES - heuresAffiliation),
    moisPlafonnes: moisPlafonnes.sort(),
  };
}

// ---------------------------------------------------------------------------
// Allocation journalière
// ---------------------------------------------------------------------------

export interface ParamsAJ {
  ajMin?: number;
  ajMax?: number;
}

export interface ResultatAJ {
  A: number;
  B: number;
  C: number;
  /** A + B + C avant plancher / plafond. */
  brutCalcule: number;
  plancher: number;
  plafond: number;
  /** AJ brute retenue. */
  aj: number;
  plancherApplique: boolean;
  plafondApplique: boolean;
}

/**
 * AJ = A + B + C (guide p. 11).
 *  A8 : A = AJmin × (0,42 × SR≤14 400 + 0,05 × SR>14 400) / 5000
 *       B = AJmin × (0,26 × NHT≤720 + 0,08 × NHT>720) / 507
 *       C = AJmin × 0,40
 *  A10 : A = AJmin × (0,36 × SR≤13 700 + 0,05 × SR>13 700) / 5000
 *        B = AJmin × (0,26 × NHT≤690 + 0,08 × NHT>690) / 507
 *        C = AJmin × 0,70
 */
export function calculAJ(annexe: Annexe, sr: number, nht: number, params: ParamsAJ = {}): ResultatAJ {
  const ajMin = params.ajMin ?? AJ_MIN;
  const ajMax = params.ajMax ?? AJ_MAX;
  const seuilSR = SEUIL_SR[annexe];
  const coefA = annexe === 'A8' ? 0.42 : 0.36;
  const seuilH = SEUIL_NHT[annexe];
  const coefC = annexe === 'A8' ? 0.4 : 0.7;

  const A = (ajMin * (coefA * Math.min(sr, seuilSR) + 0.05 * Math.max(0, sr - seuilSR))) / 5000;
  const B = (ajMin * (0.26 * Math.min(nht, seuilH) + 0.08 * Math.max(0, nht - seuilH))) / SEUIL_HEURES;
  const C = ajMin * coefC;
  const brutCalcule = A + B + C;
  const plancher = PLANCHER[annexe];
  const aj = Math.min(ajMax, Math.max(plancher, brutCalcule));
  return {
    A,
    B,
    C,
    brutCalcule,
    plancher,
    plafond: ajMax,
    aj,
    plancherApplique: brutCalcule < plancher,
    plafondApplique: brutCalcule > ajMax,
  };
}

/** Salaire journalier moyen : SR / (NHT / 8) en A8, SR / (NHT / 10) en A10. */
export function sjm(annexe: Annexe, sr: number, nht: number): number {
  const jours = nht / DIVISEUR_JOUR[annexe];
  return jours > 0 ? sr / jours : 0;
}

export interface Paliers {
  seuilSR: number;
  seuilNHT: number;
  /** Gain d'AJ brute pour 1 000 € de salaire en plus (au taux marginal actuel). */
  gainPour1000Euros: number;
  /** Gain d'AJ brute pour 10 h de plus (partie B seule). */
  gainPour10Heures: number;
  srAuDelaDuSeuil: boolean;
  nhtAuDelaDuSeuil: boolean;
}

/** Position par rapport aux seuils de la formule et gains marginaux. */
export function paliers(annexe: Annexe, sr: number, nht: number, ajMin = AJ_MIN): Paliers {
  const seuilSR = SEUIL_SR[annexe];
  const seuilNHT = SEUIL_NHT[annexe];
  const sansPlafond = { ajMin, ajMax: Infinity };
  return {
    seuilSR,
    seuilNHT,
    gainPour1000Euros: calculAJ(annexe, sr + 1000, nht, sansPlafond).A - calculAJ(annexe, sr, nht, sansPlafond).A,
    gainPour10Heures: calculAJ(annexe, sr, nht + 10, sansPlafond).B - calculAJ(annexe, sr, nht, sansPlafond).B,
    srAuDelaDuSeuil: sr >= seuilSR,
    nhtAuDelaDuSeuil: nht >= seuilNHT,
  };
}

/**
 * Heures à ajouter (à un taux horaire brut donné) pour que l'AJ calculée
 * atteigne une cible. null si inatteignable (plafond) ; 0 si déjà atteinte.
 */
export function heuresPourAJ(annexe: Annexe, sr: number, nht: number, cible: number, tauxHoraire: number): number | null {
  const aj = (h: number) => calculAJ(annexe, sr + h * tauxHoraire, nht + h).aj;
  if (aj(0) >= cible) return 0;
  if (cible > AJ_MAX || aj(100000) < cible) return null;
  let lo = 0;
  let hi = 100000;
  while (hi - lo > 1) {
    const mid = (lo + hi) / 2;
    if (aj(mid) >= cible) hi = mid;
    else lo = mid;
  }
  // plus petit nombre entier d'heures qui atteint la cible
  let h = Math.floor(lo);
  while (aj(h) < cible) h++;
  return h;
}

export interface RetenuesAJ {
  retraiteComplementaire: number;
  csgCrds: number;
  net: number;
}

/**
 * AJ nette (avant impôt) — guide p. 12 :
 *  - AJ ≤ 31,96 € : aucune retenue ;
 *  - 31,96 < AJ ≤ 60 € : participation retraite complémentaire = 0,93 % du SJM ;
 *  - AJ > 60 € : + CSG (6,2 % ou 3,8 %) et CRDS (0,5 %) sur 98,25 % de l'AJ.
 */
export function ajNette(ajBrute: number, sjmValeur: number, tauxCSG = 0.062): RetenuesAJ {
  if (ajBrute <= AJ_MIN) return { retraiteComplementaire: 0, csgCrds: 0, net: ajBrute };
  const retraiteComplementaire = 0.0093 * sjmValeur;
  const csgCrds = ajBrute > 60 ? ajBrute * 0.9825 * (tauxCSG + 0.005) : 0;
  const net = Math.max(0, ajBrute - retraiteComplementaire - csgCrds);
  return { retraiteComplementaire, csgCrds, net };
}

// ---------------------------------------------------------------------------
// Franchises et délai d'attente
// ---------------------------------------------------------------------------

export interface FranchiseCP {
  total: number;
  /** Forfait mensuel : 2 j si total ≤ 24, sinon 3 j. */
  forfaitMensuel: number;
}

/** Franchise congés payés = ⌊jours travaillés × 2,5 / 24⌋, plafonnée à 30 (exemple 10 : 176 j → 18 j). */
export function franchiseCP(joursTravailles: number): FranchiseCP {
  const total = Math.min(FRANCHISE_CP_MAX, Math.floor((joursTravailles * 2.5) / 24));
  return { total, forfaitMensuel: total <= 24 ? 2 : 3 };
}

export interface FranchiseSalaires {
  total: number;
  /** Forfait mensuel = ⌈total / min(8, nb mois d'indemnisation)⌉. */
  mensuelle: number;
}

/**
 * Franchise salaires = ⌊(SR / SMIC mensuel) × (SJM / (3 × SMIC journalier))⌋ − 27, jamais négative.
 * Étalée sur les 8 premiers mois (exemple 11 : 32 j sur 9 mois → 4 j/mois ; sur 6 mois → 6 j/mois).
 */
export function franchiseSalaires(
  sr: number,
  sjmValeur: number,
  smic: Smic,
  nbMoisIndemnisation = 12
): FranchiseSalaires {
  const brut = (sr / smic.mensuel) * (sjmValeur / (3 * smic.journalier)) - 27;
  const total = Math.max(0, Math.floor(brut));
  const mois = Math.max(1, Math.min(FRANCHISE_SAL_MOIS, nbMoisIndemnisation));
  return { total, mensuelle: total > 0 ? Math.ceil(total / mois) : 0 };
}

/** Répartition mensuelle d'une franchise salaires (utile pour l'affichage). */
export function repartitionFranchiseSalaires(f: FranchiseSalaires): number[] {
  const out: number[] = [];
  let reste = f.total;
  while (reste > 0) {
    const m = Math.min(f.mensuelle, reste);
    out.push(m);
    reste -= m;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Cumul ARE + activité dans le mois
// ---------------------------------------------------------------------------

export interface ActiviteMois {
  joursTravail: number;
  /** ⌊jours de travail × 1,4 (A8) ou × 1,3 (A10)⌋ */
  joursNonIndemnisables: number;
  seuilAtteint: boolean;
}

/** Exemple 12 : 80 h en A8 → 10 j de travail, 14 j non indemnisables ; flyer : 24 h → 4 j. */
export function activiteMois(annexe: Annexe, heures: number): ActiviteMois {
  const joursTravail = heures / DIVISEUR_JOUR[annexe];
  const seuilAtteint = joursTravail >= SEUIL_JOURS_TRAVAIL[annexe];
  const joursNonIndemnisables = Math.floor(joursTravail * COEF_NON_INDEMNISABLE[annexe] + 1e-9);
  return { joursTravail, joursNonIndemnisables, seuilAtteint };
}

/**
 * Heures qu'on peut encore travailler dans le mois avant qu'un jour
 * supplémentaire devienne non indemnisable (ex. A8 : 42 h → 7 j ; 8 j à partir de 45,72 h).
 */
export function margeAvantJourPerdu(annexe: Annexe, heures: number): number {
  const { joursNonIndemnisables } = activiteMois(annexe, heures);
  const prochain = ((joursNonIndemnisables + 1) * DIVISEUR_JOUR[annexe]) / COEF_NON_INDEMNISABLE[annexe];
  return Math.max(0, prochain - heures);
}

// ---------------------------------------------------------------------------
// Suivi mensuel
// ---------------------------------------------------------------------------

export interface ParamsSuivi {
  annexe: Annexe;
  contrats: Contrat[];
  /** AJ brute (notifiée ou calculée). */
  ajBrute: number;
  /** Ratio AJ nette / AJ brute (avant impôt). */
  ratioNetAJ: number;
  /** Taux de prélèvement à la source, en %. */
  tauxPrelevement: number;
  /** Ratio net / brut des salaires (ex. 0,78). */
  ratioNetSalaire: number;
  /** Premier mois affiché (YYYY-MM-DD, seul le mois compte). */
  dateDebut: string;
  /** Premier jour indemnisable (début du droit). */
  dateIndem?: string;
  /** Fin du droit (date anniversaire) — plus aucun jour indemnisable après. */
  dateFinDroit?: string;
  delaiAttente: boolean;
  franchiseCP: FranchiseCP;
  franchiseSal: FranchiseSalaires;
  nbMois?: number;
}

export interface MoisSuivi {
  cle: string;
  label: string;
  annee: number;
  mois: number;
  joursDansMois: number;
  /** Jours hors période de droit (avant début / après fin). */
  joursHorsDroit: number;
  /** Jours d'arrêt (maladie, maternité…) dans le droit : pas d'ARE ces jours-là. */
  joursArret: number;
  heures: number;
  brut: number;
  net: number;
  joursTravail: number;
  joursNonIndemnisables: number;
  seuilAtteint: boolean;
  /** Heures encore possibles avant de perdre un jour d'ARE de plus. */
  margeHeures: number;
  delaiAttente: number;
  franchiseCP: number;
  franchiseSal: number;
  /** Jours indemnisables après activité, avant délai et franchises. */
  joursIndemnisablesAvantFranchises: number;
  joursIndemnises: number;
  areBrute: number;
  areNette: number;
  /** Net après prélèvement à la source. */
  areVersee: number;
  plafondCumul: number;
  plafondApplique: boolean;
  totalNet: number;
}

export interface ResultatSuivi {
  mois: MoisSuivi[];
  totaux: {
    heures: number;
    brut: number;
    net: number;
    joursTravail: number;
    joursIndemnises: number;
    delaiAttente: number;
    franchiseCP: number;
    franchiseSal: number;
    areBrute: number;
    areNette: number;
    areVersee: number;
    totalNet: number;
  };
  franchiseCPRestante: number;
  franchiseSalRestante: number;
}

/**
 * Déroulé mois par mois (guide p. 16-17) :
 *  1. jours inscrits dans le mois (hors période de droit exclus) ;
 *  2. activité : seuil de jours de travail (26 / 27) → 0 ARE ; sinon jours non indemnisables ;
 *  3. déductions dans l'ordre : délai d'attente, forfait CP, forfait salaires, reliquat CP, reliquat salaires ;
 *  4. ARE = jours indemnisés × AJ brute ;
 *  5. plafond de cumul 118 % PMSS ; jours recalculés = ⌈nouvelle ARE / AJ⌉.
 */
export function suiviMensuel(p: ParamsSuivi): ResultatSuivi {
  const nbMois = p.nbMois ?? 12;
  const parMois = agregerParMois(p.contrats);
  const debut = parseDate(p.dateDebut);
  const dateIndem = p.dateIndem ? parseDate(p.dateIndem) : null;
  const dateFinDroit = p.dateFinDroit ? parseDate(p.dateFinDroit) : null;

  let resteDelai = p.delaiAttente ? DELAI_ATTENTE : 0;
  let resteCP = p.franchiseCP.total;
  let resteSal = p.franchiseSal.total;
  let reportCP = 0;
  let reportSal = 0;

  const mois: MoisSuivi[] = [];
  for (let i = 0; i < nbMois; i++) {
    const d = new Date(debut.getFullYear(), debut.getMonth() + i, 1);
    const annee = d.getFullYear();
    const m = d.getMonth() + 1;
    const cle = cleMois(d);
    const jdm = joursDansMois(annee, m);
    const premier = new Date(annee, m - 1, 1);
    const dernier = new Date(annee, m, 0);

    // 1. Jours du mois situés dans la période de droit [dateIndem, dateFinDroit]
    const from = dateIndem && dateIndem > premier ? dateIndem : premier;
    const to = dateFinDroit && dateFinDroit < dernier ? dateFinDroit : dernier;
    let joursInscrits = to >= from ? Math.round((to.getTime() - from.getTime()) / 86400000) + 1 : 0;
    // jours d'arrêt (maladie, maternité…) : indemnisés par la Sécurité sociale, pas par l'ARE
    const joursArret =
      joursInscrits > 0
        ? Math.min(
            joursInscrits,
            p.contrats.filter((c) => c.type === 'Arret').reduce((a, c) => a + joursEntre(c, toISODate(from), toISODate(to)), 0)
          )
        : 0;
    joursInscrits -= joursArret;
    const joursHorsDroit = jdm - joursInscrits - joursArret;

    // 2. Activité du mois
    const agg = parMois.get(cle);
    const heures = agg?.heures ?? 0;
    const brut = agg?.brut ?? 0;
    const net = brut * p.ratioNetSalaire;
    const act = activiteMois(p.annexe, heures);

    let dispo = act.seuilAtteint ? 0 : Math.max(0, joursInscrits - act.joursNonIndemnisables);
    const joursIndemnisablesAvantFranchises = dispo;

    // 3. Déductions, uniquement sur des jours indemnisables
    let delai = 0;
    let fcp = 0;
    let fsal = 0;
    if (joursInscrits > 0) {
      delai = Math.min(resteDelai, dispo);
      resteDelai -= delai;
      dispo -= delai;

      // forfait CP du mois (+ reliquat reporté), dans la limite du total restant
      const forfaitCP = Math.min(resteCP, p.franchiseCP.forfaitMensuel);
      const cpMois = Math.min(forfaitCP, dispo);
      dispo -= cpMois;

      const forfaitSal = Math.min(resteSal, p.franchiseSal.mensuelle);
      const salMois = Math.min(forfaitSal, dispo);
      dispo -= salMois;

      const reliquatCP = Math.min(reportCP, resteCP - forfaitCP);
      const cpReliquat = Math.min(reliquatCP, dispo);
      dispo -= cpReliquat;

      const reliquatSal = Math.min(reportSal, resteSal - forfaitSal);
      const salReliquat = Math.min(reliquatSal, dispo);
      dispo -= salReliquat;

      fcp = cpMois + cpReliquat;
      fsal = salMois + salReliquat;
      // le forfait non appliqué s'ajoute au mois suivant
      reportCP = reportCP + forfaitCP - fcp;
      reportSal = reportSal + forfaitSal - fsal;
      resteCP -= fcp;
      resteSal -= fsal;
    }

    // 4. ARE du mois
    let joursIndemnises = dispo;
    let areBrute = joursIndemnises * p.ajBrute;

    // 5. Plafond de cumul
    const plafond = plafondCumul(annee);
    let plafondApplique = false;
    if (joursIndemnises > 0 && brut + areBrute > plafond) {
      plafondApplique = true;
      if (brut >= plafond) {
        areBrute = 0;
        joursIndemnises = 0;
      } else {
        areBrute = plafond - brut;
        joursIndemnises = p.ajBrute > 0 ? Math.ceil(areBrute / p.ajBrute - 1e-9) : 0;
      }
    }

    const areNette = areBrute * p.ratioNetAJ;
    const areVersee = areNette * (1 - p.tauxPrelevement / 100);

    mois.push({
      cle,
      label: `${String(m).padStart(2, '0')}/${annee}`,
      annee,
      mois: m,
      joursDansMois: jdm,
      joursHorsDroit,
      joursArret,
      heures,
      brut,
      net,
      joursTravail: act.joursTravail,
      joursNonIndemnisables: act.joursNonIndemnisables,
      seuilAtteint: act.seuilAtteint,
      margeHeures: margeAvantJourPerdu(p.annexe, heures),
      delaiAttente: delai,
      franchiseCP: fcp,
      franchiseSal: fsal,
      joursIndemnisablesAvantFranchises,
      joursIndemnises,
      areBrute,
      areNette,
      areVersee,
      plafondCumul: plafond,
      plafondApplique,
      totalNet: net + areVersee,
    });
  }

  const sum = (f: (m: MoisSuivi) => number) => mois.reduce((a, m) => a + f(m), 0);
  return {
    mois,
    totaux: {
      heures: sum((m) => m.heures),
      brut: sum((m) => m.brut),
      net: sum((m) => m.net),
      joursTravail: sum((m) => m.joursTravail),
      joursIndemnises: sum((m) => m.joursIndemnises),
      delaiAttente: sum((m) => m.delaiAttente),
      franchiseCP: sum((m) => m.franchiseCP),
      franchiseSal: sum((m) => m.franchiseSal),
      areBrute: sum((m) => m.areBrute),
      areNette: sum((m) => m.areNette),
      areVersee: sum((m) => m.areVersee),
      totalNet: sum((m) => m.totalNet),
    },
    franchiseCPRestante: resteCP,
    franchiseSalRestante: resteSal,
  };
}

// ---------------------------------------------------------------------------
// Projection avant éligibilité
// ---------------------------------------------------------------------------

export interface Projection {
  heuresManquantes: number;
  moyenneHeuresParMois: number;
  moisEstimes: number | null;
  dateEstimee: string | null;
}

/** Estimation du délai avant 507 h à partir de la moyenne des 3 derniers mois travaillés. */
export function projectionEligibilite(contrats: Contrat[], heuresManquantes: number, depuis = new Date()): Projection {
  const parMois = [...agregerParMois(contrats, estSpectacle).values()].sort((a, b) => a.cle.localeCompare(b.cle));
  const derniers = parMois.slice(-3);
  const moyenne = derniers.length ? derniers.reduce((a, m) => a + m.heures, 0) / derniers.length : 0;
  if (heuresManquantes <= 0) return { heuresManquantes: 0, moyenneHeuresParMois: moyenne, moisEstimes: 0, dateEstimee: null };
  if (moyenne <= 0) return { heuresManquantes, moyenneHeuresParMois: 0, moisEstimes: null, dateEstimee: null };
  const moisEstimes = Math.ceil(heuresManquantes / moyenne);
  return { heuresManquantes, moyenneHeuresParMois: moyenne, moisEstimes, dateEstimee: toISODate(addMonths(depuis, moisEstimes)) };
}

export function arrondi(n: number, dec = 2): number {
  const f = 10 ** dec;
  return Math.round(n * f) / f;
}

export function euros(n: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
}

// ---------------------------------------------------------------------------
// Date anniversaire et examen des nouveaux droits (guide p. 9 et 18, exemple 13)
// ---------------------------------------------------------------------------

/** Date anniversaire = 12 mois (365 jours) après la fin du contrat qui a ouvert le droit. */
export function dateAnniversaireDepuis(finContratOuverture: string): string {
  return toISODate(addDays(parseDate(finContratOuverture), 365));
}

export interface ExamenAnniversaire {
  /** Un contrat spectacle est en cours le jour de la date anniversaire. */
  reporte: boolean;
  /** Jour de l'examen : lendemain de la date anniversaire, ou premier jour sans contrat A8/A10. */
  dateExamen: string;
  /** Fin de contrat qui fixe le terme de la nouvelle période de référence. */
  finContratRetenue: string | null;
  /** Contrats spectacle en cours le jour de la date anniversaire (et ceux qui les prolongent sans jour chômé). */
  contratsEnCours: Contrat[];
}

/**
 * Examen à la date anniversaire : au lendemain si aucun contrat spectacle n'est
 * en cours ce jour-là ; sinon au premier jour chômé qui suit (les contrats hors
 * spectacle et l'activité non salariée ne reportent pas l'examen).
 */
export function examenAnniversaire(contrats: Contrat[], dateAnniversaire: string, apres?: string): ExamenAnniversaire {
  const spectacle = contrats.filter(estSpectacle);
  const couvre = (jour: string) => spectacle.filter((c) => c.date <= jour && finContrat(c) >= jour);
  const enCours = couvre(dateAnniversaire);
  if (enCours.length === 0) {
    // une nouvelle fin de contrat, postérieure à celle qui a ouvert le droit en cours
    const avant = spectacle.map(finContrat).filter((f) => f <= dateAnniversaire && (!apres || f > apres));
    return {
      reporte: false,
      dateExamen: toISODate(addDays(parseDate(dateAnniversaire), 1)),
      finContratRetenue: avant.length ? avant.sort().slice(-1)[0] : null,
      contratsEnCours: [],
    };
  }
  const chaine = new Map(enCours.map((c) => [c.id, c]));
  let jour = parseDate(dateAnniversaire);
  for (let i = 0; i < 400; i++) {
    const suivant = toISODate(addDays(jour, 1));
    const actifs = couvre(suivant);
    if (actifs.length === 0) break;
    actifs.forEach((c) => chaine.set(c.id, c));
    jour = addDays(jour, 1);
  }
  const finChaine = toISODate(jour);
  return {
    reporte: true,
    dateExamen: toISODate(addDays(jour, 1)),
    finContratRetenue: finChaine,
    contratsEnCours: [...chaine.values()].sort((a, b) => a.date.localeCompare(b.date)),
  };
}
