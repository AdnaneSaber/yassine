/**
 * Tests E2E - Parcours Étudiant : Authentification
 * 
 * Ce fichier teste les scénarios d'authentification pour les étudiants:
 * - Connexion avec credentials valides
 * - Redirection après connexion
 * - Connexion avec credentials invalides
 * - Déconnexion
 */

import { test, expect } from '@playwright/test';
import {
  loginAsStudent,
  TEST_USERS,
  expectToBeOnDemandesPage,
  expectToBeOnLoginPage,
  expectLoginError,
  waitForSuccessToast,
} from '../helpers';

test.describe('Parcours Étudiant - Authentification', () => {
  
  test.beforeEach(async ({ page }) => {
    // Aller à la page de connexion avant chaque test
    await page.goto('/auth/signin');
  });

  test.describe('Connexion réussie', () => {
    
    test('devrait afficher la page de connexion avec tous les éléments', async ({ page }) => {
      // Vérifier le titre de la page
      await expect(page.locator('[class*="card-title"], h1, h2').first()).toContainText('Système de Gestion des Demandes');
      
      // Vérifier la présence du formulaire
      await expect(page.locator('form')).toBeVisible();
      
      // Vérifier les champs email et password
      await expect(page.locator('input#email')).toBeVisible();
      await expect(page.locator('input#password')).toBeVisible();
      
      // Vérifier le bouton de soumission
      await expect(page.locator('button[type="submit"]')).toContainText('Se connecter');
      
      // Vérifier les boutons de test rapide
      await expect(page.locator('button:has-text("Admin")')).toBeVisible();
      await expect(page.locator('button:has-text("Étudiant")')).toBeVisible();
      
      // Vérifier les informations de compte de test
      await expect(page.locator('text=👨‍💼 Admin')).toBeVisible();
      await expect(page.locator('text=👨‍🎓 Étudiant')).toBeVisible();
    });

    test('devrait connecter un étudiant avec des credentials valides', async ({ page }) => {
      // Remplir le formulaire avec les credentials de l'étudiant
      await page.fill('input#email', TEST_USERS.student.email);
      await page.fill('input#password', TEST_USERS.student.password);
      
      // Soumettre le formulaire
      await page.click('button[type="submit"]');
      
      // Attendre la redirection
      await page.waitForURL('/demandes');
      
      // Vérifier que nous sommes sur la page des demandes
      await expectToBeOnDemandesPage(page);
      
      // Vérifier le toast de succès
      await waitForSuccessToast(page, 'Connexion réussie');
    });

    test('devrait utiliser le bouton de remplissage rapide étudiant', async ({ page }) => {
      // Cliquer sur le bouton "Étudiant" pour remplissage rapide
      await page.click('button:has-text("Étudiant")');
      
      // Vérifier que les champs sont remplis
      await expect(page.locator('input#email')).toHaveValue(TEST_USERS.student.email);
      await expect(page.locator('input#password')).toHaveValue('any');
      
      // Soumettre le formulaire
      await page.click('button[type="submit"]');
      
      // Vérifier la redirection
      await page.waitForURL('/demandes');
      await expectToBeOnDemandesPage(page);
    });

    test('devrait rediriger vers la page demandée après connexion (callbackUrl)', async ({ page }) => {
      // Aller directement à une page protégée
      await page.goto('/demandes/new');
      
      // Vérifier que nous sommes redirigés vers la page de connexion avec callbackUrl
      await expect(page).toHaveURL(/\/auth\/signin/);
      
      // Se connecter
      await page.fill('input#email', TEST_USERS.student.email);
      await page.fill('input#password', TEST_USERS.student.password);
      await page.click('button[type="submit"]');
      
      // Attendre la redirection vers la page initialement demandée
      await page.waitForURL('/demandes/new');
      
      // Vérifier que nous sommes sur la bonne page
      await expect(page.locator('h1')).toContainText('Nouvelle demande');
    });

    test('devrait maintenir la session après rechargement de la page', async ({ page }) => {
      // Se connecter d'abord
      await loginAsStudent(page);
      
      // Recharger la page
      await page.reload();
      
      // Vérifier que nous sommes toujours connectés (sur la page des demandes)
      await expectToBeOnDemandesPage(page);
    });
  });

  test.describe('Connexion échouée', () => {
    
    test('devrait afficher une erreur avec un email invalide', async ({ page }) => {
      // Remplir avec un email inexistant
      await page.fill('input#email', TEST_USERS.invalid.email);
      await page.fill('input#password', TEST_USERS.invalid.password);
      
      // Soumettre
      await page.click('button[type="submit"]');
      
      // Vérifier l'affichage d'une erreur
      await expectLoginError(page);
    });

    test('devrait afficher une erreur avec un mot de passe incorrect', async ({ page }) => {
      // Remplir avec un bon email mais mauvais mot de passe
      await page.fill('input#email', TEST_USERS.student.email);
      await page.fill('input#password', 'wrongpassword123');
      
      // Soumettre
      await page.click('button[type="submit"]');
      
      // Vérifier l'affichage d'une erreur
      await expectLoginError(page);
    });

    test('devrait afficher une erreur avec des champs vides', async ({ page }) => {
      // Essayer de soumettre sans remplir les champs
      // Les navigateurs modernes empêchent la soumission avec required
      const emailInput = page.locator('input#email');
      const passwordInput = page.locator('input#password');
      
      // Vérifier que les champs sont requis
      await expect(emailInput).toHaveAttribute('required', '');
      await expect(passwordInput).toHaveAttribute('required', '');
    });

    test('devrait afficher une erreur avec un format email invalide', async ({ page }) => {
      // Remplir avec un email au format invalide
      await page.fill('input#email', 'not-an-email');
      await page.fill('input#password', 'password123');
      
      // Vérifier la validation du navigateur (type="email")
      const emailInput = page.locator('input#email');
      await expect(emailInput).toHaveAttribute('type', 'email');
    });

    test('devrait désactiver le bouton pendant la soumission', async ({ page }) => {
      // Remplir le formulaire
      await page.fill('input#email', TEST_USERS.student.email);
      await page.fill('input#password', TEST_USERS.student.password);
      
      // Soumettre et vérifier immédiatement l'état du bouton
      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();
      
      // Le bouton devrait être désactivé ou afficher "Connexion..."
      await expect(submitButton).toBeDisabled();
      await expect(submitButton).toContainText('Connexion');
    });
  });

  test.describe('Déconnexion', () => {
    
    test('devrait déconnecter l\'utilisateur et rediriger vers la connexion', async ({ page }) => {
      // Se connecter d'abord
      await loginAsStudent(page);
      
      // Vérifier que nous sommes connectés
      await expectToBeOnDemandesPage(page);
      
      // Déconnecter (si un bouton de déconnexion existe)
      // Note: L'implémentation dépend de l'interface utilisateur
      // Aller manuellement à l'URL de déconnexion ou cliquer sur le bouton
      await page.goto('/api/auth/signout');
      
      // Vérifier la redirection vers la page de connexion
      await page.waitForURL('/auth/signin');
      await expectToBeOnLoginPage(page);
    });

    test('devrait empêcher l\'accès aux pages protégées après déconnexion', async ({ page }) => {
      // Se connecter
      await loginAsStudent(page);
      
      // Déconnecter
      await page.goto('/api/auth/signout');
      await page.waitForURL('/auth/signin');
      
      // Essayer d'accéder à une page protégée
      await page.goto('/demandes');
      
      // Vérifier que nous sommes redirigés vers la connexion
      await expect(page).toHaveURL(/\/auth\/signin/);
    });
  });

  test.describe('Navigation et UX', () => {
    
    test('devrait avoir une apparence responsive', async ({ page }) => {
      // Tester en mobile
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Vérifier que le formulaire est toujours visible et utilisable
      await expect(page.locator('form')).toBeVisible();
      await expect(page.locator('input#email')).toBeVisible();
      await expect(page.locator('input#password')).toBeVisible();
      
      // Remettre la taille desktop
      await page.setViewportSize({ width: 1280, height: 720 });
    });

    test('devrait préserver les valeurs saisies en cas d\'erreur', async ({ page }) => {
      // Remplir uniquement l'email
      await page.fill('input#email', TEST_USERS.student.email);
      
      // Essayer de soumettre (le mot de passe est required)
      await page.click('button[type="submit"]');
      
      // Vérifier que l'email est toujours présent
      await expect(page.locator('input#email')).toHaveValue(TEST_USERS.student.email);
    });
  });
});
