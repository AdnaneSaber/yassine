import { ReactNode } from 'react';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { Button } from '@/components/ui/button';
import { SignOutButton } from '@/components/auth/sign-out-button';
import { StudentProfileBadge } from '@/components/student/student-profile-badge';
import { authOptions } from '@/lib/auth/auth-options';
import { Etudiant } from '@/lib/db/models';
import connectDB from '@/lib/db/mongodb';

interface StudentLayoutProps {
  children: ReactNode;
}

async function getStudentInfo() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).type !== 'student') {
    return null;
  }

  await connectDB();
  const student = await Etudiant.findById((session.user as any).id)
    .select('niveauEtude filiere nom prenom')
    .lean();

  return student;
}

export default async function StudentLayout({ children }: StudentLayoutProps) {
  const student = await getStudentInfo();
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <Link href="/demandes" className="text-xl font-bold text-gray-900">
                Espace Étudiant
              </Link>
              <div className="hidden md:flex gap-4">
                <Link 
                  href="/demandes" 
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Mes demandes
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {student && <StudentProfileBadge student={student as any} />}
              <Link href="/demandes/new">
                <Button>Nouvelle demande</Button>
              </Link>
              <SignOutButton />
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-500">
            Système de Gestion des Demandes Étudiantes
          </p>
        </div>
      </footer>
    </div>
  );
}
