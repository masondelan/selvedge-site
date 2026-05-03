---
title: Quickstart
description: Three commands. The third one is an interactive wizard that detects your AI tools and wires Selvedge into each one. Backups before any disk write.
---

```bash
pip install selvedge
cd your-project
selvedge setup
```

That's it. `selvedge setup` is an interactive wizard: it detects which AI tools you have
(Claude Code, Cursor, Copilot), writes the MCP entry into each one's config, drops the
canonical agent-instructions block into your project's prompt file (`CLAUDE.md` /
`.cursorrules` / `copilot-instructions.md`), runs `selvedge init`, and installs the
post-commit hook. Every modified file gets a `.bak` written next to it before any change
reaches disk. Re-running is a no-op.

For CI bootstrap or `devcontainer.json` `postCreateCommand`:

```bash
selvedge setup --non-interactive --yes
```

## Verify the wiring

Open a second terminal in the same project:

```bash
selvedge watch
```

Make any change in your AI tool — add a column, rename a function, add an env var.
`selvedge watch` should print the new event within a second of the agent calling
`log_change`. If nothing arrives, run `selvedge doctor` for a single-command health
check that tells you which step is silently broken.

## Query your history

```bash
selvedge status                        # recent activity + missing-commit count
selvedge diff users                    # all changes to the users table
selvedge diff users.email              # changes to a specific column
selvedge blame payments.amount         # what changed last and why
selvedge history --since 30d           # last 30 days of changes
selvedge history --since 15m           # last 15 minutes ('m' = minutes)
selvedge changeset add-stripe-billing  # all events for a feature/task
selvedge search "stripe"               # full-text search
selvedge stats                         # log_change coverage report (per-agent)
selvedge import migrations/            # backfill from migration files
selvedge export --format csv           # dump history to CSV
```

All read commands support `--json` for machine-readable output.

## Manual install (if you'd rather wire it up yourself)

If you don't want to run the wizard, the four manual steps it automates:

### 1. Initialize in your project

```bash
cd your-project
selvedge init
```

### 2. Add to your AI tool's config

For Claude Code (`~/.claude/config.json`):

```json
{
  "mcpServers": {
    "selvedge": {
      "command": "selvedge-server"
    }
  }
}
```

For Cursor: `~/.cursor/mcp.json` (same shape). For Copilot:
`.github/copilot-instructions.md` (different format — see `selvedge prompt --help`).

### 3. Tell your agent to use it

```bash
selvedge prompt --install CLAUDE.md
```

This installs the canonical agent-instructions block, sentinel-bracketed
(`<!-- selvedge:start -->` / `<!-- selvedge:end -->`) so future `--install` calls update
the bracketed region without disturbing anything else in the file. Or pipe it:

```bash
selvedge prompt | tee -a CLAUDE.md
```

### 4. Install the post-commit hook

```bash
selvedge install-hook
```

That's the same four steps the wizard runs.

## Coverage checking

Wondering how often your agent actually calls `log_change`?

```bash
selvedge stats
```

Per-agent breakdown, missing-reasoning count, and last call timestamp. Cross-reference
against git commits with `python scripts/coverage_check.py --since 30d` (in the source
repo). Low coverage usually means the system prompt needs strengthening.

## Next

[**CLI reference →**](/reference/cli/) — every flag, every subcommand.
[**MCP tools →**](/reference/mcp-tools/) — the six tools agents call.
[**FAQ →**](/project/faq/) — common questions, gotchas, and limits.
