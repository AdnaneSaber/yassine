import { Suspense } from 'react';
import { Card } from '@/components/ui/card';
import { DemandesTable } from '@/components/admin/demandes-table';
import { DemandesFilter } from '@/components/admin/demandes-filter';
import { PaginationLimitSelector } from '@/components/admin/pagination-limit-selector';
import { TableSkeleton } from '@/components/skeletons/table-skeleton';
import { Demande } from '@/lib/db/models';
import connectDB from '@/lib/db/mongodb';
import type { IDemande, DemandeStatus } from '@/types/database';

interface SearchParams {
  statut?: DemandeStatus;
  priorite?: string;
  typeDemande?: string;
  page?: string;
  limit?: string;
}

async function getDemandes(searchParams: SearchParams) {
  await connectDB();

  const page = parseInt(searchParams.page || '1');
  const limit = parseInt(searchParams.limit || '20');
  const skip = (page - 1) * limit;

  // Build query - show active demandes (including those without actif field)
  const query: any = { $or: [{ actif: true }, { actif: { $exists: false } }] };

  if (searchParams.statut) {
    query['statut.code'] = searchParams.statut;
  }

  if (searchParams.priorite) {
    query.priorite = searchParams.priorite;
  }

  if (searchParams.typeDemande) {
    query['typeDemande.code'] = searchParams.typeDemande;
  }

  // Get demandes
  const demandes = await Demande.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean<IDemande[]>();

  const total = await Demande.countDocuments(query);

  return {
    demandes: demandes.map((d) => ({
      ...d,
      _id: d._id?.toString(),
      createdAt: d.createdAt.toISOString(),
      updatedAt: d.updatedAt.toISOString(),
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export default async function AdminDemandesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const { demandes, total, page, totalPages } = await getDemandes(params);
  const currentLimit = parseInt(params.limit || '20');

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Toutes les demandes</h1>
        <p className="text-gray-600 mt-2">
          Gérer et traiter toutes les demandes étudiantes
        </p>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <DemandesFilter />
      </Card>

      {/* Results Summary */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <p className="text-sm text-gray-600">
          {total} demande{total !== 1 ? 's' : ''} trouvée{total !== 1 ? 's' : ''}
        </p>
        <div className="flex items-center gap-4">
          <PaginationLimitSelector currentLimit={currentLimit} />
          {totalPages > 1 && (
            <div className="text-sm text-gray-600">
              Page {page} sur {totalPages}
            </div>
          )}
        </div>
      </div>

      {/* Demandes Table */}
      <Suspense fallback={<TableSkeleton rows={10} columns={6} />}>
        <DemandesTable demandes={demandes as any} userRole="ADMIN" />
      </Suspense>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {page > 1 && (
            <a
              href={`?page=${page - 1}${params.statut ? `&statut=${params.statut}` : ''}${params.priorite ? `&priorite=${params.priorite}` : ''}${params.typeDemande ? `&typeDemande=${params.typeDemande}` : ''}${params.limit ? `&limit=${params.limit}` : ''}`}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Précédent
            </a>
          )}
          {page < totalPages && (
            <a
              href={`?page=${page + 1}${params.statut ? `&statut=${params.statut}` : ''}${params.priorite ? `&priorite=${params.priorite}` : ''}${params.typeDemande ? `&typeDemande=${params.typeDemande}` : ''}${params.limit ? `&limit=${params.limit}` : ''}`}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Suivant
            </a>
          )}
        </div>
      )}
    </div>
  );
}
