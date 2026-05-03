---
title: Selvedge vs. git blame
description: Selvedge isn't a replacement for git blame — they answer different questions. This page is about where each one is the right tool.
---

`git blame` is a great tool. Selvedge does not replace it. They answer different
questions, and on a healthy AI-coded codebase you want both.

## What `git blame` answers

- **Which line changed and when?**
- **Who (committer) introduced this line?**
- **What commit message was attached to that change?**

That's it. Git blame is a 1:1 line-to-commit map, and the commit message is whatever
the committer (or their agent's auto-generated commit) wrote.

## What Selvedge answers

- **Which entity (column, function, dep, env var, route) changed and when?**
- **Why did the agent change it?** — captured live, from the same context window that
  produced the change.
- **Was that change part of a larger feature?** — via `changeset_id`.
- **Is this kind of change well-covered, or is the agent silently skipping logging
  here?** — via `selvedge stats`.

Selvedge follows the *symbol*. Git follows the *line*.

## Why following the symbol matters for AI code

AI agents move things around. Functions get renamed. Columns get migrated. Files get
split. Lines move. The diff is correct at every step, but `git blame` after a rename
points at the rename commit, not the change-of-substance commit. You have to manually
walk back through history with `--follow` and pray.

Selvedge models renames as a `rename` event on the old name and a `create` event on the
new name, tied together implicitly through proximity in the changeset. So `selvedge
blame users.subscription_tier` shows you the create — and `selvedge blame users.tier`
shows you the rename, with the reasoning that says *why* it was renamed. Both queries
land on useful answers, no `--follow` archaeology required.

## When to reach for which

| Question | Tool |
|---|---|
| "What's on this line as of HEAD?" | `git blame` |
| "When did this line first appear?" | `git log -L`, `git blame -p` |
| "Why does this column exist?" | `selvedge blame` |
| "What changed in the users table over the last quarter?" | `selvedge diff users --since 90d` |
| "Show me everything tied to the Stripe rollout" | `selvedge changeset add-stripe-billing` |
| "Did this change pass code review?" | GitHub PR / your review tool |
| "Is the agent actually logging changes, or just querying?" | `selvedge stats` |

The two read each other's data, too: `git_commit` is captured on every Selvedge event
(via the post-commit hook), so once you find an interesting Selvedge event you can
`git show <commit>` to see the full diff in context. The integration is one-way and
non-invasive — Selvedge doesn't touch your git history.

## Why not just write better commit messages?

Three problems with that:

1. **Agents don't write good commit messages.** They write generic ones that summarize
   the diff. The whole point of Selvedge is that "summarize the diff" loses the *why*.
2. **One commit, multiple changes.** A typical agent PR touches a column, an env var,
   three functions, and an API route. The commit message can carry one paragraph of
   prose; Selvedge captures the reasoning *per entity* so each one is queryable.
3. **Commit messages are immutable, but reasoning often improves.** `selvedge log`
   lets you append annotations to existing entities post-hoc — useful when you discover
   a context six months later that explains an old change.

`git blame` and `selvedge blame` are complementary. If your tooling only knows about
the line, you're missing half the picture on AI-coded codebases. If it only knows about
the symbol, you're missing the textual diff. Use both.

## Next

[**Selvedge vs. AgentDiff & friends →**](/compare/agent-tools/) — the LLM-inference
category, where Selvedge differs sharply.
[**Agent Trace interop →**](/compare/agent-trace/) — emitting Selvedge events as the
emerging open standard.
