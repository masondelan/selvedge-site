---
title: "What is a prior attempt in a coding decision?"
description: "A prior attempt is an earlier approach considered or implemented for a task or part of a codebase."
head:
  - tag: script
    attrs:
      type: application/ld+json
    content: |
      {
        "@context": "https://schema.org",
        "@type": "DefinedTerm",
        "@id": "https://selvedge.sh/concepts/prior-attempt/#term",
        "url": "https://selvedge.sh/concepts/prior-attempt/",
        "name": "Prior attempt",
        "description": "A prior attempt is an earlier approach considered or implemented for a task or part of a codebase. A useful record preserves the approach, its stated reason, its outcome, and any condition for reconsidering it. A rejected proposal, a rolled-back implementation, and an approach with no recorded outcome carry different evidence and should remain distinguishable.",
        "inDefinedTermSet": {
          "@id": "https://selvedge.sh/concepts/#terms"
        }
      }
---

A prior attempt is an earlier approach considered or implemented for a task or part of a codebase. A useful record preserves the approach, its stated reason, its outcome, and any condition for reconsidering it. A rejected proposal, a rolled-back implementation, and an approach with no recorded outcome carry different evidence and should remain distinguishable.

## Rejected and reverted mean different things

Suppose a team considers process-local caching for a profile loader. It declines the approach because updates would not be visible across workers. That is a **rejection**: the approach was considered without being implemented.

If the team implements the cache and later rolls it back after finding stale reads, that is a **reversion**. The two records can support similar future decisions, but only the second describes an implementation that was rolled back. This example is hypothetical.

In Selvedge, `reject` and `revert` are explicit event types supplied through `log_change` or the CLI. A reason should say which constraint mattered and point to available evidence. A [revisit condition](/concepts/stale-decision/) makes it possible to reconsider the approach when circumstances change.

## How Selvedge retrieves an earlier approach

Selvedge's `prior_attempts` tool examines recorded attempts and outcomes for an entity. The CLI equivalent is:

```bash
selvedge prior-attempts src/cache.py::load_profile --json
```

An explicit rejection can appear with `outcome: "rejected"` and `confidence: "exact"`. Here, exact describes the recorded outcome evidence. It does not prove that the original decision was correct or that its constraint still applies. Other results can use labeled inference from event patterns; consult the [tool reference](/reference/mcp-tools/) for confidence filters.

An empty result means no qualifying record was found for that query and its filters. It does not establish that the approach was never tried.

## Use the history to make a new decision

Before editing, retrieve the record, inspect its evidence, and compare the old constraint with the current project. If the reason still holds, account for it in the plan. If it no longer holds, explain the new evidence and record the revision. A past rejection is neither an automatic veto nor an automatic green light once it becomes old.

The [worked rejection-and-revisit guide](/guides/revisit-a-rejected-approach/) shows the complete Selvedge workflow, including preserving the original explanation when reopening the decision.

[All concepts →](/concepts/)
