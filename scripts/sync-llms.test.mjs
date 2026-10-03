import test from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { absoluteSiteLinks, syncLlms } from './sync-llms.mjs';

test('concept changes update both exports without changing curated text; check never writes', async t => {
  const root = await mkdtemp(join(tmpdir(), 'selvedge-llms-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await cp(new URL('../src/content/docs/concepts', import.meta.url), join(root, 'src/content/docs/concepts'), { recursive: true });
  await cp(new URL('../public', import.meta.url), join(root, 'public'), { recursive: true });
  await syncLlms({ root });

  const read = file => readFile(join(root, file), 'utf8');
  const beforeIndex = await read('public/llms.txt');
  const beforeFull = await read('public/llms-full.txt');
  const sourcePath = 'src/content/docs/concepts/ai-code-provenance.md';
  const source = (await read(sourcePath))
    .replace(/^title: .*$/m, 'title: "Changed source title"')
    .replace(/^description: .*$/m, 'description: "Changed source description."')
    + '\nA new example links to [verification](/guides/verify-first-decision/).\n';
  await writeFile(join(root, sourcePath), source);

  assert.deepEqual(await syncLlms({ root, check: true }), ['public/llms.txt', 'public/llms-full.txt']);
  assert.equal(await read('public/llms.txt'), beforeIndex);
  assert.equal(await read('public/llms-full.txt'), beforeFull);

  await syncLlms({ root });
  const afterIndex = await read('public/llms.txt');
  const afterFull = await read('public/llms-full.txt');
  assert.match(afterIndex, /\[Changed source title\].*: Changed source description\./);
  assert.match(afterFull, /# Changed source title\n/);
  assert.match(afterFull, /A new example links to \[verification\]\(https:\/\/selvedge\.sh\/guides\/verify-first-decision\/\)/);
  assert.equal(afterIndex.split('## Concepts\n')[0], beforeIndex.split('## Concepts\n')[0]);
  assert.equal(afterIndex.split('\n## Reference\n')[1], beforeIndex.split('\n## Reference\n')[1]);
  assert.equal(afterFull.split('<!-- BEGIN GENERATED CONCEPTS:')[0], beforeFull.split('<!-- BEGIN GENERATED CONCEPTS:')[0]);
  assert.deepEqual(await syncLlms({ root, check: true }), []);

  await writeFile(join(root, 'src/content/docs/concepts/new-concept.md'),
    '---\ntitle: "New concept"\ndescription: "A newly documented concept."\n---\n\nNew visible definition.\n');
  assert.deepEqual(await syncLlms({ root, check: true }), ['public/llms.txt', 'public/llms-full.txt']);
  await syncLlms({ root });
  assert.match(await read('public/llms.txt'), /\[New concept\]\(https:\/\/selvedge\.sh\/concepts\/new-concept\/\)/);
  assert.match(await read('public/llms-full.txt'), /New visible definition\./);
  await writeFile(join(root, 'src/content/docs/concepts/component.mdx'), 'import Component from "./example";');
  await assert.rejects(syncLlms({ root }), /add rendered MDX support/);
});

test('standalone Markdown resolves internal links while preserving code and external URLs', () => {
  const markdown = [
    '[Root](/start/quickstart/#install) [Sibling](../agent-memory/) [Here](#example)',
    '[External](https://example.com/) [CDN](//example.com/file)',
    '`[Literal](/example/)` and [Real](/reference/mcp-tools/)',
    '```markdown',
    '[Example](/leave-code-alone/)',
    '```',
  ].join('\n');
  assert.equal(absoluteSiteLinks(markdown, 'https://selvedge.sh/concepts/prior-attempt/'), [
    '[Root](https://selvedge.sh/start/quickstart/#install) [Sibling](https://selvedge.sh/concepts/agent-memory/) [Here](https://selvedge.sh/concepts/prior-attempt/#example)',
    '[External](https://example.com/) [CDN](//example.com/file)',
    '`[Literal](/example/)` and [Real](https://selvedge.sh/reference/mcp-tools/)',
    '```markdown',
    '[Example](/leave-code-alone/)',
    '```',
  ].join('\n'));
});
