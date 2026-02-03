/**
 * Tests E2E - Parcours Admin : Gestion des étudiants
 * 
 * Ce fichier teste les fonctionnalités de gestion des étudiants:
 * - Liste des étudiants
 * - Ajouter étudiant
 * - Reset password
 */

import { test, expect } from '@playwright/test';
import { loginAsAdmin, waitForSuccessToast } from '../helpers';

test.describe('Parcours Admin - Gestion des étudiants', () => {
  
  test.beforeEach(async ({ page }) => {
    // Se connecter en tant qu'admin avant chaque test
    await loginAsAdmin(page);
  });

  test.describe('Liste des étudiants', () => {
    
    test('devrait afficher la page de gestion des étudiants', async ({ page }) => {
      // Naviguer vers la page des étudiants
      await page.goto('/admin/students');
      
      // Vérifier le titre
      await expect(page.locator('h1')).toContainText('Gestion des étudiants');
      await expect(page.locator('text=Gérer les comptes étudiants et leurs accès')).toBeVisible();
    });

    test('devrait afficher le nombre total d\'étudiants', async ({ page }) => {
      await page.goto('/admin/students');
      
      // Vérifier le résumé
      const summary = page.locator('p:has-text("étudiant")');
      await expect(summary).toBeVisible();
      
      const text = await summary.textContent();
      expect(text).toMatch(/\d+ étudiant(s)? trouvé(s)?/);
    });

    test('devrait afficher le tableau des étudiants avec les colonnes attendues', async ({ page }) => {
      await page.goto('/admin/students');
      
      // Vérifier les en-têtes de colonne
      const headers = ['Matricule', 'Nom', 'Email', 'Filière', 'Niveau', 'Actions'];
      
      for (const header of headers) {
        await expect(page.locator(`th:has-text("${header}")`)).toBeVisible();
      }
    });

    test('devrait afficher les informations de chaque étudiant', async ({ page }) => {
      await page.goto('/admin/students');
      
      // Vérifier que les lignes contiennent les informations
      const rows = page.locator('table tbody tr');
      
      if (await rows.count() > 0) {
        const firstRow = rows.first();
        
        // Vérifier la présence d'un matricule
        const matriculeCell = firstRow.locator('td').first();
        await expect(matriculeCell).not.toBeEmpty();
        
        // Vérifier la présence du nom
        const nameCell = firstRow.locator('td').nth(1);
        await expect(nameCell).not.toBeEmpty();
        
        // Vérifier la présence de l'email
        const emailCell = firstRow.locator('td').nth(2);
        await expect(emailCell).not.toBeEmpty();
      }
    });

    test('devrait afficher le bouton pour ajouter un étudiant', async ({ page }) => {
      await page.goto('/admin/students');
      
      // Vérifier le bouton d'ajout
      const addButton = page.locator('a:has-text("Ajouter un étudiant"), button:has-text("Ajouter un étudiant")');
      await expect(addButton).toBeVisible();
    });

    test('devrait naviguer vers la page d\'ajout d\'étudiant', async ({ page }) => {
      await page.goto('/admin/students');
      
      // Cliquer sur le bouton d'ajout
      await page.click('a:has-text("Ajouter un étudiant")');
      
      // Vérifier la navigation
      await page.waitForURL('/admin/students/new');
      await expect(page.locator('h1')).toContainText('Ajouter un étudiant');
    });
  });

  test.describe('Pagination des étudiants', () => {
    
    test('devrait afficher les contrôles de pagination si nécessaire', async ({ page }) => {
      await page.goto('/admin/students');
      
      // Vérifier si la pagination est présente
      const pagination = page.locator('nav[aria-label="Pagination"], .pagination, div:has-text("Page"):has-text("sur")');
      
      const isVisible = await pagination.isVisible().catch(() => false);
      
      if (isVisible) {
        const prevButton = page.locator('button:has-text("Précédent"), a:has-text("Précédent")');
        const nextButton = page.locator('button:has-text("Suivant"), a:has-text("Suivant")');
        
        const hasPrev = await prevButton.isVisible().catch(() => false);
        const hasNext = await nextButton.isVisible().catch(() => false);
        
        expect(hasPrev || hasNext).toBeTruthy();
      }
    });

    test('devrait naviguer entre les pages si pagination existe', async ({ page }) => {
      await page.goto('/admin/students');
      
      const nextButton = page.locator('a:has-text("Suivant")');
      
      if (await nextButton.isVisible().catch(() => false)) {
        await nextButton.click();
        await expect(page).toHaveURL(/page=2/);
      }
    });
  });

  test.describe('Ajout d\'un étudiant', () => {
    
    test('devrait afficher le formulaire d\'ajout d\'étudiant', async ({ page }) => {
      await page.goto('/admin/students/new');
      
      // Vérifier le titre et la description
      await expect(page.locator('h1')).toContainText('Ajouter un étudiant');
      await expect(page.locator('text=Créer un nouveau compte étudiant')).toBeVisible();
      
      // Vérifier la présence du formulaire
      await expect(page.locator('form')).toBeVisible();
    });

    test('devrait avoir tous les champs requis', async ({ page }) => {
      await page.goto('/admin/students/new');
      
      // Vérifier les champs du formulaire
      const requiredFields = [
        { name: 'matricule', label: 'Matricule' },
        { name: 'nom', label: 'Nom' },
        { name: 'prenom', label: 'Prénom' },
        { name: 'email', label: 'Email' },
        { name: 'dateNaissance', label: 'Date de naissance' },
        { name: 'filiere', label: 'Filière' },
        { name: 'niveau', label: 'Niveau' },
      ];
      
      for (const field of requiredFields) {
        const input = page.locator(`input[name="${field.name}"], select[name="${field.name}"]`).first();
        await expect(input).toBeVisible();
      }
    });

    test('devrait créer un nouvel étudiant avec succès', async ({ page }) => {
      await page.goto('/admin/students/new');
      
      // Remplir le formulaire
      const timestamp = Date.now();
      const matricule = `TEST${timestamp.toString().slice(-6)}`;
      
      await page.fill('input[name="matricule"]', matricule);
      await page.fill('input[name="nom"]', 'TestNom');
      await page.fill('input[name="prenom"]', 'TestPrenom');
      await page.fill('input[name="email"]', `test.${timestamp}@university.edu`);
      await page.fill('input[name="dateNaissance"]', '2000-01-15');
      await page.fill('input[name="filiere"]', 'Informatique');
      
      // Sélectionner le niveau
      await page.click('button:has-text("Sélectionner un niveau"), select[name="niveau"]');
      await page.click('div[role="option"]:has-text("Licence 1"), option[value="L1"]');
      
      // Soumettre le formulaire
      await page.click('button[type="submit"]');
      
      // Vérifier le toast de succès
      await waitForSuccessToast(page, 'créé');
      
      // Vérifier la redirection vers la liste
      await page.waitForURL('/admin/students');
      
      // Vérifier que l'étudiant apparaît dans la liste
      await expect(page.locator(`text=${matricule}`)).toBeVisible();
    });

    test('devrait afficher une erreur si le matricule existe déjà', async ({ page }) => {
      await page.goto('/admin/students/new');
      
      // Remplir avec un matricule existant
      await page.fill('input[name="matricule"]', 'AD2023001'); // Matricule de l'étudiant de test
      await page.fill('input[name="nom"]', 'Test');
      await page.fill('input[name="prenom"]', 'Test');
      await page.fill('input[name="email"]', `test.${Date.now()}@university.edu`);
      await page.fill('input[name="dateNaissance"]', '2000-01-15');
      await page.fill('input[name="filiere"]', 'Test');
      
      // Soumettre
      await page.click('button[type="submit"]');
      
      // Vérifier l'erreur
      await expect(page.locator('text=déjà existe, existe déjà, duplicata')).toBeVisible();
    });

    test('devrait afficher une erreur si l\'email existe déjà', async ({ page }) => {
      await page.goto('/admin/students/new');
      
      // Remplir avec un email existant
      await page.fill('input[name="matricule"]', `NEW${Date.now()}`);
      await page.fill('input[name="nom"]', 'Test');
      await page.fill('input[name="prenom"]', 'Test');
      await page.fill('input[name="email"]', 'adnane.saber@university.edu'); // Email de l'étudiant de test
      await page.fill('input[name="dateNaissance"]', '2000-01-15');
      await page.fill('input[name="filiere"]', 'Test');
      
      // Soumettre
      await page.click('button[type="submit"]');
      
      // Vérifier l'erreur
      await expect(page.locator('text=déjà existe, existe déjà, duplicata')).toBeVisible();
    });

    test('devrait valider le format de l\'email', async ({ page }) => {
      await page.goto('/admin/students/new');
      
      // Remplir avec un email invalide
      await page.fill('input[name="email"]', 'email-invalide');
      
      // Vérifier la validation HTML5
      const emailInput = page.locator('input[name="email"]');
      await expect(emailInput).toHaveAttribute('type', 'email');
    });

    test('devrait valider que tous les champs requis sont remplis', async ({ page }) => {
      await page.goto('/admin/students/new');
      
      // Essayer de soumettre sans remplir
      await page.click('button[type="submit"]');
      
      // Vérifier que les champs requis ont l'attribut required
      const requiredInputs = page.locator('input[required]');
      expect(await requiredInputs.count()).toBeGreaterThan(0);
    });

    test('devrait permettre d\'annuler et revenir à la liste', async ({ page }) => {
      await page.goto('/admin/students/new');
      
      // Cliquer sur le bouton d'annulation
      await page.click('a:has-text("Annuler"), button:has-text("Annuler")');
      
      // Vérifier le retour à la liste
      await expect(page).toHaveURL('/admin/students');
    });
  });

  test.describe('Actions sur les étudiants', () => {
    
    test('devrait afficher les actions disponibles pour chaque étudiant', async ({ page }) => {
      await page.goto('/admin/students');
      
      // Vérifier la colonne Actions
      const actionButtons = page.locator('table tbody tr td:last-child button');
      
      if (await actionButtons.count() > 0) {
        await expect(actionButtons.first()).toBeVisible();
      }
    });

    test('devrait ouvrir le menu d\'actions', async ({ page }) => {
      await page.goto('/admin/students');
      
      // Chercher le bouton d'actions
      const actionButton = page.locator('table tbody tr td:last-child button').first();
      
      if (await actionButton.isVisible().catch(() => false)) {
        await actionButton.click();
        
        // Vérifier que le menu s'ouvre
        await expect(page.locator('[role="menu"], .dropdown-menu')).toBeVisible();
      }
    });
  });

  test.describe('Réinitialisation de mot de passe', () => {
    
    test('devrait afficher l\'option de réinitialisation de mot de passe', async ({ page }) => {
      await page.goto('/admin/students');
      
      // Ouvrir le menu d'actions du premier étudiant
      const actionButton = page.locator('table tbody tr td:last-child button').first();
      
      if (await actionButton.isVisible().catch(() => false)) {
        await actionButton.click();
        
        // Vérifier l'option de réinitialisation
        await expect(page.locator('text=Réinitialiser le mot de passe')).toBeVisible();
      }
    });

    test('devrait réinitialiser le mot de passe avec succès', async ({ page }) => {
      await page.goto('/admin/students');
      
      // Ouvrir le menu d'actions
      const actionButton = page.locator('table tbody tr td:last-child button').first();
      
      if (await actionButton.isVisible().catch(() => false)) {
        await actionButton.click();
        
        // Cliquer sur réinitialiser
        await page.click('text=Réinitialiser le mot de passe');
        
        // Confirmer la réinitialisation
        await page.click('button:has-text("Confirmer"), button:has-text("Oui")');
        
        // Vérifier le toast de succès
        await waitForSuccessToast(page, 'mot de passe');
        
        // Vérifier que le nouveau mot de passe est affiché
        await expect(page.locator('text=nouveau mot de passe')).toBeVisible();
      }
    });

    test('devrait afficher le nouveau mot de passe généré', async ({ page }) => {
      await page.goto('/admin/students');
      
      const actionButton = page.locator('table tbody tr td:last-child button').first();
      
      if (await actionButton.isVisible().catch(() => false)) {
        await actionButton.click();
        await page.click('text=Réinitialiser le mot de passe');
        await page.click('button:has-text("Confirmer")');
        
        await waitForSuccessToast(page, 'mot de passe');
        
        // Vérifier qu'un mot de passe temporaire est affiché
        const passwordDisplay = page.locator('code, .password-display, input[type="text"][readonly]');
        
        if (await passwordDisplay.isVisible().catch(() => false)) {
          const password = await passwordDisplay.textContent() || await passwordDisplay.inputValue();
          expect(password?.length).toBeGreaterThan(5);
        }
      }
    });
  });

  test.describe('Recherche d\'étudiants', () => {
    
    test('devrait rechercher un étudiant par nom', async ({ page }) => {
      await page.goto('/admin/students');
      
      // Remplir le champ de recherche
      await page.fill('input[placeholder*="Rechercher"]', 'Saber');
      await page.press('input[placeholder*="Rechercher"]', 'Enter');
      
      await page.waitForLoadState('networkidle');
      
      // Vérifier les résultats
      const rows = page.locator('table tbody tr');
      if (await rows.count() > 0) {
        const firstRowText = await rows.first().textContent();
        expect(firstRowText?.toLowerCase()).toContain('saber');
      }
    });

    test('devrait rechercher un étudiant par matricule', async ({ page }) => {
      await page.goto('/admin/students');
      
      // Remplir le champ de recherche
      await page.fill('input[placeholder*="Rechercher"]', 'AD2023');
      await page.press('input[placeholder*="Rechercher"]', 'Enter');
      
      await page.waitForLoadState('networkidle');
      
      // Vérifier les résultats
      const rows = page.locator('table tbody tr');
      if (await rows.count() > 0) {
        const firstRowText = await rows.first().textContent();
        expect(firstRowText).toContain('AD2023');
      }
    });

    test('devrait afficher un message si aucun étudiant trouvé', async ({ page }) => {
      await page.goto('/admin/students');
      
      // Rechercher un étudiant inexistant
      await page.fill('input[placeholder*="Rechercher"]', 'XYZ999999');
      await page.press('input[placeholder*="Rechercher"]', 'Enter');
      
      await page.waitForLoadState('networkidle');
      
      // Vérifier le message
      await expect(page.locator('text=Aucun étudiant, text=0 étudiant')).toBeVisible();
    });
  });

  test.describe('Responsive', () => {
    
    test('devrait afficher correctement la liste en mobile', async ({ page }) => {
      await page.goto('/admin/students');
      
      // Passer en vue mobile
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Vérifier que le contenu est visible
      await expect(page.locator('h1:has-text("Gestion des étudiants")')).toBeVisible();
      
      // Remettre la taille desktop
      await page.setViewportSize({ width: 1280, height: 720 });
    });
  });
});
