'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'register', ...formData }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');

      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] px-4 font-sans antialiased">
      <div className="w-full max-w-sm px-4">
        <div className="text-center mb-8">
          {/* Logo from public folder */}
          <div className="flex justify-center mb-4">
            <Image 
              src="/logo.png" 
              alt="Ohara Logo" 
              width={64} 
              height={64} 
              className="object-contain"
            />
          </div>
          <h1 className="text-4xl font-semibold text-white tracking-tight mb-2 uppercase">
            OHARA
          </h1>
          <p className="text-gray-400 text-sm">
            Already registered?{' '}
            <Link href="/login" className="text-purple-400 hover:text-purple-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-4 py-2.5 text-sm text-center">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[13px] font-medium text-gray-300 ml-1">Full Name</label>
            <input
              type="text"
              required
              placeholder="John Doe"
              className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition-all shadow-inner"
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[13px] font-medium text-gray-300 ml-1">Email address</label>
            <input
              type="email"
              required
              placeholder="name@example.com"
              className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition-all shadow-inner"
              onChange={e => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[13px] font-medium text-gray-300 ml-1">Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition-all shadow-inner"
              onChange={e => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          <div className="pt-2 space-y-6">
            <button
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-500 text-white font-medium py-3 px-4 rounded-xl transition-all shadow-lg shadow-purple-900/20 disabled:opacity-50 active:scale-[0.98]"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>

            <p className="text-center text-sm text-gray-400">
              Coming Soon: Sign in with Google, GitHub, and more!
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}