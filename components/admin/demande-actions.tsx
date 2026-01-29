'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { StatusModifierDialog } from './status-modifier-dialog';
import { EditDemandeDialog } from './edit-demande-dialog';
import { DeleteDemandeDialog } from './delete-demande-dialog';
import type { IDemande, UserRole } from '@/types/database';

interface DemandeActionsProps {
  demande: IDemande;
  userRole: UserRole;
  redirectAfterDelete?: boolean;
}

export function DemandeActions({
  demande,
  userRole,
  redirectAfterDelete = false,
}: DemandeActionsProps) {
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => setStatusDialogOpen(true)}
          variant="default"
          size="sm"
        >
          Changer le statut
        </Button>

        <Button
          onClick={() => setEditDialogOpen(true)}
          variant="outline"
          size="sm"
        >
          Modifier
        </Button>

        <Button
          onClick={() => setDeleteDialogOpen(true)}
          variant="destructive"
          size="sm"
        >
          Supprimer
        </Button>
      </div>

      <StatusModifierDialog
        demande={demande}
        userRole={userRole}
        isOpen={statusDialogOpen}
        onClose={() => setStatusDialogOpen(false)}
      />

      <EditDemandeDialog
        demande={demande}
        isOpen={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
      />

      <DeleteDemandeDialog
        demande={demande}
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        redirectAfterDelete={redirectAfterDelete}
      />
    </>
  );
}
