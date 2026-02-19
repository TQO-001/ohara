// app/robots.ts
// Next.js serves this at /robots.txt
// Tells search engine crawlers which pages to index.

import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/login', '/register'],
        // Keep the dashboard private — logged-in pages don't need to be indexed
        disallow: ['/dashboard', '/projects', '/notes', '/api/'],
      },
    ],
    sitemap: 'https://ohara.laughtale.co.za/sitemap.xml',
    host: 'https://ohara.laughtale.co.za',
  };
}
