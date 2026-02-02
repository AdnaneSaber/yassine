import dotenv from 'dotenv';
import { resolve } from 'path';
import { readFileSync } from 'fs';

// Load environment variables from .env.local
const envPath = resolve(process.cwd(), '.env.local');
try {
  const envContent = readFileSync(envPath, 'utf-8');
  const lines = envContent.split('\n');
  for (const line of lines) {
    const match = line.match(/^export\s+(\w+)="(.+)"\s*$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].replace(/^"|"$/g, '');
    }
  }
} catch {
  dotenv.config({ path: envPath });
}

import connectDB from '@/lib/db/mongodb';
import { Etudiant, Demande, Utilisateur } from '@/lib/db/models';
import bcrypt from 'bcryptjs';

async function seedDatabase() {
  await connectDB();

  // Clear existing data (development only!)
  await Etudiant.deleteMany({});
  await Demande.deleteMany({});
  await Utilisateur.deleteMany({});

  // Create admin user
  const admin = await Utilisateur.create({
    email: 'admin@university.edu',
    hashPassword: await bcrypt.hash('Admin123!', 10),
    nom: 'Admin',
    prenom: 'System',
    role: 'SUPER_ADMIN',
    actif: true
  });

  // Create students
  const etudiants = await Etudiant.create([
    {
      matricule: '2024001',
      nom: 'SABER',
      prenom: 'Adnane',
      email: 'adnane.saber@university.edu',
      hashPassword: await bcrypt.hash('password123', 10),
      niveauEtude: 'M2',
      filiere: 'Business Intelligence & Digitalisation',
      actif: true
    },
    {
      matricule: '2024002',
      nom: 'ALAMI',
      prenom: 'Sara',
      email: 'sara.alami@university.edu',
      hashPassword: await bcrypt.hash('password123', 10),
      niveauEtude: 'M1',
      filiere: 'Data Science',
      actif: true
    }
  ]);

  // Create sample demandes (one by one to trigger pre-save hooks)
  const demande1 = new Demande({
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
    objet: 'Attestation pour dossier CAF',
    description: 'J\'ai besoin d\'une attestation de scolarité pour mon dossier CAF avant le 30/01/2024',
    priorite: 'NORMALE'
  });
  await demande1.save();

  const demande2 = new Demande({
    etudiant: {
      id: etudiants[1]._id,
      nom: etudiants[1].nom,
      prenom: etudiants[1].prenom,
      email: etudiants[1].email,
      matricule: etudiants[1].matricule
    },
    typeDemande: {
      code: 'RELEVE_NOTES',
      nom: 'Relevé de notes',
      delaiTraitement: 5
    },
    statut: {
      code: 'SOUMIS',
      libelle: 'Soumis',
      couleur: '#6B7280'
    },
    objet: 'Relevé de notes S1 2024',
    description: 'Demande de relevé de notes du premier semestre 2024 pour candidature master',
    priorite: 'HAUTE'
  });
  await demande2.save();

  console.log('✅ Created demandes:', demande1.numeroDemande, demande2.numeroDemande);

  console.log('✅ Database seeded successfully');
  process.exit(0);
}

seedDatabase().catch(console.error);
