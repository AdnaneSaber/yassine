'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Label } from '@/components/ui/label';

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

  return (
    <div className="flex flex-wrap gap-4">
      <div className="flex-1 min-w-[200px]">
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
          <option value="RECU">Reçu</option>
          <option value="EN_COURS">En cours</option>
          <option value="ATTENTE_INFO">En attente d'information</option>
          <option value="VALIDE">Validé</option>
          <option value="REJETE">Rejeté</option>
          <option value="TRAITE">Traité</option>
          <option value="ARCHIVE">Archivé</option>
        </select>
      </div>

      <div className="flex-1 min-w-[200px]">
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

      <div className="flex-1 min-w-[200px]">
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
    </div>
  );
}
