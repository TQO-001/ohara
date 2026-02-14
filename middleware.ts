// ============================================================
// src/middleware.ts — Route Protection
//
// This runs BEFORE every request matching the config.
// It checks if the user has a valid session cookie.
// If not, it redirects to /login.
//
// WHY middleware instead of checking in every page?
//   Middleware runs at the Edge (super fast, before rendering).
//   One place to manage auth = less duplication.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET;
const COOKIE_NAME = 'ohara_session';

// Routes that don't require authentication
const PUBLIC_PATHS = ['/login', '/register', '/api/auth'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public paths through
  if (PUBLIC_PATHS.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Allow static files and Next.js internals through
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Check for the session cookie
  const token = req.cookies.get(COOKIE_NAME)?.value;

  if (!token) {
    // No token → redirect to login
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Verify the token is valid and not expired
  try {
    if (!JWT_SECRET) throw new Error('JWT_SECRET not set');
    const secret = new TextEncoder().encode(JWT_SECRET);
    await jwtVerify(token, secret);
    // Token is valid → allow through
    return NextResponse.next();
  } catch {
    // Invalid/expired token → clear cookie and redirect
    const response = NextResponse.redirect(new URL('/login', req.url));
    response.cookies.delete(COOKIE_NAME);
    return response;
  }
}

export const config = {
  // Run middleware on all routes except static files
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
