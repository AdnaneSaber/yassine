# MongoDB Naming Conventions

## Field Names

**Rule:** Use camelCase for all field names.

```typescript
// ✅ Good
numeroDemande: String
dateNaissance: Date
niveauEtude: String
createdAt: Date

// ❌ Bad
numero_demande: String    // snake_case
NuméroDemande: String    // PascalCase
numero-demande: String   // kebab-case
```

**Why:** JavaScript convention, Mongoose default, MongoDB best practice.

## Collection Names

**Rule:** Use lowercase plural French nouns.

```typescript
// ✅ Good
etudiants
demandes
utilisateurs
notifications
historique  // Already plural in French

// ❌ Bad
Etudiants   // Capitalized
etudiant    // Singular
students    // English
```

**Why:** MongoDB convention (lowercase), clear pluralization, French context.

## ObjectId Reference Fields

**Rule:** Suffix with `Id` for top-level ObjectId references.

```typescript
// ✅ Good - Top level references
demandeId: ObjectId
traiteParId: ObjectId
utilisateurId: ObjectId

// ✅ Good - Nested object references use 'id'
etudiant: {
  id: ObjectId,  // Not 'etudiantId' when nested
  nom: String
}

// ❌ Bad
demande: ObjectId        // Missing 'Id' suffix
demandeObjectId: ObjectId  // Too verbose
```

**Why:** Clear indication of reference type, consistent pattern, avoids ambiguity.

## Boolean Fields

**Rule:** Use adjectives without 'is' prefix.

```typescript
// ✅ Good
actif: Boolean
urgent: Boolean
valide: Boolean

// ❌ Bad
isActif: Boolean
estActif: Boolean
active: Boolean  // English
```

**Why:** Cleaner in French, consistent with data modeling, less verbose in queries.

## Date Fields

**Rule:** Prefix with 'date' for clarity.

```typescript
// ✅ Good
dateNaissance: Date
dateTraitement: Date
dateEnvoi: Date
dateUpload: Date

// ⚠️ Exception - timestamps
createdAt: Date  // Mongoose convention
updatedAt: Date  // Mongoose convention

// ❌ Bad
naissance: Date  // Ambiguous type
traitement: Date
```

**Why:** Clear type indication, prevents confusion with boolean/status fields.

## Enum Fields

**Rule:** Use SCREAMING_SNAKE_CASE for enum values.

```typescript
// ✅ Good
role: {
  type: String,
  enum: ['STUDENT', 'ADMIN', 'SUPER_ADMIN']
}

statut: {
  code: {
    type: String,
    enum: ['SOUMIS', 'RECU', 'EN_COURS', 'ATTENTE_INFO']
  }
}

priorite: {
  type: String,
  enum: ['BASSE', 'NORMALE', 'HAUTE', 'URGENTE']
}

// ❌ Bad
enum: ['student', 'admin']        // lowercase
enum: ['Soumis', 'Reçu']         // Mixed case
enum: ['en-cours', 'validé']     // kebab-case, accents
```

**Why:** Constants convention, high visibility, no accent issues, clear distinction.

## Embedded Object Fields

**Rule:** Use singular noun for the object, nested fields in camelCase.

```typescript
// ✅ Good
etudiant: {          // Singular object
  id: ObjectId,
  nom: String,
  prenom: String,
  matricule: String
}

typeDemande: {       // Singular object
  code: String,
  nom: String,
  delaiTraitement: Number
}

// ❌ Bad
etudiants: {         // Plural for single object
  id: ObjectId
}

etudiant_nom: String // Flat instead of nested
```

**Why:** Semantic clarity, proper nesting, avoids namespace pollution.

## Array Fields

**Rule:** Use plural nouns for arrays.

```typescript
// ✅ Good
documents: [{
  nomFichier: String,
  url: String
}]

historiques: [{
  action: String,
  date: Date
}]

// ❌ Bad
document: [{...}]        // Singular for array
documentList: [{...}]    // Redundant 'List'
documentsArray: [{...}]  // Redundant 'Array'
```

**Why:** Clear plurality, semantic correctness, self-documenting code.

## Count/Number Fields

**Rule:** Prefix with 'nb' (nombre) or 'count'.

```typescript
// ✅ Good
nbTentatives: Number
nbExemplaires: Number
countDocuments: Number

// ❌ Bad
tentatives: Number       // Could be array
exemplaires: Number      // Ambiguous
numberOfAttempts: Number // English
```

**Why:** Distinguishes counts from arrays, French convention, clear intent.

## Private/Internal Fields

**Rule:** Prefix with underscore only for truly internal fields.

```typescript
// ✅ Good - Reserved for special cases
_computed: Mixed       // Cached computed value
_migrationVersion: Number

// ⚠️ Avoid in normal schemas
// MongoDB reserves _id automatically
// Mongoose uses __v for versioning

// ❌ Bad - Overuse
_nom: String           // No reason to be private
_status: String        // Should be public
```

**Why:** Reserved for special cases, avoid confusion with MongoDB internals.

## Denormalized Fields Suffix

**Rule:** Add 'Ref' suffix for denormalized reference data.

```typescript
// ✅ Good - Clear it's a reference copy
numeroDemandeRef: String  // Copy from demandes.numeroDemande

historique: {
  demandeId: ObjectId,
  numeroDemandeRef: String  // Denormalized for queries
}

// Alternative: No suffix but document in comments
demandeId: ObjectId,
numeroDemande: String  // Denormalized from demandes collection

// ❌ Bad
numeroDemandeBackup: String   // Confusing purpose
numeroDemandeCache: String    // Not a cache
```

**Why:** Explicit denormalization signal, aids understanding, documents intent.

## Avoid Accents

**Rule:** Never use accents in field names.

```typescript
// ✅ Good
createdAt: Date
prenom: String
filiere: String

// ❌ Bad
créé_le: Date
prénom: String
filière: String
```

**Why:** Cross-platform compatibility, API safety, no encoding issues.

## Model Names

**Rule:** PascalCase singular for Mongoose models.

```typescript
// ✅ Good
export const Etudiant = mongoose.model('Etudiant', etudiantSchema);
export const Demande = mongoose.model('Demande', demandeSchema);
export const Utilisateur = mongoose.model('Utilisateur', utilisateurSchema);

// ❌ Bad
export const etudiant = ...      // lowercase
export const Etudiants = ...     // plural
export const ETUDIANT = ...      // SCREAMING
```

**Why:** TypeScript/JavaScript class convention, Mongoose convention, clarity.
