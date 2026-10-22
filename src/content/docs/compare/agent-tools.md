---
title: AI code attribution and decision memory compared
description: Choose between line attribution, prompt context and recorded decision history. Compare the questions each answers and verify what survives a new agent session.
lastUpdated: 2026-10-22
---

AI code attribution and decision memory answer related questions. Attribution helps
trace a line or commit to its contributors. Decision history preserves a stated
reason, a rejected approach, or a condition for revisiting a choice. Prompt context
can help explain either, but a record still needs to be checked against the code
and supporting evidence.

We maintain Selvedge. This guide explains how to choose and evaluate these workflows;
it is not a reliability benchmark or a claim that another tool lacks a feature.
For a source-based comparison of code indexes, session stores and decision memory,
see [codebase memory MCP servers, compared](/compare/codebase-memory-mcp-servers/).

## The comparison table

| Question | Evidence to look for | Where to start |
|---|---|---|
| Who or what contributed this line? | Attribution linked to the actual line and commit | [Git AI comparison](/compare/selvedge-vs-git-ai/) and [git blame comparison](/compare/git-blame/) |
| What context accompanied the change? | The saved prompt or session, with its source and capture limits | Inspect your attribution tool's current capture and retrieval documentation |
| Why did we reject an approach? | An explicit decision, stated reason and recorded outcome | [Selvedge prior attempts](/prior-attempts/) |
| Which changes belong to one feature? | A stable identifier joining the relevant records | [Selvedge changesets](/concepts/changeset/) |
| How do we exchange records? | A documented format and a check of fields preserved by the recipient | [Agent Trace interchange](/compare/agent-trace/) |

Git AI, for example, documents both `git ai blame` and `git ai stats --json` in its
[README snapshot](https://github.com/git-ai-project/git-ai/blob/8a6184a3a8fc4e997ccfff3b16d79688e4255af4/README.md),
reviewed October 22, 2026. Selvedge also provides queries, but its inputs are the
entity decisions that an agent or person explicitly saved. Having a query CLI is
not, by itself, a distinction between the tools.

## Why "captured live" matters

Recording an explanation during the work preserves the account available in that
session. Inferring an explanation later from a diff produces a different kind of
evidence. Keep the source and timing clear; neither method proves the explanation
is accurate.

Selvedge stores **stated reasoning**, not a direct observation of an agent's internal
intent. A missing explanation is a gap in the record. It does not establish that
there was no reason for the change. See [recorded versus inferred reasoning](/concepts/captured-live-vs-inferred/).

## Why "entity-level" matters

Use an entity when the question concerns a project concept rather than a line
number: a function such as `src/auth.py::login`, a column such as `users.email`, or
a dependency such as `deps/stripe`. The [entity path reference](/reference/entity-paths/)
shows the supported forms and matching rules.

An entity query returns recorded history for that key. It is not a code index that
automatically discovers every reference or every previous name. Use code navigation
and Git history alongside the decision record.

## Why "changesets" matter

A billing feature can touch a table, environment variables, routes and functions.
Recording those events under `changeset:add-stripe-billing` lets you retrieve their
shared context later. The grouping covers the events that were recorded with that
tag; it does not prove that every change in the feature was captured.

## Why "prior attempts" matters

Before repeating an approach, query the relevant entity for recorded rejections,
reversions and their reasons. Selvedge's `prior_attempts` returns matching evidence
from the store; the [tool reference](/reference/mcp-tools/) describes its filters
and confidence labels.

**An empty result means no matching recorded evidence was found.** It is not a
safety check, proof that the approach was never tried, or permission to ignore code,
tests, issues and review. Check that you used the right project database and entity
before treating the result as useful.

The [rejection-and-revisit walkthrough](/guides/revisit-a-rejected-approach/) shows
how to record a constraint, retrieve it, and revise the decision when the constraint
changes. The examples illustrate the workflow; they are not customer outcomes.

## Verify the workflow before relying on it

1. Save one real decision with its entity, stated reason and outcome.
2. Start a fresh session in the same project and ask for that entity's prior history.
3. Compare the retrieved record with the saved decision and its supporting evidence.
4. Change a constraint and check how the decision is revised or superseded.
5. Check which records would be visible to collaborators or sent to your model provider.

Use [first-decision verification](/guides/verify-first-decision/) for the complete
Selvedge procedure. `selvedge stats` reports observed tool calls and reasoning-quality
signals; it cannot count edits or decisions that were never recorded. A successful
check verifies this example and configuration, not reliable capture of all future work.

## Next

- [Compare codebase memory servers →](/compare/codebase-memory-mcp-servers/)
- [Compare instructions and ADRs →](/compare/instructions-and-adrs/)
- [Connect a compatible agent →](/start/quickstart/)
- [Review storage and sharing →](/privacy/)
