# Supporting Systems - Implementation Plan

## Overview

This plan outlines the step-by-step implementation of the Supporting Systems for the academic administrative request management platform. Each task is actionable with clear deliverables, acceptance criteria, and code patterns.

**Total Estimated Time:** 11-14 days
**Priority:** High - Required for complete system functionality
**Dependencies:** Core workflow system, database models

---

## Task 1: Project Setup and Spec Documentation

**Duration:** 0.5 days
**Priority:** High
**Dependencies:** None

### Objectives
- Set up project structure for supporting systems
- Install required dependencies
- Document API contracts and data models

### Deliverables

#### 1.1 Install Dependencies
```bash
# Email service
npm install resend react-email @react-email/components

# Alternative: Nodemailer
npm install nodemailer @types/nodemailer

# File upload
npm install cloudinary

# Validation
npm install zod

# Already installed: mongoose, next
```

#### 1.2 Environment Variables
Add to `.env.local`:
```bash
# Email Service (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxxx

# Alternative: Nodemailer SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Cron Jobs (Vercel sets this automatically in production)
CRON_SECRET=your-secret-key-for-local-testing

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### 1.3 TypeScript Types Setup
Create type definitions:

**types/notification.ts:**
```typescript
export type NotificationType =
  | 'CONFIRMATION'
  | 'STATUS_CHANGE'
  | 'REJECTION'
  | 'APPROVAL'
  | 'REMINDER';

export type StatutEnvoi = 'EN_ATTENTE' | 'ENVOYE' | 'ECHEC';
export type NotificationPriority = 'LOW' | 'NORMAL' | 'HIGH';

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
  metadata: {
    templateData: Record<string, any>;
    priority: NotificationPriority;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

**types/document.ts:**
```typescript
export interface IDocument {
  id: string;
  nomFichier: string;
  nomOriginal: string;
  url: string;
  typeMime: string;
  taille: number;
  categorie?: 'PIECE_JOINTE' | 'ATTESTATION_GENEREE' | 'JUSTIFICATIF';
  dateUpload: Date;
}

export interface DocumentUploadResult {
  success: boolean;
  data?: IDocument;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}
```

**types/analytics.ts:**
```typescript
export interface DashboardMetrics {
  volume: {
    total: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
  };
  performance: {
    averageProcessingTime: number;
    processingTimeByType: Record<string, number>;
    slaComplianceRate: number;
  };
  quality: {
    approvalRate: number;
    rejectionRate: number;
    rejectionReasons: Record<string, number>;
  };
}

export interface TrendData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
  }>;
}
```

#### 1.4 Validation Schemas
**lib/validators/upload.ts:**
```typescript
import { z } from 'zod';

const MAX_FILE_SIZE = 5242880; // 5MB
const ACCEPTED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

export const uploadFileSchema = z.object({
  file: z
    .instanceof(File)
    .refine(file => file.size <= MAX_FILE_SIZE, 'File must be less than 5MB')
    .refine(
      file => ACCEPTED_FILE_TYPES.includes(file.type),
      'Only PDF, DOC, DOCX, JPG, PNG files are allowed'
    )
});

export type UploadFileInput = z.infer<typeof uploadFileSchema>;
```

**lib/validators/notification.ts:**
```typescript
import { z } from 'zod';

export const createNotificationSchema = z.object({
  demandeId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId'),
  type: z.enum(['CONFIRMATION', 'STATUS_CHANGE', 'REJECTION', 'APPROVAL', 'REMINDER']),
  destinataire: z.string().email('Invalid email address'),
  metadata: z.object({
    templateData: z.record(z.any()),
    priority: z.enum(['LOW', 'NORMAL', 'HIGH']).default('NORMAL')
  }).optional()
});

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
```

**lib/validators/analytics.ts:**
```typescript
import { z } from 'zod';

export const analyticsQuerySchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  groupBy: z.enum(['type', 'status', 'admin']).optional(),
  metrics: z.array(z.enum(['volume', 'performance', 'quality'])).optional()
});

export type AnalyticsQuery = z.infer<typeof analyticsQuerySchema>;
```

### Acceptance Criteria
- ✅ All dependencies installed
- ✅ Environment variables documented
- ✅ Type definitions created
- ✅ Validation schemas defined
- ✅ Project structure matches standards

---

## Task 2: Email Service with Queue

**Duration:** 2-3 days
**Priority:** High
**Dependencies:** Task 1

### Objectives
- Set up email sending service (Resend or Nodemailer)
- Create React Email templates
- Implement notification queue system
- Configure retry logic

### Deliverables

#### 2.1 Email Client Setup

**lib/email/client.ts:**
```typescript
import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY is not defined');
}

export const resend = new Resend(process.env.RESEND_API_KEY);
```

#### 2.2 Email Templates

Create templates in `lib/email/templates/`:

**demande-recue.tsx:** (Confirmation email)
```typescript
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface DemandeRecueEmailProps {
  numeroDemande: string;
  typeDemande: string;
  etudiantNom: string;
  etudiantPrenom: string;
  dateCreation: Date;
  estimatedDelay: number;
}

export const DemandeRecueEmail = ({
  numeroDemande,
  typeDemande,
  etudiantNom,
  etudiantPrenom,
  dateCreation,
  estimatedDelay
}: DemandeRecueEmailProps) => {
  const trackingUrl = `${process.env.NEXT_PUBLIC_APP_URL}/demandes/${numeroDemande}`;

  return (
    <Html>
      <Head />
      <Preview>Votre demande {numeroDemande} a été reçue</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Demande reçue avec succès</Heading>

          <Text style={text}>
            Bonjour {etudiantPrenom} {etudiantNom},
          </Text>

          <Text style={text}>
            Nous avons bien reçu votre demande de <strong>{typeDemande}</strong>.
          </Text>

          <Section style={infoBox}>
            <Text style={label}>Numéro de demande:</Text>
            <Text style={value}>{numeroDemande}</Text>

            <Text style={label}>Date de soumission:</Text>
            <Text style={value}>
              {new Date(dateCreation).toLocaleDateString('fr-FR')}
            </Text>

            <Text style={label}>Délai estimé:</Text>
            <Text style={value}>{estimatedDelay} jours ouvrables</Text>
          </Section>

          <Link href={trackingUrl} style={button}>
            Suivre ma demande
          </Link>

          <Text style={footer}>
            Vous recevrez un email à chaque changement de statut.
          </Text>

          <Text style={footer}>
            Cordialement,<br />
            Le service scolarité
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
};

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  padding: '0 48px',
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  padding: '0 48px',
};

const infoBox = {
  backgroundColor: '#f4f4f5',
  borderRadius: '8px',
  margin: '24px 48px',
  padding: '20px',
};

const label = {
  color: '#666',
  fontSize: '14px',
  fontWeight: 'bold',
  margin: '8px 0 4px',
};

const value = {
  color: '#333',
  fontSize: '16px',
  margin: '0 0 16px',
};

const button = {
  backgroundColor: '#3b82f6',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px 24px',
  margin: '24px 48px',
};

const footer = {
  color: '#8898aa',
  fontSize: '14px',
  lineHeight: '24px',
  padding: '0 48px',
  marginTop: '24px',
};

export default DemandeRecueEmail;
```

Create similar templates for:
- **demande-validee.tsx** (Approval email)
- **demande-rejetee.tsx** (Rejection email)
- **changement-statut.tsx** (Status change email)

#### 2.3 Email Sending Service

**lib/email/send.ts:**
```typescript
import { resend } from './client';
import { render } from '@react-email/render';
import { DemandeRecueEmail } from './templates/demande-recue';
import { DemandeValideeEmail } from './templates/demande-validee';
import { DemandeRejeteeEmail } from './templates/demande-rejetee';
import { ChangementStatutEmail } from './templates/changement-statut';

interface SendEmailOptions {
  to: string;
  subject: string;
  template: React.ReactElement;
}

async function sendEmail({ to, subject, template }: SendEmailOptions) {
  try {
    const html = render(template);
    const text = render(template, { plainText: true });

    const { data, error } = await resend.emails.send({
      from: 'Scolarité <noreply@university.edu>',
      to,
      subject,
      html,
      text,
    });

    if (error) {
      throw new Error(`Email send failed: ${error.message}`);
    }

    return { success: true, emailId: data?.id };
  } catch (error) {
    console.error('Email send error:', error);
    throw error;
  }
}

// Template-specific functions
export async function sendDemandeRecueEmail(demande: any) {
  return sendEmail({
    to: demande.etudiant.email,
    subject: `Demande reçue - ${demande.numeroDemande}`,
    template: (
      <DemandeRecueEmail
        numeroDemande={demande.numeroDemande}
        typeDemande={demande.typeDemande.nom}
        etudiantNom={demande.etudiant.nom}
        etudiantPrenom={demande.etudiant.prenom}
        dateCreation={demande.createdAt}
        estimatedDelay={demande.typeDemande.delaiTraitement || 5}
      />
    ),
  });
}

export async function sendDemandeValideeEmail(demande: any) {
  return sendEmail({
    to: demande.etudiant.email,
    subject: `Demande validée - ${demande.numeroDemande}`,
    template: (
      <DemandeValideeEmail
        numeroDemande={demande.numeroDemande}
        typeDemande={demande.typeDemande.nom}
        etudiantNom={demande.etudiant.nom}
        etudiantPrenom={demande.etudiant.prenom}
        dateValidation={demande.dateTraitement || new Date()}
      />
    ),
  });
}

export async function sendDemandeRejeteeEmail(demande: any) {
  return sendEmail({
    to: demande.etudiant.email,
    subject: `Demande rejetée - ${demande.numeroDemande}`,
    template: (
      <DemandeRejeteeEmail
        numeroDemande={demande.numeroDemande}
        typeDemande={demande.typeDemande.nom}
        etudiantNom={demande.etudiant.nom}
        etudiantPrenom={demande.etudiant.prenom}
        motifRefus={demande.motifRefus || 'Non spécifié'}
      />
    ),
  });
}

export async function sendChangementStatutEmail(demande: any, ancienStatut: string) {
  return sendEmail({
    to: demande.etudiant.email,
    subject: `Mise à jour - ${demande.numeroDemande}`,
    template: (
      <ChangementStatutEmail
        numeroDemande={demande.numeroDemande}
        typeDemande={demande.typeDemande.nom}
        etudiantNom={demande.etudiant.nom}
        etudiantPrenom={demande.etudiant.prenom}
        ancienStatut={ancienStatut}
        nouveauStatut={demande.statut.libelle}
      />
    ),
  });
}
```

#### 2.4 Notification Database Model

**lib/db/models/notification.ts:**
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

const notificationSchema = new Schema<INotificationDocument>(
  {
    demandeId: {
      type: Schema.Types.ObjectId,
      ref: 'Demande',
      required: true,
      index: true,
    },
    numeroDemandeRef: {
      type: String,
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['CONFIRMATION', 'STATUS_CHANGE', 'REJECTION', 'APPROVAL', 'REMINDER'],
      required: true,
    },
    destinataire: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: /^\S+@\S+\.\S+$/,
    },
    objet: {
      type: String,
      required: true,
      maxlength: 255,
    },
    contenu: {
      type: String,
      required: true,
    },
    statutEnvoi: {
      type: String,
      enum: ['EN_ATTENTE', 'ENVOYE', 'ECHEC'],
      default: 'EN_ATTENTE',
      index: true,
    },
    nbTentatives: {
      type: Number,
      default: 0,
      min: 0,
    },
    erreur: String,
    dateEnvoi: Date,
    metadata: {
      templateData: {
        type: Schema.Types.Mixed,
        default: {},
      },
      priority: {
        type: String,
        enum: ['LOW', 'NORMAL', 'HIGH'],
        default: 'NORMAL',
      },
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
notificationSchema.index({ demandeId: 1, createdAt: -1 });
notificationSchema.index({ statutEnvoi: 1, nbTentatives: 1 });
notificationSchema.index({ createdAt: -1 });

export const Notification = mongoose.model<INotificationDocument>(
  'Notification',
  notificationSchema
);
```

#### 2.5 Notification Creation Service

**lib/notifications/create.ts:**
```typescript
import { Notification } from '@/lib/db/models/notification';
import { Demande } from '@/lib/db/models/demande';

interface CreateNotificationOptions {
  demandeId: string;
  type: 'CONFIRMATION' | 'STATUS_CHANGE' | 'REJECTION' | 'APPROVAL' | 'REMINDER';
  templateData: Record<string, any>;
  priority?: 'LOW' | 'NORMAL' | 'HIGH';
}

export async function createNotification(options: CreateNotificationOptions) {
  try {
    // Get demande details
    const demande = await Demande.findById(options.demandeId);
    if (!demande) {
      throw new Error('Demande not found');
    }

    // Generate email subject based on type
    const subjects = {
      CONFIRMATION: `Demande reçue - ${demande.numeroDemande}`,
      STATUS_CHANGE: `Mise à jour - ${demande.numeroDemande}`,
      REJECTION: `Demande rejetée - ${demande.numeroDemande}`,
      APPROVAL: `Demande validée - ${demande.numeroDemande}`,
      REMINDER: `Rappel - ${demande.numeroDemande}`,
    };

    // Create notification record
    const notification = await Notification.create({
      demandeId: demande._id,
      numeroDemandeRef: demande.numeroDemande,
      type: options.type,
      destinataire: demande.etudiant.email,
      objet: subjects[options.type],
      contenu: '', // Will be populated when sending
      statutEnvoi: 'EN_ATTENTE',
      nbTentatives: 0,
      metadata: {
        templateData: {
          ...options.templateData,
          numeroDemande: demande.numeroDemande,
          typeDemande: demande.typeDemande.nom,
          etudiantNom: demande.etudiant.nom,
          etudiantPrenom: demande.etudiant.prenom,
        },
        priority: options.priority || 'NORMAL',
      },
    });

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}
```

#### 2.6 Notification Sending Service

**lib/notifications/send.ts:**
```typescript
import { Notification } from '@/lib/db/models/notification';
import {
  sendDemandeRecueEmail,
  sendDemandeValideeEmail,
  sendDemandeRejeteeEmail,
  sendChangementStatutEmail,
} from '@/lib/email/send';
import { Demande } from '@/lib/db/models/demande';

export async function sendNotificationEmail(notification: any) {
  try {
    // Get full demande details
    const demande = await Demande.findById(notification.demandeId);
    if (!demande) {
      throw new Error('Demande not found');
    }

    // Send appropriate email based on type
    let result;
    switch (notification.type) {
      case 'CONFIRMATION':
        result = await sendDemandeRecueEmail(demande);
        break;
      case 'APPROVAL':
        result = await sendDemandeValideeEmail(demande);
        break;
      case 'REJECTION':
        result = await sendDemandeRejeteeEmail(demande);
        break;
      case 'STATUS_CHANGE':
        result = await sendChangementStatutEmail(
          demande,
          notification.metadata.templateData.ancienStatut || ''
        );
        break;
      default:
        throw new Error(`Unknown notification type: ${notification.type}`);
    }

    return result;
  } catch (error) {
    console.error('Error sending notification email:', error);
    throw error;
  }
}
```

### Acceptance Criteria
- ✅ Email client configured (Resend or Nodemailer)
- ✅ All email templates created and tested
- ✅ Notification model defined in database
- ✅ Notification creation service working
- ✅ Email sending service functional
- ✅ Test emails sent successfully

---

## Task 3: Document Upload and Storage Service

**Duration:** 2 days
**Priority:** High
**Dependencies:** Task 1

### Objectives
- Integrate Cloudinary for file storage
- Create upload API endpoint
- Implement file validation
- Update Demande model for document storage

### Deliverables

#### 3.1 Cloudinary Setup

**lib/upload/cloudinary.ts:**
```typescript
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;
```

#### 3.2 Upload Service

**lib/upload/upload-service.ts:**
```typescript
import cloudinary from './cloudinary';
import { Readable } from 'stream';

interface UploadResult {
  id: string;
  url: string;
  nomFichier: string;
  taille: number;
  typeMime: string;
}

export async function uploadToCloudinary(
  file: File,
  options: {
    folder: string;
    resourceType?: 'image' | 'raw' | 'video' | 'auto';
  }
): Promise<UploadResult> {
  try {
    // Convert File to Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary
    const result = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: options.folder,
          resource_type: options.resourceType || 'auto',
          use_filename: true,
          unique_filename: true,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      const stream = Readable.from(buffer);
      stream.pipe(uploadStream);
    });

    return {
      id: result.public_id,
      url: result.secure_url,
      nomFichier: file.name,
      taille: file.size,
      typeMime: file.type,
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload file to Cloudinary');
  }
}

export async function deleteFromCloudinary(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw new Error('Failed to delete file from Cloudinary');
  }
}
```

#### 3.3 Upload API Endpoint

**app/api/upload/route.ts:**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { uploadToCloudinary } from '@/lib/upload/upload-service';
import { uploadFileSchema } from '@/lib/validators/upload';
import { handleApiError } from '@/lib/api/error-handler';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'UPL_004', message: 'No file provided' },
        },
        { status: 400 }
      );
    }

    // Validate file
    const validation = uploadFileSchema.safeParse({ file });
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VAL_001',
            message: 'File validation failed',
            details: validation.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    // Get demande ID from form data
    const demandeId = formData.get('demandeId') as string;
    if (!demandeId) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VAL_004', message: 'Demande ID required' },
        },
        { status: 400 }
      );
    }

    // Upload to Cloudinary
    const result = await uploadToCloudinary(file, {
      folder: `demandes/${new Date().getFullYear()}/${demandeId}`,
    });

    // Return metadata
    return NextResponse.json(
      {
        success: true,
        data: {
          id: result.id,
          url: result.url,
          nomFichier: result.nomFichier,
          nomOriginal: file.name,
          taille: result.taille,
          typeMime: result.typeMime,
          dateUpload: new Date().toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
```

#### 3.4 Update Demande Model

Add documents field to existing Demande model:
```typescript
// lib/db/models/demande.ts (update)

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

#### 3.5 Server Action for Upload

**app/actions/upload.ts:**
```typescript
'use server';

import { uploadToCloudinary } from '@/lib/upload/upload-service';
import { Demande } from '@/lib/db/models/demande';

export async function uploadDocumentAction(formData: FormData) {
  try {
    const file = formData.get('file') as File;
    const demandeId = formData.get('demandeId') as string;

    if (!file || !demandeId) {
      return {
        success: false,
        error: { code: 'VAL_004', message: 'File and demande ID required' },
      };
    }

    // Upload to Cloudinary
    const result = await uploadToCloudinary(file, {
      folder: `demandes/${new Date().getFullYear()}/${demandeId}`,
    });

    // Add document to demande
    await Demande.findByIdAndUpdate(demandeId, {
      $push: {
        documents: {
          id: result.id,
          nomFichier: file.name,
          nomOriginal: file.name,
          url: result.url,
          typeMime: file.type,
          taille: file.size,
          categorie: 'PIECE_JOINTE',
          dateUpload: new Date(),
        },
      },
    });

    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'UPL_003',
        message: 'Upload failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}
```

### Acceptance Criteria
- ✅ Cloudinary integration configured
- ✅ Upload API endpoint functional
- ✅ File validation working (type, size)
- ✅ Documents stored in Cloudinary
- ✅ Document metadata saved in Demande model
- ✅ Upload errors handled gracefully

---

## Task 4: Background Job Workers

**Duration:** 2 days
**Priority:** Medium
**Dependencies:** Task 2, Task 3

### Objectives
- Set up Vercel Cron jobs
- Implement email queue processor
- Create auto-archive job
- Add cleanup jobs

### Deliverables

#### 4.1 Vercel Cron Configuration

**vercel.json:**
```json
{
  "crons": [
    {
      "path": "/api/cron/send-notifications",
      "schedule": "*/5 * * * *"
    },
    {
      "path": "/api/cron/auto-archive",
      "schedule": "0 2 * * *"
    },
    {
      "path": "/api/cron/cleanup",
      "schedule": "0 4 * * 0"
    },
    {
      "path": "/api/cron/calculate-metrics",
      "schedule": "0 3 * * *"
    }
  ]
}
```

#### 4.2 Email Notification Queue Processor

**app/api/cron/send-notifications/route.ts:**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { Notification } from '@/lib/db/models/notification';
import { sendNotificationEmail } from '@/lib/notifications/send';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { success: false, error: { code: 'CRN_002', message: 'Invalid cron secret' } },
        { status: 401 }
      );
    }

    // Get pending notifications
    const pendingNotifications = await Notification.find({
      statutEnvoi: 'EN_ATTENTE',
      nbTentatives: { $lt: 3 }, // Max 3 retries
    })
      .sort({ 'metadata.priority': -1, createdAt: 1 })
      .limit(100); // Process max 100 per run

    let sent = 0;
    let failed = 0;

    // Process each notification
    for (const notification of pendingNotifications) {
      try {
        await sendNotificationEmail(notification);

        // Update status
        notification.statutEnvoi = 'ENVOYE';
        notification.dateEnvoi = new Date();
        await notification.save();

        sent++;
      } catch (error) {
        // Update failure info
        notification.nbTentatives += 1;
        notification.erreur = error instanceof Error ? error.message : 'Unknown error';

        if (notification.nbTentatives >= 3) {
          notification.statutEnvoi = 'ECHEC';
        }

        await notification.save();
        failed++;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        processed: pendingNotifications.length,
        sent,
        failed,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'CRN_001',
          message: 'Job execution failed',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
```

#### 4.3 Auto-Archive Job

**app/api/cron/auto-archive/route.ts:**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { Demande } from '@/lib/db/models/demande';
import { Historique } from '@/lib/db/models/historique';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { success: false, error: { code: 'CRN_002', message: 'Invalid cron secret' } },
        { status: 401 }
      );
    }

    // Find demandes to archive (TRAITE for > 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const demandesAArchiver = await Demande.find({
      'statut.code': 'TRAITE',
      dateTraitement: { $lt: sixMonthsAgo },
    });

    let archived = 0;

    for (const demande of demandesAArchiver) {
      // Update status to ARCHIVE
      const ancienStatut = demande.statut;
      demande.statut = {
        code: 'ARCHIVE',
        libelle: 'Archivé',
        couleur: '#6b7280',
      };
      await demande.save();

      // Log historique
      await Historique.create({
        demandeId: demande._id,
        numeroDemandeRef: demande.numeroDemande,
        statutAncien: ancienStatut,
        statutNouveau: demande.statut,
        utilisateur: {
          id: null,
          nom: 'Système',
          role: 'SYSTEM',
        },
        typeAction: 'CHANGEMENT_STATUT',
        commentaire: 'Archivage automatique après 6 mois',
      });

      archived++;
    }

    return NextResponse.json({
      success: true,
      data: {
        archived,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Auto-archive error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'CRN_001',
          message: 'Auto-archive job failed',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
```

#### 4.4 Cleanup Job

**app/api/cron/cleanup/route.ts:**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { Notification } from '@/lib/db/models/notification';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { success: false, error: { code: 'CRN_002', message: 'Invalid cron secret' } },
        { status: 401 }
      );
    }

    // Delete old notifications (> 90 days)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const deletedNotifications = await Notification.deleteMany({
      statutEnvoi: 'ENVOYE',
      dateEnvoi: { $lt: ninetyDaysAgo },
    });

    return NextResponse.json({
      success: true,
      data: {
        deletedNotifications: deletedNotifications.deletedCount,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'CRN_001',
          message: 'Cleanup job failed',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
```

### Acceptance Criteria
- ✅ Vercel cron jobs configured
- ✅ Email queue processor running every 5 minutes
- ✅ Auto-archive job running daily
- ✅ Cleanup job running weekly
- ✅ All jobs have proper error handling
- ✅ Job execution logged

---

## Task 5: Analytics Service and Metrics Calculation

**Duration:** 2-3 days
**Priority:** Medium
**Dependencies:** Task 1

### Objectives
- Create analytics calculation service
- Implement MongoDB aggregation pipelines
- Build dashboard API endpoints
- Add export functionality

### Deliverables

#### 5.1 Analytics Calculation Service

**lib/analytics/calculate.ts:**
```typescript
import { Demande } from '@/lib/db/models/demande';

export async function calculateDashboardMetrics(dateRange?: {
  startDate: Date;
  endDate: Date;
}) {
  const matchStage = dateRange
    ? {
        createdAt: {
          $gte: dateRange.startDate,
          $lte: dateRange.endDate,
        },
      }
    : {};

  // Volume metrics
  const volumeMetrics = await Demande.aggregate([
    { $match: matchStage },
    {
      $facet: {
        total: [{ $count: 'count' }],
        byType: [
          { $group: { _id: '$typeDemande.code', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ],
        byStatus: [
          { $group: { _id: '$statut.code', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ],
        byPriority: [
          { $group: { _id: '$priorite', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ],
      },
    },
  ]);

  // Performance metrics
  const performanceMetrics = await Demande.aggregate([
    {
      $match: {
        ...matchStage,
        dateTraitement: { $exists: true },
      },
    },
    {
      $project: {
        processingTime: {
          $divide: [{ $subtract: ['$dateTraitement', '$createdAt'] }, 3600000],
        },
        type: '$typeDemande.code',
        slaTarget: '$typeDemande.delaiTraitement',
      },
    },
    {
      $facet: {
        overall: [
          {
            $group: {
              _id: null,
              averageProcessingTime: { $avg: '$processingTime' },
              minProcessingTime: { $min: '$processingTime' },
              maxProcessingTime: { $max: '$processingTime' },
              total: { $sum: 1 },
            },
          },
        ],
        byType: [
          {
            $group: {
              _id: '$type',
              averageProcessingTime: { $avg: '$processingTime' },
              count: { $sum: 1 },
            },
          },
          { $sort: { averageProcessingTime: -1 } },
        ],
        slaCompliance: [
          {
            $group: {
              _id: null,
              withinSLA: {
                $sum: {
                  $cond: [
                    { $lte: ['$processingTime', { $multiply: ['$slaTarget', 24] }] },
                    1,
                    0,
                  ],
                },
              },
              total: { $sum: 1 },
            },
          },
          {
            $project: {
              _id: 0,
              slaComplianceRate: {
                $multiply: [{ $divide: ['$withinSLA', '$total'] }, 100],
              },
            },
          },
        ],
      },
    },
  ]);

  // Quality metrics
  const qualityMetrics = await Demande.aggregate([
    { $match: matchStage },
    {
      $facet: {
        rates: [
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              approved: {
                $sum: {
                  $cond: [{ $in: ['$statut.code', ['VALIDE', 'TRAITE']] }, 1, 0],
                },
              },
              rejected: {
                $sum: {
                  $cond: [{ $eq: ['$statut.code', 'REJETE'] }, 1, 0],
                },
              },
            },
          },
          {
            $project: {
              _id: 0,
              approvalRate: {
                $multiply: [{ $divide: ['$approved', '$total'] }, 100],
              },
              rejectionRate: {
                $multiply: [{ $divide: ['$rejected', '$total'] }, 100],
              },
            },
          },
        ],
        rejectionReasons: [
          { $match: { 'statut.code': 'REJETE', motifRefus: { $exists: true } } },
          { $group: { _id: '$motifRefus', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 },
        ],
      },
    },
  ]);

  // Format and return results
  return {
    volume: {
      total: volumeMetrics[0]?.total[0]?.count || 0,
      byType: Object.fromEntries(
        (volumeMetrics[0]?.byType || []).map((item: any) => [item._id, item.count])
      ),
      byStatus: Object.fromEntries(
        (volumeMetrics[0]?.byStatus || []).map((item: any) => [item._id, item.count])
      ),
      byPriority: Object.fromEntries(
        (volumeMetrics[0]?.byPriority || []).map((item: any) => [item._id, item.count])
      ),
    },
    performance: {
      averageProcessingTime:
        Math.round((performanceMetrics[0]?.overall[0]?.averageProcessingTime || 0) * 100) /
        100,
      processingTimeByType: Object.fromEntries(
        (performanceMetrics[0]?.byType || []).map((item: any) => [
          item._id,
          Math.round(item.averageProcessingTime * 100) / 100,
        ])
      ),
      slaComplianceRate:
        Math.round((performanceMetrics[0]?.slaCompliance[0]?.slaComplianceRate || 0) * 100) /
        100,
    },
    quality: {
      approvalRate:
        Math.round((qualityMetrics[0]?.rates[0]?.approvalRate || 0) * 100) / 100,
      rejectionRate:
        Math.round((qualityMetrics[0]?.rates[0]?.rejectionRate || 0) * 100) / 100,
      rejectionReasons: Object.fromEntries(
        (qualityMetrics[0]?.rejectionReasons || []).map((item: any) => [
          item._id,
          item.count,
        ])
      ),
    },
  };
}
```

#### 5.2 Dashboard API Endpoint

**app/api/analytics/dashboard/route.ts:**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { calculateDashboardMetrics } from '@/lib/analytics/calculate';
import { analyticsQuerySchema } from '@/lib/validators/analytics';
import { handleApiError } from '@/lib/api/error-handler';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const query = analyticsQuerySchema.parse({
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
    });

    const metrics = await calculateDashboardMetrics(
      query.startDate && query.endDate
        ? { startDate: query.startDate, endDate: query.endDate }
        : undefined
    );

    return NextResponse.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
```

#### 5.3 Trends API Endpoint

**app/api/analytics/trends/route.ts:**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { Demande } from '@/lib/db/models/demande';
import { handleApiError } from '@/lib/api/error-handler';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30days';
    const metric = searchParams.get('metric') || 'volume';

    // Calculate start date based on period
    const endDate = new Date();
    const startDate = new Date();

    if (period === '7days') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === '30days') {
      startDate.setDate(startDate.getDate() - 30);
    } else if (period === '90days') {
      startDate.setDate(startDate.getDate() - 90);
    }

    // Get daily counts
    const trends = await Demande.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const labels = trends.map((item) => item._id);
    const data = trends.map((item) => item.count);

    return NextResponse.json({
      success: true,
      data: {
        labels,
        datasets: [
          {
            label: 'Demandes créées',
            data,
          },
        ],
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
```

#### 5.4 Export API Endpoint

**app/api/analytics/export/route.ts:**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { Demande } from '@/lib/db/models/demande';
import { handleApiError } from '@/lib/api/error-handler';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv';

    // Get all demandes
    const demandes = await Demande.find()
      .select(
        'numeroDemande typeDemande statut priorite etudiant.nom etudiant.prenom createdAt dateTraitement'
      )
      .lean();

    if (format === 'csv') {
      // Generate CSV
      const headers = [
        'Numéro',
        'Type',
        'Statut',
        'Priorité',
        'Nom',
        'Prénom',
        'Date création',
        'Date traitement',
      ];
      const rows = demandes.map((d) => [
        d.numeroDemande,
        d.typeDemande.nom,
        d.statut.libelle,
        d.priorite,
        d.etudiant.nom,
        d.etudiant.prenom,
        d.createdAt.toISOString(),
        d.dateTraitement?.toISOString() || '',
      ]);

      const csv = [
        headers.join(','),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
      ].join('\n');

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="demandes-export-${new Date().toISOString()}.csv"`,
        },
      });
    }

    // JSON format
    return NextResponse.json({
      success: true,
      data: demandes,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
```

#### 5.5 Metrics Calculation Cron Job

**app/api/cron/calculate-metrics/route.ts:**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { calculateDashboardMetrics } from '@/lib/analytics/calculate';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

// Snapshot schema
const snapshotSchema = new mongoose.Schema({
  date: { type: Date, required: true, index: true },
  metrics: {
    volume: Object,
    performance: Object,
    quality: Object,
  },
});

const AnalyticsSnapshot =
  mongoose.models.AnalyticsSnapshot ||
  mongoose.model('AnalyticsSnapshot', snapshotSchema);

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { success: false, error: { code: 'CRN_002', message: 'Invalid cron secret' } },
        { status: 401 }
      );
    }

    // Calculate metrics for yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const endOfYesterday = new Date(yesterday);
    endOfYesterday.setHours(23, 59, 59, 999);

    const metrics = await calculateDashboardMetrics({
      startDate: yesterday,
      endDate: endOfYesterday,
    });

    // Store snapshot
    await AnalyticsSnapshot.create({
      date: yesterday,
      metrics,
    });

    return NextResponse.json({
      success: true,
      data: {
        date: yesterday.toISOString(),
        metrics,
      },
    });
  } catch (error) {
    console.error('Metrics calculation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'CRN_001',
          message: 'Metrics calculation failed',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
```

### Acceptance Criteria
- ✅ Analytics service calculates all metrics correctly
- ✅ Dashboard API returns real-time metrics
- ✅ Trends API shows historical data
- ✅ Export API generates CSV files
- ✅ Daily metrics snapshots stored
- ✅ Queries optimized with indexes

---

## Task 6: Admin Dashboard for Reporting

**Duration:** 2-3 days
**Priority:** Medium
**Dependencies:** Task 5

### Objectives
- Create analytics dashboard UI
- Display metrics and charts
- Add export functionality
- Enable filtering

### Deliverables

#### 6.1 Dashboard Page

**app/(admin)/admin/analytics/page.tsx:**
```typescript
import { Suspense } from 'react';
import { DashboardMetrics } from '@/components/analytics/dashboard-metrics';
import { TrendsChart } from '@/components/analytics/trends-chart';
import { ExportButton } from '@/components/analytics/export-button';

export default function AnalyticsPage() {
  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Tableau de bord analytique</h1>
          <p className="text-gray-600 mt-2">
            Vue d'ensemble des métriques et statistiques
          </p>
        </div>
        <ExportButton />
      </div>

      <Suspense fallback={<div>Chargement des métriques...</div>}>
        <DashboardMetrics />
      </Suspense>

      <div className="mt-8">
        <Suspense fallback={<div>Chargement des tendances...</div>}>
          <TrendsChart />
        </Suspense>
      </div>
    </div>
  );
}
```

#### 6.2 Dashboard Metrics Component

**components/analytics/dashboard-metrics.tsx:**
```typescript
'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';

export function DashboardMetrics() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const response = await fetch('/api/analytics/dashboard');
        const data = await response.json();

        if (data.success) {
          setMetrics(data.data);
        }
      } catch (error) {
        console.error('Error fetching metrics:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchMetrics();
  }, []);

  if (loading) {
    return <div>Chargement...</div>;
  }

  if (!metrics) {
    return <div>Erreur lors du chargement des métriques</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Total demandes */}
      <Card className="p-6">
        <div className="text-sm font-medium text-gray-600">Total demandes</div>
        <div className="text-3xl font-bold mt-2">{metrics.volume.total}</div>
      </Card>

      {/* Average processing time */}
      <Card className="p-6">
        <div className="text-sm font-medium text-gray-600">
          Délai moyen de traitement
        </div>
        <div className="text-3xl font-bold mt-2">
          {metrics.performance.averageProcessingTime.toFixed(1)}h
        </div>
      </Card>

      {/* SLA compliance */}
      <Card className="p-6">
        <div className="text-sm font-medium text-gray-600">Respect des SLA</div>
        <div className="text-3xl font-bold mt-2">
          {metrics.performance.slaComplianceRate.toFixed(1)}%
        </div>
      </Card>

      {/* Approval rate */}
      <Card className="p-6">
        <div className="text-sm font-medium text-gray-600">Taux d'approbation</div>
        <div className="text-3xl font-bold mt-2">
          {metrics.quality.approvalRate.toFixed(1)}%
        </div>
      </Card>

      {/* Demandes by type */}
      <Card className="p-6 col-span-2">
        <div className="text-sm font-medium text-gray-600 mb-4">Par type</div>
        {Object.entries(metrics.volume.byType).map(([type, count]) => (
          <div key={type} className="flex justify-between items-center mb-2">
            <span className="text-sm">{type}</span>
            <span className="font-bold">{count as number}</span>
          </div>
        ))}
      </Card>

      {/* Demandes by status */}
      <Card className="p-6 col-span-2">
        <div className="text-sm font-medium text-gray-600 mb-4">Par statut</div>
        {Object.entries(metrics.volume.byStatus).map(([status, count]) => (
          <div key={status} className="flex justify-between items-center mb-2">
            <span className="text-sm">{status}</span>
            <span className="font-bold">{count as number}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}
```

#### 6.3 Trends Chart Component

**components/analytics/trends-chart.tsx:**
```typescript
'use client';

import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export function TrendsChart() {
  const [trendsData, setTrendsData] = useState<any>(null);
  const [period, setPeriod] = useState('30days');

  useEffect(() => {
    async function fetchTrends() {
      try {
        const response = await fetch(`/api/analytics/trends?period=${period}`);
        const data = await response.json();

        if (data.success) {
          setTrendsData(data.data);
        }
      } catch (error) {
        console.error('Error fetching trends:', error);
      }
    }

    fetchTrends();
  }, [period]);

  if (!trendsData) {
    return <div>Chargement des tendances...</div>;
  }

  const chartData = {
    labels: trendsData.labels,
    datasets: trendsData.datasets.map((dataset: any) => ({
      label: dataset.label,
      data: dataset.data,
      borderColor: 'rgb(59, 130, 246)',
      backgroundColor: 'rgba(59, 130, 246, 0.5)',
    })),
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Tendance des demandes',
      },
    },
  };

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setPeriod('7days')}
          className={`px-4 py-2 rounded ${
            period === '7days' ? 'bg-blue-500 text-white' : 'bg-gray-200'
          }`}
        >
          7 jours
        </button>
        <button
          onClick={() => setPeriod('30days')}
          className={`px-4 py-2 rounded ${
            period === '30days' ? 'bg-blue-500 text-white' : 'bg-gray-200'
          }`}
        >
          30 jours
        </button>
        <button
          onClick={() => setPeriod('90days')}
          className={`px-4 py-2 rounded ${
            period === '90days' ? 'bg-blue-500 text-white' : 'bg-gray-200'
          }`}
        >
          90 jours
        </button>
      </div>
      <Line options={options} data={chartData} />
    </div>
  );
}
```

### Acceptance Criteria
- ✅ Analytics dashboard displays metrics
- ✅ Charts show trends over time
- ✅ Period filtering works (7/30/90 days)
- ✅ Export button generates CSV
- ✅ Dashboard is responsive
- ✅ Loading states handled

---

## Task 7: Integration and Testing

**Duration:** 2 days
**Priority:** High
**Dependencies:** All previous tasks

### Objectives
- Integrate all supporting systems with core workflow
- Add notification triggers to workflow transitions
- Test end-to-end flows
- Document usage

### Deliverables

#### 7.1 Workflow Integration

Update workflow state machine to trigger notifications:

**lib/workflow/state-machine.ts (updated):**
```typescript
import { createNotification } from '@/lib/notifications/create';

const onTransition = {
  async toRECU(demande: any) {
    // Create confirmation notification
    await createNotification({
      demandeId: demande._id.toString(),
      type: 'CONFIRMATION',
      templateData: {},
      priority: 'NORMAL',
    });

    // Log historique
    await logHistorique(demande._id, 'SOUMIS', 'RECU', 'SYSTEM');
  },

  async toVALIDE(demande: any) {
    // Create approval notification
    await createNotification({
      demandeId: demande._id.toString(),
      type: 'APPROVAL',
      templateData: {},
      priority: 'HIGH',
    });

    // Generate PDF (if applicable)
    // await generateAttestationPDF(demande);
  },

  async toREJETE(demande: any) {
    // Create rejection notification
    await createNotification({
      demandeId: demande._id.toString(),
      type: 'REJECTION',
      templateData: {
        motifRefus: demande.motifRefus,
      },
      priority: 'HIGH',
    });
  },

  async toENCAURS(demande: any) {
    // Create status change notification
    await createNotification({
      demandeId: demande._id.toString(),
      type: 'STATUS_CHANGE',
      templateData: {
        ancienStatut: 'RECU',
        nouveauStatut: 'EN_COURS',
      },
      priority: 'NORMAL',
    });
  },
};
```

#### 7.2 End-to-End Tests

Create integration tests:

**__tests__/integration/supporting-systems.test.ts:**
```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Demande } from '@/lib/db/models/demande';
import { Notification } from '@/lib/db/models/notification';
import { createNotification } from '@/lib/notifications/create';
import { uploadToCloudinary } from '@/lib/upload/upload-service';

describe('Supporting Systems Integration', () => {
  let testDemandeId: string;

  beforeAll(async () => {
    // Create test demande
    const demande = await Demande.create({
      numeroDemande: 'TEST-2024-000001',
      etudiant: {
        id: 'test-student-id',
        nom: 'Test',
        prenom: 'Student',
        email: 'test@university.edu',
      },
      typeDemande: {
        code: 'ATTESTATION_SCOLARITE',
        nom: 'Attestation de scolarité',
        delaiTraitement: 5,
      },
      statut: {
        code: 'RECU',
        libelle: 'Reçu',
        couleur: '#3b82f6',
      },
      objet: 'Test demande',
      description: 'Test description',
      priorite: 'NORMALE',
      documents: [],
    });

    testDemandeId = demande._id.toString();
  });

  it('should create notification when demande is received', async () => {
    const notification = await createNotification({
      demandeId: testDemandeId,
      type: 'CONFIRMATION',
      templateData: {},
    });

    expect(notification).toBeDefined();
    expect(notification.statutEnvoi).toBe('EN_ATTENTE');
    expect(notification.type).toBe('CONFIRMATION');
  });

  it('should upload document to Cloudinary', async () => {
    const mockFile = new File(['test content'], 'test.pdf', {
      type: 'application/pdf',
    });

    const result = await uploadToCloudinary(mockFile, {
      folder: `demandes/2024/${testDemandeId}`,
    });

    expect(result).toBeDefined();
    expect(result.url).toContain('cloudinary');
    expect(result.nomFichier).toBe('test.pdf');
  });

  afterAll(async () => {
    // Cleanup
    await Demande.deleteMany({ numeroDemande: { $regex: /^TEST-/ } });
    await Notification.deleteMany({ numeroDemandeRef: { $regex: /^TEST-/ } });
  });
});
```

#### 7.3 Documentation

Create usage documentation:

**docs/supporting-systems-usage.md:**
```markdown
# Supporting Systems Usage Guide

## Email Notifications

### Automatic Triggers
Emails are automatically sent when:
- Demande is received (SOUMIS → RECU)
- Status changes (any transition)
- Demande is approved (→ VALIDE)
- Demande is rejected (→ REJETE)

### Manual Notification
```typescript
import { createNotification } from '@/lib/notifications/create';

await createNotification({
  demandeId: '507f1f77bcf86cd799439011',
  type: 'REMINDER',
  templateData: {
    message: 'Votre demande nécessite une action'
  },
  priority: 'HIGH'
});
```

## Document Upload

### From Client Component
```typescript
const handleUpload = async (file: File, demandeId: string) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('demandeId', demandeId);

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData
  });

  const result = await response.json();
  if (result.success) {
    console.log('Uploaded:', result.data.url);
  }
};
```

## Analytics

### Fetch Dashboard Metrics
```typescript
const response = await fetch('/api/analytics/dashboard');
const { data } = await response.json();

console.log('Total demandes:', data.volume.total);
console.log('Average processing:', data.performance.averageProcessingTime);
```

### Export Data
```typescript
// Download CSV export
window.open('/api/analytics/export?format=csv', '_blank');
```

## Cron Jobs

### Deployed Automatically on Vercel
- Email queue: Every 5 minutes
- Auto-archive: Daily at 2 AM
- Metrics calculation: Daily at 3 AM
- Cleanup: Weekly on Sunday at 4 AM

### Local Testing
Set CRON_SECRET in .env.local and call:
```bash
curl -H "Authorization: Bearer YOUR_SECRET" http://localhost:3000/api/cron/send-notifications
```
```

### Acceptance Criteria
- ✅ Workflow triggers notifications correctly
- ✅ All integration tests passing
- ✅ Documentation complete
- ✅ End-to-end flow tested
- ✅ Error handling verified

---

## Testing Checklist

### Email System
- [ ] Email client configured
- [ ] Templates render correctly
- [ ] Emails sent successfully
- [ ] Retry logic works for failures
- [ ] Notification history tracked

### Document Upload
- [ ] File upload to Cloudinary works
- [ ] File validation prevents invalid uploads
- [ ] Document metadata saved correctly
- [ ] Files accessible via URLs

### Analytics
- [ ] Metrics calculated accurately
- [ ] Dashboard displays data
- [ ] Charts render correctly
- [ ] Export generates valid CSV

### Background Jobs
- [ ] Email queue processed
- [ ] Auto-archive runs correctly
- [ ] Cleanup job works
- [ ] Cron jobs logged

### Integration
- [ ] Workflow triggers notifications
- [ ] Documents linked to demandes
- [ ] Analytics queries optimized
- [ ] End-to-end flow complete

---

## Deployment Checklist

### Environment Variables
- [ ] RESEND_API_KEY configured
- [ ] CLOUDINARY credentials set
- [ ] CRON_SECRET configured (Vercel auto-sets)
- [ ] NEXT_PUBLIC_APP_URL set

### Database
- [ ] Notification collection created
- [ ] Indexes added for performance
- [ ] Demande model updated with documents field

### Vercel Configuration
- [ ] vercel.json with cron jobs committed
- [ ] Cron jobs show in Vercel dashboard
- [ ] Environment variables synced

### Monitoring
- [ ] Email delivery monitored in Resend dashboard
- [ ] Cloudinary usage tracked
- [ ] Cron job logs reviewed
- [ ] Error tracking enabled

---

## Success Metrics

### Email System
- Email delivery rate > 95%
- Average send time < 5 seconds
- Notification queue processed < 5 minutes

### Document Upload
- Upload success rate > 99%
- File storage cost < $5/month (Cloudinary free tier)

### Analytics
- Dashboard load time < 2 seconds
- Query response time < 500ms
- Export generation < 3 seconds

### Background Jobs
- Cron job success rate > 99%
- Zero data loss
- Jobs complete within time limits

---

## Total Implementation Timeline

| Task | Duration | Status |
|------|----------|--------|
| 1. Project Setup | 0.5 days | ⏳ Pending |
| 2. Email Service | 2-3 days | ⏳ Pending |
| 3. Document Upload | 2 days | ⏳ Pending |
| 4. Background Jobs | 2 days | ⏳ Pending |
| 5. Analytics | 2-3 days | ⏳ Pending |
| 6. Admin Dashboard | 2-3 days | ⏳ Pending |
| 7. Integration | 2 days | ⏳ Pending |
| **Total** | **11-14 days** | |

---

## Next Steps

After completing this spec:
1. Review and approve plan
2. Set up development environment
3. Begin Task 1 (Project Setup)
4. Implement tasks sequentially
5. Test each task before proceeding
6. Deploy to staging for validation
7. Deploy to production

**Note:** Tasks 2-6 can be partially parallelized after Task 1 is complete, potentially reducing total timeline to 9-12 days with multiple developers.
