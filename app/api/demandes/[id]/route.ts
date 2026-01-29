import { NextRequest, NextResponse } from 'next/server';
import { updateDemandeSchema } from '@/lib/validators/demande';
import { handleApiError } from '@/lib/api/error-handler';
import { Demande } from '@/lib/db/models';
import connectDB from '@/lib/db/mongodb';

// GET /api/demandes/[id] - Get single demande
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const demande = await Demande.findById(params.id);

    if (!demande) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RES_001',
            message: 'Demande non trouvée',
            details: { id: params.id }
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
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const body = await request.json();
    const validated = updateDemandeSchema.parse(body);

    const demande = await Demande.findByIdAndUpdate(
      params.id,
      { $set: validated },
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
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    // Soft delete by setting actif = false
    const demande = await Demande.findByIdAndUpdate(
      params.id,
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

    return NextResponse.json(
      { success: true, data: null },
      { status: 204 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
