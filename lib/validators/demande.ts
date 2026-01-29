import { z } from 'zod';

// Create Demande Schema
export const createDemandeSchema = z.object({
  typeDemande: z.enum([
    'ATTESTATION_SCOLARITE',
    'RELEVE_NOTES',
    'ATTESTATION_REUSSITE',
    'DUPLICATA_CARTE',
    'CONVENTION_STAGE'
  ], 'Le type de demande est requis'),
  objet: z.string()
    .min(10, "L'objet doit contenir au moins 10 caractères")
    .max(255, "L'objet ne peut pas dépasser 255 caractères"),
  description: z.string()
    .min(20, 'La description doit contenir au moins 20 caractères'),
  priorite: z.enum(['BASSE', 'NORMALE', 'HAUTE', 'URGENTE']).default('NORMALE')
});

export type CreateDemandeInput = z.infer<typeof createDemandeSchema>;

// Update Demande Schema
export const updateDemandeSchema = createDemandeSchema.partial();

export type UpdateDemandeInput = z.infer<typeof updateDemandeSchema>;

// Query Demandes Schema
export const queryDemandesSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  statut: z.enum([
    'SOUMIS',
    'RECU',
    'EN_COURS',
    'ATTENTE_INFO',
    'VALIDE',
    'REJETE',
    'TRAITE',
    'ARCHIVE'
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

// Transition Demande Schema
export const transitionDemandeSchema = z.object({
  newStatut: z.enum([
    'RECU',
    'EN_COURS',
    'ATTENTE_INFO',
    'VALIDE',
    'REJETE',
    'TRAITE',
    'ARCHIVE'
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
