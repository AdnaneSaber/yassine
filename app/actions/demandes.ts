'use server';

import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth/auth-options';
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

    // Get authenticated user session
    const session = await getServerSession(authOptions);
    if (!session) {
      return {
        success: false,
        error: { code: 'AUTH_001', message: 'Non authentifié. Veuillez vous connecter.' }
      };
    }

    // Parse and validate form data
    const data = {
      typeDemande: formData.get('typeDemande'),
      objet: formData.get('objet'),
      description: formData.get('description'),
      priorite: formData.get('priorite') || 'NORMALE'
    };

    const validated = createDemandeSchema.parse(data);

    // Get the authenticated user's etudiant record
    const userId = (session.user as any).id;
    const userType = (session.user as any).type;

    // Only students can create demandes for themselves
    if (userType !== 'student') {
      return {
        success: false,
        error: { code: 'AUTH_002', message: 'Seuls les étudiants peuvent créer des demandes.' }
      };
    }

    const etudiant = await Etudiant.findById(userId);
    if (!etudiant || !etudiant.actif) {
      return {
        success: false,
        error: { code: 'RES_001', message: 'Étudiant non trouvé ou inactif.' }
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

    // Auto-transition to RECU (don't fail creation if this fails)
    try {
      const workflow = new DemandeWorkflow(demande, {
        userId: 'SYSTEM',
        userRole: 'SYSTEM' as any
      });
      await workflow.transition('RECU');
    } catch (workflowError) {
      // Log workflow error but don't fail the creation
      console.error('Workflow transition error (demande created successfully):', workflowError);
      // The demande was created successfully, just couldn't auto-transition
    }

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

    // Get authenticated user session
    const session = await getServerSession(authOptions);
    if (!session) {
      return {
        success: false,
        error: { code: 'AUTH_001', message: 'Non authentifié. Veuillez vous connecter.' }
      };
    }

    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;

    // Only admins can transition demande statuses
    if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
      return {
        success: false,
        error: { code: 'AUTH_003', message: 'Autorisation requise. Accès administrateur nécessaire.' }
      };
    }

    // Parse and validate
    const data = {
      newStatut: formData.get('newStatut'),
      commentaire: formData.get('commentaire') || undefined,
      motifRefus: formData.get('motifRefus') || undefined,
      traiteParId: formData.get('traiteParId') || userId // Use current admin's ID if not provided
    };

    const validated = transitionDemandeSchema.parse(data);

    const currentUser = { id: userId, role: userRole };

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
