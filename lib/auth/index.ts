// ============================================================
// src/lib/auth/index.ts — Authentication Utilities
//
// Handles:
//  - Password hashing (bcryptjs)
//  - JWT creation and verification (jose)
//  - Reading/writing the auth cookie
//
// WHY jose instead of jsonwebtoken?
//   jose works in both Node.js AND the browser/Edge runtime.
//   Next.js middleware runs in the Edge runtime, so we need this.
// ============================================================

import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import type { JWTPayload, User } from '@/types';

const JWT_SECRET = process.env.JWT_SECRET;
const COOKIE_NAME = 'ohara_session';

// ── Password Utilities ────────────────────────────────────────

/**
 * Hash a plain-text password.
 * The 12 rounds of bcrypt make brute-force attacks very slow.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

/**
 * Compare a plain-text password against a stored hash.
 * Returns true if they match.
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ── JWT Utilities ─────────────────────────────────────────────

function getSecret(): Uint8Array {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  return new TextEncoder().encode(JWT_SECRET);
}

/**
 * Create a signed JWT token for a user.
 * Expires in 7 days.
 */
export async function createToken(user: User): Promise<string> {
  return new SignJWT({
    userId: user.id,
    email: user.email,
    name: user.name,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecret());
}

/**
 * Verify a JWT token and return its payload.
 * Returns null if the token is invalid or expired.
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

// ── Cookie Utilities ──────────────────────────────────────────

/**
 * Set the auth cookie in the response.
 * This is called after a successful login.
 *
 * Security settings:
 *  - httpOnly: JS can't read this cookie (prevents XSS token theft)
 *  - secure: only sent over HTTPS (in production)
 *  - sameSite: 'lax' prevents CSRF attacks
 *  - path: '/' means it's sent with every request
 */
export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days in seconds
  });
}

/**
 * Clear the auth cookie (on logout).
 */
export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/**
 * Get the current user's JWT payload from the cookie.
 * Returns null if not logged in or token is invalid/expired.
 */
export async function getAuthUser(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

/**
 * Require authentication. Throws a redirect if not authenticated.
 * Use this at the top of Server Components and API routes.
 *
 * Usage in API route:
 *   const user = await requireAuth();
 *   // user is guaranteed to be a valid JWTPayload here
 */
export async function requireAuth(): Promise<JWTPayload> {
  const user = await getAuthUser();
  if (!user) {
    throw new Error('UNAUTHORIZED');
  }
  return user;
}
