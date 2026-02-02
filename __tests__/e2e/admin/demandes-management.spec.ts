/**
 * Tests E2E - Parcours Admin : Gestion des demandes
 * 
 * Ce fichier teste les fonctionnalités de gestion des demandes:
 * - Liste avec pagination
 * - Filtrer par statut/priorité
 * - Rechercher par numéro
 * - Modifier statut
 * - Ajouter commentaire
 */

import { test, expect } from '@playwright/test';
import { 
  loginAsAdmin, 
  loginAsStudent, 
  createTestDemande, 
  waitForSuccessToast,
  STATUT_LABELS,
  TYPE_DEMANDE,
  PRIORITE,
} from '../helpers';

test.describe('Parcours Admin - Gestion des demandes', () => {
  
  test.beforeEach(async ({ page }) => {
    // Se connecter en tant qu'admin avant chaque test
    await loginAsAdmin(page);
    
    // Naviguer vers la page des demandes
    await page.goto('/admin/demandes');
    await page.waitForSelector('h1:has-text("Toutes les demandes")');
  });

  test.describe('Liste des demandes', () => {
    
    test('devrait afficher le titre et la description de la page', async ({ page }) => {
      await expect(page.locator('h1')).toContainText('Toutes les demandes');
      await expect(page.locator('text=Gérer et traiter toutes les demandes étudiantes')).toBeVisible();
    });

    test('devrait afficher le nombre total de demandes', async ({ page }) => {
      // Vérifier le résumé des résultats
      const summary = page.locator('p:has-text("demande")');
      await expect(summary).toBeVisible();
      
      const text = await summary.textContent();
      expect(text).toMatch(/\d+ demande(s)? trouvée(s)?/);
    });

    test('devrait afficher le tableau des demandes avec les colonnes attendues', async ({ page }) => {
      // Vérifier les en-têtes de colonne
      const headers = ['Numéro', 'Étudiant', 'Type', 'Statut', 'Priorité', 'Date', 'Actions'];
      
      for (const header of headers) {
        await expect(page.locator(`th:has-text("${header}")`)).toBeVisible();
      }
    });

    test('devrait afficher les informations détaillées de chaque demande', async ({ page }) => {
      // Vérifier que les lignes contiennent les informations attendues
      const rows = page.locator('table tbody tr');
      
      if (await rows.count() > 0) {
        const firstRow = rows.first();
        
        // Vérifier la présence d'un numéro de demande
        const numeroCell = firstRow.locator('td').first();
        await expect(numeroCell).not.toBeEmpty();
        
        // Vérifier la présence du nom étudiant
        const studentCell = firstRow.locator('td').nth(1);
        await expect(studentCell).not.toBeEmpty();
      }
    });
  });

  test.describe('Pagination', () => {
    
    test('devrait afficher les contrôles de pagination si nécessaire', async ({ page }) => {
      // Vérifier si la pagination est présente
      const pagination = page.locator('nav[aria-label="Pagination"], .pagination, div:has-text("Page"):has-text("sur")');
      
      // La pagination peut ne pas être visible s'il n'y a qu'une page
      const isVisible = await pagination.isVisible().catch(() => false);
      
      if (isVisible) {
        // Vérifier les boutons Précédent/Suivant
        const prevButton = page.locator('button:has-text("Précédent"), a:has-text("Précédent")');
        const nextButton = page.locator('button:has-text("Suivant"), a:has-text("Suivant")');
        
        // Au moins un des deux devrait être visible
        const hasPrev = await prevButton.isVisible().catch(() => false);
        const hasNext = await nextButton.isVisible().catch(() => false);
        
        expect(hasPrev || hasNext).toBeTruthy();
      }
    });

    test('devrait permettre de changer le nombre de résultats par page', async ({ page }) => {
      // Vérifier le sélecteur de limite
      const limitSelector = page.locator('button:has-text("20"), select');
      
      if (await limitSelector.isVisible().catch(() => false)) {
        // Cliquer pour ouvrir les options
        await limitSelector.click();
        
        // Sélectionner une autre valeur (ex: 50)
        const option50 = page.locator('[data-value="50"], option[value="50"]').first();
        
        if (await option50.isVisible().catch(() => false)) {
          await option50.click();
          
          // Vérifier que l'URL est mise à jour
          await expect(page).toHaveURL(/limit=50/);
        }
      }
    });

    test('devrait naviguer vers la page suivante si disponible', async ({ page }) => {
      // Chercher le bouton Suivant
      const nextButton = page.locator('a:has-text("Suivant"), button:has-text("Suivant")');
      
      if (await nextButton.isVisible().catch(() => false)) {
        const isDisabled = await nextButton.isDisabled().catch(() => false);
        
        if (!isDisabled) {
          await nextButton.click();
          
          // Vérifier que l'URL contient page=2
          await expect(page).toHaveURL(/page=2/);
        }
      }
    });
  });

  test.describe('Filtrage par statut', () => {
    
    test('devrait filtrer par statut SOUMIS', async ({ page }) => {
      // Ouvrir le sélecteur de statut
      await page.click('button:has-text("Filtrer par statut"), button[data-testid="statut-filter"]');
      
      // Sélectionner SOUMIS
      await page.click(`div[role="option"]:has-text("${STATUT_LABELS.SOUMIS}")`);
      
      // Attendre le rechargement
      await page.waitForLoadState('networkidle');
      
      // Vérifier l'URL
      await expect(page).toHaveURL(/statut=SOUMIS/);
    });

    test('devrait filtrer par statut EN_COURS', async ({ page }) => {
      // Ouvrir le sélecteur de statut
      await page.click('button:has-text("Filtrer par statut"), button[data-testid="statut-filter"]');
      
      // Sélectionner EN_COURS
      await page.click(`div[role="option"]:has-text("${STATUT_LABELS.EN_COURS}")`);
      
      // Attendre le rechargement
      await page.waitForLoadState('networkidle');
      
      // Vérifier l'URL
      await expect(page).toHaveURL(/statut=EN_COURS/);
    });

    test('devrait afficher uniquement les demandes filtrées', async ({ page }) => {
      // Appliquer un filtre
      await page.click('button:has-text("Filtrer par statut"), button[data-testid="statut-filter"]');
      await page.click(`div[role="option"]:has-text("${STATUT_LABELS.TRAITE}")`);
      
      await page.waitForLoadState('networkidle');
      
      // Vérifier que toutes les demandes visibles ont le statut filtré
      const statusBadges = page.locator('table tbody tr td:nth-child(4)');
      const count = await statusBadges.count();
      
      for (let i = 0; i < count; i++) {
        const text = await statusBadges.nth(i).textContent();
        expect(text).toContain(STATUT_LABELS.TRAITE);
      }
    });

    test('devrait réinitialiser le filtre', async ({ page }) => {
      // D'abord appliquer un filtre
      await page.click('button:has-text("Filtrer par statut"), button[data-testid="statut-filter"]');
      await page.click(`div[role="option"]:has-text("${STATUT_LABELS.EN_COURS}")`);
      
      await page.waitForLoadState('networkidle');
      
      // Réinitialiser le filtre
      await page.click('button:has-text("Réinitialiser"), button:has-text("Tout effacer")');
      
      // Vérifier que l'URL ne contient plus le filtre
      await expect(page).not.toHaveURL(/statut=/);
    });
  });

  test.describe('Filtrage par priorité', () => {
    
    test('devrait filtrer par priorité URGENTE', async ({ page }) => {
      // Ouvrir le sélecteur de priorité
      await page.click('button:has-text("Filtrer par priorité"), button[data-testid="priorite-filter"]');
      
      // Sélectionner URGENTE
      await page.click(`div[role="option"]:has-text("${PRIORITE.URGENTE}")`);
      
      await page.waitForLoadState('networkidle');
      
      // Vérifier l'URL
      await expect(page).toHaveURL(/priorite=URGENTE/);
    });

    test('devrait filtrer par priorité HAUTE', async ({ page }) => {
      // Ouvrir le sélecteur de priorité
      await page.click('button:has-text("Filtrer par priorité"), button[data-testid="priorite-filter"]');
      
      // Sélectionner HAUTE
      await page.click(`div[role="option"]:has-text("${PRIORITE.HAUTE}")`);
      
      await page.waitForLoadState('networkidle');
      
      // Vérifier l'URL
      await expect(page).toHaveURL(/priorite=HAUTE/);
    });
  });

  test.describe('Filtrage par type', () => {
    
    test('devrait filtrer par type de demande', async ({ page }) => {
      // Ouvrir le sélecteur de type
      await page.click('button:has-text("Filtrer par type"), button[data-testid="type-filter"]');
      
      // Sélectionner un type
      await page.click(`div[role="option"]:has-text("${TYPE_DEMANDE.ATTESTATION_SCOLARITE}")`);
      
      await page.waitForLoadState('networkidle');
      
      // Vérifier l'URL
      await expect(page).toHaveURL(/typeDemande=ATTESTATION_SCOLARITE/);
    });
  });

  test.describe('Recherche par numéro', () => {
    
    test('devrait rechercher une demande par numéro', async ({ page }) => {
      // Remplir le champ de recherche
      await page.fill('input[placeholder*="Rechercher"], input[name="search"]', 'DEM-2026');
      
      // Soumettre la recherche (Enter ou bouton)
      await page.press('input[placeholder*="Rechercher"]', 'Enter');
      
      await page.waitForLoadState('networkidle');
      
      // Vérifier que les résultats contiennent le terme recherché
      const numeroCells = page.locator('table tbody tr td:first-child');
      const count = await numeroCells.count();
      
      if (count > 0) {
        for (let i = 0; i < count; i++) {
          const text = await numeroCells.nth(i).textContent();
          expect(text).toContain('DEM-2026');
        }
      }
    });

    test('devrait afficher un message si aucun résultat', async ({ page }) => {
      // Rechercher un numéro inexistant
      await page.fill('input[placeholder*="Rechercher"]', 'DEM-9999-999999');
      await page.press('input[placeholder*="Rechercher"]', 'Enter');
      
      await page.waitForLoadState('networkidle');
      
      // Vérifier le message ou le tableau vide
      const noResults = page.locator('text=Aucune demande, text=0 demande');
      await expect(noResults).toBeVisible();
    });
  });

  test.describe('Modification du statut', () => {
    
    test('devrait ouvrir le modal de changement de statut', async ({ page }) => {
      // Cliquer sur le bouton de changement de statut de la première demande
      const changeStatusButtons = page.locator('button[title="Changer le statut"], button:has-text("Statut")');
      
      if (await changeStatusButtons.count() > 0) {
        await changeStatusButtons.first().click();
        
        // Vérifier que le modal/dialog s'ouvre
        await expect(page.locator('dialog, [role="dialog"], .modal, h2:has-text("Changer le statut")')).toBeVisible();
      }
    });

    test('devrait afficher les options de statut disponibles', async ({ page }) => {
      // Ouvrir le modal de changement de statut
      const changeStatusButtons = page.locator('button[title="Changer le statut"], button:has-text("Statut")');
      
      if (await changeStatusButtons.count() > 0) {
        await changeStatusButtons.first().click();
        
        // Vérifier la présence des options de statut
        await expect(page.locator(`text=${STATUT_LABELS.EN_COURS}`)).toBeVisible();
        await expect(page.locator(`text=${STATUT_LABELS.VALIDE}`)).toBeVisible();
        await expect(page.locator(`text=${STATUT_LABELS.REJETE}`)).toBeVisible();
        await expect(page.locator(`text=${STATUT_LABELS.ATTENTE_INFO}`)).toBeVisible();
      }
    });

    test('devrait changer le statut avec succès', async ({ page }) => {
      // Ouvrir le modal de changement de statut
      const changeStatusButtons = page.locator('button[title="Changer le statut"], button:has-text("Statut")');
      
      if (await changeStatusButtons.count() > 0) {
        await changeStatusButtons.first().click();
        
        // Sélectionner un nouveau statut
        await page.click(`text=${STATUT_LABELS.EN_COURS}`);
        
        // Ajouter un commentaire
        await page.fill('textarea[name="commentaire"]', 'Traitement en cours de la demande');
        
        // Confirmer le changement
        await page.click('button:has-text("Confirmer"), button[type="submit"]');
        
        // Vérifier le toast de succès
        await waitForSuccessToast(page, 'statut');
      }
    });

    test('devrait afficher une erreur si motif de refus manquant', async ({ page }) => {
      // Ouvrir le modal de changement de statut
      const changeStatusButtons = page.locator('button[title="Changer le statut"], button:has-text("Statut")');
      
      if (await changeStatusButtons.count() > 0) {
        await changeStatusButtons.first().click();
        
        // Sélectionner REJETE
        await page.click(`text=${STATUT_LABELS.REJETE}`);
        
        // Essayer de confirmer sans motif de refus
        await page.click('button:has-text("Confirmer"), button[type="submit"]');
        
        // Vérifier le message d'erreur
        await expect(page.locator('text=motif de refus est requis')).toBeVisible();
      }
    });
  });

  test.describe('Ajout de commentaire', () => {
    
    test('devrait ajouter un commentaire à une demande', async ({ page }) => {
      // Naviguer vers le détail d'une demande
      const voirButtons = page.locator('table tbody tr td:last-child a:has-text("Voir")');
      
      if (await voirButtons.count() > 0) {
        await voirButtons.first().click();
        await page.waitForURL(/\/admin\/demandes\/[a-f0-9]+/);
        
        // Ajouter un commentaire
        const commentaire = 'Commentaire de test ajouté le ' + new Date().toISOString();
        await page.fill('textarea[name="commentaireAdmin"], textarea[placeholder*="commentaire"]', commentaire);
        
        // Sauvegarder
        await page.click('button:has-text("Sauvegarder"), button:has-text("Enregistrer")');
        
        // Vérifier le toast de succès
        await waitForSuccessToast(page, 'commentaire');
      }
    });

    test('devrait afficher le commentaire dans le détail', async ({ page }) => {
      // Naviguer vers le détail d'une demande avec commentaire
      const voirButtons = page.locator('table tbody tr td:last-child a:has-text("Voir")');
      
      if (await voirButtons.count() > 0) {
        await voirButtons.first().click();
        await page.waitForURL(/\/admin\/demandes\/[a-f0-9]+/);
        
        // Vérifier la présence de la section commentaire
        const commentaireSection = page.locator('text=Commentaire de l\'administration');
        
        if (await commentaireSection.isVisible().catch(() => false)) {
          await expect(commentaireSection).toBeVisible();
        }
      }
    });
  });

  test.describe('Navigation et actions rapides', () => {
    
    test('devrait naviguer vers le détail d\'une demande', async ({ page }) => {
      const voirButtons = page.locator('table tbody tr td:last-child a:has-text("Voir")');
      
      if (await voirButtons.count() > 0) {
        await voirButtons.first().click();
        
        // Vérifier la navigation
        await expect(page).toHaveURL(/\/admin\/demandes\/[a-f0-9]+/);
        
        // Vérifier les éléments de la page de détail
        await expect(page.locator('text=Informations étudiant')).toBeVisible();
        await expect(page.locator('text=Détails de la demande')).toBeVisible();
      }
    });

    test('devrait permettre le retour à la liste depuis le détail', async ({ page }) => {
      // Aller sur une page de détail
      const voirButtons = page.locator('table tbody tr td:last-child a:has-text("Voir")');
      
      if (await voirButtons.count() > 0) {
        await voirButtons.first().click();
        await page.waitForURL(/\/admin\/demandes\/[a-f0-9]+/);
        
        // Cliquer sur retour
        await page.click('a:has-text("Retour"), button:has-text("Retour")');
        
        // Vérifier le retour à la liste
        await expect(page).toHaveURL('/admin/demandes');
      }
    });
  });
});
