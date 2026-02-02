/**
 * Tests E2E - Parcours Admin : Workflow complet
 * 
 * Ce fichier teste le workflow complet des demandes:
 * - SOUMIS → RECU → EN_COURS → VALIDE → TRAITE
 * - Rejet avec motif
 * - Mise en attente info
 */

import { test, expect } from '@playwright/test';
import { 
  loginAsAdmin, 
  loginAsStudent, 
  createTestDemande, 
  waitForSuccessToast,
  STATUT_LABELS,
} from '../helpers';

test.describe('Parcours Admin - Workflow complet', () => {

  test.describe('Workflow SOUMIS → TRAITE', () => {
    
    test('workflow complet: SOUMIS → RECU → EN_COURS → VALIDE → TRAITE', async ({ browser }) => {
      // Étape 1: Étudiant crée une demande
      const studentContext = await browser.newContext();
      const studentPage = await studentContext.newPage();
      
      await loginAsStudent(studentPage);
      const numeroDemande = await createTestDemande(studentPage, 'Workflow Test', {
        type: 'ATTESTATION_SCOLARITE',
        objet: 'Test Workflow Complet',
        description: 'Cette demande est créée pour tester le workflow complet de traitement.',
        priorite: 'NORMALE',
      });
      
      // Vérifier que la demande est créée avec statut SOUMIS (ou RECU après auto-transition)
      await expect(studentPage.locator(`text=${numeroDemande}`)).toBeVisible();
      
      // Étape 2: Admin traite la demande
      const adminContext = await browser.newContext();
      const adminPage = await adminContext.newPage();
      
      await loginAsAdmin(adminPage);
      
      // Naviguer vers les demandes et chercher la demande créée
      await adminPage.goto('/admin/demandes');
      await adminPage.fill('input[placeholder*="Rechercher"]', numeroDemande);
      await adminPage.press('input[placeholder*="Rechercher"]', 'Enter');
      await adminPage.waitForLoadState('networkidle');
      
      // Ouvrir le détail de la demande
      await adminPage.click(`text=${numeroDemande}`);
      await adminPage.waitForURL(/\/admin\/demandes\/[a-f0-9]+/);
      
      // Vérifier le statut initial (SOUMIS ou RECU)
      const statutInitial = await adminPage.locator('[data-testid="statut-badge"], .badge').textContent();
      expect(['Soumis', 'Reçu']).toContain(statutInitial?.trim());
      
      // Étape 3: Transition vers EN_COURS
      await adminPage.click('button:has-text("Changer le statut"), button[data-testid="change-status"]');
      await adminPage.click(`div[role="option"]:has-text("${STATUT_LABELS.EN_COURS}"), text=${STATUT_LABELS.EN_COURS}`);
      await adminPage.fill('textarea[name="commentaire"]', 'Prise en charge de la demande');
      await adminPage.click('button:has-text("Confirmer")');
      
      await waitForSuccessToast(adminPage, 'statut');
      
      // Vérifier le nouveau statut
      await expect(adminPage.locator(`text=${STATUT_LABELS.EN_COURS}`)).toBeVisible();
      
      // Étape 4: Transition vers VALIDE
      await adminPage.click('button:has-text("Changer le statut"), button[data-testid="change-status"]');
      await adminPage.click(`div[role="option"]:has-text("${STATUT_LABELS.VALIDE}"), text=${STATUT_LABELS.VALIDE}`);
      await adminPage.fill('textarea[name="commentaire"]', 'Demande validée, préparation du document');
      await adminPage.click('button:has-text("Confirmer")');
      
      await waitForSuccessToast(adminPage, 'statut');
      
      // Vérifier le nouveau statut
      await expect(adminPage.locator(`text=${STATUT_LABELS.VALIDE}`)).toBeVisible();
      
      // Étape 5: Transition vers TRAITE
      await adminPage.click('button:has-text("Changer le statut"), button[data-testid="change-status"]');
      await adminPage.click(`div[role="option"]:has-text("${STATUT_LABELS.TRAITE}"), text=${STATUT_LABELS.TRAITE}`);
      await adminPage.fill('textarea[name="commentaire"]', 'Document généré et envoyé à l\'étudiant');
      await adminPage.click('button:has-text("Confirmer")');
      
      await waitForSuccessToast(adminPage, 'statut');
      
      // Vérifier le statut final
      await expect(adminPage.locator(`text=${STATUT_LABELS.TRAITE}`)).toBeVisible();
      
      // Étape 6: Vérifier que l'étudiant voit le statut mis à jour
      await studentPage.reload();
      await expect(studentPage.locator(`text=${STATUT_LABELS.TRAITE}`)).toBeVisible();
      
      // Nettoyer
      await studentContext.close();
      await adminContext.close();
    });

    test('workflow avec historique complet', async ({ browser }) => {
      // Créer une demande
      const studentContext = await browser.newContext();
      const studentPage = await studentContext.newPage();
      
      await loginAsStudent(studentPage);
      const numeroDemande = await createTestDemande(studentPage, 'Historique Test');
      
      // Admin traite
      const adminContext = await browser.newContext();
      const adminPage = await adminContext.newPage();
      
      await loginAsAdmin(adminPage);
      await adminPage.goto('/admin/demandes');
      await adminPage.fill('input[placeholder*="Rechercher"]', numeroDemande);
      await adminPage.press('input[placeholder*="Rechercher"]', 'Enter');
      await adminPage.waitForLoadState('networkidle');
      
      // Ouvrir le détail
      await adminPage.click(`text=${numeroDemande}`);
      await adminPage.waitForURL(/\/admin\/demandes\/[a-f0-9]+/);
      
      // Faire plusieurs transitions
      const transitions = [
        { statut: 'EN_COURS', commentaire: 'Prise en charge' },
        { statut: 'VALIDE', commentaire: 'Validation' },
        { statut: 'TRAITE', commentaire: 'Traitement terminé' },
      ];
      
      for (const transition of transitions) {
        await adminPage.click('button:has-text("Changer le statut"), button[data-testid="change-status"]');
        await adminPage.click(`text=${STATUT_LABELS[transition.statut as keyof typeof STATUT_LABELS]}`);
        await adminPage.fill('textarea[name="commentaire"]', transition.commentaire);
        await adminPage.click('button:has-text("Confirmer")');
        await waitForSuccessToast(adminPage, 'statut');
        await adminPage.waitForTimeout(500);
      }
      
      // Vérifier l'historique
      await expect(adminPage.locator('text=Historique')).toBeVisible();
      
      const historiqueItems = adminPage.locator('[data-testid="historique-item"], .historique-item');
      expect(await historiqueItems.count()).toBeGreaterThanOrEqual(3);
      
      // Nettoyer
      await studentContext.close();
      await adminContext.close();
    });
  });

  test.describe('Workflow de rejet', () => {
    
    test('devrait rejeter une demande avec motif', async ({ browser }) => {
      // Créer une demande
      const studentContext = await browser.newContext();
      const studentPage = await studentContext.newPage();
      
      await loginAsStudent(studentPage);
      const numeroDemande = await createTestDemande(studentPage, 'Rejet Test');
      
      // Admin rejette
      const adminContext = await browser.newContext();
      const adminPage = await adminContext.newPage();
      
      await loginAsAdmin(adminPage);
      await adminPage.goto('/admin/demandes');
      await adminPage.fill('input[placeholder*="Rechercher"]', numeroDemande);
      await adminPage.press('input[placeholder*="Rechercher"]', 'Enter');
      await adminPage.waitForLoadState('networkidle');
      
      // Ouvrir le détail
      await adminPage.click(`text=${numeroDemande}`);
      await adminPage.waitForURL(/\/admin\/demandes\/[a-f0-9]+/);
      
      // Changer le statut vers REJETE
      await adminPage.click('button:has-text("Changer le statut"), button[data-testid="change-status"]');
      await adminPage.click(`text=${STATUT_LABELS.REJETE}`);
      
      // Remplir le motif de refus
      const motifRefus = 'Documents manquants: carte d\'identité et attestation de scolarité précedente';
      await adminPage.fill('textarea[name="motifRefus"], textarea[placeholder*="motif"]', motifRefus);
      await adminPage.click('button:has-text("Confirmer")');
      
      await waitForSuccessToast(adminPage, 'statut');
      
      // Vérifier le statut REJETE
      await expect(adminPage.locator(`text=${STATUT_LABELS.REJETE}`)).toBeVisible();
      
      // Vérifier que le motif de refus est affiché
      await expect(adminPage.locator('text=Motif de refus')).toBeVisible();
      await expect(adminPage.locator(`text=${motifRefus}`)).toBeVisible();
      
      // Vérifier que l'étudiant voit le rejet
      await studentPage.reload();
      await expect(studentPage.locator(`text=${STATUT_LABELS.REJETE}`)).toBeVisible();
      await expect(studentPage.locator('text=Motif de refus')).toBeVisible();
      
      // Nettoyer
      await studentContext.close();
      await adminContext.close();
    });

    test('devrait exiger un motif de refus pour le statut REJETE', async ({ browser }) => {
      // Créer une demande
      const studentContext = await browser.newContext();
      const studentPage = await studentContext.newPage();
      
      await loginAsStudent(studentPage);
      const numeroDemande = await createTestDemande(studentPage, 'Rejet Validation Test');
      
      // Admin essaie de rejeter sans motif
      const adminContext = await browser.newContext();
      const adminPage = await adminContext.newPage();
      
      await loginAsAdmin(adminPage);
      await adminPage.goto('/admin/demandes');
      await adminPage.fill('input[placeholder*="Rechercher"]', numeroDemande);
      await adminPage.press('input[placeholder*="Rechercher"]', 'Enter');
      await adminPage.waitForLoadState('networkidle');
      
      // Ouvrir le détail
      await adminPage.click(`text=${numeroDemande}`);
      await adminPage.waitForURL(/\/admin\/demandes\/[a-f0-9]+/);
      
      // Essayer de rejeter sans motif
      await adminPage.click('button:has-text("Changer le statut"), button[data-testid="change-status"]');
      await adminPage.click(`text=${STATUT_LABELS.REJETE}`);
      await adminPage.click('button:has-text("Confirmer")');
      
      // Vérifier l'erreur de validation
      await expect(adminPage.locator('text=motif de refus est requis')).toBeVisible();
      
      // Nettoyer
      await studentContext.close();
      await adminContext.close();
    });

    test('devrait afficher le statut REJETE en rouge', async ({ browser }) => {
      // Créer et rejeter une demande
      const studentContext = await browser.newContext();
      const studentPage = await studentContext.newPage();
      
      await loginAsStudent(studentPage);
      const numeroDemande = await createTestDemande(studentPage, 'Rejet Couleur Test');
      
      const adminContext = await browser.newContext();
      const adminPage = await adminContext.newPage();
      
      await loginAsAdmin(adminPage);
      await adminPage.goto('/admin/demandes');
      await adminPage.fill('input[placeholder*="Rechercher"]', numeroDemande);
      await adminPage.press('input[placeholder*="Rechercher"]', 'Enter');
      await adminPage.waitForLoadState('networkidle');
      
      // Ouvrir et rejeter
      await adminPage.click(`text=${numeroDemande}`);
      await adminPage.waitForURL(/\/admin\/demandes\/[a-f0-9]+/);
      
      await adminPage.click('button:has-text("Changer le statut")');
      await adminPage.click(`text=${STATUT_LABELS.REJETE}`);
      await adminPage.fill('textarea[name="motifRefus"]', 'Test motif');
      await adminPage.click('button:has-text("Confirmer")');
      await waitForSuccessToast(adminPage, 'statut');
      
      // Vérifier la couleur rouge du badge
      const badge = adminPage.locator('[data-testid="statut-badge"], .badge');
      const classAttr = await badge.getAttribute('class');
      expect(classAttr).toMatch(/red|error|danger|bg-red/);
      
      // Nettoyer
      await studentContext.close();
      await adminContext.close();
    });
  });

  test.describe('Workflow mise en attente info', () => {
    
    test('devrait mettre une demande en attente d\'information', async ({ browser }) => {
      // Créer une demande
      const studentContext = await browser.newContext();
      const studentPage = await studentContext.newPage();
      
      await loginAsStudent(studentPage);
      const numeroDemande = await createTestDemande(studentPage, 'Attente Info Test');
      
      // Admin met en attente
      const adminContext = await browser.newContext();
      const adminPage = await adminContext.newPage();
      
      await loginAsAdmin(adminPage);
      await adminPage.goto('/admin/demandes');
      await adminPage.fill('input[placeholder*="Rechercher"]', numeroDemande);
      await adminPage.press('input[placeholder*="Rechercher"]', 'Enter');
      await adminPage.waitForLoadState('networkidle');
      
      // Ouvrir le détail
      await adminPage.click(`text=${numeroDemande}`);
      await adminPage.waitForURL(/\/admin\/demandes\/[a-f0-9]+/);
      
      // Transition vers EN_COURS d'abord
      await adminPage.click('button:has-text("Changer le statut")');
      await adminPage.click(`text=${STATUT_LABELS.EN_COURS}`);
      await adminPage.fill('textarea[name="commentaire"]', 'Prise en charge');
      await adminPage.click('button:has-text("Confirmer")');
      await waitForSuccessToast(adminPage, 'statut');
      
      // Mettre en attente d'information
      await adminPage.click('button:has-text("Changer le statut")');
      await adminPage.click(`text=${STATUT_LABELS.ATTENTE_INFO}`);
      
      const infoRequise = 'Veuillez fournir une copie de votre carte d\'identité et un justificatif de domicile';
      await adminPage.fill('textarea[name="commentaire"]', infoRequise);
      await adminPage.click('button:has-text("Confirmer")');
      
      await waitForSuccessToast(adminPage, 'statut');
      
      // Vérifier le statut
      await expect(adminPage.locator(`text=${STATUT_LABELS.ATTENTE_INFO}`)).toBeVisible();
      
      // Vérifier que l'étudiant voit la demande d'information
      await studentPage.reload();
      await expect(studentPage.locator(`text=${STATUT_LABELS.ATTENTE_INFO}`)).toBeVisible();
      
      // Nettoyer
      await studentContext.close();
      await adminContext.close();
    });

    test('devrait permettre de reprendre une demande depuis ATTENTE_INFO vers EN_COURS', async ({ browser }) => {
      // Créer une demande et la mettre en attente
      const studentContext = await browser.newContext();
      const studentPage = await studentContext.newPage();
      
      await loginAsStudent(studentPage);
      const numeroDemande = await createTestDemande(studentPage, 'Reprise Attente Test');
      
      const adminContext = await browser.newContext();
      const adminPage = await adminContext.newPage();
      
      await loginAsAdmin(adminPage);
      await adminPage.goto('/admin/demandes');
      await adminPage.fill('input[placeholder*="Rechercher"]', numeroDemande);
      await adminPage.press('input[placeholder*="Rechercher"]', 'Enter');
      await adminPage.waitForLoadState('networkidle');
      
      // Mettre en attente
      await adminPage.click(`text=${numeroDemande}`);
      await adminPage.waitForURL(/\/admin\/demandes\/[a-f0-9]+/);
      
      await adminPage.click('button:has-text("Changer le statut")');
      await adminPage.click(`text=${STATUT_LABELS.EN_COURS}`);
      await adminPage.fill('textarea[name="commentaire"]', 'Prise en charge');
      await adminPage.click('button:has-text("Confirmer")');
      await waitForSuccessToast(adminPage, 'statut');
      
      await adminPage.click('button:has-text("Changer le statut")');
      await adminPage.click(`text=${STATUT_LABELS.ATTENTE_INFO}`);
      await adminPage.fill('textarea[name="commentaire"]', 'En attente de documents');
      await adminPage.click('button:has-text("Confirmer")');
      await waitForSuccessToast(adminPage, 'statut');
      
      // Reprendre vers EN_COURS
      await adminPage.click('button:has-text("Changer le statut")');
      await adminPage.click(`text=${STATUT_LABELS.EN_COURS}`);
      await adminPage.fill('textarea[name="commentaire"]', 'Documents reçus, reprise du traitement');
      await adminPage.click('button:has-text("Confirmer")');
      
      await waitForSuccessToast(adminPage, 'statut');
      
      // Vérifier le statut EN_COURS
      await expect(adminPage.locator(`text=${STATUT_LABELS.EN_COURS}`)).toBeVisible();
      
      // Vérifier l'historique
      await expect(adminPage.locator('text=Documents reçus, reprise du traitement')).toBeVisible();
      
      // Nettoyer
      await studentContext.close();
      await adminContext.close();
    });

    test('devrait notifier l\'étudiant quand la demande est en attente d\'info', async ({ browser }) => {
      // Créer une demande
      const studentContext = await browser.newContext();
      const studentPage = await studentContext.newPage();
      
      await loginAsStudent(studentPage);
      const numeroDemande = await createTestDemande(studentPage, 'Notification Attente Test');
      
      const adminContext = await browser.newContext();
      const adminPage = await adminContext.newPage();
      
      await loginAsAdmin(adminPage);
      await adminPage.goto('/admin/demandes');
      await adminPage.fill('input[placeholder*="Rechercher"]', numeroDemande);
      await adminPage.press('input[placeholder*="Rechercher"]', 'Enter');
      await adminPage.waitForLoadState('networkidle');
      
      // Mettre en attente
      await adminPage.click(`text=${numeroDemande}`);
      await adminPage.waitForURL(/\/admin\/demandes\/[a-f0-9]+/);
      
      await adminPage.click('button:has-text("Changer le statut")');
      await adminPage.click(`text=${STATUT_LABELS.EN_COURS}`);
      await adminPage.fill('textarea[name="commentaire"]', 'Prise en charge');
      await adminPage.click('button:has-text("Confirmer")');
      await waitForSuccessToast(adminPage, 'statut');
      
      await adminPage.click('button:has-text("Changer le statut")');
      await adminPage.click(`text=${STATUT_LABELS.ATTENTE_INFO}`);
      const messageInfo = 'Merci de nous envoyer votre carte d\'étudiant pour finaliser la demande';
      await adminPage.fill('textarea[name="commentaire"]', messageInfo);
      await adminPage.click('button:has-text("Confirmer")');
      await waitForSuccessToast(adminPage, 'statut');
      
      // Vérifier chez l'étudiant
      await studentPage.reload();
      await expect(studentPage.locator(`text=${STATUT_LABELS.ATTENTE_INFO}`)).toBeVisible();
      await expect(studentPage.locator(`text=${messageInfo}`)).toBeVisible();
      
      // Nettoyer
      await studentContext.close();
      await adminContext.close();
    });
  });

  test.describe('Transitions invalides', () => {
    
    test('ne devrait pas permettre de revenir à SOUMIS depuis un statut avancé', async ({ browser }) => {
      // Créer et avancer une demande
      const studentContext = await browser.newContext();
      const studentPage = await studentContext.newPage();
      
      await loginAsStudent(studentPage);
      const numeroDemande = await createTestDemande(studentPage, 'Transition Invalide Test');
      
      const adminContext = await browser.newContext();
      const adminPage = await adminContext.newPage();
      
      await loginAsAdmin(adminPage);
      await adminPage.goto('/admin/demandes');
      await adminPage.fill('input[placeholder*="Rechercher"]', numeroDemande);
      await adminPage.press('input[placeholder*="Rechercher"]', 'Enter');
      await adminPage.waitForLoadState('networkidle');
      
      // Avancer à EN_COURS
      await adminPage.click(`text=${numeroDemande}`);
      await adminPage.waitForURL(/\/admin\/demandes\/[a-f0-9]+/);
      
      await adminPage.click('button:has-text("Changer le statut")');
      await adminPage.click(`text=${STATUT_LABELS.EN_COURS}`);
      await adminPage.fill('textarea[name="commentaire"]', 'Prise en charge');
      await adminPage.click('button:has-text("Confirmer")');
      await waitForSuccessToast(adminPage, 'statut');
      
      // Vérifier que SOUMIS n'est pas une option
      await adminPage.click('button:has-text("Changer le statut")');
      const soumisOption = adminPage.locator(`div[role="option"]:has-text("${STATUT_LABELS.SOUMIS}"), button:has-text("${STATUT_LABELS.SOUMIS}")`);
      
      // SOUMIS ne devrait pas être disponible
      const isVisible = await soumisOption.isVisible().catch(() => false);
      expect(isVisible).toBeFalsy();
      
      // Nettoyer
      await studentContext.close();
      await adminContext.close();
    });

    test('ne devrait pas permettre de modifier une demande déjà TRAITEE', async ({ browser }) => {
      // Créer et traiter complètement une demande
      const studentContext = await browser.newContext();
      const studentPage = await studentContext.newPage();
      
      await loginAsStudent(studentPage);
      const numeroDemande = await createTestDemande(studentPage, 'Demande Finalisée Test');
      
      const adminContext = await browser.newContext();
      const adminPage = await adminContext.newPage();
      
      await loginAsAdmin(adminPage);
      await adminPage.goto('/admin/demandes');
      await adminPage.fill('input[placeholder*="Rechercher"]', numeroDemande);
      await adminPage.press('input[placeholder*="Rechercher"]', 'Enter');
      await adminPage.waitForLoadState('networkidle');
      
      // Traiter complètement
      await adminPage.click(`text=${numeroDemande}`);
      await adminPage.waitForURL(/\/admin\/demandes\/[a-f0-9]+/);
      
      const transitions = ['EN_COURS', 'VALIDE', 'TRAITE'];
      for (const transition of transitions) {
        await adminPage.click('button:has-text("Changer le statut")');
        await adminPage.click(`text=${STATUT_LABELS[transition as keyof typeof STATUT_LABELS]}`);
        await adminPage.fill('textarea[name="commentaire"]', `Transition vers ${transition}`);
        await adminPage.click('button:has-text("Confirmer")');
        await waitForSuccessToast(adminPage, 'statut');
        await adminPage.waitForTimeout(300);
      }
      
      // Vérifier que le bouton de changement de statut est désactivé ou absent
      const changeButton = adminPage.locator('button:has-text("Changer le statut")');
      const isDisabled = await changeButton.isDisabled().catch(() => false);
      const isVisible = await changeButton.isVisible().catch(() => false);
      
      // Soit le bouton est désactivé, soit il n'est plus visible
      expect(isDisabled || !isVisible).toBeTruthy();
      
      // Nettoyer
      await studentContext.close();
      await adminContext.close();
    });
  });

  test.describe('Historique des transitions', () => {
    
    test('devrait enregistrer l\'historique de toutes les transitions', async ({ browser }) => {
      // Créer une demande avec plusieurs transitions
      const studentContext = await browser.newContext();
      const studentPage = await studentContext.newPage();
      
      await loginAsStudent(studentPage);
      const numeroDemande = await createTestDemande(studentPage, 'Historique Complet Test');
      
      const adminContext = await browser.newContext();
      const adminPage = await adminContext.newPage();
      
      await loginAsAdmin(adminPage);
      await adminPage.goto('/admin/demandes');
      await adminPage.fill('input[placeholder*="Rechercher"]', numeroDemande);
      await adminPage.press('input[placeholder*="Rechercher"]', 'Enter');
      await adminPage.waitForLoadState('networkidle');
      
      // Ouvrir et faire des transitions
      await adminPage.click(`text=${numeroDemande}`);
      await adminPage.waitForURL(/\/admin\/demandes\/[a-f0-9]+/);
      
      const commentaires = ['Prise en charge', 'Vérification des documents', 'Validation finale'];
      const statuts = ['EN_COURS', 'VALIDE', 'TRAITE'];
      
      for (let i = 0; i < statuts.length; i++) {
        await adminPage.click('button:has-text("Changer le statut")');
        await adminPage.click(`text=${STATUT_LABELS[statuts[i] as keyof typeof STATUT_LABELS]}`);
        await adminPage.fill('textarea[name="commentaire"]', commentaires[i]);
        await adminPage.click('button:has-text("Confirmer")');
        await waitForSuccessToast(adminPage, 'statut');
        await adminPage.waitForTimeout(300);
      }
      
      // Vérifier l'historique complet
      await expect(adminPage.locator('text=Historique')).toBeVisible();
      
      // Vérifier que chaque transition est enregistrée
      for (const commentaire of commentaires) {
        await expect(adminPage.locator(`text=${commentaire}`)).toBeVisible();
      }
      
      // Vérifier les transitions dans l'historique
      await expect(adminPage.locator(`text=${STATUT_LABELS.EN_COURS}`)).toBeVisible();
      await expect(adminPage.locator(`text=${STATUT_LABELS.VALIDE}`)).toBeVisible();
      await expect(adminPage.locator(`text=${STATUT_LABELS.TRAITE}`)).toBeVisible();
      
      // Nettoyer
      await studentContext.close();
      await adminContext.close();
    });

    test('devrait afficher l\'utilisateur ayant fait chaque transition', async ({ browser }) => {
      // Créer une demande
      const studentContext = await browser.newContext();
      const studentPage = await studentContext.newPage();
      
      await loginAsStudent(studentPage);
      const numeroDemande = await createTestDemande(studentPage, 'Historique Utilisateur Test');
      
      const adminContext = await browser.newContext();
      const adminPage = await adminContext.newPage();
      
      await loginAsAdmin(adminPage);
      await adminPage.goto('/admin/demandes');
      await adminPage.fill('input[placeholder*="Rechercher"]', numeroDemande);
      await adminPage.press('input[placeholder*="Rechercher"]', 'Enter');
      await adminPage.waitForLoadState('networkidle');
      
      // Faire une transition
      await adminPage.click(`text=${numeroDemande}`);
      await adminPage.waitForURL(/\/admin\/demandes\/[a-f0-9]+/);
      
      await adminPage.click('button:has-text("Changer le statut")');
      await adminPage.click(`text=${STATUT_LABELS.EN_COURS}`);
      await adminPage.fill('textarea[name="commentaire"]', 'Test utilisateur');
      await adminPage.click('button:has-text("Confirmer")');
      await waitForSuccessToast(adminPage, 'statut');
      
      // Vérifier que l'admin est mentionné dans l'historique
      await expect(adminPage.locator('text=Admin')).toBeVisible();
      await expect(adminPage.locator('text=ADMIN')).toBeVisible();
      
      // Nettoyer
      await studentContext.close();
      await adminContext.close();
    });
  });
});
