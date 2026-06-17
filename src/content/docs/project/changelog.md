---
title: What's new
description: Recent Selvedge releases. Every shipped change is in CHANGELOG.md in the source repo — this page mirrors the latest two minor versions for at-a-glance browsing.
---

The canonical changelog is [`CHANGELOG.md`](https://github.com/masondelan/selvedge/blob/main/CHANGELOG.md)
in the source repo. This page mirrors the most recent two minor versions for
at-a-glance browsing.

## v0.3.8 — 2026-06-17

**Active memory v1 (date-based).** Selvedge's append-only log learns to know
when its own data is stale. A decision can now carry a revisit date, and the
new **`stale_decisions`** tool surfaces decisions that have aged out — but only
the ones whose entity is *still in active use*, so an old-but-correct decision
nobody touches never nags. One new MCP tool (→ **8** total). **Drop-in upgrade
for anyone on 0.3.7.**

### `revisit_after` + `stale_decisions` — decisions with an expiry date

**`revisit_after` on `log_change` (MCP) and `selvedge log` (CLI).** Set a
revisit date on an architectural change — an ISO-8601 date *or* a relative
offset from the event's timestamp (e.g. `90d`, `6mo`), normalized with the same
grammar as `--since`. Stored on the event and consumed by `stale_decisions` /
`selvedge stale`.

**`stale_decisions` MCP tool — the 8th tool.** Returns events whose
`revisit_after` has passed **AND** whose entity is still in active use. The
required active-use signal is one of: the entity was queried
(`blame` / `diff` / `prior_attempts`) at or after the decision was logged, or
the decision's `changeset_id` saw later sibling activity. **Pure age alone
never surfaces** — that's the noise defense against old-but-correct decisions.
Each result carries `revisit_due`, `days_overdue`, `active_use_signals`, and a
templated `stale_reason`. Filterable by `entity_path`, `project`, `agent`.
Templated, no LLM.

The pattern-based half of active memory (the `expires_when` grammar and
explicit `reject` / `revert` change types) lands in v0.3.11; the v0.3.8 schema
migration adds the `expires_when` column now so v0.3.11 is a no-migration
release.

### CLI parity for the wedge + CLI-awareness

**`selvedge prior-attempts <entity>`** lands — CLI parity for the v0.3.7
`prior_attempts` wedge, previously the only MCP tool without a CLI command. A
thin presenter over the same `get_prior_attempts` store, so `--json` emits the
identical list the MCP tool returns and the two surfaces can't diverge. ENTITY
(positional) xor `--description`; `--all` widens recall to `proximity_low`;
`--window` (e.g. `7d`, `60m`) maps onto the proximity window. An empty result is
the normal, good answer (exit 0).

**`selvedge stale`** mirrors `stale_decisions` — the same data surface,
Rich-formatted, with `--json` for cron / Slack / digest jobs. Filters by
`--entity`, `--project`, `--agent`.

And the canonical agent-instructions block now names the CLI equivalents
alongside the MCP tools, so a shell-having agent is never blocked when the MCP
server isn't loaded. Selvedge stays **MCP-first**; the CLI is the additive
second path.

### Migration

**Schema migration v3** adds `revisit_after` and `expires_when` to `events`
(both nullable). In SQLite an `ALTER TABLE ADD COLUMN` of a nullable, default-less
column is a metadata-only edit — the table isn't rewritten — so even a
multi-million-event database migrates in well under a second on the next
connection. `test_migrations_perf.py` gates this at 10k / 100k / 1M events.

## v0.3.7 — 2026-06-08

The brand-defining release: the **`prior_attempts`** MCP tool — an agent
about to change an entity asks *"was this tried before, and how did it turn
out?"* before it starts — plus the **entity-canonicalization foundation** it
sits on. One new MCP tool (→ **7** total). **Drop-in upgrade for anyone on
0.3.6.**

### The wedge

**`prior_attempts` MCP tool.** Given an `entity_path` or a free-text
`description`, returns prior change attempts on the entity, each annotated
with an inferred `outcome` (`reverted` / `active`), a `confidence` tier
(`proximity_high` / `proximity_low`), and `outcome_reasoning` (why a reverted
attempt was rejected). Outcome is inferred from add→remove proximity within a
configurable window — explicit `reject` / `revert` change types arrive in
v0.3.11. **Conservative-recall**: `min_confidence` defaults to
`proximity_high`, so an empty list is the preferred answer over a false
positive. Templated, no LLM, pull-only.

### Entity foundation (lands first)

**Canonicalization on write.** `src/auth.py::login` and
`./src/auth.py::login` used to resolve to *different* entities. Now every
write routes through one chokepoint
(`selvedge.storage.canonicalize_entity_path`) that strips `./`, collapses
`//`, normalizes separators, and trims — **preserving case on purpose**
(filesystems differ; lowercasing would collapse genuinely distinct entities
on case-sensitive Linux). `selvedge doctor` warns on sibling paths that differ
only by case instead of merging them.

**`selvedge migrate-paths`** backfills existing rows. **Dry-run is the
default** and prints a collisions report (paths that would converge, i.e.
histories that would merge) so you inspect before `--apply` writes.
Idempotent, with a `path_migrations` audit row per run.

**Rename folded into `log_change`.** Pass `rename_from` with
`change_type="rename"` and Selvedge records the dual-event pattern — a rename
on the old path, a create on the new path with `metadata.renamed_from` — so
blame / diff / `prior_attempts` on the new path keep the history. No new tool.

**Soft entity-path shape warnings** — a `function` path without `::`, a
`column` without `.`, a `file` without a separator or extension get a nudge,
never a rejection.

**`selvedge.aggregates.summary()`** ships as a schema-versioned **library**
helper (not a tool, not a CLI command) — the seed that v0.3.9's `selvedge
audit` / `digest` will consume.

### Tests

- 47 new tests (suite ≈450, coverage 86.6%) — over the standard ≤30 per-phase
  budget because the entity foundation and the wedge ship together, plus a
  review pass that hardened the acceptance-criteria edges. Called out in the
  source CHANGELOG.

## v0.3.6 — 2026-05-24

Two themes in one release as a one-time exception to the single-theme
cadence: **stay-current** (background PyPI version check) and
**retention basics** (`selvedge prune` for the `tool_calls` table).
**Drop-in upgrade for anyone on 0.3.5.**

### Stay-current

**Background version check in `selvedge` (the CLI only — never the MCP
server).** A daemon thread fetches the latest published version from
PyPI's JSON endpoint, caches the result at
`~/.selvedge/update_check.json` (user-global so you don't re-check per
project), and on process exit prints to stderr:

```
selvedge: v0.3.7 available (you're on 0.3.6) — https://selvedge.sh/upgrade
```

The notice is printed via `atexit` so it appears *after* the command's
output, never interleaved. Cache TTL is 24h, matching `gh` and `npm`.

**Generous suppression.** The check is disabled when any of
`SELVEDGE_NO_UPDATE_CHECK=1`, `SELVEDGE_QUIET=1`, or `CI` is set in
the environment, when stderr isn't a TTY (piping, agent stdio,
`--json` to a file), and on dev / editable installs. The TTY gate is
re-checked at print time too — even a cached notice can't pollute
redirected output. The 1.5s fetch timeout and the no-raise posture of
every code path mean a network blip can't slow or break the CLI.

**`selvedge-server` stays silent.** The check is wired into the CLI
group callback only — the MCP server's stdio is the JSON-RPC channel
and an inadvertent stderr write would surface in the calling agent's
logs as noise.

### Retention basics

**`selvedge prune` — trim old `tool_calls` rows.** Default retention
is 90 days; `--days N` overrides. The default is long enough that the
previous month's agents are still in the data. Every run appends a
tab-separated audit line to `.selvedge/prune.log` so the cadence is
visible later — even empty prunes log, so you can tell the difference
between "no prunes yet" and "nothing to prune."

```
selvedge prune                # 90-day default
selvedge prune --days 30      # tighter window
selvedge prune --json         # for cron / scripting
```

Only `tool_calls` is pruned in this release. The destructive
events-table path waits for `.selvedge/config.toml` in v0.3.10 and
will require both `SELVEDGE_DESTRUCTIVE=1` *and* an interactive
confirmation — the cron / non-interactive `--yes` footgun is
defended against by design.

**Doctor — `Last prune` row + oversized-`tool_calls` WARN.** The
doctor table now surfaces the tail of `.selvedge/prune.log` (most
recent timestamp, rows pruned, day threshold) and WARNs when the
`tool_calls` table exceeds 100k rows so users get a nudge to run
`selvedge prune` before the noise table gets large.

### Note on cadence

This release combines two themes — a **one-time exception** to the
single-theme-per-release discipline locked in on 2026-05-10. The
retention work could have slipped to v0.3.7 (entity foundation +
`prior_attempts` wedge), but combining here avoided a renumbering
pass on the phase plan. Single-theme resumes at v0.3.7.

### Tests

- 36 new tests: `test_update_check.py` (24), `test_prune.py` (10),
  `test_doctor.py` extension (2). Suite is now ≈403 tests.

---

[**Full CHANGELOG.md →**](https://github.com/masondelan/selvedge/blob/main/CHANGELOG.md)
in the source repo. Includes 0.3.5 (recovery basics — `selvedge verify`,
`selvedge backup`), 0.3.4 (first-run wizard, prompt, watch),
0.3.3 (per-tool annotations, output schemas, custom icon), 0.3.2
(observability + doctor), 0.3.1 (concurrency hardening), 0.3.0
(correctness fixes), 0.2.x (changesets, import/export), and the 0.1.0
initial release.

[**Roadmap →**](/project/roadmap/) for what's planned through v1.0.0.
