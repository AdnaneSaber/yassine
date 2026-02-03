# Patterns de Tests E2E (Playwright)

Guide pour tester les parcours utilisateur complets.

## Table des matières

1. [Configuration](#configuration)
2. [Authentification](#authentification)
3. [Tests CRUD](#tests-crud)
4. [Tests de workflow](#tests-de-workflow)
5. [Tests visuels](#tests-visuels)

---

## Configuration

```typescript
// __tests__/e2e/fixtures/auth.ts
import { test as base, expect, Page } from '@playwright/test';

export const test = base.extend<{
  studentPage: Page;
  adminPage: Page;
}>({
  // Student authentifié
  studentPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    await page.goto('/auth/login');
    await page.fill('[name="email"]', 'adnane.saber@university.edu');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/demandes');
    
    await use(page);
    await context.close();
  },
  
  // Admin authentifié
  adminPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    await page.goto('/auth/login');
    await page.fill('[name="email"]', 'admin@university.edu');
    await page.fill('[name="password"]', 'Admin123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin/dashboard');
    
    await use(page);
    await context.close();
  },
});

export { expect };
```

---

## Authentification

```typescript
// __tests__/e2e/auth/login.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentification', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
  });

  test('connexion réussie étudiant', async ({ page }) => {
    await page.fill('[name="email"]', 'adnane.saber@university.edu');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    await page.waitForURL('/demandes');
    await expect(page.locator('h1')).toContainText('Mes demandes');
  });

  test('connexion réussie admin', async ({ page }) => {
    await page.fill('[name="email"]', 'admin@university.edu');
    await page.fill('[name="password"]', 'Admin123!');
    await page.click('button[type="submit"]');

    await page.waitForURL('/admin/dashboard');
    await expect(page.locator('h1')).toContainText('Tableau de bord');
  });

  test('affiche erreur pour identifiants invalides', async ({ page }) => {
    await page.fill('[name="email"]', 'invalide@test.com');
    await page.fill('[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    await expect(page.locator('.alert-error')).toContainText('Email ou mot de passe incorrect');
    expect(page.url()).toContain('/auth/login');
  });

  test('redirige vers login si non authentifié', async ({ page }) => {
    await page.goto('/demandes');
    await page.waitForURL('/auth/login?callbackUrl=%2Fdemandes');
  });
});
```

---

## Tests CRUD

```typescript
// __tests__/e2e/student/demandes-crud.spec.ts
import { test, expect } from '../fixtures/auth';

test.describe('CRUD Demandes - Étudiant', () => {
  test('crée une nouvelle demande', async ({ studentPage: page }) => {
    await page.click('text=Nouvelle demande');
    await page.waitForURL('/demandes/nouveau');

    // Remplir formulaire
    await page.selectOption('select[name="typeDemande"]', 'ATTESTATION');
    await page.fill('input[name="objet"]', 'Demande E2E Test');
    await page.fill('textarea[name="description"]', 
      'Ceci est une description détaillée pour le test E2E de création de demande.'
    );

    // Soumettre
    await page.click('button[type="submit"]');

    // Vérifier succès
    await expect(page.locator('.toast-success')).toContainText('Demande créée');
    
    // Vérifier présence dans la liste
    await page.goto('/demandes');
    await expect(page.locator('text=Demande E2E Test')).toBeVisible();
  });

  test('affiche les détails d\'une demande', async ({ studentPage: page }) => {
    // Créer d'abord une demande
    await page.goto('/demandes/nouveau');
    await page.selectOption('select[name="typeDemande"]', 'RELEVE_NOTES');
    await page.fill('input[name="objet"]', 'Demande détails test');
    await page.fill('textarea[name="description"]', 'Description pour test détails');
    await page.click('button[type="submit"]');
    
    // Récupérer le numéro
    await page.waitForSelector('[data-testid="demande-numero"]');
    const numero = await page.locator('[data-testid="demande-numero"]').textContent();

    // Aller sur la liste et cliquer
    await page.goto('/demandes');
    await page.click(`text=${numero}`);

    // Vérifier détails
    await expect(page.locator('h1')).toContainText('Demande détails test');
    await expect(page.locator('[data-testid="statut-badge"]')).toContainText('Soumis');
  });

  test('modifie une demande en statut SOUMIS', async ({ studentPage: page }) => {
    // Créer demande
    await page.goto('/demandes/nouveau');
    await page.selectOption('select[name="typeDemande"]', 'CONVENTION_STAGE');
    await page.fill('input[name="objet"]', 'À modifier');
    await page.fill('textarea[name="description"]', 'Description initiale');
    await page.click('button[type="submit"]');

    // Aller sur la liste et modifier
    await page.goto('/demandes');
    await page.click('text=À modifier');
    await page.click('text=Modifier');

    // Modifier
    await page.fill('input[name="objet"]', 'Modifiée !');
    await page.fill('textarea[name="description"]', 'Description modifiée');
    await page.click('button[type="submit"]');

    // Vérifier
    await expect(page.locator('.toast-success')).toContainText('Demande mise à jour');
    await expect(page.locator('h1')).toContainText('Modifiée !');
  });

  test('supprime une demande', async ({ studentPage: page }) => {
    // Créer demande
    await page.goto('/demandes/nouveau');
    await page.selectOption('select[name="typeDemande"]', 'ATTESTATION');
    await page.fill('input[name="objet"]', 'À supprimer');
    await page.fill('textarea[name="description"]', 'Cette demande va être supprimée');
    await page.click('button[type="submit"]');

    // Supprimer
    await page.goto('/demandes');
    await page.click('text=À supprimer');
    
    // Accepter la confirmation
    page.on('dialog', dialog => dialog.accept());
    await page.click('text=Supprimer');

    // Vérifier
    await expect(page.locator('.toast-success')).toContainText('Demande supprimée');
    await expect(page.locator('text=À supprimer')).not.toBeVisible();
  });
});
```

---

## Tests de workflow

```typescript
// __tests__/e2e/workflow/demande-lifecycle.spec.ts
import { test, expect } from '../fixtures/auth';

test.describe('Cycle de vie d\'une demande', () => {
  test('workflow complet SOUMIS → RECU → EN_COURS → VALIDE → TRAITE', async ({ 
    studentPage, 
    adminPage 
  }) => {
    // === ÉTAPE 1: Étudiant crée la demande ===
    await studentPage.goto('/demandes/nouveau');
    await studentPage.selectOption('select[name="typeDemande"]', 'ATTESTATION');
    await studentPage.fill('input[name="objet"]', 'Test workflow complet');
    await studentPage.fill('textarea[name="description"]', 
      'Demande pour tester le workflow complet de bout en bout.'
    );
    await studentPage.click('button[type="submit"]');

    // Attendre création
    await studentPage.waitForSelector('[data-testid="demande-numero"]');
    const numero = await studentPage.locator('[data-testid="demande-numero"]').textContent();

    // Vérifier statut initial
    await expect(studentPage.locator('[data-testid="statut-badge"]')).toContainText('Soumis');

    // === ÉTAPE 2: Auto-transition SOUMIS → RECU (vérifié par admin) ===
    // Rafraîchir après quelques secondes
    await studentPage.waitForTimeout(2000);
    await studentPage.reload();
    
    // Admin vérifie réception
    await adminPage.goto('/admin/demandes');
    await adminPage.fill('[placeholder="Rechercher..."]', numero || '');
    await expect(adminPage.locator(`text=${numero}`)).toBeVisible();

    // === ÉTAPE 3: Admin passe à EN_COURS ===
    await adminPage.click(`text=${numero}`);
    await adminPage.selectOption('select[name="statut"]', 'EN_COURS');
    await adminPage.fill('textarea[name="commentaire"]', 'Prise en charge de votre demande');
    await adminPage.click('text=Mettre à jour le statut');

    await expect(adminPage.locator('.toast-success')).toContainText('Statut mis à jour');

    // === ÉTAPE 4: Étudiant voit le changement ===
    await studentPage.reload();
    await expect(studentPage.locator('[data-testid="statut-badge"]')).toContainText('En cours');
    await expect(studentPage.locator('[data-testid="commentaire-admin"]')).toContainText('Prise en charge');

    // === ÉTAPE 5: Admin passe à VALIDE ===
    await adminPage.reload();
    await adminPage.selectOption('select[name="statut"]', 'VALIDE');
    await adminPage.click('text=Mettre à jour le statut');

    // === ÉTAPE 6: Auto-transition VALIDE → TRAITE ===
    await adminPage.waitForTimeout(500);
    await adminPage.reload();
    await expect(adminPage.locator('[data-testid="statut-badge"]')).toContainText('Traité');

    // === ÉTAPE 7: Étudiant reçoit notification ===
    await studentPage.reload();
    await expect(studentPage.locator('[data-testid="statut-badge"]')).toContainText('Traité');
  });

  test('workflow avec rejet', async ({ studentPage, adminPage }) => {
    // Créer demande
    await studentPage.goto('/demandes/nouveau');
    await studentPage.selectOption('select[name="typeDemande"]', 'CERTIFICAT_SCOLARITE');
    await studentPage.fill('input[name="objet"]', 'Demande à rejeter');
    await studentPage.fill('textarea[name="description"]', 'Description');
    await studentPage.click('button[type="submit"]');

    await studentPage.waitForSelector('[data-testid="demande-numero"]');
    const numero = await studentPage.locator('[data-testid="demande-numero"]').textContent();

    // Admin rejette
    await adminPage.goto('/admin/demandes');
    await adminPage.click(`text=${numero}`);
    await adminPage.selectOption('select[name="statut"]', 'REJETE');
    await adminPage.fill('textarea[name="motifRefus"]', 
      'Documents incomplets. Veuillez fournir une copie de votre carte d\'identité.'
    );
    await adminPage.click('text=Mettre à jour le statut');

    // Vérifier rejet
    await expect(adminPage.locator('.toast-success')).toContainText('Statut mis à jour');
    
    // Étudiant voit le rejet
    await studentPage.reload();
    await expect(studentPage.locator('[data-testid="statut-badge"]')).toContainText('Rejeté');
    await expect(studentPage.locator('[data-testid="motif-refus"]')).toContainText('Documents incomplets');
  });
});
```

---

## Tests de pagination et filtres

```typescript
// __tests__/e2e/admin/filters.spec.ts
import { test, expect } from '../fixtures/auth';

test.describe('Filtres admin', () => {
  test.beforeEach(async ({ adminPage: page }) => {
    await page.goto('/admin/demandes');
  });

  test('filtre par statut', async ({ adminPage: page }) => {
    // Sélectionner statut
    await page.selectOption('select[name="statut"]', 'SOUMIS');
    await page.click('text=Filtrer');

    // Vérifier que seuls les SOUMIS sont affichés
    const rows = await page.locator('table tbody tr').all();
    for (const row of rows) {
      await expect(row.locator('td:nth-child(4)')).toContainText('Soumis');
    }
  });

  test('recherche par numéro', async ({ adminPage: page }) => {
    await page.fill('[placeholder="Rechercher..."]', 'DEM-2026');
    await page.press('[placeholder="Rechercher..."]', 'Enter');

    // Vérifier résultats
    const count = await page.locator('table tbody tr').count();
    expect(count).toBeGreaterThan(0);
  });

  test('pagination', async ({ adminPage: page }) => {
    // Aller page 2
    await page.click('text=Suivant');
    
    // Vérifier changement de page
    await expect(page.locator('[data-testid="page-indicator"]')).toContainText('Page 2');
    
    // Revenir page 1
    await page.click('text=Précédent');
    await expect(page.locator('[data-testid="page-indicator"]')).toContainText('Page 1');
  });
});
```

---

## Tests visuels

```typescript
// __tests__/e2e/visual/regression.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Tests visuels', () => {
  test('page login', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page).toHaveScreenshot('login-page.png');
  });

  test('dashboard admin', async ({ page }) => {
    // Login
    await page.goto('/auth/login');
    await page.fill('[name="email"]', 'admin@university.edu');
    await page.fill('[name="password"]', 'Admin123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin/dashboard');

    // Screenshot
    await expect(page).toHaveScreenshot('admin-dashboard.png', {
      fullPage: true,
    });
  });
});
```

---

## Utilitaires E2E

```typescript
// __tests__/e2e/helpers/index.ts
import { Page, expect } from '@playwright/test';

export async function loginAsStudent(page: Page) {
  await page.goto('/auth/login');
  await page.fill('[name="email"]', 'adnane.saber@university.edu');
  await page.fill('[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL('/demandes');
}

export async function loginAsAdmin(page: Page) {
  await page.goto('/auth/login');
  await page.fill('[name="email"]', 'admin@university.edu');
  await page.fill('[name="password"]', 'Admin123!');
  await page.click('button[type="submit"]');
  await page.waitForURL('/admin/dashboard');
}

export async function createDemande(page: Page, data: {
  type: string;
  objet: string;
  description: string;
}) {
  await page.goto('/demandes/nouveau');
  await page.selectOption('select[name="typeDemande"]', data.type);
  await page.fill('input[name="objet"]', data.objet);
  await page.fill('textarea[name="description"]', data.description);
  await page.click('button[type="submit"]');
  
  await page.waitForSelector('[data-testid="demande-numero"]');
  return page.locator('[data-testid="demande-numero"]').textContent();
}

export async function expectToast(page: Page, message: string) {
  await expect(page.locator('.toast-success, .toast-error, .toast-info')).toContainText(message);
}
```

---

## Bonnes pratiques E2E

1. **data-testid**: Utilisez pour les éléments sans texte sémantique
2. **Fixtures**: Créez des fixtures pour les états communs (auth)
3. **Pas de waits fixes**: Utilisez `waitForURL`, `waitForSelector`
4. **Tests indépendants**: Chaque test doit pouvoir s'exécuter seul
5. **Nettoyage**: Utilisez `beforeEach` pour réinitialiser l'état
