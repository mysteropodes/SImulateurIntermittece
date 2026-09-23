/** Définitions courtes affichées dans les infobulles ⓘ. */
export const GLOSSAIRE = {
  aj: "Allocation journalière : ce que France Travail vous verse par jour indemnisé, avant retenues. Elle est calculée une fois, à l'ouverture du droit, et reste fixe jusqu'à la date anniversaire.",
  ajNette:
    "AJ après retenues sociales : 0,93 % du salaire journalier moyen pour la retraite complémentaire, puis CSG et CRDS si l'AJ dépasse 60 €. L'impôt à la source est retiré ensuite.",
  abc: "AJ = A + B + C. A dépend de vos salaires, B de vos heures, C est une part fixe. Au-delà de 14 400 € (A) et de 720 h (B) en annexe 8, chaque euro ou heure en plus compte beaucoup moins.",
  pra: "Période de référence : les 12 mois glissants avant la fin de votre dernier contrat. C'est là que France Travail cherche vos 507 heures et prend vos salaires.",
  h507: "Pour ouvrir ou renouveler un droit, il faut 507 heures dans la période de référence. 1 cachet = 12 h. Les cours donnés comptent jusqu'à 70 h (120 h à 50 ans et plus).",
  nht: "Nombre d'heures travaillées retenues pour calculer l'AJ (partie B), après le plafond de 208 h par mois (250 h avec plusieurs employeurs) en annexe 8, ou 28 cachets en annexe 10. Les cours n'y comptent pas.",
  sr: "Salaire de référence : total de vos salaires bruts spectacle dans la période de référence (hors enseignement). Il fait la partie A de l'AJ.",
  sjm: "Salaire journalier moyen = salaire de référence ÷ (heures ÷ 8) en annexe 8, ÷ (heures ÷ 10) en annexe 10. Il sert pour la retenue retraite et la franchise salaires.",
  dateAnniversaire:
    "Fin du droit, 12 mois après son ouverture. France Travail réexamine alors vos heures : 507 h pour repartir sur un nouveau droit, sinon clause de rattrapage ou allocations de solidarité.",
  jni: "Jours non indemnisables : les mois où vous travaillez, on retire (heures ÷ 8) × 1,4 jours en annexe 8, ou (heures ÷ 10) × 1,3 en annexe 10, arrondi à l'entier inférieur. Peu importe la durée réelle des journées.",
  marge: "Heures que vous pouvez encore travailler ce mois-ci avant qu'un jour d'ARE de plus ne saute. En annexe 8, un jour saute toutes les 5,71 h environ.",
  seuil: "Au-delà de 26 jours de travail (annexe 8) ou 27 (annexe 10) dans le mois, soit 208 h ou 270 h, aucune ARE n'est versée ce mois-là.",
  delai: "7 jours non payés au début de chaque nouveau droit, au plus une fois par période de 12 mois.",
  franchiseCP:
    "Jours de congés payés déjà indemnisés par les Congés Spectacles pendant la période de référence : 2,5 jours par 24 jours travaillés, 30 jours maximum, retirés à raison de 2 ou 3 jours par mois.",
  franchiseSal:
    "Retenue pour les hauts salaires : (salaires ÷ SMIC mensuel) × (SJM ÷ 3 SMIC journaliers) − 27 jours, étalée sur les 8 premiers mois. Nulle pour la plupart des intermittents.",
  plafondCumul:
    "Salaires bruts + ARE brute du mois ne peuvent pas dépasser 118 % du plafond de la Sécurité sociale (4 725,90 € en 2026). Au-delà, l'ARE est réduite.",
  enseignement:
    "Cours donnés dans un établissement agréé (écoles, conservatoires, universités, organismes Afdas…). Ils comptent pour les 507 h, mais ni leurs heures ni leur salaire n'entrent dans le calcul de l'AJ.",
  rattrapage:
    "Si vous avez entre 338 et 506 h à la date anniversaire et 5 ans d'intermittence (5 ouvertures de droits ou 2 535 h en 10 ans), vous gardez votre AJ jusqu'à 6 mois pour compléter vos heures. À demander dans les 30 jours.",
  aps: "Allocation de professionnalisation et de solidarité, financée par l'État. Même montant que l'ARE, pendant 12 mois, si vous justifiez 507 h (avec des assimilations plus larges : cours jusqu'à 120 h, maladie de plus de 3 mois…) sans pouvoir être réadmis à l'ARE.",
  afd: "Allocation de fin de droits : 30 € nets par jour pendant 61, 92 ou 182 jours selon votre ancienneté (moins de 5 ans, 5 ans, 10 ans). 1, 2 ou 3 fois au maximum.",
  sauvegarde:
    "Si vous avez alterné spectacle et autres métiers sans remplir aucune règle, 182 jours à l'AJ minimale (31,96 €), si vous avez 130 jours ou 910 h tous régimes sur 28 mois (36 à partir de 53 ans).",
  ij: "Indemnités journalières de la Sécurité sociale pendant le congé : salaires des 12 mois civils précédents ÷ 365, moins 21 % forfaitaires. Plafond 2026 : 104,02 € par jour.",
  maternite:
    "Le congé maternité hors contrat compte 5 h par jour pour les 507 h, et votre salaire de référence est recalculé comme si vous aviez travaillé normalement : votre prochaine AJ n'est pas pénalisée.",
  congesSpectacles:
    "Vos employeurs cotisent à la Caisse des Congés Spectacles (Audiens). Chaque année vous touchez 10 % des salaires bruts spectacle du 1er avril au 31 mars, à demander à partir de mi-avril, payés dès le 1er mai.",
  audiens:
    "Audiens gère la protection sociale des intermittents : complémentaire santé (Garantie santé intermittents), prévoyance, Congés Spectacles, retraite complémentaire, et un accompagnement social en cas de difficulté.",
} as const;

export type TermeGlossaire = keyof typeof GLOSSAIRE;
