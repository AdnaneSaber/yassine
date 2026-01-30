import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { Etudiant } from '@/lib/db/models';
import connectDB from '@/lib/db/mongodb';
import { generatePassword, hashPassword } from '@/lib/utils/password';

// POST /api/admin/students/[id]/reset-password - Reset student password
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user || !['ADMIN', 'SUPER_ADMIN'].includes((session.user as any).role)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Find student
    const student = await Etudiant.findById(id);
    if (!student) {
      return NextResponse.json(
        { success: false, error: 'Étudiant non trouvé' },
        { status: 404 }
      );
    }

    // Generate new password
    const plainPassword = generatePassword();
    const hashedPassword = await hashPassword(plainPassword);

    // Update student password
    student.hashPassword = hashedPassword;
    await student.save();

    return NextResponse.json({
      success: true,
      data: {
        student: {
          _id: student._id,
          matricule: student.matricule,
          nom: student.nom,
          prenom: student.prenom,
          email: student.email
        },
        password: plainPassword // Return the plain password
      }
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
