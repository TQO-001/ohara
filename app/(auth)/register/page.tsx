'use client';

import { useState, FormEvent, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Hyperspeed from '@/components/Hyperspeed';

const HYPERSPEED_OPTIONS = {
  "distortion": "turbulentDistortion",
  "length": 400,
  "roadWidth": 10,
  "islandWidth": 2,
  "lanesPerRoad": 3,
  "fov": 90,
  "fovSpeedUp": 150,
  "speedUp": 2,
  "carLightsFade": 0.4,
  "totalSideLightSticks": 20,
  "lightPairsPerRoadWay": 40,
  "shoulderLinesWidthPercentage": 0.05,
  "brokenLinesWidthPercentage": 0.1,
  "brokenLinesLengthPercentage": 0.5,
  "lightStickWidth": [0.12, 0.5],
  "lightStickHeight": [1.3, 1.7],
  "movingAwaySpeed": [60, 80],
  "movingCloserSpeed": [-120, -160],
  "carLightsLength": [12, 80],
  "carLightsRadius": [0.05, 0.14],
  "carWidthPercentage": [0.3, 0.5],
  "carShiftX": [-0.8, 0.8],
  "carFloorSeparation": [0, 5],
  "colors": {
    "roadColor": 0x080808,
    "islandColor": 0x0a0a0a,
    "background": 0x000000,
    "shoulderLines": 0x4c1d95,
    "brokenLines": 0x4c1d95,
    "leftCars": [0xa855f7, 0x7e22ce, 0x4c1d95],
    "rightCars": [0xd8b4fe, 0xa855f7, 0x6b21a8],
    "sticks": 0xa855f7
  }
} as const;

function RegisterContent() {
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

  const inputStyles = "w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder-gray-500 transition-all outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 focus:shadow-[0_0_20px_rgba(168,85,247,0.25)] shadow-inner";

  return (
    <div className="w-full max-w-sm relative z-10">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <Image 
            src="/logo.png" 
            alt="Ohara Logo" 
            width={64} 
            height={64} 
            className="object-contain drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]"
          />
        </div>
        <h1 className="text-4xl font-semibold text-white tracking-tight mb-2 uppercase drop-shadow-[0_0_12px_rgba(168,85,247,0.8)]">
          OHARA
        </h1>
        <p className="text-gray-400 text-sm">
          Already registered?{' '}
          <Link href="/login" className="text-purple-400 hover:text-purple-300 font-medium transition-colors hover:drop-shadow-[0_0_8px_rgba(168,85,247,0.4)]">
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
            className={inputStyles}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <label className="text-[13px] font-medium text-gray-300 ml-1">Email address</label>
          <input
            type="email"
            required
            placeholder="name@example.com"
            className={inputStyles}
            onChange={e => setFormData({ ...formData, email: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <label className="text-[13px] font-medium text-gray-300 ml-1">Password</label>
          <input
            type="password"
            required
            placeholder="••••••••"
            className={inputStyles}
            onChange={e => setFormData({ ...formData, password: e.target.value })}
          />
        </div>

        <div className="pt-2 space-y-6">
          <button
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-500 text-white font-medium py-3 px-4 rounded-xl transition-all shadow-lg shadow-purple-900/20 disabled:opacity-50 active:scale-[0.98] hover:shadow-[0_0_25px_rgba(168,85,247,0.4)]"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>

          <p className="text-center text-sm text-gray-400">
            Coming Soon: Sign in with Google, GitHub, and more!
          </p>
        </div>
      </form>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <main className="relative min-h-screen w-full flex items-center justify-center bg-[#0a0a0a] overflow-hidden font-sans antialiased">
      <div className="absolute inset-0 z-0">
        <Suspense fallback={null}>
          {/* Use 'as any' here to solve the TypeScript tuple/readonly error */}
          <Hyperspeed effectOptions={HYPERSPEED_OPTIONS as any} />
        </Suspense>
      </div>

      <div className="px-4 w-full flex justify-center">
        <RegisterContent />
      </div>
    </main>
  );
}