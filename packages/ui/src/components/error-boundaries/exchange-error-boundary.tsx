'use client';

import * as React from 'react';

import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

interface ExchangeErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

export interface ExchangeErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

/**
 * Error Boundary специально для Exchange компонентов
 * Следует паттерну существующих компонентов проекта
 */
export class ExchangeErrorBoundary extends React.Component<
  ExchangeErrorBoundaryProps,
  ExchangeErrorBoundaryState
> {
  constructor(props: ExchangeErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ExchangeErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
    this.props.onError?.(error, errorInfo);

    // Логирование ошибки (можно интегрировать с сервисом логирования)
    console.error('Exchange Error Boundary caught an error:', error, errorInfo);
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
        <Card className="border-destructive bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.298 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
              Ошибка формы обмена
            </CardTitle>
            <CardDescription>
              Произошла ошибка при загрузке формы обмена. Попробуйте обновить компонент.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Button onClick={this.retry} variant="outline" size="sm">
              Попробовать снова
            </Button>
            <Button onClick={() => window.location.reload()} variant="ghost" size="sm">
              Обновить страницу
            </Button>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}
