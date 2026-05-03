---
title: Roadmap
description: What's planned through v0.4.0 (team features) and v1.0.0 (web dashboard, cross-repo). The phase plan is the source of truth — this page mirrors it for browsing.
---

The phase plan in [`docs/architecture.md`](https://github.com/masondelan/selvedge/blob/main/docs/architecture.md)
is the canonical roadmap. This page mirrors the headline items.

The current focus through v0.3.x is **robustness over new feature surface.** The MCP
contract is stable. The CLI surface is stable. v0.3.x is about making the existing
surface durable, observable, and dev-ergonomic. v0.4.0 opens the team-features phase.

## v0.3.5 — recovery and resilience (planned)

The "what happens when something goes wrong" release.

- **`selvedge prune` — bounded cleanup.** Configurable retention windows for
  `tool_calls` (telemetry table). Optional `--include-events` requires both
  `SELVEDGE_DESTRUCTIVE=1` and an interactive confirmation prompt. Defends against the
  cron / `--yes` footgun.
- **`selvedge repair` — schema reconciliation.** Detects and repairs orphan rows from
  pre-v0.3.0 data, partial migrations, or DBs created by old tooling. Idempotent.
- **`selvedge backup` / `selvedge restore`.** Snapshots the SQLite file with proper
  WAL handling. Restores into a different `.selvedge/` for testing.
- **DB integrity check on `selvedge doctor`.** Runs `PRAGMA integrity_check` and
  surfaces the result. New row on the doctor output.

## v0.3.6 — dev integrations + prior-attempts research (planned)

- **`prior_attempts` parameter on `log_change` and `blame`.** Returns the previous N
  attempts to modify the same entity along with their reasoning, so an agent reading
  `blame` before making a new change can see what's already been tried. Pull-model
  variant of the proactive-conflict-detection idea — the push variant (auto-warn at
  log time) stays research-only until adoption signal on this one is in.
- **VS Code extension MVP.** Inline `selvedge blame` in the gutter for the entity
  under the cursor. Click to open a panel with full reasoning.
- **JetBrains plugin MVP.** Same surface for IntelliJ / PyCharm / GoLand.

## v0.3.7 — active memory (planned, Phase 2.13)

The "stop the agent from rediscovering things you already decided" release.

- **`revisit_after` column on `change_events`.** Optional timestamp; an event with
  `revisit_after` set will surface on `selvedge stale` after that date. Captures
  "we picked X for now but should reconsider once Y happens."
- **`selvedge stale_decisions` MCP tool.** Returns events whose `revisit_after` has
  passed, plus events on entities that haven't been touched in > N days but were
  intentionally chosen at the time.
- **Reject-or-revert via `log_change`.** Calling `log_change` with a `rejected: true`
  flag on an entity that already has a recent event surfaces the prior reasoning to
  the agent so it can confirm or push past the existing decision deliberately.

## v0.3.8 — personal cross-repo (planned, Phase 2.14)

The "I have eight side projects on this laptop and I want one query across them"
release.

- **Project link registry.** A `~/.selvedge/registry.json` that lists projects by
  `.selvedge/` path. Auto-updated on `selvedge init`.
- **`--all-projects` flag** on read commands. `selvedge history --all-projects --since
  30d` reads from every project in the registry.
- **`LinkedReadStorage` adapter.** Reads from N SQLite files transparently, deduping
  on event ID.

This is a personal-scale feature, not a team feature. Cross-repo *team* queries are a
v1.0.0 concern.

## v0.4.0 — team features (Phase 3)

The first non-local-only release.

- **PostgreSQL backend.** `SELVEDGE_BACKEND=postgresql://...` swaps the storage layer.
  Same schema, same migrations, same queries. SQLite stays the default.
- **HTTP REST API layer (FastAPI).** Mirrors the MCP tools as REST endpoints.
- **API-key auth** for the HTTP layer. Per-key scopes (read-only vs. log_change-only
  vs. full).
- **`test_http_protocol.py`** — release-blocker. Parallel to `test_mcp_protocol.py`,
  boots the real HTTP server and round-trips every endpoint.

## v1.0.0 — web dashboard

- **Read-only web UI** for browsing events, changesets, and per-entity history.
- **Cross-repo team queries** through the HTTP API.
- **Webhook events** on schema changes (POST to a configurable URL when a change to
  `entity_type=table|column|schema` is logged).
- **Org / team management** in the HTTP API + dashboard.

## What's deliberately not on the roadmap

- **LLM calls inside Selvedge core.** Templated, deterministic output only.
- **A SaaS-hosted version.** Selvedge is local-first by design. The HTTP layer is
  for self-hosted team servers; there's no plan for a Selvedge cloud.
- **Replacing `git`.** The diff stays git's job.
- **A second LLM that infers reasoning from diffs.** AgentDiff and friends already do
  this; Selvedge takes the other approach (live capture from the original agent) on
  purpose.

## Where to track this

- [**`docs/architecture.md`**](https://github.com/masondelan/selvedge/blob/main/docs/architecture.md)
  — the canonical phase plan with checkboxes
- [**`CHANGELOG.md`**](https://github.com/masondelan/selvedge/blob/main/CHANGELOG.md)
  — what's actually shipped (the truth when checkboxes drift)
- [**Issues**](https://github.com/masondelan/selvedge/issues) — current bug + feature
  threads
