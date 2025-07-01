'use client';

import { ThemeProvider } from '@repo/providers';

import { NextIntlClientProvider } from 'next-intl';
import React from 'react';

import { TRPCProvider } from '../../lib/trpc-provider';

interface ProvidersProps {
  children: React.ReactNode;
  locale: string;
  messages: Record<string, unknown>;
}

export function ClientProviders({ children, locale, messages }: ProvidersProps) {
  return (
    <ThemeProvider defaultTheme="system">
      <NextIntlClientProvider locale={locale} messages={messages}>
        <TRPCProvider>{children}</TRPCProvider>
      </NextIntlClientProvider>
    </ThemeProvider>
  );
}
