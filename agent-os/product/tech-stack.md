# Tech Stack - Prototype Académique

## Full-Stack Framework

### Next.js 15 (App Router)
- **Framework React full-stack avec TypeScript**
  - Server Components par défaut
  - Client Components quand nécessaire
  - API Routes intégrées
  - File-based routing
  - Streaming et Suspense
  - Server Actions pour mutations

### Pourquoi Next.js?
- **Tout-en-un**: Frontend + Backend dans un seul projet
- **Performance**: SSR, SSG, ISR natifs
- **DX Excellent**: Hot reload, TypeScript intégré, optimisations auto
- **Production-ready**: Déploiement Vercel en un clic
- **SEO**: Rendu côté serveur par défaut
- **API moderne**: Server Actions vs REST classique

## Styling & UI

### Tailwind CSS v4
- Design system cohérent
- Composants réutilisables
- Responsive by default
- Dark mode support

### Bibliothèque de Composants
- **Shadcn/ui** (recommandé pour Next.js)
  - Composants copiables (pas de dépendance)
  - Tailwind-based
  - Accessibilité WCAG intégrée
  - Tables, forms, modals, dropdowns, dialogs

### Icônes
- **Lucide React** (icônes modernes)
- **Heroicons** (alternative)

## Database

### MongoDB avec Mongoose
**Choix stratégique pour PoC académique:**

#### Pourquoi MongoDB?
1. **Flexibilité schéma**: Parfait pour prototypage rapide
2. **Document-oriented**: Modèle naturel pour demandes avec métadonnées variables
3. **JSON natif**: Pas de mapping ORM complexe
4. **MongoDB Atlas**: Tier gratuit généreux (512MB)
5. **Simplicité**: Moins de migrations, schéma évolutif
6. **BI compatible**: Aggregate pipeline puissant + Charts intégré

#### Modèle de Données

```typescript
// Collection: etudiants
{
  _id: ObjectId,
  matricule: string (unique),
  nom: string,
  prenom: string,
  email: string (unique),
  dateNaissance: Date,
  telephone: string,
  niveauEtude: string,
  filiere: string,
  actif: boolean,
  createdAt: Date,
  updatedAt: Date
}

// Collection: demandes
{
  _id: ObjectId,
  numeroDemande: string (unique), // DEM-2024-000001
  etudiant: {
    id: ObjectId (ref),
    nom: string, // Dénormalisé pour perfs
    prenom: string,
    email: string
  },
  typeDemande: {
    code: string, // ATTESTATION_SCOLARITE
    nom: string
  },
  statut: {
    code: string, // RECU, EN_COURS, TRAITE, etc.
    libelle: string,
    couleur: string
  },
  objet: string,
  description: string,
  priorite: 'BASSE' | 'NORMALE' | 'HAUTE' | 'URGENTE',
  documents: [{
    id: string,
    nomFichier: string,
    nomOriginal: string,
    url: string, // Cloudinary URL
    typeMime: string,
    taille: number,
    dateUpload: Date
  }],
  commentaireAdmin: string,
  motifRefus: string,
  metadata: {}, // Données spécifiques au type
  createdAt: Date,
  updatedAt: Date,
  dateTraitement: Date,
  traiteParId: ObjectId
}

// Collection: historique
{
  _id: ObjectId,
  demandeId: ObjectId,
  numeroDemandeRef: string,
  statutAncien: {code, libelle},
  statutNouveau: {code, libelle},
  utilisateur: {id, nom, role},
  typeAction: string,
  commentaire: string,
  createdAt: Date
}

// Collection: utilisateurs
{
  _id: ObjectId,
  email: string (unique),
  hashPassword: string,
  nom: string,
  prenom: string,
  role: 'STUDENT' | 'ADMIN' | 'SUPER_ADMIN',
  actif: boolean,
  derniereConnexion: Date,
  createdAt: Date
}

// Collection: notifications
{
  _id: ObjectId,
  demandeId: ObjectId,
  type: 'EMAIL' | 'SMS',
  destinataire: string,
  sujet: string,
  contenu: string,
  statutEnvoi: 'EN_ATTENTE' | 'ENVOYE' | 'ECHEC',
  nbTentatives: number,
  erreur: string,
  createdAt: Date,
  dateEnvoi: Date
}
```

### ORM/ODM
- **Mongoose**
  - Schémas TypeScript
  - Validation intégrée
  - Middleware (hooks)
  - Population (équivalent joins)
  - Virtuals et methods

### Indexes MongoDB
```javascript
// etudiants
{ matricule: 1 } // unique
{ email: 1 } // unique
{ "nom": 1, "prenom": 1 }

// demandes
{ numeroDemande: 1 } // unique
{ "etudiant.id": 1 }
{ "statut.code": 1 }
{ createdAt: -1 }
{ "etudiant.id": 1, "statut.code": 1 } // compound

// historique
{ demandeId: 1 }
{ createdAt: -1 }

// notifications
{ demandeId: 1 }
{ statutEnvoi: 1 }
```

## Authentification & Sécurité

### NextAuth.js v5 (Auth.js)
- **Authentification moderne pour Next.js**
  - Credentials provider (email/password)
  - JWT sessions
  - Server-side auth checks
  - Middleware protection
  - Type-safe avec TypeScript

### Sécurité
- **Bcryptjs** pour hashing passwords
- **Zod** pour validation schemas
- **Next.js Security Headers** (built-in)
- **Rate limiting** (middleware)
- **CSRF protection** (Next.js intégré)

## Workflow & Automation

### State Machine Custom
```typescript
// lib/workflow/state-machine.ts
type DemandeStatus =
  | 'SOUMIS'
  | 'RECU'
  | 'EN_COURS'
  | 'ATTENTE_INFO'
  | 'VALIDE'
  | 'REJETE'
  | 'TRAITE'
  | 'ARCHIVE';

const transitions = {
  SOUMIS: ['RECU'],
  RECU: ['EN_COURS', 'REJETE'],
  EN_COURS: ['ATTENTE_INFO', 'VALIDE', 'REJETE'],
  ATTENTE_INFO: ['EN_COURS', 'REJETE'],
  VALIDE: ['TRAITE'],
  REJETE: ['ARCHIVE'],
  TRAITE: ['ARCHIVE']
};

// Hooks pour chaque transition
const onTransition = {
  async toRECU(demande) {
    await sendEmail(demande.etudiant.email, 'confirmation');
    await logHistorique(demande._id, 'SOUMIS', 'RECU', 'SYSTEM');
  },
  async toTRAITE(demande) {
    await sendEmail(demande.etudiant.email, 'validation');
    await generatePDF(demande);
    demande.dateTraitement = new Date();
  }
};
```

### Job Queue
- **Vercel Cron Jobs** (gratuit)
  - API Routes exécutées périodiquement
  - Pas besoin de Redis pour PoC
  - `/api/cron/process-notifications`
  - `/api/cron/send-reminders`

### Alternative si besoin avancé
- **Inngest** (gratuit jusqu'à 50k runs/mois)
  - Workflow orchestration
  - Retry automatique
  - Scheduled jobs

## Notifications

### Email Service
- **Resend** (recommandé pour Next.js)
  - 3000 emails/mois gratuits
  - API simple
  - React Email pour templates
  - Excellente DX

```typescript
// lib/email/send.ts
import { Resend } from 'resend';
import { DemandeRecueEmail } from '@/emails/demande-recue';

const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
  from: 'scolarite@university.edu',
  to: etudiant.email,
  subject: 'Demande reçue',
  react: DemandeRecueEmail({ demande })
});
```

### Email Templates
- **React Email**
  - Templates en React/JSX
  - Preview local
  - Responsive par défaut

## Gestion Documentaire

### Cloudinary (Cloud Storage)
- **Gratuit**: 25 GB stockage + 25 GB bandwidth/mois
- Upload direct depuis Next.js
- Transformations images automatiques
- CDN global inclus
- API simple

```typescript
// lib/upload.ts
import { v2 as cloudinary } from 'cloudinary';

const result = await cloudinary.uploader.upload(file, {
  folder: `demandes/${demandeId}`,
  resource_type: 'auto'
});
```

### Alternative
- **UploadThing** (Next.js native)
- **Vercel Blob Storage**

## Business Intelligence

### MongoDB Charts (Intégré)
- **Gratuit avec Atlas**
- Connexion directe MongoDB
- Interface drag-and-drop
- Embedding dans Next.js app
- Tableaux de bord interactifs

### Aggregate Pipeline MongoDB
```javascript
// Métriques en temps réel
db.demandes.aggregate([
  {
    $group: {
      _id: "$typeDemande.code",
      count: { $sum: 1 },
      avgDelai: {
        $avg: {
          $divide: [
            { $subtract: ["$dateTraitement", "$createdAt"] },
            86400000 // ms to days
          ]
        }
      }
    }
  }
]);
```

### Alternative BI
- **Metabase** avec MongoDB connector
- **Apache Superset**
- **Retool** (low-code analytics)

## Formulaires & Validation

### React Hook Form + Zod
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const demandeSchema = z.object({
  typeDemande: z.string().min(1),
  objet: z.string().min(10).max(255),
  description: z.string().min(20),
  documents: z.array(z.instanceof(File)).min(1)
});

const form = useForm({
  resolver: zodResolver(demandeSchema)
});
```

## Testing

### Tests Unit & Integration
- **Jest** + **React Testing Library**
  - Tests composants
  - Tests Server Actions
  - Tests API Routes

### Tests E2E
- **Playwright**
  - Scénarios complets
  - Tests multi-navigateurs
  - CI/CD ready

## Architecture Next.js

```
app/
├── (auth)/
│   ├── login/
│   │   └── page.tsx
│   └── register/
│       └── page.tsx
│
├── (student)/
│   ├── dashboard/
│   │   └── page.tsx              # Dashboard étudiant
│   ├── demandes/
│   │   ├── page.tsx              # Liste mes demandes
│   │   ├── new/
│   │   │   └── page.tsx          # Nouvelle demande
│   │   └── [id]/
│   │       └── page.tsx          # Détail demande
│   └── layout.tsx
│
├── (admin)/
│   ├── admin/
│   │   ├── dashboard/
│   │   │   └── page.tsx          # Dashboard admin
│   │   ├── demandes/
│   │   │   ├── page.tsx          # Liste toutes demandes
│   │   │   └── [id]/
│   │   │       └── page.tsx      # Gestion demande
│   │   ├── analytics/
│   │   │   └── page.tsx          # Tableaux de bord BI
│   │   └── layout.tsx
│
├── api/
│   ├── demandes/
│   │   ├── route.ts              # GET, POST /api/demandes
│   │   └── [id]/
│   │       └── route.ts          # GET, PATCH, DELETE
│   ├── upload/
│   │   └── route.ts              # Upload fichiers
│   ├── webhook/
│   │   └── route.ts              # Webhooks externes
│   └── cron/
│       ├── notifications/
│       │   └── route.ts          # Cron job notifications
│       └── reminders/
│           └── route.ts          # Cron job rappels
│
├── actions/                      # Server Actions
│   ├── demandes.ts
│   ├── workflow.ts
│   └── notifications.ts
│
├── components/
│   ├── ui/                       # Shadcn components
│   ├── forms/
│   ├── demandes/
│   └── admin/
│
├── lib/
│   ├── db/
│   │   ├── mongodb.ts            # Mongoose connection
│   │   └── models/               # Mongoose schemas
│   │       ├── etudiant.ts
│   │       ├── demande.ts
│   │       ├── historique.ts
│   │       └── utilisateur.ts
│   ├── workflow/
│   │   ├── state-machine.ts
│   │   └── rules.ts
│   ├── email/
│   │   └── send.ts
│   ├── upload/
│   │   └── cloudinary.ts
│   └── utils/
│       ├── auth.ts
│       └── validators.ts
│
├── types/
│   ├── demande.ts
│   ├── workflow.ts
│   └── database.ts
│
└── middleware.ts                 # Auth protection
```

## Environnement & Déploiement

### Variables d'Environnement
```bash
# Database
MONGODB_URI=mongodb+srv://...

# Auth
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000

# Email
RESEND_API_KEY=...

# Upload
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# BI (optionnel)
MONGODB_CHARTS_BASE_URL=...
```

### Déploiement

#### Vercel (Recommandé - Gratuit)
```bash
npm install -g vercel
vercel deploy
```

**Inclus gratuitement:**
- Hébergement Next.js
- CDN global
- SSL automatique
- Cron jobs
- Analytics
- Preview deployments

#### MongoDB Atlas
- Tier gratuit: 512 MB
- Backup automatiques
- Charts intégré
- Global clusters

#### Cloudinary
- 25 GB gratuit
- CDN inclus
- Transformations

## Justification des Choix

### Pourquoi Next.js + MongoDB?

#### Next.js
✅ **Full-stack unifié**: Pas besoin de séparer frontend/backend
✅ **Performance**: SSR natif, optimisations auto
✅ **DX exceptionnel**: TypeScript, hot reload, file-based routing
✅ **Déploiement**: Vercel en un clic, gratuit
✅ **Moderne**: Server Components, Server Actions
✅ **Production-ready**: Utilisé par Netflix, TikTok, Nike

#### MongoDB
✅ **Flexibilité**: Schéma évolutif pour prototype
✅ **Simplicité**: Pas de migrations complexes
✅ **JSON natif**: Modèle naturel pour données variables
✅ **Gratuit**: Atlas tier généreux
✅ **BI intégré**: Charts + Aggregate pipeline puissant
✅ **DX**: Mongoose typé avec TypeScript

### Comparaison vs Stack Initial

| Critère | React+Express+PostgreSQL | Next.js+MongoDB |
|---------|-------------------------|-----------------|
| **Simplicité** | ⚠️ 2 projets séparés | ✅ 1 seul projet |
| **Setup** | ⚠️ Config CORS, proxy | ✅ Tout intégré |
| **Déploiement** | ⚠️ 2 services | ✅ 1 service |
| **Migrations DB** | ⚠️ Complexes | ✅ Flexibles |
| **Learning curve** | ⚠️ REST API classique | ✅ Server Actions modernes |
| **Performance** | ✅ Bon | ✅ Excellent (SSR) |
| **Coût** | ⚠️ 2 hostings | ✅ 1 hosting (Vercel) |
| **Académique** | ✅ Classique | ✅ Moderne & Impressionnant |

## Stack Complet Résumé

```
┌─────────────────────────────────────────┐
│     Next.js 15 (App Router)             │
│  ┌────────────────────────────────────┐ │
│  │  Server Components (RSC)           │ │
│  │  - Pages, Layouts                  │ │
│  │  - Data fetching                   │ │
│  └────────────────────────────────────┘ │
│  ┌────────────────────────────────────┐ │
│  │  Client Components                 │ │
│  │  - Formulaires interactifs         │ │
│  │  - Dashboard temps réel            │ │
│  └────────────────────────────────────┘ │
│  ┌────────────────────────────────────┐ │
│  │  Server Actions                    │ │
│  │  - Mutations (create, update)      │ │
│  │  - Workflow transitions            │ │
│  └────────────────────────────────────┘ │
│  ┌────────────────────────────────────┐ │
│  │  API Routes                        │ │
│  │  - REST endpoints                  │ │
│  │  - Webhooks, Cron                  │ │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
              │ Mongoose ODM
              ▼
┌─────────────────────────────────────────┐
│        MongoDB Atlas                    │
│  - Collections: demandes, etudiants     │
│  - Indexes, Validation                  │
│  - Aggregate Pipeline                   │
└─────────────────────────────────────────┘
              │
              ├─> MongoDB Charts (BI)
              ├─> Cloudinary (Files)
              └─> Resend (Emails)
```

## Outils Gratuits

- **Next.js**: Framework gratuit
- **Vercel**: Hosting gratuit (Hobby plan)
- **MongoDB Atlas**: 512 MB gratuit
- **Cloudinary**: 25 GB gratuit
- **Resend**: 3000 emails/mois gratuits
- **MongoDB Charts**: Inclus avec Atlas
- **GitHub**: Code + CI/CD gratuit

## Temps de Développement Estimé

| Phase | Durée |
|-------|-------|
| Setup Next.js + MongoDB | 2-3 jours |
| Authentification | 2 jours |
| CRUD Demandes | 3-4 jours |
| Workflow Engine | 3 jours |
| Upload + Emails | 2 jours |
| Dashboard Admin | 3 jours |
| BI Charts | 2-3 jours |
| Tests + Polish | 3-4 jours |
| **Total** | **20-24 jours** |

## Conclusion

Ce stack Next.js + MongoDB est **optimal pour un PoC académique** car:

✅ **Moderne**: Technologies actuelles (2024-2025)
✅ **Simplifié**: Un seul projet full-stack
✅ **Rapide**: Développement et exécution
✅ **Gratuit**: Tous les services en tier gratuit
✅ **Professionnel**: Stack utilisé en production réelle
✅ **Impressionnant**: Démontre maîtrise technologies récentes
✅ **Évolutif**: Peut scale si besoin futur
