# State Machine Patterns

## Status Code Naming

- **Use UPPER_SNAKE_CASE for all status codes**
- Single-word statuses: `RECU`, `VALIDE`, `TRAITE`, `ARCHIVE`
- Multi-word statuses: `EN_COURS`, `ATTENTE_INFO`
- Why: Consistency across database, API, and UI; easily distinguishable from display labels

```typescript
// Correct
type StatutCode = 'SOUMIS' | 'RECU' | 'EN_COURS' | 'ATTENTE_INFO' | 'VALIDE' | 'REJETE' | 'TRAITE' | 'ARCHIVE';

// Incorrect
type StatutCode = 'soumis' | 'Recu' | 'en-cours' | 'enCours';
```

## Status Metadata Structure

- **Every status MUST have: code, libelle, couleur**
- Optional: description, ordre, estFinal
- Store metadata centrally in constant/config
- Why: Ensures UI consistency; single source of truth for status rendering

```typescript
export const STATUTS_META: Record<StatutCode, StatusMeta> = {
  SOUMIS: {
    libelle: 'Soumis',
    couleur: '#6B7280',
    estFinal: false
  },
  RECU: {
    libelle: 'Reçu',
    couleur: '#3B82F6',
    estFinal: false
  },
  EN_COURS: {
    libelle: 'En cours',
    couleur: '#F59E0B',
    estFinal: false
  },
  ATTENTE_INFO: {
    libelle: 'En attente d\'information',
    couleur: '#F59E0B',
    estFinal: false
  },
  VALIDE: {
    libelle: 'Validé',
    couleur: '#10B981',
    estFinal: false
  },
  REJETE: {
    libelle: 'Rejeté',
    couleur: '#EF4444',
    estFinal: true
  },
  TRAITE: {
    libelle: 'Traité',
    couleur: '#059669',
    estFinal: true
  },
  ARCHIVE: {
    libelle: 'Archivé',
    couleur: '#6B7280',
    estFinal: true
  }
};
```

## Workflow Class Pattern

- **Encapsulate state machine logic in dedicated class**
- Constructor accepts entity and optional userId for audit trail
- transition() method handles state changes with validation
- Why: Centralized workflow logic; prevents invalid state transitions

```typescript
export class DemandeWorkflow {
  private demande: IDemande;
  private userId?: string;

  constructor(demande: IDemande, userId?: string) {
    this.demande = demande;
    this.userId = userId;
  }

  async transition(newStatut: StatutCode, commentaire?: string): Promise<void> {
    const currentStatut = this.demande.statut.code;

    // Validate transition
    if (!canTransition(currentStatut, newStatut)) {
      throw new Error(`Invalid transition: ${currentStatut} → ${newStatut}`);
    }

    // Execute transition with hooks
    await this.onBeforeTransition(currentStatut, newStatut);

    // Update status
    this.demande.statut = {
      code: newStatut,
      ...STATUTS_META[newStatut]
    };

    await this.demande.save();
    await this.logHistorique(commentaire);
    await this.onAfterTransition(currentStatut, newStatut);
  }

  private async onBeforeTransition(from: StatutCode, to: StatutCode): Promise<void> {
    // Pre-transition validation and setup
  }

  private async onAfterTransition(from: StatutCode, to: StatutCode): Promise<void> {
    // Post-transition side effects (emails, notifications)
  }

  private async logHistorique(commentaire?: string): Promise<void> {
    // Create audit trail entry
  }
}
```

## Transition Hooks

- **Use onBeforeTransition for validation and setup**
- Pre-checks: required fields, permissions, business rules
- **Use onAfterTransition for side effects**
- Post-actions: emails, notifications, metadata updates, analytics
- Why: Separation of concerns; predictable execution order

```typescript
private async onBeforeTransition(from: StatutCode, to: StatutCode): Promise<void> {
  // Validate required fields
  if (to === 'REJETE' && !this.demande.motifRefus) {
    throw new Error('motifRefus is required when rejecting');
  }

  // Check permissions
  if (to === 'VALIDE' && !this.hasPermission('validate')) {
    throw new Error('Insufficient permissions');
  }
}

private async onAfterTransition(from: StatutCode, to: StatutCode): Promise<void> {
  // Send notifications based on new status
  if (to === 'RECU') {
    await sendEmail({
      to: this.demande.etudiant.email,
      template: 'demande-recue',
      data: { numeroDemande: this.demande.numeroDemande }
    });
  }

  if (to === 'TRAITE') {
    this.demande.dateTraitement = new Date();
    await this.demande.save();
  }
}
```

## Auto-Transitions

- **Document which transitions are automatic vs manual**
- Automatic: SOUMIS → RECU (on submit), VALIDE → TRAITE (on validation)
- Manual: RECU → EN_COURS (admin assigns), EN_COURS → VALIDE (admin validates)
- Trigger auto-transitions immediately after triggering event
- Why: Clear expectations; prevents stuck states

```typescript
// Auto-transition on creation
export async function createDemande(data: CreateDemandeInput) {
  const demande = await Demande.create({
    ...data,
    statut: {
      code: 'SOUMIS',
      ...STATUTS_META['SOUMIS']
    }
  });

  // Auto-transition to RECU
  const workflow = new DemandeWorkflow(demande, 'SYSTEM');
  await workflow.transition('RECU', 'Auto-transition on submission');

  return demande;
}
```

## Error Handling

- **Throw descriptive errors for invalid transitions**
- Include current status, attempted status in error message
- Log all transition errors for debugging
- Return user-friendly messages to client
- Why: Easier debugging; better user experience

```typescript
async transition(newStatut: StatutCode, commentaire?: string): Promise<void> {
  const currentStatut = this.demande.statut.code;

  if (!canTransition(currentStatut, newStatut)) {
    const error = new Error(
      `Invalid transition: ${currentStatut} → ${newStatut}. ` +
      `Valid transitions from ${currentStatut}: ${WORKFLOW_TRANSITIONS[currentStatut].join(', ')}`
    );
    console.error('Workflow transition error:', {
      demandeId: this.demande.id,
      from: currentStatut,
      to: newStatut,
      userId: this.userId
    });
    throw error;
  }

  // Continue with transition...
}
```
