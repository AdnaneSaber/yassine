# Core Request Management - Relevant Standards

This document references all applicable standards from `/agent-os/standards/` for the Core Request Management System implementation.

## API Standards

### Endpoint Conventions
**Standard**: `/agent-os/standards/api/endpoint-conventions.md`

**Key Points for This Feature**:
- Use RESTful resource naming: `/api/demandes`, `/api/etudiants`
- Standard CRUD: GET (list), POST (create), PATCH (update), DELETE (remove)
- Nested routes for relationships: `/api/demandes/{id}/historique`
- Query parameters for filtering: `?statut=EN_COURS&priorite=HAUTE`
- Pagination: `?page=1&limit=20`
- Sorting: `?sortBy=-createdAt`

**Applies To**:
- `app/api/demandes/route.ts` - List and create demandes
- `app/api/demandes/[id]/route.ts` - Get, update, delete demande
- `app/api/demandes/[id]/transition/route.ts` - Workflow transitions
- `app/api/upload/route.ts` - File upload endpoint

### Error Handling
**Standard**: `/agent-os/standards/api/error-handling.md`

**Key Points for This Feature**:
- Error code pattern: `{CATEGORY}_{NUMBER}` (AUTH_001, VAL_001, WF_001)
- Validation errors: VAL_001 with Zod error details
- Workflow errors: WF_001 for invalid transitions
- Resource errors: RES_001 for not found
- HTTP status mapping: 400 (validation), 404 (not found), 422 (workflow)

**Applies To**:
- All API routes error handling
- Server Actions error responses
- Workflow transition validation
- Form submission errors

### Response Format
**Standard**: `/agent-os/standards/api/response-format.md`

**Key Points for This Feature**:
```typescript
// Success response
{ success: true, data: T }

// Error response
{ success: false, error: { code: string, message: string, details?: unknown } }

// Collection response
{ success: true, data: T[], pagination: {...} }
```

**Applies To**:
- All API route responses
- Server Action return types
- Client-side API consumption
- Type definitions in `/types/api.ts`

## Database Standards

### MongoDB Naming Conventions
**Standard**: `/agent-os/standards/database/mongodb-naming-conventions.md`

**Key Points for This Feature**:
- Collections: lowercase plural French (demandes, etudiants, utilisateurs)
- Fields: camelCase with no accents (numeroDemande, dateNaissance)
- ObjectId refs: suffix with Id (demandeId, etudiantId)
- Booleans: no prefix (actif, urgent)
- Enums: SCREAMING_SNAKE_CASE (SOUMIS, EN_COURS, REJETE)

**Applies To**:
- All Mongoose schemas in `/lib/db/models/`
- Database queries throughout application
- Type definitions for documents

### MongoDB Schema Patterns
**Standard**: `/agent-os/standards/database/mongodb-schema-patterns.md`

**Key Points for This Feature**:
- Always use timestamps: `{ timestamps: true }`
- Embedded subdocuments for grouped data (etudiant, statut)
- Code + Label pattern for status fields
- Flexible metadata with Mixed type
- Pre-save middleware for auto-generated fields (numeroDemande)
- Schema validation at database level

**Applies To**:
- `lib/db/models/demande.ts` - Demande schema
- `lib/db/models/etudiant.ts` - Etudiant schema
- `lib/db/models/historique.ts` - Historique schema
- `lib/db/models/utilisateur.ts` - Utilisateur schema

### MongoDB References
**Standard**: `/agent-os/standards/database/mongodb-references.md`

**Key Points for This Feature**:
- Denormalize frequently accessed data (student name in demandes)
- Store reference ID + essential fields
- Index denormalized fields for queries
- Document update propagation strategy
- Use population sparingly (detailed views only)

**Applies To**:
- Demande schema: embedded student reference
- Historique schema: denormalized numeroDemande
- Query optimization throughout app

## Workflow Standards

### State Machine Patterns
**Standard**: `/agent-os/standards/workflow/state-machine-patterns.md`

**Key Points for This Feature**:
- Status codes: UPPER_SNAKE_CASE (SOUMIS, RECU, EN_COURS, VALIDE)
- Status metadata: code, libelle, couleur, estFinal
- Workflow class pattern with transition() method
- Transition hooks: onBeforeTransition, onAfterTransition
- Auto-transitions documented (SOUMIS → RECU, VALIDE → TRAITE)

**Applies To**:
- `lib/workflow/state-machine.ts` - Core workflow engine
- `lib/workflow/rules.ts` - Transition rules
- Server Actions for status updates
- API endpoints for workflow operations

### Status Transitions
**Standard**: `/agent-os/standards/workflow/status-transitions.md`

**Key Points for This Feature**:
```typescript
WORKFLOW_TRANSITIONS: {
  SOUMIS: ['RECU'],
  RECU: ['EN_COURS', 'REJETE'],
  EN_COURS: ['ATTENTE_INFO', 'VALIDE', 'REJETE'],
  ATTENTE_INFO: ['EN_COURS', 'REJETE'],
  VALIDE: ['TRAITE'],
  REJETE: ['ARCHIVE'],
  TRAITE: ['ARCHIVE'],
  ARCHIVE: []
}
```
- canTransition() validation function
- Transition context requirements (motifRefus for REJETE)
- Actor-based permissions (ADMIN, STUDENT, SYSTEM)
- Terminal states: REJETE, TRAITE, ARCHIVE

**Applies To**:
- Workflow validation logic
- UI transition buttons (enable/disable)
- Permission checking middleware
- Status change endpoints

### Workflow Validation
**Standard**: `/agent-os/standards/workflow/workflow-validation.md`

**Key Points for This Feature**:
- Pre-transition validation: path, required fields, permissions
- Required fields by status (motifRefus for REJETE)
- Role-based permission checking
- Business rule validation (documents required for VALIDE)
- Concurrent modification detection with version field

**Applies To**:
- Workflow transition validation
- Form submission validation
- Admin status change UI
- API route authorization

## TypeScript Standards

### Naming Conventions
**Standard**: `/agent-os/standards/typescript/naming-conventions.md`

**Key Points for This Feature**:
- Types/Interfaces: PascalCase, no I prefix (Demande, not IDemande)
- Type suffixes: DemandeCreateInput, DemandeUpdateInput, DemandeResponse
- Mongoose documents: Exception - use IDemande, IDemandeDocument
- Enum values: SCREAMING_SNAKE_CASE (SOUMIS, EN_COURS)
- Constants: SCREAMING_SNAKE_CASE (DEMANDE_STATUS, WORKFLOW_TRANSITIONS)

**Applies To**:
- All TypeScript types in `/types/`
- Mongoose model interfaces
- Component prop interfaces
- Enum and constant definitions

### Type Definitions
**Standard**: `/agent-os/standards/typescript/type-definitions.md`

**Key Points for This Feature**:
- Use `type` for unions, `interface` for objects
- String literal unions instead of enums
- Discriminated unions for API responses
- Zod schema first, infer TypeScript types
- Mongoose model typing with interfaces
- Avoid `any`, prefer `unknown`

**Applies To**:
- API response types
- Validation schemas with Zod
- Database model types
- Component prop types

### Type Organization
**Standard**: `/agent-os/standards/typescript/type-organization.md`

**Key Points for This Feature**:
- Colocate types with features when possible
- Shared types in `/types/` directory
- One file per domain (demande.ts, workflow.ts, api.ts)
- Export types for reuse across modules

**Applies To**:
- `/types/demande.ts` - Demande types
- `/types/workflow.ts` - Workflow types
- `/types/api.ts` - API types
- `/types/database.ts` - DB types

## Naming Standards

### Domain Terminology
**Standard**: `/agent-os/standards/naming/domain-terminology.md`

**Key Points for This Feature**:
- Core entities: demande, étudiant, utilisateur, historique
- Status values: SOUMIS, RECU, EN_COURS, ATTENTE_INFO, VALIDE, REJETE, TRAITE, ARCHIVE
- Document types: ATTESTATION_SCOLARITE, RELEVE_NOTES, DUPLICATA_CARTE
- Priority levels: BASSE, NORMALE, HAUTE, URGENTE
- French field terms: numeroDemande, dateNaissance, motifRefus

**Applies To**:
- All database schemas
- All API endpoints
- All UI components
- All documentation

### French Naming Patterns
**Standard**: `/agent-os/standards/naming/french-naming-patterns.md`

**Key Points for This Feature**:
- NO ACCENTS in code (étudiant → etudiant)
- camelCase for fields (numeroDemande, niveauEtude)
- UPPER_SNAKE_CASE for constants (SOUMIS, EN_COURS)
- Preserve accents in UI strings ("Reçu", "Traité")
- Auto-generated IDs: DEM-YYYY-NNNNNN format

**Applies To**:
- All variable and field naming
- Database collection names
- API endpoint paths
- UI display strings

## Project Structure Standards

### Next.js App Router Structure
**Standard**: `/agent-os/standards/project-structure/nextjs-app-router-structure.md`

**Key Points for This Feature**:
```
app/
├── (student)/              # Student route group
│   ├── dashboard/
│   ├── demandes/
│   │   ├── page.tsx       # List
│   │   ├── new/page.tsx   # Create
│   │   └── [id]/page.tsx  # Detail
│   └── layout.tsx
├── (admin)/                # Admin route group
│   └── admin/
│       ├── dashboard/
│       └── demandes/
├── api/demandes/           # API routes
├── actions/demandes.ts     # Server Actions
└── lib/db/models/          # Database models
```

**Applies To**:
- All route organization
- Layout components
- API route structure
- Server Actions location

### Component Organization
**Standard**: `/agent-os/standards/project-structure/component-organization.md`

**Key Points for This Feature**:
```
components/
├── ui/                     # Generic primitives
├── forms/                  # Shared form components
├── layout/                 # App layout
└── demandes/               # Demande feature components
    ├── demande-form.tsx
    ├── demande-card.tsx
    ├── demande-list.tsx
    └── status-badge.tsx
```
- Server Components by default
- 'use client' only when needed
- One component per file
- Named exports (not default)

**Applies To**:
- All React components
- Component file organization
- Import/export patterns
- Feature component grouping

### File Naming
**Standard**: `/agent-os/standards/project-structure/file-naming.md`

**Key Points for This Feature**:
- kebab-case for files: `demande-form.tsx`, `status-badge.tsx`
- Match domain terms: `demandes/`, not `requests/`
- Route files: `page.tsx`, `layout.tsx`, `route.ts`
- Model files: `demande.ts`, `etudiant.ts`

**Applies To**:
- All file naming across project
- Component files
- Route files
- Model files

## Implementation Priority

### Phase 1: Foundation (Critical)
- Database models and schemas
- Workflow state machine
- Core API endpoints

### Phase 2: Student Features
- Request submission form
- My requests list
- Request detail view

### Phase 3: Admin Features
- Admin dashboard
- Request processing UI
- Status management

### Phase 4: Supporting Features
- Email notifications
- File upload/download
- Audit trail display

## Testing Requirements

All implementations must follow these testing standards:

1. **Unit Tests**: State machine logic, validation functions
2. **Integration Tests**: API endpoints, Server Actions
3. **E2E Tests**: Key user flows (submit request, process request)
4. **Type Safety**: All TypeScript types must be strict
5. **Error Handling**: All error cases must be tested

## References

For detailed implementation patterns and examples, refer to the full standards documents in:
- `/agent-os/standards/api/`
- `/agent-os/standards/database/`
- `/agent-os/standards/workflow/`
- `/agent-os/standards/typescript/`
- `/agent-os/standards/naming/`
- `/agent-os/standards/project-structure/`
