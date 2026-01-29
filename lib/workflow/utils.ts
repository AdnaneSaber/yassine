import type { DemandeStatus, UserRole } from '@/types/database';
import { WORKFLOW_TRANSITIONS, TRANSITION_PERMISSIONS } from './constants';

/**
 * Get all possible next states for a given status
 */
export function getAvailableTransitions(
  currentStatus: DemandeStatus,
  userRole: UserRole | 'SYSTEM'
): DemandeStatus[] {
  const allTransitions = WORKFLOW_TRANSITIONS[currentStatus] || [];

  return allTransitions.filter(nextStatus => {
    const transitionKey = `${currentStatus}->${nextStatus}`;
    const allowedRoles = TRANSITION_PERMISSIONS[transitionKey];

    if (!allowedRoles) {
      return ['ADMIN', 'SUPER_ADMIN'].includes(userRole);
    }

    return allowedRoles.includes(userRole);
  });
}

/**
 * Check if user can perform a specific transition
 */
export function canUserTransition(
  from: DemandeStatus,
  to: DemandeStatus,
  userRole: UserRole | 'SYSTEM'
): boolean {
  const transitionKey = `${from}->${to}`;
  const allowedRoles = TRANSITION_PERMISSIONS[transitionKey];

  if (!allowedRoles) {
    return ['ADMIN', 'SUPER_ADMIN', 'SYSTEM'].includes(userRole);
  }

  return allowedRoles.includes(userRole);
}

/**
 * Validate transition context has required fields
 */
export function validateTransitionContext(
  targetStatus: DemandeStatus,
  context: Record<string, any>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (targetStatus === 'REJETE' && !context.motifRefus) {
    errors.push('motifRefus is required when rejecting');
  }

  if (targetStatus === 'ATTENTE_INFO' && !context.commentaireAdmin) {
    errors.push('commentaireAdmin is required for ATTENTE_INFO');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
