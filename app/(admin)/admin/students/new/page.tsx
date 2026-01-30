import { Card } from '@/components/ui/card';
import { NewStudentForm } from '@/components/admin/new-student-form';

export default function NewStudentPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Ajouter un étudiant</h1>
        <p className="text-gray-600 mt-2">
          Créer un nouveau compte étudiant avec génération automatique du mot de passe
        </p>
      </div>

      {/* Form */}
      <Card className="p-6">
        <NewStudentForm />
      </Card>
    </div>
  );
}
