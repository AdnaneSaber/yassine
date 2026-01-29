import Link from 'next/link';
import { DemandeForm } from '@/components/demandes/demande-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function NewDemandePage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/demandes">
          <Button variant="outline" size="sm">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Retour
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Nouvelle demande</h1>
          <p className="mt-1 text-sm text-gray-600">
            Remplissez le formulaire ci-dessous pour soumettre une nouvelle demande
          </p>
        </div>
      </div>

      {/* Information Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">Information importante</CardTitle>
          <CardDescription className="text-blue-700">
            Veuillez remplir tous les champs obligatoires (marqués par *)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
            <li>Votre demande sera traitée dans les délais indiqués selon le type de document</li>
            <li>Vous recevrez une notification par email à chaque changement de statut</li>
            <li>Assurez-vous que les informations fournies sont exactes et complètes</li>
          </ul>
        </CardContent>
      </Card>

      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>Détails de la demande</CardTitle>
          <CardDescription>
            Fournissez les informations nécessaires pour traiter votre demande
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DemandeForm />
        </CardContent>
      </Card>
    </div>
  );
}
