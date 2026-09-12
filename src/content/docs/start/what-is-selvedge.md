---
title: What is Selvedge?
description: Local decision history for AI coding agents. Save the reasons, rejected approaches and conditions for revisiting them across sessions.
---

Selvedge keeps project decisions and rejected approaches in a local SQLite file
under `.selvedge/`, next to your code. Your next coding session can look up what
you decided, why, and what would make it worth revisiting.

Connect it to Claude Code, Codex, Copilot, Cursor, Gemini CLI or Windsurf through
MCP, the protocol agents use to call tools. Selvedge records what you or your
agent explicitly save; the installed instructions help the agent know when to
use it. [Choose your agent and set it up](/#choose-your-agent).

## The problem it solves

A new coding session can see the code without knowing why it ended up that way.
The workaround you kept or the approach you rejected may only be explained in an
older conversation. Selvedge gives those decisions a place in the project, so
you and your agents can retrieve them when the same question comes up again.

## What Selvedge captures

Each event records:

- **What** changed — entity path, change type, diff
- **When** — UTC timestamp
- **Who** — agent name, session ID
- **Why** — reasoning, captured from the agent's context in the moment
- **Where** — git commit, project root

## What "entity" means here

Most attribution tools work at the line level. Selvedge attributes *things you actually
search for*:

```text
users.email           DB column (table.column)
users                 DB table
src/auth.py::login    Function in a file (path::symbol)
src/auth.py           File
api/v1/users          API route
deps/stripe           Dependency
env/STRIPE_SECRET_KEY Environment variable
```

The first question after `git blame` is usually *"what's the history of this column?"*,
not *"what's the history of lines 40–48 of users.py?"* — so Selvedge meets you there.

Prefix queries work everywhere. Searching `users` returns `users`, `users.email`,
`users.created_at`, and any other entity under the `users.` namespace.

## What "changeset" means here

A Stripe billing rollout touches the `users` table, two new env vars, three new API
routes, one dependency, and four functions across the codebase. Tag every event with
`changeset:add-stripe-billing` and you can pull the entire scope back later — even if
the original PR was broken into eight smaller ones over a month.

## Where it deliberately doesn't go

Selvedge is **not**:

- A replacement for `git` — line-level what/when stays git's job.
- A code review tool — review-time quality is a different problem.
- An LLM observability platform — call traces, token costs, model hops are tools like
  LangSmith and Helicone.
- A code-host AI assistant — GitHub Copilot's PR summaries answer a different question.

It's the layer that records *why* — the thing those tools can point at but don't
capture themselves.

## How that's different from "ask an LLM about the diff"

The category that's emerging around this — sometimes called "git blame for AI agents" —
mostly works by feeding the diff back to a second LLM after the fact and asking it to
reconstruct intent. That's better than nothing, but it's a guess. The agent that made
the change knew exactly why; by the time you ask a fresh LLM to explain the diff, that
context is gone.

Selvedge takes the other approach: it gives the *original* agent a way to record its
intent **as it works**. The reasoning is the agent's own — written from the same context
window that produced the change. No inference, no hallucinated explanations. And an
empty `reasoning` field is itself a useful signal: the agent didn't have one.

## Next

[**Quickstart →**](/start/quickstart/) Three commands.
[**How it works →**](/start/how-it-works/) The MCP plumbing in plain prose.
[**Comparison table →**](/compare/agent-tools/) Selvedge vs. AgentDiff, Origin, Git AI, BlamePrompt.
