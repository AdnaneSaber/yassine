import { ReactNode } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { SignOutButton } from '@/components/auth/sign-out-button';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <Link href="/admin/dashboard" className="text-xl font-bold text-gray-900">
                Administration
              </Link>
              <div className="hidden md:flex gap-1">
                <Link href="/admin/dashboard">
                  <Button variant="ghost" className="text-gray-600 hover:text-gray-900">
                    Tableau de bord
                  </Button>
                </Link>
                <Link href="/admin/demandes">
                  <Button variant="ghost" className="text-gray-600 hover:text-gray-900">
                    Toutes les demandes
                  </Button>
                </Link>
                <Link href="/admin/students">
                  <Button variant="ghost" className="text-gray-600 hover:text-gray-900">
                    Étudiants
                  </Button>
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                Administrateur
              </div>
              <SignOutButton />
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-500">
            Système de Gestion des Demandes Étudiantes - Administration
          </p>
        </div>
      </footer>
    </div>
  );
}
