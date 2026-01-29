# Supporting Systems - Reference Implementations

This document provides reference implementations, code patterns, and examples for the Supporting Systems components.

## Email Service References

### 1. Resend Integration with React Email

**Library:** `resend` + `react-email`

**Setup:**
```bash
npm install resend react-email @react-email/components
```

**Configuration:**
```typescript
// lib/email/client.ts
import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY is not defined');
}

export const resend = new Resend(process.env.RESEND_API_KEY);
```

**Email Template Example:**
```typescript
// lib/email/templates/demande-recue.tsx
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
import * as React from 'react';

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
              {new Date(dateCreation).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </Text>

            <Text style={label}>Délai estimé:</Text>
            <Text style={value}>{estimatedDelay} jours ouvrables</Text>
          </Section>

          <Text style={text}>
            Vous pouvez suivre l'évolution de votre demande à tout moment en cliquant sur le lien ci-dessous:
          </Text>

          <Link href={trackingUrl} style={button}>
            Suivre ma demande
          </Link>

          <Text style={footer}>
            Vous recevrez un email de notification à chaque changement de statut.
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
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
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
  width: 'auto',
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

**Send Email Service:**
```typescript
// lib/email/send.ts
import { resend } from './client';
import { DemandeRecueEmail } from './templates/demande-recue';
import { render } from '@react-email/render';

interface SendEmailOptions {
  to: string;
  subject: string;
  template: React.ReactElement;
}

export async function sendEmail({ to, subject, template }: SendEmailOptions) {
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

// Usage example
export async function sendDemandeRecueEmail(demande: Demande) {
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
```

### 2. Alternative: Nodemailer + SMTP

**Library:** `nodemailer` + `handlebars` (for HTML templates)

**Setup:**
```bash
npm install nodemailer @types/nodemailer handlebars
```

**Configuration:**
```typescript
// lib/email/nodemailer-client.ts
import nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Verify connection
transporter.verify((error, success) => {
  if (error) {
    console.error('SMTP connection error:', error);
  } else {
    console.log('SMTP server ready');
  }
});
```

**Send Email with Nodemailer:**
```typescript
// lib/email/send-nodemailer.ts
import { transporter } from './nodemailer-client';
import Handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';

export async function sendEmailNodemailer(options: {
  to: string;
  subject: string;
  templateName: string;
  data: Record<string, any>;
}) {
  const { to, subject, templateName, data } = options;

  // Load template
  const templatePath = path.join(process.cwd(), 'lib/email/templates', `${templateName}.hbs`);
  const templateSource = fs.readFileSync(templatePath, 'utf-8');
  const template = Handlebars.compile(templateSource);
  const html = template(data);

  // Send email
  const info = await transporter.sendMail({
    from: '"Scolarité" <noreply@university.edu>',
    to,
    subject,
    html,
  });

  return { success: true, messageId: info.messageId };
}
```

## Job Queue References

### 3. Vercel Cron Jobs (Recommended for Next.js)

**Configuration:**
```json
// vercel.json
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
      "path": "/api/cron/calculate-metrics",
      "schedule": "0 3 * * *"
    },
    {
      "path": "/api/cron/cleanup",
      "schedule": "0 4 * * 0"
    }
  ]
}
```

**Cron Job Implementation:**
```typescript
// app/api/cron/send-notifications/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Notification } from '@/lib/db/models/notification';
import { sendNotificationEmail } from '@/lib/notifications/send';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (Vercel sets this automatically)
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
      nbTentatives: { $lt: 3 } // Max 3 retries
    })
    .sort({ 'metadata.priority': -1, createdAt: 1 }) // High priority first
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
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'CRN_001',
          message: 'Job execution failed',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      },
      { status: 500 }
    );
  }
}
```

### 4. Alternative: Inngest (for complex workflows)

**Library:** `inngest`

**Setup:**
```bash
npm install inngest
```

**Configuration:**
```typescript
// lib/inngest/client.ts
import { Inngest } from 'inngest';

export const inngest = new Inngest({
  id: 'university-app',
  name: 'University Request System'
});
```

**Function Definition:**
```typescript
// lib/inngest/functions.ts
import { inngest } from './client';
import { sendNotificationEmail } from '@/lib/notifications/send';

export const sendEmailFunction = inngest.createFunction(
  { id: 'send-notification-email', name: 'Send Notification Email' },
  { event: 'notification/send' },
  async ({ event, step }) => {
    const { notificationId } = event.data;

    // Get notification from database
    const notification = await step.run('fetch-notification', async () => {
      return await Notification.findById(notificationId);
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    // Send email with retry
    await step.run('send-email', async () => {
      return await sendNotificationEmail(notification);
    });

    // Update status
    await step.run('update-status', async () => {
      notification.statutEnvoi = 'ENVOYE';
      notification.dateEnvoi = new Date();
      return await notification.save();
    });

    return { success: true };
  }
);

// Schedule daily metrics calculation
export const calculateMetricsFunction = inngest.createFunction(
  { id: 'calculate-daily-metrics', name: 'Calculate Daily Metrics' },
  { cron: '0 3 * * *' }, // Daily at 3am
  async ({ step }) => {
    const metrics = await step.run('calculate-metrics', async () => {
      return await calculateDashboardMetrics();
    });

    await step.run('store-metrics', async () => {
      return await storeMetricsSnapshot(metrics);
    });

    return { success: true, metrics };
  }
);
```

## File Upload References

### 5. Cloudinary Integration

**Library:** `cloudinary`

**Setup:**
```bash
npm install cloudinary
```

**Configuration:**
```typescript
// lib/upload/cloudinary.ts
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;
```

**Upload Service:**
```typescript
// lib/upload/upload-service.ts
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
```

**API Route:**
```typescript
// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { uploadToCloudinary } from '@/lib/upload/upload-service';
import { uploadFileSchema } from '@/lib/validators/upload';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'UPL_004', message: 'No file provided' }
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
            details: validation.error.flatten()
          }
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
          error: { code: 'VAL_004', message: 'Demande ID required' }
        },
        { status: 400 }
      );
    }

    // Upload to Cloudinary
    const result = await uploadToCloudinary(file, {
      folder: `demandes/${new Date().getFullYear()}/${demandeId}`
    });

    // Return metadata
    return NextResponse.json({
      success: true,
      data: {
        id: result.id,
        url: result.url,
        nomFichier: result.nomFichier,
        nomOriginal: file.name,
        taille: result.taille,
        typeMime: result.typeMime,
        dateUpload: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UPL_003',
          message: 'Upload failed',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      },
      { status: 500 }
    );
  }
}
```

## Analytics References

### 6. MongoDB Aggregation for Dashboard Metrics

**Dashboard Metrics Service:**
```typescript
// lib/analytics/calculate.ts
import { Demande } from '@/lib/db/models/demande';
import { Types } from 'mongoose';

export async function calculateDashboardMetrics(dateRange?: {
  startDate: Date;
  endDate: Date;
}) {
  const matchStage = dateRange
    ? {
        createdAt: {
          $gte: dateRange.startDate,
          $lte: dateRange.endDate
        }
      }
    : {};

  // Volume metrics
  const volumeMetrics = await Demande.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        byType: {
          $push: {
            type: '$typeDemande.code',
            count: 1
          }
        },
        byStatus: {
          $push: {
            status: '$statut.code',
            count: 1
          }
        },
        byPriority: {
          $push: {
            priority: '$priorite',
            count: 1
          }
        }
      }
    },
    {
      $project: {
        _id: 0,
        total: 1,
        byType: {
          $reduce: {
            input: '$byType',
            initialValue: {},
            in: {
              $mergeObjects: [
                '$$value',
                { '$$this.type': { $add: ['$$this.count', 0] } }
              ]
            }
          }
        },
        byStatus: {
          $reduce: {
            input: '$byStatus',
            initialValue: {},
            in: {
              $mergeObjects: [
                '$$value',
                { '$$this.status': { $add: ['$$this.count', 0] } }
              ]
            }
          }
        },
        byPriority: {
          $reduce: {
            input: '$byPriority',
            initialValue: {},
            in: {
              $mergeObjects: [
                '$$value',
                { '$$this.priority': { $add: ['$$this.count', 0] } }
              ]
            }
          }
        }
      }
    }
  ]);

  // Performance metrics
  const performanceMetrics = await Demande.aggregate([
    {
      $match: {
        ...matchStage,
        dateTraitement: { $exists: true }
      }
    },
    {
      $project: {
        processingTime: {
          $divide: [
            { $subtract: ['$dateTraitement', '$createdAt'] },
            3600000 // Convert to hours
          ]
        },
        type: '$typeDemande.code',
        slaTarget: '$typeDemande.delaiTraitement'
      }
    },
    {
      $group: {
        _id: null,
        averageProcessingTime: { $avg: '$processingTime' },
        processingTimeByType: {
          $push: {
            type: '$type',
            time: '$processingTime'
          }
        },
        withinSLA: {
          $sum: {
            $cond: [
              { $lte: ['$processingTime', { $multiply: ['$slaTarget', 24] }] },
              1,
              0
            ]
          }
        },
        total: { $sum: 1 }
      }
    },
    {
      $project: {
        _id: 0,
        averageProcessingTime: { $round: ['$averageProcessingTime', 2] },
        slaComplianceRate: {
          $multiply: [
            { $divide: ['$withinSLA', '$total'] },
            100
          ]
        }
      }
    }
  ]);

  // Quality metrics
  const qualityMetrics = await Demande.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        approved: {
          $sum: {
            $cond: [
              { $in: ['$statut.code', ['VALIDE', 'TRAITE']] },
              1,
              0
            ]
          }
        },
        rejected: {
          $sum: {
            $cond: [{ $eq: ['$statut.code', 'REJETE'] }, 1, 0]
          }
        }
      }
    },
    {
      $project: {
        _id: 0,
        approvalRate: {
          $multiply: [{ $divide: ['$approved', '$total'] }, 100]
        },
        rejectionRate: {
          $multiply: [{ $divide: ['$rejected', '$total'] }, 100]
        }
      }
    }
  ]);

  return {
    volume: volumeMetrics[0] || {},
    performance: performanceMetrics[0] || {},
    quality: qualityMetrics[0] || {}
  };
}
```

**API Endpoint:**
```typescript
// app/api/analytics/dashboard/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { calculateDashboardMetrics } from '@/lib/analytics/calculate';
import { analyticsQuerySchema } from '@/lib/validators/analytics';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const query = analyticsQuerySchema.parse({
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate')
    });

    const metrics = await calculateDashboardMetrics(
      query.startDate && query.endDate
        ? { startDate: query.startDate, endDate: query.endDate }
        : undefined
    );

    return NextResponse.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'ANA_002',
          message: 'Metric calculation failed',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      },
      { status: 500 }
    );
  }
}
```

## Testing References

### 7. Unit Test Example for Email Service

```typescript
// __tests__/lib/email/send.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendDemandeRecueEmail } from '@/lib/email/send';
import { resend } from '@/lib/email/client';

// Mock Resend
vi.mock('@/lib/email/client', () => ({
  resend: {
    emails: {
      send: vi.fn()
    }
  }
}));

describe('Email Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should send demande recue email successfully', async () => {
    const mockDemande = {
      numeroDemande: 'DEM-2024-000001',
      typeDemande: { nom: 'Attestation de scolarité', delaiTraitement: 5 },
      etudiant: {
        nom: 'Doe',
        prenom: 'John',
        email: 'john.doe@university.edu'
      },
      createdAt: new Date('2024-01-28')
    };

    vi.mocked(resend.emails.send).mockResolvedValue({
      data: { id: 'email-123' },
      error: null
    });

    const result = await sendDemandeRecueEmail(mockDemande);

    expect(result.success).toBe(true);
    expect(result.emailId).toBe('email-123');
    expect(resend.emails.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'john.doe@university.edu',
        subject: expect.stringContaining('DEM-2024-000001')
      })
    );
  });

  it('should handle email send failure', async () => {
    const mockDemande = {
      numeroDemande: 'DEM-2024-000002',
      typeDemande: { nom: 'Relevé de notes', delaiTraitement: 3 },
      etudiant: {
        nom: 'Smith',
        prenom: 'Jane',
        email: 'jane.smith@university.edu'
      },
      createdAt: new Date('2024-01-28')
    };

    vi.mocked(resend.emails.send).mockResolvedValue({
      data: null,
      error: { message: 'SMTP connection failed' }
    });

    await expect(sendDemandeRecueEmail(mockDemande)).rejects.toThrow(
      'Email send failed: SMTP connection failed'
    );
  });
});
```

### 8. Integration Test Example for Upload API

```typescript
// __tests__/api/upload/route.test.ts
import { describe, it, expect, vi } from 'vitest';
import { POST } from '@/app/api/upload/route';
import { uploadToCloudinary } from '@/lib/upload/upload-service';

vi.mock('@/lib/upload/upload-service');

describe('Upload API', () => {
  it('should upload file successfully', async () => {
    const mockFile = new File(['test content'], 'test.pdf', {
      type: 'application/pdf'
    });

    const formData = new FormData();
    formData.append('file', mockFile);
    formData.append('demandeId', '507f1f77bcf86cd799439011');

    vi.mocked(uploadToCloudinary).mockResolvedValue({
      id: 'cloudinary-id-123',
      url: 'https://res.cloudinary.com/demo/test.pdf',
      nomFichier: 'test.pdf',
      taille: 12,
      typeMime: 'application/pdf'
    });

    const request = new Request('http://localhost:3000/api/upload', {
      method: 'POST',
      body: formData
    });

    const response = await POST(request);
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.data).toMatchObject({
      id: 'cloudinary-id-123',
      url: expect.stringContaining('cloudinary'),
      nomFichier: 'test.pdf'
    });
  });

  it('should reject file exceeding size limit', async () => {
    // Create a large file (> 5MB)
    const largeContent = new Array(6 * 1024 * 1024).fill('a').join('');
    const mockFile = new File([largeContent], 'large.pdf', {
      type: 'application/pdf'
    });

    const formData = new FormData();
    formData.append('file', mockFile);
    formData.append('demandeId', '507f1f77bcf86cd799439011');

    const request = new Request('http://localhost:3000/api/upload', {
      method: 'POST',
      body: formData
    });

    const response = await POST(request);
    const data = await response.json();

    expect(data.success).toBe(false);
    expect(data.error.code).toBe('VAL_001');
    expect(response.status).toBe(400);
  });
});
```

## Summary

These reference implementations provide:
- ✅ Resend + React Email integration for beautiful transactional emails
- ✅ Nodemailer alternative for SMTP servers
- ✅ Vercel Cron for scheduled background jobs
- ✅ Inngest for complex async workflows (alternative)
- ✅ Cloudinary integration for secure file storage
- ✅ MongoDB aggregation for powerful analytics
- ✅ Comprehensive test coverage examples

All patterns follow the project standards and are production-ready for the academic request management system.
