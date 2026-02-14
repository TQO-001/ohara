// ============================================================
// src/lib/db/queries/notes.ts — Notes SQL Queries
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
 * The frontend/server will build the tree from this.
 */
export async function getItemsByVaultId(vaultId: string): Promise<NotesItem[]> {
  return sql<NotesItem[]>`
    SELECT id, vault_id, parent_id, name, item_type, created_at, updated_at
    FROM notes_items
    WHERE vault_id = ${vaultId}
    ORDER BY item_type DESC, name ASC
    -- Folders (DESC) come before files (ASC) alphabetically
  `;
}

/**
 * Get a single item WITH its content.
 */
export async function getItemById(id: string, vaultId: string): Promise<NotesItem | null> {
  const rows = await sql<NotesItem[]>`
    SELECT id, vault_id, parent_id, name, item_type, content, created_at, updated_at
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
    RETURNING id, vault_id, parent_id, name, item_type, content, created_at, updated_at
  `;
  return rows[0];
}

export async function updateItem(
  id: string,
  vaultId: string,
  data: { name?: string; content?: string; parent_id?: string | null }
): Promise<NotesItem | null> {
  const rows = await sql<NotesItem[]>`
    UPDATE notes_items
    SET
      name      = COALESCE(${data.name ?? null}, name),
      content   = COALESCE(${data.content ?? null}, content),
      parent_id = CASE
                    WHEN ${data.parent_id !== undefined} THEN ${data.parent_id ?? null}
                    ELSE parent_id
                  END
    WHERE id = ${id} AND vault_id = ${vaultId}
    RETURNING id, vault_id, parent_id, name, item_type, content, created_at, updated_at
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
 * Used to send the vault structure to the frontend as a tree.
 */
export function buildItemTree(items: NotesItem[]): NotesItem[] {
  const map = new Map<string, NotesItem>();
  const roots: NotesItem[] = [];

  // First pass: create a map of id -> item, init children arrays on folders
  for (const item of items) {
    map.set(item.id, { ...item, children: item.item_type === 'folder' ? [] : undefined });
  }

  // Second pass: attach children to their parents
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
