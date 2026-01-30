import { Suspense } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StudentsTable } from '@/components/admin/students-table';
import { TableSkeleton } from '@/components/skeletons/table-skeleton';
import { Etudiant } from '@/lib/db/models';
import connectDB from '@/lib/db/mongodb';
import type { IEtudiant } from '@/types/database';

interface SearchParams {
  page?: string;
  limit?: string;
}

async function getStudents(searchParams: SearchParams) {
  await connectDB();

  const page = parseInt(searchParams.page || '1');
  const limit = parseInt(searchParams.limit || '20');
  const skip = (page - 1) * limit;

  // Get students
  const students = await Etudiant.find({ $or: [{ actif: true }, { actif: { $exists: false } }] })
    .select('-hashPassword')
    .sort({ nom: 1, prenom: 1 })
    .skip(skip)
    .limit(limit)
    .lean<IEtudiant[]>();

  const total = await Etudiant.countDocuments({ $or: [{ actif: true }, { actif: { $exists: false } }] });

  return {
    students: students.map((s) => ({
      ...s,
      _id: s._id?.toString(),
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
      dateNaissance: s.dateNaissance?.toISOString(),
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export default async function AdminStudentsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const { students, total, page, totalPages } = await getStudents(params);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des étudiants</h1>
          <p className="text-gray-600 mt-2">
            Gérer les comptes étudiants et leurs accès
          </p>
        </div>
        <Link href="/admin/students/new">
          <Button>Ajouter un étudiant</Button>
        </Link>
      </div>

      {/* Results Summary */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">
          {total} étudiant{total !== 1 ? 's' : ''} trouvé{total !== 1 ? 's' : ''}
        </p>
        {totalPages > 1 && (
          <div className="text-sm text-gray-600">
            Page {page} sur {totalPages}
          </div>
        )}
      </div>

      {/* Students Table */}
      <Suspense fallback={<TableSkeleton rows={10} columns={7} />}>
        <StudentsTable students={students as any} />
      </Suspense>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {page > 1 && (
            <a
              href={`?page=${page - 1}${params.limit ? `&limit=${params.limit}` : ''}`}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Précédent
            </a>
          )}
          {page < totalPages && (
            <a
              href={`?page=${page + 1}${params.limit ? `&limit=${params.limit}` : ''}`}
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
