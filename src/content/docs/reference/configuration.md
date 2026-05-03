---
title: Configuration
description: How Selvedge resolves the DB path, environment variables, project vs. global precedence, and the destructive-action opt-in flag.
---

Selvedge has very few knobs by design. Everything lives in either an environment
variable or a flag.

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
| `SELVEDGE_DESTRUCTIVE` | unset | **Required** for any command that can permanently delete events (e.g. `selvedge prune --include-events`). Must be set in the environment AND the command must be confirmed at the prompt. |

The destructive-action opt-in is a deliberate footgun defense — the most common way
event-deleting commands get triggered by accident is through `--yes` flags in cron jobs
or non-interactive scripts. `SELVEDGE_DESTRUCTIVE=1` is the second factor that prevents
that.

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
