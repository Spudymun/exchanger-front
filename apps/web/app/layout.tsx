import type { Metadata } from "next";
import "@repo/ui/styles";
import "./globals.css";

export const metadata: Metadata = {
  title: "Exchanger - Enterprise Crypto Exchange",
  description: "Modern cryptocurrency exchange platform built with Next.js, tRPC, and enterprise-grade architecture",
  keywords: "crypto, exchange, trading, blockchain, nextjs, trpc, enterprise",
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
    <html suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="light dark" />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
