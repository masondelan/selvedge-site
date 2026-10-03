import { readdir, readFile } from 'node:fs/promises';

/** Map this site's file-based documentation routes to their source files. */
export async function contentPages(root = new URL('../src/content/docs/', import.meta.url)) {
  const files = (await readdir(root, { recursive: true })).filter(file => /\.mdx?$/.test(file) && !/^404\.mdx?$/.test(file));
  return Promise.all(files.sort().map(async file => {
    const source = await readFile(new URL(file, root), 'utf8');
    const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';
    // Fail loudly if the site's routing rules change instead of validating a
    // guessed route. There are currently no custom slugs or draft documents.
    if (/^(slug|draft):/m.test(frontmatter)) throw new Error(`${file}: update contentPages for custom routing`);
    const slug = file.replace(/\.mdx?$/, '').replace(/(^|\/)index$/, '');
    return { file, path: slug ? `/${slug.replace(/\/$/, '')}/` : '/' };
  }));
}
