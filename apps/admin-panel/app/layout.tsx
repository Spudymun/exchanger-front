import { LAYOUT_SHARED_CONFIG, META_DEFAULTS, GLOBAL_CSS_CLASSES } from '@repo/constants';
import { Providers, ThemeProvider } from '@repo/providers';
import type { Metadata } from 'next';
import '@repo/ui/styles';
import './globals.css';

export const metadata: Metadata = {
  title: 'Admin Panel - ExchangeGO',
  description: 'Administrative dashboard for ExchangeGO cryptocurrency exchange platform',
  keywords: 'admin, panel, management, dashboard, cryptocurrency, exchange',
  robots: {
    index: META_DEFAULTS.ROBOTS.INDEX,
    follow: META_DEFAULTS.ROBOTS.FOLLOW,
  },
};

export const viewport = LAYOUT_SHARED_CONFIG.VIEWPORT;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning={GLOBAL_CSS_CLASSES.HTML_SUPPRESS_HYDRATION}>
      <head>
        <meta name="color-scheme" content={LAYOUT_SHARED_CONFIG.COLOR_SCHEME} />
        <meta
          name="theme-color"
          content={LAYOUT_SHARED_CONFIG.THEME_COLORS.LIGHT}
          media="(prefers-color-scheme: light)"
        />
        <meta
          name="theme-color"
          content={LAYOUT_SHARED_CONFIG.THEME_COLORS.DARK}
          media="(prefers-color-scheme: dark)"
        />
      </head>
      <body className={`min-h-screen bg-background font-sans ${GLOBAL_CSS_CLASSES.BODY_BASE}`}>
        <ThemeProvider defaultTheme="system">
          <Providers>{children}</Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
