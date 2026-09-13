---
title: "What is a stale decision in an AI-coded project?"
description: "A stale decision is a recorded choice whose assumptions, constraints, or review conditions may no longer match the current project."
head:
  - tag: script
    attrs:
      type: application/ld+json
    content: |
      {
        "@context": "https://schema.org",
        "@type": "DefinedTerm",
        "@id": "https://selvedge.sh/concepts/stale-decision/#term",
        "url": "https://selvedge.sh/concepts/stale-decision/",
        "name": "Stale decision",
        "description": "A stale decision is a recorded choice whose assumptions, constraints, or review conditions may no longer match the current project. A stale signal requests reassessment; it does not establish that the decision is wrong or that a rejected approach is now safe. Useful decision records state both the original reason and the evidence that would justify reconsidering it.",
        "inDefinedTermSet": {
          "@id": "https://selvedge.sh/concepts/#terms"
        }
      }
---

A stale decision is a recorded choice whose assumptions, constraints, or review conditions may no longer match the current project. A stale signal requests reassessment; it does not establish that the decision is wrong or that a rejected approach is now safe. Useful decision records state both the original reason and the evidence that would justify reconsidering it.

## Age is only one signal

A dependency pin might remain necessary for years. Another decision might become questionable as soon as a related API changes. The relevant question is whether the reason still applies, not simply how old the record is.

For a hypothetical caching rejection, “reconsider after shared invalidation is implemented and tested” is more useful than “do not cache.” It states what a later reader should verify before reopening the approach.

## How Selvedge surfaces records for review

Selvedge's `stale_decisions` tool uses the conditions recorded with a decision:

| Field | What a signal means |
| --- | --- |
| `revisit_after` | The date has passed and a later activity signal exists for the entity or its changeset. |
| `expires_when` | A supported condition involving a date, entity change, or observable installed dependency version has fired. An unobservable dependency version calls for manual review. |
| `stale_when` | Words in a later change match the stated condition, suggesting a possible reason to inspect the decision. |

The last signal is a textual match, not a test that the condition has been satisfied. None of these signals automatically changes the verdict.

```bash
selvedge stale --json
```

Check the [MCP tool reference](/reference/mcp-tools/) for current condition syntax, activity rules, and limits. Do not assume an arbitrary natural-language condition is machine-checkable.

## Reassess before reopening

Read the original explanation and supporting evidence. Check the relevant code, tests, or dependency state. If the constraint still holds, retain it. If new evidence justifies a different decision, record that evidence and use an explicit `supersede` event for the intended decision while preserving its history.

The [rejection-and-revisit guide](/guides/revisit-a-rejected-approach/) demonstrates that process. Recording a new decision does not execute the code change or prove its safety; code review and appropriate tests still supply that evidence.

[All concepts →](/concepts/)
