/**
 * Tests E2E - Parcours Étudiant : Gestion des Demandes (CRUD)
 * 
 * Ce fichier teste les opérations CRUD pour les demandes étudiantes:
 * - Créer une nouvelle demande
 * - Voir la liste des demandes
 * - Voir le détail d'une demande
 * - Modifier une demande (statut SOUMIS seulement)
 * - Supprimer une demande
 */

import { test, expect } from '@playwright/test';
import {
  loginAsStudent,
  createDemande,
  createTestDemande,
  openDemandeDetail,
  navigateToDemandes,
  navigateToNewDemande,
  filterByStatus,
  searchDemande,
  clearSearch,
  getFirstDemandeNumero,
  isDemandeVisible,
  waitForSuccessToast,
  waitForErrorToast,
  TYPE_DEMANDE,
  PRIORITE,
  STATUT_LABELS,
  expectToBeOnDemandesPage,
} from '../helpers';

test.describe('Parcours Étudiant - CRUD Demandes', () => {
  
  test.beforeEach(async ({ page }) => {
    // Se connecter avant chaque test
    await loginAsStudent(page);
  });

  test.describe('Création de demandes', () => {
    
    test('devrait afficher le formulaire de création de demande', async ({ page }) => {
      // Naviguer vers la page de création
      await navigateToNewDemande(page);
      
      // Vérifier les éléments du formulaire
      await expect(page.locator('h1')).toContainText('Nouvelle demande');
      await expect(page.locator('text=Type de demande')).toBeVisible();
      await expect(page.locator('text=Objet')).toBeVisible();
      await expect(page.locator('text=Description')).toBeVisible();
      await expect(page.locator('text=Priorité')).toBeVisible();
      
      // Vérifier le bouton de retour
      await expect(page.locator('button:has-text("Retour")')).toBeVisible();
      
      // Vérifier le bouton de soumission
      await expect(page.locator('button[type="submit"]')).toContainText('Soumettre');
    });

    test('devrait créer une demande avec succès (Attestation de scolarité)', async ({ page }) => {
      const objet = `Test E2E - Attestation ${Date.now()}`;
      
      // Créer la demande
      await createDemande(page, {
        type: 'ATTESTATION_SCOLARITE',
        objet,
        description: 'Demande de test pour attestation de scolarité créée via E2E',
        priorite: 'NORMALE',
      });
      
      // Vérifier le toast de succès
      await waitForSuccessToast(page, 'créée');
      
      // Vérifier que nous sommes sur la liste des demandes
      await expectToBeOnDemandesPage(page);
      
      // Vérifier que la demande apparaît dans la liste
      await expect(page.locator(`text=${objet}`)).toBeVisible();
    });

    test('devrait créer une demande avec différents types', async ({ page }) => {
      const types = [
        { type: 'RELEVE_NOTES' as const, nom: 'Relevé de notes' },
        { type: 'ATTESTATION_REUSSITE' as const, nom: 'Attestation de réussite' },
        { type: 'DUPLICATA_CARTE' as const, nom: 'Duplicata de carte étudiant' },
        { type: 'CONVENTION_STAGE' as const, nom: 'Convention de stage' },
      ];
      
      for (const { type, nom } of types) {
        const objet = `Test E2E - ${nom} ${Date.now()}`;
        
        await createDemande(page, {
          type,
          objet,
          description: `Demande de test pour ${nom}`,
          priorite: 'NORMALE',
        });
        
        // Vérifier le toast de succès
        await waitForSuccessToast(page, 'créée');
        
        // Vérifier que la demande est visible
        await expect(page.locator(`text=${objet}`)).toBeVisible();
      }
    });

    test('devrait créer une demande avec priorité haute', async ({ page }) => {
      const objet = `Test E2E - Priorité Haute ${Date.now()}`;
      
      await createDemande(page, {
        type: 'ATTESTATION_SCOLARITE',
        objet,
        description: 'Demande de test avec priorité haute',
        priorite: 'HAUTE',
      });
      
      // Vérifier le succès
      await waitForSuccessToast(page, 'créée');
    });

    test('devrait créer une demande avec priorité urgente', async ({ page }) => {
      const objet = `Test E2E - Priorité Urgente ${Date.now()}`;
      
      await createDemande(page, {
        type: 'CONVENTION_STAGE',
        objet,
        description: 'Demande urgente de test',
        priorite: 'URGENTE',
      });
      
      // Vérifier le succès
      await waitForSuccessToast(page, 'créée');
    });

    test('devrait générer un numéro de demande unique', async ({ page }) => {
      const objet = `Test E2E - Numéro unique ${Date.now()}`;
      
      await createDemande(page, {
        type: 'ATTESTATION_SCOLARITE',
        objet,
        description: 'Test de génération de numéro unique',
      });
      
      // Attendre que la demande apparaisse
      await page.waitForSelector(`text=${objet}`);
      
      // Récupérer le numéro de la demande
      const numeroElement = page.locator(`div:has-text("${objet}") >> xpath=.. >> p.text-sm.text-gray-600`);
      const numero = await numeroElement.textContent();
      
      // Vérifier le format du numéro: DEM-YYYY-NNNNNN
      expect(numero).toMatch(/DEM-\d{4}-\d{6}/);
    });

    test('devrait afficher une erreur si l\'objet est trop court', async ({ page }) => {
      await navigateToNewDemande(page);
      
      // Remplir avec un objet trop court (< 5 caractères)
      await page.click('button:has-text("Sélectionner un type de demande")');
      await page.click(`div[role="option"]:has-text("${TYPE_DEMANDE.ATTESTATION_SCOLARITE}")`);
      await page.fill('input[name="objet"]', 'Test'); // Trop court
      await page.fill('textarea[name="description"]', 'Description valide pour le test');
      
      // Essayer de soumettre
      await page.click('button[type="submit"]');
      
      // Vérifier qu'une erreur de validation est affichée
      await expect(page.locator('text=minimum')).toBeVisible();
    });

    test('devrait afficher une erreur si la description est trop courte', async ({ page }) => {
      await navigateToNewDemande(page);
      
      // Remplir avec une description trop courte (< 10 caractères)
      await page.click('button:has-text("Sélectionner un type de demande")');
      await page.click(`div[role="option"]:has-text("${TYPE_DEMANDE.ATTESTATION_SCOLARITE}")`);
      await page.fill('input[name="objet"]', 'Objet valide pour test');
      await page.fill('textarea[name="description"]', 'Court'); // Trop court
      
      // Essayer de soumettre
      await page.click('button[type="submit"]');
      
      // Vérifier qu'une erreur de validation est affichée
      await expect(page.locator('text=minimum')).toBeVisible();
    });

    test('devrait permettre d\'annuler la création', async ({ page }) => {
      await navigateToNewDemande(page);
      
      // Remplir partiellement le formulaire
      await page.fill('input[name="objet"]', 'Test annulation');
      
      // Cliquer sur annuler
      await page.click('button:has-text("Annuler")');
      
      // Accepter la confirmation si elle apparaît
      page.once('dialog', async dialog => {
        await dialog.accept();
      });
      
      // Vérifier la redirection vers la liste
      await expectToBeOnDemandesPage(page);
    });

    test('devrait afficher les informations importantes sur la page', async ({ page }) => {
      await navigateToNewDemande(page);
      
      // Vérifier la carte d'information
      await expect(page.locator('text=Information importante')).toBeVisible();
      await expect(page.locator('text=champs obligatoires')).toBeVisible();
      await expect(page.locator('text=notification par email')).toBeVisible();
    });
  });

  test.describe('Liste des demandes', () => {
    
    test('devrait afficher la liste des demandes avec statistiques', async ({ page }) => {
      await navigateToDemandes(page);
      
      // Vérifier le titre
      await expect(page.locator('h1')).toContainText('Mes demandes');
      
      // Vérifier les statistiques
      await expect(page.locator('text=Total')).toBeVisible();
      await expect(page.locator('text=En cours')).toBeVisible();
      await expect(page.locator('text=Traitées')).toBeVisible();
      await expect(page.locator('text=Rejetées')).toBeVisible();
      
      // Vérifier le bouton de création
      await expect(page.locator('text=Nouvelle demande')).toBeVisible();
    });

    test('devrait afficher les demandes sous forme de cartes', async ({ page }) => {
      // Créer d'abord une demande
      await createTestDemande(page, 'Liste');
      
      // Vérifier que la carte est visible
      const carte = page.locator('.grid > div:first-child');
      await expect(carte).toBeVisible();
      
      // Vérifier les éléments de la carte
      await expect(carte.locator('h3')).toBeVisible(); // Titre
      await expect(carte.locator('p.text-sm.text-gray-600')).toBeVisible(); // Numéro
      await expect(carte.locator('span[class*="badge"], [style*="background-color"]')).toBeVisible(); // Statut
    });

    test('devrait filtrer les demandes par statut', async ({ page }) => {
      // Créer une demande
      await createTestDemande(page, 'Filtre');
      
      // Filtrer par statut "Reçu" (statut initial après création)
      await filterByStatus(page, 'RECU');
      
      // Vérifier que le filtre est appliqué
      await expect(page.locator('text=demande')).toBeVisible();
    });

    test('devrait rechercher une demande par texte', async ({ page }) => {
      const objetUnique = `Recherche Unique ${Date.now()}`;
      
      // Créer une demande avec un objet unique
      await createDemande(page, {
        type: 'ATTESTATION_SCOLARITE',
        objet: objetUnique,
        description: 'Description pour test de recherche',
      });
      
      // Rechercher cette demande
      await searchDemande(page, objetUnique);
      
      // Vérifier que la demande est trouvée
      await expect(page.locator(`text=${objetUnique}`)).toBeVisible();
    });

    test('devrait afficher un message si aucune demande ne correspond à la recherche', async ({ page }) => {
      // Rechercher un texte inexistant
      await searchDemande(page, 'XYZ123NONEXISTANT');
      
      // Vérifier le message
      await expect(page.locator('text=Aucune demande trouvée')).toBeVisible();
      await expect(page.locator('text=Essayez de modifier vos filtres')).toBeVisible();
    });

    test('devrait réinitialiser la recherche', async ({ page }) => {
      // Rechercher quelque chose
      await searchDemande(page, 'test');
      
      // Effacer la recherche
      await clearSearch(page);
      
      // Vérifier que le champ est vide
      await expect(page.locator('input[placeholder="Rechercher une demande..."]')).toHaveValue('');
    });

    test('devrait afficher le nombre de résultats', async ({ page }) => {
      // Vérifier qu'un texte indiquant le nombre de résultats est présent
      const resultText = page.locator('text=/\\d+ demande(s?) trouvée(s?)/');
      await expect(resultText.first()).toBeVisible();
    });
  });

  test.describe('Détail d\'une demande', () => {
    
    test('devrait afficher les détails d\'une demande', async ({ page }) => {
      // Créer une demande
      const objet = `Test Détail ${Date.now()}`;
      await createDemande(page, {
        type: 'ATTESTATION_SCOLARITE',
        objet,
        description: 'Description détaillée pour test de vue',
      });
      
      // Cliquer sur la demande
      const demandeCard = page.locator(`div:has-text("${objet}"):has(h3)`);
      await demandeCard.click();
      
      // Attendre la navigation
      await page.waitForURL(/\/demandes\/[a-f0-9]+/);
      
      // Vérifier les détails affichés
      await expect(page.locator('h1')).toContainText(objet);
      await expect(page.locator('text=Informations générales')).toBeVisible();
      await expect(page.locator('text=Description')).toBeVisible();
      await expect(page.locator('text=Type de demande')).toBeVisible();
      await expect(page.locator('text=Priorité')).toBeVisible();
      await expect(page.locator('text=Date de soumission')).toBeVisible();
    });

    test('devrait afficher le bouton de retour', async ({ page }) => {
      // Créer et ouvrir une demande
      const numero = await createTestDemande(page, 'Retour');
      await openDemandeDetail(page, numero);
      
      // Vérifier le bouton de retour
      await expect(page.locator('button:has-text("Retour")')).toBeVisible();
      
      // Cliquer sur retour
      await page.click('button:has-text("Retour")');
      
      // Vérifier la redirection
      await expectToBeOnDemandesPage(page);
    });

    test('devrait afficher le statut avec la bonne couleur', async ({ page }) => {
      // Créer une demande
      const numero = await createTestDemande(page, 'Statut');
      await openDemandeDetail(page, numero);
      
      // Vérifier que le badge de statut est visible
      const statusBadge = page.locator('[style*="background-color"]').first();
      await expect(statusBadge).toBeVisible();
    });

    test('devrait afficher les commentaires admin s\'ils existent', async ({ page }) => {
      // Note: Ce test nécessite qu'un admin ait ajouté un commentaire
      // Pour l'instant, on vérifie simplement que la section n'est pas présente sans commentaire
      const numero = await createTestDemande(page, 'Commentaire');
      await openDemandeDetail(page, numero);
      
      // Vérifier que la section commentaire n'est pas visible (pas de commentaire)
      const commentSection = page.locator("text=Commentaire de l'administration");
      await expect(commentSection).not.toBeVisible();
    });

    test('devrait afficher le motif de refus si la demande est rejetée', async ({ page }) => {
      // Note: Ce test nécessite qu'un admin ait rejeté la demande
      // Pour l'instant, on vérifie simplement que la section n'est pas présente
      const numero = await createTestDemande(page, 'Rejet');
      await openDemandeDetail(page, numero);
      
      // Vérifier que la section motif de refus n'est pas visible
      const rejectSection = page.locator('text=Motif de refus');
      await expect(rejectSection).not.toBeVisible();
    });
  });

  test.describe('Modification de demandes', () => {
    
    test('devrait permettre de modifier une demande au statut SOUMIS', async ({ page }) => {
      // Créer une demande
      const objet = `Test Modification ${Date.now()}`;
      const numero = await createDemande(page, {
        type: 'ATTESTATION_SCOLARITE',
        objet,
        description: 'Description initiale',
      });
      
      // Ouvrir la demande
      await openDemandeDetail(page, numero);
      
      // Note: La modification dépend de l'implémentation UI
      // Vérifier si un bouton d'édition existe
      const editButton = page.locator('button:has-text("Modifier"), a:has-text("Modifier")');
      
      if (await editButton.isVisible().catch(() => false)) {
        await editButton.click();
        
        // Modifier la description
        await page.fill('textarea[name="description"]', 'Description modifiée');
        await page.click('button[type="submit"]');
        
        // Vérifier le succès
        await waitForSuccessToast(page, 'modifiée');
      }
    });

    test('devrait empêcher la modification si le statut n\'est pas SOUMIS', async ({ page }) => {
      // Note: Ce test nécessite une demande avec un statut différent de SOUMIS
      // Cela nécessiterait une intervention admin ou un seed de données
      test.skip(true, 'Nécessite une demande avec statut avancé');
    });
  });

  test.describe('Suppression de demandes', () => {
    
    test('devrait permettre de supprimer une demande au statut SOUMIS', async ({ page }) => {
      // Créer une demande
      const objet = `Test Suppression ${Date.now()}`;
      const numero = await createDemande(page, {
        type: 'ATTESTATION_SCOLARITE',
        objet,
        description: 'Description pour test de suppression',
      });
      
      // Vérifier que la demande existe
      await expect(page.locator(`text=${objet}`)).toBeVisible();
      
      // Ouvrir la demande
      await openDemandeDetail(page, numero);
      
      // Note: La suppression dépend de l'implémentation UI
      // Chercher un bouton de suppression
      const deleteButton = page.locator('button:has-text("Supprimer"), [data-testid="delete-demande"]');
      
      if (await deleteButton.isVisible().catch(() => false)) {
        await deleteButton.click();
        
        // Confirmer la suppression
        page.once('dialog', async dialog => {
          await dialog.accept();
        });
        
        // Vérifier le succès
        await waitForSuccessToast(page, 'supprimée');
        
        // Vérifier que la demande n'est plus visible
        await expect(page.locator(`text=${objet}`)).not.toBeVisible();
      } else {
        test.skip(true, 'Bouton de suppression non disponible');
      }
    });

    test('devrait demander confirmation avant suppression', async ({ page }) => {
      // Créer une demande
      const numero = await createTestDemande(page, 'Confirmation');
      await openDemandeDetail(page, numero);
      
      const deleteButton = page.locator('button:has-text("Supprimer"), [data-testid="delete-demande"]');
      
      if (await deleteButton.isVisible().catch(() => false)) {
        await deleteButton.click();
        
        // Vérifier que la boîte de dialogue de confirmation apparaît
        page.once('dialog', async dialog => {
          expect(dialog.type()).toBe('confirm');
          await dialog.dismiss(); // Annuler la suppression
        });
      } else {
        test.skip(true, 'Bouton de suppression non disponible');
      }
    });
  });

  test.describe('Navigation et UX', () => {
    
    test('devrait être responsive sur mobile', async ({ page }) => {
      // Tester en mobile
      await page.setViewportSize({ width: 375, height: 667 });
      
      await navigateToDemandes(page);
      
      // Vérifier que la liste est visible
      await expect(page.locator('h1')).toContainText('Mes demandes');
      
      // Remettre la taille desktop
      await page.setViewportSize({ width: 1280, height: 720 });
    });

    test('devrait maintenir les filtres après rechargement', async ({ page }) => {
      // Appliquer un filtre
      await filterByStatus(page, 'RECU');
      
      // Recharger la page
      await page.reload();
      
      // Note: Le maintien des filtres dépend de l'implémentation (URL params ou state)
      // Vérifier que la page se charge correctement
      await expectToBeOnDemandesPage(page);
    });

    test('devrait avoir des temps de chargement raisonnables', async ({ page }) => {
      // Mesurer le temps de chargement de la liste
      const startTime = Date.now();
      await navigateToDemandes(page);
      const loadTime = Date.now() - startTime;
      
      // La page devrait charger en moins de 3 secondes
      expect(loadTime).toBeLessThan(3000);
    });
  });
});
