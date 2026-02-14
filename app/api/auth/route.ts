// ============================================================
// src/app/api/auth/route.ts
//
// POST /api/auth/login  — login
// POST /api/auth/logout — logout
// GET  /api/auth/me     — get current user
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail, createUser, getUserById } from '@/lib/db/queries/users'; //
import { verifyPassword, hashPassword, createToken, setAuthCookie, clearAuthCookie, getAuthUser } from '@/lib/auth'; //

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'logout') {
      await clearAuthCookie(); //
      return NextResponse.json({ message: 'Logged out' });
    }

    if (action === 'register') {
      const { email, password, name } = body;

      if (!email || !password || !name) {
        return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
      }

      const existingUser = await getUserByEmail(email); //
      if (existingUser) {
        return NextResponse.json({ error: 'User already exists' }, { status: 400 });
      }

      const passwordHash = await hashPassword(password); //
      const userResult = await createUser(email, passwordHash, name); //

      const token = await createToken(userResult); //
      await setAuthCookie(token); //

      return NextResponse.json({ user: userResult });
    }

    if (action === 'login') {
      const { email, password } = body;
      const userWithHash = await getUserByEmail(email); //

      if (!userWithHash || !(await verifyPassword(password, userWithHash.password_hash))) { //
        return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
      }

      const user = {
        id: userWithHash.id,
        email: userWithHash.email,
        name: userWithHash.name,
        created_at: userWithHash.created_at,
        updated_at: userWithHash.updated_at,
      };

      const token = await createToken(user); //
      await setAuthCookie(token); //

      return NextResponse.json({ user });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('[Auth API Error]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  const authUser = await getAuthUser(); //
  if (!authUser) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const user = await getUserById(authUser.userId); //
  return user ? NextResponse.json({ user }) : NextResponse.json({ error: 'User not found' }, { status: 404 });
}