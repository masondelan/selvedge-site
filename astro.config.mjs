import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
// Generated from src/data/seo.mjs by scripts/gen-seo-pages.mjs.
import { mcpItems, compareItems } from "./src/data/seo-nav.mjs";

import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
  site: "https://selvedge.sh",

  integrations: [
    starlight({
      title: "selvedge",
      description:
        "Local decision memory for AI coding agents. Keep the reasons, rejected approaches and conditions for revisiting them across sessions.",
      logo: {
        src: "./src/assets/wordmark.svg",
        replacesTitle: true,
      },
      favicon: "/favicon.svg",
      head: [
        // PNG favicon fallbacks for clients that don't render the SVG favicon.
        {
          tag: "link",
          attrs: { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon-32.png" },
        },
        {
          tag: "link",
          attrs: { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
        },
        {
          tag: "meta",
          attrs: { property: "og:image", content: "https://selvedge.sh/og.png" },
        },
        {
          tag: "meta",
          attrs: { name: "twitter:card", content: "summary_large_image" },
        },
        {
          tag: "meta",
          attrs: { name: "twitter:image", content: "https://selvedge.sh/og.png" },
        },
        {
          tag: "meta",
          attrs: { name: "twitter:site", content: "@notmason__" },
        },
      ],
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/masondelan/selvedge",
        },
      ],
      customCss: [
        // Self-hosted, same-origin fonts (no third-party request). Variable
        // weights cover the 400/500/600/700 the wordmark + body use.
        "@fontsource-variable/inter/index.css",
        "@fontsource-variable/jetbrains-mono/index.css",
        "./src/styles/selvedge.css",
        "./src/styles/launch.css",
      ],
      components: {
        // Override the default Starlight hero with our own that includes
        // the wordmark + selvedge stripe + install command.
        Hero: "./src/components/SelvedgeHero.astro",
        // SEO: adds JSON-LD (Organization, WebSite, SoftwareApplication,
        // FAQPage), fixes og:type on the homepage, and emits explicit
        // twitter:title / twitter:description. Wraps the default <Head>.
        Head: "./src/components/seo/Head.astro",
      },
      sidebar: [
        {
          label: "Start here",
          items: [
            { label: "What is Selvedge?", link: "/start/what-is-selvedge/" },
            { label: "Quickstart", link: "/start/quickstart/" },
            { label: "How it works", link: "/start/how-it-works/" },
            { label: "Agent prompt block", link: "/prompt-block/" },
            { label: "Stop repeated mistakes", link: "/prior-attempts/" },
            { label: "Revisit a rejected approach", link: "/guides/revisit-a-rejected-approach/" },
          ],
        },
        {
          // Direct-answer pages: one page per question, phrased the way
          // people actually ask it. Same pattern as /prior-attempts/.
          label: "Answers",
          items: [
            { label: "Track the why", link: "/track-why/" },
            { label: "Agent memory", link: "/agent-memory/" },
            { label: "Audit trail", link: "/audit-trail/" },
            { label: "Concepts", link: "/concepts/" },
          ],
        },
        {
          label: "Reference",
          items: [
            { label: "CLI", link: "/reference/cli/" },
            { label: "MCP tools", link: "/reference/mcp-tools/" },
            { label: "Entity paths", link: "/reference/entity-paths/" },
            { label: "Configuration", link: "/reference/configuration/" },
          ],
        },
        {
          label: "Set up your editor",
          items: mcpItems,
        },
        {
          label: "Compare",
          items: [
            { label: "Selvedge vs. git blame", link: "/compare/git-blame/" },
            { label: "Instruction files and ADRs", link: "/compare/instructions-and-adrs/" },
            { label: "Selvedge vs. AgentDiff & friends", link: "/compare/agent-tools/" },
            { label: "Codebase-memory servers", link: "/compare/codebase-memory-mcp-servers/" },
            { label: "Agent Trace interop", link: "/compare/agent-trace/" },
            ...compareItems,
          ],
        },
        {
          label: "Project",
          items: [
            { label: "What's new", link: "/project/changelog/" },
            { label: "Upgrading", link: "/upgrade/" },
            { label: "Roadmap", link: "/project/roadmap/" },
            { label: "FAQ", link: "/project/faq/" },
          ],
        },
      ],
      lastUpdated: true,
      pagination: true,
      tableOfContents: { minHeadingLevel: 2, maxHeadingLevel: 3 },
    }),
  ],

  adapter: cloudflare()
});
