/**
 * Trimestres de retraite validés par année civile (régime général).
 * - 1 trimestre par tranche de 150 × SMIC horaire au 1er janvier de salaire brut
 *   (1 803 € en 2026), 4 au maximum ;
 * - 1 trimestre assimilé par 50 jours de chômage indemnisé.
 * Sources : service-public.gouv.fr (F1761), L'Assurance retraite « Chômage et retraite ».
 */
import { type Contrat, estSalaire, repartirContrat, smicAt } from './calculs';

export const HEURES_SMIC_PAR_TRIMESTRE = 150;
export const JOURS_CHOMAGE_PAR_TRIMESTRE = 50;

export interface AnneeRetraite {
  annee: number;
  salaires: number;
  seuilTrimestre: number;
  trimestresSalaires: number;
  joursIndemnises: number;
  trimestresChomage: number;
  total: number;
  /** Salaire manquant pour le trimestre suivant (si < 4). */
  manquePourSuivant: number | null;
}

export function trimestresRetraite(contrats: Contrat[], joursIndemnisesParMois: { cle: string; jours: number }[]): AnneeRetraite[] {
  const salaires = new Map<number, number>();
  for (const c of contrats) {
    if (!estSalaire(c)) continue;
    for (const p of repartirContrat(c)) salaires.set(p.annee, (salaires.get(p.annee) ?? 0) + p.brut);
  }
  const chomage = new Map<number, number>();
  for (const m of joursIndemnisesParMois) {
    const y = Number(m.cle.slice(0, 4));
    chomage.set(y, (chomage.get(y) ?? 0) + m.jours);
  }
  const annees = [...new Set([...salaires.keys(), ...chomage.keys()])]
    .filter((y) => (salaires.get(y) ?? 0) > 0 || (chomage.get(y) ?? 0) > 0)
    .sort();
  return annees.map((annee) => {
    const s = salaires.get(annee) ?? 0;
    const seuil = Math.round(HEURES_SMIC_PAR_TRIMESTRE * smicAt(`${annee}-01-01`).horaire * 100) / 100;
    const trimestresSalaires = Math.min(4, Math.floor(s / seuil));
    const joursIndemnises = chomage.get(annee) ?? 0;
    const trimestresChomage = Math.floor(joursIndemnises / JOURS_CHOMAGE_PAR_TRIMESTRE);
    const total = Math.min(4, trimestresSalaires + trimestresChomage);
    return {
      annee,
      salaires: s,
      seuilTrimestre: seuil,
      trimestresSalaires,
      joursIndemnises,
      trimestresChomage,
      total,
      manquePourSuivant: trimestresSalaires < 4 ? (trimestresSalaires + 1) * seuil - s : null,
    };
  });
}
