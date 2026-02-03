/**
 * Tests d'intégration pour /api/admin/students
 * GET - Liste des étudiants avec pagination
 * POST - Création d'un étudiant
 */

import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/admin/students/route';
import { Etudiant } from '@/lib/db/models';
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

describe('/api/admin/students', () => {
  beforeAll(async () => await setupTestDB());
  afterAll(async () => await teardownTestDB());
  beforeEach(async () => await clearCollections());

  // Helper pour créer un étudiant de test
  async function createTestEtudiant(overrides = {}) {
    const etudiantData = {
      matricule: 'TEST001',
      nom: 'Doe',
      prenom: 'John',
      email: 'john.doe@test.com',
      hashPassword: 'hashedpassword123',
      dateNaissance: new Date('2000-01-15'),
      telephone: '0123456789',
      adresse: '123 Rue de Test',
      niveauEtude: 'L3',
      filiere: 'Informatique',
      actif: true,
      ...overrides
    };

    return await Etudiant.create(etudiantData);
  }

  describe('GET', () => {
    it('retourne une liste vide quand aucun étudiant n\'existe', async () => {
      // Mock session admin
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'admin123', email: 'admin@test.com', role: 'ADMIN' }
      });

      const req = new NextRequest('http://localhost:3000/api/admin/students');
      const res = await GET(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data.students).toHaveLength(0);
      expect(data.data.total).toBe(0);
    });

    it('retourne la liste des étudiants', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'admin123', email: 'admin@test.com', role: 'ADMIN' }
      });

      await createTestEtudiant();
      await createTestEtudiant({
        matricule: 'TEST002',
        nom: 'Martin',
        prenom: 'Marie',
        email: 'marie.martin@test.com'
      });

      const req = new NextRequest('http://localhost:3000/api/admin/students');
      const res = await GET(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data.students).toHaveLength(2);
      expect(data.data.total).toBe(2);
    });

    it('ne retourne pas le hashPassword', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'admin123', email: 'admin@test.com', role: 'ADMIN' }
      });

      await createTestEtudiant();

      const req = new NextRequest('http://localhost:3000/api/admin/students');
      const res = await GET(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.data.students[0].hashPassword).toBeUndefined();
    });

    it('gère la pagination', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'admin123', email: 'admin@test.com', role: 'ADMIN' }
      });

      // Créer 5 étudiants
      for (let i = 1; i <= 5; i++) {
        await createTestEtudiant({
          matricule: `TEST00${i}`,
          nom: `Nom${i}`,
          prenom: `Prenom${i}`,
          email: `etudiant${i}@test.com`
        });
      }

      const req = new NextRequest('http://localhost:3000/api/admin/students?page=1&limit=2');
      const res = await GET(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data.students).toHaveLength(2);
      expect(data.data.total).toBe(5);
      expect(data.data.page).toBe(1);
      expect(data.data.totalPages).toBe(3);
    });

    it('retourne uniquement les étudiants actifs', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'admin123', email: 'admin@test.com', role: 'ADMIN' }
      });

      await createTestEtudiant({ matricule: 'ACTIVE001', email: 'active@test.com' });
      await createTestEtudiant({
        matricule: 'INACTIVE001',
        email: 'inactive@test.com',
        actif: false
      });

      const req = new NextRequest('http://localhost:3000/api/admin/students');
      const res = await GET(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data.students).toHaveLength(1);
      expect(data.data.students[0].matricule).toBe('ACTIVE001');
    });

    it('retourne une erreur 401 si non authentifié', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const req = new NextRequest('http://localhost:3000/api/admin/students');
      const res = await GET(req);

      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unauthorized');
    });

    it('retourne une erreur 401 si l\'utilisateur n\'est pas admin', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'student123', email: 'student@test.com', role: 'STUDENT' }
      });

      const req = new NextRequest('http://localhost:3000/api/admin/students');
      const res = await GET(req);

      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unauthorized');
    });

    it('permet l\'accès aux SUPER_ADMIN', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'superadmin123', email: 'superadmin@test.com', role: 'SUPER_ADMIN' }
      });

      await createTestEtudiant();

      const req = new NextRequest('http://localhost:3000/api/admin/students');
      const res = await GET(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
    });

    it('trie les étudiants par nom et prénom', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'admin123', email: 'admin@test.com', role: 'ADMIN' }
      });

      await createTestEtudiant({
        matricule: 'Z001',
        nom: 'Zebra',
        prenom: 'Zack',
        email: 'zack@test.com'
      });
      await createTestEtudiant({
        matricule: 'A001',
        nom: 'Alpha',
        prenom: 'Alice',
        email: 'alice@test.com'
      });
      await createTestEtudiant({
        matricule: 'B001',
        nom: 'Beta',
        prenom: 'Bob',
        email: 'bob@test.com'
      });

      const req = new NextRequest('http://localhost:3000/api/admin/students');
      const res = await GET(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.data.students[0].nom).toBe('Alpha');
      expect(data.data.students[1].nom).toBe('Beta');
      expect(data.data.students[2].nom).toBe('Zebra');
    });
  });

  describe('POST', () => {
    it('crée un étudiant avec succès', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'admin123', email: 'admin@test.com', role: 'ADMIN' }
      });

      const body = {
        matricule: 'NEW001',
        nom: 'Nouveau',
        prenom: 'Etudiant',
        email: 'nouveau.etudiant@test.com',
        dateNaissance: '2000-05-15',
        telephone: '0123456789',
        adresse: '456 Avenue des Tests',
        niveauEtude: 'L1',
        filiere: 'Mathématiques'
      };

      const req = new NextRequest('http://localhost:3000/api/admin/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const res = await POST(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data.student.matricule).toBe(body.matricule);
      expect(data.data.student.nom).toBe(body.nom);
      expect(data.data.student.prenom).toBe(body.prenom);
      expect(data.data.student.email).toBe(body.email);
      expect(data.data.student.niveauEtude).toBe(body.niveauEtude);
      expect(data.data.student.filiere).toBe(body.filiere);
      expect(data.data.password).toBeDefined(); // Le mot de passe généré est retourné
    });

    it('retourne une erreur 401 si non authentifié', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const body = {
        matricule: 'NEW001',
        nom: 'Nouveau',
        prenom: 'Etudiant',
        email: 'nouveau.etudiant@test.com'
      };

      const req = new NextRequest('http://localhost:3000/api/admin/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const res = await POST(req);

      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unauthorized');
    });

    it('retourne une erreur 401 si l\'utilisateur n\'est pas admin', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'student123', email: 'student@test.com', role: 'STUDENT' }
      });

      const body = {
        matricule: 'NEW001',
        nom: 'Nouveau',
        prenom: 'Etudiant',
        email: 'nouveau.etudiant@test.com'
      };

      const req = new NextRequest('http://localhost:3000/api/admin/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const res = await POST(req);

      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.success).toBe(false);
    });

    it('retourne une erreur 400 si le matricule existe déjà', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'admin123', email: 'admin@test.com', role: 'ADMIN' }
      });

      await createTestEtudiant({ matricule: 'DUPLICATE001' });

      const body = {
        matricule: 'DUPLICATE001',
        nom: 'Autre',
        prenom: 'Etudiant',
        email: 'autre.email@test.com'
      };

      const req = new NextRequest('http://localhost:3000/api/admin/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const res = await POST(req);

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('matricule');
    });

    it('retourne une erreur 400 si l\'email existe déjà', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'admin123', email: 'admin@test.com', role: 'ADMIN' }
      });

      await createTestEtudiant({ email: 'duplicate@test.com' });

      const body = {
        matricule: 'NEW002',
        nom: 'Autre',
        prenom: 'Etudiant',
        email: 'duplicate@test.com'
      };

      const req = new NextRequest('http://localhost:3000/api/admin/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const res = await POST(req);

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('email');
    });

    it('retourne une erreur 400 pour des données invalides', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'admin123', email: 'admin@test.com', role: 'ADMIN' }
      });

      const body = {
        matricule: '', // vide
        nom: '', // vide
        prenom: '', // vide
        email: 'email-invalide' // email invalide
      };

      const req = new NextRequest('http://localhost:3000/api/admin/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const res = await POST(req);

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('Données invalides');
    });

    it('retourne une erreur 400 pour un niveau d\'étude invalide', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'admin123', email: 'admin@test.com', role: 'ADMIN' }
      });

      const body = {
        matricule: 'NEW001',
        nom: 'Nouveau',
        prenom: 'Etudiant',
        email: 'nouveau@test.com',
        niveauEtude: 'INVALID_LEVEL'
      };

      const req = new NextRequest('http://localhost:3000/api/admin/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const res = await POST(req);

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
    });

    it('crée un étudiant avec seulement les champs obligatoires', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'admin123', email: 'admin@test.com', role: 'ADMIN' }
      });

      const body = {
        matricule: 'MINIMAL001',
        nom: 'Minimal',
        prenom: 'Etudiant',
        email: 'minimal@test.com'
      };

      const req = new NextRequest('http://localhost:3000/api/admin/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const res = await POST(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data.student.matricule).toBe(body.matricule);
    });

    it('accepte tous les niveaux d\'étude valides', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'admin123', email: 'admin@test.com', role: 'ADMIN' }
      });

      const niveaux = ['L1', 'L2', 'L3', 'M1', 'M2', 'Doctorat'];

      for (let i = 0; i < niveaux.length; i++) {
        const body = {
          matricule: `NIVEAU00${i}`,
          nom: 'Test',
          prenom: 'Niveau',
          email: `niveau${i}@test.com`,
          niveauEtude: niveaux[i]
        };

        const req = new NextRequest('http://localhost:3000/api/admin/students', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });

        const res = await POST(req);

        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.success).toBe(true);
        expect(data.data.student.niveauEtude).toBe(niveaux[i]);
      }
    });

    it('convertit la date de naissance en objet Date', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'admin123', email: 'admin@test.com', role: 'ADMIN' }
      });

      const body = {
        matricule: 'DATE001',
        nom: 'Date',
        prenom: 'Test',
        email: 'date@test.com',
        dateNaissance: '1995-12-25'
      };

      const req = new NextRequest('http://localhost:3000/api/admin/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const res = await POST(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);

      // Vérifier en base que la date est bien un objet Date
      const etudiant = await Etudiant.findById(data.data.student._id);
      expect(etudiant?.dateNaissance).toBeInstanceOf(Date);
    });
  });
});
