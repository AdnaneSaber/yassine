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
import { Label } from '@/components/ui/label';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { toast } from 'sonner';

export function DemandeForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<CreateDemandeInput>({
    resolver: zodResolver(createDemandeSchema),
    defaultValues: {
      typeDemande: undefined,
      objet: '',
      description: '',
      priorite: 'NORMALE'
    }
  });

  const onSubmit = async (data: CreateDemandeInput) => {
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append('typeDemande', data.typeDemande);
        formData.append('objet', data.objet);
        formData.append('description', data.description);
        formData.append('priorite', data.priorite);

        const result = await createDemandeAction(formData);

        if (result.success) {
          toast.success('Demande créée avec succès');
          router.push('/demandes');
        } else {
          toast.error(result.error?.message || 'Une erreur est survenue');
        }
      } catch (err) {
        console.error('Error creating demande:', err);
        toast.error('Une erreur est survenue lors de la création de la demande');
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                />
              </FormControl>
              <FormDescription>
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
                />
              </FormControl>
              <FormDescription>
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
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Envoi en cours...' : 'Soumettre la demande'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isPending}
          >
            Annuler
          </Button>
        </div>
      </form>
    </Form>
  );
}
