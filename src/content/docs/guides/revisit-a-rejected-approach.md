---
title: Record, retrieve, and revisit a rejected approach
description: A tested Selvedge CLI example for preserving a caching rejection and reopening it when the evidence changes.
structuredData:
  type: techarticle
---

The CLI example below was checked against released Selvedge 0.3.13 in a temporary database. Install Selvedge with `pip install selvedge`, then run `selvedge init` in a scratch directory to try it.

A repository can show what the code does while leaving out why an apparently reasonable alternative was rejected. A later coding session then has the implementation but lacks the reason behind it.

One useful record contains four things: the affected part of the code, the approach considered, why it was rejected, and what would justify reconsidering it. An indexed Architecture Decision Record can hold that information. The important workflow is to retrieve the relevant record before changing the code and then assess whether it still applies.

Here is the same workflow using Selvedge's explicit decision records. This is a hypothetical example, not a customer result or a claim about preventing every repeated mistake.

## Record the reason and the condition for revisiting

Suppose `src/cache.py::load_profile` reads profiles from a shared database. You consider process-local caching but reject it because one worker could keep serving an old profile after another worker updates it. The team keeps the database read until shared invalidation has been implemented and tested.

Record that decision:

```bash
selvedge log src/cache.py::load_profile reject \
  --reasoning "Process-local caching can serve an old profile after another worker updates it." \
  --constraint "Profile updates must be visible across workers." \
  --stale-when "Shared invalidation is implemented and covered by tests."
```

The constraint explains the requirement behind the rejection. The revisit condition prevents today's reasoning from becoming a permanent rule regardless of future evidence.

An agent can record the same information through Selvedge's `log_change` MCP tool. Capture is explicit: connecting the MCP server does not automatically record every decision. Use `revert` when an implemented approach was rolled back, and `reject` for an approach that was considered and declined.

## Retrieve it before the next edit

In a later session, query the same entity:

```bash
selvedge prior-attempts src/cache.py::load_profile --json
```

In the isolated example check, the result included `outcome: "rejected"` and `confidence: "exact"`. Here, “exact” describes the explicit recorded rejection; it does not prove that the decision was correct or remains applicable.

Agents can use Selvedge's `prior_attempts` MCP tool for this lookup. Selvedge also has Claude Code hooks for selected delivery and edit-checking workflows. Other supported agents use MCP tools and instructions; connecting them does not give them Claude Code's hook behavior.

## Reconsider explicitly when the evidence changes

Now suppose shared invalidation passes the relevant tests. The old rejection should remain in the history, together with the new reason to revisit it:

```bash
selvedge supersede src/cache.py::load_profile \
  --reasoning "Shared invalidation now passes the multi-worker tests; reconsider the earlier rejection." \
  --json
```

In this one-rejection example, the command linked the superseding event to the earlier rejection. A subsequent lookup reported `outcome: "reopened"` and preserved the original reasoning. When several decisions share an entity, inspect the history and target the intended event explicitly.

Expiry conditions and stale-history hints request review. They do not automatically decide that an approach is now safe or change its verdict.

## Keep retrieval and compliance separate

A retrieved decision is evidence for the next task. It still needs a relevance check, a current applicability check, and tests for the proposed change. Neither a decision database nor a larger instruction file guarantees that an agent will follow the record.

The practical loop is small: record the reason, retrieve it before editing, check whether it still holds, and preserve the explanation when it changes.

References: [Selvedge 0.3.13 release](https://github.com/masondelan/selvedge/releases/tag/v0.3.13), [MCP tool reference](https://selvedge.sh/reference/mcp-tools/).
