'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DemandeCard } from './demande-card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import type { IDemande, DemandeStatus } from '@/types/database';

interface DemandeListProps {
  demandes: IDemande[];
}

export function DemandeList({ demandes }: DemandeListProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<DemandeStatus | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Filter by status
  let filteredDemandes = filter === 'ALL' 
    ? demandes 
    : demandes.filter(d => d.statut.code === filter);

  // Filter by search term
  if (searchTerm) {
    filteredDemandes = filteredDemandes.filter(d => 
      d.objet.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.numeroDemande.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  const handleDemandeClick = (id: string) => {
    router.push(`/demandes/${id}`);
  };

  return (
    <div>
      <div className="mb-6 grid gap-4 md:grid-cols-2">
        {/* Search */}
        <div>
          <Input
            type="text"
            placeholder="Rechercher une demande..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>

        {/* Status Filter */}
        <div>
          <Select value={filter} onValueChange={(value) => setFilter(value as DemandeStatus | 'ALL')}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Filtrer par statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Toutes les demandes</SelectItem>
              <SelectItem value="RECU">Reçu</SelectItem>
              <SelectItem value="EN_COURS">En cours</SelectItem>
              <SelectItem value="ATTENTE_INFO">En attente d&apos;information</SelectItem>
              <SelectItem value="VALIDE">Validé</SelectItem>
              <SelectItem value="REJETE">Rejeté</SelectItem>
              <SelectItem value="TRAITE">Traité</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-4 text-sm text-gray-600">
        {filteredDemandes.length} demande{filteredDemandes.length !== 1 ? 's' : ''} trouvée{filteredDemandes.length !== 1 ? 's' : ''}
      </div>

      {/* Demandes Grid */}
      {filteredDemandes.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg font-medium">Aucune demande trouvée</p>
          <p className="mt-2 text-sm">Essayez de modifier vos filtres ou créez une nouvelle demande</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredDemandes.map(demande => (
            <DemandeCard
              key={demande._id?.toString() || demande.numeroDemande}
              demande={demande}
              onClick={handleDemandeClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}
