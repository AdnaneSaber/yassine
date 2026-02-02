/**
 * Tests d'intégration pour /api/demandes
 * GET - Liste avec filtres et pagination
 * POST - Création de demande
 */

import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/demandes/route';
import { Demande, Etudiant } from '@/lib/db/models';
import { setupTestDB, teardownTestDB, clearCollections } from '@/__tests__/helpers/mongodb';
import { Types } from 'mongoose';

// Mock next-auth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn()
}));

import { getServerSession } from 'next-auth';

// Mock auth-options
vi.mock('@/lib/auth/auth-options', () => ({
  authOptions: {}
}));

describe('/api/demandes', () => {
  beforeAll(async () => await setupTestDB());
  afterAll(async () => await teardownTestDB());
  beforeEach(async () => await clearCollections());

  describe('GET', () => {
    it('retourne une liste vide quand aucune demande n\'existe', async () => {
      const req = new NextRequest('http://localhost:3000/api/demandes');
      const res = await GET(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(0);
      expect(data.pagination.total).toBe(0);
      expect(data.pagination.totalPages).toBe(0);
    });

    it('retourne la liste des demandes avec pagination', async () => {
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

      // Créer des demandes de test
      const demandesData = [
        {
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
          objet: 'Demande d\'attestation',
          description: 'Je souhaite obtenir une attestation de scolarité pour mes démarches administratives.',
          priorite: 'NORMALE',
          documents: [],
          actif: true
        },
        {
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
          objet: 'Demande de relevé de notes',
          description: 'Je souhaite obtenir un relevé de notes officiel.',
          priorite: 'HAUTE',
          documents: [],
          actif: true
        }
      ];

      for (const data of demandesData) {
        const demande = new Demande(data);
        await demande.save();
      }

      const req = new NextRequest('http://localhost:3000/api/demandes');
      const res = await GET(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(2);
      expect(data.pagination.total).toBe(2);
      expect(data.pagination.totalPages).toBe(1);
    });

    it('filtre les demandes par statut', async () => {
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

      // Créer les demandes séquentiellement pour éviter les conflits de numérotation
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
        objet: 'Demande 1',
        description: 'Description de la demande 1',
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
          code: 'EN_COURS',
          libelle: 'En cours',
          couleur: '#F59E0B'
        },
        objet: 'Demande 2',
        description: 'Description de la demande 2',
        priorite: 'HAUTE',
        documents: [],
        actif: true
      });
      await demande2.save();

      const req = new NextRequest('http://localhost:3000/api/demandes?statut=EN_COURS');
      const res = await GET(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(1);
      expect(data.data[0].statut.code).toBe('EN_COURS');
    });

    it('filtre les demandes par priorité', async () => {
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
        objet: 'Demande 1',
        description: 'Description de la demande 1',
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
        objet: 'Demande 2',
        description: 'Description de la demande 2',
        priorite: 'URGENTE',
        documents: [],
        actif: true
      });
      await demande2.save();

      const req = new NextRequest('http://localhost:3000/api/demandes?priorite=URGENTE');
      const res = await GET(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(1);
      expect(data.data[0].priorite).toBe('URGENTE');
    });

    it('filtre les demandes par type', async () => {
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
        objet: 'Demande 1',
        description: 'Description de la demande 1',
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
          code: 'CONVENTION_STAGE',
          nom: 'Convention de stage',
          delaiTraitement: 5
        },
        statut: {
          code: 'SOUMIS',
          libelle: 'Soumis',
          couleur: '#6B7280'
        },
        objet: 'Demande 2',
        description: 'Description de la demande 2',
        priorite: 'NORMALE',
        documents: [],
        actif: true
      });
      await demande2.save();

      const req = new NextRequest('http://localhost:3000/api/demandes?typeDemande=CONVENTION_STAGE');
      const res = await GET(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(1);
      expect(data.data[0].typeDemande.code).toBe('CONVENTION_STAGE');
    });

    it('recherche les demandes par texte', async () => {
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
        objet: 'Demande attestation scolarité',
        description: 'Description de la demande',
        priorite: 'NORMALE',
        documents: [],
        actif: true
      });
      await demande1.save();

      const demande2 = new Demande({
        etudiant: {
          id: etudiantId,
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
        objet: 'Demande relevé notes',
        description: 'Description de la demande',
        priorite: 'NORMALE',
        documents: [],
        actif: true
      });
      await demande2.save();

      const req = new NextRequest('http://localhost:3000/api/demandes?search=attestation');
      const res = await GET(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(1);
      expect(data.data[0].objet).toContain('attestation');
    });

    it('gère la pagination avec page et limit', async () => {
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

      // Créer 5 demandes
      for (let i = 1; i <= 5; i++) {
        await Demande.create({
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
          objet: `Demande ${i}`,
          description: `Description de la demande ${i}`,
          priorite: 'NORMALE',
          documents: [],
          actif: true
        });
      }

      const req = new NextRequest('http://localhost:3000/api/demandes?page=1&limit=2');
      const res = await GET(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(2);
      expect(data.pagination.page).toBe(1);
      expect(data.pagination.limit).toBe(2);
      expect(data.pagination.total).toBe(5);
      expect(data.pagination.totalPages).toBe(3);
    });

    it('retourne une erreur 400 pour une page invalide', async () => {
      const req = new NextRequest('http://localhost:3000/api/demandes?page=-1');
      const res = await GET(req);

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VAL_001');
    });

    it('retourne une erreur 400 pour une limite invalide', async () => {
      const req = new NextRequest('http://localhost:3000/api/demandes?limit=200');
      const res = await GET(req);

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VAL_001');
    });
  });

  describe('POST', () => {
    it('crée une demande avec succès pour un étudiant authentifié', async () => {
      // Créer un étudiant
      const etudiantId = new Types.ObjectId();
      const etudiant = await Etudiant.create({
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

      const body = {
        typeDemande: 'ATTESTATION_SCOLARITE',
        objet: 'Demande d\'attestation de scolarité',
        description: 'Je souhaite obtenir une attestation de scolarité pour mes démarches administratives.',
        priorite: 'NORMALE'
      };

      const req = new NextRequest('http://localhost:3000/api/demandes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const res = await POST(req);

      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      expect(data.data.objet).toBe(body.objet);
      expect(data.data.description).toBe(body.description);
      expect(data.data.etudiant.email).toBe('john.doe@test.com');
      expect(data.data.numeroDemande).toMatch(/^DEM-\d{4}-\d{6}$/);
    });

    it('retourne une erreur 401 si non authentifié', async () => {
      // Mock pas de session
      vi.mocked(getServerSession).mockResolvedValue(null);

      const body = {
        typeDemande: 'ATTESTATION_SCOLARITE',
        objet: 'Demande d\'attestation de scolarité',
        description: 'Je souhaite obtenir une attestation de scolarité.',
        priorite: 'NORMALE'
      };

      const req = new NextRequest('http://localhost:3000/api/demandes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const res = await POST(req);

      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('AUTH_001');
    });

    it('retourne une erreur 403 si l\'utilisateur n\'est pas un étudiant', async () => {
      // Mock session admin
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'admin123', email: 'admin@test.com', type: 'admin' }
      });

      const body = {
        typeDemande: 'ATTESTATION_SCOLARITE',
        objet: 'Demande d\'attestation de scolarité',
        description: 'Je souhaite obtenir une attestation de scolarité.',
        priorite: 'NORMALE'
      };

      const req = new NextRequest('http://localhost:3000/api/demandes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const res = await POST(req);

      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('AUTH_002');
    });

    it('retourne une erreur 404 si l\'étudiant n\'existe pas', async () => {
      const nonExistentId = new Types.ObjectId();

      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: nonExistentId.toString(), email: 'unknown@test.com', type: 'student' }
      });

      const body = {
        typeDemande: 'ATTESTATION_SCOLARITE',
        objet: 'Demande d\'attestation de scolarité',
        description: 'Je souhaite obtenir une attestation de scolarité.',
        priorite: 'NORMALE'
      };

      const req = new NextRequest('http://localhost:3000/api/demandes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const res = await POST(req);

      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('RES_001');
    });

    it('retourne une erreur 400 pour des données invalides', async () => {
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

      const body = {
        typeDemande: 'INVALID_TYPE',
        objet: 'A',
        description: 'Court',
        priorite: 'INVALID_PRIORITY'
      };

      const req = new NextRequest('http://localhost:3000/api/demandes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const res = await POST(req);

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VAL_001');
    });

    it('retourne une erreur 400 si objet et description sont identiques', async () => {
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

      const sameText = 'Ceci est un texte identique pour le test';
      const body = {
        typeDemande: 'ATTESTATION_SCOLARITE',
        objet: sameText,
        description: sameText,
        priorite: 'NORMALE'
      };

      const req = new NextRequest('http://localhost:3000/api/demandes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const res = await POST(req);

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VAL_001');
    });

    it('utilise la priorité NORMALE par défaut', async () => {
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

      const body = {
        typeDemande: 'ATTESTATION_SCOLARITE',
        objet: 'Demande d\'attestation de scolarité',
        description: 'Je souhaite obtenir une attestation de scolarité pour mes démarches administratives.'
      };

      const req = new NextRequest('http://localhost:3000/api/demandes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const res = await POST(req);

      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data.priorite).toBe('NORMALE');
    });

    it('accepte tous les types de demande valides', async () => {
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

      const typesValides = [
        'ATTESTATION_SCOLARITE',
        'RELEVE_NOTES',
        'ATTESTATION_REUSSITE',
        'DUPLICATA_CARTE',
        'CONVENTION_STAGE'
      ];

      for (const type of typesValides) {
        await clearCollections();
        
        // Recréer l'étudiant après chaque clear
        await Etudiant.create({
          _id: etudiantId,
          matricule: 'TEST001',
          nom: 'Doe',
          prenom: 'John',
          email: 'john.doe@test.com',
          hashPassword: 'hashedpassword123',
          actif: true
        });

        const typeNames: Record<string, string> = {
          'ATTESTATION_SCOLARITE': 'attestation scolarite',
          'RELEVE_NOTES': 'releve notes',
          'ATTESTATION_REUSSITE': 'attestation reussite',
          'DUPLICATA_CARTE': 'duplicata carte',
          'CONVENTION_STAGE': 'convention stage'
        };
        
        const body = {
          typeDemande: type,
          objet: `Demande ${typeNames[type]}`,
          description: `Description pour la demande de type ${typeNames[type]}. Cette description est assez longue pour passer la validation.`,
          priorite: 'NORMALE'
        };

        const req = new NextRequest('http://localhost:3000/api/demandes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });

        const res = await POST(req);

        expect(res.status).toBe(201);
        const data = await res.json();
        expect(data.success).toBe(true);
        expect(data.data.typeDemande.code).toBe(type);
      }
    });
  });
});
