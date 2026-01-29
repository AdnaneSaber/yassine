# Core Request Management System - Shape

## Overview

The Core Request Management System is the foundational feature of the academic administrative platform. It enables students to submit administrative requests (attestations, transcripts, etc.), track their status, and allows administrative staff to process these requests through a defined workflow.

## Problem Statement

French academic institutions face fragmented and manual administrative request processing:
- Long and unpredictable processing delays
- Lack of visibility on request status
- Document errors and losses
- High administrative workload
- Frustrating student experience

## Solution Scope

Build a complete request management workflow system that includes:

### 1. Student Request Submission
- Multi-step form with validation
- Document upload (PDF, images)
- Request type selection (attestation, transcript, etc.)
- Real-time form validation
- Confirmation email

### 2. Request Status Management
- State machine with 8 defined states
- Automated transitions (SOUMIS → RECU)
- Admin-initiated transitions (approval, rejection)
- Status history tracking
- Email notifications on status changes

### 3. Student Interface
- Dashboard with request overview
- Request submission form
- My requests list with filters
- Individual request detail view
- Status tracking timeline
- Document download

### 4. Admin Interface
- Admin dashboard with metrics
- Request queue management
- Status modification controls
- Request assignment
- Bulk operations
- Advanced filtering

### 5. Database Models
- **Demande**: Core request entity with embedded student info
- **Etudiant**: Student entity with academic information
- **Historique**: Audit trail for all status changes
- **Utilisateur**: User accounts with role-based access
- **Notification**: Email notification queue

### 6. API Layer
- RESTful endpoints for CRUD operations
- File upload endpoint
- Workflow transition endpoint
- Query endpoints with pagination and filtering

### 7. Server Actions
- Form submission handler
- Status update handler
- Document upload handler
- Validation and error handling

## Out of Scope (Not in Core)

- Analytics dashboard (separate feature)
- Document generation (separate feature)
- Email templates system (use basic templates)
- SMS notifications (email only for now)
- Advanced search (basic filters only)
- Export to Excel (later feature)
- Multi-language support (French only)

## Key Decisions

### 1. MongoDB with Strategic Denormalization

**Decision**: Use MongoDB with denormalized student data in demandes collection.

**Rationale**:
- Read performance: Student name displayed in 95% of queries
- Student data rarely changes
- Avoids JOIN operations for list views
- Simpler queries for common operations

**Trade-off**: Data duplication, but acceptable for this use case.

### 2. Next.js 15 App Router with Server Components

**Decision**: Use App Router with Server Components by default, Client Components only when needed.

**Rationale**:
- Better performance (less JavaScript to client)
- Built-in data fetching
- Simplified state management
- Better SEO for public pages

**Trade-off**: Learning curve for team, but modern Next.js pattern.

### 3. Server Actions for Mutations

**Decision**: Use Server Actions for form submissions and data mutations.

**Rationale**:
- Progressive enhancement
- Type-safe end-to-end
- Integrated with Next.js caching
- Simpler than separate API routes for forms

**Trade-off**: Less control than API routes, but sufficient for forms.

### 4. Zod for Validation

**Decision**: Use Zod schemas as single source of truth for validation.

**Rationale**:
- Runtime validation
- TypeScript type inference
- Client and server validation from same schema
- Excellent error messages

**Trade-off**: None significant.

### 5. State Machine for Workflow

**Decision**: Implement workflow as state machine with defined transitions.

**Rationale**:
- Prevents invalid state changes
- Clear business rules
- Auditable transitions
- Extensible for future states

**Trade-off**: More complex than simple status field, but necessary for data integrity.

### 6. Embedded Documents in MongoDB

**Decision**: Embed frequently accessed data (student info, status info) in demande documents.

**Rationale**:
- Single query for 95% of use cases
- Faster list rendering
- Simpler application code
- Natural data model for NoSQL

**Trade-off**: Data duplication, update propagation needed.

### 7. Role-Based Access Control

**Decision**: Three roles: STUDENT, ADMIN, SUPER_ADMIN with route groups.

**Rationale**:
- Simple but sufficient
- Clear separation of interfaces
- Extensible for future roles
- Middleware-based enforcement

**Trade-off**: Not as granular as permission-based, but adequate.

## User Flows

### Student Submission Flow

```
1. Student logs in
2. Navigates to "New Request"
3. Selects request type (dropdown)
4. Fills in form (objet, description)
5. Uploads supporting documents
6. Reviews and submits
7. Sees confirmation with request number
8. Receives confirmation email
9. Request auto-transitions: SOUMIS → RECU
```

### Admin Processing Flow

```
1. Admin logs in to admin dashboard
2. Sees pending requests queue
3. Clicks on request to view details
4. Reviews documents and information
5. Assigns request to self (EN_COURS status)
6. Validates or rejects:
   - Validates: Status → VALIDE → TRAITE (auto)
   - Rejects: Status → REJETE (requires motif)
7. Student receives email notification
8. Request appears in admin history
```

### Student Tracking Flow

```
1. Student navigates to "My Requests"
2. Sees list of all requests with status badges
3. Filters by status (optional)
4. Clicks on request for details
5. Sees status history timeline
6. Downloads submitted documents
7. Sees processing comments (if any)
```

## Success Criteria

### Functional Requirements
- ✅ Students can submit requests with documents
- ✅ Requests follow defined workflow states
- ✅ Admins can process and update request status
- ✅ Email notifications sent on status changes
- ✅ Complete audit trail in historique
- ✅ Students can track request progress

### Non-Functional Requirements
- ✅ Page load < 2 seconds
- ✅ Form submission < 3 seconds
- ✅ File upload < 5 seconds (5MB limit)
- ✅ Mobile responsive (Tailwind)
- ✅ Accessible (WCAG 2.1 AA)
- ✅ French terminology throughout

### Data Requirements
- ✅ MongoDB indexes for performance
- ✅ Automatic timestamps on all documents
- ✅ Soft deletes (actif field)
- ✅ Unique request numbers (DEM-YYYY-NNNNNN)
- ✅ Reference integrity maintained

## Technical Constraints

1. **Stack Locked**: Next.js 15 + MongoDB + TypeScript (per project requirements)
2. **French Domain**: All entity names, fields, and UI in French
3. **No Authentication System**: Use Next-Auth or similar (not in this spec)
4. **MongoDB Atlas**: Free tier (512 MB) sufficient for PoC
5. **Cloudinary**: For file storage (free tier)
6. **Development Environment**: Local MongoDB for dev, Atlas for staging/prod

## Dependencies

### External Systems
- MongoDB Atlas (database)
- Cloudinary (file storage)
- SMTP service (email notifications)
- Next-Auth (authentication) - assumed available

### Internal Dependencies
- Authentication system must be implemented first
- User roles must be assigned
- Email service must be configured

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| MongoDB free tier limits | Medium | Monitor usage, implement pagination |
| File upload failures | High | Retry logic, progress indicators |
| Email delivery failures | Medium | Queue system with retry (BullMQ) |
| State machine complexity | Medium | Comprehensive tests, clear documentation |
| Concurrent updates | Medium | Optimistic locking with version field |
| Performance at scale | Low | Proper indexes, query optimization |

## Future Enhancements (Not Now)

- Advanced analytics dashboard
- Document generation (PDF attestations)
- SMS notifications
- Multi-language support
- Advanced search with Elasticsearch
- Real-time updates with WebSockets
- Mobile app
- Integration with university information system
- Batch import of students
- Calendar integration for deadlines

## Open Questions

1. **Authentication**: Which authentication provider to use? (Next-Auth, Clerk, Auth0)
2. **Email Service**: Which SMTP provider? (SendGrid, Mailgun, AWS SES)
3. **Deployment**: Where to deploy? (Vercel, Railway, DigitalOcean)
4. **Monitoring**: Which monitoring tool? (Sentry, LogRocket)

## Notes

- This is a Proof of Concept / Academic project demonstrating professional execution
- Focus on clean code and modern patterns over extensive features
- Must demonstrate understanding of state machines, NoSQL, and modern React
- French terminology is essential for authentic domain modeling
