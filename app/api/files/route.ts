// ============================================================
// src/app/api/files/route.ts
//
// POST /api/files?projectId=xxx&type=demo|project
//   — Upload a file for a project
//
// The file is saved to disk at UPLOAD_DIR/projects/{projectId}/
// The metadata (path, size, name) is saved to the database.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { requireAuth } from '@/lib/auth';
import { getProjectById, addProjectFile, updateProjectDemoUrl } from '@/lib/db/queries/projects';

// The base directory where uploads are stored.
// In production this is /var/www/ohara/uploads
// In development it falls back to ./uploads (in the project root)
const UPLOAD_DIR = process.env.UPLOAD_DIR ?? path.join(process.cwd(), 'uploads');

// Next.js needs this to allow file uploads (disables default body parser)
export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: NextRequest) {
  try {
    const authUser = await requireAuth();

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');
    const fileType = searchParams.get('type') ?? 'project'; // 'demo' | 'project'

    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }

    // Verify the project belongs to this user
    const project = await getProjectById(projectId);
    if (!project || project.user_id !== authUser.userId) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Parse the multipart form data
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file size (100MB max)
    const MAX_SIZE = 100 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File too large (max 100MB)' }, { status: 413 });
    }

    // Create the upload directory if it doesn't exist
    const uploadDir = path.join(UPLOAD_DIR, 'projects', projectId);
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Generate a unique filename to avoid collisions
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileName = `${timestamp}_${safeName}`;
    const filePath = path.join(uploadDir, fileName);

    // Write the file to disk
    const bytes = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(bytes));

    // The relative path we store in the DB (relative to UPLOAD_DIR)
    const storagePath = path.join('projects', projectId, fileName);

    // The public URL path for serving the file
    const publicUrl = `/uploads/${storagePath}`;

    if (fileType === 'demo') {
      // For demo files (screenshots/videos), update the project's demo_url
      await updateProjectDemoUrl(projectId, publicUrl);
      return NextResponse.json({
        data: {
          url: publicUrl,
          message: 'Demo file uploaded',
        },
      });
    } else {
      // For project files (ZIP, etc.), store in project_files table
      const fileRecord = await addProjectFile(
        projectId,
        file.name,
        storagePath,
        file.size,
        file.type || null
      );
      return NextResponse.json({ data: fileRecord }, { status: 201 });
    }

  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    console.error('[Files API Error]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
