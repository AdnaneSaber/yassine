/**
 * Exemple de test E2E avec Playwright
 * À copier/modifier dans: __tests__/e2e/demandes/creation.spec.ts
 */

import { test, expect } from '@playwright/test';

// Helper pour le login
async function loginAsStudent(page: any) {
  await page.goto('/auth/login');
  await page.fill('[name="email"]', 'adnane.saber@university.edu');
  await page.fill('[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL('/demandes');
}

async function loginAsAdmin(page: any) {
  await page.goto('/auth/login');
  await page.fill('[name="email"]', 'admin@university.edu');
  await page.fill('[name="password"]', 'Admin123!');
  await page.click('button[type="submit"]');
  await page.waitForURL('/admin/dashboard');
}

test.describe('Création de demande', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsStudent(page);
  });

  test('crée une nouvelle demande complète', async ({ page }) => {
    // Aller sur la page de création
    await page.click('text=Nouvelle demande');
    await page.waitForURL('/demandes/nouveau');

    // Vérifier le titre
    await expect(page.locator('h1')).toContainText('Nouvelle demande');

    // Remplir le formulaire
    await page.selectOption('select[name="typeDemande"]', 'ATTESTATION');
    await page.fill('input[name="objet"]', 'Demande E2E - Attestation de scolarité');
    await page.fill('textarea[name="description"]', 
      'Je souhaite obtenir une attestation de scolarité pour mon stage de fin d\'études ' +
      'qui commence le 1er mars 2026. Cette attestation est requise par mon entreprise d\'accueil.'
    );
    await page.selectOption('select[name="priorite"]', 'HAUTE');

    // Soumettre
    await page.click('button[type="submit"]');

    // Attendre et vérifier le succès
    await expect(page.locator('.toast-success')).toContainText('Demande créée avec succès');

    // Vérifier redirection vers détails
    await page.waitForURL(/\/demandes\/[a-z0-9]+/);

    // Vérifier les détails affichés
    await expect(page.locator('h1')).toContainText('Demande E2E');
    await expect(page.locator('[data-testid="demande-numero"]')).toBeVisible();
    await expect(page.locator('[data-testid="statut-badge"]')).toContainText('Soumis');

    // Vérifier que le numéro suit le format
    const numero = await page.locator('[data-testid="demande-numero"]').textContent();
    expect(numero).toMatch(/DEM-\d{4}-\d{6}/);
  });

  test('affiche les erreurs de validation', async ({ page }) => {
    await page.click('text=Nouvelle demande');
    await page.waitForURL('/demandes/nouveau');

    // Soumettre sans remplir
    await page.click('button[type="submit"]');

    // Vérifier les erreurs
    await expect(page.locator('text=Objet doit contenir au moins 5 caractères')).toBeVisible();
    await expect(page.locator('text=Description doit contenir au moins 10 caractères')).toBeVisible();
  });

  test('vérifie le workflow de statut', async ({ page, browser }) => {
    // Créer la demande
    await page.click('text=Nouvelle demande');
    await page.selectOption('select[name="typeDemande"]', 'RELEVE_NOTES');
    await page.fill('input[name="objet"]', 'Test workflow statut');
    await page.fill('textarea[name="description"]', 'Description pour tester le workflow complet');
    await page.click('button[type="submit"]');

    await page.waitForURL(/\/demandes\/[a-z0-9]+/);
    
    // Noter le numéro
    const numero = await page.locator('[data-testid="demande-numero"]').textContent();

    // Attendre transition auto SOUMIS → RECU
    await page.waitForTimeout(2000);
    await page.reload();

    // Vérifier statut RECU
    await expect(page.locator('[data-testid="statut-badge"]')).toContainText('Reçu');

    // Admin change le statut
    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();
    await loginAsAdmin(adminPage);

    // Trouver la demande dans la liste admin
    await adminPage.goto('/admin/demandes');
    await adminPage.fill('[placeholder="Rechercher..."]', numero || '');
    await adminPage.click(`text=${numero}`);

    // Passer à EN_COURS
    await adminPage.selectOption('select[name="statut"]', 'EN_COURS');
    await adminPage.fill('textarea[name="commentaire"]', 'Votre demande est en cours de traitement');
    await adminPage.click('text=Mettre à jour le statut');

    await expect(adminPage.locator('.toast-success')).toContainText('Statut mis à jour');

    // Étudiant voit le changement
    await page.reload();
    await expect(page.locator('[data-testid="statut-badge"]')).toContainText('En cours');
    await expect(page.locator('[data-testid="commentaire-admin"]')).toContainText('en cours de traitement');

    await adminContext.close();
  });
});

test.describe('Gestion des demandes', () => {
  test('modifie une demande existante', async ({ page }) => {
    await loginAsStudent(page);

    // Créer une demande d'abord
    await page.click('text=Nouvelle demande');
    await page.selectOption('select[name="typeDemande"]', 'ATTESTATION');
    await page.fill('input[name="objet"]', 'Demande à modifier');
    await page.fill('textarea[name="description"]', 'Description initiale');
    await page.click('button[type="submit"]');

    await page.waitForURL(/\/demandes\/[a-z0-9]+/);

    // Aller sur la page d'édition
    await page.click('text=Modifier');
    await page.waitForURL(/\/demandes\/[a-z0-9]+\/edit/);

    // Modifier
    await page.fill('input[name="objet"]', 'Demande modifiée !');
    await page.click('button[type="submit"]');

    // Vérifier
    await expect(page.locator('.toast-success')).toContainText('mise à jour');
    await expect(page.locator('h1')).toContainText('Demande modifiée !');
  });

  test('supprime une demande', async ({ page }) => {
    await loginAsStudent(page);

    // Créer puis supprimer
    await page.click('text=Nouvelle demande');
    await page.selectOption('select[name="typeDemande"]', 'ATTESTATION');
    await page.fill('input[name="objet"]', 'Demande à supprimer');
    await page.fill('textarea[name="description"]', 'Description');
    await page.click('button[type="submit"]');

    await page.waitForURL(/\/demandes\/[a-z0-9]+/);

    // Supprimer (accepter la confirmation)
    page.on('dialog', dialog => dialog.accept());
    await page.click('text=Supprimer');

    // Vérifier redirection et message
    await page.waitForURL('/demandes');
    await expect(page.locator('.toast-success')).toContainText('supprimée');
    await expect(page.locator('text=Demande à supprimer')).not.toBeVisible();
  });
});
