---
title: What's new
description: Recent Selvedge releases. Every shipped change is in CHANGELOG.md in the source repo — this page mirrors the three most recent releases for at-a-glance browsing.
---

The canonical changelog is [`CHANGELOG.md`](https://github.com/masondelan/selvedge/blob/main/CHANGELOG.md)
in the source repo. This page mirrors the three most recent releases for
at-a-glance browsing.

## v0.3.9.1 — 2026-07-10

**The dev.to feedback release.** Every item here was publicly promised as "a
following version" in the comment threads on
[the launch post](https://dev.to/masondelan/my-ai-agent-tried-to-ship-a-mistake-wed-already-reverted-4737).
Five improvements from five threads: an explicit supersede flow, a PreToolUse
enforcement hook, structured constraint / stale-condition fields, git-history
backfill, and optional semantic recall. The store stays append-only and the
core stays zero-LLM / zero-network throughout. **Drop-in upgrade for anyone on
0.3.9** — migration v4 is three nullable `ADD COLUMN`s, the same metadata-only
class as v0.3.8's v3, instant at any DB size. Still **8** MCP tools.

### Reverted is no longer a permanent ban

New `change_type="supersede"` re-opens a reverted decision by linking the prior
event — records stay append-only, a re-open is a new fact, never an edit. The
trail reads **tried → reverted → re-opened**, and `prior_attempts` / `blame` /
`diff` show a clear current status. New CLI `selvedge supersede ENTITY
--reasoning ...`. Explicit only — **no automatic un-retiring**, by design.

### Constraint + stale-condition fields

`constraint` (the testable principle behind a decision) and `stale_when` (the
evidence that would invalidate it) are their own queryable fields now, not one
free-text blob. `stale_decisions` gained a second rule: when a *later* change
event keyword-matches a decision's `stale_when`, it's flagged
`review_suggested` — surfacing only; the follow-up is an explicit `supersede`.

### PreToolUse enforcement hook

The CLAUDE.md "check prior_attempts first" instruction was probabilistic. Now
`selvedge setup` installs a Claude Code PreToolUse hook that blocks
schema/migration edits until `prior_attempts` has been queried this session —
with the prior reasoning **in the block message**, so the agent gets the
skipped context for free. Fail-open by contract; `--dry-run` and
`SELVEDGE_HOOK_DISABLE=1` included. The gate moved out of the prompt and into
the tool boundary.

### Git-history import

`selvedge import --from-git` walks revert-message commits and file deletions
and seeds them as `change_type="revert"` records (idempotent on the commit
sha), so reverts that predate Selvedge gate `prior_attempts` and the hook like
live-captured ones. Honest limit: reverts folded into unrelated commits are
missed, and only SQL DDL drops seed entity-level records today.

### Optional semantic recall

`pip install "selvedge[semantic]"` + `selvedge index` builds a local
embeddings index; `prior_attempts --fuzzy "description"` matches on the
*reasoning*, so a `card_token → payment_token` rename still trips the warning.
Local static embeddings (model2vec, ~30 MB, no torch); fuzzy matches are
clearly labeled; without the extra it falls back to substring with a pointer.
**The core never imports the backend.**

### Migration + tests

**Schema migration v4** adds `supersedes`, `constraint`, and `stale_when` to
`events` (all nullable) — a metadata-only `ADD COLUMN`, instant at any size.
114 new tests (suite 684): the supersede flow, the enforcement hook, git
import, and the semantic layer, each with migration-upgrade, error-path, and
both-surfaces (MCP + CLI) coverage.

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

---

[**Full CHANGELOG.md →**](https://github.com/masondelan/selvedge/blob/main/CHANGELOG.md)
in the source repo. Includes 0.3.7 (the `prior_attempts` wedge + entity
canonicalization foundation), 0.3.6 (stay-current + retention basics —
background PyPI version check, `selvedge prune` for `tool_calls`),
0.3.5 (recovery basics — `selvedge verify`,
`selvedge backup`), 0.3.4 (first-run wizard, prompt, watch),
0.3.3 (per-tool annotations, output schemas, custom icon), 0.3.2
(observability + doctor), 0.3.1 (concurrency hardening), 0.3.0
(correctness fixes), 0.2.x (changesets, import/export), and the 0.1.0
initial release.

[**Roadmap →**](/project/roadmap/) for what's planned through v1.0.0.
