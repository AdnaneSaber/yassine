'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function DemandesFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete('page'); // Reset to page 1 when filtering
    router.push(`/admin/demandes?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push('/admin/demandes');
  };

  const hasFilters = searchParams.toString().length > 0;

  return (
    <div className="space-y-4">
      {/* Search by student or demande info */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <Label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
            Rechercher (étudiant ou demande)
          </Label>
          <Input
            id="search"
            type="text"
            placeholder="Nom, email, matricule, n° demande, objet..."
            value={searchParams.get('search') || ''}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="w-full"
          />
          <p className="text-xs text-gray-500 mt-1">
            Recherche dans: nom, prénom, email, matricule, n° demande, objet
          </p>
        </div>

        {/* Filiere Filter */}
        <div>
          <Label htmlFor="filiere" className="block text-sm font-medium text-gray-700 mb-1">
            Filière
          </Label>
          <Input
            id="filiere"
            type="text"
            placeholder="Ex: Informatique..."
            value={searchParams.get('filiere') || ''}
            onChange={(e) => handleFilterChange('filiere', e.target.value)}
            className="w-full"
          />
        </div>

        {/* Niveau d'étude Filter */}
        <div>
          <Label htmlFor="niveauEtude" className="block text-sm font-medium text-gray-700 mb-1">
            Niveau d&apos;étude
          </Label>
          <select
            id="niveauEtude"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-10"
            value={searchParams.get('niveauEtude') || ''}
            onChange={(e) => handleFilterChange('niveauEtude', e.target.value)}
          >
            <option value="">Tous les niveaux</option>
            <option value="L1">Licence 1</option>
            <option value="L2">Licence 2</option>
            <option value="L3">Licence 3</option>
            <option value="M1">Master 1</option>
            <option value="M2">Master 2</option>
            <option value="Doctorat">Doctorat</option>
          </select>
        </div>
      </div>

      {/* Second row - Status, Priority, Type */}
      <div className="grid gap-4 md:grid-cols-4">
        <div>
          <Label htmlFor="statut" className="block text-sm font-medium text-gray-700 mb-1">
            Statut
          </Label>
          <select
            id="statut"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchParams.get('statut') || ''}
            onChange={(e) => handleFilterChange('statut', e.target.value)}
          >
            <option value="">Tous les statuts</option>
            <option value="SOUMIS">Soumis</option>
            <option value="RECU">Reçu</option>
            <option value="EN_COURS">En cours</option>
            <option value="ATTENTE_INFO">En attente d&apos;information</option>
            <option value="VALIDE">Validé</option>
            <option value="REJETE">Rejeté</option>
            <option value="TRAITE">Traité</option>
            <option value="ARCHIVE">Archivé</option>
          </select>
        </div>

        <div>
          <Label htmlFor="priorite" className="block text-sm font-medium text-gray-700 mb-1">
            Priorité
          </Label>
          <select
            id="priorite"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchParams.get('priorite') || ''}
            onChange={(e) => handleFilterChange('priorite', e.target.value)}
          >
            <option value="">Toutes les priorités</option>
            <option value="BASSE">Basse</option>
            <option value="NORMALE">Normale</option>
            <option value="HAUTE">Haute</option>
            <option value="URGENTE">Urgente</option>
          </select>
        </div>

        <div>
          <Label htmlFor="typeDemande" className="block text-sm font-medium text-gray-700 mb-1">
            Type de demande
          </Label>
          <select
            id="typeDemande"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchParams.get('typeDemande') || ''}
            onChange={(e) => handleFilterChange('typeDemande', e.target.value)}
          >
            <option value="">Tous les types</option>
            <option value="ATTESTATION_SCOLARITE">Attestation de scolarité</option>
            <option value="RELEVE_NOTES">Relevé de notes</option>
            <option value="ATTESTATION_REUSSITE">Attestation de réussite</option>
            <option value="DUPLICATA_CARTE">Duplicata de carte étudiant</option>
            <option value="CONVENTION_STAGE">Convention de stage</option>
          </select>
        </div>

        {/* Clear Filters Button */}
        <div className="flex items-end">
          <Button
            variant="outline"
            onClick={clearFilters}
            disabled={!hasFilters}
            className="w-full"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Réinitialiser
          </Button>
        </div>
      </div>

      {/* Active Filters Display */}
      {hasFilters && (
        <div className="flex flex-wrap gap-2 pt-2 border-t">
          <span className="text-sm text-gray-500">Filtres actifs:</span>
          {Array.from(searchParams.entries()).map(([key, value]) => {
            if (key === 'page') return null;
            const labels: Record<string, string> = {
              search: 'Recherche',
              filiere: 'Filière',
              niveauEtude: 'Niveau',
              statut: 'Statut',
              priorite: 'Priorité',
              typeDemande: 'Type',
            };
            return (
              <span
                key={key}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                {labels[key] || key}: {value}
                <button
                  onClick={() => handleFilterChange(key, '')}
                  className="ml-1 hover:text-blue-600"
                >
                  ×
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
