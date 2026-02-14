import { getAuthUser } from '@/lib/auth';
import { getProjectsByUserId } from '@/lib/db/queries/projects';
import { getVaultsByUserId } from '@/lib/db/queries/notes';
import Link from 'next/link';
import Image from 'next/image';
import { 
  FolderOpen, BookOpen, Plus, ArrowRight, Sparkles, 
  TrendingUp, Clock, Star, Zap, Globe, Code
} from 'lucide-react';

export default async function DashboardPage() {
  const user = await getAuthUser();
  if (!user) return null;

  const [projects, vaults] = await Promise.all([
    getProjectsByUserId(user.userId),
    getVaultsByUserId(user.userId),
  ]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans antialiased">
      {/* Ambient Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 blur-[150px] rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/5 blur-[150px] rounded-full" />
      </div>

      <div className="relative max-w-6xl mx-auto px-6 py-12 space-y-12">

        {/* Enhanced Header Section */}
        <div className="flex flex-col items-start gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-bold tracking-tight">
                {greeting}, <span className="bg-gradient-to-r from-purple-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">{user.name.split(' ')[0]}</span>
              </h1>
              <div className="text-3xl animate-in zoom-in duration-500 delay-300">👋</div>
            </div>
            <p className="text-gray-400 text-sm font-medium flex items-center gap-2">
              Welcome back to your workspace
              <span className="inline-flex items-center gap-1 text-[10px] bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full border border-green-500/20">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                Online
              </span>
            </p>
          </div>
        </div>

        {/* Enhanced Quick Stats - Glassmorphism Style */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
          {/* Projects Card */}
          <div className="relative group overflow-hidden bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-6 transition-all duration-300 hover:bg-white/[0.08] hover:border-purple-500/40 hover:shadow-2xl hover:shadow-purple-500/10 hover:-translate-y-1">
            <div className="flex items-center justify-between relative z-10">
              <div className="space-y-2">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Active Projects</p>
                <p className="text-5xl font-bold tracking-tight bg-gradient-to-br from-white to-gray-400 bg-clip-text text-transparent">
                  {projects.length}
                </p>
                <div className="flex items-center gap-2 text-[11px] text-green-400 font-semibold">
                  <TrendingUp size={12} />
                  <span>All systems operational</span>
                </div>
              </div>
              <div className="p-4 bg-gradient-to-br from-purple-600/30 to-purple-600/10 rounded-2xl border border-purple-500/30 shadow-lg shadow-purple-500/20 group-hover:scale-110 transition-transform duration-300">
                <FolderOpen className="text-purple-300" size={28} />
              </div>
            </div>
            {/* Enhanced Gradient Glow */}
            <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-purple-600/20 blur-[60px] rounded-full group-hover:bg-purple-600/30 transition-all duration-500" />
            <div className="absolute -left-4 -top-4 w-24 h-24 bg-purple-400/10 blur-[40px] rounded-full" />
            
            {/* Animated Border */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/0 via-purple-500/50 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" 
                 style={{ 
                   mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                   maskComposite: 'exclude',
                   padding: '1px'
                 }} 
            />
          </div>

          {/* Vaults Card */}
          <div className="relative group overflow-hidden bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-6 transition-all duration-300 hover:bg-white/[0.08] hover:border-purple-500/40 hover:shadow-2xl hover:shadow-purple-500/10 hover:-translate-y-1">
            <div className="flex items-center justify-between relative z-10">
              <div className="space-y-2">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Personal Vaults</p>
                <p className="text-5xl font-bold tracking-tight bg-gradient-to-br from-white to-gray-400 bg-clip-text text-transparent">
                  {vaults.length}
                </p>
                <div className="flex items-center gap-2 text-[11px] text-blue-400 font-semibold">
                  <Star size={12} />
                  <span>Knowledge repository</span>
                </div>
              </div>
              <div className="p-4 bg-gradient-to-br from-purple-600/30 to-purple-600/10 rounded-2xl border border-purple-500/30 shadow-lg shadow-purple-500/20 group-hover:scale-110 transition-transform duration-300">
                <BookOpen className="text-purple-300" size={28} />
              </div>
            </div>
            {/* Enhanced Gradient Glow */}
            <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-purple-600/20 blur-[60px] rounded-full group-hover:bg-purple-600/30 transition-all duration-500" />
            <div className="absolute -left-4 -top-4 w-24 h-24 bg-blue-400/10 blur-[40px] rounded-full" />
            
            {/* Animated Border */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/0 via-purple-500/50 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" 
                 style={{ 
                   mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                   maskComposite: 'exclude',
                   padding: '1px'
                 }} 
            />
          </div>
        </div>

        {/* Enhanced Action Bar */}
        <div className="flex flex-wrap gap-4 items-center animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
          <Link
            href="/projects/new"
            className="group relative flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white text-sm font-bold rounded-xl transition-all shadow-xl shadow-purple-900/30 active:scale-95 border border-purple-400/20 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            <Plus size={18} className="relative z-10 group-hover:rotate-90 transition-transform duration-300" />
            <span className="relative z-10">Create Project</span>
          </Link>
          
          <Link
            href="/notes"
            className="group flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-white text-sm font-bold rounded-xl border border-white/10 hover:border-white/20 transition-all active:scale-95"
          >
            <BookOpen size={18} className="group-hover:scale-110 transition-transform" />
            Open All Vaults
          </Link>

          {/* Quick Stats Indicator */}
          <div className="ml-auto flex items-center gap-4 px-4 py-2 bg-white/5 border border-white/10 rounded-xl">
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-gray-500" />
              <span className="text-xs text-gray-400 font-medium">
                {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>

        {/* Enhanced Content Section */}
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg border border-purple-500/20">
                <Sparkles className="text-purple-400" size={20} />
              </div>
              <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                Recent Activity
              </h2>
            </div>
            <Link
              href="/projects"
              className="group text-xs font-bold text-purple-400 hover:text-purple-300 transition-colors uppercase tracking-widest flex items-center gap-2"
            >
              View all projects 
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {projects.length === 0 ? (
            <div className="relative border border-dashed border-white/10 rounded-3xl p-20 text-center bg-gradient-to-br from-white/[0.02] to-transparent overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(168,85,247,0.05),transparent_50%)]" />
              <div className="relative z-10 space-y-4">
                <div className="inline-flex p-6 bg-white/5 rounded-2xl border border-white/10 mb-2">
                  <FolderOpen size={48} className="text-gray-600" />
                </div>
                <p className="text-gray-400 font-semibold text-lg">Your project list is empty</p>
                <p className="text-gray-500 text-sm max-w-md mx-auto">Start your journey today by creating your first project and bringing your ideas to life.</p>
                <Link
                  href="/projects/new"
                  className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 hover:text-purple-300 text-sm font-bold rounded-xl border border-purple-500/30 transition-all"
                >
                  <Plus size={16} />
                  Create First Project
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.slice(0, 6).map((project, index) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.slug}`}
                  className="group relative bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-6 transition-all duration-300 hover:bg-white/[0.08] hover:border-purple-500/40 hover:-translate-y-2 hover:shadow-2xl hover:shadow-purple-500/10"
                  style={{
                    animationDelay: `${index * 100}ms`
                  }}
                >
                  {/* Hover Glow Effect */}
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600/0 via-purple-600/50 to-purple-600/0 rounded-2xl opacity-0 group-hover:opacity-100 blur transition-opacity duration-500" />
                  
                  <div className="relative flex flex-col h-full justify-between gap-6">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-lg font-bold text-white/90 group-hover:text-purple-400 transition-colors leading-tight">
                          {project.name}
                        </h3>
                        <div className="flex-shrink-0 p-1.5 rounded-lg bg-purple-500/0 group-hover:bg-purple-500/20 transition-all duration-300">
                          <Zap size={14} className="text-purple-400 opacity-0 group-hover:opacity-100" />
                        </div>
                      </div>
                      {project.description && (
                        <p className="text-xs text-gray-400 font-medium line-clamp-2 leading-relaxed">
                          {project.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest bg-white/5 text-gray-400 px-2.5 py-1.5 rounded-lg border border-white/10 group-hover:border-purple-500/30 group-hover:bg-purple-500/10 group-hover:text-purple-400 transition-all">
                        <Code size={12} />
                        {project.project_type}
                      </span>
                      <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-purple-500/0 group-hover:bg-purple-500/20 border border-transparent group-hover:border-purple-500/30 transition-all duration-300">
                        <ArrowRight size={16} className="text-gray-500 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  </div>

                  {/* Ambient Glow */}
                  <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-purple-500/10 blur-[40px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Additional Context Section - NEW */}
        {projects.length > 6 && (
          <div className="flex items-center justify-center pt-8 border-t border-white/5 animate-in fade-in duration-700 delay-700">
            <Link
              href="/projects"
              className="group flex items-center gap-3 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/30 rounded-xl transition-all"
            >
              <span className="text-sm font-semibold text-gray-400 group-hover:text-white transition-colors">
                View {projects.length - 6} more project{projects.length - 6 !== 1 ? 's' : ''}
              </span>
              <ArrowRight size={16} className="text-purple-400 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}