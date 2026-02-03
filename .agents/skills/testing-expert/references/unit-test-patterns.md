# Patterns de Tests Unitaires

Guide complet pour tester les composants React, hooks, et utilitaires.

## Table des matières

1. [Composants React](#composants-react)
2. [Custom Hooks](#custom-hooks)
3. [Utilitaires](#utilitaires)
4. [Validators Zod](#validators-zod)
5. [Server Actions](#server-actions)

---

## Composants React

### Pattern de base

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MonComposant } from '@/components/MonComposant';

describe('MonComposant', () => {
  // Setup commun
  const defaultProps = {
    title: 'Titre test',
    onAction: vi.fn(),
  };

  it('rend le composant correctement', () => {
    render(<MonComposant {...defaultProps} />);
    
    expect(screen.getByText('Titre test')).toBeInTheDocument();
  });

  it('gère les interactions utilisateur', async () => {
    const handleAction = vi.fn();
    render(<MonComposant {...defaultProps} onAction={handleAction} />);
    
    const button = screen.getByRole('button', { name: /action/i });
    await userEvent.click(button);
    
    expect(handleAction).toHaveBeenCalledTimes(1);
  });
});
```

### Avec contexte

```typescript
import { render, screen } from '@testing-library/react';
import { AuthProvider } from '@/contexts/AuthContext';
import { UserMenu } from '@/components/UserMenu';

const renderWithAuth = (ui: React.ReactElement, { user = null } = {}) => {
  return render(
    <AuthProvider value={{ user, isLoading: false }}>
      {ui}
    </AuthProvider>
  );
};

describe('UserMenu', () => {
  it('affiche le menu pour utilisateur connecté', () => {
    const user = { name: 'John', email: 'john@test.com' };
    renderWithAuth(<UserMenu />, { user });
    
    expect(screen.getByText('John')).toBeInTheDocument();
  });

  it('affiche bouton connexion pour visiteur', () => {
    renderWithAuth(<UserMenu />, { user: null });
    
    expect(screen.getByText('Se connecter')).toBeInTheDocument();
  });
});
```

### Formulaires avec React Hook Form

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DemandeForm } from '@/components/demandes/DemandeForm';

describe('DemandeForm', () => {
  it('soumet le formulaire avec données valides', async () => {
    const onSubmit = vi.fn();
    render(<DemandeForm onSubmit={onSubmit} />);

    // Remplir les champs
    await userEvent.type(
      screen.getByLabelText(/objet/i),
      'Demande de test'
    );
    await userEvent.type(
      screen.getByLabelText(/description/i),
      'Description détaillée de la demande'
    );
    await userEvent.selectOptions(
      screen.getByLabelText(/type/i),
      'ATTESTATION'
    );

    // Soumettre
    await userEvent.click(screen.getByRole('button', { name: /soumettre/i }));

    // Vérifier
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          objet: 'Demande de test',
          typeDemande: 'ATTESTATION',
        }),
        expect.anything()
      );
    });
  });

  it('affiche les erreurs de validation', async () => {
    render(<DemandeForm onSubmit={vi.fn()} />);

    // Soumettre vide
    await userEvent.click(screen.getByRole('button', { name: /soumettre/i }));

    await waitFor(() => {
      expect(screen.getByText(/objet est requis/i)).toBeInTheDocument();
    });
  });
});
```

---

## Custom Hooks

```typescript
import { renderHook, waitFor, act } from '@testing-library/react';
import { useCounter } from '@/hooks/useCounter';

describe('useCounter', () => {
  it('initialise avec la valeur par défaut', () => {
    const { result } = renderHook(() => useCounter());
    
    expect(result.current.count).toBe(0);
  });

  it('incrémente le compteur', () => {
    const { result } = renderHook(() => useCounter(10));
    
    act(() => {
      result.current.increment();
    });
    
    expect(result.current.count).toBe(11);
  });
});

// Hook avec async
import { useFetch } from '@/hooks/useFetch';

describe('useFetch', () => {
  it('charge les données', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ data: 'test' }),
    });

    const { result } = renderHook(() => useFetch('/api/data'));

    // Loading state
    expect(result.current.loading).toBe(true);

    // Wait for data
    await waitFor(() => {
      expect(result.current.data).toEqual({ data: 'test' });
    });
  });
});
```

---

## Utilitaires

```typescript
import { formatDate, slugify, calculateDays } from '@/lib/utils';

describe('formatDate', () => {
  it('formate une date en français', () => {
    const date = new Date('2026-01-15');
    
    expect(formatDate(date)).toBe('15/01/2026');
  });

  it('gère les dates invalides', () => {
    expect(formatDate(null)).toBe('Date invalide');
  });
});

describe('slugify', () => {
  it.each([
    ['Hello World', 'hello-world'],
    ['Test 123!', 'test-123'],
    ['  spaces  ', 'spaces'],
  ])('slugify(%s) => %s', (input, expected) => {
    expect(slugify(input)).toBe(expected);
  });
});
```

---

## Validators Zod

```typescript
import { createDemandeSchema } from '@/lib/validators/demande';

describe('createDemandeSchema', () => {
  it('valide une demande correcte', () => {
    const data = {
      typeDemande: 'ATTESTATION',
      objet: 'Demande test',
      description: 'Description détaillée suffisamment longue',
      priorite: 'NORMALE',
    };

    expect(() => createDemandeSchema.parse(data)).not.toThrow();
  });

  it('rejette un objet trop court', () => {
    const data = {
      typeDemande: 'ATTESTATION',
      objet: 'Test', // Trop court (< 5 caractères)
      description: 'Description',
    };

    expect(() => createDemandeSchema.parse(data)).toThrow(/5 caractères/);
  });

  it('rejette un type invalide', () => {
    const data = {
      typeDemande: 'INVALID_TYPE',
      objet: 'Demande test',
      description: 'Description suffisamment longue pour passer',
    };

    expect(() => createDemandeSchema.parse(data)).toThrow();
  });
});
```

---

## Server Actions

```typescript
import { createDemande } from '@/app/actions/demandes';
import { getServerSession } from 'next-auth';
import { Demande } from '@/lib/db/models';

vi.mock('next-auth');
vi.mock('@/lib/db/models');

describe('createDemande', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('crée une demande avec succès', async () => {
    // Mock session
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user123', email: 'test@test.com' }
    });

    // Mock DB
    const mockSave = vi.fn().mockResolvedValue({
      _id: 'demande123',
      numeroDemande: 'DEM-2026-000001',
    });
    vi.mocked(Demande).mockImplementation(() => ({
      save: mockSave,
    } as any));

    const result = await createDemande({
      typeDemande: 'ATTESTATION',
      objet: 'Test',
      description: 'Description suffisamment longue',
    });

    expect(result.success).toBe(true);
    expect(result.data).toHaveProperty('numeroDemande');
  });

  it('retourne erreur si non authentifié', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);

    const result = await createDemande({
      typeDemande: 'ATTESTATION',
      objet: 'Test',
      description: 'Description',
    });

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('AUTH_001');
  });
});
```

---

## Bonnes pratiques

1. **Arrange-Act-Assert**: Structurez vos tests en 3 parties claires
2. **Un seul concept par test**: Un test = une assertion principale
3. **Noms descriptifs**: Décrivez le comportement, pas l'implémentation
4. **data-testid**: Utilisez pour les éléments sans texte sémantique
5. **user-event** préféré à fireEvent pour les interactions réalistes
