'use client';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="max-w-2xl mx-auto p-8 text-center">
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
          <button
            onClick={reset}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-6 rounded-xl transition-colors duration-200"
          >
            Попробовать снова
          </button>
          <a
            href="/admin"
            className="bg-secondary hover:bg-secondary/80 text-secondary-foreground font-semibold py-3 px-6 rounded-xl transition-colors duration-200"
          >
            На главную панель
          </a>
        </div>
      </div>
    </div>
  );
}
