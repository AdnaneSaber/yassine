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
