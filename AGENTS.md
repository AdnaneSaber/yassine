# AGENTS.md - Guide pour Agents IA

> Ce fichier contient les informations essentielles pour les agents IA travaillant sur ce projet. Il est écrit en français car tout le projet (interface, documentation, emails) utilise la langue française.

---

## Vue d'ensemble du projet

**Yassine** est un système de gestion des demandes administratives universitaires (attestations, relevés de notes, conventions de stage, etc.) développé avec Next.js 15 et MongoDB.

### Architecture générale

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Étudiants     │     │   Next.js 15    │     │   MongoDB       │
│   (Interface)   │────▶│   (App Router)  │────▶│   (Mongoose)    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌─────────────────┐
                        │   Resend API    │
                        │   (Emails)      │
                        └─────────────────┘
```

### Flux de travail principal

1. **Étudiant** crée une demande → Statut: `SOUMIS`
2. **Système** auto-transitionne → Statut: `RECU` + Email envoyé
3. **Admin** traite la demande → Statuts: `EN_COURS` → `VALIDE` → `TRAITE`
4. **Emails** automatiques à chaque changement de statut

---

## Stack Technique

| Couche | Technologie | Version |
|--------|-------------|---------|
| Framework | Next.js | 15.1.6 (App Router) |
| Langage | TypeScript | 5.x |
| Base de données | MongoDB + Mongoose | 9.x |
| Authentification | NextAuth.js | 4.24.13 |
| UI Components | shadcn/ui + Radix UI | Latest |
| Styling | Tailwind CSS | 4.0.0 |
| Validation | Zod | 4.3.6 |
| Formulaires | React Hook Form | 7.71.1 |
| Emails | Resend API | 6.9.1 |
| Runtime | Node.js | 18+ |

---

## Structure des dossiers

```
yassine/
├── app/                          # Routes Next.js (App Router)
│   ├── (admin)/                  # Groupe de layout - Admin
│   │   └── admin/
│   │       ├── dashboard/        # Tableau de bord admin
│   │       ├── demandes/         # Gestion des demandes (CRUD)
│   │       └── students/         # Gestion des étudiants
│   ├── (student)/                # Groupe de layout - Étudiant
│   │   └── demandes/             # Interface étudiant (CRU)
│   ├── api/                      # Routes API
│   │   ├── auth/[...nextauth]/   # Configuration NextAuth
│   │   ├── demandes/             # CRUD demandes
│   │   └── admin/students/       # Gestion étudiants
│   ├── actions/                  # Server Actions
│   │   └── demandes.ts           # Actions CRUD pour demandes
│   ├── auth/                     # Pages d'authentification
│   ├── globals.css               # Styles Tailwind
│   ├── layout.tsx                # Layout racine
│   └── page.tsx                  # Page d'accueil
├── components/
│   ├── admin/                    # Composants admin spécifiques
│   ├── demandes/                 # Composants demandes
│   ├── student/                  # Composants étudiant
│   ├── ui/                       # Composants UI réutilisables (shadcn)
│   └── skeletons/                # États de chargement
├── lib/
│   ├── api/                      # Utilitaires API
│   ├── auth/                     # Configuration NextAuth
│   ├── db/                       # Base de données
│   │   ├── mongodb.ts            # Connexion MongoDB
│   │   └── models/               # Modèles Mongoose
│   ├── email/                    # Service d'emails
│   ├── validators/               # Schémas Zod
│   ├── workflow/                 # Machine à états
│   └── utils.ts                  # Utilitaires (cn, etc.)
├── types/                        # Types TypeScript
├── scripts/                      # Scripts utilitaires
│   ├── seed-data.ts              # Seeding de la BDD
│   └── test-crud.ts              # Tests CRUD
└── middleware.ts                 # Protection des routes
```

---

## Commandes de build et développement

```bash
# Installation des dépendances
npm install

# Développement (avec Turbopack)
npm run dev

# Build production
npm run build

# Démarrage production
npm start

# Linting
npm run lint

# Scripts utilitaires
npx tsx scripts/seed-data.ts      # Seeder la base de données
npx tsx scripts/test-crud.ts      # Tests CRUD
```

---

## Variables d'environnement

Créer un fichier `.env.local` à la racine:

```env
# Base de données (obligatoire)
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/yassine?retryWrites=true&w=majority

# Authentification NextAuth (obligatoire)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-min-32-chars

# Email Resend (optionnel mais recommandé)
RESEND_API_KEY=re_your_api_key
EMAIL_FROM=noreply@yourdomain.com
```

---

## Conventions de code

### Général

- **Langue** : Tout le projet est en français (interface, emails, commentaires)
- **TypeScript strict** : Toujours typer les fonctions et les props
- **Imports** : Utiliser les alias `@/` pour les imports internes
- **Exports** : Préférer les exports nommés pour les modules

### Nommage

```typescript
// Types/Interfaces : PascalCase
interface IDemande { }
type UserRole = 'STUDENT' | 'ADMIN';

// Variables/Fonctions : camelCase (français)
const numeroDemande = 'DEM-2026-000001';
function getStatutLabel() { }

// Composants React : PascalCase
function DemandeCard() { }

// Constantes : UPPER_SNAKE_CASE
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Enums : PascalCase pour le type, UPPER pour les valeurs
type DemandeStatus = 'SOUMIS' | 'RECU' | 'EN_COURS';
```

### Organisation des imports

```typescript
// 1. Imports React/Next
import React from 'react';
import { NextRequest } from 'next/server';

// 2. Imports librairies externes
import { z } from 'zod';
import { getServerSession } from 'next-auth';

// 3. Imports internes (@/)
import { authOptions } from '@/lib/auth/auth-options';
import { Demande } from '@/lib/db/models';
import type { IDemande } from '@/types/database';
```

### Composants React

```typescript
// Utiliser les Server Components par défaut
// N'utiliser 'use client' que si nécessaire (hooks, browser APIs)

// Pattern pour les composants UI (shadcn)
interface ButtonProps extends React.ComponentProps<'button'> {
  variant?: 'default' | 'destructive' | 'outline';
}

function Button({ className, variant = 'default', ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant }), className)}
      {...props}
    />
  );
}
```

### API Routes

```typescript
// Toujours utiliser le pattern suivant
import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api/error-handler';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    // ... logic
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleApiError(error);
  }
}
```

---

## Modèles de données (Mongoose)

### Demande (Request)

```typescript
interface IDemande {
  numeroDemande: string;        // Format: DEM-YYYY-NNNNNN
  etudiant: EtudiantRef;        // Info étudiant (embedded)
  typeDemande: TypeDemandeInfo; // Type + délai
  statut: StatutInfo;           // Code + libellé + couleur
  objet: string;                // Titre de la demande
  description: string;          // Description détaillée
  priorite: 'BASSE' | 'NORMALE' | 'HAUTE' | 'URGENTE';
  documents: DocumentInfo[];    // Pièces jointes
  commentaireAdmin?: string;    // Commentaire interne
  motifRefus?: string;          // Si rejetée
  dateTraitement?: Date;        // Date de fin
  traiteParId?: ObjectId;       // Admin qui a traité
  actif: boolean;               // Soft delete
}
```

### Workflow des statuts

```
SOUMIS → RECU → EN_COURS → ATTENTE_INFO → EN_COURS
                              ↓
                           VALIDE → TRAITE → ARCHIVE
                              ↓
                           REJETE → ARCHIVE
```

| Statut | Couleur | Final |
|--------|---------|-------|
| SOUMIS | #6B7280 | Non |
| RECU | #3B82F6 | Non |
| EN_COURS | #F59E0B | Non |
| ATTENTE_INFO | #F59E0B | Non |
| VALIDE | #10B981 | Non |
| REJETE | #EF4444 | Oui |
| TRAITE | #059669 | Oui |
| ARCHIVE | #6B7280 | Oui |

---

## Authentification et Autorisation

### Rôles

- `STUDENT` : Peut créer et voir ses propres demandes
- `ADMIN` : Peut gérer toutes les demandes, changer les statuts
- `SUPER_ADMIN` : Accès complet + gestion des utilisateurs

### Middleware (middleware.ts)

```typescript
// Protection automatique des routes
/admin/*     → Requiert ADMIN ou SUPER_ADMIN
/demandes/*  → Requiert authentification (tout rôle)
```

### Test Accounts

```
Admin:     admin@university.edu / Admin123!
Student:   adnane.saber@university.edu / (any password)
```

---

## Workflow et Transitions

### Classe DemandeWorkflow

Localisation : `lib/workflow/state-machine.ts`

```typescript
const workflow = new DemandeWorkflow(demande, {
  userId: session.user.id,
  userRole: session.user.role,  // 'ADMIN' | 'SUPER_ADMIN' | 'SYSTEM'
  commentaire?: string,
  motifRefus?: string
});

await workflow.transition('EN_COURS');
```

### Permissions de transition

| Transition | Rôles autorisés |
|------------|-----------------|
| SOUMIS → RECU | SYSTEM (auto) |
| RECU → EN_COURS | ADMIN, SUPER_ADMIN |
| EN_COURS → VALIDE | ADMIN, SUPER_ADMIN |
| EN_COURS → REJETE | ADMIN, SUPER_ADMIN |
| EN_COURS → ATTENTE_INFO | ADMIN, SUPER_ADMIN |
| ATTENTE_INFO → EN_COURS | STUDENT, ADMIN, SUPER_ADMIN |

### Auto-transitions

- **SOUMIS → RECU** : Automatique à la création
- **VALIDE → TRAITE** : Automatique après 100ms (simulation traitement)

---

## Service d'emails

### Templates disponibles

Localisation : `lib/email/templates/`

- `demande-recue.ts` - Demande reçue
- `demande-en-cours.ts` - En cours de traitement
- `demande-validee.ts` - Demande validée
- `demande-traitee.ts` - Demande traitée
- `demande-rejetee.ts` - Demande rejetée
- `demande-attente-info.ts` - Information requise

### Envoi d'email

```typescript
import { sendDemandeStatusEmail } from '@/lib/email';

const result = await sendDemandeStatusEmail(demande);
// result.success: boolean
// result.error?: string
```

---

## Validation (Zod)

Localisation : `lib/validators/demande.ts`

### Schémas principaux

```typescript
// Création de demande
const createDemandeSchema = z.object({
  typeDemande: TypeDemandeEnum,
  objet: z.string().min(5).max(255),
  description: z.string().min(10).max(2000),
  priorite: PrioriteEnum.default('NORMALE')
});

// Transition de statut
const transitionDemandeSchema = z.object({
  newStatut: StatutTransitionEnum,
  commentaire: z.string().min(10).max(1000).optional(),
  motifRefus: z.string().min(20).max(500).optional()
}).refine(
  data => !(data.newStatut === 'REJETE' && !data.motifRefus),
  { message: 'Motif de refus requis', path: ['motifRefus'] }
);
```

---

## Gestion des erreurs

### Codes d'erreur standard

| Code | Description |
|------|-------------|
| `AUTH_001` | Non authentifié |
| `AUTH_002` | Action non autorisée pour ce rôle |
| `AUTH_003` | Permissions insuffisantes |
| `VAL_001` | Erreur de validation (Zod) |
| `RES_001` | Ressource non trouvée |
| `RES_002` | Ressource déjà existante (duplicate) |
| `WF_001` | Transition de workflow invalide |
| `WF_002` | Validation métier échouée |
| `WF_003` | Permissions de transition insuffisantes |
| `SRV_001` | Erreur serveur interne |

### Utilisation

```typescript
import { handleApiError } from '@/lib/api/error-handler';

// Dans les API routes
try {
  // ... logic
} catch (error) {
  return handleApiError(error);
}

// Dans les Server Actions
return {
  success: false,
  error: { code: 'AUTH_001', message: 'Non authentifié' }
};
```

---

## Tests

### Tests CRUD automatisés

```bash
npx tsx scripts/test-crud.ts
```

Tests couverts :
1. Création avec `numeroDemande` auto-généré
2. Lecture par ID
3. Mise à jour des champs
4. Suppression douce (soft delete)
5. Transitions de workflow
6. Journal d'historique
7. Filtrage et pagination

### Page de test manuel

URL : `http://localhost:3000/test-create`

Permet de tester la création de demande avec affichage des réponses JSON.

---

## Points critiques à connaître

### ⚠️ Génération du numeroDemande

**IMPORTANT** : Pour déclencher le hook `pre-save` qui génère le `numeroDemande` :

```typescript
// ✅ CORRECT - Déclenche pre-save
const demande = new Demande({ ... });
await demande.save();

// ❌ INCORRECT - Ne déclenche pas pre-save
const demande = await Demande.create({ ... });
```

### ⚠️ Connexion MongoDB

La connexion utilise un pattern de cache pour l'environnement serverless :

```typescript
import connectDB from '@/lib/db/mongodb';

// Toujours appeler au début des fonctions
await connectDB();
```

### ⚠️ Hydratation React

Pour éviter les erreurs d'hydratation avec les dates :

```typescript
// Utiliser useEffect pour formater les dates côté client
const [formattedDate, setFormattedDate] = useState('');
useEffect(() => {
  setFormattedDate(new Date(date).toLocaleDateString('fr-FR'));
}, [date]);
```

### ⚠️ SYSTEM user

Le workflow utilise `'SYSTEM'` comme userId pour les auto-transitions. Cela évite les erreurs de cast ObjectId dans l'historique.

---

## Scripts utiles

### Seeder la base de données

```bash
npx tsx scripts/seed-data.ts
```

Crée :
- 1 admin (admin@university.edu / Admin123!)
- 2 étudiants de test
- 2 demandes d'exemple

### Migration (exemple)

```bash
npx tsx scripts/migrate-add-actif.ts
```

Ajoute le champ `actif` aux documents existants.

---

## Déploiement

### Vercel (recommandé)

1. Configurer les variables d'environnement dans le dashboard
2. Build Command : `npm run build`
3. Output Directory : `.next`

### Notes importantes

- ESLint warnings sont ignorés en production (`next.config.ts`)
- MongoDB connection pooling est configuré pour serverless
- Les images sont optimisées automatiquement par Next.js

---

## Ressources externes

- [Documentation Next.js](https://nextjs.org/docs)
- [Documentation Mongoose](https://mongoosejs.com/docs/)
- [Documentation NextAuth](https://next-auth.js.org/)
- [Documentation shadcn/ui](https://ui.shadcn.com/)
- [Documentation Resend](https://resend.com/docs)

---

## Fichiers de documentation

- `README.md` - Vue d'ensemble et guide d'installation
- `USER_GUIDE.md` - Guide utilisateur détaillé (parcours étudiant/admin)
- `CRUD_FIXES.md` - Historique des corrections CRUD
- `PROJECT_OVERVIEW.md` - Vue d'ensemble simplifiée du projet

---

**Dernière mise à jour** : Février 2026
**Version** : 0.1.0
