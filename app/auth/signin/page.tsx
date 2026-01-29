'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast.error(result.error);
      } else if (result?.ok) {
        toast.success('Connexion réussie !');
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (error) {
      toast.error('Une erreur est survenue lors de la connexion');
      console.error('Sign in error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fillAdmin = () => {
    setEmail('admin@university.edu');
    setPassword('Admin123!');
  };

  const fillStudent = () => {
    setEmail('adnane.saber@university.edu');
    setPassword('any'); // Students accept any password for now
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Système de Gestion des Demandes
          </CardTitle>
          <CardDescription className="text-center">
            Connectez-vous pour accéder à votre espace
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="votre.email@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Connexion...' : 'Se connecter'}
            </Button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Comptes de test
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={fillAdmin}
                disabled={isLoading}
              >
                Admin
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={fillStudent}
                disabled={isLoading}
              >
                Étudiant
              </Button>
            </div>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>Comptes de test :</p>
            <ul className="mt-2 space-y-1 text-xs">
              <li>👨‍💼 Admin: admin@university.edu / Admin123!</li>
              <li>👨‍🎓 Étudiant: adnane.saber@university.edu / any</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
