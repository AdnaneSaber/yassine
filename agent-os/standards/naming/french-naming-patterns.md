# French Naming Patterns Standard

## Golden Rules

1. **NO ACCENTS in code** - French terms lose accents in code (étudiant → etudiant)
2. **Use camelCase** for variables/fields with French terms
3. **Use UPPER_SNAKE_CASE** for constants/enums with French terms
4. **Preserve accents in UI display** - strings shown to users keep accents

## Variable & Field Naming

**Pattern**: camelCase with French terms (no accents)

```typescript
// ✅ Correct
const numeroDemande = "DEM-2024-000042";
const dateNaissance = new Date();
const niveauEtude = "M2";
const commentaireAdmin = "Vérification en cours";
const motifRefus = "Documents incomplets";

// ❌ Incorrect - no underscores
const numero_demande = "...";
const date_naissance = "...";

// ❌ Incorrect - no English translation
const requestNumber = "...";
const birthDate = "...";
```

## Collection/Table Naming

**Pattern**: Plural French terms (lowercase in MongoDB, models vary by ORM)

```typescript
// MongoDB/Mongoose collections
'etudiants'      // not 'students' or 'etudiant'
'demandes'       // not 'requests' or 'demande'
'utilisateurs'   // not 'users' or 'utilisateur'
'notifications'
'historique'     // singular (like English 'history')
```

## Model/Schema Naming

**Pattern**: Singular PascalCase with French term

```typescript
// ✅ Mongoose models
export const Etudiant = mongoose.model('Etudiant', etudiantSchema);
export const Demande = mongoose.model('Demande', demandeSchema);
export const Utilisateur = mongoose.model('Utilisateur', utilisateurSchema);

// ✅ Schema variables
const etudiantSchema = new mongoose.Schema({...});
const demandeSchema = new mongoose.Schema({...});
```

## Enum & Constants

**Pattern**: UPPER_SNAKE_CASE with French terms (no accents)

```typescript
// ✅ Status constants
const STATUT = {
  SOUMIS: 'SOUMIS',
  RECU: 'RECU',           // not REÇU
  EN_COURS: 'EN_COURS',
  REJETE: 'REJETE',       // not REJETÉ
  TRAITE: 'TRAITE',       // not TRAITÉ
} as const;

// ✅ Document types
const TYPE_DEMANDE = {
  ATTESTATION_SCOLARITE: 'ATTESTATION_SCOLARITE',
  RELEVE_NOTES: 'RELEVE_NOTES',
} as const;

// ✅ Priorities
const PRIORITE = {
  BASSE: 'BASSE',
  NORMALE: 'NORMALE',
  HAUTE: 'HAUTE',
  URGENTE: 'URGENTE',
} as const;
```

## Embedded Object Patterns

**Pattern**: Nested French terms maintain camelCase

```typescript
// ✅ Embedded subdocuments
{
  etudiant: {
    id: ObjectId,
    nom: "SABER",
    prenom: "Adnane",
    matricule: "2024001"
  },
  typeDemande: {
    code: "ATTESTATION_SCOLARITE",
    nom: "Attestation de scolarité",    // UI string with accents
    delaiTraitement: 3
  },
  statut: {
    code: "EN_COURS",
    libelle: "En cours de traitement",  // UI string with accents
    couleur: "#F59E0B"
  }
}
```

## Array Field Naming

**Pattern**: Plural camelCase

```typescript
{
  documents: [...],      // not document
  notifications: [...],  // not notification
  historique: [...]      // singular (like 'history')
}
```

## Auto-Generated Identifiers

**Pattern**: French prefix with structured format

```typescript
// Request numbers: DEM-{YEAR}-{6-digit-sequential}
numeroDemande: "DEM-2024-000042"
numeroDemande: "DEM-2025-001234"

// Pattern for generation
const year = new Date().getFullYear();
const numeroDemande = `DEM-${year}-${String(count + 1).padStart(6, '0')}`;
```

## UI Display Strings

**Pattern**: Store display strings WITH accents separately from codes

```typescript
// ✅ Code/data layer
{
  statut: {
    code: "RECU",                      // No accent in code
    libelle: "Reçu"                    // Accent in display string
  }
}

// ✅ Type definitions
{
  typeDemande: {
    code: "ATTESTATION_SCOLARITE",     // No accent in code
    nom: "Attestation de scolarité"    // Accents in display string
  }
}
```

## Function/Method Naming

**Pattern**: Use French nouns but English verbs (standard practice)

```typescript
// ✅ Hybrid approach - English verbs, French nouns
createDemande()
updateStatut()
getEtudiants()
deleteNotification()
validateDemande()

// ✅ Pure French (acceptable alternative)
creerDemande()
mettreAJourStatut()
obtenirEtudiants()

// ❌ Avoid pure English
createRequest()
updateStatus()
```

## Service/Controller Naming

**Pattern**: French domain term + English role suffix

```typescript
// ✅ Services
demandes.service.ts
etudiants.service.ts
notifications.service.ts

// ✅ Controllers
demandes.controller.ts
etudiants.controller.ts

// ✅ Routes
demandes.routes.ts
/api/demandes
/api/etudiants
```

## Type Definitions

**Pattern**: French term with Type/Interface suffix

```typescript
// ✅ Interfaces
interface DemandeType {
  numeroDemande: string;
  etudiant: EtudiantInfo;
  typeDemande: TypeDemandeCode;
  statut: StatutCode;
}

interface EtudiantType {
  matricule: string;
  nom: string;
  prenom: string;
  dateNaissance: Date;
}

// ✅ Type aliases
type StatutCode = 'SOUMIS' | 'RECU' | 'EN_COURS' | 'VALIDE' | 'REJETE';
type PrioriteLevel = 'BASSE' | 'NORMALE' | 'HAUTE' | 'URGENTE';
```

## Query Parameter Naming

**Pattern**: camelCase with French terms in API

```typescript
// ✅ Query params
GET /api/demandes?statut=EN_COURS
GET /api/demandes?typeDemande=ATTESTATION_SCOLARITE
GET /api/demandes?priorite=HAUTE
GET /api/etudiants?niveauEtude=M2

// ❌ Avoid English
GET /api/requests?status=IN_PROGRESS
```

## Comments & Documentation

**Pattern**: Code comments in English, domain terms in French

```typescript
// ✅ English explanation, French terms
// Fetch all demandes for the given etudiant
const demandes = await Demande.find({ 'etudiant.id': etudiantId });

// Update statut to VALIDE when admin approves
await updateStatut(demandeId, 'VALIDE');

// ❌ Don't translate domain terms in comments
// Fetch all requests for the given student  ← Wrong
```

## Singular vs Plural Usage

| Context | Form | Example |
|---------|------|---------|
| Collection name | Plural | `etudiants`, `demandes` |
| Model class | Singular | `Etudiant`, `Demande` |
| Schema variable | Singular | `etudiantSchema` |
| Array field | Plural | `documents`, `notifications` |
| Single field | Singular | `etudiant`, `typeDemande` |
| Exception | Singular | `historique` (like 'history') |

## Why These Patterns

These patterns provide:
- **Code compatibility**: No encoding issues, works in all environments
- **Readability**: camelCase is JavaScript/TypeScript convention
- **Domain alignment**: French terms maintain business meaning
- **UI consistency**: Accented display strings match user expectations
- **Developer clarity**: Clear distinction between code and display values
