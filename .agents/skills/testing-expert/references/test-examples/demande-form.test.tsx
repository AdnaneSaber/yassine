/**
 * Exemple de test unitaire pour un formulaire de demande
 * À copier/modifier dans: __tests__/unit/components/demandes/DemandeForm.test.tsx
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DemandeForm } from '@/components/demandes/DemandeForm';

// Mock des actions
vi.mock('@/app/actions/demandes', () => ({
  createDemande: vi.fn(),
}));

import { createDemande } from '@/app/actions/demandes';

describe('DemandeForm', () => {
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rend le formulaire avec tous les champs', () => {
    render(<DemandeForm onSuccess={mockOnSuccess} />);

    expect(screen.getByLabelText(/type de demande/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/objet/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/priorité/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /soumettre/i })).toBeInTheDocument();
  });

  it('soumet le formulaire avec données valides', async () => {
    const mockedCreateDemande = vi.mocked(createDemande);
    mockedCreateDemande.mockResolvedValue({
      success: true,
      data: {
        _id: '123',
        numeroDemande: 'DEM-2026-000001',
      },
    });

    render(<DemandeForm onSuccess={mockOnSuccess} />);

    // Remplir le formulaire
    await userEvent.selectOptions(
      screen.getByLabelText(/type de demande/i),
      'ATTESTATION'
    );
    
    await userEvent.type(
      screen.getByLabelText(/objet/i),
      'Demande d\'attestation de scolarité'
    );
    
    await userEvent.type(
      screen.getByLabelText(/description/i),
      'Je souhaite obtenir une attestation pour mon stage de fin d\'études.'
    );

    // Soumettre
    await userEvent.click(screen.getByRole('button', { name: /soumettre/i }));

    // Vérifier
    await waitFor(() => {
      expect(mockedCreateDemande).toHaveBeenCalledWith(
        expect.objectContaining({
          typeDemande: 'ATTESTATION',
          objet: "Demande d'attestation de scolarité",
          description: expect.stringContaining('stage'),
          priorite: 'NORMALE',
        })
      );
    });

    expect(mockOnSuccess).toHaveBeenCalled();
  });

  it('affiche les erreurs de validation Zod', async () => {
    render(<DemandeForm onSuccess={mockOnSuccess} />);

    // Soumettre sans remplir
    await userEvent.click(screen.getByRole('button', { name: /soumettre/i }));

    // Vérifier messages d'erreur
    await waitFor(() => {
      expect(screen.getByText(/objet doit contenir au moins 5 caractères/i)).toBeInTheDocument();
    });
  });

  it('affiche erreur si création échoue', async () => {
    const mockedCreateDemande = vi.mocked(createDemande);
    mockedCreateDemande.mockResolvedValue({
      success: false,
      error: {
        code: 'SRV_001',
        message: 'Erreur serveur',
      },
    });

    render(<DemandeForm onSuccess={mockOnSuccess} />);

    // Remplir et soumettre
    await userEvent.selectOptions(
      screen.getByLabelText(/type de demande/i),
      'ATTESTATION'
    );
    await userEvent.type(screen.getByLabelText(/objet/i), 'Test objet');
    await userEvent.type(screen.getByLabelText(/description/i), 'Description suffisamment longue');
    await userEvent.click(screen.getByRole('button', { name: /soumettre/i }));

    // Vérifier erreur affichée
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/erreur serveur/i);
    });
  });

  it('désactive le bouton pendant la soumission', async () => {
    const mockedCreateDemande = vi.mocked(createDemande);
    mockedCreateDemande.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<DemandeForm onSuccess={mockOnSuccess} />);

    // Remplir
    await userEvent.selectOptions(
      screen.getByLabelText(/type de demande/i),
      'ATTESTATION'
    );
    await userEvent.type(screen.getByLabelText(/objet/i), 'Test objet');
    await userEvent.type(screen.getByLabelText(/description/i), 'Description suffisamment longue');

    // Soumettre
    await userEvent.click(screen.getByRole('button', { name: /soumettre/i }));

    // Vérifier état loading
    expect(screen.getByRole('button', { name: /envoi/i })).toBeDisabled();
  });
});
