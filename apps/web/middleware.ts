import { NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';

import { routing } from './src/i18n/routing';

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  // Get the response from next-intl middleware
  const response = intlMiddleware(request);

  // Extract locale from pathname
  const pathname = request.nextUrl.pathname;
  const locale = pathname.startsWith('/ru') ? 'ru' : 'en';

  // Add locale header for root layout
  if (response instanceof NextResponse) {
    response.headers.set('x-locale', locale);
  }

  return response;
}

export const config = {
  // Match all pathnames except for
  // - … if they start with `/api`, `/trpc`, `/_next` or `/_vercel`
  // - … the ones containing a dot (e.g. `favicon.ico`)
  matcher: '/((?!api|trpc|_next|_vercel|.*\\..*|favicon\\.ico).*)',
};
