/**
 * Toast Utility Functions
 *
 * Provides consistent toast notifications with French messages using Sonner.
 * All toasts follow the application's messaging standards and UX patterns.
 */

import { toast as sonnerToast } from 'sonner';

// ============================================================================
// Success Toasts
// ============================================================================

export const toast = {
  /**
   * Show a success toast
   */
  success: (message: string, options?: {
    description?: string;
    duration?: number;
  }) => {
    return sonnerToast.success(message, {
      description: options?.description,
      duration: options?.duration ?? 4000,
    });
  },

  /**
   * Show an error toast
   */
  error: (message: string, options?: {
    description?: string;
    duration?: number;
  }) => {
    return sonnerToast.error(message, {
      description: options?.description,
      duration: options?.duration ?? 5000,
    });
  },

  /**
   * Show an info toast
   */
  info: (message: string, options?: {
    description?: string;
    duration?: number;
  }) => {
    return sonnerToast.info(message, {
      description: options?.description,
      duration: options?.duration ?? 4000,
    });
  },

  /**
   * Show a warning toast
   */
  warning: (message: string, options?: {
    description?: string;
    duration?: number;
  }) => {
    return sonnerToast.warning(message, {
      description: options?.description,
      duration: options?.duration ?? 4000,
    });
  },

  /**
   * Show a loading toast that can be updated later
   */
  loading: (message: string, options?: {
    description?: string;
  }) => {
    return sonnerToast.loading(message, {
      description: options?.description,
    });
  },

  /**
   * Show a promise toast that automatically updates based on promise state
   */
  promise: <T,>(
    promise: Promise<T>,
    options: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    }
  ) => {
    return sonnerToast.promise(promise, options);
  },

  /**
   * Dismiss a specific toast by ID
   */
  dismiss: (toastId?: string | number) => {
    return sonnerToast.dismiss(toastId);
  },
};

// ============================================================================
// Demande-specific toast messages
// ============================================================================

export const demandeToasts = {
  // Creation
  created: () => toast.success(
    'Demande créée avec succès',
    { description: 'Votre demande a été enregistrée et sera traitée dans les plus brefs délais.' }
  ),

  createdError: (error?: string) => toast.error(
    'Erreur lors de la création',
    { description: error || 'Une erreur est survenue lors de la création de votre demande.' }
  ),

  // Update
  updated: () => toast.success(
    'Demande modifiée avec succès',
    { description: 'Les modifications ont été enregistrées.' }
  ),

  updatedError: (error?: string) => toast.error(
    'Erreur lors de la modification',
    { description: error || 'Une erreur est survenue lors de la modification de votre demande.' }
  ),

  // Status transitions
  statusChanged: (newStatus: string) => toast.success(
    'Statut modifié',
    { description: `Le statut de la demande a été changé à "${newStatus}".` }
  ),

  statusChangeError: (error?: string) => toast.error(
    'Erreur lors du changement de statut',
    { description: error || 'Impossible de modifier le statut de la demande.' }
  ),

  // Deletion
  deleted: () => toast.success(
    'Demande supprimée',
    { description: 'La demande a été supprimée définitivement.' }
  ),

  deletedError: (error?: string) => toast.error(
    'Erreur lors de la suppression',
    { description: error || 'Impossible de supprimer la demande.' }
  ),

  // File upload
  fileUploaded: (fileName: string) => toast.success(
    'Fichier ajouté',
    { description: `Le fichier "${fileName}" a été téléversé avec succès.` }
  ),

  fileUploadError: (error?: string) => toast.error(
    'Erreur lors du téléversement',
    { description: error || 'Impossible de téléverser le fichier.' }
  ),

  fileDeleted: (fileName: string) => toast.success(
    'Fichier supprimé',
    { description: `Le fichier "${fileName}" a été supprimé.` }
  ),

  fileDeleteError: (error?: string) => toast.error(
    'Erreur lors de la suppression',
    { description: error || 'Impossible de supprimer le fichier.' }
  ),

  // Comments
  commentAdded: () => toast.success(
    'Commentaire ajouté',
    { description: 'Votre commentaire a été enregistré.' }
  ),

  commentAddError: (error?: string) => toast.error(
    'Erreur lors de l\'ajout du commentaire',
    { description: error || 'Impossible d\'ajouter le commentaire.' }
  ),
};

// ============================================================================
// Authentication toast messages
// ============================================================================

export const authToasts = {
  loginSuccess: () => toast.success(
    'Connexion réussie',
    { description: 'Bienvenue !' }
  ),

  loginError: (error?: string) => toast.error(
    'Échec de la connexion',
    { description: error || 'Email ou mot de passe incorrect.' }
  ),

  logoutSuccess: () => toast.success(
    'Déconnexion réussie',
    { description: 'À bientôt !' }
  ),

  sessionExpired: () => toast.warning(
    'Session expirée',
    { description: 'Veuillez vous reconnecter pour continuer.' }
  ),

  unauthorized: () => toast.error(
    'Accès non autorisé',
    { description: 'Vous n\'avez pas les permissions nécessaires.' }
  ),
};

// ============================================================================
// General application toast messages
// ============================================================================

export const appToasts = {
  // Generic success/error
  success: (message: string) => toast.success(message),
  error: (message: string) => toast.error(message),
  info: (message: string) => toast.info(message),
  warning: (message: string) => toast.warning(message),

  // Network errors
  networkError: () => toast.error(
    'Erreur de connexion',
    { description: 'Vérifiez votre connexion internet et réessayez.' }
  ),

  serverError: () => toast.error(
    'Erreur serveur',
    { description: 'Une erreur est survenue sur le serveur. Veuillez réessayer plus tard.' }
  ),

  // Form validation
  validationError: () => toast.error(
    'Erreur de validation',
    { description: 'Veuillez corriger les erreurs dans le formulaire.' }
  ),

  // Data operations
  saveSuccess: () => toast.success('Enregistré avec succès'),
  saveError: () => toast.error('Erreur lors de l\'enregistrement'),

  loadError: () => toast.error(
    'Erreur de chargement',
    { description: 'Impossible de charger les données.' }
  ),

  // Copy operations
  copiedToClipboard: () => toast.success(
    'Copié',
    { description: 'Le texte a été copié dans le presse-papier.' }
  ),

  copyError: () => toast.error(
    'Erreur de copie',
    { description: 'Impossible de copier dans le presse-papier.' }
  ),
};

// ============================================================================
// Admin-specific toast messages
// ============================================================================

export const adminToasts = {
  // User management
  userCreated: () => toast.success(
    'Utilisateur créé',
    { description: 'Le nouvel utilisateur a été créé avec succès.' }
  ),

  userUpdated: () => toast.success(
    'Utilisateur modifié',
    { description: 'Les informations de l\'utilisateur ont été mises à jour.' }
  ),

  userDeleted: () => toast.success(
    'Utilisateur supprimé',
    { description: 'L\'utilisateur a été supprimé du système.' }
  ),

  // Settings
  settingsSaved: () => toast.success(
    'Paramètres enregistrés',
    { description: 'Les paramètres ont été mis à jour avec succès.' }
  ),

  settingsError: () => toast.error(
    'Erreur de configuration',
    { description: 'Impossible de sauvegarder les paramètres.' }
  ),

  // Bulk operations
  bulkOperationSuccess: (count: number, operation: string) => toast.success(
    'Opération réussie',
    { description: `${count} élément(s) ${operation} avec succès.` }
  ),

  bulkOperationError: (error?: string) => toast.error(
    'Erreur lors de l\'opération groupée',
    { description: error || 'Une erreur est survenue lors de l\'opération.' }
  ),
};

// ============================================================================
// Async operation helpers
// ============================================================================

/**
 * Helper to wrap an async operation with toast notifications
 */
export async function withToast<T>(
  operation: () => Promise<T>,
  messages: {
    loading: string;
    success: string | ((result: T) => string);
    error: string | ((error: any) => string);
  }
): Promise<T> {
  return toast.promise(operation(), messages);
}

/**
 * Helper to show a loading toast and update it based on the result
 */
export async function withLoadingToast<T>(
  operation: () => Promise<T>,
  loadingMessage: string,
  successMessage: string | ((result: T) => string),
  errorMessage?: string | ((error: any) => string)
): Promise<T> {
  const toastId = toast.loading(loadingMessage);

  try {
    const result = await operation();
    toast.dismiss(toastId);

    const message = typeof successMessage === 'function'
      ? successMessage(result)
      : successMessage;
    toast.success(message);

    return result;
  } catch (error) {
    toast.dismiss(toastId);

    const message = errorMessage
      ? typeof errorMessage === 'function'
        ? errorMessage(error)
        : errorMessage
      : 'Une erreur est survenue';
    toast.error(message);

    throw error;
  }
}
