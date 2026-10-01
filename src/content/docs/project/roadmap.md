---
title: Roadmap
description: What shipped in Selvedge v0.3.16, the next validation and remote-access priorities, and the work still under consideration.
---

**Updated October 1, 2026 · current release: v0.3.16.**

Selvedge's next work is to validate the decision-memory workflow in more real
clients and projects, and design authenticated access for remote agents.
Unfinished work below has no promised release date or version. The
[architecture plan](https://github.com/masondelan/selvedge/blob/main/docs/architecture.md)
keeps the detailed designs, dependencies and acceptance criteria.

## Shipped

**v0.3.16 makes recorded decisions easier to inspect and use in review.**

- **Decision ledger:** `selvedge ledger` shows actor/session attribution,
  explicit cross-agent revisions and snapshot chain verification. Actor labels
  are self-reported; a valid chain does not authenticate them.
- **Optional GitHub review comments:** the
  [review-context Action](https://github.com/masondelan/selvedge/blob/v0.3.16/docs/review-context.md)
  surfaces recorded history for changed files from a publication-approved base
  database. It must be enabled explicitly; it does not include decisions first
  recorded in the unmerged PR.
- **Client diagnostics:** `selvedge doctor --agent CLIENT` checks project hook
  configuration, executable availability and the bypass setting. A configured
  hook still needs activation and verification in its client.
- **A second published pilot:** 24 synthetic trials comparing no memory with
  injected Selvedge records, including stale and unrelated-memory controls.

The preceding releases delivered explicit six-client setup and a disposable demo
(v0.3.12), stale-decision corrections (v0.3.13), the MCP seven-day query-window fix
(v0.3.14), and five additional native lifecycle adapters plus the first 48-trial
pilot (v0.3.15). SQLite and the eight-tool MCP surface remain in place.
See [What's New](/project/changelog/) for the full release history.

## Next priorities

### Verify hooks in real clients

The native adapters are shipped. The next step is broader evidence that each
supported lifecycle event actually runs in each client and version: startup
context, watched edits, lookup/retry behavior and compaction notifications where
supported.

The [hook guide](/guides/agent-lifecycle-hooks/) distinguishes protocol tests
from observed client behavior. One Codex edit-gate/lookup/retry path has been
observed; startup/compaction and the other four new clients still need native
end-to-end validation. Windsurf/Cascade supports edit and command checks, without
the startup and compaction events available in the other adapters. Compaction
notifications are advisory, not automatic model context injection.

### Expand the evaluation

Both published pilots are small synthetic configuration-choice experiments.
The 48-trial pilot tied Selvedge, a decision-file fixture and inline facts at
12/12 correct choices each. The 24-trial injection pilot observed 4/6 eligible
rejected-path repeats without memory and 0/6 with injected records. These results
do not establish general coding performance or superiority over maintained files.

The remaining evaluation work includes real repository tasks, token-matched
baselines, capture and write-time costs, native delivery versus tool retrieval,
and file-level versus entity-level memory. Publish mixed and negative results
alongside positive results. See the [evaluation guide](/guides/evaluate-decision-memory/)
and [full pilot methods and results](https://github.com/masondelan/selvedge/tree/v0.3.16/bench/decision_memory).

### Design authenticated remote access

Today, agents on the same host can point at one local SQLite store. Remote
agents need an explicit relay; Selvedge does not yet provide an authenticated
remote service. A live SQLite WAL database should not be shared through a
network filesystem or file-sync service.

The next design must settle the client transport, authentication and actor
identity, project permissions, credential rotation and storage for concurrent
remote writers. The architecture plan's REST/API-key and PostgreSQL proposals
are inputs to that work; remote MCP compatibility is a separate design choice.
Local stdio access will remain part of the design. See
[sharing memory between agents](/guides/share-memory-between-agents/).

## Planned, without a release assignment

| Area | Remaining work and gate |
| --- | --- |
| Verifiable claims and interop | Git Notes import, no-network and retention code-path tests, git-import provenance and re-derivation checks. The MCP context-cost CI guard and event hash chain already ship. |
| Local cross-repo reads | An explicit link registry, per-project allowlists and read-only CLI queries. Add MCP parameters only after CLI usage shows demand; writes remain scoped to one project. |
| Developer reporting | Proposed `audit`, `digest` and `pr-comment` commands, plus a client-version compatibility contract. Reassess overlap with the shipped ledger, review Action and diagnostics before adding more interfaces. |
| Recovery | A `repair` salvage command only if reported corruption cases justify it. `backup` and `verify` already ship. |
| Standards participation | Separate follow-up after the review workflow, with no version assigned. |

Earlier roadmap entries assigned these features to v0.3.12–v0.3.16. Those
assignments are retired: the versions shipped different work, listed above.
The proposed commands and cross-repo capabilities are not available today.

## Later architecture and hosted work

The proposed v0.4.x cycle groups potentially breaking changes: a storage backend
interface and PostgreSQL option, an MCP tool-surface review, and tool-name
migration with a deprecation path. Authenticated HTTP access needs its own
protocol-level tests and design review. These are proposed groupings, not a
committed release schedule.

A hosted platform would build on that foundation: a dashboard, team/org
management, permissioned cross-user queries, per-tenant retention and webhooks.
Local cross-repo reads are a separate proposal and have not shipped either.
Agent Trace import/export already shipped in v0.3.9; it is not a future milestone.

## Product boundaries

Selvedge core keeps deterministic output and makes no model calls. It records
explicit decisions instead of asking another model to infer private reasoning
from diffs. It does not replace git or become a general source-code parser.

Track delivered behavior in [What's New](/project/changelog/), detailed design
work in the [architecture plan](https://github.com/masondelan/selvedge/blob/main/docs/architecture.md),
and bugs or feature requests in [GitHub issues](https://github.com/masondelan/selvedge/issues).
