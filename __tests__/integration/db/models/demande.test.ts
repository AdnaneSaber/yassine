/**
 * Tests d'intégration pour le modèle Demande (Mongoose)
 * Schema validation, pre-save hook numeroDemande
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { Demande, Etudiant } from '@/lib/db/models';
import { setupTestDB, teardownTestDB, clearCollections } from '@/__tests__/helpers/mongodb';
import { Types } from 'mongoose';
import type { TypeDemandeCode, DemandeStatus, Priorite } from '@/types/database';

describe('Modèle Demande - Intégration', () => {
  beforeAll(async () => await setupTestDB());
  afterAll(async () => await teardownTestDB());
  beforeEach(async () => await clearCollections());

  describe('Schéma validation', () => {
    it('crée une demande valide avec tous les champs requis', async () => {
      const etudiantId = new Types.ObjectId();
      
      const demandeData = {
        etudiant: {
          id: etudiantId,
          nom: 'Doe',
          prenom: 'John',
          email: 'john.doe@test.com',
          matricule: 'TEST001'
        },
        typeDemande: {
          code: 'ATTESTATION_SCOLARITE' as TypeDemandeCode,
          nom: 'Attestation de scolarité',
          delaiTraitement: 3
        },
        statut: {
          code: 'SOUMIS' as DemandeStatus,
          libelle: 'Soumis',
          couleur: '#6B7280'
        },
        objet: 'Demande d\'attestation de scolarité',
        description: 'Je souhaite obtenir une attestation de scolarité pour mes démarches.',
        priorite: 'NORMALE' as Priorite,
        documents: [],
        actif: true
      };

      const demande = new Demande(demandeData);
      const saved = await demande.save();

      expect(saved._id).toBeDefined();
      expect(saved.etudiant.nom).toBe('Doe');
      expect(saved.etudiant.email).toBe('john.doe@test.com');
      expect(saved.typeDemande.code).toBe('ATTESTATION_SCOLARITE');
      expect(saved.statut.code).toBe('SOUMIS');
      expect(saved.objet).toBe('Demande d\'attestation de scolarité');
      expect(saved.actif).toBe(true);
      expect(saved.createdAt).toBeDefined();
      expect(saved.updatedAt).toBeDefined();
    });

    it('rejette une demande sans étudiant', async () => {
      const demandeData = {
        typeDemande: {
          code: 'ATTESTATION_SCOLARITE' as TypeDemandeCode,
          nom: 'Attestation de scolarité',
          delaiTraitement: 3
        },
        statut: {
          code: 'SOUMIS' as DemandeStatus,
          libelle: 'Soumis',
          couleur: '#6B7280'
        },
        objet: 'Demande sans étudiant',
        description: 'Description de test.',
        priorite: 'NORMALE' as Priorite,
        documents: []
      };

      const demande = new Demande(demandeData);
      
      await expect(demande.save()).rejects.toThrow();
    });

    it('rejette une demande sans typeDemande', async () => {
      const etudiantId = new Types.ObjectId();
      
      const demandeData = {
        etudiant: {
          id: etudiantId,
          nom: 'Doe',
          prenom: 'John',
          email: 'john.doe@test.com',
          matricule: 'TEST001'
        },
        statut: {
          code: 'SOUMIS' as DemandeStatus,
          libelle: 'Soumis',
          couleur: '#6B7280'
        },
        objet: 'Demande sans type',
        description: 'Description de test.',
        priorite: 'NORMALE' as Priorite,
        documents: []
      };

      const demande = new Demande(demandeData as any);
      
      await expect(demande.save()).rejects.toThrow();
    });

    it('rejette une demande sans statut', async () => {
      const etudiantId = new Types.ObjectId();
      
      const demandeData = {
        etudiant: {
          id: etudiantId,
          nom: 'Doe',
          prenom: 'John',
          email: 'john.doe@test.com',
          matricule: 'TEST001'
        },
        typeDemande: {
          code: 'ATTESTATION_SCOLARITE' as TypeDemandeCode,
          nom: 'Attestation de scolarité',
          delaiTraitement: 3
        },
        objet: 'Demande sans statut',
        description: 'Description de test.',
        priorite: 'NORMALE' as Priorite,
        documents: []
      };

      const demande = new Demande(demandeData as any);
      
      await expect(demande.save()).rejects.toThrow();
    });

    it('rejette une demande sans objet', async () => {
      const etudiantId = new Types.ObjectId();
      
      const demandeData = {
        etudiant: {
          id: etudiantId,
          nom: 'Doe',
          prenom: 'John',
          email: 'john.doe@test.com',
          matricule: 'TEST001'
        },
        typeDemande: {
          code: 'ATTESTATION_SCOLARITE' as TypeDemandeCode,
          nom: 'Attestation de scolarité',
          delaiTraitement: 3
        },
        statut: {
          code: 'SOUMIS' as DemandeStatus,
          libelle: 'Soumis',
          couleur: '#6B7280'
        },
        description: 'Description de test.',
        priorite: 'NORMALE' as Priorite,
        documents: []
      };

      const demande = new Demande(demandeData as any);
      
      await expect(demande.save()).rejects.toThrow();
    });

    it('rejette une demande sans description', async () => {
      const etudiantId = new Types.ObjectId();
      
      const demandeData = {
        etudiant: {
          id: etudiantId,
          nom: 'Doe',
          prenom: 'John',
          email: 'john.doe@test.com',
          matricule: 'TEST001'
        },
        typeDemande: {
          code: 'ATTESTATION_SCOLARITE' as TypeDemandeCode,
          nom: 'Attestation de scolarité',
          delaiTraitement: 3
        },
        statut: {
          code: 'SOUMIS' as DemandeStatus,
          libelle: 'Soumis',
          couleur: '#6B7280'
        },
        objet: 'Demande sans description',
        priorite: 'NORMALE' as Priorite,
        documents: []
      };

      const demande = new Demande(demandeData as any);
      
      await expect(demande.save()).rejects.toThrow();
    });

    it('accepte tous les types de demande valides', async () => {
      const etudiantId = new Types.ObjectId();
      const typesValides: TypeDemandeCode[] = [
        'ATTESTATION_SCOLARITE',
        'RELEVE_NOTES',
        'ATTESTATION_REUSSITE',
        'DUPLICATA_CARTE',
        'CONVENTION_STAGE'
      ];

      for (const type of typesValides) {
        const demande = new Demande({
          etudiant: {
            id: etudiantId,
            nom: 'Doe',
            prenom: 'John',
            email: 'john.doe@test.com',
            matricule: 'TEST001'
          },
          typeDemande: {
            code: type,
            nom: `Nom ${type}`,
            delaiTraitement: 3
          },
          statut: {
            code: 'SOUMIS',
            libelle: 'Soumis',
            couleur: '#6B7280'
          },
          objet: `Demande ${type}`,
          description: 'Description de test.',
          priorite: 'NORMALE',
          documents: []
        });

        const saved = await demande.save();
        expect(saved.typeDemande.code).toBe(type);
      }
    });

    it('accepte tous les statuts valides', async () => {
      const etudiantId = new Types.ObjectId();
      const statutsValides: DemandeStatus[] = [
        'SOUMIS',
        'RECU',
        'EN_COURS',
        'ATTENTE_INFO',
        'VALIDE',
        'REJETE',
        'TRAITE',
        'ARCHIVE'
      ];

      for (const statut of statutsValides) {
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
            code: statut,
            libelle: statut,
            couleur: '#6B7280'
          },
          objet: `Demande ${statut}`,
          description: 'Description de test.',
          priorite: 'NORMALE',
          documents: []
        });

        const saved = await demande.save();
        expect(saved.statut.code).toBe(statut);
      }
    });

    it('accepte toutes les priorités valides', async () => {
      const etudiantId = new Types.ObjectId();
      const priorites: Priorite[] = ['BASSE', 'NORMALE', 'HAUTE', 'URGENTE'];

      for (const priorite of priorites) {
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
          objet: `Demande ${priorite}`,
          description: 'Description de test.',
          priorite: priorite,
          documents: []
        });

        const saved = await demande.save();
        expect(saved.priorite).toBe(priorite);
      }
    });

    it('utilise NORMALE comme priorité par défaut', async () => {
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
        objet: 'Demande sans priorité spécifiée',
        description: 'Description de test.',
        documents: []
      });

      const saved = await demande.save();
      expect(saved.priorite).toBe('NORMALE');
    });

    it('utilise true comme valeur par défaut pour actif', async () => {
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
        objet: 'Demande sans actif spécifié',
        description: 'Description de test.',
        priorite: 'NORMALE',
        documents: []
      });

      const saved = await demande.save();
      expect(saved.actif).toBe(true);
    });

    it('respecte la limite de 255 caractères pour l\'objet', async () => {
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
        objet: 'A'.repeat(255),
        description: 'Description de test.',
        priorite: 'NORMALE',
        documents: []
      });

      const saved = await demande.save();
      expect(saved.objet).toBe('A'.repeat(255));
    });

    it('rejette un objet dépassant 255 caractères', async () => {
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
        objet: 'A'.repeat(256),
        description: 'Description de test.',
        priorite: 'NORMALE',
        documents: []
      });

      await expect(demande.save()).rejects.toThrow();
    });

    it('accepte les documents avec tous leurs champs', async () => {
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
        objet: 'Demande avec documents',
        description: 'Description de test.',
        priorite: 'NORMALE',
        documents: [
          {
            id: 'doc-123',
            nomFichier: 'attestation.pdf',
            nomOriginal: 'ma_attestation.pdf',
            url: '/uploads/attestation.pdf',
            typeMime: 'application/pdf',
            taille: 1024000,
            categorie: 'justificatif',
            dateUpload: new Date()
          }
        ]
      });

      const saved = await demande.save();
      expect(saved.documents).toHaveLength(1);
      expect(saved.documents[0].nomFichier).toBe('attestation.pdf');
      expect(saved.documents[0].typeMime).toBe('application/pdf');
    });

    it('accepte les champs optionnels', async () => {
      const etudiantId = new Types.ObjectId();
      const traiteParId = new Types.ObjectId();
      
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
          code: 'REJETE',
          libelle: 'Rejeté',
          couleur: '#EF4444',
          estFinal: true
        },
        objet: 'Demande avec champs optionnels',
        description: 'Description de test.',
        priorite: 'NORMALE',
        documents: [],
        commentaireAdmin: 'Demande incomplète',
        motifRefus: 'Documents manquants',
        dateTraitement: new Date(),
        traiteParId: traiteParId,
        metadata: { source: 'web', ip: '127.0.0.1' }
      });

      const saved = await demande.save();
      expect(saved.commentaireAdmin).toBe('Demande incomplète');
      expect(saved.motifRefus).toBe('Documents manquants');
      expect(saved.dateTraitement).toBeDefined();
      expect(saved.traiteParId?.toString()).toBe(traiteParId.toString());
      expect(saved.metadata).toEqual({ source: 'web', ip: '127.0.0.1' });
    });
  });

  describe('Pre-save hook numeroDemande', () => {
    it('génère automatiquement un numeroDemande au format DEM-YYYY-NNNNNN', async () => {
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
        objet: 'Première demande',
        description: 'Description de test.',
        priorite: 'NORMALE',
        documents: []
      });

      const saved = await demande.save();
      const year = new Date().getFullYear();
      
      expect(saved.numeroDemande).toBeDefined();
      expect(saved.numeroDemande).toMatch(new RegExp(`^DEM-${year}-\\d{6}$`));
    });

    it('incrémente le numéro de manière séquentielle', async () => {
      const etudiantId = new Types.ObjectId();
      const year = new Date().getFullYear();
      
      const numeros: string[] = [];

      for (let i = 0; i < 5; i++) {
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
          objet: `Demande ${i + 1}`,
          description: `Description de la demande ${i + 1}.`,
          priorite: 'NORMALE',
          documents: []
        });

        const saved = await demande.save();
        numeros.push(saved.numeroDemande);
      }

      expect(numeros[0]).toBe(`DEM-${year}-000001`);
      expect(numeros[1]).toBe(`DEM-${year}-000002`);
      expect(numeros[2]).toBe(`DEM-${year}-000003`);
      expect(numeros[3]).toBe(`DEM-${year}-000004`);
      expect(numeros[4]).toBe(`DEM-${year}-000005`);
    });

    it('ne régénère pas le numeroDemande lors d\'une mise à jour', async () => {
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
        objet: 'Demande à mettre à jour',
        description: 'Description initiale.',
        priorite: 'NORMALE',
        documents: []
      });

      const saved = await demande.save();
      const numeroOriginal = saved.numeroDemande;

      // Mise à jour de la demande
      saved.objet = 'Demande modifiée';
      saved.description = 'Description modifiée.';
      const updated = await saved.save();

      expect(updated.numeroDemande).toBe(numeroOriginal);
    });

    it('conserve le numeroDemande fourni manuellement', async () => {
      const etudiantId = new Types.ObjectId();
      
      const demande = new Demande({
        numeroDemande: 'DEM-2024-999999',
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
        objet: 'Demande avec numéro manuel',
        description: 'Description de test.',
        priorite: 'NORMALE',
        documents: []
      });

      const saved = await demande.save();
      expect(saved.numeroDemande).toBe('DEM-2024-999999');
    });

    it('génère des numéros uniques pour les demandes créées successivement', async () => {
      const etudiantId = new Types.ObjectId();
      const year = new Date().getFullYear();
      
      // Créer les demandes séquentiellement pour éviter les conflits de numérotation
      const numeros: string[] = [];
      for (let i = 0; i < 5; i++) {
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
          objet: `Demande successive ${i + 1}`,
          description: `Description successive ${i + 1}.`,
          priorite: 'NORMALE',
          documents: []
        });
        const saved = await demande.save();
        numeros.push(saved.numeroDemande);
      }

      // Vérifier l'unicité
      const uniqueNumeros = new Set(numeros);
      expect(uniqueNumeros.size).toBe(5);

      // Vérifier le format
      numeros.forEach(numero => {
        expect(numero).toMatch(new RegExp(`^DEM-${year}-\\d{6}$`));
      });
    });

    it('génère le premier numéro après nettoyage de la collection', async () => {
      // Après clearCollections(), le compteur repart selon les documents existants
      // Ce test vérifie que le hook fonctionne correctement après nettoyage
      const etudiantId = new Types.ObjectId();
      const year = new Date().getFullYear();
      
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
        objet: 'Demande après nettoyage',
        description: 'Description de test.',
        priorite: 'NORMALE',
        documents: []
      });

      const saved = await demande.save();
      // Le numéro dépend de l'état de la base après beforeEach(clearCollections)
      expect(saved.numeroDemande).toMatch(new RegExp(`^DEM-${year}-\\d{6}$`));
    });
  });

  describe('Indexes et requêtes', () => {
    it('permet de rechercher par numeroDemande', async () => {
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
        objet: 'Demande recherchable',
        description: 'Description de test.',
        priorite: 'NORMALE',
        documents: []
      });

      const saved = await demande.save();
      const found = await Demande.findOne({ numeroDemande: saved.numeroDemande });
      
      expect(found).toBeDefined();
      expect(found?._id.toString()).toBe(saved._id.toString());
    });

    it('permet de filtrer par statut', async () => {
      const etudiantId = new Types.ObjectId();
      
      // Créer les demandes séquentiellement avec le constructeur + save
      const demande1 = new Demande({
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
        objet: 'Demande soumise',
        description: 'Description.',
        priorite: 'NORMALE',
        documents: []
      });
      await demande1.save();

      const demande2 = new Demande({
        etudiant: {
          id: etudiantId,
          nom: 'Doe',
          prenom: 'John',
          email: 'john.doe@test.com',
          matricule: 'TEST001'
        },
        typeDemande: {
          code: 'RELEVE_NOTES',
          nom: 'Relevé de notes',
          delaiTraitement: 5
        },
        statut: {
          code: 'EN_COURS',
          libelle: 'En cours',
          couleur: '#F59E0B'
        },
        objet: 'Demande en cours',
        description: 'Description.',
        priorite: 'NORMALE',
        documents: []
      });
      await demande2.save();

      const demandesEnCours = await Demande.find({ 'statut.code': 'EN_COURS' });
      expect(demandesEnCours).toHaveLength(1);
      expect(demandesEnCours[0].objet).toBe('Demande en cours');
    });

    it('permet de filtrer par ID étudiant', async () => {
      const etudiant1Id = new Types.ObjectId();
      const etudiant2Id = new Types.ObjectId();
      
      const demande1 = new Demande({
        etudiant: {
          id: etudiant1Id,
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
        objet: 'Demande étudiant 1',
        description: 'Description.',
        priorite: 'NORMALE',
        documents: []
      });
      await demande1.save();

      const demande2 = new Demande({
        etudiant: {
          id: etudiant2Id,
          nom: 'Martin',
          prenom: 'Marie',
          email: 'marie.martin@test.com',
          matricule: 'TEST002'
        },
        typeDemande: {
          code: 'RELEVE_NOTES',
          nom: 'Relevé de notes',
          delaiTraitement: 5
        },
        statut: {
          code: 'SOUMIS',
          libelle: 'Soumis',
          couleur: '#6B7280'
        },
        objet: 'Demande étudiant 2',
        description: 'Description.',
        priorite: 'NORMALE',
        documents: []
      });
      await demande2.save();

      const demandesEtudiant1 = await Demande.find({ 'etudiant.id': etudiant1Id });
      expect(demandesEtudiant1).toHaveLength(1);
      expect(demandesEtudiant1[0].objet).toBe('Demande étudiant 1');
    });

    it('permet de filtrer par actif', async () => {
      const etudiantId = new Types.ObjectId();
      
      const demande1 = new Demande({
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
        objet: 'Demande active',
        description: 'Description.',
        priorite: 'NORMALE',
        documents: [],
        actif: true
      });
      await demande1.save();

      const demande2 = new Demande({
        etudiant: {
          id: etudiantId,
          nom: 'Doe',
          prenom: 'John',
          email: 'john.doe@test.com',
          matricule: 'TEST001'
        },
        typeDemande: {
          code: 'RELEVE_NOTES',
          nom: 'Relevé de notes',
          delaiTraitement: 5
        },
        statut: {
          code: 'SOUMIS',
          libelle: 'Soumis',
          couleur: '#6B7280'
        },
        objet: 'Demande inactive',
        description: 'Description.',
        priorite: 'NORMALE',
        documents: [],
        actif: false
      });
      await demande2.save();

      const demandesActives = await Demande.find({ actif: true });
      expect(demandesActives).toHaveLength(1);
      expect(demandesActives[0].objet).toBe('Demande active');
    });
  });
});
