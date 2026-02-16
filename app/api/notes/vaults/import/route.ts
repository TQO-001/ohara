// ============================================================
// app/api/notes/vaults/import/route.ts
//
// POST /api/notes/vaults/import
//
// Accepts a vault export JSON (from the export endpoint) and
// re-creates it as a new vault for the authenticated user.
// The old item IDs are remapped so there are no conflicts.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import sql from '@/lib/db';

interface ImportItem {
  id: string;        // OLD id from the export
  parent_id: string | null;  // OLD parent id
  name: string;
  item_type: 'file' | 'folder';
  content: string;
}

interface ImportBody {
  vault: { name: string };
  items: ImportItem[];
  version?: number;
}

export async function POST(req: NextRequest) {
  try {
    const user  = await requireAuth();
    const body: ImportBody = await req.json();

    if (!body?.vault?.name) {
      return NextResponse.json({ error: 'Invalid export file — missing vault name' }, { status: 400 });
    }

    const vaultName = `${body.vault.name} (imported)`;

    // Create the new vault
    const [newVault] = await sql`
      INSERT INTO notes_vaults (user_id, name)
      VALUES (${user.userId}, ${vaultName})
      RETURNING id, name, user_id, created_at, updated_at
    `;

    if (!body.items || body.items.length === 0) {
      return NextResponse.json({ data: newVault }, { status: 201 });
    }

    // ── Remap old IDs → new IDs ──────────────────────────────
    // We insert items in topological order (folders before children).
    // Build a map: oldId → newId as we go.

    const idMap = new Map<string, string>(); // oldId → newId

    // Sort: folders first, then files; root items first (no parent)
    const sorted = [...body.items].sort((a, b) => {
      // If a has no parent, it comes first
      if (!a.parent_id && b.parent_id) return -1;
      if (a.parent_id && !b.parent_id) return 1;
      // Folders before files
      if (a.item_type === 'folder' && b.item_type === 'file') return -1;
      if (a.item_type === 'file' && b.item_type === 'folder') return 1;
      return 0;
    });

    for (const item of sorted) {
      const newParentId = item.parent_id ? (idMap.get(item.parent_id) ?? null) : null;

      const [inserted] = await sql`
        INSERT INTO notes_items (vault_id, parent_id, name, item_type, content)
        VALUES (
          ${newVault.id},
          ${newParentId},
          ${item.name},
          ${item.item_type},
          ${item.content ?? ''}
        )
        RETURNING id
      `;

      idMap.set(item.id, inserted.id);
    }

    return NextResponse.json({
      data: {
        vault: newVault,
        itemCount: body.items.length,
      },
    }, { status: 201 });

  } catch (e) {
    if (e instanceof Error && e.message === 'UNAUTHORIZED')
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    console.error('[Import API Error]', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
