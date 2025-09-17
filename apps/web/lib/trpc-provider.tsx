'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';
import { useState, Suspense, lazy } from 'react';
import superjson from 'superjson';

// Dynamic import for React Query DevTools - only in development
const ReactQueryDevtools =
  process.env.NODE_ENV === 'development'
    ? lazy(() =>
        import('@tanstack/react-query-devtools').then(module => ({
          default: module.ReactQueryDevtools,
        }))
      )
    : null;

// Type annotation to avoid build errors - untyped for client isolation
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const trpc = createTRPCReact() as any;

function getBaseUrl() {
  if (typeof window !== 'undefined') return '';
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  // Use relative URL for development to avoid hardcoded hosts
  return '';
}

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
          transformer: superjson,
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
        {process.env.NODE_ENV === 'development' && ReactQueryDevtools && (
          <Suspense fallback={null}>
            <ReactQueryDevtools initialIsOpen={false} />
          </Suspense>
        )}
      </QueryClientProvider>
    </trpc.Provider>
  );
}

export { trpc };
