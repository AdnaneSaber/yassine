/**
 * Migration script to add actif=true to all existing demands
 * Run with: npx tsx scripts/migrate-add-actif.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

import mongoose from 'mongoose';
import connectDB from '../lib/db/mongodb';
import { Demande } from '../lib/db/models';

async function migrate() {
  try {
    console.log('Connecting to database...');
    await connectDB();

    console.log('Updating all demands without actif field...');
    const result = await Demande.updateMany(
      { actif: { $exists: false } },
      { $set: { actif: true } }
    );

    console.log(`✓ Updated ${result.modifiedCount} demands`);

    // Verify
    const totalDemands = await Demande.countDocuments({});
    const demandsWithActif = await Demande.countDocuments({ actif: true });
    const demandsWithoutActif = await Demande.countDocuments({ actif: { $exists: false } });

    console.log('\nVerification:');
    console.log(`Total demands: ${totalDemands}`);
    console.log(`Demands with actif=true: ${demandsWithActif}`);
    console.log(`Demands without actif field: ${demandsWithoutActif}`);

    console.log('\n✓ Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

migrate();
