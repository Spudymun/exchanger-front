'use client';

import * as React from 'react';

interface LayoutErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

export interface LayoutErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  componentName?: string;
}

/**
 * Error Boundary специально для Layout компонентов
 * Предоставляет минимальный fallback для критических layout ошибок
 */
export class LayoutErrorBoundary extends React.Component<
  LayoutErrorBoundaryProps,
  LayoutErrorBoundaryState
> {
  constructor(props: LayoutErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): LayoutErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
    this.props.onError?.(error, errorInfo);

    console.error(`${this.props.componentName || 'Layout'} Error Boundary:`, error, errorInfo);
  }

  retry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return <this.props.fallback error={this.state.error} retry={this.retry} />;
      }

      // Минимальный fallback для layout ошибок
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="max-w-md mx-auto p-6 text-center">
            <div className="mb-4">
              <svg
                className="h-12 w-12 text-destructive mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.298 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Ошибка загрузки {this.props.componentName || 'приложения'}
            </h1>
            <p className="text-muted-foreground mb-6">
              Произошла ошибка при загрузке интерфейса. Попробуйте обновить страницу.
            </p>
            <div className="space-y-2">
              <button
                onClick={this.retry}
                className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                Попробовать снова
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-full px-4 py-2 border border-border rounded-md hover:bg-muted"
              >
                Обновить страницу
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
