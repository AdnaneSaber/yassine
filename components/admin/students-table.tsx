'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ResetPasswordDialog } from './reset-password-dialog';
import type { IEtudiant } from '@/types/database';

interface StudentsTableProps {
  students: IEtudiant[];
}

export function StudentsTable({ students }: StudentsTableProps) {
  const [selectedStudent, setSelectedStudent] = useState<IEtudiant | null>(null);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  const handleResetPassword = (student: IEtudiant) => {
    setSelectedStudent(student);
    setResetDialogOpen(true);
  };

  if (students.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center py-12 text-gray-500">
          Aucun étudiant trouvé
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Matricule</TableHead>
              <TableHead>Nom complet</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Niveau</TableHead>
              <TableHead>Filière</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((student) => (
              <TableRow key={student._id}>
                <TableCell className="font-medium">
                  {student.matricule}
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">
                      {student.prenom} {student.nom}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-gray-600">
                  {student.email}
                </TableCell>
                <TableCell>
                  {student.niveauEtude ? (
                    <Badge variant="outline">{student.niveauEtude}</Badge>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {student.filiere || <span className="text-gray-400">-</span>}
                </TableCell>
                <TableCell>
                  <Badge variant={student.actif ? 'default' : 'secondary'}>
                    {student.actif ? 'Actif' : 'Inactif'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleResetPassword(student)}
                  >
                    Réinitialiser mot de passe
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {selectedStudent && (
        <ResetPasswordDialog
          student={selectedStudent}
          isOpen={resetDialogOpen}
          onClose={() => {
            setResetDialogOpen(false);
            setSelectedStudent(null);
          }}
        />
      )}
    </>
  );
}
