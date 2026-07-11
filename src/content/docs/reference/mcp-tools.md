---
title: MCP tools
description: The eight tools Selvedge exposes over MCP, their parameters, and what they return. This is what your AI agent actually calls.
---

`selvedge-server` exposes eight MCP tools. Seven are read-only and idempotent; one
(`log_change`) is the writer. Every tool ships with full per-parameter descriptions, an
output schema, and tool-level annotations — so MCP-aware agents and directories can
gate, surface, and pick between them appropriately.

## At a glance

| Tool | Purpose | Read/Write | Idempotent |
|---|---|---|---|
| `log_change` | Record a change event | Write (append) | No (each call mints a new event) |
| `diff` | History for an entity / prefix | Read | Yes |
| `blame` | Most recent change + context | Read | Yes |
| `history` | Filtered history across entities | Read | Yes |
| `changeset` | All events under a slug | Read | Yes |
| `search` | Full-text search | Read | Yes |
| `prior_attempts` | Prior attempts on an entity + inferred outcome | Read | Yes |
| `stale_decisions` | Dated decisions that are due for a revisit *and* still active | Read | Yes |

None are `openWorldHint: true`. None touch the network.

---

## `log_change`

Record a change event. The only writer.

### Parameters

| Name | Type | Description |
|---|---|---|
| `entity_path` | `string` (required) | The thing that changed: `users.email`, `src/auth.py::login`, `env/STRIPE_SECRET_KEY`, `deps/stripe`. See [entity paths](/reference/entity-paths/). |
| `entity_type` | `string` | `column` / `table` / `file` / `function` / `class` / `endpoint` / `dependency` / `env_var` / `index` / `schema` / `config` / `other`. Coerced to `"other"` if unrecognized. |
| `change_type` | `string` (required) | `add` / `remove` / `modify` / `rename` / `retype` / `create` / `delete` / `index_add` / `index_remove` / `migrate` / `revert` / `supersede`. Validated against the enum — typos are rejected. `revert` ("tried and rolled back") and `supersede` (re-open a reverted decision) were added in v0.3.9.1. |
| `diff` | `string` | The diff text. Optional but recommended. |
| `reasoning` | `string` | **The why.** Captured from the agent's own context. Run through the quality validator — empty / too-short / generic-placeholder values produce `warnings` (advisory). |
| `agent` | `string` | The calling agent name (`claude-code`, `cursor`, `copilot`, etc.). |
| `session_id` | `string` | Optional session correlation ID. |
| `git_commit` | `string` | Commit hash. Usually unset at log time and backfilled by the post-commit hook. |
| `project` | `string` | Project name. Defaults to the project root's basename. |
| `changeset_id` | `string` | A slug grouping related changes under one feature/task. Indexed. |
| `rename_from` | `string` | The entity's previous path, for renames. Set it with `change_type="rename"` and put the **new** path in `entity_path`. Selvedge then writes the dual-event pattern — a `rename` on the old path and a `create` on the new path with `metadata.renamed_from` set — so `blame` / `diff` / `prior_attempts` on the new path keep the history. A `rename_from` without `change_type="rename"` is rejected. Rename is a parameter, **not** a separate tool. |
| `revisit_after` | `string` | A revisit date for the decision — an ISO-8601 date (`2026-12-01`) **or** a relative offset from the event's timestamp (`90d`, `6mo`), normalized with the same grammar as `--since`. Consumed by `stale_decisions` / `selvedge stale`. New in v0.3.8. |
| `constraint` | `string` | **v0.3.9.1.** The testable principle behind the decision (`card data in our own DB = PCI scope`), kept as its own queryable field instead of buried in `reasoning`. |
| `stale_when` | `string` | **v0.3.9.1.** The evidence that would invalidate the decision (`payment provider changed`). `stale_decisions` keyword-matches it against later change events and flags `review_suggested` — surfacing only. |
| `supersedes` | `string` | **v0.3.9.1.** The id of the prior event this change overrides. Only valid with `change_type="supersede"`; leave empty to auto-link the entity's most recent remove/delete. The store stays append-only — the old verdict is never edited, just derived as superseded. |

`entity_path` is **canonicalized on write** (strip leading `./`, collapse `//`,
normalize separators to `/`, trim — case preserved on purpose) at a single storage
chokepoint shared by the MCP and CLI write paths, so `src/auth.py::login` and
`./src/auth.py::login` resolve to the same entity. `entity_path` is also shape-checked
per `entity_type` (e.g. a `function` path without `::`) — a soft warning in the
`warnings` array, never a rejection.

### Returns (`LogChangeResult`)

```json
{
  "id": "uuid",
  "timestamp": "2026-04-22T15:31:02Z",
  "status": "ok" | "error",
  "error": "",
  "warnings": ["reasoning too short", "..."]
}
```

Every key is always populated — empty string / empty list when not applicable. This
keeps the `outputSchema` clean and lets agents type-check without branching.

---

## `diff`

History for an entity or entity prefix.

### Parameters

| Name | Type | Description |
|---|---|---|
| `entity_path` | `string` (required) | Exact match (`users.email`) or prefix (`users` returns all `users.*`). |
| `limit` | `int` | Default 20. |

### Returns

```json
[
  { "id": "...", "timestamp": "...", "entity_path": "...", "change_type": "...",
    "diff": "...", "reasoning": "...", "agent": "...", "git_commit": "...",
    "project": "...", "changeset_id": "..." },
  ...
]
```

Newest-first (abbreviated — each event also carries `entity_type`, `session_id`).
`LIKE` queries properly escape `_`, `%`, and `\`.

---

## `blame`

Most recent change + context for an exact entity. The query everyone runs first.

### Parameters

| Name | Type | Description |
|---|---|---|
| `entity_path` | `string` (required) | Exact match only — no prefix expansion (use `diff` for that). |

### Returns (`BlameResult`)

```json
{
  "id": "...",
  "timestamp": "...",
  "entity_path": "...",
  "entity_type": "...",
  "change_type": "...",
  "diff": "...",
  "reasoning": "...",
  "agent": "...",
  "session_id": "...",
  "git_commit": "...",
  "project": "...",
  "changeset_id": "...",
  "metadata": {},
  "revisit_after": "",
  "expires_when": "",
  "error": ""
}
```

On miss (no history found), every field is empty and `error` carries the "no history
found" message. The protocol-level `isError` is `false` — empty history isn't a
protocol failure; the in-payload `error` key is the documented signal.

---

## `history`

Filtered history across all entities.

### Parameters

| Name | Type | Description |
|---|---|---|
| `since` | `string` | `15m` / `24h` / `7d` / `5mo` / `1y` / ISO 8601. Unparseable → error. |
| `entity_path` | `string` | Exact or prefix. |
| `project` | `string` | Exact match. |
| `changeset_id` | `string` | Exact match. |
| `limit` | `int` | Default 50. |

### Returns

Array of event objects, newest-first. Same shape as `diff` (abbreviated above —
each event also carries `entity_type`, `session_id`).

---

## `changeset`

All events grouped under a named feature/task slug.

### Parameters

| Name | Type | Description |
|---|---|---|
| `changeset_id` | `string` (required) | The slug. Returns events oldest-first to reconstruct chronology. |

### Returns

Array of event objects, oldest-first. Empty array if the changeset has no events
(returned with `error: "..."` per the same convention as `blame`).

---

## `search`

Full-text search across reasoning + diff + entity_path.

### Parameters

| Name | Type | Description |
|---|---|---|
| `query` | `string` (required) | Free-text query. Wildcards `_` and `%` are escaped — they match literally, not as SQL `LIKE` metacharacters. |
| `limit` | `int` | Default 20. |

### Returns

Array of event objects, newest-first. Match score is implicit (newest first within
matches); a future version may add `--score` ranking.

---

## `prior_attempts`

Prior change attempts on an entity, each with an inferred outcome. **Call this before
editing an entity** — if the same change was tried before and reverted, you get the
prior reasoning and *why it was rejected*, so you can change your plan instead of
repeating it. New in v0.3.7; this is Selvedge's wedge.

### Parameters

| Name | Type | Description |
|---|---|---|
| `entity_path` | `string` | The entity you're about to change. Exact + prefix match (`users` also covers `users.email`). Provide this **or** `description`. |
| `description` | `string` | Free-text description, when you don't have an exact path. Matched as a substring against prior reasoning / diffs / paths. `entity_path` wins if both are given. |
| `fuzzy` | `string` | **v0.3.9.1.** Semantic query — also returns attempts on entities whose prior reasoning is *similar* to this text, catching renames (`card_token` → `payment_token`) that exact/substring lookups miss. Rows are labeled `match_type="fuzzy"` with a similarity score. Needs the `selvedge[semantic]` extra and a `selvedge index` run; otherwise falls back to substring with a leading note row. |
| `min_confidence` | `string` | `proximity_high` (default) returns only the clear "tried then reverted" cases; `proximity_low` widens to the noisy tail (still-active changes, far-apart reverts). |
| `window_minutes` | `int` | Proximity window for the add→remove revert heuristic. Within it ⇒ `proximity_high`, beyond ⇒ `proximity_low`. Default `10080` (7 days). |
| `limit` | `int` | Default 20. |

### Returns

Array of event objects (newest-first), each with the trail fields:

```json
[
  { "...event fields...": "...",
    "outcome": "reverted" | "reopened" | "active",
    "confidence": "proximity_high" | "proximity_low",
    "outcome_reasoning": "why it was reverted, or \"\" while still active",
    "superseded_by": "id of the supersede that re-opened it, or \"\"",
    "supersede_reasoning": "why it was re-opened, or \"\"",
    "current_status": "active" | "reverted" | "reopened",
    "match_type": "exact" | "substring" | "fuzzy",
    "similarity": 0.0 }
]
```

Outcome is inferred from **add→remove proximity**, upgraded by explicit `revert` events
and `supersede` links (v0.3.9.1) — the trail reads tried → reverted → re-opened. The
output is templated and deterministic — **no LLM call in core** — and the tool is
**pull-only**: it never writes and never pushes; you decide when to ask.

**Conservative by design.** `min_confidence` defaults to `proximity_high`, so an empty
list — nothing clearly tried-and-rejected — is the normal, preferred answer over a
speculative false positive. You get one shot at the agent's trust budget.

---

## `stale_decisions`

Dated decisions that have come due for a revisit — but only the ones whose entity is
**still in active use**. A decision logged with a `revisit_after` surfaces here once that
date has passed *and* the entity is still live, so an old-but-correct decision nobody
touches never nags. New in v0.3.8; the date-based half of active memory.

### Parameters

| Name | Type | Description |
|---|---|---|
| `entity_path` | `string` | Filter to one entity (exact + prefix match). Omit to scan all dated decisions. |
| `project` | `string` | Exact match. |
| `agent` | `string` | Exact match. |
| `limit` | `int` | Default 20. Results are ordered most-overdue-first. |

### Returns

Array of event objects (most-overdue-first), each with four extra fields:

```json
[
  { "...event fields...": "...",
    "revisit_due": "2026-...Z",
    "days_overdue": 12,
    "active_use_signals": ["queried"],
    "stale_reason": "past its revisit date and still active — the entity was queried (blame/diff/prior_attempts) after the decision." }
]
```

**Active-use weighting — pure age never surfaces.** A decision only comes back if its
entity is still live: it was queried (`blame` / `diff` / `prior_attempts`) at or after the
decision was logged, or its `changeset_id` saw later sibling activity. `active_use_signals`
lists which signals fired. A dated decision nobody has touched is filtered out — that's the
noise defense against old-but-correct decisions. The output is templated and deterministic —
**no LLM call** — and the tool is **read-only**.

---

## Tool annotations

Every tool advertises:

```text
log_change   readOnly=false  destructive=false  idempotent=false  openWorld=false
diff         readOnly=true   destructive=false  idempotent=true   openWorld=false
blame        readOnly=true   destructive=false  idempotent=true   openWorld=false
history      readOnly=true   destructive=false  idempotent=true   openWorld=false
changeset    readOnly=true   destructive=false  idempotent=true   openWorld=false
search       readOnly=true   destructive=false  idempotent=true   openWorld=false
prior_attempts readOnly=true destructive=false  idempotent=true   openWorld=false
stale_decisions readOnly=true destructive=false idempotent=true   openWorld=false
```

`log_change` is **append-only** — `destructive: false` even though it writes — but
**not idempotent**, since each call mints a new event with a fresh UUID and timestamp.

---

## Per-parameter descriptions

Each parameter on every tool ships with a description in `inputSchema.properties`,
populated via `Annotated[T, Field(description=...)]` on the function signature. Agents
picking which tool to call read these directly at tool-call time, so they're a DX
surface, not just directory metadata.

This was a major v0.3.3 fix — earlier versions left the rich descriptions in the
function body where agents couldn't see them. Coverage is 100% — every parameter on all
eight tools.

## Where to read more

- [**Entity paths →**](/reference/entity-paths/) — what counts as an entity, how prefix
  matching works.
- [**CLI reference →**](/reference/cli/) — the same data, queried from the command
  line.
- [**Comparison →**](/compare/agent-tools/) — Selvedge's MCP-tools approach vs. the
  git-hook + LLM-inference approach.
