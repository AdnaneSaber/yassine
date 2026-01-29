'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { IDemande } from '@/types/database';

interface DemandeCardProps {
  demande: IDemande;
  onClick?: (id: string) => void;
}

export function DemandeCard({ demande, onClick }: DemandeCardProps) {
  const handleClick = () => {
    if (onClick && demande._id) {
      onClick(demande._id.toString());
    }
  };

  return (
    <Card 
      className="p-4 cursor-pointer hover:shadow-md transition-shadow"
      onClick={handleClick}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">
            {demande.objet}
          </h3>
          <p className="text-sm text-gray-600">
            {demande.numeroDemande}
          </p>
        </div>
        <Badge 
          className="ml-4"
          style={{ backgroundColor: demande.statut.couleur }}
        >
          {demande.statut.libelle}
        </Badge>
      </div>

      <p className="mt-2 text-sm text-gray-700 line-clamp-2">
        {demande.description}
      </p>

      <div className="mt-4 flex justify-between items-center text-xs text-gray-500">
        <span className="font-medium">{demande.typeDemande.nom}</span>
        <span>{new Date(demande.createdAt).toLocaleDateString('fr-FR')}</span>
      </div>

      {demande.documents && demande.documents.length > 0 && (
        <div className="mt-2 text-xs text-gray-500">
          {demande.documents.length} document(s)
        </div>
      )}
    </Card>
  );
}
