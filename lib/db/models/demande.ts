import mongoose, { Schema } from 'mongoose';
import type { IDemande, IDemandeDocument, DemandeStatus, Priorite, TypeDemandeCode } from '@/types/database';

const demandeSchema = new Schema<IDemandeDocument>({
  numeroDemande: {
    type: String,
    unique: true
    // Not required here - will be auto-generated in pre-save hook
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
    couleur: { type: String },
    estFinal: { type: Boolean }
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
  },
  actif: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  collection: 'demandes'
});

// Pre-save middleware: Auto-generate numeroDemande
demandeSchema.pre('save', async function() {
  if (!this.numeroDemande) {
    const year = new Date().getFullYear();
    const Model = this.constructor as any;
    const count = await Model.countDocuments({
      numeroDemande: new RegExp(`^DEM-${year}-`)
    });
    this.numeroDemande = `DEM-${year}-${String(count + 1).padStart(6, '0')}`;
  }
});

// Indexes
demandeSchema.index({ numeroDemande: 1 });
demandeSchema.index({ 'etudiant.id': 1 });
demandeSchema.index({ 'statut.code': 1 });
demandeSchema.index({ 'typeDemande.code': 1 });
demandeSchema.index({ createdAt: -1 });
demandeSchema.index({ 'etudiant.id': 1, 'statut.code': 1 }); // Compound index

export const Demande = mongoose.models.Demande || mongoose.model<IDemandeDocument>('Demande', demandeSchema);
