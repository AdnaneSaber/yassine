# TypeScript Type Organization

## Type Co-location vs Centralization

**Rule:** Co-locate feature-specific types, centralize shared types.

```typescript
// ✅ Good - Feature-specific types with component
// components/demandes/DemandeCard.tsx
interface DemandeCardProps {
  demande: Demande;
  onStatusChange?: (status: DemandeStatus) => void;
  variant?: 'compact' | 'detailed';
}

export function DemandeCard({ demande, onStatusChange, variant = 'compact' }: DemandeCardProps) {
  // Component implementation
}

// ✅ Good - Shared domain types centralized
// types/demande.ts
export interface Demande {
  _id: string;
  numeroDemande: string;
  statut: StatutInfo;
}

export type DemandeStatus = 'SOUMIS' | 'RECU' | 'EN_COURS';

// ❌ Bad - Component props in central types
// types/components.ts
export interface DemandeCardProps { /* ... */ }
export interface UserMenuProps { /* ... */ }

// ❌ Bad - Domain types scattered in components
// components/demandes/types.ts (duplicate types)
export interface Demande { /* ... */ }
```

**Why:** Co-location improves maintainability for feature-specific types. Centralization ensures single source of truth for shared domain types.

## Types Directory Structure

**Rule:** Organize types by domain in dedicated `types/` folder for Next.js App Router projects.

```typescript
// ✅ Good - Domain-based organization
types/
├── index.ts              // Re-export all types
├── demande.ts            // Demande domain types
├── etudiant.ts           // Etudiant domain types
├── user.ts               // User/auth types
├── workflow.ts           // Workflow state machine types
├── notification.ts       // Notification types
├── api.ts                // API response/request types
└── database.ts           // Mongoose document types

// types/demande.ts
export interface Demande {
  _id: string;
  numeroDemande: string;
  etudiant: EtudiantRef;
  statut: StatutInfo;
  objet: string;
  description: string;
  priorite: Priorite;
  documents: Document[];
  createdAt: Date;
  updatedAt: Date;
}

export type DemandeStatus = 'SOUMIS' | 'RECU' | 'EN_COURS' | 'ATTENTE_INFO';
export type Priorite = 'BASSE' | 'NORMALE' | 'HAUTE' | 'URGENTE';

export interface StatutInfo {
  code: DemandeStatus;
  libelle: string;
  couleur?: string;
}

export interface DemandeFilters {
  statut?: DemandeStatus;
  priorite?: Priorite;
  dateDebut?: Date;
  dateFin?: Date;
}

// types/api.ts - Shared API types
export interface SuccessResponse<T> {
  success: true;
  data: T;
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

// types/index.ts - Barrel export
export * from './demande';
export * from './etudiant';
export * from './user';
export * from './api';

// ❌ Bad - Flat structure
types/
├── Demande.ts
├── Etudiant.ts
├── User.ts
├── DemandeStatus.ts
├── DemandeFilters.ts
└── ... (many files)

// ❌ Bad - Technical organization
types/
├── interfaces/
│   └── demande.ts
├── enums/
│   └── status.ts
└── unions/
    └── priority.ts
```

**Why:** Domain-based organization matches mental model, easier to find related types, scales better as project grows.

## Mongoose Model Types Location

**Rule:** Define Mongoose document interfaces in `lib/db/models/` alongside schemas.

```typescript
// ✅ Good - Types with Mongoose schemas
// lib/db/models/demande.ts
import { Document, Schema, model, Types } from 'mongoose';

// Domain interface (pure TypeScript)
export interface IDemande {
  numeroDemande: string;
  etudiant: {
    id: Types.ObjectId;
    nom: string;
    prenom: string;
    email: string;
  };
  statut: {
    code: string;
    libelle: string;
  };
  objet: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

// Mongoose document interface
export interface IDemandeDocument extends IDemande, Document {}

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
    code: { type: String, required: true },
    libelle: { type: String, required: true }
  },
  objet: { type: String, required: true },
  description: { type: String, required: true }
}, { timestamps: true });

export const Demande = model<IDemandeDocument>('Demande', demandeSchema);

// ❌ Bad - Types separated from schema
// types/mongoose/demande.ts
export interface IDemandeDocument { /* ... */ }

// lib/db/models/demande.ts
import { IDemandeDocument } from '@/types/mongoose/demande';
const demandeSchema = new Schema<IDemandeDocument>({ /* ... */ });
```

**Why:** Co-location keeps schema and types in sync, easier maintenance, clear ownership.

## Zod Schema Location

**Rule:** Define Zod schemas in `lib/validators/` or co-located with usage.

```typescript
// ✅ Good - Centralized validators
// lib/validators/demande.ts
import { z } from 'zod';

export const demandeCreateSchema = z.object({
  typeDemande: z.string().min(1, 'Type requis'),
  objet: z.string().min(10, 'Minimum 10 caractères').max(255),
  description: z.string().min(20, 'Minimum 20 caractères'),
  priorite: z.enum(['BASSE', 'NORMALE', 'HAUTE', 'URGENTE']),
  documents: z.array(z.instanceof(File)).min(1, 'Au moins un document')
});

export const demandeUpdateSchema = demandeCreateSchema.partial();

export const demandeFiltersSchema = z.object({
  statut: z.enum(['SOUMIS', 'RECU', 'EN_COURS']).optional(),
  priorite: z.enum(['BASSE', 'NORMALE', 'HAUTE', 'URGENTE']).optional(),
  dateDebut: z.coerce.date().optional(),
  dateFin: z.coerce.date().optional()
});

// Infer types
export type DemandeCreateInput = z.infer<typeof demandeCreateSchema>;
export type DemandeUpdateInput = z.infer<typeof demandeUpdateSchema>;
export type DemandeFilters = z.infer<typeof demandeFiltersSchema>;

// ✅ Good - Co-located with Server Action
// actions/demandes.ts
import { z } from 'zod';

const createDemandeSchema = z.object({
  objet: z.string().min(10),
  description: z.string().min(20)
});

export async function createDemande(formData: FormData) {
  const validated = createDemandeSchema.parse(Object.fromEntries(formData));
  // ...
}

// ❌ Bad - Mixing Zod schemas with TypeScript types
// types/demande.ts
export interface Demande { /* ... */ }
export const demandeSchema = z.object({ /* ... */ });  // Wrong location
```

**Why:** Validators are runtime code, not types. Keep separate for clarity. Co-location with usage is acceptable for one-off schemas.

## Import Organization

**Rule:** Use path aliases, group imports by source, use barrel exports.

```typescript
// ✅ Good - Organized imports with aliases
// components/demandes/DemandeCard.tsx
import { useState } from 'react';
import { useRouter } from 'next/navigation';

import type { Demande, DemandeStatus } from '@/types/demande';
import type { ApiResponse } from '@/types/api';
import { updateDemandeStatus } from '@/actions/demandes';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { formatDate } from './utils';
import type { DemandeCardProps } from './types';

// Component implementation

// ✅ Good - Type-only imports when appropriate
import type { User } from '@/types/user';
import type { Demande } from '@/types/demande';

// ✅ Good - Barrel exports
// types/index.ts
export * from './demande';
export * from './etudiant';
export * from './user';

// Import multiple types from barrel
import type { Demande, DemandeStatus, Priorite } from '@/types';

// ❌ Bad - No path alias
import { Demande } from '../../../types/demande';
import { Button } from '../../../components/ui/button';

// ❌ Bad - Mixed grouping
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Demande } from '@/types/demande';
import { Badge } from '@/components/ui/badge';

// ❌ Bad - Individual exports instead of barrel
import { Demande } from '@/types/demande';
import { Etudiant } from '@/types/etudiant';
import { User } from '@/types/user';
```

**Why:** Path aliases prevent brittle relative paths. Grouped imports improve readability. Type-only imports enable better tree-shaking.

## Export Patterns

**Rule:** Use named exports for types. Avoid default exports for types.

```typescript
// ✅ Good - Named exports
// types/demande.ts
export interface Demande {
  _id: string;
  numeroDemande: string;
}

export type DemandeStatus = 'SOUMIS' | 'RECU' | 'EN_COURS';

export interface StatutInfo {
  code: DemandeStatus;
  libelle: string;
}

// Import with explicit names
import { Demande, DemandeStatus, StatutInfo } from '@/types/demande';

// ✅ Good - Grouped exports at bottom
// types/api.ts
interface SuccessResponse<T> {
  success: true;
  data: T;
}

interface ErrorResponse {
  success: false;
  error: ErrorInfo;
}

type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

export type { SuccessResponse, ErrorResponse, ApiResponse };

// ❌ Bad - Default export for type
// types/demande.ts
export default interface Demande {
  _id: string;
}

// Requires naming on import
import Demande from '@/types/demande';
import DemandeType from '@/types/demande';  // Naming inconsistency

// ❌ Bad - Mixed default and named exports
export default interface Demande { /* ... */ }
export type DemandeStatus = 'SOUMIS' | 'RECU';
```

**Why:** Named exports are explicit, support multiple exports per file, enable better refactoring.

## Shared vs Feature-Specific

**Rule:** Shared types go in `types/`, feature types stay with features.

```typescript
// ✅ Good - Shared domain types
// types/demande.ts
export interface Demande {
  _id: string;
  numeroDemande: string;
  statut: StatutInfo;
}

// ✅ Good - Feature-specific types
// app/(student)/demandes/new/page.tsx
interface NewDemandePageProps {
  searchParams: { type?: string };
}

interface FormState {
  isSubmitting: boolean;
  errors: Record<string, string>;
}

// components/demandes/DemandeCard.tsx
interface DemandeCardProps {
  demande: Demande;  // Using shared type
  variant: 'compact' | 'detailed';
  onStatusChange?: (status: DemandeStatus) => void;
}

// ❌ Bad - Page props in central types
// types/pages.ts
export interface NewDemandePageProps { /* ... */ }
export interface DashboardPageProps { /* ... */ }

// ❌ Bad - Duplicating shared types in features
// app/(student)/demandes/types.ts
export interface Demande { /* duplicate of shared type */ }
```

**Why:** Clear separation between shared domain logic and feature-specific concerns. Avoids circular dependencies.

## Constants and Types Together

**Rule:** Co-locate related constants with their types.

```typescript
// ✅ Good - Constants with types
// types/workflow.ts
export type DemandeStatus =
  | 'SOUMIS'
  | 'RECU'
  | 'EN_COURS'
  | 'ATTENTE_INFO'
  | 'VALIDE'
  | 'REJETE'
  | 'TRAITE'
  | 'ARCHIVE';

export const DEMANDE_STATUS = {
  SOUMIS: 'SOUMIS',
  RECU: 'RECU',
  EN_COURS: 'EN_COURS',
  ATTENTE_INFO: 'ATTENTE_INFO',
  VALIDE: 'VALIDE',
  REJETE: 'REJETE',
  TRAITE: 'TRAITE',
  ARCHIVE: 'ARCHIVE'
} as const;

export const WORKFLOW_TRANSITIONS: Record<DemandeStatus, DemandeStatus[]> = {
  SOUMIS: ['RECU'],
  RECU: ['EN_COURS', 'REJETE'],
  EN_COURS: ['ATTENTE_INFO', 'VALIDE', 'REJETE'],
  ATTENTE_INFO: ['EN_COURS', 'REJETE'],
  VALIDE: ['TRAITE'],
  REJETE: ['ARCHIVE'],
  TRAITE: ['ARCHIVE'],
  ARCHIVE: []
};

export const STATUS_COLORS: Record<DemandeStatus, string> = {
  SOUMIS: 'blue',
  RECU: 'cyan',
  EN_COURS: 'yellow',
  ATTENTE_INFO: 'orange',
  VALIDE: 'green',
  REJETE: 'red',
  TRAITE: 'green',
  ARCHIVE: 'gray'
};

// Single import gets everything related
import {
  DemandeStatus,
  DEMANDE_STATUS,
  WORKFLOW_TRANSITIONS,
  STATUS_COLORS
} from '@/types/workflow';

// ❌ Bad - Constants separated from types
// types/workflow.ts
export type DemandeStatus = 'SOUMIS' | 'RECU';

// constants/workflow.ts
export const WORKFLOW_TRANSITIONS = { /* ... */ };

// Need multiple imports
import { DemandeStatus } from '@/types/workflow';
import { WORKFLOW_TRANSITIONS } from '@/constants/workflow';
```

**Why:** Related code stays together, single import for related items, easier to maintain consistency.

## Type Re-exports

**Rule:** Use barrel exports (`index.ts`) for clean imports, but don't overuse.

```typescript
// ✅ Good - Barrel export for types directory
// types/index.ts
export * from './demande';
export * from './etudiant';
export * from './user';
export * from './workflow';
export * from './api';

// Clean import
import type { Demande, Etudiant, User, DemandeStatus } from '@/types';

// ✅ Good - Selective re-export
// components/ui/index.ts
export { Button } from './button';
export { Input } from './input';
export { Badge } from './badge';
// Don't export internal components

// ⚠️ Acceptable - Keep specific imports when needed for clarity
import type { Demande } from '@/types/demande';
import type { ApiResponse } from '@/types/api';
// More explicit about where types come from

// ❌ Bad - Too many nested barrel exports
// types/demande/index.ts
export * from './base';
export * from './filters';
export * from './mutations';
// types/index.ts
export * from './demande';
// Hard to trace where types are defined
```

**Why:** Barrel exports simplify imports but can make origin unclear. Use at top level only.
