# API Endpoint Conventions

## RESTful Naming

Use resource-based URLs with standard HTTP methods for CRUD operations.

### Resource Naming Rules

- Use **plural nouns** for collections: `/api/demandes`, `/api/etudiants`
- Use **kebab-case** for multi-word resources: `/api/demandes-types`
- Keep URLs **lowercase**
- Avoid verbs in URL (use HTTP methods instead)
- Use **nested routes** for relationships: `/api/demandes/{id}/historique`

### Standard CRUD Endpoints

```typescript
// Collection endpoints
GET    /api/demandes           // List all demandes (paginated)
POST   /api/demandes           // Create new demande

// Resource endpoints
GET    /api/demandes/{id}      // Get single demande
PATCH  /api/demandes/{id}      // Update demande (partial)
DELETE /api/demandes/{id}      // Delete demande

// Nested resource
GET    /api/demandes/{id}/historique  // Get demande history
```

## HTTP Methods

Use appropriate HTTP methods for operations.

| Method | Purpose | Idempotent | Safe | Request Body | Response Body |
|--------|---------|-----------|------|--------------|---------------|
| `GET` | Retrieve resource | Yes | Yes | No | Yes |
| `POST` | Create resource | No | No | Yes | Yes |
| `PATCH` | Partial update | No | No | Yes | Yes |
| `PUT` | Full replace | Yes | No | Yes | Yes |
| `DELETE` | Remove resource | Yes | No | No | Optional |

**Prefer PATCH over PUT** for updates to allow partial modifications.

## Query Parameters

Use query parameters for filtering, sorting, pagination, and field selection.

### Pagination

```typescript
GET /api/demandes?page=1&limit=20

// Response includes pagination metadata
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 145,
    "totalPages": 8
  }
}
```

### Filtering

```typescript
// Single filter
GET /api/demandes?statut=EN_COURS

// Multiple filters
GET /api/demandes?statut=EN_COURS&priorite=HAUTE

// Date ranges
GET /api/demandes?createdAfter=2024-01-01&createdBefore=2024-01-31
```

### Sorting

```typescript
// Single field ascending
GET /api/demandes?sortBy=createdAt

// Descending (prefix with -)
GET /api/demandes?sortBy=-createdAt

// Multiple fields
GET /api/demandes?sortBy=-priorite,createdAt
```

### Field Selection

```typescript
// Select specific fields
GET /api/demandes?fields=numeroDemande,statut,etudiant.nom

// Exclude fields
GET /api/demandes?fields=-documents,-metadata
```

### Search

```typescript
// Full-text search
GET /api/demandes?search=attestation

// Field-specific search
GET /api/demandes?etudiant.nom=Doe
```

## Request Validation

Validate all inputs using Zod schemas at API route entry point.

```typescript
// lib/validators/demande.ts
import { z } from 'zod';

export const createDemandeSchema = z.object({
  typeDemande: z.string().min(1, "Type is required"),
  objet: z.string().min(10).max(255),
  description: z.string().min(20),
  priorite: z.enum(['BASSE', 'NORMALE', 'HAUTE', 'URGENTE']).default('NORMALE'),
  documents: z.array(z.string()).optional() // Document IDs after upload
});

export const updateDemandeSchema = createDemandeSchema.partial();

export const queryDemandesSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  statut: z.string().optional(),
  priorite: z.enum(['BASSE', 'NORMALE', 'HAUTE', 'URGENTE']).optional(),
  sortBy: z.string().default('-createdAt'),
  search: z.string().optional()
});
```

## API Route Implementation

```typescript
// app/api/demandes/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createDemandeSchema, queryDemandesSchema } from '@/lib/validators/demande';
import { handleApiError } from '@/lib/api/error-handler';

// GET /api/demandes - List demandes
export async function GET(request: NextRequest) {
  try {
    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const query = queryDemandesSchema.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      statut: searchParams.get('statut'),
      priorite: searchParams.get('priorite'),
      sortBy: searchParams.get('sortBy'),
      search: searchParams.get('search')
    });

    // Auth check
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "AUTH_001", message: "Authentication required" }
        },
        { status: 401 }
      );
    }

    // Fetch data
    const result = await getDemandesList({
      ...query,
      userId: user.role === 'STUDENT' ? user.id : undefined
    });

    return NextResponse.json({
      success: true,
      data: result.items,
      pagination: result.pagination
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/demandes - Create demande
export async function POST(request: NextRequest) {
  try {
    // Parse and validate body
    const body = await request.json();
    const validated = createDemandeSchema.parse(body);

    // Auth check
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "AUTH_001", message: "Authentication required" }
        },
        { status: 401 }
      );
    }

    // Create resource
    const demande = await createDemande({
      ...validated,
      etudiantId: user.id
    });

    return NextResponse.json(
      { success: true, data: demande },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
```

## Dynamic Route Parameters

```typescript
// app/api/demandes/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';

// GET /api/demandes/{id}
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const demande = await getDemande(params.id);

    if (!demande) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "RES_001",
            message: "Demande not found",
            details: { id: params.id }
          }
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: demande });
  } catch (error) {
    return handleApiError(error);
  }
}

// PATCH /api/demandes/{id}
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validated = updateDemandeSchema.parse(body);

    const updated = await updateDemande(params.id, validated);

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/demandes/{id}
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await deleteDemande(params.id);

    return NextResponse.json(
      { success: true, data: null },
      { status: 204 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
```

## Server Actions Conventions

Server Actions complement API routes for form submissions and mutations.

```typescript
// actions/demandes.ts
'use server';

import { revalidatePath } from 'next/cache';
import { createDemandeSchema } from '@/lib/validators/demande';

export async function createDemandeAction(formData: FormData) {
  try {
    // Parse form data
    const data = Object.fromEntries(formData);
    const validated = createDemandeSchema.parse(data);

    // Get current user from session
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: false,
        error: { code: "AUTH_001", message: "Authentication required" }
      };
    }

    // Create demande
    const demande = await createDemande({
      ...validated,
      etudiantId: user.id
    });

    // Revalidate cache
    revalidatePath('/demandes');

    return { success: true, data: demande };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        success: false,
        error: {
          code: "VAL_001",
          message: "Validation failed",
          details: error.flatten().fieldErrors
        }
      };
    }

    return {
      success: false,
      error: { code: "SRV_001", message: "Internal server error" }
    };
  }
}
```

## Pagination Implementation

```typescript
// lib/db/demandes.ts
export async function getDemandesList(options: {
  page: number;
  limit: number;
  statut?: string;
  userId?: string;
  sortBy?: string;
}) {
  const { page, limit, statut, userId, sortBy = '-createdAt' } = options;

  // Build query
  const query: any = {};
  if (statut) query['statut.code'] = statut;
  if (userId) query['etudiant.id'] = userId;

  // Parse sort
  const sortField = sortBy.startsWith('-') ? sortBy.slice(1) : sortBy;
  const sortOrder = sortBy.startsWith('-') ? -1 : 1;

  // Execute query with pagination
  const [items, total] = await Promise.all([
    db.demande
      .find(query)
      .sort({ [sortField]: sortOrder })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    db.demande.countDocuments(query)
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}
```

## Special Endpoints

### Workflow Actions

Use action-specific endpoints for workflow operations.

```typescript
// POST /api/demandes/{id}/transition
POST /api/demandes/{id}/transition
{
  "newStatus": "VALIDE",
  "commentaire": "Documents verified"
}

// POST /api/demandes/{id}/assign
POST /api/demandes/{id}/assign
{
  "adminId": "507f1f77bcf86cd799439011"
}
```

### Bulk Operations

```typescript
// POST /api/demandes/bulk-update
POST /api/demandes/bulk-update
{
  "ids": ["id1", "id2", "id3"],
  "update": { "priorite": "HAUTE" }
}
```

### File Upload

```typescript
// POST /api/upload
POST /api/upload
Content-Type: multipart/form-data

// Returns file metadata
{
  "success": true,
  "data": {
    "id": "file-123",
    "url": "https://cdn.cloudinary.com/...",
    "filename": "attestation.pdf",
    "size": 245760
  }
}
```

## Why These Conventions?

- **Predictable**: Standard REST patterns are familiar to all developers
- **Type-Safe**: Zod schemas provide runtime validation and TypeScript types
- **Scalable**: Query parameter conventions handle complex filtering needs
- **Consistent**: Same patterns across all endpoints reduce cognitive load
- **Validated**: All inputs validated before business logic execution
