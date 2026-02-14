// PATCH  /api/notes/vaults/:id  — rename vault
// DELETE /api/notes/vaults/:id  — delete vault (cascade deletes all items)

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { updateVaultName, deleteVault, getVaultById } from '@/lib/db/queries/notes';

type P = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: P) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const { name } = await req.json();
    if (!name?.trim())
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    const vault = await updateVaultName(id, user.userId, name.trim());
    if (!vault) return NextResponse.json({ error: 'Vault not found' }, { status: 404 });
    return NextResponse.json({ data: vault });
  } catch (e) {
    if (e instanceof Error && e.message === 'UNAUTHORIZED')
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: P) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const exists = await getVaultById(id, user.userId);
    if (!exists) return NextResponse.json({ error: 'Vault not found' }, { status: 404 });
    await deleteVault(id, user.userId);
    return NextResponse.json({ message: 'Vault deleted' });
  } catch (e) {
    if (e instanceof Error && e.message === 'UNAUTHORIZED')
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
