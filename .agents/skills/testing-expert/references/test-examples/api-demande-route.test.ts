/**
 * Exemple de test d'API pour /api/demandes
 * À copier/modifier dans: __tests__/integration/api/demandes/route.test.ts
 */

import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/demandes/route';
import { getServerSession } from 'next-auth';
import { Demande } from '@/lib/db/models';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

// Mocks
vi.mock('next-auth');

// DB en mémoire
let mongod: MongoMemoryServer;

describe('/api/demandes', () => {
  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
  });

  beforeEach(async () => {
    await Demande.deleteMany({});
    vi.clearAllMocks();
  });

  describe('GET', () => {
    it('retourne 401 si non authentifié', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const req = new NextRequest('http://localhost:3000/api/demandes');
      const res = await GET(req);

      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error.code).toBe('AUTH_001');
    });

    it('retourne les demandes de l\'étudiant', async () => {
      // Mock session étudiant
      vi.mocked(getServerSession).mockResolvedValue({
        user: {
          id: 'student123',
          email: 'student@test.com',
          name: 'Student',
          role: 'STUDENT',
        },
      });

      // Créer des demandes de test
      await Demande.create([
        {
          numeroDemande: 'DEM-2026-000001',
          objet: 'Demande 1',
          description: 'Description 1',
          etudiant: { id: 'student123', email: 'student@test.com', nom: 'Student' },
          typeDemande: { code: 'ATTESTATION', libelle: 'Attestation', delaiStandard: 3 },
          statut: { code: 'SOUMIS', libelle: 'Soumis', couleur: '#6B7280' },
          priorite: 'NORMALE',
        },
        {
          numeroDemande: 'DEM-2026-000002',
          objet: 'Demande 2',
          description: 'Description 2',
          etudiant: { id: 'other123', email: 'other@test.com', nom: 'Other' },
          typeDemande: { code: 'RELEVE_NOTES', libelle: 'Relevé', delaiStandard: 5 },
          statut: { code: 'SOUMIS', libelle: 'Soumis', couleur: '#6B7280' },
          priorite: 'NORMALE',
        },
      ]);

      const req = new NextRequest('http://localhost:3000/api/demandes');
      const res = await GET(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(1); // Seulement celle de student123
      expect(data.data[0].objet).toBe('Demande 1');
    });

    it('admin voit toutes les demandes', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: {
          id: 'admin123',
          email: 'admin@test.com',
          name: 'Admin',
          role: 'ADMIN',
        },
      });

      // Créer plusieurs demandes
      await Demande.create([
        {
          numeroDemande: 'DEM-2026-000003',
          objet: 'Demande A',
          description: 'Description A',
          etudiant: { id: 'user1', email: 'user1@test.com', nom: 'User 1' },
          typeDemande: { code: 'ATTESTATION', libelle: 'Attestation', delaiStandard: 3 },
          statut: { code: 'SOUMIS', libelle: 'Soumis', couleur: '#6B7280' },
          priorite: 'NORMALE',
        },
        {
          numeroDemande: 'DEM-2026-000004',
          objet: 'Demande B',
          description: 'Description B',
          etudiant: { id: 'user2', email: 'user2@test.com', nom: 'User 2' },
          typeDemande: { code: 'RELEVE_NOTES', libelle: 'Relevé', delaiStandard: 5 },
          statut: { code: 'EN_COURS', libelle: 'En cours', couleur: '#F59E0B' },
          priorite: 'HAUTE',
        },
      ]);

      const req = new NextRequest('http://localhost:3000/api/demandes');
      const res = await GET(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.data).toHaveLength(2);
    });
  });

  describe('POST', () => {
    beforeEach(() => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: {
          id: 'student123',
          email: 'student@test.com',
          name: 'Student User',
          role: 'STUDENT',
        },
      });
    });

    it('crée une demande avec succès', async () => {
      const body = {
        typeDemande: 'ATTESTATION',
        objet: 'Demande de test',
        description: 'Description détaillée de la demande de test',
        priorite: 'NORMALE',
      };

      const req = new NextRequest('http://localhost:3000/api/demandes', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      const res = await POST(req);

      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data.numeroDemande).toMatch(/^DEM-\d{4}-\d{6}$/);
      expect(data.data.objet).toBe('Demande de test');
    });

    it('retourne 400 pour données invalides', async () => {
      const body = {
        typeDemande: 'INVALID_TYPE',
        objet: 'Test',
        description: 'Court',
      };

      const req = new NextRequest('http://localhost:3000/api/demandes', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      const res = await POST(req);

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VAL_001');
    });

    it('retourne 401 si non authentifié', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const req = new NextRequest('http://localhost:3000/api/demandes', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const res = await POST(req);

      expect(res.status).toBe(401);
    });
  });
});
