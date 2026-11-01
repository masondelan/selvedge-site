---
title: Entity paths for code and decision history
description: What counts as an entity, the canonical path conventions, and how prefix matching works across diff, history, and search.
lastUpdated: 2026-11-01
---

Most attribution tools work at the line level. Selvedge attributes things you actually
search for. This page is the canonical reference for what an entity path looks like.

## Conventions

```text
users.email           DB column           — table.column
users                 DB table            — bare table name
src/auth.py::login    Function in a file  — path::symbol
src/auth.py           File                — repo-relative path
src/auth.py::Auth     Class               — same syntax as functions
api/v1/users          API route           — slash-delimited
deps/stripe           Dependency          — deps/<package>
env/STRIPE_SECRET_KEY Environment var     — env/<NAME>
config/redis.conf     Config file         — config/<path>
schema/foo.proto      Schema file         — schema/<path>
```

You can extend the namespace freely. Agents are free to use whatever path makes the
entity searchable; Selvedge only enforces uniqueness, not syntax.

`entity_type` is descriptive metadata — `column` / `table` / `file` / `function` /
`class` / `endpoint` / `dependency` / `env_var` / `index` / `schema` / `config` /
`other`. Unknown values coerce to `"other"`. Queries don't filter on `entity_type`
unless you ask them to.

## Prefix matching

Searching `users` returns `users`, `users.email`, `users.created_at`, and any other
entity under the `users.` namespace.

The prefix is a literal string, **not** a regex or glob. `users` matches `users` (exact)
and anything starting with `users` followed by `.`, `/`, or `::` — so `usersettings`
won't accidentally match.

Wildcards in the underlying SQL `LIKE` queries (`_`, `%`, `\`) are properly escaped
since v0.3.0. So `selvedge search "stripe_customer_id"` matches the literal underscore,
not "any character" — same for `%` in column names like `usage_pct`.

## Worked examples

```bash
# All changes to a column
selvedge diff users.email

# All changes touching anything under the users table
selvedge diff users

# Last change to a specific column with full reasoning
selvedge blame payments.amount

# All changes to a function
selvedge diff "src/billing.py::charge_card"

# All env-var changes in the last 30 days
selvedge history --entity env --since 30d

# Every change in a feature rollout
selvedge changeset add-stripe-billing
```

The `selvedge log` CLI uses `click.Choice` for `change_type` so typos are caught at
argument parsing. There's no entity_type validation at parse time — it's coerced — but
typos in `change_type` (`"modifyed"`, `"banana"`) are rejected with a clear error.

## Empty paths

`entity_path=""` is rejected by `log_change` and `selvedge log` since v0.3.0. Empty
paths used to insert orphan rows that broke prefix queries. Now they fail loudly.

## Renames emit two events

Renaming code alone does not update Selvedge's entity paths. To record a rename
from `users.tier` to `users.subscription_tier`, call `log_change` with the new path
as `entity_path`, `change_type="rename"`, and `rename_from="users.tier"`.
The [MCP tool reference](/reference/mcp-tools/#log_change) documents these fields.
This writes:

- A `rename` event on `users.tier`
- A `create` event on `users.subscription_tier` with `metadata.renamed_from`
  linking it to the old path

So `selvedge blame` works under both names — the new one points at the create, the old
one points at the rename. Same pattern for SQL `RENAME COLUMN` and Alembic
`op.rename_table`. This is what makes `selvedge import` against a long Alembic history
actually produce a useful trail.

## Why this is at the entity level, not the line level

An entity path lets you ask *"what's the recorded history of this column?"* without
knowing its current line number. Lines and symbols can move, so keep paths
consistent and record rename relationships explicitly. Selvedge queries those
records; it does not automatically discover every symbol move in your code.

Selvedge isn't trying to replace `git blame`; the two answer different questions. The
diff stays git's job. The why-and-where-of-the-thing stays Selvedge's.
