# Tests d'Intégration API - Yassine

Ce répertoire contient les tests d'intégration pour les API Routes Next.js du projet Yassine.

## Prérequis

```bash
npm install --save-dev mongodb-memory-server
```

## Structure des tests

```
__tests__/integration/
├── api/
│   ├── demandes/
│   │   ├── route.test.ts                    # GET, POST /api/demandes
│   │   └── [id]/
│   │       ├── route.test.ts                # GET, PATCH, DELETE /api/demandes/[id]
│   │       └── transition/
│   │           └── route.test.ts            # POST /api/demandes/[id]/transition
│   └── admin/
│       └── students/
│           └── route.test.ts                # GET, POST /api/admin/students
└── README.md
```

## Exécution des tests

```bash
# Tous les tests
npm test

# Tests d'intégration uniquement
npm test -- __tests__/integration

# Tests d'une route spécifique
npm test -- __tests__/integration/api/demandes/route.test.ts

# Mode watch
npm test -- --watch

# Avec couverture
npm run test:coverage
```

## Caractéristiques des tests

### 1. Base de données en mémoire
- Utilisation de `mongodb-memory-server` pour une base de données isolée
- Base de données réinitialisée avant chaque test (`beforeEach`)
- Connexion MongoDB fermée après tous les tests (`afterAll`)

### 2. Mocking
- `next-auth` : Simulation des sessions (étudiant, admin, non authentifié)
- `@/lib/auth/auth-options` : Mock minimal des options d'authentification

### 3. Cas de test couverts

#### /api/demandes (GET)
- ✅ Liste vide
- ✅ Liste avec pagination
- ✅ Filtre par statut
- ✅ Filtre par priorité
- ✅ Filtre par type de demande
- ✅ Recherche textuelle
- ✅ Validation des paramètres (erreur 400)

#### /api/demandes (POST)
- ✅ Création réussie avec étudiant authentifié
- ✅ Erreur 401 si non authentifié
- ✅ Erreur 403 si non étudiant
- ✅ Erreur 404 si étudiant inexistant
- ✅ Erreur 400 si données invalides
- ✅ Priorité par défaut (NORMALE)
- ✅ Tous les types de demande valides

#### /api/demandes/[id] (GET)
- ✅ Récupération d'une demande existante
- ✅ Erreur 404 si demande inexistante
- ✅ Erreur 400 si ID invalide
- ✅ Retourne tous les champs (documents, commentaires)

#### /api/demandes/[id] (PATCH)
- ✅ Mise à jour complète
- ✅ Mise à jour partielle
- ✅ Erreur 404 si demande inexistante
- ✅ Erreur 400 si données invalides

#### /api/demandes/[id] (DELETE)
- ✅ Suppression douce (soft delete)
- ✅ Mise à jour du champ `actif: false`
- ✅ Erreur 404 si demande inexistante

#### /api/demandes/[id]/transition (POST)
- ✅ Transition SOUMIS → RECU
- ✅ Transition RECU → EN_COURS
- ✅ Transition EN_COURS → VALIDE
- ✅ Transition EN_COURS → REJETE (avec motif)
- ✅ Transition EN_COURS → ATTENTE_INFO
- ✅ Transition VALIDE → TRAITE
- ✅ Création d'historique
- ✅ Erreur 400 pour transition invalide
- ✅ Erreur 400 si motifRefus manquant pour REJETE

#### /api/admin/students (GET)
- ✅ Liste vide
- ✅ Liste avec pagination
- ✅ Masquage du hashPassword
- ✅ Filtre étudiants actifs uniquement
- ✅ Erreur 401 si non authentifié
- ✅ Erreur 401 si non admin
- ✅ Accès autorisé pour SUPER_ADMIN

#### /api/admin/students (POST)
- ✅ Création réussie
- ✅ Génération automatique du mot de passe
- ✅ Erreur 400 si matricule existe déjà
- ✅ Erreur 400 si email existe déjà
- ✅ Validation des niveaux d'étude

## Helpers disponibles

### `__tests__/helpers/mongodb.ts`

```typescript
// Configuration de la BDD en mémoire
await setupTestDB();

// Nettoyage des collections
await clearCollections();

// Fermeture de la connexion
await teardownTestDB();

// Création de documents de test
await createTestDocument(Model, data);
await createTestDocuments(Model, [data1, data2]);
```

## Exemple de test complet

```typescript
import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/demandes/route';
import { Demande, Etudiant } from '@/lib/db/models';
import { setupTestDB, teardownTestDB, clearCollections } from '@/__tests__/helpers/mongodb';

vi.mock('next-auth', () => ({
  getServerSession: vi.fn()
}));

describe('/api/demandes', () => {
  beforeAll(async () => await setupTestDB());
  afterAll(async () => await teardownTestDB());
  beforeEach(async () => await clearCollections());

  it('retourne la liste des demandes', async () => {
    const etudiant = await Etudiant.create({...});
    await Demande.create({ etudiant: {...}, ... });

    const req = new NextRequest('http://localhost:3000/api/demandes');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.data).toHaveLength(1);
  });
});
```

## Codes d'erreur testés

| Code | Description |
|------|-------------|
| `AUTH_001` | Non authentifié |
| `AUTH_002` | Action non autorisée pour ce rôle |
| `VAL_001` | Erreur de validation (Zod) |
| `RES_001` | Ressource non trouvée |
| `WF_001` | Transition de workflow invalide |
| `WF_002` | Validation métier échouée |

## Bonnes pratiques

1. **Isolation** : Chaque test est indépendant (clean state avec `beforeEach`)
2. **Mocks explicites** : Les sessions sont mockées explicitement dans chaque test
3. **Vérifications complètes** : On vérifie à la fois le status code et le contenu
4. **Cas limites** : Tests des erreurs et cas invalides
5. **Données réalistes** : Utilisation de données proches de la production

## Dépannage

### Erreur "Cannot find module 'mongodb-memory-server'"
```bash
npm install --save-dev mongodb-memory-server
```

### Erreur de connexion MongoDB
Vérifier que `setupTestDB()` est bien appelé dans `beforeAll` et `teardownTestDB()` dans `afterAll`.

### Tests qui timeout
Augmenter le timeout dans `vitest.config.ts` :
```typescript
testTimeout: 30000,
hookTimeout: 30000,
```

## Contribution

Pour ajouter un nouveau test :
1. Créer le fichier dans le répertoire approprié
2. Suivre la structure `describe` → `describe` → `it`
3. Utiliser les helpers pour la BDD
4. Mock `getServerSession` pour l'authentification
5. Nettoyer avec `clearCollections()` dans `beforeEach`
