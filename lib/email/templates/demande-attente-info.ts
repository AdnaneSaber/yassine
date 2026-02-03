import type { EmailTemplate, EmailTemplateResult } from '@/types/email';

/**
 * Email template for "Demande En Attente d'Information" status
 * Sent when additional information is required from the student
 */
export const demandeAttenteInfoTemplate: EmailTemplate = (data): EmailTemplateResult => {
  const { prenom, nom, demandeId, numeroDemande, typeDemande, commentaireAdmin, prochaineDateLimite } = data;

  const formattedDeadline = prochaineDateLimite
    ? new Date(prochaineDateLimite).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      })
    : '';

  const subject = `⚠️ Action requise : Votre demande ${numeroDemande}`;

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 20px 0; text-align: center; background-color: #1e40af;">
        <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
          Université de Tunis
        </h1>
        <p style="margin: 5px 0 0 0; color: #e0e7ff; font-size: 14px;">
          Service de Gestion des Demandes Académiques
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding: 0;">
        <table role="presentation" style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-collapse: collapse;">
          <!-- Alert Icon -->
          <tr>
            <td style="padding: 40px 30px 20px 30px; text-align: center;">
              <div style="display: inline-block; width: 80px; height: 80px; background-color: #fef3c7; border-radius: 50%; line-height: 80px;">
                <span style="font-size: 40px;">⚠️</span>
              </div>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding: 0 30px 20px 30px;">
              <h2 style="margin: 0 0 20px 0; color: #1e293b; font-size: 20px; font-weight: 600; text-align: center;">
                Bonjour ${prenom} ${nom},
              </h2>
              <p style="margin: 0 0 20px 0; color: #475569; font-size: 16px; line-height: 1.6; text-align: center;">
                Votre demande nécessite des <strong style="color: #f59e0b;">informations complémentaires</strong> pour être traitée.
              </p>
            </td>
          </tr>

          <!-- Request Details Box -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #fffbeb; border: 2px solid #f59e0b; border-radius: 8px;">
                <tr>
                  <td style="padding: 20px;">
                    <h3 style="margin: 0 0 15px 0; color: #92400e; font-size: 16px; font-weight: 600;">
                      📋 Détails de votre demande
                    </h3>
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 8px 0; color: #78350f; font-size: 14px; font-weight: 500;">
                          Numéro de demande :
                        </td>
                        <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 600; text-align: right;">
                          ${numeroDemande}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #78350f; font-size: 14px; font-weight: 500;">
                          Type de demande :
                        </td>
                        <td style="padding: 8px 0; color: #1e293b; font-size: 14px; text-align: right;">
                          ${typeDemande}
                        </td>
                      </tr>
                      ${formattedDeadline ? `
                      <tr>
                        <td style="padding: 8px 0; color: #78350f; font-size: 14px; font-weight: 500;">
                          Date limite :
                        </td>
                        <td style="padding: 8px 0; color: #dc2626; font-size: 14px; font-weight: 600; text-align: right;">
                          ${formattedDeadline}
                        </td>
                      </tr>
                      ` : ''}
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Status Badge -->
          <tr>
            <td style="padding: 0 30px 30px 30px; text-align: center;">
              <div style="display: inline-block; padding: 10px 20px; background-color: #fef3c7; border-radius: 20px;">
                <span style="color: #92400e; font-size: 14px; font-weight: 600;">
                  ⏸️ Statut : En attente d'information
                </span>
              </div>
            </td>
          </tr>

          ${commentaireAdmin ? `
          <!-- Required Information -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <div style="padding: 20px; background-color: #fef2f2; border-left: 4px solid #ef4444; border-radius: 4px;">
                <h4 style="margin: 0 0 10px 0; color: #991b1b; font-size: 15px; font-weight: 600;">
                  📝 Informations requises
                </h4>
                <p style="margin: 0; color: #7f1d1d; font-size: 14px; line-height: 1.6; white-space: pre-line;">
                  ${commentaireAdmin}
                </p>
              </div>
            </td>
          </tr>
          ` : ''}

          <!-- Urgent Action Required -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <div style="padding: 25px; background-color: #fee2e2; border: 2px solid #dc2626; border-radius: 8px; text-align: center;">
                <h3 style="margin: 0 0 15px 0; color: #991b1b; font-size: 18px; font-weight: 600;">
                  🚨 Action urgente requise
                </h3>
                <p style="margin: 0 0 15px 0; color: #7f1d1d; font-size: 15px; line-height: 1.6;">
                  Veuillez fournir les informations demandées dans les plus brefs délais pour éviter tout retard dans le traitement de votre demande.
                </p>
                ${formattedDeadline ? `
                <div style="display: inline-block; padding: 12px 20px; background-color: #fecaca; border-radius: 6px;">
                  <p style="margin: 0; color: #7f1d1d; font-size: 14px;">
                    <strong>⏰ Répondre avant le :</strong><br>
                    <span style="font-size: 16px; font-weight: 700;">${formattedDeadline}</span>
                  </p>
                </div>
                ` : ''}
              </div>
            </td>
          </tr>

          <!-- How to respond -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <h3 style="margin: 0 0 15px 0; color: #1e293b; font-size: 18px; font-weight: 600;">
                Comment répondre ?
              </h3>
              <ul style="margin: 0; padding: 0 0 0 20px; color: #475569; font-size: 15px; line-height: 1.8;">
                <li style="margin-bottom: 10px;">
                  Connectez-vous à votre espace étudiant
                </li>
                <li style="margin-bottom: 10px;">
                  Accédez à votre demande via le numéro <strong>${numeroDemande}</strong>
                </li>
                <li style="margin-bottom: 10px;">
                  Ajoutez les documents ou informations demandés
                </li>
                <li style="margin-bottom: 10px;">
                  Confirmez l'envoi de votre réponse
                </li>
              </ul>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td style="padding: 0 30px 40px 30px; text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/demandes/${demandeId}"
                 style="display: inline-block; padding: 14px 32px; background-color: #dc2626; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600;">
                Répondre maintenant
              </a>
            </td>
          </tr>

          <!-- Warning Box -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <div style="padding: 15px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
                <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
                  <strong>⚠️ Important :</strong> Si aucune réponse n'est fournie dans le délai imparti, votre demande pourrait être rejetée automatiquement. Assurez-vous de répondre rapidement pour éviter tout désagrément.
                </p>
              </div>
            </td>
          </tr>

          <!-- Help Box -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <div style="padding: 20px; background-color: #eff6ff; border: 2px solid #3b82f6; border-radius: 8px;">
                <h4 style="margin: 0 0 15px 0; color: #1e40af; font-size: 16px; font-weight: 600;">
                  📞 Besoin d'aide ?
                </h4>
                <p style="margin: 0 0 15px 0; color: #1e40af; font-size: 14px; line-height: 1.6;">
                  Si vous avez des questions sur les informations demandées ou si vous rencontrez des difficultés, notre équipe est là pour vous aider.
                </p>
                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 5px 0; color: #1e3a8a; font-size: 14px;">
                      <strong>📧 Email :</strong> scolarite@universite.tn
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0; color: #1e3a8a; font-size: 14px;">
                      <strong>📞 Téléphone :</strong> (+216) 71 XXX XXX
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0; color: #1e3a8a; font-size: 14px;">
                      <strong>🕒 Horaires :</strong> Lundi - Vendredi, 8h30 - 16h00
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="padding: 30px; text-align: center; background-color: #1e293b;">
        <p style="margin: 0 0 10px 0; color: #cbd5e1; font-size: 14px;">
          <strong>Service de Gestion des Demandes Académiques</strong>
        </p>
        <p style="margin: 0 0 10px 0; color: #94a3b8; font-size: 13px;">
          Université de Tunis<br>
          Email: scolarite@universite.tn | Tél: (+216) 71 XXX XXX
        </p>
        <p style="margin: 0; color: #64748b; font-size: 12px;">
          Cet email a été envoyé automatiquement, merci de ne pas y répondre directement.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return { subject, html };
};
