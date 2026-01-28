# Next.js App Router Structure

## Root Directory Organization

Use App Router file-based routing with feature-based organization at the top level.

```
app/
├── (auth)/                 # Route group: authentication pages
├── (student)/              # Route group: student interface
├── (admin)/                # Route group: admin interface
├── api/                    # API routes
├── actions/                # Server Actions
├── components/             # React components
├── lib/                    # Business logic & utilities
├── types/                  # TypeScript definitions
└── middleware.ts           # Auth & route protection
```

**Why**: Route groups `(name)` organize pages without affecting URL structure, enabling shared layouts per user role.

## App Directory Routes

### Route Groups Pattern

- Use parentheses for layout grouping: `(auth)`, `(student)`, `(admin)`
- Each group gets its own `layout.tsx` for role-specific UI
- Routes inside groups don't include group name in URL

```
app/
├── (auth)/
│   ├── login/page.tsx           # URL: /login
│   ├── register/page.tsx        # URL: /register
│   └── layout.tsx               # Auth layout wrapper
│
├── (student)/
│   ├── dashboard/page.tsx       # URL: /dashboard
│   ├── demandes/
│   │   ├── page.tsx            # URL: /demandes
│   │   ├── new/page.tsx        # URL: /demandes/new
│   │   └── [id]/page.tsx       # URL: /demandes/123
│   └── layout.tsx               # Student layout wrapper
│
└── (admin)/
    └── admin/
        ├── dashboard/page.tsx   # URL: /admin/dashboard
        ├── demandes/
        │   ├── page.tsx        # URL: /admin/demandes
        │   └── [id]/page.tsx   # URL: /admin/demandes/123
        └── layout.tsx           # Admin layout wrapper
```

**Why**: Separates UI by role while keeping clean URLs, enables role-specific navigation/layouts.

## API Routes Structure

Organize by resource with nested routes for specific operations.

```
app/api/
├── demandes/
│   ├── route.ts              # GET, POST /api/demandes
│   └── [id]/
│       └── route.ts          # GET, PATCH, DELETE /api/demandes/:id
├── upload/
│   └── route.ts              # POST /api/upload
├── webhook/
│   └── route.ts              # POST /api/webhook
└── cron/
    ├── notifications/
    │   └── route.ts          # GET /api/cron/notifications
    └── reminders/
        └── route.ts          # GET /api/cron/reminders
```

**Why**: RESTful structure with HTTP methods in route handlers, one file per endpoint.

## Server Actions Location

Group by feature domain, colocated with related logic.

```
app/actions/
├── demandes.ts               # Demande CRUD operations
├── workflow.ts               # State transitions
├── notifications.ts          # Send notifications
└── auth.ts                   # Login, register
```

**Why**: Server Actions handle mutations, keeping them separate from API routes improves organization.

## Lib Directory Structure

Business logic and utilities organized by domain.

```
lib/
├── db/
│   ├── mongodb.ts            # Database connection
│   └── models/               # Database models
│       ├── etudiant.ts
│       ├── demande.ts
│       ├── historique.ts
│       └── utilisateur.ts
├── workflow/
│   ├── state-machine.ts      # Workflow engine
│   └── rules.ts              # Business rules
├── email/
│   └── send.ts               # Email service
├── upload/
│   └── cloudinary.ts         # File upload service
└── utils/
    ├── auth.ts               # Auth helpers
    └── validators.ts         # Validation utilities
```

**Why**: Domain-driven organization keeps related logic together, `lib/` is for server-side code only.

## Database Models Location

All models in `lib/db/models/` with one file per collection/table.

```
lib/db/models/
├── etudiant.ts               # Student model
├── demande.ts                # Request model
├── historique.ts             # History model
└── utilisateur.ts            # User model
```

**Why**: Centralized models prevent duplication, easy imports from `@/lib/db/models/demande`.

## Types Directory

Shared TypeScript types and interfaces.

```
types/
├── demande.ts                # Demande-related types
├── workflow.ts               # Workflow state types
├── database.ts               # DB schema types
└── api.ts                    # API request/response types
```

**Why**: Shared types ensure consistency across client/server boundaries.

## Public Assets Structure

Static files served from `/public` directory.

```
public/
├── assets/
│   ├── images/
│   ├── icons/
│   └── fonts/
└── favicon.ico
```

**Why**: Files in `/public` are served at root URL, optimized by Next.js automatically.

## Feature-Based Organization

For feature-specific code, use directories under `components/` or `lib/`.

```
components/demandes/          # Demande UI components
lib/demandes/                 # Demande business logic (if complex)
```

**Why**: Keeps related UI and logic together for easier maintenance and imports.

## Import Paths

Use TypeScript path aliases for clean imports.

```typescript
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}

// In files
import { DemandeCard } from '@/components/demandes/demande-card'
import { demandeModel } from '@/lib/db/models/demande'
import type { Demande } from '@/types/demande'
```

**Why**: Absolute imports are cleaner than `../../../components`, easier to refactor.
