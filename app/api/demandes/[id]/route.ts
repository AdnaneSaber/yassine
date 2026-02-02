import { NextRequest, NextResponse } from 'next/server';
import { updateDemandeSchema } from '@/lib/validators/demande';
import { handleApiError } from '@/lib/api/error-handler';
import { Demande } from '@/lib/db/models';
import connectDB from '@/lib/db/mongodb';
import { Types } from 'mongoose';

// Helper to validate ObjectId
function validateId(id: string): NextResponse | null {
  if (!Types.ObjectId.isValid(id)) {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'VAL_001', message: 'ID de demande invalide' }
      },
      { status: 400 }
    );
  }
  return null;
}

// GET /api/demandes/[id] - Get single demande
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;
    
    // Validate ID format
    const idError = validateId(id);
    if (idError) return idError;
    
    const demande = await Demande.findById(id);

    if (!demande) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RES_001',
            message: 'Demande non trouvée',
            details: { id }
          }
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: demande });
  } catch (error) {
    return handleApiError(error);
  }
}

// PATCH /api/demandes/[id] - Update demande
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;
    
    // Validate ID format
    const idError = validateId(id);
    if (idError) return idError;
    
    const body = await request.json();
    const validated = updateDemandeSchema.parse(body);
    
    // Transform typeDemande string to object if needed
    const updateData: any = { ...validated };
    if (validated.typeDemande && typeof validated.typeDemande === 'string') {
      const typeCode = validated.typeDemande;
      const typeNames: Record<string, string> = {
        'ATTESTATION_SCOLARITE': 'Attestation de scolarité',
        'RELEVE_NOTES': 'Relevé de notes',
        'ATTESTATION_REUSSITE': 'Attestation de réussite',
        'DUPLICATA_CARTE': 'Duplicata de carte étudiant',
        'CONVENTION_STAGE': 'Convention de stage'
      };
      const typeDelais: Record<string, number> = {
        'ATTESTATION_SCOLARITE': 3,
        'RELEVE_NOTES': 5,
        'ATTESTATION_REUSSITE': 3,
        'DUPLICATA_CARTE': 7,
        'CONVENTION_STAGE': 10
      };
      updateData.typeDemande = {
        code: typeCode,
        nom: typeNames[typeCode] || typeCode,
        delaiTraitement: typeDelais[typeCode] || 5
      };
    }

    const demande = await Demande.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!demande) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'RES_001', message: 'Demande non trouvée' }
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: demande });
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/demandes/[id] - Soft delete demande
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;
    
    // Validate ID format
    const idError = validateId(id);
    if (idError) return idError;
    
    // Soft delete by setting actif = false
    const demande = await Demande.findByIdAndUpdate(
      id,
      { $set: { actif: false } },
      { new: true }
    );

    if (!demande) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'RES_001', message: 'Demande non trouvée' }
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: null });
  } catch (error) {
    return handleApiError(error);
  }
}
