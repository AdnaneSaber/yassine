import type { EmailTemplate, EmailTemplateResult } from '@/types/email';

/**
 * Email template for "Demande Rejetée" status
 * Sent when a request has been rejected by the administration
 */
export const demandeRejeteeTemplate: EmailTemplate = (data): EmailTemplateResult => {
  const { prenom, nom, numeroDemande, typeDemande, motifRefus, commentaireAdmin } = data;

  const subject = `Votre demande ${numeroDemande} a été rejetée`;

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
                Nous vous informons que votre demande n'a malheureusement pas pu être acceptée.
              </p>
            </td>
          </tr>

          <!-- Request Details Box -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #fef2f2; border: 2px solid #ef4444; border-radius: 8px;">
                <tr>
                  <td style="padding: 20px;">
                    <h3 style="margin: 0 0 15px 0; color: #991b1b; font-size: 16px; font-weight: 600;">
                      📋 Détails de votre demande
                    </h3>
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 8px 0; color: #991b1b; font-size: 14px; font-weight: 500;">
                          Numéro de demande :
                        </td>
                        <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 600; text-align: right;">
                          ${numeroDemande}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #991b1b; font-size: 14px; font-weight: 500;">
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
              <div style="display: inline-block; padding: 10px 20px; background-color: #fee2e2; border-radius: 20px;">
                <span style="color: #991b1b; font-size: 14px; font-weight: 600;">
                  ✗ Statut : Rejeté
                </span>
              </div>
            </td>
          </tr>

          ${motifRefus ? `
          <!-- Rejection Reason -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <div style="padding: 20px; background-color: #fef2f2; border-left: 4px solid #ef4444; border-radius: 4px;">
                <h4 style="margin: 0 0 10px 0; color: #991b1b; font-size: 15px; font-weight: 600;">
                  📝 Motif du rejet
                </h4>
                <p style="margin: 0; color: #7f1d1d; font-size: 14px; line-height: 1.6;">
                  ${motifRefus}
                </p>
              </div>
            </td>
          </tr>
          ` : ''}

          ${commentaireAdmin ? `
          <!-- Admin Comment -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <div style="padding: 20px; background-color: #f0fdfa; border-left: 4px solid #14b8a6; border-radius: 4px;">
                <h4 style="margin: 0 0 10px 0; color: #0f766e; font-size: 15px; font-weight: 600;">
                  💬 Commentaire additionnel
                </h4>
                <p style="margin: 0; color: #134e4a; font-size: 14px; line-height: 1.6;">
                  ${commentaireAdmin}
                </p>
              </div>
            </td>
          </tr>
          ` : ''}

          <!-- What to do next -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <h3 style="margin: 0 0 15px 0; color: #1e293b; font-size: 18px; font-weight: 600;">
                Que faire maintenant ?
              </h3>
              <ul style="margin: 0; padding: 0 0 0 20px; color: #475569; font-size: 15px; line-height: 1.8;">
                <li style="margin-bottom: 10px;">
                  Prenez connaissance du motif de rejet pour comprendre les raisons de cette décision
                </li>
                <li style="margin-bottom: 10px;">
                  Si vous pensez qu'il s'agit d'une erreur ou si vous avez des questions, contactez notre service de scolarité
                </li>
                <li style="margin-bottom: 10px;">
                  Vous pouvez soumettre une nouvelle demande en corrigeant les éléments mentionnés dans le motif
                </li>
                <li style="margin-bottom: 10px;">
                  Pour toute contestation, vous disposez d'un délai de 15 jours pour déposer un recours
                </li>
              </ul>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td style="padding: 0 30px 30px 30px; text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/etudiant/demandes/nouvelle"
                 style="display: inline-block; padding: 14px 32px; background-color: #3b82f6; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600; margin-right: 10px;">
                Soumettre une nouvelle demande
              </a>
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/etudiant/demandes/${numeroDemande}"
                 style="display: inline-block; padding: 14px 32px; background-color: #6b7280; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600;">
                Voir les détails
              </a>
            </td>
          </tr>

          <!-- Contact Box -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <div style="padding: 20px; background-color: #eff6ff; border: 2px solid #3b82f6; border-radius: 8px; text-align: center;">
                <h3 style="margin: 0 0 15px 0; color: #1e40af; font-size: 16px; font-weight: 600;">
                  📞 Besoin d'assistance ?
                </h3>
                <p style="margin: 0 0 10px 0; color: #1e40af; font-size: 14px; line-height: 1.6;">
                  Notre équipe est à votre disposition pour répondre à vos questions.
                </p>
                <div style="display: inline-block; padding: 12px 20px; background-color: #dbeafe; border-radius: 6px;">
                  <p style="margin: 0; color: #1e3a8a; font-size: 14px;">
                    <strong>📧 Email :</strong> scolarite@universite.tn<br>
                    <strong>📞 Tél :</strong> (+216) 71 XXX XXX<br>
                    <strong>🕒 Horaires :</strong> Lundi - Vendredi, 8h30 - 16h00
                  </p>
                </div>
              </div>
            </td>
          </tr>

          <!-- Recours info -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <div style="padding: 15px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
                <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
                  <strong>⚖️ Droit de recours :</strong> Si vous souhaitez contester cette décision, vous pouvez déposer un recours auprès du service de scolarité dans un délai de 15 jours à compter de la réception de cet email.
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
