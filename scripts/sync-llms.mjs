#!/usr/bin/env node
// Keep the existing concepts exports synchronized with their canonical pages.
// The rest of each llms file is curated and is preserved byte for byte.
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://selvedge.sh';
const BEGIN = '<!-- BEGIN GENERATED CONCEPTS: scripts/sync-llms.mjs -->';
const END = '<!-- END GENERATED CONCEPTS -->';
const CONCEPTS = [
  'index', 'ai-code-provenance', 'agent-memory', 'prior-attempt',
  'entity-level-tracking', 'changeset', 'stale-decision', 'captured-live-vs-inferred',
];

function conceptPage(source, slug) {
  const parts = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!parts) throw new Error(`${slug}: expected Markdown frontmatter`);
  // These canonical pages use JSON-compatible quoted text for both fields.
  // Read only that explicit subset, failing clearly if its format changes;
  // never interpret nested structured-data YAML as visible page content.
  const scalar = name => {
    const value = parts[1].match(new RegExp(`^${name}: (.+)$`, 'm'))?.[1];
    try {
      const parsed = JSON.parse(value);
      if (typeof parsed === 'string' && parsed.trim()) return parsed;
    } catch {}
    throw new Error(`${slug}: ${name} must be a single-line JSON-quoted string`);
  };
  const url = `${SITE}/concepts/${slug === 'index' ? '' : `${slug}/`}`;
  return { title: scalar('title'), description: scalar('description'), url, body: parts[2].trim() };
}

export function absoluteSiteLinks(markdown, pageUrl) {
  let fence = null;
  return markdown.split('\n').map(line => {
    const delimiter = line.match(/^\s{0,3}(`{3,}|~{3,})/);
    if (delimiter) {
      if (!fence) fence = delimiter[1];
      else if (delimiter[1][0] === fence[0] && delimiter[1].length >= fence.length) fence = null;
      return line;
    }
    if (fence) return line;
    // Leave code spans and external URLs alone. The source pages use inline
    // Markdown links; resolve their root, relative, and fragment destinations.
    return line.split(/(`+[^`]*`+)/).map((part, index) => index % 2 ? part : part.replace(
      /\]\((<?)((?:\/(?!\/)|\.\.?\/|#)[^\s)>]*)(>?)(?=[\s)])/g,
      (_, open, destination, close) => `](${open}${new URL(destination, pageUrl).href}${close}`,
    )).join('');
  }).join('\n');
}

function replaceConceptIndex(source, pages) {
  const start = source.indexOf('## Concepts\n');
  const end = source.indexOf('\n## Reference\n', start);
  if (start < 0 || end < 0) throw new Error('llms.txt: missing Concepts/Reference section boundaries');
  const entries = pages.map(page => `- [${page.title}](${page.url}): ${page.description}`).join('\n');
  return source.slice(0, start) + `## Concepts\n${entries}\n` + source.slice(end);
}

function replaceFullConcepts(source, pages) {
  let start = source.indexOf(BEGIN);
  let end;
  if (start >= 0) {
    end = source.indexOf(END, start);
    if (end < 0) throw new Error('llms-full.txt: missing generated concepts end marker');
    end += END.length;
  } else {
    // One-time migration of the existing hand-copied concepts appendix.
    start = source.indexOf('# Code decision concepts\n\nSource: https://selvedge.sh/concepts/\n');
    if (start < 0) throw new Error('llms-full.txt: missing concepts appendix');
    end = source.length;
  }
  const chapters = pages.map(page =>
    `# ${page.title}\n\nSource: ${page.url}\n\n${absoluteSiteLinks(page.body, page.url)}`,
  ).join('\n\n\n');
  const suffix = source.slice(end);
  return source.slice(0, start) + `${BEGIN}\n\n${chapters}\n\n${END}` + (suffix || '\n');
}

export async function syncLlms({ root = ROOT, check = false } = {}) {
  const pages = await Promise.all(CONCEPTS.map(async slug => conceptPage(
    await readFile(join(root, `src/content/docs/concepts/${slug}.md`), 'utf8'), slug,
  )));
  const outputs = [
    ['public/llms.txt', replaceConceptIndex],
    ['public/llms-full.txt', replaceFullConcepts],
  ];
  // Compute both outputs before changing anything, so malformed input fails
  // without partially updating the public exports.
  const changes = await Promise.all(outputs.map(async ([file, render]) => {
    const original = await readFile(join(root, file), 'utf8');
    return { file, original, expected: render(original, pages) };
  }));
  const stale = changes.filter(({ original, expected }) => original !== expected);
  if (!check) {
    for (const { file, expected } of stale) await writeFile(join(root, file), expected);
  }
  return stale.map(({ file }) => file);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if (process.argv.slice(2).some(arg => arg !== '--check')) throw new Error('Usage: node scripts/sync-llms.mjs [--check]');
    const check = process.argv.includes('--check');
    const changed = await syncLlms({ check });
    if (check && changed.length) {
      console.error(`Stale concepts exports: ${changed.join(', ')}. Run node scripts/sync-llms.mjs.`);
      process.exitCode = 1;
    } else {
      console.log(changed.length ? `Updated ${changed.join(', ')}.` : 'Concepts exports are synchronized.');
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
