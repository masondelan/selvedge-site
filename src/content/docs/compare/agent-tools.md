---
title: Selvedge vs. AgentDiff & friends
description: A fast-growing "git blame for AI agents" category is emerging. Here's where Selvedge fits — and where it deliberately doesn't.
---

A fast-growing category is emerging around "git blame for AI agents." Here's where
Selvedge fits — and where it deliberately doesn't.

## The comparison table

|  | Reasoning source | Granularity | Mechanism | Grouping | Storage |
|---|---|---|---|---|---|
| **Selvedge** | **Captured live**, by the agent in the same context that produced the change | **Entity** — DB column, table, env var, dep, API route, function | **MCP server** — agent calls it as work happens | **Changesets** — named feature/task slugs across many entities | SQLite, zero deps |
| AgentDiff | **Inferred post-hoc** by Claude Haiku from the diff at session end | Line | Git pre/post-commit hook | None | JSONL on disk |
| Origin | Captured at commit time | Line | Git hook | None | Local |
| Git AI | Attribution metadata | Line | Git hook + Agent Trace alliance | None | Git notes |
| BlamePrompt | Prompt-only | Line | Git hook | None | Local |

## Why "captured live" matters

AgentDiff and Origin generate reasoning *after* the change is made, by feeding the diff
back to a second LLM call. That second call is making a guess: it sees the diff but
not the prompt that produced the diff, not the conversation history, not the
constraints the agent was working under.

Selvedge's reasoning is the agent's **own intent**, written from the same context
window that produced the change. There's no inference step — and crucially, an empty
`reasoning` field is itself a useful signal: the agent didn't have one.

This isn't a hypothetical concern. The post-hoc-inference approach has a built-in
failure mode: when the diff has multiple plausible explanations, the second LLM picks
one. Sometimes wrongly. Sometimes confidently wrongly. By the time someone six months
later reads "this column was added to support multi-tenancy," they have no way to know
that it was actually added for a billing migration that touched a tangentially-related
table — and the LLM that wrote the explanation never saw the billing context.

## Why "entity-level" matters

Most tools attribute lines. Selvedge attributes things you actually search for:
`users.email`, `env/STRIPE_SECRET_KEY`, `api/v1/checkout`, `deps/stripe`.

The first question after `git blame` is usually *"what's the history of this
column?"*, not *"what's the history of lines 40–48 of users.py?"* Lines move.
Symbols persist (until they're renamed, in which case Selvedge models the rename
explicitly). Tooling that only thinks in lines makes you do the symbol-tracking by
hand.

## Why "changesets" matter

A Stripe billing rollout touches:

- The `users` table (add `stripe_customer_id` column)
- Two new env vars (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`)
- Three new API routes (`/api/v1/billing/*`)
- One new dependency (`deps/stripe`)
- Four functions across four files

Tag every event with `changeset:add-stripe-billing` and you can pull the entire scope
back later — even if the original PR was broken into eight smaller ones over a month.
Line-level tools have no way to express "these unrelated-looking changes are part of
the same feature."

## What Selvedge isn't trying to be

Selvedge **is not**:

- **A replacement for AgentDiff if you already have it.** AgentDiff's post-hoc
  inference is fine for codebases where you can't change the agent's tooling. If you
  *can* — if you control the system prompt — Selvedge captures the same thing better.
- **A code review tool.** Review-time quality is a different problem; tools like
  CodeRabbit, Greptile, and humans are better at that.
- **An LLM observability platform.** Call traces, token costs, model versions — those
  are LangSmith, Helicone, etc.
- **A code-host AI assistant.** GitHub Copilot's PR summaries answer a different
  question than `selvedge blame`.

Selvedge is the **provenance-as-first-class-citizen layer** that those tools can
reference.

## What Selvedge is uniquely better at

- **Knowing the agent's actual reason.** Live capture, no second-LLM guess.
- **Surviving an agent session ending.** The reasoning is in your SQLite file, not in a
  conversation that's been GC'd.
- **Cross-file feature scope.** Changesets group changes that touch unrelated-looking
  files.
- **Empty-state diagnosis.** `selvedge stats` tells you which agents are silently
  skipping `log_change`. No other tool in the category surfaces this — but it's the
  most actionable signal you have for "is the system working".

## Where the category is going

[Agent Trace](https://github.com/cursor/agent-trace) (Cursor + Cognition AI, RFC Jan
2026, backed by Cloudflare, Vercel, Google Jules, Amp, OpenCode, and git-ai) is an
emerging open standard for AI code attribution traces. Selvedge **is not a competitor
to it** — it's a compatible producer. The design for `selvedge export --format
agent-trace` is at the [Agent Trace interop page](/compare/agent-trace/).

Agent Trace is the wire format. Selvedge is the live capture + query layer that emits
it.

## Next

[**Agent Trace interop →**](/compare/agent-trace/)
[**git blame vs. selvedge blame →**](/compare/git-blame/)
