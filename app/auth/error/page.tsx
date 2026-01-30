'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const errorMessages: Record<string, string> = {
  Configuration: 'Erreur de configuration du serveur. Veuillez contacter l\'administrateur.',
  AccessDenied: 'Accès refusé. Vous n\'avez pas les permissions nécessaires.',
  Verification: 'Le lien de vérification a expiré ou est invalide.',
  Default: 'Une erreur est survenue lors de la connexion.',
  CredentialsSignin: 'Email ou mot de passe incorrect.',
  SessionRequired: 'Vous devez être connecté pour accéder à cette page.',
  Callback: 'Erreur lors de la connexion. Veuillez réessayer.',
};

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error') || 'Default';

  const errorMessage = errorMessages[error] || errorMessages.Default;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">
            Erreur d&apos;authentification
          </h2>
        </div>

        <Card className="p-6">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800">
                {errorMessage}
              </h3>
              {error === 'Configuration' && (
                <div className="mt-2 text-sm text-red-700">
                  <p>
                    Cette erreur est généralement causée par:
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Une variable d&apos;environnement manquante</li>
                    <li>Une erreur de connexion à la base de données</li>
                    <li>Un problème de configuration NextAuth</li>
                  </ul>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex flex-col space-y-3">
            <Link href="/auth/signin">
              <Button className="w-full">
                Retour à la page de connexion
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="w-full">
                Retour à l&apos;accueil
              </Button>
            </Link>
          </div>

          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 p-3 bg-gray-100 rounded text-xs font-mono text-gray-600">
              Code d&apos;erreur: {error}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
