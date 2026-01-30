import type { IDemandeDocument, DemandeStatus, UserRole } from '@/types/database';
import { Historique, Notification } from '@/lib/db/models';
import {
  WORKFLOW_TRANSITIONS,
  STATUTS_META,
  TRANSITION_PERMISSIONS,
  TRANSITION_REQUIREMENTS,
  canTransition,
  isTerminalStatus
} from './constants';

export interface TransitionContext {
  userId?: string;
  userRole?: UserRole | 'SYSTEM';
  commentaire?: string;
  motifRefus?: string;
  traiteParId?: string;
}

export class DemandeWorkflow {
  private demande: IDemandeDocument;
  private context: TransitionContext;

  constructor(demande: IDemandeDocument, context: TransitionContext = {}) {
    this.demande = demande;
    this.context = context;
  }

  /**
   * Execute a status transition with full validation and side effects
   */
  async transition(newStatut: DemandeStatus): Promise<void> {
    const currentStatut = this.demande.statut.code;

    // 1. Validate transition path
    if (!canTransition(currentStatut, newStatut)) {
      throw new WorkflowError(
        'WF_001',
        `Invalid transition: ${currentStatut} → ${newStatut}. ` +
        `Allowed transitions: ${WORKFLOW_TRANSITIONS[currentStatut].join(', ')}`,
        {
          currentStatus: currentStatut,
          attemptedStatus: newStatut,
          allowedTransitions: WORKFLOW_TRANSITIONS[currentStatut]
        }
      );
    }

    // 2. Validate permissions
    this.validatePermissions(currentStatut, newStatut);

    // 3. Pre-transition validation
    await this.onBeforeTransition(currentStatut, newStatut);

    const oldStatut = { ...this.demande.statut };

    // 4. Update status
    this.demande.statut = {
      code: newStatut,
      ...STATUTS_META[newStatut]
    };

    // 5. Save demande
    await this.demande.save();

    // 6. Create history entry
    await this.logHistorique(oldStatut, newStatut);

    // 7. Post-transition actions
    await this.onAfterTransition(currentStatut, newStatut);
  }

  /**
   * Validate user has permission for this transition
   */
  private validatePermissions(from: DemandeStatus, to: DemandeStatus): void {
    if (!this.context.userRole) {
      throw new WorkflowError(
        'WF_003',
        'User role is required for transition validation'
      );
    }

    const transitionKey = `${from}->${to}`;
    const allowedRoles = TRANSITION_PERMISSIONS[transitionKey];

    if (!allowedRoles) {
      // If no specific permissions defined, allow ADMIN and SUPER_ADMIN
      if (!['ADMIN', 'SUPER_ADMIN'].includes(this.context.userRole)) {
        throw new WorkflowError(
          'WF_003',
          `Role ${this.context.userRole} not allowed for transition ${transitionKey}`
        );
      }
      return;
    }

    if (!allowedRoles.includes(this.context.userRole)) {
      throw new WorkflowError(
        'WF_003',
        `Insufficient permissions. Required roles: ${allowedRoles.join(', ')}`,
        {
          userRole: this.context.userRole,
          requiredRoles: allowedRoles
        }
      );
    }
  }

  /**
   * Pre-transition validation and setup
   */
  private async onBeforeTransition(from: DemandeStatus, to: DemandeStatus): Promise<void> {
    const requirements = TRANSITION_REQUIREMENTS[to];

    if (!requirements) return;

    // Validate required fields
    if (requirements.requiredFields) {
      for (const field of requirements.requiredFields) {
        if (field === 'motifRefus' && !this.context.motifRefus) {
          throw new WorkflowError(
            'WF_002',
            'Un motif de refus est requis pour rejeter une demande'
          );
        }

        if (field === 'commentaireAdmin' && !this.context.commentaire) {
          throw new WorkflowError(
            'WF_002',
            'Un commentaire administrateur est requis pour cette transition'
          );
        }

        if (field === 'documents' && this.demande.documents.length === 0) {
          throw new WorkflowError(
            'WF_002',
            'Au moins un document est requis pour valider la demande'
          );
        }
      }
    }

    // Business rule: Cannot modify terminal states
    if (isTerminalStatus(from) && to !== 'ARCHIVE') {
      throw new WorkflowError(
        'WF_002',
        'Cannot modify demandes in terminal state (except archiving)'
      );
    }

    // Update demande fields based on context
    if (this.context.motifRefus) {
      this.demande.motifRefus = this.context.motifRefus;
    }

    if (this.context.commentaire) {
      this.demande.commentaireAdmin = this.context.commentaire;
    }

    if (this.context.traiteParId) {
      this.demande.traiteParId = this.context.traiteParId as any;
    }
  }

  /**
   * Post-transition side effects
   */
  private async onAfterTransition(from: DemandeStatus, to: DemandeStatus): Promise<void> {
    // Auto-transition: VALIDE → TRAITE
    if (to === 'VALIDE') {
      // Set traiteParId if not already set
      if (!this.demande.traiteParId && this.context.userId) {
        this.demande.traiteParId = this.context.userId as any;
      }

      // Auto-transition to TRAITE
      setTimeout(async () => {
        this.demande.statut = {
          code: 'TRAITE',
          ...STATUTS_META['TRAITE']
        };
        this.demande.dateTraitement = new Date();
        await this.demande.save();

        await this.logHistorique(
          { code: 'VALIDE', libelle: 'Validé' },
          'TRAITE'
        );

        await this.sendNotification('TRAITE');
      }, 100);
    }

    // Update dateTraitement for TRAITE status
    if (to === 'TRAITE') {
      this.demande.dateTraitement = new Date();
      await this.demande.save();
    }

    // Send notifications
    await this.sendNotification(to);
  }

  /**
   * Log transition to historique
   */
  private async logHistorique(
    oldStatut: { code: DemandeStatus; libelle: string },
    newStatut: DemandeStatus
  ): Promise<void> {
    const historiqueData: any = {
      demandeId: this.demande._id,
      numeroDemandeRef: this.demande.numeroDemande,
      statutAncien: oldStatut,
      statutNouveau: {
        code: newStatut,
        libelle: STATUTS_META[newStatut].libelle
      },
      typeAction: 'CHANGEMENT_STATUT',
      commentaire: this.context.commentaire
    };

    // Add user info only if userId is not SYSTEM (to avoid ObjectId cast error)
    if (this.context.userId && this.context.userId !== 'SYSTEM') {
      // In a real implementation, fetch user from database
      historiqueData.utilisateur = {
        id: this.context.userId,
        nom: 'User', // Fetch from DB
        role: this.context.userRole
      };
    }

    await Historique.create(historiqueData);
  }

  /**
   * Send email notification for status change
   */
  private async sendNotification(newStatut: DemandeStatus): Promise<void> {
    // Import email service dynamically to avoid circular dependencies
    try {
      const { sendDemandeStatusEmail } = await import('@/lib/email');

      // Send email immediately
      const result = await sendDemandeStatusEmail(this.demande as any);

      if (!result.success) {
        console.error('Failed to send email notification:', result.error);
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      // Don't throw - notification failures shouldn't break the workflow
    }
  }
}

/**
 * Custom error class for workflow errors
 */
export class WorkflowError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'WorkflowError';
  }
}
