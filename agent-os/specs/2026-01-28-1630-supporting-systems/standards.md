# Supporting Systems - Relevant Standards

This document outlines the applicable standards from the Agent OS standards library that must be followed when implementing the Supporting Systems.

## API Standards

### 1. Endpoint Conventions
**Standard:** `agent-os/standards/api/endpoint-conventions.md`

**Applies to:**
- Upload API endpoint (`/api/upload`)
- Notification API endpoints (`/api/notifications`)
- Analytics API endpoints (`/api/analytics/*`)
- Cron job endpoints (`/api/cron/*`)

**Key Requirements:**
```typescript
// Upload endpoint
POST   /api/upload                    // Upload single file
POST   /api/upload/batch              // Upload multiple files
GET    /api/upload/[fileId]           // Get file metadata

// Notifications endpoint
POST   /api/notifications             // Create notification
GET    /api/notifications             // List notifications (paginated)
GET    /api/notifications/[id]        // Get notification details
PATCH  /api/notifications/[id]/retry  // Retry failed notification

// Analytics endpoints
GET    /api/analytics/dashboard       // Dashboard metrics
GET    /api/analytics/trends          // Historical trends
GET    /api/analytics/export          // Export data as CSV
GET    /api/analytics/by-type         // Breakdown by type
GET    /api/analytics/by-status       // Breakdown by status

// Cron endpoints (protected by Vercel Cron secret)
GET    /api/cron/send-notifications   // Process email queue
GET    /api/cron/auto-archive         // Archive old demandes
GET    /api/cron/cleanup              // Cleanup old records
GET    /api/cron/calculate-metrics    // Daily metrics calculation
```

**Query Parameters for Analytics:**
```typescript
// Pagination
?page=1&limit=20

// Date filtering
?startDate=2024-01-01&endDate=2024-01-31

// Metric selection
?metrics=volume,performance,quality

// Grouping
?groupBy=type|status|admin
```

### 2. Error Handling
**Standard:** `agent-os/standards/api/error-handling.md`

**Error Codes for Supporting Systems:**
```typescript
// Upload errors: UPL_xxx
UPL_001 = "File type not allowed"
UPL_002 = "File size exceeds limit (5MB)"
UPL_003 = "Upload to Cloudinary failed"
UPL_004 = "Invalid file format"
UPL_005 = "File limit exceeded (max 5 files)"

// Notification errors: NOT_xxx
NOT_001 = "Failed to create notification"
NOT_002 = "Email send failed"
NOT_003 = "Invalid email address"
NOT_004 = "Template rendering failed"
NOT_005 = "Notification not found"

// Analytics errors: ANA_xxx
ANA_001 = "Invalid date range"
ANA_002 = "Metric calculation failed"
ANA_003 = "Export generation failed"
ANA_004 = "Insufficient data for metric"

// Cron errors: CRN_xxx
CRN_001 = "Job execution failed"
CRN_002 = "Invalid cron secret"
CRN_003 = "Job already running"
```

**Error Response Examples:**
```typescript
// File upload failure
{
  "success": false,
  "error": {
    "code": "UPL_002",
    "message": "File size exceeds limit (5MB)",
    "details": {
      "filename": "document.pdf",
      "size": 6291456,
      "maxSize": 5242880
    }
  }
}

// Email send failure
{
  "success": false,
  "error": {
    "code": "NOT_002",
    "message": "Email send failed",
    "details": {
      "destinataire": "student@university.edu",
      "errorMessage": "SMTP connection timeout"
    }
  }
}
```

### 3. Response Format
**Standard:** `agent-os/standards/api/response-format.md`

**Success Response Examples:**
```typescript
// Upload success
{
  "success": true,
  "data": {
    "id": "cloudinary-public-id-123",
    "url": "https://res.cloudinary.com/demo/image/upload/v123/file.pdf",
    "nomFichier": "document.pdf",
    "taille": 245760,
    "typeMime": "application/pdf",
    "dateUpload": "2024-01-28T10:30:00Z"
  }
}

// Analytics response
{
  "success": true,
  "data": {
    "volume": {
      "total": 145,
      "byType": {
        "ATTESTATION_SCOLARITE": 65,
        "RELEVE_NOTES": 50,
        "CONVENTION_STAGE": 30
      }
    },
    "performance": {
      "averageProcessingTime": 48.5,
      "slaComplianceRate": 87.5
    }
  }
}

// Notification list (paginated)
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "demandeId": "507f191e810c19729de860ea",
      "type": "CONFIRMATION",
      "destinataire": "student@university.edu",
      "statutEnvoi": "ENVOYE",
      "dateEnvoi": "2024-01-28T10:35:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 145,
    "totalPages": 8
  }
}
```

## Database Standards

### 4. MongoDB Schema Patterns
**Standard:** `agent-os/standards/database/mongodb-schema-patterns.md`

**Notification Model:**
```typescript
import mongoose, { Schema, Document } from 'mongoose';

interface INotification {
  demandeId: mongoose.Types.ObjectId;
  numeroDemandeRef: string;
  type: 'CONFIRMATION' | 'STATUS_CHANGE' | 'REJECTION' | 'APPROVAL' | 'REMINDER';
  destinataire: string;
  objet: string;
  contenu: string;
  statutEnvoi: 'EN_ATTENTE' | 'ENVOYE' | 'ECHEC';
  nbTentatives: number;
  erreur?: string;
  dateEnvoi?: Date;
  metadata: {
    templateData: Record<string, any>;
    priority: 'LOW' | 'NORMAL' | 'HIGH';
  };
}

interface INotificationDocument extends INotification, Document {}

const notificationSchema = new Schema<INotificationDocument>({
  demandeId: {
    type: Schema.Types.ObjectId,
    ref: 'Demande',
    required: true,
    index: true
  },
  numeroDemandeRef: {
    type: String,
    required: true,
    index: true  // For quick queries
  },
  type: {
    type: String,
    enum: ['CONFIRMATION', 'STATUS_CHANGE', 'REJECTION', 'APPROVAL', 'REMINDER'],
    required: true
  },
  destinataire: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    match: /^\S+@\S+\.\S+$/
  },
  objet: {
    type: String,
    required: true,
    maxlength: 255
  },
  contenu: {
    type: String,
    required: true
  },
  statutEnvoi: {
    type: String,
    enum: ['EN_ATTENTE', 'ENVOYE', 'ECHEC'],
    default: 'EN_ATTENTE',
    index: true  // For queue queries
  },
  nbTentatives: {
    type: Number,
    default: 0,
    min: 0
  },
  erreur: String,
  dateEnvoi: Date,
  metadata: {
    templateData: {
      type: Schema.Types.Mixed,
      default: {}
    },
    priority: {
      type: String,
      enum: ['LOW', 'NORMAL', 'HIGH'],
      default: 'NORMAL'
    }
  }
}, {
  timestamps: true  // Adds createdAt, updatedAt
});

// Indexes for efficient queries
notificationSchema.index({ demandeId: 1, createdAt: -1 });
notificationSchema.index({ statutEnvoi: 1, nbTentatives: 1 });
notificationSchema.index({ createdAt: -1 });

export const Notification = mongoose.model<INotificationDocument>('Notification', notificationSchema);
```

**Document Model (embedded in Demande):**
```typescript
// Embedded in Demande schema
documents: [{
  id: {
    type: String,
    required: true  // Cloudinary public_id
  },
  nomFichier: {
    type: String,
    required: true,
    trim: true
  },
  nomOriginal: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  typeMime: {
    type: String,
    required: true,
    enum: [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
  },
  taille: {
    type: Number,
    required: true,
    min: 1,
    max: 5242880  // 5MB
  },
  categorie: {
    type: String,
    enum: ['PIECE_JOINTE', 'ATTESTATION_GENEREE', 'JUSTIFICATIF']
  },
  dateUpload: {
    type: Date,
    default: Date.now
  }
}]
```

**Historique Model (enhanced for analytics):**
```typescript
// Already defined in core, but add indexes for analytics
historiqueSchema.index({ demandeId: 1 });
historiqueSchema.index({ createdAt: -1 });
historiqueSchema.index({ 'utilisateur.id': 1, createdAt: -1 });
historiqueSchema.index({ typeAction: 1, createdAt: -1 });
```

### 5. MongoDB Naming Conventions
**Standard:** `agent-os/standards/database/mongodb-naming-conventions.md`

**Field Naming:**
- `demandeId` - ObjectId reference (top-level)
- `numeroDemandeRef` - Denormalized reference field
- `destinataire` - Email recipient (French term)
- `statutEnvoi` - Sending status (French term)
- `nbTentatives` - Number of attempts (French "nb" prefix)
- `dateEnvoi` - Send date (French "date" prefix)
- `nomFichier` - Filename (French)
- `nomOriginal` - Original filename (French)
- `typeMime` - MIME type (camelCase)
- `dateUpload` - Upload date (French)

**Collection Names:**
- `notifications` - Lowercase plural
- `demandes` - Already defined
- `historique` - Already plural in French

### 6. MongoDB References
**Standard:** `agent-os/standards/database/mongodb-references.md`

**Reference Pattern:**
```typescript
// Notification references Demande
demandeId: {
  type: Schema.Types.ObjectId,
  ref: 'Demande',
  required: true
}

// Denormalized field for queries
numeroDemandeRef: String  // Copy of demandes.numeroDemande

// Why: Notifications are queried by demande number,
// denormalizing avoids join on every query
```

**Document Embedding:**
```typescript
// Documents embedded in Demande (NOT separate collection)
// Why: Documents are always accessed with their demande,
// never independently. Embedding provides single-query access
// and atomic updates.
```

## TypeScript Standards

### 7. Type Definitions
**Standard:** `agent-os/standards/typescript/type-definitions.md`

**Notification Types:**
```typescript
// String literal unions (not enums)
type NotificationType =
  | 'CONFIRMATION'
  | 'STATUS_CHANGE'
  | 'REJECTION'
  | 'APPROVAL'
  | 'REMINDER';

type StatutEnvoi = 'EN_ATTENTE' | 'ENVOYE' | 'ECHEC';
type NotificationPriority = 'LOW' | 'NORMAL' | 'HIGH';

// API response types
type UploadResponse = ApiResponse<DocumentMetadata>;
type NotificationResponse = ApiResponse<INotification>;
type AnalyticsResponse = ApiResponse<DashboardMetrics>;

// Zod schemas for validation
import { z } from 'zod';

export const uploadFileSchema = z.object({
  file: z.instanceof(File)
    .refine(file => file.size <= 5242880, "File must be less than 5MB")
    .refine(
      file => ['application/pdf', 'image/jpeg', 'image/png'].includes(file.type),
      "Only PDF, JPG, PNG files allowed"
    )
});

export const createNotificationSchema = z.object({
  demandeId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId"),
  type: z.enum(['CONFIRMATION', 'STATUS_CHANGE', 'REJECTION', 'APPROVAL', 'REMINDER']),
  destinataire: z.string().email("Invalid email address"),
  metadata: z.object({
    templateData: z.record(z.any()),
    priority: z.enum(['LOW', 'NORMAL', 'HIGH']).default('NORMAL')
  })
});

export const analyticsQuerySchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  groupBy: z.enum(['type', 'status', 'admin']).optional(),
  metrics: z.array(z.enum(['volume', 'performance', 'quality'])).optional()
});

// Infer types from schemas
export type UploadFileInput = z.infer<typeof uploadFileSchema>;
export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
export type AnalyticsQuery = z.infer<typeof analyticsQuerySchema>;
```

### 8. Type Organization
**Standard:** `agent-os/standards/typescript/type-organization.md`

**File Structure:**
```
types/
├── notification.ts        # Notification-related types
├── document.ts           # Document metadata types
├── analytics.ts          # Analytics and metrics types
└── email.ts             # Email template types
```

**notification.ts:**
```typescript
export type NotificationType = 'CONFIRMATION' | 'STATUS_CHANGE' | 'REJECTION' | 'APPROVAL' | 'REMINDER';
export type StatutEnvoi = 'EN_ATTENTE' | 'ENVOYE' | 'ECHEC';

export interface INotification {
  _id: string;
  demandeId: string;
  numeroDemandeRef: string;
  type: NotificationType;
  destinataire: string;
  objet: string;
  contenu: string;
  statutEnvoi: StatutEnvoi;
  nbTentatives: number;
  erreur?: string;
  dateEnvoi?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

## Naming Standards

### 9. Domain Terminology
**Standard:** `agent-os/standards/naming/domain-terminology.md`

**Supporting Systems Terms:**
```typescript
// Notification terminology
destinataire: string      // Recipient (French)
objet: string            // Subject (French)
contenu: string          // Content (French)
statutEnvoi: string      // Send status (French)
nbTentatives: number     // Number of attempts (French)

// Document terminology
nomFichier: string       // Filename (French)
nomOriginal: string      // Original filename (French)
taille: number          // Size (French)
dateUpload: Date        // Upload date (French)

// Analytics terminology
delai: number           // Delay/duration (French)
tauxAprobation: number  // Approval rate (French)
moyenneTraitement: number  // Average processing time (French)
```

### 10. French Naming Patterns
**Standard:** `agent-os/standards/naming/french-naming-patterns.md`

**No Accents in Code:**
```typescript
// ✅ Good - No accents
destinataire: string
objet: string
delai: number
taux: number

// ❌ Bad - Accents in code
destinätaire: string
délai: number
```

**UI Labels with Accents:**
```typescript
// Code: no accents
const labels = {
  destinataire: "Destinataire",
  objet: "Objet",
  delai: "Délai de traitement",
  taux: "Taux d'approbation"
};
```

## Project Structure Standards

### 11. Next.js App Router Structure
**Standard:** `agent-os/standards/project-structure/nextjs-app-router-structure.md`

**Supporting Systems File Organization:**
```
app/
├── api/
│   ├── upload/
│   │   └── route.ts              # POST /api/upload
│   ├── notifications/
│   │   ├── route.ts              # GET, POST /api/notifications
│   │   └── [id]/
│   │       └── route.ts          # GET, PATCH /api/notifications/:id
│   ├── analytics/
│   │   ├── dashboard/
│   │   │   └── route.ts          # GET /api/analytics/dashboard
│   │   ├── trends/
│   │   │   └── route.ts          # GET /api/analytics/trends
│   │   └── export/
│   │       └── route.ts          # GET /api/analytics/export
│   └── cron/
│       ├── send-notifications/
│       │   └── route.ts          # GET /api/cron/send-notifications
│       ├── auto-archive/
│       │   └── route.ts          # GET /api/cron/auto-archive
│       └── calculate-metrics/
│           └── route.ts          # GET /api/cron/calculate-metrics
│
├── actions/
│   ├── upload.ts                 # Server action for file upload
│   └── notifications.ts          # Server action for notifications
│
lib/
├── email/
│   ├── send.ts                   # Email sending service
│   └── templates/
│       ├── demande-recue.tsx
│       ├── demande-validee.tsx
│       ├── demande-rejetee.tsx
│       └── changement-statut.tsx
│
├── upload/
│   └── cloudinary.ts             # Cloudinary integration
│
├── notifications/
│   ├── create.ts                 # Create notification
│   ├── send.ts                   # Send notification
│   └── retry.ts                  # Retry failed notifications
│
├── analytics/
│   ├── calculate.ts              # Calculate metrics
│   ├── aggregate.ts              # MongoDB aggregations
│   └── export.ts                 # Export data
│
└── db/
    └── models/
        └── notification.ts       # Notification model
```

## Workflow Standards

### 12. State Machine Integration
**Standard:** `agent-os/standards/workflow/state-machine-patterns.md`

**Notification Hooks in Workflow:**
```typescript
// lib/workflow/state-machine.ts

const onTransition = {
  async toRECU(demande: Demande) {
    // Create notification
    await createNotification({
      demandeId: demande._id,
      type: 'CONFIRMATION',
      destinataire: demande.etudiant.email,
      metadata: {
        templateData: {
          numeroDemande: demande.numeroDemande,
          typeDemande: demande.typeDemande.nom,
          etudiantNom: demande.etudiant.nom
        },
        priority: 'NORMAL'
      }
    });

    // Log historique
    await logHistorique(demande._id, 'SOUMIS', 'RECU', 'SYSTEM');
  },

  async toVALIDE(demande: Demande) {
    // Create validation notification
    await createNotification({
      demandeId: demande._id,
      type: 'APPROVAL',
      destinataire: demande.etudiant.email,
      metadata: {
        templateData: {
          numeroDemande: demande.numeroDemande,
          dateValidation: new Date()
        },
        priority: 'HIGH'
      }
    });
  },

  async toREJETE(demande: Demande) {
    // Create rejection notification
    await createNotification({
      demandeId: demande._id,
      type: 'REJECTION',
      destinataire: demande.etudiant.email,
      metadata: {
        templateData: {
          numeroDemande: demande.numeroDemande,
          motifRefus: demande.motifRefus
        },
        priority: 'HIGH'
      }
    });
  }
};
```

## Summary

This spec must follow:
- ✅ API endpoint conventions (RESTful, validation, error handling)
- ✅ Consistent response format (success/error envelope)
- ✅ MongoDB schema patterns (timestamps, validation, indexes)
- ✅ MongoDB naming conventions (camelCase, French terms, no accents)
- ✅ TypeScript type definitions (Zod schemas, discriminated unions)
- ✅ Type organization (colocated, single source of truth)
- ✅ Domain terminology (French business terms)
- ✅ Next.js App Router structure (route groups, API routes, server actions)
- ✅ Workflow integration (notification hooks on transitions)

All standards are mandatory and must be applied consistently across the Supporting Systems implementation.
