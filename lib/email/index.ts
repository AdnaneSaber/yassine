/**
 * Email Service Module
 * Main entry point for email functionality
 */

import { sendEmail, retryEmail, getEmailStats } from './resend';
import { getTemplateForStatus, shouldSendEmailForStatus, STATUS_TO_TEMPLATE } from './templates';
import type { EmailData, EmailServiceResponse } from '@/types/email';
import type { IDemandeDocument } from '@/types/database';

// Re-export core functions
export { sendEmail, retryEmail, getEmailStats };
export { getTemplateForStatus, shouldSendEmailForStatus, STATUS_TO_TEMPLATE };

/**
 * Send an email notification for a demande status change
 * @param demande The demande document
 * @returns EmailServiceResponse with success status
 */
export async function sendDemandeStatusEmail(
  demande: IDemandeDocument
): Promise<EmailServiceResponse> {
  try {
    // Check if we should send an email for this status
    if (!shouldSendEmailForStatus(demande.statut.code)) {
      return {
        success: false,
        error: `No email template defined for status: ${demande.statut.code}`
      };
    }

    // Get the appropriate template
    const template = getTemplateForStatus(demande.statut.code);
    if (!template) {
      return {
        success: false,
        error: `Template not found for status: ${demande.statut.code}`
      };
    }

    // Prepare email data
    const emailData: EmailData = {
      prenom: demande.etudiant.prenom,
      nom: demande.etudiant.nom,
      email: demande.etudiant.email,
      numeroDemande: demande.numeroDemande,
      typeDemande: demande.typeDemande.nom,
      typeDemandeCode: demande.typeDemande.code,
      objet: demande.objet,
      dateSoumission: demande.createdAt,
      statut: demande.statut.code,
      statutLibelle: demande.statut.libelle,
      commentaireAdmin: demande.commentaireAdmin,
      motifRefus: demande.motifRefus,
      dateTraitement: demande.dateTraitement,
      delaiEstime: demande.typeDemande.delaiTraitement
    };

    // Generate email content from template
    const { subject, html } = template(emailData);

    // Get template type for this status
    const templateType = STATUS_TO_TEMPLATE[demande.statut.code];
    if (!templateType) {
      return {
        success: false,
        error: `Template type not found for status: ${demande.statut.code}`
      };
    }

    // Send email
    const result = await sendEmail({
      to: demande.etudiant.email,
      subject,
      html,
      templateType,
      demandeId: demande._id?.toString() || ''
    });

    return result;
  } catch (error) {
    console.error('Error sending demande status email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Send a custom email for a demande (for manual notifications)
 * @param demandeId The demande ID
 * @param to Recipient email address
 * @param subject Email subject
 * @param html Email HTML content
 * @returns EmailServiceResponse with success status
 */
export async function sendCustomDemandeEmail(
  demandeId: string,
  to: string,
  subject: string,
  html: string
): Promise<EmailServiceResponse> {
  try {
    const result = await sendEmail({
      to,
      subject,
      html,
      templateType: 'demande-en-cours', // Use generic template type
      demandeId
    });

    return result;
  } catch (error) {
    console.error('Error sending custom email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}
