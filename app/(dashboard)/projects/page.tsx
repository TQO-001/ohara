'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  FolderOpen, Plus, Trash2, ExternalLink, Github, X,
  AlertCircle, Loader2, Globe, Code, FileCode, Layers,
  Search, Sparkles, TrendingUp, Clock, Star, Filter
} from 'lucide-react';
import type { Project, ProjectType, DemoType, UploadMethod } from '@/types';

// ── helpers ──────────────────────────────────────────────────

function toSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

const TYPE_ICONS: Record<ProjectType, React.ReactNode> = {
  nextjs:   <Code size={14} />,
  react:    <Code size={14} />,
  html:     <FileCode size={14} />,
  expo:     <Layers size={14} />,
  vue:      <Code size={14} />,
  angular:  <Code size={14} />,
  svelte:   <Code size={14} />,
};

const TYPE_COLORS: Record<ProjectType, string> = {
  nextjs:   'from-black to-gray-800',
  react:    'from-cyan-500 to-blue-600',
  html:     'from-orange-500 to-red-600',
  expo:     'from-blue-400 to-purple-600',
  vue:      'from-green-400 to-emerald-600',
  angular:  'from-red-500 to-pink-600',
  svelte:   'from-orange-400 to-red-500',
};

// ── Modal ────────────────────────────────────────────────────

function NewProjectModal({ onClose, onCreated }: {
  onClose: () => void;
  onCreated: (p: Project) => void;
}) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [projectType, setProjectType] = useState<ProjectType>('nextjs');
  const [demoType, setDemoType] = useState<DemoType>('image');
  const [uploadMethod, setUploadMethod] = useState<UploadMethod>('zip');
  const [githubUrl, setGithubUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);

  useEffect(() => {
    if (!slugEdited) setSlug(toSlug(name));
  }, [name, slugEdited]);

  async function handleCreate() {
    if (!name.trim()) { setError('Project name is required'); return; }
    if (!slug.trim()) { setError('Slug is required'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim(),
          description: description.trim() || undefined,
          project_type: projectType,
          demo_type: demoType,
          upload_method: uploadMethod,
          github_url: githubUrl.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || 'Failed to create project'); return; }
      onCreated(json.data);
    } catch {
      setError('Network error — please try again');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#0a0a0a]/98 border border-white/10 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Enhanced Header with gradient accent */}
        <div className="relative flex items-center justify-between p-6 border-b border-white/5 bg-gradient-to-r from-purple-500/5 via-transparent to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-500/10 rounded-xl border border-purple-500/20">
              <Sparkles className="text-purple-400" size={20} />
            </div>
            <div>
              <h2 className="text-[16px] font-bold text-white uppercase tracking-widest">New Project</h2>
              <p className="text-[11px] text-gray-500 font-medium">Initialize a new deployment instance</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2.5 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-all active:scale-95">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-[13px] font-medium backdrop-blur-sm">
              <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
              <div>{error}</div>
            </div>
          )}

          <div className="space-y-5">
            {/* Project Name */}
            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Project Name</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-[15px] focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/30 transition-all placeholder:text-gray-600"
                placeholder="e.g. Quantum Interface"
              />
            </div>

            {/* Slug */}
            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Slug</label>
              <input
                value={slug}
                onChange={e => { setSlug(toSlug(e.target.value)); setSlugEdited(true); }}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-[14px] font-mono focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/30 transition-all placeholder:text-gray-600"
                placeholder="project-slug"
              />
            </div>

            {/* Description - NEW ADDITION */}
            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Description (Optional)</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-[14px] focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/30 transition-all resize-none placeholder:text-gray-600"
                placeholder="Brief description of your project..."
              />
            </div>

            {/* Project Type and Demo Type Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Project Type</label>
                <select
                  value={projectType}
                  onChange={e => setProjectType(e.target.value as ProjectType)}
                  className="w-full px-4 py-3 bg-[#1a1a1a] border border-white/10 rounded-xl text-white text-[13px] focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all cursor-pointer"
                >
                  {(['nextjs','react','html','expo','vue','angular','svelte'] as ProjectType[]).map(t => (
                    <option key={t} value={t} className="bg-[#1a1a1a]">{t}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Demo Type</label>
                <select
                  value={demoType}
                  onChange={e => setDemoType(e.target.value as DemoType)}
                  className="w-full px-4 py-3 bg-[#1a1a1a] border border-white/10 rounded-xl text-white text-[13px] focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all cursor-pointer"
                >
                  <option value="image" className="bg-[#1a1a1a]">Image</option>
                  <option value="gif" className="bg-[#1a1a1a]">GIF</option>
                  <option value="video" className="bg-[#1a1a1a]">Video</option>
                </select>
              </div>
            </div>

            {/* Upload Method */}
            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Upload Method</label>
              <div className="flex gap-3">
                {(['zip', 'github'] as UploadMethod[]).map(m => (
                  <button
                    key={m}
                    onClick={() => setUploadMethod(m)}
                    className={`flex-1 py-3 rounded-xl text-[12px] font-bold transition-all border ${
                      uploadMethod === m
                        ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-600/20'
                        : 'bg-white/5 border-white/10 text-gray-500 hover:text-gray-300 hover:border-white/20'
                    }`}
                  >
                    {m.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* GitHub URL - conditional */}
            {uploadMethod === 'github' && (
              <div className="space-y-2 animate-in slide-in-from-top-2 fade-in duration-200">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Github Repository</label>
                <div className="relative">
                  <Github className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                  <input
                    value={githubUrl}
                    onChange={e => setGithubUrl(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-[14px] focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/30 transition-all placeholder:text-gray-600"
                    placeholder="https://github.com/username/repo"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Footer */}
        <div className="p-6 border-t border-white/5 bg-gradient-to-b from-transparent to-white/5 flex items-center justify-between gap-3">
          <div className="text-[11px] text-gray-500 font-medium">
            All fields can be edited later
          </div>
          <div className="flex gap-3">
            <button 
              onClick={onClose} 
              className="px-5 py-2.5 text-[13px] font-semibold text-gray-400 hover:text-white transition-all rounded-xl hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white rounded-xl text-[13px] font-bold transition-all shadow-lg shadow-purple-900/30 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Initializing...
                </>
              ) : (
                <>
                  <Plus size={16} />
                  Initialize Project
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Enhanced ProjectCard ───────────────────────────────────────────────

function ProjectCard({ project, onDelete }: {
  project: Project;
  onDelete: (id: string) => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  async function handleDelete() {
    if (!confirm(`Delete "${project.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await fetch(`/api/projects/${project.slug}`, { method: 'DELETE' });
      onDelete(project.id);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div 
      className="group bg-gradient-to-br from-[#121212]/60 to-[#0a0a0a]/60 backdrop-blur-md border border-white/5 rounded-2xl p-6 hover:border-purple-500/40 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/10 relative overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Animated gradient background */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/5 blur-[80px] pointer-events-none group-hover:bg-purple-500/15 transition-all duration-500" />
      <div className={`absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr ${TYPE_COLORS[project.project_type]} opacity-5 blur-[60px] pointer-events-none group-hover:opacity-10 transition-all duration-500`} />

      {/* Header with title and delete */}
      <div className="flex items-start justify-between mb-4 relative z-10">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-bold text-white group-hover:text-purple-400 transition-colors truncate">
              {project.name}
            </h3>
            {isHovered && (
              <Star size={14} className="text-purple-400 animate-in zoom-in duration-200" />
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-gradient-to-r ${TYPE_COLORS[project.project_type]} bg-opacity-10 border border-white/10`}>
              {TYPE_ICONS[project.project_type]}
              <span className="text-[11px] font-bold text-white/90 uppercase tracking-wider">
                {project.project_type}
              </span>
            </span>
          </div>
        </div>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="p-2 text-gray-600 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all opacity-0 group-hover:opacity-100 border border-transparent hover:border-red-400/20"
        >
          {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
        </button>
      </div>

      {/* Description */}
      {project.description && (
        <p className="text-[13px] text-gray-400 line-clamp-2 mb-6 font-medium leading-relaxed relative z-10">
          {project.description}
        </p>
      )}

      {/* Footer with meta and actions */}
      <div className="flex items-center justify-between mt-auto relative z-10">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-tighter bg-white/5 text-gray-400 px-2.5 py-1.5 rounded-lg border border-white/10">
            <Globe size={12} />
            {project.demo_type}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {project.github_url && (
            <a 
              href={project.github_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-2 rounded-xl text-gray-500 hover:text-white hover:bg-white/10 transition-all border border-transparent hover:border-white/10"
            >
              <Github size={18} />
            </a>
          )}
          <a 
            href={`/projects/${project.slug}`} 
            className="p-2 rounded-xl text-purple-400 hover:text-white hover:bg-purple-500/20 transition-all border border-transparent hover:border-purple-500/30"
          >
            <ExternalLink size={18} />
          </a>
        </div>
      </div>

      {/* Hover effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl" />
    </div>
  );
}

// ── Main Enhanced Page ────────────────────────────────────────────────

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const loadProjects = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/projects');
      const json = await res.json();
      setProjects(json.data ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadProjects(); }, [loadProjects]);

  function handleCreated(project: Project) {
    setProjects(prev => [project, ...prev]);
    setShowModal(false);
  }

  function handleDeleted(id: string) {
    setProjects(prev => prev.filter(p => p.id !== id));
  }

  const filtered = projects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.description?.toLowerCase().includes(search.toLowerCase()) ||
    p.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Enhanced Header Section */}
      <div className="relative">
        {/* Background glow */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-500/10 blur-[120px] pointer-events-none -z-10" />
        
        <div className="flex items-end justify-between gap-4 flex-wrap pb-6 border-b border-white/5">
          <div className="space-y-2">
            <h1 className="text-5xl font-black uppercase tracking-tight text-white flex items-center gap-4">
              <div className="p-4 bg-gradient-to-br from-purple-500/20 to-purple-600/10 rounded-2xl border border-purple-500/20 shadow-lg shadow-purple-500/10">
                <Layers className="text-purple-400" size={36} />
              </div>
              <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                Projects
              </span>
            </h1>
            <div className="flex items-center gap-4 ml-[100px]">
              <p className="text-[13px] font-medium text-gray-500">
                {projects.length === 0 ? 'No active deployments' : `Managing ${projects.length} deployment instance${projects.length !== 1 ? 's' : ''}`}
              </p>
              {projects.length > 0 && (
                <div className="flex items-center gap-2 text-[11px] text-gray-600">
                  <TrendingUp size={14} className="text-green-500" />
                  <span>All systems operational</span>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white rounded-2xl font-bold text-[13px] uppercase tracking-wider transition-all shadow-xl shadow-purple-900/30 active:scale-95 border border-purple-400/20"
          >
            <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
            New Deployment
          </button>
        </div>
      </div>

      {/* Enhanced Filter & Content */}
      <div className="space-y-6">
        {projects.length > 0 && (
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-400 transition-colors" size={18} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search projects by name, slug, or description..."
                className="w-full pl-12 pr-5 py-3.5 bg-[#121212] border border-white/5 rounded-2xl text-[13px] font-medium text-white focus:outline-none focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/5 transition-all placeholder:text-gray-600"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-white/10 text-gray-500 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            
            {/* View mode toggle - NEW ADDITION */}
            <div className="flex items-center gap-2 p-1 bg-[#121212] border border-white/5 rounded-xl">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'grid' 
                    ? 'bg-purple-500/20 text-purple-400' 
                    : 'text-gray-600 hover:text-gray-400'
                }`}
              >
                <Layers size={18} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'list' 
                    ? 'bg-purple-500/20 text-purple-400' 
                    : 'text-gray-600 hover:text-gray-400'
                }`}
              >
                <Filter size={18} />
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <div className="relative">
              <Loader2 className="animate-spin text-purple-500" size={48} />
              <div className="absolute inset-0 bg-purple-500/20 blur-xl animate-pulse" />
            </div>
            <p className="text-[11px] font-bold text-gray-600 uppercase tracking-[0.2em]">Synchronizing Data</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center bg-gradient-to-br from-[#121212]/40 to-[#0a0a0a]/40 border border-dashed border-white/5 rounded-[2rem] backdrop-blur-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 blur-[100px]" />
            <div className="relative z-10">
              <div className="p-8 bg-white/5 rounded-full mb-6 border border-white/5">
                <FolderOpen size={56} className="text-gray-700" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">
                {search ? 'No results found' : 'Workspace is empty'}
              </h3>
              <p className="text-[13px] text-gray-500 mb-8 max-w-md leading-relaxed">
                {search 
                  ? 'Try adjusting your search filters or clear the search to see all projects.' 
                  : 'Deploy your first project to begin tracking performance, analytics, and deployment metrics.'}
              </p>
              {!search && (
                <button
                  onClick={() => setShowModal(true)}
                  className="inline-flex items-center gap-2 text-[12px] font-black text-purple-400 hover:text-white uppercase tracking-widest transition-colors group"
                >
                  Initialize Workspace 
                  <ExternalLink size={14} className="group-hover:translate-x-1 transition-transform" />
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className={`grid gap-6 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' 
              : 'grid-cols-1'
          }`}>
            {filtered.map(project => (
              <ProjectCard
                key={project.id}
                project={project}
                onDelete={handleDeleted}
              />
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <NewProjectModal
          onClose={() => setShowModal(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}