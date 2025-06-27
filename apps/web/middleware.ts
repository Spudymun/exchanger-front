import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname

    // If already has locale, continue
    if (pathname.startsWith('/en') || pathname.startsWith('/ru')) {
        return NextResponse.next()
    }

    // If root path, redirect to /en
    if (pathname === '/') {
        return NextResponse.redirect(new URL('/en', request.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
}
