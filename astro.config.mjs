import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

// https://astro.build/config
export default defineConfig({
  site: "https://selvedge.sh",
  integrations: [
    starlight({
      title: "selvedge",
      description:
        "Long-term memory for AI-coded codebases. A git blame for the why — captured live, by the agent, as the change happens.",
      logo: {
        src: "./src/assets/wordmark.svg",
        replacesTitle: true,
      },
      favicon: "/favicon.svg",
      head: [
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
      social: {
        github: "https://github.com/masondelan/selvedge",
      },
      customCss: ["./src/styles/selvedge.css"],
      components: {
        // Override the default Starlight hero with our own that includes
        // the wordmark + selvedge stripe + install command.
        Hero: "./src/components/SelvedgeHero.astro",
      },
      sidebar: [
        {
          label: "Start here",
          items: [
            { label: "What is Selvedge?", link: "/start/what-is-selvedge/" },
            { label: "Quickstart", link: "/start/quickstart/" },
            { label: "How it works", link: "/start/how-it-works/" },
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
          label: "Compare",
          items: [
            { label: "Selvedge vs. git blame", link: "/compare/git-blame/" },
            { label: "Selvedge vs. AgentDiff & friends", link: "/compare/agent-tools/" },
            { label: "Agent Trace interop", link: "/compare/agent-trace/" },
          ],
        },
        {
          label: "Project",
          items: [
            { label: "What's new", link: "/project/changelog/" },
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
});
