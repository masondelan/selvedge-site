---
title: How it works
description: The MCP plumbing in plain prose. Selvedge is a local subprocess that AI agents call over JSON-RPC stdio. Storage is SQLite. Zero network hops.
---

Selvedge is a local MCP server. That sentence does a lot of work — here it is in plain
prose.

## The flow

1. **You install the package.** `pip install selvedge` puts two binaries on your
   `PATH`: `selvedge` (the CLI you use) and `selvedge-server` (the MCP subprocess your
   agent talks to).
2. **`selvedge setup` wires your AI tools.** It writes
   `{"mcpServers": {"selvedge": {"command": "selvedge-server"}}}` into each tool's
   config (Claude Code, Cursor, Copilot). The tool launches `selvedge-server` as a
   subprocess on first use and speaks JSON-RPC over stdio.
3. **The agent calls Selvedge tools as it works.** When Claude Code (or whichever
   agent) makes a change to your code, it calls `log_change` with the entity that
   changed, the change type, the diff, and the **reasoning** — the why, written from
   the same context window that produced the change.
4. **Selvedge writes to SQLite.** `.selvedge/selvedge.db` next to your code. WAL mode
   means concurrent readers and writers don't block each other. Schema migrations are
   versioned and atomic.
5. **You query.** `selvedge blame`, `selvedge diff`, `selvedge history`, etc. — all
   reading the same SQLite file. The MCP server queries the same file too, so agents
   can ask their own history when they need context.

There is no network hop, no account, no telemetry, no cloud anything. The only thing
crossing a process boundary is the JSON-RPC stdio between your AI tool and
`selvedge-server`.

## What lives in the SQLite file

Two main tables.

**`change_events`** — one row per logged change. Fields: `id`, `timestamp` (UTC,
canonical `Z` suffix), `entity_path`, `entity_type`, `change_type`, `diff`,
`reasoning`, `agent`, `session_id`, `git_commit`, `project`, `changeset_id`. Indexed on
all the things you'd query: `entity_path` (with prefix-LIKE support),
`(timestamp, project)`, `changeset_id`.

**`tool_calls`** — local-only telemetry of every MCP tool invocation. Powers
`selvedge stats` and the coverage script. Never networked. The schema includes the
calling agent's name (added in v0.3.2's `agent` column) so per-agent breakdowns work.

A `schema_migrations` table records every migration version + applied timestamp, so DB
upgrades are safe across versions and partial-failure scenarios roll back atomically.

## Why MCP and not a REST API?

A few reasons:

- **Already-on-your-machine tools speak MCP.** Claude Code, Cursor, Copilot all support
  it. Adding a single line to a config file gives you tool-call access from inside the
  agent loop. No SDK install, no API key, no auth flow.
- **Zero network attack surface.** The server only listens on stdio of a subprocess your
  agent launched. No port, no keys, no inbound anything. If your laptop's offline,
  Selvedge still works.
- **Process boundary, not network boundary.** Latency is microseconds. The agent calls
  `log_change` ten times in a session and you don't notice it.

A REST API for team / cross-machine / dashboard use cases is on the roadmap (Phase 3 —
v0.4.0), but the local-first MCP server is the canonical interface and will stay so.

## What "captured live" means in practice

The agent's tool call looks like this:

```json
{
  "tool": "log_change",
  "arguments": {
    "entity_path": "users.tier_v2",
    "entity_type": "column",
    "change_type": "add",
    "diff": "+ tier_v2 TEXT NOT NULL DEFAULT 'free'",
    "reasoning": "Adding a grandfathering flag for legacy free-tier users during the pricing migration. Stores the original tier so we can backfill discounts without touching billing history.",
    "agent": "claude-code",
    "changeset_id": "add-stripe-billing"
  }
}
```

The `reasoning` field comes from the agent's own context — the same conversation that
produced the column. No second LLM, no diff inference. When you read it back six months
later in `selvedge blame`, that's what the agent was actually thinking, not a
reconstruction.

## Reasoning quality

`log_change` runs incoming reasoning through a quality validator. Empty, too-short
(under 20 characters), or generic-placeholder reasoning (`"user request"`, `"done"`,
`"n/a"`, `"see above"`, etc.) produces a `warnings` array in the response. The event is
still logged — warnings are advisory — but they show up in
`selvedge stats --missing-reasoning` so you can spot agents that are calling the tool
but not actually capturing intent.

The validator lives at `selvedge.validation` and the same patterns are used by the
`selvedge log` CLI command, so manually-logged events get the same warnings.

## Concurrency and durability

- **WAL mode** + `PRAGMA busy_timeout = 5000` handles the common contention case at the
  C level.
- **Connection-with-retry** on every storage write — exponential backoff, 5 attempts,
  capped at 1s sleeps — covers the cases that escape the C-level timeout.
- **`tests/test_concurrency.py`** spawns 8 threads writing 25 events each and asserts
  all 200 land. So the answer to "is it safe under a long-lived agent pool that's
  hitting it from multiple sessions" is empirically yes.

## What runs on what

```text
your AI tool
   │
   │  stdio JSON-RPC
   ▼
selvedge-server (subprocess)
   │
   │  Python imports
   ▼
selvedge.storage  ──→  .selvedge/selvedge.db (SQLite, WAL)
selvedge.cli      ──→  same file (you, when you query)
```

The `selvedge` CLI and the `selvedge-server` MCP both go through the same
`selvedge.storage` layer, so the read your agent does and the read you do see exactly
the same data with exactly the same semantics.

## Next

[**CLI reference →**](/reference/cli/)
[**MCP tool reference →**](/reference/mcp-tools/)
[**Configuration →**](/reference/configuration/)
