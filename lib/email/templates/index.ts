/**
 * Email Templates Index
 * Exports all email templates for different demande statuses
 */

import { demandeRecueTemplate } from './demande-recue';
import { demandeEnCoursTemplate } from './demande-en-cours';
import { demandeValideeTemplate } from './demande-validee';
import { demandeTraiteeTemplate } from './demande-traitee';
import { demandeRejeteeTemplate } from './demande-rejetee';
import { demandeAttenteInfoTemplate } from './demande-attente-info';
import type { EmailTemplate, EmailTemplateType } from '@/types/email';
import type { DemandeStatus } from '@/types/database';

// Export individual templates
export {
  demandeRecueTemplate,
  demandeEnCoursTemplate,
  demandeValideeTemplate,
  demandeTraiteeTemplate,
  demandeRejeteeTemplate,
  demandeAttenteInfoTemplate
};

// Map of status to template
export const EMAIL_TEMPLATES: Record<EmailTemplateType, EmailTemplate> = {
  'demande-recue': demandeRecueTemplate,
  'demande-en-cours': demandeEnCoursTemplate,
  'demande-validee': demandeValideeTemplate,
  'demande-traitee': demandeTraiteeTemplate,
  'demande-rejetee': demandeRejeteeTemplate,
  'demande-attente-info': demandeAttenteInfoTemplate
};

// Map of demande status to email template type
export const STATUS_TO_TEMPLATE: Partial<Record<DemandeStatus, EmailTemplateType>> = {
  RECU: 'demande-recue',
  EN_COURS: 'demande-en-cours',
  VALIDE: 'demande-validee',
  TRAITE: 'demande-traitee',
  REJETE: 'demande-rejetee',
  ATTENTE_INFO: 'demande-attente-info'
};

/**
 * Get the appropriate email template for a given demande status
 * @param status The demande status
 * @returns The email template function or undefined if no template exists for this status
 */
export function getTemplateForStatus(status: DemandeStatus): EmailTemplate | undefined {
  const templateType = STATUS_TO_TEMPLATE[status];
  return templateType ? EMAIL_TEMPLATES[templateType] : undefined;
}

/**
 * Check if an email should be sent for a given status transition
 * @param status The new demande status
 * @returns True if an email should be sent
 */
export function shouldSendEmailForStatus(status: DemandeStatus): boolean {
  return status in STATUS_TO_TEMPLATE;
}
