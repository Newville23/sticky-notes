import type { ErrorInfo, ReactNode } from 'react'
import {
  ErrorBoundary as ReactErrorBoundary,
  type FallbackProps,
} from 'react-error-boundary'
import './ErrorBoundary.css'

export interface ErrorBoundaryProps {
  readonly children: ReactNode
}

function ErrorFallback({ resetErrorBoundary }: FallbackProps) {
  return (
    <main className="error-boundary" role="alert">
      <div className="error-boundary__content">
        <h1 className="error-boundary__title">Something went wrong</h1>
        <p className="error-boundary__message">
          Reload the application to try again.
        </p>
        <button
          className="error-boundary__action"
          type="button"
          onClick={resetErrorBoundary}
        >
          Reload application
        </button>
      </div>
    </main>
  )
}

function reportError(error: unknown, errorInfo: ErrorInfo): void {
  console.error('The application encountered an unrecoverable error.', {
    error,
    errorInfo,
  })
}

export function ErrorBoundary({ children }: ErrorBoundaryProps) {
  return (
    <ReactErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={reportError}
      onReset={() => window.location.reload()}
    >
      {children}
    </ReactErrorBoundary>
  )
}
