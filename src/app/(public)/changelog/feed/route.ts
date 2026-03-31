import { getChangelog } from '@/data/changelog-loader';

/**
 * RSS Feed Route Handler
 * 
 * Generates an RSS 2.0 feed from changelog data.
 * Access at: /changelog/feed or /changelog/feed.xml
 */

const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://algovigilance.net';

export async function GET() {
  const changelog = getChangelog();
  
  const rssItems = changelog.entries
    .slice(0, 20) // Limit to most recent 20 entries
    .map((entry) => {
      const pubDate = new Date(entry.date).toUTCString();
      const link = `${SITE_URL}/changelog#v${entry.version.replace(/\./g, '-')}`;
      
      // Build description from changes
      const changesSummary = [
        entry.changes.features.length > 0 && `${entry.changes.features.length} new features`,
        entry.changes.improvements.length > 0 && `${entry.changes.improvements.length} improvements`,
        entry.changes.fixes.length > 0 && `${entry.changes.fixes.length} bug fixes`,
        entry.changes.security.length > 0 && `${entry.changes.security.length} security updates`,
      ]
        .filter(Boolean)
        .join(', ');

      return `
    <item>
      <title>v${entry.version}: ${entry.title}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${pubDate}</pubDate>
      <description><![CDATA[${entry.description}${changesSummary ? ` (${changesSummary})` : ''}]]></description>
    </item>`;
    })
    .join('');

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>AlgoVigilance Changelog</title>
    <link>${SITE_URL}/changelog</link>
    <description>Platform updates, features, and improvements for AlgoVigilance.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/changelog/feed" rel="self" type="application/rss+xml"/>
    ${rssItems}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
