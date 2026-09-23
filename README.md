# Simulateur d'Intermittence du Spectacle

Application web pour les intermittents du spectacle (annexes 8 et 10) : saisissez vos contrats, et le simulateur calcule votre
période de référence, votre allocation journalière, vos franchises et ce que vous toucherez mois par mois — avec les règles
officielles de France Travail.

**Application en ligne : [mysteropodes.github.io/SImulateurIntermittece](https://mysteropodes.github.io/SImulateurIntermittece/)**

Installable sur téléphone (« Ajouter à l'écran d'accueil ») et utilisable hors connexion. Au premier lancement, des données
d'exemple fictives sont affichées : un bandeau sur l'accueil propose de les réinitialiser ou d'importer votre fichier.

## Fonctionnalités

**Votre droit**

- **Synthèse** : AJ brute et nette, heures sur 12 mois, ARE du mois, date anniversaire, détail A + B + C, et un panneau
  **Paliers et leviers** (position par rapport aux seuils de la formule, gain par 1 000 € ou 10 h, heures nécessaires pour viser une AJ)
- **Contrats** : cachets, heures, enseignement, salarié hors spectacle, non salarié, arrêt (maladie, accident du travail,
  maternité), formation ; regroupés par mois avec les jours non indemnisables et la marge ; contrats en annexe 8 et 10 mélangés
- **Mon droit** : annexe, dates du droit, délai d'attente, AJ de la notification, franchises calculées ou saisies, prélèvement à la source
- **Historique** : AJ de chaque droit passé, écarts d'une date anniversaire à l'autre, projection de la prochaine

**Chaque mois**

- **Suivi mensuel** : graphique et tableau (jours non indemnisables, délai, franchises, plafond de cumul, ARE versée) avec la
  **marge** : heures possibles avant de perdre un jour d'ARE
- **Actualisation** : le récapitulatif à déclarer à France Travail (heures et brut par employeur, arrêts, formations), à copier en un clic
- **Échéances** : actualisation, vérification des contrats, réexamen, rattrapage, Congés Spectacles, exportables dans votre agenda (.ics)
- **Date anniversaire** : alerte si un contrat spectacle tombe ce jour-là (l'examen est reporté et la date suivante recule),
  avec la comparaison chiffrée des deux cas

**Au-delà de l'ARE** (onglet Mes droits)

- Si je perds l'intermittence : clause de rattrapage, APS, AFD, clause de sauvegarde, régime général, RSA
- Maternité / paternité : indemnités journalières, heures assimilées, salaire de référence aménagé
- Congés Spectacles (10 % par période), retraite (trimestres validés), Audiens (garantie santé)
- Aide et recours gratuits : réclamation et médiateur France Travail, inspection du travail et prud'hommes, permanences

**Et aussi** : tableau de bord et frise du droit, export Excel, infobulles ⓘ sur tous les termes techniques, interface responsive.

## Règles appliquées

Toute la logique est dans [`src/lib`](src/lib) (`calculs.ts`, `droits.ts`, `retraite.ts`…), testée sur les exemples chiffrés
du guide France Travail (`npm test`).

| Règle | Détail |
|---|---|
| Affiliation | 507 h sur les 12 mois précédant la fin du dernier contrat spectacle ; 1 cachet = 12 h ; plafond mensuel 208 h (250 h multi-employeurs) en annexe 8, 28 cachets en annexe 10 |
| Enseignement | compte pour les 507 h (70 h max, 120 h à 50 ans et plus), mais ni dans les heures (partie B) ni dans le salaire (partie A) de l'AJ ; reste une activité du mois |
| Périodes assimilées | arrêt hors contrat (maladie longue, accident du travail, maternité) : 5 h/jour pour les 507 h et l'AJ, salaire de référence aménagé, pas d'ARE ces jours-là ; formation + cours ≤ 338 h |
| Annexes mixtes | droit ouvert dans l'annexe qui a le plus d'heures (guide, exemple 3) |
| AJ brute | A + B + C avec AJ minimale 31,96 € — A8 : A = AJmin × (0,42 × SR ≤ 14 400 € + 0,05 × au-delà) / 5000, B = AJmin × (0,26 × NHT ≤ 720 h + 0,08 × au-delà) / 507, C = AJmin × 0,40 — A10 : 0,36 / 13 700 €, 690 h, C = AJmin × 0,70 |
| Plancher / plafond | 38 € (A8), 44 € (A10) / 174,80 € |
| AJ nette | aucune retenue ≤ 31,96 € ; retraite complémentaire 0,93 % du SJM ; CSG (6,2 % ou 3,8 %) + CRDS 0,5 % sur 98,25 % au-delà de 60 € |
| Date anniversaire | 12 mois (365 jours) après la fin du contrat qui a ouvert le droit ; examen le lendemain, ou au premier jour sans contrat spectacle si un contrat est en cours ce jour-là (guide, exemple 13) |
| Délai d'attente | 7 jours à l'ouverture, sur des jours indemnisables |
| Franchise congés payés | ⌊jours travaillés × 2,5 / 24⌋, plafonnée à 30 j ; 2 j/mois (≤ 24 j) ou 3 j/mois |
| Franchise salaires | ⌊(salaires / SMIC mensuel) × (SJM / (3 × SMIC journalier))⌋ − 27, étalée sur 8 mois (arrondi supérieur) |
| Activité dans le mois | jours de travail = heures / 8 (A8) ou / 10 (A10) ; seuil 26 j (A8) / 27 j (A10) → aucune ARE ; jours non indemnisables = ⌊jours × 1,4⌋ (A8) ou ⌊jours × 1,3⌋ (A10) |
| Autres activités | hors spectacle : réduisent l'ARE du mois, ne comptent pas pour les 507 h ; non salarié : heures = revenu brut ÷ SMIC horaire |
| Ordre des déductions | délai d'attente → forfait CP → forfait salaires → reliquats reportés |
| Plafond de cumul | salaires bruts + ARE ≤ 118 % du PMSS (4 559,52 € en 2024, 4 631,50 € en 2025, 4 725,90 € en 2026) ; jours recalculés à l'entier supérieur |
| Clause de rattrapage | 338 à 506 h + 5 ans d'ancienneté : 6 mois à la dernière AJ, franchises 2 + 2 j/mois non reportables |
| AFD | 30 € nets/jour, 61 / 92 / 182 jours selon l'ancienneté |
| Maternité | IJ = salaires des 12 mois civils / 365 × 0,79 (104,02 € max en 2026) ; 5 h/jour assimilées ; SR × 365 / (365 − jours de congé) |
| Congés Spectacles | 10 % des salaires bruts spectacle du 1er avril au 31 mars, payables dès le 1er mai |
| Retraite | 1 trimestre = 150 × SMIC horaire au 1er janvier (1 803 € en 2026) ou 50 jours indemnisés, 4 par an |

**Sources** : guide « Intermittents du spectacle » de France Travail ([GUIDE-INTERMITTENT.pdf](GUIDE-INTERMITTENT.pdf)),
flyer « Franchises, délai d'attente… » et notice « Allocations de solidarité » de France Travail, ameli.fr (congé maternité),
Audiens (Congés Spectacles, garantie santé), service-public.gouv.fr et L'Assurance retraite (trimestres).

Les montants sont indicatifs : seule la notification de France Travail fait foi. Les valeurs revalorisées (AJ minimale,
SMIC, plafond de la Sécurité sociale) sont dans des tables de `src/lib/calculs.ts` à mettre à jour chaque année.

## Protection des données

- Les données sont conservées uniquement dans votre navigateur (`localStorage`) — rien n'est envoyé à un serveur.
- Exportez-les en JSON pour les sauvegarder ou les transférer, réimportez-les sur un autre poste. Les exports des anciennes versions sont acceptés.
- Aucun cookie ni traqueur.

## Développement

```bash
npm install
npm run dev      # serveur de développement
npm test         # tests des règles de calcul (vitest)
npm run build    # build de production
npm run deploy   # publication sur GitHub Pages (branche gh-pages)
```

Le service worker reçoit une version unique à chaque build : l'application installée se met à jour d'elle-même.
