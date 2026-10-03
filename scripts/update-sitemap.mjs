import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

/** Copy the rendered page's visible update date into its sitemap entry. */
export function withLastModified(entry, html) {
  const timestamp = html.match(/Last updated:\s*<time\b[^>]*datetime="([^"]+)"/)?.[1];
  // Use the date already shown to readers, never the current build time.
  // The homepage has no visible update date and is deliberately left undated.
  if (!timestamp) return entry;
  const date = new Date(timestamp);
  if (!Number.isFinite(date.getTime())) throw new Error(`Invalid page update date: ${timestamp}`);
  return entry.replace(/<lastmod>.*?<\/lastmod>/s, '')
    .replace('</url>', `<lastmod>${date.toISOString()}</lastmod></url>`);
}

/** Enrich Astro's sitemap after the static HTML and sitemap have been built. */
export async function updateSitemap(dist = new URL('../dist/', import.meta.url)) {
  const index = await readFile(new URL('sitemap-index.xml', dist), 'utf8');
  let dated = 0;
  for (const match of index.matchAll(/<loc>(.*?)<\/loc>/g)) {
    const file = new URL(new URL(match[1]).pathname.slice(1), dist);
    const xml = await readFile(file, 'utf8');
    let updated = xml;
    for (const [entry] of xml.matchAll(/<url>.*?<\/url>/gs)) {
      const location = entry.match(/<loc>(.*?)<\/loc>/)?.[1];
      if (!location) throw new Error('Sitemap entry is missing its location');
      const page = new URL(new URL(location).pathname.slice(1) + 'index.html', dist);
      const replacement = withLastModified(entry, await readFile(page, 'utf8'));
      if (replacement.includes('<lastmod>')) dated++;
      updated = updated.replace(entry, replacement);
    }
    await writeFile(file, updated);
  }
  console.log(`Sitemap: ${dated} URLs include their visible last-updated date.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await updateSitemap();
}
