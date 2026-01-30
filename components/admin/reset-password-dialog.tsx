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
import { Copy, Check } from 'lucide-react';
import type { IEtudiant } from '@/types/database';

interface ResetPasswordDialogProps {
  student: IEtudiant;
  isOpen: boolean;
  onClose: () => void;
}

export function ResetPasswordDialog({
  student,
  isOpen,
  onClose,
}: ResetPasswordDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleReset = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/admin/students/${student._id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (data.success) {
        setNewPassword(data.data.password);
      } else {
        setError(data.error || 'Erreur lors de la réinitialisation');
      }
    } catch (err) {
      setError('Erreur lors de la réinitialisation du mot de passe');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (newPassword) {
      navigator.clipboard.writeText(newPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setError(null);
      setNewPassword(null);
      setCopied(false);
      onClose();
      if (newPassword) {
        router.refresh();
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Réinitialiser le mot de passe</DialogTitle>
          <DialogDescription>
            {newPassword
              ? 'Le mot de passe a été réinitialisé avec succès'
              : `Réinitialiser le mot de passe pour ${student.prenom} ${student.nom}`}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm">
            {error}
          </div>
        )}

        {newPassword ? (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm font-medium text-green-900 mb-2">
                Nouveau mot de passe :
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 bg-white border border-green-300 rounded text-lg font-mono font-bold text-green-900">
                  {newPassword}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopy}
                  className="shrink-0"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      Copié
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-1" />
                      Copier
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                <strong>Important :</strong> Copiez ce mot de passe maintenant et transmettez-le à l'étudiant.
                Il ne pourra plus être affiché après la fermeture de cette fenêtre.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-gray-50 rounded-md space-y-1">
            <p className="text-sm font-medium text-gray-900">
              Matricule: {student.matricule}
            </p>
            <p className="text-sm text-gray-600">
              Nom: {student.prenom} {student.nom}
            </p>
            <p className="text-sm text-gray-600">
              Email: {student.email}
            </p>
          </div>
        )}

        <DialogFooter>
          {newPassword ? (
            <Button onClick={handleClose}>Fermer</Button>
          ) : (
            <>
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
                onClick={handleReset}
                disabled={loading}
              >
                {loading ? 'Réinitialisation...' : 'Réinitialiser'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
