import type { EmailTemplate, EmailTemplateResult } from '@/types/email';

/**
 * Email template for "Demande Traitée" status
 * Sent when a request has been fully processed and documents are ready
 */
export const demandeTraiteeTemplate: EmailTemplate = (data): EmailTemplateResult => {
  const { prenom, nom, demandeId, numeroDemande, typeDemande, dateTraitement } = data;

  const formattedDate = dateTraitement
    ? new Date(dateTraitement).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      })
    : new Date().toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });

  const subject = `🎉 Votre demande ${numeroDemande} est prête`;

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
                <span style="font-size: 40px;">🎉</span>
              </div>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding: 0 30px 20px 30px;">
              <h2 style="margin: 0 0 20px 0; color: #1e293b; font-size: 20px; font-weight: 600; text-align: center;">
                Excellente nouvelle ${prenom} ${nom} !
              </h2>
              <p style="margin: 0 0 20px 0; color: #475569; font-size: 16px; line-height: 1.6; text-align: center;">
                Votre demande a été <strong style="color: #059669;">traitée avec succès</strong>. Votre document est maintenant disponible !
              </p>
            </td>
          </tr>

          <!-- Request Details Box -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #ecfdf5; border: 2px solid #059669; border-radius: 8px;">
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
                      <tr>
                        <td style="padding: 8px 0; color: #047857; font-size: 14px; font-weight: 500;">
                          Date de traitement :
                        </td>
                        <td style="padding: 8px 0; color: #1e293b; font-size: 14px; text-align: right;">
                          ${formattedDate}
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
                  ✓ Statut : Traité
                </span>
              </div>
            </td>
          </tr>

          <!-- Action Required Box -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <div style="padding: 25px; background-color: #fefce8; border: 2px solid #eab308; border-radius: 8px; text-align: center;">
                <h3 style="margin: 0 0 15px 0; color: #713f12; font-size: 18px; font-weight: 600;">
                  📥 Document disponible
                </h3>
                <p style="margin: 0 0 15px 0; color: #854d0e; font-size: 15px; line-height: 1.6;">
                  Votre document est prêt. Vous pouvez le télécharger directement depuis votre espace étudiant ou le récupérer au service de scolarité.
                </p>
                <div style="display: inline-block; padding: 12px 20px; background-color: #fef3c7; border-radius: 6px;">
                  <p style="margin: 0; color: #78350f; font-size: 14px;">
                    <strong>📍 Horaires de retrait :</strong><br>
                    Lundi - Vendredi : 8h30 - 16h00
                  </p>
                </div>
              </div>
            </td>
          </tr>

          <!-- CTA Buttons -->
          <tr>
            <td style="padding: 0 30px 30px 30px; text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/demandes/${demandeId}"
                 style="display: inline-block; padding: 14px 32px; background-color: #059669; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600; margin: 0 5px 10px 5px;">
                Télécharger le document
              </a>
            </td>
          </tr>

          <!-- What to bring -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <h3 style="margin: 0 0 15px 0; color: #1e293b; font-size: 18px; font-weight: 600;">
                Pour récupérer votre document en personne
              </h3>
              <ul style="margin: 0; padding: 0 0 0 20px; color: #475569; font-size: 15px; line-height: 1.8;">
                <li style="margin-bottom: 10px;">
                  Munissez-vous de votre carte d'étudiant
                </li>
                <li style="margin-bottom: 10px;">
                  Présentez votre numéro de demande : <strong>${numeroDemande}</strong>
                </li>
                <li style="margin-bottom: 10px;">
                  Une pièce d'identité sera requise
                </li>
              </ul>
            </td>
          </tr>

          <!-- Info Box -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <div style="padding: 15px; background-color: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 4px;">
                <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.6;">
                  <strong>📧 Conservation du document :</strong> Nous vous recommandons de télécharger et sauvegarder votre document. Il restera accessible dans votre espace pendant 6 mois.
                </p>
              </div>
            </td>
          </tr>

          <!-- Thank you message -->
          <tr>
            <td style="padding: 0 30px 30px 30px; text-align: center;">
              <p style="margin: 0; color: #475569; font-size: 15px; line-height: 1.6;">
                Merci de votre confiance. N'hésitez pas à nous contacter si vous avez des questions.
              </p>
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
