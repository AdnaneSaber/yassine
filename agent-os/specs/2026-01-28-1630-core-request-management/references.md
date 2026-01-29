# Core Request Management - Reference Implementations

This document provides reference implementations, patterns, and examples for the Core Request Management System.

## Product Documentation References

### Mission and Context
**Document**: `/agent-os/product/mission.md`

**Relevance**:
- Problem definition: Manual and fragmented administrative processes
- Target users: Students (submit/track) and Administrative staff (process)
- Solution approach: Automated workflows with complete traceability
- Key features: Intelligent automation, complete audit trail, real-time dashboards

**Application to This Feature**:
- Core feature addresses primary pain points
- Must provide complete traceability (historique)
- Real-time status visibility for students
- Workflow automation reduces manual workload

### Technical Architecture
**Document**: `/agent-os/product/architecture.md`

**Relevance**:
- Architecture pattern: 3-tier with presentation, business logic, data layers
- Tech stack: React 18, TypeScript, Node.js, MongoDB
- Workflow engine: State machine with rules and transitions
- File storage: Cloud-based (Cloudinary)
- Email service: Queue-based with Bull/BullMQ

**Application to This Feature**:
```
Frontend (Next.js)
└── Server Components (data fetching)
    └── Client Components (interactivity)
        
Backend (Next.js API + Server Actions)
└── Workflow Engine (state machine)
    └── Services Layer (business logic)
        └── Database (MongoDB with Mongoose)
```

### Database Schema
**Document**: `/agent-os/product/database-schema-mongodb.md`

**Complete Schema Reference**:

#### Demande Collection
```typescript
{
  _id: ObjectId,
  numeroDemande: "DEM-2024-000042",
  etudiant: {
    id: ObjectId,
    nom: "SABER",
    prenom: "Adnane",
    email: "adnane.saber@university.edu",
    matricule: "2024001"
  },
  typeDemande: {
    code: "ATTESTATION_SCOLARITE",
    nom: "Attestation de scolarité",
    delaiTraitement: 3
  },
  statut: {
    code: "EN_COURS",
    libelle: "En cours de traitement",
    couleur: "#F59E0B"
  },
  objet: "Demande d'attestation pour dossier CAF",
  description: "J'ai besoin d'une attestation...",
  priorite: "NORMALE",
  documents: [{
    id: "doc_abc123",
    nomFichier: "1705328400000_justificatif.pdf",
    nomOriginal: "justificatif_identite.pdf",
    url: "https://res.cloudinary.com/.../justificatif.pdf",
    typeMime: "application/pdf",
    taille: 245678,
    categorie: "JUSTIFICATIF",
    dateUpload: Date
  }],
  commentaireAdmin: "Vérification en cours",
  motifRefus: null,
  dateTraitement: null,
  traiteParId: ObjectId,
  metadata: {},
  createdAt: Date,
  updatedAt: Date
}
```

#### Etudiant Collection
```typescript
{
  _id: ObjectId,
  matricule: "2024001",
  nom: "SABER",
  prenom: "Adnane",
  email: "adnane.saber@university.edu",
  dateNaissance: Date,
  telephone: "+212 6XX XX XX XX",
  niveauEtude: "M2",
  filiere: "Business Intelligence & Digitalisation",
  actif: true,
  createdAt: Date,
  updatedAt: Date
}
```

#### Historique Collection
```typescript
{
  _id: ObjectId,
  demandeId: ObjectId,
  numeroDemandeRef: "DEM-2024-000042",
  statutAncien: {
    code: "RECU",
    libelle: "Reçu"
  },
  statutNouveau: {
    code: "EN_COURS",
    libelle: "En cours de traitement"
  },
  utilisateur: {
    id: ObjectId,
    nom: "Admin Scolarité",
    role: "ADMIN"
  },
  typeAction: "CHANGEMENT_STATUT",
  commentaire: "Prise en charge du dossier",
  createdAt: Date
}
```

## Workflow Reference

### State Machine Definition

From architecture documentation, the workflow follows this pattern:

```
SOUMIS (initial)
  ↓ [auto: onSubmit()]
RECU
  ├→ EN_COURS [admin: assign]
  └→ REJETE [admin: reject with motif]
      ↓
EN_COURS
  ├→ ATTENTE_INFO [admin: request info]
  ├→ VALIDE [admin: approve]
  └→ REJETE [admin: reject with motif]
      ↓
ATTENTE_INFO
  ├→ EN_COURS [student: provide info]
  └→ REJETE [admin: reject with motif]
      ↓
VALIDE
  ↓ [auto: onValidate()]
TRAITE (terminal)
  ↓ [after 6 months]
ARCHIVE (terminal)

REJETE (terminal)
  ↓ [after 6 months]
ARCHIVE (terminal)
```

### Transition Hooks

```typescript
// Auto-transition: SOUMIS → RECU
onSubmit() {
  - Send confirmation email to student
  - Create historique entry
  - Transition to RECU
}

// Auto-transition: VALIDE → TRAITE
onValidate() {
  - Generate final document (future feature)
  - Send completion email to student
  - Set dateTraitement
  - Transition to TRAITE
}

// Manual: * → REJETE
onReject(motifRefus: string) {
  - Validate motifRefus provided
  - Send rejection email with reason
  - Create historique entry
  - Transition to REJETE
}
```

## Code Pattern References

### 1. Mongoose Schema Pattern

**Based on**: `/agent-os/product/database-schema-mongodb.md`

```typescript
// lib/db/models/demande.ts
import mongoose, { Schema, Document } from 'mongoose';

interface IDemande {
  numeroDemande: string;
  etudiant: {
    id: mongoose.Types.ObjectId;
    nom: string;
    prenom: string;
    email: string;
    matricule: string;
  };
  statut: {
    code: DemandeStatus;
    libelle: string;
    couleur: string;
  };
  // ... other fields
}

interface IDemandeDocument extends IDemande, Document {}

const demandeSchema = new Schema<IDemandeDocument>({
  numeroDemande: {
    type: String,
    required: true,
    unique: true
  },
  etudiant: {
    id: {
      type: Schema.Types.ObjectId,
      ref: 'Etudiant',
      required: true
    },
    nom: { type: String, required: true },
    prenom: { type: String, required: true },
    email: { type: String, required: true },
    matricule: { type: String, required: true }
  },
  statut: {
    code: {
      type: String,
      enum: ['SOUMIS', 'RECU', 'EN_COURS', 'ATTENTE_INFO', 'VALIDE', 'REJETE', 'TRAITE', 'ARCHIVE'],
      required: true
    },
    libelle: { type: String, required: true },
    couleur: { type: String }
  },
  documents: [{
    id: String,
    nomFichier: String,
    nomOriginal: String,
    url: String,
    typeMime: String,
    taille: Number,
    categorie: String,
    dateUpload: { type: Date, default: Date.now }
  }],
  // ... other fields
}, {
  timestamps: true
});

// Auto-generate numeroDemande
demandeSchema.pre('save', async function(next) {
  if (!this.numeroDemande) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments({
      numeroDemande: new RegExp(`^DEM-${year}-`)
    });
    this.numeroDemande = `DEM-${year}-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Indexes
demandeSchema.index({ numeroDemande: 1 });
demandeSchema.index({ 'etudiant.id': 1 });
demandeSchema.index({ 'statut.code': 1 });
demandeSchema.index({ createdAt: -1 });

export const Demande = mongoose.model<IDemandeDocument>('Demande', demandeSchema);
```

### 2. Workflow Class Pattern

**Based on**: Workflow standards

```typescript
// lib/workflow/state-machine.ts
import { Demande, Historique } from '@/lib/db/models';
import { WORKFLOW_TRANSITIONS, STATUTS_META } from '@/lib/workflow/constants';

export class DemandeWorkflow {
  private demande: IDemandeDocument;
  private userId?: string;

  constructor(demande: IDemandeDocument, userId?: string) {
    this.demande = demande;
    this.userId = userId;
  }

  async transition(newStatut: DemandeStatus, context?: TransitionContext): Promise<void> {
    const currentStatut = this.demande.statut.code;

    // Validate transition path
    if (!this.canTransition(currentStatut, newStatut)) {
      throw new Error(
        `Invalid transition: ${currentStatut} → ${newStatut}. ` +
        `Allowed: ${WORKFLOW_TRANSITIONS[currentStatut].join(', ')}`
      );
    }

    // Pre-transition validation
    await this.onBeforeTransition(currentStatut, newStatut, context);

    // Update status
    this.demande.statut = {
      code: newStatut,
      ...STATUTS_META[newStatut]
    };

    await this.demande.save();

    // Create history entry
    await this.logHistorique(currentStatut, newStatut, context);

    // Post-transition actions
    await this.onAfterTransition(currentStatut, newStatut, context);
  }

  private canTransition(from: DemandeStatus, to: DemandeStatus): boolean {
    return WORKFLOW_TRANSITIONS[from]?.includes(to) ?? false;
  }

  private async onBeforeTransition(
    from: DemandeStatus,
    to: DemandeStatus,
    context?: TransitionContext
  ): Promise<void> {
    // Validate required fields
    if (to === 'REJETE' && !context?.motifRefus) {
      throw new Error('motifRefus is required when rejecting a demande');
    }

    if (to === 'VALIDE' && this.demande.documents.length === 0) {
      throw new Error('At least one document is required for validation');
    }
  }

  private async onAfterTransition(
    from: DemandeStatus,
    to: DemandeStatus,
    context?: TransitionContext
  ): Promise<void> {
    // Send notifications based on new status
    switch (to) {
      case 'RECU':
        await this.sendEmail('demande-recue');
        break;
      case 'TRAITE':
        this.demande.dateTraitement = new Date();
        await this.demande.save();
        await this.sendEmail('demande-traitee');
        break;
      case 'REJETE':
        await this.sendEmail('demande-rejetee', { motif: context?.motifRefus });
        break;
    }
  }

  private async logHistorique(
    from: DemandeStatus,
    to: DemandeStatus,
    context?: TransitionContext
  ): Promise<void> {
    await Historique.create({
      demandeId: this.demande._id,
      numeroDemandeRef: this.demande.numeroDemande,
      statutAncien: {
        code: from,
        libelle: STATUTS_META[from].libelle
      },
      statutNouveau: {
        code: to,
        libelle: STATUTS_META[to].libelle
      },
      utilisateur: this.userId ? await this.getUserInfo(this.userId) : null,
      typeAction: 'CHANGEMENT_STATUT',
      commentaire: context?.commentaire
    });
  }
}
```

### 3. API Route Pattern

**Based on**: API standards

```typescript
// app/api/demandes/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { queryDemandesSchema } from '@/lib/validators/demande';
import { handleApiError } from '@/lib/api/error-handler';
import { getDemandesList } from '@/lib/db/demandes';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = queryDemandesSchema.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      statut: searchParams.get('statut'),
      priorite: searchParams.get('priorite')
    });

    const result = await getDemandesList(query);

    return NextResponse.json({
      success: true,
      data: result.items,
      pagination: result.pagination
    });
  } catch (error) {
    return handleApiError(error);
  }
}
```

### 4. Server Action Pattern

**Based on**: API and validation standards

```typescript
// app/actions/demandes.ts
'use server';

import { revalidatePath } from 'next/cache';
import { demandeCreateSchema } from '@/lib/validators/demande';
import { DemandeWorkflow } from '@/lib/workflow/state-machine';
import { Demande } from '@/lib/db/models/demande';

export async function createDemandeAction(formData: FormData) {
  try {
    const validated = demandeCreateSchema.parse(Object.fromEntries(formData));
    
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: false,
        error: { code: 'AUTH_001', message: 'Authentication required' }
      };
    }

    // Create demande with SOUMIS status
    const demande = await Demande.create({
      ...validated,
      etudiant: {
        id: user.id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        matricule: user.matricule
      },
      statut: {
        code: 'SOUMIS',
        libelle: 'Soumis',
        couleur: '#6B7280'
      }
    });

    // Auto-transition to RECU
    const workflow = new DemandeWorkflow(demande, 'SYSTEM');
    await workflow.transition('RECU');

    revalidatePath('/demandes');

    return { success: true, data: demande };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: {
          code: 'VAL_001',
          message: 'Validation failed',
          details: error.flatten().fieldErrors
        }
      };
    }

    return {
      success: false,
      error: { code: 'SRV_001', message: 'Internal server error' }
    };
  }
}
```

### 5. React Component Pattern

**Based on**: Component organization standards

```typescript
// components/demandes/demande-card.tsx
'use client';

import { type Demande } from '@/types/demande';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils/formatters';

interface DemandeCardProps {
  demande: Demande;
  onSelect?: (id: string) => void;
}

export function DemandeCard({ demande, onSelect }: DemandeCardProps) {
  return (
    <div 
      className="rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onSelect?.(demande._id)}
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {demande.objet}
          </h3>
          <p className="text-sm text-gray-600">
            {demande.numeroDemande}
          </p>
        </div>
        <Badge 
          variant={demande.statut.code}
          style={{ backgroundColor: demande.statut.couleur }}
        >
          {demande.statut.libelle}
        </Badge>
      </div>
      
      <p className="mt-2 text-sm text-gray-700 line-clamp-2">
        {demande.description}
      </p>
      
      <div className="mt-4 flex justify-between text-xs text-gray-500">
        <span>{demande.typeDemande.nom}</span>
        <span>{formatDate(demande.createdAt)}</span>
      </div>
    </div>
  );
}
```

## External Library References

### Zod for Validation
```typescript
import { z } from 'zod';

export const demandeCreateSchema = z.object({
  typeDemande: z.string().min(1, 'Type requis'),
  objet: z.string().min(10, 'Minimum 10 caractères').max(255),
  description: z.string().min(20, 'Minimum 20 caractères'),
  priorite: z.enum(['BASSE', 'NORMALE', 'HAUTE', 'URGENTE']).default('NORMALE'),
  documents: z.array(z.instanceof(File)).min(1, 'Au moins un document requis')
});

export type DemandeCreateInput = z.infer<typeof demandeCreateSchema>;
```

### React Hook Form
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

export function DemandeForm() {
  const form = useForm({
    resolver: zodResolver(demandeCreateSchema),
    defaultValues: {
      priorite: 'NORMALE'
    }
  });

  const onSubmit = form.handleSubmit(async (data) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, value);
    });
    
    const result = await createDemandeAction(formData);
    // Handle result
  });

  return <form onSubmit={onSubmit}>...</form>;
}
```

### Mongoose Connection
```typescript
// lib/db/mongodb.ts
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI!;

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;
```

## Testing References

### Unit Test Example
```typescript
// lib/workflow/state-machine.test.ts
import { DemandeWorkflow } from './state-machine';

describe('DemandeWorkflow', () => {
  it('should allow valid transitions', async () => {
    const demande = createMockDemande({ statut: { code: 'RECU' } });
    const workflow = new DemandeWorkflow(demande);
    
    await expect(workflow.transition('EN_COURS')).resolves.not.toThrow();
  });

  it('should reject invalid transitions', async () => {
    const demande = createMockDemande({ statut: { code: 'RECU' } });
    const workflow = new DemandeWorkflow(demande);
    
    await expect(workflow.transition('TRAITE')).rejects.toThrow('Invalid transition');
  });

  it('should require motifRefus when rejecting', async () => {
    const demande = createMockDemande({ statut: { code: 'EN_COURS' } });
    const workflow = new DemandeWorkflow(demande);
    
    await expect(workflow.transition('REJETE')).rejects.toThrow('motifRefus is required');
  });
});
```

## Additional Resources

- Next.js 15 Documentation: https://nextjs.org/docs
- MongoDB Documentation: https://docs.mongodb.com/
- Mongoose Documentation: https://mongoosejs.com/docs/
- Zod Documentation: https://zod.dev/
- Tailwind CSS: https://tailwindcss.com/docs
- TypeScript Handbook: https://www.typescriptlang.org/docs/
