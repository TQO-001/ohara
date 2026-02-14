// ============================================================
// src/app/api/projects/route.ts
//
// GET    /api/projects        — list all projects for user
// POST   /api/projects        — create a project
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import {
  getProjectsByUserId,
  createProject,
} from '@/lib/db/queries/projects';
import type { CreateProjectRequest } from '@/types';

// ── GET /api/projects ─────────────────────────────────────────
export async function GET() {
  try {
    const authUser = await requireAuth();
    const projects = await getProjectsByUserId(authUser.userId);
    return NextResponse.json({ data: projects });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    console.error('[Projects API Error]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── POST /api/projects ────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const authUser = await requireAuth();
    const body: CreateProjectRequest = await req.json();

    // Validate required fields
    if (!body.name || !body.slug) {
      return NextResponse.json(
        { error: 'Name and slug are required' },
        { status: 400 }
      );
    }

    // Sanitize slug: only lowercase letters, numbers, hyphens
    const slug = body.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-');

    const project = await createProject(authUser.userId, { ...body, slug });
    return NextResponse.json({ data: project }, { status: 201 });

  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    // Unique constraint violation (duplicate slug for this user)
    if (error instanceof Error && error.message.includes('unique')) {
      return NextResponse.json(
        { error: 'A project with this slug already exists' },
        { status: 409 }
      );
    }
    console.error('[Projects API Error]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
