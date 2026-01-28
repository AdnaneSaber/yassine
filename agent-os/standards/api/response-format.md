# API Response Format

## Standard Response Envelope

Use consistent envelope structure for all API responses to enable predictable client-side handling.

### Success Response

```typescript
interface SuccessResponse<T> {
  success: true;
  data: T;
}
```

**Example:**
```typescript
// GET /api/demandes/123
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "numeroDemande": "DEM-2024-000001",
    "etudiant": {
      "id": "507f191e810c19729de860ea",
      "nom": "Doe",
      "prenom": "John",
      "email": "john.doe@university.edu"
    },
    "statut": {
      "code": "EN_COURS",
      "libelle": "En cours de traitement"
    },
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

### Error Response

```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string;          // Error code (e.g., "AUTH_001", "VAL_001")
    message: string;       // Human-readable error message
    details?: unknown;     // Optional validation errors or stack trace
  };
}
```

**Example:**
```typescript
// POST /api/demandes with invalid data
{
  "success": false,
  "error": {
    "code": "VAL_001",
    "message": "Validation failed",
    "details": {
      "objet": ["Minimum 10 characters required"],
      "description": ["Field is required"]
    }
  }
}
```

## Collection Responses

For list endpoints, wrap array in data object with metadata.

```typescript
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
```

**Example:**
```typescript
// GET /api/demandes?page=1&limit=10
{
  "success": true,
  "data": [
    { /* demande 1 */ },
    { /* demande 2 */ }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "totalPages": 5
  }
}
```

## Server Actions Response

Server Actions use similar envelope but can throw errors directly.

```typescript
// actions/demandes.ts
type ActionResponse<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string; details?: unknown } };

export async function createDemande(formData: FormData): Promise<ActionResponse<Demande>> {
  try {
    // Validation
    const validated = demandeSchema.parse(formData);

    // Business logic
    const demande = await db.demande.create({ data: validated });

    return { success: true, data: demande };
  } catch (error) {
    return {
      success: false,
      error: {
        code: "VAL_001",
        message: "Validation failed",
        details: error instanceof ZodError ? error.flatten() : undefined
      }
    };
  }
}
```

## HTTP Status Codes

Always set appropriate HTTP status codes with response envelope.

**Success codes:**
- `200 OK` - Successful GET, PATCH, DELETE
- `201 Created` - Successful POST with resource creation
- `204 No Content` - Successful DELETE with no response body

**Error codes:**
- `400 Bad Request` - Validation errors, malformed requests
- `401 Unauthorized` - Missing or invalid authentication
- `403 Forbidden` - Authenticated but insufficient permissions
- `404 Not Found` - Resource does not exist
- `409 Conflict` - Duplicate resource (e.g., duplicate matricule)
- `422 Unprocessable Entity` - Valid syntax but semantic errors
- `500 Internal Server Error` - Server-side errors

**Example API Route:**
```typescript
// app/api/demandes/route.ts
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = demandeSchema.parse(body);

    const demande = await createDemande(validated);

    return NextResponse.json(
      { success: true, data: demande },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VAL_001",
            message: "Validation failed",
            details: error.flatten()
          }
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SRV_001",
          message: "Internal server error"
        }
      },
      { status: 500 }
    );
  }
}
```

## Why This Format?

- **Consistency**: Clients always check `success` field first
- **Type Safety**: TypeScript discriminated unions work perfectly
- **Error Handling**: Standardized error structure simplifies client error handling
- **Debugging**: Error codes enable quick issue identification
- **Validation**: Details field provides structured validation feedback
