'use client';

import * as React from 'react';
import { AlertCircle, XCircle, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// FormFieldError - For inline field-level errors
// ============================================================================

export interface FormFieldErrorProps extends React.HTMLAttributes<HTMLParagraphElement> {
  error?: string;
  id?: string;
}

export function FormFieldError({ error, id, className, ...props }: FormFieldErrorProps) {
  if (!error) return null;

  return (
    <p
      id={id}
      role="alert"
      aria-live="polite"
      className={cn('mt-1.5 text-sm font-medium text-red-600 flex items-center gap-1.5', className)}
      {...props}
    >
      <XCircle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
      <span>{error}</span>
    </p>
  );
}

// ============================================================================
// FormErrors - For form-level errors (multiple errors)
// ============================================================================

export interface FormErrorsProps extends React.HTMLAttributes<HTMLDivElement> {
  errors?: string | string[] | Record<string, string | string[]>;
  title?: string;
}

export function FormErrors({ errors, title = 'Erreur', className, ...props }: FormErrorsProps) {
  // Normalize errors to array format
  const errorList = React.useMemo(() => {
    if (!errors) return [];
    if (typeof errors === 'string') {
      return [errors];
    }
    if (Array.isArray(errors)) {
      return errors;
    }
    // If errors is an object, extract all error messages
    return Object.values(errors).flat();
  }, [errors]);

  if (errorList.length === 0) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={cn(
        'rounded-lg border border-red-200 bg-red-50 p-4',
        className
      )}
      {...props}
    >
      <div className="flex">
        <div className="flex-shrink-0">
          <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">
            {title}
          </h3>
          {errorList.length === 1 ? (
            <div className="mt-2 text-sm text-red-700">
              {errorList[0]}
            </div>
          ) : (
            <div className="mt-2 text-sm text-red-700">
              <ul className="list-disc space-y-1 pl-5">
                {errorList.map((error, idx) => (
                  <li key={idx}>{error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SuccessMessage - For success feedback
// ============================================================================

export interface SuccessMessageProps extends React.HTMLAttributes<HTMLDivElement> {
  message: string;
  title?: string;
}

export function SuccessMessage({ message, title = 'Succès', className, ...props }: SuccessMessageProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'rounded-lg border border-green-200 bg-green-50 p-4',
        className
      )}
      {...props}
    >
      <div className="flex">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-green-400"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-green-800">
            {title}
          </h3>
          <div className="mt-2 text-sm text-green-700">
            {message}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// WarningMessage - For warning feedback
// ============================================================================

export interface WarningMessageProps extends React.HTMLAttributes<HTMLDivElement> {
  message: string;
  title?: string;
}

export function WarningMessage({ message, title = 'Attention', className, ...props }: WarningMessageProps) {
  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        'rounded-lg border border-yellow-200 bg-yellow-50 p-4',
        className
      )}
      {...props}
    >
      <div className="flex">
        <div className="flex-shrink-0">
          <AlertTriangle className="h-5 w-5 text-yellow-400" aria-hidden="true" />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-yellow-800">
            {title}
          </h3>
          <div className="mt-2 text-sm text-yellow-700">
            {message}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// ErrorBoundary - For catching React errors
// ============================================================================

export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-[400px] items-center justify-center p-4">
          <div className="w-full max-w-md">
            <FormErrors
              errors={[
                'Une erreur est survenue lors du chargement de cette section.',
                this.state.error?.message || 'Erreur inconnue'
              ]}
              title="Erreur de chargement"
            />
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="mt-4 w-full rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Réessayer
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// ============================================================================
// LoadingSpinner - For loading states
// ============================================================================

export interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
}

export function LoadingSpinner({ size = 'md', message, className, ...props }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn('flex flex-col items-center justify-center gap-2', className)}
      {...props}
    >
      <svg
        className={cn('animate-spin text-primary', sizeClasses[size])}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      {message && (
        <p className="text-sm text-muted-foreground">
          {message}
        </p>
      )}
      <span className="sr-only">{message || 'Chargement en cours...'}</span>
    </div>
  );
}
