'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DemandeCard } from './demande-card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { IDemande, DemandeStatus } from '@/types/database';

interface AllDemandesListProps {
  demandes: IDemande[];
}

export function AllDemandesList({ demandes }: AllDemandesListProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<DemandeStatus | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [studentFilter, setStudentFilter] = useState('');

  // Filter by status
  let filteredDemandes = filter === 'ALL' 
    ? demandes 
    : demandes.filter(d => d.statut.code === filter);

  // Filter by search term (objet, numero, description)
  if (searchTerm) {
    filteredDemandes = filteredDemandes.filter(d => 
      d.objet.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.numeroDemande.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  // Filter by student info (name, email, matricule)
  if (studentFilter) {
    const search = studentFilter.toLowerCase();
    filteredDemandes = filteredDemandes.filter(d => 
      d.etudiant.nom.toLowerCase().includes(search) ||
      d.etudiant.prenom.toLowerCase().includes(search) ||
      d.etudiant.email.toLowerCase().includes(search) ||
      d.etudiant.matricule.toLowerCase().includes(search)
    );
  }

  const handleDemandeClick = (id: string) => {
    router.push(`/demandes/${id}`);
  };

  return (
    <div>
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        {/* Search by demande */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Rechercher une demande
          </label>
          <Input
            type="text"
            placeholder="Objet, numéro, description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>

        {/* Search by student */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Filtrer par étudiant
          </label>
          <Input
            type="text"
            placeholder="Nom, email, matricule..."
            value={studentFilter}
            onChange={(e) => setStudentFilter(e.target.value)}
            className="w-full"
          />
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Statut
          </label>
          <Select value={filter} onValueChange={(value) => setFilter(value as DemandeStatus | 'ALL')}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Filtrer par statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tous les statuts</SelectItem>
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
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm text-gray-600">
          {filteredDemandes.length} demande{filteredDemandes.length !== 1 ? 's' : ''} trouvée{filteredDemandes.length !== 1 ? 's' : ''}
        </span>
        <Badge variant="outline" className="text-xs">
          Vue Assistant Doctorat
        </Badge>
      </div>

      {/* Demandes Grid */}
      {filteredDemandes.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg font-medium">Aucune demande trouvée</p>
          <p className="mt-2 text-sm">Essayez de modifier vos filtres</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredDemandes.map(demande => (
            <div key={demande._id?.toString() || demande.numeroDemande} className="relative">
              <DemandeCard
                demande={demande}
                onClick={handleDemandeClick}
              />
              {/* Show indicator if this is the current user's demande */}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
