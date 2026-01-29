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
  _id?: Types.ObjectId | string;
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
