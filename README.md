# Simulateur d'Intermittence du Spectacle

Cette application web permet aux intermittents du spectacle de simuler leur situation, de calculer leur allocation journalière, et de visualiser leurs revenus mois par mois.

Application accessible en ligne : [Simulateur d'Intermittence](https://mysteropodes.github.io/SImulateurIntermittece/)

## Fonctionnalités

- **Synthèse** : Vue d'ensemble de votre situation
- **Mon AJ** : Paramètres d'indemnisation (annexe, délai d'attente, franchises)
- **Contrats** : Saisie et gestion des contrats avec conversion automatique Cachets/Heures
- **Suivi Mensuel** : Visualisation mois par mois des revenus et indemnités
- **Tableau de Bord** : Graphiques et statistiques sur votre intermittence
- **Frise Chronologique** : Visualisation des dates clés de votre intermittence

## Protection des données

**Important** : Cette application respecte entièrement votre vie privée.
- Toutes les données sont stockées uniquement sur votre ordinateur local
- Aucune information n'est envoyée ni conservée sur des serveurs distants
- À chaque utilisation, vous devez sauvegarder et réimporter vos données
- L'application n'utilise pas de cookies ni de trackers

Pour conserver vos informations entre deux sessions :
1. Utilisez le bouton "Exporter" pour télécharger vos données au format JSON
2. Conservez ce fichier sur votre ordinateur
3. Utilisez le bouton "Importer" lors de votre prochaine visite

## Caractéristiques principales

- Navigation entre différentes vues
- Sauvegarde et chargement des données au format JSON
- Calculs basés sur les règles officielles de l'intermittence
- Calcul dynamique de la nouvelle ARE simulée
- Interface moderne et conviviale

## Installation

```bash
# Installer les dépendances
npm install

# Lancer l'application en mode développement
npm run dev
```

## Build

```bash
npm run build
```

## Règles appliquées

- Seuil de 507 heures sur 12 mois glissants
- 1 cachet = 12 heures
- AJ = 31,98€ + 40,4% du SJR
- Plafond : 75% du SJR
- Plancher : 57% du SJR ou 31,98€
- Calcul des franchises (congés payés et salaires)
- Délai d'attente de 7 jours
