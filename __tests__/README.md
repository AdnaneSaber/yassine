# Tests Unitaires - Projet Yassine

Ce dossier contient les tests unitaires pour le projet Yassine (système de gestion des demandes administratives universitaires).

## Structure des tests

```
__tests__/
├── setup.ts                          # Configuration globale des tests
├── README.md                         # Ce fichier
├── unit/                             # Tests unitaires
│   └── components/
│       ├── demandes/                 # Composants de demandes
│       │   ├── demande-form.test.tsx
│       │   ├── demande-card.test.tsx
│       │   └── demande-detail.test.tsx
│       └── admin/                    # Composants admin
│           ├── demandes-table.test.tsx
│           └── status-modifier-dialog.test.tsx
```

## Composants testés

### 1. `demande-form.test.tsx`
Tests pour le formulaire de création de demande :
- Rendu des champs requis (type, objet, description, priorité)
- Validation des formulaires
- Soumission réussie et gestion des erreurs
- États de chargement
- Navigation (bouton Annuler)
- Accessibilité (ARIA, labels)

### 2. `demande-card.test.tsx`
Tests pour la carte de présentation d'une demande :
- Affichage des informations (titre, numéro, type, date)
- Badge de statut avec couleur
- Compteur de documents
- Gestion du clic
- Gestion des cas limites (ID manquant, documents vides)

### 3. `demande-detail.test.tsx`
Tests pour le détail complet d'une demande :
- Affichage des informations générales
- Formatage des dates en français
- Affichage des documents avec liens
- Section commentaire admin (style bleu)
- Section motif de refus (style rouge)
- Gestion des pluriels (délai, documents)

### 4. `demandes-table.test.tsx`
Tests pour le tableau admin des demandes :
- Rendu des en-têtes
- Affichage des demandes avec infos étudiant
- Badges de statut et de priorité
- Actions (Voir, Modifier)
- Empty state
- Navigation vers détail

### 5. `status-modifier-dialog.test.tsx`
Tests pour le dialog de modification de statut :
- Affichage conditionnel
- Sélecteur de statut
- Champ motif de refus (si REJETE)
- Validation des champs
- Soumission avec succès/erreur
- États de chargement
- Réinitialisation du formulaire

## Exécution des tests

```bash
# Lancer les tests en mode watch
npm run test

# Lancer les tests une seule fois
npm run test:run

# Lancer avec couverture
npm run test:coverage

# Lancer un fichier spécifique
npx vitest __tests__/unit/components/demandes/demande-form.test.tsx
```

## Bonnes pratiques

1. **Mock des dépendances** : Toutes les dépendances externes sont mockées (next/navigation, actions, etc.)
2. **Données de test** : Utiliser des données réalistes avec les types TypeScript
3. **User Event** : Utiliser `@testing-library/user-event` pour les interactions
4. **Accessibilité** : Vérifier les rôles, labels et attributs ARIA
5. **Cas d'erreur** : Toujours tester les cas passants ET les cas d'erreur

## Configuration

- **Framework** : Vitest
- **DOM** : jsdom
- **Assertions** : @testing-library/jest-dom
- **Mocking** : vi (Vitest)

## Couverture de code

Les seuils de couverture sont configurés dans `vitest.config.ts` :
- Lines: 70%
- Functions: 70%
- Branches: 60%
- Statements: 70%
