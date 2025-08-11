import { I18N_CONFIG } from '@repo/constants';
import { NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';

import { routing } from './src/i18n/routing';

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  // Get the response from next-intl middleware
  const response = intlMiddleware(request);

  // Extract actual locale from the pathname using next-intl logic
  // This properly handles all supported locales, not just default/fallback
  const pathname = request.nextUrl.pathname;
  const segments = pathname.split('/');

  // Check if the first segment is a valid locale with proper typing
  let detectedLocale: string = I18N_CONFIG.DEFAULT_LOCALE;
  if (segments[1] && routing.locales.includes(segments[1] as (typeof routing.locales)[number])) {
    detectedLocale = segments[1];
  }

  // Add locale header for root layout
  if (response instanceof NextResponse) {
    response.headers.set('x-locale', detectedLocale);
  }

  return response;
}

export const config = {
  // Match all pathnames except for
  // - … if they start with `/api`, `/trpc`, `/_next` or `/_vercel`
  // - … the ones containing a dot (e.g. `favicon.ico`)
  matcher: '/((?!api|trpc|_next|_vercel|.*\\..*|favicon\\.ico).*)',
};
