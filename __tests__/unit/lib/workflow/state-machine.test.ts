import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DemandeWorkflow, WorkflowError, TransitionContext } from '@/lib/workflow/state-machine';
import { STATUTS_META } from '@/lib/workflow/constants';
import type { IDemandeDocument, DemandeStatus } from '@/types/database';

// Mock des dépendances
vi.mock('@/lib/db/models', () => ({
  Historique: {
    create: vi.fn().mockResolvedValue({})
  },
  Notification: {
    create: vi.fn().mockResolvedValue({})
  }
}));

vi.mock('@/lib/email', () => ({
  sendDemandeStatusEmail: vi.fn().mockResolvedValue({ success: true })
}));

describe('WorkflowError', () => {
  it('crée une erreur avec code et message', () => {
    const error = new WorkflowError('WF_001', 'Message d\'erreur');
    expect(error.code).toBe('WF_001');
    expect(error.message).toBe('Message d\'erreur');
    expect(error.name).toBe('WorkflowError');
  });

  it('crée une erreur avec détails supplémentaires', () => {
    const details = { currentStatus: 'SOUMIS', attemptedStatus: 'ARCHIVE' };
    const error = new WorkflowError('WF_001', 'Message', details);
    expect(error.details).toEqual(details);
  });

  it('hérite de la classe Error', () => {
    const error = new WorkflowError('WF_001', 'Message');
    expect(error).toBeInstanceOf(Error);
  });
});

describe('DemandeWorkflow', () => {
  let mockDemande: IDemandeDocument;
  let mockSave: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockSave = vi.fn().mockResolvedValue(undefined);
    mockDemande = {
      _id: 'demande123',
      numeroDemande: 'DEM-2026-000001',
      statut: { code: 'SOUMIS', ...STATUTS_META.SOUMIS },
      save: mockSave,
      etudiant: {
        id: 'etudiant123',
        nom: 'Dupont',
        prenom: 'Jean',
        email: 'jean.dupont@university.edu',
        apogee: '2024001'
      },
      typeDemande: {
        code: 'ATTESTATION_SCOLARITE',
        libelle: 'Attestation de scolarité',
        delaiTraitement: 3
      },
      objet: 'Demande test',
      description: 'Description de test',
      priorite: 'NORMALE',
      documents: [],
      actif: true,
      dateCreation: new Date(),
      dateModification: new Date()
    } as unknown as IDemandeDocument;
  });

  describe('transition', () => {
    it('effectue une transition valide avec le rôle SYSTEM', async () => {
      const workflow = new DemandeWorkflow(mockDemande, { userRole: 'SYSTEM' });
      await workflow.transition('RECU');
      expect(mockDemande.statut.code).toBe('RECU');
      expect(mockSave).toHaveBeenCalled();
    });

    it('effectue une transition valide avec le rôle ADMIN', async () => {
      mockDemande.statut = { code: 'RECU', ...STATUTS_META.RECU };
      const workflow = new DemandeWorkflow(mockDemande, { userRole: 'ADMIN' });
      await workflow.transition('EN_COURS');
      expect(mockDemande.statut.code).toBe('EN_COURS');
    });

    it('effectue une transition valide avec le rôle SUPER_ADMIN', async () => {
      mockDemande.statut = { code: 'RECU', ...STATUTS_META.RECU };
      const workflow = new DemandeWorkflow(mockDemande, { userRole: 'SUPER_ADMIN' });
      await workflow.transition('EN_COURS');
      expect(mockDemande.statut.code).toBe('EN_COURS');
    });

    it('lance une WorkflowError pour une transition invalide', async () => {
      const workflow = new DemandeWorkflow(mockDemande, { userRole: 'SYSTEM' });
      await expect(workflow.transition('VALIDE')).rejects.toThrow(WorkflowError);
      await expect(workflow.transition('VALIDE')).rejects.toThrow('Invalid transition');
    });

    it('lance une erreur avec le code WF_001 pour transition invalide', async () => {
      const workflow = new DemandeWorkflow(mockDemande, { userRole: 'SYSTEM' });
      try {
        await workflow.transition('VALIDE');
      } catch (error) {
        expect((error as WorkflowError).code).toBe('WF_001');
      }
    });

    it('lance une erreur quand le rôle utilisateur est manquant', async () => {
      mockDemande.statut = { code: 'RECU', ...STATUTS_META.RECU };
      const workflow = new DemandeWorkflow(mockDemande, {});
      await expect(workflow.transition('EN_COURS')).rejects.toThrow(WorkflowError);
      await expect(workflow.transition('EN_COURS')).rejects.toThrow('User role is required');
    });

    it('lance une erreur avec le code WF_003 pour permissions insuffisantes', async () => {
      mockDemande.statut = { code: 'RECU', ...STATUTS_META.RECU };
      const workflow = new DemandeWorkflow(mockDemande, {});
      try {
        await workflow.transition('EN_COURS');
      } catch (error) {
        expect((error as WorkflowError).code).toBe('WF_003');
      }
    });

    it('lance une erreur quand le rôle n\'a pas les permissions', async () => {
      mockDemande.statut = { code: 'RECU', ...STATUTS_META.RECU };
      const workflow = new DemandeWorkflow(mockDemande, { userRole: 'STUDENT' });
      await expect(workflow.transition('EN_COURS')).rejects.toThrow(WorkflowError);
    });

    it('permet aux étudiants de transitionner ATTENTE_INFO vers EN_COURS', async () => {
      mockDemande.statut = { code: 'ATTENTE_INFO', ...STATUTS_META.ATTENTE_INFO };
      const workflow = new DemandeWorkflow(mockDemande, { userRole: 'STUDENT' });
      await expect(workflow.transition('EN_COURS')).resolves.not.toThrow();
    });

    it('met à jour le motif de refus pour une transition vers REJETE', async () => {
      mockDemande.statut = { code: 'EN_COURS', ...STATUTS_META.EN_COURS };
      const workflow = new DemandeWorkflow(mockDemande, {
        userRole: 'ADMIN',
        motifRefus: 'Ce motif est suffisamment détaillé et explicite pour le refus'
      });
      await workflow.transition('REJETE');
      expect(mockDemande.motifRefus).toBe('Ce motif est suffisamment détaillé et explicite pour le refus');
    });

    it('met à jour le commentaire admin', async () => {
      mockDemande.statut = { code: 'RECU', ...STATUTS_META.RECU };
      const workflow = new DemandeWorkflow(mockDemande, {
        userRole: 'ADMIN',
        commentaire: 'Commentaire administrateur'
      });
      await workflow.transition('EN_COURS');
      expect(mockDemande.commentaireAdmin).toBe('Commentaire administrateur');
    });

    it('met à jour traiteParId quand fourni', async () => {
      mockDemande.statut = { code: 'RECU', ...STATUTS_META.RECU };
      const workflow = new DemandeWorkflow(mockDemande, {
        userRole: 'ADMIN',
        traiteParId: 'admin123'
      });
      await workflow.transition('EN_COURS');
      expect(mockDemande.traiteParId).toBe('admin123');
    });

    it('lance une erreur quand motifRefus est requis mais manquant', async () => {
      mockDemande.statut = { code: 'EN_COURS', ...STATUTS_META.EN_COURS };
      const workflow = new DemandeWorkflow(mockDemande, { userRole: 'ADMIN' });
      await expect(workflow.transition('REJETE')).rejects.toThrow(WorkflowError);
      await expect(workflow.transition('REJETE')).rejects.toThrow('motif de refus est requis');
    });

    it('lance une erreur avec code WF_002 pour validation métier échouée', async () => {
      mockDemande.statut = { code: 'EN_COURS', ...STATUTS_META.EN_COURS };
      const workflow = new DemandeWorkflow(mockDemande, { userRole: 'ADMIN' });
      try {
        await workflow.transition('REJETE');
      } catch (error) {
        expect((error as WorkflowError).code).toBe('WF_002');
      }
    });

    it('lance une erreur quand on essaie de modifier un état terminal', async () => {
      // TRAITE est un état terminal et ne peut transitionner que vers ARCHIVE
      mockDemande.statut = { code: 'TRAITE', ...STATUTS_META.TRAITE };
      // Simuler une transition invalide vers un état non-ARCHIVE
      // Le workflow vérifie d'abord si la transition est valide
      const workflow = new DemandeWorkflow(mockDemande, { userRole: 'ADMIN' });
      // TRAITE ne peut aller que vers ARCHIVE selon WORKFLOW_TRANSITIONS
      // Donc toute autre transition sera rejetée comme invalide
      await expect(workflow.transition('EN_COURS')).rejects.toThrow(WorkflowError);
    });

    it('permet l\'archivage depuis un état terminal', async () => {
      mockDemande.statut = { code: 'REJETE', ...STATUTS_META.REJETE };
      const workflow = new DemandeWorkflow(mockDemande, { userRole: 'ADMIN' });
      await expect(workflow.transition('ARCHIVE')).resolves.not.toThrow();
    });

    it('met à jour dateTraitement pour le statut TRAITE', async () => {
      mockDemande.statut = { code: 'VALIDE', ...STATUTS_META.VALIDE };
      const workflow = new DemandeWorkflow(mockDemande, { userRole: 'SYSTEM' });
      await workflow.transition('TRAITE');
      expect(mockDemande.dateTraitement).toBeInstanceOf(Date);
    });

    it('définit traiteParId depuis le contexte utilisateur pour VALIDE', async () => {
      mockDemande.statut = { code: 'EN_COURS', ...STATUTS_META.EN_COURS };
      const workflow = new DemandeWorkflow(mockDemande, {
        userRole: 'ADMIN',
        userId: 'admin456'
      });
      await workflow.transition('VALIDE');
      expect(mockDemande.traiteParId).toBe('admin456');
    });
  });

  describe('historique', () => {
    it('crée une entrée d\'historique après une transition', async () => {
      const { Historique } = await import('@/lib/db/models');
      const workflow = new DemandeWorkflow(mockDemande, { userRole: 'SYSTEM' });
      await workflow.transition('RECU');
      expect(Historique.create).toHaveBeenCalled();
    });

    it('passe les bons paramètres à Historique.create', async () => {
      const { Historique } = await import('@/lib/db/models');
      const workflow = new DemandeWorkflow(mockDemande, {
        userRole: 'SYSTEM',
        userId: 'SYSTEM',
        commentaire: 'Commentaire test'
      });
      await workflow.transition('RECU');
      expect(Historique.create).toHaveBeenCalledWith(
        expect.objectContaining({
          demandeId: 'demande123',
          numeroDemandeRef: 'DEM-2026-000001',
          typeAction: 'CHANGEMENT_STATUT',
          commentaire: 'Commentaire test',
          statutAncien: expect.objectContaining({ code: 'SOUMIS' }),
          statutNouveau: expect.objectContaining({ code: 'RECU' })
        })
      );
    });

    it('n\'inclut pas utilisateur pour SYSTEM', async () => {
      const { Historique } = await import('@/lib/db/models');
      const workflow = new DemandeWorkflow(mockDemande, {
        userRole: 'SYSTEM',
        userId: 'SYSTEM'
      });
      await workflow.transition('RECU');
      const callArg = (Historique.create as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(callArg.utilisateur).toBeUndefined();
    });
  });

  describe('notifications', () => {
    it('envoie un email après une transition', async () => {
      const { sendDemandeStatusEmail } = await import('@/lib/email');
      const workflow = new DemandeWorkflow(mockDemande, { userRole: 'SYSTEM' });
      await workflow.transition('RECU');
      expect(sendDemandeStatusEmail).toHaveBeenCalled();
    });

    it('ne lance pas d\'erreur si l\'envoi d\'email échoue', async () => {
      const { sendDemandeStatusEmail } = await import('@/lib/email');
      (sendDemandeStatusEmail as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ success: false, error: 'Erreur email' });
      const workflow = new DemandeWorkflow(mockDemande, { userRole: 'SYSTEM' });
      await expect(workflow.transition('RECU')).resolves.not.toThrow();
    });

    it('ne lance pas d\'erreur si le service email lance une exception', async () => {
      const { sendDemandeStatusEmail } = await import('@/lib/email');
      (sendDemandeStatusEmail as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Erreur réseau'));
      const workflow = new DemandeWorkflow(mockDemande, { userRole: 'SYSTEM' });
      await expect(workflow.transition('RECU')).resolves.not.toThrow();
    });
  });

  describe('auto-transition VALIDE -> TRAITE', () => {
    it('initie une auto-transition après VALIDE', async () => {
      mockDemande.statut = { code: 'EN_COURS', ...STATUTS_META.EN_COURS };
      vi.useFakeTimers();
      const workflow = new DemandeWorkflow(mockDemande, { userRole: 'ADMIN' });
      await workflow.transition('VALIDE');
      
      // Avancer le temps pour déclencher le setTimeout
      vi.advanceTimersByTime(150);
      
      expect(mockSave).toHaveBeenCalledTimes(2); // Une fois pour VALIDE, une fois pour TRAITE
      vi.useRealTimers();
    });
  });

  describe('permissions spéciales', () => {
    it('permet à ADMIN les transitions non définies explicitement', async () => {
      mockDemande.statut = { code: 'TRAITE', ...STATUTS_META.TRAITE };
      const workflow = new DemandeWorkflow(mockDemande, { userRole: 'ADMIN' });
      await expect(workflow.transition('ARCHIVE')).resolves.not.toThrow();
    });

    it('permet à SUPER_ADMIN les transitions non définies explicitement', async () => {
      mockDemande.statut = { code: 'TRAITE', ...STATUTS_META.TRAITE };
      const workflow = new DemandeWorkflow(mockDemande, { userRole: 'SUPER_ADMIN' });
      await expect(workflow.transition('ARCHIVE')).resolves.not.toThrow();
    });

    it('refuse les transitions non définies pour STUDENT', async () => {
      mockDemande.statut = { code: 'TRAITE', ...STATUTS_META.TRAITE };
      const workflow = new DemandeWorkflow(mockDemande, { userRole: 'STUDENT' });
      await expect(workflow.transition('ARCHIVE')).rejects.toThrow(WorkflowError);
    });
  });
});
