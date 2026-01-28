# API Error Handling

## Error Code Pattern

Use prefix-based error codes: `{CATEGORY}_{NUMBER}` format for systematic error identification.

### Error Code Categories

```typescript
// Auth errors: AUTH_xxx
AUTH_001 = "Missing authentication token"
AUTH_002 = "Invalid or expired token"
AUTH_003 = "Insufficient permissions"
AUTH_004 = "Invalid credentials"

// Validation errors: VAL_xxx
VAL_001 = "Validation failed"
VAL_002 = "Invalid file type"
VAL_003 = "File size exceeds limit"
VAL_004 = "Required field missing"

// Resource errors: RES_xxx
RES_001 = "Resource not found"
RES_002 = "Resource already exists"
RES_003 = "Resource conflict"

// Workflow errors: WF_xxx
WF_001 = "Invalid state transition"
WF_002 = "Workflow prerequisite not met"
WF_003 = "Operation not allowed in current state"

// Server errors: SRV_xxx
SRV_001 = "Internal server error"
SRV_002 = "Database connection failed"
SRV_003 = "External service unavailable"
```

## Error Response Structure

```typescript
interface ApiError {
  code: string;          // Error code (e.g., "AUTH_001")
  message: string;       // Human-readable message
  details?: unknown;     // Optional contextual data
}

interface ErrorResponse {
  success: false;
  error: ApiError;
}
```

## HTTP Status Code Mapping

Map error codes to appropriate HTTP status codes.

| Error Category | HTTP Status | Use Case |
|---------------|-------------|----------|
| `AUTH_001-004` | 401 Unauthorized | Authentication failures |
| `AUTH_003` | 403 Forbidden | Authorization failures |
| `VAL_001-004` | 400 Bad Request | Input validation failures |
| `RES_001` | 404 Not Found | Resource doesn't exist |
| `RES_002` | 409 Conflict | Duplicate resource |
| `RES_003` | 409 Conflict | Resource state conflict |
| `WF_001-003` | 422 Unprocessable | Business logic violations |
| `SRV_001-003` | 500 Server Error | Internal failures |

## Error Handling Implementation

### Zod Validation Errors

```typescript
import { z, ZodError } from 'zod';

const demandeSchema = z.object({
  objet: z.string().min(10, "Minimum 10 characters").max(255),
  description: z.string().min(20, "Minimum 20 characters"),
  typeDemande: z.string().min(1, "Type is required")
});

try {
  const validated = demandeSchema.parse(input);
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
}
```

### Authentication Errors

```typescript
// middleware/auth.ts
import { NextRequest, NextResponse } from 'next/server';

export function authMiddleware(request: NextRequest) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "AUTH_001",
          message: "Missing authentication token"
        }
      },
      { status: 401 }
    );
  }

  try {
    const user = verifyJWT(token);
    return { user };
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "AUTH_002",
          message: "Invalid or expired token"
        }
      },
      { status: 401 }
    );
  }
}
```

### Resource Not Found

```typescript
// app/api/demandes/[id]/route.ts
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const demande = await db.demande.findUnique({
    where: { _id: params.id }
  });

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
}
```

### Workflow Transition Errors

```typescript
// lib/workflow/state-machine.ts
export async function transitionStatus(
  demandeId: string,
  newStatus: DemandeStatus
) {
  const demande = await getDemande(demandeId);

  if (!isValidTransition(demande.statut.code, newStatus)) {
    throw new WorkflowError(
      "WF_001",
      `Cannot transition from ${demande.statut.code} to ${newStatus}`,
      {
        currentStatus: demande.statut.code,
        attemptedStatus: newStatus,
        allowedTransitions: getAllowedTransitions(demande.statut.code)
      }
    );
  }

  // Process transition...
}

// Custom error class
class WorkflowError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "WorkflowError";
  }
}
```

### Server Action Error Handling

```typescript
// actions/demandes.ts
export async function createDemande(formData: FormData) {
  try {
    const validated = demandeSchema.parse(Object.fromEntries(formData));
    const demande = await db.demande.create({ data: validated });

    return { success: true, data: demande };
  } catch (error) {
    // Zod validation error
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

    // Workflow error
    if (error instanceof WorkflowError) {
      return {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details
        }
      };
    }

    // Unknown error - log and return generic
    console.error("Unexpected error:", error);
    return {
      success: false,
      error: {
        code: "SRV_001",
        message: "Internal server error"
      }
    };
  }
}
```

## Global Error Handler (API Routes)

```typescript
// lib/api/error-handler.ts
export function handleApiError(error: unknown): NextResponse {
  // Zod validation errors
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "VAL_001",
          message: "Validation failed",
          details: error.flatten().fieldErrors
        }
      },
      { status: 400 }
    );
  }

  // Custom workflow errors
  if (error instanceof WorkflowError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details
        }
      },
      { status: 422 }
    );
  }

  // Mongoose duplicate key error
  if (error.code === 11000) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "RES_002",
          message: "Resource already exists",
          details: error.keyPattern
        }
      },
      { status: 409 }
    );
  }

  // Generic server error
  console.error("Unhandled error:", error);
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
```

## Client-Side Error Handling

```typescript
// hooks/useDemandes.ts
export function useDemandes() {
  async function createDemande(data: DemandeInput) {
    const response = await fetch('/api/demandes', {
      method: 'POST',
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!result.success) {
      // Handle specific error codes
      switch (result.error.code) {
        case "AUTH_002":
          // Redirect to login
          router.push('/login');
          break;
        case "VAL_001":
          // Show validation errors
          setFieldErrors(result.error.details);
          break;
        default:
          // Show generic error toast
          toast.error(result.error.message);
      }
      return;
    }

    return result.data;
  }
}
```

## Why This Pattern?

- **Systematic**: Prefix codes enable quick categorization
- **Debuggable**: Error codes facilitate log searching and monitoring
- **Extensible**: Easy to add new error codes without conflicts
- **Client-Friendly**: Consistent structure simplifies error handling
- **Type-Safe**: TypeScript enums or constants prevent typos
