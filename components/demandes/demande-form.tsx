'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createDemandeSchema, type CreateDemandeInput } from '@/lib/validators/demande';
import { createDemandeAction } from '@/app/actions/demandes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { demandeToasts } from '@/lib/utils/toast';
import { FormErrors } from '@/components/ui/error-display';

export function DemandeForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<CreateDemandeInput>({
    resolver: zodResolver(createDemandeSchema),
    defaultValues: {
      typeDemande: undefined,
      objet: '',
      description: '',
      priorite: 'NORMALE'
    },
    mode: 'onBlur', // Validate on blur for better UX
  });

  const onSubmit = async (data: CreateDemandeInput) => {
    // Clear any previous form-level errors
    setFormError(null);

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append('typeDemande', data.typeDemande);
        formData.append('objet', data.objet);
        formData.append('description', data.description);
        formData.append('priorite', data.priorite ?? 'NORMALE');

        const result = await createDemandeAction(formData);

        if (result.success) {
          demandeToasts.created();
          // Reset form after successful submission
          form.reset();
          // Navigate to demandes list
          router.push('/demandes');
          router.refresh();
        } else {
          const errorMessage = result.error?.message || 'Une erreur est survenue';
          setFormError(errorMessage);
          demandeToasts.createdError(errorMessage);
        }
      } catch (err) {
        console.error('Error creating demande:', err);
        const errorMessage = err instanceof Error
          ? err.message
          : 'Une erreur inattendue est survenue';
        setFormError(errorMessage);
        demandeToasts.createdError(errorMessage);
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" noValidate>
        {/* Form-level errors */}
        {formError && (
          <FormErrors errors={formError} title="Erreur de soumission" />
        )}

        {/* Type de demande */}
        <FormField
          control={form.control}
          name="typeDemande"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type de demande *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un type de demande" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="ATTESTATION_SCOLARITE">Attestation de scolarité</SelectItem>
                  <SelectItem value="RELEVE_NOTES">Relevé de notes</SelectItem>
                  <SelectItem value="ATTESTATION_REUSSITE">Attestation de réussite</SelectItem>
                  <SelectItem value="DUPLICATA_CARTE">Duplicata de carte étudiant</SelectItem>
                  <SelectItem value="CONVENTION_STAGE">Convention de stage</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Choisissez le type de document que vous souhaitez obtenir
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Objet */}
        <FormField
          control={form.control}
          name="objet"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Objet *</FormLabel>
              <FormControl>
                <Input
                  placeholder="Objet de la demande"
                  maxLength={255}
                  {...field}
                  aria-describedby="objet-description objet-error"
                />
              </FormControl>
              <FormDescription id="objet-description">
                Résumez votre demande en quelques mots (5-255 caractères)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Décrivez votre demande en détail..."
                  rows={5}
                  {...field}
                  aria-describedby="description-description description-error"
                />
              </FormControl>
              <FormDescription id="description-description">
                Fournissez tous les détails nécessaires pour traiter votre demande (minimum 10 caractères)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Priorité */}
        <FormField
          control={form.control}
          name="priorite"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Priorité</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner la priorité" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="BASSE">Basse</SelectItem>
                  <SelectItem value="NORMALE">Normale</SelectItem>
                  <SelectItem value="HAUTE">Haute</SelectItem>
                  <SelectItem value="URGENTE">Urgente</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Indiquez le niveau d&apos;urgence de votre demande
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Actions */}
        <div className="flex gap-4">
          <Button
            type="submit"
            disabled={isPending || !form.formState.isValid}
            className="min-w-[180px]"
          >
            {isPending ? 'Envoi en cours...' : 'Soumettre la demande'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (form.formState.isDirty) {
                if (confirm('Voulez-vous vraiment annuler ? Les modifications seront perdues.')) {
                  router.back();
                }
              } else {
                router.back();
              }
            }}
            disabled={isPending}
          >
            Annuler
          </Button>
        </div>

        {/* Form status message for screen readers */}
        <div className="sr-only" role="status" aria-live="polite">
          {isPending && 'Envoi de la demande en cours...'}
          {formError && `Erreur: ${formError}`}
          {form.formState.isSubmitSuccessful && 'Demande créée avec succès'}
        </div>
      </form>
    </Form>
  );
}
