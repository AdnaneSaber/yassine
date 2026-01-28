# Domain Terminology Standard

## Core Domain Terms

**ALWAYS use French academic terminology in code and database schemas.** French terms reflect the domain language of the French academic administrative system.

### Primary Entities

- **demande** = request (administrative request)
- **étudiant** = student
- **utilisateur** = user (system user)
- **historique** = history (audit trail)
- **notification** = notification

### Document Types (enum values)

```typescript
// Code: UPPER_SNAKE_CASE, no accents
enum TypeDemande {
  ATTESTATION_SCOLARITE    // UI: "Attestation de scolarité"
  RELEVE_NOTES             // UI: "Relevé de notes"
  ATTESTATION_REUSSITE     // UI: "Attestation de réussite"
  DUPLICATA_CARTE          // UI: "Duplicata de carte"
  CONVENTION_STAGE         // UI: "Convention de stage"
}
```

### Status Values (workflow states)

```typescript
// Code: UPPER_SNAKE_CASE, no accents
enum StatutDemande {
  SOUMIS        // UI: "Soumis"
  RECU          // UI: "Reçu"
  EN_COURS      // UI: "En cours"
  ATTENTE_INFO  // UI: "En attente d'information"
  VALIDE        // UI: "Validé"
  REJETE        // UI: "Rejeté"
  TRAITE        // UI: "Traité"
  ARCHIVE       // UI: "Archivé"
}
```

### Priority Levels

```typescript
// Code: UPPER_SNAKE_CASE, no accents
enum Priorite {
  BASSE     // UI: "Basse"
  NORMALE   // UI: "Normale"
  HAUTE     // UI: "Haute"
  URGENTE   // UI: "Urgente"
}
```

### User Roles

```typescript
// Code: UPPER_SNAKE_CASE, English OR French
enum Role {
  STUDENT       // Alternative: ETUDIANT
  ADMIN
  SUPER_ADMIN
}
```

### Action Types (audit log)

```typescript
// Code: UPPER_SNAKE_CASE, no accents
enum TypeAction {
  CREATION
  CHANGEMENT_STATUT
  MODIFICATION
  COMMENTAIRE
}
```

### Notification Types

```typescript
enum TypeNotification {
  EMAIL
  SMS
}

enum StatutEnvoi {
  EN_ATTENTE
  ENVOYE
  ECHEC
}
```

## Student Academic Fields

```typescript
// Academic levels
enum NiveauEtude {
  L1, L2, L3    // Licence (Bachelor)
  M1, M2        // Master
  Doctorat      // PhD
}

// Student attributes
{
  matricule: string     // Student ID number
  nom: string          // Last name
  prenom: string       // First name
  filiere: string      // Academic program/major
  niveauEtude: string  // Academic level
}
```

## Common French Field Terms

- **date** prefix: `dateNaissance`, `dateTraitement`, `dateUpload`
- **numero**: `numeroDemande` (format: DEM-YYYY-NNNNNN)
- **nom/prenom**: always separate fields
- **objet**: subject/title of request
- **description**: detailed description
- **commentaire**: comment/note (e.g., `commentaireAdmin`)
- **motif**: reason (e.g., `motifRefus`)
- **delai**: delay/deadline (e.g., `delaiTraitement`)
- **taille**: size (file size)
- **fichier**: file (e.g., `nomFichier`, `nomOriginal`)

## Business Logic Terms

- **traiteParId**: processed by user ID
- **destinataire**: recipient
- **tentatives**: attempts (e.g., `nbTentatives`)
- **actif**: active/enabled status

## Why French Terms

French terminology is used because:
- Reflects authentic domain language of French academic institutions
- Maintains consistency with user-facing terminology
- Reduces translation ambiguity between code and UI
- Aligns with stakeholder vocabulary (students, administrative staff)
