/**
 * Helpers pour les tests E2E Playwright
 * Fonctions utilitaires pour l'authentification et la gestion des demandes
 */

import { Page, expect } from '@playwright/test';

// ==========================================
// Constantes
// ==========================================

export const TEST_USERS = {
  student: {
    email: 'adnane.saber@university.edu',
    password: 'password123',
    name: 'Adnane Saber',
  },
  admin: {
    email: 'admin@university.edu',
    password: 'Admin123!',
    name: 'Admin User',
  },
  invalid: {
    email: 'invalid@university.edu',
    password: 'wrongpassword',
  },
} as const;

export const TYPE_DEMANDE = {
  ATTESTATION_SCOLARITE: 'Attestation de scolarité',
  RELEVE_NOTES: 'Relevé de notes',
  ATTESTATION_REUSSITE: 'Attestation de réussite',
  DUPLICATA_CARTE: 'Duplicata de carte étudiant',
  CONVENTION_STAGE: 'Convention de stage',
} as const;

export const TYPE_DEMANDE_VALUES = {
  ATTESTATION_SCOLARITE: 'ATTESTATION_SCOLARITE',
  RELEVE_NOTES: 'RELEVE_NOTES',
  ATTESTATION_REUSSITE: 'ATTESTATION_REUSSITE',
  DUPLICATA_CARTE: 'DUPLICATA_CARTE',
  CONVENTION_STAGE: 'CONVENTION_STAGE',
} as const;

export const PRIORITE = {
  BASSE: 'Basse',
  NORMALE: 'Normale',
  HAUTE: 'Haute',
  URGENTE: 'Urgente',
} as const;

export const STATUT_LABELS = {
  SOUMIS: 'Soumis',
  RECU: 'Reçu',
  EN_COURS: 'En cours',
  ATTENTE_INFO: 'En attente d\'information',
  VALIDE: 'Validé',
  REJETE: 'Rejeté',
  TRAITE: 'Traité',
  ARCHIVE: 'Archivé',
} as const;

// ==========================================
// Fonctions d'authentification
// ==========================================

/**
 * Connecte un utilisateur étudiant
 * @param page - Instance de page Playwright
 */
export async function loginAsStudent(page: Page): Promise<void> {
  // Use callbackUrl to go directly to demandes page after login
  await page.goto('/auth/signin?callbackUrl=/demandes');
  
  // Remplir le formulaire de connexion
  await page.fill('input#email', TEST_USERS.student.email);
  await page.fill('input#password', TEST_USERS.student.password);
  
  // Soumettre le formulaire
  await page.click('button[type="submit"]');
  
  // Attendre la redirection vers la page des demandes
  await page.waitForURL('/demandes');
  
  // Vérifier que la connexion a réussi
  await expect(page.locator('h1')).toContainText('Mes demandes');
}

/**
 * Connecte un utilisateur administrateur
 * @param page - Instance de page Playwright
 */
export async function loginAsAdmin(page: Page): Promise<void> {
  // Use callbackUrl to go directly to admin dashboard after login
  await page.goto('/auth/signin?callbackUrl=/admin/dashboard');
  
  // Remplir le formulaire de connexion
  await page.fill('input#email', TEST_USERS.admin.email);
  await page.fill('input#password', TEST_USERS.admin.password);
  
  // Soumettre le formulaire
  await page.click('button[type="submit"]');
  
  // Attendre la redirection vers le tableau de bord admin
  await page.waitForURL('/admin/dashboard');
}

/**
 * Déconnecte l'utilisateur courant
 * @param page - Instance de page Playwright
 */
export async function logout(page: Page): Promise<void> {
  // Cliquer sur le bouton de déconnexion (si présent)
  const logoutButton = page.locator('button:has-text("Déconnexion"), a:has-text("Déconnexion")');
  
  if (await logoutButton.isVisible().catch(() => false)) {
    await logoutButton.click();
    await page.waitForURL('/auth/signin');
  }
}

// ==========================================
// Fonctions de gestion des demandes
// ==========================================

export interface CreateDemandeData {
  type: keyof typeof TYPE_DEMANDE_VALUES;
  objet: string;
  description: string;
  priorite?: keyof typeof PRIORITE;
}

/**
 * Crée une nouvelle demande
 * @param page - Instance de page Playwright
 * @param data - Données de la demande
 * @returns Le numéro de la demande créée
 */
export async function createDemande(page: Page, data: CreateDemandeData): Promise<string> {
  // Naviguer vers la page de création
  await page.goto('/demandes/new');
  
  // Attendre que le formulaire soit chargé
  await page.waitForSelector('form');
  
  // Remplir le type de demande (Select avec Radix UI)
  await page.click('button:has-text("Sélectionner un type de demande")');
  await page.click(`div[role="option"]:has-text("${TYPE_DEMANDE[data.type]}")`);
  
  // Remplir l'objet
  await page.fill('input[name="objet"]', data.objet);
  
  // Remplir la description
  await page.fill('textarea[name="description"]', data.description);
  
  // Sélectionner la priorité si différente de la valeur par défaut
  if (data.priorite && data.priorite !== 'NORMALE') {
    await page.click('button:has-text("Normale")');
    await page.click(`div[role="option"]:has-text("${PRIORITE[data.priorite]}")`);
  }
  
  // Soumettre le formulaire
  await page.click('button[type="submit"]');
  
  // Attendre la redirection et le toast de succès
  await page.waitForURL('/demandes');
  
  // Attendre que le toast apparaisse
  await page.waitForSelector('[data-sonner-toast]', { timeout: 5000 });
  
  // Récupérer le numéro de demande depuis le toast ou la liste
  const toastContent = await page.locator('[data-sonner-toast]').textContent();
  const match = toastContent?.match(/DEM-\d{4}-\d{6}/);
  
  if (match) {
    return match[0];
  }
  
  // Alternative: récupérer depuis la première carte de demande
  const demandeCard = page.locator('.grid > div:first-child');
  const numeroText = await demandeCard.locator('p.text-sm.text-gray-600').textContent();
  
  if (numeroText) {
    return numeroText.trim();
  }
  
  throw new Error('Impossible de récupérer le numéro de la demande créée');
}

/**
 * Crée une demande avec remplissage rapide (pour les tests qui nécessitent une demande existante)
 * @param page - Instance de page Playwright
 * @param prefix - Préfixe pour l'objet de la demande (pour l'identifier dans les tests)
 * @param data - Données optionnelles pour personnaliser la demande
 */
export async function createTestDemande(
  page: Page, 
  prefix: string = 'Test',
  data?: Partial<CreateDemandeData>
): Promise<string> {
  const timestamp = Date.now();
  return createDemande(page, {
    type: data?.type || 'ATTESTATION_SCOLARITE',
    objet: data?.objet || `${prefix} - Demande E2E ${timestamp}`,
    description: data?.description || `Description de test pour la demande E2E créée le ${new Date().toLocaleString('fr-FR')}. Cette demande est utilisée pour les tests automatisés.`,
    priorite: data?.priorite || 'NORMALE',
  });
}

/**
 * Ouvre le détail d'une demande depuis la liste
 * @param page - Instance de page Playwright
 * @param numeroDemande - Numéro de la demande à ouvrir
 */
export async function openDemandeDetail(page: Page, numeroDemande: string): Promise<void> {
  // Chercher la demande par son numéro et cliquer dessus
  const demandeCard = page.locator(`div:has-text("${numeroDemande}"):has(h3)`);
  await demandeCard.click();
  
  // Attendre la navigation vers la page de détail
  await page.waitForURL(/\/demandes\/[a-f0-9]+/);
}

/**
 * Récupère le numéro de la première demande visible dans la liste
 * @param page - Instance de page Playwright
 */
export async function getFirstDemandeNumero(page: Page): Promise<string | null> {
  const numeroElement = page.locator('.grid > div:first-child p.text-sm.text-gray-600');
  
  if (await numeroElement.isVisible().catch(() => false)) {
    return numeroElement.textContent();
  }
  
  return null;
}

/**
 * Vérifie si une demande avec un numéro spécifique est visible dans la liste
 * @param page - Instance de page Playwright
 * @param numeroDemande - Numéro de la demande à chercher
 */
export async function isDemandeVisible(page: Page, numeroDemande: string): Promise<boolean> {
  const demandeCard = page.locator(`div:has-text("${numeroDemande}"):has(h3)`);
  return demandeCard.isVisible().catch(() => false);
}

// ==========================================
// Fonctions utilitaires
// ==========================================

/**
 * Attend qu'un toast de succès apparaisse
 * @param page - Instance de page Playwright
 * @param message - Message partiel attendu dans le toast (optionnel)
 */
export async function waitForSuccessToast(page: Page, message?: string): Promise<void> {
  const toastSelector = '[data-sonner-toast]';
  await page.waitForSelector(toastSelector, { timeout: 5000 });
  
  if (message) {
    await expect(page.locator(toastSelector)).toContainText(message);
  }
}

/**
 * Attend qu'un toast d'erreur apparaisse
 * @param page - Instance de page Playwright
 * @param message - Message partiel attendu dans le toast (optionnel)
 */
export async function waitForErrorToast(page: Page, message?: string): Promise<void> {
  const toastSelector = '[data-sonner-toast][data-type="error"], [data-sonner-toast]';
  await page.waitForSelector(toastSelector, { timeout: 5000 });
  
  if (message) {
    await expect(page.locator(toastSelector)).toContainText(message);
  }
}

/**
 * Génère un numéro de demande unique pour les tests
 */
export function generateUniqueId(): string {
  return `TEST-${Date.now()}`;
}

/**
 * Navigue vers la page des demandes
 * @param page - Instance de page Playwright
 */
export async function navigateToDemandes(page: Page): Promise<void> {
  await page.goto('/demandes');
  await page.waitForSelector('h1:has-text("Mes demandes")');
}

/**
 * Navigue vers la page de création d'une demande
 * @param page - Instance de page Playwright
 */
export async function navigateToNewDemande(page: Page): Promise<void> {
  await page.goto('/demandes/new');
  await page.waitForSelector('h1:has-text("Nouvelle demande")');
}

/**
 * Filtre les demandes par statut
 * @param page - Instance de page Playwright
 * @param statut - Statut à filtrer
 */
export async function filterByStatus(page: Page, statut: keyof typeof STATUT_LABELS | 'ALL'): Promise<void> {
  await page.click('button:has-text("Toutes les demandes")');
  
  if (statut === 'ALL') {
    await page.click('div[role="option"]:has-text("Toutes les demandes")');
  } else {
    await page.click(`div[role="option"]:has-text("${STATUT_LABELS[statut]}")`);
  }
  
  // Attendre que le filtre soit appliqué
  await page.waitForTimeout(500);
}

/**
 * Recherche une demande par texte
 * @param page - Instance de page Playwright
 * @param searchTerm - Terme de recherche
 */
export async function searchDemande(page: Page, searchTerm: string): Promise<void> {
  await page.fill('input[placeholder="Rechercher une demande..."]', searchTerm);
  
  // Attendre que la recherche soit appliquée
  await page.waitForTimeout(500);
}

/**
 * Efface le champ de recherche
 * @param page - Instance de page Playwright
 */
export async function clearSearch(page: Page): Promise<void> {
  await page.fill('input[placeholder="Rechercher une demande..."]', '');
  await page.waitForTimeout(500);
}

/**
 * Récupère le statut affiché d'une demande
 * @param page - Instance de page Playwright
 * @param numeroDemande - Numéro de la demande
 */
export async function getDemandeStatus(page: Page, numeroDemande: string): Promise<string | null> {
  const demandeCard = page.locator(`div:has-text("${numeroDemande}"):has(h3)`);
  const badge = demandeCard.locator('[class*="badge"], span[class*="rounded"]');
  
  if (await badge.isVisible().catch(() => false)) {
    return badge.textContent();
  }
  
  return null;
}

/**
 * Vérifie que l'utilisateur est sur la page de connexion
 * @param page - Instance de page Playwright
 */
export async function expectToBeOnLoginPage(page: Page): Promise<void> {
  await expect(page).toHaveURL('/auth/signin');
  await expect(page.locator('text=Système de Gestion des Demandes').first()).toBeVisible();
}

/**
 * Vérifie que l'utilisateur est sur la page des demandes
 * @param page - Instance de page Playwright
 */
export async function expectToBeOnDemandesPage(page: Page): Promise<void> {
  await expect(page).toHaveURL('/demandes');
  await expect(page.locator('h1')).toContainText('Mes demandes');
}

/**
 * Vérifie que le formulaire de connexion affiche une erreur
 * @param page - Instance de page Playwright
 * @param message - Message d'erreur attendu (optionnel)
 */
export async function expectLoginError(page: Page, message?: string): Promise<void> {
  const errorToast = page.locator('[data-sonner-toast]');
  await expect(errorToast).toBeVisible();
  
  if (message) {
    await expect(errorToast).toContainText(message);
  }
}
