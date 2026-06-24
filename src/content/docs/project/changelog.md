---
title: What's new
description: Recent Selvedge releases. Every shipped change is in CHANGELOG.md in the source repo — this page mirrors the three most recent releases for at-a-glance browsing.
---

The canonical changelog is [`CHANGELOG.md`](https://github.com/masondelan/selvedge/blob/main/CHANGELOG.md)
in the source repo. This page mirrors the three most recent releases for
at-a-glance browsing.

## v0.3.9 — 2026-06-22

**Agent Trace export — Selvedge is a compatible producer.** New
`selvedge export --format agent-trace` emits
[Agent Trace](https://github.com/cursor/agent-trace) **v0.1.0** records — the
open AI code-attribution wire format from Cursor + Cognition AI — so your
captured history travels to any tool that reads the standard. Agent Trace is the
wire format; Selvedge is the live capture + query layer that emits it. **Drop-in
upgrade for anyone on 0.3.8.** The MCP surface is unchanged (still **8** tools).

**Pulled forward, deliberately.** The exporter was planned for v0.4.0 (Phase 3).
It ships now in the 0.3.x line as an **opt-in, additive** interop format —
nothing about the native model, the MCP tools, or SQLite storage changes.
Postgres and the tool-rename/consolidation remain the v0.4.0 markers (HTTP +
auth is v0.4.1); only the exporter moved up.

### `selvedge export --format agent-trace`

One Agent Trace v0.1.0 record per change event. The default JSON form is a
self-describing bundle (`{agent_trace_version, producer, note, records: [...]}`).
`--ndjson` streams one record per line for large histories;
`--collapse-by-session` merges events sharing a `session_id` into a single
record.

Selvedge's reasoning and entity-level provenance ride along in each record's
`metadata` under the reverse-domain `dev.selvedge` namespace. Records conform to
the real v0.1.0 spec: line ranges live in `files[].conversations[].ranges[]`, a
`contributor` of type `ai`/`unknown` (no `model_id` is fabricated — Selvedge
stores the agent name, not a models.dev id), `tool = {name: "selvedge", ...}`,
and `vcs` from `git_commit`.

### `selvedge import --format agent-trace`

Round-trips a Selvedge export losslessly — entity, change type, and reasoning
survive in `dev.selvedge` metadata — and ingests foreign producers best-effort
(`change_type="modify"`, empty reasoning).

### Honest fidelity

Entity-level events (DB column, env var, dependency) and migration-imported
events have no line range, so they carry `metadata.dev.selvedge.range_unknown:
true` and an empty `files[]` rather than a fabricated `[1, 1]` placeholder. The
export bundle's preamble explains this to consumers up front.

See the [Agent Trace interop page](/compare/agent-trace/) for the full mapping,
or [`docs/agent-trace-interop.md`](https://github.com/masondelan/selvedge/blob/main/docs/agent-trace-interop.md)
in the source repo.

### Tests

- `tests/test_agent_trace_export.py` (25 tests): round-trip, non-file entity
  preservation, line-range extraction, collapse-by-session, reasoning-quality
  passthrough, schema validation, and CLI integration.

## v0.3.8 — 2026-06-16

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

---

[**Full CHANGELOG.md →**](https://github.com/masondelan/selvedge/blob/main/CHANGELOG.md)
in the source repo. Includes 0.3.6 (stay-current + retention basics —
background PyPI version check, `selvedge prune` for `tool_calls`),
0.3.5 (recovery basics — `selvedge verify`,
`selvedge backup`), 0.3.4 (first-run wizard, prompt, watch),
0.3.3 (per-tool annotations, output schemas, custom icon), 0.3.2
(observability + doctor), 0.3.1 (concurrency hardening), 0.3.0
(correctness fixes), 0.2.x (changesets, import/export), and the 0.1.0
initial release.

[**Roadmap →**](/project/roadmap/) for what's planned through v1.0.0.
