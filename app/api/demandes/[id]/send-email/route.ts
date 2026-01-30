import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/db/mongodb';
import { Demande } from '@/lib/db/models';
import { sendDemandeStatusEmail, sendCustomDemandeEmail } from '@/lib/email';
import { authOptions } from '@/lib/auth/auth-options';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();
    const { id } = await params;

    const demande = await Demande.findById(id);
    if (!demande) {
      return NextResponse.json(
        { error: 'Demande not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { type, subject, message } = body;

    let result;
    if (type === 'status') {
      // Send status update email
      result = await sendDemandeStatusEmail(demande);
    } else if (type === 'custom' && subject && message) {
      // Send custom email
      result = await sendCustomDemandeEmail(
        id,
        demande.etudiant.email,
        subject,
        message
      );
    } else {
      return NextResponse.json(
        { error: 'Invalid email type or missing parameters' },
        { status: 400 }
      );
    }

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Email sent successfully'
      });
    } else {
      return NextResponse.json(
        { error: result.error || 'Failed to send email' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
