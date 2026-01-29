# Core Request Management System - Tasks

## Progress Tracker

**Overall Progress:** 1/7 tasks completed (14%)
**Estimated Timeline:** 5-7 days
**Current Status:** Database Models phase

```
✅ Task 1: Save Spec Documentation (COMPLETED)
⏳ Task 2: Database Models and Schemas (IN PROGRESS)
⬜ Task 3: State Machine and Workflow Engine
⬜ Task 4: API Endpoints and Server Actions
⬜ Task 5: Student Interface Components
⬜ Task 6: Admin Interface Components
⬜ Task 7: Form Validation and Error Handling
```

---

## Task Overview

| Task # | Title | Duration | Status | Dependencies |
|--------|-------|----------|--------|--------------|
| 1 | Save Spec Documentation | 30 min | ✅ Completed | None |
| 2 | Database Models and Schemas | 1.5 days | Pending | None |
| 3 | State Machine and Workflow Engine | 1 day | Pending | Task 2 |
| 4 | API Endpoints and Server Actions | 1.5 days | Pending | Task 2, 3 |
| 5 | Student Interface Components | 1.5 days | Pending | Task 4 |
| 6 | Admin Interface Components | 1 day | Pending | Task 4, 5 |
| 7 | Form Validation and Error Handling | 0.5 days | Pending | Task 4, 5, 6 |

---

## Task 1: Save Spec Documentation ✅

**Status:** COMPLETED
**Duration:** 30 minutes
**Priority:** Critical
**Dependencies:** None

### Description
Save all specification documentation to establish the single source of truth for implementation.

### Subtasks
- [x] Create spec directory: `agent-os/specs/2026-01-28-1630-core-request-management/`
- [x] Create `shape.md` - Feature scope and decisions
- [x] Create `standards.md` - Applicable standards reference
- [x] Create `references.md` - Code patterns and examples
- [x] Create `plan.md` - Implementation plan

### Acceptance Criteria
- [x] All spec files created and committed
- [x] Spec documents follow standard format
- [x] Cross-references between documents are accurate
- [x] Plan is actionable and detailed

---

## Task 2: Database Models and Schemas

**Status:** Pending
**Duration:** 1.5 days
**Priority:** Critical
**Dependencies:** None

### Description
Implement all MongoDB schemas with Mongoose following Agent OS database standards. This includes models for Demande, Etudiant, Historique, Utilisateur, and Notification.

### Subtasks
- [ ] 2.1: Setup database connection (`lib/db/mongodb.ts`)
- [ ] 2.2: Create type definitions (`types/database.ts`)
- [ ] 2.3: Implement Etudiant model (`lib/db/models/etudiant.ts`)
- [ ] 2.4: Implement Demande model (`lib/db/models/demande.ts`)
- [ ] 2.5: Implement Historique model (`lib/db/models/historique.ts`)
- [ ] 2.6: Implement Utilisateur model (`lib/db/models/utilisateur.ts`)
- [ ] 2.7: Implement Notification model (`lib/db/models/notification.ts`)
- [ ] 2.8: Create seed data script (`scripts/seed-data.ts`)

### Acceptance Criteria
- [ ] Connection pooling works correctly with hot reload support
- [ ] All types use proper naming conventions (no accents in code)
- [ ] Enum types use UPPER_SNAKE_CASE
- [ ] Schema validation rules enforced at database level
- [ ] Indexes created for common query patterns
- [ ] Auto-generated numeroDemande with format DEM-YYYY-NNNNNN
- [ ] Password hashing with bcrypt for Utilisateur
- [ ] Pre-save hooks execute correctly
- [ ] Seed script runs without errors and creates sample data
- [ ] All models export correctly
- [ ] Timestamps are auto-generated

### Dependencies
None

---

## Task 3: State Machine and Workflow Engine

**Status:** Pending
**Duration:** 1 day
**Priority:** Critical
**Dependencies:** Task 2 (Database Models)

### Description
Implement the workflow state machine that manages request status transitions, validates business rules, and triggers side effects.

### Subtasks
- [ ] 3.1: Create workflow constants (`lib/workflow/constants.ts`)
  - Status metadata for all 8 states
  - Transition map defining allowed state changes
  - Permission map for role-based transitions
  - Transition requirements (required fields per status)
- [ ] 3.2: Implement workflow class (`lib/workflow/state-machine.ts`)
  - DemandeWorkflow class with transition method
  - Permission validation
  - Pre-transition validation
  - Post-transition side effects
  - History logging
  - Notification queueing
  - WorkflowError custom error class
- [ ] 3.3: Create workflow utility functions (`lib/workflow/utils.ts`)
  - getAvailableTransitions
  - canUserTransition
  - validateTransitionContext

### Acceptance Criteria
- [ ] All 8 status values defined with metadata (SOUMIS, RECU, EN_COURS, ATTENTE_INFO, VALIDE, REJETE, TRAITE, ARCHIVE)
- [ ] Transition map complete and accurate
- [ ] Permission map covers all transitions
- [ ] Can transition through valid paths only
- [ ] Invalid transitions are rejected with clear error messages
- [ ] Permission validation works for all roles
- [ ] Required fields are enforced (motifRefus for REJETE, commentaireAdmin for ATTENTE_INFO)
- [ ] History is created for each transition
- [ ] Notifications are queued for status changes
- [ ] Auto-transitions execute correctly (VALIDE → TRAITE)
- [ ] Terminal states are protected from modification
- [ ] Helper functions work correctly

### Dependencies
- Task 2: Database Models

---

## Task 4: API Endpoints and Server Actions

**Status:** Pending
**Duration:** 1.5 days
**Priority:** High
**Dependencies:** Task 2, Task 3

### Description
Implement RESTful API routes and Server Actions for demande CRUD operations, file uploads, and workflow transitions.

### Subtasks
- [ ] 4.1: Create validation schemas (`lib/validators/demande.ts`)
  - Query validation with pagination
  - Create demande validation
  - Update demande validation
  - Transition validation
  - File upload validation
- [ ] 4.2: Create API error handler (`lib/api/error-handler.ts`)
  - Handle Zod validation errors
  - Handle workflow errors
  - Handle Mongoose duplicate key errors
  - Handle generic server errors
- [ ] 4.3: Implement demandes list API (`app/api/demandes/route.ts`)
  - GET: List with filtering and pagination
  - POST: Create new demande with auto-transition
- [ ] 4.4: Implement single demande API (`app/api/demandes/[id]/route.ts`)
  - GET: Fetch single demande
  - PATCH: Update demande
  - DELETE: Soft delete demande
- [ ] 4.5: Implement workflow transition API (`app/api/demandes/[id]/transition/route.ts`)
  - POST: Execute status transition
- [ ] 4.6: Implement server actions (`app/actions/demandes.ts`)
  - createDemandeAction
  - updateStatutAction
  - Cache revalidation

### Acceptance Criteria
- [ ] All schemas use French error messages
- [ ] Validation rules match business requirements
- [ ] Types inferred from Zod schemas
- [ ] Error handling comprehensive with proper HTTP status codes
- [ ] GET /api/demandes returns paginated list
- [ ] POST /api/demandes creates demande with auto-transition to RECU
- [ ] Filtering works correctly (status, priority, type)
- [ ] Sorting works correctly
- [ ] Search across multiple fields (numeroDemande, objet, student name)
- [ ] GET /api/demandes/[id] returns full demande details
- [ ] PATCH /api/demandes/[id] updates allowed fields only
- [ ] DELETE performs soft delete
- [ ] POST /api/demandes/[id]/transition executes workflow transition
- [ ] 404 errors handled properly
- [ ] Workflow errors handled properly
- [ ] Server Actions properly marked with 'use server'
- [ ] Form data parsing and validation works
- [ ] Cache revalidation triggers on mutations
- [ ] Return discriminated union types from Server Actions

### Dependencies
- Task 2: Database Models
- Task 3: State Machine and Workflow Engine

---

## Task 5: Student Interface Components

**Status:** Pending
**Duration:** 1.5 days
**Priority:** High
**Dependencies:** Task 4

### Description
Build the student-facing interface components for viewing, creating, and tracking demandes.

### Subtasks
- [ ] 5.1: Create UI primitive components (`components/ui/*`)
  - button.tsx
  - badge.tsx
  - input.tsx
  - textarea.tsx
  - select.tsx
  - card.tsx
  - table.tsx
- [ ] 5.2: Create demande card component (`components/demandes/demande-card.tsx`)
  - Display key demande information
  - Status badge with color
  - Click handler for navigation
- [ ] 5.3: Create demande list component (`components/demandes/demande-list.tsx`)
  - Grid layout
  - Status filter dropdown
  - Empty state
- [ ] 5.4: Create demande form component (`components/demandes/demande-form.tsx`)
  - Type selection
  - Objet and description inputs
  - Priority selection
  - Form validation with react-hook-form
  - Error display
  - Loading states
- [ ] 5.5: Create demande detail component (`components/demandes/demande-detail.tsx`)
  - Display all demande details
  - Documents section with download links
  - Admin comments section
  - Rejection reasons section

### Acceptance Criteria
- [ ] All primitives use Tailwind for styling
- [ ] TypeScript prop interfaces defined
- [ ] Accessible (keyboard navigation, ARIA)
- [ ] Variants for different states
- [ ] Composable and reusable components
- [ ] Status badges display correct colors
- [ ] Form validation works correctly
- [ ] Error messages displayed inline
- [ ] Loading state handled
- [ ] Success redirects to list
- [ ] Cancel button navigates back
- [ ] Responsive design on mobile devices
- [ ] Line clamp for long descriptions
- [ ] Empty state handled gracefully
- [ ] Navigation between pages works
- [ ] Documents are downloadable

### Dependencies
- Task 4: API Endpoints and Server Actions

---

## Task 6: Admin Interface Components

**Status:** Pending
**Duration:** 1 day
**Priority:** High
**Dependencies:** Task 4, Task 5

### Description
Build admin-facing interface for processing demandes, changing status, and viewing analytics.

### Subtasks
- [ ] 6.1: Create admin dashboard component (`components/admin/dashboard.tsx`)
  - Display key metrics (total, en cours, traités, rejetés)
  - Responsive grid layout
  - Color-coded stats
- [ ] 6.2: Create status modifier component (`components/admin/status-modifier.tsx`)
  - Modal interface
  - Shows only allowed status transitions based on user role
  - Requires motifRefus for REJETE status
  - Optional commentaire field
  - Form validation
  - Success callback
- [ ] 6.3: Create admin demande table (`components/admin/demande-table.tsx`)
  - Table display with all key fields
  - Status modification button
  - View detail navigation
  - Refresh on status change

### Acceptance Criteria
- [ ] Admin dashboard loads correctly with real-time data
- [ ] Status modification modal works
- [ ] Only allowed transitions shown based on workflow rules
- [ ] Required fields enforced (motifRefus for rejection)
- [ ] Table displays all demandes
- [ ] Table is responsive
- [ ] Filtering works
- [ ] Permission checks enforce role-based access
- [ ] Success callback triggers page refresh
- [ ] Modal closes on success

### Dependencies
- Task 4: API Endpoints and Server Actions
- Task 5: Student Interface Components

---

## Task 7: Form Validation and Error Handling

**Status:** Pending
**Duration:** 0.5 days
**Priority:** Medium
**Dependencies:** Task 4, Task 5, Task 6

### Description
Implement comprehensive client-side and server-side validation with proper error handling and user feedback.

### Subtasks
- [ ] 7.1: Enhance Zod schemas with custom French error messages
- [ ] 7.2: Create error display component (`components/ui/error-display.tsx`)
  - Display single or multiple errors
  - Icon and styling
  - Accessible
- [ ] 7.3: Create success toast component (`components/ui/toast.tsx`)
  - Implement with react-hot-toast or Sonner
  - Success and error variants
- [ ] 7.4: Add form field error display to all forms
  - Inline validation errors
  - Clear error states on input change

### Acceptance Criteria
- [ ] All validation errors display correctly
- [ ] French error messages are accurate and user-friendly
- [ ] Success toasts appear on successful actions
- [ ] Error toasts appear on failed actions
- [ ] Error states are cleared properly on retry
- [ ] Async validation works
- [ ] Field-level errors display inline
- [ ] Form-level errors display at top
- [ ] Accessible error announcements

### Dependencies
- Task 4: API Endpoints and Server Actions
- Task 5: Student Interface Components
- Task 6: Admin Interface Components

---

## Post-Implementation Checklist

### Code Quality
- [ ] All files follow naming conventions
- [ ] TypeScript strict mode enabled
- [ ] No console errors in browser
- [ ] ESLint passes with no warnings
- [ ] Code formatted with Prettier

### Functionality
- [ ] Students can create demandes
- [ ] Status transitions work correctly
- [ ] Admin can process demandes
- [ ] Email notifications queued
- [ ] History tracked for all changes

### Performance
- [ ] Page load times < 2 seconds
- [ ] API responses < 500ms
- [ ] Database indexes created
- [ ] No N+1 queries

### Security
- [ ] Authentication required for all routes
- [ ] Authorization checks in place
- [ ] Input validation on client and server
- [ ] SQL injection prevented (MongoDB)
- [ ] XSS protection enabled

### Documentation
- [ ] README updated
- [ ] API endpoints documented
- [ ] Component props documented
- [ ] Deployment instructions added

---

## Future Enhancements

- Email notification processing worker
- File upload with Cloudinary integration
- Advanced analytics dashboard
- Bulk operations for admin
- Export to PDF/Excel
- Real-time updates with WebSockets
- Mobile responsiveness improvements
- Accessibility audit and fixes
- Performance optimization
- Integration tests
- E2E tests with Playwright
