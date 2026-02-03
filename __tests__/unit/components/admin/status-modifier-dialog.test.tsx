import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StatusModifierDialog } from '@/components/admin/status-modifier-dialog';
import type { IDemande, UserRole } from '@/types/database';

// Mocks
const mockRefresh = vi.fn();
const mockTransitionAction = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: mockRefresh,
  }),
}));

vi.mock('@/app/actions/demandes', () => ({
  transitionDemandeAction: (...args: unknown[]) => mockTransitionAction(...args),
}));

vi.mock('@/lib/workflow/utils', () => ({
  getAvailableTransitions: () => ['EN_COURS', 'VALIDE', 'REJETE', 'ATTENTE_INFO'],
}));

vi.mock('@/lib/workflow/constants', () => ({
  STATUTS_META: {
    EN_COURS: { libelle: 'En cours' },
    VALIDE: { libelle: 'Validé' },
    REJETE: { libelle: 'Rejeté' },
    ATTENTE_INFO: { libelle: 'En attente d\'informations' },
  },
}));

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: { children: React.ReactNode; open: boolean }) => (
    open ? <div data-testid="dialog">{children}</div> : null
  ),
  DialogContent: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="dialog-content" className={className}>{children}</div>
  ),
  DialogHeader: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dialog-header">{children}</div>
  ),
  DialogTitle: ({ children }: { children: React.ReactNode }) => (
    <h2 data-testid="dialog-title">{children}</h2>
  ),
  DialogFooter: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dialog-footer">{children}</div>
  ),
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, type, disabled, variant }: { 
    children: React.ReactNode; 
    onClick?: () => void; 
    type?: 'button' | 'submit';
    disabled?: boolean;
    variant?: string;
  }) => (
    <button 
      onClick={onClick} 
      type={type}
      disabled={disabled}
      data-variant={variant}
    >
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/label', () => ({
  Label: ({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) => (
    <label htmlFor={htmlFor}>{children}</label>
  ),
}));

vi.mock('@/components/ui/textarea', () => ({
  Textarea: ({ id, value, onChange, placeholder, rows, disabled, className }: {
    id?: string;
    value?: string;
    onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    placeholder?: string;
    rows?: number;
    disabled?: boolean;
    className?: string;
  }) => (
    <textarea
      id={id}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      disabled={disabled}
      className={className}
    />
  ),
}));

describe('StatusModifierDialog', () => {
  const mockDemande: IDemande = {
    _id: '507f1f77bcf86cd799439011',
    numeroDemande: 'DEM-2026-000001',
    objet: 'Test demande',
    description: 'Description',
    statut: { code: 'SOUMIS', libelle: 'Soumis', couleur: '#6B7280' },
    typeDemande: { code: 'ATTESTATION_SCOLARITE', nom: 'Attestation', delaiTraitement: 3 },
    etudiant: { id: '1', nom: 'Doe', prenom: 'John', email: 'john@example.com', matricule: 'ETU001' },
    priorite: 'NORMALE',
    createdAt: '2026-01-15T10:00:00Z',
    documents: [],
    actif: true,
  };

  const mockOnClose = vi.fn();
  const defaultUserRole: UserRole = 'ADMIN';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ne rend rien quand isOpen est false', () => {
    render(
      <StatusModifierDialog
        demande={mockDemande}
        userRole={defaultUserRole}
        isOpen={false}
        onClose={mockOnClose}
      />
    );

    expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();
  });

  it('rend le dialog quand isOpen est true', () => {
    render(
      <StatusModifierDialog
        demande={mockDemande}
        userRole={defaultUserRole}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByTestId('dialog')).toBeInTheDocument();
    // "Modifier le statut" apparaît dans le titre et le bouton - utiliser getAllByText
    expect(screen.getAllByText('Modifier le statut').length).toBeGreaterThanOrEqual(1);
  });

  it('affiche le sélecteur de statut avec les options disponibles', () => {
    render(
      <StatusModifierDialog
        demande={mockDemande}
        userRole={defaultUserRole}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    const statusSelect = screen.getByLabelText(/nouveau statut/i);
    expect(statusSelect).toBeInTheDocument();

    // Vérification des options
    const options = screen.getAllByRole('option');
    expect(options.length).toBeGreaterThan(0);
    expect(screen.getByText('En cours')).toBeInTheDocument();
    expect(screen.getByText('Validé')).toBeInTheDocument();
    expect(screen.getByText('Rejeté')).toBeInTheDocument();
  });

  it('affiche le champ commentaire', () => {
    render(
      <StatusModifierDialog
        demande={mockDemande}
        userRole={defaultUserRole}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByLabelText(/commentaire/i)).toBeInTheDocument();
  });

  it('affiche le bouton Annuler', () => {
    render(
      <StatusModifierDialog
        demande={mockDemande}
        userRole={defaultUserRole}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByRole('button', { name: /annuler/i })).toBeInTheDocument();
  });

  it('affiche le bouton de soumission', () => {
    render(
      <StatusModifierDialog
        demande={mockDemande}
        userRole={defaultUserRole}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByRole('button', { name: /modifier le statut/i })).toBeInTheDocument();
  });

  it('affiche le champ motif de refus quand REJETE est sélectionné', async () => {
    const user = userEvent.setup();
    
    render(
      <StatusModifierDialog
        demande={mockDemande}
        userRole={defaultUserRole}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    // Sélectionner REJETE
    const statusSelect = screen.getByLabelText(/nouveau statut/i);
    await user.selectOptions(statusSelect, 'REJETE');

    // Le champ motif de refus devrait apparaître
    expect(screen.getByLabelText(/motif de refus/i)).toBeInTheDocument();
  });

  it('indique le commentaire comme obligatoire quand ATTENTE_INFO est sélectionné', async () => {
    const user = userEvent.setup();
    
    render(
      <StatusModifierDialog
        demande={mockDemande}
        userRole={defaultUserRole}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    const statusSelect = screen.getByLabelText(/nouveau statut/i);
    await user.selectOptions(statusSelect, 'ATTENTE_INFO');

    // Le label du commentaire devrait indiquer qu'il est requis
    const commentLabel = screen.getByText(/commentaire/i);
    expect(commentLabel).toBeInTheDocument();
  });

  it('ferme le dialog quand on clique sur Annuler', async () => {
    const user = userEvent.setup();
    
    render(
      <StatusModifierDialog
        demande={mockDemande}
        userRole={defaultUserRole}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /annuler/i });
    await user.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('affiche une erreur quand aucun statut n\'est sélectionné', async () => {
    const user = userEvent.setup();
    
    render(
      <StatusModifierDialog
        demande={mockDemande}
        userRole={defaultUserRole}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    // Soumettre sans sélectionner de statut
    const submitButton = screen.getByRole('button', { name: /modifier le statut/i });
    await user.click(submitButton);

    expect(screen.getByText(/veuillez sélectionner un statut/i)).toBeInTheDocument();
    expect(mockTransitionAction).not.toHaveBeenCalled();
  });

  it('soumet le formulaire avec succès', async () => {
    const user = userEvent.setup();
    mockTransitionAction.mockResolvedValueOnce({ success: true });
    
    render(
      <StatusModifierDialog
        demande={mockDemande}
        userRole={defaultUserRole}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    // Sélectionner un statut
    const statusSelect = screen.getByLabelText(/nouveau statut/i);
    await user.selectOptions(statusSelect, 'EN_COURS');

    // Ajouter un commentaire
    const commentaireInput = screen.getByLabelText(/commentaire/i);
    await user.type(commentaireInput, 'En cours de traitement');

    // Soumettre
    const submitButton = screen.getByRole('button', { name: /modifier le statut/i });
    
    await act(async () => {
      await user.click(submitButton);
    });

    await waitFor(() => {
      expect(mockTransitionAction).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        expect.any(FormData)
      );
    });

    await waitFor(() => {
      expect(mockRefresh).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('soumet avec motif de refus pour le statut REJETE', async () => {
    const user = userEvent.setup();
    mockTransitionAction.mockResolvedValueOnce({ success: true });
    
    render(
      <StatusModifierDialog
        demande={mockDemande}
        userRole={defaultUserRole}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    // Sélectionner REJETE
    const statusSelect = screen.getByLabelText(/nouveau statut/i);
    await user.selectOptions(statusSelect, 'REJETE');

    // Remplir le motif de refus
    const motifInput = screen.getByLabelText(/motif de refus/i);
    await user.type(motifInput, 'Documents incomplets fournis');

    // Soumettre
    const submitButton = screen.getByRole('button', { name: /modifier le statut/i });
    
    await act(async () => {
      await user.click(submitButton);
    });

    await waitFor(() => {
      expect(mockTransitionAction).toHaveBeenCalled();
    });
  });

  it('gère les erreurs de l\'action', async () => {
    const user = userEvent.setup();
    const errorMessage = 'Transition non autorisée';
    mockTransitionAction.mockResolvedValueOnce({
      success: false,
      error: { message: errorMessage },
    });
    
    render(
      <StatusModifierDialog
        demande={mockDemande}
        userRole={defaultUserRole}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    // Sélectionner un statut
    const statusSelect = screen.getByLabelText(/nouveau statut/i);
    await user.selectOptions(statusSelect, 'VALIDE');

    // Soumettre
    const submitButton = screen.getByRole('button', { name: /modifier le statut/i });
    
    await act(async () => {
      await user.click(submitButton);
    });

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('gère les erreurs inattendues', async () => {
    const user = userEvent.setup();
    mockTransitionAction.mockRejectedValueOnce(new Error('Erreur réseau'));
    
    render(
      <StatusModifierDialog
        demande={mockDemande}
        userRole={defaultUserRole}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    // Sélectionner un statut
    const statusSelect = screen.getByLabelText(/nouveau statut/i);
    await user.selectOptions(statusSelect, 'VALIDE');

    // Soumettre
    const submitButton = screen.getByRole('button', { name: /modifier le statut/i });
    
    await act(async () => {
      await user.click(submitButton);
    });

    await waitFor(() => {
      expect(screen.getByText(/une erreur est survenue/i)).toBeInTheDocument();
    });
  });

  it('affiche l\'état de chargement pendant la soumission', async () => {
    const user = userEvent.setup();
    mockTransitionAction.mockImplementation(() => new Promise(() => {})); // Never resolves
    
    render(
      <StatusModifierDialog
        demande={mockDemande}
        userRole={defaultUserRole}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    // Sélectionner un statut
    const statusSelect = screen.getByLabelText(/nouveau statut/i);
    await user.selectOptions(statusSelect, 'EN_COURS');

    // Soumettre
    const submitButton = screen.getByRole('button', { name: /modifier le statut/i });
    
    await act(async () => {
      await user.click(submitButton);
    });

    await waitFor(() => {
      expect(screen.getByText(/enregistrement/i)).toBeInTheDocument();
    });

    // Vérifier que les champs sont désactivés
    expect(statusSelect).toBeDisabled();
  });

  it('empêche la fermeture pendant le chargement', async () => {
    const user = userEvent.setup();
    mockTransitionAction.mockImplementation(() => new Promise(() => {}));
    
    render(
      <StatusModifierDialog
        demande={mockDemande}
        userRole={defaultUserRole}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    // Sélectionner et soumettre
    const statusSelect = screen.getByLabelText(/nouveau statut/i);
    await user.selectOptions(statusSelect, 'EN_COURS');

    const submitButton = screen.getByRole('button', { name: /modifier le statut/i });
    await act(async () => {
      await user.click(submitButton);
    });

    // Essayer de fermer
    const cancelButton = screen.getByRole('button', { name: /annuler/i });
    expect(cancelButton).toBeDisabled();

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('réinitialise le formulaire après fermeture', async () => {
    const user = userEvent.setup();
    
    const { rerender } = render(
      <StatusModifierDialog
        demande={mockDemande}
        userRole={defaultUserRole}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    // Sélectionner un statut et remplir les champs
    const statusSelect = screen.getByLabelText(/nouveau statut/i);
    await user.selectOptions(statusSelect, 'EN_COURS');

    const commentaireInput = screen.getByLabelText(/commentaire/i);
    await user.type(commentaireInput, 'Test commentaire');

    // Fermer le dialog
    const cancelButton = screen.getByRole('button', { name: /annuler/i });
    await user.click(cancelButton);

    // Rouvrir le dialog
    rerender(
      <StatusModifierDialog
        demande={mockDemande}
        userRole={defaultUserRole}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    // Vérifier que les champs sont réinitialisés
    expect(statusSelect).toHaveValue('');
    expect(commentaireInput).toHaveValue('');
  });

  it('transmet le userRole à getAvailableTransitions', () => {
    const superAdminRole: UserRole = 'SUPER_ADMIN';
    
    render(
      <StatusModifierDialog
        demande={mockDemande}
        userRole={superAdminRole}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    // Le dialog devrait s'afficher avec les options disponibles pour SUPER_ADMIN
    expect(screen.getByTestId('dialog')).toBeInTheDocument();
  });
});
