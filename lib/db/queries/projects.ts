// ============================================================
// src/lib/db/queries/projects.ts — Project SQL Queries
// ============================================================

import sql from '@/lib/db';
import type { Project, ProjectFile, CreateProjectRequest } from '@/types';

/**
 * Get all projects for a user (without files attached).
 */
export async function getProjectsByUserId(userId: string): Promise<Project[]> {
  return sql<Project[]>`
    SELECT id, user_id, name, slug, description, project_type,
           demo_type, demo_url, upload_method, github_url,
           created_at, updated_at
    FROM projects
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
  `;
}

/**
 * Get a single project by slug, with its files.
 */
export async function getProjectBySlug(userId: string, slug: string): Promise<Project | null> {
  const projects = await sql<Project[]>`
    SELECT id, user_id, name, slug, description, project_type,
           demo_type, demo_url, upload_method, github_url,
           created_at, updated_at
    FROM projects
    WHERE user_id = ${userId} AND slug = ${slug}
    LIMIT 1
  `;

  if (!projects[0]) return null;

  const project = projects[0];

  // Fetch associated files
  const files = await sql<ProjectFile[]>`
    SELECT id, project_id, original_name, storage_path, file_size, mime_type, created_at
    FROM project_files
    WHERE project_id = ${project.id}
    ORDER BY created_at DESC
  `;

  return { ...project, files };
}

/**
 * Get a project by its ID.
 */
export async function getProjectById(id: string): Promise<Project | null> {
  const rows = await sql<Project[]>`
    SELECT id, user_id, name, slug, description, project_type,
           demo_type, demo_url, upload_method, github_url,
           created_at, updated_at
    FROM projects
    WHERE id = ${id}
    LIMIT 1
  `;
  return rows[0] ?? null;
}

/**
 * Create a new project.
 */
export async function createProject(
  userId: string,
  data: CreateProjectRequest
): Promise<Project> {
  const rows = await sql<Project[]>`
    INSERT INTO projects (user_id, name, slug, description, project_type, demo_type, upload_method, github_url)
    VALUES (
      ${userId},
      ${data.name},
      ${data.slug},
      ${data.description ?? null},
      ${data.project_type},
      ${data.demo_type},
      ${data.upload_method},
      ${data.github_url ?? null}
    )
    RETURNING id, user_id, name, slug, description, project_type,
              demo_type, demo_url, upload_method, github_url,
              created_at, updated_at
  `;
  return rows[0];
}

/**
 * Update project demo URL (after file upload).
 */
export async function updateProjectDemoUrl(id: string, demoUrl: string): Promise<void> {
  await sql`
    UPDATE projects SET demo_url = ${demoUrl} WHERE id = ${id}
  `;
}

/**
 * Update a project's details.
 * Only updates fields that are provided.
 */
export async function updateProject(
  id: string,
  userId: string,
  data: Partial<CreateProjectRequest>
): Promise<Project | null> {
  // Build dynamic SET clause — only update provided fields
  const updates: string[] = [];
  const values: unknown[] = [];

  if (data.name !== undefined) { updates.push(`name = $${updates.length + 1}`); values.push(data.name); }
  if (data.description !== undefined) { updates.push(`description = $${updates.length + 1}`); values.push(data.description); }
  if (data.project_type !== undefined) { updates.push(`project_type = $${updates.length + 1}`); values.push(data.project_type); }
  if (data.demo_type !== undefined) { updates.push(`demo_type = $${updates.length + 1}`); values.push(data.demo_type); }
  if (data.github_url !== undefined) { updates.push(`github_url = $${updates.length + 1}`); values.push(data.github_url); }

  if (updates.length === 0) return getProjectById(id);

  // For partial updates with dynamic fields, we use a raw query
  const result = await sql<Project[]>`
    UPDATE projects
    SET ${sql.unsafe(updates.join(', '))}
    WHERE id = ${id} AND user_id = ${userId}
    RETURNING id, user_id, name, slug, description, project_type,
              demo_type, demo_url, upload_method, github_url,
              created_at, updated_at
  `;
  return result[0] ?? null;
}

/**
 * Delete a project (cascade deletes project_files too via DB constraint).
 */
export async function deleteProject(id: string, userId: string): Promise<boolean> {
  const result = await sql`
    DELETE FROM projects WHERE id = ${id} AND user_id = ${userId}
  `;
  return result.count > 0;
}

/**
 * Add a file record to a project.
 */
export async function addProjectFile(
  projectId: string,
  originalName: string,
  storagePath: string,
  fileSize: number,
  mimeType: string | null
): Promise<ProjectFile> {
  const rows = await sql<ProjectFile[]>`
    INSERT INTO project_files (project_id, original_name, storage_path, file_size, mime_type)
    VALUES (${projectId}, ${originalName}, ${storagePath}, ${fileSize}, ${mimeType})
    RETURNING id, project_id, original_name, storage_path, file_size, mime_type, created_at
  `;
  return rows[0];
}

/**
 * Delete a project file record (and you should also delete the file from disk).
 */
export async function deleteProjectFile(fileId: string, projectId: string): Promise<boolean> {
  const result = await sql`
    DELETE FROM project_files WHERE id = ${fileId} AND project_id = ${projectId}
  `;
  return result.count > 0;
}
