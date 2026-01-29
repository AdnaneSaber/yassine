import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Demande } from '@/lib/db/models';
import connectDB from '@/lib/db/mongodb';
import type { IDemande } from '@/types/database';

async function getDashboardData() {
  await connectDB();

  // Get statistics
  const total = await Demande.countDocuments({ actif: true });
  const enCours = await Demande.countDocuments({
    actif: true,
    'statut.code': { $in: ['RECU', 'EN_COURS', 'ATTENTE_INFO'] },
  });
  const traites = await Demande.countDocuments({
    actif: true,
    'statut.code': 'TRAITE',
  });
  const rejetes = await Demande.countDocuments({
    actif: true,
    'statut.code': 'REJETE',
  });

  // Get recent demandes
  const recentDemandes = await Demande.find({ actif: true })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean<IDemande[]>();

  return {
    stats: { total, enCours, traites, rejetes },
    recentDemandes: recentDemandes.map((d) => ({
      ...d,
      _id: d._id?.toString(),
      createdAt: d.createdAt.toISOString(),
      updatedAt: d.updatedAt.toISOString(),
    })),
  };
}

export default async function AdminDashboardPage() {
  const { stats, recentDemandes } = await getDashboardData();

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="text-gray-600 mt-2">
          Vue d'ensemble de l'activité des demandes étudiantes
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <div className="text-sm font-medium text-gray-500">
            Total des demandes
          </div>
          <div className="mt-2 text-3xl font-bold text-gray-900">{stats.total}</div>
          <p className="text-xs text-gray-500 mt-2">Toutes les demandes actives</p>
        </Card>

        <Card className="p-6">
          <div className="text-sm font-medium text-gray-500">En cours</div>
          <div className="mt-2 text-3xl font-bold text-orange-600">
            {stats.enCours}
          </div>
          <p className="text-xs text-gray-500 mt-2">En attente de traitement</p>
        </Card>

        <Card className="p-6">
          <div className="text-sm font-medium text-gray-500">Traitées</div>
          <div className="mt-2 text-3xl font-bold text-green-600">
            {stats.traites}
          </div>
          <p className="text-xs text-gray-500 mt-2">Traitées avec succès</p>
        </Card>

        <Card className="p-6">
          <div className="text-sm font-medium text-gray-500">Rejetées</div>
          <div className="mt-2 text-3xl font-bold text-red-600">{stats.rejetes}</div>
          <p className="text-xs text-gray-500 mt-2">Demandes rejetées</p>
        </Card>
      </div>

      {/* Recent Demandes */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Demandes récentes
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Les 10 dernières demandes soumises
            </p>
          </div>
          <Link href="/admin/demandes">
            <Button variant="outline">Voir toutes les demandes</Button>
          </Link>
        </div>

        {recentDemandes.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            Aucune demande récente
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numéro</TableHead>
                  <TableHead>Étudiant</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentDemandes.map((demande) => (
                  <TableRow key={demande._id}>
                    <TableCell className="font-medium">
                      {demande.numeroDemande}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {demande.etudiant.prenom} {demande.etudiant.nom}
                        </div>
                        <div className="text-xs text-gray-500">
                          {demande.etudiant.matricule}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      <span className="text-sm">{demande.typeDemande.nom}</span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className="text-white"
                        style={{ backgroundColor: demande.statut.couleur }}
                      >
                        {demande.statut.libelle}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(demande.createdAt).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/admin/demandes/${demande._id}`}>
                        <Button size="sm" variant="outline">
                          Voir
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}
