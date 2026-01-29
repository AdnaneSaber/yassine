# Supporting Systems - Implementation Tasks

## Progress Tracker

**Total Estimated Time:** 11-14 days
**Priority:** High
**Overall Status:** Not Started

| Metric | Count |
|--------|-------|
| Total Tasks | 7 |
| Completed | 0 |
| In Progress | 0 |
| Pending | 7 |
| Progress | 0% |

---

## Task Overview

| Task # | Title | Duration | Status | Dependencies |
|--------|-------|----------|--------|--------------|
| 1 | Project Setup and Spec Documentation | 0.5 days | ⏳ Pending | None |
| 2 | Email Service with Queue | 2-3 days | ⏳ Pending | Task 1 |
| 3 | Document Upload and Storage Service | 2 days | ⏳ Pending | Task 1 |
| 4 | Background Job Workers | 2 days | ⏳ Pending | Task 2, Task 3 |
| 5 | Analytics Service and Metrics Calculation | 2-3 days | ⏳ Pending | Task 1 |
| 6 | Admin Dashboard for Reporting | 2-3 days | ⏳ Pending | Task 5 |
| 7 | Integration and Testing | 2 days | ⏳ Pending | All previous tasks |

---

## Task 1: Project Setup and Spec Documentation

**Duration:** 0.5 days
**Priority:** High
**Dependencies:** None
**Status:** ⏳ Pending

### Description
Set up the foundational project structure, install required dependencies, and create core type definitions and validation schemas for the supporting systems.

### Subtasks
- [ ] Install email service dependencies (resend, react-email, nodemailer)
- [ ] Install file upload dependencies (cloudinary)
- [ ] Install validation dependencies (zod)
- [ ] Configure environment variables (.env.local)
- [ ] Create TypeScript type definitions (notification.ts, document.ts, analytics.ts)
- [ ] Create validation schemas (upload.ts, notification.ts, analytics.ts)

### Acceptance Criteria
- All dependencies installed successfully
- Environment variables documented in .env.local
- Type definitions created in types/ directory
- Validation schemas defined in lib/validators/
- Project structure matches standards
- No TypeScript compilation errors

---

## Task 2: Email Service with Queue

**Duration:** 2-3 days
**Priority:** High
**Dependencies:** Task 1
**Status:** ⏳ Pending

### Description
Implement a complete email notification system using Resend or Nodemailer, with React Email templates and a database-backed queue system with retry logic.

### Subtasks
- [ ] Configure email client (Resend/Nodemailer) in lib/email/client.ts
- [ ] Create email template: demande-recue.tsx (confirmation)
- [ ] Create email template: demande-validee.tsx (approval)
- [ ] Create email template: demande-rejetee.tsx (rejection)
- [ ] Create email template: changement-statut.tsx (status change)
- [ ] Implement email sending service in lib/email/send.ts
- [ ] Create Notification database model in lib/db/models/notification.ts
- [ ] Implement notification creation service in lib/notifications/create.ts
- [ ] Implement notification sending service in lib/notifications/send.ts
- [ ] Test email delivery with sample data

### Acceptance Criteria
- Email client configured with API keys
- All 4 email templates created and rendering correctly
- Notification model defined with proper indexes
- Notification creation service working
- Email sending service functional
- Test emails sent successfully to real addresses
- Retry logic implemented for failed sends

---

## Task 3: Document Upload and Storage Service

**Duration:** 2 days
**Priority:** High
**Dependencies:** Task 1
**Status:** ⏳ Pending

### Description
Integrate Cloudinary for secure file storage and create API endpoints for document upload with validation, supporting PDFs, images, and Office documents.

### Subtasks
- [ ] Configure Cloudinary client in lib/upload/cloudinary.ts
- [ ] Implement upload service in lib/upload/upload-service.ts
- [ ] Create upload API endpoint at app/api/upload/route.ts
- [ ] Update Demande model to include documents field
- [ ] Create server action for upload in app/actions/upload.ts
- [ ] Implement file validation (type, size limits)
- [ ] Test file upload to Cloudinary
- [ ] Verify document metadata storage in database

### Acceptance Criteria
- Cloudinary integration configured with credentials
- Upload API endpoint functional and validated
- File validation working (5MB max, accepted types only)
- Documents successfully stored in Cloudinary
- Document metadata saved in Demande model
- Upload errors handled gracefully with proper error codes
- Files accessible via secure URLs

---

## Task 4: Background Job Workers

**Duration:** 2 days
**Priority:** Medium
**Dependencies:** Task 2, Task 3
**Status:** ⏳ Pending

### Description
Set up Vercel Cron jobs for automated email queue processing, auto-archiving old requests, cleanup of stale data, and metrics calculation.

### Subtasks
- [ ] Create vercel.json with cron job configuration
- [ ] Implement send-notifications cron job (every 5 minutes)
- [ ] Implement auto-archive cron job (daily at 2 AM)
- [ ] Implement cleanup cron job (weekly Sunday at 4 AM)
- [ ] Implement calculate-metrics cron job (daily at 3 AM)
- [ ] Add cron secret authentication to all jobs
- [ ] Test cron jobs locally
- [ ] Verify cron jobs in Vercel dashboard

### Acceptance Criteria
- Vercel cron jobs configured in vercel.json
- Email queue processor running every 5 minutes
- Auto-archive job running daily (archives TRAITE demandes > 6 months)
- Cleanup job running weekly (deletes notifications > 90 days)
- Metrics calculation job running daily
- All jobs have proper error handling and logging
- Job execution tracked and logged

---

## Task 5: Analytics Service and Metrics Calculation

**Duration:** 2-3 days
**Priority:** Medium
**Dependencies:** Task 1
**Status:** ⏳ Pending

### Description
Build analytics calculation service using MongoDB aggregation pipelines to provide real-time metrics on volume, performance, and quality, with export capabilities.

### Subtasks
- [ ] Create analytics calculation service in lib/analytics/calculate.ts
- [ ] Implement volume metrics aggregation
- [ ] Implement performance metrics aggregation
- [ ] Implement quality metrics aggregation
- [ ] Create dashboard API endpoint at app/api/analytics/dashboard/route.ts
- [ ] Create trends API endpoint at app/api/analytics/trends/route.ts
- [ ] Create export API endpoint at app/api/analytics/export/route.ts
- [ ] Implement CSV export functionality
- [ ] Create AnalyticsSnapshot model for daily metrics storage
- [ ] Add database indexes for query optimization

### Acceptance Criteria
- Analytics service calculates all metrics correctly
- Dashboard API returns real-time metrics
- Trends API shows historical data with period filtering
- Export API generates valid CSV files
- Daily metrics snapshots stored successfully
- Queries optimized with proper indexes
- API response time < 500ms

---

## Task 6: Admin Dashboard for Reporting

**Duration:** 2-3 days
**Priority:** Medium
**Dependencies:** Task 5
**Status:** ⏳ Pending

### Description
Create an administrative analytics dashboard UI with interactive charts, metrics cards, period filtering, and export functionality.

### Subtasks
- [ ] Create analytics page at app/(admin)/admin/analytics/page.tsx
- [ ] Create DashboardMetrics component
- [ ] Create TrendsChart component with Chart.js
- [ ] Create ExportButton component
- [ ] Install chart.js dependencies
- [ ] Implement metrics cards (total, avg processing time, SLA, approval rate)
- [ ] Implement charts for demandes by type and status
- [ ] Add period filtering (7/30/90 days)
- [ ] Add loading states and error handling
- [ ] Make dashboard responsive for mobile

### Acceptance Criteria
- Analytics dashboard displays metrics correctly
- Charts render and show trends over time
- Period filtering works (7/30/90 days)
- Export button generates and downloads CSV
- Dashboard is fully responsive
- Loading states handled properly
- Error states displayed gracefully

---

## Task 7: Integration and Testing

**Duration:** 2 days
**Priority:** High
**Dependencies:** All previous tasks
**Status:** ⏳ Pending

### Description
Integrate all supporting systems with the core workflow, add notification triggers to state transitions, create end-to-end tests, and document usage.

### Subtasks
- [ ] Update workflow state-machine.ts with notification triggers
- [ ] Add notification on demande submission (SOUMIS → RECU)
- [ ] Add notification on approval (→ VALIDE)
- [ ] Add notification on rejection (→ REJETE)
- [ ] Add notification on status changes (all transitions)
- [ ] Create integration tests in __tests__/integration/
- [ ] Test notification creation flow
- [ ] Test document upload flow
- [ ] Test analytics calculation accuracy
- [ ] Test cron job execution
- [ ] Create usage documentation (docs/supporting-systems-usage.md)
- [ ] Verify all acceptance criteria from previous tasks

### Acceptance Criteria
- Workflow triggers notifications correctly on all transitions
- All integration tests passing
- Documentation complete with examples
- End-to-end flow tested successfully
- Error handling verified across all systems
- No regression in core workflow functionality

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
- [ ] CLOUDINARY_CLOUD_NAME configured
- [ ] CLOUDINARY_API_KEY configured
- [ ] CLOUDINARY_API_SECRET configured
- [ ] CRON_SECRET configured (Vercel auto-sets in production)
- [ ] NEXT_PUBLIC_APP_URL set

### Database
- [ ] Notification collection created
- [ ] Indexes added for performance
- [ ] Demande model updated with documents field
- [ ] AnalyticsSnapshot model created

### Vercel Configuration
- [ ] vercel.json with cron jobs committed
- [ ] Cron jobs visible in Vercel dashboard
- [ ] Environment variables synced to Vercel
- [ ] Production deployment successful

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

## Notes

- Tasks 2, 3, and 5 can be worked on in parallel after Task 1 is complete
- Task 4 requires both Task 2 (notifications) and Task 3 (uploads) to be complete
- Task 6 requires Task 5 (analytics API) to be complete
- Task 7 must be done last as it integrates all systems
- With multiple developers, total timeline can be reduced to 9-12 days
- Each task should be tested independently before proceeding to the next
- Document any deviations from the plan immediately
