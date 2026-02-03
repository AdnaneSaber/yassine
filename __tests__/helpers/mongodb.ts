/**
 * Helper pour les tests avec MongoDB en mémoire
 * 
 * IMPORTANT: Ce helper est conçu pour fonctionner avec le mock de @/lib/db/mongodb
 * défini dans setup-integration.ts. Il ne crée pas de nouvelle connexion mais
 * réutilise celle établie par le mock.
 */

import mongoose from 'mongoose';

/**
 * Vérifie que la connexion MongoDB est établie
 * Cette fonction ne crée pas de nouvelle connexion car le mock dans
 * setup-integration.ts s'en charge déjà.
 */
export async function setupTestDB(): Promise<void> {
  // Le mock dans setup-integration.ts s'occupe déjà de la connexion
  // Cette fonction vérifie juste que la connexion est prête
  if (mongoose.connection.readyState !== 1) {
    // Attendre que la connexion soit établie (utile si appelé juste après le mock)
    let retries = 0;
    while (mongoose.connection.readyState !== 1 && retries < 10) {
      await new Promise(resolve => setTimeout(resolve, 100));
      retries++;
    }
    
    if (mongoose.connection.readyState !== 1) {
      throw new Error('MongoDB connection not established. Make sure setup-integration.ts mock is working.');
    }
  }
}

/**
 * Ferme la connexion et arrête MongoDB en mémoire
 * Cette fonction ne fait rien car la connexion est gérée par le mock global.
 */
export async function teardownTestDB(): Promise<void> {
  // Ne rien faire - la connexion est gérée globalement par le mock
  // Cette fonction existe pour la compatibilité avec les tests existants
}

/**
 * Nettoie toutes les collections (à utiliser dans beforeEach)
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
