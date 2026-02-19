// ============================================================
// src/types/index.ts — ALL shared TypeScript interfaces
//
// WHY: Centralizing types means the same shape is used in:
//   - API routes (server-side)
//   - React components (client-side)
//   - Future mobile app (just import from here)
// ============================================================

// ── Users ────────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
  updated_at: string;
  // NOTE: password_hash is NEVER included here — we never send it to the client
}

// The shape of a decoded JWT token
export interface JWTPayload {
  userId: string;
  email: string;
  name: string;
  iat: number;  // issued at (unix timestamp)
  exp: number;  // expires at (unix timestamp)
}

// ── Projects ─────────────────────────────────────────────────
export type ProjectType = 'nextjs' | 'react' | 'html' | 'expo' | 'vue' | 'angular' | 'svelte';
export type DemoType = 'image' | 'gif' | 'video';
export type UploadMethod = 'zip' | 'github';

export interface Project {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  description: string | null;
  project_type: ProjectType;
  demo_type: DemoType;
  demo_url: string | null;
  upload_method: UploadMethod;
  github_url: string | null;
  created_at: string;
  updated_at: string;
  // Joined field — files attached to this project
  files?: ProjectFile[];
}

export interface ProjectFile {
  id: string;
  project_id: string;
  original_name: string;
  storage_path: string;
  file_size: number;
  mime_type: string | null;
  created_at: string;
}

// ── Notes ────────────────────────────────────────────────────
export interface NotesVault {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
  items?: NotesItem[];  // Populated when fetching vault with contents
}

export type NotesItemType = 'file' | 'folder';

export interface NotesItem {
  id: string;
  vault_id: string;
  parent_id: string | null;
  name: string;
  item_type: NotesItemType;
  content?: string;  // Only present for files
  created_at: string;
  updated_at: string;
  color?: string;
  children?: NotesItem[];  // Populated when building tree (folders only)
}

// ── API Request/Response shapes ───────────────────────────────
// These are the shapes your frontend sends and receives

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
}

export interface CreateProjectRequest {
  name: string;
  slug: string;
  description?: string;
  project_type: ProjectType;
  demo_type: DemoType;
  github_url?: string;
  upload_method: UploadMethod;
}

export interface CreateVaultRequest {
  name: string;
}

export interface CreateNotesItemRequest {
  vault_id: string;
  parent_id?: string;
  name: string;
  item_type: NotesItemType;
  content?: string;
}

export interface UpdateNotesItemRequest {
  name?: string;
  content?: string;
  parent_id?: string;
}
