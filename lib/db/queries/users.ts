// ============================================================
// src/lib/db/queries/users.ts — User SQL Queries
//
// Each function is a self-contained unit: takes parameters,
// runs one or more SQL statements, returns typed results.
// ============================================================

import sql from '@/lib/db';
import type { User } from '@/types';

/**
 * Find a user by their email address.
 * Returns null if not found.
 * NOTE: This returns password_hash — only use this for login!
 */
export async function getUserByEmail(email: string): Promise<(User & { password_hash: string }) | null> {
  const rows = await sql<(User & { password_hash: string })[]>`
    SELECT id, email, name, password_hash, created_at, updated_at
    FROM users
    WHERE email = ${email.toLowerCase().trim()}
    LIMIT 1
  `;
  return rows[0] ?? null;
}

/**
 * Find a user by their ID.
 * Returns null if not found. Does NOT return password_hash.
 */
export async function getUserById(id: string): Promise<User | null> {
  const rows = await sql<User[]>`
    SELECT id, email, name, created_at, updated_at
    FROM users
    WHERE id = ${id}
    LIMIT 1
  `;
  return rows[0] ?? null;
}

/**
 * Create a new user.
 * The password must already be hashed before calling this!
 */
export async function createUser(
  email: string,
  passwordHash: string,
  name: string
): Promise<User> {
  const rows = await sql<User[]>`
    INSERT INTO users (email, password_hash, name)
    VALUES (${email.toLowerCase().trim()}, ${passwordHash}, ${name})
    RETURNING id, email, name, created_at, updated_at
  `;
  return rows[0];
}

/**
 * Update a user's name.
 */
export async function updateUserName(id: string, name: string): Promise<User | null> {
  const rows = await sql<User[]>`
    UPDATE users
    SET name = ${name}
    WHERE id = ${id}
    RETURNING id, email, name, created_at, updated_at
  `;
  return rows[0] ?? null;
}

/**
 * Update a user's password (provide pre-hashed password).
 */
export async function updateUserPassword(id: string, passwordHash: string): Promise<void> {
  await sql`
    UPDATE users
    SET password_hash = ${passwordHash}
    WHERE id = ${id}
  `;
}
