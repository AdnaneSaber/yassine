/**
 * Tests d'intégration pour les Server Actions de demandes
 * createDemandeAction, updateDemandeAction, deleteDemandeAction, transitionDemandeAction
 */

import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import { setupTestDB, teardownTestDB, clearCollections } from '@/__tests__/helpers/mongodb';
import { Demande, Etudiant, Utilisateur } from '@/lib/db/models';
import { Types } from 'mongoose';
import { getServerSession } from 'next-auth';
import { revalidatePath } from 'next/cache';

// Importer les Server Actions après le setup de la base de données
// Note: Les imports dynamiques sont utilisés dans les tests pour s'assurer que MONGODB_URI est défini
let createDemandeAction: typeof import('@/app/actions/demandes').createDemandeAction;
let updateDemandeAction: typeof import('@/app/actions/demandes').updateDemandeAction;
let deleteDemandeAction: typeof import('@/app/actions/demandes').deleteDemandeAction;
let transitionDemandeAction: typeof import('@/app/actions/demandes').transitionDemandeAction;

// Mock next-auth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn()
}));

// Mock auth-options
vi.mock('@/lib/auth/auth-options', () => ({
  authOptions: {}
}));

// Mock next/cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn()
}));

describe('Server Actions - Demandes', () => {
  beforeAll(async () => {
    await setupTestDB();
    // Importer les actions après que MONGODB_URI soit défini
    const actions = await import('@/app/actions/demandes');
    createDemandeAction = actions.createDemandeAction;
    updateDemandeAction = actions.updateDemandeAction;
    deleteDemandeAction = actions.deleteDemandeAction;
    transitionDemandeAction = actions.transitionDemandeAction;
  });
  afterAll(async () => await teardownTestDB());
  beforeEach(async () => {
    await clearCollections();
    vi.clearAllMocks();
  });

  describe('createDemandeAction', () => {
    it('crée une demande avec succès pour un étudiant authentifié', async () => {
      // Créer un étudiant de test
      const etudiantId = new Types.ObjectId();
      await Etudiant.create({
        _id: etudiantId,
        matricule: 'TEST001',
        nom: 'Doe',
        prenom: 'John',
        email: 'john.doe@test.com',
        hashPassword: 'hashedpassword123',
        actif: true
      });

      // Mock la session étudiant
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: etudiantId.toString(), email: 'john.doe@test.com', type: 'student' }
      });

      const formData = new FormData();
      formData.append('typeDemande', 'ATTESTATION_SCOLARITE');
      formData.append('objet', 'Demande d\'attestation de scolarité');
      formData.append('description', 'Je souhaite obtenir une attestation de scolarité pour mes démarches administratives.');
      formData.append('priorite', 'NORMALE');

      const result = await createDemandeAction(formData);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.objet).toBe('Demande d\'attestation de scolarité');
      expect(result.data.typeDemande.code).toBe('ATTESTATION_SCOLARITE');
      expect(result.data.etudiant.email).toBe('john.doe@test.com');
      expect(result.data.numeroDemande).toMatch(/^DEM-\d{4}-\d{6}$/);
      expect(revalidatePath).toHaveBeenCalledWith('/demandes');
      expect(revalidatePath).toHaveBeenCalledWith('/dashboard');
    });

    it('retourne une erreur si non authentifié', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const formData = new FormData();
      formData.append('typeDemande', 'ATTESTATION_SCOLARITE');
      formData.append('objet', 'Demande d\'attestation');
      formData.append('description', 'Description de la demande pour mes démarches.');

      const result = await createDemandeAction(formData);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe('AUTH_001');
      expect(result.error?.message).toContain('Non authentifié');
    });

    it('retourne une erreur si l\'utilisateur n\'est pas un étudiant', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'admin123', email: 'admin@test.com', type: 'admin' }
      });

      const formData = new FormData();
      formData.append('typeDemande', 'ATTESTATION_SCOLARITE');
      formData.append('objet', 'Demande d\'attestation');
      formData.append('description', 'Description de la demande pour mes démarches.');

      const result = await createDemandeAction(formData);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('AUTH_002');
      expect(result.error?.message).toContain('étudiants');
    });

    it('retourne une erreur si l\'étudiant n\'existe pas', async () => {
      const nonExistentId = new Types.ObjectId();

      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: nonExistentId.toString(), email: 'unknown@test.com', type: 'student' }
      });

      const formData = new FormData();
      formData.append('typeDemande', 'ATTESTATION_SCOLARITE');
      formData.append('objet', 'Demande d\'attestation');
      formData.append('description', 'Description de la demande pour mes démarches.');

      const result = await createDemandeAction(formData);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('RES_001');
      expect(result.error?.message).toContain('Étudiant non trouvé');
    });

    it('retourne une erreur si l\'étudiant est inactif', async () => {
      const etudiantId = new Types.ObjectId();
      await Etudiant.create({
        _id: etudiantId,
        matricule: 'TEST001',
        nom: 'Doe',
        prenom: 'John',
        email: 'john.doe@test.com',
        hashPassword: 'hashedpassword123',
        actif: false
      });

      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: etudiantId.toString(), email: 'john.doe@test.com', type: 'student' }
      });

      const formData = new FormData();
      formData.append('typeDemande', 'ATTESTATION_SCOLARITE');
      formData.append('objet', 'Demande d\'attestation');
      formData.append('description', 'Description de la demande pour mes démarches.');

      const result = await createDemandeAction(formData);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('RES_001');
      expect(result.error?.message).toContain('inactif');
    });

    it('retourne une erreur de validation pour un objet trop court', async () => {
      const etudiantId = new Types.ObjectId();
      await Etudiant.create({
        _id: etudiantId,
        matricule: 'TEST001',
        nom: 'Doe',
        prenom: 'John',
        email: 'john.doe@test.com',
        hashPassword: 'hashedpassword123',
        actif: true
      });

      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: etudiantId.toString(), email: 'john.doe@test.com', type: 'student' }
      });

      const formData = new FormData();
      formData.append('typeDemande', 'ATTESTATION_SCOLARITE');
      formData.append('objet', 'Test');
      formData.append('description', 'Description suffisamment longue pour passer la validation.');

      const result = await createDemandeAction(formData);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('VAL_001');
      expect(result.error?.details).toBeDefined();
    });

    it('retourne une erreur de validation pour une description trop courte', async () => {
      const etudiantId = new Types.ObjectId();
      await Etudiant.create({
        _id: etudiantId,
        matricule: 'TEST001',
        nom: 'Doe',
        prenom: 'John',
        email: 'john.doe@test.com',
        hashPassword: 'hashedpassword123',
        actif: true
      });

      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: etudiantId.toString(), email: 'john.doe@test.com', type: 'student' }
      });

      const formData = new FormData();
      formData.append('typeDemande', 'ATTESTATION_SCOLARITE');
      formData.append('objet', 'Demande d\'attestation');
      formData.append('description', 'Court');

      const result = await createDemandeAction(formData);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('VAL_001');
    });

    it('retourne une erreur si objet et description sont identiques', async () => {
      const etudiantId = new Types.ObjectId();
      await Etudiant.create({
        _id: etudiantId,
        matricule: 'TEST001',
        nom: 'Doe',
        prenom: 'John',
        email: 'john.doe@test.com',
        hashPassword: 'hashedpassword123',
        actif: true
      });

      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: etudiantId.toString(), email: 'john.doe@test.com', type: 'student' }
      });

      const formData = new FormData();
      formData.append('typeDemande', 'ATTESTATION_SCOLARITE');
      formData.append('objet', 'Ceci est un texte identique');
      formData.append('description', 'Ceci est un texte identique pour le test');

      const result = await createDemandeAction(formData);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('VAL_001');
    });

    it('utilise la priorité NORMALE par défaut si non spécifiée', async () => {
      const etudiantId = new Types.ObjectId();
      await Etudiant.create({
        _id: etudiantId,
        matricule: 'TEST001',
        nom: 'Doe',
        prenom: 'John',
        email: 'john.doe@test.com',
        hashPassword: 'hashedpassword123',
        actif: true
      });

      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: etudiantId.toString(), email: 'john.doe@test.com', type: 'student' }
      });

      const formData = new FormData();
      formData.append('typeDemande', 'ATTESTATION_SCOLARITE');
      formData.append('objet', 'Demande d\'attestation');
      formData.append('description', 'Description suffisamment longue pour passer la validation.');

      const result = await createDemandeAction(formData);

      expect(result.success).toBe(true);
      expect(result.data.priorite).toBe('NORMALE');
    });

    it('accepte tous les types de demande valides', async () => {
      const typesValides = [
        'ATTESTATION_SCOLARITE',
        'RELEVE_NOTES',
        'ATTESTATION_REUSSITE',
        'DUPLICATA_CARTE',
        'CONVENTION_STAGE'
      ];

      for (let i = 0; i < typesValides.length; i++) {
        const type = typesValides[i];
        // Créer un nouvel étudiant pour chaque type avec un matricule unique
        const etudiantId = new Types.ObjectId();
        await Etudiant.create({
          _id: etudiantId,
          matricule: `TEST${i + 1}${type.substring(0, 3)}`,
          nom: 'Doe',
          prenom: 'John',
          email: `john.${type.toLowerCase()}@test.com`,
          hashPassword: 'hashedpassword123',
          actif: true
        });

        vi.mocked(getServerSession).mockResolvedValue({
          user: { id: etudiantId.toString(), email: `john.${type.toLowerCase()}@test.com`, type: 'student' }
        });

        const formData = new FormData();
        formData.append('typeDemande', type);
        // Utiliser un nom sans underscore car le validateur ne les accepte pas
        const nomType = type.replace(/_/g, ' ');
        formData.append('objet', `Demande ${nomType}`);
        formData.append('description', `Description pour la demande de type ${nomType}. Cette description est assez longue.`);

        const result = await createDemandeAction(formData);

        expect(result.success).toBe(true);
        expect(result.data.typeDemande.code).toBe(type);
      }
    });

    it('génère un numéro de demande unique incrémental', async () => {
      const etudiantId = new Types.ObjectId();
      await Etudiant.create({
        _id: etudiantId,
        matricule: 'TEST001',
        nom: 'Doe',
        prenom: 'John',
        email: 'john.doe@test.com',
        hashPassword: 'hashedpassword123',
        actif: true
      });

      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: etudiantId.toString(), email: 'john.doe@test.com', type: 'student' }
      });

      const numeros: string[] = [];

      for (let i = 0; i < 3; i++) {
        const formData = new FormData();
        formData.append('typeDemande', 'ATTESTATION_SCOLARITE');
        formData.append('objet', `Demande ${i + 1}`);
        formData.append('description', `Description de la demande numéro ${i + 1}. Assez longue.`);

        const result = await createDemandeAction(formData);
        expect(result.success).toBe(true);
        numeros.push(result.data.numeroDemande);
      }

      // Vérifier que les numéros sont uniques
      const uniqueNumeros = new Set(numeros);
      expect(uniqueNumeros.size).toBe(3);

      // Vérifier le format et l'incrémentation
      const year = new Date().getFullYear();
      expect(numeros[0]).toBe(`DEM-${year}-000001`);
      expect(numeros[1]).toBe(`DEM-${year}-000002`);
      expect(numeros[2]).toBe(`DEM-${year}-000003`);
    });
  });

  describe('updateDemandeAction', () => {
    it('met à jour une demande avec succès', async () => {
      const etudiantId = new Types.ObjectId();
      
      // Créer une demande existante
      const demande = new Demande({
        etudiant: {
          id: etudiantId,
          nom: 'Doe',
          prenom: 'John',
          email: 'john.doe@test.com',
          matricule: 'TEST001'
        },
        typeDemande: {
          code: 'ATTESTATION_SCOLARITE',
          nom: 'Attestation de scolarité',
          delaiTraitement: 3
        },
        statut: {
          code: 'SOUMIS',
          libelle: 'Soumis',
          couleur: '#6B7280'
        },
        objet: 'Demande originale',
        description: 'Description originale de la demande pour test.',
        priorite: 'NORMALE',
        documents: [],
        actif: true
      });
      await demande.save();

      const formData = new FormData();
      formData.append('objet', 'Demande modifiée');
      formData.append('description', 'Nouvelle description de la demande modifiée.');

      const result = await updateDemandeAction(demande._id.toString(), formData);

      expect(result.success).toBe(true);
      expect(result.data.objet).toBe('Demande modifiée');
      expect(result.data.description).toBe('Nouvelle description de la demande modifiée.');
      expect(revalidatePath).toHaveBeenCalledWith('/demandes');
      expect(revalidatePath).toHaveBeenCalledWith(`/demandes/${demande._id.toString()}`);
    });

    it('met à jour partiellement une demande', async () => {
      const etudiantId = new Types.ObjectId();
      
      const demande = new Demande({
        etudiant: {
          id: etudiantId,
          nom: 'Doe',
          prenom: 'John',
          email: 'john.doe@test.com',
          matricule: 'TEST001'
        },
        typeDemande: {
          code: 'ATTESTATION_SCOLARITE',
          nom: 'Attestation de scolarité',
          delaiTraitement: 3
        },
        statut: {
          code: 'SOUMIS',
          libelle: 'Soumis',
          couleur: '#6B7280'
        },
        objet: 'Demande originale',
        description: 'Description originale de la demande pour test.',
        priorite: 'NORMALE',
        documents: [],
        actif: true
      });
      await demande.save();

      // Mise à jour partielle - seulement l'objet
      const formData = new FormData();
      formData.append('objet', 'Objet mis à jour');

      const result = await updateDemandeAction(demande._id.toString(), formData);

      expect(result.success).toBe(true);
      expect(result.data.objet).toBe('Objet mis à jour');
      expect(result.data.description).toBe('Description originale de la demande pour test.');
    });

    it('met à jour la priorité d\'une demande', async () => {
      const etudiantId = new Types.ObjectId();
      
      const demande = new Demande({
        etudiant: {
          id: etudiantId,
          nom: 'Doe',
          prenom: 'John',
          email: 'john.doe@test.com',
          matricule: 'TEST001'
        },
        typeDemande: {
          code: 'ATTESTATION_SCOLARITE',
          nom: 'Attestation de scolarité',
          delaiTraitement: 3
        },
        statut: {
          code: 'SOUMIS',
          libelle: 'Soumis',
          couleur: '#6B7280'
        },
        objet: 'Demande originale',
        description: 'Description originale de la demande pour test.',
        priorite: 'NORMALE',
        documents: [],
        actif: true
      });
      await demande.save();

      const formData = new FormData();
      formData.append('priorite', 'URGENTE');

      const result = await updateDemandeAction(demande._id.toString(), formData);

      expect(result.success).toBe(true);
      expect(result.data.priorite).toBe('URGENTE');
    });

    it('retourne une erreur si la demande n\'existe pas', async () => {
      const nonExistentId = new Types.ObjectId();

      const formData = new FormData();
      formData.append('objet', 'Demande modifiée');

      const result = await updateDemandeAction(nonExistentId.toString(), formData);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('RES_001');
      expect(result.error?.message).toContain('Demande non trouvée');
    });

    it('retourne une erreur de validation pour un objet invalide', async () => {
      const etudiantId = new Types.ObjectId();
      
      const demande = new Demande({
        etudiant: {
          id: etudiantId,
          nom: 'Doe',
          prenom: 'John',
          email: 'john.doe@test.com',
          matricule: 'TEST001'
        },
        typeDemande: {
          code: 'ATTESTATION_SCOLARITE',
          nom: 'Attestation de scolarité',
          delaiTraitement: 3
        },
        statut: {
          code: 'SOUMIS',
          libelle: 'Soumis',
          couleur: '#6B7280'
        },
        objet: 'Demande originale',
        description: 'Description originale de la demande pour test.',
        priorite: 'NORMALE',
        documents: [],
        actif: true
      });
      await demande.save();

      const formData = new FormData();
      formData.append('objet', 'A'); // Trop court

      const result = await updateDemandeAction(demande._id.toString(), formData);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('VAL_001');
    });

    it('accepte plusieurs champs à mettre à jour simultanément', async () => {
      const etudiantId = new Types.ObjectId();
      
      const demande = new Demande({
        etudiant: {
          id: etudiantId,
          nom: 'Doe',
          prenom: 'John',
          email: 'john.doe@test.com',
          matricule: 'TEST001'
        },
        typeDemande: {
          code: 'ATTESTATION_SCOLARITE',
          nom: 'Attestation de scolarité',
          delaiTraitement: 3
        },
        statut: {
          code: 'SOUMIS',
          libelle: 'Soumis',
          couleur: '#6B7280'
        },
        objet: 'Demande originale',
        description: 'Description originale de la demande pour test.',
        priorite: 'NORMALE',
        documents: [],
        actif: true
      });
      await demande.save();

      const formData = new FormData();
      formData.append('objet', 'Nouveau titre');
      formData.append('description', 'Nouvelle description complète de la demande.');
      formData.append('priorite', 'HAUTE');

      const result = await updateDemandeAction(demande._id.toString(), formData);

      expect(result.success).toBe(true);
      expect(result.data.objet).toBe('Nouveau titre');
      expect(result.data.description).toBe('Nouvelle description complète de la demande.');
      expect(result.data.priorite).toBe('HAUTE');
    });
  });

  describe('deleteDemandeAction', () => {
    it('supprime (soft delete) une demande avec succès', async () => {
      const etudiantId = new Types.ObjectId();
      
      const demande = new Demande({
        etudiant: {
          id: etudiantId,
          nom: 'Doe',
          prenom: 'John',
          email: 'john.doe@test.com',
          matricule: 'TEST001'
        },
        typeDemande: {
          code: 'ATTESTATION_SCOLARITE',
          nom: 'Attestation de scolarité',
          delaiTraitement: 3
        },
        statut: {
          code: 'SOUMIS',
          libelle: 'Soumis',
          couleur: '#6B7280'
        },
        objet: 'Demande à supprimer',
        description: 'Description de la demande à supprimer.',
        priorite: 'NORMALE',
        documents: [],
        actif: true
      });
      await demande.save();

      const result = await deleteDemandeAction(demande._id.toString());

      expect(result.success).toBe(true);
      expect(revalidatePath).toHaveBeenCalledWith('/demandes');

      // Vérifier que la demande est marquée comme inactive
      const demandeSupprimee = await Demande.findById(demande._id);
      expect(demandeSupprimee?.actif).toBe(false);
    });

    it('retourne une erreur si la demande n\'existe pas', async () => {
      const nonExistentId = new Types.ObjectId();

      const result = await deleteDemandeAction(nonExistentId.toString());

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('RES_001');
      expect(result.error?.message).toContain('Demande non trouvée');
    });

    it('ne supprime pas définitivement la demande (soft delete)', async () => {
      const etudiantId = new Types.ObjectId();
      
      const demande = new Demande({
        etudiant: {
          id: etudiantId,
          nom: 'Doe',
          prenom: 'John',
          email: 'john.doe@test.com',
          matricule: 'TEST001'
        },
        typeDemande: {
          code: 'ATTESTATION_SCOLARITE',
          nom: 'Attestation de scolarité',
          delaiTraitement: 3
        },
        statut: {
          code: 'SOUMIS',
          libelle: 'Soumis',
          couleur: '#6B7280'
        },
        objet: 'Demande à supprimer',
        description: 'Description de la demande à supprimer.',
        priorite: 'NORMALE',
        documents: [],
        actif: true
      });
      await demande.save();

      await deleteDemandeAction(demande._id.toString());

      // Vérifier que la demande existe toujours en base
      const demandeToujoursExistante = await Demande.findById(demande._id);
      expect(demandeToujoursExistante).toBeDefined();
      expect(demandeToujoursExistante?.actif).toBe(false);
    });
  });

  describe('transitionDemandeAction', () => {
    it('transitionne une demande vers EN_COURS avec succès', async () => {
      // Créer un admin
      const adminId = new Types.ObjectId();
      await Utilisateur.create({
        _id: adminId,
        email: 'admin@test.com',
        hashPassword: 'hashedpassword123',
        nom: 'Admin',
        prenom: 'Test',
        role: 'ADMIN',
        actif: true
      });

      const etudiantId = new Types.ObjectId();
      const demande = new Demande({
        etudiant: {
          id: etudiantId,
          nom: 'Doe',
          prenom: 'John',
          email: 'john.doe@test.com',
          matricule: 'TEST001'
        },
        typeDemande: {
          code: 'ATTESTATION_SCOLARITE',
          nom: 'Attestation de scolarité',
          delaiTraitement: 3
        },
        statut: {
          code: 'RECU',
          libelle: 'Reçu',
          couleur: '#3B82F6'
        },
        objet: 'Demande à traiter',
        description: 'Description de la demande à traiter.',
        priorite: 'NORMALE',
        documents: [],
        actif: true
      });
      await demande.save();

      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: adminId.toString(), email: 'admin@test.com', role: 'ADMIN' }
      });

      const formData = new FormData();
      formData.append('newStatut', 'EN_COURS');
      formData.append('commentaire', 'Je commence le traitement de cette demande.');

      const result = await transitionDemandeAction(demande._id.toString(), formData);

      expect(result.success).toBe(true);
      expect(result.data.statut.code).toBe('EN_COURS');
      expect(revalidatePath).toHaveBeenCalledWith('/admin/demandes');
    });

    it('retourne une erreur si non authentifié', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const etudiantId = new Types.ObjectId();
      const demande = new Demande({
        etudiant: {
          id: etudiantId,
          nom: 'Doe',
          prenom: 'John',
          email: 'john.doe@test.com',
          matricule: 'TEST001'
        },
        typeDemande: {
          code: 'ATTESTATION_SCOLARITE',
          nom: 'Attestation de scolarité',
          delaiTraitement: 3
        },
        statut: {
          code: 'RECU',
          libelle: 'Reçu',
          couleur: '#3B82F6'
        },
        objet: 'Demande à traiter',
        description: 'Description de la demande à traiter.',
        priorite: 'NORMALE',
        documents: [],
        actif: true
      });
      await demande.save();

      const formData = new FormData();
      formData.append('newStatut', 'EN_COURS');

      const result = await transitionDemandeAction(demande._id.toString(), formData);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('AUTH_001');
    });

    it('retourne une erreur si l\'utilisateur n\'est pas admin', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'student123', email: 'student@test.com', role: 'STUDENT' }
      });

      const etudiantId = new Types.ObjectId();
      const demande = new Demande({
        etudiant: {
          id: etudiantId,
          nom: 'Doe',
          prenom: 'John',
          email: 'john.doe@test.com',
          matricule: 'TEST001'
        },
        typeDemande: {
          code: 'ATTESTATION_SCOLARITE',
          nom: 'Attestation de scolarité',
          delaiTraitement: 3
        },
        statut: {
          code: 'RECU',
          libelle: 'Reçu',
          couleur: '#3B82F6'
        },
        objet: 'Demande à traiter',
        description: 'Description de la demande à traiter.',
        priorite: 'NORMALE',
        documents: [],
        actif: true
      });
      await demande.save();

      const formData = new FormData();
      formData.append('newStatut', 'EN_COURS');

      const result = await transitionDemandeAction(demande._id.toString(), formData);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('AUTH_003');
      expect(result.error?.message).toContain('administrateur');
    });

    it('accepte les transitions pour SUPER_ADMIN', async () => {
      const superAdminId = new Types.ObjectId();
      await Utilisateur.create({
        _id: superAdminId,
        email: 'superadmin@test.com',
        hashPassword: 'hashedpassword123',
        nom: 'Super',
        prenom: 'Admin',
        role: 'SUPER_ADMIN',
        actif: true
      });

      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: superAdminId.toString(), email: 'superadmin@test.com', role: 'SUPER_ADMIN' }
      });

      const etudiantId = new Types.ObjectId();
      const demande = new Demande({
        etudiant: {
          id: etudiantId,
          nom: 'Doe',
          prenom: 'John',
          email: 'john.doe@test.com',
          matricule: 'TEST001'
        },
        typeDemande: {
          code: 'ATTESTATION_SCOLARITE',
          nom: 'Attestation de scolarité',
          delaiTraitement: 3
        },
        statut: {
          code: 'RECU',
          libelle: 'Reçu',
          couleur: '#3B82F6'
        },
        objet: 'Demande à traiter',
        description: 'Description de la demande à traiter.',
        priorite: 'NORMALE',
        documents: [],
        actif: true
      });
      await demande.save();

      const formData = new FormData();
      formData.append('newStatut', 'EN_COURS');

      const result = await transitionDemandeAction(demande._id.toString(), formData);

      expect(result.success).toBe(true);
      expect(result.data.statut.code).toBe('EN_COURS');
    });

    it('retourne une erreur pour une transition invalide', async () => {
      const adminId = new Types.ObjectId();
      await Utilisateur.create({
        _id: adminId,
        email: 'admin@test.com',
        hashPassword: 'hashedpassword123',
        nom: 'Admin',
        prenom: 'Test',
        role: 'ADMIN',
        actif: true
      });

      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: adminId.toString(), email: 'admin@test.com', role: 'ADMIN' }
      });

      const etudiantId = new Types.ObjectId();
      const demande = new Demande({
        etudiant: {
          id: etudiantId,
          nom: 'Doe',
          prenom: 'John',
          email: 'john.doe@test.com',
          matricule: 'TEST001'
        },
        typeDemande: {
          code: 'ATTESTATION_SCOLARITE',
          nom: 'Attestation de scolarité',
          delaiTraitement: 3
        },
        statut: {
          code: 'SOUMIS',
          libelle: 'Soumis',
          couleur: '#6B7280'
        },
        objet: 'Demande à traiter',
        description: 'Description de la demande à traiter.',
        priorite: 'NORMALE',
        documents: [],
        actif: true
      });
      await demande.save();

      // Transition invalide: SOUMIS -> EN_COURS (doit passer par RECU)
      const formData = new FormData();
      formData.append('newStatut', 'EN_COURS');

      const result = await transitionDemandeAction(demande._id.toString(), formData);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('SRV_001');
    });

    it('retourne une erreur si la demande n\'existe pas', async () => {
      const adminId = new Types.ObjectId();
      await Utilisateur.create({
        _id: adminId,
        email: 'admin@test.com',
        hashPassword: 'hashedpassword123',
        nom: 'Admin',
        prenom: 'Test',
        role: 'ADMIN',
        actif: true
      });

      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: adminId.toString(), email: 'admin@test.com', role: 'ADMIN' }
      });

      const nonExistentId = new Types.ObjectId();

      const formData = new FormData();
      formData.append('newStatut', 'EN_COURS');

      const result = await transitionDemandeAction(nonExistentId.toString(), formData);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('RES_001');
    });

    it('utilise l\'ID de l\'admin connecté si traiteParId non fourni', async () => {
      const adminId = new Types.ObjectId();
      await Utilisateur.create({
        _id: adminId,
        email: 'admin@test.com',
        hashPassword: 'hashedpassword123',
        nom: 'Admin',
        prenom: 'Test',
        role: 'ADMIN',
        actif: true
      });

      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: adminId.toString(), email: 'admin@test.com', role: 'ADMIN' }
      });

      const etudiantId = new Types.ObjectId();
      const demande = new Demande({
        etudiant: {
          id: etudiantId,
          nom: 'Doe',
          prenom: 'John',
          email: 'john.doe@test.com',
          matricule: 'TEST001'
        },
        typeDemande: {
          code: 'ATTESTATION_SCOLARITE',
          nom: 'Attestation de scolarité',
          delaiTraitement: 3
        },
        statut: {
          code: 'RECU',
          libelle: 'Reçu',
          couleur: '#3B82F6'
        },
        objet: 'Demande à traiter',
        description: 'Description de la demande à traiter.',
        priorite: 'NORMALE',
        documents: [],
        actif: true
      });
      await demande.save();

      const formData = new FormData();
      formData.append('newStatut', 'EN_COURS');

      const result = await transitionDemandeAction(demande._id.toString(), formData);

      expect(result.success).toBe(true);
    });

    it('accepte un traiteParId personnalisé', async () => {
      const adminId = new Types.ObjectId();
      const autreAdminId = new Types.ObjectId();
      
      await Utilisateur.create({
        _id: adminId,
        email: 'admin@test.com',
        hashPassword: 'hashedpassword123',
        nom: 'Admin',
        prenom: 'Test',
        role: 'ADMIN',
        actif: true
      });

      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: adminId.toString(), email: 'admin@test.com', role: 'ADMIN' }
      });

      const etudiantId = new Types.ObjectId();
      const demande = new Demande({
        etudiant: {
          id: etudiantId,
          nom: 'Doe',
          prenom: 'John',
          email: 'john.doe@test.com',
          matricule: 'TEST001'
        },
        typeDemande: {
          code: 'ATTESTATION_SCOLARITE',
          nom: 'Attestation de scolarité',
          delaiTraitement: 3
        },
        statut: {
          code: 'RECU',
          libelle: 'Reçu',
          couleur: '#3B82F6'
        },
        objet: 'Demande à traiter',
        description: 'Description de la demande à traiter.',
        priorite: 'NORMALE',
        documents: [],
        actif: true
      });
      await demande.save();

      const formData = new FormData();
      formData.append('newStatut', 'EN_COURS');
      formData.append('traiteParId', autreAdminId.toString());

      const result = await transitionDemandeAction(demande._id.toString(), formData);

      expect(result.success).toBe(true);
    });
  });
});
