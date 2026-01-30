# Project Overview - Student Request Management System

## What is this project?

This is a web application that helps universities manage student requests (like transcripts, enrollment certificates, etc.). Think of it as a ticket system for academic services.

## Main Features

### 1. **Student Portal**
- Students can create new requests (demandes)
- View all their submitted requests
- Track request status in real-time
- Receive email notifications when status changes

### 2. **Admin Dashboard**
- View all student requests in one place
- Filter requests by status, priority, or type
- Change request status (from submitted → in progress → completed)
- Send email notifications to students
- Edit or delete requests

### 3. **Workflow System (8 Status States)**
The system automatically manages requests through these stages:
1. **SOUMIS** - Request submitted by student
2. **RECU** - Request received by admin
3. **EN_COURS** - Being processed
4. **ATTENTE_INFO** - Waiting for more information from student
5. **VALIDE** - Approved
6. **REJETE** - Rejected
7. **TRAITE** - Completed
8. **ARCHIVE** - Archived

### 4. **Email Notifications**
- Automatic emails when status changes
- Admins can manually send status update emails
- All emails are tracked in the database

### 5. **Authentication**
- Secure login system for students and admins
- Different interfaces based on user role
- Sign out functionality on all pages

## How It Works (Simple Explanation)

### For Students:
1. Log in to your account
2. Click "Nouvelle demande" (New request)
3. Fill in the form (what you need, description, upload documents)
4. Submit and receive a tracking number
5. Check back anytime to see your request status
6. Get email updates automatically

### For Admins:
1. Log in to admin portal
2. See all student requests on the dashboard
3. Click on a request to see details
4. Change status as you process it
5. Send email updates to students
6. Mark as complete when done

## Technical Stack

- **Frontend**: Next.js 15 (React framework)
- **Backend**: Next.js API routes
- **Database**: MongoDB Atlas (cloud database)
- **Authentication**: NextAuth.js
- **Email**: Resend API
- **Styling**: Tailwind CSS + shadcn/ui components

## Key Files Explained

### Student Interface
- `/app/(student)/demandes/page.tsx` - List of student's requests
- `/app/(student)/demandes/new/page.tsx` - Create new request form
- `/app/(student)/demandes/[id]/page.tsx` - View single request details

### Admin Interface
- `/app/(admin)/admin/dashboard/page.tsx` - Admin overview
- `/app/(admin)/admin/demandes/page.tsx` - All requests list
- `/app/(admin)/admin/demandes/[id]/page.tsx` - Request details & actions

### Backend Logic
- `/lib/workflow/state-machine.ts` - Handles status transitions
- `/lib/email/` - Email sending functionality
- `/lib/db/models/` - Database schemas (Demande, Historique, etc.)

### API Endpoints
- `/api/demandes/` - CRUD operations for requests
- `/api/demandes/[id]/transition/` - Change request status
- `/api/demandes/[id]/send-email/` - Send email to student

## Request Types

The system supports 5 types of requests:
1. **ATTESTATION_SCOLARITE** - Enrollment certificate
2. **RELEVE_NOTES** - Transcript
3. **ATTESTATION_REUSSITE** - Certificate of completion
4. **DUPLICATA_CARTE** - Student ID card replacement
5. **CONVENTION_STAGE** - Internship agreement

## Priority Levels

- **BASSE** (Low) - Regular requests
- **NORMALE** (Normal) - Default priority
- **HAUTE** (High) - Important requests
- **URGENTE** (Urgent) - Need immediate attention

## Email System

When an admin changes a request status, the system:
1. Saves the history in database
2. Generates an email from template
3. Sends email to student via Resend API
4. Tracks email delivery status

Admins can also manually send emails using the "Envoyer email" button.

## Authentication System

- Uses NextAuth.js for secure authentication
- Credentials provider (email + password)
- Session-based authentication
- Protected routes for student and admin areas
- Role-based access control (STUDENT, ADMIN, RESPONSABLE)

## Database Structure

### Main Collections:
- **demandes** - Student requests
- **historique** - History of all status changes
- **notifications** - Email tracking
- **utilisateurs** - User accounts (admins, staff)
- **etudiants** - Student information

## Recent Fixes

1. Fixed Next.js 15 async params compatibility
2. Fixed date serialization between server and client components
3. Fixed authentication redirect issues
4. Added sign out button to all layouts
5. Fixed admin query to show all demands
6. Added quick email action buttons

## Environment Variables Needed

```env
# Database
MONGODB_URI=your_mongodb_connection_string

# NextAuth
NEXTAUTH_SECRET=your_secret_key
NEXTAUTH_URL=http://localhost:3000

# Email
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=noreply@universite.tn
```

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Deployment

The project is deployed on Vercel. Push to the `claude/dev-FhYuV` branch to trigger automatic deployment.

## Future Enhancements (Ideas)

- File upload for supporting documents
- Real-time notifications (WebSocket)
- Print/PDF generation for certificates
- Statistics dashboard for admins
- Mobile app version
- Multi-language support (French/Arabic)

---

**That's it!** This is a simple but complete request management system. Students submit requests, admins process them, and everyone gets notified by email. 🎓
