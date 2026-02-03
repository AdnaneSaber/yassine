import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DemandeDetail } from '@/components/demandes/demande-detail';
import { Button } from '@/components/ui/button';
import connectDB from '@/lib/db/mongodb';
import { Demande } from '@/lib/db/models';
import type { IDemande } from '@/types/database';

async function getDemande(id: string): Promise<IDemande | null> {
  try {
    await connectDB();
    
    const demande = await Demande.findById(id).lean().exec();
    
    if (!demande) {
      return null;
    }

    // Convert MongoDB document to plain object
    return JSON.parse(JSON.stringify(demande));
  } catch (error) {
    console.error('Error fetching demande:', error);
    return null;
  }
}

export default async function DemandePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const demande = await getDemande(id);

  if (!demande) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href="/demandes">
          <Button variant="outline" size="sm">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Retour à la liste
          </Button>
        </Link>
      </div>

      {/* Demande Detail */}
      <DemandeDetail demande={demande} isStudent={true} />
    </div>
  );
}
