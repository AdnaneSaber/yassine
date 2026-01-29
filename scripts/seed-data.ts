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
      niveauEtude: 'M2',
      filiere: 'Business Intelligence & Digitalisation',
      actif: true
    },
    {
      matricule: '2024002',
      nom: 'ALAMI',
      prenom: 'Sara',
      email: 'sara.alami@university.edu',
      niveauEtude: 'M1',
      filiere: 'Data Science',
      actif: true
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
      objet: 'Attestation pour dossier CAF',
      description: 'J\'ai besoin d\'une attestation de scolarité pour mon dossier CAF avant le 30/01/2024',
      priorite: 'NORMALE'
    }
  ]);

  console.log('✅ Database seeded successfully');
  process.exit(0);
}

seedDatabase().catch(console.error);
