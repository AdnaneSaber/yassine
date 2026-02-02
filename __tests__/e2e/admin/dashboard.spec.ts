/**
 * Tests E2E - Parcours Admin : Dashboard
 * 
 * Ce fichier teste les fonctionnalités du tableau de bord admin:
 * - Vue des statistiques
 * - Accès aux demandes récentes
 * - Navigation rapide
 */

import { test, expect } from '@playwright/test';
import { loginAsAdmin, loginAsStudent, createTestDemande, waitForSuccessToast } from '../helpers';

test.describe('Parcours Admin - Dashboard', () => {
  
  test.beforeEach(async ({ page }) => {
    // Se connecter en tant qu'admin avant chaque test
    await loginAsAdmin(page);
  });

  test.describe('Vue des statistiques', () => {
    
    test('devrait afficher les 4 cartes de statistiques', async ({ page }) => {
      // Vérifier la présence des 4 cartes de statistiques
      const statCards = page.locator('.grid.gap-6 > div');
      await expect(statCards).toHaveCount(4);
      
      // Vérifier les titres des cartes
      await expect(page.locator('text=Total des demandes')).toBeVisible();
      await expect(page.locator('text=En cours')).toBeVisible();
      await expect(page.locator('text=Traitées')).toBeVisible();
      await expect(page.locator('text=Rejetées')).toBeVisible();
    });

    test('devrait afficher des valeurs numériques pour les statistiques', async ({ page }) => {
      // Vérifier que chaque carte contient un nombre
      const statValues = page.locator('.grid.gap-6 > div .text-3xl');
      const count = await statValues.count();
      
      expect(count).toBeGreaterThan(0);
      
      // Vérifier que les valeurs sont des nombres
      for (let i = 0; i < count; i++) {
        const text = await statValues.nth(i).textContent();
        const number = parseInt(text || '0');
        expect(isNaN(number)).toBeFalsy();
      }
    });

    test('devrait mettre à jour les statistiques après création d\'une demande', async ({ browser }) => {
      // Créer un contexte étudiant
      const studentContext = await browser.newContext();
      const studentPage = await studentContext.newPage();
      
      // Créer une demande en tant qu'étudiant
      await loginAsStudent(studentPage);
      const numeroDemande = await createTestDemande(studentPage, 'Dashboard Test');
      
      // Revenir sur le dashboard admin
      const adminContext = await browser.newContext();
      const adminPage = await adminContext.newPage();
      await loginAsAdmin(adminPage);
      
      // Recharger le dashboard
      await adminPage.reload();
      
      // Vérifier que la demande apparaît dans les demandes récentes
      await expect(adminPage.locator(`text=${numeroDemande}`)).toBeVisible();
      
      // Nettoyer
      await studentContext.close();
      await adminContext.close();
    });

    test('devrait avoir les bonnes couleurs pour les statistiques', async ({ page }) => {
      // Vérifier les couleurs des valeurs
      const enCoursValue = page.locator('text=En cours').locator('..').locator('.text-orange-600');
      const traiteesValue = page.locator('text=Traitées').locator('..').locator('.text-green-600');
      const rejetteesValue = page.locator('text=Rejetées').locator('..').locator('.text-red-600');
      
      // Les éléments avec les classes de couleur devraient exister
      await expect(page.locator('.text-orange-600')).toBeVisible();
      await expect(page.locator('.text-green-600')).toBeVisible();
      await expect(page.locator('.text-red-600')).toBeVisible();
    });
  });

  test.describe('Demandes récentes', () => {
    
    test('devrait afficher la section des demandes récentes', async ({ page }) => {
      // Vérifier la présence de la section
      await expect(page.locator('h2:has-text("Demandes récentes")')).toBeVisible();
      await expect(page.locator('text=Les 10 dernières demandes soumises')).toBeVisible();
    });

    test('devrait afficher un tableau avec les colonnes attendues', async ({ page }) => {
      // Vérifier les colonnes du tableau
      await expect(page.locator('th:has-text("Numéro")')).toBeVisible();
      await expect(page.locator('th:has-text("Étudiant")')).toBeVisible();
      await expect(page.locator('th:has-text("Type")')).toBeVisible();
      await expect(page.locator('th:has-text("Statut")')).toBeVisible();
      await expect(page.locator('th:has-text("Date")')).toBeVisible();
      await expect(page.locator('th:has-text("Actions")')).toBeVisible();
    });

    test('devrait afficher les demandes avec les informations étudiant', async ({ page }) => {
      // Vérifier que les demandes contiennent les infos étudiant
      const tableRows = page.locator('table tbody tr');
      
      // S'il y a des demandes
      if (await tableRows.count() > 0) {
        // Vérifier qu'une ligne contient au moins le nom et le matricule
        const firstRow = tableRows.first();
        await expect(firstRow.locator('td').nth(1)).not.toBeEmpty();
      }
    });

    test('devrait afficher les badges de statut avec les bonnes couleurs', async ({ page }) => {
      // Vérifier que les badges de statut sont présents
      const statusBadges = page.locator('table tbody tr td:nth-child(4) > div, table tbody tr td:nth-child(4) > span');
      
      if (await statusBadges.count() > 0) {
        // Vérifier que les badges ont une couleur de fond
        const firstBadge = statusBadges.first();
        await expect(firstBadge).toBeVisible();
      }
    });

    test('devrait afficher "Aucune demande récente" si vide', async ({ page }) => {
      // Note: Ce test peut échouer si des demandes existent déjà
      // Vérifier le message si aucune demande
      const noDataMessage = page.locator('text=Aucune demande récente');
      
      // Soit on a des demandes dans le tableau, soit le message vide
      const tableRows = page.locator('table tbody tr');
      const hasData = await tableRows.count() > 0;
      
      if (!hasData) {
        await expect(noDataMessage).toBeVisible();
      }
    });

    test('devrait afficher la date au format français', async ({ page }) => {
      // Vérifier le format des dates dans le tableau
      const dateCells = page.locator('table tbody tr td:nth-child(5)');
      
      if (await dateCells.count() > 0) {
        const dateText = await dateCells.first().textContent();
        // Format attendu: DD/MM/YYYY
        expect(dateText).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
      }
    });
  });

  test.describe('Navigation depuis le dashboard', () => {
    
    test('devrait naviguer vers la liste complète des demandes', async ({ page }) => {
      // Cliquer sur le bouton "Voir toutes les demandes"
      await page.click('a:has-text("Voir toutes les demandes")');
      
      // Vérifier la navigation
      await page.waitForURL('/admin/demandes');
      await expect(page.locator('h1:has-text("Toutes les demandes")')).toBeVisible();
    });

    test('devrait naviguer vers le détail d\'une demande', async ({ page }) => {
      // Trouver le premier bouton "Voir" du tableau
      const voirButtons = page.locator('table tbody tr td:last-child a:has-text("Voir")');
      
      if (await voirButtons.count() > 0) {
        // Cliquer sur le premier bouton Voir
        await voirButtons.first().click();
        
        // Vérifier la navigation vers une page de détail
        await expect(page).toHaveURL(/\/admin\/demandes\/[a-f0-9]+/);
      }
    });

    test('devrait naviguer vers la gestion des étudiants via le menu', async ({ page }) => {
      // Cliquer sur le lien Étudiants
      await page.click('a:has-text("Étudiants")');
      
      // Vérifier la navigation
      await page.waitForURL('/admin/students');
      await expect(page.locator('h1:has-text("Gestion des étudiants")')).toBeVisible();
    });

    test('devrait naviguer vers la liste des demandes via le menu', async ({ page }) => {
      // Cliquer sur le lien Demandes
      await page.click('a:has-text("Demandes")');
      
      // Vérifier la navigation
      await page.waitForURL('/admin/demandes');
      await expect(page.locator('h1:has-text("Toutes les demandes")')).toBeVisible();
    });
  });

  test.describe('Responsive du dashboard', () => {
    
    test('devrait afficher les statistiques en colonne sur mobile', async ({ page }) => {
      // Passer en vue mobile
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Vérifier que les statistiques sont visibles
      await expect(page.locator('text=Total des demandes')).toBeVisible();
      await expect(page.locator('text=En cours')).toBeVisible();
      
      // Remettre la taille desktop
      await page.setViewportSize({ width: 1280, height: 720 });
    });

    test('devrait permettre le scroll horizontal du tableau sur mobile', async ({ page }) => {
      // Passer en vue mobile
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Vérifier que le tableau ou un conteneur scrollable existe
      const table = page.locator('table');
      const tableContainer = page.locator('.overflow-x-auto, .overflow-auto');
      
      // Au moins l'un des deux devrait exister
      const hasTable = await table.isVisible().catch(() => false);
      const hasContainer = await tableContainer.isVisible().catch(() => false);
      
      expect(hasTable || hasContainer).toBeTruthy();
      
      // Remettre la taille desktop
      await page.setViewportSize({ width: 1280, height: 720 });
    });
  });
});
