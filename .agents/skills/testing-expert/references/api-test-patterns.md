# Patterns de Tests API

Guide pour tester les Route Handlers Next.js (App Router).

## Table des matières

1. [Setup de base](#setup-de-base)
2. [Tests GET](#tests-get)
3. [Tests POST](#tests-post)
4. [Tests avec authentification](#tests-avec-authentification)
5. [Tests avec MongoDB](#tests-avec-mongodb)

---

## Setup de base

```typescript
// __tests__/helpers/api-test-helper.ts
import { createMocks, RequestMethod } from 'node-mocks-http';
import { NextRequest, NextResponse } from 'next/server';

export function createMockRequest(
  method: RequestMethod,
  options: {
    body?: Record<string, unknown>;
    query?: Record<string, string>;
    headers?: Record<string, string>;
  } = {}
): NextRequest {
  const { req } = createMocks({
    method,
    body: options.body,
    query: options.query,
    headers: {
      'content-type': 'application/json',
      ...options.headers,
    },
  });

  return req as unknown as NextRequest;
}

export function parseResponse(response: NextResponse) {
  return {
    status: response.status,
    data: JSON.parse(JSON.stringify(response.body)),
    headers: Object.fromEntries(response.headers.entries()),
  };
}
```

---

## Tests GET

```typescript
// __tests__/integration/api/demandes/get.test.ts
import { GET } from '@/app/api/demandes/route';
import { createMockRequest, parseResponse } from '@/tests/helpers/api-test-helper';
import { getServerSession } from 'next-auth';
import { Demande } from '@/lib/db/models';
import { setupTestDB, teardownTestDB } from '@/tests/helpers/mongodb';

vi.mock('next-auth');
vi.mock('@/lib/db/models');

describe('GET /api/demandes', () => {
  beforeAll(async () => await setupTestDB());
  afterAll(async () => await teardownTestDB());

  it('retourne les demandes de l\'utilisateur', async () => {
    // Mock session
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user123', role: 'STUDENT', email: 'test@test.com' }
    });

    // Mock DB
    const mockDemandes = [
      { _id: '1', objet: 'Demande 1', statut: 'SOUMIS' },
      { _id: '2', objet: 'Demande 2', statut: 'EN_COURS' },
    ];
    vi.mocked(Demande.find).mockReturnValue({
      sort: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockDemandes),
      }),
    } as any);

    const req = createMockRequest('GET');
    const response = await GET(req);
    const { status, data } = parseResponse(response);

    expect(status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveLength(2);
  });

  it('retourne 401 si non authentifié', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);

    const req = createMockRequest('GET');
    const response = await GET(req);

    expect(response.status).toBe(401);
  });

  it('admin voit toutes les demandes', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'admin123', role: 'ADMIN', email: 'admin@test.com' }
    });

    const mockDemandes = [
      { _id: '1', objet: 'Demande user1' },
      { _id: '2', objet: 'Demande user2' },
    ];
    vi.mocked(Demande.find).mockReturnValue({
      sort: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockDemandes),
      }),
    } as any);

    const req = createMockRequest('GET');
    const response = await GET(req);
    const { data } = parseResponse(response);

    // Admin ne filtre pas par userId
    expect(Demande.find).toHaveBeenCalledWith({});
    expect(data.data).toHaveLength(2);
  });
});
```

---

## Tests POST

```typescript
// __tests__/integration/api/demandes/post.test.ts
import { POST } from '@/app/api/demandes/route';
import { createMockRequest, parseResponse } from '@/tests/helpers/api-test-helper';
import { getServerSession } from 'next-auth';
import { Demande } from '@/lib/db/models';

vi.mock('next-auth');
vi.mock('@/lib/db/models');

describe('POST /api/demandes', () => {
  const validDemande = {
    typeDemande: 'ATTESTATION',
    objet: 'Demande de test',
    description: 'Description détaillée suffisamment longue',
    priorite: 'NORMALE',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getServerSession).mockResolvedValue({
      user: { 
        id: 'user123', 
        role: 'STUDENT', 
        email: 'test@test.com',
        name: 'Test User'
      }
    });
  });

  it('crée une demande avec succès', async () => {
    const mockSave = vi.fn().mockResolvedValue({
      _id: 'demande123',
      numeroDemande: 'DEM-2026-000001',
      ...validDemande,
    });

    vi.mocked(Demande).mockImplementation(() => ({
      save: mockSave,
    } as any));

    const req = createMockRequest('POST', { body: validDemande });
    const response = await POST(req);
    const { status, data } = parseResponse(response);

    expect(status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data.numeroDemande).toMatch(/^DEM-\d{4}-\d{6}$/);
  });

  it('retourne 400 pour données invalides', async () => {
    const invalidData = {
      typeDemande: 'INVALID_TYPE',
      objet: 'Test',
      description: 'Court',
    };

    const req = createMockRequest('POST', { body: invalidData });
    const response = await POST(req);

    expect(response.status).toBe(400);
  });

  it('génère automatiquement le numeroDemande', async () => {
    const mockSave = vi.fn().mockResolvedValue({});
    vi.mocked(Demande).mockImplementation(() => ({
      save: mockSave,
    } as any));

    const req = createMockRequest('POST', { body: validDemande });
    await POST(req);

    // Vérifie que Demande est instancié avec le bon constructeur
    expect(Demande).toHaveBeenCalledWith(
      expect.objectContaining({
        numeroDemande: expect.stringMatching(/^DEM-\d{4}-\d{6}$/),
      })
    );
  });
});
```

---

## Tests avec authentification

```typescript
// __tests__/helpers/auth-helper.ts
import { getServerSession } from 'next-auth';

export function mockStudentSession(userId = 'student123') {
  vi.mocked(getServerSession).mockResolvedValue({
    user: {
      id: userId,
      email: 'student@test.com',
      name: 'Student User',
      role: 'STUDENT',
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  });
}

export function mockAdminSession(userId = 'admin123') {
  vi.mocked(getServerSession).mockResolvedValue({
    user: {
      id: userId,
      email: 'admin@test.com',
      name: 'Admin User',
      role: 'ADMIN',
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  });
}

export function mockNoSession() {
  vi.mocked(getServerSession).mockResolvedValue(null);
}
```

Utilisation:

```typescript
import { mockStudentSession, mockAdminSession, mockNoSession } from '@/tests/helpers/auth-helper';

describe('Permissions', () => {
  it('student ne peut pas supprimer', async () => {
    mockStudentSession();
    
    const req = createMockRequest('DELETE', { query: { id: '123' } });
    const response = await DELETE(req, { params: { id: '123' } });
    
    expect(response.status).toBe(403);
  });

  it('admin peut supprimer', async () => {
    mockAdminSession();
    
    const req = createMockRequest('DELETE', { query: { id: '123' } });
    const response = await DELETE(req, { params: { id: '123' } });
    
    expect(response.status).toBe(200);
  });
});
```

---

## Tests avec MongoDB

```typescript
// __tests__/integration/api/demandes/with-db.test.ts
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { GET, POST } from '@/app/api/demandes/route';
import { Demande } from '@/lib/db/models';

let mongod: MongoMemoryServer;

describe('API /demandes avec DB réelle', () => {
  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
  });

  afterEach(async () => {
    await Demande.deleteMany({});
  });

  it('crée et récupère une demande', async () => {
    // Créer
    const demande = new Demande({
      numeroDemande: 'DEM-2026-000001',
      objet: 'Test DB',
      description: 'Description de test suffisamment longue',
      typeDemande: { code: 'ATTESTATION', libelle: 'Attestation', delaiStandard: 3 },
      statut: { code: 'SOUMIS', libelle: 'Soumis', couleur: '#6B7280' },
      etudiant: { id: 'user123', email: 'test@test.com', nom: 'Test' },
      priorite: 'NORMALE',
    });
    await demande.save();

    // Récupérer
    const found = await Demande.findOne({ numeroDemande: 'DEM-2026-000001' });
    
    expect(found).toBeTruthy();
    expect(found?.objet).toBe('Test DB');
  });
});
```

---

## Tests des routes dynamiques

```typescript
// __tests__/integration/api/demandes/[id]/get.test.ts
import { GET } from '@/app/api/demandes/[id]/route';

describe('GET /api/demandes/[id]', () => {
  it('retourne une demande par ID', async () => {
    const mockDemande = {
      _id: 'demande123',
      numeroDemande: 'DEM-2026-000001',
      objet: 'Test',
    };

    vi.mocked(Demande.findById).mockResolvedValue(mockDemande);

    const req = createMockRequest('GET');
    const response = await GET(req, { params: { id: 'demande123' } });
    const { data } = parseResponse(response);

    expect(data.data._id).toBe('demande123');
  });

  it('retourne 404 si demande non trouvée', async () => {
    vi.mocked(Demande.findById).mockResolvedValue(null);

    const req = createMockRequest('GET');
    const response = await GET(req, { params: { id: 'inconnu' } });

    expect(response.status).toBe(404);
  });
});
```

---

## Bonnes pratiques API

1. **Isoler chaque test**: Mockez et nettoyez entre chaque test
2. **Tester les cas d'erreur**: 400, 401, 403, 404, 500
3. **Valider les formats de réponse**: Structure JSON cohérente
4. **Tester les permissions**: STUDENT vs ADMIN
5. **Utiliser DB en mémoire** pour les tests d'intégration réels
