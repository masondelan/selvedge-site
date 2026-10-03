# selvedge-site

Marketing site and documentation for [Selvedge](https://github.com/masondelan/selvedge),
deployed to [selvedge.sh](https://selvedge.sh) via Cloudflare Workers.

Built with [Astro](https://astro.build) and [Starlight](https://starlight.astro.build).

## Local development

```bash
npm ci
npm run dev    # http://localhost:4321
```

## Build

```bash
npm run build      # writes to dist/
npm run preview    # preview the production build locally
```

The build writes static pages and the API worker to `dist/`. Run `npm run check:site`
and `npm test` before deploying with `npm run deploy`.

## Project structure

```text
.
├── astro.config.mjs                 Astro + Starlight config (sidebar, page frame, CSS)
├── public/
│   ├── CNAME                        selvedge.sh
│   ├── _headers                     Cloudflare cache + security headers
│   ├── favicon.svg                  Indigo + red selvedge favicon
│   └── og.svg                       Open Graph card (1200×630)
├── src/
│   ├── assets/
│   │   └── wordmark.svg             Logo — lowercase mono with red selvedge stripe
│   ├── components/
│   │   ├── Homepage.astro           Minimal introduction and copyable setup prompt
│   │   └── PageFrame.astro          Homepage frame; standard Starlight for docs
│   ├── content/
│   │   └── docs/
│   │       ├── index.mdx            Homepage search metadata (splash template)
│   │       ├── start/               What is Selvedge / Quickstart / How it works
│   │       ├── reference/           CLI / MCP tools / Entity paths / Configuration
│   │       ├── compare/             vs. git blame / vs. agent tools / Agent Trace interop
│   │       └── project/             Changelog / Roadmap / FAQ
│   ├── content.config.ts            Starlight content collection
│   └── styles/
│       └── selvedge.css             Brand palette + Starlight overrides
├── package.json
└── tsconfig.json
```

## Brand reference

Locked palette:

- **Indigo** `#1F3057` — primary
- **Red** `#B23A2A` — accent / the selvedge stripe (the thin red rule)
- **Ecru** `#EDE5D3` — warm paper

Typography:

- **Wordmark + code:** JetBrains Mono
- **Body:** Inter (with system fallback)

The "selvedge stripe" — the thin red vertical rule — appears in the hero, the sidebar
right edge, and the favicon. It evokes the red selvedge thread on classic Japanese
denim.

Homepage interface:

- The homepage is a narrow, left-aligned introduction with one underlined setup-prompt action.
  Keep documentation, CLI quickstart, source and privacy links visible.
- Homepage spacing lives in `homepage.css` and uses the shared palette from `selvedge.css`.
  The prompt remains readable without JavaScript; copying must report actual clipboard success.
- Use medium-weight Inter, modest corner radii, and deliberate spacing. Reserve
  JetBrains Mono for the wordmark, code, and technical labels, and red for small accents.
- Keep interactions quiet: color changes without lifting buttons, gradients, or decorative shadows.
- Keep custom terminal UI inside Starlight's `not-content` boundary so prose
  sibling margins cannot displace its controls. Lights stay on one baseline;
  titles shrink before controls, and clipboard errors appear below the command.
- At phone widths, use at least 14px command text and 44px Copy targets. Check
  the homepage and each agent panel at 320px, 390px and 440px, plus tablet and
  desktop, in both themes. Preserve full command text and avoid page overflow.
- The homepage wordmark is live JetBrains Mono text with the red stripe. Documentation
  uses the matching light/dark SVG assets; images cannot inherit surrounding text color.

## Deploy

The `wrangler.jsonc` configuration deploys the `selvedge-site` Worker with static
assets from `dist/` and the existing `LAUNCH_METRICS` database binding.

```bash
npm run build
npm run check:site
npm test
npx wrangler deploy
```

Custom domain: [selvedge.sh](https://selvedge.sh/). Preserve the configured database
binding and verify the live pages and redirects after deployment.

## Editing content

Preserve Selvedge's core values: **easy to use, robust, and developer focused**.
The shared [engineering standards](https://github.com/masondelan/selvedge/blob/main/docs/engineering-standards.md)
apply to site code, docs, examples, accessibility, dependencies, reviews and
deployments. Keep the lockfile current, use an upstream-supported Node.js LTS
release and review relevant official guidance when dependencies or practices change.

**Standing product standard: Selvedge is agent-agnostic.** It is for anyone using any compatible agent. Lead product copy with decision memory and interface requirements, not a particular agent or provider. Names belong in useful examples, commands, compatibility tables and optional integration guides. Setup presets are not an exhaustive compatibility list. Keep the general MCP/CLI connection path visible, and distinguish core compatibility from client-specific hook support. Preserve this standard in future site and documentation changes.

All content is Markdown / MDX under `src/content/docs/`. Sidebar order is hardcoded in
`astro.config.mjs` — add a new page by:

1. Drop a new `.md` or `.mdx` file under the appropriate section folder
2. Add a `{ label, link }` entry to the matching sidebar group in `astro.config.mjs`

The homepage metadata lives in `src/content/docs/index.mdx`. `PageFrame.astro` renders
`Homepage.astro` only at `/`; documentation retains its standard navigation, search
and metadata. Agent setup controls live in the quickstart. Legacy homepage hashes
forward to the relevant documentation, preserving existing campaign links.

After homepage or navigation changes, run `npm test`, `npm run build`, and
`npm run check:site`. The last command checks every sitemap page, metadata,
structured data, and crawlable reachability from the homepage. Keep Search Console
indexing/performance outcomes separate from these technical checks.

### After a Selvedge release

Use the source repository's `CHANGELOG.md` and published release as the source of
truth. Update `src/content/docs/project/changelog.md` with the new release and
refresh the current-version guidance in `src/content/docs/start/quickstart.mdx`.
Keep a feature's minimum supported version distinct from the current release.

Run `npm run build`, deploy, and check both live pages. Preserve unrelated homepage
and style changes. Record the site commit and deployment receipt alongside the
package release receipts; updating GitHub, PyPI, npm, or Smithery does not update
this documentation mirror automatically. The source repository's
[release procedure](https://github.com/masondelan/selvedge/blob/main/docs/releasing.md)
covers package publication.

## License

MIT — same as Selvedge itself.
