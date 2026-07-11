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
selvedge verify [--strict] [--json]     Correctness checks against the store
selvedge diff ENTITY [--limit N]        History for an entity / prefix
selvedge blame ENTITY                   Most recent change + context
selvedge history [...filters]           Browse all history
selvedge changeset [ID|--list]          Events grouped by changeset
selvedge search QUERY [--limit N]       Full-text search
selvedge prior-attempts [ENTITY]        Prior attempts on an entity + outcome ([--fuzzy TEXT] since 0.3.9.1)
selvedge supersede ENTITY --reasoning   Re-open a reverted decision, append-only (since 0.3.9.1)
selvedge index [--model NAME]           Build the optional semantic embeddings index (since 0.3.9.1)
selvedge stale [...filters]             Decisions due for a revisit (date, or stale_when matched since 0.3.9.1)
selvedge stats [--since SINCE]          Tool-call coverage report
selvedge install-hook [--path PATH]     Install git post-commit hook
selvedge backfill-commit --hash HASH    Backfill git_commit on recent events
selvedge import PATH                    Import migrations (SQL / Alembic) or an Agent Trace file
selvedge import --from-git [--since]    Seed pre-Selvedge reverts from git history (since 0.3.9.1)
selvedge export [--format json|csv|agent-trace]  Export history (Agent Trace v0.1.0 since 0.3.9)
selvedge log ENTITY CHANGE_TYPE         Manually log a change ([--constraint] [--stale-when] since 0.3.9.1)
selvedge migrate-paths [--apply]        Re-canonicalize stored entity paths
selvedge backup [--output FILE]         Snapshot the store via VACUUM INTO
selvedge prune [--days N]               Trim old tool_calls telemetry (90-day default)
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

### `selvedge verify [--strict] [--json]`

Correctness checks against the Selvedge store, in two tiers:

- **`must_fail`** — SQLite corruption, schema mismatch, invariant violations (empty
  `entity_path`, unknown `change_type`, bad timestamps)
- **`should_warn`** — soft signals (singleton changesets, events past the backfill
  window with no `git_commit`)

Exit 0 when clean or only should-warn rows triggered; exit 1 on any must-fail row.
`--strict` escalates should-warn rows to failures too, so you can wire `selvedge verify`
into CI without `|| true` on day one and promote the soft tier once the team is ready.

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

### `selvedge prior-attempts [ENTITY] [--description TEXT] [--fuzzy TEXT] [--all] [--window WHEN] [--limit N]`

Prior change attempts on an entity, each with an inferred outcome — the CLI parity
(new in v0.3.8) for the `prior_attempts` MCP tool, which shipped in v0.3.7. A thin
presenter over the same `get_prior_attempts` store, so `--json` is byte-identical to what
the MCP tool returns and the two surfaces can't diverge.

Pass an `ENTITY` positional **xor** `--description TEXT` (free-text, when you don't have
an exact path) — not both. By default only the clear "tried then reverted"
(`proximity_high`) cases come back; `--all` widens recall to `proximity_low`. `--window`
(e.g. `7d`, `60m`) maps onto the add→remove proximity window. Since v0.3.9.1 every row
carries `outcome` (now including `reopened`), `current_status`, and the supersede-trail
fields, so the output reads tried → reverted → re-opened.

```bash
selvedge prior-attempts users.auth_token       # exact entity
selvedge prior-attempts --description "persistent login token"
selvedge prior-attempts users.auth_token --all --json
```

**`--fuzzy TEXT` (since v0.3.9.1)** adds semantically similar records on top — it matches
on the *reasoning*, not the entity string, so a rename from `card_token` to
`payment_token` still trips the warning. Fuzzy rows are labeled `match_type="fuzzy"` with
a similarity score. It needs the optional `selvedge[semantic]` extra and a `selvedge
index` run; without them it falls back to substring matching and prints a one-line
pointer. The core stays zero-LLM either way.

```bash
selvedge prior-attempts users.card_token --fuzzy "tokenized payment credentials"
```

An empty result is the normal, good answer — exit 0, nothing clearly tried-and-rejected.
Records on the same coverage counter as the MCP tool, so `selvedge stats` reflects both
surfaces.

### `selvedge supersede ENTITY --reasoning TEXT [--constraint TEXT] [--stale-when TEXT] [--supersedes ID] [--json]`

Re-open a reverted decision — **append-only, never rewrites history** (v0.3.9.1). When the
constraint that killed a decision no longer holds, this logs a new
`change_type="supersede"` event that links the prior revert (auto-resolving the entity's
most recent remove/delete when `--supersedes` is omitted). `prior_attempts` / `blame` /
`diff` then read the full trail: tried → reverted → re-opened. There is deliberately no
automatic un-retiring — this command **is** the explicit re-open step.

```bash
selvedge supersede payments.card_token -r "Provider now vaults card data — PCI constraint gone."
```

### `selvedge index [--model NAME] [--json]`

Build or update the optional semantic embeddings index over reasoning text (v0.3.9.1) —
the backing store for `prior-attempts --fuzzy`. Requires `pip install "selvedge[semantic]"`.
Incremental (only new or changed reasoning is re-embedded); the first run downloads the
model (~30 MB, cached), and indexing + querying are fully local after that. The core store
is untouched — embeddings live in their own table and nothing in Selvedge's read/write
paths depends on it.

### `selvedge stale [--entity ENTITY] [--project PROJECT] [--agent AGENT] [--limit N]`

Decisions that are due for a revisit — the CLI mirror of the `stale_decisions` MCP tool
(new in v0.3.8). Two surfacing rules since v0.3.9.1: **`revisit_due`** — `revisit_after`
has passed **and** the entity is still in active use (pure age never surfaces); and
**`review_suggested`** — a later change event keyword-matched the decision's `stale_when`
condition (follow up with `selvedge supersede`). Most-overdue-first. `--json` for cron /
Slack / digest jobs.

```bash
selvedge stale                       # everything due: past revisit date, or stale_when matched
selvedge stale --entity deps/stripe  # scope to one entity
selvedge stale --json                # for cron / morning reports
```

Each row carries the `flag`, the revisit due date, days overdue, the active-use signals
that fired, any matched terms, and a templated reason. Composes with reporting jobs the
same way `selvedge digest` (planned for v0.3.16) will.

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
index_add | index_remove | migrate | revert | supersede
```

Invalid types are caught at argument parsing with the full list of valid choices. `revert`
("we tried this and rolled it back") and `supersede` (re-open a reverted decision) were
added in v0.3.9.1 — for the guided re-open flow prefer `selvedge supersede` above.

Other flags: `--agent`, `--commit`, `--project`, `--changeset`, `--rename-from`,
`--revisit-after`, and (v0.3.9.1) `--constraint` (the testable principle behind the
decision) / `--stale-when` (what would invalidate it, matched by `selvedge stale`).

`--revisit-after WHEN` (new in v0.3.8) sets a revisit date on the change — an ISO-8601
date or a relative offset (`90d`, `6mo`), normalized like `--since`. The decision then
surfaces in `selvedge stale` / the `stale_decisions` MCP tool once the date passes and
the entity is still in active use:

```bash
selvedge log deps/stripe add --reasoning "Pinned to v11 for billing." --revisit-after 180d
```

`--rename-from OLD` (with `CHANGE_TYPE` = `rename`, and the **new** path as `ENTITY`)
records the dual-event rename — a `rename` on the old path and a `create` on the new
path with `metadata.renamed_from` set — so history follows the entity:

```bash
selvedge log src/auth/session.py::login rename --rename-from src/auth.py::login
```

### `selvedge migrate-paths [--apply] [--agent NAME] [--json]`

Re-canonicalizes every stored `entity_path` (strip leading `./`, collapse `//`,
normalize separators, trim — **case preserved**), so older rows written before v0.3.7
match the canonical form used on every write today.

**Dry-run is the default** — nothing is written until you pass `--apply`. A dry run
prints the planned rewrites (`old → canonical`) and a **collisions report**: distinct
pre-canonicalization paths that would converge to the same value, i.e. histories the
migration would *merge*. Inspect those before applying.

```bash
selvedge migrate-paths            # dry run: rewrites + collisions report
selvedge migrate-paths --apply    # write the canonical paths
```

Idempotent on the event data — re-running after `--apply` rewrites nothing. Each
`--apply` run records one audit row in the `path_migrations` table (surfaced by
`selvedge doctor`).

---

## Backfill / interop

### `selvedge import PATH [--format auto|sql|alembic|agent-trace] [--project NAME] [--dry-run]`

Parse migration files and backfill schema history.

- **Raw SQL DDL** — `CREATE TABLE`, `ALTER TABLE ADD/DROP/RENAME/ALTER COLUMN`,
  `DROP TABLE`, `CREATE/DROP INDEX`, `RENAME TABLE`
- **Alembic Python migrations** — `op.add_column`, `op.drop_column`, `op.create_table`,
  `op.drop_table`, `op.alter_column`, `op.rename_table`, `op.create_index`,
  `op.drop_index`, `op.execute()` (with inline SQL parsing)
- **Agent Trace** (`--format agent-trace`, since v0.3.9) — PATH is an Agent Trace
  JSON/NDJSON file. Round-trips a `selvedge export --format agent-trace` losslessly
  (entity, change type, and reasoning survive in `dev.selvedge` metadata); foreign
  producers import best-effort (`change_type="modify"`, empty reasoning).

Directories are walked recursively; files are sorted by name for chronological order.
Bulk inserts are wrapped in a single transaction so a long Alembic history imports
atomically.

A `CREATE TABLE users (id INT, email TEXT)` emits a `table.create` event for `users`
**and** a `column.add` event for each column, so `selvedge blame users.email` works
even when the column was defined only in the initial schema.

**`--from-git [--since REF|DATE]` (since v0.3.9.1)** — instead of migration files, PATH is
a git repository root (default `.`) and the import walks history for reverts that predate
Selvedge: commits whose message mentions "revert" plus commits that deleted files. Each
becomes a `change_type="revert"` event (`agent="git-import"`, reasoning = the commit
subject + body) so `prior_attempts` and the enforcement hook see them. Idempotent on the
`(commit, entity)` pair, so re-runs don't duplicate. `--since` takes a git ref (exclusive
`REF..HEAD`) or a date git understands.

```bash
selvedge import --from-git --dry-run       # preview what would be seeded
selvedge import --from-git --since v0.3.0   # only reverts after a tag
```

Honest limits: a revert folded into an unrelated commit (no "revert" marker, nothing
deleted) is invisible even to the grep, and only SQL `DROP TABLE` / `DROP COLUMN` seed
entity-level records today — every other diff shape is seeded at the file level. Widening
that (and provenance-based trust tiers) is on the roadmap.

### `selvedge export [--format json|csv|agent-trace] [--since] [--entity] [--output FILE]`

Dump change history to JSON or CSV with full filter support.

**`--format agent-trace`** (since v0.3.9) emits [Agent Trace](https://github.com/cursor/agent-trace)
**v0.1.0** records — one per change event by default, wrapped in a self-describing
bundle (`{agent_trace_version, producer, note, records: [...]}`). Two agent-trace-only
flags: `--ndjson` streams one record per line for large histories, and
`--collapse-by-session` merges events sharing a `session_id` into a single record.
Selvedge's reasoning and entity-level provenance ride along in each record's
`metadata` under the reverse-domain `dev.selvedge` namespace. See the
[Agent Trace interop page](/compare/agent-trace/) for the full mapping.

### `selvedge backfill-commit --hash HASH [--window MIN]`

Manually backfill `git_commit` on recent events within a configurable time window.
Called by the post-commit hook automatically; you only run this manually if the hook
isn't installed and you want to associate a recent commit with already-logged events.

---

## Maintenance

### `selvedge backup [--output FILE] [--json]`

Snapshots the store with SQLite `VACUUM INTO`. Defaults to
`.selvedge/backups/selvedge-YYYYMMDD-HHMMSS.db`, keeping the most recent 7 snapshots and
pruning older ones (custom `--output` destinations outside that directory are never
pruned). The backups directory is kept out of git — `selvedge init` (v0.3.5+) appends it
to the project `.gitignore`, and the first `selvedge backup` run backfills that entry on
older repos.

### `selvedge prune [--days N] [--json]`

Trims old `tool_calls` **telemetry rows only** — it never deletes change events. Default
retention is 90 days; pass `--days N` to override. Every run appends a one-liner to
`.selvedge/prune.log` so the cadence shows up in `selvedge doctor`.

There is **no `--include-events` flag yet** — the destructive events-prune path lands in
v0.3.10 alongside `.selvedge/config.toml`, and will require both `SELVEDGE_DESTRUCTIVE=1`
and an interactive confirmation.

```bash
selvedge prune              # trim tool_calls older than 90 days
selvedge prune --days 30
selvedge prune --json
```

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
