/**
 * Helper pour les tests avec MongoDB en mémoire
 * À copier dans votre projet: tests/helpers/mongodb.ts
 */

import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongod: MongoMemoryServer | null = null;

/**
 * Démarre MongoDB en mémoire et connecte Mongoose
 */
export async function setupTestDB(): Promise<void> {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  
  await mongoose.connect(uri, {
    maxPoolSize: 10,
  });
}

/**
 * Ferme la connexion et arrête MongoDB en mémoire
 */
export async function teardownTestDB(): Promise<void> {
  await mongoose.disconnect();
  if (mongod) {
    await mongod.stop();
    mongod = null;
  }
}

/**
 * Nettoie toutes les collections (à utiliser dans afterEach)
 */
export async function clearCollections(): Promise<void> {
  if (mongoose.connection.readyState !== 1) {
    return;
  }

  const collections = mongoose.connection.collections;
  
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
}

/**
 * Helper pour créer des documents de test
 */
export async function createTestDocument<T>(
  model: mongoose.Model<T>,
  data: Partial<T>
): Promise<T> {
  const doc = new model(data);
  return doc.save() as Promise<T>;
}

/**
 * Helper pour créer plusieurs documents
 */
export async function createTestDocuments<T>(
  model: mongoose.Model<T>,
  dataArray: Partial<T>[]
): Promise<T[]> {
  return Promise.all(dataArray.map(data => createTestDocument(model, data)));
}

/**
 * Configuration Jest/Vitest pour MongoDB
 * 
 * Dans votre setup.ts:
 * 
 * import { setupTestDB, teardownTestDB, clearCollections } from './helpers/mongodb';
 * 
 * beforeAll(async () => await setupTestDB());
 * afterAll(async () => await teardownTestDB());
 * afterEach(async () => await clearCollections());
 */

// Exemple d'utilisation avec Vitest
/*
// tests/setup.ts
import { setupTestDB, teardownTestDB, clearCollections } from './helpers/mongodb';

beforeAll(async () => {
  await setupTestDB();
}, 30000);

afterAll(async () => {
  await teardownTestDB();
}, 30000);

afterEach(async () => {
  await clearCollections();
});

// vitest.config.ts
export default defineConfig({
  test: {
    setupFiles: ['./tests/setup.ts'],
    // ...
  },
});
*/

// Exemple d'utilisation dans un test
/*
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { Demande } from '@/lib/db/models';
import { setupTestDB, teardownTestDB, clearCollections } from '@/tests/helpers/mongodb';

describe('Demande Model', () => {
  beforeAll(async () => await setupTestDB());
  afterAll(async () => await teardownTestDB());
  afterEach(async () => await clearCollections());

  it('crée une demande', async () => {
    const demande = new Demande({
      numeroDemande: 'DEM-2026-000001',
      objet: 'Test',
      // ...
    });
    
    const saved = await demande.save();
    expect(saved._id).toBeDefined();
    expect(saved.numeroDemande).toBe('DEM-2026-000001');
  });
});
*/

export default {
  setupTestDB,
  teardownTestDB,
  clearCollections,
  createTestDocument,
  createTestDocuments,
};
