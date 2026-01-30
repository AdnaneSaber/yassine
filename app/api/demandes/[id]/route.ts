import { NextRequest, NextResponse } from 'next/server';
import { updateDemandeSchema } from '@/lib/validators/demande';
import { handleApiError } from '@/lib/api/error-handler';
import { Demande } from '@/lib/db/models';
import connectDB from '@/lib/db/mongodb';

// GET /api/demandes/[id] - Get single demande
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;
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
    const body = await request.json();
    const validated = updateDemandeSchema.parse(body);

    const demande = await Demande.findByIdAndUpdate(
      id,
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;
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
