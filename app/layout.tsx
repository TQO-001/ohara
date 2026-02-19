import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

// ── Global / fallback SEO ─────────────────────────────────────
// Individual pages override these via their own `export const metadata`.
export const metadata: Metadata = {
  title: {
    default: 'Ohara — Portfolio & Notes, Self-Hosted',
    // %s becomes the page-specific title, e.g. "Dashboard | Ohara"
    template: '%s | Ohara',
  },
  description:
    'Ohara is a self-hosted portfolio and markdown notes manager built for developers. Own your data. Deploy on your VPS.',
  metadataBase: new URL('https://ohara.laughtale.co.za'),
  keywords: ['ohara', 'portfolio', 'notes', 'self-hosted', 'markdown', 'developer tools', 'vps'],
  authors: [{ name: 'Thulani Langa', url: 'https://laughtale.co.za' }],
  creator: 'Thulani Langa',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://ohara.laughtale.co.za',
    siteName: 'Ohara',
    title: 'Ohara — Portfolio & Notes, Self-Hosted',
    description: 'Own your portfolio and notes. No subscription. No data harvesting. One VPS.',
    images: [
      {
        url: '/og-image.png',
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
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
