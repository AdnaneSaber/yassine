# Schéma de Base de Données

## Modèle Conceptuel (MCD)

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│   ÉTUDIANTS     │         │    DEMANDES      │         │ TYPES_DEMANDES  │
├─────────────────┤         ├──────────────────┤         ├─────────────────┤
│ id (PK)         │1      N │ id (PK)          │N      1 │ id (PK)         │
│ matricule (UQ)  ├─────────┤ etudiant_id (FK) ├─────────┤ code (UQ)       │
│ nom             │ soumet  │ type_id (FK)     │ est de  │ nom             │
│ prenom          │         │ statut_id (FK)   │ type    │ description     │
│ email (UQ)      │         │ date_creation    │         │ delai_traitement│
│ date_naissance  │         │ date_modification│         │ actif           │
│ telephone       │         │ date_traitement  │         └─────────────────┘
│ date_inscription│         │ priorite         │
└─────────────────┘         │ commentaire_admin│
                            └──────────────────┘
                                     │1
                                     │
                                     │a un
                                     │
                                     │1
                            ┌────────┴─────────┐
                            │     STATUTS      │
                            ├──────────────────┤
                            │ id (PK)          │
                            │ code (UQ)        │
                            │ libelle          │
                            │ couleur          │
                            │ ordre            │
                            │ est_final        │
                            └──────────────────┘

┌─────────────────┐         ┌──────────────────┐
│   DEMANDES      │1      N │   DOCUMENTS      │
├─────────────────┤─────────├──────────────────┤
│ id (PK)         │possède  │ id (PK)          │
└─────────────────┘         │ demande_id (FK)  │
                            │ nom_fichier      │
                            │ nom_original     │
                            │ chemin           │
                            │ type_mime        │
                            │ taille_octets    │
                            │ date_upload      │
                            └──────────────────┘

┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│   DEMANDES      │1      N │   HISTORIQUE     │N      1 │  UTILISATEURS   │
├─────────────────┤─────────├──────────────────┤─────────├─────────────────┤
│ id (PK)         │ génère  │ id (PK)          │effectué │ id (PK)         │
└─────────────────┘         │ demande_id (FK)  │par      │ email (UQ)      │
                            │ statut_ancien_id │         │ nom             │
                            │ statut_nouveau_id│         │ prenom          │
                            │ utilisateur_id   │         │ hash_password   │
                            │ date_changement  │         │ role            │
                            │ commentaire      │         │ actif           │
                            └──────────────────┘         │ date_creation   │
                                                         └─────────────────┘

┌─────────────────┐         ┌──────────────────┐
│   DEMANDES      │1      N │  NOTIFICATIONS   │
├─────────────────┤─────────├──────────────────┤
│ id (PK)         │déclenche│ id (PK)          │
└─────────────────┘         │ demande_id (FK)  │
                            │ type             │
                            │ destinataire     │
                            │ sujet            │
                            │ contenu          │
                            │ statut_envoi     │
                            │ date_creation    │
                            │ date_envoi       │
                            │ erreur           │
                            └──────────────────┘
```

## Modèle Logique de Données (MLD)

### Table: etudiants

| Colonne           | Type        | Contraintes             | Description                    |
|-------------------|-------------|-------------------------|--------------------------------|
| id                | SERIAL      | PRIMARY KEY             | Identifiant unique             |
| matricule         | VARCHAR(20) | UNIQUE, NOT NULL        | Matricule étudiant             |
| nom               | VARCHAR(100)| NOT NULL                | Nom de famille                 |
| prenom            | VARCHAR(100)| NOT NULL                | Prénom                         |
| email             | VARCHAR(255)| UNIQUE, NOT NULL        | Email institutionnel           |
| date_naissance    | DATE        |                         | Date de naissance              |
| telephone         | VARCHAR(20) |                         | Numéro de téléphone            |
| adresse           | TEXT        |                         | Adresse postale                |
| date_inscription  | DATE        | NOT NULL                | Date d'inscription             |
| niveau_etude      | VARCHAR(50) |                         | Niveau d'étude actuel          |
| filiere           | VARCHAR(100)|                         | Filière d'études               |
| actif             | BOOLEAN     | DEFAULT TRUE            | Compte actif                   |
| date_creation     | TIMESTAMP   | DEFAULT CURRENT_TIMESTAMP| Date de création du compte    |
| date_modification | TIMESTAMP   | DEFAULT CURRENT_TIMESTAMP| Dernière modification         |

**Indexes:**
- `idx_etudiants_matricule` sur `matricule`
- `idx_etudiants_email` sur `email`
- `idx_etudiants_nom_prenom` sur `(nom, prenom)`

---

### Table: types_demandes

| Colonne            | Type         | Contraintes             | Description                    |
|--------------------|--------------|-------------------------|--------------------------------|
| id                 | SERIAL       | PRIMARY KEY             | Identifiant unique             |
| code               | VARCHAR(50)  | UNIQUE, NOT NULL        | Code type (ATTESTATION, etc.)  |
| nom                | VARCHAR(100) | NOT NULL                | Nom complet du type            |
| description        | TEXT         |                         | Description détaillée          |
| delai_traitement   | INTEGER      | DEFAULT 5               | Délai normal en jours          |
| pieces_requises    | JSON         |                         | Liste pièces à fournir         |
| actif              | BOOLEAN      | DEFAULT TRUE            | Type actif                     |
| ordre_affichage    | INTEGER      | DEFAULT 0               | Ordre d'affichage              |
| date_creation      | TIMESTAMP    | DEFAULT CURRENT_TIMESTAMP| Date de création              |

**Indexes:**
- `idx_types_demandes_code` sur `code`
- `idx_types_demandes_actif` sur `actif`

**Valeurs initiales:**
```sql
INSERT INTO types_demandes (code, nom, description, delai_traitement) VALUES
('ATTESTATION_SCOLARITE', 'Attestation de scolarité', 'Document certifiant l''inscription', 3),
('RELEVE_NOTES', 'Relevé de notes', 'Document récapitulatif des notes', 5),
('ATTESTATION_REUSSITE', 'Attestation de réussite', 'Document certifiant la réussite', 5),
('DUPLICATA_CARTE', 'Duplicata carte étudiant', 'Remplacement carte perdue/volée', 7),
('CONVENTION_STAGE', 'Convention de stage', 'Document pour stage en entreprise', 3);
```

---

### Table: statuts

| Colonne      | Type         | Contraintes             | Description                    |
|--------------|--------------|-------------------------|--------------------------------|
| id           | SERIAL       | PRIMARY KEY             | Identifiant unique             |
| code         | VARCHAR(50)  | UNIQUE, NOT NULL        | Code statut (RECU, EN_COURS...)    |
| libelle      | VARCHAR(100) | NOT NULL                | Libellé complet                |
| description  | TEXT         |                         | Description du statut          |
| couleur      | VARCHAR(20)  |                         | Couleur UI (hex)               |
| ordre        | INTEGER      | NOT NULL                | Ordre dans le workflow         |
| est_final    | BOOLEAN      | DEFAULT FALSE           | Statut terminal                |
| date_creation| TIMESTAMP    | DEFAULT CURRENT_TIMESTAMP| Date de création              |

**Indexes:**
- `idx_statuts_code` sur `code`
- `idx_statuts_ordre` sur `ordre`

**Valeurs initiales:**
```sql
INSERT INTO statuts (code, libelle, description, couleur, ordre, est_final) VALUES
('SOUMIS', 'Soumis', 'Demande en cours de soumission', '#6B7280', 0, FALSE),
('RECU', 'Reçu', 'Demande reçue et enregistrée', '#3B82F6', 1, FALSE),
('EN_COURS', 'En cours', 'Demande en cours de traitement', '#F59E0B', 2, FALSE),
('ATTENTE_INFO', 'En attente', 'Informations complémentaires requises', '#F59E0B', 3, FALSE),
('VALIDE', 'Validé', 'Demande validée par administration', '#10B981', 4, FALSE),
('REJETE', 'Rejeté', 'Demande rejetée', '#EF4444', 5, TRUE),
('TRAITE', 'Traité', 'Demande traitée et terminée', '#059669', 6, TRUE),
('ARCHIVE', 'Archivé', 'Demande archivée', '#6B7280', 7, TRUE);
```

---

### Table: demandes

| Colonne             | Type        | Contraintes             | Description                    |
|---------------------|-------------|-------------------------|--------------------------------|
| id                  | SERIAL      | PRIMARY KEY             | Identifiant unique             |
| numero_demande      | VARCHAR(50) | UNIQUE, NOT NULL        | Numéro unique (ex: DEM-2024-001)|
| etudiant_id         | INTEGER     | FOREIGN KEY → etudiants.id | Référence étudiant        |
| type_demande_id     | INTEGER     | FOREIGN KEY → types_demandes.id | Type de demande      |
| statut_id           | INTEGER     | FOREIGN KEY → statuts.id | Statut actuel                 |
| objet               | VARCHAR(255)|                         | Objet de la demande            |
| description         | TEXT        |                         | Description détaillée          |
| priorite            | VARCHAR(20) | DEFAULT 'NORMALE'       | BASSE, NORMALE, HAUTE, URGENTE |
| date_creation       | TIMESTAMP   | DEFAULT CURRENT_TIMESTAMP| Date de soumission            |
| date_modification   | TIMESTAMP   | DEFAULT CURRENT_TIMESTAMP| Dernière modification         |
| date_traitement     | TIMESTAMP   |                         | Date de clôture                |
| traite_par_id       | INTEGER     | FOREIGN KEY → utilisateurs.id | Admin ayant traité       |
| commentaire_admin   | TEXT        |                         | Commentaire interne admin      |
| motif_refus         | TEXT        |                         | Motif si rejeté                |
| metadata            | JSON        |                         | Données additionnelles         |

**Indexes:**
- `idx_demandes_etudiant` sur `etudiant_id`
- `idx_demandes_statut` sur `statut_id`
- `idx_demandes_type` sur `type_demande_id`
- `idx_demandes_date_creation` sur `date_creation DESC`
- `idx_demandes_numero` sur `numero_demande`
- Composite: `idx_demandes_etudiant_statut` sur `(etudiant_id, statut_id)`

**Trigger pour numero_demande:**
```sql
CREATE OR REPLACE FUNCTION generate_numero_demande()
RETURNS TRIGGER AS $$
BEGIN
  NEW.numero_demande := 'DEM-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' ||
                        LPAD(nextval('demandes_seq')::TEXT, 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_generate_numero_demande
BEFORE INSERT ON demandes
FOR EACH ROW
EXECUTE FUNCTION generate_numero_demande();
```

---

### Table: documents

| Colonne         | Type         | Contraintes             | Description                    |
|-----------------|--------------|-------------------------|--------------------------------|
| id              | SERIAL       | PRIMARY KEY             | Identifiant unique             |
| demande_id      | INTEGER      | FOREIGN KEY → demandes.id | Demande associée            |
| nom_fichier     | VARCHAR(255) | NOT NULL                | Nom stocké (unique)            |
| nom_original    | VARCHAR(255) | NOT NULL                | Nom original du fichier        |
| chemin          | TEXT         | NOT NULL                | Chemin complet sur serveur     |
| type_mime       | VARCHAR(100) | NOT NULL                | Type MIME du fichier           |
| taille_octets   | BIGINT       | NOT NULL                | Taille en octets               |
| categorie       | VARCHAR(50)  |                         | Catégorie (JUSTIFICATIF, etc.) |
| date_upload     | TIMESTAMP    | DEFAULT CURRENT_TIMESTAMP| Date d'upload                |
| uploade_par_id  | INTEGER      | FOREIGN KEY → utilisateurs.id | Utilisateur ayant uploadé |

**Indexes:**
- `idx_documents_demande` sur `demande_id`
- `idx_documents_date` sur `date_upload DESC`

**Contraintes:**
- Types MIME autorisés: `application/pdf`, `image/jpeg`, `image/png`, `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- Taille max: 5 MB (5242880 octets)

---

### Table: historique

| Colonne              | Type        | Contraintes             | Description                    |
|----------------------|-------------|-------------------------|--------------------------------|
| id                   | SERIAL      | PRIMARY KEY             | Identifiant unique             |
| demande_id           | INTEGER     | FOREIGN KEY → demandes.id | Demande concernée           |
| statut_ancien_id     | INTEGER     | FOREIGN KEY → statuts.id | Statut précédent              |
| statut_nouveau_id    | INTEGER     | FOREIGN KEY → statuts.id | Nouveau statut                |
| utilisateur_id       | INTEGER     | FOREIGN KEY → utilisateurs.id | Utilisateur ayant fait l'action |
| date_changement      | TIMESTAMP   | DEFAULT CURRENT_TIMESTAMP| Date du changement            |
| commentaire          | TEXT        |                         | Commentaire optionnel          |
| type_action          | VARCHAR(50) |                         | Type: CREATION, CHANGEMENT_STATUT, MODIFICATION |
| donnees_modifiees    | JSON        |                         | Détails des modifications      |

**Indexes:**
- `idx_historique_demande` sur `demande_id`
- `idx_historique_date` sur `date_changement DESC`
- `idx_historique_utilisateur` sur `utilisateur_id`

**Trigger automatique:**
```sql
CREATE OR REPLACE FUNCTION log_demande_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.statut_id != NEW.statut_id THEN
    INSERT INTO historique (
      demande_id,
      statut_ancien_id,
      statut_nouveau_id,
      utilisateur_id,
      type_action
    ) VALUES (
      NEW.id,
      OLD.statut_id,
      NEW.statut_id,
      COALESCE(NEW.traite_par_id, 1), -- 1 = SYSTEM
      'CHANGEMENT_STATUT'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_log_demande_change
AFTER UPDATE ON demandes
FOR EACH ROW
EXECUTE FUNCTION log_demande_change();
```

---

### Table: utilisateurs

| Colonne          | Type         | Contraintes             | Description                    |
|------------------|--------------|-------------------------|--------------------------------|
| id               | SERIAL       | PRIMARY KEY             | Identifiant unique             |
| email            | VARCHAR(255) | UNIQUE, NOT NULL        | Email de connexion             |
| hash_password    | VARCHAR(255) | NOT NULL                | Hash bcrypt du mot de passe    |
| nom              | VARCHAR(100) | NOT NULL                | Nom                            |
| prenom           | VARCHAR(100) | NOT NULL                | Prénom                         |
| role             | VARCHAR(50)  | NOT NULL                | STUDENT, ADMIN, SUPER_ADMIN    |
| actif            | BOOLEAN      | DEFAULT TRUE            | Compte actif                   |
| derniere_connexion| TIMESTAMP   |                         | Dernière connexion             |
| date_creation    | TIMESTAMP    | DEFAULT CURRENT_TIMESTAMP| Date de création              |
| date_modification| TIMESTAMP    | DEFAULT CURRENT_TIMESTAMP| Dernière modification         |

**Indexes:**
- `idx_utilisateurs_email` sur `email`
- `idx_utilisateurs_role` sur `role`

**Valeurs initiales:**
```sql
-- Admin par défaut (password: Admin123!)
INSERT INTO utilisateurs (email, hash_password, nom, prenom, role) VALUES
('admin@university.edu', '$2b$10$...', 'Admin', 'System', 'SUPER_ADMIN'),
('agent1@university.edu', '$2b$10$...', 'Agent', 'Un', 'ADMIN');
```

---

### Table: notifications

| Colonne         | Type         | Contraintes             | Description                    |
|-----------------|--------------|-------------------------|--------------------------------|
| id              | SERIAL       | PRIMARY KEY             | Identifiant unique             |
| demande_id      | INTEGER      | FOREIGN KEY → demandes.id | Demande liée                |
| type            | VARCHAR(50)  | NOT NULL                | Type: EMAIL, SMS, PUSH         |
| destinataire    | VARCHAR(255) | NOT NULL                | Email ou numéro destinataire   |
| sujet           | VARCHAR(255) |                         | Sujet (pour email)             |
| contenu         | TEXT         | NOT NULL                | Contenu du message             |
| template_utilise| VARCHAR(100) |                         | Template utilisé               |
| statut_envoi    | VARCHAR(50)  | DEFAULT 'EN_ATTENTE'    | EN_ATTENTE, ENVOYE, ECHEC      |
| date_creation   | TIMESTAMP    | DEFAULT CURRENT_TIMESTAMP| Date de création              |
| date_envoi      | TIMESTAMP    |                         | Date d'envoi effectif          |
| nb_tentatives   | INTEGER      | DEFAULT 0               | Nombre de tentatives           |
| erreur          | TEXT         |                         | Message d'erreur si échec      |

**Indexes:**
- `idx_notifications_demande` sur `demande_id`
- `idx_notifications_statut` sur `statut_envoi`
- `idx_notifications_date` sur `date_creation DESC`

---

## Schéma Prisma Complet

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Etudiant {
  id                Int       @id @default(autoincrement())
  matricule         String    @unique @db.VarChar(20)
  nom               String    @db.VarChar(100)
  prenom            String    @db.VarChar(100)
  email             String    @unique @db.VarChar(255)
  dateNaissance     DateTime? @map("date_naissance") @db.Date
  telephone         String?   @db.VarChar(20)
  adresse           String?   @db.Text
  dateInscription   DateTime  @default(now()) @map("date_inscription") @db.Date
  niveauEtude       String?   @map("niveau_etude") @db.VarChar(50)
  filiere           String?   @db.VarChar(100)
  actif             Boolean   @default(true)
  dateCreation      DateTime  @default(now()) @map("date_creation")
  dateModification  DateTime  @updatedAt @map("date_modification")

  demandes          Demande[]

  @@index([matricule])
  @@index([email])
  @@index([nom, prenom])
  @@map("etudiants")
}

model TypeDemande {
  id                Int       @id @default(autoincrement())
  code              String    @unique @db.VarChar(50)
  nom               String    @db.VarChar(100)
  description       String?   @db.Text
  delaiTraitement   Int       @default(5) @map("delai_traitement")
  piecesRequises    Json?     @map("pieces_requises")
  actif             Boolean   @default(true)
  ordreAffichage    Int       @default(0) @map("ordre_affichage")
  dateCreation      DateTime  @default(now()) @map("date_creation")

  demandes          Demande[]

  @@index([code])
  @@index([actif])
  @@map("types_demandes")
}

model Statut {
  id                Int       @id @default(autoincrement())
  code              String    @unique @db.VarChar(50)
  libelle           String    @db.VarChar(100)
  description       String?   @db.Text
  couleur           String?   @db.VarChar(20)
  ordre             Int
  estFinal          Boolean   @default(false) @map("est_final")
  dateCreation      DateTime  @default(now()) @map("date_creation")

  demandes          Demande[]
  historiqueAncien  Historique[] @relation("StatutAncien")
  historiqueNouveau Historique[] @relation("StatutNouveau")

  @@index([code])
  @@index([ordre])
  @@map("statuts")
}

model Demande {
  id                Int         @id @default(autoincrement())
  numeroDemande     String      @unique @map("numero_demande") @db.VarChar(50)
  etudiantId        Int         @map("etudiant_id")
  typeDemandeId     Int         @map("type_demande_id")
  statutId          Int         @map("statut_id")
  objet             String?     @db.VarChar(255)
  description       String?     @db.Text
  priorite          String      @default("NORMALE") @db.VarChar(20)
  dateCreation      DateTime    @default(now()) @map("date_creation")
  dateModification  DateTime    @updatedAt @map("date_modification")
  dateTraitement    DateTime?   @map("date_traitement")
  traiteParId       Int?        @map("traite_par_id")
  commentaireAdmin  String?     @map("commentaire_admin") @db.Text
  motifRefus        String?     @map("motif_refus") @db.Text
  metadata          Json?

  etudiant          Etudiant    @relation(fields: [etudiantId], references: [id])
  typeDemande       TypeDemande @relation(fields: [typeDemandeId], references: [id])
  statut            Statut      @relation(fields: [statutId], references: [id])
  traitePar         Utilisateur? @relation(fields: [traiteParId], references: [id])

  documents         Document[]
  historique        Historique[]
  notifications     Notification[]

  @@index([etudiantId])
  @@index([statutId])
  @@index([typeDemandeId])
  @@index([dateCreation(sort: Desc)])
  @@index([numeroDemande])
  @@index([etudiantId, statutId])
  @@map("demandes")
}

model Document {
  id              Int       @id @default(autoincrement())
  demandeId       Int       @map("demande_id")
  nomFichier      String    @map("nom_fichier") @db.VarChar(255)
  nomOriginal     String    @map("nom_original") @db.VarChar(255)
  chemin          String    @db.Text
  typeMime        String    @map("type_mime") @db.VarChar(100)
  tailleOctets    BigInt    @map("taille_octets")
  categorie       String?   @db.VarChar(50)
  dateUpload      DateTime  @default(now()) @map("date_upload")
  uploadeParId    Int?      @map("uploade_par_id")

  demande         Demande   @relation(fields: [demandeId], references: [id], onDelete: Cascade)
  uploadePar      Utilisateur? @relation(fields: [uploadeParId], references: [id])

  @@index([demandeId])
  @@index([dateUpload(sort: Desc)])
  @@map("documents")
}

model Historique {
  id                 Int       @id @default(autoincrement())
  demandeId          Int       @map("demande_id")
  statutAncienId     Int?      @map("statut_ancien_id")
  statutNouveauId    Int       @map("statut_nouveau_id")
  utilisateurId      Int       @map("utilisateur_id")
  dateChangement     DateTime  @default(now()) @map("date_changement")
  commentaire        String?   @db.Text
  typeAction         String?   @map("type_action") @db.VarChar(50)
  donneesModifiees   Json?     @map("donnees_modifiees")

  demande            Demande   @relation(fields: [demandeId], references: [id], onDelete: Cascade)
  statutAncien       Statut?   @relation("StatutAncien", fields: [statutAncienId], references: [id])
  statutNouveau      Statut    @relation("StatutNouveau", fields: [statutNouveauId], references: [id])
  utilisateur        Utilisateur @relation(fields: [utilisateurId], references: [id])

  @@index([demandeId])
  @@index([dateChangement(sort: Desc)])
  @@index([utilisateurId])
  @@map("historique")
}

model Utilisateur {
  id                  Int       @id @default(autoincrement())
  email               String    @unique @db.VarChar(255)
  hashPassword        String    @map("hash_password") @db.VarChar(255)
  nom                 String    @db.VarChar(100)
  prenom              String    @db.VarChar(100)
  role                String    @db.VarChar(50)
  actif               Boolean   @default(true)
  derniereConnexion   DateTime? @map("derniere_connexion")
  dateCreation        DateTime  @default(now()) @map("date_creation")
  dateModification    DateTime  @updatedAt @map("date_modification")

  demandesTraitees    Demande[]
  historique          Historique[]
  documentsUploades   Document[]

  @@index([email])
  @@index([role])
  @@map("utilisateurs")
}

model Notification {
  id                Int       @id @default(autoincrement())
  demandeId         Int       @map("demande_id")
  type              String    @db.VarChar(50)
  destinataire      String    @db.VarChar(255)
  sujet             String?   @db.VarChar(255)
  contenu           String    @db.Text
  templateUtilise   String?   @map("template_utilise") @db.VarChar(100)
  statutEnvoi       String    @default("EN_ATTENTE") @map("statut_envoi") @db.VarChar(50)
  dateCreation      DateTime  @default(now()) @map("date_creation")
  dateEnvoi         DateTime? @map("date_envoi")
  nbTentatives      Int       @default(0) @map("nb_tentatives")
  erreur            String?   @db.Text

  demande           Demande   @relation(fields: [demandeId], references: [id], onDelete: Cascade)

  @@index([demandeId])
  @@index([statutEnvoi])
  @@index([dateCreation(sort: Desc)])
  @@map("notifications")
}
```

## Requêtes SQL Utiles

### Statistiques BI

```sql
-- Volume de demandes par type et par mois
SELECT
  td.nom as type_demande,
  DATE_TRUNC('month', d.date_creation) as mois,
  COUNT(*) as nombre_demandes
FROM demandes d
JOIN types_demandes td ON d.type_demande_id = td.id
WHERE d.date_creation >= NOW() - INTERVAL '12 months'
GROUP BY td.nom, DATE_TRUNC('month', d.date_creation)
ORDER BY mois DESC, nombre_demandes DESC;

-- Délai moyen de traitement par type
SELECT
  td.nom as type_demande,
  AVG(EXTRACT(EPOCH FROM (d.date_traitement - d.date_creation))/86400) as delai_jours,
  COUNT(*) as nb_demandes
FROM demandes d
JOIN types_demandes td ON d.type_demande_id = td.id
WHERE d.date_traitement IS NOT NULL
GROUP BY td.nom
ORDER BY delai_jours DESC;

-- Taux de validation par type
SELECT
  td.nom as type_demande,
  COUNT(*) as total,
  SUM(CASE WHEN s.code = 'TRAITE' THEN 1 ELSE 0 END) as valides,
  SUM(CASE WHEN s.code = 'REJETE' THEN 1 ELSE 0 END) as rejetes,
  ROUND(SUM(CASE WHEN s.code = 'TRAITE' THEN 1 ELSE 0 END)::NUMERIC / COUNT(*) * 100, 2) as taux_validation
FROM demandes d
JOIN types_demandes td ON d.type_demande_id = td.id
JOIN statuts s ON d.statut_id = s.id
WHERE s.est_final = TRUE
GROUP BY td.nom;

-- Demandes en cours par statut
SELECT
  s.libelle as statut,
  COUNT(*) as nombre,
  ROUND(COUNT(*)::NUMERIC / (SELECT COUNT(*) FROM demandes WHERE statut_id IN (SELECT id FROM statuts WHERE est_final = FALSE)) * 100, 2) as pourcentage
FROM demandes d
JOIN statuts s ON d.statut_id = s.id
WHERE s.est_final = FALSE
GROUP BY s.libelle, s.ordre
ORDER BY s.ordre;
```

Cette structure de base de données garantit:
- ✅ Normalisation (3NF)
- ✅ Intégrité référentielle
- ✅ Performance (indexes optimisés)
- ✅ Traçabilité complète
- ✅ Évolutivité
- ✅ Support BI natif
