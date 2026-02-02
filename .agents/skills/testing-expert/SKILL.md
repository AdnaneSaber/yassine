---
name: testing-expert
description: Comprehensive testing skill for Next.js 15+ projects covering unit tests, integration tests, API tests, and E2E tests. Use when the user needs to write, run, or configure tests before push/build/deploy. Supports Vitest (unit), Playwright (E2E), supertest (API), and mongodb-memory-server (DB integration). Works with TypeScript, React, Next.js App Router, and MongoDB/Mongoose.
---

# Testing Expert Skill

Guide complet pour écrire et exécuter tous les types de tests dans un projet Next.js 15+ avec TypeScript et MongoDB.

## Vue d'ensemble

Ce skill fournit:
- **Tests unitaires** avec Vitest (composants, hooks, utilitaires)
- **Tests API** pour les Route Handlers Next.js
- **Tests d'intégration DB** avec MongoDB en mémoire
- **Tests E2E** avec Playwright (parcours utilisateur complets)
- **Scripts** pour exécuter les tests dans CI/CD

## Stack de test recommandée

| Type | Outil | Pourquoi |
|------|-------|----------|
| Unit/Integration | Vitest | Rapide, natif ESM, compatible Vite |
| E2E | Playwright | Moderne, fiable, screenshots auto |
| API | supertest + node-mocks-http | Tests isolation des API routes |
| DB | mongodb-memory-server | Tests sans DB externe |

## Configuration rapide

### 1. Installation des dépendances

```bash
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
npm install -D @playwright/test
npm install -D supertest @types/supertest mongodb-memory-server
npm install -D @vitest/coverage-v8 vitest-mongodb
```

### 2. Configuration Vitest

Utilisez le template: [assets/vitest.config.ts](assets/vitest.config.ts)

```bash
cp .agents/skills/testing-expert/assets/vitest.config.ts vitest.config.ts
```

### 3. Configuration Playwright

```bash
npx playwright install
npx playwright install-deps  # Linux only
cp .agents/skills/testing-expert/assets/playwright.config.ts playwright.config.ts
```

### 4. Configuration test DB

Utilisez le helper: [references/mongodb-test-helper.ts](references/mongodb-test-helper.ts)

## Structure des tests

```
__tests__/
├── unit/                 # Tests unitaires
│   ├── components/       # Composants React
│   ├── hooks/           # Custom hooks
│   ├── lib/             # Utilitaires
│   └── validators/      # Schémas Zod
├── integration/          # Tests intégration
│   ├── api/             # API routes
│   └── db/              # Database + Models
└── e2e/                  # Tests Playwright
    ├── student/         # Parcours étudiant
    ├── admin/           # Parcours admin
    └── auth/            # Authentification
```

## Patterns de test

### Test unitaire - Composant React

Voir: [references/unit-test-patterns.md](references/unit-test-patterns.md#composants-react)

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DemandeCard } from '@/components/demandes/DemandeCard';

describe('DemandeCard', () => {
  const mockDemande = {
    _id: '123',
    numeroDemande: 'DEM-2026-000001',
    objet: 'Demande de test',
    statut: { code: 'SOUMIS', libelle: 'Soumis', couleur: '#6B7280' }
  };

  it('affiche les informations de la demande', () => {
    render(<DemandeCard demande={mockDemande} />);
    
    expect(screen.getByText('DEM-2026-000001')).toBeInTheDocument();
    expect(screen.getByText('Demande de test')).toBeInTheDocument();
  });

  it('appelle onClick quand on clique sur la carte', async () => {
    const handleClick = vi.fn();
    render(<DemandeCard demande={mockDemande} onClick={handleClick} />);
    
    await userEvent.click(screen.getByRole('article'));
    expect(handleClick).toHaveBeenCalledWith('123');
  });
});
```

### Test API - Route Handler Next.js

Voir: [references/api-test-patterns.md](references/api-test-patterns.md)

```typescript
import { createMocks } from 'node-mocks-http';
import { GET } from '@/app/api/demandes/route';
import { setupTestDB, teardownTestDB } from '@/tests/helpers/mongodb';

describe('GET /api/demandes', () => {
  beforeAll(async () => await setupTestDB());
  afterAll(async () => await teardownTestDB());

  it('retourne les demandes de l\'utilisateur connecté', async () => {
    const { req } = createMocks({
      method: 'GET',
      headers: { authorization: 'Bearer mock-token' }
    });

    // Mock session
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user123', role: 'STUDENT' }
    });

    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });
});
```

### Test E2E - Parcours complet

Voir: [references/e2e-test-patterns.md](references/e2e-test-patterns.md)

```typescript
import { test, expect } from '@playwright/test';

test.describe('Parcours étudiant - Création demande', () => {
  test.beforeEach(async ({ page }) => {
    // Login avant chaque test
    await page.goto('/auth/login');
    await page.fill('[name="email"]', 'etudiant@test.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/demandes');
  });

  test('crée une nouvelle demande avec succès', async ({ page }) => {
    // Aller sur la page de création
    await page.click('text=Nouvelle demande');
    await page.waitForURL('/demandes/nouveau');

    // Remplir le formulaire
    await page.selectOption('select[name="typeDemande"]', 'ATTESTATION');
    await page.fill('input[name="objet"]', 'Demande d\'attestation de scolarité');
    await page.fill('textarea[name="description"]', 'Je souhaite obtenir une attestation pour mon stage.');
    
    // Soumettre
    await page.click('button[type="submit"]');

    // Vérifier le succès
    await expect(page.locator('.toast-success')).toContainText('Demande créée');
    await expect(page.locator('[data-testid="demande-numero"]')).toBeVisible();
  });
});
```

## Scripts utilitaires

### Exécuter tous les tests

```bash
# Tests unitaires + intégration
npm run test

# Avec couverture
npm run test:coverage

# Mode watch (développement)
npm run test:watch

# Tests E2E
npm run test:e2e

# E2E avec UI
npm run test:e2e:ui

# Tous les tests (CI/CD)
npm run test:all
```

Ajoutez dans `package.json`:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:all": "npm run test && npm run test:e2e"
  }
}
```

### Script CI/CD complet

Utilisez: [scripts/run-all-tests.sh](scripts/run-all-tests.sh) (Linux/Mac) ou [scripts/run-all-tests.ps1](scripts/run-all-tests.ps1) (Windows)

```bash
# Exécuter tous les tests avec rapport
./.agents/skills/testing-expert/scripts/run-all-tests.sh
```

## Couverture de test requise

Avant chaque push/build, assurez-vous d'avoir:

| Type | Min Couverture | Focus |
|------|----------------|-------|
| Unit | 70% | Logique métier, utilitaires |
| Integration | 60% | API routes, DB queries |
| E2E | - | Parcours critiques (création demande, auth) |

### Vérification pré-push

```bash
# Vérifie que tout passe
npm run lint && npm run test && npm run build
```

## Mocking courants

### NextAuth.js

```typescript
vi.mock('next-auth', () => ({
  getServerSession: vi.fn()
}));

// Dans le test
vi.mocked(getServerSession).mockResolvedValue({
  user: { id: '123', email: 'test@test.com', role: 'STUDENT' }
});
```

### MongoDB / Mongoose

```typescript
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod: MongoMemoryServer;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

afterEach(async () => {
  // Clean up collections
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});
```

### Dates

```typescript
// Freeze date pour les tests
const mockDate = new Date('2026-01-15');
vi.setSystemTime(mockDate);

// Reset après
vi.useRealTimers();
```

## Dépannage courant

| Problème | Solution |
|----------|----------|
| `window is not defined` | Ajouter `@vitest-environment jsdom` ou tester via Playwright |
| `fetch is not defined` | Utiliser `vitest-fetch-mock` ou `msw` |
| Timeout MongoDB | Augmenter `testTimeout` dans vitest.config.ts |
| Hydration mismatch | Utiliser `data-testid` au lieu de texte pour les sélecteurs |

## Références détaillées

- **Patterns unitaires**: [references/unit-test-patterns.md](references/unit-test-patterns.md)
- **Patterns API**: [references/api-test-patterns.md](references/api-test-patterns.md)
- **Patterns E2E**: [references/e2e-test-patterns.md](references/e2e-test-patterns.md)
- **Helpers MongoDB**: [references/mongodb-test-helper.ts](references/mongodb-test-helper.ts)
- **Exemples complets**: [references/test-examples/](references/test-examples/)
