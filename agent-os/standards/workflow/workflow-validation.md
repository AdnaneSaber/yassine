# Workflow Validation

## Pre-Transition Validation

- **Always validate before executing transition**
- Check: valid transition path, required fields, permissions
- Throw descriptive errors early
- Why: Prevents invalid state; better error messages

```typescript
async transition(newStatut: StatutCode, commentaire?: string): Promise<void> {
  const currentStatut = this.demande.statut.code;

  // 1. Validate transition path
  if (!canTransition(currentStatut, newStatut)) {
    throw new Error(
      `Invalid transition: ${currentStatut} → ${newStatut}. ` +
      `Allowed: ${WORKFLOW_TRANSITIONS[currentStatut].join(', ')}`
    );
  }

  // 2. Validate required fields
  if (newStatut === 'REJETE' && !this.demande.motifRefus) {
    throw new Error('motifRefus is required when rejecting a demande');
  }

  // 3. Validate permissions
  if (!this.canUserPerformTransition(this.userId, currentStatut, newStatut)) {
    throw new Error('Insufficient permissions for this transition');
  }

  // 4. Execute transition
  await this.executeTransition(newStatut, commentaire);
}
```

## Required Fields Validation

- **Define required fields per target status**
- Validate in onBeforeTransition hook
- Use Zod schemas for complex validations
- Why: Data completeness; meaningful records

```typescript
const REQUIRED_FIELDS_BY_STATUS: Record<StatutCode, {
  demande?: (keyof IDemande)[];
  context?: string[];
}> = {
  REJETE: {
    demande: ['motifRefus'],
    context: ['commentaire']
  },
  EN_COURS: {
    demande: ['traiteParId']
  },
  ATTENTE_INFO: {
    demande: ['commentaireAdmin']
  },
  VALIDE: {
    demande: ['documents'] // Must have at least one document
  }
};

function validateRequiredFields(
  demande: IDemande,
  targetStatus: StatutCode,
  context?: TransitionContext
): void {
  const requirements = REQUIRED_FIELDS_BY_STATUS[targetStatus];
  if (!requirements) return;

  // Validate demande fields
  if (requirements.demande) {
    for (const field of requirements.demande) {
      const value = demande[field];
      if (!value || (Array.isArray(value) && value.length === 0)) {
        throw new Error(`${field} is required for status ${targetStatus}`);
      }
    }
  }

  // Validate context fields
  if (requirements.context && context) {
    for (const field of requirements.context) {
      if (!context[field]) {
        throw new Error(`${field} is required in context for status ${targetStatus}`);
      }
    }
  }
}
```

## Permission Validation

- **Check user permissions before transitions**
- Role-based: STUDENT, ADMIN, SYSTEM
- Some transitions restricted to specific roles
- Why: Security; proper authorization

```typescript
const TRANSITION_PERMISSIONS: Record<string, string[]> = {
  'RECU->EN_COURS': ['ADMIN', 'SUPER_ADMIN'],
  'EN_COURS->VALIDE': ['ADMIN', 'SUPER_ADMIN'],
  'EN_COURS->REJETE': ['ADMIN', 'SUPER_ADMIN'],
  'ATTENTE_INFO->EN_COURS': ['STUDENT', 'ADMIN', 'SUPER_ADMIN'],
  'VALIDE->TRAITE': ['SYSTEM', 'ADMIN', 'SUPER_ADMIN']
};

function canUserPerformTransition(
  userId: string,
  userRole: string,
  from: StatutCode,
  to: StatutCode
): boolean {
  const transitionKey = `${from}->${to}`;
  const allowedRoles = TRANSITION_PERMISSIONS[transitionKey];

  // If no specific permissions defined, allow ADMIN and SUPER_ADMIN
  if (!allowedRoles) {
    return ['ADMIN', 'SUPER_ADMIN', 'SYSTEM'].includes(userRole);
  }

  return allowedRoles.includes(userRole);
}
```

## Business Rule Validation

- **Enforce business rules in validation layer**
- Examples: document requirements, time constraints, status prerequisites
- Throw specific error messages for each rule
- Why: Business logic consistency; clear requirements

```typescript
async validateBusinessRules(
  demande: IDemande,
  targetStatus: StatutCode
): Promise<void> {
  // Rule: Cannot validate without documents
  if (targetStatus === 'VALIDE') {
    if (!demande.documents || demande.documents.length === 0) {
      throw new Error('Au moins un document est requis pour valider la demande');
    }
  }

  // Rule: Cannot reject without motif
  if (targetStatus === 'REJETE') {
    if (!demande.motifRefus || demande.motifRefus.trim().length < 10) {
      throw new Error('Un motif de refus détaillé (min 10 caractères) est requis');
    }
  }

  // Rule: Cannot archive non-terminal states
  if (targetStatus === 'ARCHIVE') {
    if (!['TRAITE', 'REJETE'].includes(demande.statut.code)) {
      throw new Error('Seules les demandes TRAITE ou REJETE peuvent être archivées');
    }

    // Must be at least 6 months old
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    if (demande.dateTraitement && demande.dateTraitement > sixMonthsAgo) {
      throw new Error('Demande trop récente pour archivage (minimum 6 mois)');
    }
  }

  // Rule: EN_COURS must have assigned admin
  if (targetStatus === 'EN_COURS' && !demande.traiteParId) {
    throw new Error('Un administrateur doit être assigné pour mettre la demande en cours');
  }

  // Rule: Priority validation
  if (demande.priorite === 'URGENTE') {
    const ageInDays = Math.floor(
      (Date.now() - demande.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (ageInDays > demande.typeDemande.delaiTraitement * 2) {
      console.warn(`Demande urgente ${demande.numeroDemande} dépasse le délai acceptable`);
    }
  }
}
```

## Validation Error Types

- **Use specific error types for different validation failures**
- TransitionValidationError, PermissionError, BusinessRuleError
- Include context: demandeId, from/to status, field name
- Why: Better error handling; detailed logging

```typescript
export class TransitionValidationError extends Error {
  constructor(
    message: string,
    public demandeId: string,
    public fromStatus: StatutCode,
    public toStatus: StatutCode
  ) {
    super(message);
    this.name = 'TransitionValidationError';
  }
}

export class PermissionError extends Error {
  constructor(
    message: string,
    public userId: string,
    public requiredRole: string
  ) {
    super(message);
    this.name = 'PermissionError';
  }
}

export class BusinessRuleError extends Error {
  constructor(
    message: string,
    public rule: string,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = 'BusinessRuleError';
  }
}

// Usage
if (!canTransition(currentStatut, newStatut)) {
  throw new TransitionValidationError(
    `Invalid transition: ${currentStatut} → ${newStatut}`,
    this.demande._id,
    currentStatut,
    newStatut
  );
}
```

## Input Sanitization

- **Sanitize user inputs in transition context**
- Trim strings, validate formats, escape HTML
- Use Zod schemas for structure validation
- Why: Prevent injection attacks; data consistency

```typescript
import { z } from 'zod';

const TransitionContextSchema = z.object({
  commentaire: z.string().trim().max(1000).optional(),
  motifRefus: z.string().trim().min(10).max(500).optional(),
  traiteParId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional() // MongoDB ObjectId
});

function sanitizeTransitionContext(context: unknown): TransitionContext {
  try {
    return TransitionContextSchema.parse(context);
  } catch (error) {
    throw new Error('Invalid transition context format');
  }
}

// Usage in API
export async function updateStatut(
  demandeId: string,
  newStatut: StatutCode,
  rawContext: unknown
) {
  const context = sanitizeTransitionContext(rawContext);
  // Proceed with transition...
}
```

## Concurrent Modification Detection

- **Detect and handle concurrent updates**
- Use version field or updatedAt timestamp
- Reject stale updates
- Why: Prevents lost updates; data integrity

```typescript
export interface OptimisticLockCheck {
  version?: number;
  lastUpdatedAt?: Date;
}

async function checkOptimisticLock(
  demande: IDemande,
  expectedVersion?: number
): Promise<void> {
  if (expectedVersion !== undefined && demande.__v !== expectedVersion) {
    throw new Error(
      `Concurrent modification detected. Demande was updated by another user. ` +
      `Please refresh and try again.`
    );
  }
}

// Usage
export async function updateStatut(
  demandeId: string,
  newStatut: StatutCode,
  context: TransitionContext & OptimisticLockCheck
) {
  const demande = await Demande.findById(demandeId);

  // Check for concurrent modifications
  await checkOptimisticLock(demande, context.version);

  // Proceed with transition...
}
```

## Validation in API Layer

- **Validate at multiple layers: client, API, service**
- API layer: authentication, authorization, input format
- Service layer: business rules, state transitions
- Database layer: schema constraints
- Why: Defense in depth; better error messages at each layer

```typescript
// API Layer (app/api/demandes/[id]/status/route.ts)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // 1. Authentication
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Input validation
  const body = await request.json();
  const schema = z.object({
    statut: z.enum(['RECU', 'EN_COURS', 'VALIDE', 'REJETE', 'TRAITE', 'ARCHIVE']),
    commentaire: z.string().optional(),
    motifRefus: z.string().optional()
  });

  const validated = schema.safeParse(body);
  if (!validated.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: validated.error.errors },
      { status: 400 }
    );
  }

  // 3. Authorization (done in service layer)
  try {
    await updateStatutService(
      params.id,
      validated.data.statut,
      {
        userId: session.user.id,
        userRole: session.user.role,
        ...validated.data
      }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof PermissionError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error instanceof TransitionValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    // ... other error types
  }
}
```

## Dry-Run Validation

- **Provide validation without executing transition**
- Useful for UI to show available actions
- Returns validation result with error details
- Why: Better UX; proactive error prevention

```typescript
export async function validateTransition(
  demandeId: string,
  newStatut: StatutCode,
  context: TransitionContext
): Promise<{ valid: boolean; errors?: string[] }> {
  const errors: string[] = [];

  try {
    const demande = await Demande.findById(demandeId);
    if (!demande) {
      return { valid: false, errors: ['Demande not found'] };
    }

    // Check transition path
    if (!canTransition(demande.statut.code, newStatut)) {
      errors.push(`Invalid transition: ${demande.statut.code} → ${newStatut}`);
    }

    // Check permissions
    if (!canUserPerformTransition(context.userId, context.userRole, demande.statut.code, newStatut)) {
      errors.push('Insufficient permissions');
    }

    // Check required fields
    validateRequiredFields(demande, newStatut, context);

    // Check business rules
    await validateBusinessRules(demande, newStatut);

    return { valid: errors.length === 0, errors: errors.length > 0 ? errors : undefined };
  } catch (error) {
    if (error instanceof Error) {
      errors.push(error.message);
    }
    return { valid: false, errors };
  }
}

// Usage in UI
const validationResult = await validateTransition(demandeId, 'VALIDE', context);
if (!validationResult.valid) {
  setErrors(validationResult.errors);
  setButtonEnabled(false);
}
```
