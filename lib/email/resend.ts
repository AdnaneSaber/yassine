import { Resend } from 'resend';
import { Types } from 'mongoose';
import type { SendEmailOptions, EmailServiceResponse } from '@/types/email';
import { Notification } from '@/lib/db/models/notification';

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

// Default "from" email address
const FROM_EMAIL = process.env.EMAIL_FROM || 'noreply@universite.tn';
const UNIVERSITY_NAME = 'Université de Tunis';

/**
 * Send an email using Resend and save notification to database
 * @param options Email sending options
 * @returns EmailServiceResponse with success status and message ID or error
 */
export async function sendEmail(
  options: SendEmailOptions
): Promise<EmailServiceResponse> {
  const { to, subject, html, templateType, demandeId, cc, bcc } = options;

  try {
    // Validate required environment variables
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not configured');
    }

    // Create notification record in database (EN_ATTENTE status)
    const notification = await Notification.create({
      demandeId: new Types.ObjectId(demandeId),
      type: 'EMAIL',
      destinataire: to,
      sujet: subject,
      contenu: html,
      templateUtilise: templateType,
      statutEnvoi: 'EN_ATTENTE',
      nbTentatives: 0
    });

    // Send email via Resend
    const emailPayload: {
      from: string;
      to: string[];
      subject: string;
      html: string;
      cc?: string[];
      bcc?: string[];
    } = {
      from: FROM_EMAIL,
      to: [to],
      subject: subject,
      html: html
    };

    if (cc && cc.length > 0) {
      emailPayload.cc = cc;
    }

    if (bcc && bcc.length > 0) {
      emailPayload.bcc = bcc;
    }

    const result = await resend.emails.send(emailPayload);

    // Update notification with success status
    notification.statutEnvoi = 'ENVOYE';
    notification.dateEnvoi = new Date();
    notification.nbTentatives = 1;
    await notification.save();

    return {
      success: true,
      messageId: result.data?.id
    };
  } catch (error) {
    // Log error
    console.error('Email sending error:', error);

    // Try to update notification with error status if it was created
    try {
      const existingNotification = await Notification.findOne({
        demandeId: new Types.ObjectId(demandeId),
        destinataire: to,
        templateUtilise: templateType
      }).sort({ createdAt: -1 });

      if (existingNotification) {
        existingNotification.statutEnvoi = 'ECHEC';
        existingNotification.nbTentatives += 1;
        existingNotification.erreur = error instanceof Error ? error.message : 'Unknown error';
        await existingNotification.save();
      }
    } catch (updateError) {
      console.error('Error updating notification:', updateError);
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Retry sending a failed email notification
 * @param notificationId The notification ID to retry
 * @returns EmailServiceResponse with success status
 */
export async function retryEmail(
  notificationId: string
): Promise<EmailServiceResponse> {
  try {
    const notification = await Notification.findById(notificationId);

    if (!notification) {
      return {
        success: false,
        error: 'Notification not found'
      };
    }

    if (notification.statutEnvoi === 'ENVOYE') {
      return {
        success: false,
        error: 'Email already sent successfully'
      };
    }

    // Attempt to resend
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: [notification.destinataire],
      subject: notification.sujet || 'Notification',
      html: notification.contenu
    });

    // Update notification
    notification.statutEnvoi = 'ENVOYE';
    notification.dateEnvoi = new Date();
    notification.nbTentatives += 1;
    notification.erreur = undefined;
    await notification.save();

    return {
      success: true,
      messageId: result.data?.id
    };
  } catch (error) {
    console.error('Email retry error:', error);

    // Update notification with new attempt
    try {
      const notification = await Notification.findById(notificationId);
      if (notification) {
        notification.statutEnvoi = 'ECHEC';
        notification.nbTentatives += 1;
        notification.erreur = error instanceof Error ? error.message : 'Unknown error';
        await notification.save();
      }
    } catch (updateError) {
      console.error('Error updating notification on retry:', updateError);
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Get email statistics for a specific demande
 * @param demandeId The demande ID
 * @returns Email statistics
 */
export async function getEmailStats(demandeId: string) {
  try {
    const notifications = await Notification.find({
      demandeId: new Types.ObjectId(demandeId),
      type: 'EMAIL'
    });

    return {
      total: notifications.length,
      envoye: notifications.filter(n => n.statutEnvoi === 'ENVOYE').length,
      enAttente: notifications.filter(n => n.statutEnvoi === 'EN_ATTENTE').length,
      echec: notifications.filter(n => n.statutEnvoi === 'ECHEC').length
    };
  } catch (error) {
    console.error('Error getting email stats:', error);
    return {
      total: 0,
      envoye: 0,
      enAttente: 0,
      echec: 0
    };
  }
}

export { UNIVERSITY_NAME, FROM_EMAIL };
