import { error } from 'console';
import { z } from 'zod';

// Type Demande Enum with custom error message
const TypeDemandeEnum = z.enum([
  'ATTESTATION_SCOLARITE',
  'RELEVE_NOTES',
  'ATTESTATION_REUSSITE',
  'DUPLICATA_CARTE',
  'CONVENTION_STAGE'
], {
  message: 'Veuillez sélectionner un type de demande valide'
});

// Priorite Enum with custom error message
const PrioriteEnum = z.enum(['BASSE', 'NORMALE', 'HAUTE', 'URGENTE'], {
  message: 'Veuillez sélectionner une priorité valide'
});

// Statut Enum with custom error message
const StatutEnum = z.enum([
  'SOUMIS',
  'RECU',
  'EN_COURS',
  'ATTENTE_INFO',
  'VALIDE',
  'REJETE',
  'TRAITE',
  'ARCHIVE'
], {
  message: 'Veuillez sélectionner un statut valide'
});

// Statut Transition Enum (excludes SOUMIS as it's initial state only)
const StatutTransitionEnum = z.enum([
  'RECU',
  'EN_COURS',
  'ATTENTE_INFO',
  'VALIDE',
  'REJETE',
  'TRAITE',
  'ARCHIVE'
], {
  message: 'Veuillez sélectionner un statut de transition valide'
});

// Helper function to normalize whitespace
const normalizeString = (str: string) => str.trim().replace(/\s+/g, ' ');

// Create Demande Schema with enhanced validation
export const createDemandeSchema = z.object({
  typeDemande: TypeDemandeEnum,
  objet: z.string({
    error: "L'objet de la demande est requis",
  })
    .min(1, "L'objet ne peut pas être vide")
    .transform(normalizeString)
    .pipe(
      z.string()
        .min(5, "L'objet doit contenir au moins 5 caractères")
        .max(255, "L'objet ne peut pas dépasser 255 caractères")
        .regex(/^[a-zA-ZÀ-ÿ0-9\s\-',.:!?()]+$/, "L'objet contient des caractères non autorisés")
    ),
  description: z.string({
    error: 'La description est requise',
  })
    .min(1, 'La description ne peut pas être vide')
    .transform(normalizeString)
    .pipe(
      z.string()
        .min(10, 'La description doit contenir au moins 10 caractères')
        .max(2000, 'La description ne peut pas dépasser 2000 caractères')
    ),
  priorite: PrioriteEnum.default('NORMALE')
})
  .strict()
  .refine(
    (data) => {
      // Validate that objet and description are not the same
      return data.objet.toLowerCase() !== data.description.toLowerCase().substring(0, data.objet.length);
    },
    {
      message: "L'objet et la description ne peuvent pas être identiques",
      path: ['objet']
    }
  );

// Use Zod's input type here so form libraries (resolver) receive the
// pre-transform/default shape. This prevents optional/default mismatches
// between `zodResolver` and the generic used with `useForm`.
export type CreateDemandeInput = z.input<typeof createDemandeSchema>;

// Update Demande Schema with partial fields
export const updateDemandeSchema = z.object({
  typeDemande: TypeDemandeEnum.optional(),
  objet: z.string()
    .min(1, "L'objet ne peut pas être vide")
    .transform(normalizeString)
    .pipe(
      z.string()
        .min(5, "L'objet doit contenir au moins 5 caractères")
        .max(255, "L'objet ne peut pas dépasser 255 caractères")
        .regex(/^[a-zA-ZÀ-ÿ0-9\s\-',.:!?()]+$/, "L'objet contient des caractères non autorisés")
    )
    .optional(),
  description: z.string()
    .min(1, 'La description ne peut pas être vide')
    .transform(normalizeString)
    .pipe(
      z.string()
        .min(10, 'La description doit contenir au moins 10 caractères')
        .max(2000, 'La description ne peut pas dépasser 2000 caractères')
    )
    .optional(),
  priorite: PrioriteEnum.optional()
})
  .strict();

export type UpdateDemandeInput = z.infer<typeof updateDemandeSchema>;

// Query Demandes Schema with enhanced validation
export const queryDemandesSchema = z.object({
  page: z.preprocess(
    (val) => (val === null || val === undefined || val === '') ? undefined : Number(val),
    z.number().int('Le numéro de page doit être un entier').positive('Le numéro de page doit être positif').default(1)
  ),
  limit: z.preprocess(
    (val) => (val === null || val === undefined || val === '') ? undefined : Number(val),
    z.number().int('La limite doit être un entier').min(1, 'La limite doit être au moins 1').max(100, 'La limite ne peut pas dépasser 100').default(20)
  ),
  statut: z.preprocess(
    (val) => (val === null || val === undefined || val === '') ? undefined : val,
    StatutEnum.optional()
  ),
  priorite: z.preprocess(
    (val) => (val === null || val === undefined || val === '') ? undefined : val,
    PrioriteEnum.optional()
  ),
  typeDemande: z.preprocess(
    (val) => (val === null || val === undefined || val === '') ? undefined : val,
    TypeDemandeEnum.optional()
  ),
  sortBy: z.preprocess(
    (val) => (val === null || val === undefined || val === '') ? undefined : val,
    z.string().regex(/^-?(createdAt|updatedAt|numeroDemande|priorite|statut)$/, 'Tri invalide').default('-createdAt')
  ),
  search: z.preprocess(
    (val) => (val === null || val === undefined || val === '') ? undefined : val,
    z.string()
      .transform(normalizeString)
      .pipe(
        z.string()
          .min(2, 'La recherche doit contenir au moins 2 caractères')
          .max(100, 'La recherche ne peut pas dépasser 100 caractères')
      )
      .optional()
  )
})
  .strict();

export type QueryDemandesInput = z.infer<typeof queryDemandesSchema>;

// Transition Demande Schema with enhanced validation
export const transitionDemandeSchema = z.object({
  newStatut: StatutTransitionEnum,
  commentaire: z.string()
    .transform(normalizeString)
    .pipe(
      z.string()
        .min(10, 'Le commentaire doit contenir au moins 10 caractères')
        .max(1000, 'Le commentaire ne peut pas dépasser 1000 caractères')
    )
    .optional(),
  motifRefus: z.string()
    .transform(normalizeString)
    .pipe(
      z.string()
        .min(20, 'Le motif de refus doit contenir au moins 20 caractères')
        .max(500, 'Le motif de refus ne peut pas dépasser 500 caractères')
    )
    .optional(),
  traiteParId: z.string({
    error: "L'identifiant du traitant doit être une chaîne de caractères"
  })
    .regex(/^[a-f\d]{24}$/i, "L'identifiant du traitant n'est pas valide")
    .optional()
})
  .strict()
  .refine(
    (data) => {
      // If status is REJETE, motifRefus is required
      if (data.newStatut === 'REJETE' && !data.motifRefus) {
        return false;
      }
      return true;
    },
    {
      message: 'Le motif de refus est obligatoire pour un rejet',
      path: ['motifRefus']
    }
  );

export type TransitionDemandeInput = z.infer<typeof transitionDemandeSchema>;

// File upload validation with enhanced rules
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

export const fileUploadSchema = z.object({
  file: z.instanceof(File, { message: 'Un fichier doit être fourni' })
    .refine(
      (file) => file.size <= MAX_FILE_SIZE,
      {
        message: `La taille du fichier ne doit pas dépasser ${MAX_FILE_SIZE / 1024 / 1024}MB`
      }
    )
    .refine(
      (file) => ACCEPTED_FILE_TYPES.includes(file.type),
      {
        message: 'Le type de fichier n\'est pas accepté. Formats acceptés: PDF, JPEG, PNG, DOC, DOCX'
      }
    ),
  categorie: z.string()
    .min(1, 'La catégorie ne peut pas être vide')
    .max(50, 'La catégorie ne peut pas dépasser 50 caractères')
    .optional(),
  description: z.string()
    .transform(normalizeString)
    .pipe(
      z.string()
        .min(5, 'La description du fichier doit contenir au moins 5 caractères')
        .max(200, 'La description du fichier ne peut pas dépasser 200 caractères')
    )
    .optional()
})
  .strict();

export type FileUploadInput = z.infer<typeof fileUploadSchema>;

// Commentaire Schema for adding comments to demandes
export const commentaireSchema = z.object({
  contenu: z.string({
    error: 'Le contenu du commentaire est requis',
  })
    .min(1, 'Le commentaire ne peut pas être vide')
    .transform(normalizeString)
    .pipe(
      z.string()
        .min(5, 'Le commentaire doit contenir au moins 5 caractères')
        .max(1000, 'Le commentaire ne peut pas dépasser 1000 caractères')
    ),
  isInternal: z.boolean({
    error: 'isInternal doit être un booléen'
  }).default(false)
})
  .strict();

export type CommentaireInput = z.infer<typeof commentaireSchema>;
