import assert from 'node:assert/strict';
import test from 'node:test';
import { withLastModified } from './update-sitemap.mjs';

const entry = '<url><loc>https://selvedge.sh/example/</loc></url>';
test('sitemap dates come from the visible content date and are stable on rebuild', () => {
  const html = '<footer>Last updated: <time datetime="2026-09-24T00:00:00.000Z">Sep 24, 2026</time></footer>';
  const result = withLastModified(entry, html);
  assert.equal(result, entry.replace('</url>', '<lastmod>2026-09-24T00:00:00.000Z</lastmod></url>'));
  assert.equal(withLastModified(result, html), result);
});
test('undated pages get no invented build date; invalid dates fail', () => {
  assert.equal(withLastModified(entry, '<h1>Home</h1>'), entry);
  assert.equal(withLastModified(entry, '<article><time datetime="2026-01-01">Example event</time></article>'), entry);
  assert.throws(() => withLastModified(entry, 'Last updated: <time datetime="invalid">Invalid</time>'), /Invalid page update date/);
});
