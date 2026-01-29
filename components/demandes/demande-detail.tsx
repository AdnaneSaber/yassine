'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { IDemande } from '@/types/database';

interface DemandeDetailProps {
  demande: IDemande;
}

export function DemandeDetail({ demande }: DemandeDetailProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">
            {demande.objet}
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            {demande.numeroDemande}
          </p>
        </div>
        <Badge 
          className="text-sm px-3 py-1 self-start"
          style={{ backgroundColor: demande.statut.couleur }}
        >
          {demande.statut.libelle}
        </Badge>
      </div>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Informations générales</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Type de demande</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {demande.typeDemande.nom}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Priorité</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {demande.priorite}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Date de soumission</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(demande.createdAt).toLocaleDateString('fr-FR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Délai de traitement</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {demande.typeDemande.delaiTraitement} jour{demande.typeDemande.delaiTraitement > 1 ? 's' : ''}
              </dd>
            </div>
            {demande.dateTraitement && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Date de traitement</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(demande.dateTraitement).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      {/* Description */}
      <Card>
        <CardHeader>
          <CardTitle>Description</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">
            {demande.description}
          </p>
        </CardContent>
      </Card>

      {/* Documents */}
      {demande.documents && demande.documents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Documents joints</CardTitle>
            <CardDescription>
              {demande.documents.length} document{demande.documents.length > 1 ? 's' : ''} joint{demande.documents.length > 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {demande.documents.map((doc, index) => (
                <a
                  key={doc.id || index}
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg border transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{doc.nomOriginal}</p>
                      <p className="text-xs text-gray-500">
                        {(doc.taille / 1024).toFixed(0)} KB
                      </p>
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Admin Comments */}
      {demande.commentaireAdmin && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-900">Commentaire de l&apos;administration</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-blue-800">
              {demande.commentaireAdmin}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Rejection Reason */}
      {demande.motifRefus && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-900">Motif de refus</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-800">
              {demande.motifRefus}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
