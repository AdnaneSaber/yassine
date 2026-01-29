import type { EmailTemplate, EmailTemplateResult } from '@/types/email';

/**
 * Email template for "Demande Validée" status
 * Sent when a request has been validated and approved by the administration
 */
export const demandeValideeTemplate: EmailTemplate = (data): EmailTemplateResult => {
  const { prenom, nom, numeroDemande, typeDemande, commentaireAdmin } = data;

  const subject = `✓ Votre demande ${numeroDemande} a été validée`;

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
          <!-- Success Icon -->
          <tr>
            <td style="padding: 40px 30px 20px 30px; text-align: center;">
              <div style="display: inline-block; width: 80px; height: 80px; background-color: #d1fae5; border-radius: 50%; line-height: 80px;">
                <span style="font-size: 40px;">✓</span>
              </div>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding: 0 30px 20px 30px;">
              <h2 style="margin: 0 0 20px 0; color: #1e293b; font-size: 20px; font-weight: 600; text-align: center;">
                Félicitations ${prenom} ${nom} !
              </h2>
              <p style="margin: 0 0 20px 0; color: #475569; font-size: 16px; line-height: 1.6; text-align: center;">
                Votre demande a été <strong style="color: #10b981;">validée avec succès</strong> par nos services administratifs.
              </p>
            </td>
          </tr>

          <!-- Request Details Box -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #ecfdf5; border: 2px solid #10b981; border-radius: 8px;">
                <tr>
                  <td style="padding: 20px;">
                    <h3 style="margin: 0 0 15px 0; color: #065f46; font-size: 16px; font-weight: 600;">
                      📋 Détails de votre demande
                    </h3>
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 8px 0; color: #047857; font-size: 14px; font-weight: 500;">
                          Numéro de demande :
                        </td>
                        <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 600; text-align: right;">
                          ${numeroDemande}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #047857; font-size: 14px; font-weight: 500;">
                          Type de demande :
                        </td>
                        <td style="padding: 8px 0; color: #1e293b; font-size: 14px; text-align: right;">
                          ${typeDemande}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Status Badge -->
          <tr>
            <td style="padding: 0 30px 30px 30px; text-align: center;">
              <div style="display: inline-block; padding: 10px 20px; background-color: #d1fae5; border-radius: 20px;">
                <span style="color: #065f46; font-size: 14px; font-weight: 600;">
                  ✓ Statut : Validé
                </span>
              </div>
            </td>
          </tr>

          ${commentaireAdmin ? `
          <!-- Admin Comment -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <div style="padding: 20px; background-color: #f0fdfa; border-left: 4px solid #14b8a6; border-radius: 4px;">
                <h4 style="margin: 0 0 10px 0; color: #0f766e; font-size: 15px; font-weight: 600;">
                  💬 Message de l'administration
                </h4>
                <p style="margin: 0; color: #134e4a; font-size: 14px; line-height: 1.6;">
                  ${commentaireAdmin}
                </p>
              </div>
            </td>
          </tr>
          ` : ''}

          <!-- Next Steps -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <h3 style="margin: 0 0 15px 0; color: #1e293b; font-size: 18px; font-weight: 600;">
                Prochaines étapes
              </h3>
              <ul style="margin: 0; padding: 0 0 0 20px; color: #475569; font-size: 15px; line-height: 1.8;">
                <li style="margin-bottom: 10px;">
                  Votre document est en cours de finalisation par nos services
                </li>
                <li style="margin-bottom: 10px;">
                  Vous recevrez une notification dès qu'il sera prêt à être récupéré ou téléchargé
                </li>
                <li style="margin-bottom: 10px;">
                  Le document sera disponible dans votre espace étudiant
                </li>
              </ul>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td style="padding: 0 30px 40px 30px; text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/etudiant/demandes/${numeroDemande}"
                 style="display: inline-block; padding: 14px 32px; background-color: #10b981; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600;">
                Voir ma demande
              </a>
            </td>
          </tr>

          <!-- Success Box -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <div style="padding: 20px; background-color: #fefce8; border: 2px solid #eab308; border-radius: 8px; text-align: center;">
                <p style="margin: 0; color: #713f12; font-size: 15px; line-height: 1.6;">
                  <strong>📧 Restez connecté</strong><br>
                  Nous vous informerons par email dès que votre document sera disponible.
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
