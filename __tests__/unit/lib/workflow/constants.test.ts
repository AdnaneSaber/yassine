import { describe, it, expect } from 'vitest';
import {
  STATUTS_META,
  WORKFLOW_TRANSITIONS,
  TRANSITION_PERMISSIONS,
  TRANSITION_REQUIREMENTS,
  canTransition,
  isTerminalStatus,
  getAllowedTransitions
} from '@/lib/workflow/constants';
import type { DemandeStatus } from '@/types/database';

describe('STATUTS_META', () => {
  it('contient tous les statuts requis', () => {
    const expectedStatuses: DemandeStatus[] = [
      'SOUMIS', 'RECU', 'EN_COURS', 'ATTENTE_INFO',
      'VALIDE', 'REJETE', 'TRAITE', 'ARCHIVE'
    ];
    expectedStatuses.forEach(status => {
      expect(STATUTS_META[status]).toBeDefined();
    });
  });

  it('a la structure correcte pour chaque statut', () => {
    Object.entries(STATUTS_META).forEach(([status, meta]) => {
      expect(meta).toHaveProperty('libelle');
      expect(meta).toHaveProperty('couleur');
      expect(meta).toHaveProperty('estFinal');
      expect(typeof meta.libelle).toBe('string');
      expect(typeof meta.couleur).toBe('string');
      expect(typeof meta.estFinal).toBe('boolean');
      expect(meta.couleur).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });
  });

  it('identifie correctement les statuts terminaux', () => {
    expect(STATUTS_META.REJETE.estFinal).toBe(true);
    expect(STATUTS_META.TRAITE.estFinal).toBe(true);
    expect(STATUTS_META.ARCHIVE.estFinal).toBe(true);
  });

  it('identifie correctement les statuts non-terminaux', () => {
    expect(STATUTS_META.SOUMIS.estFinal).toBe(false);
    expect(STATUTS_META.RECU.estFinal).toBe(false);
    expect(STATUTS_META.EN_COURS.estFinal).toBe(false);
    expect(STATUTS_META.ATTENTE_INFO.estFinal).toBe(false);
    expect(STATUTS_META.VALIDE.estFinal).toBe(false);
  });

  it('a des libellés en français', () => {
    expect(STATUTS_META.SOUMIS.libelle).toBe('Soumis');
    expect(STATUTS_META.RECU.libelle).toBe('Reçu');
    expect(STATUTS_META.EN_COURS.libelle).toBe('En cours');
    expect(STATUTS_META.TRAITE.libelle).toBe('Traité');
  });
});

describe('WORKFLOW_TRANSITIONS', () => {
  it('contient toutes les transitions valides', () => {
    expect(WORKFLOW_TRANSITIONS.SOUMIS).toContain('RECU');
    expect(WORKFLOW_TRANSITIONS.RECU).toContain('EN_COURS');
    expect(WORKFLOW_TRANSITIONS.RECU).toContain('REJETE');
    expect(WORKFLOW_TRANSITIONS.EN_COURS).toContain('ATTENTE_INFO');
    expect(WORKFLOW_TRANSITIONS.EN_COURS).toContain('VALIDE');
    expect(WORKFLOW_TRANSITIONS.EN_COURS).toContain('REJETE');
    expect(WORKFLOW_TRANSITIONS.ATTENTE_INFO).toContain('EN_COURS');
    expect(WORKFLOW_TRANSITIONS.ATTENTE_INFO).toContain('REJETE');
    expect(WORKFLOW_TRANSITIONS.VALIDE).toContain('TRAITE');
    expect(WORKFLOW_TRANSITIONS.REJETE).toContain('ARCHIVE');
    expect(WORKFLOW_TRANSITIONS.TRAITE).toContain('ARCHIVE');
  });

  it('a un tableau vide pour ARCHIVE (état terminal)', () => {
    expect(WORKFLOW_TRANSITIONS.ARCHIVE).toEqual([]);
  });

  it('ne permet pas de transitions invalides', () => {
    expect(WORKFLOW_TRANSITIONS.SOUMIS).not.toContain('VALIDE');
    expect(WORKFLOW_TRANSITIONS.RECU).not.toContain('ARCHIVE');
    expect(WORKFLOW_TRANSITIONS.REJETE).not.toContain('TRAITE');
    expect(WORKFLOW_TRANSITIONS.TRAITE).not.toContain('REJETE');
  });
});

describe('TRANSITION_PERMISSIONS', () => {
  it('permet à SYSTEM de faire SOUMIS->RECU', () => {
    expect(TRANSITION_PERMISSIONS['SOUMIS->RECU']).toContain('SYSTEM');
  });

  it('permet à ADMIN et SUPER_ADMIN de traiter les demandes', () => {
    const adminTransitions = [
      'RECU->EN_COURS',
      'RECU->REJETE',
      'EN_COURS->ATTENTE_INFO',
      'EN_COURS->VALIDE',
      'EN_COURS->REJETE'
    ];
    adminTransitions.forEach(transition => {
      expect(TRANSITION_PERMISSIONS[transition]).toContain('ADMIN');
      expect(TRANSITION_PERMISSIONS[transition]).toContain('SUPER_ADMIN');
    });
  });

  it('permet aux étudiants de répondre en attente d\'info', () => {
    expect(TRANSITION_PERMISSIONS['ATTENTE_INFO->EN_COURS']).toContain('STUDENT');
    expect(TRANSITION_PERMISSIONS['ATTENTE_INFO->EN_COURS']).toContain('ADMIN');
    expect(TRANSITION_PERMISSIONS['ATTENTE_INFO->EN_COURS']).toContain('SUPER_ADMIN');
  });

  it('ne permet pas aux étudiants de rejeter une demande', () => {
    expect(TRANSITION_PERMISSIONS['ATTENTE_INFO->REJETE']).not.toContain('STUDENT');
  });

  it('définit les permissions pour toutes les transitions principales', () => {
    const expectedTransitions = [
      'SOUMIS->RECU',
      'RECU->EN_COURS',
      'RECU->REJETE',
      'EN_COURS->ATTENTE_INFO',
      'EN_COURS->VALIDE',
      'EN_COURS->REJETE',
      'ATTENTE_INFO->EN_COURS',
      'ATTENTE_INFO->REJETE',
      'VALIDE->TRAITE',
      'TRAITE->ARCHIVE',
      'REJETE->ARCHIVE'
    ];
    expectedTransitions.forEach(transition => {
      expect(TRANSITION_PERMISSIONS[transition]).toBeDefined();
    });
  });
});

describe('TRANSITION_REQUIREMENTS', () => {
  it('requiert un motif de refus pour REJETE', () => {
    expect(TRANSITION_REQUIREMENTS.REJETE?.requiredFields).toContain('motifRefus');
  });

  it('permet un commentaire optionnel pour REJETE', () => {
    expect(TRANSITION_REQUIREMENTS.REJETE?.optionalFields).toContain('commentaireAdmin');
  });

  it('requiert un commentaire pour ATTENTE_INFO', () => {
    expect(TRANSITION_REQUIREMENTS.ATTENTE_INFO?.requiredFields).toContain('commentaireAdmin');
  });

  it('permet des champs optionnels pour EN_COURS', () => {
    expect(TRANSITION_REQUIREMENTS.EN_COURS?.optionalFields).toContain('traiteParId');
    expect(TRANSITION_REQUIREMENTS.EN_COURS?.optionalFields).toContain('commentaireAdmin');
  });

  it('n\'a pas de requirements pour SOUMIS', () => {
    expect(TRANSITION_REQUIREMENTS.SOUMIS).toBeUndefined();
  });
});

describe('canTransition', () => {
  it('retourne true pour une transition valide', () => {
    expect(canTransition('SOUMIS', 'RECU')).toBe(true);
    expect(canTransition('RECU', 'EN_COURS')).toBe(true);
    expect(canTransition('EN_COURS', 'VALIDE')).toBe(true);
  });

  it('retourne false pour une transition invalide', () => {
    expect(canTransition('SOUMIS', 'VALIDE')).toBe(false);
    expect(canTransition('REJETE', 'TRAITE')).toBe(false);
    expect(canTransition('ARCHIVE', 'SOUMIS')).toBe(false);
  });

  it('retourne false pour un statut inexistant', () => {
    expect(canTransition('INEXISTANT' as DemandeStatus, 'RECU')).toBe(false);
  });

  it('retourne false pour une transition vers le même statut', () => {
    expect(canTransition('EN_COURS', 'EN_COURS')).toBe(false);
  });
});

describe('isTerminalStatus', () => {
  it('retourne true pour les statuts terminaux', () => {
    expect(isTerminalStatus('REJETE')).toBe(true);
    expect(isTerminalStatus('TRAITE')).toBe(true);
    expect(isTerminalStatus('ARCHIVE')).toBe(true);
  });

  it('retourne false pour les statuts non-terminaux', () => {
    expect(isTerminalStatus('SOUMIS')).toBe(false);
    expect(isTerminalStatus('RECU')).toBe(false);
    expect(isTerminalStatus('EN_COURS')).toBe(false);
    expect(isTerminalStatus('ATTENTE_INFO')).toBe(false);
    expect(isTerminalStatus('VALIDE')).toBe(false);
  });
});

describe('getAllowedTransitions', () => {
  it('retourne les transitions valides pour SOUMIS', () => {
    expect(getAllowedTransitions('SOUMIS')).toEqual(['RECU']);
  });

  it('retourne les transitions valides pour EN_COURS', () => {
    expect(getAllowedTransitions('EN_COURS')).toEqual(['ATTENTE_INFO', 'VALIDE', 'REJETE']);
  });

  it('retourne un tableau vide pour ARCHIVE', () => {
    expect(getAllowedTransitions('ARCHIVE')).toEqual([]);
  });

  it('retourne un tableau vide pour un statut inexistant', () => {
    expect(getAllowedTransitions('INEXISTANT' as DemandeStatus)).toEqual([]);
  });
});
