import type { TypeContrat } from './calculs';

export type ToneType = 'brand' | 'blue' | 'green' | 'amber' | 'neutral' | 'lime' | 'red';

/** Libellés et comportement de saisie de chaque type de ligne. */
export const TYPES: Record<
  TypeContrat,
  { label: string; court: string; tone: ToneType; unite: string; aBrut: boolean; aNombre: boolean; groupe: string; aide: string }
> = {
  Heures: { label: 'Heures (spectacle)', court: 'Heures', tone: 'brand', unite: 'h', aBrut: true, aNombre: true, groupe: 'Spectacle', aide: 'Contrat en annexe 8 ou 10 payé à l’heure.' },
  Cachet: { label: 'Cachets (spectacle)', court: 'Cachets', tone: 'lime', unite: 'cachets', aBrut: true, aNombre: true, groupe: 'Spectacle', aide: '1 cachet = 12 h, quelle que soit sa durée.' },
  Enseignement: {
    label: 'Enseignement',
    court: 'Cours',
    tone: 'green',
    unite: 'h',
    aBrut: true,
    aNombre: true,
    groupe: 'Autres activités',
    aide: 'Cours en établissement agréé : comptent pour les 507 h (70 h max), pas pour l’AJ. Réduisent l’ARE du mois.',
  },
  RegimeGeneral: {
    label: 'Salarié hors spectacle',
    court: 'Hors spectacle',
    tone: 'blue',
    unite: 'h',
    aBrut: true,
    aNombre: true,
    groupe: 'Autres activités',
    aide: 'CDD ou CDI hors annexes 8 et 10 : réduit l’ARE du mois, ne compte pas pour les 507 h.',
  },
  NonSalarie: {
    label: 'Non salarié (auto-entreprise…)',
    court: 'Non salarié',
    tone: 'blue',
    unite: 'h',
    aBrut: true,
    aNombre: false,
    groupe: 'Autres activités',
    aide: 'Saisissez le revenu brut du mois : heures = revenu ÷ SMIC horaire. Réduit l’ARE du mois.',
  },
  Arret: {
    label: 'Arrêt maladie / AT / maternité',
    court: 'Arrêt / maladie',
    tone: 'amber',
    unite: 'jours',
    aBrut: false,
    aNombre: true,
    groupe: 'Périodes assimilées',
    aide: 'Hors contrat : 5 h par jour pour les 507 h et l’AJ, salaire de référence recalculé. Pas d’ARE ces jours-là.',
  },
  Formation: {
    label: 'Formation (Afdas…)',
    court: 'Formation',
    tone: 'neutral',
    unite: 'h',
    aBrut: false,
    aNombre: true,
    groupe: 'Périodes assimilées',
    aide: 'Formation non payée par France Travail : compte pour les 507 h (avec les cours, 338 h max). Ne réduit pas l’ARE.',
  },
};

export const GROUPES = ['Spectacle', 'Autres activités', 'Périodes assimilées'];
