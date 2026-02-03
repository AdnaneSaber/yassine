'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { addStudentResponseAction } from '@/app/actions/demandes';
import type { IDemande } from '@/types/database';

interface DemandeDetailProps {
  demande: IDemande;
  isStudent?: boolean;
}

export function DemandeDetail({ demande, isStudent = false }: DemandeDetailProps) {
  const [responseText, setResponseText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  const isActionRequired = demande.statut.code === 'ATTENTE_INFO';

  async function handleSubmitResponse(e: React.FormEvent) {
    e.preventDefault();
    if (!responseText.trim() || responseText.trim().length < 5) {
      setSubmitStatus({ success: false, message: 'Le commentaire doit contenir au moins 5 caractères.' });
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const formData = new FormData();
      formData.append('commentaire', responseText);

      const result = await addStudentResponseAction(demande._id as string, formData);

      if (result.success) {
        setSubmitStatus({ success: true, message: 'Votre réponse a été envoyée avec succès.' });
        setResponseText('');
        // Refresh the page to show updated status
        window.location.reload();
      } else {
        setSubmitStatus({ success: false, message: result.error.message || 'Une erreur est survenue.' });
      }
    } catch (error) {
      setSubmitStatus({ success: false, message: 'Une erreur est survenue lors de l\'envoi.' });
    } finally {
      setIsSubmitting(false);
    }
  }

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

      {/* Student Response Form - Only show for ATTENTE_INFO status when student is viewing */}
      {isActionRequired && isStudent && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-amber-900 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Action requise : Répondre à la demande d&apos;information
            </CardTitle>
            <CardDescription className="text-amber-700">
              L&apos;administration demande des informations complémentaires. Veuillez fournir votre réponse ci-dessous.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitResponse} className="space-y-4">
              <div>
                <label htmlFor="response" className="block text-sm font-medium text-amber-900 mb-2">
                  Votre réponse / Informations complémentaires
                </label>
                <Textarea
                  id="response"
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Décrivez les informations demandées..."
                  className="min-h-[120px] bg-white border-amber-300 focus:border-amber-500"
                  disabled={isSubmitting}
                />
              </div>

              {submitStatus && (
                <div className={`p-3 rounded-md text-sm ${submitStatus.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {submitStatus.message}
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={isSubmitting || responseText.trim().length < 5}
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      Envoyer ma réponse
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
