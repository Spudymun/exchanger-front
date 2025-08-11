import { LAYOUT_SHARED_CONFIG, META_DEFAULTS, GLOBAL_CSS_CLASSES } from '@repo/constants';
import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
});
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
});

export const metadata: Metadata = {
  title: 'ExchangeGO Documentation',
  description: 'Technical documentation and guides for ExchangeGO cryptocurrency exchange platform',
  keywords: 'documentation, guides, api, cryptocurrency, exchange, technical',
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
    <html lang="en" suppressHydrationWarning={GLOBAL_CSS_CLASSES.HTML_SUPPRESS_HYDRATION}>
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
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${GLOBAL_CSS_CLASSES.BODY_BASE}`}
      >
        {children}
      </body>
    </html>
  );
}
