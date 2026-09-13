---
title: FAQ
description: Common questions about Selvedge — what it does, what it doesn't, where the data lives, and the gotchas.
---

## What's the one-line description?

Selvedge is a local MCP server and CLI for recording code decisions, stated reasoning, and rejected approaches so they can be retrieved in later sessions.

## Is it open source?

Yes. MIT-licensed. Source: [github.com/masondelan/selvedge](https://github.com/masondelan/selvedge).

## Where does my data live?

In a SQLite file under `.selvedge/selvedge.db` next to your code, or `~/.selvedge/selvedge.db` when no project database is found. Run `selvedge init` to create a project database.

Local history queries do not require a hosted backend. An MCP client may send retrieved records to its model provider. Sharing or publishing the database shares its contents, so private records need a private destination.

Selvedge also has an optional usage heartbeat, off by default, and a PyPI version check. These requests do not include code, entity paths, diffs, or reasoning. `SELVEDGE_TELEMETRY=0` disables the heartbeat.

## Can I commit `.selvedge/` to git?

Only if everyone with repository access should see its recorded contents. For public repositories, that means the records become public. Keep private reasoning in a private database.

Back up the database consistently before sharing it, and plan how collaborators will reconcile changes. A SQLite file in git is not automatic multi-writer history synchronization.

## What if I'm using a different AI tool?

Selvedge exposes standard MCP tools and a CLI. The setup wizard supports Claude Code, Cursor, Copilot, Codex, Gemini CLI, and Windsurf; see the editor-specific setup guides for configuration and instruction files. Other MCP clients can be configured manually.

Without MCP, an agent or human with shell access can record and retrieve decisions through the CLI. Claude Code lifecycle hooks do not automatically apply to other clients.

## How do I stop my agent repeating a mistake it already made and reverted?

Give it a queryable per-entity history and make checking it the first instruction. The
agent calls `prior_attempts` on an entity before editing; a reverted prior attempt comes
back with the reasoning for the revert, and the agent plans around it. Full worked
example: [stop your agent repeating reverted mistakes](/prior-attempts/).

## Why MCP instead of a plain CLI hook?

MCP lets a compatible agent discover and call Selvedge tools while it works. The CLI exposes the same local read and write operations, so either route can support recording a decision and querying it before a later edit. Use the interface available in your agent environment.

## Does the agent really call `log_change` reliably?

Verify it in your workflow. `selvedge stats` reports observed tool calls, per-agent logging counts, and reasoning-quality signals. The logging ratio is a share of recorded tool calls; it does not measure every edit in the repository. Inspect a later-session retrieval and the actual changes when evaluating coverage.

## What's "reasoning quality validation"?

`log_change` runs incoming `reasoning` through a regex-and-length validator. It catches:

- Empty reasoning
- Reasoning under 20 characters
- Generic placeholders: `"user request"`, `"as requested"`, `"per request"`, `"done"`,
  `"n/a"`, `"none"`, `"todo"`, `"see diff"`/`"see code"`/`"see pr"`,
  `"fix"`/`"fixed"`, `"add"`/`"added"`, `"remove"`/`"removed"`, `"update"`/`"updated"`,
  `"change"`/`"changed"`

Failed reasoning still gets logged (warnings are advisory) but appears in the default
`selvedge stats` output as a low-quality-reasoning count. The point is to surface the
agent silently shipping low-quality logs so you can fix the prompt.

## Why no LLM in core?

Selvedge uses deterministic rules for history queries and reasoning-quality checks. An LLM call would add a network dependency and a different reliability and cost model. The package has runtime dependencies, including the MCP SDK, Click, and Rich; the optional semantic extra adds a local embeddings model. No LLM is required by the core.

## Will my old database keep working when I upgrade?

Yes. Selvedge has a versioned migration system since v0.3.1, and every migration is
recorded in a `schema_migrations` table. Pre-v0.3.1 databases are bootstrapped without
re-running DDL that would error.

If you're on v0.2.x and an upgrade misbehaves, run `selvedge doctor` — it'll tell you
exactly which migration step is failing.

## Why "selvedge"?

The selvedge is the finished, self-bound edge of a roll of fabric — woven during the
fabric's creation and visible afterwards as the dense, color-banded edge that doesn't
fray. The brand pairs that with a thin red stripe in tribute to the red selvedge thread
on classic Japanese denim.

The product analogy is direct: capture the edge of the change as it's being made, and
it survives long after the diff has been incorporated and forgotten. Like the selvedge,
the why is woven in at creation time — not stitched on later.

## I want to contribute / report a bug / ask a question.

- **Bugs and feature ideas:** [GitHub Issues](https://github.com/masondelan/selvedge/issues)
- **PRs:** [github.com/masondelan/selvedge](https://github.com/masondelan/selvedge) —
  pytest, ruff, and mypy all need to be green
- **Email:** [hello@selvedge.sh](mailto:hello@selvedge.sh) — for things that don't fit
  in an issue
