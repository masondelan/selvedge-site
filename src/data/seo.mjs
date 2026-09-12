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
// your PATH after `pip install selvedge`. The MCP tool count/names referenced in
// the verify steps are owned by `selvedge/server.py` in the codebase repo — re-check
// there (not here) whenever the tool surface changes.

export const ONE_LINER =
  "Long-term memory for AI-coded codebases — including what was already tried and rejected. A git blame for AI agents, for the why rather than which model touched which line — captured live, by the agent, as the change happens.";

/** @typedef {{name: string, text: string}} HowToStep */

export const clients = [
  {
    slug: "codex", name: "Codex",
    description: "Connect Selvedge to Codex with project MCP configuration and AGENTS.md. Recall rejected approaches and saved decisions in a new session.",
    blurb: "Selvedge gives Codex a local store for project decisions and rejected approaches. Run `selvedge setup --agent codex` (0.3.12+) to install project MCP configuration and instructions together.",
    oneClick: null, autoDetect: true,
    configPath: "`.codex/config.toml` in a trusted project, or `~/.codex/config.toml` for user-wide setup",
    configLang: "toml",
    configSnippet: `[mcp_servers.selvedge]
command = "uvx"
args = ["--from", "selvedge", "selvedge-server"]`,
    verify: "Restart Codex in the trusted project. Enable the Selvedge MCP server in Settings → MCP servers if needed. Ask Codex to record a real rejected approach with `log_change`, then retrieve it with `prior_attempts`. Start a new session and query the same entity.",
    gotcha: "Codex project configuration loads only for trusted projects. The setup wizard writes `.codex/config.toml` and installs instructions in `AGENTS.md`. Custom TOML entries must be reconciled manually. Make sure `uvx` (manual setup) or `selvedge-server` (wizard setup) is on the PATH Codex uses. Claude Code lifecycle hooks are not installed for Codex.",
    docsUrl: "https://learn.chatgpt.com/docs/extend/mcp?surface=cli",
  },
  {
    slug: "gemini", name: "Gemini CLI",
    description: "Connect Selvedge to Gemini CLI with project MCP settings and GEMINI.md instructions. Save and recall project decisions locally.",
    blurb: "Run `selvedge setup --agent gemini` (0.3.12+) to write the MCP entry and GEMINI.md instructions. Selvedge stores the reasoning Gemini CLI records and makes it available to subsequent sessions.",
    oneClick: null, autoDetect: true,
    configPath: "`.gemini/settings.json` in your project",
    configLang: "json",
    configSnippet: `{
  "mcpServers": {
    "selvedge": {
      "command": "uvx",
      "args": ["--from", "selvedge", "selvedge-server"]
    }
  }
}`,
    verify: "Restart Gemini CLI in the project. Run `/mcp` and confirm Selvedge's tools are available. Ask the agent to save a real rejected approach using `log_change` and retrieve it using `prior_attempts` in a new session.",
    gotcha: "The agent must be able to find `uvx` (manual config) or `selvedge-server` (wizard setup). Approve the server if prompted. Setup writes GEMINI.md so the agent knows when to use Selvedge; it does not install Claude Code lifecycle hooks.",
    docsUrl: "https://geminicli.com/docs/tools/mcp-server/",
  },
  {
    slug: "cursor",
    name: "Cursor",
    // Short, page-specific meta description (<= ~155 chars ideal).
    description:
      "Add Selvedge to Cursor as an MCP server so your agent logs why it changed code and checks prior reverted attempts before editing. One config file, or let selvedge setup write it.",
    blurb:
      "Cursor speaks MCP natively, so wiring in Selvedge takes one config file. Once it's connected, the agent can call `log_change` as it works and `prior_attempts` before it edits.",
    oneClick: null,
    configPath: "`~/.cursor/mcp.json` (all projects) or `.cursor/mcp.json` (this project only)",
    configLang: "json",
    configSnippet: `{
  "mcpServers": {
    "selvedge": {
      "command": "uvx",
      "args": ["--from", "selvedge", "selvedge-server"]
    }
  }
}`,
    autoDetect: true,
    verify:
      "Open **Cursor Settings → MCP**. `selvedge` should be listed with its 8 tools. Or run `selvedge watch` in a terminal and make a change — the event prints within a second.",
    gotcha:
      "These configs run the server with `uvx`, which ships with [uv](https://docs.astral.sh/uv/) — so the one prerequisite is `uv` on the PATH Cursor launches with (`curl -LsSf https://astral.sh/uv/install.sh | sh`). Prefer a global install instead? `pip install selvedge` and set `command` to `selvedge-server`.",
    docsUrl: "https://cursor.com/docs/context/mcp",
  },
  {
    slug: "vscode",
    name: "VS Code",
    description:
      "Add Selvedge to VS Code as an MCP server so Copilot's agent logs why it changed code and checks prior reverted attempts before editing. Just one config file.",
    blurb:
      "VS Code supports MCP servers natively, so wiring in Selvedge takes one config file. Once it's connected, Copilot's agent mode can call `log_change` as it works and `prior_attempts` before it edits.",
    oneClick: null,
    configPath:
      "`.vscode/mcp.json` (this workspace) — or your user `mcp.json` via the Command Palette's **MCP: Open User Configuration**",
    configLang: "json",
    configSnippet: `{
  "servers": {
    "selvedge": {
      "type": "stdio",
      "command": "uvx",
      "args": ["--from", "selvedge", "selvedge-server"]
    }
  }
}`,
    autoDetect: false,
    verify:
      "Open the **Chat** view, switch to **Agent** mode, and open the tools picker — `selvedge` should be listed with its 8 tools. Or run **MCP: List Servers** from the Command Palette and confirm `selvedge` shows as *Running*.",
    gotcha:
      "MCP tools only surface in the Chat view's **Agent** mode. The config runs the server with `uvx` (which ships with [uv](https://docs.astral.sh/uv/)), so make sure `uv` is on the PATH VS Code launches with (`curl -LsSf https://astral.sh/uv/install.sh | sh`). Prefer a global install? `pip install selvedge` and set `command` to `selvedge-server`.",
    docsUrl: "https://code.visualstudio.com/docs/copilot/chat/mcp-servers",
  },
  {
    slug: "claude-code",
    name: "Claude Code",
    description:
      "Add Selvedge to Claude Code via the plugin (two commands, no prior pip install — it bootstraps the server) or a single claude mcp add, so the agent logs why each change happened and checks prior attempts first.",
    blurb:
      "Two ways in: the **plugin** (`/plugin install`, no prior `pip install` — it bootstraps the server and ships a skill, the PreToolUse enforcement hook, and slash commands), or a single `claude mcp add` for just the MCP server. The auto-detecting `selvedge setup` wizard works too.",
    oneClick: null,
    command: {
      intro: "The fastest path — register the stdio server with one command:",
      lang: "bash",
      snippet: `claude mcp add selvedge -- uvx --from selvedge selvedge-server`,
      note: "Add `--scope user` to make it available across all your projects, or `--scope project` to write a shared `.mcp.json` you can commit so the whole team gets it. Local scope (the default) keeps it to you in the current project.",
    },
    altInstall: {
      title: "Install as a Claude Code plugin (no prior pip install)",
      lang: "text",
      snippet: `/plugin marketplace add masondelan/selvedge
/plugin install selvedge@selvedge`,
      note: "Two commands — the plugin bootstraps the server via `uvx`/`pipx`, so no prior `pip install` is needed. One install brings the MCP server, a skill that tells the agent when to use it, the PreToolUse enforcement hook, and the `/selvedge:status`, `blame`, `history`, and `prior-attempts` slash commands. Prefer a pinned install? `pip install selvedge` and the launcher uses it instead of uvx.",
    },
    configPath: "`~/.claude.json` (local/user scope) or `.mcp.json` at the project root (project scope)",
    configLang: "json",
    configSnippet: `{
  "mcpServers": {
    "selvedge": {
      "command": "uvx",
      "args": ["--from", "selvedge", "selvedge-server"]
    }
  }
}`,
    autoDetect: true,
    verify:
      "Run `/mcp` inside Claude Code (or `claude mcp list` in a terminal). `selvedge` should show as connected with its 8 tools.",
    gotcha:
      "If `claude mcp list` shows selvedge as *failed*, `uvx` (from uv) isn't on the PATH Claude Code spawns with — install uv, then re-run. Prefer a global install? Register `-- selvedge-server` after `pip install selvedge` instead.",
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
      "command": "uvx",
      "args": ["--from", "selvedge", "selvedge-server"]
    }
  }
}`,
    autoDetect: false,
    verify:
      "Open Cline's **MCP Servers** panel — `selvedge` should appear with a green dot and its 8 tools listed. Then ask Cline to make a structural change and confirm it calls `log_change`.",
    gotcha:
      "Cline runs the command in your VS Code environment. If the server won't start, make sure `uv` is installed there (the config calls `uvx`, which ships with uv). Prefer a global install? `pip install selvedge` and set `command` to `selvedge-server`.",
    docsUrl: "https://docs.cline.bot/mcp/configuring-mcp-servers",
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
      "command": "uvx",
      "args": ["--from", "selvedge", "selvedge-server"]
    }
  }
}`,
    autoDetect: false,
    verify:
      "Back in the Cascade **MCPs** panel, refresh the server list — `selvedge` should connect and expose its 8 tools.",
    gotcha:
      "After editing `mcp_config.json`, **fully quit and reopen Windsurf** — closing the window alone doesn't reload MCP servers. The config calls `uvx`, so make sure `uv` is installed (or `pip install selvedge` and use `command: selvedge-server`).",
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
    command: uvx
    args: ["--from", "selvedge", "selvedge-server"]`,
    autoDetect: false,
    verify:
      "Switch Continue to **Agent** mode and open its tools list — the `selvedge` tools should be available. (MCP tools are only callable in agent/chat-with-tools mode.)",
    gotcha:
      "Continue's YAML config supports stdio servers only (which is all Selvedge needs). Keep the two-space indentation exactly as shown — YAML is whitespace-sensitive. The config calls `uvx`, so `uv` must be installed (or `pip install selvedge` and use `command: selvedge-server`).",
    docsUrl: "https://docs.continue.dev/customize/deep-dives/mcp",
  },
];

export const comparisons = [
  {
    slug: "openlore",
    tool: "OpenLore",
    description:
      "Selvedge vs. OpenLore: two deterministic, local-first memory layers for coding agents. The split is testimony vs. derivation \u2014 and what each one does with a rejected decision.",
    summary:
      "OpenLore is the closest thing to Selvedge in the category, and the most useful comparison because of it: both are local-first, both are deterministic, and neither puts an LLM in the retrieval path. The difference is where the memory comes from, and what survives in it.",
    them: {
      reasoning:
        "**Derived** \u2014 tree-sitter static analysis of code state, plus commit-gated decision notes",
      granularity: "AST node (18 languages + 12 IaC)",
      mechanism: "MCP server \u2014 one-time index + commit-time certificates",
      grouping: "Call-graph edges",
      priorAttempts:
        "Purged \u2014 `rejected` is an inactive status, dropped from the queryable store after each decision sync",
      storage: "SQLite graph in `.openlore/`",
    },
    differences: [
      "**Determinism is shared ground here, not a differentiator.** Against most of this category Selvedge leads on having no model in the storage or retrieval path. OpenLore is deterministic-native too \u2014 its own description is \"no LLM in the hot path\" \u2014 so that argument doesn't separate the two, and we won't pretend it does.",
      "**Testimony vs. derivation.** OpenLore derives what it knows from the code as it stands: a static analysis can always be recomputed, so it can only ever describe the state that survived. Selvedge stores what the agent *said* at the time. Testimony is not re-derivable from the repository, which is exactly why it's worth keeping.",
      "**What happens to a rejected decision.** This is the sharp one. In OpenLore, `rejected` is one of the inactive statuses, and `purgeInactiveDecisions` drops those from the store after every decision sync \u2014 the annotation survives in the synced spec markdown, but the *queryable record* does not. In Selvedge the store is append-only: a rejection is a first-class, permanent, queryable fact, and `prior_attempts` is built to return it. Nothing in a purged store can answer \"has this been tried, and how did it turn out?\"",
      "**Entity granularity vs. AST node.** OpenLore's node coverage is broader across languages. Selvedge's entities are the things you search for six months later that have no AST node at all \u2014 `users.email`, `env/STRIPE_SECRET_KEY`, `deps/stripe`.",
    ],
    whenThem:
      "If what you want is a deterministic map of the code as it exists now \u2014 call graphs, AST-level structure, broad language coverage, decisions kept in step with the current spec \u2014 OpenLore is a strong and genuinely well-built fit, and its language coverage is wider than ours. Reach for Selvedge when the question you need answered is about the path *not* taken.",
  },
  {
    slug: "agentdiff",
    tool: "AgentDiff",
    // Two unrelated projects ship under this name. The row below describes
    // sunilmallya/agentdiff; codeprakhar25/agentdiff is ed25519-signed
    // cross-agent provenance. An unfalsifiable comparison row is worse
    // than no row.
    description:
      "Selvedge vs. AgentDiff: captured-live reasoning from the agent's own context vs. reasoning inferred post-hoc by a second LLM from the diff. Entity-level vs. line-level.",
    summary:
      "Both answer \"why did the agent write this?\" — but they capture the answer at opposite ends of the change. AgentDiff infers it *afterward* from the diff; Selvedge records it *as it happens*, from the agent itself.",
    them: {
      reasoning: "Inferred post-hoc by Claude Haiku from the diff at session end ([sunilmallya/agentdiff](https://github.com/sunilmallya/agentdiff); not to be confused with [codeprakhar25/agentdiff](https://github.com/codeprakhar25/agentdiff), which does signed cross-agent provenance)",
      granularity: "Line",
      mechanism: "Claude Code lifecycle hooks → local daemon",
      grouping: "None",
      priorAttempts: "None",
      storage: "JSONL on disk",
    },
    differences: [
      "**Testimony, not reconstruction.** AgentDiff feeds the finished diff to a second LLM that never saw the original prompt. What it returns may well be right — the problem is that it is *unverifiable and nonreproducible*: nothing distinguishes an accurate reconstruction from a merely plausible one, and re-running it can categorise the same change differently. Selvedge's reasoning is the agent's own words from the context that produced the change, and an empty `reasoning` is itself an honest signal.",
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
      "Selvedge vs. Origin: stated reasoning captured through MCP vs. automatic prompt receipts from agent lifecycle hooks. Entity-level rejected paths vs. line-level git-notes attribution.",
    summary:
      "Origin ([opsworks-co/origin-cli](https://github.com/opsworks-co/origin-cli)) captures automatically — agent lifecycle hooks record prompt receipts live, per turn, anchored to commits in git notes. Selvedge captures the agent's *stated reasoning* through MCP. The trade is coverage vs. content: receipts everywhere, or testimony where it matters.",
    them: {
      reasoning:
        "Prompt receipts, captured live per turn — prompt, diff, tokens; no stated rationale",
      granularity: "Line",
      mechanism: "Agent lifecycle hooks + global git post-commit hook",
      grouping: "Branch-level `trail` view; no entity-spanning changesets",
      priorAttempts:
        "None — `rework` flags reverted AI code post-hoc, without rationale",
      storage: "Git notes (`refs/notes/origin`) + a sessions branch; optional cloud sync",
    },
    differences: [
      "**Receipts vs. testimony.** Origin records what the prompt and the diff were — automatically, across a dozen-plus agents. Selvedge records what the agent *said it was doing and why*, from the context that had the reasoning. A receipt can tell you a change followed a prompt; it can't tell you which alternatives were weighed and killed.",
      "**Rejected paths.** Origin's `rework` command detects AI code that was later reverted or heavily modified — a post-hoc diff heuristic yielding a rework-rate report, with no rationale attached and no queryable record of *why* the approach died. Selvedge's `prior_attempts` returns the tried → reverted → re-opened trail with the stated reason at each step.",
      "**Entity-level granularity.** Selvedge's unit is the column / env var / route / dependency / function, with prefix queries — not lines that drift as the file evolves.",
      "**Read path for the agent.** `prior_attempts`, `blame`, `diff`, and `stale_decisions` are callable by the agent mid-task, and the SessionStart digest pushes standing verdicts into new sessions. Origin's queries (`origin why`, `origin blame`, session search) are developer-facing; nothing pushes a prior verdict back into the agent's context.",
    ],
    whenThem:
      "If you want automatic, zero-cooperation capture across a dozen-plus agents — prompts, diffs, and token costs riding along in git notes with optional cloud sync — Origin's coverage and near-zero adoption friction beat an MCP-cooperation model. Reach for Selvedge when what you need back is the reasoning and the rejected paths, not the receipts.",
  },
  {
    slug: "git-ai",
    tool: "Git AI",
    description:
      "Selvedge vs. Git AI: a live capture + query layer vs. git-notes attribution metadata. Selvedge adds reasoning, a query layer, and changesets, and emits the Agent Trace v0.1.0 format.",
    summary:
      "Git AI stores attribution metadata in git notes under its own Git AI standard. Selvedge is complementary: it adds live reasoning capture, a query layer, and changesets, and can also emit the Agent Trace v0.1.0 record format.",
    them: {
      reasoning: "Attribution metadata",
      granularity: "Line",
      mechanism: "Agent-invoked checkpoint \u2192 Git notes at commit",
      grouping: "None",
      priorAttempts: "None",
      storage: "Git notes",
    },
    differences: [
      "**Reasoning, not just attribution.** Git AI records *who/what* touched a line. Selvedge records *why*, in the agent's own words, captured live.",
      "**A query layer.** `selvedge blame`, `diff`, `history`, `changeset`, and `search` are first-class. Git-notes attribution has no equivalent CLI you can pipe.",
      "**Continuous vs. cooperative.** Git AI's own README states it does *not* rely on git hooks: the agent calls `git-ai checkpoint`, and attribution lands in git notes at commit time. That is cooperative snapshotting \u2014 it records what the agent chose to check point, when it chose to. Selvedge captures at the moment of each change.",
      "**Agent Trace interop.** Selvedge also emits [Agent Trace](https://agent-trace.dev/) v0.1.0 records — see the [Agent Trace interop page](/compare/agent-trace/). (Git AI itself has since moved to its own Git AI standard rather than Agent Trace.)",
      "**Entity-level + changesets** for querying the history of a column or a whole feature, not a line.",
    ],
    whenThem:
      "If all you need is line-level attribution metadata living in git notes under Git AI's own standard — and you don't need captured reasoning or a query layer — Git AI is a focused fit.",
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
      mechanism: "Agent-lifecycle hooks + post-commit hook",
      grouping: "None",
      priorAttempts: "None",
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
