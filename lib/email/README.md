# Email Notification Service

Service de notifications par email utilisant Resend pour le système de gestion des demandes académiques.

## Structure

```
lib/email/
├── index.ts                          # Point d'entrée principal
├── resend.ts                         # Configuration et fonctions Resend
├── templates/                        # Templates d'emails
│   ├── index.ts                      # Export des templates
│   ├── demande-recue.ts              # Email "Demande reçue"
│   ├── demande-en-cours.ts           # Email "En cours de traitement"
│   ├── demande-validee.ts            # Email "Demande validée"
│   ├── demande-traitee.ts            # Email "Demande traitée"
│   ├── demande-rejetee.ts            # Email "Demande rejetée"
│   └── demande-attente-info.ts       # Email "Information requise"
└── README.md                         # Cette documentation

types/email.ts                        # Types TypeScript pour les emails
```

## Configuration

### Variables d'environnement

Ajoutez ces variables à votre fichier `.env` :

```env
# Resend API Key (obligatoire)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxx

# Email expéditeur (optionnel, défaut: noreply@universite.tn)
EMAIL_FROM=noreply@universite.tn

# URL de l'application (pour les liens dans les emails)
NEXT_PUBLIC_APP_URL=https://votre-domaine.tn
```

### Obtenir une clé API Resend

1. Créez un compte sur [resend.com](https://resend.com)
2. Vérifiez votre domaine dans les paramètres
3. Créez une clé API dans la section "API Keys"
4. Copiez la clé dans votre fichier `.env`

## Utilisation

### Envoi automatique lors d'un changement de statut

```typescript
import { sendDemandeStatusEmail } from '@/lib/email';

// Après avoir mis à jour le statut d'une demande
const demande = await Demande.findById(demandeId);
const result = await sendDemandeStatusEmail(demande);

if (result.success) {
  console.log('Email envoyé avec succès:', result.messageId);
} else {
  console.error('Erreur lors de l\'envoi:', result.error);
}
```

### Envoi d'un email personnalisé

```typescript
import { sendCustomDemandeEmail } from '@/lib/email';

const result = await sendCustomDemandeEmail(
  demandeId,
  'etudiant@email.tn',
  'Sujet de l\'email',
  '<html>Contenu HTML de l\'email</html>'
);
```

### Réessayer l'envoi d'un email échoué

```typescript
import { retryEmail } from '@/lib/email';

const notificationId = '...'; // ID de la notification dans MongoDB
const result = await retryEmail(notificationId);
```

### Obtenir les statistiques d'emails pour une demande

```typescript
import { getEmailStats } from '@/lib/email';

const stats = await getEmailStats(demandeId);
console.log(stats);
// {
//   total: 3,
//   envoye: 2,
//   enAttente: 0,
//   echec: 1
// }
```

## Templates d'emails

### Statuts couverts

| Statut          | Template                | Description                          |
|-----------------|-------------------------|--------------------------------------|
| `RECU`          | demande-recue           | Demande reçue par l'administration   |
| `EN_COURS`      | demande-en-cours        | Demande en cours de traitement       |
| `VALIDE`        | demande-validee         | Demande validée                      |
| `TRAITE`        | demande-traitee         | Demande traitée, document disponible |
| `REJETE`        | demande-rejetee         | Demande rejetée                      |
| `ATTENTE_INFO`  | demande-attente-info    | Information supplémentaire requise   |

### Structure d'un template

Chaque template est une fonction qui prend un objet `EmailData` et retourne un objet `EmailTemplateResult` :

```typescript
import type { EmailTemplate } from '@/types/email';

export const monTemplate: EmailTemplate = (data) => {
  const { prenom, nom, numeroDemande, typeDemande } = data;

  return {
    subject: 'Sujet de l\'email',
    html: `
      <!DOCTYPE html>
      <html>
        <!-- Contenu HTML responsive avec inline CSS -->
      </html>
    `
  };
};
```

### Données disponibles dans les templates

```typescript
interface EmailData {
  // Informations étudiant
  prenom: string;
  nom: string;
  email: string;

  // Informations demande
  numeroDemande: string;
  typeDemande: string;
  typeDemandeCode: TypeDemandeCode;
  objet: string;
  dateSoumission: Date;

  // Informations statut
  statut: DemandeStatus;
  statutLibelle: string;

  // Champs optionnels
  commentaireAdmin?: string;
  motifRefus?: string;
  dateTraitement?: Date;
  delaiEstime?: number;
  prochaineDateLimite?: Date;
}
```

## Intégration avec le workflow

### Dans un API Route

```typescript
// app/api/admin/demandes/[id]/statut/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Demande } from '@/lib/db/models/demande';
import { sendDemandeStatusEmail } from '@/lib/email';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { nouveauStatut, commentaireAdmin, motifRefus } = body;

    // Mettre à jour le statut
    const demande = await Demande.findByIdAndUpdate(
      params.id,
      {
        'statut.code': nouveauStatut,
        commentaireAdmin,
        motifRefus
      },
      { new: true }
    );

    // Envoyer l'email de notification
    const emailResult = await sendDemandeStatusEmail(demande);

    if (!emailResult.success) {
      console.error('Erreur email:', emailResult.error);
      // Continuer même si l'email échoue
    }

    return NextResponse.json({ success: true, demande });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
```

### Dans un Server Action

```typescript
'use server';

import { Demande } from '@/lib/db/models/demande';
import { sendDemandeStatusEmail } from '@/lib/email';
import { revalidatePath } from 'next/cache';

export async function updateDemandeStatus(
  demandeId: string,
  nouveauStatut: DemandeStatus,
  commentaire?: string
) {
  try {
    const demande = await Demande.findByIdAndUpdate(
      demandeId,
      {
        'statut.code': nouveauStatut,
        commentaireAdmin: commentaire
      },
      { new: true }
    );

    // Envoyer l'email
    await sendDemandeStatusEmail(demande);

    revalidatePath('/admin/demandes');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Erreur lors de la mise à jour' };
  }
}
```

## Gestion des notifications

Les emails sont automatiquement enregistrés dans la collection `notifications` de MongoDB avec les informations suivantes :

```typescript
interface INotification {
  demandeId: ObjectId;              // Référence à la demande
  type: 'EMAIL' | 'SMS';            // Type de notification
  destinataire: string;             // Email du destinataire
  sujet?: string;                   // Sujet de l'email
  contenu: string;                  // Contenu HTML
  templateUtilise?: string;         // Nom du template
  statutEnvoi: NotificationStatus;  // EN_ATTENTE | ENVOYE | ECHEC
  nbTentatives: number;             // Nombre de tentatives d'envoi
  dateEnvoi?: Date;                 // Date d'envoi réussi
  erreur?: string;                  // Message d'erreur si échec
  createdAt: Date;
  updatedAt: Date;
}
```

## Personnalisation

### Modifier un template existant

1. Ouvrez le fichier du template dans `lib/email/templates/`
2. Modifiez le HTML ou le sujet
3. Conservez les inline CSS pour la compatibilité email
4. Testez avec différents clients email

### Ajouter un nouveau template

1. Créez un nouveau fichier dans `lib/email/templates/`
2. Implémentez la fonction template :

```typescript
import type { EmailTemplate } from '@/types/email';

export const nouveauTemplate: EmailTemplate = (data) => {
  return {
    subject: 'Sujet',
    html: '<!-- HTML -->'
  };
};
```

3. Ajoutez l'export dans `lib/email/templates/index.ts`
4. Mettez à jour les mappings si nécessaire

## Bonnes pratiques

1. **Toujours tester les emails** dans différents clients (Gmail, Outlook, etc.)
2. **Utiliser l'inline CSS** pour garantir le rendu dans tous les clients
3. **Prévoir des fallbacks** pour les images et polices
4. **Garder les emails légers** (< 100KB)
5. **Inclure une version texte** pour l'accessibilité (futur)
6. **Respecter le RGPD** - ne pas stocker de données sensibles
7. **Logger les erreurs** mais continuer l'exécution du code

## Dépannage

### L'email n'est pas envoyé

- Vérifiez que `RESEND_API_KEY` est définie
- Vérifiez que le domaine est vérifié dans Resend
- Consultez les logs de la console
- Vérifiez la collection `notifications` dans MongoDB

### L'email arrive en spam

- Vérifiez les enregistrements SPF/DKIM/DMARC de votre domaine
- Utilisez un domaine vérifié dans Resend
- Évitez les mots-clés spam dans le sujet

### Erreurs de template

- Vérifiez que toutes les variables utilisées existent dans `EmailData`
- Utilisez l'opérateur optionnel `?.` pour les champs optionnels
- Testez avec des données réelles

## Support

Pour toute question ou problème :
- Consultez la documentation Resend : https://resend.com/docs
- Vérifiez les logs dans la console Next.js
- Consultez les notifications dans MongoDB

## Licence

Copyright © 2025 Université de Tunis
