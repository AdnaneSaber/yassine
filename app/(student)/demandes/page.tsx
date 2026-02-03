import { Suspense } from 'react';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { DemandeList } from '@/components/demandes/demande-list';
import { AllDemandesList } from '@/components/demandes/all-demandes-list';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import connectDB from '@/lib/db/mongodb';
import { Demande, Etudiant } from '@/lib/db/models';
import type { IDemande } from '@/types/database';

async function getMyDemandes(studentId: string): Promise<IDemande[]> {
  try {
    await connectDB();
    
    // Filter by current student's ID
    const demandes = await Demande.find({ 
      'etudiant.id': studentId,
      $or: [{ actif: true }, { actif: { $exists: false } }]
    })
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    // Convert MongoDB documents to plain objects
    return JSON.parse(JSON.stringify(demandes));
  } catch (error) {
    console.error('Error fetching my demandes:', error);
    return [];
  }
}

async function getAllDemandes(): Promise<IDemande[]> {
  try {
    await connectDB();
    
    // Get all active demandes for Doctorat students to assist
    const demandes = await Demande.find({
      $or: [{ actif: true }, { actif: { $exists: false } }]
    })
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    return JSON.parse(JSON.stringify(demandes));
  } catch (error) {
    console.error('Error fetching all demandes:', error);
    return [];
  }
}

async function getStudentInfo(studentId: string) {
  try {
    await connectDB();
    const student = await Etudiant.findById(studentId).lean();
    return student;
  } catch (error) {
    console.error('Error fetching student info:', error);
    return null;
  }
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="p-4 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
          <div className="h-3 bg-gray-200 rounded w-1/2 mb-4" />
          <div className="h-3 bg-gray-200 rounded w-full mb-2" />
          <div className="h-3 bg-gray-200 rounded w-5/6" />
        </Card>
      ))}
    </div>
  );
}

interface DemandesPageProps {
  searchParams: Promise<{ view?: string }>;
}

export default async function DemandesPage({ searchParams }: DemandesPageProps) {
  const session = await getServerSession(authOptions);
  const params = await searchParams;
  
  if (!session?.user) {
    return (
      <div className="text-center py-12">
        <p>Veuillez vous connecter pour voir vos demandes.</p>
      </div>
    );
  }

  const studentId = (session.user as any).id;
  const student = await getStudentInfo(studentId);
  const isDoctorat = student?.niveauEtude === 'Doctorat';
  
  const myDemandes = await getMyDemandes(studentId);
  const allDemandes = isDoctorat ? await getAllDemandes() : [];

  // Calculate stats for my demandes
  const stats = {
    total: myDemandes.length,
    enCours: myDemandes.filter(d => ['RECU', 'EN_COURS', 'ATTENTE_INFO'].includes(d.statut.code)).length,
    traitees: myDemandes.filter(d => d.statut.code === 'TRAITE').length,
    rejetees: myDemandes.filter(d => d.statut.code === 'REJETE').length,
  };

  // Determine which view to show (default to 'mes-demandes')
  const currentView = params.view || 'mes-demandes';
  const showAllDemandes = isDoctorat && currentView === 'toutes-demandes';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isDoctorat ? 'Espace Demandes' : 'Mes demandes'}
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            {isDoctorat 
              ? 'Consultez vos demandes et assistez l\'administration' 
              : 'Consultez et suivez l\'état de vos demandes'}
          </p>
        </div>
        <Link href="/demandes/new">
          <Button size="lg">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nouvelle demande
          </Button>
        </Link>
      </div>

      {/* Doctorat students get view switcher */}
      {isDoctorat && (
        <div className="border-b border-gray-200">
          <nav className="flex gap-4">
            <a
              href="/demandes?view=mes-demandes"
              className={`pb-3 px-1 text-sm font-medium border-b-2 ${
                currentView === 'mes-demandes'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Mes demandes ({stats.total})
            </a>
            <a
              href="/demandes?view=toutes-demandes"
              className={`pb-3 px-1 text-sm font-medium border-b-2 ${
                currentView === 'toutes-demandes'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Toutes les demandes (Assistant)
            </a>
          </nav>
        </div>
      )}

      {showAllDemandes ? (
        // Doctorat view - All demandes
        <div className="space-y-6">
          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="font-medium text-blue-900">Mode Assistant Doctorat</h3>
                <p className="text-sm text-blue-700 mt-1">
                  En tant qu&apos;étudiant en Doctorat, vous pouvez visualiser toutes les demandes 
                  pour assister l&apos;administration. Vous ne pouvez pas modifier le statut des demandes 
                  qui ne sont pas les vôtres.
                </p>
              </div>
            </div>
          </Card>

          <Suspense fallback={<LoadingSkeleton />}>
            <AllDemandesList demandes={allDemandes} />
          </Suspense>
        </div>
      ) : (
        // My demandes view (default for all students)
        <>
          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="p-4">
              <div className="text-sm font-medium text-gray-500">Total</div>
              <div className="mt-2 text-2xl font-bold text-gray-900">{stats.total}</div>
            </Card>
            <Card className="p-4">
              <div className="text-sm font-medium text-gray-500">En cours</div>
              <div className="mt-2 text-2xl font-bold text-blue-600">{stats.enCours}</div>
            </Card>
            <Card className="p-4">
              <div className="text-sm font-medium text-gray-500">Traitées</div>
              <div className="mt-2 text-2xl font-bold text-green-600">{stats.traitees}</div>
            </Card>
            <Card className="p-4">
              <div className="text-sm font-medium text-gray-500">Rejetées</div>
              <div className="mt-2 text-2xl font-bold text-red-600">{stats.rejetees}</div>
            </Card>
          </div>

          <Suspense fallback={<LoadingSkeleton />}>
            <DemandeList demandes={myDemandes} />
          </Suspense>
        </>
      )}
    </div>
  );
}
