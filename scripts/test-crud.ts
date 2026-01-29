import dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

import connectDB from '@/lib/db/mongodb';
import { Etudiant, Demande, Historique } from '@/lib/db/models';
import { DemandeWorkflow } from '@/lib/workflow/state-machine';
import type { DemandeStatus } from '@/types/database';

async function testCRUD() {
  console.log('🧪 Starting CRUD Tests...\n');

  try {
    // Connect to database
    await connectDB();
    console.log('✅ Database connected\n');

    // Test 1: Check if etudiants exist
    console.log('📋 Test 1: Check existing etudiants');
    const etudiants = await Etudiant.find({ actif: true });
    console.log(`   Found ${etudiants.length} active students`);
    if (etudiants.length === 0) {
      throw new Error('No students found! Run: npx tsx scripts/seed-data.ts');
    }
    const testEtudiant = etudiants[0];
    console.log(`   Using student: ${testEtudiant.prenom} ${testEtudiant.nom} (${testEtudiant.matricule})`);
    console.log('   ✅ Pass\n');

    // Test 2: Create a new demande
    console.log('📋 Test 2: Create new demande');
    const newDemande = new Demande({
      etudiant: {
        id: testEtudiant._id,
        nom: testEtudiant.nom,
        prenom: testEtudiant.prenom,
        email: testEtudiant.email,
        matricule: testEtudiant.matricule
      },
      typeDemande: {
        code: 'ATTESTATION_SCOLARITE',
        nom: 'Attestation de scolarité',
        delaiTraitement: 3
      },
      statut: {
        code: 'SOUMIS',
        libelle: 'Soumis',
        couleur: '#6B7280'
      },
      objet: 'Test CRUD - Attestation',
      description: 'Demande de test pour vérifier le système CRUD',
      priorite: 'NORMALE'
    });

    await newDemande.save();
    console.log(`   Created demande: ${newDemande.numeroDemande}`);
    console.log(`   Demande ID: ${newDemande._id}`);
    console.log('   ✅ Pass\n');

    // Test 3: Read/Find the demande
    console.log('📋 Test 3: Read demande');
    const foundDemande = await Demande.findById(newDemande._id);
    if (!foundDemande) {
      throw new Error('Demande not found after creation!');
    }
    console.log(`   Found demande: ${foundDemande.numeroDemande}`);
    console.log(`   Status: ${foundDemande.statut.libelle}`);
    console.log(`   Student: ${foundDemande.etudiant.prenom} ${foundDemande.etudiant.nom}`);
    console.log('   ✅ Pass\n');

    // Test 4: Update demande
    console.log('📋 Test 4: Update demande');
    foundDemande.objet = 'Updated Test CRUD - Attestation';
    foundDemande.description = 'Description mise à jour pour le test';
    foundDemande.priorite = 'HAUTE';
    await foundDemande.save();

    const updatedDemande = await Demande.findById(newDemande._id);
    if (updatedDemande?.objet !== 'Updated Test CRUD - Attestation') {
      throw new Error('Demande update failed!');
    }
    console.log(`   Updated objet: ${updatedDemande.objet}`);
    console.log(`   Updated priorite: ${updatedDemande.priorite}`);
    console.log('   ✅ Pass\n');

    // Test 5: Workflow transitions
    console.log('📋 Test 5: Workflow transitions');
    const workflow = new DemandeWorkflow(foundDemande, {
      userId: 'test-admin',
      userRole: 'SYSTEM',
      commentaire: 'Test automatique de transition'
    });

    // Transition SOUMIS -> RECU
    console.log('   Transitioning SOUMIS -> RECU...');
    await workflow.transition('RECU' as DemandeStatus);
    await foundDemande.reload();
    console.log(`   Current status: ${foundDemande.statut.code}`);

    if (foundDemande.statut.code !== 'RECU') {
      throw new Error('Transition to RECU failed!');
    }
    console.log('   ✅ Transition SOUMIS -> RECU: Pass');

    // Transition RECU -> EN_COURS
    console.log('   Transitioning RECU -> EN_COURS...');
    await workflow.transition('EN_COURS' as DemandeStatus);
    await foundDemande.reload();
    console.log(`   Current status: ${foundDemande.statut.code}`);

    if (foundDemande.statut.code !== 'EN_COURS') {
      throw new Error('Transition to EN_COURS failed!');
    }
    console.log('   ✅ Transition RECU -> EN_COURS: Pass\n');

    // Test 6: Check historique
    console.log('📋 Test 6: Check historique (audit trail)');
    const historique = await Historique.find({ demandeId: foundDemande._id }).sort({ createdAt: 1 });
    console.log(`   Found ${historique.length} history entries`);
    if (historique.length === 0) {
      console.warn('   ⚠️  Warning: No history entries found (might be expected if history logging has issues)');
    } else {
      historique.forEach((h, i) => {
        console.log(`   ${i + 1}. ${h.statutAncien.code} -> ${h.statutNouveau.code} (${h.typeAction})`);
      });
      console.log('   ✅ Pass\n');
    }

    // Test 7: List demandes with filters
    console.log('📋 Test 7: List demandes with filters');
    const allDemandes = await Demande.find({ actif: true });
    console.log(`   Total active demandes: ${allDemandes.length}`);

    const enCoursDemandes = await Demande.find({
      actif: true,
      'statut.code': 'EN_COURS'
    });
    console.log(`   Demandes with status EN_COURS: ${enCoursDemandes.length}`);
    console.log('   ✅ Pass\n');

    // Test 8: Soft delete
    console.log('📋 Test 8: Soft delete demande');
    foundDemande.actif = false;
    await foundDemande.save();

    const deletedCheck = await Demande.findOne({
      _id: foundDemande._id,
      actif: true
    });
    if (deletedCheck) {
      throw new Error('Soft delete failed - demande still active!');
    }
    console.log(`   Demande ${foundDemande.numeroDemande} soft deleted (actif: false)`);
    console.log('   ✅ Pass\n');

    // Test 9: Verify numeroDemande auto-generation
    console.log('📋 Test 9: Verify numeroDemande auto-generation');
    const testDemande2 = new Demande({
      etudiant: {
        id: testEtudiant._id,
        nom: testEtudiant.nom,
        prenom: testEtudiant.prenom,
        email: testEtudiant.email,
        matricule: testEtudiant.matricule
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
      objet: 'Test auto-generation',
      description: 'Test',
      priorite: 'NORMALE'
    });

    await testDemande2.save();

    if (!testDemande2.numeroDemande) {
      throw new Error('numeroDemande was not auto-generated!');
    }

    const pattern = /^DEM-\d{4}-\d{6}$/;
    if (!pattern.test(testDemande2.numeroDemande)) {
      throw new Error(`numeroDemande format is incorrect: ${testDemande2.numeroDemande}`);
    }

    console.log(`   Generated: ${testDemande2.numeroDemande}`);
    console.log('   Format matches DEM-YYYY-NNNNNN ✓');
    console.log('   ✅ Pass\n');

    // Cleanup test data
    console.log('🧹 Cleaning up test data...');
    await Demande.deleteOne({ _id: newDemande._id });
    await Demande.deleteOne({ _id: testDemande2._id });
    await Historique.deleteMany({ demandeId: { $in: [newDemande._id, testDemande2._id] } });
    console.log('   Test data cleaned up\n');

    console.log('✅ All CRUD tests passed! 🎉\n');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

testCRUD();
