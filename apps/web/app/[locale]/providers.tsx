'use client'

import React from 'react'
import { NextIntlClientProvider } from 'next-intl'
import { ThemeProvider } from '@repo/providers'
import { TRPCProvider } from '../../lib/trpc-provider'

interface ProvidersProps {
    children: React.ReactNode
    locale: string
    messages: any
}

export function ClientProviders({ children, locale, messages }: ProvidersProps) {
    return (
        <ThemeProvider defaultTheme="system">
            <NextIntlClientProvider locale={locale} messages={messages}>
                <TRPCProvider>
                    {children}
                </TRPCProvider>
            </NextIntlClientProvider>
        </ThemeProvider>
    )
}
