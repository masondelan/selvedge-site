---
title: Configuration
description: How Selvedge resolves the DB path, environment variables, project vs. global precedence, and the destructive-action opt-in flag.
---

Selvedge has very few knobs by design. Since v0.3.10 the settings live in a first-class
`.selvedge/config.toml` (see [below](#selvedgeconfigtoml)), with environment variables
and CLI flags layered on top of it in a canonical precedence order. v0.3.11 adds no new
keys — the surface below is current.

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
| `SELVEDGE_HOOK_DISABLE` | unset | **v0.3.9.1.** If `1`, the PreToolUse enforcement hook (`selvedge-hook pretooluse`) bypasses and allows every tool call for that shell. |
| `SELVEDGE_DESTRUCTIVE` | unset | **v0.3.10.** **Required** for the one command that can permanently delete events (`selvedge prune --include-events`) — it must be set in the environment AND the command confirmed at the prompt. Neither gate alone is enough. |

### Enforcement-hook config — `.selvedge/config.toml` `[hook]` (v0.3.9.1)

The PreToolUse enforcement hook installed by `selvedge setup` reads one optional block. If
the file or block is absent, sensible defaults apply; a malformed file falls back to the
defaults rather than failing.

```toml
[hook]
# Which paths the hook treats as schema/migration territory. Replaces the
# defaults: **/migrations/**, **/alembic/**, **/schema*, **/*model*, **/*.sql
watch_globs = ["**/migrations/**", "db/**/*.sql"]
```

The `[hook]` block is deliberately separate from the first-class settings
[below](#selvedgeconfigtoml) — the hook cannot afford the config layer's import cost on
its hot path, so it reads this one block directly.

### Optional extras

`pip install "selvedge[semantic]"` (v0.3.9.1) adds the local embedding backend (model2vec)
used by `selvedge index` and `prior-attempts --fuzzy`. It is strictly optional — the core
never imports it, and Selvedge works identically without it (fuzzy queries fall back to
substring matching).

The destructive-action opt-in (v0.3.10) is a deliberate footgun defense — the most common
way event-deleting commands get triggered by accident is through `--yes` flags in cron
jobs or non-interactive scripts. `SELVEDGE_DESTRUCTIVE=1` is the second factor that
prevents that, gating `selvedge prune --include-events` behind both the env var and an
interactive confirmation: `--yes` in a cron entry defeats a prompt, and a shell profile
defeats an env var, so it takes both.

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
├── config.toml          Optional project config (v0.3.10; [hook] block since v0.3.9.1)
├── backups/             Rotated snapshots from selvedge backup (kept out of git)
├── hook.log             Post-commit hook failure log (one line per failure)
├── prune.log            One line per prune run, surfaced by doctor
└── selvedge.db-journal  Transient — only present during a transaction
```

You can `.gitignore` everything except `.selvedge/.gitkeep` if you want fresh DBs per
checkout — useful for monorepos where each microservice maintains its own history.
For most projects, committing the DB is fine; SQLite + WAL handles concurrent CI
checkouts well.

## `.selvedge/config.toml`

First-class project config, since **v0.3.10**: read on every entry point, backwards
compatible (a missing file means the defaults below). Keys are flat and top-level; each
also has an env-var override (`SELVEDGE_<KEY>` uppercased, e.g.
`SELVEDGE_RETENTION_DAYS_EVENTS`):

| Key | Default | Purpose |
|---|---|---|
| `retention_days_events` | 0 (never) | Event retention for `prune --include-events` (opt-in deletion — losing captured reasoning is the one thing this tool exists to prevent) |
| `retention_days_tool_calls` | 90 | Telemetry retention for `selvedge prune` |
| `backup_keep_last` | 7 | Snapshots kept by `selvedge backup` |
| `diff_bytes` | 65536 | Per-event diff truncation limit (truncates loudly, with a marker) |
| `reasoning_bytes` | 32768 | Per-event reasoning truncation limit |
| `db_size_warn_mb` | 500 | Doctor warns past this DB size |
| `stale_days` | 0 (off) | Fallback age for `stale_decisions` when a decision has no `revisit_after` |
| `digest_max_bytes` | 4096 | Hard cap on the SessionStart digest injected into agent context (0 disables the digest) |
| `redaction_patterns` | `[]` | Extra secret-shaped regexes to warn about at `log_change` time — extends the built-in set |

(The v0.3.11 tamper-evidence chain and `expires_when` evaluator run with zero
configuration — no keys govern them.)

**Precedence (canonical):** `SELVEDGE_DB` always wins for DB-path resolution. For every
other setting: CLI flags > env vars > project-local `.selvedge/config.toml` > global
`~/.selvedge/config.toml` > hardcoded defaults. `selvedge doctor` prints which
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
