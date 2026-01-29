import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { WorkflowError } from '@/lib/workflow/state-machine';

export function handleApiError(error: unknown): NextResponse {
  console.error('API Error:', error);

  // Zod validation errors
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VAL_001',
          message: 'Erreur de validation',
          details: error.flatten().fieldErrors
        }
      },
      { status: 400 }
    );
  }

  // Workflow errors
  if (error instanceof WorkflowError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details
        }
      },
      { status: 422 }
    );
  }

  // Mongoose duplicate key error
  if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'RES_002',
          message: 'Une ressource avec ces données existe déjà',
          details: 'keyPattern' in error ? error.keyPattern : undefined
        }
      },
      { status: 409 }
    );
  }

  // Generic server error
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'SRV_001',
        message: 'Erreur serveur interne'
      }
    },
    { status: 500 }
  );
}
