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

Homepage interface:

- The setup and introduction buttons share one outlined treatment, equal sizing,
  and identical hover and keyboard-focus states. Indigo on warm paper; ecru in dark mode.
- Keep their styles together in `selvedge.css`; avoid page-specific primary/secondary overrides.
- Use medium-weight Inter, modest corner radii, and deliberate spacing. Reserve
  JetBrains Mono for the wordmark, code, and technical labels, and red for small accents.
- Keep interactions quiet: color changes without lifting buttons, gradients, or decorative shadows.
- Keep custom terminal UI inside Starlight's `not-content` boundary so prose
  sibling margins cannot displace its controls. Lights stay on one baseline;
  titles shrink before controls, and clipboard errors appear below the command.
- At phone widths, use at least 14px command text and 44px Copy targets. Check
  the homepage and each agent panel at 320px, 390px and 440px, plus tablet and
  desktop, in both themes. Preserve full command text and avoid page overflow.
- Use the matching light/dark wordmark assets; SVG images do not inherit the
  surrounding page's text color.

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

### After a Selvedge release

Use the source repository's `CHANGELOG.md` and published release as the source of
truth. Update `src/content/docs/project/changelog.md` with the new release and
refresh the current-version guidance in `src/content/docs/start/quickstart.md`.
Keep a feature's minimum supported version distinct from the current release.

Run `npm run build`, deploy, and check both live pages. Preserve unrelated homepage
and style changes. Record the site commit and deployment receipt alongside the
package release receipts; updating GitHub, PyPI, npm, or Smithery does not update
this documentation mirror automatically. The source repository's
[release procedure](https://github.com/masondelan/selvedge/blob/main/docs/releasing.md)
covers package publication.

## License

MIT — same as Selvedge itself.
