'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatusModifierDialog } from './status-modifier-dialog';
import type { IDemande, UserRole } from '@/types/database';

interface DemandesTableProps {
  demandes: IDemande[];
  userRole?: UserRole;
}

export function DemandesTable({ demandes, userRole = 'ADMIN' }: DemandesTableProps) {
  const router = useRouter();
  const [selectedDemande, setSelectedDemande] = useState<IDemande | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleModifyStatus = (demande: IDemande) => {
    setSelectedDemande(demande);
    setIsDialogOpen(true);
  };

  const handleViewDetail = (demandeId: string) => {
    router.push(`/admin/demandes/${demandeId}`);
  };

  if (demandes.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        Aucune demande trouvée
      </div>
    );
  }

  return (
    <>
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Numéro</TableHead>
              <TableHead>Étudiant</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Objet</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Priorité</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {demandes.map((demande) => (
              <TableRow key={demande._id?.toString()}>
                <TableCell className="font-medium">
                  {demande.numeroDemande}
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">
                      {demande.etudiant.prenom} {demande.etudiant.nom}
                    </div>
                    <div className="text-xs text-gray-500">
                      {demande.etudiant.matricule}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="max-w-[150px]">
                  <span className="text-sm">{demande.typeDemande.nom}</span>
                </TableCell>
                <TableCell className="max-w-[200px]">
                  <span className="text-sm truncate block" title={demande.objet}>
                    {demande.objet}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge
                    className="text-white"
                    style={{ backgroundColor: demande.statut.couleur }}
                  >
                    {demande.statut.libelle}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      demande.priorite === 'URGENTE'
                        ? 'bg-red-100 text-red-800'
                        : demande.priorite === 'HAUTE'
                        ? 'bg-orange-100 text-orange-800'
                        : demande.priorite === 'NORMALE'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {demande.priorite}
                  </span>
                </TableCell>
                <TableCell>
                  {new Date(demande.createdAt).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-2 justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewDetail(demande._id?.toString() || '')}
                    >
                      Voir
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleModifyStatus(demande)}
                    >
                      Modifier
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {selectedDemande && (
        <StatusModifierDialog
          demande={selectedDemande}
          userRole={userRole}
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
        />
      )}
    </>
  );
}
