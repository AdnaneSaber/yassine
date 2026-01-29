'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestCreatePage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testCreate = async () => {
    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('typeDemande', 'ATTESTATION_SCOLARITE');
      formData.append('objet', 'Test depuis page de diagnostic');
      formData.append('description', 'Ceci est un test pour vérifier la création de demande');
      formData.append('priorite', 'NORMALE');

      const response = await fetch('/api/demandes', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      setResult({
        status: response.status,
        success: data.success,
        data: data.data || data.error,
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      setResult({
        status: 'error',
        success: false,
        data: error.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>🧪 Test Demande Creation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-4">
              This page tests the demande creation API endpoint directly.
            </p>

            <Button onClick={testCreate} disabled={loading}>
              {loading ? 'Testing...' : 'Test Create Demande'}
            </Button>
          </div>

          {result && (
            <div className="mt-6">
              <h3 className="font-semibold mb-2">Result:</h3>
              <pre className="bg-slate-100 dark:bg-slate-900 p-4 rounded-lg overflow-x-auto text-xs">
                {JSON.stringify(result, null, 2)}
              </pre>

              {result.success && result.data && (
                <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                    ✅ Success!
                  </h4>
                  <dl className="grid grid-cols-2 gap-2 text-sm">
                    <dt className="font-medium">Numéro:</dt>
                    <dd>{result.data.numeroDemande}</dd>

                    <dt className="font-medium">Type:</dt>
                    <dd>{result.data.typeDemande?.nom}</dd>

                    <dt className="font-medium">Statut:</dt>
                    <dd>{result.data.statut?.libelle}</dd>

                    <dt className="font-medium">Étudiant:</dt>
                    <dd>{result.data.etudiant?.prenom} {result.data.etudiant?.nom}</dd>
                  </dl>
                </div>
              )}

              {!result.success && (
                <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <h4 className="font-semibold text-red-800 dark:text-red-200 mb-2">
                    ❌ Error
                  </h4>
                  <p className="text-sm">
                    <strong>Code:</strong> {result.data?.code}<br/>
                    <strong>Message:</strong> {result.data?.message || result.data}
                  </p>

                  {result.data?.details && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm font-medium">
                        Show details
                      </summary>
                      <pre className="mt-2 text-xs">
                        {JSON.stringify(result.data.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="mt-8 pt-4 border-t">
            <h3 className="font-semibold mb-2">Troubleshooting Steps:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>Make sure you've run: <code className="bg-slate-100 dark:bg-slate-900 px-1 rounded">npx tsx scripts/seed-data.ts</code></li>
              <li>Check that your MongoDB connection string is correct in .env.local</li>
              <li>Verify that at least one etudiant exists in the database</li>
              <li>Check browser console for any JavaScript errors</li>
              <li>Check server console for any backend errors</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
