import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth/auth-options';
import { Etudiant } from '@/lib/db/models';
import connectDB from '@/lib/db/mongodb';
import { generatePassword, hashPassword } from '@/lib/utils/password';

const createStudentSchema = z.object({
  matricule: z.string().min(1).max(20),
  nom: z.string().min(1).max(100),
  prenom: z.string().min(1).max(100),
  email: z.string().email(),
  dateNaissance: z.string().optional(),
  telephone: z.string().optional(),
  adresse: z.string().optional(),
  niveauEtude: z.enum(['L1', 'L2', 'L3', 'M1', 'M2', 'Doctorat']).optional(),
  filiere: z.string().optional(),
});

// POST /api/admin/students - Create new student
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const validated = createStudentSchema.parse(body);

    // Check if student already exists
    const existingStudent = await Etudiant.findOne({
      $or: [{ matricule: validated.matricule }, { email: validated.email }]
    });

    if (existingStudent) {
      return NextResponse.json(
        {
          success: false,
          error: existingStudent.matricule === validated.matricule
            ? 'Un étudiant avec ce matricule existe déjà'
            : 'Un étudiant avec cet email existe déjà'
        },
        { status: 400 }
      );
    }

    // Generate password
    const plainPassword = generatePassword();
    const hashedPassword = await hashPassword(plainPassword);

    // Create student
    const student = await Etudiant.create({
      ...validated,
      hashPassword: hashedPassword,
      dateNaissance: validated.dateNaissance ? new Date(validated.dateNaissance) : undefined,
      actif: true
    });

    return NextResponse.json({
      success: true,
      data: {
        student: {
          _id: student._id,
          matricule: student.matricule,
          nom: student.nom,
          prenom: student.prenom,
          email: student.email,
          niveauEtude: student.niveauEtude,
          filiere: student.filiere
        },
        password: plainPassword // Return the plain password so admin can give it to student
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Données invalides',
          details: error.flatten().fieldErrors
        },
        { status: 400 }
      );
    }

    console.error('Create student error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// GET /api/admin/students - List all students
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Get students
    const students = await Etudiant.find({ $or: [{ actif: true }, { actif: { $exists: false } }] })
      .select('-hashPassword') // Don't return passwords
      .sort({ nom: 1, prenom: 1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Etudiant.countDocuments({ $or: [{ actif: true }, { actif: { $exists: false } }] });

    return NextResponse.json({
      success: true,
      data: {
        students,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get students error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
