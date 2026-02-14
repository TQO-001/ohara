// ============================================================
// src/app/(dashboard)/dashboard/page.tsx
// 
// This is a Server Component — it fetches data directly on the
// server without needing a client-side fetch() call.
// ============================================================

import { getAuthUser } from '@/lib/auth';
import { getProjectsByUserId } from '@/lib/db/queries/projects';
import { getVaultsByUserId } from '@/lib/db/queries/notes';
import Link from 'next/link';
import { FolderOpen, BookOpen, Plus } from 'lucide-react';

export default async function DashboardPage() {
  const user = await getAuthUser();
  if (!user) return null;

  // Fetch data directly on the server — fast, no loading spinners needed
  const [projects, vaults] = await Promise.all([
    getProjectsByUserId(user.userId),
    getVaultsByUserId(user.userId),
  ]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {greeting}, {user.name.split(' ')[0]} 👋
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Here's what's in your workspace
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <FolderOpen className="text-blue-600 dark:text-blue-400" size={20} />
            </div>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Projects</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{projects.length}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <BookOpen className="text-purple-600 dark:text-purple-400" size={20} />
            </div>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Note Vaults</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{vaults.length}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/projects/new"
          className="flex items-center gap-3 p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors"
        >
          <Plus size={20} />
          <span className="font-semibold">New Project</span>
        </Link>
        <Link
          href="/notes"
          className="flex items-center gap-3 p-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors"
        >
          <BookOpen size={20} />
          <span className="font-semibold">Open Notes</span>
        </Link>
      </div>

      {/* Recent Projects */}
      {projects.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Recent Projects</h2>
            <Link href="/projects" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.slice(0, 6).map(project => (
              <Link
                key={project.id}
                href={`/projects/${project.slug}`}
                className="block bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
              >
                <h3 className="font-semibold text-gray-900 dark:text-white truncate">{project.name}</h3>
                {project.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                    {project.description}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-3">
                  <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full">
                    {project.project_type}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
