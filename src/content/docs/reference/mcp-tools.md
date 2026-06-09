---
title: MCP tools
description: The seven tools Selvedge exposes over MCP, their parameters, and what they return. This is what your AI agent actually calls.
---

`selvedge-server` exposes seven MCP tools. Six are read-only and idempotent; one
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

None are `openWorldHint: true`. None touch the network.

---

## `log_change`

Record a change event. The only writer.

### Parameters

| Name | Type | Description |
|---|---|---|
| `entity_path` | `string` (required) | The thing that changed: `users.email`, `src/auth.py::login`, `env/STRIPE_SECRET_KEY`, `deps/stripe`. See [entity paths](/reference/entity-paths/). |
| `entity_type` | `string` | `column` / `table` / `file` / `function` / `class` / `endpoint` / `dependency` / `env_var` / `index` / `schema` / `config` / `other`. Coerced to `"other"` if unrecognized. |
| `change_type` | `string` (required) | `add` / `remove` / `modify` / `rename` / `retype` / `create` / `delete` / `index_add` / `index_remove` / `migrate`. Validated against the enum — typos are rejected. |
| `diff` | `string` | The diff text. Optional but recommended. |
| `reasoning` | `string` | **The why.** Captured from the agent's own context. Run through the quality validator — empty / too-short / generic-placeholder values produce `warnings` (advisory). |
| `agent` | `string` | The calling agent name (`claude-code`, `cursor`, `copilot`, etc.). |
| `session_id` | `string` | Optional session correlation ID. |
| `git_commit` | `string` | Commit hash. Usually unset at log time and backfilled by the post-commit hook. |
| `project` | `string` | Project name. Defaults to the project root's basename. |
| `changeset_id` | `string` | A slug grouping related changes under one feature/task. Indexed. |
| `rename_from` | `string` | The entity's previous path, for renames. Set it with `change_type="rename"` and put the **new** path in `entity_path`. Selvedge then writes the dual-event pattern — a `rename` on the old path and a `create` on the new path with `metadata.renamed_from` set — so `blame` / `diff` / `prior_attempts` on the new path keep the history. A `rename_from` without `change_type="rename"` is rejected. Rename is a parameter, **not** a separate tool. |

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
| `entity` | `string` (required) | Exact match (`users.email`) or prefix (`users` returns all `users.*`). |
| `limit` | `int` | Default 50. |

### Returns

```json
[
  { "id": "...", "timestamp": "...", "entity_path": "...", "change_type": "...",
    "diff": "...", "reasoning": "...", "agent": "...", "git_commit": "...",
    "project": "...", "changeset_id": "..." },
  ...
]
```

Newest-first. `LIKE` queries properly escape `_`, `%`, and `\`.

---

## `blame`

Most recent change + context for an exact entity. The query everyone runs first.

### Parameters

| Name | Type | Description |
|---|---|---|
| `entity` | `string` (required) | Exact match only — no prefix expansion (use `diff` for that). |

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
| `entity` | `string` | Exact or prefix. |
| `project` | `string` | Exact match. |
| `changeset_id` | `string` | Exact match. |
| `agent` | `string` | Exact match. |
| `limit` | `int` | Default 100. |

### Returns

Array of event objects, newest-first. Same shape as `diff`.

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
| `limit` | `int` | Default 50. |

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
| `min_confidence` | `string` | `proximity_high` (default) returns only the clear "tried then reverted" cases; `proximity_low` widens to the noisy tail (still-active changes, far-apart reverts). |
| `window_minutes` | `int` | Proximity window for the add→remove revert heuristic. Within it ⇒ `proximity_high`, beyond ⇒ `proximity_low`. Default `10080` (7 days). |
| `limit` | `int` | Default 20. |

### Returns

Array of event objects (newest-first), each with three extra fields:

```json
[
  { "...event fields...": "...",
    "outcome": "reverted" | "active",
    "confidence": "proximity_high" | "proximity_low",
    "outcome_reasoning": "why it was reverted, or \"\" while still active" }
]
```

Outcome is inferred from **add→remove proximity** — v0.3.7 has no explicit
`reject` / `revert` change types yet (those arrive in v0.3.11). The output is templated
and deterministic — **no LLM call** — and the tool is **pull-only**: it never writes and
never pushes; you decide when to ask.

**Conservative by design.** `min_confidence` defaults to `proximity_high`, so an empty
list — nothing clearly tried-and-rejected — is the normal, preferred answer over a
speculative false positive. You get one shot at the agent's trust budget.

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
seven tools.

## Where to read more

- [**Entity paths →**](/reference/entity-paths/) — what counts as an entity, how prefix
  matching works.
- [**CLI reference →**](/reference/cli/) — the same data, queried from the command
  line.
- [**Comparison →**](/compare/agent-tools/) — Selvedge's MCP-tools approach vs. the
  git-hook + LLM-inference approach.
