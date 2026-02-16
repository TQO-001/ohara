// ============================================================
// app/api/notes/vaults/[id]/export/route.ts
//
// GET /api/notes/vaults/:id/export
//
// Returns a JSON structure of the entire vault including all
// note content. The client downloads this as a .ohara.json file.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getVaultById, getItemsByVaultId } from '@/lib/db/queries/notes';
import sql from '@/lib/db';
import type { NotesItem } from '@/types';

type P = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: P) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const vault = await getVaultById(id, user.userId);
    if (!vault) {
      return NextResponse.json({ error: 'Vault not found' }, { status: 404 });
    }

    // Fetch all items including content (getItemsByVaultId omits content for perf,
    // so we query directly here for the export)
    const items = await sql<NotesItem[]>`
      SELECT id, vault_id, parent_id, name, item_type, content, created_at, updated_at
      FROM notes_items
      WHERE vault_id = ${id}
      ORDER BY item_type DESC, name ASC
    `;

    const exportData = {
      version: 1,
      exported_at: new Date().toISOString(),
      vault: {
        name: vault.name,
      },
      items: items.map(item => ({
        id:        item.id,
        parent_id: item.parent_id,
        name:      item.name,
        item_type: item.item_type,
        content:   item.content ?? '',
      })),
    };

    return NextResponse.json({ data: exportData });
  } catch (e) {
    if (e instanceof Error && e.message === 'UNAUTHORIZED')
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    console.error('[Export API Error]', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
