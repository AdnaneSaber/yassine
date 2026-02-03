/**
 * Tests d'intégration pour /api/demandes/[id]/transition
 * POST - Changement de statut d'une demande
 */

import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/demandes/[id]/transition/route';
import { Demande, Etudiant, Historique } from '@/lib/db/models';
import { setupTestDB, teardownTestDB, clearCollections } from '@/__tests__/helpers/mongodb';
import { Types } from 'mongoose';

describe('/api/demandes/[id]/transition', () => {
  beforeAll(async () => await setupTestDB());
  afterAll(async () => await teardownTestDB());
  beforeEach(async () => await clearCollections());

  // Helper pour créer une demande de test
  async function createTestDemande(statutCode = 'SOUMIS', overrides = {}) {
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

    const statutsMeta: Record<string, { libelle: string; couleur: string; estFinal: boolean }> = {
      SOUMIS: { libelle: 'Soumis', couleur: '#6B7280', estFinal: false },
      RECU: { libelle: 'Reçu', couleur: '#3B82F6', estFinal: false },
      EN_COURS: { libelle: 'En cours', couleur: '#F59E0B', estFinal: false },
      ATTENTE_INFO: { libelle: 'En attente d\'information', couleur: '#F59E0B', estFinal: false },
      VALIDE: { libelle: 'Validé', couleur: '#10B981', estFinal: false },
      REJETE: { libelle: 'Rejeté', couleur: '#EF4444', estFinal: true },
      TRAITE: { libelle: 'Traité', couleur: '#059669', estFinal: true },
      ARCHIVE: { libelle: 'Archivé', couleur: '#6B7280', estFinal: true }
    };

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
        code: statutCode,
        ...statutsMeta[statutCode]
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

  describe('POST', () => {
    it('transitionne une demande de SOUMIS à RECU', async () => {
      const demande = await createTestDemande('SOUMIS');

      const body = {
        newStatut: 'RECU',
        commentaire: 'Demande bien reçue et enregistrée.'
      };

      const req = new NextRequest(`http://localhost:3000/api/demandes/${demande._id}/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const res = await POST(req, { params: Promise.resolve({ id: demande._id.toString() }) });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data.statut.code).toBe('RECU');
      expect(data.data.statut.libelle).toBe('Reçu');
    });

    it('transitionne une demande de RECU à EN_COURS', async () => {
      const demande = await createTestDemande('RECU');

      const body = {
        newStatut: 'EN_COURS',
        commentaire: 'Traitement de la demande commencé.'
      };

      const req = new NextRequest(`http://localhost:3000/api/demandes/${demande._id}/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const res = await POST(req, { params: Promise.resolve({ id: demande._id.toString() }) });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data.statut.code).toBe('EN_COURS');
    });

    it('transitionne une demande de EN_COURS à VALIDE', async () => {
      const demande = await createTestDemande('EN_COURS');

      const body = {
        newStatut: 'VALIDE',
        commentaire: 'Demande validée après vérification.'
      };

      const req = new NextRequest(`http://localhost:3000/api/demandes/${demande._id}/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const res = await POST(req, { params: Promise.resolve({ id: demande._id.toString() }) });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data.statut.code).toBe('VALIDE');
    });

    it('transitionne une demande de EN_COURS à REJETE avec motif', async () => {
      const demande = await createTestDemande('EN_COURS');

      const body = {
        newStatut: 'REJETE',
        motifRefus: 'Les documents fournis sont incomplets. Veuillez soumettre une copie de votre carte d\'identité.',
        commentaire: 'Demande rejetée suite à vérification des documents.'
      };

      const req = new NextRequest(`http://localhost:3000/api/demandes/${demande._id}/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const res = await POST(req, { params: Promise.resolve({ id: demande._id.toString() }) });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data.statut.code).toBe('REJETE');
      expect(data.data.motifRefus).toBe(body.motifRefus);
    });

    it('transitionne une demande de EN_COURS à ATTENTE_INFO', async () => {
      const demande = await createTestDemande('EN_COURS');

      const body = {
        newStatut: 'ATTENTE_INFO',
        commentaire: 'En attente de documents complémentaires pour poursuivre le traitement.'
      };

      const req = new NextRequest(`http://localhost:3000/api/demandes/${demande._id}/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const res = await POST(req, { params: Promise.resolve({ id: demande._id.toString() }) });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data.statut.code).toBe('ATTENTE_INFO');
    });

    it('transitionne une demande de VALIDE à TRAITE', async () => {
      const demande = await createTestDemande('VALIDE');

      const body = {
        newStatut: 'TRAITE',
        commentaire: 'Document généré et envoyé à l\'étudiant.'
      };

      const req = new NextRequest(`http://localhost:3000/api/demandes/${demande._id}/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const res = await POST(req, { params: Promise.resolve({ id: demande._id.toString() }) });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data.statut.code).toBe('TRAITE');
    });

    it('retourne une erreur 404 pour une demande inexistante', async () => {
      const nonExistentId = new Types.ObjectId();

      const body = {
        newStatut: 'EN_COURS',
        commentaire: 'Tentative de transition.'
      };

      const req = new NextRequest(`http://localhost:3000/api/demandes/${nonExistentId}/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const res = await POST(req, { params: Promise.resolve({ id: nonExistentId.toString() }) });

      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('RES_001');
    });

    it('retourne une erreur 422 pour une transition invalide', async () => {
      // Impossible de passer directement de SOUMIS à VALIDE
      const demande = await createTestDemande('SOUMIS');

      const body = {
        newStatut: 'VALIDE',
        commentaire: 'Tentative de transition invalide.'
      };

      const req = new NextRequest(`http://localhost:3000/api/demandes/${demande._id}/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const res = await POST(req, { params: Promise.resolve({ id: demande._id.toString() }) });

      // Workflow errors return 422
      expect(res.status).toBe(422);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('WF_001');
    });

    it('retourne une erreur 400 si motifRefus manquant pour REJETE', async () => {
      const demande = await createTestDemande('EN_COURS');

      const body = {
        newStatut: 'REJETE',
        commentaire: 'Demande rejetée.'
        // motifRefus manquant
      };

      const req = new NextRequest(`http://localhost:3000/api/demandes/${demande._id}/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const res = await POST(req, { params: Promise.resolve({ id: demande._id.toString() }) });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VAL_001');
    });

    it('retourne une erreur 400 pour un ID invalide', async () => {
      const body = {
        newStatut: 'EN_COURS',
        commentaire: 'Tentative de transition.'
      };

      const req = new NextRequest('http://localhost:3000/api/demandes/invalid-id/transition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const res = await POST(req, { params: Promise.resolve({ id: 'invalid-id' }) });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
    });

    it('retourne une erreur 400 pour un statut invalide', async () => {
      const demande = await createTestDemande('EN_COURS');

      const body = {
        newStatut: 'INVALID_STATUS',
        commentaire: 'Tentative avec statut invalide.'
      };

      const req = new NextRequest(`http://localhost:3000/api/demandes/${demande._id}/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const res = await POST(req, { params: Promise.resolve({ id: demande._id.toString() }) });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VAL_001');
    });

    it('accepte traiteParId dans la requête', async () => {
      const demande = await createTestDemande('EN_COURS');
      const adminId = new Types.ObjectId();

      const body = {
        newStatut: 'VALIDE',
        commentaire: 'Demande validée par l\'administrateur.',
        traiteParId: adminId.toString()
      };

      const req = new NextRequest(`http://localhost:3000/api/demandes/${demande._id}/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const res = await POST(req, { params: Promise.resolve({ id: demande._id.toString() }) });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
    });

    it('crée un historique lors de la transition', async () => {
      const demande = await createTestDemande('SOUMIS');

      const body = {
        newStatut: 'RECU',
        commentaire: 'Demande enregistrée dans le système.'
      };

      const req = new NextRequest(`http://localhost:3000/api/demandes/${demande._id}/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      await POST(req, { params: Promise.resolve({ id: demande._id.toString() }) });

      // Vérifier que l'historique a été créé
      const historiques = await Historique.find({ demandeId: demande._id });
      expect(historiques.length).toBeGreaterThan(0);
      expect(historiques[0].statutNouveau.code).toBe('RECU');
    });

    it('empêche une transition depuis un état final', async () => {
      const demande = await createTestDemande('REJETE');

      const body = {
        newStatut: 'VALIDE',
        commentaire: 'Tentative de transition depuis état final.'
      };

      const req = new NextRequest(`http://localhost:3000/api/demandes/${demande._id}/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const res = await POST(req, { params: Promise.resolve({ id: demande._id.toString() }) });

      // Workflow errors return 422 (Unprocessable Entity)
      expect(res.status).toBe(422);
      const data = await res.json();
      expect(data.success).toBe(false);
    });
  });
});
