---
title: Instruction files and ADRs alongside Selvedge
description: When maintained files are enough, and when queryable decision history by entity is useful.
structuredData:
  type: techarticle
---

Instruction files, Architecture Decision Records (ADRs), and Selvedge can preserve different parts of a project's reasoning. Start with the records your team can maintain and retrieve reliably.

An instruction file such as `AGENTS.md`, `CLAUDE.md`, or an editor's rules holds standing guidance. An ADR can explain a decision, rejected alternatives, consequences, and later changes to its status. Selvedge adds structured events that can be queried by the affected entity, with explicit outcomes and links between decisions.

## When maintained files are enough

Use an instruction file for rules the agent should consult while working: style, stack choices, test commands, and review conventions. Use ADRs when a human-readable explanation and reviewable history fit the decision. An indexed collection of ADRs can preserve both current and superseded decisions, including rejected alternatives.

Files may be enough if the team can find the relevant decision before editing and keep its status current. The number of files alone does not determine whether the workflow works. Check whether important reasons are actually recorded and retrieved.

Selvedge's setup also writes agent instructions. Those instructions tell an agent when to use its tools; they remain useful alongside a decision store.

## What entity history adds

Selvedge records an event against an entity such as `src/cache.py::load_profile`, `users.auth_token`, or `deps/redis`. The event can include an explanation, constraint, outcome, and review condition.

| Record | Useful for | Work it requires |
|---|---|---|
| Instruction file | Standing project guidance | Keep rules current and ensure the client reads them |
| ADR | Reviewed rationale, alternatives, consequences, and decision status | Maintain an index and links to revisions or superseding decisions |
| Selvedge event | Querying recorded attempts and outcomes by entity | Log useful reasons, use consistent entity paths, and retrieve relevant history |

Selvedge's `log_change` MCP tool records a `reject` when an approach was declined or a `revert` when an implemented approach was rolled back. Selvedge's `prior_attempts` retrieves recorded outcomes for an entity. An explicit `supersede` can reopen a decision while preserving its earlier explanation.

Review dates and supported expiry or stale-condition checks can surface a record for review. They do not automatically decide that an approach is safe or change its verdict. The [worked caching example](/guides/revisit-a-rejected-approach/) shows this record, retrieve, and reconsider workflow with tested CLI commands.

## Capture and retrieval need to happen

Connecting Selvedge's MCP server does not log every decision. An agent must call its tools, or someone must record the event through the CLI. Installed instructions guide that behavior without guaranteeing complete coverage.

Later sessions must access the same database and query the relevant history. Claude Code's SessionStart hook can deliver a digest, and its PreToolUse gate can require a lookup before selected schema or migration edits. Those hooks do not automatically apply to other clients, which use their supported MCP tools and instructions.

An empty query result does not establish that an approach was never tried. A retrieved explanation also needs a relevance check and a check against present conditions. Neither files nor Selvedge guarantee that an agent follows the evidence or makes a correct change.

## Combine the records when that helps

Keep standing guidance in the instruction file, describe architectural tradeoffs in ADRs, and use Selvedge for entity queries when that makes the decision easier to find. These are complementary choices, not a requirement to migrate every existing record.

Try the smallest useful loop in a real project: preserve one decision, retrieve it in a later session, and check whether the record helps with the next task. That demonstrates retrieval in that case; it does not establish a general productivity benefit.

Sources: [Selvedge MCP tools](/reference/mcp-tools/), [setup and quickstart](/start/quickstart/), and [release history](/project/changelog/).
