/**
 * Tests d'intégration pour /api/demandes/[id]
 * GET - Détails d'une demande
 * PATCH - Mise à jour d'une demande
 * DELETE - Suppression douce (soft delete)
 */

import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, PATCH, DELETE } from '@/app/api/demandes/[id]/route';
import { Demande, Etudiant } from '@/lib/db/models';
import { setupTestDB, teardownTestDB, clearCollections } from '@/__tests__/helpers/mongodb';
import { Types } from 'mongoose';

describe('/api/demandes/[id]', () => {
  beforeAll(async () => await setupTestDB());
  afterAll(async () => await teardownTestDB());
  beforeEach(async () => await clearCollections());

  // Helper pour créer une demande de test
  async function createTestDemande(overrides = {}) {
    const etudiantId = new Types.ObjectId();
    
    // Créer l'étudiant s'il n'existe pas
    const existingEtudiant = await Etudiant.findById(etudiantId);
    if (!existingEtudiant) {
      await Etudiant.create({
        _id: etudiantId,
        matricule: 'TEST001',
        nom: 'Doe',
        prenom: 'John',
        email: 'john.doe@test.com',
        hashPassword: 'hashedpassword123',
        actif: true
      });
    }

    const demandeData = {
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
      objet: 'Demande de test',
      description: 'Description de la demande de test. Cette description est assez longue.',
      priorite: 'NORMALE',
      documents: [],
      actif: true,
      ...overrides
    };

    const demande = new Demande(demandeData);
    await demande.save();
    return demande;
  }

  describe('GET', () => {
    it('retourne les détails d\'une demande existante', async () => {
      const demande = await createTestDemande();

      const req = new NextRequest(`http://localhost:3000/api/demandes/${demande._id}`);
      const res = await GET(req, { params: Promise.resolve({ id: demande._id.toString() }) });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data._id.toString()).toBe(demande._id.toString());
      expect(data.data.objet).toBe(demande.objet);
      expect(data.data.description).toBe(demande.description);
    });

    it('retourne une erreur 404 pour une demande inexistante', async () => {
      const nonExistentId = new Types.ObjectId();

      const req = new NextRequest(`http://localhost:3000/api/demandes/${nonExistentId}`);
      const res = await GET(req, { params: Promise.resolve({ id: nonExistentId.toString() }) });

      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('RES_001');
      expect(data.error.message).toBe('Demande non trouvée');
    });

    it('retourne une erreur 400 pour un ID invalide', async () => {
      const req = new NextRequest('http://localhost:3000/api/demandes/invalid-id');
      const res = await GET(req, { params: Promise.resolve({ id: 'invalid-id' }) });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VAL_001');
    });

    it('retourne une demande avec tous ses champs', async () => {
      const demande = await createTestDemande({
        objet: 'Demande complète',
        description: 'Description complète de la demande avec beaucoup de détails.',
        priorite: 'HAUTE',
        commentaireAdmin: 'Commentaire administrateur',
        documents: [
          {
            id: 'doc-1',
            nomFichier: 'document.pdf',
            nomOriginal: 'mon-document.pdf',
            url: '/uploads/document.pdf',
            typeMime: 'application/pdf',
            taille: 1024,
            categorie: 'Justificatif',
            dateUpload: new Date()
          }
        ]
      });

      const req = new NextRequest(`http://localhost:3000/api/demandes/${demande._id}`);
      const res = await GET(req, { params: Promise.resolve({ id: demande._id.toString() }) });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data.objet).toBe('Demande complète');
      expect(data.data.priorite).toBe('HAUTE');
      expect(data.data.commentaireAdmin).toBe('Commentaire administrateur');
      expect(data.data.documents).toHaveLength(1);
      expect(data.data.documents[0].nomFichier).toBe('document.pdf');
    });
  });

  describe('PATCH', () => {
    it('met à jour une demande avec succès', async () => {
      const demande = await createTestDemande();

      const updates = {
        objet: 'Demande mise à jour',
        description: 'Nouvelle description de la demande. Cette description est assez longue pour être valide.',
        priorite: 'HAUTE'
      };

      const req = new NextRequest(`http://localhost:3000/api/demandes/${demande._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      const res = await PATCH(req, { params: Promise.resolve({ id: demande._id.toString() }) });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data.objet).toBe(updates.objet);
      expect(data.data.description).toBe(updates.description);
      expect(data.data.priorite).toBe('HAUTE');
    });

    it('met à jour partiellement une demande', async () => {
      const demande = await createTestDemande();

      const updates = {
        priorite: 'URGENTE'
      };

      const req = new NextRequest(`http://localhost:3000/api/demandes/${demande._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      const res = await PATCH(req, { params: Promise.resolve({ id: demande._id.toString() }) });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data.priorite).toBe('URGENTE');
      // Les autres champs ne doivent pas être modifiés
      expect(data.data.objet).toBe(demande.objet);
      expect(data.data.description).toBe(demande.description);
    });

    it('retourne une erreur 404 pour une demande inexistante', async () => {
      const nonExistentId = new Types.ObjectId();

      const req = new NextRequest(`http://localhost:3000/api/demandes/${nonExistentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priorite: 'HAUTE' })
      });

      const res = await PATCH(req, { params: Promise.resolve({ id: nonExistentId.toString() }) });

      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('RES_001');
    });

    it('retourne une erreur 400 pour des données invalides', async () => {
      const demande = await createTestDemande();

      const updates = {
        objet: 'A',
        typeDemande: 'INVALID_TYPE'
      };

      const req = new NextRequest(`http://localhost:3000/api/demandes/${demande._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      const res = await PATCH(req, { params: Promise.resolve({ id: demande._id.toString() }) });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VAL_001');
    });

    it('retourne une erreur 400 pour un ID invalide', async () => {
      const req = new NextRequest('http://localhost:3000/api/demandes/invalid-id', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priorite: 'HAUTE' })
      });

      const res = await PATCH(req, { params: Promise.resolve({ id: 'invalid-id' }) });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
    });

    it('permet de changer le type de demande', async () => {
      const demande = await createTestDemande();

      // The API expects typeDemande as a string (enum value)
      // and converts it to an object internally
      const updates = {
        typeDemande: 'CONVENTION_STAGE'
      };

      const req = new NextRequest(`http://localhost:3000/api/demandes/${demande._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      const res = await PATCH(req, { params: Promise.resolve({ id: demande._id.toString() }) });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data.typeDemande.code).toBe('CONVENTION_STAGE');
    });
  });

  describe('DELETE', () => {
    it('supprime une demande (soft delete) avec succès', async () => {
      const demande = await createTestDemande();

      const req = new NextRequest(`http://localhost:3000/api/demandes/${demande._id}`, {
        method: 'DELETE'
      });

      const res = await DELETE(req, { params: Promise.resolve({ id: demande._id.toString() }) });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data).toBeNull();

      // Vérifier que la demande est marquée comme inactive
      const updatedDemande = await Demande.findById(demande._id);
      expect(updatedDemande?.actif).toBe(false);
    });

    it('retourne une erreur 404 pour une demande inexistante', async () => {
      const nonExistentId = new Types.ObjectId();

      const req = new NextRequest(`http://localhost:3000/api/demandes/${nonExistentId}`, {
        method: 'DELETE'
      });

      const res = await DELETE(req, { params: Promise.resolve({ id: nonExistentId.toString() }) });

      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('RES_001');
    });

    it('retourne une erreur 400 pour un ID invalide', async () => {
      const req = new NextRequest('http://localhost:3000/api/demandes/invalid-id', {
        method: 'DELETE'
      });

      const res = await DELETE(req, { params: Promise.resolve({ id: 'invalid-id' }) });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
    });

    it('peut supprimer une demande déjà inactive', async () => {
      const demande = await createTestDemande({ actif: false });

      const req = new NextRequest(`http://localhost:3000/api/demandes/${demande._id}`, {
        method: 'DELETE'
      });

      const res = await DELETE(req, { params: Promise.resolve({ id: demande._id.toString() }) });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
    });
  });
});
