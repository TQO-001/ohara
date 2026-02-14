// GET    /api/notes/items/:id  — get item with full content
// PATCH  /api/notes/items/:id  — update name, content, or parent
// DELETE /api/notes/items/:id  — delete item (cascade deletes children)

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getItemById, updateItem, deleteItem } from '@/lib/db/queries/notes';
import sql from '@/lib/db';

type P = { params: Promise<{ id: string }> };

// Verify the item belongs to the authenticated user via vault ownership
async function getItemForUser(itemId: string, userId: string) {
  const rows = await sql`
    SELECT ni.*, nv.user_id
    FROM notes_items ni
    JOIN notes_vaults nv ON nv.id = ni.vault_id
    WHERE ni.id = ${itemId} AND nv.user_id = ${userId}
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function GET(_req: NextRequest, { params }: P) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const item = await getItemForUser(id, user.userId);
    if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    // Re-fetch with content
    const full = await getItemById(id, item.vault_id);
    return NextResponse.json({ data: full });
  } catch (e) {
    if (e instanceof Error && e.message === 'UNAUTHORIZED')
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: P) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const existing = await getItemForUser(id, user.userId);
    if (!existing) return NextResponse.json({ error: 'Item not found' }, { status: 404 });

    const body = await req.json();
    const updated = await updateItem(id, existing.vault_id, {
      name: body.name,
      content: body.content,
      parent_id: body.parent_id,
    });
    return NextResponse.json({ data: updated });
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
    const existing = await getItemForUser(id, user.userId);
    if (!existing) return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    await deleteItem(id, existing.vault_id);
    return NextResponse.json({ message: 'Deleted' });
  } catch (e) {
    if (e instanceof Error && e.message === 'UNAUTHORIZED')
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
