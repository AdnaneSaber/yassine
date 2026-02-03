# Tests E2E - Parcours Administrateur

Ce dossier contient les tests End-to-End (E2E) Playwright pour le parcours administrateur du système Yassine.

## Structure des tests

```
__tests__/e2e/admin/
├── auth.spec.ts              # Tests d'authentification admin
├── dashboard.spec.ts         # Tests du tableau de bord
├── demandes-management.spec.ts  # Tests de gestion des demandes
├── workflow.spec.ts          # Tests du workflow complet
├── students-management.spec.ts  # Tests de gestion des étudiants
└── README.md                 # Ce fichier
```

## Prérequis

1. L'application doit être démarrée (`npm run dev`)
2. La base de données doit être initialisée avec les données de test
3. Playwright doit être installé (`npm install`)

## Exécution des tests

### Tous les tests admin
```bash
npm run test:e2e:admin
```

### Un fichier spécifique
```bash
npx playwright test __tests__/e2e/admin/auth.spec.ts
```

### En mode UI (interface graphique)
```bash
npx playwright test __tests__/e2e/admin --ui
```

### En mode debug
```bash
npx playwright test __tests__/e2e/admin --debug
```

### Navigateur spécifique
```bash
npx playwright test __tests__/e2e/admin --project=chromium
npx playwright test __tests__/e2e/admin --project=firefox
```

## Comptes de test

Les tests utilisent les comptes définis dans `../helpers.ts` :

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Admin | admin@university.edu | Admin123! |
| Étudiant | adnane.saber@university.edu | password123 |

## Description des tests

### 1. auth.spec.ts - Authentification Admin

- Connexion avec credentials valides
- Redirection vers le dashboard
- Accès refusé pour les étudiants
- Maintien de la session
- Déconnexion

### 2. dashboard.spec.ts - Tableau de bord

- Vue des statistiques (total, en cours, traitées, rejetées)
- Liste des demandes récentes
- Navigation rapide vers les demandes
- Responsive design

### 3. demandes-management.spec.ts - Gestion des demandes

- Liste des demandes avec pagination
- Filtrage par statut (SOUMIS, EN_COURS, TRAITE, etc.)
- Filtrage par priorité (BASSE, NORMALE, HAUTE, URGENTE)
- Filtrage par type
- Recherche par numéro
- Modification du statut
- Ajout de commentaires

### 4. workflow.spec.ts - Workflow complet

- Workflow SOUMIS → RECU → EN_COURS → VALIDE → TRAITE
- Rejet avec motif obligatoire
- Mise en attente d'information
- Reprise depuis l'attente
- Historique des transitions
- Validation des transitions invalides

### 5. students-management.spec.ts - Gestion des étudiants

- Liste des étudiants
- Pagination
- Ajout d'un nouvel étudiant
- Validation des champs
- Réinitialisation de mot de passe
- Recherche d'étudiants

## Bonnes pratiques

1. **Isolation** : Chaque test est indépendant et crée ses propres données
2. **Nettoyage** : Les contexts browser sont fermés après chaque test
3. **Assertions** : Vérification explicite des URLs et du contenu
4. **Attentes** : Utilisation de `waitForURL`, `waitForSelector` pour la stabilité
5. **Responsive** : Tests en desktop (1280x720) et mobile (375x667)

## Sélecteurs utilisés

Les tests utilisent des sélecteurs sémantiques :
- Attributs `name` pour les inputs
- Texte visible pour les boutons (`button:has-text("...")`)
- Rôles ARIA (`div[role="option"]`)
- IDs pour les champs de formulaire

## Données de test

Les numéros de demande sont générés dynamiquement avec un timestamp pour éviter les conflits :
```typescript
const numeroDemande = `DEM-2026-${Date.now().toString().slice(-6)}`;
```

## Dépannage

### Les tests échouent avec "Timeout"
- Vérifier que l'application est bien démarrée sur `http://localhost:3000`
- Vérifier que la base de données est accessible
- Augmenter le timeout dans `playwright.config.ts`

### "Element not found"
- Vérifier que les sélecteurs correspondent à l'implémentation actuelle
- Utiliser le mode debug (`--debug`) pour inspecter la page

### "Expected URL to be..."
- Vérifier que les redirections fonctionnent correctement
- Vérifier que l'authentification réussit

## Maintenance

Lors de modifications de l'interface :
1. Mettre à jour les sélecteurs dans les tests
2. Vérifier que les workflows métier sont toujours testés
3. Ajouter de nouveaux tests pour les nouvelles fonctionnalités
