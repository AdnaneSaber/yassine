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
  hashPassword: {
    type: String,
    required: true,
    select: false // Don't return password by default
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
