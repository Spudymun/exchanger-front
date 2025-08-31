'use client';

import { ADMIN_ROUTES } from '@repo/constants';
import { Button, CenteredPageLayout } from '@repo/ui';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  return (
    <CenteredPageLayout maxWidth="lg">
      <div className="mb-8">
        <div className="w-16 h-16 bg-destructive rounded-full mx-auto mb-4 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-destructive-foreground"
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
        <h1 className="text-3xl font-bold text-foreground mb-2">Ошибка в Admin Panel</h1>
        <p className="text-lg text-muted-foreground mb-6">
          Произошла ошибка в административной панели.
        </p>
        {error.message && (
          <div className="bg-destructive/10 border border-destructive rounded-lg p-4 mb-6">
            <p className="text-sm text-destructive font-mono">{error.message}</p>
          </div>
        )}
      </div>

      <div className="flex gap-4 justify-center">
        <Button onClick={reset} variant="default" size="lg">
          Попробовать снова
        </Button>
        <Button asChild variant="outline" size="lg">
          <a href={ADMIN_ROUTES.ADMIN_HOME}>На главную панель</a>
        </Button>
      </div>
    </CenteredPageLayout>
  );
}
