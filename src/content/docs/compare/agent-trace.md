---
title: Agent Trace interop
description: Selvedge as a compatible producer for the Agent Trace open standard. Wire format + mapping for selvedge export --format agent-trace (shipped in v0.3.9).
---

[Agent Trace](https://github.com/cursor/agent-trace) is an emerging open standard for
AI code attribution traces. Cursor and Cognition AI published the RFC in January 2026,
with backing from Cloudflare, Vercel, Google Jules, Amp, OpenCode, and git-ai.

Selvedge **is not a competitor to Agent Trace.** It's a compatible producer. Agent
Trace is the wire format; Selvedge is the live capture + query layer that emits it. As
of **v0.3.9**, `selvedge export --format agent-trace` and `selvedge import --format
agent-trace` ship — Selvedge round-trips Agent Trace **v0.1.0** records today.

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

## What `selvedge export --format agent-trace` emits

Selvedge conforms to the **real** Agent Trace v0.1.0 record shape: line ranges live
*inside* each file's `conversations[]`, wrapped in a `tool` / `vcs` envelope, with all
Selvedge-specific data under the reverse-domain `metadata["dev.selvedge"]` namespace
(there is no top-level `contributors[]` or `extensions`). The full mapping is in
[`docs/agent-trace-interop.md`](https://github.com/masondelan/selvedge/blob/main/docs/agent-trace-interop.md).

```json
{
  "version": "0.1.0",
  "id": "<uuid>",
  "timestamp": "<rfc3339>",
  "vcs": { "type": "git", "revision": "<sha>" },
  "tool": { "name": "selvedge", "version": "<v>" },
  "files": [
    {
      "path": "<repo-relative path>",
      "conversations": [
        { "contributor": { "type": "ai" }, "ranges": [ { "start_line": 42, "end_line": 67 } ] }
      ]
    }
  ],
  "metadata": { "dev.selvedge": {} }
}
```

The mapping from a Selvedge `ChangeEvent`:

- `git_commit` → `vcs.revision` (`vcs.type = "git"`)
- producer identity → `tool = { name: "selvedge", version }`
- `agent` → `conversations[].contributor.type` (`ai`, else `unknown`); the agent *name* lands in `metadata["dev.selvedge"].agent`. `model_id` is **not** fabricated — Selvedge stores an agent name, not a models.dev id
- `entity_path` (file-typed) → `files[].path`; `diff` → `conversations[].ranges[]` via unified-diff hunk extraction
- `entity_path` (non-file: column, env var, dependency, route) → `metadata["dev.selvedge"].entity` with an empty `files[]` — no native Agent Trace concept
- `change_type`, `reasoning`, `session_id`, `changeset_id`, `project`, extra `metadata` — all under `metadata["dev.selvedge"]`

**Honest fidelity.** Entity-level events (a DB column, env var, dependency) and
migration-imported events have no line range, so they carry
`metadata["dev.selvedge"].range_unknown: true` and an empty `files[]` rather than a
fabricated `[1, 1]` placeholder. `--ndjson` streams one record per line for large
histories; `--collapse-by-session` merges a session's events into a single record.

## Cross-tool observability

Selvedge events are exportable as Agent Trace records, and Agent Trace records can be
read by:

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
yet (it's an open RFC issue). Selvedge does, and carries them in
`metadata["dev.selvedge"].changeset_id`.
3. **You want a CLI you can pipe.** `selvedge blame`, `selvedge diff`,
`selvedge changeset` — none of these have an Agent-Trace-native equivalent.
4. **You don't want a network dependency.** Selvedge is local SQLite; Agent Trace
producers and consumers can be anywhere.

## Roadmap

- **v0.3.x** — Selvedge native MCP + CLI interface
- **v0.3.9** — `selvedge export --format agent-trace` **and** `selvedge import --format agent-trace` shipped (Agent Trace v0.1.0, opt-in and additive). Selvedge is a bidirectional Agent Trace node today.
- **v0.4.0** — PostgreSQL backend + HTTP layer (the Phase 3 markers)
- **v1.0.0** — webhook events on schema changes, optional Agent-Trace-native push to a remote sink

## Where to read more

- [**Agent Trace RFC**](https://github.com/cursor/agent-trace) — the open standard
- [**Selvedge → Agent Trace mapping doc**](https://github.com/masondelan/selvedge/blob/main/docs/agent-trace-interop.md) — the shipped mapping + design notes
- [**Comparison page →**](/compare/agent-tools/) — how Selvedge differs from AgentDiff, Origin, etc.
