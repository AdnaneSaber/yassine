'use client';

import { Badge } from '@/components/ui/badge';
import { User } from 'lucide-react';

interface StudentProfileBadgeProps {
  student: {
    nom: string;
    prenom: string;
    niveauEtude?: string;
    filiere?: string;
  };
}

export function StudentProfileBadge({ student }: StudentProfileBadgeProps) {
  return (
    <div className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
      <User className="h-5 w-5 text-gray-500" />
      <div className="flex flex-col">
        <span className="text-sm font-medium text-gray-900">
          {student.prenom} {student.nom}
        </span>
        <div className="flex items-center gap-2">
          {student.niveauEtude && (
            <Badge variant="outline" className="text-xs">
              {student.niveauEtude}
            </Badge>
          )}
          {student.filiere && (
            <span className="text-xs text-gray-500">{student.filiere}</span>
          )}
        </div>
      </div>
    </div>
  );
}
