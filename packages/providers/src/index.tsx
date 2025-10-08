'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import React from 'react';

export { ThemeProvider, useTheme } from './theme-provider';
export { ThemeScript } from './theme-script';
export { AuthModalProvider, useAuthModal } from './auth-modal-provider';

interface ProvidersProps {
  children: React.ReactNode;
}

// Constants for query configuration
const QUERY_STALE_TIME_MINUTES = 5;
const QUERY_STALE_TIME_MS = QUERY_STALE_TIME_MINUTES * 60 * 1000;

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: QUERY_STALE_TIME_MS, // 5 minutes
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
