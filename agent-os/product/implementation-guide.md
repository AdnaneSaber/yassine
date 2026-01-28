# Guide d'Implémentation - Code Examples

Ce document fournit des exemples concrets de code, règles d'automatisation, et pseudo-code pour implémenter le prototype.

## Table des Matières

1. [Setup Initial](#setup-initial)
2. [Modèles Mongoose](#modèles-mongoose)
3. [Workflow Engine](#workflow-engine)
4. [Server Actions](#server-actions)
5. [API Routes](#api-routes)
6. [Composants UI](#composants-ui)
7. [Règles d'Automatisation](#règles-dautomatisation)
8. [Tests](#tests)

---

## Setup Initial

### 1. Créer Projet Next.js

```bash
npx create-next-app@latest university-demandes
# ✅ TypeScript: Yes
# ✅ ESLint: Yes
# ✅ Tailwind CSS: Yes
# ✅ src/ directory: No
# ✅ App Router: Yes
# ✅ Import alias: @/*

cd university-demandes
```

### 2. Installer Dépendances

```bash
# Database
npm install mongoose

# Auth
npm install next-auth@beta bcryptjs
npm install -D @types/bcryptjs

# Validation
npm install zod react-hook-form @hookform/resolvers

# UI Components
npx shadcn-ui@latest init
npx shadcn-ui@latest add button form input textarea select table dialog

# Upload
npm install cloudinary next-cloudinary

# Email
npm install resend react-email
npm install -D @react-email/components

# Utils
npm install date-fns lucide-react
```

### 3. Variables d'Environnement

```bash
# .env.local
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/university?retryWrites=true&w=majority

NEXTAUTH_SECRET=your-super-secret-key-generate-with-openssl
NEXTAUTH_URL=http://localhost:3000

RESEND_API_KEY=re_xxxxxxxxxxxx

CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

NODE_ENV=development
```

---

## Modèles Mongoose

### lib/db/models/etudiant.ts

```typescript
import mongoose, { Document, Schema } from 'mongoose';

export interface IEtudiant extends Document {
  matricule: string;
  nom: string;
  prenom: string;
  email: string;
  dateNaissance?: Date;
  telephone?: string;
  niveauEtude?: string;
  filiere?: string;
  actif: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const etudiantSchema = new Schema<IEtudiant>({
  matricule: {
    type: String,
    required: [true, 'Le matricule est obligatoire'],
    unique: true,
    trim: true,
    maxlength: [20, 'Le matricule ne peut dépasser 20 caractères']
  },
  nom: {
    type: String,
    required: [true, 'Le nom est obligatoire'],
    trim: true,
    maxlength: 100
  },
  prenom: {
    type: String,
    required: [true, 'Le prénom est obligatoire'],
    trim: true,
    maxlength: 100
  },
  email: {
    type: String,
    required: [true, 'L\'email est obligatoire'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Email invalide']
  },
  dateNaissance: Date,
  telephone: String,
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
  timestamps: true
});

// Indexes
etudiantSchema.index({ matricule: 1 });
etudiantSchema.index({ email: 1 });
etudiantSchema.index({ nom: 1, prenom: 1 });

// Virtual pour nom complet
etudiantSchema.virtual('nomComplet').get(function() {
  return `${this.prenom} ${this.nom}`;
});

export const Etudiant = mongoose.models.Etudiant || mongoose.model<IEtudiant>('Etudiant', etudiantSchema);
```

### lib/db/models/demande.ts

```typescript
import mongoose, { Document, Schema } from 'mongoose';

export type StatutCode = 'SOUMIS' | 'RECU' | 'EN_COURS' | 'ATTENTE_INFO' | 'VALIDE' | 'REJETE' | 'TRAITE' | 'ARCHIVE';
export type TypeDemandeCode = 'ATTESTATION_SCOLARITE' | 'RELEVE_NOTES' | 'ATTESTATION_REUSSITE' | 'DUPLICATA_CARTE' | 'CONVENTION_STAGE';
export type Priorite = 'BASSE' | 'NORMALE' | 'HAUTE' | 'URGENTE';

export interface IDocument {
  id: string;
  nomFichier: string;
  nomOriginal: string;
  url: string;
  typeMime: string;
  taille: number;
  categorie?: string;
  dateUpload: Date;
}

export interface IDemande extends Document {
  numeroDemande: string;
  etudiant: {
    id: mongoose.Types.ObjectId;
    nom: string;
    prenom: string;
    email: string;
    matricule: string;
  };
  typeDemande: {
    code: TypeDemandeCode;
    nom: string;
    delaiTraitement: number;
  };
  statut: {
    code: StatutCode;
    libelle: string;
    couleur: string;
  };
  objet?: string;
  description?: string;
  priorite: Priorite;
  documents: IDocument[];
  commentaireAdmin?: string;
  motifRefus?: string;
  dateTraitement?: Date;
  traiteParId?: mongoose.Types.ObjectId;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const demandeSchema = new Schema<IDemande>({
  numeroDemande: {
    type: String,
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
      enum: ['ATTESTATION_SCOLARITE', 'RELEVE_NOTES', 'ATTESTATION_REUSSITE', 'DUPLICATA_CARTE', 'CONVENTION_STAGE']
    },
    nom: { type: String, required: true },
    delaiTraitement: { type: Number, default: 5 }
  },
  statut: {
    code: {
      type: String,
      required: true,
      enum: ['SOUMIS', 'RECU', 'EN_COURS', 'ATTENTE_INFO', 'VALIDE', 'REJETE', 'TRAITE', 'ARCHIVE'],
      default: 'SOUMIS'
    },
    libelle: { type: String, required: true },
    couleur: String
  },
  objet: {
    type: String,
    maxlength: 255
  },
  description: String,
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
  timestamps: true
});

// Indexes
demandeSchema.index({ numeroDemande: 1 });
demandeSchema.index({ 'etudiant.id': 1 });
demandeSchema.index({ 'statut.code': 1 });
demandeSchema.index({ 'typeDemande.code': 1 });
demandeSchema.index({ createdAt: -1 });
demandeSchema.index({ 'etudiant.id': 1, 'statut.code': 1 });

// Pre-save hook: Generate numeroDemande
demandeSchema.pre('save', async function(next) {
  if (!this.numeroDemande) {
    const year = new Date().getFullYear();
    const count = await mongoose.models.Demande.countDocuments({
      numeroDemande: new RegExp(`^DEM-${year}-`)
    });
    this.numeroDemande = `DEM-${year}-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

export const Demande = mongoose.models.Demande || mongoose.model<IDemande>('Demande', demandeSchema);
```

---

## Workflow Engine

### lib/workflow/state-machine.ts

```typescript
import { StatutCode } from '@/lib/db/models/demande';
import { sendEmail } from '@/lib/email/send';
import { Historique } from '@/lib/db/models/historique';

// Définition des transitions possibles
export const WORKFLOW_TRANSITIONS: Record<StatutCode, StatutCode[]> = {
  SOUMIS: ['RECU'],
  RECU: ['EN_COURS', 'REJETE'],
  EN_COURS: ['ATTENTE_INFO', 'VALIDE', 'REJETE'],
  ATTENTE_INFO: ['EN_COURS', 'REJETE'],
  VALIDE: ['TRAITE'],
  REJETE: ['ARCHIVE'],
  TRAITE: ['ARCHIVE'],
  ARCHIVE: []
};

// Métadonnées des statuts
export const STATUTS_META: Record<StatutCode, { libelle: string; couleur: string; estFinal: boolean }> = {
  SOUMIS: { libelle: 'Soumis', couleur: '#6B7280', estFinal: false },
  RECU: { libelle: 'Reçu', couleur: '#3B82F6', estFinal: false },
  EN_COURS: { libelle: 'En cours', couleur: '#F59E0B', estFinal: false },
  ATTENTE_INFO: { libelle: 'En attente d\'information', couleur: '#F59E0B', estFinal: false },
  VALIDE: { libelle: 'Validé', couleur: '#10B981', estFinal: false },
  REJETE: { libelle: 'Rejeté', couleur: '#EF4444', estFinal: true },
  TRAITE: { libelle: 'Traité', couleur: '#059669', estFinal: true },
  ARCHIVE: { libelle: 'Archivé', couleur: '#6B7280', estFinal: true }
};

// Vérifier si transition valide
export function canTransition(from: StatutCode, to: StatutCode): boolean {
  return WORKFLOW_TRANSITIONS[from]?.includes(to) ?? false;
}

// Classe State Machine
export class DemandeWorkflow {
  private demande: any;
  private userId?: string;

  constructor(demande: any, userId?: string) {
    this.demande = demande;
    this.userId = userId;
  }

  async transition(newStatut: StatutCode, commentaire?: string): Promise<void> {
    const currentStatut = this.demande.statut.code;

    // Vérifier transition valide
    if (!canTransition(currentStatut, newStatut)) {
      throw new Error(`Transition invalide: ${currentStatut} → ${newStatut}`);
    }

    const oldStatut = { ...this.demande.statut };

    // Mettre à jour statut
    this.demande.statut = {
      code: newStatut,
      ...STATUTS_META[newStatut]
    };

    // Hook pre-transition
    await this.onBeforeTransition(currentStatut, newStatut);

    // Sauvegarder demande
    await this.demande.save();

    // Logger historique
    await this.logHistorique(oldStatut, commentaire);

    // Hook post-transition
    await this.onAfterTransition(currentStatut, newStatut);
  }

  private async onBeforeTransition(from: StatutCode, to: StatutCode): Promise<void> {
    // Logique avant transition
    console.log(`Transition: ${from} → ${to}`);
  }

  private async onAfterTransition(from: StatutCode, to: StatutCode): Promise<void> {
    // Règles automatiques selon transition

    if (to === 'RECU') {
      // Envoi email confirmation
      await sendEmail({
        to: this.demande.etudiant.email,
        template: 'demande-recue',
        data: {
          numeroDemande: this.demande.numeroDemande,
          etudiant: this.demande.etudiant,
          typeDemande: this.demande.typeDemande
        }
      });
    }

    if (to === 'TRAITE') {
      // Marquer date de traitement
      this.demande.dateTraitement = new Date();
      await this.demande.save();

      // Envoi email validation
      await sendEmail({
        to: this.demande.etudiant.email,
        template: 'demande-validee',
        data: {
          numeroDemande: this.demande.numeroDemande,
          etudiant: this.demande.etudiant
        }
      });
    }

    if (to === 'REJETE') {
      // Envoi email refus
      await sendEmail({
        to: this.demande.etudiant.email,
        template: 'demande-rejetee',
        data: {
          numeroDemande: this.demande.numeroDemande,
          etudiant: this.demande.etudiant,
          motifRefus: this.demande.motifRefus || 'Non spécifié'
        }
      });
    }

    if (to === 'ATTENTE_INFO') {
      // Envoi email demande info
      await sendEmail({
        to: this.demande.etudiant.email,
        template: 'demande-info',
        data: {
          numeroDemande: this.demande.numeroDemande,
          etudiant: this.demande.etudiant,
          commentaire: this.demande.commentaireAdmin
        }
      });
    }
  }

  private async logHistorique(oldStatut: any, commentaire?: string): Promise<void> {
    await Historique.create({
      demandeId: this.demande._id,
      numeroDemandeRef: this.demande.numeroDemande,
      statutAncien: oldStatut,
      statutNouveau: this.demande.statut,
      utilisateur: {
        id: this.userId,
        nom: 'User', // Récupérer depuis session
        role: 'ADMIN'
      },
      typeAction: 'CHANGEMENT_STATUT',
      commentaire
    });
  }
}
```

### lib/workflow/rules.ts

```typescript
import { IDemande, StatutCode } from '@/lib/db/models/demande';

// Règle: Auto-transition SOUMIS → RECU à la création
export async function autoTransitionToRecu(demande: IDemande): Promise<void> {
  if (demande.statut.code === 'SOUMIS') {
    const workflow = new DemandeWorkflow(demande);
    await workflow.transition('RECU', 'Transition automatique');
  }
}

// Règle: Priorité URGENTE si délai proche
export function calculatePriorite(demande: IDemande): 'BASSE' | 'NORMALE' | 'HAUTE' | 'URGENTE' {
  const delai = demande.typeDemande.delaiTraitement;

  if (demande.metadata.dateEcheance) {
    const joursRestants = Math.ceil(
      (new Date(demande.metadata.dateEcheance).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    if (joursRestants <= 2) return 'URGENTE';
    if (joursRestants <= 5) return 'HAUTE';
  }

  return 'NORMALE';
}

// Règle: Validation automatique si conditions remplies
export function canAutoValidate(demande: IDemande): boolean {
  return (
    demande.documents.length > 0 &&
    demande.description &&
    demande.description.length >= 20
  );
}
```

---

## Server Actions

### actions/demandes.ts

```typescript
'use server';

import { revalidatePath } from 'next/cache';
import connectDB from '@/lib/db/mongodb';
import { Demande } from '@/lib/db/models/demande';
import { Etudiant } from '@/lib/db/models/etudiant';
import { DemandeWorkflow } from '@/lib/workflow/state-machine';
import { z } from 'zod';

// Schema validation
const createDemandeSchema = z.object({
  typeDemandeCode: z.enum(['ATTESTATION_SCOLARITE', 'RELEVE_NOTES', 'ATTESTATION_REUSSITE', 'DUPLICATA_CARTE', 'CONVENTION_STAGE']),
  objet: z.string().min(10).max(255),
  description: z.string().min(20),
  priorite: z.enum(['BASSE', 'NORMALE', 'HAUTE', 'URGENTE']).default('NORMALE'),
  metadata: z.record(z.any()).optional()
});

export async function createDemande(etudiantId: string, data: z.infer<typeof createDemandeSchema>) {
  try {
    // Validation
    const validated = createDemandeSchema.parse(data);

    await connectDB();

    // Récupérer étudiant
    const etudiant = await Etudiant.findById(etudiantId);
    if (!etudiant) {
      throw new Error('Étudiant non trouvé');
    }

    // Définir type demande
    const typesDemandes = {
      ATTESTATION_SCOLARITE: { nom: 'Attestation de scolarité', delaiTraitement: 3 },
      RELEVE_NOTES: { nom: 'Relevé de notes', delaiTraitement: 5 },
      ATTESTATION_REUSSITE: { nom: 'Attestation de réussite', delaiTraitement: 5 },
      DUPLICATA_CARTE: { nom: 'Duplicata carte étudiant', delaiTraitement: 7 },
      CONVENTION_STAGE: { nom: 'Convention de stage', delaiTraitement: 3 }
    };

    // Créer demande
    const demande = await Demande.create({
      etudiant: {
        id: etudiant._id,
        nom: etudiant.nom,
        prenom: etudiant.prenom,
        email: etudiant.email,
        matricule: etudiant.matricule
      },
      typeDemande: {
        code: validated.typeDemandeCode,
        ...typesDemandes[validated.typeDemandeCode]
      },
      statut: {
        code: 'SOUMIS',
        libelle: 'Soumis',
        couleur: '#6B7280'
      },
      objet: validated.objet,
      description: validated.description,
      priorite: validated.priorite,
      metadata: validated.metadata || {}
    });

    // Auto-transition vers RECU
    const workflow = new DemandeWorkflow(demande);
    await workflow.transition('RECU', 'Soumission automatique');

    revalidatePath('/dashboard');
    revalidatePath('/demandes');

    return {
      success: true,
      data: {
        id: demande._id.toString(),
        numeroDemande: demande.numeroDemande
      }
    };
  } catch (error) {
    console.error('Erreur création demande:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    };
  }
}

export async function updateStatut(
  demandeId: string,
  newStatut: string,
  commentaire?: string,
  motifRefus?: string
) {
  try {
    await connectDB();

    const demande = await Demande.findById(demandeId);
    if (!demande) {
      throw new Error('Demande non trouvée');
    }

    // Mettre à jour champs additionnels
    if (commentaire) {
      demande.commentaireAdmin = commentaire;
    }
    if (motifRefus && newStatut === 'REJETE') {
      demande.motifRefus = motifRefus;
    }

    // Transition workflow
    const workflow = new DemandeWorkflow(demande);
    await workflow.transition(newStatut as any, commentaire);

    revalidatePath('/admin/demandes');
    revalidatePath(`/admin/demandes/${demandeId}`);

    return { success: true };
  } catch (error) {
    console.error('Erreur update statut:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    };
  }
}

export async function getDemandesByEtudiant(etudiantId: string) {
  try {
    await connectDB();

    const demandes = await Demande.find({ 'etudiant.id': etudiantId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return {
      success: true,
      data: demandes
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
      data: []
    };
  }
}
```

---

## API Routes

### app/api/demandes/route.ts

```typescript
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { Demande } from '@/lib/db/models/demande';
import { getServerSession } from 'next-auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const statut = searchParams.get('statut');
    const type = searchParams.get('type');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Build query
    const query: any = {};
    if (statut) query['statut.code'] = statut;
    if (type) query['typeDemande.code'] = type;

    // Execute query
    const demandes = await Demande.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const total = await Demande.countDocuments(query);

    return NextResponse.json({
      success: true,
      data: demandes,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('GET /api/demandes error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
```

### app/api/upload/route.ts

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const demandeId = formData.get('demandeId') as string;

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Type de fichier non autorisé' }, { status: 400 });
    }

    // Validate file size (5 MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Fichier trop volumineux (max 5 MB)' }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: `demandes/${demandeId}`,
          resource_type: 'auto'
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(buffer);
    });

    return NextResponse.json({
      success: true,
      data: {
        id: (result as any).public_id,
        url: (result as any).secure_url,
        nomFichier: file.name,
        typeMime: file.type,
        taille: file.size
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur upload' },
      { status: 500 }
    );
  }
}
```

---

## Composants UI

### components/forms/new-demande-form.tsx

```typescript
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { createDemande } from '@/actions/demandes';
import { useRouter } from 'next/navigation';

const formSchema = z.object({
  typeDemandeCode: z.enum(['ATTESTATION_SCOLARITE', 'RELEVE_NOTES', 'ATTESTATION_REUSSITE', 'DUPLICATA_CARTE', 'CONVENTION_STAGE']),
  objet: z.string().min(10, 'Minimum 10 caractères').max(255),
  description: z.string().min(20, 'Minimum 20 caractères'),
  priorite: z.enum(['BASSE', 'NORMALE', 'HAUTE', 'URGENTE']).default('NORMALE')
});

export function NewDemandeForm({ etudiantId }: { etudiantId: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      priorite: 'NORMALE'
    }
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const result = await createDemande(etudiantId, values);

      if (result.success) {
        router.push(`/demandes/${result.data.id}`);
      } else {
        alert(`Erreur: ${result.error}`);
      }
    } catch (error) {
      alert('Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="typeDemandeCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type de demande</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="ATTESTATION_SCOLARITE">Attestation de scolarité</SelectItem>
                  <SelectItem value="RELEVE_NOTES">Relevé de notes</SelectItem>
                  <SelectItem value="ATTESTATION_REUSSITE">Attestation de réussite</SelectItem>
                  <SelectItem value="DUPLICATA_CARTE">Duplicata carte étudiant</SelectItem>
                  <SelectItem value="CONVENTION_STAGE">Convention de stage</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="objet"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Objet</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Demande d'attestation pour dossier CAF" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Décrivez votre demande en détail..."
                  rows={5}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="priorite"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Priorité</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="BASSE">Basse</SelectItem>
                  <SelectItem value="NORMALE">Normale</SelectItem>
                  <SelectItem value="HAUTE">Haute</SelectItem>
                  <SelectItem value="URGENTE">Urgente</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? 'Envoi en cours...' : 'Soumettre la demande'}
        </Button>
      </form>
    </Form>
  );
}
```

---

## Règles d'Automatisation

### Pseudo-code des Règles

```typescript
// RÈGLE 1: À la soumission
WHEN demande.status === 'SOUMIS'
THEN:
  - SET demande.status = 'RECU'
  - SEND email_confirmation TO demande.etudiant.email
  - LOG historique {
      action: 'CHANGEMENT_STATUT',
      old: 'SOUMIS',
      new: 'RECU',
      user: 'SYSTEM'
    }
  - CREATE notification {
      type: 'EMAIL',
      destinataire: demande.etudiant.email,
      template: 'confirmation'
    }

// RÈGLE 2: Après validation
WHEN demande.status CHANGED TO 'VALIDE'
THEN:
  - SET demande.status = 'TRAITE'
  - SET demande.dateTraitement = NOW()
  - SEND email_validation TO demande.etudiant.email
  - GENERATE PDF_document
  - LOG historique
  - UPDATE statistics

// RÈGLE 3: En cas de refus
WHEN demande.status CHANGED TO 'REJETE'
THEN:
  - REQUIRE demande.motifRefus IS NOT NULL
  - SEND email_refus TO demande.etudiant.email WITH motif
  - LOG historique
  - NOTIFY admin IF refus_count > 3 FOR same_etudiant

// RÈGLE 4: Priorité automatique
WHEN demande.metadata.dateEcheance IS SET
THEN:
  - CALCULATE jours_restants = dateEcheance - NOW()
  - IF jours_restants <= 2 THEN priorite = 'URGENTE'
  - IF jours_restants <= 5 THEN priorite = 'HAUTE'
  - ELSE priorite = 'NORMALE'

// RÈGLE 5: Rappels automatiques
EVERY DAY AT 09:00
FOR EACH demande WHERE:
  - status IN ['EN_COURS', 'ATTENTE_INFO']
  - createdAt < NOW() - typeDemande.delaiTraitement DAYS
DO:
  - SEND email_rappel TO admin
  - INCREMENT priorite IF not already 'URGENTE'

// RÈGLE 6: Archivage automatique
EVERY MONTH
FOR EACH demande WHERE:
  - status IN ['TRAITE', 'REJETE']
  - dateTraitement < NOW() - 6 MONTHS
DO:
  - SET status = 'ARCHIVE'
  - MOVE documents TO archive_storage
  - LOG historique
```

### Implémentation Réelle

```typescript
// lib/cron/rules.ts

// Règle: Rappels pour demandes en retard
export async function sendDelayReminders() {
  const demandes = await Demande.find({
    'statut.code': { $in: ['EN_COURS', 'ATTENTE_INFO'] },
    createdAt: { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // 7 jours
  });

  for (const demande of demandes) {
    await sendEmail({
      to: 'admin@university.edu',
      template: 'rappel-retard',
      data: {
        numeroDemande: demande.numeroDemande,
        etudiant: demande.etudiant,
        joursRetard: Math.floor((Date.now() - demande.createdAt.getTime()) / (1000 * 60 * 60 * 24))
      }
    });
  }
}

// Règle: Archivage automatique
export async function autoArchive() {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const demandes = await Demande.find({
    'statut.code': { $in: ['TRAITE', 'REJETE'] },
    dateTraitement: { $lt: sixMonthsAgo }
  });

  for (const demande of demandes) {
    const workflow = new DemandeWorkflow(demande);
    await workflow.transition('ARCHIVE', 'Archivage automatique après 6 mois');
  }
}
```

---

## Tests

### tests/workflow.test.ts

```typescript
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import mongoose from 'mongoose';
import { Demande } from '@/lib/db/models/demande';
import { DemandeWorkflow, canTransition } from '@/lib/workflow/state-machine';

describe('Workflow Engine', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI_TEST!);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('should allow valid transitions', () => {
    expect(canTransition('SOUMIS', 'RECU')).toBe(true);
    expect(canTransition('RECU', 'EN_COURS')).toBe(true);
    expect(canTransition('EN_COURS', 'VALIDE')).toBe(true);
  });

  it('should reject invalid transitions', () => {
    expect(canTransition('SOUMIS', 'TRAITE')).toBe(false);
    expect(canTransition('ARCHIVE', 'EN_COURS')).toBe(false);
  });

  it('should transition demande successfully', async () => {
    const demande = await Demande.create({
      etudiant: {
        id: new mongoose.Types.ObjectId(),
        nom: 'Test',
        prenom: 'User',
        email: 'test@test.com',
        matricule: '2024999'
      },
      typeDemande: {
        code: 'ATTESTATION_SCOLARITE',
        nom: 'Attestation',
        delaiTraitement: 3
      },
      statut: {
        code: 'SOUMIS',
        libelle: 'Soumis',
        couleur: '#6B7280'
      },
      priorite: 'NORMALE'
    });

    const workflow = new DemandeWorkflow(demande);
    await workflow.transition('RECU');

    expect(demande.statut.code).toBe('RECU');
  });
});
```

---

Ce guide fournit les bases pour implémenter le prototype. Chaque section peut être étendue selon les besoins spécifiques du projet.
