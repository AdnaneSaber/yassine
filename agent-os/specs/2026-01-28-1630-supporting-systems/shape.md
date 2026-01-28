# Supporting Systems - Feature Scope

## Overview

This spec covers the implementation of three critical supporting systems for the university request management platform:
1. **Email Notification System** - Automated email notifications triggered by workflow state changes
2. **Document Management System** - File upload, storage, and retrieval with cloud integration
3. **Analytics & BI Dashboard** - KPI calculations, metrics tracking, and business intelligence integration

These systems are essential infrastructure that support core workflows but can be developed independently from the main request processing logic.

---

## 1. Email Notification System

### Purpose
Automatically notify students and administrators of important events in the request lifecycle through transactional emails.

### Core Features

#### 1.1 Email Templates
- **Confirmation Email** - Sent when request is submitted and received
  - Subject: "Demande reçue - [NUMERO_DEMANDE]"
  - Content: Request number, type, estimated processing time
  - CTA: Link to track request status

- **Status Change Email** - Sent when request status changes
  - Subject: "Mise à jour - [NUMERO_DEMANDE]"
  - Content: New status, change timestamp, next steps
  - Conditional content based on status (approved, rejected, info needed)

- **Rejection Email** - Sent when request is rejected
  - Subject: "Demande rejetée - [NUMERO_DEMANDE]"
  - Content: Rejection reason, appeal process (if applicable)
  - Supportive tone with clear next steps

- **Approval Email** - Sent when request is validated/completed
  - Subject: "Demande validée - [NUMERO_DEMANDE]"
  - Content: Document pickup instructions or download link
  - Satisfaction survey link (optional)

- **Reminder Email** - Sent for delayed requests (admin-only)
  - Subject: "Rappel - Demande en attente"
  - Content: Request details, days overdue, priority level
  - Assigned admin information

#### 1.2 Email Queue with BullMQ
- **Asynchronous Processing**
  - Queue all emails to prevent blocking main request flow
  - Redis-backed job queue for reliability
  - Retry mechanism for failed sends (3 attempts with exponential backoff)

- **Priority Levels**
  - HIGH: Status changes, rejections, approvals
  - NORMAL: Confirmations
  - LOW: Reminders, batch notifications

- **Worker Process**
  - Separate worker process for email sending
  - Rate limiting to comply with email service limits
  - Logging of all send attempts and failures

#### 1.3 Email Service Integration
- **Provider: Resend** (or Nodemailer for SMTP)
  - Transactional email API
  - High deliverability rates
  - Template management
  - Bounce and complaint tracking

- **From Address**: `noreply@university.edu`
- **Reply-To**: `support@university.edu` (for student emails)
- **HTML + Plain Text** versions of all templates

#### 1.4 Notification History
- Store all sent notifications in database
  - Demande ID reference
  - Email type
  - Recipient
  - Send timestamp
  - Status (pending, sent, failed)
  - Error message (if failed)

- Admin view of notification history per request
- Resend capability for failed notifications

### Technical Architecture

```
Request Status Change
        ↓
Trigger Notification
        ↓
Add to Email Queue (BullMQ)
        ↓
Worker picks job
        ↓
Render template with data
        ↓
Send via Resend API
        ↓
Log result to database
        ↓
Update notification status
```

### Data Model

```typescript
interface Notification {
  _id: string;
  demandeId: ObjectId;
  numeroDemandeRef: string; // Denormalized for queries
  type: 'CONFIRMATION' | 'STATUS_CHANGE' | 'REJECTION' | 'APPROVAL' | 'REMINDER';
  destinataire: string; // Email address
  objet: string; // Email subject
  statut: 'EN_ATTENTE' | 'ENVOYE' | 'ECHEC';
  dateEnvoi?: Date;
  dateCreation: Date;
  erreur?: string; // Error message if failed
  metadata: {
    templateData: Record<string, any>;
    priority: 'LOW' | 'NORMAL' | 'HIGH';
  };
}
```

---

## 2. Document Management System

### Purpose
Enable students to upload supporting documents with requests and provide secure storage, retrieval, and validation.

### Core Features

#### 2.1 File Upload
- **Frontend Upload Component**
  - Drag-and-drop interface
  - Multiple file selection
  - File type validation (client-side)
  - File size validation (max 5MB per file)
  - Upload progress indicator
  - Preview for images/PDFs

- **Supported File Types**
  - Documents: PDF, DOC, DOCX
  - Images: JPG, JPEG, PNG
  - Total limit: 5 files per request

- **Client-Side Validation**
  - File type check via MIME type
  - Size check before upload
  - Filename sanitization

#### 2.2 Cloudinary Integration
- **Cloud Storage Provider: Cloudinary**
  - Advantages: Free tier sufficient for POC, CDN, transformations
  - Folder structure: `/demandes/{YEAR}/{DEMANDE_ID}/`
  - Auto-optimization of images
  - Secure URLs with expiration (optional)

- **Upload Flow**
  1. Client uploads to `/api/upload` endpoint
  2. Server validates file
  3. Upload to Cloudinary via SDK
  4. Return Cloudinary URL and metadata
  5. Store metadata in demande document

- **File Metadata Stored**
  - Original filename
  - Cloudinary public ID
  - Secure URL
  - File type (MIME)
  - File size
  - Upload timestamp
  - Category/label (optional)

#### 2.3 Server-Side Validation
- **Security Checks**
  - MIME type validation (don't trust client)
  - File size limit enforcement (5MB)
  - Virus scanning (optional for POC, recommended for production)
  - Rate limiting on upload endpoint

- **Error Handling**
  - Clear error messages for validation failures
  - Upload retry mechanism
  - Cleanup of partially uploaded files

#### 2.4 Document Storage Schema
Embedded in demande document:

```typescript
interface DocumentFile {
  id: string; // Cloudinary public_id
  nomFichier: string; // Display name
  nomOriginal: string; // Original filename
  url: string; // Cloudinary secure_url
  typeMime: string; // MIME type
  taille: number; // File size in bytes
  categorie?: string; // Optional category
  dateUpload: Date;
}

// In Demande model
documents: DocumentFile[];
```

#### 2.5 Document Access
- **View/Download**
  - Students can view their own uploaded documents
  - Admins can view all documents for all requests
  - Direct link to Cloudinary URL (served from CDN)

- **Delete**
  - Students can delete documents before submission
  - After submission, only admins can manage documents
  - Soft delete: mark as deleted but keep in Cloudinary (audit trail)

### Technical Architecture

```
Client File Selection
        ↓
Client-side validation
        ↓
POST /api/upload (FormData)
        ↓
Server-side validation
        ↓
Upload to Cloudinary
        ↓
Receive Cloudinary response
        ↓
Store metadata in demande.documents[]
        ↓
Return URL to client
```

### Security Considerations
- Authentication required for upload endpoint
- Files associated with user's session/account
- Upload rate limiting (10 files per minute per user)
- CORS restrictions on upload endpoint
- Cloudinary URLs with signed URLs for sensitive documents (optional)

---

## 3. Analytics & Business Intelligence

### Purpose
Provide administrators and decision-makers with real-time and historical insights into request processing performance, trends, and bottlenecks.

### Core Features

#### 3.1 KPI Calculations
Core metrics calculated daily and stored for historical trending:

**Volume Metrics**
- Total requests submitted (daily, weekly, monthly)
- Requests by type (breakdown by type of request)
- Requests by status (current distribution)
- Requests by priority level

**Performance Metrics**
- Average processing time (from submission to completion)
- Processing time by request type
- Processing time by assigned admin
- Percentage meeting SLA (based on delaiTraitement)

**Quality Metrics**
- Approval rate (% of requests approved vs rejected)
- Rejection rate by type
- Rejection reasons (aggregated)
- First-time resolution rate

**Efficiency Metrics**
- Requests per admin (workload distribution)
- Average touches per request (status changes)
- Backlog size (pending requests)
- Aging analysis (requests by days pending)

#### 3.2 Dashboard API Endpoints

**Real-time Metrics**
```
GET /api/analytics/current-stats
Response: {
  totalPending: number,
  totalInProgress: number,
  totalCompletedToday: number,
  averageProcessingTime: number // in hours
}
```

**Historical Trends**
```
GET /api/analytics/trends?period=30days&metric=volume
Response: {
  labels: string[], // dates
  data: number[]    // metric values
}
```

**Type Breakdown**
```
GET /api/analytics/by-type?period=7days
Response: {
  types: string[],
  counts: number[],
  percentages: number[]
}
```

**Admin Performance**
```
GET /api/analytics/admin-performance?adminId=xxx
Response: {
  requestsProcessed: number,
  averageTime: number,
  approvalRate: number
}
```

#### 3.3 Metabase Integration
- **Direct PostgreSQL/MongoDB Connection**
  - Metabase connects directly to production database (read-only user)
  - No data duplication needed for POC
  - Real-time dashboards

- **Pre-built Dashboards**
  1. **Operational Dashboard**
     - Current pending requests by type
     - SLA compliance (traffic light indicators)
     - Today's completions vs target
     - Alerts for overdue requests

  2. **Analytical Dashboard**
     - 30-day volume trends
     - Processing time trends
     - Approval/rejection trends
     - Type distribution over time

  3. **Administrative Dashboard**
     - Admin workload comparison
     - Average resolution time by admin
     - Request assignment distribution

- **Custom Queries**
  - Ad-hoc query builder for admins
  - Saved queries library
  - Export to CSV/Excel

#### 3.4 Analytics Data Collection
- **Aggregation Service**
  - Daily cron job to calculate metrics
  - Store in `analytics_snapshots` collection
  - Keep 90 days of daily snapshots (configurable)

- **Data Schema**
```typescript
interface AnalyticsSnapshot {
  _id: string;
  date: Date; // Snapshot date
  metrics: {
    volume: {
      totalSubmitted: number;
      byType: Record<TypeDemandeCode, number>;
      byStatus: Record<StatutCode, number>;
      byPriority: Record<Priorite, number>;
    };
    performance: {
      averageProcessingTime: number; // hours
      processingTimeByType: Record<TypeDemandeCode, number>;
      slaComplianceRate: number; // percentage
    };
    quality: {
      approvalRate: number;
      rejectionRate: number;
      rejectionReasons: Record<string, number>;
    };
  };
  createdAt: Date;
}
```

### Technical Architecture

```
Daily Cron Job (3am)
        ↓
Query all demandes
        ↓
Calculate KPIs
        ↓
Store in analytics_snapshots
        ↓
Metabase queries snapshots + live data
        ↓
Render dashboards
```

### Dashboard Access
- **Admin Role Required**
- Embedded Metabase iframes in admin panel
- Direct link to Metabase for power users
- Mobile-responsive dashboards

---

## Dependencies & Integration Points

### Email System Dependencies
- BullMQ (job queue)
- Redis (queue storage)
- Resend (email provider) or Nodemailer (SMTP)
- React Email (template components)

### Document System Dependencies
- Cloudinary SDK
- Multer or similar for multipart form parsing
- File type validation library

### Analytics Dependencies
- Metabase (self-hosted or cloud)
- MongoDB aggregation framework
- Chart.js or Recharts (for custom frontend charts)

### Integration with Core Workflow
- Email notifications triggered by workflow state transitions
- Documents linked to demande documents
- Analytics queries demandes, historique, and users collections

---

## Success Criteria

### Email System
- ✅ All status changes trigger appropriate emails
- ✅ Emails sent within 30 seconds of trigger
- ✅ 99% delivery rate
- ✅ All emails logged in notification history
- ✅ Failed emails retry automatically

### Document System
- ✅ Students can upload up to 5 files per request
- ✅ File validation prevents invalid uploads
- ✅ All documents stored in Cloudinary
- ✅ Documents accessible via secure URLs
- ✅ Upload success rate > 95%

### Analytics System
- ✅ All KPIs calculated correctly
- ✅ Dashboards update in real-time
- ✅ Historical data retained for 90 days
- ✅ Metabase dashboards accessible to admins
- ✅ Custom queries available for ad-hoc analysis

---

## Out of Scope (Future Enhancements)

- SMS notifications
- Push notifications (mobile app)
- Advanced document OCR/parsing
- Document version control
- Predictive analytics/ML models
- Multi-language email templates
- A/B testing for email templates
- Advanced file transformations (beyond Cloudinary defaults)
- Data warehousing for long-term analytics storage
