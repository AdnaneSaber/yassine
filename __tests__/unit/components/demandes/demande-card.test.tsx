import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DemandeCard } from '@/components/demandes/demande-card';
import type { IDemande } from '@/types/database';

// Mock des composants UI
vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className, onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) => (
    <div data-testid="card" className={className} onClick={onClick}>{children}</div>
  ),
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
    <span data-testid="badge" style={style}>{children}</span>
  ),
}));

describe('DemandeCard', () => {
  const mockOnClick = vi.fn();
  const mockDemande: IDemande = {
    _id: '507f1f77bcf86cd799439011',
    numeroDemande: 'DEM-2026-000001',
    objet: 'Demande de test',
    description: 'Description détaillée de la demande pour les tests unitaires.',
    statut: { code: 'SOUMIS', libelle: 'Soumis', couleur: '#6B7280' },
    typeDemande: { code: 'ATTESTATION_SCOLARITE', nom: 'Attestation de scolarité', delaiTraitement: 3 },
    etudiant: { id: '123', nom: 'Doe', prenom: 'John', email: 'john@example.com', matricule: 'ETU001' },
    priorite: 'NORMALE',
    createdAt: '2026-01-15T10:00:00Z',
    documents: [],
    actif: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rend les informations principales de la demande', () => {
    render(<DemandeCard demande={mockDemande} />);

    // Vérification du titre
    expect(screen.getByText('Demande de test')).toBeInTheDocument();

    // Vérification du numéro de demande
    expect(screen.getByText('DEM-2026-000001')).toBeInTheDocument();

    // Vérification du type de demande
    expect(screen.getByText('Attestation de scolarité')).toBeInTheDocument();

    // Vérification de la description
    expect(screen.getByText(/description détaillée/i)).toBeInTheDocument();
  });

  it('affiche le statut avec la bonne couleur', () => {
    render(<DemandeCard demande={mockDemande} />);

    const badge = screen.getByTestId('badge');
    expect(badge).toHaveTextContent('Soumis');
    expect(badge).toHaveStyle({ backgroundColor: '#6B7280' });
  });

  it('affiche la date de création formatée', () => {
    render(<DemandeCard demande={mockDemande} />);

    // La date doit être formatée en fr-FR
    const expectedDate = new Date('2026-01-15T10:00:00Z').toLocaleDateString('fr-FR');
    expect(screen.getByText(expectedDate)).toBeInTheDocument();
  });

  it('affiche le compteur de documents quand il y a des documents', () => {
    const demandeWithDocs = {
      ...mockDemande,
      documents: [
        { id: '1', nomOriginal: 'doc1.pdf', type: 'application/pdf', taille: 1024, url: 'http://test.com/1' },
        { id: '2', nomOriginal: 'doc2.pdf', type: 'application/pdf', taille: 2048, url: 'http://test.com/2' },
      ],
    };

    render(<DemandeCard demande={demandeWithDocs} />);

    expect(screen.getByText('2 document(s)')).toBeInTheDocument();
  });

  it('ne montre pas le compteur de documents quand la liste est vide', () => {
    render(<DemandeCard demande={mockDemande} />);

    expect(screen.queryByText(/document\(s\)/i)).not.toBeInTheDocument();
  });

  it('ne montre pas le compteur quand documents est undefined', () => {
    const demandeWithoutDocs = { ...mockDemande, documents: undefined };
    render(<DemandeCard demande={demandeWithoutDocs} />);

    expect(screen.queryByText(/document\(s\)/i)).not.toBeInTheDocument();
  });

  it('appelle onClick avec l\'ID de la demande quand on clique sur la carte', () => {
    render(<DemandeCard demande={mockDemande} onClick={mockOnClick} />);

    const card = screen.getByTestId('card');
    fireEvent.click(card);

    expect(mockOnClick).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('ne crashe pas quand onClick est undefined', () => {
    render(<DemandeCard demande={mockDemande} />);

    const card = screen.getByTestId('card');
    // Ne devrait pas lancer d'erreur
    expect(() => fireEvent.click(card)).not.toThrow();
  });

  it('ne crashe pas quand _id est undefined', () => {
    const demandeWithoutId = { ...mockDemande, _id: undefined };
    render(<DemandeCard demande={demandeWithoutId} onClick={mockOnClick} />);

    const card = screen.getByTestId('card');
    fireEvent.click(card);

    // onClick ne devrait pas être appelé
    expect(mockOnClick).not.toHaveBeenCalled();
  });

  it('applique les classes CSS pour le style interactif', () => {
    render(<DemandeCard demande={mockDemande} />);

    const card = screen.getByTestId('card');
    expect(card).toHaveClass('cursor-pointer');
    expect(card).toHaveClass('hover:shadow-md');
    expect(card).toHaveClass('transition-shadow');
  });

  it('tronque la description si elle est trop longue', () => {
    const longDescription = 'A'.repeat(200);
    const demandeWithLongDesc = {
      ...mockDemande,
      description: longDescription,
    };

    render(<DemandeCard demande={demandeWithLongDesc} />);

    // Utiliser getByTestId ou chercher dans le contexte spécifique
    const description = screen.getByText(longDescription);
    expect(description).toHaveClass('line-clamp-2');
  });

  it('affiche les différents statuts avec leurs couleurs', () => {
    const statuts = [
      { code: 'SOUMIS', libelle: 'Soumis', couleur: '#6B7280' },
      { code: 'EN_COURS', libelle: 'En cours', couleur: '#F59E0B' },
      { code: 'VALIDE', libelle: 'Validé', couleur: '#10B981' },
      { code: 'REJETE', libelle: 'Rejeté', couleur: '#EF4444' },
    ];

    statuts.forEach((statut) => {
      const { rerender } = render(<DemandeCard demande={{ ...mockDemande, statut }} />);
      
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveTextContent(statut.libelle);
      expect(badge).toHaveStyle({ backgroundColor: statut.couleur });
      
      rerender(<></>);
    });
  });

  it('utilise le format ObjectId pour _id', () => {
    const demandeWithObjectId = {
      ...mockDemande,
      _id: '507f1f77bcf86cd799439011',
    };

    render(<DemandeCard demande={demandeWithObjectId} onClick={mockOnClick} />);

    const card = screen.getByTestId('card');
    fireEvent.click(card);

    expect(mockOnClick).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
  });
});
