# Yassine - Academic Request Management System

A comprehensive Next.js 15 application for managing academic administrative requests (demandes) with workflow automation, role-based access control, and email notifications.

## 🚀 Features

### Authentication & Authorization
- **NextAuth.js** with credentials provider
- Role-based access control (STUDENT, ADMIN, SUPER_ADMIN)
- Protected routes with middleware
- Session-based authentication with JWT

### Request Management
- Create, read, update, delete (CRUD) operations for academic requests
- 5 types of requests:
  - Attestation de scolarité (3 days)
  - Relevé de notes (5 days)
  - Attestation de réussite (7 days)
  - Duplicata de carte étudiant (10 days)
  - Convention de stage (5 days)
- Auto-generated request numbers (format: DEM-2026-000001)
- Priority levels: BASSE, NORMALE, HAUTE, URGENTE

### Workflow State Machine
- 8-status workflow with automatic transitions
- Status flow: SOUMIS → RECU → EN_COURS → ATTENTE_INFO → VALIDE → REJETE/TRAITE → ARCHIVE
- Role-based permissions for status transitions
- Automatic email notifications on status changes

### Email Notifications
- Resend integration for email delivery
- 6 French email templates with professional styling
- Automatic tracking in notifications table
- Retry mechanism for failed emails

### Admin Features
- Comprehensive dashboard with statistics
- Full CRUD operations on requests
- Status modification with validation
- Request filtering and search
- Complete audit trail (historique)

### Student Features
- Request submission form with validation
- Request tracking with status badges
- Complete request history
- Email notifications

## 🛠 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose
- **Authentication**: NextAuth.js
- **Email**: Resend API
- **UI Components**: shadcn/ui + Radix UI
- **Styling**: Tailwind CSS
- **Validation**: Zod
- **Forms**: React Hook Form

## 📁 Project Structure

```
yassine/
├── app/
│   ├── (admin)/              # Admin layout group
│   │   └── admin/
│   │       ├── dashboard/    # Admin dashboard
│   │       └── demandes/     # Admin request management
│   ├── (student)/            # Student layout group
│   │   └── demandes/         # Student request interface
│   ├── api/                  # API routes
│   │   ├── auth/            # NextAuth endpoints
│   │   └── demandes/        # Request API endpoints
│   ├── auth/                # Authentication pages
│   └── actions/             # Server actions
├── components/
│   ├── admin/               # Admin components
│   ├── demandes/            # Request components
│   └── ui/                  # Reusable UI components
├── lib/
│   ├── auth/                # Authentication configuration
│   ├── db/
│   │   └── models/          # Mongoose models
│   ├── email/               # Email service & templates
│   ├── validators/          # Zod schemas
│   └── workflow/            # State machine logic
└── types/                   # TypeScript type definitions
```

## 🔧 Setup & Installation

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- Resend API account

### Environment Variables

Create a `.env.local` file:

```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/yassine?retryWrites=true&w=majority

# Email
RESEND_API_KEY=re_your_api_key_here
EMAIL_FROM=noreply@yourdomain.com

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-generate-with-openssl-rand-base64-32
```

### Installation Steps

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Seed the database** (run locally, not on Vercel):
   ```bash
   npx tsx scripts/seed-data.ts
   ```

3. **Run development server**:
   ```bash
   npm run dev
   ```

4. **Build for production**:
   ```bash
   npm run build
   ```

## 👤 Test Accounts

### Admin
- **Email**: `admin@university.edu`
- **Password**: `Admin123!`
- **Access**: Full admin dashboard, CRUD operations

### Student
- **Email**: `adnane.saber@university.edu`
- **Password**: Any password (no validation for students in test mode)
- **Access**: Create and track requests

## 📖 User Guide

See [USER_GUIDE.md](./USER_GUIDE.md) for detailed user journeys and workflows for both students and administrators.

## 🔄 Workflow States

| Status | Description | Next Status |
|--------|-------------|-------------|
| SOUMIS | Just submitted | RECU (automatic) |
| RECU | Received by admin | EN_COURS, REJETE |
| EN_COURS | Being processed | ATTENTE_INFO, VALIDE, REJETE |
| ATTENTE_INFO | Awaiting information | EN_COURS, REJETE |
| VALIDE | Approved | TRAITE (automatic after 100ms) |
| REJETE | Rejected | ARCHIVE |
| TRAITE | Completed | ARCHIVE |
| ARCHIVE | Archived | Terminal state |

## 🐛 Known Issues & Fixes

### Fixed in Latest Version
✅ Next.js 15 async params compatibility
✅ ESLint configuration for flat config
✅ SYSTEM user ObjectId cast error
✅ useSearchParams Suspense boundary
✅ Date serialization in Server Components
✅ NextAuth configuration errors

### Current Limitations
- Student password validation not implemented (accepts any password)
- Document upload functionality placeholder
- Email delivery depends on Resend API availability

## 📦 Deployment

### Vercel Deployment

1. **Set environment variables** in Vercel dashboard
2. **Configure build settings**:
   - Build Command: `npm run build`
   - Output Directory: `.next`
3. **Deploy**: Push to GitHub, Vercel auto-deploys

### Important Notes
- ESLint warnings are ignored in production builds
- TypeScript strict mode enabled
- MongoDB connection pooling configured for serverless

## 🧪 Testing

Run CRUD tests locally:
```bash
npx tsx scripts/test-crud.ts
```

## 📝 Database Models

- **Demande**: Request records with workflow state
- **Etudiant**: Student profiles
- **Utilisateur**: Admin/staff users
- **Historique**: Audit trail for all changes
- **Notification**: Email delivery tracking

## 🔐 Security

- Password hashing with bcryptjs (10 rounds)
- JWT-based session management
- Role-based access control
- Protected API routes
- Input validation with Zod
- SQL injection prevention (MongoDB)

## 📊 API Endpoints

### Public Routes
- `POST /api/auth/signin` - User login
- `GET /api/auth/signout` - User logout

### Protected Routes (Authenticated)
- `GET /api/demandes` - List requests (filtered by user)
- `POST /api/demandes` - Create request (students only)
- `GET /api/demandes/[id]` - Get request details
- `PATCH /api/demandes/[id]` - Update request
- `DELETE /api/demandes/[id]` - Soft delete request
- `POST /api/demandes/[id]/transition` - Change status (admins only)

## 🌐 Internationalization

All UI text is in French (fr-FR):
- French date formatting
- French validation messages
- French email templates
- French domain terminology

## 📄 License

This project is private and proprietary.

## 👨‍💻 Development

### Branch Structure
- `claude/dev-FhYuV` - Main development branch (current)

### Commit Convention
- `Fix:` - Bug fixes
- `Add:` - New features
- `Update:` - Updates to existing features
- `Remove:` - Removed code/features

## 🆘 Support

For issues or questions:
1. Check [USER_GUIDE.md](./USER_GUIDE.md)
2. Check [CRUD_FIXES.md](./CRUD_FIXES.md) for common issues
3. Review deployment logs with `node get-latest-deployment-logs.js`

---

**Built with** ❤️ **using Next.js 15, TypeScript, and MongoDB**
