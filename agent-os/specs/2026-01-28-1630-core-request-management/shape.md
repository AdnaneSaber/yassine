# Core Request Management System - Feature Specification

**Spec Date:** 2026-01-28
**Version:** 1.0
**Status:** Draft

## Overview

The Core Request Management System is the central feature of the university administrative platform. It enables students to submit and track administrative requests (attestations, transcripts, conventions) through a digital workflow, while providing administrators with a complete dashboard to process, validate, and manage these requests efficiently.

This system replaces manual, paper-based processes with an automated, traceable, and intelligent workflow engine.

## Problem Statement

French academic institutions face fragmented and manual administrative processes for handling student requests:

- **Long and unpredictable processing times**: No visibility into request status or expected completion
- **Lost documents and errors**: Paper-based systems prone to loss and human error
- **Heavy administrative burden**: Manual tracking and processing increases workload
- **Frustrating student experience**: No self-service portal, unclear status updates
- **Lack of data insights**: No analytics to optimize processes or identify bottlenecks

## Solution Architecture

The Core Request Management System consists of three integrated components:

### 1. Student Portal
Self-service interface enabling students to:
- Submit new administrative requests via structured forms
- Upload required supporting documents
- Track real-time status of their requests
- View complete request history with timeline
- Receive automated email notifications at each workflow stage

### 2. Admin Dashboard
Management interface enabling administrators to:
- View and filter all incoming requests
- Update request status through validated workflow transitions
- Add comments and internal notes
- Assign requests to specific administrators
- Search and filter by multiple criteria (status, type, priority, date)
- Access complete audit trail of all actions

### 3. Workflow Engine
Automated state machine managing the request lifecycle:
- Enforces valid status transitions (SOUMIS → RECU → EN_COURS → VALIDE → TRAITE)
- Triggers automated actions (emails, notifications, date stamps)
- Validates business rules at each transition
- Maintains complete historique (audit log) of all changes
- Supports configurable workflows per request type

## Key Features

### Request Types Supported

| Type | Code | Processing Time | Required Documents |
|------|------|----------------|-------------------|
| Attestation de scolarité | ATTESTATION_SCOLARITE | 3 days | Student ID |
| Relevé de notes | RELEVE_NOTES | 5 days | Exam results |
| Attestation de réussite | ATTESTATION_REUSSITE | 5 days | Final grades |
| Duplicata carte étudiant | DUPLICATA_CARTE | 7 days | ID photo, police report |
| Convention de stage | CONVENTION_STAGE | 3 days | Internship agreement |

### Workflow States

```
SOUMIS (Submitted)
   ↓ Auto
RECU (Received) ──────────┐
   ↓ Admin                │ Admin reject
EN_COURS (In Progress) ──┤
   ↓ Admin                │
VALIDE (Validated)        │
   ↓ Auto                 ↓
TRAITE (Processed)    REJETE (Rejected)
   ↓ After 6 months       ↓
ARCHIVE (Archived) ←──────┘
```

### Priority Levels

- **BASSE**: Standard processing
- **NORMALE**: Default priority (most requests)
- **HAUTE**: Expedited processing
- **URGENTE**: Critical/time-sensitive (auto-flagged based on deadline)

### Automated Actions

1. **On submission** (SOUMIS → RECU):
   - Generate unique request number (DEM-YYYY-NNNNNN)
   - Send confirmation email to student
   - Log creation in historique
   - Auto-transition to RECU status

2. **On validation** (VALIDE → TRAITE):
   - Set dateTraitement timestamp
   - Send completion email with document link
   - Update analytics
   - Log transition

3. **On rejection** (→ REJETE):
   - Require motifRefus (rejection reason)
   - Send rejection email with explanation
   - Log with full context

4. **On info request** (→ ATTENTE_INFO):
   - Send email to student requesting additional information
   - Include admin comment with specific requirements

## Data Model

### Core Collections

**demandes**: Primary request collection
- Strategic denormalization: Embeds student info for read performance
- Full workflow state with code + libelle + couleur
- Embedded documents array for file attachments
- Flexible metadata field for type-specific attributes

**etudiants**: Student master data
- Source of truth for student information
- Referenced by demandes via id
- Supports multiple active demandes per student

**utilisateurs**: System users (students + admins)
- Role-based authentication (STUDENT, ADMIN, SUPER_ADMIN)
- Links to etudiant record for students

**historique**: Complete audit trail
- Immutable log of all status changes
- Captures before/after state snapshots
- Records user, timestamp, and context for every action

**notifications**: Email queue and tracking
- Async email processing via background workers
- Retry logic for failed sends
- Delivery status tracking

### Key Design Decisions

**Decision 1: Strategic Denormalization**
- Store student name, email, matricule in demandes collection
- Rationale: 95% of queries need this data; student names change rarely
- Trade-off: Slightly stale data vs. massive performance gain (no JOINs)

**Decision 2: Code + Label Pattern**
- All statuses/types store both machine code (RECU) and display label ("Reçu")
- Rationale: Enables query by code, display by label, UI color coding
- Benefit: Consistent UI rendering, easy filtering, i18n-ready

**Decision 3: Embedded Documents Array**
- Store uploaded documents directly in demandes collection
- Rationale: Always fetched together, max ~10 docs per request
- Alternative considered: Separate documents collection (rejected - over-engineering)

**Decision 4: Workflow as First-Class Citizen**
- Dedicated DemandeWorkflow class encapsulating all state logic
- Rationale: Centralized validation, reusable transitions, consistent hooks
- Benefit: Impossible to create invalid states, complete audit trail

**Decision 5: Mongoose for MVP**
- Use Mongoose ODM (not Prisma) for prototype
- Rationale: Simpler setup, better MongoDB feature support, embedded docs
- Note: Architecture supports future migration to Prisma if needed

## Technical Stack

### Backend
- **Framework**: Next.js 14+ (App Router)
- **Database**: MongoDB (Atlas or local)
- **ODM**: Mongoose
- **Validation**: Zod (runtime + type inference)
- **Authentication**: NextAuth.js
- **File Storage**: Cloudinary (or local for development)
- **Email**: Resend (or Nodemailer for development)

### Frontend
- **Framework**: React 18+ with TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Forms**: React Hook Form + Zod
- **State**: React Context API
- **Data Fetching**: Server Actions + API Routes

### Development
- **Language**: TypeScript (strict mode)
- **Linting**: ESLint + Prettier
- **Testing**: Jest + React Testing Library
- **Version Control**: Git

## Business Intelligence

### Key Metrics

1. **Volume Metrics**
   - Total requests per day/week/month
   - Requests by type (breakdown)
   - Requests by status (current state distribution)

2. **Performance Metrics**
   - Average processing time by type
   - SLA compliance rate (% within expected delaiTraitement)
   - Admin response time (RECU → EN_COURS)

3. **Quality Metrics**
   - Rejection rate by type
   - Top rejection reasons
   - Requests requiring additional info (ATTENTE_INFO rate)

4. **User Metrics**
   - Active students (requests in last 30 days)
   - Requests per student (distribution)
   - Peak submission hours/days

### Analytics Implementation

- Metabase connected directly to MongoDB
- Pre-built dashboards for admins and directors
- Real-time metrics with daily/weekly email reports

## Non-Functional Requirements

### Performance
- Request list page loads in < 500ms
- API responses in < 200ms (95th percentile)
- Support 100 concurrent users
- Handle 1000+ requests in database

### Security
- JWT-based authentication with 24h expiration
- RBAC: Students see only their requests, Admins see all
- Input validation at API layer (Zod schemas)
- File upload restrictions: 5MB max, PDF/JPG/PNG only
- HTTPS required in production

### Reliability
- Graceful error handling with user-friendly messages
- Email retry logic (3 attempts with exponential backoff)
- Database connection pooling
- Crash recovery (no data loss on server restart)

### Usability
- Mobile-responsive design (Tailwind breakpoints)
- French language throughout UI
- Accessible (WCAG 2.1 AA compliance)
- Clear status badges with color coding

### Maintainability
- TypeScript strict mode (no implicit any)
- Comprehensive code comments in English
- Zod schemas as single source of truth for validation
- Modular architecture (easy to add new request types)

## Success Criteria

### MVP Launch Criteria

1. **Feature Completeness**
   - ✅ All 5 request types submittable
   - ✅ Complete workflow (SOUMIS through TRAITE/REJETE)
   - ✅ Student portal with tracking
   - ✅ Admin dashboard with all filters
   - ✅ Email notifications at each stage

2. **Data Quality**
   - ✅ 100% of transitions logged in historique
   - ✅ Zero invalid state transitions possible
   - ✅ All required fields validated

3. **Performance**
   - ✅ Student request list loads < 1 second
   - ✅ Admin dashboard loads < 2 seconds
   - ✅ Email delivery within 5 minutes

4. **User Acceptance**
   - ✅ Students can submit request in < 3 minutes
   - ✅ Admins can process request in < 2 minutes
   - ✅ Zero critical bugs in production testing

### Post-MVP Enhancements

- SMS notifications (in addition to email)
- Document e-signature
- Advanced search with full-text
- Bulk operations (approve/reject multiple)
- Mobile app (React Native)
- Internationalization (Arabic, English)

## Risks and Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|-----------|-----------|
| Email deliverability issues | High | Medium | Implement retry queue, use reputable provider (Resend), monitor bounce rates |
| File storage costs | Medium | Low | Set quota per student, compress PDFs, use CDN only if needed |
| Concurrent updates (race conditions) | High | Low | Mongoose optimistic locking (__v), validate before transitions |
| MongoDB query performance degradation | High | Medium | Strategic indexes on etudiant.id, statut.code, createdAt; pagination required |
| Workflow complexity creep | Medium | High | Strict transition validation, comprehensive tests, documentation |

## Out of Scope (Phase 1)

- Payment processing (fee collection)
- Integration with ERP/student information system
- Digital signature (cryptographic)
- Multi-language support
- Admin role hierarchy (department-level permissions)
- Advanced analytics (ML predictions)
- Mobile native apps

## References

- Product Mission: `/agent-os/product/mission.md`
- Technical Architecture: `/agent-os/product/architecture.md`
- Implementation Guide: `/agent-os/product/implementation-guide.md`
- Roadmap: `/agent-os/product/roadmap.md`
- Standards: `/agent-os/standards/` (database, API, workflow, TypeScript, naming)

---

**Sign-off:**
- Product Owner: [Pending]
- Technical Lead: [Pending]
- Date: 2026-01-28
