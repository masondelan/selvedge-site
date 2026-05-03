---
title: Agent Trace interop
description: Selvedge as a compatible producer for the emerging Agent Trace open standard. Wire format + design notes for selvedge export --format agent-trace.
---

[Agent Trace](https://github.com/cursor/agent-trace) is an emerging open standard for
AI code attribution traces. Cursor and Cognition AI published the RFC in January 2026,
with backing from Cloudflare, Vercel, Google Jules, Amp, OpenCode, and git-ai.

Selvedge **is not a competitor to Agent Trace.** It's a compatible producer. Agent
Trace is the wire format; Selvedge is the live capture + query layer that emits it.

## Why both layers exist

Agent Trace standardizes the **transport** — how attribution data crosses tool
boundaries. It doesn't prescribe how individual agents capture that data, and it
doesn't provide a query layer.

Selvedge fills both gaps:

- **Capture** — the MCP-server contract that agents call as they work
- **Query** — the CLI + MCP read tools (`blame`, `diff`, `history`, `changeset`,
  `search`)

The two layers are orthogonal. You can have Selvedge without Agent Trace (you do, by
default). You can have Agent Trace without Selvedge (consume from another producer).
Together, you get cross-tool readable history that survives a tool migration.

## What `selvedge export --format agent-trace` will do

The export design lives in [`docs/agent-trace-interop.md`](https://github.com/masondelan/selvedge/blob/main/docs/agent-trace-interop.md)
in the source repo. Briefly:

- One Agent Trace record per Selvedge event
- `actor` ← Selvedge `agent` field
- `target` ← Selvedge `entity_path`
- `intent` ← Selvedge `reasoning`
- `commit_hash` ← Selvedge `git_commit`
- `tags` includes `selvedge:changeset:<changeset_id>` when present
- Source-of-truth annotation: `produced_by: selvedge@<version>`

The mapping is straightforward because both formats are entity-level + reasoning-aware
by design. The fields line up almost 1:1.

## Cross-tool observability

The longer-term play: Selvedge events are exportable as Agent Trace records, and Agent
Trace records will be readable by:

- **Sentry / Datadog** — link a stack trace to the Selvedge event for the column / env
  var / function involved
- **GitHub Copilot / Cursor** — show "this change was made by claude-code in
  changeset:add-stripe-billing" inline as you read code
- **SOC 2 / EU AI Act audit tooling** — emit an immutable, attributable trail of
  every AI-made change

You don't have to wait for any of that to use Selvedge. The local SQLite file is the
canonical store, and `selvedge export --format agent-trace` is opt-in. But if and when
the cross-tool ecosystem solidifies, your data is already in a format that travels.

## Why not just use Agent Trace directly?

You can. If you have a tool that already speaks Agent Trace and you don't need the
local query layer, skip Selvedge.

Selvedge wins when:

1. **You want a reasoning-quality validator.** Agent Trace doesn't prescribe one.
   Selvedge runs every incoming `reasoning` through `selvedge.validation` and surfaces
   weak/empty cases via `selvedge stats`.
2. **You want changesets.** Agent Trace doesn't have first-class changeset semantics
   yet (it's an open RFC issue). Selvedge does, and exports them as `tags`.
3. **You want a CLI you can pipe.** `selvedge blame`, `selvedge diff`,
   `selvedge changeset` — none of these have an Agent-Trace-native equivalent.
4. **You don't want a network dependency.** Selvedge is local SQLite; Agent Trace
   producers and consumers can be anywhere.

## Roadmap

- **v0.3.x** — Selvedge native MCP + CLI interface (current)
- **v0.4.0** — `selvedge export --format agent-trace` ships
- **v0.4.x** — `selvedge import --format agent-trace` for ingesting from non-Selvedge
  producers
- **v1.0.0** — webhook events on schema changes, optional Agent-Trace-native push to a
  remote sink

The export comes first, the import second; Selvedge becomes a bidirectional Agent Trace
node by v0.4.x.

## Where to read more

- [**Agent Trace RFC**](https://github.com/cursor/agent-trace) — the open standard
- [**Selvedge → Agent Trace mapping doc**](https://github.com/masondelan/selvedge/blob/main/docs/agent-trace-interop.md)
  — design notes
- [**Comparison page →**](/compare/agent-tools/) — how Selvedge differs from
  AgentDiff, Origin, etc.
