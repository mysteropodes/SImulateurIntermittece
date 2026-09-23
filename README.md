# Simulateur d'Intermittence du Spectacle

Application web pour les intermittents du spectacle (annexes 8 et 10) : saisissez vos contrats, et le simulateur calcule votre
période de référence, votre allocation journalière, vos franchises et une projection mois par mois de ce que vous toucherez.

Application en ligne : [mysteropodes.github.io/SImulateurIntermittece](https://mysteropodes.github.io/SImulateurIntermittece/)

## Fonctionnalités

- **Synthèse** : AJ, heures, ARE du mois, date anniversaire, détail A + B + C, et un panneau **Paliers et leviers** (position par rapport aux seuils de la formule, gain par 1 000 € ou 10 h, heures nécessaires pour viser une AJ)
- **Mon AJ** : annexe, dates du droit, délai d'attente, AJ notifiée (facultatif), franchises automatiques ou saisies, taux de prélèvement
- **Contrats** : cachets, heures ou enseignement, regroupés par mois avec les jours non indemnisables et la marge
- **Suivi mensuel** : graphique et tableau mois par mois, avec la **marge** (heures possibles avant de perdre un jour d'ARE)
- **Tableau de bord** : indicateurs, frise du droit, projection avant les 507 h, comparaison en cas de réexamen
- **Historique** : AJ de chaque droit passé, écarts d'une date anniversaire à l'autre, comparaison avec la prochaine
- **Mes droits** : si je perds l'intermittence (clause de rattrapage, APS, AFD, clause de sauvegarde, régime général), maternité / paternité (IJ, heures assimilées, salaire de référence aménagé), Congés Spectacles (10 % par période), Audiens (garantie santé)
- **Export Excel** : classeur avec contrats, synthèse et suivi mensuel
- Infobulles ⓘ sur tous les termes techniques, interface responsive

## Règles appliquées

Sources : guide « Intermittents du spectacle » de France Travail ([GUIDE-INTERMITTENT.pdf](GUIDE-INTERMITTENT.pdf)) et flyer
« Franchises, délai d'attente… ». Toute la logique est dans [`src/lib/calculs.ts`](src/lib/calculs.ts), testée sur les
exemples chiffrés du guide (`npm test`).

| Règle | Détail |
|---|---|
| Enseignement | compte pour les 507 h (70 h max, 120 h à 50 ans et plus), mais ni dans les heures (partie B) ni dans le salaire (partie A) de l'AJ ; reste une activité du mois |
| Affiliation | 507 h sur les 12 mois précédant la fin du contrat de référence ; 1 cachet = 12 h ; plafond mensuel 208 h (250 h multi-employeurs) en annexe 8, 28 cachets en annexe 10 |
| AJ brute | A + B + C avec AJ minimale 31,96 € — A8 : A = AJmin × (0,42 × SR ≤ 14 400 € + 0,05 × au-delà) / 5000, B = AJmin × (0,26 × NHT ≤ 720 h + 0,08 × au-delà) / 507, C = AJmin × 0,40 — A10 : 0,36 / 13 700 €, 690 h, C = AJmin × 0,70 |
| Plancher / plafond | 38 € (A8), 44 € (A10) / 174,80 € |
| AJ nette | aucune retenue ≤ 31,96 € ; retraite complémentaire 0,93 % du SJM ; CSG (6,2 % ou 3,8 %) + CRDS 0,5 % sur 98,25 % au-delà de 60 € |
| Délai d'attente | 7 jours à l'ouverture, sur des jours indemnisables |
| Franchise congés payés | ⌊jours travaillés × 2,5 / 24⌋, plafonnée à 30 j ; 2 j/mois (≤ 24 j) ou 3 j/mois |
| Franchise salaires | ⌊(SR / SMIC mensuel) × (SJM / (3 × SMIC journalier))⌋ − 27, étalée sur 8 mois (arrondi supérieur) |
| Activité dans le mois | jours de travail = heures / 8 (A8) ou / 10 (A10) ; seuil 26 j (A8) / 27 j (A10) → aucune ARE ; jours non indemnisables = ⌊jours × 1,4⌋ (A8) ou ⌊jours × 1,3⌋ (A10) |
| Ordre des déductions | délai d'attente → forfait CP → forfait salaires → reliquats reportés |
| Plafond de cumul | salaires bruts + ARE ≤ 118 % du PMSS (4 559,52 € en 2024, 4 631,50 € en 2025, 4 725,90 € en 2026) ; jours recalculés à l'entier supérieur |
| Fin du droit | date anniversaire = début du droit + 12 mois |

| Clause de rattrapage | 338 à 506 h + 5 ans d'ancienneté : 6 mois à la dernière AJ, franchises 2 + 2 j/mois non reportables |
| AFD | 30 € nets/jour, 61 / 92 / 182 jours selon l'ancienneté (notice France Travail « Allocations de solidarité ») |
| Maternité | IJ = salaires des 12 mois civils / 365 × 0,79 (104,02 € max en 2026, ameli) ; 5 h/jour assimilées ; SR × 365 / (365 − jours de congé) |
| Congés Spectacles | 10 % des salaires bruts spectacle du 1er avril au 31 mars, payables dès le 1er mai |

Les montants sont indicatifs : seule la notification de France Travail fait foi.

## Protection des données

- Les données sont conservées uniquement dans votre navigateur (`localStorage`) — rien n'est envoyé à un serveur.
- Exportez-les en JSON pour les sauvegarder ou les transférer, réimportez-les sur un autre poste. Les exports de l'ancienne version sont acceptés.
- Aucun cookie ni traqueur.

## Développement

```bash
npm install
npm run dev      # serveur de développement
npm test         # tests des règles de calcul (vitest)
npm run build    # build de production
npm run deploy   # publication sur GitHub Pages (branche gh-pages)
```
