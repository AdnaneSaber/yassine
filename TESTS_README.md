# Suite de Tests Complète - Yassine

Cette suite de tests couvre l'ensemble du projet Yassine (système de gestion des demandes administratives universitaires) avec :
- **Tests unitaires** (composants, lib, validators)
- **Tests d'intégration** (API, Server Actions, Models)
- **Tests E2E** (parcours utilisateur complets)

## 📊 Statistiques

| Type | Fichiers | Tests estimés |
|------|----------|---------------|
| Unit | 8 | 180+ |
| Integration | 6 | 110+ |
| E2E | 8 | 150+ |
| **Total** | **22** | **440+** |

## 🚀 Démarrage rapide

### Installation

```bash
# Installer les dépendances (déjà fait si npm install exécuté)
npm install

# Installer les navigateurs Playwright (pour E2E)
npx playwright install
```

### Exécuter tous les tests

```bash
# Tests unitaires + intégration
npm run test:run

# Tests E2E
npm run test:e2e

# Tous les tests (scripts complets)
./scripts/run-all-tests.ps1    # Windows
./scripts/run-all-tests.sh     # Linux/Mac
```

## 📁 Structure des tests

```
__tests__/
├── setup.ts                          # Setup global Vitest
├── setup-integration.ts              # Setup spécifique intégration
├── helpers/
│   └── mongodb.ts                    # Helper MongoDB en mémoire
├── unit/
│   ├── components/
│   │   ├── demandes/
│   │   │   ├── demande-form.test.tsx
│   │   │   ├── demande-card.test.tsx
│   │   │   └── demande-detail.test.tsx
│   │   └── admin/
│   │       ├── demandes-table.test.tsx
│   │       └── status-modifier-dialog.test.tsx
│   └── lib/
│       ├── validators/demande.test.ts
│       ├── workflow/state-machine.test.ts
│       ├── workflow/constants.test.ts
│       └── utils.test.ts
├── integration/
│   ├── actions/demandes.test.ts
│   ├── api/
│   │   ├── demandes/route.test.ts
│   │   ├── demandes/[id]/route.test.ts
│   │   ├── demandes/[id]/transition/route.test.ts
│   │   └── admin/students/route.test.ts
│   └── db/models/demande.test.ts
└── e2e/
    ├── helpers.ts
    ├── student/
│   │   ├── auth.spec.ts
│   │   ├── demandes-crud.spec.ts
│   │   └── demandes-tracking.spec.ts
│   └── admin/
│       ├── auth.spec.ts
│       ├── dashboard.spec.ts
│       ├── demandes-management.spec.ts
│       ├── workflow.spec.ts
│       └── students-management.spec.ts
```

## 🔧 Scripts disponibles

### Tests unitaires

```bash
npm run test              # Mode watch
npm run test:run          # Exécution unique
npm run test:unit         # Unitaires uniquement (sans intégration)
npm run test:coverage     # Avec rapport de couverture
```

### Tests d'intégration

```bash
npm run test:integration         # Exécution unique
npm run test:integration:watch   # Mode watch
```

### Tests E2E

```bash
npm run test:e2e              # Tous les tests E2E
npm run test:e2e:ui           # Mode UI (visuel)
npm run test:e2e:debug        # Mode debug
npm run test:e2e:headed       # Avec navigateur visible
npm run test:e2e:student      # Uniquement parcours étudiant
npm run test:e2e:admin        # Uniquement parcours admin
```

## 📝 Détails par catégorie

### Tests Unitaires

#### Composants (`__tests__/unit/components/`)

| Composant | Couverture |
|-----------|------------|
| `demande-form` | Formulaire, validation, soumission, erreurs |
| `demande-card` | Affichage, clic, statut, documents |
| `demande-detail` | Détail complet, sections conditionnelles |
| `demandes-table` | Tableau, pagination, actions |
| `status-modifier-dialog` | Dialog, changement de statut, validation |

#### Librairies (`__tests__/unit/lib/`)

| Module | Couverture |
|--------|------------|
| `validators/demande` | Tous les schémas Zod (81+ cas) |
| `workflow/state-machine` | Transitions, permissions, erreurs |
| `workflow/constants` | Fonctions utilitaires workflow |
| `utils` | Fonctions utilitaires (cn, formatDate) |

### Tests d'Intégration

#### Server Actions (`__tests__/integration/actions/`)

| Action | Tests |
|--------|-------|
| `createDemandeAction` | Création, auth, validation, erreurs |
| `updateDemandeAction` | Mise à jour, champs partiels |
| `deleteDemandeAction` | Soft delete, erreurs |
| `transitionDemandeAction` | Transitions, permissions |

#### API Routes (`__tests__/integration/api/`)

| Route | Méthodes |
|-------|----------|
| `/api/demandes` | GET (liste), POST (création) |
| `/api/demandes/[id]` | GET (détail), PATCH (update), DELETE |
| `/api/demandes/[id]/transition` | POST (changement statut) |
| `/api/admin/students` | GET, POST |

#### Models (`__tests__/integration/db/models/`)

| Model | Tests |
|-------|-------|
| `Demande` | Schema, validation, pre-save hooks, indexes |

### Tests E2E

#### Parcours Étudiant (`__tests__/e2e/student/`)

| Fichier | Scénarios |
|---------|-----------|
| `auth.spec.ts` | Login, logout, protection routes |
| `demandes-crud.spec.ts` | Création, lecture, modification, suppression |
| `demandes-tracking.spec.ts` | Suivi statuts, historique, notifications |

#### Parcours Admin (`__tests__/e2e/admin/`)

| Fichier | Scénarios |
|---------|-----------|
| `auth.spec.ts` | Login admin, dashboard |
| `dashboard.spec.ts` | Statistiques, demandes récentes |
| `demandes-management.spec.ts` | Liste, filtres, recherche, actions |
| `workflow.spec.ts` | Workflow complet SOUMIS → TRAITE, rejets |
| `students-management.spec.ts` | CRUD étudiants, reset password |

## 🎯 Couverture des fonctionnalités

### Authentification
- [x] Login étudiant/admin
- [x] Protection des routes
- [x] Gestion des sessions
- [x] Redirections post-login

### Gestion des demandes (Étudiant)
- [x] Création de demande
- [x] Liste des demandes (filtres, recherche)
- [x] Détail d'une demande
- [x] Modification (statut SOUMIS uniquement)
- [x] Suppression (soft delete)

### Gestion des demandes (Admin)
- [x] Liste complète avec pagination
- [x] Filtres (statut, priorité, type)
- [x] Recherche (numéro, nom)
- [x] Modification de statut
- [x] Commentaires admin

### Workflow
- [x] Transitions valides
- [x] Permissions par rôle
- [x] Auto-transition VALIDE → TRAITE
- [x] Rejet avec motif obligatoire
- [x] Mise en attente d'information

### Gestion des étudiants (Admin)
- [x] Liste des étudiants
- [x] Ajout d'étudiant
- [x] Réinitialisation mot de passe

## 🔍 Bonnes pratiques

1. **Isolation** : Chaque test est indépendant
2. **Mocks** : Toutes les dépendances externes sont mockées
3. **Cleanup** : La base de données est nettoyée entre chaque test
4. **Naming** : Les tests décrivent le comportement, pas l'implémentation
5. **Couverture** : Tests des cas passants ET des cas d'erreur

## 🐛 Dépannage

### Erreur "Cannot find module"

```bash
# Réinstaller les dépendances
rm -rf node_modules package-lock.json
npm install
```

### Erreur MongoDB dans les tests d'intégration

```bash
# Vérifier que mongodb-memory-server est installé
npm install --save-dev mongodb-memory-server
```

### Erreur Playwright

```bash
# Réinstaller les navigateurs
npx playwright install --force
```

## 📝 Ajouter un nouveau test

### Test unitaire (composant)

```typescript
// __tests__/unit/components/mon-composant.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MonComposant } from '@/components/mon-composant';

describe('MonComposant', () => {
  it('rend correctement', () => {
    render(<MonComposant />);
    expect(screen.getByText('Titre')).toBeInTheDocument();
  });
});
```

### Test d'intégration (API)

```typescript
// __tests__/integration/api/ma-route/route.test.ts
import { describe, it, expect, vi } from 'vitest';
import { GET } from '@/app/api/ma-route/route';

describe('/api/ma-route', () => {
  it('retourne les données', async () => {
    const req = new NextRequest('http://localhost:3000/api/ma-route');
    const res = await GET(req);
    expect(res.status).toBe(200);
  });
});
```

### Test E2E

```typescript
// __tests__/e2e/mon-parcours.spec.ts
import { test, expect } from '@playwright/test';

test('mon parcours', async ({ page }) => {
  await page.goto('/ma-page');
  await expect(page.locator('h1')).toContainText('Titre');
});
```

## 📧 Support

Pour toute question sur les tests, consultez :
- Le skill `testing-expert` dans `.agents/skills/testing-expert/`
- La documentation Vitest : https://vitest.dev/
- La documentation Playwright : https://playwright.dev/
