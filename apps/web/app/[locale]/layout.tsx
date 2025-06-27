import React from 'react'
import { notFound } from 'next/navigation'
import { ClientProviders } from './providers'

const locales = ['en', 'ru'] as const

interface LocaleLayoutProps {
    children: React.ReactNode
    params: Promise<{ locale: string }>
}

export default async function LocaleLayout({
    children,
    params
}: LocaleLayoutProps) {
    // Await params to get the locale
    const { locale } = await params

    // Validate that the incoming `locale` parameter is valid
    if (!locales.includes(locale as any)) {
        notFound()
    }

    // Load messages for the current locale
    let messages
    try {
        messages = (await import(`../../messages/${locale}.json`)).default
    } catch {
        messages = {}
    }

    return (
        <html lang={locale} suppressHydrationWarning>
            <body>
                <ClientProviders locale={locale} messages={messages}>
                    <div style={{ minHeight: '100vh' }}>
                        {children}
                    </div>
                </ClientProviders>
            </body>
        </html>
    )
}
