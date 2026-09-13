---
title: What's new
description: Recent Selvedge releases. Every shipped change is in CHANGELOG.md in the source repo — this page mirrors the most recent releases for at-a-glance browsing.
---

The canonical changelog is [`CHANGELOG.md`](https://github.com/masondelan/selvedge/blob/main/CHANGELOG.md)
in the source repo. This page mirrors the most recent releases for
at-a-glance browsing.

## v0.3.14 — 2026-09-12

**Explicit seven-day prior-attempt windows now match the default.** Passing
`window_minutes=10080` to Selvedge's `prior_attempts` MCP tool now passes
validation, matching the existing seven-day default. The accepted range is
1–10,080 minutes. The maximum result limit remains 1,000.

This patch also synchronizes release metadata and corrects the npm launcher's
maintainer pin instructions. It adds no new MCP tools, database migrations,
runtime dependencies, or default telemetry.

Available on [PyPI](https://pypi.org/project/selvedge/0.3.14/),
[npm as `selvedge-mcp@0.3.14`](https://www.npmjs.com/package/selvedge-mcp/v/0.3.14),
the official MCP registry, and [Smithery](https://smithery.ai/servers/masondelan/selvedge).
See the [full release notes](https://github.com/masondelan/selvedge/releases/tag/v0.3.14).

## v0.3.13 — 2026-09-12

**Review flags stay attached to the decision they describe.** Claude Code's
session-start summary now keeps expiry and manual-review labels, with their
explanations, wherever an affected decision appears. Decisions on the same entity
no longer borrow one another's review status.

The revisit list drops a rejected or reverted decision after an explicit
`supersede` reopens it. Other decisions on that entity remain eligible for review.
An expiry condition still requests a review; it never changes a verdict or
rewrites history automatically.

The release also adds a [community feedback guide](https://github.com/masondelan/selvedge/blob/main/docs/community-feedback.md)
and a product-feedback issue form. The guide explains how to correct a mistaken
rejection with `supersede` and how reports become documented product decisions.
No new dependencies, migrations, MCP tools or default telemetry.

Available on [PyPI](https://pypi.org/project/selvedge/0.3.13/),
[npm as `selvedge-mcp@0.3.13`](https://www.npmjs.com/package/selvedge-mcp/v/0.3.13),
and [Smithery](https://smithery.ai/servers/masondelan/selvedge).
See the [full release notes](https://github.com/masondelan/selvedge/releases/tag/v0.3.13).

## v0.3.12 — 2026-09-12

**Choose your agent and get to a first saved decision.** Setup now configures
Claude Code, Codex, Copilot, Cursor, Gemini CLI and Windsurf. Use
`selvedge setup --agent NAME` to choose explicitly, or keep automatic detection.
The wizard preserves existing configuration and prints restart and first-use
instructions. Codex's TOML settings receive conservative, conflict-aware edits.

Run `selvedge demo` to save a rejected approach and read it back through a fresh
database connection. The demo uses a temporary database and leaves your project
untouched. Status recognizes the supported agents' registry formats.

MCP tools work across supported agents; session-start reminders and the edit
gate remain Claude Code features. No new dependencies, migrations or MCP tools.

## v0.3.11 — 2026-08-29

**Abandoned alternatives are first-class, and the log can prove itself.** The
active-memory release: rejections become stated outcomes, expiry conditions
get their evaluator, and a hash chain makes the event log tamper-evident.

### Rejections are stated outcomes, not inferences

New `change_type="reject"` records "we considered this and decided against
it" *without writing the change* — the counterpart to `revert` for paths
never taken. No new tool; it's logged through the existing `log_change`, and
the prompt block now tells agents to log rejections and reverts with the
condition that would invalidate them.

`prior_attempts` reads both as a new **`confidence: "exact"`** tier — the
outcome is stated in the log, not guessed from add→remove proximity. The old
proximity heuristic drops to tiebreaker for attempts without a stated
outcome. Results move accordingly: rows that used to come back
`proximity_high` can now come back `exact`, so callers filtering on
`proximity_high` should accept `exact` too.

### Decisions that know when to die

The `expires_when` column that shipped dormant in v0.3.8 gets its evaluator.
A decision can carry a machine-checkable expiry condition in a closed
four-shape grammar — `library:NAME>=VERSION`, `entity:PATH:changes`,
`date:ISO`, `manual:LABEL` — validated at write time on every path; values
outside the grammar are rejected, not stored. `selvedge stale` evaluates the
conditions locally, from installed package metadata, the event log itself,
and the clock — no network, no LLM — and flags fired ones `expired`. A
`library:` condition whose package isn't locally observable surfaces as
`manual_review` rather than a guess, and `manual:` never auto-fires.

### The log can prove itself

Every logged event now gets a SHA-256 chain record in a sidecar table, same
transaction, covering every field except the late-bound `git_commit` (git
already witnesses that one). Two new `selvedge verify` checks:
**`chain_intact`** fails hard when a chained row was edited, deleted, or
reordered out-of-band — naming the exact sequence number — and
**`chain_coverage`** warns, never fails, about rows that predate the chain.
Legitimate operations append boundary records instead of breaking the chain,
so `migrate-paths --apply` and a destructive-gated prune verify clean while
a silent `sqlite3` edit does not. `selvedge verify --json` publishes the
attestation manifest. Honest scope, stated in the module itself: this
detects casual and accidental modification; it is not proof against a
motivated local attacker, who controls the file and can recompute every
digest.

### Fixes

`selvedge supersede` gains `-d/--diff`, `--revisit-after`, and
`--expires-when` (#31) — the storage layer accepted them all along, so the
guided flow finally records everything the raw path could. An id-less
supersede no longer re-opens every earlier revert on the path (#30). The
PreCompact reminder now distinguishes "edited with no log" from "log exists
but was truncated," both hook surfaces have their determinism pinned
byte-for-byte in tests, and a capture-time nudge suggests recording the
invalidating condition when a reject or revert lands without one.

Tests 984 → 1114. No migration, no new config keys, still **8** MCP tools.

## v0.3.10 — 2026-08-05

**Config + delivery.** Two themes: the memory comes to the agent, and the store
gets its dials.

### The memory comes to the agent

Selvedge already blocked re-edits of reverted entities. What was missing was
delivery when there is nothing to veto — so two new hooks:

- **SessionStart** injects a compact digest as a session begins: decisions due
  for a revisit, entities that were tried and reverted, recent changesets.
- **PreCompact** fires just before context compaction destroys the session's
  reasoning and names the watched entities you edited but never logged.

Both are quiet when they have nothing to say, size-capped, read-only, and
templated. Neither can block anything — PreCompact deliberately declines the
veto the hook API offers it, because blocking compaction doesn't inconvenience
a tool call, it wedges the session.

This answers a measured failure mode rather than a hunch: two 2026 papers
recorded pull-model memory tools going unused entirely — zero voluntary memory
operations across 114 turns against a pre-seeded store — while deterministic
injection landed every time.

### Captured intent, reviewable in a pull request

`selvedge export --format markdown` renders the store as a human-readable
digest to commit next to it, grouped by entity with reverted decisions first.
Deterministic: regenerating with no new events produces a zero-line diff, so it
stays reviewable instead of becoming noise.

### The store gets its dials

`.selvedge/config.toml` is now first-class, with a canonical precedence chain
(**CLI flag → env var → project config → global config → default**) that
`selvedge doctor` prints per setting. `SELVEDGE_DB` remains the one exception
and always wins for database resolution.

- **`selvedge prune --include-events`** — the first path that can delete
  captured reasoning, so it needs *both* a confirmation and
  `SELVEDGE_DESTRUCTIVE=1`. Neither alone is enough: `--yes` in a cron entry
  defeats a prompt, and a shell profile defeats an env var. Events retention
  defaults to never.
- **Event-size bounds** (`diff_bytes`, `reasoning_bytes`) truncate loudly — a
  marker in the text, a warning at write time, a count in `selvedge stats`.
- **Secret-shape warnings** at `log_change`, extendable via
  `redaction_patterns`, plus a `doctor` row that scans what is already stored.
  Warn, never reject.

### Fixes

Five review issues closed. The PreToolUse hook's allow path is **40% faster**
(33.6 ms → 20.1 ms per gated call) and `SELVEDGE_HOOK_DISABLE=1` finally
short-circuits before the imports it was documented to skip. `log_change` no
longer discards `revisit_after` / `constraint` / `stale_when` on renames and
supersedes. The CLI's `--json` and the MCP tools now return identical
structures. The Docker image no longer ships the maintainer's own database.

Tests 826 → 984. Still **8** MCP tools.

## v0.3.9.3 — 2026-08-01

**Unbreaks `pip install selvedge`, plus a full code-quality pass.** `mcp` 2.0.0
removed `mcp.server.fastmcp`, and Selvedge declared `mcp>=1.0.0` with no upper
bound — so every fresh install after 2026-07-28 resolved 2.0.0 and
`selvedge-server` died at import. That pin is the reason to take this release.

It shipped alongside nine parallel reviews across correctness, concurrency,
security, performance, API consistency, test quality, code health and
packaging, with every finding put through an adversarial verification pass
before it was acted on. Seventeen confirmed defects fixed — the enforcement
gate no longer false-blocks ordinary reads, entity lookups went from 7.4 ms to
0.35 ms at 100k events, and `selvedge setup` can no longer damage your
`CLAUDE.md`. No schema or tool-surface change, so it's drop-in from 0.3.9.x.

## v0.3.9.2 — 2026-07-23

**The Claude Code plugin, from scaffolding to first-class.** `/plugin install
selvedge@selvedge` is now a complete, zero-prior-install setup: a bootstrapping
launcher (existing install → `uvx` → `pipx`), the agent-instructions as a
bundled skill, the PreToolUse enforcement hook, and four slash commands
(`/selvedge:status`, `blame`, `history`, `prior-attempts`). **No store, schema,
or tool-surface change** — the MCP server is byte-identical to 0.3.9.1. Drop-in
for anyone on 0.3.9.x.

### What the plugin ships

The launcher tries an existing install first, then `uvx`, then `pipx`, so a
fresh machine needs nothing preinstalled and anyone who already has Selvedge on
their `PATH` keeps their exact version. The bundled skill is generated from the
same block `selvedge prompt` installs, so the plugin and the hand-written prompt
can't drift. The enforcement hook uses the same matcher as `selvedge setup`, and
double-registration is harmless — the gate is read-only and its verdict is
deterministic.

### npm shim

`npx selvedge-mcp` now pins the server through a dedicated `pypiVersion` field,
decoupled from the shim's own npm version (npm's semver can't hold a
four-segment PEP 440 version like 0.3.9.2).

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
[Agent Trace](https://agent-trace.dev/) **v0.1.0** records — the
open AI code-attribution wire format published by Cursor — so your
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

---

[**Full CHANGELOG.md →**](https://github.com/masondelan/selvedge/blob/main/CHANGELOG.md)
in the source repo. Includes 0.3.8 (active memory v1 — revisit dates + `stale_decisions`), 0.3.7 (the `prior_attempts` wedge + entity
canonicalization foundation), 0.3.6 (stay-current + retention basics —
background PyPI version check, `selvedge prune` for `tool_calls`),
0.3.5 (recovery basics — `selvedge verify`,
`selvedge backup`), 0.3.4 (first-run wizard, prompt, watch),
0.3.3 (per-tool annotations, output schemas, custom icon), 0.3.2
(observability + doctor), 0.3.1 (concurrency hardening), 0.3.0
(correctness fixes), 0.2.x (changesets, import/export), and the 0.1.0
initial release.

[**Roadmap →**](/project/roadmap/) for what's planned through v1.0.0.
