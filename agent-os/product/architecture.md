# Architecture Technique Détaillée

## Vue d'Ensemble

Le système est construit selon une architecture 3-tiers moderne, séparant clairement la présentation, la logique métier et les données.

## Architecture Globale

```
┌─────────────────────────────────────────────────────────────────┐
│                        COUCHE PRÉSENTATION                       │
│  ┌────────────────────────┐      ┌────────────────────────┐    │
│  │   Interface Étudiant   │      │  Interface Admin       │    │
│  │  - Soumission demandes │      │  - Gestion demandes    │    │
│  │  - Suivi statut        │      │  - Modification statut │    │
│  │  - Historique perso    │      │  - Statistiques        │    │
│  └────────────────────────┘      └────────────────────────┘    │
│              React 18 + TypeScript + Tailwind CSS              │
└─────────────────────────────────────────────────────────────────┘
                              │ REST API (JSON)
                              │ HTTPS
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      COUCHE LOGIQUE MÉTIER                       │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐    │
│  │ API Gateway │  │ Workflow     │  │ Services Métier    │    │
│  │ - Routing   │→ │ Engine       │→ │ - Demandes         │    │
│  │ - Auth      │  │ - États      │  │ - Étudiants        │    │
│  │ - Validation│  │ - Règles     │  │ - Notifications    │    │
│  │ - CORS      │  │ - Transitions│  │ - Documents        │    │
│  └─────────────┘  └──────────────┘  └────────────────────┘    │
│                                                                  │
│  ┌─────────────────┐  ┌──────────────┐  ┌─────────────────┐   │
│  │ Email Service   │  │ File Service │  │ Analytics       │   │
│  │ - Nodemailer    │  │ - Upload     │  │ - Métriques     │   │
│  │ - Templates     │  │ - Storage    │  │ - Rapports      │   │
│  │ - Queue (Bull)  │  │ - Validation │  │ - Exports       │   │
│  └─────────────────┘  └──────────────┘  └─────────────────┘   │
│              Node.js + Express + TypeScript                     │
└─────────────────────────────────────────────────────────────────┘
                              │ Prisma ORM
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        COUCHE DONNÉES                            │
│  ┌─────────────────┐  ┌──────────────┐  ┌─────────────────┐   │
│  │   PostgreSQL    │  │    Redis     │  │  File System    │   │
│  │  - Données      │  │  - Queue     │  │  - Documents    │   │
│  │  - Relations    │  │  - Cache     │  │  - Uploads      │   │
│  │  - Historique   │  │  - Sessions  │  │                 │   │
│  └─────────────────┘  └──────────────┘  └─────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │ SQL Connection
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    COUCHE BUSINESS INTELLIGENCE                  │
│                          Metabase                                │
│  - Dashboards temps réel                                         │
│  - Analyses historiques                                          │
│  - KPIs et métriques                                             │
└─────────────────────────────────────────────────────────────────┘
```

## Architecture Backend Détaillée

```
backend/
├── src/
│   ├── config/
│   │   ├── database.ts          # Configuration Prisma
│   │   ├── email.ts             # Configuration Nodemailer
│   │   ├── redis.ts             # Configuration Redis/BullMQ
│   │   └── constants.ts         # Constantes application
│   │
│   ├── middleware/
│   │   ├── auth.ts              # JWT verification
│   │   ├── validation.ts        # Request validation (Zod)
│   │   ├── error-handler.ts     # Global error handling
│   │   └── logger.ts            # Request logging
│   │
│   ├── models/                  # Prisma schema
│   │   └── schema.prisma
│   │
│   ├── controllers/
│   │   ├── demandes.controller.ts
│   │   ├── etudiants.controller.ts
│   │   ├── admin.controller.ts
│   │   └── auth.controller.ts
│   │
│   ├── services/
│   │   ├── demandes.service.ts    # Logique métier demandes
│   │   ├── workflow.service.ts    # State machine
│   │   ├── email.service.ts       # Envoi emails
│   │   ├── file.service.ts        # Gestion fichiers
│   │   ├── notification.service.ts
│   │   └── analytics.service.ts   # Calcul métriques
│   │
│   ├── workflows/
│   │   ├── state-machine.ts       # Core workflow engine
│   │   ├── rules.ts               # Règles métier
│   │   └── transitions.ts         # Définition transitions
│   │
│   ├── queues/
│   │   ├── email.queue.ts         # Queue emails
│   │   └── workers.ts             # Workers BullMQ
│   │
│   ├── routes/
│   │   ├── api.routes.ts          # Routes principales
│   │   ├── demandes.routes.ts
│   │   ├── admin.routes.ts
│   │   └── auth.routes.ts
│   │
│   ├── types/
│   │   ├── demande.types.ts
│   │   ├── workflow.types.ts
│   │   └── api.types.ts
│   │
│   ├── utils/
│   │   ├── logger.ts
│   │   ├── validators.ts
│   │   └── helpers.ts
│   │
│   └── app.ts                     # Express app setup
│   └── server.ts                  # Server entry point
│
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts                    # Données de test
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
└── uploads/                       # Documents stockés
    └── {annee}/{mois}/{demande_id}/
```

## Architecture Frontend Détaillée

```
frontend/
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Table.tsx
│   │   │   └── FileUpload.tsx
│   │   │
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Layout.tsx
│   │   │
│   │   ├── demandes/
│   │   │   ├── DemandeForm.tsx          # Formulaire soumission
│   │   │   ├── DemandeCard.tsx          # Carte demande
│   │   │   ├── DemandeList.tsx          # Liste demandes
│   │   │   ├── DemandeDetail.tsx        # Détail demande
│   │   │   └── StatusBadge.tsx          # Badge statut
│   │   │
│   │   └── admin/
│   │       ├── Dashboard.tsx            # Dashboard admin
│   │       ├── DemandeTable.tsx         # Table gestion
│   │       ├── StatutModifier.tsx       # Modification statut
│   │       └── HistoriqueView.tsx       # Vue historique
│   │
│   ├── pages/
│   │   ├── student/
│   │   │   ├── HomePage.tsx
│   │   │   ├── NewDemandePage.tsx
│   │   │   ├── MyDemandesPage.tsx
│   │   │   └── DemandDetailPage.tsx
│   │   │
│   │   ├── admin/
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── DemandesPage.tsx
│   │   │   └── AnalyticsPage.tsx
│   │   │
│   │   ├── LoginPage.tsx
│   │   └── NotFoundPage.tsx
│   │
│   ├── hooks/
│   │   ├── useDemandes.ts               # Hook fetch demandes
│   │   ├── useWorkflow.ts               # Hook workflow actions
│   │   ├── useAuth.ts                   # Hook authentification
│   │   └── useNotifications.ts          # Hook notifications
│   │
│   ├── contexts/
│   │   ├── AuthContext.tsx              # Context auth
│   │   └── NotificationContext.tsx      # Context notifications
│   │
│   ├── services/
│   │   ├── api.service.ts               # Base API client (axios)
│   │   ├── demandes.service.ts          # API demandes
│   │   ├── auth.service.ts              # API auth
│   │   └── files.service.ts             # API files
│   │
│   ├── types/
│   │   ├── demande.types.ts
│   │   ├── user.types.ts
│   │   └── api.types.ts
│   │
│   ├── utils/
│   │   ├── formatters.ts                # Format dates, nombres
│   │   ├── validators.ts                # Validation formulaires
│   │   └── constants.ts
│   │
│   ├── styles/
│   │   └── globals.css                  # Tailwind imports
│   │
│   ├── App.tsx                          # App root
│   ├── main.tsx                         # Entry point
│   └── router.tsx                       # React Router setup
│
└── public/
    └── assets/
```

## Flux de Données - Soumission de Demande

```
┌─────────────┐
│  Étudiant   │
│ remplit form│
└──────┬──────┘
       │ 1. Submit
       ▼
┌─────────────────────────┐
│  DemandeForm.tsx        │
│  - Validation client    │
│  - Upload fichiers      │
└──────┬──────────────────┘
       │ 2. POST /api/demandes
       ▼
┌─────────────────────────┐
│  API Gateway            │
│  - Auth check           │
│  - Validation (Zod)     │
└──────┬──────────────────┘
       │ 3. Validated data
       ▼
┌─────────────────────────┐
│  demandes.controller.ts │
│  - Parse request        │
└──────┬──────────────────┘
       │ 4. createDemande()
       ▼
┌─────────────────────────┐
│  demandes.service.ts    │
│  - Business logic       │
└──────┬──────────────────┘
       │ 5. Save to DB
       ▼
┌─────────────────────────┐
│  Prisma ORM             │
│  - Transaction          │
│  - Insert demande       │
└──────┬──────────────────┘
       │ 6. Demande créée
       ▼
┌─────────────────────────┐
│  workflow.service.ts    │
│  - Initialize workflow  │
│  - Set status = RECU    │
└──────┬──────────────────┘
       │ 7. Trigger events
       ├─────────────────────────┐
       ▼                         ▼
┌──────────────────┐    ┌────────────────┐
│  email.queue.ts  │    │ historique DB  │
│  - Add job       │    │ - Log action   │
└────┬─────────────┘    └────────────────┘
     │ 8. Process async
     ▼
┌──────────────────┐
│  Email Worker    │
│  - Send email    │
│  - Update status │
└──────────────────┘
```

## Machine à États (Workflow)

```
                    ┌──────────┐
                    │ SOUMIS   │
                    └────┬─────┘
                         │ Auto: onSubmit()
                         │ - Email confirmation
                         │ - Log historique
                         ▼
                    ┌──────────┐
              ┌─────┤  RECU    ├─────┐
              │     └──────────┘     │
              │                      │
              │ Admin: assigne       │ Admin: rejette
              │                      │
              ▼                      ▼
        ┌──────────┐           ┌──────────┐
        │EN COURS  │           │ REFUSÉ   │
        └────┬─────┘           └────┬─────┘
             │                      │
             │ Admin: valide        │ Auto: onReject()
             │                      │ - Email motif refus
             ▼                      │
        ┌──────────┐                │
        │ VALIDÉ   │                │
        └────┬─────┘                │
             │                      │
             │ Auto: onValidate()   │
             │ - Génère document    │
             │ - Email notification │
             ▼                      ▼
        ┌──────────┐           ┌──────────┐
        │ TRAITÉ   │           │ ARCHIVÉ  │
        └──────────┘           └──────────┘
             │                      ▲
             │ (après 6 mois)       │
             └──────────────────────┘
```

## Sécurité

### Authentification Flow

```
┌──────────┐
│  Client  │
└────┬─────┘
     │ 1. POST /api/auth/login
     │    { email, password }
     ▼
┌─────────────────────┐
│  auth.controller    │
│  - Validate input   │
└────┬────────────────┘
     │ 2. authenticateUser()
     ▼
┌─────────────────────┐
│  auth.service       │
│  - Find user        │
│  - Compare hash     │
└────┬────────────────┘
     │ 3. User validated
     ▼
┌─────────────────────┐
│  JWT Service        │
│  - Generate token   │
│  - Set expiry       │
└────┬────────────────┘
     │ 4. Return token
     ▼
┌──────────┐
│  Client  │
│  Store   │
│  token   │
└────┬─────┘
     │ 5. Subsequent requests
     │    Header: Authorization: Bearer <token>
     ▼
┌─────────────────────┐
│  auth.middleware    │
│  - Verify token     │
│  - Check expiry     │
│  - Attach user      │
└────┬────────────────┘
     │ 6. Authorized request
     ▼
┌─────────────────────┐
│  Protected Route    │
│  - Access granted   │
└─────────────────────┘
```

### Mesures de Sécurité

1. **Authentification**
   - JWT avec expiration (24h)
   - Refresh tokens (optionnel pour PoC)
   - Bcrypt avec salt rounds = 10

2. **Autorisation**
   - Role-Based Access Control (RBAC)
   - Roles: STUDENT, ADMIN, SUPER_ADMIN
   - Middleware de vérification par route

3. **Validation**
   - Validation input avec Zod
   - Sanitization des données
   - Protection XSS

4. **Protection**
   - Helmet.js pour headers sécurisés
   - CORS configuré
   - Rate limiting (express-rate-limit)
   - Protection CSRF pour formulaires

5. **Fichiers**
   - Validation type MIME
   - Limite taille (5MB)
   - Scan antivirus (optionnel)
   - Stockage hors web root

## Performance

### Optimisations Backend

1. **Database**
   - Indexes sur colonnes fréquemment requêtées
   - Connection pooling (Prisma par défaut)
   - Queries optimisées (éviter N+1)

2. **Caching**
   - Redis pour sessions
   - Cache résultats queries fréquentes
   - TTL appropriés

3. **Async Processing**
   - Queue BullMQ pour emails
   - Workers séparés
   - Retry automatique

### Optimisations Frontend

1. **Code Splitting**
   - Lazy loading composants
   - Route-based splitting
   - Dynamic imports

2. **Assets**
   - Images optimisées
   - Compression Brotli
   - CDN pour assets statiques (production)

3. **State Management**
   - Context API avec memo
   - Éviter re-renders inutiles
   - Debouncing recherches

## Scalabilité Future

### Horizontal Scaling

```
┌──────────────┐
│ Load Balancer│
└──────┬───────┘
       │
   ┌───┴───┬────────┬────────┐
   │       │        │        │
   ▼       ▼        ▼        ▼
┌────┐  ┌────┐  ┌────┐  ┌────┐
│App1│  │App2│  │App3│  │App4│
└──┬─┘  └──┬─┘  └──┬─┘  └──┬─┘
   │       │        │        │
   └───┬───┴────────┴────────┘
       │
   ┌───┴─────────────────┐
   │                     │
   ▼                     ▼
┌──────────┐      ┌──────────┐
│PostgreSQL│      │  Redis   │
│(Primary) │      │ Cluster  │
└────┬─────┘      └──────────┘
     │
     ▼
┌──────────┐
│PostgreSQL│
│(Replica) │
└──────────┘
```

## Monitoring & Observabilité

### Métriques Clés

1. **Application**
   - Temps de réponse API
   - Taux d'erreurs
   - Throughput (req/s)

2. **Database**
   - Query time
   - Connection pool usage
   - Slow queries

3. **Business**
   - Demandes créées/jour
   - Temps moyen de traitement
   - Taux de validation

### Outils

- **Logs**: Winston (structured logging)
- **Monitoring**: Sentry (errors), PM2 (process)
- **Analytics**: Metabase (business metrics)

## Déploiement

### Environnements

1. **Development**
   - Local PostgreSQL
   - Hot reload
   - Seed data

2. **Staging**
   - Railway/Render
   - Copy production data
   - Tests E2E

3. **Production** (si applicable)
   - Vercel (frontend)
   - Railway (backend)
   - Supabase (database)

### CI/CD Pipeline

```
┌──────────┐
│Git Push  │
└────┬─────┘
     │
     ▼
┌─────────────┐
│GitHub Action│
└────┬────────┘
     │
     ├─> Run linter
     ├─> Run tests
     ├─> Build
     └─> Deploy
         │
         ├─> Frontend → Vercel
         └─> Backend → Railway
```

Cette architecture garantit:
- ✅ Séparation des responsabilités
- ✅ Maintenabilité
- ✅ Testabilité
- ✅ Évolutivité
- ✅ Performance
- ✅ Sécurité
