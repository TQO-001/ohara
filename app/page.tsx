import Link from 'next/link';
import type { Metadata } from 'next';
import Image from 'next/image';

// ── SEO ───────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: 'Ohara — Portfolio & Notes, Self-Hosted',
  description:
    'Ohara is a self-hosted portfolio and markdown notes manager built for developers. Own your data. Deploy on your VPS in minutes.',
  keywords: [
    'ohara', 'portfolio manager', 'notes app', 'self-hosted', 'markdown notes',
    'developer tools', 'vps app', 'next.js portfolio',
  ],
  openGraph: {
    title: 'Ohara — Portfolio & Notes, Self-Hosted',
    description: 'Own your portfolio and notes. No subscription. No data harvesting. One VPS.',
    url: 'https://ohara.laughtale.co.za',
    siteName: 'Ohara',
    type: 'website',
    images: [
      {
        url: 'https://ohara.laughtale.co.za/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Ohara — Portfolio & Notes Manager',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ohara — Portfolio & Notes, Self-Hosted',
    description: 'Own your portfolio and notes. No subscription. No data harvesting.',
    images: ['https://ohara.laughtale.co.za/og-image.png'],
  },
  alternates: {
    canonical: 'https://ohara.laughtale.co.za',
  },
};

// ── JSON-LD structured data ───────────────────────────────────
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Ohara',
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'Web',
  description:
    'A self-hosted portfolio and markdown notes manager for developers. Runs on your own VPS with PostgreSQL.',
  url: 'https://ohara.laughtale.co.za',
  author: {
    '@type': 'Person',
    name: 'LaughTale',
    url: 'https://laughtale.co.za',
  },
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
};

// ─────────────────────────────────────────────────────────────
export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="min-h-screen bg-[#080808] text-white font-sans antialiased overflow-x-hidden">

        {/* ── Ambient background ─────────────────────────────── */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
          <div className="absolute top-[-20%] left-[10%] w-[600px] h-[600px] bg-purple-600/8 rounded-full blur-[140px]" />
          <div className="absolute top-[40%] right-[-10%] w-[500px] h-[500px] bg-violet-700/6 rounded-full blur-[160px]" />
          <div className="absolute bottom-[-10%] left-[30%] w-[400px] h-[400px] bg-purple-900/10 rounded-full blur-[120px]" />
          {/* Subtle grid */}
          <div
            className="absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px)',
              backgroundSize: '60px 60px',
            }}
          />
        </div>

        {/* ── Navigation ────────────────────────────────────── */}
        <nav className="relative z-50 border-b border-white/5">
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 group">
              <img src="/logo.png" alt="Ohara" className="w-8 h-8 object-contain" />
              <span className="text-lg font-bold uppercase tracking-widest text-white group-hover:text-purple-400 transition-colors">
                Ohara
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-8 text-[13px] text-gray-400">
              <p className="hover:text-white transition-colors">
                More coming soon... probably idk
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-[13px] font-medium text-gray-400 hover:text-white transition-colors px-3 py-2"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="text-[13px] font-bold text-white bg-purple-600 hover:bg-purple-500 px-4 py-2 rounded-xl transition-all shadow-lg shadow-purple-900/30 active:scale-95"
              >
                Get Started
              </Link>
            </div>
          </div>
        </nav>

        {/* ── Hero ─────────────────────────────────────────── */}
        <section className="relative z-10 pt-24 pb-32 px-6">
          <div className="max-w-4xl mx-auto text-center">

            {/* Eyebrow badge */}
            <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 rounded-full px-4 py-1.5 text-[12px] font-bold text-purple-400 uppercase tracking-widest mb-10">
              <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse inline-block" />
              Fools who don't respect the past are doomed to repeat it.
            </div>

            <h1 className="text-[clamp(2.8rem,7vw,5.5rem)] font-black leading-[1.0] tracking-tight mb-8">
              <span className="text-white">Your portfolio.</span>
              <br />
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage: 'linear-gradient(135deg, #c084fc 0%, #a855f7 40%, #7c3aed 100%)',
                }}
              >
                Your notes.
              </span>
              <br />
              <span className="text-white">Your life.</span>
            </h1>

            <p className="text-[1.1rem] text-gray-400 max-w-2xl mx-auto leading-relaxed mb-12 font-medium">
              <span className="text-gray-300">YOU'LL BE SET FOR LOIYFE BRU BRU!!!.</span>
            </p>

            <p className="text-[1.1rem] text-gray-400 max-w-2xl mx-auto leading-relaxed mb-12 font-medium">
              Ohara is a full-stack portfolio and markdown notes manager to host your notes and projects.
              Making writing notes easier{' '}
              <span className="text-gray-300">Built with Next.js 15 and PostgreSQL.</span>
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-bold px-8 py-4 rounded-2xl text-[15px] transition-all shadow-2xl shadow-purple-900/40 active:scale-95"
              >
                Start for free
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </div>

            {/* Tech stack pills */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-14">
              {['Next.js 15', 'PostgreSQL', 'TypeScript', 'Tailwind CSS', 'JWT Auth', 'PM2', 'Nginx', 'GitHub Actions'].map((tech) => (
                <span
                  key={tech}
                  className="text-[11px] font-semibold text-gray-500 bg-white/[0.04] border border-white/[0.07] px-3 py-1.5 rounded-lg tracking-wide"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ── Dashboard preview ─────────────────────────────── */}
        <section className="relative z-10 px-6 -mt-4 mb-24">
          <div className="max-w-5xl mx-auto">
            <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/60 bg-[#0a0a0a]">
              {/* Fake browser chrome */}
              <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/5 bg-[#111]">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
                <div className="mx-auto bg-white/5 rounded-md px-16 py-1 text-[11px] text-gray-600 font-mono">
                  ohara.laughtale.co.za/dashboard
                </div>
              </div>
              {/* Mock dashboard content */}
              <div className="p-8 min-h-[320px] relative overflow-hidden">
                <div className="absolute inset-0">
                  <div className="absolute top-[-40px] left-[15%] w-80 h-80 bg-purple-500/5 rounded-full blur-[80px]" />
                </div>
                <div className="relative">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-48 h-8 bg-white/5 rounded-lg" />
                    <div className="w-2 h-2 bg-green-400/60 rounded-full" />
                    <div className="w-16 h-4 bg-green-400/10 rounded-full" />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {[
                      { label: 'Projects', val: '12', color: 'purple' },
                      { label: 'Vaults', val: '3', color: 'blue' },
                      { label: 'Notes', val: '47', color: 'violet' },
                      { label: 'Files', val: '89', color: 'indigo' },
                    ].map((s) => (
                      <div key={s.label} className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
                        <div className="text-[11px] text-gray-600 font-bold uppercase tracking-widest mb-1">{s.label}</div>
                        <div className="text-2xl font-black text-white/80">{s.val}</div>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {['Ohara App', 'Laughtale API', 'Portfolio v3'].map((name) => (
                      <div key={name} className="bg-white/[0.03] border border-white/5 rounded-xl p-4 flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-500/10 border border-purple-500/20 rounded-lg flex-shrink-0" />
                        <div>
                          <div className="text-[13px] font-semibold text-white/70">{name}</div>
                          <div className="text-[10px] text-gray-600">Next.js</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Features ─────────────────────────────────────── */}
        <section id="features" className="relative z-10 px-6 py-24">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-20">
              <div className="text-[11px] font-black uppercase tracking-[0.25em] text-purple-500 mb-4">
                What's inside
              </div>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-4">
                Everything a developer needs
              </h2>
              <p className="text-gray-500 max-w-lg mx-auto">
                No bloat. No feature requests backlog. Just the tools a working developer actually uses daily.
              </p>
            </div>
          </div>
        </section>

        {/* ── Footer ────────────────────────────────────────── */}
        <footer className="relative z-10 border-t border-white/5 px-6 py-12">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <Image 
                src="/logo.png" 
                alt="Ohara" 
                width={28} 
                height={28} 
                className="object-contain opacity-60" 
              />
              <span className="text-sm font-bold uppercase tracking-widest text-gray-600">Ohara</span>
            </div>
            
            <div className="flex items-center gap-2 text-[12px] text-gray-700 text-center">
              <span>Built by</span>
              <Image 
                src="/laughtale-logo.png" 
                alt="LaughTale Logo" 
                width={120} // Adjust width as needed for your logo's aspect ratio
                height={24} 
                className="inline-block"
              />
              <span>· Open source · Self-hosted</span>
            </div>

            <div className="flex items-center gap-6 text-[12px] text-gray-600">
              <Link href="/login" className="hover:text-gray-400 transition-colors">Sign in</Link>
              <Link href="/register" className="hover:text-gray-400 transition-colors">Register</Link>
              <a 
                href="https://github.com/TQO-001" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="hover:text-gray-400 transition-colors"
              >
                GitHub
              </a>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
