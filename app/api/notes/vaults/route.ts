// GET  /api/notes/vaults  — list all vaults for user
// POST /api/notes/vaults  — create a vault

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getVaultsByUserId, createVault } from '@/lib/db/queries/notes';

export async function GET() {
  try {
    const user = await requireAuth();
    const vaults = await getVaultsByUserId(user.userId);
    return NextResponse.json({ data: vaults });
  } catch (e) {
    if (e instanceof Error && e.message === 'UNAUTHORIZED')
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    console.error(e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { name } = await req.json();
    if (!name?.trim())
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    const vault = await createVault(user.userId, name.trim());
    return NextResponse.json({ data: vault }, { status: 201 });
  } catch (e) {
    if (e instanceof Error && e.message === 'UNAUTHORIZED')
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    console.error(e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
