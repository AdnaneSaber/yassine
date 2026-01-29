# Guide Utilisateur - Système de Gestion des Demandes

Ce guide explique comment utiliser le système de gestion des demandes administratives pour les étudiants et les administrateurs.

---

## 🔐 Authentification

### Comptes de Test

#### Administrateur
- **Email**: `admin@university.edu`
- **Mot de passe**: `Admin123!`
- **Rôle**: ADMIN
- **Accès**: Dashboard admin, gestion des demandes, changement de statuts

#### Étudiant
- **Email**: `adnane.saber@university.edu`
- **Mot de passe**: N'importe quel mot de passe (pas de validation pour les étudiants en mode test)
- **Rôle**: STUDENT
- **Accès**: Création et suivi de demandes

### Page de Connexion

1. Accédez à `http://localhost:3000`
2. Vous serez redirigé vers `/auth/signin` si non authentifié
3. Cliquez sur l'un des boutons de connexion rapide OU entrez vos identifiants manuellement
4. Après connexion, vous serez redirigé selon votre rôle :
   - **Admin** → `/admin/dashboard`
   - **Étudiant** → `/demandes`

---

## 📚 Parcours Étudiant

### 1. Accès au Système

Après connexion, les étudiants arrivent sur `/demandes` - la liste de leurs demandes.

### 2. Créer une Nouvelle Demande

**Chemin** : `/demandes` → Bouton "Nouvelle demande" → `/demandes/new`

**Étapes** :
1. Remplir le formulaire :
   - **Type de demande** (requis) :
     - Attestation de scolarité (3 jours)
     - Relevé de notes (5 jours)
     - Attestation de réussite (7 jours)
     - Duplicata de carte étudiant (10 jours)
     - Convention de stage (5 jours)
   - **Objet** (requis) : Titre court de la demande
   - **Description** (requis) : Description détaillée
   - **Priorité** (optionnel) : BASSE / NORMALE (défaut) / HAUTE / URGENTE

2. Cliquer sur "Soumettre la demande"

3. **Ce qui se passe automatiquement** :
   - Un numéro unique est généré (format: `DEM-2026-000001`)
   - La demande est créée avec le statut `SOUMIS`
   - La demande passe automatiquement au statut `RECU`
   - Un email de confirmation est envoyé à l'étudiant

4. Redirection vers la page de détail de la demande créée

### 3. Consulter ses Demandes

**Chemin** : `/demandes`

**Fonctionnalités** :
- **Vue d'ensemble** : Cartes de statistiques (Total, En cours, Validées, Rejetées)
- **Filtres** :
  - Par statut (Reçu, En cours, En attente d'info, Validé, Rejeté, Traité)
  - Par priorité (Basse, Normale, Haute, Urgente)
  - Par type de demande
- **Recherche** : Par numéro, objet, ou description
- **Tableau** : Liste de toutes les demandes avec :
  - Numéro
  - Type
  - Objet
  - Statut (avec badge coloré)
  - Date de création
  - Action "Voir détails"

### 4. Voir les Détails d'une Demande

**Chemin** : `/demandes/[id]`

**Informations affichées** :
- **Entête** : Objet, numéro, statut
- **Informations générales** :
  - Type de demande
  - Priorité
  - Date de soumission
  - Délai de traitement estimé
- **Description** : Votre description complète
- **Documents** : Liste des documents joints (si applicable)
- **Commentaires admin** : Si l'admin a laissé un commentaire
- **Motif de refus** : Si la demande est rejetée
- **Historique** : Chronologie complète de tous les changements de statut

### 5. États d'une Demande (Workflow)

```
SOUMIS → RECU → EN_COURS → ATTENTE_INFO (si info manquante)
                    ↓              ↓
                 VALIDE      EN_COURS
                    ↓
                 TRAITE
```

Ou en cas de rejet :
```
RECU / EN_COURS / ATTENTE_INFO → REJETE → ARCHIVE
```

**Descriptions des statuts** :
- 🟤 **SOUMIS** : Votre demande vient d'être créée (état transitoire)
- 🔵 **RECU** : Demande reçue par l'administration, en attente de traitement
- 🟠 **EN_COURS** : Un administrateur traite activement votre demande
- 🟡 **ATTENTE_INFO** : L'admin a besoin d'informations complémentaires
- 🟢 **VALIDE** : Demande approuvée, document en préparation
- 🟢 **TRAITE** : Demande terminée, document disponible
- 🔴 **REJETE** : Demande refusée (voir motif)
- ⚪ **ARCHIVE** : Demande archivée

### 6. Notifications Email

Vous recevez un email automatique lors de chaque changement de statut :
- ✉️ **Demande reçue** (RECU)
- ✉️ **Demande en cours de traitement** (EN_COURS)
- ✉️ **Demande validée** (VALIDE)
- ✉️ **Demande traitée** (TRAITE)
- ✉️ **Demande rejetée** (REJETE)
- ✉️ **Information requise** (ATTENTE_INFO)

---

## 👨‍💼 Parcours Administrateur

### 1. Accès au Système

Après connexion, les administrateurs arrivent sur `/admin/dashboard`.

### 2. Dashboard Admin

**Chemin** : `/admin/dashboard`

**Vue d'ensemble** :
- **Statistiques globales** :
  - Total des demandes
  - Demandes en attente (RECU + ATTENTE_INFO)
  - Demandes en cours
  - Demandes traitées ce mois
- **Graphiques** (si implémentés) :
  - Répartition par statut
  - Demandes par type
  - Évolution dans le temps
- **Actions rapides** :
  - Voir toutes les demandes
  - Filtrer les demandes urgentes

### 3. Gérer les Demandes

**Chemin** : `/admin/demandes`

**Fonctionnalités** :
- **Liste complète** : Toutes les demandes de tous les étudiants
- **Filtres avancés** :
  - Par statut
  - Par priorité
  - Par type de demande
  - Par étudiant (via recherche)
- **Recherche globale** : Numéro, nom d'étudiant, objet
- **Pagination** : 20 demandes par page
- **Tri** : Par date de création (plus récent d'abord)

### 4. Traiter une Demande (CRUD Complet)

**Chemin** : `/admin/demandes/[id]`

#### 📖 Lire (Read)
La page affiche :
- Informations complètes de l'étudiant
- Détails de la demande
- Documents joints
- Historique des actions
- Commentaires et motifs de refus

#### ✏️ Modifier (Update)
**Action** : Bouton "Modifier"

**Permet de changer** :
- Objet de la demande
- Description
- Priorité (BASSE / NORMALE / HAUTE / URGENTE)

**Cas d'usage** :
- Corriger des erreurs de saisie
- Mettre à jour la priorité selon l'urgence
- Clarifier l'objet de la demande

#### 🔄 Changer le Statut (Update Status)
**Action** : Bouton "Changer le statut"

**Transitions disponibles selon le statut actuel** :

**Depuis RECU** :
- → **EN_COURS** : Commencer le traitement
  - Optionnel : Ajouter un commentaire
- → **REJETE** : Rejeter la demande
  - **Requis** : Motif de refus (minimum 10 caractères)

**Depuis EN_COURS** :
- → **ATTENTE_INFO** : Demander des infos à l'étudiant
  - **Requis** : Commentaire expliquant les infos nécessaires
- → **VALIDE** : Valider la demande
  - **Requis** : Au moins un document joint
- → **REJETE** : Rejeter la demande
  - **Requis** : Motif de refus

**Depuis ATTENTE_INFO** :
- → **EN_COURS** : Reprendre le traitement (après réception des infos)
- → **REJETE** : Rejeter si infos non fournies

**Depuis VALIDE** :
- → **TRAITE** : Marquer comme traité (automatique ou manuel)

**Note** : Les transitions REJETE → ARCHIVE et TRAITE → ARCHIVE sont automatiques ou réservées aux super-admins.

#### 🗑️ Supprimer (Delete)
**Action** : Bouton "Supprimer" (rouge)

**Comportement** :
- **Suppression douce** (soft delete) : `actif: false`
- La demande n'apparaît plus dans les listes actives
- Les données sont conservées dans la base de données
- Confirmation requise avant suppression
- Redirection vers `/admin/demandes` après suppression

### 5. Workflow de Traitement Recommandé

#### Scénario Standard : Approbation
```
1. Nouvelle demande arrive → Statut RECU
2. Admin clique sur "Changer le statut" → EN_COURS
3. Admin vérifie les informations et prépare le document
4. Admin joint le document et change le statut → VALIDE
5. Système transition automatiquement → TRAITE
6. Email envoyé à l'étudiant avec le document
```

#### Scénario : Information Manquante
```
1. Demande en EN_COURS
2. Admin détecte qu'il manque des infos
3. Admin clique "Changer le statut" → ATTENTE_INFO
   - Ajoute commentaire : "Merci de fournir votre certificat de scolarité"
4. Email envoyé à l'étudiant
5. Étudiant fournit les infos (hors système pour l'instant)
6. Admin reprend : ATTENTE_INFO → EN_COURS
7. Poursuite du traitement normal
```

#### Scénario : Rejet
```
1. Demande en RECU ou EN_COURS
2. Admin détecte un problème (ex: demande non éligible)
3. Admin clique "Changer le statut" → REJETE
   - Ajoute motif : "Vous n'êtes pas inscrit pour l'année 2025-2026"
4. Email de rejet envoyé à l'étudiant
5. Demande peut être archivée plus tard
```

### 6. Bonnes Pratiques pour les Admins

#### ✅ À Faire :
- **Traiter les demandes urgentes en premier** : Filtrer par priorité URGENTE
- **Toujours ajouter un commentaire** lors des transitions importantes
- **Vérifier l'historique** avant de traiter une demande
- **Joindre les documents** avant de marquer comme VALIDE
- **Être clair dans les motifs de refus** pour que l'étudiant comprenne

#### ❌ À Éviter :
- Ne pas laisser les demandes en RECU trop longtemps
- Ne pas rejeter sans motif détaillé
- Ne pas oublier de notifier l'étudiant (les emails sont automatiques, mais vérifier)
- Ne pas supprimer les demandes importantes (préférer ARCHIVE)

---

## 🔍 Cas d'Usage Pratiques

### Cas 1 : Étudiant Demande une Attestation de Scolarité

**Étudiant** :
1. Se connecte → `/demandes`
2. Clique "Nouvelle demande"
3. Remplit :
   - Type : Attestation de scolarité
   - Objet : "Attestation pour la banque"
   - Description : "J'ai besoin d'une attestation pour ouvrir un compte bancaire étudiant"
   - Priorité : NORMALE
4. Soumet → Email de confirmation reçu
5. Statut : RECU (badge bleu)

**Admin** :
1. Voit la nouvelle demande sur le dashboard
2. Clique dessus → Lit les détails
3. Change statut → EN_COURS
4. Prépare l'attestation PDF
5. (Fonctionnalité upload de document à implémenter)
6. Change statut → VALIDE
7. Système passe automatiquement à TRAITE
8. Étudiant reçoit email avec le document

**Résultat** : Demande traitée en ~3 jours (selon SLA)

### Cas 2 : Demande Urgente de Convention de Stage

**Étudiant** :
1. Crée demande avec priorité URGENTE
2. Objet : "Convention de stage - Début 15/02/2026"
3. Description : "Entreprise demande la convention signée avant le 10/02"

**Admin** :
1. Filtre les demandes URGENTE
2. Voit la demande en haut de liste
3. Traite immédiatement :
   - RECU → EN_COURS (commentaire : "Traitement prioritaire")
   - Prépare convention
   - EN_COURS → VALIDE (joint PDF)
   - Automatique → TRAITE
4. Contact direct avec étudiant si nécessaire

**Résultat** : Traité en <24h malgré SLA de 5 jours

### Cas 3 : Demande avec Information Manquante

**Étudiant** :
1. Demande un relevé de notes
2. Description : "Relevé de notes complet"

**Admin** :
1. Ouvre la demande (EN_COURS)
2. Constate que l'année n'est pas précisée
3. Change statut → ATTENTE_INFO
4. Commentaire : "Merci de préciser quelle année universitaire : 2023-2024 ou 2024-2025 ?"
5. Email envoyé automatiquement

**Étudiant** :
1. Reçoit email
2. Répond par email ou contacte secrétariat : "2024-2025 svp"

**Admin** :
1. Reçoit info
2. Change statut → EN_COURS
3. Génère le bon relevé
4. Poursuit le workflow normal

**Résultat** : Communication claire, demande bien traitée

### Cas 4 : Demande Non Éligible

**Étudiant** :
1. Demande une attestation de réussite
2. Description : "Pour mon master"

**Admin** :
1. Vérifie le dossier étudiant
2. Constate que l'étudiant a échoué au semestre
3. Change statut → REJETE
4. Motif : "Votre attestation de réussite ne peut être délivrée car vous n'avez pas validé le semestre 1. Veuillez prendre rendez-vous avec votre conseiller pédagogique."

**Étudiant** :
1. Reçoit email de rejet avec motif détaillé
2. Comprend la situation
3. Peut consulter le motif dans l'historique de la demande

**Résultat** : Rejet clair et justifié

---

## 🛠️ Fonctionnalités Techniques

### Auto-Transitions
- **SOUMIS → RECU** : Automatique dès la création (par le système)
- **VALIDE → TRAITE** : Automatique après 100ms (simulation de génération de document)

### Emails Automatiques
Envoyés via Resend API (`noreply@universite.tn`) à chaque changement de statut :
- Templates HTML avec design responsive
- Variables personnalisées (nom, numéro, type, etc.)
- Tracking dans la table `notifications`

### Historique Complet (Audit Trail)
- Chaque changement de statut est enregistré dans `historiques`
- Informations stockées :
  - Ancien statut → Nouveau statut
  - Type d'action (CREATION, CHANGEMENT_STATUT, etc.)
  - Utilisateur qui a effectué l'action
  - Date et heure exactes
  - Commentaire associé

### Sécurité
- **Authentification** : NextAuth avec JWT
- **Autorisation** : Middleware protège les routes admin
- **Validation** : Zod schemas pour toutes les entrées
- **Permissions** : Workflow vérifie les rôles avant chaque transition

---

## 📊 Statuts et Délais

| Type de Demande                | Délai Standard | Code                  |
|--------------------------------|----------------|-----------------------|
| Attestation de scolarité       | 3 jours        | ATTESTATION_SCOLARITE |
| Relevé de notes                | 5 jours        | RELEVE_NOTES          |
| Attestation de réussite        | 7 jours        | ATTESTATION_REUSSITE  |
| Duplicata de carte étudiant    | 10 jours       | DUPLICATA_CARTE       |
| Convention de stage            | 5 jours        | CONVENTION_STAGE      |

**Note** : Les délais peuvent être réduits pour les demandes URGENTE.

---

## 🐛 Dépannage

### Problème : Impossible de se connecter
- Vérifiez l'email et le mot de passe
- Pour les étudiants : utilisez `adnane.saber@university.edu` avec n'importe quel mot de passe
- Pour les admins : `admin@university.edu` / `Admin123!`

### Problème : "Non authentifié" après connexion
- Videz le cache du navigateur
- Reconnectez-vous
- Vérifiez que NEXTAUTH_SECRET est configuré dans .env.local

### Problème : Demande créée mais erreur affichée
- **Corrigé** : L'erreur de workflow ne bloque plus la création
- Si vous voyez une erreur mais la demande est créée, c'est normal (l'email a peut-être échoué)
- Vérifiez dans la liste des demandes si elle apparaît

### Problème : Email non reçu
- Vérifiez vos spams
- Vérifiez que RESEND_API_KEY est configuré
- Consultez les logs serveur pour les erreurs d'envoi

---

## 📞 Support

Pour toute question ou problème :
- **Technique** : Consultez les logs dans la console serveur
- **Base de données** : Utilisez MongoDB Compass pour inspecter les données
- **Email** : Vérifiez la table `notifications` pour le statut d'envoi

---

## 🎯 Points Clés à Retenir

### Pour les Étudiants :
✅ Remplissez toutes les informations requises lors de la création
✅ Vérifiez régulièrement l'état de votre demande
✅ Répondez rapidement aux demandes d'information
✅ Consultez l'historique pour comprendre le traitement

### Pour les Admins :
✅ Traitez les demandes selon leur priorité
✅ Communiquez clairement avec les étudiants via commentaires
✅ Utilisez les bons statuts au bon moment
✅ Documentez les décisions (surtout les rejets)
✅ Archivez les anciennes demandes pour garder la liste propre

---

**Version** : 1.0
**Date** : Janvier 2026
**Auteur** : Système de Gestion des Demandes - Université
