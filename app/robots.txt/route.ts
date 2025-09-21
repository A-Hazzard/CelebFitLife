import { NextResponse } from 'next/server';
import { SITE_CONFIG } from '@/lib/seo/config';

export async function GET() {
  const robotsTxt = `User-agent: *
Allow: /

# Sitemap
Sitemap: ${SITE_CONFIG.url}/sitemap.xml

# Crawl-delay
Crawl-delay: 1

# Block access to admin areas (if any)
Disallow: /admin/
Disallow: /api/
Disallow: /_next/
Disallow: /private/

# Allow all other content
Allow: /`;

  return new NextResponse(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}
