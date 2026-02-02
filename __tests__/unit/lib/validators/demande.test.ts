import { describe, it, expect } from 'vitest';
import {
  createDemandeSchema,
  updateDemandeSchema,
  queryDemandesSchema,
  transitionDemandeSchema,
  fileUploadSchema,
  commentaireSchema
} from '@/lib/validators/demande';

describe('createDemandeSchema', () => {
  const validData = {
    typeDemande: 'ATTESTATION_SCOLARITE' as const,
    objet: 'Demande d\'attestation de scolarité',
    description: 'Je souhaite obtenir une attestation de scolarité pour mon dossier bancaire. Merci de bien vouloir la préparer.',
    priorite: 'NORMALE' as const
  };

  it('valide une demande correcte avec toutes les valeurs par défaut', () => {
    const data = {
      typeDemande: 'ATTESTATION_SCOLARITE',
      objet: 'Demande test',
      description: 'Description suffisamment longue pour passer la validation'
    };
    const result = createDemandeSchema.parse(data);
    expect(result.priorite).toBe('NORMALE');
  });

  it('valide une demande avec toutes les données valides', () => {
    expect(() => createDemandeSchema.parse(validData)).not.toThrow();
  });

  it('normalise les espaces dans l\'objet et la description', () => {
    const data = {
      ...validData,
      objet: '  Demande   test  avec   espaces  ',
      description: '  Description    avec    espaces   multiples  '
    };
    const result = createDemandeSchema.parse(data);
    expect(result.objet).toBe('Demande test avec espaces');
    expect(result.description).toBe('Description avec espaces multiples');
  });

  it('rejette un type de demande invalide', () => {
    const data = { ...validData, typeDemande: 'TYPE_INVALIDE' };
    expect(() => createDemandeSchema.parse(data)).toThrow('Veuillez sélectionner un type de demande valide');
  });

  it('rejette un objet vide', () => {
    const data = { ...validData, objet: '' };
    expect(() => createDemandeSchema.parse(data)).toThrow('L\'objet ne peut pas être vide');
  });

  it('rejette un objet avec moins de 5 caractères', () => {
    const data = { ...validData, objet: 'Test' };
    expect(() => createDemandeSchema.parse(data)).toThrow('L\'objet doit contenir au moins 5 caractères');
  });

  it('rejette un objet avec plus de 255 caractères', () => {
    const data = { ...validData, objet: 'A'.repeat(256) };
    expect(() => createDemandeSchema.parse(data)).toThrow('L\'objet ne peut pas dépasser 255 caractères');
  });

  it('rejette un objet avec des caractères non autorisés', () => {
    const data = { ...validData, objet: 'Demande @ test # spécial' };
    expect(() => createDemandeSchema.parse(data)).toThrow('L\'objet contient des caractères non autorisés');
  });

  it('accepte des caractères spéciaux valides dans l\'objet', () => {
    const data = { ...validData, objet: 'Demande-test (urgent): note, action!' };
    expect(() => createDemandeSchema.parse(data)).not.toThrow();
  });

  it('rejette une description vide', () => {
    const data = { ...validData, description: '' };
    expect(() => createDemandeSchema.parse(data)).toThrow('La description ne peut pas être vide');
  });

  it('rejette une description avec moins de 10 caractères', () => {
    const data = { ...validData, description: 'Court' };
    expect(() => createDemandeSchema.parse(data)).toThrow('La description doit contenir au moins 10 caractères');
  });

  it('rejette une description avec plus de 2000 caractères', () => {
    const data = { ...validData, description: 'A'.repeat(2001) };
    expect(() => createDemandeSchema.parse(data)).toThrow('La description ne peut pas dépasser 2000 caractères');
  });

  it('rejette une priorité invalide', () => {
    const data = { ...validData, priorite: 'INVALIDE' };
    expect(() => createDemandeSchema.parse(data)).toThrow('Veuillez sélectionner une priorité valide');
  });

  it('accepte toutes les priorités valides', () => {
    const priorites = ['BASSE', 'NORMALE', 'HAUTE', 'URGENTE'] as const;
    priorites.forEach(priorite => {
      const data = { ...validData, priorite };
      expect(() => createDemandeSchema.parse(data)).not.toThrow();
    });
  });

  it('accepte tous les types de demande valides', () => {
    const types = [
      'ATTESTATION_SCOLARITE',
      'RELEVE_NOTES',
      'ATTESTATION_REUSSITE',
      'DUPLICATA_CARTE',
      'CONVENTION_STAGE'
    ] as const;
    types.forEach(type => {
      const data = { ...validData, typeDemande: type };
      expect(() => createDemandeSchema.parse(data)).not.toThrow();
    });
  });

  it('rejette quand l\'objet et le début de la description sont identiques', () => {
    const data = {
      ...validData,
      objet: 'Demande identique',
      description: 'demande identique et suite de la description'
    };
    expect(() => createDemandeSchema.parse(data)).toThrow('L\'objet et la description ne peuvent pas être identiques');
  });

  it('rejette les champs supplémentaires non autorisés', () => {
    const data = { ...validData, extraField: 'valeur' };
    expect(() => createDemandeSchema.parse(data)).toThrow();
  });
});

describe('updateDemandeSchema', () => {
  it('accepte un objet vide (mise à jour partielle)', () => {
    expect(() => updateDemandeSchema.parse({})).not.toThrow();
  });

  it('valide une mise à jour partielle du type de demande', () => {
    const data = { typeDemande: 'RELEVE_NOTES' };
    expect(() => updateDemandeSchema.parse(data)).not.toThrow();
  });

  it('valide une mise à jour partielle de l\'objet', () => {
    const data = { objet: 'Nouvel objet de demande' };
    expect(() => updateDemandeSchema.parse(data)).not.toThrow();
  });

  it('valide une mise à jour partielle de la description', () => {
    const data = { description: 'Nouvelle description suffisamment longue pour être valide' };
    expect(() => updateDemandeSchema.parse(data)).not.toThrow();
  });

  it('valide une mise à jour partielle de la priorité', () => {
    const data = { priorite: 'HAUTE' };
    expect(() => updateDemandeSchema.parse(data)).not.toThrow();
  });

  it('valide une mise à jour avec plusieurs champs', () => {
    const data = {
      objet: 'Nouvel objet',
      priorite: 'URGENTE'
    };
    expect(() => updateDemandeSchema.parse(data)).not.toThrow();
  });

  it('rejette un objet avec moins de 5 caractères', () => {
    const data = { objet: 'Test' };
    expect(() => updateDemandeSchema.parse(data)).toThrow();
  });

  it('rejette une description avec moins de 10 caractères', () => {
    const data = { description: 'Court' };
    expect(() => updateDemandeSchema.parse(data)).toThrow();
  });

  it('normalise les espaces comme le schéma de création', () => {
    const data = { objet: '  Test   objet  ' };
    const result = updateDemandeSchema.parse(data);
    expect(result.objet).toBe('Test objet');
  });

  it('rejette les champs supplémentaires non autorisés', () => {
    const data = { extraField: 'valeur' };
    expect(() => updateDemandeSchema.parse(data)).toThrow();
  });
});

describe('queryDemandesSchema', () => {
  it('utilise les valeurs par défaut quand aucun paramètre n\'est fourni', () => {
    const result = queryDemandesSchema.parse({});
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
    expect(result.sortBy).toBe('-createdAt');
  });

  it('accepte une page valide', () => {
    const result = queryDemandesSchema.parse({ page: 5 });
    expect(result.page).toBe(5);
  });

  it('convertit une page string en nombre', () => {
    const result = queryDemandesSchema.parse({ page: '3' });
    expect(result.page).toBe(3);
  });

  it('rejette une page négative', () => {
    expect(() => queryDemandesSchema.parse({ page: -1 })).toThrow('Le numéro de page doit être positif');
  });

  it('rejette une page à zéro', () => {
    expect(() => queryDemandesSchema.parse({ page: 0 })).toThrow('Le numéro de page doit être positif');
  });

  it('rejette une page non entière', () => {
    expect(() => queryDemandesSchema.parse({ page: 1.5 })).toThrow('Le numéro de page doit être un entier');
  });

  it('accepte une limite valide', () => {
    const result = queryDemandesSchema.parse({ limit: 50 });
    expect(result.limit).toBe(50);
  });

  it('rejette une limite supérieure à 100', () => {
    expect(() => queryDemandesSchema.parse({ limit: 101 })).toThrow('La limite ne peut pas dépasser 100');
  });

  it('rejette une limite inférieure à 1', () => {
    expect(() => queryDemandesSchema.parse({ limit: 0 })).toThrow('La limite doit être au moins 1');
  });

  it('accepte un statut valide en filtre', () => {
    const result = queryDemandesSchema.parse({ statut: 'EN_COURS' });
    expect(result.statut).toBe('EN_COURS');
  });

  it('accepte une priorité valide en filtre', () => {
    const result = queryDemandesSchema.parse({ priorite: 'HAUTE' });
    expect(result.priorite).toBe('HAUTE');
  });

  it('accepte un type de demande valide en filtre', () => {
    const result = queryDemandesSchema.parse({ typeDemande: 'CONVENTION_STAGE' });
    expect(result.typeDemande).toBe('CONVENTION_STAGE');
  });

  it('accepte un tri valide avec préfixe -', () => {
    const result = queryDemandesSchema.parse({ sortBy: '-updatedAt' });
    expect(result.sortBy).toBe('-updatedAt');
  });

  it('accepte un tri valide sans préfixe', () => {
    const result = queryDemandesSchema.parse({ sortBy: 'numeroDemande' });
    expect(result.sortBy).toBe('numeroDemande');
  });

  it('rejette un tri invalide', () => {
    expect(() => queryDemandesSchema.parse({ sortBy: 'invalidField' })).toThrow('Tri invalide');
  });

  it('accepte une recherche valide', () => {
    const result = queryDemandesSchema.parse({ search: 'demande test' });
    expect(result.search).toBe('demande test');
  });

  it('rejette une recherche avec moins de 2 caractères', () => {
    expect(() => queryDemandesSchema.parse({ search: 'A' })).toThrow('La recherche doit contenir au moins 2 caractères');
  });

  it('rejette une recherche avec plus de 100 caractères', () => {
    expect(() => queryDemandesSchema.parse({ search: 'A'.repeat(101) })).toThrow('La recherche ne peut pas dépasser 100 caractères');
  });

  it('normalise les espaces dans la recherche', () => {
    const result = queryDemandesSchema.parse({ search: '  recherche    test  ' });
    expect(result.search).toBe('recherche test');
  });

  it('accepte une recherche undefined', () => {
    expect(() => queryDemandesSchema.parse({})).not.toThrow();
  });
});

describe('transitionDemandeSchema', () => {
  const validTransition = {
    newStatut: 'EN_COURS' as const,
    commentaire: 'Commentaire suffisamment long'
  };

  it('valide une transition de statut de base', () => {
    expect(() => transitionDemandeSchema.parse({ newStatut: 'VALIDE' })).not.toThrow();
  });

  it('valide une transition avec commentaire', () => {
    expect(() => transitionDemandeSchema.parse(validTransition)).not.toThrow();
  });

  it('rejette un statut de transition invalide', () => {
    const data = { newStatut: 'SOUMIS' };
    expect(() => transitionDemandeSchema.parse(data)).toThrow('Veuillez sélectionner un statut de transition valide');
  });

  it('rejette un commentaire avec moins de 10 caractères', () => {
    const data = { ...validTransition, commentaire: 'Court' };
    expect(() => transitionDemandeSchema.parse(data)).toThrow('Le commentaire doit contenir au moins 10 caractères');
  });

  it('rejette un commentaire avec plus de 1000 caractères', () => {
    const data = { ...validTransition, commentaire: 'A'.repeat(1001) };
    expect(() => transitionDemandeSchema.parse(data)).toThrow('Le commentaire ne peut pas dépasser 1000 caractères');
  });

  it('normalise les espaces dans le commentaire', () => {
    const data = { ...validTransition, commentaire: '  Commentaire    avec   espaces  ' };
    const result = transitionDemandeSchema.parse(data);
    expect(result.commentaire).toBe('Commentaire avec espaces');
  });

  it('requiert un motif de refus quand le statut est REJETE', () => {
    const data = { newStatut: 'REJETE' };
    expect(() => transitionDemandeSchema.parse(data)).toThrow('Le motif de refus est obligatoire pour un rejet');
  });

  it('valide une transition vers REJETE avec motif de refus', () => {
    const data = {
      newStatut: 'REJETE' as const,
      motifRefus: 'Ce motif de refus est suffisamment détaillé et explicite'
    };
    expect(() => transitionDemandeSchema.parse(data)).not.toThrow();
  });

  it('rejette un motif de refus avec moins de 20 caractères', () => {
    const data = {
      newStatut: 'REJETE' as const,
      motifRefus: 'Trop court'
    };
    expect(() => transitionDemandeSchema.parse(data)).toThrow('Le motif de refus doit contenir au moins 20 caractères');
  });

  it('rejette un motif de refus avec plus de 500 caractères', () => {
    const data = {
      newStatut: 'REJETE' as const,
      motifRefus: 'A'.repeat(501)
    };
    expect(() => transitionDemandeSchema.parse(data)).toThrow('Le motif de refus ne peut pas dépasser 500 caractères');
  });

  it('normalise les espaces dans le motif de refus', () => {
    const data = {
      newStatut: 'REJETE' as const,
      motifRefus: '  Motif    de   refus  suffisamment long'
    };
    const result = transitionDemandeSchema.parse(data);
    expect(result.motifRefus).toBe('Motif de refus suffisamment long');
  });

  it('valide un identifiant traitant MongoDB valide', () => {
    const data = {
      ...validTransition,
      traiteParId: '507f1f77bcf86cd799439011'
    };
    expect(() => transitionDemandeSchema.parse(data)).not.toThrow();
  });

  it('rejette un identifiant traitant invalide', () => {
    const data = {
      ...validTransition,
      traiteParId: 'invalid-id'
    };
    expect(() => transitionDemandeSchema.parse(data)).toThrow('L\'identifiant du traitant n\'est pas valide');
  });

  it('rejette un identifiant traitant trop court', () => {
    const data = {
      ...validTransition,
      traiteParId: '507f1f77'
    };
    expect(() => transitionDemandeSchema.parse(data)).toThrow('L\'identifiant du traitant n\'est pas valide');
  });

  it('accepte tous les statuts de transition valides', () => {
    const statuts = ['RECU', 'EN_COURS', 'ATTENTE_INFO', 'VALIDE', 'REJETE', 'TRAITE', 'ARCHIVE'] as const;
    statuts.forEach(statut => {
      if (statut !== 'REJETE') {
        expect(() => transitionDemandeSchema.parse({ newStatut: statut })).not.toThrow();
      }
    });
  });

  it('rejette les champs supplémentaires non autorisés', () => {
    const data = { ...validTransition, extraField: 'valeur' };
    expect(() => transitionDemandeSchema.parse(data)).toThrow();
  });
});

describe('fileUploadSchema', () => {
  const createMockFile = (name: string, type: string, size: number): File => {
    const file = new File([''], name, { type });
    Object.defineProperty(file, 'size', { value: size, writable: false });
    return file;
  };

  it('valide un fichier PDF valide', () => {
    const file = createMockFile('document.pdf', 'application/pdf', 1024);
    const data = { file };
    expect(() => fileUploadSchema.parse(data)).not.toThrow();
  });

  it('valide un fichier JPEG valide', () => {
    const file = createMockFile('image.jpg', 'image/jpeg', 1024);
    const data = { file };
    expect(() => fileUploadSchema.parse(data)).not.toThrow();
  });

  it('valide un fichier PNG valide', () => {
    const file = createMockFile('image.png', 'image/png', 1024);
    const data = { file };
    expect(() => fileUploadSchema.parse(data)).not.toThrow();
  });

  it('valide un fichier DOC valide', () => {
    const file = createMockFile('document.doc', 'application/msword', 1024);
    const data = { file };
    expect(() => fileUploadSchema.parse(data)).not.toThrow();
  });

  it('valide un fichier DOCX valide', () => {
    const file = createMockFile('document.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 1024);
    const data = { file };
    expect(() => fileUploadSchema.parse(data)).not.toThrow();
  });

  it('valide un upload avec catégorie et description', () => {
    const file = createMockFile('doc.pdf', 'application/pdf', 1024);
    const data = {
      file,
      categorie: 'Document officiel',
      description: 'Description du fichier'
    };
    expect(() => fileUploadSchema.parse(data)).not.toThrow();
  });

  it('rejette un fichier avec type non accepté', () => {
    const file = createMockFile('script.js', 'application/javascript', 1024);
    const data = { file };
    expect(() => fileUploadSchema.parse(data)).toThrow('Le type de fichier n\'est pas accepté');
  });

  it('rejette un fichier avec une taille supérieure à 5MB', () => {
    const file = createMockFile('large.pdf', 'application/pdf', 6 * 1024 * 1024);
    const data = { file };
    expect(() => fileUploadSchema.parse(data)).toThrow('La taille du fichier ne doit pas dépasser 5MB');
  });

  it('rejette une catégorie vide', () => {
    const file = createMockFile('doc.pdf', 'application/pdf', 1024);
    const data = { file, categorie: '' };
    expect(() => fileUploadSchema.parse(data)).toThrow('La catégorie ne peut pas être vide');
  });

  it('rejette une catégorie trop longue', () => {
    const file = createMockFile('doc.pdf', 'application/pdf', 1024);
    const data = { file, categorie: 'A'.repeat(51) };
    expect(() => fileUploadSchema.parse(data)).toThrow('La catégorie ne peut pas dépasser 50 caractères');
  });

  it('rejette une description trop courte', () => {
    const file = createMockFile('doc.pdf', 'application/pdf', 1024);
    const data = { file, description: 'Cour' }; // 4 caractères, min 5 requis
    expect(() => fileUploadSchema.parse(data)).toThrow('La description du fichier doit contenir au moins 5 caractères');
  });

  it('rejette une description trop longue', () => {
    const file = createMockFile('doc.pdf', 'application/pdf', 1024);
    const data = { file, description: 'A'.repeat(201) };
    expect(() => fileUploadSchema.parse(data)).toThrow('La description du fichier ne peut pas dépasser 200 caractères');
  });

  it('normalise les espaces dans la description', () => {
    const file = createMockFile('doc.pdf', 'application/pdf', 1024);
    const data = { file, description: '  Description    du   fichier  ' };
    const result = fileUploadSchema.parse(data);
    expect(result.description).toBe('Description du fichier');
  });

  it('rejette les champs supplémentaires non autorisés', () => {
    const file = createMockFile('doc.pdf', 'application/pdf', 1024);
    const data = { file, extraField: 'valeur' };
    expect(() => fileUploadSchema.parse(data)).toThrow();
  });
});

describe('commentaireSchema', () => {
  it('valide un commentaire correct', () => {
    const data = { contenu: 'Ceci est un commentaire valide' };
    expect(() => commentaireSchema.parse(data)).not.toThrow();
  });

  it('utilise isInternal=false par défaut', () => {
    const data = { contenu: 'Commentaire test' };
    const result = commentaireSchema.parse(data);
    expect(result.isInternal).toBe(false);
  });

  it('accepte isInternal=true', () => {
    const data = { contenu: 'Commentaire interne', isInternal: true };
    const result = commentaireSchema.parse(data);
    expect(result.isInternal).toBe(true);
  });

  it('rejette un contenu vide', () => {
    const data = { contenu: '' };
    expect(() => commentaireSchema.parse(data)).toThrow('Le commentaire ne peut pas être vide');
  });

  it('rejette un contenu avec moins de 5 caractères', () => {
    const data = { contenu: 'Test' };
    expect(() => commentaireSchema.parse(data)).toThrow('Le commentaire doit contenir au moins 5 caractères');
  });

  it('rejette un contenu avec plus de 1000 caractères', () => {
    const data = { contenu: 'A'.repeat(1001) };
    expect(() => commentaireSchema.parse(data)).toThrow('Le commentaire ne peut pas dépasser 1000 caractères');
  });

  it('normalise les espaces dans le contenu', () => {
    const data = { contenu: '  Commentaire    avec   espaces  ' };
    const result = commentaireSchema.parse(data);
    expect(result.contenu).toBe('Commentaire avec espaces');
  });

  it('rejette les champs supplémentaires non autorisés', () => {
    const data = { contenu: 'Commentaire', extraField: 'valeur' };
    expect(() => commentaireSchema.parse(data)).toThrow();
  });
});
