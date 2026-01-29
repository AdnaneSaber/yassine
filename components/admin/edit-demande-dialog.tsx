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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { updateDemandeAction } from '@/app/actions/demandes';
import type { IDemande } from '@/types/database';

interface EditDemandeDialogProps {
  demande: IDemande;
  isOpen: boolean;
  onClose: () => void;
}

export function EditDemandeDialog({
  demande,
  isOpen,
  onClose,
}: EditDemandeDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [objet, setObjet] = useState(demande.objet);
  const [description, setDescription] = useState(demande.description);
  const [priorite, setPriorite] = useState(demande.priorite);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!objet.trim() || !description.trim()) {
      setError('L\'objet et la description sont requis');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append('objet', objet);
      formData.append('description', description);
      formData.append('priorite', priorite);

      const result = await updateDemandeAction(
        demande._id?.toString() || '',
        formData
      );

      if (result.success) {
        router.refresh();
        onClose();
      } else {
        setError(result.error.message);
      }
    } catch (err) {
      setError('Une erreur est survenue lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setObjet(demande.objet);
      setDescription(demande.description);
      setPriorite(demande.priorite);
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Modifier la demande</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="objet">Objet *</Label>
            <Input
              id="objet"
              type="text"
              value={objet}
              onChange={(e) => setObjet(e.target.value)}
              placeholder="Objet de la demande"
              disabled={loading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description détaillée de la demande"
              rows={5}
              disabled={loading}
              required
              className="resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="priorite">Priorité</Label>
            <select
              id="priorite"
              value={priorite}
              onChange={(e) => setPriorite(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            >
              <option value="BASSE">Basse</option>
              <option value="NORMALE">Normale</option>
              <option value="HAUTE">Haute</option>
              <option value="URGENTE">Urgente</option>
            </select>
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
              {loading ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
