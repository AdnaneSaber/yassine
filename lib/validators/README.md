# Validation and Error Handling Guide

This guide demonstrates how to use the validation and error handling utilities in the application.

## Table of Contents

1. [Zod Schema Validation](#zod-schema-validation)
2. [Error Display Components](#error-display-components)
3. [Toast Notifications](#toast-notifications)
4. [Form Implementation Example](#form-implementation-example)
5. [Server Action Integration](#server-action-integration)

---

## Zod Schema Validation

All validation schemas are defined in `lib/validators/` using Zod with French error messages.

### Available Schemas

- `createDemandeSchema` - Creating new demandes
- `updateDemandeSchema` - Updating existing demandes
- `transitionDemandeSchema` - Status transitions (admin)
- `queryDemandesSchema` - Query parameters for listing
- `fileUploadSchema` - File upload validation
- `commentaireSchema` - Adding comments

### Features

✅ Custom French error messages
✅ Data normalization (whitespace trimming)
✅ Field-level validation rules
✅ Cross-field validation with refinements
✅ Transform functions for data cleanup
✅ Strict mode to prevent extra fields

### Example Usage

```typescript
import { createDemandeSchema } from '@/lib/validators/demande';

// In a form component
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
```

### Validation Rules

#### Create Demande Schema

| Field | Rules | Error Messages |
|-------|-------|----------------|
| `typeDemande` | Required enum | "Veuillez sélectionner un type de demande valide" |
| `objet` | 5-255 chars, regex pattern | "L'objet doit contenir au moins 5 caractères" |
| `description` | 10-2000 chars | "La description doit contenir au moins 10 caractères" |
| `priorite` | Optional enum, default 'NORMALE' | "Veuillez sélectionner une priorité valide" |

#### File Upload Schema

| Rule | Value | Error Message |
|------|-------|---------------|
| Max file size | 5MB | "La taille du fichier ne doit pas dépasser 5MB" |
| Allowed types | PDF, JPEG, PNG, DOC, DOCX | "Le type de fichier n'est pas accepté..." |

---

## Error Display Components

Located in `components/ui/error-display.tsx`

### FormFieldError

Display inline errors for individual form fields.

```tsx
import { FormFieldError } from '@/components/ui/error-display';

<FormFieldError
  error={form.formState.errors.objet?.message}
  id="objet-error"
/>
```

**Features:**
- ARIA attributes for accessibility
- Icon indicator
- Auto-hides when no error

### FormErrors

Display form-level errors (multiple errors at once).

```tsx
import { FormErrors } from '@/components/ui/error-display';

<FormErrors
  errors={formError}
  title="Erreur de soumission"
/>
```

**Accepts:**
- Single string error
- Array of errors
- Object with multiple field errors

### SuccessMessage

```tsx
import { SuccessMessage } from '@/components/ui/error-display';

<SuccessMessage
  message="Demande créée avec succès"
  title="Succès"
/>
```

### WarningMessage

```tsx
import { WarningMessage } from '@/components/ui/error-display';

<WarningMessage
  message="Cette action est irréversible"
  title="Attention"
/>
```

### ErrorBoundary

Catch React errors and display fallback UI.

```tsx
import { ErrorBoundary } from '@/components/ui/error-display';

<ErrorBoundary
  onError={(error, errorInfo) => {
    console.error('Caught error:', error);
  }}
>
  <YourComponent />
</ErrorBoundary>
```

### LoadingSpinner

```tsx
import { LoadingSpinner } from '@/components/ui/error-display';

<LoadingSpinner
  size="md"
  message="Chargement en cours..."
/>
```

---

## Toast Notifications

Located in `lib/utils/toast.ts`

### Basic Toast Functions

```typescript
import { toast } from '@/lib/utils/toast';

// Success
toast.success('Opération réussie');

// Error
toast.error('Une erreur est survenue');

// Info
toast.info('Information importante');

// Warning
toast.warning('Attention');

// Loading (returns toast ID for later update)
const toastId = toast.loading('Chargement...');
toast.dismiss(toastId);
```

### Specialized Toast Utilities

#### Demande Toasts

```typescript
import { demandeToasts } from '@/lib/utils/toast';

// Success cases
demandeToasts.created();
demandeToasts.updated();
demandeToasts.statusChanged('VALIDÉ');
demandeToasts.fileUploaded('document.pdf');
demandeToasts.commentAdded();

// Error cases
demandeToasts.createdError('Message personnalisé');
demandeToasts.updatedError();
demandeToasts.fileUploadError();
```

#### Auth Toasts

```typescript
import { authToasts } from '@/lib/utils/toast';

authToasts.loginSuccess();
authToasts.loginError('Identifiants incorrects');
authToasts.sessionExpired();
authToasts.unauthorized();
```

#### Admin Toasts

```typescript
import { adminToasts } from '@/lib/utils/toast';

adminToasts.userCreated();
adminToasts.settingsSaved();
adminToasts.bulkOperationSuccess(5, 'supprimé(s)');
```

### Async Operation Helpers

#### withToast

Wraps an async operation with automatic toast notifications.

```typescript
import { withToast } from '@/lib/utils/toast';

const result = await withToast(
  async () => {
    return await createDemande(data);
  },
  {
    loading: 'Création en cours...',
    success: 'Demande créée avec succès',
    error: 'Erreur lors de la création'
  }
);
```

#### withLoadingToast

More control over loading toast.

```typescript
import { withLoadingToast } from '@/lib/utils/toast';

const result = await withLoadingToast(
  async () => {
    return await uploadFile(file);
  },
  'Téléversement en cours...',
  (result) => `Fichier "${result.name}" téléversé`,
  'Erreur de téléversement'
);
```

---

## Form Implementation Example

Complete example of a form with validation and error handling.

```tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createDemandeSchema, type CreateDemandeInput } from '@/lib/validators/demande';
import { createDemandeAction } from '@/app/actions/demandes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

export function ExampleForm() {
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
    mode: 'onBlur', // Validate on blur
  });

  const onSubmit = async (data: CreateDemandeInput) => {
    setFormError(null);

    startTransition(async () => {
      try {
        const formData = new FormData();
        Object.entries(data).forEach(([key, value]) => {
          formData.append(key, value);
        });

        const result = await createDemandeAction(formData);

        if (result.success) {
          demandeToasts.created();
          form.reset();
          router.push('/demandes');
          router.refresh();
        } else {
          const errorMessage = result.error?.message || 'Une erreur est survenue';
          setFormError(errorMessage);
          demandeToasts.createdError(errorMessage);
        }
      } catch (err) {
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

        {/* Form fields */}
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
                Résumez votre demande (5-255 caractères)
              </FormDescription>
              <FormMessage id="objet-error" />
            </FormItem>
          )}
        />

        {/* Submit button */}
        <Button
          type="submit"
          disabled={isPending}
        >
          {isPending ? 'Envoi en cours...' : 'Soumettre'}
        </Button>

        {/* Screen reader status */}
        <div className="sr-only" role="status" aria-live="polite">
          {isPending && 'Envoi en cours...'}
          {formError && `Erreur: ${formError}`}
        </div>
      </form>
    </Form>
  );
}
```

---

## Server Action Integration

Server actions automatically validate using Zod schemas.

### Action Response Format

```typescript
type ActionResponse<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string; details?: unknown } };
```

### Error Codes

| Code | Description |
|------|-------------|
| `VAL_001` | Validation error (Zod) |
| `RES_001` | Resource not found |
| `SRV_001` | Server error |
| `AUTH_001` | Authentication error |
| `PERM_001` | Permission denied |

### Example Server Action

```typescript
'use server';

import { z } from 'zod';
import { createDemandeSchema } from '@/lib/validators/demande';

export async function createDemandeAction(
  formData: FormData
): Promise<ActionResponse<any>> {
  try {
    // Parse and validate
    const data = {
      typeDemande: formData.get('typeDemande'),
      objet: formData.get('objet'),
      description: formData.get('description'),
      priorite: formData.get('priorite') || 'NORMALE'
    };

    const validated = createDemandeSchema.parse(data);

    // Process validated data...
    const demande = await Demande.create(validated);

    return { success: true, data: demande };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: {
          code: 'VAL_001',
          message: 'Erreur de validation',
          details: error.flatten().fieldErrors
        }
      };
    }

    return {
      success: false,
      error: { code: 'SRV_001', message: 'Erreur serveur' }
    };
  }
}
```

---

## Best Practices

### ✅ Do's

1. **Always use Zod schemas** for validation (client and server)
2. **Show inline errors** for field-level validation
3. **Show form-level errors** for submission errors
4. **Use toast notifications** for success/error feedback
5. **Add ARIA attributes** for accessibility
6. **Validate on blur** for better UX (`mode: 'onBlur'`)
7. **Clear errors** when form is resubmitted
8. **Use French messages** consistently
9. **Handle loading states** with disabled buttons and spinners
10. **Provide helpful descriptions** for form fields

### ❌ Don'ts

1. **Don't skip validation** on client or server
2. **Don't use generic error messages** - be specific
3. **Don't forget accessibility** (ARIA, screen readers)
4. **Don't show toast AND inline errors** for the same field
5. **Don't ignore loading states** - provide feedback
6. **Don't use English messages** in the UI
7. **Don't forget to revalidate paths** after mutations
8. **Don't allow multiple form submissions** during loading

---

## Accessibility Checklist

- [ ] All form fields have labels
- [ ] Error messages have `role="alert"` and `aria-live`
- [ ] Form inputs have `aria-describedby` for descriptions and errors
- [ ] Loading states announced to screen readers
- [ ] Success/error toasts are announced
- [ ] Form validation errors are accessible
- [ ] Keyboard navigation works correctly
- [ ] Focus management is proper

---

## Testing Guidelines

### Unit Tests

Test validation schemas:

```typescript
import { createDemandeSchema } from '@/lib/validators/demande';

describe('createDemandeSchema', () => {
  it('should validate valid data', () => {
    const result = createDemandeSchema.safeParse({
      typeDemande: 'ATTESTATION_SCOLARITE',
      objet: 'Demande attestation',
      description: 'Description détaillée de ma demande',
      priorite: 'NORMALE'
    });

    expect(result.success).toBe(true);
  });

  it('should reject short objet', () => {
    const result = createDemandeSchema.safeParse({
      typeDemande: 'ATTESTATION_SCOLARITE',
      objet: 'Test', // Too short
      description: 'Description détaillée',
      priorite: 'NORMALE'
    });

    expect(result.success).toBe(false);
  });
});
```

### Integration Tests

Test form submission flow with validation and error handling.

---

## Migration Guide

If you have existing forms, follow these steps:

1. **Add enhanced Zod schema** with French messages
2. **Import error display components**
3. **Replace generic error messages** with toast utilities
4. **Add form-level error state**
5. **Add ARIA attributes** to form fields
6. **Set validation mode** to `onBlur`
7. **Test accessibility** with screen reader
8. **Test all error paths** and success cases

---

## Questions?

For more examples, see:
- `components/demandes/demande-form.tsx` - Complete form example
- `app/actions/demandes.ts` - Server action examples
- `lib/validators/demande.ts` - Validation schema examples
