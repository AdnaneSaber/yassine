import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { cookies } from 'next/headers';
import connectDB from '@/lib/db/mongodb';
import { Demande } from '@/lib/db/models';
import { sendDemandeStatusEmail, sendCustomDemandeEmail } from '@/lib/email';
import { authOptions } from '@/lib/auth/auth-options';
import { jwtDecrypt } from 'jose';

const secret = Buffer.from(
  process.env.NEXTAUTH_SECRET || 'default-secret-for-development',
  'base64'
);

async function getSessionFromToken() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('next-auth.session-token')?.value;
    console.log('Token found:', !!token);

    if (!token) {
      return null;
    }

    try {
      const decrypted = await jwtDecrypt(token, secret);
      console.log('Decrypted payload:', decrypted);
      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      return null;
    }
  } catch (error) {
    console.error('Cookie read error:', error);
    return null;
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Try getServerSession first
    let session = await getServerSession(authOptions);
    console.log('getServerSession result:', session);

    // Fallback to manual token decryption
    if (!session) {
      console.log('Falling back to manual token decryption');
      const tokenData = await getSessionFromToken();
      if (tokenData) {
        session = { user: tokenData };
      }
    }

    console.log('Final session:', session);
    
    if (!session?.user || (session.user as any).role !== 'SUPER_ADMIN') {
      console.log('Unauthorized: no session or not admin');
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
