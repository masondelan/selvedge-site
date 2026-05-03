# selvedge-site

Marketing site and documentation for [Selvedge](https://github.com/masondelan/selvedge),
deployed to [selvedge.sh](https://selvedge.sh) via Cloudflare Pages.

Built with [Astro](https://astro.build) and [Starlight](https://starlight.astro.build).

## Local development

```bash
npm install
npm run dev    # http://localhost:4321
```

## Build

```bash
npm run build      # writes to dist/
npm run preview    # preview the production build locally
```

Cloudflare Pages picks up the `dist/` directory automatically.

## Project structure

```text
.
├── astro.config.mjs                 Astro + Starlight config (sidebar, hero override, CSS)
├── public/
│   ├── CNAME                        selvedge.sh
│   ├── _headers                     Cloudflare cache + security headers
│   ├── favicon.svg                  Indigo + red selvedge favicon
│   └── og.svg                       Open Graph card (1200×630)
├── src/
│   ├── assets/
│   │   └── wordmark.svg             Logo — lowercase mono with red selvedge stripe
│   ├── components/
│   │   └── SelvedgeHero.astro       Custom landing hero (replaces Starlight default)
│   ├── content/
│   │   └── docs/
│   │       ├── index.mdx            Landing page (uses splash template)
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

## Deploy

Cloudflare Pages, connected to this repo's `main` branch:

- **Build command:** `npm run build`
- **Build output:** `dist`
- **Node version:** 22 (set in Cloudflare Pages env)

Custom domain: `selvedge.sh`. DNS is on Cloudflare (nameservers swapped from Porkbun
to Cloudflare's pair). HTTPS via Cloudflare's universal SSL.

## Editing content

All content is Markdown / MDX under `src/content/docs/`. Sidebar order is hardcoded in
`astro.config.mjs` — add a new page by:

1. Drop a new `.md` or `.mdx` file under the appropriate section folder
2. Add a `{ label, link }` entry to the matching sidebar group in `astro.config.mjs`

The landing page (`src/content/docs/index.mdx`) uses the `splash` template, which is
why it gets the custom hero.

## License

MIT — same as Selvedge itself.
