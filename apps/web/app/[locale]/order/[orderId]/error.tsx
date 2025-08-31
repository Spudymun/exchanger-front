'use client';

import { Button, CenteredPageLayout } from '@repo/ui';

import { useRouter } from '../../../../src/i18n/navigation';

interface OrderErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

function OrderErrorIcon() {
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

function OrderErrorContent({ error }: { error: Error & { digest?: string } }) {
  // Log detailed error info to console for debugging
  // eslint-disable-next-line no-console
  console.error('Order Page Error Details:', {
    message: error.message,
    stack: error.stack,
    name: error.name,
    cause: error.cause,
    digest: error.digest,
  });

  return (
    <div className="mb-8">
      <OrderErrorIcon />
      <h1 className="text-3xl font-bold text-foreground mb-2">Ошибка загрузки заказа</h1>
      <p className="text-lg text-muted-foreground mb-6">
        Произошла ошибка при загрузке страницы заказа. Проверьте ID заказа или попробуйте позже.
      </p>
      {error.message && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6">
          <p className="text-sm text-destructive font-mono break-all">
            <strong>Ошибка:</strong> {error.message}
          </p>
          {error.digest && (
            <p className="text-xs text-destructive/70 mt-2">
              <strong>Digest:</strong> {error.digest}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function OrderErrorActions({ reset }: { reset: () => void }) {
  const router = useRouter();

  return (
    <div className="flex gap-4 justify-center">
      <Button onClick={reset} variant="default" size="lg">
        Попробовать снова
      </Button>
      <Button onClick={() => router.push('/')} variant="outline" size="lg">
        На главную
      </Button>
    </div>
  );
}

export default function OrderError({ error, reset }: OrderErrorProps) {
  return (
    <CenteredPageLayout maxWidth="lg">
      <OrderErrorContent error={error} />
      <OrderErrorActions reset={reset} />
    </CenteredPageLayout>
  );
}
