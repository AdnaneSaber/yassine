'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Copy, Check } from 'lucide-react';

export function NewStudentForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ password: string; email: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const [formData, setFormData] = useState({
    matricule: '',
    nom: '',
    prenom: '',
    email: '',
    dateNaissance: '',
    telephone: '',
    adresse: '',
    niveauEtude: '',
    filiere: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess({
          password: data.data.password,
          email: formData.email,
        });
      } else {
        setError(data.error || 'Erreur lors de la création de l\'étudiant');
      }
    } catch (err) {
      setError('Erreur lors de la création de l\'étudiant');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (success) {
      navigator.clipboard.writeText(success.password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleGoBack = () => {
    router.push('/admin/students');
  };

  if (success) {
    return (
      <div className="space-y-6">
        <div className="p-4 bg-green-50 border border-green-200 rounded-md">
          <p className="text-green-900 font-medium mb-2">
            ✓ Étudiant créé avec succès !
          </p>
          <p className="text-sm text-green-800">
            Email: {success.email}
          </p>
        </div>

        <div className="p-4 bg-blue-50 border border-blue-200 rounded-md space-y-3">
          <p className="text-sm font-medium text-blue-900">
            Mot de passe généré :
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2 bg-white border border-blue-300 rounded text-lg font-mono font-bold text-blue-900">
              {success.password}
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
            Il ne pourra plus être affiché après avoir quitté cette page.
          </p>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={handleGoBack}>
            Retour à la liste
          </Button>
          <Button onClick={() => {
            setSuccess(null);
            setFormData({
              matricule: '',
              nom: '',
              prenom: '',
              email: '',
              dateNaissance: '',
              telephone: '',
              adresse: '',
              niveauEtude: '',
              filiere: '',
            });
          }}>
            Ajouter un autre étudiant
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm">
          {error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Matricule */}
        <div className="space-y-2">
          <Label htmlFor="matricule">Matricule *</Label>
          <Input
            id="matricule"
            name="matricule"
            value={formData.matricule}
            onChange={handleChange}
            required
            maxLength={20}
            disabled={loading}
          />
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
            disabled={loading}
          />
        </div>

        {/* Nom */}
        <div className="space-y-2">
          <Label htmlFor="nom">Nom *</Label>
          <Input
            id="nom"
            name="nom"
            value={formData.nom}
            onChange={handleChange}
            required
            maxLength={100}
            disabled={loading}
          />
        </div>

        {/* Prenom */}
        <div className="space-y-2">
          <Label htmlFor="prenom">Prénom *</Label>
          <Input
            id="prenom"
            name="prenom"
            value={formData.prenom}
            onChange={handleChange}
            required
            maxLength={100}
            disabled={loading}
          />
        </div>

        {/* Niveau d'étude */}
        <div className="space-y-2">
          <Label htmlFor="niveauEtude">Niveau d'étude</Label>
          <select
            id="niveauEtude"
            name="niveauEtude"
            value={formData.niveauEtude}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          >
            <option value="">Sélectionner...</option>
            <option value="L1">L1</option>
            <option value="L2">L2</option>
            <option value="L3">L3</option>
            <option value="M1">M1</option>
            <option value="M2">M2</option>
            <option value="Doctorat">Doctorat</option>
          </select>
        </div>

        {/* Filiere */}
        <div className="space-y-2">
          <Label htmlFor="filiere">Filière</Label>
          <Input
            id="filiere"
            name="filiere"
            value={formData.filiere}
            onChange={handleChange}
            disabled={loading}
          />
        </div>

        {/* Date de naissance */}
        <div className="space-y-2">
          <Label htmlFor="dateNaissance">Date de naissance</Label>
          <Input
            id="dateNaissance"
            name="dateNaissance"
            type="date"
            value={formData.dateNaissance}
            onChange={handleChange}
            disabled={loading}
          />
        </div>

        {/* Telephone */}
        <div className="space-y-2">
          <Label htmlFor="telephone">Téléphone</Label>
          <Input
            id="telephone"
            name="telephone"
            type="tel"
            value={formData.telephone}
            onChange={handleChange}
            disabled={loading}
          />
        </div>
      </div>

      {/* Adresse */}
      <div className="space-y-2">
        <Label htmlFor="adresse">Adresse</Label>
        <Input
          id="adresse"
          name="adresse"
          value={formData.adresse}
          onChange={handleChange}
          disabled={loading}
        />
      </div>

      <div className="flex gap-3 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={handleGoBack}
          disabled={loading}
        >
          Annuler
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Création...' : 'Créer l\'étudiant'}
        </Button>
      </div>
    </form>
  );
}
