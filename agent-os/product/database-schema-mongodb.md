# Schéma de Base de Données MongoDB

## Architecture MongoDB

MongoDB utilise un modèle de données orienté documents (NoSQL) plutôt que relationnel. Les données sont stockées en collections de documents JSON/BSON.

## Collections Principales

### Collection: `etudiants`

```typescript
// Mongoose Schema
import mongoose from 'mongoose';

const etudiantSchema = new mongoose.Schema({
  matricule: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    maxlength: 20
  },
  nom: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  prenom: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: /^\S+@\S+\.\S+$/
  },
  dateNaissance: Date,
  telephone: {
    type: String,
    trim: true
  },
  adresse: String,
  niveauEtude: {
    type: String,
    enum: ['L1', 'L2', 'L3', 'M1', 'M2', 'Doctorat']
  },
  filiere: String,
  actif: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true // createdAt, updatedAt auto
});

// Indexes
etudiantSchema.index({ matricule: 1 });
etudiantSchema.index({ email: 1 });
etudiantSchema.index({ nom: 1, prenom: 1 });

export const Etudiant = mongoose.model('Etudiant', etudiantSchema);
```

**Exemple de document:**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "matricule": "2024001",
  "nom": "SABER",
  "prenom": "Adnane",
  "email": "adnane.saber@university.edu",
  "dateNaissance": "2000-05-15T00:00:00.000Z",
  "telephone": "+212 6XX XX XX XX",
  "niveauEtude": "M2",
  "filiere": "Business Intelligence & Digitalisation",
  "actif": true,
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-01-15T10:00:00.000Z"
}
```

---

### Collection: `demandes`

```typescript
const demandeSchema = new mongoose.Schema({
  numeroDemande: {
    type: String,
    required: true,
    unique: true
  },
  // Embedded subdocument - données dénormalisées pour performance
  etudiant: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Etudiant',
      required: true
    },
    nom: String,
    prenom: String,
    email: String,
    matricule: String
  },
  typeDemande: {
    code: {
      type: String,
      required: true,
      enum: [
        'ATTESTATION_SCOLARITE',
        'RELEVE_NOTES',
        'ATTESTATION_REUSSITE',
        'DUPLICATA_CARTE',
        'CONVENTION_STAGE'
      ]
    },
    nom: String,
    delaiTraitement: Number
  },
  statut: {
    code: {
      type: String,
      required: true,
      enum: ['SOUMIS', 'RECU', 'EN_COURS', 'ATTENTE_INFO', 'VALIDE', 'REJETE', 'TRAITE', 'ARCHIVE']
    },
    libelle: String,
    couleur: String
  },
  objet: {
    type: String,
    maxlength: 255
  },
  description: String,
  priorite: {
    type: String,
    enum: ['BASSE', 'NORMALE', 'HAUTE', 'URGENTE'],
    default: 'NORMALE'
  },
  // Array de documents embarqués
  documents: [{
    id: String,
    nomFichier: String,
    nomOriginal: String,
    url: String, // Cloudinary URL
    typeMime: String,
    taille: Number,
    categorie: String,
    dateUpload: {
      type: Date,
      default: Date.now
    }
  }],
  commentaireAdmin: String,
  motifRefus: String,
  dateTraitement: Date,
  traiteParId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Utilisateur'
  },
  // Métadonnées flexibles selon le type de demande
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes composites
demandeSchema.index({ numeroDemande: 1 });
demandeSchema.index({ 'etudiant.id': 1 });
demandeSchema.index({ 'statut.code': 1 });
demandeSchema.index({ 'typeDemande.code': 1 });
demandeSchema.index({ createdAt: -1 });
demandeSchema.index({ 'etudiant.id': 1, 'statut.code': 1 }); // Compound

// Pre-save middleware pour générer numeroDemande
demandeSchema.pre('save', async function(next) {
  if (!this.numeroDemande) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments({
      numeroDemande: new RegExp(`^DEM-${year}-`)
    });
    this.numeroDemande = `DEM-${year}-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

export const Demande = mongoose.model('Demande', demandeSchema);
```

**Exemple de document:**
```json
{
  "_id": "65a1b2c3d4e5f6789abcdef0",
  "numeroDemande": "DEM-2024-000042",
  "etudiant": {
    "id": "507f1f77bcf86cd799439011",
    "nom": "SABER",
    "prenom": "Adnane",
    "email": "adnane.saber@university.edu",
    "matricule": "2024001"
  },
  "typeDemande": {
    "code": "ATTESTATION_SCOLARITE",
    "nom": "Attestation de scolarité",
    "delaiTraitement": 3
  },
  "statut": {
    "code": "EN_COURS",
    "libelle": "En cours de traitement",
    "couleur": "#F59E0B"
  },
  "objet": "Demande d'attestation pour dossier CAF",
  "description": "J'ai besoin d'une attestation de scolarité pour mon dossier CAF avant le 30/01/2024",
  "priorite": "NORMALE",
  "documents": [
    {
      "id": "doc_abc123",
      "nomFichier": "1705328400000_justificatif.pdf",
      "nomOriginal": "justificatif_identite.pdf",
      "url": "https://res.cloudinary.com/university/demandes/42/justificatif.pdf",
      "typeMime": "application/pdf",
      "taille": 245678,
      "categorie": "JUSTIFICATIF",
      "dateUpload": "2024-01-15T10:00:00.000Z"
    }
  ],
  "commentaireAdmin": "Vérification identité en cours",
  "metadata": {
    "destinataire": "CAF",
    "urgence": false
  },
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-01-16T14:30:00.000Z"
}
```

---

### Collection: `historique`

```typescript
const historiqueSchema = new mongoose.Schema({
  demandeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Demande',
    required: true
  },
  numeroDemandeRef: String, // Dénormalisé pour queries
  statutAncien: {
    code: String,
    libelle: String
  },
  statutNouveau: {
    code: {
      type: String,
      required: true
    },
    libelle: String
  },
  utilisateur: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Utilisateur'
    },
    nom: String,
    role: String
  },
  typeAction: {
    type: String,
    enum: ['CREATION', 'CHANGEMENT_STATUT', 'MODIFICATION', 'COMMENTAIRE'],
    default: 'CHANGEMENT_STATUT'
  },
  commentaire: String,
  donneesModifiees: mongoose.Schema.Types.Mixed
}, {
  timestamps: true // Pour createdAt
});

historiqueSchema.index({ demandeId: 1 });
historiqueSchema.index({ createdAt: -1 });
historiqueSchema.index({ 'utilisateur.id': 1 });

export const Historique = mongoose.model('Historique', historiqueSchema);
```

**Exemple de document:**
```json
{
  "_id": "65a1b2c3d4e5f6789abcdef1",
  "demandeId": "65a1b2c3d4e5f6789abcdef0",
  "numeroDemandeRef": "DEM-2024-000042",
  "statutAncien": {
    "code": "RECU",
    "libelle": "Reçu"
  },
  "statutNouveau": {
    "code": "EN_COURS",
    "libelle": "En cours de traitement"
  },
  "utilisateur": {
    "id": "65a1b2c3d4e5f6789abcdef2",
    "nom": "Admin Scolarité",
    "role": "ADMIN"
  },
  "typeAction": "CHANGEMENT_STATUT",
  "commentaire": "Prise en charge du dossier",
  "createdAt": "2024-01-16T09:15:00.000Z"
}
```

---

### Collection: `utilisateurs`

```typescript
const utilisateurSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  hashPassword: {
    type: String,
    required: true
  },
  nom: {
    type: String,
    required: true
  },
  prenom: {
    type: String,
    required: true
  },
  role: {
    type: String,
    required: true,
    enum: ['STUDENT', 'ADMIN', 'SUPER_ADMIN']
  },
  actif: {
    type: Boolean,
    default: true
  },
  derniereConnexion: Date
}, {
  timestamps: true
});

utilisateurSchema.index({ email: 1 });
utilisateurSchema.index({ role: 1 });

// Méthode pour comparer passwords
utilisateurSchema.methods.comparePassword = async function(candidatePassword: string) {
  return await bcrypt.compare(candidatePassword, this.hashPassword);
};

export const Utilisateur = mongoose.model('Utilisateur', utilisateurSchema);
```

---

### Collection: `notifications`

```typescript
const notificationSchema = new mongoose.Schema({
  demandeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Demande',
    required: true
  },
  type: {
    type: String,
    enum: ['EMAIL', 'SMS'],
    default: 'EMAIL'
  },
  destinataire: {
    type: String,
    required: true
  },
  sujet: String,
  contenu: {
    type: String,
    required: true
  },
  templateUtilise: String,
  statutEnvoi: {
    type: String,
    enum: ['EN_ATTENTE', 'ENVOYE', 'ECHEC'],
    default: 'EN_ATTENTE'
  },
  nbTentatives: {
    type: Number,
    default: 0
  },
  dateEnvoi: Date,
  erreur: String
}, {
  timestamps: true
});

notificationSchema.index({ demandeId: 1 });
notificationSchema.index({ statutEnvoi: 1 });
notificationSchema.index({ createdAt: -1 });

export const Notification = mongoose.model('Notification', notificationSchema);
```

---

## Avantages du Modèle MongoDB pour ce Projet

### 1. Dénormalisation Stratégique
```json
// Au lieu de JOIN coûteux, données embarquées:
{
  "demande": {
    "etudiant": {
      "nom": "SABER",      // Copie
      "email": "..."        // Copie
    }
  }
}
// ✅ Lecture ultra-rapide, pas de JOIN
// ⚠️ Update: si nom change, update demandes (rare)
```

### 2. Documents Flexibles
```json
{
  "metadata": {
    // Différent selon type de demande
    "nbExemplaires": 2,           // Pour attestations
    "entreprise": "Acme Corp",    // Pour conventions
    "periode": "2023-2024"        // Pour relevés
  }
}
```

### 3. Arrays Embarqués
```json
{
  "documents": [
    { "url": "...", "type": "PDF" },
    { "url": "...", "type": "IMAGE" }
  ]
  // ✅ Pas de table séparée, requête unique
}
```

---

## Requêtes MongoDB Courantes

### Trouver toutes les demandes d'un étudiant

```javascript
await Demande.find({ 'etudiant.id': etudiantId })
  .sort({ createdAt: -1 })
  .limit(20);
```

### Filtrer par statut et type

```javascript
await Demande.find({
  'statut.code': 'EN_COURS',
  'typeDemande.code': 'ATTESTATION_SCOLARITE'
});
```

### Aggregate: Statistiques par type

```javascript
await Demande.aggregate([
  {
    $group: {
      _id: '$typeDemande.code',
      count: { $sum: 1 },
      avgDelai: {
        $avg: {
          $divide: [
            { $subtract: ['$dateTraitement', '$createdAt'] },
            86400000 // Convertir ms en jours
          ]
        }
      }
    }
  },
  { $sort: { count: -1 } }
]);
```

### Aggregate: Évolution mensuelle

```javascript
await Demande.aggregate([
  {
    $match: {
      createdAt: { $gte: new Date('2024-01-01') }
    }
  },
  {
    $group: {
      _id: {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' }
      },
      total: { $sum: 1 },
      valides: {
        $sum: {
          $cond: [{ $eq: ['$statut.code', 'TRAITE'] }, 1, 0]
        }
      },
      rejetes: {
        $sum: {
          $cond: [{ $eq: ['$statut.code', 'REJETE'] }, 1, 0]
        }
      }
    }
  },
  { $sort: { '_id.year': 1, '_id.month': 1 } }
]);
```

### Aggregate: Taux de validation par type

```javascript
await Demande.aggregate([
  {
    $match: {
      'statut.code': { $in: ['TRAITE', 'REJETE'] }
    }
  },
  {
    $group: {
      _id: '$typeDemande.code',
      total: { $sum: 1 },
      valides: {
        $sum: { $cond: [{ $eq: ['$statut.code', 'TRAITE'] }, 1, 0] }
      }
    }
  },
  {
    $project: {
      typeDemande: '$_id',
      total: 1,
      valides: 1,
      tauxValidation: {
        $multiply: [
          { $divide: ['$valides', '$total'] },
          100
        ]
      }
    }
  }
]);
```

---

## MongoDB Atlas Setup

### 1. Créer un Cluster Gratuit
```bash
# M0 (Free Tier)
- 512 MB storage
- Shared RAM
- Backup automatique
```

### 2. Configurer Connection String
```bash
mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/university?retryWrites=true&w=majority
```

### 3. Mongoose Connection (Next.js)

```typescript
// lib/db/mongodb.ts
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI must be defined');
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;
```

---

## Données de Test (Seed)

```typescript
// scripts/seed.ts
import connectDB from '@/lib/db/mongodb';
import { Etudiant, Demande, Utilisateur } from '@/lib/db/models';
import bcrypt from 'bcryptjs';

async function seed() {
  await connectDB();

  // Clear existing
  await Etudiant.deleteMany({});
  await Demande.deleteMany({});
  await Utilisateur.deleteMany({});

  // Create admin
  const admin = await Utilisateur.create({
    email: 'admin@university.edu',
    hashPassword: await bcrypt.hash('Admin123!', 10),
    nom: 'Admin',
    prenom: 'System',
    role: 'SUPER_ADMIN'
  });

  // Create students
  const etudiants = await Etudiant.create([
    {
      matricule: '2024001',
      nom: 'SABER',
      prenom: 'Adnane',
      email: 'adnane@university.edu',
      niveauEtude: 'M2',
      filiere: 'Business Intelligence'
    },
    {
      matricule: '2024002',
      nom: 'ALAMI',
      prenom: 'Sara',
      email: 'sara@university.edu',
      niveauEtude: 'M1',
      filiere: 'Data Science'
    }
  ]);

  // Create sample demandes
  await Demande.create([
    {
      etudiant: {
        id: etudiants[0]._id,
        nom: etudiants[0].nom,
        prenom: etudiants[0].prenom,
        email: etudiants[0].email,
        matricule: etudiants[0].matricule
      },
      typeDemande: {
        code: 'ATTESTATION_SCOLARITE',
        nom: 'Attestation de scolarité',
        delaiTraitement: 3
      },
      statut: {
        code: 'EN_COURS',
        libelle: 'En cours',
        couleur: '#F59E0B'
      },
      objet: 'Attestation pour CAF',
      description: 'Besoin pour dossier CAF',
      priorite: 'NORMALE'
    }
  ]);

  console.log('✅ Database seeded successfully');
}

seed();
```

---

## Backup & Restore

### Backup avec mongodump
```bash
mongodump --uri="mongodb+srv://..." --out=./backup
```

### Restore avec mongorestore
```bash
mongorestore --uri="mongodb+srv://..." ./backup
```

---

## MongoDB Charts (BI)

### Configuration
1. Activer Charts dans Atlas
2. Créer Data Source → Pointer vers cluster
3. Créer Dashboard avec widgets:
   - Volume demandes (Line chart)
   - Répartition par type (Pie chart)
   - Délais moyens (Bar chart)
   - KPIs (Number charts)

### Embedding dans Next.js
```typescript
<iframe
  src="https://charts.mongodb.com/charts-project-xxxxx/embed/dashboards?id=xxxxx"
  width="100%"
  height="600"
/>
```

---

## Avantages MongoDB pour PoC Académique

✅ **Setup rapide**: Atlas en 5 minutes
✅ **Gratuit**: 512 MB largement suffisant
✅ **Flexible**: Schéma évolutif sans migrations
✅ **Performant**: Indexes + dénormalisation
✅ **BI intégré**: Charts gratuit inclus
✅ **Cloud natif**: Pas d'infrastructure à gérer
✅ **TypeScript**: Mongoose + types
✅ **Moderne**: Stack utilisé en production

## Inconvénients vs SQL (à connaître)

⚠️ **Pas de transactions ACID complexes** (mais suffisant pour ce projet)
⚠️ **Dénormalisation**: Risque de données dupliquées
⚠️ **Pas de JOINs SQL** (mais aggregate pipeline équivalent)
⚠️ **Moins standard**: Plus de variations entre NoSQL

**Pour ce projet académique: MongoDB est le meilleur choix**
