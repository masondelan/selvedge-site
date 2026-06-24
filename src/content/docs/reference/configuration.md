---
title: Configuration
description: How Selvedge resolves the DB path, environment variables, project vs. global precedence, and the destructive-action opt-in flag.
---

Selvedge has very few knobs by design. As of v0.3.9 every setting lives in either an
environment variable or a flag — a first-class `.selvedge/config.toml` file lands in
v0.3.10 (see [below](#coming-in-v0310-selvedgeconfigtoml)).

## DB path resolution

Three sources, in order:

1. **`SELVEDGE_DB` environment variable** — explicit override. Wins everything.
2. **Walk-up from CWD** — the first `.selvedge/selvedge.db` found by walking up the
   directory tree from where `selvedge` (or the MCP server) was launched.
3. **`~/.selvedge/selvedge.db`** — global fallback. A one-time stderr warning is
   printed when this path is selected; suppress with `SELVEDGE_QUIET=1`.

`get_db_path` requires the DB **file** to exist, not just the `.selvedge/` directory. A
stray empty `.selvedge/` upstream won't hijack resolution.

`selvedge.config.resolve_db_path()` returns both the resolved path AND which precedence
step matched (`env`, `walkup`, or `global`). `selvedge doctor` uses this so the "which
DB are we using?" answer is unambiguous.

## Environment variables

| Variable | Default | Effect |
|---|---|---|
| `SELVEDGE_DB` | unset | Path to a specific SQLite file. Overrides walk-up + global. |
| `SELVEDGE_LOG_LEVEL` | `WARNING` | `DEBUG` / `INFO` / `WARNING` / `ERROR`. Controls the `selvedge.*` logger namespace. |
| `SELVEDGE_QUIET` | unset | If set, suppresses the one-time stderr warning when the global fallback DB is used. |
| `SELVEDGE_DESTRUCTIVE` | unset | **Lands in v0.3.10.** Will be **required** for any command that can permanently delete events (e.g. `selvedge prune --include-events`) — it will need to be set in the environment AND the command confirmed at the prompt. No event-deleting command ships as of v0.3.9. |

The destructive-action opt-in (v0.3.10) is a deliberate footgun defense — the most common
way event-deleting commands get triggered by accident is through `--yes` flags in cron
jobs or non-interactive scripts. `SELVEDGE_DESTRUCTIVE=1` will be the second factor that
prevents that, gating `selvedge prune --include-events` behind both the env var and an
interactive confirmation.

## Per-project initialization

```bash
cd your-project
selvedge init
```

Creates `.selvedge/selvedge.db` in the current directory, writes the schema, and
records the bootstrap migration. This is the canonical place to put a DB.

`.selvedge/` lives next to your code, not in a hidden home folder, so:

- It's checked-out alongside the project (or `.gitignore`d, your call)
- Walk-up finds it from any subdirectory
- Multiple projects on the same machine don't share a DB unintentionally

## Logging

All library modules log under the `selvedge.*` namespace. Entry points (`selvedge`
CLI, `selvedge-server` MCP) call `configure_logging()` once at startup.

Set `SELVEDGE_LOG_LEVEL=DEBUG` to see:

- DB connection lifecycle
- Migration runs
- Tool-call telemetry writes (and any swallowed errors from telemetry — these never
  crash the parent tool, but they do log under `DEBUG`)
- WAL pragma application

`record_tool_call()` exception handling still swallows errors so telemetry failures
never crash the parent tool, but everything routes through `logger.exception("…")`
so the failure is visible at `DEBUG`.

## Concurrency tunables

You probably don't want to change these, but for reference:

| Setting | Default | Where |
|---|---|---|
| WAL mode | on | Set on every connection |
| `busy_timeout` | 5000ms | `PRAGMA busy_timeout` on every connection |
| Connection-with-retry attempts | 5 | `selvedge.storage._with_retry` |
| Backoff cap | 1s | exponential, capped |

The defaults are tested via `tests/test_concurrency.py` — 8 threads writing 25 events
each, all 200 land. If you push past that and start seeing contention, the right
escalation is the v0.4.0 PostgreSQL backend, not raising these knobs.

## What lives in `.selvedge/`

```text
.selvedge/
├── selvedge.db          The SQLite DB (WAL mode → also -wal, -shm next to it)
├── hook.log             Post-commit hook failure log (one line per failure)
└── selvedge.db-journal  Transient — only present during a transaction
```

You can `.gitignore` everything except `.selvedge/.gitkeep` if you want fresh DBs per
checkout — useful for monorepos where each microservice maintains its own history.
For most projects, committing the DB is fine; SQLite + WAL handles concurrent CI
checkouts well.

## Coming in v0.3.10: `.selvedge/config.toml`

v0.3.9 has no config file — the settings above are the whole surface. A first-class
project config arrives in **v0.3.10**: `.selvedge/config.toml`, read on every entry
point, backwards compatible (a missing file means today's defaults). Expected keys:

| Key | Default | Purpose |
|---|---|---|
| `retention_days_events` | ∞ | Event retention for `prune --include-events` (opt-in deletion) |
| `retention_days_tool_calls` | 90 | Telemetry retention for `selvedge prune` |
| `backup_keep_last` | 7 | Snapshots kept by `selvedge backup` |
| `diff_bytes` | 65536 | Per-event diff truncation limit |
| `reasoning_bytes` | 32768 | Per-event reasoning truncation limit |
| `db_size_warn_mb` | 500 | Doctor warns past this DB size |
| `stale_days` | off | Fallback window for `stale_decisions` |

**Precedence (canonical):** `SELVEDGE_DB` always wins for DB-path resolution. For every
other setting: CLI flags > env vars > project-local `.selvedge/config.toml` > global
`~/.selvedge/config.toml` > hardcoded defaults. `selvedge doctor` will print which
precedence step produced each effective setting.

## What's not configurable

By design:

- **No remote backends in v0.3.x.** Postgres is on the v0.4.0 roadmap. Until then,
  Selvedge is local-only. This keeps the install footprint to three deps and the
  attack surface to zero network.
- **No LLM hops in core.** The reasoning quality validator is regex-and-length-based,
  not LLM-based. This is a hard rule; PRs that try to add LLM calls inside core get
  rejected.
- **No telemetry that leaves your machine.** The `tool_calls` table is local-only.
  There's no opt-in or opt-out — the data simply doesn't go anywhere.

## Next

[**CLI reference →**](/reference/cli/) — every flag, every subcommand.
[**FAQ →**](/project/faq/) — common gotchas and "why does it work this way".
