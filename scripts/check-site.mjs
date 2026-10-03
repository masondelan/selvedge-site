import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { legacyDestinations } from '../src/data/homepage.mjs';
import { contentPages } from './site-content.mjs';

const site = 'https://selvedge.sh';
const read = path => readFile(new URL('../dist/' + path, import.meta.url), 'utf8');
const locs = xml => [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => match[1]);
const indexes = locs(await read('sitemap-index.xml'));
const urls = (await Promise.all(indexes.map(async url => locs(await read(new URL(url).pathname.slice(1)))))).flat();
const expectedUrls = (await contentPages()).map(page => site + page.path);
assert.deepEqual([...urls].sort(), expectedUrls.sort(), 'Every documentation route must appear exactly once in the sitemap');
const graph = new Map();
const ids = new Map();
const internalLinks = [];
const titles = new Set();
const descriptions = new Set();
const terms = new Map();
let termSet;
const attributes = tag => Object.fromEntries([...tag.matchAll(/([\w:-]+)="([^"]*)"/g)].map(m => [m[1], m[2]]));
for (const url of urls) {
  const path = new URL(url).pathname;
  const html = await read(path.slice(1) + 'index.html');
  const meta = [...html.matchAll(/<meta\b[^>]*>/g)].map(m => attributes(m[0]));
  const links = [...html.matchAll(/<link\b[^>]*>/g)].map(m => attributes(m[0]));
  const title = html.match(/<title>(.*?)<\/title>/)?.[1];
  assert(title && !titles.has(title), `${url}: missing/duplicate title`);
  titles.add(title);
  assert.equal(meta.filter(m => m.name === 'description' && m.content).length, 1, `${url}: description`);
  const description = meta.find(m => m.name === 'description' && m.content).content;
  assert(!descriptions.has(description), `${url}: duplicate description`);
  descriptions.add(description);
  assert.equal(links.filter(l => l.rel === 'canonical').length, 1, `${url}: canonical count`);
  assert.equal(links.find(l => l.rel === 'canonical').href, url, `${url}: canonical target`);
  assert(!meta.some(m => /^(robots|googlebot)$/.test(m.name) && /noindex/i.test(m.content)), `${url}: noindex`);
  assert.equal((html.match(/<h1\b/g) || []).length, 1, `${url}: one heading`);
  for (const property of ['og:title', 'og:description', 'og:type', 'og:image']) {
    assert.equal(meta.filter(m => m.property === property && m.content).length, 1, `${url}: ${property}`);
  }
  for (const name of ['twitter:title', 'twitter:description', 'twitter:image']) {
    assert.equal(meta.filter(m => m.name === name && m.content).length, 1, `${url}: ${name}`);
  }
  const json = [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/gs)];
  assert(json.length, `${url}: structured data missing`);
  json.forEach(m => {
    const data = JSON.parse(m[1]);
    if (data['@type'] === 'DefinedTerm') {
      const { '@context': context, ...term } = data;
      terms.set(term['@id'], term);
    }
    if (data['@type'] === 'DefinedTermSet') termSet = data;
  });
  const anchors = [...html.matchAll(/<a\b[^>]*href="([^"]*)"[^>]*>/g)].map(m => new URL(m[1].replaceAll('&amp;', '&'), url));
  internalLinks.push(...anchors.filter(a => a.origin === site).map(target => ({ source: url, target })));
  graph.set(url, new Set(anchors.filter(a => a.origin === site).map(a => site + a.pathname)));
  ids.set(url, new Set([...html.matchAll(/\bid="([^"]*)"/g)].map(m => m[1])));
}
assert(termSet?.hasDefinedTerm?.length === terms.size && terms.size > 0, 'Concept index must describe every concept page');
for (const term of termSet.hasDefinedTerm) {
  assert.deepEqual(term, terms.get(term['@id']), `Concept definition drift: ${term['@id']}`);
}
// Check each destination and fragment, not just reachability from the homepage.
for (const { source, target } of internalLinks) {
  const path = target.pathname.endsWith('/') ? target.pathname : target.pathname + '/';
  const pageIds = ids.get(site + path);
  if (pageIds) {
    if (target.hash) assert(pageIds.has(decodeURIComponent(target.hash.slice(1))), `${source}: missing anchor ${target.href}`);
  } else {
    const asset = await stat(new URL('../dist/' + target.pathname.slice(1), import.meta.url)).catch(() => null);
    assert(asset?.isFile(), `${source}: missing destination ${target.href}`);
  }
}
const visited = new Set();
const pending = [site + '/'];
while (pending.length) {
  const url = pending.pop();
  if (visited.has(url) || !graph.has(url)) continue;
  visited.add(url);
  pending.push(...graph.get(url));
}
assert.deepEqual(urls.filter(url => !visited.has(url)), [], 'Every sitemap page must be reachable through HTML links');
for (const [hash, target] of Object.entries(legacyDestinations)) {
  assert(ids.get(site + '/').has(hash.slice(1)), `No-JavaScript fallback for ${hash}`);
  const url = new URL(target, site);
  assert(graph.has(site + url.pathname), `Missing legacy destination: ${target}`);
  if (url.hash) assert(ids.get(site + url.pathname).has(url.hash.slice(1)), `Missing fragment: ${target}`);
}
assert((await read('robots.txt')).includes('Sitemap: ' + site + '/sitemap-index.xml'));
console.log(`PASS: ${urls.length} sitemap pages, ${internalLinks.length} internal links and fragments, unique titles, descriptions, canonical/social metadata, JSON-LD, homepage reachability, and legacy destinations.`);
