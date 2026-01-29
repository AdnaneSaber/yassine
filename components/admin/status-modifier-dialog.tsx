'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { transitionDemandeAction } from '@/app/actions/demandes';
import { getAvailableTransitions } from '@/lib/workflow/utils';
import { STATUTS_META } from '@/lib/workflow/constants';
import type { IDemande, DemandeStatus, UserRole } from '@/types/database';

interface StatusModifierDialogProps {
  demande: IDemande;
  userRole: UserRole;
  isOpen: boolean;
  onClose: () => void;
}

export function StatusModifierDialog({
  demande,
  userRole,
  isOpen,
  onClose,
}: StatusModifierDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<DemandeStatus | ''>('');
  const [commentaire, setCommentaire] = useState('');
  const [motifRefus, setMotifRefus] = useState('');

  const availableStatuses = getAvailableTransitions(demande.statut.code, userRole);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedStatus) {
      setError('Veuillez sélectionner un statut');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append('newStatut', selectedStatus);
      if (commentaire) formData.append('commentaire', commentaire);
      if (motifRefus) formData.append('motifRefus', motifRefus);

      const result = await transitionDemandeAction(
        demande._id?.toString() || '',
        formData
      );

      if (result.success) {
        router.refresh();
        onClose();
        // Reset form
        setSelectedStatus('');
        setCommentaire('');
        setMotifRefus('');
      } else {
        setError(result.error.message);
      }
    } catch (err) {
      setError('Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setSelectedStatus('');
      setCommentaire('');
      setMotifRefus('');
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Modifier le statut</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="status">Nouveau statut *</Label>
            <select
              id="status"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as DemandeStatus)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            >
              <option value="">Sélectionner un statut</option>
              {availableStatuses.map((status) => (
                <option key={status} value={status}>
                  {STATUTS_META[status].libelle}
                </option>
              ))}
            </select>
          </div>

          {selectedStatus === 'REJETE' && (
            <div className="space-y-2">
              <Label htmlFor="motifRefus">Motif de refus *</Label>
              <Textarea
                id="motifRefus"
                value={motifRefus}
                onChange={(e) => setMotifRefus(e.target.value)}
                placeholder="Expliquez le motif du refus (minimum 10 caractères)"
                rows={4}
                disabled={loading}
                className="resize-none"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="commentaire">
              Commentaire {selectedStatus === 'ATTENTE_INFO' && '*'}
            </Label>
            <Textarea
              id="commentaire"
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
              placeholder="Commentaire facultatif"
              rows={3}
              disabled={loading}
              className="resize-none"
            />
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
            <Button type="submit" disabled={loading}>
              {loading ? 'Enregistrement...' : 'Modifier le statut'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
