import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DemandeDetail } from '@/components/demandes/demande-detail';
import type { IDemande } from '@/types/database';

// Mock des composants UI
vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
    <span data-testid="badge" style={style}>{children}</span>
  ),
}));

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card" className={className}>{children}</div>
  ),
  CardHeader: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card-header">{children}</div>
  ),
  CardTitle: ({ children }: { children: React.ReactNode }) => (
    <h2 data-testid="card-title">{children}</h2>
  ),
  CardDescription: ({ children }: { children: React.ReactNode }) => (
    <p data-testid="card-description">{children}</p>
  ),
  CardContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card-content">{children}</div>
  ),
}));

describe('DemandeDetail', () => {
  const mockDemande: IDemande = {
    _id: '507f1f77bcf86cd799439011',
    numeroDemande: 'DEM-2026-000001',
    objet: 'Demande de test détaillée',
    description: 'Ceci est une description très détaillée de la demande.\nElle contient plusieurs lignes pour bien illustrer le besoin.',
    statut: { code: 'EN_COURS', libelle: 'En cours', couleur: '#F59E0B' },
    typeDemande: { code: 'CONVENTION_STAGE', nom: 'Convention de stage', delaiTraitement: 5 },
    etudiant: { id: '123', nom: 'Doe', prenom: 'John', email: 'john@example.com', matricule: 'ETU001' },
    priorite: 'HAUTE',
    createdAt: '2026-01-15T10:00:00Z',
    documents: [],
    actif: true,
  };

  it('rend le titre et le numéro de la demande', () => {
    render(<DemandeDetail demande={mockDemande} />);

    expect(screen.getByText('Demande de test détaillée')).toBeInTheDocument();
    expect(screen.getByText('DEM-2026-000001')).toBeInTheDocument();
  });

  it('affiche le statut avec la bonne couleur', () => {
    render(<DemandeDetail demande={mockDemande} />);

    const badge = screen.getByTestId('badge');
    expect(badge).toHaveTextContent('En cours');
    expect(badge).toHaveStyle({ backgroundColor: '#F59E0B' });
  });

  it('affiche les informations générales dans une carte', () => {
    render(<DemandeDetail demande={mockDemande} />);

    expect(screen.getByText('Informations générales')).toBeInTheDocument();

    // Vérification des labels
    expect(screen.getByText('Type de demande')).toBeInTheDocument();
    expect(screen.getByText('Priorité')).toBeInTheDocument();
    expect(screen.getByText('Date de soumission')).toBeInTheDocument();
    expect(screen.getByText('Délai de traitement')).toBeInTheDocument();
  });

  it('affiche les valeurs des informations générales', () => {
    render(<DemandeDetail demande={mockDemande} />);

    expect(screen.getByText('Convention de stage')).toBeInTheDocument();
    expect(screen.getByText('HAUTE')).toBeInTheDocument();
    expect(screen.getByText(/jour/)).toBeInTheDocument();
  });

  it('affiche la date de soumission formatée en français', () => {
    render(<DemandeDetail demande={mockDemande} />);

    const expectedDate = new Date('2026-01-15T10:00:00Z').toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    expect(screen.getByText(expectedDate)).toBeInTheDocument();
  });

  it('affiche le délai de traitement au pluriel quand > 1', () => {
    render(<DemandeDetail demande={mockDemande} />);

    expect(screen.getByText('5 jours')).toBeInTheDocument();
  });

  it('affiche le délai de traitement au singulier quand = 1', () => {
    const demandeWithOneDay = {
      ...mockDemande,
      typeDemande: { ...mockDemande.typeDemande, delaiTraitement: 1 },
    };

    render(<DemandeDetail demande={demandeWithOneDay} />);

    expect(screen.getByText('1 jour')).toBeInTheDocument();
  });

  it('affiche la carte de description avec le contenu', () => {
    render(<DemandeDetail demande={mockDemande} />);

    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByText(/ceci est une description très détaillée/i)).toBeInTheDocument();
  });

  it('préserve les sauts de ligne dans la description', () => {
    render(<DemandeDetail demande={mockDemande} />);

    const description = screen.getByText(/ceci est une description/i);
    expect(description).toHaveClass('whitespace-pre-wrap');
  });

  it('affiche la section documents quand il y a des documents', () => {
    const demandeWithDocs = {
      ...mockDemande,
      documents: [
        { id: 'doc1', nomOriginal: 'cv.pdf', type: 'application/pdf', taille: 1024, url: 'http://test.com/cv.pdf' },
        { id: 'doc2', nomOriginal: 'lettre.pdf', type: 'application/pdf', taille: 2048, url: 'http://test.com/lettre.pdf' },
      ],
    };

    render(<DemandeDetail demande={demandeWithDocs} />);

    expect(screen.getByText('Documents joints')).toBeInTheDocument();
    expect(screen.getByText('2 documents joints')).toBeInTheDocument();
  });

  it('affiche le singulier pour un seul document', () => {
    const demandeWithOneDoc = {
      ...mockDemande,
      documents: [
        { id: 'doc1', nomOriginal: 'cv.pdf', type: 'application/pdf', taille: 1024, url: 'http://test.com/cv.pdf' },
      ],
    };

    render(<DemandeDetail demande={demandeWithOneDoc} />);

    expect(screen.getByText('1 document joint')).toBeInTheDocument();
  });

  it('affiche les informations des documents avec liens', () => {
    const demandeWithDocs = {
      ...mockDemande,
      documents: [
        { id: 'doc1', nomOriginal: 'mon_cv.pdf', type: 'application/pdf', taille: 1536, url: 'http://test.com/cv.pdf' },
      ],
    };

    render(<DemandeDetail demande={demandeWithDocs} />);

    const link = screen.getByRole('link', { name: /mon_cv\.pdf/i });
    expect(link).toHaveAttribute('href', 'http://test.com/cv.pdf');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');

    // Vérification de la taille formatée (KB)
    expect(screen.getByText('2 KB')).toBeInTheDocument();
  });

  it('affiche la date de traitement si présente', () => {
    const demandeWithDate = {
      ...mockDemande,
      dateTraitement: '2026-01-20T15:30:00Z',
    };

    render(<DemandeDetail demande={demandeWithDate} />);

    expect(screen.getByText('Date de traitement')).toBeInTheDocument();

    const expectedDate = new Date('2026-01-20T15:30:00Z').toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    expect(screen.getByText(expectedDate)).toBeInTheDocument();
  });

  it('ne montre pas la section documents quand vide', () => {
    render(<DemandeDetail demande={mockDemande} />);

    expect(screen.queryByText('Documents joints')).not.toBeInTheDocument();
  });

  it('affiche le commentaire admin si présent', () => {
    const demandeWithComment = {
      ...mockDemande,
      commentaireAdmin: 'Votre demande est en cours de traitement par le service scolarité.',
    };

    render(<DemandeDetail demande={demandeWithComment} />);

    expect(screen.getByText('Commentaire de l\'administration')).toBeInTheDocument();
    expect(screen.getByText(/votre demande est en cours de traitement/i)).toBeInTheDocument();
  });

  it('applique le style bleu au commentaire admin', () => {
    const demandeWithComment = {
      ...mockDemande,
      commentaireAdmin: 'Commentaire test',
    };

    render(<DemandeDetail demande={demandeWithComment} />);

    const commentCard = screen.getAllByTestId('card').find(
      card => card.className.includes('border-blue')
    );
    expect(commentCard).toBeDefined();
  });

  it('affiche le motif de refus si présent', () => {
    const demandeWithRejection = {
      ...mockDemande,
      statut: { code: 'REJETE', libelle: 'Rejeté', couleur: '#EF4444' },
      motifRefus: 'Les documents fournis sont incomplets. Veuillez fournir une pièce d\'identité valide.',
    };

    render(<DemandeDetail demande={demandeWithRejection} />);

    expect(screen.getByText('Motif de refus')).toBeInTheDocument();
    expect(screen.getByText(/les documents fournis sont incomplets/i)).toBeInTheDocument();
  });

  it('applique le style rouge au motif de refus', () => {
    const demandeWithRejection = {
      ...mockDemande,
      motifRefus: 'Motif de refus test',
    };

    render(<DemandeDetail demande={demandeWithRejection} />);

    const rejectionCard = screen.getAllByTestId('card').find(
      card => card.className.includes('border-red')
    );
    expect(rejectionCard).toBeDefined();
  });

  it('utilise une mise en page responsive pour le header', () => {
    const { container } = render(<DemandeDetail demande={mockDemande} />);

    const headerSection = container.querySelector('.flex-col');
    expect(headerSection).toBeInTheDocument();
  });

  it('affiche une grille pour les informations générales', () => {
    render(<DemandeDetail demande={mockDemande} />);

    const infoContent = screen.getAllByTestId('card-content')[0];
    expect(infoContent.querySelector('dl')).toHaveClass('grid');
    expect(infoContent.querySelector('dl')).toHaveClass('grid-cols-1');
  });

  it('gère correctement les documents sans ID', () => {
    const demandeWithDocNoId = {
      ...mockDemande,
      documents: [
        { nomOriginal: 'test.pdf', type: 'application/pdf', taille: 1024, url: 'http://test.com/test.pdf' },
      ],
    };

    render(<DemandeDetail demande={demandeWithDocNoId} />);

    expect(screen.getByText('Documents joints')).toBeInTheDocument();
    expect(screen.getByText('test.pdf')).toBeInTheDocument();
  });
});
