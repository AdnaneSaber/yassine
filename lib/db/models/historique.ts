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
