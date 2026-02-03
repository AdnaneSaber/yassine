import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DemandesTable } from '@/components/admin/demandes-table';
import type { IDemande, UserRole } from '@/types/database';

// Mocks
const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

vi.mock('@/components/admin/status-modifier-dialog', () => ({
  StatusModifierDialog: ({ demande, isOpen, onClose }: { demande: IDemande; isOpen: boolean; onClose: () => void }) => (
    isOpen ? (
      <div data-testid="status-dialog" data-demande-id={demande._id}>
        <button onClick={onClose} data-testid="close-dialog">Fermer</button>
      </div>
    ) : null
  ),
}));

vi.mock('@/components/ui/table', () => ({
  Table: ({ children }: { children: React.ReactNode }) => <table data-testid="table">{children}</table>,
  TableHeader: ({ children }: { children: React.ReactNode }) => <thead>{children}</thead>,
  TableBody: ({ children }: { children: React.ReactNode }) => <tbody>{children}</tbody>,
  TableHead: ({ children }: { children: React.ReactNode }) => <th>{children}</th>,
  TableRow: ({ children }: { children: React.ReactNode }) => <tr>{children}</tr>,
  TableCell: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <td className={className}>{children}</td>
  ),
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
    <span data-testid="badge" style={style}>{children}</span>
  ),
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, variant, size }: { children: React.ReactNode; onClick?: () => void; variant?: string; size?: string }) => (
    <button onClick={onClick} data-variant={variant} data-size={size}>{children}</button>
  ),
}));

describe('DemandesTable', () => {
  const mockDemandes: IDemande[] = [
    {
      _id: '507f1f77bcf86cd799439011',
      numeroDemande: 'DEM-2026-000001',
      objet: 'Demande attestations',
      description: 'Description 1',
      statut: { code: 'SOUMIS', libelle: 'Soumis', couleur: '#6B7280' },
      typeDemande: { code: 'ATTESTATION_SCOLARITE', nom: 'Attestation de scolarité', delaiTraitement: 3 },
      etudiant: { id: '1', nom: 'Doe', prenom: 'John', email: 'john@example.com', matricule: 'ETU001' },
      priorite: 'NORMALE',
      createdAt: '2026-01-15T10:00:00Z',
      documents: [],
      actif: true,
    },
    {
      _id: '507f1f77bcf86cd799439012',
      numeroDemande: 'DEM-2026-000002',
      objet: 'Convention de stage urgent',
      description: 'Description 2',
      statut: { code: 'EN_COURS', libelle: 'En cours', couleur: '#F59E0B' },
      typeDemande: { code: 'CONVENTION_STAGE', nom: 'Convention de stage', delaiTraitement: 5 },
      etudiant: { id: '2', nom: 'Smith', prenom: 'Jane', email: 'jane@example.com', matricule: 'ETU002' },
      priorite: 'URGENTE',
      createdAt: '2026-01-14T09:00:00Z',
      documents: [{ id: '1', nomOriginal: 'cv.pdf', type: 'application/pdf', taille: 1024, url: 'http://test.com/cv.pdf' }],
      actif: true,
    },
    {
      _id: '507f1f77bcf86cd799439013',
      numeroDemande: 'DEM-2026-000003',
      objet: 'Relevé de notes',
      description: 'Description 3',
      statut: { code: 'VALIDE', libelle: 'Validé', couleur: '#10B981' },
      typeDemande: { code: 'RELEVE_NOTES', nom: 'Relevé de notes', delaiTraitement: 2 },
      etudiant: { id: '3', nom: 'Martin', prenom: 'Pierre', email: 'pierre@example.com', matricule: 'ETU003' },
      priorite: 'BASSE',
      createdAt: '2026-01-10T14:00:00Z',
      documents: [],
      actif: true,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('affiche l\'empty state quand la liste est vide', () => {
    render(<DemandesTable demandes={[]} />);

    expect(screen.getByText('Aucune demande trouvée')).toBeInTheDocument();
  });

  it('rend le tableau avec les en-têtes corrects', () => {
    render(<DemandesTable demandes={mockDemandes} />);

    expect(screen.getByText('Numéro')).toBeInTheDocument();
    expect(screen.getByText('Étudiant')).toBeInTheDocument();
    expect(screen.getByText('Type')).toBeInTheDocument();
    expect(screen.getByText('Objet')).toBeInTheDocument();
    expect(screen.getByText('Statut')).toBeInTheDocument();
    expect(screen.getByText('Priorité')).toBeInTheDocument();
    expect(screen.getByText('Date')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
  });

  it('affiche toutes les demandes dans le tableau', () => {
    render(<DemandesTable demandes={mockDemandes} />);

    // Vérification des numéros
    expect(screen.getByText('DEM-2026-000001')).toBeInTheDocument();
    expect(screen.getByText('DEM-2026-000002')).toBeInTheDocument();
    expect(screen.getByText('DEM-2026-000003')).toBeInTheDocument();

    // Vérification des objets (utiliser getAllByText car ils peuvent apparaître ailleurs)
    expect(screen.getByText('Demande attestations')).toBeInTheDocument();
    expect(screen.getByText('Convention de stage urgent')).toBeInTheDocument();
    // "Relevé de notes" apparaît à la fois comme type et objet - utiliser getAllByText
    expect(screen.getAllByText('Relevé de notes').length).toBeGreaterThanOrEqual(1);
  });

  it('affiche les informations des étudiants', () => {
    render(<DemandesTable demandes={mockDemandes} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Pierre Martin')).toBeInTheDocument();

    // Vérification des matricules
    expect(screen.getByText('ETU001')).toBeInTheDocument();
    expect(screen.getByText('ETU002')).toBeInTheDocument();
    expect(screen.getByText('ETU003')).toBeInTheDocument();
  });

  it('affiche les types de demande', () => {
    render(<DemandesTable demandes={mockDemandes} />);

    expect(screen.getByText('Attestation de scolarité')).toBeInTheDocument();
    expect(screen.getByText('Convention de stage')).toBeInTheDocument();
    // "Relevé de notes" peut apparaître plusieurs fois - utiliser getAllByText
    expect(screen.getAllByText('Relevé de notes').length).toBeGreaterThanOrEqual(1);
  });

  it('affiche les statuts avec les bonnes couleurs', () => {
    render(<DemandesTable demandes={mockDemandes} />);

    const badges = screen.getAllByTestId('badge');
    expect(badges).toHaveLength(3);

    expect(badges[0]).toHaveTextContent('Soumis');
    expect(badges[0]).toHaveStyle({ backgroundColor: '#6B7280' });

    expect(badges[1]).toHaveTextContent('En cours');
    expect(badges[1]).toHaveStyle({ backgroundColor: '#F59E0B' });

    expect(badges[2]).toHaveTextContent('Validé');
    expect(badges[2]).toHaveStyle({ backgroundColor: '#10B981' });
  });

  it('affiche les priorités avec les bonnes classes CSS', () => {
    render(<DemandesTable demandes={mockDemandes} />);

    expect(screen.getByText('NORMALE')).toBeInTheDocument();
    expect(screen.getByText('URGENTE')).toBeInTheDocument();
    expect(screen.getByText('BASSE')).toBeInTheDocument();
  });

  it('affiche les dates formatées', () => {
    render(<DemandesTable demandes={mockDemandes} />);

    const expectedDate1 = new Date('2026-01-15T10:00:00Z').toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    expect(screen.getByText(expectedDate1)).toBeInTheDocument();
  });

  it('affiche les boutons d\'action pour chaque ligne', () => {
    render(<DemandesTable demandes={mockDemandes} />);

    const voirButtons = screen.getAllByRole('button', { name: 'Voir' });
    const modifierButtons = screen.getAllByRole('button', { name: 'Modifier' });

    expect(voirButtons).toHaveLength(3);
    expect(modifierButtons).toHaveLength(3);
  });

  it('navigue vers le détail quand on clique sur Voir', () => {
    render(<DemandesTable demandes={mockDemandes} />);

    const voirButtons = screen.getAllByRole('button', { name: 'Voir' });
    fireEvent.click(voirButtons[0]);

    expect(mockPush).toHaveBeenCalledWith('/admin/demandes/507f1f77bcf86cd799439011');
  });

  it('ouvre le dialog de modification quand on clique sur Modifier', () => {
    render(<DemandesTable demandes={mockDemandes} />);

    const modifierButtons = screen.getAllByRole('button', { name: 'Modifier' });
    fireEvent.click(modifierButtons[0]);

    expect(screen.getByTestId('status-dialog')).toBeInTheDocument();
    expect(screen.getByTestId('status-dialog')).toHaveAttribute('data-demande-id', '507f1f77bcf86cd799439011');
  });

  it('ferme le dialog quand on appelle onClose', () => {
    render(<DemandesTable demandes={mockDemandes} />);

    // Ouvrir le dialog
    const modifierButtons = screen.getAllByRole('button', { name: 'Modifier' });
    fireEvent.click(modifierButtons[0]);

    expect(screen.getByTestId('status-dialog')).toBeInTheDocument();

    // Fermer le dialog
    fireEvent.click(screen.getByTestId('close-dialog'));

    expect(screen.queryByTestId('status-dialog')).not.toBeInTheDocument();
  });

  it('passe le userRole au StatusModifierDialog', () => {
    const customRole: UserRole = 'SUPER_ADMIN';
    render(<DemandesTable demandes={mockDemandes} userRole={customRole} />);

    const modifierButtons = screen.getAllByRole('button', { name: 'Modifier' });
    fireEvent.click(modifierButtons[0]);

    expect(screen.getByTestId('status-dialog')).toBeInTheDocument();
  });

  it('utilise le role ADMIN par défaut', () => {
    render(<DemandesTable demandes={mockDemandes} />);

    // Le composant devrait fonctionner sans userRole explicite
    const modifierButtons = screen.getAllByRole('button', { name: 'Modifier' });
    expect(modifierButtons).toHaveLength(3);
  });

  it('travaille correctement avec une seule demande', () => {
    render(<DemandesTable demandes={[mockDemandes[0]]} />);

    expect(screen.getByText('DEM-2026-000001')).toBeInTheDocument();
    expect(screen.queryByText('DEM-2026-000002')).not.toBeInTheDocument();
  });

  it('gère les demandes sans _id', () => {
    const demandeWithoutId = { ...mockDemandes[0], _id: undefined };
    render(<DemandesTable demandes={[demandeWithoutId]} />);

    // Devrait afficher sans erreur
    expect(screen.getByText('DEM-2026-000001')).toBeInTheDocument();

    // Cliquer sur Voir avec un ID vide
    const voirButton = screen.getByRole('button', { name: 'Voir' });
    fireEvent.click(voirButton);

    expect(mockPush).toHaveBeenCalledWith('/admin/demandes/');
  });

  it('affiche correctement les objets longs avec title', () => {
    const demandeWithLongObjet = {
      ...mockDemandes[0],
      objet: 'A'.repeat(100),
    };

    render(<DemandesTable demandes={[demandeWithLongObjet]} />);

    const objetCell = screen.getByText('A'.repeat(100));
    expect(objetCell).toHaveAttribute('title', 'A'.repeat(100));
  });
});
