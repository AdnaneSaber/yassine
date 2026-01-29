// Export all workflow functionality from a single entry point
export {
  STATUTS_META,
  WORKFLOW_TRANSITIONS,
  TRANSITION_PERMISSIONS,
  TRANSITION_REQUIREMENTS,
  canTransition,
  isTerminalStatus,
  getAllowedTransitions,
  type StatusMeta,
  type TransitionRequirements
} from './constants';

export {
  DemandeWorkflow,
  WorkflowError,
  type TransitionContext
} from './state-machine';

export {
  getAvailableTransitions,
  canUserTransition,
  validateTransitionContext
} from './utils';
