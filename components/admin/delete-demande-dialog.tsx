'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { deleteDemandeAction } from '@/app/actions/demandes';
import type { IDemande } from '@/types/database';

interface DeleteDemandeDialogProps {
  demande: IDemande;
  isOpen: boolean;
  onClose: () => void;
  redirectAfterDelete?: boolean;
}

export function DeleteDemandeDialog({
  demande,
  isOpen,
  onClose,
  redirectAfterDelete = false,
}: DeleteDemandeDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await deleteDemandeAction(demande._id?.toString() || '');

      if (result.success) {
        onClose();
        if (redirectAfterDelete) {
          router.push('/admin/demandes');
        } else {
          router.refresh();
        }
      } else {
        setError(result.error.message);
      }
    } catch (err) {
      setError('Une erreur est survenue lors de la suppression');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Supprimer la demande</DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir supprimer cette demande ? Cette action désactivera
            la demande (suppression douce) et elle n'apparaîtra plus dans les listes actives.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm">
            {error}
          </div>
        )}

        <div className="p-4 bg-gray-50 rounded-md space-y-1">
          <p className="text-sm font-medium text-gray-900">
            Numéro: {demande.numeroDemande}
          </p>
          <p className="text-sm text-gray-600">
            Objet: {demande.objet}
          </p>
          <p className="text-sm text-gray-600">
            Étudiant: {demande.etudiant.prenom} {demande.etudiant.nom}
          </p>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? 'Suppression...' : 'Supprimer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
