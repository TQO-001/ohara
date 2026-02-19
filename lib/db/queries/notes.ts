// ============================================================
// lib/db/queries/notes.ts — Notes SQL Queries (UPDATED)
// Added support for folder color field
// ============================================================

import sql from '@/lib/db';
import type { NotesVault, NotesItem } from '@/types';

// ── Vaults ───────────────────────────────────────────────────

export async function getVaultsByUserId(userId: string): Promise<NotesVault[]> {
  return sql<NotesVault[]>`
    SELECT id, user_id, name, created_at, updated_at
    FROM notes_vaults
    WHERE user_id = ${userId}
    ORDER BY name ASC
  `;
}

export async function getVaultById(id: string, userId: string): Promise<NotesVault | null> {
  const rows = await sql<NotesVault[]>`
    SELECT id, user_id, name, created_at, updated_at
    FROM notes_vaults
    WHERE id = ${id} AND user_id = ${userId}
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function createVault(userId: string, name: string): Promise<NotesVault> {
  const rows = await sql<NotesVault[]>`
    INSERT INTO notes_vaults (user_id, name)
    VALUES (${userId}, ${name})
    RETURNING id, user_id, name, created_at, updated_at
  `;
  return rows[0];
}

export async function updateVaultName(id: string, userId: string, name: string): Promise<NotesVault | null> {
  const rows = await sql<NotesVault[]>`
    UPDATE notes_vaults
    SET name = ${name}
    WHERE id = ${id} AND user_id = ${userId}
    RETURNING id, user_id, name, created_at, updated_at
  `;
  return rows[0] ?? null;
}

export async function deleteVault(id: string, userId: string): Promise<boolean> {
  const result = await sql`
    DELETE FROM notes_vaults WHERE id = ${id} AND user_id = ${userId}
  `;
  return result.count > 0;
}

// ── Notes Items ───────────────────────────────────────────────

/**
 * Get ALL items in a vault (flat list).
 * NOW INCLUDES COLOR FIELD.
 */
export async function getItemsByVaultId(vaultId: string): Promise<NotesItem[]> {
  return sql<NotesItem[]>`
    SELECT id, vault_id, parent_id, name, item_type, color, created_at, updated_at
    FROM notes_items
    WHERE vault_id = ${vaultId}
    ORDER BY item_type DESC, name ASC
  `;
}

/**
 * Get a single item WITH its content.
 * NOW INCLUDES COLOR FIELD.
 */
export async function getItemById(id: string, vaultId: string): Promise<NotesItem | null> {
  const rows = await sql<NotesItem[]>`
    SELECT id, vault_id, parent_id, name, item_type, content, color, created_at, updated_at
    FROM notes_items
    WHERE id = ${id} AND vault_id = ${vaultId}
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function createItem(
  vaultId: string,
  parentId: string | null,
  name: string,
  itemType: 'file' | 'folder',
  content?: string
): Promise<NotesItem> {
  const rows = await sql<NotesItem[]>`
    INSERT INTO notes_items (vault_id, parent_id, name, item_type, content)
    VALUES (
      ${vaultId},
      ${parentId ?? null},
      ${name},
      ${itemType},
      ${content ?? ''}
    )
    RETURNING id, vault_id, parent_id, name, item_type, content, color, created_at, updated_at
  `;
  return rows[0];
}

/**
 * Update item - NOW SUPPORTS COLOR FIELD
 */
export async function updateItem(
  id: string,
  vaultId: string,
  data: { 
    name?: string; 
    content?: string; 
    parent_id?: string | null;
    color?: string | null;  // NEW
  }
): Promise<NotesItem | null> {
  const rows = await sql<NotesItem[]>`
    UPDATE notes_items
    SET
      name      = COALESCE(${data.name ?? null}, name),
      content   = COALESCE(${data.content ?? null}, content),
      color     = CASE
                    WHEN ${data.color !== undefined} THEN ${data.color ?? null}
                    ELSE color
                  END,
      parent_id = CASE
                    WHEN ${data.parent_id !== undefined} THEN ${data.parent_id ?? null}
                    ELSE parent_id
                  END
    WHERE id = ${id} AND vault_id = ${vaultId}
    RETURNING id, vault_id, parent_id, name, item_type, content, color, created_at, updated_at
  `;
  return rows[0] ?? null;
}

export async function deleteItem(id: string, vaultId: string): Promise<boolean> {
  const result = await sql`
    DELETE FROM notes_items WHERE id = ${id} AND vault_id = ${vaultId}
  `;
  return result.count > 0;
}

/**
 * Build a nested tree from a flat list of items.
 */
export function buildItemTree(items: NotesItem[]): NotesItem[] {
  const map = new Map<string, NotesItem>();
  const roots: NotesItem[] = [];

  for (const item of items) {
    map.set(item.id, { ...item, children: item.item_type === 'folder' ? [] : undefined });
  }

  for (const item of map.values()) {
    if (item.parent_id) {
      const parent = map.get(item.parent_id);
      if (parent?.children) {
        parent.children.push(item);
      }
    } else {
      roots.push(item);
    }
  }

  return roots;
}
