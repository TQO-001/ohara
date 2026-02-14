// ============================================================
// src/app/api/projects/[slug]/route.ts
//
// GET    /api/projects/:slug  — get single project with files
// PATCH  /api/projects/:slug  — update project
// DELETE /api/projects/:slug  — delete project
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import {
  getProjectBySlug,
  updateProject,
  deleteProject,
} from '@/lib/db/queries/projects';

type RouteParams = { params: Promise<{ slug: string }> };

// ── GET /api/projects/:slug ───────────────────────────────────
export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const authUser = await requireAuth();
    const { slug } = await params;

    const project = await getProjectBySlug(authUser.userId, slug);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json({ data: project });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    console.error('[Project API Error]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── PATCH /api/projects/:slug ─────────────────────────────────
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const authUser = await requireAuth();
    const { slug } = await params;

    // First, get the project to confirm it belongs to this user
    const existing = await getProjectBySlug(authUser.userId, slug);
    if (!existing) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const body = await req.json();
    const updated = await updateProject(existing.id, authUser.userId, body);

    return NextResponse.json({ data: updated });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    console.error('[Project API Error]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── DELETE /api/projects/:slug ────────────────────────────────
export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  try {
    const authUser = await requireAuth();
    const { slug } = await params;

    const existing = await getProjectBySlug(authUser.userId, slug);
    if (!existing) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    await deleteProject(existing.id, authUser.userId);
    return NextResponse.json({ message: 'Project deleted' });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    console.error('[Project API Error]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
