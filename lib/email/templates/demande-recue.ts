import type { EmailTemplate, EmailTemplateResult } from '@/types/email';

/**
 * Email template for "Demande Reçue" status
 * Sent when a request has been received by the administration
 */
export const demandeRecueTemplate: EmailTemplate = (data): EmailTemplateResult => {
  const { prenom, nom, numeroDemande, typeDemande, objet, dateSoumission, delaiEstime } = data;

  const formattedDate = new Date(dateSoumission).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  const subject = `Votre demande ${numeroDemande} a été reçue`;

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
          <!-- Greeting -->
          <tr>
            <td style="padding: 40px 30px 20px 30px;">
              <h2 style="margin: 0 0 20px 0; color: #1e293b; font-size: 20px; font-weight: 600;">
                Bonjour ${prenom} ${nom},
              </h2>
              <p style="margin: 0 0 20px 0; color: #475569; font-size: 16px; line-height: 1.6;">
                Nous vous confirmons que votre demande a bien été reçue par nos services.
              </p>
            </td>
          </tr>

          <!-- Request Details Box -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f8fafc; border: 2px solid #3b82f6; border-radius: 8px;">
                <tr>
                  <td style="padding: 20px;">
                    <h3 style="margin: 0 0 15px 0; color: #1e40af; font-size: 16px; font-weight: 600;">
                      📋 Détails de votre demande
                    </h3>
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 8px 0; color: #64748b; font-size: 14px; font-weight: 500;">
                          Numéro de demande :
                        </td>
                        <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 600; text-align: right;">
                          ${numeroDemande}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #64748b; font-size: 14px; font-weight: 500;">
                          Type de demande :
                        </td>
                        <td style="padding: 8px 0; color: #1e293b; font-size: 14px; text-align: right;">
                          ${typeDemande}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #64748b; font-size: 14px; font-weight: 500;">
                          Objet :
                        </td>
                        <td style="padding: 8px 0; color: #1e293b; font-size: 14px; text-align: right;">
                          ${objet}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #64748b; font-size: 14px; font-weight: 500;">
                          Date de soumission :
                        </td>
                        <td style="padding: 8px 0; color: #1e293b; font-size: 14px; text-align: right;">
                          ${formattedDate}
                        </td>
                      </tr>
                      ${delaiEstime ? `
                      <tr>
                        <td style="padding: 8px 0; color: #64748b; font-size: 14px; font-weight: 500;">
                          Délai estimé :
                        </td>
                        <td style="padding: 8px 0; color: #1e293b; font-size: 14px; text-align: right;">
                          ${delaiEstime} jours ouvrables
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
              <div style="display: inline-block; padding: 10px 20px; background-color: #dbeafe; border-radius: 20px;">
                <span style="color: #1e40af; font-size: 14px; font-weight: 600;">
                  ✓ Statut : Reçu
                </span>
              </div>
            </td>
          </tr>

          <!-- Next Steps -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <h3 style="margin: 0 0 15px 0; color: #1e293b; font-size: 18px; font-weight: 600;">
                Prochaines étapes
              </h3>
              <ul style="margin: 0; padding: 0 0 0 20px; color: #475569; font-size: 15px; line-height: 1.8;">
                <li style="margin-bottom: 10px;">
                  Votre demande sera examinée par nos services administratifs
                </li>
                <li style="margin-bottom: 10px;">
                  Vous recevrez une notification par email à chaque changement de statut
                </li>
                <li style="margin-bottom: 10px;">
                  Vous pouvez suivre l'évolution de votre demande à tout moment depuis votre espace étudiant
                </li>
              </ul>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td style="padding: 0 30px 40px 30px; text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/etudiant/demandes/${numeroDemande}"
                 style="display: inline-block; padding: 14px 32px; background-color: #3b82f6; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600;">
                Suivre ma demande
              </a>
            </td>
          </tr>

          <!-- Important Note -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <div style="padding: 15px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
                <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
                  <strong>Note importante :</strong> Veuillez conserver ce numéro de demande (${numeroDemande}) pour toute correspondance future avec nos services.
                </p>
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
