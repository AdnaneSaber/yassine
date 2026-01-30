import type { DemandeStatus } from '@/types/database';

// Status metadata
export interface StatusMeta {
  libelle: string;
  couleur: string;
  estFinal: boolean;
  description?: string;
}

export const STATUTS_META: Record<DemandeStatus, StatusMeta> = {
  SOUMIS: {
    libelle: 'Soumis',
    couleur: '#6B7280',
    estFinal: false,
    description: 'Demande vient d\'être soumise'
  },
  RECU: {
    libelle: 'Reçu',
    couleur: '#3B82F6',
    estFinal: false,
    description: 'Demande reçue par l\'administration'
  },
  EN_COURS: {
    libelle: 'En cours',
    couleur: '#F59E0B',
    estFinal: false,
    description: 'Demande en cours de traitement'
  },
  ATTENTE_INFO: {
    libelle: 'En attente d\'information',
    couleur: '#F59E0B',
    estFinal: false,
    description: 'Information supplémentaire requise'
  },
  VALIDE: {
    libelle: 'Validé',
    couleur: '#10B981',
    estFinal: false,
    description: 'Demande validée par l\'administration'
  },
  REJETE: {
    libelle: 'Rejeté',
    couleur: '#EF4444',
    estFinal: true,
    description: 'Demande rejetée'
  },
  TRAITE: {
    libelle: 'Traité',
    couleur: '#059669',
    estFinal: true,
    description: 'Demande traitée avec succès'
  },
  ARCHIVE: {
    libelle: 'Archivé',
    couleur: '#6B7280',
    estFinal: true,
    description: 'Demande archivée'
  }
};

// Workflow transitions map
export const WORKFLOW_TRANSITIONS: Record<DemandeStatus, DemandeStatus[]> = {
  SOUMIS: ['RECU'],
  RECU: ['EN_COURS', 'REJETE'],
  EN_COURS: ['ATTENTE_INFO', 'VALIDE', 'REJETE'],
  ATTENTE_INFO: ['EN_COURS', 'REJETE'],
  VALIDE: ['TRAITE'],
  REJETE: ['ARCHIVE'],
  TRAITE: ['ARCHIVE'],
  ARCHIVE: [] // Terminal state
};

// Transition permissions
export const TRANSITION_PERMISSIONS: Record<string, string[]> = {
  'SOUMIS->RECU': ['SYSTEM'],
  'RECU->EN_COURS': ['ADMIN', 'SUPER_ADMIN'],
  'RECU->REJETE': ['ADMIN', 'SUPER_ADMIN'],
  'EN_COURS->ATTENTE_INFO': ['ADMIN', 'SUPER_ADMIN'],
  'EN_COURS->VALIDE': ['ADMIN', 'SUPER_ADMIN'],
  'EN_COURS->REJETE': ['ADMIN', 'SUPER_ADMIN'],
  'ATTENTE_INFO->EN_COURS': ['STUDENT', 'ADMIN', 'SUPER_ADMIN'],
  'ATTENTE_INFO->REJETE': ['ADMIN', 'SUPER_ADMIN'],
  'VALIDE->TRAITE': ['SYSTEM', 'ADMIN', 'SUPER_ADMIN'],
  'TRAITE->ARCHIVE': ['SYSTEM', 'ADMIN', 'SUPER_ADMIN'],
  'REJETE->ARCHIVE': ['SYSTEM', 'ADMIN', 'SUPER_ADMIN']
};

// Required fields per status
export interface TransitionRequirements {
  requiredFields?: string[];
  optionalFields?: string[];
}

export const TRANSITION_REQUIREMENTS: Partial<Record<DemandeStatus, TransitionRequirements>> = {
  REJETE: {
    requiredFields: ['motifRefus'],
    optionalFields: ['commentaireAdmin']
  },
  EN_COURS: {
    optionalFields: ['traiteParId', 'commentaireAdmin']
  },
  ATTENTE_INFO: {
    requiredFields: ['commentaireAdmin']
  },
  VALIDE: {
    optionalFields: ['documents'] // Documents are optional for validation
  }
};

// Helper functions
export function canTransition(from: DemandeStatus, to: DemandeStatus): boolean {
  return WORKFLOW_TRANSITIONS[from]?.includes(to) ?? false;
}

export function isTerminalStatus(status: DemandeStatus): boolean {
  return STATUTS_META[status].estFinal === true;
}

export function getAllowedTransitions(from: DemandeStatus): DemandeStatus[] {
  return WORKFLOW_TRANSITIONS[from] || [];
}
