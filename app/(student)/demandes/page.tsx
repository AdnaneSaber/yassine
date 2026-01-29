import { Suspense } from 'react';
import Link from 'next/link';
import { DemandeList } from '@/components/demandes/demande-list';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import connectDB from '@/lib/db/mongodb';
import { Demande } from '@/lib/db/models';
import type { IDemande } from '@/types/database';

async function getDemandes(): Promise<IDemande[]> {
  try {
    await connectDB();
    
    // TODO: Filter by current user's ID once authentication is implemented
    // For now, get all demandes
    const demandes = await Demande.find({})
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    // Convert MongoDB documents to plain objects
    return JSON.parse(JSON.stringify(demandes));
  } catch (error) {
    console.error('Error fetching demandes:', error);
    return [];
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

export default async function DemandesPage() {
  const demandes = await getDemandes();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mes demandes</h1>
          <p className="mt-2 text-sm text-gray-600">
            Consultez et suivez l&apos;état de vos demandes
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

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4">
          <div className="text-sm font-medium text-gray-500">Total</div>
          <div className="mt-2 text-2xl font-bold text-gray-900">{demandes.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-medium text-gray-500">En cours</div>
          <div className="mt-2 text-2xl font-bold text-blue-600">
            {demandes.filter(d => ['RECU', 'EN_COURS', 'ATTENTE_INFO'].includes(d.statut.code)).length}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-medium text-gray-500">Traitées</div>
          <div className="mt-2 text-2xl font-bold text-green-600">
            {demandes.filter(d => d.statut.code === 'TRAITE').length}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-medium text-gray-500">Rejetées</div>
          <div className="mt-2 text-2xl font-bold text-red-600">
            {demandes.filter(d => d.statut.code === 'REJETE').length}
          </div>
        </Card>
      </div>

      {/* Demandes List */}
      <Suspense fallback={<LoadingSkeleton />}>
        <DemandeList demandes={demandes} />
      </Suspense>
    </div>
  );
}
