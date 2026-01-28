# TypeScript Type Definitions

## Type vs Interface

**Rule:** Use `type` for primitives, unions, and compositions. Use `interface` for object shapes that may be extended.

```typescript
// ✅ Good - Type for unions
type DemandeStatus = 'SOUMIS' | 'RECU' | 'EN_COURS' | 'ATTENTE_INFO' | 'VALIDE' | 'REJETE' | 'TRAITE' | 'ARCHIVE';
type Priorite = 'BASSE' | 'NORMALE' | 'HAUTE' | 'URGENTE';
type UserRole = 'STUDENT' | 'ADMIN' | 'SUPER_ADMIN';

// ✅ Good - Interface for extensible objects
interface Demande {
  _id: string;
  numeroDemande: string;
  etudiant: EtudiantRef;
  statut: StatutInfo;
  createdAt: Date;
}

// ✅ Good - Type for intersection/composition
type DemandeWithHistory = Demande & {
  historiques: Historique[];
};

// ❌ Bad - Interface for simple unions
interface Status {
  value: 'ACTIVE' | 'INACTIVE';
}
```

**Why:** Types are more flexible for unions/intersections. Interfaces are better for extensibility and declaration merging.

## String Literal Unions for Enums

**Rule:** Use string literal union types instead of TypeScript enums for constants.

```typescript
// ✅ Good - String literal unions
type DemandeStatus = 'SOUMIS' | 'RECU' | 'EN_COURS' | 'ATTENTE_INFO';

const transitions: Record<DemandeStatus, DemandeStatus[]> = {
  SOUMIS: ['RECU'],
  RECU: ['EN_COURS', 'REJETE'],
  EN_COURS: ['ATTENTE_INFO', 'VALIDE'],
  ATTENTE_INFO: ['EN_COURS', 'REJETE']
};

// ✅ Good - With const object for runtime values
const DEMANDE_STATUS = {
  SOUMIS: 'SOUMIS',
  RECU: 'RECU',
  EN_COURS: 'EN_COURS'
} as const;

type DemandeStatus = typeof DEMANDE_STATUS[keyof typeof DEMANDE_STATUS];

// ❌ Bad - TypeScript enum
enum DemandeStatus {
  SOUMIS = 'SOUMIS',
  RECU = 'RECU'
}
```

**Why:** String literals are simpler, have no runtime overhead, work better with JSON, and avoid enum pitfalls.

## API Response Generic Types

**Rule:** Use discriminated union types for API responses with generic data payload.

```typescript
// ✅ Good - Generic success response
interface SuccessResponse<T> {
  success: true;
  data: T;
}

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

// Usage
type DemandeResponse = ApiResponse<Demande>;
type DemandesResponse = ApiResponse<Demande[]>;

// ✅ Good - Type guards for narrowing
function isSuccessResponse<T>(response: ApiResponse<T>): response is SuccessResponse<T> {
  return response.success === true;
}

// Client code
const response = await fetchDemande(id);
if (isSuccessResponse(response)) {
  console.log(response.data.numeroDemande); // TypeScript knows this is safe
}

// ❌ Bad - Non-discriminated union
type ApiResponse<T> = {
  data?: T;
  error?: string;
};
```

**Why:** Discriminated unions enable type narrowing, prevent invalid states, and work perfectly with TypeScript's control flow analysis.

## Collection Response with Pagination

**Rule:** Use consistent generic type for paginated collections.

```typescript
// ✅ Good - Generic collection response
interface CollectionResponse<T> {
  success: true;
  data: T[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

type ApiCollectionResponse<T> = CollectionResponse<T> | ErrorResponse;

// Usage
type DemandesListResponse = ApiCollectionResponse<Demande>;
```

**Why:** Consistent pagination structure across all list endpoints, reusable generic type.

## Zod Schema to TypeScript Inference

**Rule:** Define Zod schemas first, then infer TypeScript types from schemas.

```typescript
// ✅ Good - Schema first, type inferred
import { z } from 'zod';

const demandeCreateSchema = z.object({
  typeDemande: z.string().min(1, 'Type requis'),
  objet: z.string().min(10, 'Minimum 10 caractères').max(255),
  description: z.string().min(20, 'Minimum 20 caractères'),
  priorite: z.enum(['BASSE', 'NORMALE', 'HAUTE', 'URGENTE']),
  documents: z.array(z.instanceof(File)).min(1, 'Au moins un document')
});

// Infer TypeScript type from Zod schema
type DemandeCreateInput = z.infer<typeof demandeCreateSchema>;

// ✅ Good - Partial schema for updates
const demandeUpdateSchema = demandeCreateSchema.partial();
type DemandeUpdateInput = z.infer<typeof demandeUpdateSchema>;

// ❌ Bad - Duplicating types
type DemandeCreateInput = {
  typeDemande: string;
  objet: string;
  // ... duplicating validation logic
};

const demandeCreateSchema = z.object({
  typeDemande: z.string().min(1),
  // ... duplicating structure
});
```

**Why:** Single source of truth, validation and types stay in sync, no duplication.

## Mongoose Model Typing

**Rule:** Define TypeScript interfaces for documents, then use with Mongoose schemas.

```typescript
// ✅ Good - Interface first, then Mongoose schema
import { Document, Schema, model } from 'mongoose';

// TypeScript interface for the document
interface IDemande {
  numeroDemande: string;
  etudiant: {
    id: Types.ObjectId;
    nom: string;
    prenom: string;
    email: string;
  };
  statut: {
    code: DemandeStatus;
    libelle: string;
    couleur: string;
  };
  objet: string;
  description: string;
  priorite: Priorite;
  documents: IDocument[];
  createdAt: Date;
  updatedAt: Date;
}

// Mongoose document type (includes Document methods)
interface IDemandeDocument extends IDemande, Document {}

// Mongoose schema
const demandeSchema = new Schema<IDemandeDocument>({
  numeroDemande: { type: String, required: true, unique: true },
  etudiant: {
    id: { type: Schema.Types.ObjectId, ref: 'Etudiant', required: true },
    nom: { type: String, required: true },
    prenom: { type: String, required: true },
    email: { type: String, required: true }
  },
  statut: {
    code: { type: String, enum: ['SOUMIS', 'RECU', 'EN_COURS'], required: true },
    libelle: { type: String, required: true },
    couleur: { type: String }
  }
  // ... other fields
}, { timestamps: true });

// Export typed model
export const Demande = model<IDemandeDocument>('Demande', demandeSchema);

// ❌ Bad - Untyped Mongoose schema
const demandeSchema = new Schema({
  numeroDemande: String,
  // ... no types
});
```

**Why:** Type safety for database operations, autocomplete in IDE, catch errors at compile time.

## Utility Types

**Rule:** Use TypeScript utility types for type transformations.

```typescript
// ✅ Good - Utility types for variations
interface Demande {
  _id: string;
  numeroDemande: string;
  etudiant: EtudiantRef;
  statut: StatutInfo;
  objet: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

// Pick specific fields for list view
type DemandeListItem = Pick<Demande, '_id' | 'numeroDemande' | 'etudiant' | 'statut' | 'createdAt'>;

// Partial for updates
type DemandeUpdateInput = Partial<Omit<Demande, '_id' | 'createdAt' | 'updatedAt'>>;

// Omit sensitive fields for public API
type DemandePublic = Omit<Demande, 'internalNotes'>;

// Required subset
type DemandeRequired = Required<Pick<Demande, 'numeroDemande' | 'statut'>>;

// ✅ Good - Custom utility types
type WithTimestamps = {
  createdAt: Date;
  updatedAt: Date;
};

type WithId = {
  _id: string;
};

type MongoDocument<T> = T & WithId & WithTimestamps;

// Usage
type DemandeDocument = MongoDocument<IDemande>;

// ❌ Bad - Manual duplication
type DemandeListItem = {
  _id: string;
  numeroDemande: string;
  // ... duplicating fields manually
};
```

**Why:** DRY principle, maintainability, automatic updates when source type changes.

## Server Action Types

**Rule:** Use discriminated unions for Server Action return types.

```typescript
// ✅ Good - Discriminated union for actions
type ActionResponse<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string; details?: unknown } };

export async function createDemande(
  formData: FormData
): Promise<ActionResponse<Demande>> {
  try {
    const validated = demandeCreateSchema.parse(Object.fromEntries(formData));
    const demande = await db.demande.create(validated);

    return { success: true, data: demande };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: {
          code: 'VAL_001',
          message: 'Validation échouée',
          details: error.flatten()
        }
      };
    }

    return {
      success: false,
      error: { code: 'SRV_001', message: 'Erreur serveur' }
    };
  }
}

// Client usage
const result = await createDemande(formData);
if (result.success) {
  router.push(`/demandes/${result.data._id}`);
} else {
  toast.error(result.error.message);
}
```

**Why:** Type-safe error handling, consistent pattern across all Server Actions.

## Avoid Any and Unknown

**Rule:** Prefer `unknown` over `any`. Only use `any` as last resort.

```typescript
// ✅ Good - Unknown requires type checking
function processError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Erreur inconnue';
}

// ✅ Good - Type guard for unknown
function isDemandeStatus(value: unknown): value is DemandeStatus {
  return typeof value === 'string' &&
    ['SOUMIS', 'RECU', 'EN_COURS'].includes(value);
}

// ❌ Bad - Any bypasses type checking
function processError(error: any): string {
  return error.message; // No type safety
}

// ⚠️ Acceptable - Third-party untyped API
interface ExternalApiResponse {
  data: any; // External API has no types
}
```

**Why:** `unknown` forces type checking before use, maintains type safety, catches errors at compile time.
