# TypeScript Naming Conventions

## Types and Interfaces

**Rule:** Use PascalCase for type and interface names. Never prefix interfaces with 'I'.

```typescript
// ✅ Good - PascalCase, no prefix
interface Demande {
  numeroDemande: string;
  statut: StatutInfo;
}

type DemandeStatus = 'SOUMIS' | 'RECU' | 'EN_COURS';

interface User {
  email: string;
  role: UserRole;
}

// ❌ Bad - Lowercase
type demandeStatus = 'SOUMIS' | 'RECU';

// ❌ Bad - I prefix (Hungarian notation)
interface IDemande {
  numeroDemande: string;
}

// ❌ Bad - camelCase
interface demande {
  numeroDemande: string;
}
```

**Why:** PascalCase is TypeScript/JavaScript convention for types. 'I' prefix is outdated and adds no value.

## Type Suffixes

**Rule:** Use descriptive suffixes to indicate type purpose.

```typescript
// ✅ Good - Clear purpose suffixes
type DemandeCreateInput = z.infer<typeof demandeCreateSchema>;
type DemandeUpdateInput = z.infer<typeof demandeUpdateSchema>;
type DemandeResponse = ApiResponse<Demande>;
type DemandesListResponse = ApiCollectionResponse<Demande>;

interface DemandeFilters {
  statut?: DemandeStatus;
  priorite?: Priorite;
  dateDebut?: Date;
}

interface DemandeListItem {
  _id: string;
  numeroDemande: string;
  statut: StatutInfo;
}

type DemandeWithHistory = Demande & {
  historiques: Historique[];
};

// Common suffixes and their meanings:
// - Input: Data coming into API/action
// - Output: Data returned from function
// - Response: API response wrapper
// - Filters: Query/search parameters
// - ListItem: Subset for list views
// - WithX: Base type extended with X
// - Ref: Reference/denormalized data

// ❌ Bad - Unclear suffixes
type DemandeData = { /* ... */ };
type DemandeInfo = { /* ... */ };
type DemandeType = { /* ... */ };
```

**Why:** Descriptive suffixes clarify type purpose, improve code readability, prevent naming collisions.

## Mongoose Document Interfaces

**Rule:** Use 'I' prefix for Mongoose document interfaces only (exception to no-prefix rule).

```typescript
// ✅ Good - I prefix for Mongoose documents
interface IDemande {
  numeroDemande: string;
  statut: StatutInfo;
  createdAt: Date;
}

interface IDemandeDocument extends IDemande, Document {
  // Mongoose document methods available here
}

interface IEtudiant {
  matricule: string;
  nom: string;
  prenom: string;
}

interface IEtudiantDocument extends IEtudiant, Document {}

// ❌ Bad - No prefix for Mongoose documents
interface Demande {
  numeroDemande: string;
}

interface DemandeDocument extends Demande, Document {}

// ❌ Bad - I prefix for non-Mongoose types
interface IDemandeInput {
  objet: string;
}
```

**Why:** Mongoose convention for document interfaces, distinguishes schema interfaces from other types, clear indication of database model.

## Enum-like Constants

**Rule:** Use SCREAMING_SNAKE_CASE for string literal union values.

```typescript
// ✅ Good - SCREAMING_SNAKE_CASE for enum values
type DemandeStatus =
  | 'SOUMIS'
  | 'RECU'
  | 'EN_COURS'
  | 'ATTENTE_INFO'
  | 'VALIDE'
  | 'REJETE'
  | 'TRAITE'
  | 'ARCHIVE';

type Priorite = 'BASSE' | 'NORMALE' | 'HAUTE' | 'URGENTE';

type UserRole = 'STUDENT' | 'ADMIN' | 'SUPER_ADMIN';

type NotificationStatus = 'EN_ATTENTE' | 'ENVOYE' | 'ECHEC';

// ✅ Good - Const object with SCREAMING_SNAKE_CASE
const DEMANDE_STATUS = {
  SOUMIS: 'SOUMIS',
  RECU: 'RECU',
  EN_COURS: 'EN_COURS'
} as const;

// ❌ Bad - lowercase or Mixed case
type DemandeStatus = 'soumis' | 'recu' | 'en_cours';
type Priorite = 'Basse' | 'Normale' | 'Haute';
type UserRole = 'Student' | 'Admin';
```

**Why:** Constants convention, high visibility, matches MongoDB enum values, no accent issues.

## Generic Type Parameters

**Rule:** Use single uppercase letters or descriptive PascalCase names for generics.

```typescript
// ✅ Good - Single letter for simple generics
interface SuccessResponse<T> {
  success: true;
  data: T;
}

function identity<T>(value: T): T {
  return value;
}

// ✅ Good - Multiple type parameters
type ApiResponse<TData, TError = ErrorResponse> =
  | { success: true; data: TData }
  | { success: false; error: TError };

// ✅ Good - Descriptive names for complex generics
interface Repository<TEntity, TId = string> {
  findById(id: TId): Promise<TEntity | null>;
  save(entity: TEntity): Promise<TEntity>;
  delete(id: TId): Promise<void>;
}

// Common conventions:
// T - generic Type
// K - Key type
// V - Value type
// E - Element type
// TData - Data type (when T is ambiguous)
// TEntity - Entity type
// TProps - Props type (React)
// TReturn - Return type

// ❌ Bad - lowercase generic
function identity<t>(value: t): t {
  return value;
}

// ❌ Bad - unclear naming
interface Repository<x, y> {
  findById(id: y): Promise<x>;
}
```

**Why:** Standard TypeScript convention, clear and concise for simple cases, descriptive for complex scenarios.

## Type Alias vs Interface Naming

**Rule:** Both use PascalCase. Choose based on purpose, not naming.

```typescript
// ✅ Good - Type for unions
type DemandeStatus = 'SOUMIS' | 'RECU' | 'EN_COURS';

// ✅ Good - Type for intersections
type DemandeWithStats = Demande & {
  viewCount: number;
  lastViewed: Date;
};

// ✅ Good - Interface for object shapes
interface Demande {
  numeroDemande: string;
  statut: StatutInfo;
}

// ✅ Good - Interface for extensible contracts
interface Repository {
  findById(id: string): Promise<any>;
}

interface DemandeRepository extends Repository {
  findByStatus(status: DemandeStatus): Promise<Demande[]>;
}

// Don't use naming to distinguish - use based on need
// ❌ Bad - Using Type/Interface suffix
type DemandeType = {
  numeroDemande: string;
};

interface DemandeInterface {
  numeroDemande: string;
}
```

**Why:** Purpose should dictate choice (type vs interface), not naming patterns.

## Boolean Type Names

**Rule:** Use adjective or past participle form without 'is' prefix.

```typescript
// ✅ Good - Adjective without prefix
interface Etudiant {
  actif: boolean;
  inscrit: boolean;
  verified: boolean;
}

type DemandeFilters = {
  urgent?: boolean;
  archived?: boolean;
  processed?: boolean;
};

// ❌ Bad - 'is' prefix
interface Etudiant {
  isActif: boolean;
  isInscrit: boolean;
  isVerified: boolean;
}

// ⚠️ Exception - OK in type guard functions
function isDemandeStatus(value: unknown): value is DemandeStatus {
  return typeof value === 'string' && VALID_STATUSES.includes(value);
}
```

**Why:** Cleaner API, matches property access (`etudiant.actif` vs `etudiant.isActif`), consistent with MongoDB conventions.

## File Naming

**Rule:** Use kebab-case for filenames. Match type name or domain.

```typescript
// ✅ Good - File names match content
// types/demande.ts
export interface Demande { /* ... */ }
export type DemandeStatus = 'SOUMIS' | 'RECU';

// types/workflow.ts
export type WorkflowState = 'INITIAL' | 'PENDING' | 'COMPLETE';
export interface WorkflowTransition { /* ... */ }

// types/api-response.ts
export interface SuccessResponse<T> { /* ... */ }
export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

// types/user.ts
export interface User { /* ... */ }
export type UserRole = 'STUDENT' | 'ADMIN';

// ❌ Bad - Mixed naming styles
// types/Demande.ts (PascalCase file)
// types/demande_types.ts (snake_case file)
// types/demandeTypes.ts (camelCase file)
```

**Why:** Consistent with Next.js/Node.js conventions, easier to find files, better cross-platform compatibility.

## Constant Object Naming

**Rule:** Use SCREAMING_SNAKE_CASE for const objects containing constants.

```typescript
// ✅ Good - SCREAMING_SNAKE_CASE for constant objects
export const DEMANDE_STATUS = {
  SOUMIS: 'SOUMIS',
  RECU: 'RECU',
  EN_COURS: 'EN_COURS'
} as const;

export const API_ERROR_CODES = {
  VALIDATION_ERROR: 'VAL_001',
  AUTH_ERROR: 'AUTH_001',
  NOT_FOUND: 'NOT_FOUND_001'
} as const;

export const WORKFLOW_TRANSITIONS = {
  SOUMIS: ['RECU'],
  RECU: ['EN_COURS', 'REJETE']
} as const;

// ✅ Good - camelCase for regular config objects
export const apiConfig = {
  baseUrl: 'http://localhost:3000',
  timeout: 5000
};

// ❌ Bad - camelCase for constants
export const demandeStatus = {
  SOUMIS: 'SOUMIS',
  RECU: 'RECU'
} as const;

// ❌ Bad - Mixed case values
export const DEMANDE_STATUS = {
  soumis: 'soumis',
  Recu: 'Recu'
} as const;
```

**Why:** Clear indication of immutable constants, stands out in code, matches enum convention.

## Namespace Naming

**Rule:** Use PascalCase for namespaces. Avoid namespaces in favor of modules.

```typescript
// ✅ Good - Prefer modules over namespaces
// types/demande/index.ts
export interface Demande { /* ... */ }
export type DemandeStatus = 'SOUMIS' | 'RECU';
export const DEMANDE_STATUS = { /* ... */ } as const;

// Import as namespace
import * as DemandeTypes from '@/types/demande';

// ⚠️ Acceptable - Namespace for declaration merging
declare namespace Express {
  interface Request {
    user?: User;
  }
}

// ❌ Bad - Namespace instead of module
namespace Demande {
  export interface Type { /* ... */ }
  export type Status = 'SOUMIS' | 'RECU';
}
```

**Why:** ES modules are preferred, better tree-shaking, more flexible, standard JavaScript approach.

## Avoid Abbreviations

**Rule:** Use full words unless abbreviation is universally understood.

```typescript
// ✅ Good - Full words
interface DemandeRepository {
  findById(id: string): Promise<Demande | null>;
  findByStatus(status: DemandeStatus): Promise<Demande[]>;
}

type NotificationStatus = 'EN_ATTENTE' | 'ENVOYE' | 'ECHEC';

// ✅ Acceptable - Common abbreviations
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';
interface ApiConfig {
  url: string;  // Universal
  maxRetries: number;
}

// ❌ Bad - Unclear abbreviations
interface DmdRepo {
  findByNd(nd: string): Promise<Dmd>;
}

type NotifStat = 'ATT' | 'ENV' | 'ECH';
```

**Why:** Clarity over brevity, easier for new developers, reduces cognitive load, better autocomplete.
