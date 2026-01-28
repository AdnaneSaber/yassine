# File Naming Conventions

## Component Files

Use PascalCase for React component files.

```
components/
├── Button.tsx
├── DemandeForm.tsx
├── DemandeCard.tsx
├── StatusBadge.tsx
└── FileUpload.tsx
```

**Why**: Matches React component naming, makes components immediately recognizable.

## Non-Component Files

Use kebab-case for all non-component files.

```
lib/
├── state-machine.ts
├── auth.ts
├── validators.ts
└── send.ts

app/api/
└── upload/
    └── route.ts
```

**Why**: Standard JavaScript/TypeScript convention, avoids case-sensitivity issues across OS.

## Page Files

Always use `page.tsx` for route pages (App Router requirement).

```
app/
├── (student)/
│   ├── dashboard/
│   │   └── page.tsx        # Route page
│   └── demandes/
│       └── [id]/
│           └── page.tsx    # Dynamic route page
```

**Why**: Next.js App Router convention, `page.tsx` makes files routable.

## Layout Files

Always use `layout.tsx` for layout components (App Router requirement).

```
app/
├── layout.tsx              # Root layout
├── (student)/
│   └── layout.tsx          # Student layout
└── (admin)/
    └── layout.tsx          # Admin layout
```

**Why**: Next.js App Router convention, `layout.tsx` wraps child routes.

## API Route Files

Always use `route.ts` for API endpoints (App Router requirement).

```
app/api/
├── demandes/
│   └── route.ts            # /api/demandes
└── upload/
    └── route.ts            # /api/upload
```

**Why**: Next.js App Router convention, `route.ts` handles HTTP methods.

## Server Actions Files

Use kebab-case with domain name for Server Actions files.

```
app/actions/
├── demandes.ts
├── workflow.ts
├── notifications.ts
└── auth.ts
```

**Why**: Groups related actions by domain, easy to import as `@/actions/demandes`.

## Type Definition Files

Use kebab-case matching the domain, with `.ts` extension.

```
types/
├── demande.ts
├── workflow.ts
├── database.ts
└── api.ts
```

**Why**: Types are not components, follow standard TypeScript naming.

## Model Files

Use kebab-case, singular form for model files.

```
lib/db/models/
├── etudiant.ts             # Student model (singular)
├── demande.ts              # Request model (singular)
├── historique.ts           # History model (singular)
└── utilisateur.ts          # User model (singular)
```

**Why**: Singular form represents one entity schema, consistent with model naming patterns.

## Utility and Helper Files

Use kebab-case describing the utility purpose.

```
lib/utils/
├── validators.ts
├── formatters.ts
├── auth.ts
└── constants.ts
```

**Why**: Descriptive names make purpose clear, kebab-case for non-components.

## Test Files

Colocate test files with same name plus `.test.ts` or `.spec.ts`.

```
lib/
├── workflow/
│   ├── state-machine.ts
│   └── state-machine.test.ts
└── utils/
    ├── validators.ts
    └── validators.test.ts
```

**Why**: Colocated tests are easier to find and maintain, clear test file identification.

## Configuration Files

Use standard names for framework/tool config files.

```
root/
├── next.config.js          # Next.js config
├── tailwind.config.ts      # Tailwind config
├── tsconfig.json           # TypeScript config
└── .env.local              # Environment variables
```

**Why**: Framework conventions, tooling expects specific names.

## Directory Naming

Use kebab-case for directory names.

```
components/
├── demandes/
├── ui/
└── layout/

lib/
├── db/
├── workflow/
└── email/
```

**Why**: Consistent with kebab-case file naming, lowercase prevents cross-OS issues.

## Exceptions

These files use Next.js/framework-specific naming:

- `middleware.ts` - Next.js middleware (required name)
- `layout.tsx` - App Router layouts (required name)
- `page.tsx` - App Router pages (required name)
- `route.ts` - App Router API routes (required name)
- `loading.tsx` - App Router loading UI (optional)
- `error.tsx` - App Router error UI (optional)
- `not-found.tsx` - App Router 404 page (optional)

**Why**: Next.js framework requirements, these names enable specific functionality.
