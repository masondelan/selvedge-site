import assert from 'node:assert/strict';

// Exercise the built Worker, since checking HTML files cannot verify status codes.
const base = new URL(process.argv[2] || 'http://127.0.0.1:8787');
assert(['127.0.0.1', 'localhost', '[::1]'].includes(base.hostname), 'Use a local Worker preview URL');
const request = (path, options = {}) => fetch(new URL(path, base), {
  ...options,
  redirect: 'manual',
  signal: AbortSignal.timeout(10_000),
});

for (const path of ['/', '/start/quickstart/', '/reference/cli/']) {
  const response = await request(path);
  assert.equal(response.status, 200, `${path}: recovery destination must remain available`);
  await response.arrayBuffer();
}

for (const path of ['/404', '/404/', '/404.html', '/missing-page-check', '/start/missing-page-check/']) {
  const response = await request(path);
  assert.equal(response.status, 404, `${path}: must be a real HTTP 404, not a redirect or soft 404`);
  assert.match(response.headers.get('content-type') || '', /text\/html/);
  const html = await response.text();
  assert.match(html, /<title>Page not found \| selvedge<\/title>/, `${path}: branded title`);
  assert.match(html, /The selvedge is the edge that <em>doesn(?:'|&#39;|&#x27;|&apos;)t<\/em> fray\./, `${path}: preserve recovery copy`);
  assert.match(html, /<meta\b[^>]*name="robots"[^>]*content="noindex"/, `${path}: excluded from indexing`);
  assert.doesNotMatch(html, /data-pagefind-body/, `${path}: excluded from site search`);
  for (const href of ['/', '/start/quickstart/', '/reference/cli/']) {
    assert(html.includes(`href="${href}"`), `${path}: missing recovery link ${href}`);
  }
  const head = await request(path, { method: 'HEAD' });
  assert.equal(head.status, 404, `${path}: HEAD status`);
  assert.equal(await head.text(), '', `${path}: HEAD must not include a response body`);
}

console.log('PASS: five missing-page routes retain branded recovery content, return GET/HEAD 404, and stay out of search; three recovery links return 200.');
