import type { Metadata } from "next";
import { Providers, ThemeProvider } from "@repo/providers";
import "@repo/ui/styles";
import "./globals.css";

export const metadata: Metadata = {
    title: "Admin Panel - Exchanger",
    description: "Administrative panel for Exchanger platform",
    keywords: "admin, panel, exchanger, management",
};

export const viewport = {
    width: 'device-width',
    initialScale: 1,
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="ru" suppressHydrationWarning>
            <head>
                <meta name="color-scheme" content="light dark" />
            </head>
            <body className="min-h-screen bg-background font-sans antialiased">
                <ThemeProvider defaultTheme="system">
                    <Providers>
                        {children}
                    </Providers>
                </ThemeProvider>
            </body>
        </html>
    );
}
