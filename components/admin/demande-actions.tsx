'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { StatusModifierDialog } from './status-modifier-dialog';
import { EditDemandeDialog } from './edit-demande-dialog';
import { DeleteDemandeDialog } from './delete-demande-dialog';
import { Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';
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
  const router = useRouter();
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [emailSending, setEmailSending] = useState(false);

  const sendStatusEmail = async () => {
    if (!confirm('Envoyer un email de notification de statut à l\'étudiant?')) {
      return;
    }

    setEmailSending(true);
    try {
      const response = await fetch(`/api/demandes/${demande._id}/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ type: 'status' })
      });

      const data = await response.json();
      if (data.success) {
        alert('Email envoyé avec succès!');
        router.refresh();
      } else {
        alert(`Erreur: ${data.error}`);
      }
    } catch (error) {
      alert('Erreur lors de l\'envoi de l\'email');
      console.error('Email send error:', error);
    } finally {
      setEmailSending(false);
    }
  };

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
          onClick={sendStatusEmail}
          variant="secondary"
          size="sm"
          disabled={emailSending}
        >
          <Mail className="h-4 w-4 mr-2" />
          {emailSending ? 'Envoi...' : 'Envoyer email'}
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
