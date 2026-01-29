import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DemandeActions } from '@/components/admin/demande-actions';
import { Demande, Historique } from '@/lib/db/models';
import connectDB from '@/lib/db/mongodb';
import type { IDemande, IHistorique, UserRole } from '@/types/database';

interface PageProps {
  params: {
    id: string;
  };
}

async function getDemandeDetail(id: string) {
  await connectDB();

  const demande = await Demande.findById(id).lean<IDemande>();

  if (!demande) {
    return null;
  }

  // Get history
  const history = await Historique.find({ demandeId: id })
    .sort({ createdAt: -1 })
    .lean<IHistorique[]>();

  return {
    demande: {
      ...demande,
      _id: demande._id?.toString(),
      createdAt: demande.createdAt.toISOString(),
      updatedAt: demande.updatedAt.toISOString(),
      dateTraitement: demande.dateTraitement?.toISOString(),
    },
    history: history.map((h) => ({
      ...h,
      _id: h._id?.toString(),
      createdAt: h.createdAt.toISOString(),
    })),
  };
}

export default async function AdminDemandeDetailPage({ params }: PageProps) {
  const data = await getDemandeDetail(params.id);

  if (!data) {
    notFound();
  }

  const { demande, history } = data;

  // Get session to determine user role
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as any)?.role as UserRole || 'ADMIN';

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div>
        <Link href="/admin/demandes">
          <Button variant="outline" size="sm">
            ← Retour à la liste
          </Button>
        </Link>
      </div>

      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{demande.objet}</h1>
          <p className="text-sm text-gray-600 mt-1">{demande.numeroDemande}</p>
        </div>
        <Badge
          className="text-white text-sm px-3 py-1"
          style={{ backgroundColor: demande.statut.couleur }}
        >
          {demande.statut.libelle}
        </Badge>
      </div>

      {/* Action Buttons */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-700">
            Actions administrateur
          </p>
          <DemandeActions
            demande={demande}
            userRole={userRole}
            redirectAfterDelete={true}
          />
        </div>
      </Card>

      {/* Student Info */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Informations étudiant
        </h2>
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">Nom complet</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {demande.etudiant.prenom} {demande.etudiant.nom}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Matricule</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {demande.etudiant.matricule}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Email</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {demande.etudiant.email}
            </dd>
          </div>
        </dl>
      </Card>

      {/* Demande Info */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Détails de la demande
        </h2>
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">Type</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {demande.typeDemande.nom}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Priorité</dt>
            <dd className="mt-1">
              <span
                className={`text-xs px-2 py-1 rounded ${
                  demande.priorite === 'URGENTE'
                    ? 'bg-red-100 text-red-800'
                    : demande.priorite === 'HAUTE'
                    ? 'bg-orange-100 text-orange-800'
                    : demande.priorite === 'NORMALE'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {demande.priorite}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Date de soumission</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {new Date(demande.createdAt).toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">
              Délai de traitement
            </dt>
            <dd className="mt-1 text-sm text-gray-900">
              {demande.typeDemande.delaiTraitement} jours
            </dd>
          </div>
          {demande.dateTraitement && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Date de traitement</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(demande.dateTraitement).toLocaleDateString('fr-FR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </dd>
            </div>
          )}
        </dl>
      </Card>

      {/* Description */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Description</h2>
        <p className="text-sm text-gray-700 whitespace-pre-wrap">
          {demande.description}
        </p>
      </Card>

      {/* Documents */}
      {demande.documents.length > 0 && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Documents</h2>
          <div className="space-y-2">
            {demande.documents.map((doc) => (
              <a
                key={doc.id}
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 hover:bg-gray-50 rounded border border-gray-200"
              >
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {doc.nomOriginal}
                  </div>
                  <div className="text-xs text-gray-500">
                    {doc.categorie} • {(doc.taille / 1024).toFixed(0)} KB
                  </div>
                </div>
                <span className="text-xs text-blue-600">Télécharger</span>
              </a>
            ))}
          </div>
        </Card>
      )}

      {/* Admin Comments */}
      {demande.commentaireAdmin && (
        <Card className="p-6 bg-blue-50 border-blue-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Commentaire de l'administration
          </h2>
          <p className="text-sm text-gray-700">{demande.commentaireAdmin}</p>
        </Card>
      )}

      {/* Rejection Reason */}
      {demande.motifRefus && (
        <Card className="p-6 bg-red-50 border-red-200">
          <h2 className="text-lg font-semibold text-red-900 mb-2">
            Motif de refus
          </h2>
          <p className="text-sm text-red-700">{demande.motifRefus}</p>
        </Card>
      )}

      {/* History */}
      {history.length > 0 && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Historique</h2>
          <div className="space-y-4">
            {history.map((entry) => (
              <div
                key={entry._id}
                className="flex gap-4 pb-4 border-b border-gray-200 last:border-0 last:pb-0"
              >
                <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-blue-500" />
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {entry.typeAction === 'CREATION' && 'Demande créée'}
                        {entry.typeAction === 'CHANGEMENT_STATUT' &&
                          `Statut changé: ${entry.statutAncien?.libelle} → ${entry.statutNouveau.libelle}`}
                        {entry.typeAction === 'MODIFICATION' && 'Demande modifiée'}
                        {entry.typeAction === 'COMMENTAIRE' && 'Commentaire ajouté'}
                      </p>
                      {entry.utilisateur && (
                        <p className="text-xs text-gray-500 mt-1">
                          Par {entry.utilisateur.nom} ({entry.utilisateur.role})
                        </p>
                      )}
                      {entry.commentaire && (
                        <p className="text-sm text-gray-700 mt-2">
                          {entry.commentaire}
                        </p>
                      )}
                    </div>
                    <time className="text-xs text-gray-500">
                      {new Date(entry.createdAt).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </time>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
