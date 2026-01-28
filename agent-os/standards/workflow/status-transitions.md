# Status Transitions

## Transition Map Structure

- **Define all valid transitions in a central constant**
- Map each status to array of allowed next statuses
- Use TypeScript Record type for type safety
- Why: Single source of truth; prevents invalid state changes

```typescript
export const WORKFLOW_TRANSITIONS: Record<StatutCode, StatutCode[]> = {
  SOUMIS: ['RECU'],
  RECU: ['EN_COURS', 'REJETE'],
  EN_COURS: ['ATTENTE_INFO', 'VALIDE', 'REJETE'],
  ATTENTE_INFO: ['EN_COURS', 'REJETE'],
  VALIDE: ['TRAITE'],
  REJETE: ['ARCHIVE'],
  TRAITE: ['ARCHIVE'],
  ARCHIVE: [] // Terminal state - no transitions allowed
};
```

## Transition Validation Function

- **Provide canTransition() utility for validation**
- Accept current and target status as parameters
- Return boolean; never throw errors
- Use before attempting transitions in UI and API
- Why: Reusable validation; enables proactive UI updates

```typescript
export function canTransition(from: StatutCode, to: StatutCode): boolean {
  return WORKFLOW_TRANSITIONS[from]?.includes(to) ?? false;
}

// Usage in UI
const canApprove = canTransition(demande.statut.code, 'VALIDE');
<Button disabled={!canApprove}>Approve</Button>

// Usage in API
if (!canTransition(currentStatus, requestedStatus)) {
  return NextResponse.json(
    { error: 'Invalid status transition' },
    { status: 400 }
  );
}
```

## Status Flow Visualization

```
Initial State
     │
     ▼
┌─────────┐
│ SOUMIS  │ (Auto-created on submission)
└────┬────┘
     │ Auto: onSubmit()
     ▼
┌─────────┐
│  RECU   ├────┐
└────┬────┘    │
     │         │ Admin: reject
     │ Admin:  │
     │ assign  ▼
     │    ┌─────────┐
     │    │ REJETE  │
     │    └────┬────┘
     ▼         │
┌──────────┐  │
│ EN_COURS │  │
└────┬─────┘  │
     │        │
     ├────┐   │
     │    │   │
     │    ▼   │
     │  ┌──────────────┐
     │  │ ATTENTE_INFO │
     │  └──────┬───────┘
     │         │
     │ Admin:  │ Student:
     │ validate│ respond
     │         │
     ▼         ▼
┌─────────┐ Back to EN_COURS
│ VALIDE  │
└────┬────┘
     │ Auto: onValidate()
     ▼
┌─────────┐
│ TRAITE  │
└────┬────┘
     │ (After 6 months)
     ▼
┌─────────┐
│ ARCHIVE │ (Terminal)
└─────────┘
```

## Transition Context Requirements

- **Define required fields for each transition type**
- REJETE requires motifRefus
- EN_COURS may require traiteParId (assigned admin)
- ATTENTE_INFO may require commentaireAdmin
- Why: Data integrity; meaningful audit trail

```typescript
export interface TransitionContext {
  commentaire?: string;
  motifRefus?: string;
  traiteParId?: string;
}

export const TRANSITION_REQUIREMENTS: Record<StatutCode, {
  requiredFields?: (keyof TransitionContext)[];
  optionalFields?: (keyof TransitionContext)[];
}> = {
  REJETE: {
    requiredFields: ['motifRefus'],
    optionalFields: ['commentaire']
  },
  EN_COURS: {
    optionalFields: ['traiteParId', 'commentaire']
  },
  ATTENTE_INFO: {
    optionalFields: ['commentaire']
  },
  // ... other statuses
};

// Validate before transition
export function validateTransitionContext(
  targetStatus: StatutCode,
  context: TransitionContext
): void {
  const requirements = TRANSITION_REQUIREMENTS[targetStatus];
  if (!requirements?.requiredFields) return;

  for (const field of requirements.requiredFields) {
    if (!context[field]) {
      throw new Error(`${field} is required for transition to ${targetStatus}`);
    }
  }
}
```

## Transition Categories

- **Group transitions by actor/trigger**
- Automatic: SOUMIS → RECU, VALIDE → TRAITE
- Admin-initiated: RECU → EN_COURS, EN_COURS → VALIDE, * → REJETE
- Student-initiated: ATTENTE_INFO → EN_COURS (respond with info)
- System-initiated: TRAITE/REJETE → ARCHIVE (scheduled job)
- Why: Clear responsibility; permission checking

```typescript
export const TRANSITION_ACTORS = {
  SYSTEM: ['SOUMIS->RECU', 'VALIDE->TRAITE', 'TRAITE->ARCHIVE', 'REJETE->ARCHIVE'],
  ADMIN: ['RECU->EN_COURS', 'RECU->REJETE', 'EN_COURS->VALIDE', 'EN_COURS->REJETE', 'EN_COURS->ATTENTE_INFO'],
  STUDENT: ['ATTENTE_INFO->EN_COURS']
} as const;

export function canUserTransition(
  userRole: 'STUDENT' | 'ADMIN' | 'SYSTEM',
  from: StatutCode,
  to: StatutCode
): boolean {
  const transitionKey = `${from}->${to}`;
  return TRANSITION_ACTORS[userRole].includes(transitionKey as any);
}
```

## Reverse Transitions

- **Generally disallow reverse/backward transitions**
- Exception: ATTENTE_INFO → EN_COURS (student responds)
- Never allow: TRAITE → VALIDE, ARCHIVE → *
- Create new demande instead of reversing
- Why: Maintains audit trail integrity; prevents data corruption

```typescript
// Don't allow
EN_COURS → RECU ❌
VALIDE → EN_COURS ❌
TRAITE → * ❌
ARCHIVE → * ❌

// Exception (forward progress after pause)
ATTENTE_INFO → EN_COURS ✅ (resume processing)
```

## Terminal States

- **Mark terminal states explicitly**
- Terminal: REJETE, TRAITE, ARCHIVE
- estFinal: true in status metadata
- No outgoing transitions except to ARCHIVE
- Why: Clear end states; prevents accidental modifications

```typescript
export function isTerminalStatus(status: StatutCode): boolean {
  return STATUTS_META[status].estFinal === true;
}

// Prevent modifications to terminal demandes
export async function updateDemande(id: string, updates: Partial<IDemande>) {
  const demande = await Demande.findById(id);

  if (isTerminalStatus(demande.statut.code) && demande.statut.code !== 'ARCHIVE') {
    throw new Error('Cannot modify demandes in terminal state');
  }

  // Allow transition to ARCHIVE
  if (updates.statut?.code === 'ARCHIVE' && isTerminalStatus(demande.statut.code)) {
    // Allow archiving
  }

  // Apply updates...
}
```

## Transition Side Effects Map

- **Document expected side effects for each transition**
- Email notifications, date updates, metadata changes
- Execute in onAfterTransition hook
- Why: Predictable behavior; complete audit trail

```typescript
export const TRANSITION_SIDE_EFFECTS: Record<StatutCode, {
  notifications?: ('EMAIL' | 'SMS' | 'PUSH')[];
  updates?: string[];
  triggers?: string[];
}> = {
  RECU: {
    notifications: ['EMAIL'],
    triggers: ['log_historique', 'send_confirmation']
  },
  TRAITE: {
    notifications: ['EMAIL'],
    updates: ['dateTraitement'],
    triggers: ['log_historique', 'send_completion', 'update_analytics']
  },
  REJETE: {
    notifications: ['EMAIL'],
    triggers: ['log_historique', 'send_rejection']
  },
  ATTENTE_INFO: {
    notifications: ['EMAIL'],
    triggers: ['log_historique', 'send_info_request']
  }
  // ... others
};
```

## Batch Transitions

- **Support bulk status updates for admin efficiency**
- Validate each transition individually
- Rollback all on any failure (use transactions if possible)
- Log each transition separately in historique
- Why: Admin productivity; maintains data integrity

```typescript
export async function batchUpdateStatut(
  demandeIds: string[],
  newStatut: StatutCode,
  context: TransitionContext
): Promise<{ success: string[]; failed: Array<{ id: string; error: string }> }> {
  const results = { success: [], failed: [] };

  for (const id of demandeIds) {
    try {
      const demande = await Demande.findById(id);
      if (!demande) throw new Error('Demande not found');

      // Validate transition
      if (!canTransition(demande.statut.code, newStatut)) {
        throw new Error(`Invalid transition from ${demande.statut.code}`);
      }

      const workflow = new DemandeWorkflow(demande, context.userId);
      await workflow.transition(newStatut, context.commentaire);

      results.success.push(id);
    } catch (error) {
      results.failed.push({
        id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return results;
}
```
