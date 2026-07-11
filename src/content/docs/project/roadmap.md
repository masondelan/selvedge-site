---
title: Roadmap
description: The v0.3.x robustness arc, the v0.4.x breaking-change cycle, and the Phase 4 hosted business. The phase plan in docs/architecture.md is the source of truth — this page mirrors the headline items.
---

The phase plan in [`docs/architecture.md`](https://github.com/masondelan/selvedge/blob/main/docs/architecture.md)
is the canonical roadmap with every checkbox, risk register, and
budget. This page mirrors the headline items so you can browse them
without scrolling 1,500 lines.

The current focus through v0.3.x is **robustness over new feature
surface**. The MCP contract is stable. The CLI surface is stable.
v0.3.x makes the existing surface durable, observable, and dev-
ergonomic. v0.4.0 opens the breaking-change cycle (backend
abstraction, tool-name prefixing). Phase 4 opens the hosted business.

## v0.3.5 — recovery basics ✅ shipped 2026-05-11

The "find out what's wrong, take a safe snapshot" release. See the
[CHANGELOG](https://github.com/masondelan/selvedge/blob/main/CHANGELOG.md) for the full notes.

- **`selvedge verify`** — DB-correctness gate with two exit tiers
  (`must_fail` vs `should_warn`). `--strict` escalates warnings.
- **`selvedge backup`** — online SQLite snapshot via `VACUUM INTO`,
  default `keep_last=7`.
- **Doctor — `Last backup` row + `Schema version` downgrade
  detection.**

## v0.3.6 — stay-current + retention basics ✅ shipped 2026-05-24

Shipped 2026-05-24 as a combined release with stay-current (PyPI
version check) — a one-time exception to single-theme cadence.
Single-theme discipline resumes at v0.3.7. See the
[CHANGELOG](https://github.com/masondelan/selvedge/blob/main/CHANGELOG.md) for the full notes.

- **`selvedge prune` — `tool_calls` only**, hardcoded 90-day default,
  `--days N` override. **No `--include-events` flag in v0.3.6.** Every
  run writes a one-liner to `.selvedge/prune.log` so the pattern is
  visible to later tooling.
- **Doctor — `prune.log` tail row + oversized-`tool_calls` warning**
  (WARN at >100k rows in `tool_calls`).
- **Background PyPI version check in the CLI** (stay-current, deferred
  from v0.3.5). Cache TTL 24h; suppressed in CI / non-TTY / dev
  installs. `selvedge-server` stays silent — wired in `cli.py` only.

## v0.3.7 — `prior_attempts` wedge + entity foundation (Phase 2.13) ✅ shipped 2026-06-08

Brand-defining release. `prior_attempts` is the MCP tool that makes
Selvedge's decision-archaeology positioning legible — an agent about
to attempt X gets told "this was tried before and rejected, here's
why." Shipped *with* the positioning artifacts (demo transcript,
comparison page, README) so the wedge was visible the day it landed.
See the [changelog](/project/changelog/#v037--2026-06-08) for the full
notes.

- **Entity-path canonicalization on write** — fixes the silent
  history-split where `src/auth.py::login` and `./src/auth.py::login`
  resolve to different entities. Single chokepoint at
  `selvedge.storage.canonicalize_entity_path`.
- **`selvedge migrate-paths`** — one-shot backfill with `--dry-run`
  default and a collisions report. `path_migrations` audit table
  makes the operation visible to doctor.
- **Rename support folded into `log_change`** (no new MCP tool) —
  `rename_from` parameter emits the dual-event pattern the importer
  already uses internally.
- **`prior_attempts` MCP tool** — given an entity, returns prior
  events with `reasoning` and inferred outcome. Conservative-recall
  default (`proximity_high` only); caller must opt into the noisy
  long tail. Pull-model, templated, no LLM calls.
- **`selvedge.aggregates.summary()`** ships as a library helper, not
  an MCP tool — `selvedge audit` / `selvedge digest` (v0.3.9) consume
  it directly. Schema-versioned so it can lift to MCP later if
  telemetry warrants.

## v0.3.8 — active memory v1, date-based (Phase 2.14) ✅ shipped 2026-06-16

Selvedge's append-only log learned when its own data is stale. The
date-based half shipped here; the pattern-based half waits for v0.3.11.
**The v3 schema migration added both nullable columns** even though
the second column's evaluator doesn't land until v0.3.11 — one
migration is cheaper than two. Also bundled CLI parity for the v0.3.7
wedge (`selvedge prior-attempts`) and a CLI-awareness section in the
agent-instructions block. See the
[changelog](/project/changelog/#v038--2026-06-16) for the full notes.

- **Schema migration v3** — adds `revisit_after` and `expires_when`
  (nullable) to `events`. Perf gated at 10k / 100k / 1M events. The
  `expires_when` evaluator is deferred to v0.3.11; the column ships now
  so that release needs no second migration.
- **`stale_decisions` MCP tool** (→ **8** total) — events whose
  `revisit_after` has passed. **Active-use weighting**: pure age does
  not surface as stale; a recent `blame`/`diff`/`prior_attempts` query
  of the entity (or later changeset activity) is also required. Each
  result carries `revisit_due`, `days_overdue`, `active_use_signals`,
  and a templated `stale_reason`.
- **`revisit_after` on `log_change` + `selvedge log`** — an ISO date
  or relative offset (`90d`, `6mo`), normalized like `--since`.
- **`selvedge stale` CLI** — terminal-formatted same data surface,
  composes with `selvedge digest` for morning reports.
- **`selvedge prior-attempts` CLI** — CLI parity for the v0.3.7 wedge,
  the only MCP tool that had no CLI command. Thin presenter over the
  same store; `--json` byte-identical to the MCP tool.
- **Doctor — signal-to-noise curation pass.** Reviewed every existing
  row; the new stale-decisions row is INFO-tier so the net WARN count
  did not grow with the release.

## v0.3.9 — Agent Trace export interop ✅ shipped 2026-06-22

`selvedge export --format agent-trace` ships — Selvedge becomes a
compatible **producer** for the [Agent Trace](https://github.com/cursor/agent-trace)
open standard (Cursor + Cognition AI). **Pulled forward from Phase 3**
(v0.4.0): only the exporter moved up; Postgres and the tool-rename/consolidation
remain the v0.4.0 markers (HTTP + auth is v0.4.1). Opt-in and additive — the MCP surface stays at
**8** tools. See the
[changelog](/project/changelog/#v039--2026-06-22) for the full notes.

- **`selvedge export --format agent-trace`** — one Agent Trace v0.1.0
  record per change event, with `--ndjson` (one record per line) and
  `--collapse-by-session`. Selvedge's reasoning + entity provenance ride
  in each record's `dev.selvedge` metadata.
- **`selvedge import --format agent-trace`** — lossless round-trip of a
  Selvedge export; best-effort ingest of foreign producers.
- **`selvedge.exporters.agent_trace`** — the pure, no-LLM converter
  behind both directions, plus a vendored v0.1.0 JSON Schema for
  reference.
- **Honest fidelity** — entity-level / migration-imported events with no
  line range carry `range_unknown: true` and an empty `files[]` rather
  than a fabricated `[1, 1]` placeholder.

> **Plan note.** The developer-ergonomics CLI surface originally scoped
> for v0.3.9 (`selvedge audit` / `digest` / `pr-comment`, Phase 2.15) was
> deferred when the Agent Trace exporter was pulled forward. It is now
> re-homed to **v0.3.16 (Phase 2.22)** — the last 0.3.x feature release,
> just before the v0.4.0 tool-consolidation review.

## v0.3.9.1 — the dev.to feedback release ✅ shipped 2026-07-10

Five improvements, each publicly promised as "a following version" in the
[launch-post](https://dev.to/masondelan/my-ai-agent-tried-to-ship-a-mistake-wed-already-reverted-4737)
comment threads. Append-only store and zero-LLM / zero-network core throughout;
still **8** MCP tools. See the [changelog](/project/changelog/#v0391--2026-07-10)
for the full notes.

- **Supersede flow + decision states** — `change_type="supersede"` re-opens a
  reverted decision by linking the prior revert; the trail reads tried →
  reverted → re-opened. New `selvedge supersede` CLI. Explicit only, no auto
  un-retiring.
- **Constraint + stale-condition fields** — `constraint` and `stale_when` are
  their own queryable fields; `stale_decisions` flags a decision
  `review_suggested` when a later change matches its `stale_when`.
- **PreToolUse enforcement hook** — `selvedge setup` installs a Claude Code
  hook that blocks schema/migration edits until `prior_attempts` has run,
  returning the prior reasoning as the block message. The gate moved from
  CLAUDE.md to the tool boundary.
- **Git-history import** — `selvedge import --from-git` seeds pre-Selvedge
  reverts from revert commits + file deletions, idempotent on the commit sha.
  New `change_type="revert"`.
- **Optional semantic recall** — `prior_attempts --fuzzy` matches on the
  reasoning so a rename still trips the warning. Ships as the
  `selvedge[semantic]` extra (model2vec); the core never imports it.

> **Plan note.** `revert` and `supersede` shipped here, pulled forward from the
> v0.3.11 change-type work below — the git importer needed `revert`, and the
> supersede flow answered the un-retire thread. `reject` and the `expires_when`
> evaluator remain in v0.3.11.

## v0.3.10 — config + advanced retention (Phase 2.16)

`.selvedge/config.toml` lands here, paired with the dependent
features that needed somewhere to read settings from. Configuration
as a foundation; deferring it from v0.3.5 let the grammar settle in
one release.

- **`.selvedge/config.toml`** — first-class project config. Houses
  `retention_days_events` (default ∞), `retention_days_tool_calls`,
  `backup_keep_last`, `diff_bytes`, `reasoning_bytes`,
  `db_size_warn_mb`, `stale_days`. Precedence:
  CLI > env > project config > global config > defaults. `SELVEDGE_DB`
  is the only exception (env always wins for DB path).
- **`selvedge prune --include-events`** — destructive events-table
  prune. Requires confirmation prompt **AND** `SELVEDGE_DESTRUCTIVE=1`
  **AND** audit-log append to `.selvedge/prune.log`. Default events
  retention is *infinity* — users must opt in to ever deleting events.
- **Event-size bounds at log time** — `diff_bytes` / `reasoning_bytes`
  truncation with a `…[truncated 12KB]` marker; truncation surfaced
  as a validator warning at write time.
- **Doctor — `oversized-tables` warning + per-setting precedence
  surfacing.**

## v0.3.11 — active memory v2, semantic (Phase 2.17)

The pattern-based half of active memory. `expires_when` was added in
v0.3.8's schema migration; v0.3.11 lights up the evaluator. No new
migration.

- **`expires_when` evaluator** — closed grammar in v1, *not* free-form:
  `library:NAME>=VERSION`, `entity:PATH:changes`, `date:ISO`,
  `manual:LABEL`. Non-matching values rejected at write time.
  Evaluable from local state only — no network, no LLM.
- **New `change_type` value: `reject`** — first-class "we considered
  this and decided against it" event. (`revert` shipped early in
  v0.3.9.1 for the git importer; `reject` remains here.) Adoption
  defended on three surfaces (`log_change` docstring, `PROMPT_BLOCK`,
  reasoning validator).
- **`prior_attempts` outcome-classifier upgrade** — explicit
  `reject`/`revert` events become the high-confidence tier directly;
  the proximity heuristic from v0.3.7 becomes the tiebreaker.

## v0.3.12 — competitive interop + verifiable claims (Phase 2.18)

Three items making Selvedge's positioning claims observable,
verifiable, and interoperable.

- **Git Notes one-way reader — `selvedge import --format git-notes`.**
  Competition response: if Git AI's "Git Notes as the open standard
  for AI authorship" framing gets endorsed by Cursor / Anthropic /
  GitHub, Selvedge needs to be a *complement* to it, not a
  substitute. Read-only on purpose.
- **Verifiable-no-network test** — `tests/test_no_network.py`
  asserts `socket.socket` / `urllib.request` are never called
  during normal operation. Backs the "your data stays on your
  machine" claim with CI.
- **`selvedge ci-check` — reporter mode only.** Computes reasoning
  quality / coverage / changeset coverage against thresholds. Always
  exits 0 by default; `--enforce` flag opts in to gating. Default
  enforcement deferred until telemetry shows what natural quality
  distributions look like (Goodhart-trap defense).
- **Git-import provenance + trust tiers** — matures the v0.3.9.1
  `import --from-git` slice into an audit-grade one. A git-seeded record
  is re-derivable (re-run the importer, diff against the store); a
  live-captured one is testimony — so the gate can hard-block the
  re-derivable slice and treat testimony as advisory. Adds a queryable
  provenance field, an `import --from-git --verify` re-derivation diff,
  cross-file entity extraction (so a reverted column matches across
  migration / model / serializer), and a measured miss-rate for the
  capture layer. From the launch-post design feedback; can pull forward.

## v0.3.13 — cross-repo CLI (Phase 2.19)

First half of personal-OSS cross-repo. CLI surface ships first; the
MCP-parameter half waits for v0.3.14 so we can observe whether CLI
usage warrants the MCP overhead. Read-only union over N local
`.selvedge/` directories; writes still scope to the current project.

- **Link registry — `links.toml`** — listing other `.selvedge/`
  directories the user owns. Per-project `[allowlist]` controls
  which projects may read this one via `--all-projects`. Default
  empty — opt-in, not documentation.
- **`selvedge link` / `unlink` / `linked`** — registry management
  with audit log at `.selvedge/links.audit.log`.
- **`--all-projects` on read commands** — `history`, `search`,
  `diff`, `blame`, `stale` union across linked DBs (filtered by
  allowlist). First-time consent prompt per project.
- **`LinkedReadStorage` — read-only invariant** at the type level.

## v0.3.14 — cross-repo MCP + write disambiguation (Phase 2.20)

Second half of cross-repo. Lights up the `all_projects` MCP
parameter, adds the `project` field to `LogChangeResult` so
cross-repo writes are never ambiguous, and ships the `_scan_summary`
field that surfaces filter-coverage gaps explicitly. Ships **only
if** v0.3.13's CLI cross-repo gets adopted.

- **`all_projects: bool = False` parameter** on read MCP tools.
  `log_change` unchanged — writes always scope to current project.
- **`LogChangeResult.project` field** makes write resolution visible
  when ambient context is cross-repo.
- **`_scan_summary` field on `--all-projects` responses** — lists
  each linked project, schema version, allowlist status, row-count
  contribution, and whether NULL fields in older entries caused
  filter coverage gaps. Closes the silent-miss failure mode.
- **Doctor — schema-skew + allowlist-symmetry check** for linked DBs.

## v0.3.15 — salvage, conditional (Phase 2.21)

Originally scoped as part of v0.3.5; deferred here because corruption
is the rarest failure mode and `backup` + `verify` cover 95% of the
recovery need. **Ships only if** install-base telemetry shows real
corruption incidents that backup-restoration alone doesn't address.

- **`selvedge repair`** — wraps SQLite's `.recover` to salvage events
  from a corrupted DB. Default dry-run; `--apply` refuses to run if
  no backup has been taken in the last 7 days.
- **Doctor — `last_backup` escalation** — once repair is shippable,
  the WARN/FAIL thresholds tighten.

## v0.3.16 — developer ergonomics (Phase 2.22)

The CLI surface that moves Selvedge into the developer's existing
review and reporting workflow — the supporting cast that turns
`prior_attempts` + `summary` into an everyday surface. **Deferred from
v0.3.9** when the Agent Trace exporter was pulled forward; re-homed as
the last 0.3.x feature release, right before the v0.4.0 consolidation
review that decides whether `digest` / `audit` become pure CLI views of
`summary`.

- **`selvedge audit`** — PR-review-ready quality report for a branch or
  commit range. `--format markdown` for PR-comment use.
- **`selvedge digest`** — terminal rendering of the `summary` helper.
  Default `--since 24h`, designed for cron / Slack / email.
- **`selvedge pr-comment --pr 123`** — formats `audit` for
  `gh pr comment`, wrapped in versioned `<!-- selvedge:pr-comment v1 -->`
  sentinels. No GitHub API calls in core.
- **Setup detection version contract** — `selvedge setup` / `doctor`
  flag when an upstream agent (Claude Code, Cursor, Copilot) moves its
  config path. Detection paths treated as a versioned contract.

## v0.4.0 — backend rewrite + tool rename (Phase 3)

First release in the breaking-changes window. Bundles the storage
backend abstraction and the deferred MCP tool-name rename so users
absorb both breaks in one cycle. HTTP+auth ships separately in v0.4.1
so each release's surface stays tightly scoped.

- **MCP tool-surface consolidation review (gate before any other
  v0.4.0 changes ship).** By v0.3.11 the tool count is ~9.
  `history` + `changeset_id` filter overlaps `changeset`; `summary`
  overlaps `digest` / `audit`. Past ~10 tools agents hit decision
  fatigue. Written decision in the architecture doc names the final
  v0.4.0 tool list before the prefix migration begins.
- **`StorageBackend` protocol + PostgreSQL backend.** SQLite stays
  the default; `SELVEDGE_BACKEND=postgresql://...` swaps the layer.
  `LinkedReadStorage` (v0.3.13) gets rewritten against the new
  protocol.
- **MCP tool-name prefix migration** — `selvedge_*` form with
  deprecation aliases. Each alias carries a `DEPRECATED_UNTIL_VERSION`
  constant; CI lint fails the build if a deprecation deadline is
  reached without removal. "One minor cycle" deprecation promise is
  enforceable, not aspirational.

## v0.4.1 — HTTP REST + auth (Phase 3.1)

The wire-protocol layer. Exposes every MCP server operation over
HTTP for clients that can't speak MCP directly (CI gates, compliance
scanners, dashboards). MCP stdio path stays unauthenticated by
design — local-only, agent and server on the same machine.

- **HTTP REST API (FastAPI)** — endpoint list reflects the v0.4.0
  consolidation decision. **`test_http_protocol.py` is a
  release-blocker**, parallel to `test_mcp_protocol.py`, round-tripping
  every endpoint over a real subprocess.
- **API-key auth** for HTTP with rotation. Out of scope: SSO,
  OAuth, RBAC (Phase 4 hosted).
- **`selvedge-server-http`** entry point alongside the existing
  stdio `selvedge-server`.

## v0.4.2 — Agent Trace interop (Phase 3.2) ✅ delivered early in v0.3.9

Selvedge became a compatible producer of
[Agent Trace](https://github.com/cursor/agent-trace), the open RFC
for AI code attribution traces — **shipped ahead of schedule in
v0.3.9**, pulled forward from this slot once the standard gained
backing. Purely additive and non-breaking. The delivered scope is in
the [v0.3.9 notes](/project/changelog/#v039--2026-06-22) and the
[Agent Trace interop page](/compare/agent-trace/); records use the
reverse-domain `metadata["dev.selvedge"]` namespace from the published
v0.1.0 spec (not the `extensions.selvedge.*` shape this slot originally
assumed).

- **`selvedge export --format agent-trace`** — shipped in v0.3.9. AT
  v0.1.0 records from the local store, with `--ndjson` and
  `--collapse-by-session`.
- **`selvedge import --format agent-trace`** — shipped in v0.3.9.
  Lossless Selvedge round-trip; best-effort foreign-producer ingest.
- **`range_unknown` preamble** — shipped in v0.3.9. Entity-level and
  migration-imported events say so rather than fabricating `[1, 1]`.

## Phase 4 — hosted platform

- **Web dashboard** (React + the REST API)
- **Cross-repo *team* queries** — server-side, multi-tenant, with
  auth and cross-user permissioning. The single-user OSS variant
  (read-only local overlay across `.selvedge/` directories the same
  user owns) is v0.3.13 / v0.3.14. Hosted is for teams sharing
  context across users; OSS is for individuals across their own
  portfolio.
- **Team/org-level retention policies**, configurable independently
  from the project-local `retention_days_events` /
  `retention_days_tool_calls` settings shipped in v0.3.10.
- **Team / org management**
- **Webhook events** (Slack, PagerDuty, etc. on schema changes)

## What's deliberately not on the roadmap

- **LLM calls inside Selvedge core.** Templated, deterministic
  output only. Each feature in the v0.3.7 → v0.3.11 active-memory
  arc sits near this boundary; every PR for one of those features
  must justify in its description how the templated output covers
  the user need.
- **Code parsing / AST extraction.** Selvedge does not extract
  entities from source — it stores what the agent tells it,
  canonicalized and queryable. Language-specific AST work fights
  the dependency-free-core rule.
- **Replacing `git`.** The diff stays git's job.
- **A second LLM that infers reasoning from diffs.** AgentDiff and
  friends do this; Selvedge takes the other approach (live capture
  from the originating agent) on purpose.

## Where to track this

- [**`docs/architecture.md`**](https://github.com/masondelan/selvedge/blob/main/docs/architecture.md)
  — the canonical phase plan with checkboxes, risk register, and
  test budgets per phase
- [**`CHANGELOG.md`**](https://github.com/masondelan/selvedge/blob/main/CHANGELOG.md)
  — what's actually shipped (the truth when checkboxes drift)
- [**Issues**](https://github.com/masondelan/selvedge/issues) — current
  bug + feature threads
