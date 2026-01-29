# Core Request Management System - Implementation Plan

## Overview

This plan outlines the step-by-step implementation of the Core Request Management System following Agent OS standards. Each task is broken down into actionable subtasks with code examples and acceptance criteria.

**Estimated Timeline**: 5-7 days for full implementation
**Prerequisites**: Next.js 15 project initialized, MongoDB connection configured, Authentication system available

---

## Task 1: Save Spec Documentation

**Duration**: 30 minutes
**Status**: ✅ COMPLETED
**Priority**: Critical

### Description
Save all specification documentation to establish the single source of truth for implementation.

### Subtasks
1. ✅ Create spec directory: `agent-os/specs/2026-01-28-1630-core-request-management/`
2. ✅ Create `shape.md` - Feature scope and decisions
3. ✅ Create `standards.md` - Applicable standards reference
4. ✅ Create `references.md` - Code patterns and examples
5. ✅ Create `plan.md` - This implementation plan

### Acceptance Criteria
- All spec files created and committed
- Spec documents follow standard format
- Cross-references between documents are accurate
- Plan is actionable and detailed

---

## Task 2: Database Models and Schemas

**Duration**: 1.5 days
**Status**: Pending
**Priority**: Critical
**Dependencies**: None

### Description
Implement all MongoDB schemas with Mongoose following Agent OS database standards. This includes models for Demande, Etudiant, Historique, Utilisateur, and Notification.

### Subtasks

#### 2.1: Setup Database Connection
**File**: `lib/db/mongodb.ts`

```typescript
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI must be defined in environment variables');
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongoose: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log('✅ MongoDB connected successfully');
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;
```

**Acceptance Criteria**:
- Connection pooling works correctly
- Hot reload doesn't create multiple connections
- Error handling for connection failures
- Console logs connection status

#### 2.2: Create Type Definitions
**File**: `types/database.ts`

```typescript
import { Document, Types } from 'mongoose';

// Status and Priority Enums
export type DemandeStatus = 
  | 'SOUMIS' 
  | 'RECU' 
  | 'EN_COURS' 
  | 'ATTENTE_INFO' 
  | 'VALIDE' 
  | 'REJETE' 
  | 'TRAITE' 
  | 'ARCHIVE';

export type Priorite = 'BASSE' | 'NORMALE' | 'HAUTE' | 'URGENTE';

export type TypeDemandeCode =
  | 'ATTESTATION_SCOLARITE'
  | 'RELEVE_NOTES'
  | 'ATTESTATION_REUSSITE'
  | 'DUPLICATA_CARTE'
  | 'CONVENTION_STAGE';

export type UserRole = 'STUDENT' | 'ADMIN' | 'SUPER_ADMIN';

export type NiveauEtude = 'L1' | 'L2' | 'L3' | 'M1' | 'M2' | 'Doctorat';

export type TypeAction = 'CREATION' | 'CHANGEMENT_STATUT' | 'MODIFICATION' | 'COMMENTAIRE';

export type NotificationStatus = 'EN_ATTENTE' | 'ENVOYE' | 'ECHEC';

// Embedded Document Interfaces
export interface EtudiantRef {
  id: Types.ObjectId;
  nom: string;
  prenom: string;
  email: string;
  matricule: string;
}

export interface TypeDemandeInfo {
  code: TypeDemandeCode;
  nom: string;
  delaiTraitement: number;
}

export interface StatutInfo {
  code: DemandeStatus;
  libelle: string;
  couleur: string;
}

export interface DocumentInfo {
  id: string;
  nomFichier: string;
  nomOriginal: string;
  url: string;
  typeMime: string;
  taille: number;
  categorie: string;
  dateUpload: Date;
}

export interface UtilisateurInfo {
  id: Types.ObjectId;
  nom: string;
  role: UserRole;
}

export interface StatutRef {
  code: DemandeStatus;
  libelle: string;
}

// Main Document Interfaces
export interface IDemande {
  numeroDemande: string;
  etudiant: EtudiantRef;
  typeDemande: TypeDemandeInfo;
  statut: StatutInfo;
  objet: string;
  description: string;
  priorite: Priorite;
  documents: DocumentInfo[];
  commentaireAdmin?: string;
  motifRefus?: string;
  dateTraitement?: Date;
  traiteParId?: Types.ObjectId;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface IEtudiant {
  matricule: string;
  nom: string;
  prenom: string;
  email: string;
  dateNaissance?: Date;
  telephone?: string;
  adresse?: string;
  niveauEtude?: NiveauEtude;
  filiere?: string;
  actif: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IHistorique {
  demandeId: Types.ObjectId;
  numeroDemandeRef: string;
  statutAncien?: StatutRef;
  statutNouveau: StatutRef;
  utilisateur?: UtilisateurInfo;
  typeAction: TypeAction;
  commentaire?: string;
  donneesModifiees?: Record<string, any>;
  createdAt: Date;
}

export interface IUtilisateur {
  email: string;
  hashPassword: string;
  nom: string;
  prenom: string;
  role: UserRole;
  actif: boolean;
  derniereConnexion?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface INotification {
  demandeId: Types.ObjectId;
  type: 'EMAIL' | 'SMS';
  destinataire: string;
  sujet?: string;
  contenu: string;
  templateUtilise?: string;
  statutEnvoi: NotificationStatus;
  nbTentatives: number;
  dateEnvoi?: Date;
  erreur?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Mongoose Document Types
export interface IDemandeDocument extends IDemande, Document {}
export interface IEtudiantDocument extends IEtudiant, Document {}
export interface IHistoriqueDocument extends IHistorique, Document {}
export interface IUtilisateurDocument extends IUtilisateur, Document {
  comparePassword(candidatePassword: string): Promise<boolean>;
}
export interface INotificationDocument extends INotification, Document {}
```

**Acceptance Criteria**:
- All types use proper naming conventions (no accents in code)
- Enum types use UPPER_SNAKE_CASE
- Interfaces use PascalCase with I prefix for Mongoose documents
- All fields properly typed

#### 2.3: Implement Etudiant Model
**File**: `lib/db/models/etudiant.ts`

```typescript
import mongoose, { Schema } from 'mongoose';
import type { IEtudiant, IEtudiantDocument, NiveauEtude } from '@/types/database';

const etudiantSchema = new Schema<IEtudiantDocument>({
  matricule: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    maxlength: 20
  },
  nom: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  prenom: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: /^\S+@\S+\.\S+$/
  },
  dateNaissance: {
    type: Date
  },
  telephone: {
    type: String,
    trim: true
  },
  adresse: String,
  niveauEtude: {
    type: String,
    enum: ['L1', 'L2', 'L3', 'M1', 'M2', 'Doctorat']
  },
  filiere: String,
  actif: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  collection: 'etudiants'
});

// Indexes
etudiantSchema.index({ matricule: 1 });
etudiantSchema.index({ email: 1 });
etudiantSchema.index({ nom: 1, prenom: 1 });
etudiantSchema.index({ actif: 1 });

export const Etudiant = mongoose.models.Etudiant || mongoose.model<IEtudiantDocument>('Etudiant', etudiantSchema);
```

**Acceptance Criteria**:
- Schema follows MongoDB naming conventions
- All required fields marked appropriately
- Indexes created for common queries
- Validation rules enforced at schema level
- Timestamps enabled

#### 2.4: Implement Demande Model
**File**: `lib/db/models/demande.ts`

```typescript
import mongoose, { Schema } from 'mongoose';
import type { IDemande, IDemandeDocument, DemandeStatus, Priorite, TypeDemandeCode } from '@/types/database';

const demandeSchema = new Schema<IDemandeDocument>({
  numeroDemande: {
    type: String,
    required: true,
    unique: true
  },
  etudiant: {
    id: {
      type: Schema.Types.ObjectId,
      ref: 'Etudiant',
      required: true
    },
    nom: { type: String, required: true },
    prenom: { type: String, required: true },
    email: { type: String, required: true },
    matricule: { type: String, required: true }
  },
  typeDemande: {
    code: {
      type: String,
      required: true,
      enum: [
        'ATTESTATION_SCOLARITE',
        'RELEVE_NOTES',
        'ATTESTATION_REUSSITE',
        'DUPLICATA_CARTE',
        'CONVENTION_STAGE'
      ]
    },
    nom: { type: String, required: true },
    delaiTraitement: { type: Number, required: true }
  },
  statut: {
    code: {
      type: String,
      required: true,
      enum: ['SOUMIS', 'RECU', 'EN_COURS', 'ATTENTE_INFO', 'VALIDE', 'REJETE', 'TRAITE', 'ARCHIVE']
    },
    libelle: { type: String, required: true },
    couleur: { type: String }
  },
  objet: {
    type: String,
    required: true,
    maxlength: 255
  },
  description: {
    type: String,
    required: true
  },
  priorite: {
    type: String,
    enum: ['BASSE', 'NORMALE', 'HAUTE', 'URGENTE'],
    default: 'NORMALE'
  },
  documents: [{
    id: String,
    nomFichier: String,
    nomOriginal: String,
    url: String,
    typeMime: String,
    taille: Number,
    categorie: String,
    dateUpload: {
      type: Date,
      default: Date.now
    }
  }],
  commentaireAdmin: String,
  motifRefus: String,
  dateTraitement: Date,
  traiteParId: {
    type: Schema.Types.ObjectId,
    ref: 'Utilisateur'
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  collection: 'demandes'
});

// Pre-save middleware: Auto-generate numeroDemande
demandeSchema.pre('save', async function(next) {
  if (!this.numeroDemande) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments({
      numeroDemande: new RegExp(`^DEM-${year}-`)
    });
    this.numeroDemande = `DEM-${year}-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Indexes
demandeSchema.index({ numeroDemande: 1 });
demandeSchema.index({ 'etudiant.id': 1 });
demandeSchema.index({ 'statut.code': 1 });
demandeSchema.index({ 'typeDemande.code': 1 });
demandeSchema.index({ createdAt: -1 });
demandeSchema.index({ 'etudiant.id': 1, 'statut.code': 1 }); // Compound index

export const Demande = mongoose.models.Demande || mongoose.model<IDemandeDocument>('Demande', demandeSchema);
```

**Acceptance Criteria**:
- Embedded documents for etudiant, typeDemande, statut
- Auto-generated numeroDemande with format DEM-YYYY-NNNNNN
- All enum values properly defined
- Compound indexes for common queries
- Pre-save hook tested and working

#### 2.5: Implement Historique Model
**File**: `lib/db/models/historique.ts`

```typescript
import mongoose, { Schema } from 'mongoose';
import type { IHistorique, IHistoriqueDocument, TypeAction } from '@/types/database';

const historiqueSchema = new Schema<IHistoriqueDocument>({
  demandeId: {
    type: Schema.Types.ObjectId,
    ref: 'Demande',
    required: true
  },
  numeroDemandeRef: {
    type: String,
    required: true
  },
  statutAncien: {
    code: String,
    libelle: String
  },
  statutNouveau: {
    code: { type: String, required: true },
    libelle: String
  },
  utilisateur: {
    id: {
      type: Schema.Types.ObjectId,
      ref: 'Utilisateur'
    },
    nom: String,
    role: String
  },
  typeAction: {
    type: String,
    enum: ['CREATION', 'CHANGEMENT_STATUT', 'MODIFICATION', 'COMMENTAIRE'],
    default: 'CHANGEMENT_STATUT'
  },
  commentaire: String,
  donneesModifiees: Schema.Types.Mixed
}, {
  timestamps: true,
  collection: 'historique'
});

// Indexes
historiqueSchema.index({ demandeId: 1 });
historiqueSchema.index({ createdAt: -1 });
historiqueSchema.index({ 'utilisateur.id': 1 });
historiqueSchema.index({ numeroDemandeRef: 1 });

export const Historique = mongoose.models.Historique || mongoose.model<IHistoriqueDocument>('Historique', historiqueSchema);
```

**Acceptance Criteria**:
- Denormalized numeroDemandeRef for quick queries
- Captures both old and new status
- User information embedded
- Type action categorization
- Proper indexing for audit queries

#### 2.6: Implement Utilisateur Model
**File**: `lib/db/models/utilisateur.ts`

```typescript
import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import type { IUtilisateur, IUtilisateurDocument, UserRole } from '@/types/database';

const utilisateurSchema = new Schema<IUtilisateurDocument>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  hashPassword: {
    type: String,
    required: true
  },
  nom: {
    type: String,
    required: true
  },
  prenom: {
    type: String,
    required: true
  },
  role: {
    type: String,
    required: true,
    enum: ['STUDENT', 'ADMIN', 'SUPER_ADMIN']
  },
  actif: {
    type: Boolean,
    default: true
  },
  derniereConnexion: Date
}, {
  timestamps: true,
  collection: 'utilisateurs'
});

// Method: Compare password
utilisateurSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.hashPassword);
};

// Indexes
utilisateurSchema.index({ email: 1 });
utilisateurSchema.index({ role: 1 });
utilisateurSchema.index({ actif: 1 });

export const Utilisateur = mongoose.models.Utilisateur || mongoose.model<IUtilisateurDocument>('Utilisateur', utilisateurSchema);
```

**Acceptance Criteria**:
- Password hashing with bcrypt
- comparePassword method implemented
- Role-based access control fields
- Email uniqueness enforced
- Last connection tracking

#### 2.7: Implement Notification Model
**File**: `lib/db/models/notification.ts`

```typescript
import mongoose, { Schema } from 'mongoose';
import type { INotification, INotificationDocument, NotificationStatus } from '@/types/database';

const notificationSchema = new Schema<INotificationDocument>({
  demandeId: {
    type: Schema.Types.ObjectId,
    ref: 'Demande',
    required: true
  },
  type: {
    type: String,
    enum: ['EMAIL', 'SMS'],
    default: 'EMAIL'
  },
  destinataire: {
    type: String,
    required: true
  },
  sujet: String,
  contenu: {
    type: String,
    required: true
  },
  templateUtilise: String,
  statutEnvoi: {
    type: String,
    enum: ['EN_ATTENTE', 'ENVOYE', 'ECHEC'],
    default: 'EN_ATTENTE'
  },
  nbTentatives: {
    type: Number,
    default: 0
  },
  dateEnvoi: Date,
  erreur: String
}, {
  timestamps: true,
  collection: 'notifications'
});

// Indexes
notificationSchema.index({ demandeId: 1 });
notificationSchema.index({ statutEnvoi: 1 });
notificationSchema.index({ createdAt: -1 });

export const Notification = mongoose.models.Notification || mongoose.model<INotificationDocument>('Notification', notificationSchema);
```

**Acceptance Criteria**:
- Support for EMAIL and SMS types
- Retry mechanism with nbTentatives
- Error tracking
- Status tracking for delivery
- Proper indexing for queue processing

#### 2.8: Create Seed Data Script
**File**: `scripts/seed-data.ts`

```typescript
import connectDB from '@/lib/db/mongodb';
import { Etudiant, Demande, Utilisateur } from '@/lib/db/models';
import bcrypt from 'bcryptjs';

async function seedDatabase() {
  await connectDB();

  // Clear existing data (development only!)
  await Etudiant.deleteMany({});
  await Demande.deleteMany({});
  await Utilisateur.deleteMany({});

  // Create admin user
  const admin = await Utilisateur.create({
    email: 'admin@university.edu',
    hashPassword: await bcrypt.hash('Admin123!', 10),
    nom: 'Admin',
    prenom: 'System',
    role: 'SUPER_ADMIN',
    actif: true
  });

  // Create students
  const etudiants = await Etudiant.create([
    {
      matricule: '2024001',
      nom: 'SABER',
      prenom: 'Adnane',
      email: 'adnane.saber@university.edu',
      niveauEtude: 'M2',
      filiere: 'Business Intelligence & Digitalisation',
      actif: true
    },
    {
      matricule: '2024002',
      nom: 'ALAMI',
      prenom: 'Sara',
      email: 'sara.alami@university.edu',
      niveauEtude: 'M1',
      filiere: 'Data Science',
      actif: true
    }
  ]);

  // Create sample demandes
  await Demande.create([
    {
      etudiant: {
        id: etudiants[0]._id,
        nom: etudiants[0].nom,
        prenom: etudiants[0].prenom,
        email: etudiants[0].email,
        matricule: etudiants[0].matricule
      },
      typeDemande: {
        code: 'ATTESTATION_SCOLARITE',
        nom: 'Attestation de scolarité',
        delaiTraitement: 3
      },
      statut: {
        code: 'EN_COURS',
        libelle: 'En cours',
        couleur: '#F59E0B'
      },
      objet: 'Attestation pour dossier CAF',
      description: 'J\'ai besoin d\'une attestation de scolarité pour mon dossier CAF avant le 30/01/2024',
      priorite: 'NORMALE'
    }
  ]);

  console.log('✅ Database seeded successfully');
  process.exit(0);
}

seedDatabase().catch(console.error);
```

**Acceptance Criteria**:
- Creates admin user with hashed password
- Creates sample students
- Creates sample demandes
- Can be run multiple times safely
- Proper error handling

### Testing Checklist
- [ ] All models export correctly
- [ ] Schemas validate data properly
- [ ] Indexes are created on first document insert
- [ ] Pre-save hooks execute correctly
- [ ] Timestamps are auto-generated
- [ ] Seed script runs without errors
- [ ] Can query data successfully

---

## Task 3: State Machine and Workflow Engine

**Duration**: 1 day
**Status**: Pending
**Priority**: Critical
**Dependencies**: Task 2 (Database Models)

### Description
Implement the workflow state machine that manages request status transitions, validates business rules, and triggers side effects.

### Subtasks

#### 3.1: Create Workflow Constants
**File**: `lib/workflow/constants.ts`

```typescript
import type { DemandeStatus } from '@/types/database';

// Status metadata
export interface StatusMeta {
  libelle: string;
  couleur: string;
  estFinal: boolean;
  description?: string;
}

export const STATUTS_META: Record<DemandeStatus, StatusMeta> = {
  SOUMIS: {
    libelle: 'Soumis',
    couleur: '#6B7280',
    estFinal: false,
    description: 'Demande vient d\'être soumise'
  },
  RECU: {
    libelle: 'Reçu',
    couleur: '#3B82F6',
    estFinal: false,
    description: 'Demande reçue par l\'administration'
  },
  EN_COURS: {
    libelle: 'En cours',
    couleur: '#F59E0B',
    estFinal: false,
    description: 'Demande en cours de traitement'
  },
  ATTENTE_INFO: {
    libelle: 'En attente d\'information',
    couleur: '#F59E0B',
    estFinal: false,
    description: 'Information supplémentaire requise'
  },
  VALIDE: {
    libelle: 'Validé',
    couleur: '#10B981',
    estFinal: false,
    description: 'Demande validée par l\'administration'
  },
  REJETE: {
    libelle: 'Rejeté',
    couleur: '#EF4444',
    estFinal: true,
    description: 'Demande rejetée'
  },
  TRAITE: {
    libelle: 'Traité',
    couleur: '#059669',
    estFinal: true,
    description: 'Demande traitée avec succès'
  },
  ARCHIVE: {
    libelle: 'Archivé',
    couleur: '#6B7280',
    estFinal: true,
    description: 'Demande archivée'
  }
};

// Workflow transitions map
export const WORKFLOW_TRANSITIONS: Record<DemandeStatus, DemandeStatus[]> = {
  SOUMIS: ['RECU'],
  RECU: ['EN_COURS', 'REJETE'],
  EN_COURS: ['ATTENTE_INFO', 'VALIDE', 'REJETE'],
  ATTENTE_INFO: ['EN_COURS', 'REJETE'],
  VALIDE: ['TRAITE'],
  REJETE: ['ARCHIVE'],
  TRAITE: ['ARCHIVE'],
  ARCHIVE: [] // Terminal state
};

// Transition permissions
export const TRANSITION_PERMISSIONS: Record<string, string[]> = {
  'SOUMIS->RECU': ['SYSTEM'],
  'RECU->EN_COURS': ['ADMIN', 'SUPER_ADMIN'],
  'RECU->REJETE': ['ADMIN', 'SUPER_ADMIN'],
  'EN_COURS->ATTENTE_INFO': ['ADMIN', 'SUPER_ADMIN'],
  'EN_COURS->VALIDE': ['ADMIN', 'SUPER_ADMIN'],
  'EN_COURS->REJETE': ['ADMIN', 'SUPER_ADMIN'],
  'ATTENTE_INFO->EN_COURS': ['STUDENT', 'ADMIN', 'SUPER_ADMIN'],
  'ATTENTE_INFO->REJETE': ['ADMIN', 'SUPER_ADMIN'],
  'VALIDE->TRAITE': ['SYSTEM', 'ADMIN', 'SUPER_ADMIN'],
  'TRAITE->ARCHIVE': ['SYSTEM', 'ADMIN', 'SUPER_ADMIN'],
  'REJETE->ARCHIVE': ['SYSTEM', 'ADMIN', 'SUPER_ADMIN']
};

// Required fields per status
export interface TransitionRequirements {
  requiredFields?: string[];
  optionalFields?: string[];
}

export const TRANSITION_REQUIREMENTS: Partial<Record<DemandeStatus, TransitionRequirements>> = {
  REJETE: {
    requiredFields: ['motifRefus'],
    optionalFields: ['commentaireAdmin']
  },
  EN_COURS: {
    optionalFields: ['traiteParId', 'commentaireAdmin']
  },
  ATTENTE_INFO: {
    requiredFields: ['commentaireAdmin']
  },
  VALIDE: {
    requiredFields: ['documents'] // Must have at least one document
  }
};

// Helper functions
export function canTransition(from: DemandeStatus, to: DemandeStatus): boolean {
  return WORKFLOW_TRANSITIONS[from]?.includes(to) ?? false;
}

export function isTerminalStatus(status: DemandeStatus): boolean {
  return STATUTS_META[status].estFinal === true;
}

export function getAllowedTransitions(from: DemandeStatus): DemandeStatus[] {
  return WORKFLOW_TRANSITIONS[from] || [];
}
```

**Acceptance Criteria**:
- All 8 status values defined with metadata
- Transition map complete and accurate
- Permission map covers all transitions
- Helper functions work correctly

#### 3.2: Implement Workflow Class
**File**: `lib/workflow/state-machine.ts`

```typescript
import type { IDemandeDocument, DemandeStatus, UserRole } from '@/types/database';
import { Historique, Notification } from '@/lib/db/models';
import {
  WORKFLOW_TRANSITIONS,
  STATUTS_META,
  TRANSITION_PERMISSIONS,
  TRANSITION_REQUIREMENTS,
  canTransition,
  isTerminalStatus
} from './constants';

export interface TransitionContext {
  userId?: string;
  userRole?: UserRole;
  commentaire?: string;
  motifRefus?: string;
  traiteParId?: string;
}

export class DemandeWorkflow {
  private demande: IDemandeDocument;
  private context: TransitionContext;

  constructor(demande: IDemandeDocument, context: TransitionContext = {}) {
    this.demande = demande;
    this.context = context;
  }

  /**
   * Execute a status transition with full validation and side effects
   */
  async transition(newStatut: DemandeStatus): Promise<void> {
    const currentStatut = this.demande.statut.code;

    // 1. Validate transition path
    if (!canTransition(currentStatut, newStatut)) {
      throw new WorkflowError(
        'WF_001',
        `Invalid transition: ${currentStatut} → ${newStatut}. ` +
        `Allowed transitions: ${WORKFLOW_TRANSITIONS[currentStatut].join(', ')}`,
        {
          currentStatus: currentStatut,
          attemptedStatus: newStatut,
          allowedTransitions: WORKFLOW_TRANSITIONS[currentStatut]
        }
      );
    }

    // 2. Validate permissions
    this.validatePermissions(currentStatut, newStatut);

    // 3. Pre-transition validation
    await this.onBeforeTransition(currentStatut, newStatut);

    const oldStatut = { ...this.demande.statut };

    // 4. Update status
    this.demande.statut = {
      code: newStatut,
      ...STATUTS_META[newStatut]
    };

    // 5. Save demande
    await this.demande.save();

    // 6. Create history entry
    await this.logHistorique(oldStatut, newStatut);

    // 7. Post-transition actions
    await this.onAfterTransition(currentStatut, newStatut);
  }

  /**
   * Validate user has permission for this transition
   */
  private validatePermissions(from: DemandeStatus, to: DemandeStatus): void {
    if (!this.context.userRole) {
      throw new WorkflowError(
        'WF_003',
        'User role is required for transition validation'
      );
    }

    const transitionKey = `${from}->${to}`;
    const allowedRoles = TRANSITION_PERMISSIONS[transitionKey];

    if (!allowedRoles) {
      // If no specific permissions defined, allow ADMIN and SUPER_ADMIN
      if (!['ADMIN', 'SUPER_ADMIN'].includes(this.context.userRole)) {
        throw new WorkflowError(
          'WF_003',
          `Role ${this.context.userRole} not allowed for transition ${transitionKey}`
        );
      }
      return;
    }

    if (!allowedRoles.includes(this.context.userRole)) {
      throw new WorkflowError(
        'WF_003',
        `Insufficient permissions. Required roles: ${allowedRoles.join(', ')}`,
        {
          userRole: this.context.userRole,
          requiredRoles: allowedRoles
        }
      );
    }
  }

  /**
   * Pre-transition validation and setup
   */
  private async onBeforeTransition(from: DemandeStatus, to: DemandeStatus): Promise<void> {
    const requirements = TRANSITION_REQUIREMENTS[to];

    if (!requirements) return;

    // Validate required fields
    if (requirements.requiredFields) {
      for (const field of requirements.requiredFields) {
        if (field === 'motifRefus' && !this.context.motifRefus) {
          throw new WorkflowError(
            'WF_002',
            'Un motif de refus est requis pour rejeter une demande'
          );
        }

        if (field === 'commentaireAdmin' && !this.context.commentaireAdmin) {
          throw new WorkflowError(
            'WF_002',
            'Un commentaire administrateur est requis pour cette transition'
          );
        }

        if (field === 'documents' && this.demande.documents.length === 0) {
          throw new WorkflowError(
            'WF_002',
            'Au moins un document est requis pour valider la demande'
          );
        }
      }
    }

    // Business rule: Cannot modify terminal states
    if (isTerminalStatus(from) && to !== 'ARCHIVE') {
      throw new WorkflowError(
        'WF_002',
        'Cannot modify demandes in terminal state (except archiving)'
      );
    }

    // Update demande fields based on context
    if (this.context.motifRefus) {
      this.demande.motifRefus = this.context.motifRefus;
    }

    if (this.context.commentaireAdmin) {
      this.demande.commentaireAdmin = this.context.commentaireAdmin;
    }

    if (this.context.traiteParId) {
      this.demande.traiteParId = this.context.traiteParId as any;
    }
  }

  /**
   * Post-transition side effects
   */
  private async onAfterTransition(from: DemandeStatus, to: DemandeStatus): Promise<void> {
    // Auto-transition: VALIDE → TRAITE
    if (to === 'VALIDE') {
      // Set traiteParId if not already set
      if (!this.demande.traiteParId && this.context.userId) {
        this.demande.traiteParId = this.context.userId as any;
      }
      
      // Auto-transition to TRAITE
      setTimeout(async () => {
        this.demande.statut = {
          code: 'TRAITE',
          ...STATUTS_META['TRAITE']
        };
        this.demande.dateTraitement = new Date();
        await this.demande.save();
        
        await this.logHistorique(
          { code: 'VALIDE', libelle: 'Validé' },
          'TRAITE'
        );
        
        await this.sendNotification('TRAITE');
      }, 100);
    }

    // Update dateTraitement for TRAITE status
    if (to === 'TRAITE') {
      this.demande.dateTraitement = new Date();
      await this.demande.save();
    }

    // Send notifications
    await this.sendNotification(to);
  }

  /**
   * Log transition to historique
   */
  private async logHistorique(
    oldStatut: { code: DemandeStatus; libelle: string },
    newStatut: DemandeStatus
  ): Promise<void> {
    const historiqueData: any = {
      demandeId: this.demande._id,
      numeroDemandeRef: this.demande.numeroDemande,
      statutAncien: oldStatut,
      statutNouveau: {
        code: newStatut,
        libelle: STATUTS_META[newStatut].libelle
      },
      typeAction: 'CHANGEMENT_STATUT',
      commentaire: this.context.commentaire
    };

    // Add user info if available
    if (this.context.userId) {
      // In a real implementation, fetch user from database
      historiqueData.utilisateur = {
        id: this.context.userId,
        nom: 'User', // Fetch from DB
        role: this.context.userRole
      };
    }

    await Historique.create(historiqueData);
  }

  /**
   * Send email notification for status change
   */
  private async sendNotification(newStatut: DemandeStatus): Promise<void> {
    const templates: Partial<Record<DemandeStatus, string>> = {
      RECU: 'demande-recue',
      EN_COURS: 'demande-en-cours',
      ATTENTE_INFO: 'demande-attente-info',
      VALIDE: 'demande-validee',
      REJETE: 'demande-rejetee',
      TRAITE: 'demande-traitee'
    };

    const template = templates[newStatut];
    if (!template) return;

    await Notification.create({
      demandeId: this.demande._id,
      type: 'EMAIL',
      destinataire: this.demande.etudiant.email,
      sujet: `Mise à jour de votre demande ${this.demande.numeroDemande}`,
      contenu: `Votre demande est maintenant: ${STATUTS_META[newStatut].libelle}`,
      templateUtilise: template,
      statutEnvoi: 'EN_ATTENTE',
      nbTentatives: 0
    });
  }
}

/**
 * Custom error class for workflow errors
 */
export class WorkflowError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'WorkflowError';
  }
}
```

**Acceptance Criteria**:
- All transitions validated against workflow map
- Permission checking enforced
- Required fields validated before transition
- History logged for all transitions
- Notifications queued for status changes
- Auto-transitions work correctly
- Terminal state protection

#### 3.3: Create Workflow Utility Functions
**File**: `lib/workflow/utils.ts`

```typescript
import type { DemandeStatus, UserRole } from '@/types/database';
import { WORKFLOW_TRANSITIONS, TRANSITION_PERMISSIONS } from './constants';

/**
 * Get all possible next states for a given status
 */
export function getAvailableTransitions(
  currentStatus: DemandeStatus,
  userRole: UserRole
): DemandeStatus[] {
  const allTransitions = WORKFLOW_TRANSITIONS[currentStatus] || [];

  return allTransitions.filter(nextStatus => {
    const transitionKey = `${currentStatus}->${nextStatus}`;
    const allowedRoles = TRANSITION_PERMISSIONS[transitionKey];

    if (!allowedRoles) {
      return ['ADMIN', 'SUPER_ADMIN'].includes(userRole);
    }

    return allowedRoles.includes(userRole);
  });
}

/**
 * Check if user can perform a specific transition
 */
export function canUserTransition(
  from: DemandeStatus,
  to: DemandeStatus,
  userRole: UserRole
): boolean {
  const transitionKey = `${from}->${to}`;
  const allowedRoles = TRANSITION_PERMISSIONS[transitionKey];

  if (!allowedRoles) {
    return ['ADMIN', 'SUPER_ADMIN', 'SYSTEM'].includes(userRole);
  }

  return allowedRoles.includes(userRole);
}

/**
 * Validate transition context has required fields
 */
export function validateTransitionContext(
  targetStatus: DemandeStatus,
  context: Record<string, any>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (targetStatus === 'REJETE' && !context.motifRefus) {
    errors.push('motifRefus is required when rejecting');
  }

  if (targetStatus === 'ATTENTE_INFO' && !context.commentaireAdmin) {
    errors.push('commentaireAdmin is required for ATTENTE_INFO');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
```

**Acceptance Criteria**:
- Utility functions work for all status combinations
- Permission logic matches workflow class
- Validation functions cover all requirements

### Testing Checklist
- [ ] Can transition through valid paths
- [ ] Invalid transitions are rejected
- [ ] Permission validation works
- [ ] Required fields are enforced
- [ ] History is created for each transition
- [ ] Notifications are queued
- [ ] Auto-transitions execute correctly
- [ ] Terminal states are protected

---

## Task 4: API Endpoints and Server Actions

**Duration**: 1.5 days
**Status**: Pending
**Priority**: High
**Dependencies**: Task 2, Task 3

### Description
Implement RESTful API routes and Server Actions for demande CRUD operations, file uploads, and workflow transitions.

### Subtasks

#### 4.1: Create Validation Schemas
**File**: `lib/validators/demande.ts`

```typescript
import { z } from 'zod';

// Query validation
export const queryDemandesSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  statut: z.enum([
    'SOUMIS', 'RECU', 'EN_COURS', 'ATTENTE_INFO', 
    'VALIDE', 'REJETE', 'TRAITE', 'ARCHIVE'
  ]).optional(),
  priorite: z.enum(['BASSE', 'NORMALE', 'HAUTE', 'URGENTE']).optional(),
  typeDemande: z.enum([
    'ATTESTATION_SCOLARITE',
    'RELEVE_NOTES',
    'ATTESTATION_REUSSITE',
    'DUPLICATA_CARTE',
    'CONVENTION_STAGE'
  ]).optional(),
  sortBy: z.string().default('-createdAt'),
  search: z.string().optional()
});

export type QueryDemandesInput = z.infer<typeof queryDemandesSchema>;

// Create demande validation
export const createDemandeSchema = z.object({
  typeDemande: z.enum([
    'ATTESTATION_SCOLARITE',
    'RELEVE_NOTES',
    'ATTESTATION_REUSSITE',
    'DUPLICATA_CARTE',
    'CONVENTION_STAGE'
  ], {
    required_error: 'Le type de demande est requis'
  }),
  objet: z.string()
    .min(10, 'L\'objet doit contenir au moins 10 caractères')
    .max(255, 'L\'objet ne peut pas dépasser 255 caractères'),
  description: z.string()
    .min(20, 'La description doit contenir au moins 20 caractères'),
  priorite: z.enum(['BASSE', 'NORMALE', 'HAUTE', 'URGENTE']).default('NORMALE'),
  documentIds: z.array(z.string()).optional()
});

export type CreateDemandeInput = z.infer<typeof createDemandeSchema>;

// Update demande validation
export const updateDemandeSchema = createDemandeSchema.partial();

export type UpdateDemandeInput = z.infer<typeof updateDemandeSchema>;

// Transition validation
export const transitionDemandeSchema = z.object({
  newStatut: z.enum([
    'RECU', 'EN_COURS', 'ATTENTE_INFO', 
    'VALIDE', 'REJETE', 'TRAITE', 'ARCHIVE'
  ]),
  commentaire: z.string().optional(),
  motifRefus: z.string()
    .min(10, 'Le motif de refus doit contenir au moins 10 caractères')
    .optional(),
  traiteParId: z.string().optional()
});

export type TransitionDemandeInput = z.infer<typeof transitionDemandeSchema>;

// File upload validation
export const fileUploadSchema = z.object({
  file: z.instanceof(File, { message: 'Fichier requis' }),
  categorie: z.string().optional()
});
```

**Acceptance Criteria**:
- All schemas use French error messages
- Validation rules match business requirements
- Types inferred from schemas
- Schema reuse with .partial() for updates

#### 4.2: Create API Error Handler
**File**: `lib/api/error-handler.ts`

```typescript
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { WorkflowError } from '@/lib/workflow/state-machine';

export function handleApiError(error: unknown): NextResponse {
  console.error('API Error:', error);

  // Zod validation errors
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VAL_001',
          message: 'Erreur de validation',
          details: error.flatten().fieldErrors
        }
      },
      { status: 400 }
    );
  }

  // Workflow errors
  if (error instanceof WorkflowError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details
        }
      },
      { status: 422 }
    );
  }

  // Mongoose duplicate key error
  if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'RES_002',
          message: 'Une ressource avec ces données existe déjà',
          details: 'keyPattern' in error ? error.keyPattern : undefined
        }
      },
      { status: 409 }
    );
  }

  // Generic server error
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'SRV_001',
        message: 'Erreur serveur interne'
      }
    },
    { status: 500 }
  );
}
```

**Acceptance Criteria**:
- Handles all error types
- Returns proper HTTP status codes
- French error messages
- Error details preserved for debugging

#### 4.3: Implement Demandes List API
**File**: `app/api/demandes/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { queryDemandesSchema, createDemandeSchema } from '@/lib/validators/demande';
import { handleApiError } from '@/lib/api/error-handler';
import { Demande, Etudiant } from '@/lib/db/models';
import { DemandeWorkflow } from '@/lib/workflow/state-machine';
import { STATUTS_META } from '@/lib/workflow/constants';
import connectDB from '@/lib/db/mongodb';

// GET /api/demandes - List demandes with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const query = queryDemandesSchema.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      statut: searchParams.get('statut'),
      priorite: searchParams.get('priorite'),
      typeDemande: searchParams.get('typeDemande'),
      sortBy: searchParams.get('sortBy'),
      search: searchParams.get('search')
    });

    // Build MongoDB query
    const filter: any = {};

    if (query.statut) {
      filter['statut.code'] = query.statut;
    }

    if (query.priorite) {
      filter.priorite = query.priorite;
    }

    if (query.typeDemande) {
      filter['typeDemande.code'] = query.typeDemande;
    }

    if (query.search) {
      filter.$or = [
        { numeroDemande: new RegExp(query.search, 'i') },
        { objet: new RegExp(query.search, 'i') },
        { 'etudiant.nom': new RegExp(query.search, 'i') },
        { 'etudiant.prenom': new RegExp(query.search, 'i') }
      ];
    }

    // Parse sort
    const sortField = query.sortBy.startsWith('-') ? query.sortBy.slice(1) : query.sortBy;
    const sortOrder = query.sortBy.startsWith('-') ? -1 : 1;

    // Execute query with pagination
    const [items, total] = await Promise.all([
      Demande.find(filter)
        .sort({ [sortField]: sortOrder })
        .skip((query.page - 1) * query.limit)
        .limit(query.limit)
        .lean(),
      Demande.countDocuments(filter)
    ]);

    return NextResponse.json({
      success: true,
      data: items,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit)
      }
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/demandes - Create new demande
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const validated = createDemandeSchema.parse(body);

    // Get current user (from session/auth)
    // This is a placeholder - implement based on your auth solution
    const currentUser = { id: 'user-id', role: 'STUDENT' };

    // Fetch etudiant data
    const etudiant = await Etudiant.findById(currentUser.id);
    if (!etudiant) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'RES_001', message: 'Étudiant non trouvé' }
        },
        { status: 404 }
      );
    }

    // Create demande with SOUMIS status
    const demande = await Demande.create({
      etudiant: {
        id: etudiant._id,
        nom: etudiant.nom,
        prenom: etudiant.prenom,
        email: etudiant.email,
        matricule: etudiant.matricule
      },
      typeDemande: {
        code: validated.typeDemande,
        nom: getTypeDemandeNom(validated.typeDemande),
        delaiTraitement: getDelaiTraitement(validated.typeDemande)
      },
      statut: {
        code: 'SOUMIS',
        ...STATUTS_META.SOUMIS
      },
      objet: validated.objet,
      description: validated.description,
      priorite: validated.priorite,
      documents: [], // Documents added separately
      metadata: {}
    });

    // Auto-transition to RECU
    const workflow = new DemandeWorkflow(demande, {
      userId: 'SYSTEM',
      userRole: 'SYSTEM' as any
    });
    await workflow.transition('RECU');

    return NextResponse.json(
      { success: true, data: demande },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

// Helper functions
function getTypeDemandeNom(code: string): string {
  const names: Record<string, string> = {
    ATTESTATION_SCOLARITE: 'Attestation de scolarité',
    RELEVE_NOTES: 'Relevé de notes',
    ATTESTATION_REUSSITE: 'Attestation de réussite',
    DUPLICATA_CARTE: 'Duplicata de carte étudiant',
    CONVENTION_STAGE: 'Convention de stage'
  };
  return names[code] || code;
}

function getDelaiTraitement(code: string): number {
  const delais: Record<string, number> = {
    ATTESTATION_SCOLARITE: 3,
    RELEVE_NOTES: 5,
    ATTESTATION_REUSSITE: 7,
    DUPLICATA_CARTE: 10,
    CONVENTION_STAGE: 5
  };
  return delais[code] || 5;
}
```

**Acceptance Criteria**:
- GET returns paginated list
- POST creates demande with auto-transition
- Filtering works correctly
- Sorting works correctly
- Search across multiple fields
- Error handling comprehensive

#### 4.4: Implement Single Demande API
**File**: `app/api/demandes/[id]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { updateDemandeSchema } from '@/lib/validators/demande';
import { handleApiError } from '@/lib/api/error-handler';
import { Demande } from '@/lib/db/models';
import connectDB from '@/lib/db/mongodb';

// GET /api/demandes/[id] - Get single demande
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const demande = await Demande.findById(params.id);

    if (!demande) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RES_001',
            message: 'Demande non trouvée',
            details: { id: params.id }
          }
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: demande });
  } catch (error) {
    return handleApiError(error);
  }
}

// PATCH /api/demandes/[id] - Update demande
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const body = await request.json();
    const validated = updateDemandeSchema.parse(body);

    const demande = await Demande.findByIdAndUpdate(
      params.id,
      { $set: validated },
      { new: true, runValidators: true }
    );

    if (!demande) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'RES_001', message: 'Demande non trouvée' }
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: demande });
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/demandes/[id] - Soft delete demande
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    // Soft delete by setting actif = false
    const demande = await Demande.findByIdAndUpdate(
      params.id,
      { $set: { actif: false } },
      { new: true }
    );

    if (!demande) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'RES_001', message: 'Demande non trouvée' }
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, data: null },
      { status: 204 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
```

**Acceptance Criteria**:
- GET returns full demande details
- PATCH updates allowed fields only
- DELETE performs soft delete
- 404 errors handled properly

#### 4.5: Implement Workflow Transition API
**File**: `app/api/demandes/[id]/transition/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { transitionDemandeSchema } from '@/lib/validators/demande';
import { handleApiError } from '@/lib/api/error-handler';
import { Demande } from '@/lib/db/models';
import { DemandeWorkflow } from '@/lib/workflow/state-machine';
import connectDB from '@/lib/db/mongodb';

// POST /api/demandes/[id]/transition - Change demande status
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const body = await request.json();
    const validated = transitionDemandeSchema.parse(body);

    // Get current user (from session)
    const currentUser = { id: 'admin-id', role: 'ADMIN' };

    // Fetch demande
    const demande = await Demande.findById(params.id);
    if (!demande) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'RES_001', message: 'Demande non trouvée' }
        },
        { status: 404 }
      );
    }

    // Execute transition
    const workflow = new DemandeWorkflow(demande, {
      userId: currentUser.id,
      userRole: currentUser.role as any,
      commentaire: validated.commentaire,
      motifRefus: validated.motifRefus,
      traiteParId: validated.traiteParId
    });

    await workflow.transition(validated.newStatut);

    // Reload demande to get updated state
    await demande.reload();

    return NextResponse.json({ success: true, data: demande });
  } catch (error) {
    return handleApiError(error);
  }
}
```

**Acceptance Criteria**:
- Validates transition request
- Executes workflow transition
- Returns updated demande
- Workflow errors handled properly

#### 4.6: Implement Server Actions
**File**: `app/actions/demandes.ts`

```typescript
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createDemandeSchema, transitionDemandeSchema } from '@/lib/validators/demande';
import { Demande, Etudiant } from '@/lib/db/models';
import { DemandeWorkflow } from '@/lib/workflow/state-machine';
import { STATUTS_META } from '@/lib/workflow/constants';
import connectDB from '@/lib/db/mongodb';

type ActionResponse<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string; details?: unknown } };

/**
 * Create a new demande from form submission
 */
export async function createDemandeAction(
  formData: FormData
): Promise<ActionResponse<any>> {
  try {
    await connectDB();

    // Parse and validate form data
    const data = Object.fromEntries(formData);
    const validated = createDemandeSchema.parse(data);

    // Get current user (implement based on your auth)
    const currentUser = { id: 'user-id', role: 'STUDENT' };

    // Fetch etudiant
    const etudiant = await Etudiant.findById(currentUser.id);
    if (!etudiant) {
      return {
        success: false,
        error: { code: 'RES_001', message: 'Étudiant non trouvé' }
      };
    }

    // Create demande
    const demande = await Demande.create({
      etudiant: {
        id: etudiant._id,
        nom: etudiant.nom,
        prenom: etudiant.prenom,
        email: etudiant.email,
        matricule: etudiant.matricule
      },
      typeDemande: {
        code: validated.typeDemande,
        nom: getTypeDemandeNom(validated.typeDemande),
        delaiTraitement: 3
      },
      statut: {
        code: 'SOUMIS',
        ...STATUTS_META.SOUMIS
      },
      objet: validated.objet,
      description: validated.description,
      priorite: validated.priorite,
      documents: [],
      metadata: {}
    });

    // Auto-transition to RECU
    const workflow = new DemandeWorkflow(demande, {
      userId: 'SYSTEM',
      userRole: 'SYSTEM' as any
    });
    await workflow.transition('RECU');

    // Revalidate cache
    revalidatePath('/demandes');
    revalidatePath('/dashboard');

    return { success: true, data: demande.toObject() };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: {
          code: 'VAL_001',
          message: 'Erreur de validation',
          details: error.flatten().fieldErrors
        }
      };
    }

    console.error('Create demande error:', error);
    return {
      success: false,
      error: { code: 'SRV_001', message: 'Erreur serveur' }
    };
  }
}

/**
 * Update demande status (admin action)
 */
export async function updateStatutAction(
  demandeId: string,
  formData: FormData
): Promise<ActionResponse<any>> {
  try {
    await connectDB();

    // Parse and validate
    const data = Object.fromEntries(formData);
    const validated = transitionDemandeSchema.parse(data);

    // Get current user
    const currentUser = { id: 'admin-id', role: 'ADMIN' };

    // Fetch demande
    const demande = await Demande.findById(demandeId);
    if (!demande) {
      return {
        success: false,
        error: { code: 'RES_001', message: 'Demande non trouvée' }
      };
    }

    // Execute transition
    const workflow = new DemandeWorkflow(demande, {
      userId: currentUser.id,
      userRole: currentUser.role as any,
      commentaire: validated.commentaire,
      motifRefus: validated.motifRefus
    });

    await workflow.transition(validated.newStatut);

    // Revalidate
    revalidatePath('/admin/demandes');
    revalidatePath(`/admin/demandes/${demandeId}`);
    revalidatePath('/demandes');

    return { success: true, data: demande.toObject() };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: {
          code: 'VAL_001',
          message: 'Erreur de validation',
          details: error.flatten().fieldErrors
        }
      };
    }

    console.error('Update status error:', error);
    return {
      success: false,
      error: { code: 'SRV_001', message: 'Erreur serveur' }
    };
  }
}

// Helper function
function getTypeDemandeNom(code: string): string {
  const names: Record<string, string> = {
    ATTESTATION_SCOLARITE: 'Attestation de scolarité',
    RELEVE_NOTES: 'Relevé de notes',
    ATTESTATION_REUSSITE: 'Attestation de réussite',
    DUPLICATA_CARTE: 'Duplicata de carte étudiant',
    CONVENTION_STAGE: 'Convention de stage'
  };
  return names[code] || code;
}
```

**Acceptance Criteria**:
- Server Actions properly marked with 'use server'
- Form data parsing and validation
- Revalidation of affected paths
- Error handling with proper types
- Return discriminated union types

### Testing Checklist
- [ ] API endpoints return correct data
- [ ] Validation errors are descriptive
- [ ] Pagination works correctly
- [ ] Filtering and sorting work
- [ ] Workflow transitions execute
- [ ] Server Actions integrate with forms
- [ ] Cache revalidation triggers

---

## Task 5: Student Interface Components

**Duration**: 1.5 days
**Status**: Pending
**Priority**: High
**Dependencies**: Task 4

### Description
Build the student-facing interface components for viewing, creating, and tracking demandes.

### Subtasks

#### 5.1: Create UI Primitive Components
**Files**: `components/ui/*`

Create basic UI components following Shadcn/ui patterns:
- `button.tsx` - Button component with variants
- `badge.tsx` - Status badge component
- `input.tsx` - Form input component
- `textarea.tsx` - Textarea component
- `select.tsx` - Select dropdown component
- `card.tsx` - Card container component
- `table.tsx` - Table component

These should be implemented using Shadcn/ui CLI or manual implementation following their patterns.

**Acceptance Criteria**:
- All primitives use Tailwind for styling
- TypeScript prop interfaces defined
- Accessible (keyboard navigation, ARIA)
- Variants for different states
- Composable and reusable

#### 5.2: Create Demande Card Component
**File**: `components/demandes/demande-card.tsx`

```typescript
'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { IDemande } from '@/types/database';

interface DemandeCardProps {
  demande: IDemande;
  onClick?: (id: string) => void;
}

export function DemandeCard({ demande, onClick }: DemandeCardProps) {
  const handleClick = () => {
    if (onClick) {
      onClick(demande._id.toString());
    }
  };

  return (
    <Card 
      className="p-4 cursor-pointer hover:shadow-md transition-shadow"
      onClick={handleClick}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">
            {demande.objet}
          </h3>
          <p className="text-sm text-gray-600">
            {demande.numeroDemande}
          </p>
        </div>
        <Badge 
          className="ml-4"
          style={{ backgroundColor: demande.statut.couleur }}
        >
          {demande.statut.libelle}
        </Badge>
      </div>

      <p className="mt-2 text-sm text-gray-700 line-clamp-2">
        {demande.description}
      </p>

      <div className="mt-4 flex justify-between items-center text-xs text-gray-500">
        <span className="font-medium">{demande.typeDemande.nom}</span>
        <span>{new Date(demande.createdAt).toLocaleDateString('fr-FR')}</span>
      </div>

      {demande.documents.length > 0 && (
        <div className="mt-2 text-xs text-gray-500">
          {demande.documents.length} document(s)
        </div>
      )}
    </Card>
  );
}
```

**Acceptance Criteria**:
- Displays key demande information
- Status badge with color
- Click handler for navigation
- Responsive design
- Line clamp for long descriptions

#### 5.3: Create Demande List Component
**File**: `components/demandes/demande-list.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DemandeCard } from './demande-card';
import { Select } from '@/components/ui/select';
import type { IDemande, DemandeStatus } from '@/types/database';

interface DemandeListProps {
  demandes: IDemande[];
}

export function DemandeList({ demandes }: DemandeListProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<DemandeStatus | 'ALL'>('ALL');

  const filteredDemandes = filter === 'ALL' 
    ? demandes 
    : demandes.filter(d => d.statut.code === filter);

  const handleDemandeClick = (id: string) => {
    router.push(`/demandes/${id}`);
  };

  return (
    <div>
      <div className="mb-4">
        <Select
          value={filter}
          onChange={(e) => setFilter(e.target.value as DemandeStatus | 'ALL')}
        >
          <option value="ALL">Toutes les demandes</option>
          <option value="RECU">Reçu</option>
          <option value="EN_COURS">En cours</option>
          <option value="ATTENTE_INFO">En attente d'information</option>
          <option value="VALIDE">Validé</option>
          <option value="REJETE">Rejeté</option>
          <option value="TRAITE">Traité</option>
        </Select>
      </div>

      {filteredDemandes.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          Aucune demande trouvée
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredDemandes.map(demande => (
            <DemandeCard
              key={demande._id.toString()}
              demande={demande}
              onClick={handleDemandeClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

**Acceptance Criteria**:
- Filters demandes by status
- Grid layout responsive
- Empty state handled
- Navigation to detail view

#### 5.4: Create Demande Form Component
**File**: `components/demandes/demande-form.tsx`

```typescript
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createDemandeSchema, type CreateDemandeInput } from '@/lib/validators/demande';
import { createDemandeAction } from '@/app/actions/demandes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';

export function DemandeForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<CreateDemandeInput>({
    resolver: zodResolver(createDemandeSchema),
    defaultValues: {
      priorite: 'NORMALE'
    }
  });

  const onSubmit = form.handleSubmit(async (data) => {
    try {
      setLoading(true);
      setError(null);

      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        formData.append(key, value.toString());
      });

      const result = await createDemandeAction(formData);

      if (result.success) {
        router.push('/demandes');
        router.refresh();
      } else {
        setError(result.error.message);
      }
    } catch (err) {
      setError('Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-800">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Type de demande *
        </label>
        <Select {...form.register('typeDemande')}>
          <option value="">Sélectionner un type</option>
          <option value="ATTESTATION_SCOLARITE">Attestation de scolarité</option>
          <option value="RELEVE_NOTES">Relevé de notes</option>
          <option value="ATTESTATION_REUSSITE">Attestation de réussite</option>
          <option value="DUPLICATA_CARTE">Duplicata de carte</option>
          <option value="CONVENTION_STAGE">Convention de stage</option>
        </Select>
        {form.formState.errors.typeDemande && (
          <p className="mt-1 text-sm text-red-600">
            {form.formState.errors.typeDemande.message}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Objet *
        </label>
        <Input 
          {...form.register('objet')}
          placeholder="Objet de la demande"
          maxLength={255}
        />
        {form.formState.errors.objet && (
          <p className="mt-1 text-sm text-red-600">
            {form.formState.errors.objet.message}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description *
        </label>
        <Textarea 
          {...form.register('description')}
          placeholder="Décrivez votre demande en détail"
          rows={5}
        />
        {form.formState.errors.description && (
          <p className="mt-1 text-sm text-red-600">
            {form.formState.errors.description.message}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Priorité
        </label>
        <Select {...form.register('priorite')}>
          <option value="BASSE">Basse</option>
          <option value="NORMALE">Normale</option>
          <option value="HAUTE">Haute</option>
          <option value="URGENTE">Urgente</option>
        </Select>
      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={loading}>
          {loading ? 'Envoi en cours...' : 'Soumettre la demande'}
        </Button>
        <Button 
          type="button" 
          variant="outline"
          onClick={() => router.back()}
        >
          Annuler
        </Button>
      </div>
    </form>
  );
}
```

**Acceptance Criteria**:
- Form validation with Zod
- Error messages displayed
- Loading state handled
- Success redirects to list
- Cancel button navigates back

#### 5.5: Create Demande Detail Component
**File**: `components/demandes/demande-detail.tsx`

```typescript
'use client';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import type { IDemande } from '@/types/database';

interface DemandeDetailProps {
  demande: IDemande;
}

export function DemandeDetail({ demande }: DemandeDetailProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {demande.objet}
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            {demande.numeroDemande}
          </p>
        </div>
        <Badge 
          className="text-sm px-3 py-1"
          style={{ backgroundColor: demande.statut.couleur }}
        >
          {demande.statut.libelle}
        </Badge>
      </div>

      {/* Info Card */}
      <Card className="p-6">
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">Type</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {demande.typeDemande.nom}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Priorité</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {demande.priorite}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Date de soumission</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {new Date(demande.createdAt).toLocaleDateString('fr-FR')}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Délai de traitement</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {demande.typeDemande.delaiTraitement} jours
            </dd>
          </div>
        </dl>
      </Card>

      {/* Description */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          Description
        </h2>
        <p className="text-sm text-gray-700 whitespace-pre-wrap">
          {demande.description}
        </p>
      </Card>

      {/* Documents */}
      {demande.documents.length > 0 && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Documents
          </h2>
          <div className="space-y-2">
            {demande.documents.map(doc => (
              <a
                key={doc.id}
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded"
              >
                <span className="text-sm text-gray-700">{doc.nomOriginal}</span>
                <span className="text-xs text-gray-500">
                  ({(doc.taille / 1024).toFixed(0)} KB)
                </span>
              </a>
            ))}
          </div>
        </Card>
      )}

      {/* Admin Comments */}
      {demande.commentaireAdmin && (
        <Card className="p-6 bg-blue-50">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Commentaire de l'administration
          </h2>
          <p className="text-sm text-gray-700">
            {demande.commentaireAdmin}
          </p>
        </Card>
      )}

      {/* Rejection Reason */}
      {demande.motifRefus && (
        <Card className="p-6 bg-red-50">
          <h2 className="text-lg font-semibold text-red-900 mb-2">
            Motif de refus
          </h2>
          <p className="text-sm text-red-700">
            {demande.motifRefus}
          </p>
        </Card>
      )}
    </div>
  );
}
```

**Acceptance Criteria**:
- Displays all demande details
- Documents are downloadable
- Admin comments visible when present
- Rejection reasons displayed
- Responsive layout

### Testing Checklist
- [ ] Components render without errors
- [ ] Form validation works correctly
- [ ] Status badges display correct colors
- [ ] Navigation between pages works
- [ ] Responsive on mobile devices
- [ ] Accessibility standards met

---

## Task 6: Admin Interface Components

**Duration**: 1 day
**Status**: Pending
**Priority**: High
**Dependencies**: Task 4, Task 5

### Description
Build admin-facing interface for processing demandes, changing status, and viewing analytics.

### Subtasks

#### 6.1: Create Admin Dashboard Component
**File**: `components/admin/dashboard.tsx`

```typescript
'use client';

import { Card } from '@/components/ui/card';

interface DashboardProps {
  stats: {
    total: number;
    enCours: number;
    traites: number;
    rejetes: number;
  };
}

export function AdminDashboard({ stats }: DashboardProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <Card className="p-6">
        <div className="text-sm font-medium text-gray-500">
          Total des demandes
        </div>
        <div className="mt-2 text-3xl font-bold text-gray-900">
          {stats.total}
        </div>
      </Card>

      <Card className="p-6">
        <div className="text-sm font-medium text-gray-500">
          En cours
        </div>
        <div className="mt-2 text-3xl font-bold text-orange-600">
          {stats.enCours}
        </div>
      </Card>

      <Card className="p-6">
        <div className="text-sm font-medium text-gray-500">
          Traitées
        </div>
        <div className="mt-2 text-3xl font-bold text-green-600">
          {stats.traites}
        </div>
      </Card>

      <Card className="p-6">
        <div className="text-sm font-medium text-gray-500">
          Rejetées
        </div>
        <div className="mt-2 text-3xl font-bold text-red-600">
          {stats.rejetes}
        </div>
      </Card>
    </div>
  );
}
```

**Acceptance Criteria**:
- Displays key metrics
- Responsive grid layout
- Color-coded stats
- Real-time data

#### 6.2: Create Status Modifier Component
**File**: `components/admin/status-modifier.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { transitionDemandeSchema, type TransitionDemandeInput } from '@/lib/validators/demande';
import { updateStatutAction } from '@/app/actions/demandes';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Modal } from '@/components/ui/modal';
import type { IDemande, DemandeStatus } from '@/types/database';
import { getAvailableTransitions } from '@/lib/workflow/utils';

interface StatusModifierProps {
  demande: IDemande;
  userRole: 'ADMIN' | 'SUPER_ADMIN';
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function StatusModifier({ 
  demande, 
  userRole, 
  isOpen, 
  onClose, 
  onSuccess 
}: StatusModifierProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableStatuses = getAvailableTransitions(demande.statut.code, userRole);

  const form = useForm<TransitionDemandeInput>({
    resolver: zodResolver(transitionDemandeSchema)
  });

  const selectedStatus = form.watch('newStatut');

  const onSubmit = form.handleSubmit(async (data) => {
    try {
      setLoading(true);
      setError(null);

      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value) formData.append(key, value.toString());
      });

      const result = await updateStatutAction(demande._id.toString(), formData);

      if (result.success) {
        onSuccess();
        onClose();
      } else {
        setError(result.error.message);
      }
    } catch (err) {
      setError('Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Modifier le statut">
      <form onSubmit={onSubmit} className="space-y-4">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded text-red-800">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nouveau statut *
          </label>
          <Select {...form.register('newStatut')}>
            <option value="">Sélectionner un statut</option>
            {availableStatuses.map(status => (
              <option key={status} value={status}>
                {STATUTS_META[status].libelle}
              </option>
            ))}
          </Select>
          {form.formState.errors.newStatut && (
            <p className="mt-1 text-sm text-red-600">
              {form.formState.errors.newStatut.message}
            </p>
          )}
        </div>

        {selectedStatus === 'REJETE' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Motif de refus *
            </label>
            <Textarea 
              {...form.register('motifRefus')}
              placeholder="Expliquez le motif du refus"
              rows={4}
            />
            {form.formState.errors.motifRefus && (
              <p className="mt-1 text-sm text-red-600">
                {form.formState.errors.motifRefus.message}
              </p>
            )}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Commentaire
          </label>
          <Textarea 
            {...form.register('commentaire')}
            placeholder="Commentaire facultatif"
            rows={3}
          />
        </div>

        <div className="flex gap-4">
          <Button type="submit" disabled={loading}>
            {loading ? 'Enregistrement...' : 'Modifier le statut'}
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>
            Annuler
          </Button>
        </div>
      </form>
    </Modal>
  );
}
```

**Acceptance Criteria**:
- Shows only allowed status transitions
- Requires motifRefus for REJETE
- Form validation works
- Success callback triggers
- Modal closes on success

#### 6.3: Create Admin Demande Table
**File**: `components/admin/demande-table.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Table } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatusModifier } from './status-modifier';
import type { IDemande } from '@/types/database';

interface DemandeTableProps {
  demandes: IDemande[];
}

export function DemandeTable({ demandes }: DemandeTableProps) {
  const router = useRouter();
  const [selectedDemande, setSelectedDemande] = useState<IDemande | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleModifyStatus = (demande: IDemande) => {
    setSelectedDemande(demande);
    setIsModalOpen(true);
  };

  const handleSuccess = () => {
    router.refresh();
  };

  return (
    <>
      <Table>
        <thead>
          <tr>
            <th>Numéro</th>
            <th>Étudiant</th>
            <th>Type</th>
            <th>Objet</th>
            <th>Statut</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {demandes.map(demande => (
            <tr key={demande._id.toString()}>
              <td>{demande.numeroDemande}</td>
              <td>
                {demande.etudiant.prenom} {demande.etudiant.nom}
              </td>
              <td>{demande.typeDemande.nom}</td>
              <td>{demande.objet}</td>
              <td>
                <Badge style={{ backgroundColor: demande.statut.couleur }}>
                  {demande.statut.libelle}
                </Badge>
              </td>
              <td>
                {new Date(demande.createdAt).toLocaleDateString('fr-FR')}
              </td>
              <td>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => router.push(`/admin/demandes/${demande._id}`)}
                  >
                    Voir
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleModifyStatus(demande)}
                  >
                    Modifier
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {selectedDemande && (
        <StatusModifier
          demande={selectedDemande}
          userRole="ADMIN"
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleSuccess}
        />
      )}
    </>
  );
}
```

**Acceptance Criteria**:
- Displays demandes in table format
- Status modification modal
- View detail navigation
- Refresh on status change
- Responsive table

### Testing Checklist
- [ ] Admin dashboard loads correctly
- [ ] Status modification works
- [ ] Table displays all demandes
- [ ] Filtering works
- [ ] Permission checks enforce

---

## Task 7: Form Validation and Error Handling

**Duration**: 0.5 days
**Status**: Pending
**Priority**: Medium
**Dependencies**: Task 4, Task 5, Task 6

### Description
Implement comprehensive client-side and server-side validation with proper error handling and user feedback.

### Subtasks

#### 7.1: Enhance Zod Schemas with Custom Messages
**File**: `lib/validators/demande.ts` (enhance existing)

Add custom French error messages to all Zod schemas.

#### 7.2: Create Error Display Component
**File**: `components/ui/error-display.tsx`

```typescript
interface ErrorDisplayProps {
  error: string | string[];
}

export function ErrorDisplay({ error }: ErrorDisplayProps) {
  const errors = Array.isArray(error) ? error : [error];

  return (
    <div className="p-4 bg-red-50 border border-red-200 rounded-md">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          {errors.map((err, idx) => (
            <p key={idx} className="text-sm text-red-800">
              {err}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
```

#### 7.3: Create Success Toast Component
**File**: `components/ui/toast.tsx`

Implement toast notifications for success/error feedback using a library like react-hot-toast or Sonner.

#### 7.4: Add Form Field Error Display
Update all form components to display field-level validation errors inline.

### Testing Checklist
- [ ] All validation errors display correctly
- [ ] French error messages are accurate
- [ ] Success toasts appear
- [ ] Error states are cleared properly
- [ ] Async validation works

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

## Future Enhancements (Post-Core)

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

---

## Notes

This plan follows Agent OS standards comprehensively. Each task builds on previous tasks and includes detailed acceptance criteria. The implementation should be done sequentially for dependencies to work correctly.

All code examples follow:
- MongoDB naming conventions (no accents in fields)
- French domain terminology
- TypeScript strict typing
- Next.js 15 App Router patterns
- Server Components by default
- API response format standards
- Workflow validation standards
