// GET  /api/notes/vaults/:id/items  — get full item tree for vault
// POST /api/notes/vaults/:id/items  — create file or folder

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getVaultById, getItemsByVaultId, buildItemTree, createItem } from '@/lib/db/queries/notes';

type P = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: P) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const vault = await getVaultById(id, user.userId);
    if (!vault) return NextResponse.json({ error: 'Vault not found' }, { status: 404 });
    const items = await getItemsByVaultId(id);
    const tree = buildItemTree(items);
    return NextResponse.json({ data: tree });
  } catch (e) {
    if (e instanceof Error && e.message === 'UNAUTHORIZED')
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: P) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const vault = await getVaultById(id, user.userId);
    if (!vault) return NextResponse.json({ error: 'Vault not found' }, { status: 404 });

    const body = await req.json();
    const { name, item_type, parent_id, content } = body;

    if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    if (!['file', 'folder'].includes(item_type))
      return NextResponse.json({ error: 'item_type must be file or folder' }, { status: 400 });

    // Auto-add .md extension for files
    const finalName = item_type === 'file' && !name.endsWith('.md') ? `${name}.md` : name;

    const item = await createItem(id, parent_id ?? null, finalName, item_type, content ?? '');
    return NextResponse.json({ data: item }, { status: 201 });
  } catch (e) {
    if (e instanceof Error && e.message === 'UNAUTHORIZED')
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
