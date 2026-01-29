'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createDemandeSchema, updateDemandeSchema, transitionDemandeSchema } from '@/lib/validators/demande';
import { Demande, Etudiant } from '@/lib/db/models';
import { DemandeWorkflow } from '@/lib/workflow/state-machine';
import { STATUTS_META } from '@/lib/workflow/constants';
import connectDB from '@/lib/db/mongodb';

type ActionResponse<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string; details?: unknown } };

/**
 * Create a new demande from form submission
 */
export async function createDemandeAction(
  formData: FormData
): Promise<ActionResponse<any>> {
  try {
    await connectDB();

    // Parse and validate form data
    const data = {
      typeDemande: formData.get('typeDemande'),
      objet: formData.get('objet'),
      description: formData.get('description'),
      priorite: formData.get('priorite') || 'NORMALE'
    };

    const validated = createDemandeSchema.parse(data);

    // Get current user (implement based on your auth)
    // This is a placeholder - replace with actual auth implementation
    // For now, use the first active etudiant from the database
    const etudiant = await Etudiant.findOne({ actif: true }).sort({ createdAt: 1 });
    if (!etudiant) {
      return {
        success: false,
        error: { code: 'RES_001', message: 'Aucun étudiant trouvé. Veuillez d\'abord exécuter le script de seed.' }
      };
    }

    // Create demande (use new + save to trigger pre-save hooks)
    const demande = new Demande({
      etudiant: {
        id: etudiant._id,
        nom: etudiant.nom,
        prenom: etudiant.prenom,
        email: etudiant.email,
        matricule: etudiant.matricule
      },
      typeDemande: {
        code: validated.typeDemande,
        nom: getTypeDemandeNom(validated.typeDemande),
        delaiTraitement: getDelaiTraitement(validated.typeDemande)
      },
      statut: {
        code: 'SOUMIS',
        ...STATUTS_META.SOUMIS
      },
      objet: validated.objet,
      description: validated.description,
      priorite: validated.priorite,
      documents: [],
      metadata: {}
    });
    await demande.save(); // This triggers pre-save hook for numeroDemande

    // Auto-transition to RECU
    const workflow = new DemandeWorkflow(demande, {
      userId: 'SYSTEM',
      userRole: 'SYSTEM' as any
    });
    await workflow.transition('RECU');

    // Revalidate cache
    revalidatePath('/demandes');
    revalidatePath('/dashboard');

    return { success: true, data: demande.toObject() };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: {
          code: 'VAL_001',
          message: 'Erreur de validation',
          details: error.flatten().fieldErrors
        }
      };
    }

    console.error('Create demande error:', error);
    return {
      success: false,
      error: { code: 'SRV_001', message: 'Erreur serveur' }
    };
  }
}

/**
 * Update demande fields
 */
export async function updateDemandeAction(
  demandeId: string,
  formData: FormData
): Promise<ActionResponse<any>> {
  try {
    await connectDB();

    // Parse and validate form data
    const data = {
      objet: formData.get('objet') || undefined,
      description: formData.get('description') || undefined,
      priorite: formData.get('priorite') || undefined
    };

    const validated = updateDemandeSchema.parse(data);

    // Update demande
    const demande = await Demande.findByIdAndUpdate(
      demandeId,
      { $set: validated },
      { new: true, runValidators: true }
    );

    if (!demande) {
      return {
        success: false,
        error: { code: 'RES_001', message: 'Demande non trouvée' }
      };
    }

    // Revalidate cache
    revalidatePath('/demandes');
    revalidatePath(`/demandes/${demandeId}`);

    return { success: true, data: demande.toObject() };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: {
          code: 'VAL_001',
          message: 'Erreur de validation',
          details: error.flatten().fieldErrors
        }
      };
    }

    console.error('Update demande error:', error);
    return {
      success: false,
      error: { code: 'SRV_001', message: 'Erreur serveur' }
    };
  }
}

/**
 * Soft delete demande
 */
export async function deleteDemandeAction(
  demandeId: string
): Promise<ActionResponse<null>> {
  try {
    await connectDB();

    // Soft delete by setting actif = false
    const demande = await Demande.findByIdAndUpdate(
      demandeId,
      { $set: { actif: false } },
      { new: true }
    );

    if (!demande) {
      return {
        success: false,
        error: { code: 'RES_001', message: 'Demande non trouvée' }
      };
    }

    // Revalidate cache
    revalidatePath('/demandes');

    return { success: true, data: null };
  } catch (error) {
    console.error('Delete demande error:', error);
    return {
      success: false,
      error: { code: 'SRV_001', message: 'Erreur serveur' }
    };
  }
}

/**
 * Transition demande to new status (admin action)
 */
export async function transitionDemandeAction(
  demandeId: string,
  formData: FormData
): Promise<ActionResponse<any>> {
  try {
    await connectDB();

    // Parse and validate
    const data = {
      newStatut: formData.get('newStatut'),
      commentaire: formData.get('commentaire') || undefined,
      motifRefus: formData.get('motifRefus') || undefined,
      traiteParId: formData.get('traiteParId') || undefined
    };

    const validated = transitionDemandeSchema.parse(data);

    // Get current user (implement based on your auth)
    // This is a placeholder - replace with actual auth implementation
    // For admin actions, using a placeholder ID is OK since it's just for logging
    const currentUser = { id: 'admin-placeholder', role: 'ADMIN' };

    // Fetch demande
    const demande = await Demande.findById(demandeId);
    if (!demande) {
      return {
        success: false,
        error: { code: 'RES_001', message: 'Demande non trouvée' }
      };
    }

    // Execute transition
    const workflow = new DemandeWorkflow(demande, {
      userId: currentUser.id,
      userRole: currentUser.role as any,
      commentaire: validated.commentaire,
      motifRefus: validated.motifRefus,
      traiteParId: validated.traiteParId
    });

    await workflow.transition(validated.newStatut);

    // Revalidate cache
    revalidatePath('/admin/demandes');
    revalidatePath(`/admin/demandes/${demandeId}`);
    revalidatePath('/demandes');
    revalidatePath(`/demandes/${demandeId}`);

    return { success: true, data: demande.toObject() };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: {
          code: 'VAL_001',
          message: 'Erreur de validation',
          details: error.flatten().fieldErrors
        }
      };
    }

    console.error('Transition demande error:', error);
    return {
      success: false,
      error: { code: 'SRV_001', message: 'Erreur serveur' }
    };
  }
}

// Helper functions
function getTypeDemandeNom(code: string): string {
  const names: Record<string, string> = {
    ATTESTATION_SCOLARITE: 'Attestation de scolarité',
    RELEVE_NOTES: 'Relevé de notes',
    ATTESTATION_REUSSITE: 'Attestation de réussite',
    DUPLICATA_CARTE: 'Duplicata de carte étudiant',
    CONVENTION_STAGE: 'Convention de stage'
  };
  return names[code] || code;
}

function getDelaiTraitement(code: string): number {
  const delais: Record<string, number> = {
    ATTESTATION_SCOLARITE: 3,
    RELEVE_NOTES: 5,
    ATTESTATION_REUSSITE: 7,
    DUPLICATA_CARTE: 10,
    CONVENTION_STAGE: 5
  };
  return delais[code] || 5;
}
