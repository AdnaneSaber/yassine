# Résumé des Tests d'Intégration API

## Fichiers créés

### 1. Tests

| Fichier | Routes testées | Nombre de tests |
|---------|---------------|-----------------|
| `__tests__/integration/api/demandes/route.test.ts` | GET, POST /api/demandes | 16 tests |
| `__tests__/integration/api/demandes/[id]/route.test.ts` | GET, PATCH, DELETE /api/demandes/[id] | 14 tests |
| `__tests__/integration/api/demandes/[id]/transition/route.test.ts` | POST /api/demandes/[id]/transition | 16 tests |
| `__tests__/integration/api/admin/students/route.test.ts` | GET, POST /api/admin/students | 17 tests |

**Total : 63 tests d'intégration**

### 2. Configuration

| Fichier | Description |
|---------|-------------|
| `vitest.integration.config.ts` | Configuration Vitest pour tests d'intégration (environnement Node, pool=forks) |
| `__tests__/setup-integration.ts` | Setup spécifique pour les tests d'intégration (mocks) |
| `__tests__/integration/README.md` | Documentation complète des tests d'intégration |

### 3. Scripts ajoutés au package.json

```bash
# Tests d'intégration (exécution unique)
npm run test:integration

# Tests d'intégration (mode watch)
npm run test:integration:watch

# Tests unitaires uniquement
npm run test:unit
```

## Couverture des routes API

### ✅ GET /api/demandes
- [x] Liste vide
- [x] Liste avec pagination
- [x] Filtre par statut
- [x] Filtre par priorité
- [x] Filtre par type de demande
- [x] Recherche textuelle (objet, nom, prénom)
- [x] Pagination (page, limit)
- [x] Validation des paramètres

### ✅ POST /api/demandes
- [x] Création réussie avec auto-transition RECU
- [x] Génération auto du numeroDemande
- [x] Authentification requise (401)
- [x] Rôle étudiant requis (403)
- [x] Étudiant doit exister (404)
- [x] Validation des données (400)
- [x] Objet ≠ description
- [x] Priorité par défaut NORMALE
- [x] Tous les types de demande

### ✅ GET /api/demandes/[id]
- [x] Récupération réussie
- [x] Demande inexistante (404)
- [x] ID invalide (400)
- [x] Retourne tous les champs (documents, commentaires)

### ✅ PATCH /api/demandes/[id]
- [x] Mise à jour complète
- [x] Mise à jour partielle
- [x] Demande inexistante (404)
- [x] Données invalides (400)
- [x] Changement de type de demande

### ✅ DELETE /api/demandes/[id]
- [x] Suppression douce (soft delete)
- [x] Champ actif mis à false
- [x] Demande inexistante (404)
- [x] ID invalide (400)

### ✅ POST /api/demandes/[id]/transition
- [x] Transition SOUMIS → RECU
- [x] Transition RECU → EN_COURS
- [x] Transition EN_COURS → VALIDE
- [x] Transition EN_COURS → REJETE (avec motif)
- [x] Transition EN_COURS → ATTENTE_INFO
- [x] Transition VALIDE → TRAITE
- [x] Transition depuis état final (erreur)
- [x] Transition invalide (erreur 400)
- [x] Motif de refus requis pour REJETE
- [x] Création d'historique

### ✅ GET /api/admin/students
- [x] Liste vide
- [x] Liste avec pagination
- [x] Masquage du hashPassword
- [x] Filtre étudiants actifs
- [x] Authentification admin requise
- [x] Tri par nom/prénom
- [x] Accès SUPER_ADMIN autorisé

### ✅ POST /api/admin/students
- [x] Création réussie
- [x] Génération automatique du mot de passe
- [x] Retour du mot de passe en clair (pour admin)
- [x] Vérification matricule unique
- [x] Vérification email unique
- [x] Validation Zod
- [x] Niveaux d'étude valides (L1, L2, L3, M1, M2, Doctorat)
- [x] Conversion dateNaissance en Date

## Codes d'erreur testés

| Code | Route(s) | Description |
|------|----------|-------------|
| `AUTH_001` | POST /api/demandes | Non authentifié |
| `AUTH_002` | POST /api/demandes | Seuls les étudiants peuvent créer |
| `VAL_001` | Toutes | Erreur de validation Zod |
| `RES_001` | GET, PATCH, DELETE, Transition | Ressource non trouvée |
| `WF_001` | Transition | Transition invalide |
| `WF_002` | Transition | Validation métier échouée |
| `WF_003` | Transition | Permissions insuffisantes |

## Dépendance à installer

```bash
npm install --save-dev mongodb-memory-server
```

## Exécution rapide

```bash
# Vérifier que mongodb-memory-server est installé
npm install --save-dev mongodb-memory-server

# Lancer tous les tests d'intégration
npm run test:integration

# Lancer en mode watch
npm run test:integration:watch

# Lancer un fichier spécifique
npm run test:integration -- __tests__/integration/api/demandes/route.test.ts
```

## Architecture des tests

```
__tests__/
├── helpers/
│   └── mongodb.ts              # Helper MongoDB en mémoire
├── setup.ts                    # Setup global (jsdom)
├── setup-integration.ts        # Setup pour tests d'intégration
├── integration/
│   ├── README.md               # Documentation
│   └── api/
│       ├── demandes/
│       │   ├── route.test.ts
│       │   └── [id]/
│       │       ├── route.test.ts
│       │       └── transition/
│       │           └── route.test.ts
│       └── admin/
│           └── students/
│               └── route.test.ts
└── unit/                       # Tests unitaires existants
    └── ...
```

## Points forts de l'implémentation

1. **Isolation complète** : Chaque test utilise une BDD en mémoire propre
2. **Mocks cohérents** : `next-auth` mocké de manière identique
3. **Couverture exhaustive** : Cas passants et cas d'erreur
4. **Performance** : Exécution parallélisée avec pool=forks
5. **Maintenance** : Structure modulaire et documentée
