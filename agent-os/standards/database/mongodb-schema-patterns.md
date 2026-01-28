# MongoDB Schema Patterns

## Timestamps

**Rule:** Always use automatic timestamps for all collections.

```typescript
const schema = new mongoose.Schema({
  // ... fields
}, {
  timestamps: true  // Adds createdAt, updatedAt automatically
});
```

**Why:** Consistent audit trail, automatic maintenance, zero overhead.

## Embedded Subdocuments

**Rule:** Use embedded objects for structured data that belongs together.

```typescript
// ✅ Good - Structured embedded object
typeDemande: {
  code: {
    type: String,
    required: true,
    enum: ['ATTESTATION_SCOLARITE', 'RELEVE_NOTES']
  },
  nom: String,
  delaiTraitement: Number
}

// ❌ Bad - Flat structure
typeDemandeCode: String,
typeDemandeNom: String,
typeDemandeDelai: Number
```

**Why:** Groups related data, better readability, atomic updates, cleaner queries.

## Code + Label Pattern

**Rule:** Store both machine-readable code and human-readable label.

```typescript
statut: {
  code: {
    type: String,
    required: true,
    enum: ['SOUMIS', 'RECU', 'EN_COURS', 'VALIDE', 'REJETE']
  },
  libelle: String,   // "En cours de traitement"
  couleur: String    // Optional UI metadata
}
```

**Why:** Code for logic/queries, label for display, color for UI consistency.

## Flexible Metadata

**Rule:** Use Mixed type for type-specific variable data.

```typescript
metadata: {
  type: mongoose.Schema.Types.Mixed,
  default: {}
}

// Usage examples:
// Attestation: { nbExemplaires: 2, urgent: true }
// Stage: { entreprise: "Acme", dateDebut: "2024-01-01" }
// Relevé: { periode: "2023-2024", semestre: 2 }
```

**Why:** Flexibility without schema changes, perfect for variable document types.

## Arrays of Embedded Documents

**Rule:** Embed related items that are always fetched together.

```typescript
documents: [{
  id: String,
  nomFichier: String,
  nomOriginal: String,
  url: String,
  typeMime: String,
  taille: Number,
  categorie: String,
  dateUpload: {
    type: Date,
    default: Date.now
  }
}]
```

**Why:** Single query for parent + children, atomic operations, no joins.

## Soft Deletes

**Rule:** Use `actif` boolean field instead of hard deletes.

```typescript
actif: {
  type: Boolean,
  default: true
}

// Query active records
Model.find({ actif: true });

// Soft delete
await doc.updateOne({ actif: false });
```

**Why:** Data preservation, audit compliance, reversible operations.

## Schema Validation

**Rule:** Enforce data quality at schema level.

```typescript
email: {
  type: String,
  required: true,
  unique: true,
  lowercase: true,     // Auto-convert to lowercase
  trim: true,          // Auto-trim whitespace
  match: /^\S+@\S+\.\S+$/  // Email format validation
}

nom: {
  type: String,
  required: true,
  trim: true,
  maxlength: 100       // Length constraint
}

priorite: {
  type: String,
  enum: ['BASSE', 'NORMALE', 'HAUTE', 'URGENTE'],  // Fixed values
  default: 'NORMALE'
}
```

**Why:** Data integrity, consistent format, prevents invalid data at insertion.

## Pre-save Middleware

**Rule:** Use middleware for auto-generated fields and business logic.

```typescript
// Auto-generate unique sequential IDs
schema.pre('save', async function(next) {
  if (!this.numeroDemande) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments({
      numeroDemande: new RegExp(`^DEM-${year}-`)
    });
    this.numeroDemande = `DEM-${year}-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});
```

**Why:** Automatic field population, consistent format, DRY principle.

## Schema Methods

**Rule:** Add instance methods for common operations.

```typescript
// Define method
schema.methods.comparePassword = async function(candidatePassword: string) {
  return await bcrypt.compare(candidatePassword, this.hashPassword);
};

// Usage
const isValid = await user.comparePassword('password123');
```

**Why:** Encapsulation, reusability, cleaner application code.

## Default Values

**Rule:** Set sensible defaults for optional fields.

```typescript
priorite: {
  type: String,
  enum: ['BASSE', 'NORMALE', 'HAUTE', 'URGENTE'],
  default: 'NORMALE'  // Most common case
}

actif: {
  type: Boolean,
  default: true       // New records active by default
}

nbTentatives: {
  type: Number,
  default: 0
}
```

**Why:** Reduces conditional logic, consistent initial state, clearer intent.
