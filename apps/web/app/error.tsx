'use client';

import { I18N_CONFIG } from '@repo/constants';
import { Button, CenteredPageLayout } from '@repo/ui';

import { useRouter } from '../src/i18n/navigation';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

function ErrorIcon() {
  return (
    <div className="w-16 h-16 bg-destructive rounded-full mx-auto mb-4 flex items-center justify-center">
      <svg
        className="w-8 h-8 text-destructive-foreground"
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
    </div>
  );
}

export default function GlobalError({ error, reset }: ErrorProps) {
  const router = useRouter();

  return (
    <CenteredPageLayout maxWidth="lg">
      <div className="mb-8">
        <ErrorIcon />
        <h1 className="text-3xl font-bold text-foreground mb-2">Something went wrong</h1>
        <p className="text-lg text-muted-foreground mb-6">
          An unexpected error occurred. Please try again or contact support if the problem persists.
        </p>
        {error.message && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6">
            <p className="text-sm text-destructive font-mono break-all">{error.message}</p>
          </div>
        )}
      </div>

      <div className="flex gap-4 justify-center">
        <Button onClick={reset} variant="default" size="lg">
          Try Again
        </Button>
        <Button
          onClick={() => router.push(`/${I18N_CONFIG.DEFAULT_LOCALE}`)}
          variant="outline"
          size="lg"
        >
          Go Home
        </Button>
      </div>
    </CenteredPageLayout>
  );
}
