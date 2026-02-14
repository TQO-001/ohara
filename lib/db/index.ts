// ============================================================
// src/lib/db/index.ts — Database Connection
//
// WHY a singleton? We want ONE connection pool shared across
// the entire app. Creating a new pool per request would be
// slow and exhaust database connections quickly.
//
// The `postgres` package handles the pool automatically.
// ============================================================

import postgres from 'postgres';

// This check prevents running DB code in the browser bundle
if (typeof window !== 'undefined') {
  throw new Error('Database client cannot be used in the browser');
}

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// In development, Next.js hot-reloads the module on every change.
// Without this trick, each reload creates a NEW connection pool,
// eventually exhausting your PostgreSQL max_connections limit.
//
// We store the connection on the global object between reloads.
declare global {
  // eslint-disable-next-line no-var
  var __db: ReturnType<typeof postgres> | undefined;
}

let sql: ReturnType<typeof postgres>;

if (process.env.NODE_ENV === 'production') {
  // In production: always create a fresh connection
  sql = postgres(connectionString, {
    max: 10,        // Maximum 10 connections in the pool
    idle_timeout: 30, // Close idle connections after 30 seconds
    connect_timeout: 10, // Fail fast if DB is unreachable
  });
} else {
  // In development: reuse the existing connection across hot-reloads
  if (!global.__db) {
    global.__db = postgres(connectionString, {
      max: 5,
      idle_timeout: 30,
    });
  }
  sql = global.__db;
}

export default sql;
