'use client';

import * as React from 'react';

import { Button } from '../ui/button';

interface BaseErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

export interface BaseErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  componentName?: string;
}

/**
 * Базовый Error Boundary для любых компонентов
 * Минимальный fallback UI в стиле проекта
 */
export class BaseErrorBoundary extends React.Component<
  BaseErrorBoundaryProps,
  BaseErrorBoundaryState
> {
  constructor(props: BaseErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): BaseErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
    this.props.onError?.(error, errorInfo);

    console.error(`${this.props.componentName || 'Component'} Error Boundary:`, error, errorInfo);
  }

  retry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return <this.props.fallback error={this.state.error} retry={this.retry} />;
      }

      return (
        <div className="p-4 border border-destructive/20 bg-destructive/10 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <svg
              className="h-4 w-4 text-destructive"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01"
              />
            </svg>
            <span className="text-sm font-medium text-destructive">
              Ошибка компонента {this.props.componentName || ''}
            </span>
          </div>
          <Button onClick={this.retry} variant="outline" size="sm">
            Попробовать снова
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
