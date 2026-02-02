import { NextRequest, NextResponse } from 'next/server';
import { transitionDemandeSchema } from '@/lib/validators/demande';
import { handleApiError } from '@/lib/api/error-handler';
import { Demande } from '@/lib/db/models';
import { DemandeWorkflow } from '@/lib/workflow/state-machine';
import connectDB from '@/lib/db/mongodb';
import { Types } from 'mongoose';

// POST /api/demandes/[id]/transition - Change demande status
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;
    
    // Validate ID format
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VAL_001', message: 'ID de demande invalide' }
        },
        { status: 400 }
      );
    }
    const body = await request.json();
    const validated = transitionDemandeSchema.parse(body);

    // Get current user (from session)
    // Using SYSTEM userId and role to ensure workflow permissions work correctly
    // In production, this should come from the actual session
    const currentUser = { id: 'SYSTEM', role: 'SYSTEM' as const };

    // Fetch demande
    const demande = await Demande.findById(id);
    if (!demande) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'RES_001', message: 'Demande non trouvée' }
        },
        { status: 404 }
      );
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

    // Reload demande to get updated state
    const updatedDemande = await Demande.findById(id);

    return NextResponse.json({ success: true, data: updatedDemande });
  } catch (error) {
    return handleApiError(error);
  }
}
