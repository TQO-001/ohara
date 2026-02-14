-- ============================================================
-- Ohara Database Schema — Migration 001: Initial Setup
-- Run: psql -U postgres -d ohara -f migrations/001_initial.sql
-- ============================================================

-- Enable UUID extension (lets us use uuid_generate_v4())
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email       TEXT UNIQUE NOT NULL,
  -- password is stored as a bcrypt hash, NEVER plain text
  password_hash TEXT NOT NULL,
  name        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PROJECTS
-- ============================================================
CREATE TABLE IF NOT EXISTS projects (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  -- slug is the URL-safe version: "My App" -> "my-app"
  slug          TEXT NOT NULL,
  description   TEXT,
  project_type  TEXT NOT NULL DEFAULT 'nextjs',  -- nextjs, react, html, etc.
  demo_type     TEXT NOT NULL DEFAULT 'image',   -- image, gif, video
  -- demo_url can be a relative path to the uploaded file or an external URL
  demo_url      TEXT,
  upload_method TEXT DEFAULT 'zip',              -- zip, github
  github_url    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Each user can only have one project with a given slug
  UNIQUE(user_id, slug)
);

-- ============================================================
-- PROJECT FILES
-- We store the FILE METADATA here.
-- The actual file bytes live on disk at UPLOAD_DIR.
-- ============================================================
CREATE TABLE IF NOT EXISTS project_files (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id   UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  -- original filename the user uploaded
  original_name TEXT NOT NULL,
  -- path on disk, relative to UPLOAD_DIR (e.g. "projects/uuid/file.zip")
  storage_path  TEXT NOT NULL,
  file_size     BIGINT NOT NULL DEFAULT 0,  -- bytes
  mime_type     TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- NOTES — VAULTS
-- A vault is like a notebook or a top-level folder.
-- ============================================================
CREATE TABLE IF NOT EXISTS notes_vaults (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- NOTES — FILES
-- Individual markdown notes, nested inside vaults.
-- parent_id allows folder nesting (NULL = top-level).
-- ============================================================
CREATE TABLE IF NOT EXISTS notes_items (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vault_id   UUID NOT NULL REFERENCES notes_vaults(id) ON DELETE CASCADE,
  -- parent_id points to another notes_item of type 'folder', or NULL for root
  parent_id  UUID REFERENCES notes_items(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  -- 'file' or 'folder'
  item_type  TEXT NOT NULL CHECK (item_type IN ('file', 'folder')),
  -- only populated for item_type = 'file'
  content    TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES — Speed up common queries
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_project_files_project_id ON project_files(project_id);
CREATE INDEX IF NOT EXISTS idx_notes_vaults_user_id ON notes_vaults(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_items_vault_id ON notes_items(vault_id);
CREATE INDEX IF NOT EXISTS idx_notes_items_parent_id ON notes_items(parent_id);

-- ============================================================
-- AUTO-UPDATE updated_at TRIGGER
-- Automatically sets updated_at = NOW() on every UPDATE
-- ============================================================
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_users
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_projects
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_notes_vaults
  BEFORE UPDATE ON notes_vaults
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_notes_items
  BEFORE UPDATE ON notes_items
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================
-- SEED: Default admin user
-- Password: changeme123 (bcrypt hash below)
-- CHANGE THIS IMMEDIATELY IN PRODUCTION
-- ============================================================
INSERT INTO users (email, password_hash, name)
VALUES (
  'admin@ohara.local',
  '$2b$10$K.0HwpsoPDGaB/atFBmmXOGTw4ceeg33.WrxJx/FeC9.aNKxkiYV2',
  'Admin'
) ON CONFLICT (email) DO NOTHING;
