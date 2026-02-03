import type { DemandeStatus, TypeDemandeCode } from './database';

// Email template types
export type EmailTemplateType =
  | 'demande-recue'
  | 'demande-en-cours'
  | 'demande-validee'
  | 'demande-traitee'
  | 'demande-rejetee'
  | 'demande-attente-info';

// Email data interface for templates
export interface EmailData {
  // Student information
  prenom: string;
  nom: string;
  email: string;

  // Request information
  demandeId: string; // MongoDB ObjectId for URL links
  numeroDemande: string;
  typeDemande: string;
  typeDemandeCode: TypeDemandeCode;
  objet: string;
  dateSoumission: Date;

  // Status information
  statut: DemandeStatus;
  statutLibelle: string;

  // Optional fields depending on status
  commentaireAdmin?: string;
  motifRefus?: string;
  dateTraitement?: Date;
  delaiEstime?: number; // in days
  prochaineDateLimite?: Date;
}

// Email template function signature
export type EmailTemplate = (data: EmailData) => EmailTemplateResult;

// Email template result
export interface EmailTemplateResult {
  subject: string;
  html: string;
}

// Email sending options
export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  templateType: EmailTemplateType;
  demandeId: string;
}

// Email service response
export interface EmailServiceResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}
