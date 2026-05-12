---
title: CLI reference
description: Every Selvedge CLI command, every flag. Mirrors selvedge --help; this page is the canonical reference.
---

The `selvedge` binary is your interface to the SQLite store. Every read command supports
`--json` for machine-readable output. Relative time strings (`15m`, `24h`, `7d`, `5mo`,
`1y`) and ISO 8601 timestamps are accepted everywhere `--since` shows up.

## Commands at a glance

```text
selvedge init [--path PATH]             Initialize Selvedge in a project
selvedge setup                          Interactive first-run wizard
selvedge prompt [--install FILE]        Print canonical agent-instructions block
selvedge watch                          Live-tail new events
selvedge status                         Recent activity summary
selvedge doctor [--json]                Health check
selvedge diff ENTITY [--limit N]        History for an entity / prefix
selvedge blame ENTITY                   Most recent change + context
selvedge history [...filters]           Browse all history
selvedge changeset [ID|--list]          Events grouped by changeset
selvedge search QUERY [--limit N]       Full-text search
selvedge stats [--since SINCE]          Tool-call coverage report
selvedge install-hook [--path PATH]     Install git post-commit hook
selvedge backfill-commit --hash HASH    Backfill git_commit on recent events
selvedge import PATH                    Import migration files (SQL / Alembic)
selvedge export [--format json|csv]     Export history
selvedge log ENTITY CHANGE_TYPE         Manually log a change
```

---

## Lifecycle

### `selvedge init [--path PATH]`

Creates `.selvedge/selvedge.db` in the current directory (or `--path`). Writes the
schema and registers the bootstrap migration. Idempotent — running on an existing
project is a no-op.

### `selvedge setup`

Interactive first-run wizard. Detects which AI tools you have and walks through every
install step in one pass:

- Adds the Selvedge MCP entry to each tool's config
- Drops the canonical agent-instructions block into the project's prompt file
- Runs `selvedge init` if `.selvedge/` doesn't exist
- Installs the post-commit hook

Every modified file gets a `.bak` written next to it before any change reaches disk.
Re-running on an already-set-up project is a no-op (idempotent). Existing-but-different
MCP entries trigger a conflict warning rather than silent overwrite — pass `--force` to
overwrite, or update by hand.

For CI / devcontainer `postCreateCommand`:

```bash
selvedge setup --non-interactive --yes
```

### `selvedge prompt [--install FILE]`

Prints the recommended system-prompt block to stdout. Pipe-friendly:

```bash
selvedge prompt | tee -a CLAUDE.md
```

`--install <file>` installs the block idempotently. The block is sentinel-bracketed
(`<!-- selvedge:start -->` / `<!-- selvedge:end -->`) so re-running `--install` updates
the bracketed region without disturbing anything else in the file.

The block source is `selvedge.prompt.PROMPT_BLOCK` — a public constant, importable for
templating into your own onboarding flows.

### `selvedge install-hook [--path PATH] [--window MIN]`

Installs a git post-commit hook that automatically backfills `git_commit` on Selvedge
events after each commit. Safe to run on repos with existing post-commit hooks (appends
rather than overwrites). Idempotent.

The hook's `--window` (default 60 minutes) controls how far back it'll look for events
to associate with the commit.

---

## Reading

### `selvedge status`

Recent activity summary. Surfaces:

- Total events
- Events in the last 24h / 7d / 30d
- Count of events missing `git_commit` (nudges you toward `install-hook`)
- Last `tool_calls` entry timestamp (proxy for "is the agent wired up?")
- MCP wiring detection — distinguishes "installed but agent hasn't reloaded" from
  "not installed anywhere" with config-path-aware diagnostics

### `selvedge doctor [--json]`

Single-command health check. Each row is `PASS` / `WARN` / `FAIL` / `INFO`:

- Which DB path is being resolved (and which precedence step matched)
- Whether `.selvedge/` exists where you think it does
- Whether the schema is at the latest migration version
- Whether the post-commit hook is installed
- Whether the post-commit hook has been failing silently
- Last `tool_calls` entry timestamp
- Whether `SELVEDGE_LOG_LEVEL` is set to a recognized value

Exits 1 if any `FAIL` row is present so doctor can be wired into CI.

### `selvedge watch [--interval N] [--since] [--entity] [--project] [--agent] [--json]`

Polls the SQLite store at `--interval` (default 1s) and prints each new event as it
lands, Rich-formatted. Filters mirror `selvedge history` exactly. `--json` emits one
compact JSON object per line for piping into `jq`. Ctrl-C exits cleanly.

WAL mode means the polling SELECT never blocks the writer; runtime cost is one indexed
query per second while the command is running.

### `selvedge diff ENTITY [--limit N]`

History for an exact entity (`users.email`) or prefix (`users` returns all
`users.*`). Newest first. `--json` for machine-readable output.

### `selvedge blame ENTITY`

Most recent change for an exact entity, plus full context — agent, timestamp, commit,
reasoning. The query everyone runs first.

On miss, returns a stable shape with every field empty and `error` populated with the
"no history found" message — easier to type-check without branching.

### `selvedge history [...filters]`

Browse all history with combined filters:

```text
--since SINCE         15m | 24h | 7d | 5mo | 1y | ISO 8601
--entity ENTITY       exact or prefix match
--project PROJECT     limit to a project name
--changeset CS        limit to a changeset
--summarize           one-line-per-event summary instead of full panels
--limit N
```

### `selvedge changeset [ID | --list]`

Without an ID, lists all changesets with summary stats (event count, agent, time
range). With an ID, returns the events grouped under that changeset, oldest-first so
you can reconstruct the full scope of a feature.

### `selvedge search QUERY [--limit N]`

Full-text search across reasoning + diff + entity_path. Properly escapes SQL `LIKE`
wildcards (`_`, `%`, `\`) so `selvedge search "stripe_customer_id"` won't accidentally
match `stripeXcustomerXid`.

### `selvedge stats [--since SINCE]`

Tool-call coverage report:

- **Per-agent breakdown** — total calls, log_change calls, coverage ratio
- **Missing-reasoning count** — events whose stored reasoning fails the quality
  validator (empty, too short, generic placeholder)
- Recent call history

Catches the case where one agent (e.g. claude-code) is well-instrumented but another
(e.g. cursor) is only querying history and never logging changes.

---

## Writing

### `selvedge log ENTITY CHANGE_TYPE [--diff TEXT] [--reasoning TEXT] ...`

Manually log a change. Useful for backfilling, post-hoc annotation, or scripts.
`change_type` is validated via `click.Choice` against the canonical set:

```text
add | remove | modify | rename | retype | create | delete |
index_add | index_remove | migrate
```

Invalid types are caught at argument parsing with the full list of valid choices.

Other flags: `--agent`, `--commit`, `--project`, `--changeset`.

---

## Backfill / interop

### `selvedge import PATH [--format auto|sql|alembic] [--project NAME] [--dry-run]`

Parse migration files and backfill schema history.

- **Raw SQL DDL** — `CREATE TABLE`, `ALTER TABLE ADD/DROP/RENAME/ALTER COLUMN`,
  `DROP TABLE`, `CREATE/DROP INDEX`, `RENAME TABLE`
- **Alembic Python migrations** — `op.add_column`, `op.drop_column`, `op.create_table`,
  `op.drop_table`, `op.alter_column`, `op.rename_table`, `op.create_index`,
  `op.drop_index`, `op.execute()` (with inline SQL parsing)

Directories are walked recursively; files are sorted by name for chronological order.
Bulk inserts are wrapped in a single transaction so a long Alembic history imports
atomically.

A `CREATE TABLE users (id INT, email TEXT)` emits a `table.create` event for `users`
**and** a `column.add` event for each column, so `selvedge blame users.email` works
even when the column was defined only in the initial schema.

### `selvedge export [--format json|csv] [--since] [--entity] [--output FILE]`

Dump change history to JSON or CSV with full filter support.

### `selvedge backfill-commit --hash HASH [--window MIN]`

Manually backfill `git_commit` on recent events within a configurable time window.
Called by the post-commit hook automatically; you only run this manually if the hook
isn't installed and you want to associate a recent commit with already-logged events.

---

## Time strings

`--since` and other time-flavored flags accept:

| Form | Meaning |
|---|---|
| `15m` | Last 15 minutes (`m` = minutes) |
| `24h` | Last 24 hours |
| `7d` | Last 7 days |
| `5mo` or `5mon` | Last 5 months (`mo` / `mon` = months) |
| `1y` | Last year |
| `2026-04-22T10:00:00Z` | ISO 8601 timestamp (any tz, normalized to UTC) |

Unparseable inputs (e.g. `--since yesterday`) exit with a clear error rather than
silently returning empty results.

`m` means **minutes**, not months. This was a v0.3.0 fix — earlier versions used `m`
for months, which contradicted every CLI convention (`sleep 5m`, `kubectl --since=5m`,
Prometheus). If you're on v0.2.x, `5m` will read as five months — upgrade.

---

## Environment variables

| Variable | Purpose |
|---|---|
| `SELVEDGE_DB` | Force a specific DB path (per-session override) |
| `SELVEDGE_LOG_LEVEL` | `DEBUG` / `INFO` / `WARNING` / `ERROR` (default `WARNING`) |
| `SELVEDGE_QUIET=1` | Suppress the global-fallback stderr warning |

[**Configuration page →**](/reference/configuration/) for full details on DB resolution
and project / global precedence.
