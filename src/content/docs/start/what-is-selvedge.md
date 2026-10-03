---
title: What is Selvedge?
description: Local decision history for AI coding agents. Save the reasons, rejected approaches and conditions for revisiting them across sessions.
---

Selvedge is a local MCP server and CLI that gives compatible AI agents persistent
decision memory. It saves project decisions and rejected approaches in a SQLite
file under `.selvedge/`, next to your code. Your next coding session can look up what
you decided, why, and what would make it worth revisiting.

Selvedge is for anyone using a compatible agent, regardless of brand or model
provider. Connect through local stdio MCP, the protocol agents use to call
tools, or through the CLI if your agent has shell access. Selvedge records what
you or your agent explicitly save; project instructions help the agent know
when to use it. [Connect your agent](/start/quickstart/#connect-your-agent).

## The problem it solves

A new coding session can see the code without knowing why it ended up that way.
The workaround you kept or the approach you rejected may only be explained in an
older conversation. Selvedge gives those decisions a place in the project, so
you and your agents can retrieve them when the same question comes up again.

## Find the right workflow

- [Carry decision memory between sessions](/agent-memory/) when a new agent needs the reason behind an earlier choice.
- [Stop repeating rejected approaches](/prior-attempts/) with a project rule and a worked example.
- [Compare codebase memory MCP servers](/compare/codebase-memory-mcp-servers/) when choosing between code navigation, session context, and decision history.

## What Selvedge captures

An event associates a change with an entity and timestamp. You or your agent can also record:

- **What** changed — entity path, change type, diff
- **When** — UTC timestamp
- **Who** — agent name, session ID
- **Why** — reasoning, captured from the agent's context in the moment
- **Where** — git commit, project root

## What "entity" means here

Selvedge associates history with a named part of your project:

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

Use `blame` for an exact entity. Prefix-capable queries such as `diff` and filtered
`history` can retrieve a broader area, including a table and its columns.
The [MCP tool reference](/reference/mcp-tools/) lists each query’s matching rules.

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

Use it alongside those tools when you need queryable reasons and outcomes tied to
specific parts of your project.

## How that's different from "ask an LLM about the diff"

A diff shows what changed. It does not necessarily contain the reason, the
alternatives you ruled out, or the constraint you were working around. A fresh
agent can infer an explanation, but that inference may differ from the original
decision.

Selvedge gives you and your agent a way to save that explanation while the context
is available, then retrieve the recorded account later. It stores stated
reasoning; it cannot prove that the explanation is accurate or that every decision
was captured. [Verify a real decision across two sessions](/guides/verify-first-decision/)
before relying on it in your workflow.

## Next

- [**Quickstart →**](/start/quickstart/) Install, connect your agent, and verify a decision.
- [**How it works →**](/start/how-it-works/) The MCP plumbing in plain prose.
- [**Comparison table →**](/compare/agent-tools/) Selvedge vs. AgentDiff, Origin, Git AI, BlamePrompt.
