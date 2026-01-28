# MongoDB References & Denormalization

## Reference vs Embedded Decision

**Rule:** Embed data that is always fetched together, reference data that is independent.

```typescript
// ✅ Good - Embed frequently accessed data
demandes: {
  etudiant: {
    id: ObjectId,      // Reference for updates
    nom: String,       // Denormalized for display
    prenom: String,    // Denormalized for display
    email: String      // Denormalized for notifications
  }
}

// ✅ Good - Reference independent entities
historique: {
  demandeId: {
    type: ObjectId,
    ref: 'Demande'
  },
  utilisateurId: {
    type: ObjectId,
    ref: 'Utilisateur'
  }
}

// ❌ Bad - Only reference without denormalization
demandes: {
  etudiantId: ObjectId  // Requires JOIN on every query
}

// ❌ Bad - Full embedding
demandes: {
  etudiant: {
    // Entire etudiant document embedded
    // Problem: Updates to etudiant don't reflect
  }
}
```

**Why:** Balance read performance vs data consistency, optimize for query patterns.

## Strategic Denormalization Pattern

**Rule:** Store reference ID + frequently accessed fields.

```typescript
// Parent collection: etudiants
{
  _id: ObjectId("abc123"),
  matricule: "2024001",
  nom: "SABER",
  prenom: "Adnane",
  email: "adnane@university.edu",
  niveauEtude: "M2",
  filiere: "Business Intelligence"
}

// Child collection: demandes
{
  etudiant: {
    id: ObjectId("abc123"),  // ← Reference (source of truth for updates)
    nom: "SABER",            // ← Denormalized (read performance)
    prenom: "Adnane",        // ← Denormalized (read performance)
    email: "adnane@university.edu",  // ← Denormalized (notifications)
    matricule: "2024001"     // ← Denormalized (display)
    // NOT included: niveauEtude, filiere (rarely needed)
  }
}
```

**Why:**
- Read optimization: No JOIN needed for 95% of queries
- Write acceptable: Student name changes are rare
- Reference preserves data integrity for updates

## When to Denormalize

**Rule:** Denormalize if update frequency < read frequency × 100.

```typescript
// ✅ Good to denormalize - Rarely changes, frequently read
etudiant: {
  id: ObjectId,
  nom: String,        // Changes rarely
  prenom: String,     // Changes rarely
  email: String       // Changes occasionally
}

typeDemande: {
  code: String,       // Never changes
  nom: String,        // Rarely changes
  delaiTraitement: Number  // Occasionally changes
}

// ❌ Bad to denormalize - Frequently changes
statut: {
  code: String        // Changes frequently
  // Don't store entire status workflow here
}

// ⚠️ Exception: Denormalize for historical accuracy
historique: {
  statutAncien: {
    code: String,
    libelle: String   // Capture exact state at time of change
  },
  statutNouveau: {
    code: String,
    libelle: String
  }
}
```

**Why:** Optimize for common case, minimize update propagation cost.

## Indexing Denormalized Fields

**Rule:** Index commonly queried denormalized fields.

```typescript
demandeSchema.index({ 'etudiant.id': 1 });           // Find by student
demandeSchema.index({ 'statut.code': 1 });           // Filter by status
demandeSchema.index({ 'typeDemande.code': 1 });      // Filter by type
demandeSchema.index({ 'etudiant.id': 1, 'statut.code': 1 });  // Compound

// Query performance
await Demande.find({ 'etudiant.id': studentId })     // Fast with index
await Demande.find({ 'statut.code': 'EN_COURS' })    // Fast with index
```

**Why:** Nested field queries need indexes, compound indexes for common filters.

## Population (Virtual Joins)

**Rule:** Use population sparingly for admin/detailed views only.

```typescript
// ✅ Good - Detailed view (rare operation)
const demande = await Demande.findById(id)
  .populate('traiteParId')  // Full user details for admin view
  .exec();

// ✅ Good - List view (common operation)
const demandes = await Demande.find({ 'statut.code': 'EN_COURS' })
  // No populate - use denormalized fields
  .select('numeroDemande etudiant statut createdAt')
  .exec();

// ❌ Bad - Population on every query
const demandes = await Demande.find()
  .populate('etudiant.id')  // Defeats denormalization purpose
  .exec();
```

**Why:** Population is slow (equivalent to JOIN), use denormalized data for lists.

## Reference-Only Pattern

**Rule:** Use pure references for independent audit/tracking collections.

```typescript
// ✅ Good - Reference-only for audit trail
historiqueSchema = {
  demandeId: {
    type: ObjectId,
    ref: 'Demande',
    required: true
  },
  numeroDemandeRef: String,  // Minimal denormalization for queries
  // ... rest is snapshot of change
}

notificationSchema = {
  demandeId: {
    type: ObjectId,
    ref: 'Demande',
    required: true
  },
  // ... rest is notification data
}
```

**Why:** Audit collections query by reference, minimal denormalization needed.

## Update Propagation Strategy

**Rule:** Document update propagation requirements.

```typescript
// When student name changes:
// 1. Update etudiants collection
await Etudiant.updateOne(
  { _id: etudiantId },
  { nom: newNom, prenom: newPrenom }
);

// 2. Propagate to active demandes (optional based on business rules)
await Demande.updateMany(
  { 'etudiant.id': etudiantId, 'statut.code': { $nin: ['TRAITE', 'ARCHIVE'] } },
  {
    $set: {
      'etudiant.nom': newNom,
      'etudiant.prenom': newPrenom
    }
  }
);

// 3. Historical records: DON'T update (preserve point-in-time accuracy)
// historique collection keeps original names
```

**Why:** Clear propagation rules, balance consistency vs historical accuracy.

## Anti-Pattern: Deep Nesting

**Rule:** Avoid more than 2 levels of nesting.

```typescript
// ✅ Good - 2 levels max
demande: {
  etudiant: {
    id: ObjectId,
    nom: String
  }
}

// ❌ Bad - Too deep
demande: {
  etudiant: {
    coordonnees: {
      adresse: {
        rue: String,
        ville: String
      }
    }
  }
}

// ✅ Better - Flatten or reference
demande: {
  etudiantId: ObjectId,  // Reference to full etudiant document
  etudiantNom: String    // Only essential denormalized fields
}
```

**Why:** Deep nesting complicates queries, updates, and indexing.

## Array References Pattern

**Rule:** Use array of ObjectIds for many-to-many, embed for one-to-many.

```typescript
// ✅ Good - One-to-many: Embed documents
demandes: {
  documents: [{
    id: String,
    url: String,
    nomFichier: String
    // Always belong to this demande, fetched together
  }]
}

// ✅ Good - Many-to-many: Array of references
utilisateur: {
  demandesAssignees: [ObjectId]  // References to demandes
}

// ❌ Bad - Embedding full documents in many-to-many
utilisateur: {
  demandes: [{ /* full demande */ }]  // Duplication, sync nightmare
}
```

**Why:** Embed for composition (part-of), reference for association (related-to).

## Query Optimization Rule

**Rule:** Design schema for your 95% use case queries.

```typescript
// 95% use case: List student's demandes with status
// ✅ Optimized schema - No JOIN needed
demandes: {
  etudiant: {
    id: ObjectId,
    nom: String,      // For display
    matricule: String // For display
  },
  statut: {
    code: String,     // For filtering
    libelle: String,  // For display
    couleur: String   // For UI
  }
}

// Query is fast:
await Demande.find({ 'etudiant.id': studentId })
  .sort({ createdAt: -1 })
  .exec();
// No populate(), no JOIN, single query

// 5% use case: Full student details for admin
// Use populate() when needed
await Demande.findById(id).populate('etudiant.id').exec();
```

**Why:** Optimize for common case, accept slower performance for rare operations.
