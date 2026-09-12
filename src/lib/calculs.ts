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
export type TypeContrat = 'Cachet' | 'Heures';

export interface Contrat {
  id: string;
  date: string; // début (YYYY-MM-DD)
  dateFin?: string; // fin (YYYY-MM-DD) — optionnel, = date si absent
  employeur: string;
  type: TypeContrat;
  nombre: number;
  brut: number;
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

export function heuresContrat(c: Pick<Contrat, 'type' | 'nombre'>): number {
  return c.type === 'Cachet' ? c.nombre * HEURES_PAR_CACHET : c.nombre;
}

export function finContrat(c: Contrat): string {
  return c.dateFin && c.dateFin >= c.date ? c.dateFin : c.date;
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
export function agregerParMois(contrats: Contrat[]): Map<string, PartMois & { employeurs: Set<string> }> {
  const map = new Map<string, PartMois & { employeurs: Set<string> }>();
  for (const c of contrats) {
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
    fin = contrats.reduce((max, c) => (finContrat(c) > max ? finContrat(c) : max), '');
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
  /** Heures travaillées retenues (NHT), après plafonnement mensuel. */
  nht: number;
  /** Heures avant plafonnement mensuel. */
  heuresBrutes: number;
  /** Salaire de référence (SR) : bruts des contrats retenus. */
  sr: number;
  /** Jours de travail = NHT / 8 (A8) ou / 10 (A10). */
  joursTravail: number;
  eligible: boolean;
  heuresManquantes: number;
  /** Mois où le plafond d'heures a été appliqué. */
  moisPlafonnes: string[];
}

/**
 * Décompte des heures et des salaires dans la PRA, avec le plafond mensuel
 * (208 h / 250 h multi‑employeurs en annexe 8, 28 cachets en annexe 10).
 */
export function affiliation(contrats: Contrat[], annexe: Annexe, dateFinContrat?: string): Affiliation {
  const periode = periodeReference(contrats, dateFinContrat);
  const retenus = contrats.filter((c) => finContrat(c) >= periode.debut && c.date <= periode.fin);

  // On ne garde que la part des contrats située dans la PRA.
  const parMois = new Map<string, { heures: number; brut: number; employeurs: Set<string> }>();
  let heuresBrutes = 0;
  let sr = 0;
  for (const c of retenus) {
    for (const p of repartirContrat(c)) {
      const cleDebut = periode.debut.slice(0, 7);
      const cleFin = periode.fin.slice(0, 7);
      if (p.cle < cleDebut || p.cle > cleFin) continue;
      heuresBrutes += p.heures;
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

  const joursTravail = nht / DIVISEUR_JOUR[annexe];
  return {
    periode,
    contrats: retenus,
    nht,
    heuresBrutes,
    sr,
    joursTravail,
    eligible: nht >= SEUIL_HEURES,
    heuresManquantes: Math.max(0, SEUIL_HEURES - nht),
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
  const seuilSR = annexe === 'A8' ? 14400 : 13700;
  const coefA = annexe === 'A8' ? 0.42 : 0.36;
  const seuilH = annexe === 'A8' ? 720 : 690;
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
  heures: number;
  brut: number;
  net: number;
  joursTravail: number;
  joursNonIndemnisables: number;
  seuilAtteint: boolean;
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
    const joursInscrits = to >= from ? Math.round((to.getTime() - from.getTime()) / 86400000) + 1 : 0;
    const joursHorsDroit = jdm - joursInscrits;

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
      heures,
      brut,
      net,
      joursTravail: act.joursTravail,
      joursNonIndemnisables: act.joursNonIndemnisables,
      seuilAtteint: act.seuilAtteint,
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
  const parMois = [...agregerParMois(contrats).values()].sort((a, b) => a.cle.localeCompare(b.cle));
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
