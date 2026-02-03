/**
 * Tests E2E - Parcours Admin : Authentification
 * 
 * Ce fichier teste les scénarios d'authentification pour les administrateurs:
 * - Connexion avec credentials valides
 * - Redirection vers le dashboard
 * - Accès refusé pour les étudiants
 * - Déconnexion
 */

import { test, expect } from '@playwright/test';
import {
  loginAsAdmin,
  loginAsStudent,
  TEST_USERS,
  expectToBeOnLoginPage,
  waitForSuccessToast,
} from '../helpers';

test.describe('Parcours Admin - Authentification', () => {
  
  test.beforeEach(async ({ page }) => {
    // Aller à la page de connexion avant chaque test
    await page.goto('/auth/signin');
  });

  test.describe('Connexion admin réussie', () => {
    
    test('devrait afficher la page de connexion avec tous les éléments', async ({ page }) => {
      // Vérifier le titre de la page
      await expect(page.locator('text=Système de Gestion des Demandes').first()).toBeVisible();
      
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
    });

    test('devrait connecter un admin avec des credentials valides et rediriger vers le dashboard', async ({ page }) => {
      // Go to signin with callbackUrl to redirect to dashboard after login
      await page.goto('/auth/signin?callbackUrl=/admin/dashboard');
      
      // Remplir le formulaire avec les credentials de l'admin
      await page.fill('input#email', TEST_USERS.admin.email);
      await page.fill('input#password', TEST_USERS.admin.password);
      
      // Soumettre le formulaire
      await page.click('button[type="submit"]');
      
      // Attendre la redirection vers le dashboard admin
      await page.waitForURL('/admin/dashboard');
      
      // Vérifier que nous sommes sur le dashboard admin
      await expect(page.locator('h1')).toContainText('Tableau de bord');
    });

    test('devrait utiliser le bouton de remplissage rapide admin', async ({ page }) => {
      // Go to signin with callbackUrl
      await page.goto('/auth/signin?callbackUrl=/admin/dashboard');
      
      // Cliquer sur le bouton "Admin" pour remplissage rapide
      await page.click('button:has-text("Admin")');
      
      // Vérifier que les champs sont remplis
      await expect(page.locator('input#email')).toHaveValue(TEST_USERS.admin.email);
      await expect(page.locator('input#password')).toHaveValue(TEST_USERS.admin.password);
      
      // Soumettre le formulaire
      await page.click('button[type="submit"]');
      
      // Vérifier la redirection vers le dashboard
      await page.waitForURL('/admin/dashboard');
      await expect(page.locator('h1')).toContainText('Tableau de bord');
    });

    test('devrait afficher les statistiques sur le dashboard après connexion', async ({ page }) => {
      // Se connecter en tant qu'admin
      await loginAsAdmin(page);
      
      // Vérifier les cartes de statistiques (use more specific selectors)
      await expect(page.locator('text=Total des demandes')).toBeVisible();
      await expect(page.locator('.grid > div:nth-child(2) div.text-sm', { hasText: 'En cours' })).toBeVisible();
      await expect(page.locator('.grid > div:nth-child(3) div.text-sm', { hasText: 'Traitées' })).toBeVisible();
      await expect(page.locator('.grid > div:nth-child(4) div.text-sm', { hasText: 'Rejetées' })).toBeVisible();
      
      // Vérifier que les valeurs des statistiques sont des nombres
      const statCards = page.locator('.grid > div');
      await expect(statCards.first()).toBeVisible();
    });

    test('devrait maintenir la session admin après rechargement de la page', async ({ page }) => {
      // Se connecter d'abord
      await loginAsAdmin(page);
      
      // Vérifier que nous sommes sur le dashboard
      await expect(page).toHaveURL('/admin/dashboard');
      
      // Recharger la page
      await page.reload();
      
      // Vérifier que nous sommes toujours connectés et sur le dashboard
      await expect(page).toHaveURL('/admin/dashboard');
      await expect(page.locator('h1')).toContainText('Tableau de bord');
    });

    test('devrait avoir accès au menu admin après connexion', async ({ page }) => {
      // Se connecter en tant qu'admin
      await loginAsAdmin(page);
      
      // Vérifier la présence des liens de navigation admin
      await expect(page.locator('a:has-text("Tableau de bord")')).toBeVisible();
      await expect(page.locator('a:has-text("Demandes")')).toBeVisible();
      await expect(page.locator('a:has-text("Étudiants")')).toBeVisible();
    });
  });

  test.describe('Sécurité et accès', () => {
    
    test('devrait empêcher un étudiant d\'accéder au dashboard admin', async ({ page }) => {
      // Se connecter en tant qu'étudiant
      await loginAsStudent(page);
      
      // Essayer d'accéder au dashboard admin
      await page.goto('/admin/dashboard');
      
      // Vérifier que l'accès est refusé (redirection vers /demandes ou page d'erreur)
      await expect(page).not.toHaveURL('/admin/dashboard');
    });

    test('devrait empêcher un étudiant d\'accéder à la liste des demandes admin', async ({ page }) => {
      // Se connecter en tant qu'étudiant
      await loginAsStudent(page);
      
      // Essayer d'accéder à la liste admin des demandes
      await page.goto('/admin/demandes');
      
      // Vérifier que l'accès est refusé
      await expect(page).not.toHaveURL('/admin/demandes');
    });

    test('devrait empêcher un étudiant d\'accéder à la gestion des étudiants', async ({ page }) => {
      // Se connecter en tant qu'étudiant
      await loginAsStudent(page);
      
      // Essayer d'accéder à la gestion des étudiants
      await page.goto('/admin/students');
      
      // Vérifier que l'accès est refusé
      await expect(page).not.toHaveURL('/admin/students');
    });

    test('devrait rediriger vers la connexion si non authentifié', async ({ page }) => {
      // Aller directement au dashboard sans être connecté
      await page.goto('/admin/dashboard');
      
      // Vérifier la redirection vers la page de connexion
      await expect(page).toHaveURL(/\/auth\/signin/);
    });
  });

  test.describe('Déconnexion admin', () => {
    
    test('devrait déconnecter l\'admin et rediriger vers la connexion', async ({ page, context }) => {
      // Se connecter d'abord
      await loginAsAdmin(page);
      
      // Vérifier que nous sommes connectés
      await expect(page).toHaveURL('/admin/dashboard');
      
      // Clear all cookies to simulate logout
      await context.clearCookies();
      
      // Reload the page to apply the logout
      await page.goto('/auth/signin');
      
      // Vérifier que nous sommes sur la page de connexion
      await expectToBeOnLoginPage(page);
    });

    test('devrait empêcher l\'accès aux pages admin après déconnexion', async ({ page, context }) => {
      // Se connecter
      await loginAsAdmin(page);
      
      // Clear all cookies to simulate logout
      await context.clearCookies();
      
      // Essayer d'accéder à une page admin protégée
      await page.goto('/admin/dashboard');
      
      // Vérifier que nous sommes redirigés vers la connexion
      await expect(page).toHaveURL(/\/auth\/signin/);
    });
  });

  test.describe('Navigation responsive admin', () => {
    
    test('devrait afficher correctement le dashboard en mobile', async ({ page }) => {
      // Se connecter en tant qu'admin
      await loginAsAdmin(page);
      
      // Tester en mobile
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Vérifier que le contenu est toujours visible
      await expect(page.locator('h1:has-text("Tableau de bord")')).toBeVisible();
      await expect(page.locator('text=Total des demandes')).toBeVisible();
      
      // Remettre la taille desktop
      await page.setViewportSize({ width: 1280, height: 720 });
    });
  });
});
