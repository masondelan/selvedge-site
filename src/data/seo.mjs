// Single source of truth for the programmatic setup + comparison pages.
//
// `scripts/gen-seo-pages.mjs` reads this file and writes:
//   - src/content/docs/mcp/<slug>.md            (one per `clients` entry)
//   - src/content/docs/compare/selvedge-vs-<slug>.md  (one per `comparisons` entry)
//   - src/data/seo-nav.mjs                       (sidebar groups, imported by astro.config.mjs)
//
// Each generated file carries a "do not edit by hand" banner. To change a page,
// edit this file and re-run `node scripts/gen-seo-pages.mjs`.
//
// Per-client config snippets were verified against each tool's current docs
// (June 2026). `selvedge-server` is the stdio command the Python package puts on
// your PATH after `pip install selvedge`.

export const ONE_LINER =
  "Long-term memory for AI-coded codebases. A git blame for AI agents — but for the why, not just which line which model touched. Captured live, by the agent, as the change happens.";

/** @typedef {{name: string, text: string}} HowToStep */

export const clients = [
  {
    slug: "cursor",
    name: "Cursor",
    // Short, page-specific meta description (<= ~155 chars ideal).
    description:
      "Add Selvedge to Cursor as an MCP server so your agent logs why it changed code and checks prior reverted attempts before editing. One-click or one config file.",
    blurb:
      "Cursor speaks MCP natively, so wiring in Selvedge takes one config file (or one click). Once it's connected, the agent can call `log_change` as it works and `prior_attempts` before it edits.",
    oneClick: {
      label: "Add to Cursor",
      href: "cursor://anysphere.cursor-deeplink/mcp/install?name=selvedge&config=eyJjb21tYW5kIjoic2VsdmVkZ2Utc2VydmVyIn0=",
      img: "https://cursor.com/deeplink/mcp-install-dark.svg",
    },
    configPath: "`~/.cursor/mcp.json` (all projects) or `.cursor/mcp.json` (this project only)",
    configLang: "json",
    configSnippet: `{
  "mcpServers": {
    "selvedge": {
      "command": "selvedge-server"
    }
  }
}`,
    autoDetect: true,
    verify:
      "Open **Cursor Settings → MCP**. `selvedge` should be listed with its 8 tools (`log_change`, `prior_attempts`, `blame`, `diff`, `history`, `changeset`, `search`, `stale_decisions`). Or run `selvedge watch` in a terminal and make a change — the event prints within a second.",
    gotcha:
      "`selvedge-server` has to be on the PATH Cursor launches with. If Cursor can't start the server, you installed the package into a different environment than Cursor sees — install with `pipx install selvedge` (isolated, always on PATH) or point `command` at the absolute path that `which selvedge-server` prints.",
    docsUrl: "https://cursor.com/docs/context/mcp",
  },
  {
    slug: "claude-code",
    name: "Claude Code",
    description:
      "Add Selvedge to Claude Code in one command (claude mcp add) or via the plugin marketplace, so the agent logs why each change happened and checks prior attempts first.",
    blurb:
      "Claude Code has a first-class MCP CLI, so the fastest path is a single `claude mcp add`. There's also a plugin-marketplace install and the auto-detecting `selvedge setup` wizard.",
    oneClick: null,
    command: {
      intro: "The fastest path — register the stdio server with one command:",
      lang: "bash",
      snippet: `claude mcp add selvedge -- selvedge-server`,
      note: "Add `--scope user` to make it available across all your projects, or `--scope project` to write a shared `.mcp.json` you can commit so the whole team gets it. Local scope (the default) keeps it to you in the current project.",
    },
    altInstall: {
      title: "Plugin marketplace (Claude-Code-only alternative)",
      lang: "text",
      snippet: `/plugin marketplace add masondelan/selvedge
/plugin install selvedge@selvedge`,
      note: "Run `pip install selvedge` first either way — the plugin wires the MCP server but does not install the Python package that provides `selvedge-server`.",
    },
    configPath: "`~/.claude.json` (local/user scope) or `.mcp.json` at the project root (project scope)",
    configLang: "json",
    configSnippet: `{
  "mcpServers": {
    "selvedge": {
      "command": "selvedge-server"
    }
  }
}`,
    autoDetect: true,
    verify:
      "Run `/mcp` inside Claude Code (or `claude mcp list` in a terminal). `selvedge` should show as connected with its 8 tools.",
    gotcha:
      "If `claude mcp list` shows selvedge as *failed*, `selvedge-server` isn't on PATH for the shell Claude Code spawns. `pip install selvedge` (or `pipx install selvedge`) in that environment, then re-run.",
    docsUrl: "https://code.claude.com/docs/en/mcp",
  },
  {
    slug: "cline",
    name: "Cline",
    description:
      "Add Selvedge to Cline (the VS Code agent) as an MCP server so it logs why it changed code and checks whether a change was tried and reverted before repeating it.",
    blurb:
      "Cline is the open-source autonomous agent for VS Code. It reads MCP servers from its own settings file, so Selvedge drops in with a small JSON block.",
    oneClick: null,
    configPath: "`cline_mcp_settings.json` — open it from **Cline → MCP Servers → Configure MCP Servers**",
    configLang: "json",
    configSnippet: `{
  "mcpServers": {
    "selvedge": {
      "command": "selvedge-server"
    }
  }
}`,
    autoDetect: false,
    verify:
      "Open Cline's **MCP Servers** panel — `selvedge` should appear with a green dot and its 8 tools listed. Then ask Cline to make a structural change and confirm it calls `log_change`.",
    gotcha:
      "Cline runs the command in your VS Code environment. If the server won't start, `selvedge-server` isn't on that PATH — `pipx install selvedge` is the most reliable fix, or set `command` to the absolute path from `which selvedge-server`.",
    docsUrl: "https://github.com/masondelan/selvedge",
  },
  {
    slug: "windsurf",
    name: "Windsurf",
    description:
      "Add Selvedge to Windsurf (Cascade) as an MCP server so your agent records the why behind every change and can check prior reverted attempts before editing.",
    blurb:
      "Windsurf's Cascade agent loads MCP servers from a single JSON config. Add Selvedge there and Cascade gains the `log_change` / `prior_attempts` tools.",
    oneClick: null,
    configPath:
      "`~/.codeium/windsurf/mcp_config.json` — or open it from the **MCPs** icon in the Cascade panel → **Configure**",
    configLang: "json",
    configSnippet: `{
  "mcpServers": {
    "selvedge": {
      "command": "selvedge-server"
    }
  }
}`,
    autoDetect: false,
    verify:
      "Back in the Cascade **MCPs** panel, refresh the server list — `selvedge` should connect and expose its 8 tools.",
    gotcha:
      "After editing `mcp_config.json`, **fully quit and reopen Windsurf** — closing the window alone doesn't reload MCP servers. And as always, `selvedge-server` must be on PATH (`pipx install selvedge` if in doubt).",
    docsUrl: "https://docs.windsurf.com/windsurf/cascade/mcp",
  },
  {
    slug: "continue",
    name: "Continue",
    description:
      "Add Selvedge to Continue (the open-source VS Code / JetBrains assistant) as an MCP server so it logs why code changed and checks prior attempts before editing.",
    blurb:
      "Continue configures MCP servers in YAML. Add a `selvedge` entry under `mcpServers` and the assistant can call Selvedge's tools in agent mode.",
    oneClick: null,
    configPath:
      "`~/.continue/config.yaml` (global) — or a workspace file under `.continue/mcpServers/`",
    configLang: "yaml",
    configSnippet: `mcpServers:
  - name: selvedge
    command: selvedge-server`,
    autoDetect: false,
    verify:
      "Switch Continue to **Agent** mode and open its tools list — the `selvedge` tools should be available. (MCP tools are only callable in agent/chat-with-tools mode.)",
    gotcha:
      "Continue's YAML config supports stdio servers only (which is all Selvedge needs). Keep the two-space indentation exactly as shown — YAML is whitespace-sensitive. `selvedge-server` must be on PATH.",
    docsUrl: "https://docs.continue.dev/customize/deep-dives/mcp",
  },
];

export const comparisons = [
  {
    slug: "agentdiff",
    tool: "AgentDiff",
    description:
      "Selvedge vs. AgentDiff: captured-live reasoning from the agent's own context vs. reasoning inferred post-hoc by a second LLM from the diff. Entity-level vs. line-level.",
    summary:
      "Both answer \"why did the agent write this?\" — but they capture the answer at opposite ends of the change. AgentDiff infers it *afterward* from the diff; Selvedge records it *as it happens*, from the agent itself.",
    them: {
      reasoning: "Inferred post-hoc by Claude Haiku from the diff at session end",
      granularity: "Line",
      mechanism: "Git pre/post-commit hook",
      grouping: "None",
      storage: "JSONL on disk",
    },
    differences: [
      "**Captured live, not inferred.** AgentDiff feeds the finished diff back to a second LLM to *guess* the intent. Selvedge's reasoning is the agent's own words, written from the same context window that produced the change — no second model, no hallucinated rationale, and an empty `reasoning` is itself an honest signal.",
      "**Entity-level, not line-level.** Selvedge attributes the things you actually search for — `users.email`, `env/STRIPE_SECRET_KEY`, `deps/stripe` — so six months later you query the column, not a line range that has since moved.",
      "**Changesets.** Selvedge groups every event in a multi-file feature under one slug (`add-stripe-billing`); AgentDiff has no grouping.",
      "**It reads, too.** `prior_attempts` lets the agent ask \"was this tried and reverted?\" *before* it edits. A post-hoc capture tool only ever writes.",
    ],
    whenThem:
      "If you want a zero-config, fully passive trail that works with *any* tool (no MCP support required) and you're fine with after-the-fact LLM-inferred summaries at line granularity, a hook-based tool like AgentDiff is simpler to drop in.",
  },
  {
    slug: "origin",
    tool: "Origin",
    description:
      "Selvedge vs. Origin: MCP-server capture in the agent's context vs. commit-time git-hook capture. Entity-level history and changesets vs. line-level local storage.",
    summary:
      "Origin captures at commit time through a git hook. Selvedge captures *during* the work through MCP — so the why is tied to the agent's reasoning, not reconstructed at commit boundaries.",
    them: {
      reasoning: "Captured at commit time",
      granularity: "Line",
      mechanism: "Git hook",
      grouping: "None",
      storage: "Local",
    },
    differences: [
      "**Capture point.** Origin fires at commit time; a single agent session that makes five decisions and one commit collapses to one capture moment. Selvedge logs each structural change as the agent makes it, decision by decision.",
      "**Entity-level granularity.** Selvedge's unit is the column / env var / route / dependency / function, with prefix queries — not lines that drift as the file evolves.",
      "**Read path for the agent.** `prior_attempts`, `blame`, `diff`, and `stale_decisions` are callable by the agent mid-task. Origin is write-oriented.",
      "**Changesets** tie a whole feature's events together across many files and PRs.",
    ],
    whenThem:
      "If your workflow is commit-centric and you want attribution that lives entirely in the git hook with no MCP server in the loop, Origin's commit-time model is a lighter touch.",
  },
  {
    slug: "git-ai",
    tool: "Git AI",
    description:
      "Selvedge vs. Git AI: a live capture + query layer vs. git-notes attribution metadata. Selvedge is an Agent Trace producer with reasoning and changesets, not a competitor.",
    summary:
      "Git AI stores attribution metadata in git notes and plugs into the Agent Trace alliance. Selvedge is complementary: it's a compatible Agent Trace *producer* that adds live reasoning capture, a query layer, and changesets on top.",
    them: {
      reasoning: "Attribution metadata",
      granularity: "Line",
      mechanism: "Git hook + Agent Trace alliance",
      grouping: "None",
      storage: "Git notes",
    },
    differences: [
      "**Reasoning, not just attribution.** Git AI records *who/what* touched a line. Selvedge records *why*, in the agent's own words, captured live.",
      "**A query layer.** `selvedge blame`, `diff`, `history`, `changeset`, and `search` are first-class. Git-notes attribution has no equivalent CLI you can pipe.",
      "**Agent Trace interop, not rivalry.** Selvedge emits [Agent Trace](https://github.com/cursor/agent-trace) records too — see the [Agent Trace interop page](/compare/agent-trace/). The two layers compose: Git AI / Selvedge produce, downstream tools consume.",
      "**Entity-level + changesets** for querying the history of a column or a whole feature, not a line.",
    ],
    whenThem:
      "If all you need is line-level attribution metadata living in git notes and surfaced through the Agent Trace ecosystem — and you don't need captured reasoning or a query layer — Git AI is a focused fit.",
  },
  {
    slug: "blameprompt",
    tool: "BlamePrompt",
    description:
      "Selvedge vs. BlamePrompt: full structured change events (entity, diff, reasoning, changeset) captured live vs. prompt-only line attribution from a git hook.",
    summary:
      "BlamePrompt records the prompt behind a line. Selvedge records the full structured change event — entity, change type, diff, the agent's reasoning, and the changeset it belongs to — and lets the agent query it back.",
    them: {
      reasoning: "Prompt-only",
      granularity: "Line",
      mechanism: "Git hook",
      grouping: "None",
      storage: "Local",
    },
    differences: [
      "**Reasoning vs. raw prompt.** BlamePrompt keeps the prompt text. Selvedge keeps the agent's intent for *this* change, validated for quality (empty / generic reasoning is flagged in `selvedge stats`).",
      "**Entity-level** attribution with prefix queries, not line attribution that decays as code moves.",
      "**The agent can read its history** via `prior_attempts` / `blame` / `diff` before it acts.",
      "**Changesets** group a feature's events across files; BlamePrompt has no grouping.",
    ],
    whenThem:
      "If you only want the prompt-of-record stapled to a line and nothing more, BlamePrompt is the minimal version of the idea.",
  },
];
