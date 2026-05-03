---
title: FAQ
description: Common questions about Selvedge — what it does, what it doesn't, where the data lives, and the gotchas.
---

## What's the one-line description?

Selvedge is a local MCP server that captures the *why* behind every AI-written change,
in the same context window that produced the change.

## Is it open source?

Yes. MIT-licensed. Source: [github.com/masondelan/selvedge](https://github.com/masondelan/selvedge).

## Where does my data live?

In a SQLite file under `.selvedge/selvedge.db` next to your code (or
`~/.selvedge/selvedge.db` if no project DB is found and you didn't `selvedge init`).

It does not leave your machine. There's no telemetry, no remote endpoint, no opt-in or
opt-out — the data simply doesn't go anywhere by default. The roadmap includes an
optional HTTP layer (v0.4.0) for self-hosted team servers; it's never sending data to
us.

## Can I commit `.selvedge/` to git?

Yes — and for most projects, it's a good idea. SQLite + WAL handles concurrent CI
checkouts well, and committing the DB means everyone on the team sees the same
history.

For monorepos where each microservice maintains its own history independently, you
might prefer to `.gitignore` everything except `.selvedge/.gitkeep`.

## What if I'm using a different AI tool?

Selvedge works with anything that speaks MCP. Claude Code, Cursor, Copilot are
detected automatically by `selvedge setup`. For others, follow the manual install:
add `{"mcpServers": {"selvedge": {"command": "selvedge-server"}}}` to the tool's MCP
config and drop the agent-instructions block (`selvedge prompt`) into the tool's
system prompt.

If your AI tool doesn't support MCP, Selvedge can't capture *live* — but you can still
use the CLI for manual logging via `selvedge log` and import historical migrations via
`selvedge import`.

## Why MCP instead of a plain CLI hook?

Because MCP gives the agent **access to its own history**. Your agent can call
`selvedge blame` and `selvedge diff` while it's working — so when it goes to modify a
column it changed last sprint, it can read the prior reasoning before deciding.

A plain CLI hook captures one direction (write). MCP captures both (write + read).
For an AI-coded codebase that lives for years, the read direction is at least as
valuable as the write direction.

## Does the agent really call `log_change` reliably?

That's exactly what `selvedge stats` answers. Per-agent breakdown of total calls,
log_change calls, coverage ratio, and missing-reasoning count. If your agent's coverage
is low, the system prompt needs strengthening — see `docs/fallbacks.md` in the source
repo for guidance.

## What's "reasoning quality validation"?

`log_change` runs incoming `reasoning` through a regex-and-length validator. It catches:

- Empty reasoning
- Reasoning under 20 characters
- Generic placeholders: `"user request"`, `"done"`, `"n/a"`, `"see above"`,
  `"fix"`/`"fixed"`, `"add"`/`"added"`, `"update"`/`"updated"`, `"change"`/`"changed"`

Failed reasoning still gets logged (warnings are advisory) but appears in
`selvedge stats --missing-reasoning`. The point is to surface the agent silently
shipping low-quality logs so you can fix the prompt.

## Why no LLM in core?

Two reasons:

1. **Templated output is deterministic.** A regex validator behaves the same on every
   commit. An LLM in the loop introduces non-determinism that's miserable to test.
2. **Local-first dependency budget.** Adding an LLM hop means an API key, a network
   dependency, latency, and ongoing cost. Selvedge installs in three deps for a
   reason.

PRs that add LLM calls inside core get rejected.

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
