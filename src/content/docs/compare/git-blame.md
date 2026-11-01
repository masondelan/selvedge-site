---
title: Selvedge vs. git blame
description: Selvedge isn't a replacement for git blame — they answer different questions. This page is about where each one is the right tool.
lastUpdated: 2026-11-01
---

`git blame` is a great tool. Selvedge does not replace it. They answer different
questions, and on a healthy AI-coded codebase you want both.

## What `git blame` answers

- **Which line changed and when?**
- **Which author last changed this line?**
- **Which commit should I inspect for the patch and message?**

Git blame annotates lines with revision and author information. The linked commit
may contain a useful explanation; inspect it with `git show <commit>`.

## What Selvedge answers

- **Which entity (column, function, dep, env var, route) changed and when?**
- **What explanation was recorded for the change?** — the reason supplied by an
  agent or person, ideally while the original context is available.
- **Was that change part of a larger feature?** — via `changeset_id`.
- **What tool calls and reasoning-quality signals were observed?** — via
  `selvedge stats`. Its logging ratio is a share of recorded tool calls, not the
  share of all repository edits captured.

Selvedge queries recorded entity paths and relationships. Git blame traces lines
through Git history. Neither a commit message nor a recorded explanation proves
that the decision was correct.

## Why following the symbol matters for AI code

Functions move, columns get renamed, and files split. Git blame automatically
follows whole-file renames. Its `-w` option ignores whitespace changes; `-M` and
`-C` can detect moved or copied lines. These options have detection rules and
thresholds, so inspect the result for your change. See the
[official Git blame documentation](https://git-scm.com/docs/git-blame).

Selvedge provides a separate record keyed to a project entity, such as
`users.subscription_tier`. To preserve a rename relationship, call `log_change`
with the new path as `entity_path`, `change_type="rename"`, and the previous path
in `rename_from`. This records a `rename` event on the old path and a `create`
event on the new path with `metadata.renamed_from`. Renaming code alone does not
create these records. See [entity paths and renames](/reference/entity-paths/).

## When to reach for which

| Question | Tool |
|---|---|
| "What's on this line as of HEAD?" | `git blame` |
| "When did this line first appear?" | `git log -L`, `git blame -p` |
| "What reason was recorded for this column?" | `selvedge blame` |
| "What changed in the users table over the last quarter?" | `selvedge diff users --since 90d` |
| "Show me everything tied to the Stripe rollout" | `selvedge changeset add-stripe-billing` |
| "Did this change pass code review?" | GitHub PR / your review tool |
| "Is the agent actually logging changes, or just querying?" | `selvedge stats` |

An event can include a `git_commit` link. It may be supplied when recording the
event or backfilled by the optional post-commit hook within its configured time
window. Some events have no commit attached. When a link exists, use
`git show <commit>` to inspect the patch. See the
[hook and backfill reference](/reference/cli/#selvedge-install-hook---path-path---window-min).

## Why not just write better commit messages?

Good commit messages can preserve reasons and may be sufficient for your workflow.
Consider a separate decision record when you need:

1. **Entity queries.** A commit may change several columns, functions, or routes.
   Separate records let you retrieve the supplied explanation for each entity.
2. **Rejected alternatives.** An approach considered but never implemented can be
   recorded as a `reject` event without needing a code diff.
3. **Later evidence.** `selvedge log` appends a new event to the entity's history.
   Label a retrospective explanation as such; it does not establish what the
   original author thought at the time.

Try both on a real question: inspect the commit and retrieve any recorded entity
history. Evaluate whether the extra record provides useful, supported context.

## Next

- [**Attribution and decision memory →**](/compare/agent-tools/) — compare the
questions each record can answer and its evidence limits.
- [**Agent Trace interop →**](/compare/agent-trace/) — emitting Selvedge events in the
Agent Trace v0.1.0 record format.
