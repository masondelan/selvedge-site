---
title: "What is AI code provenance?"
description: "AI code provenance is the recorded origin and history of an AI-assisted code change: the affected code, the people or tools involved, and the evidence linking them to the change."
head:
  - tag: script
    attrs:
      type: application/ld+json
    content: |
      {
        "@context": "https://schema.org",
        "@type": "DefinedTerm",
        "@id": "https://selvedge.sh/concepts/ai-code-provenance/#term",
        "url": "https://selvedge.sh/concepts/ai-code-provenance/",
        "name": "AI code provenance",
        "description": "AI code provenance is the recorded origin and history of an AI-assisted code change: the affected code, the people or tools involved, and the evidence linking them to the change. Decision provenance adds the stated reason, alternatives, constraints, and outcome. A provenance record supports inspection; it does not by itself prove that the code or its explanation is correct.",
        "inDefinedTermSet": {
          "@id": "https://selvedge.sh/concepts/#terms"
        }
      }
---

AI code provenance is the recorded origin and history of an AI-assisted code change: the affected code, the people or tools involved, and the evidence linking them to the change. Decision provenance adds the stated reason, alternatives, constraints, and outcome. A provenance record supports inspection; it does not by itself prove that the code or its explanation is correct.

## What belongs in the record?

A useful record lets a later reader follow an explanation back to its source. For a coding decision, that can include an entity path, event time, agent identifier, commit, stated reason, and outcome. Not every record contains every field. A missing commit or explanation is a gap to identify, not a detail to reconstruct silently.

Suppose a patch removes process-local caching. Git can show the patch and its commit history. A recorded explanation might add that another worker could serve an old profile after an update. The explanation connects the change to a requirement; a linked test or incident supplies evidence to evaluate it. This is an illustrative example, not a measured customer outcome.

## What does Selvedge record?

Selvedge's `log_change` stores structured events and the reasoning supplied by an agent or user. Selvedge's `blame`, `history`, and `changeset` tools retrieve those records. Its [`prior_attempts`](/concepts/prior-attempt/) tool adds a view of recorded approaches and outcomes before another edit.

These records complement Git. An event is not a complete copy of the repository, and a linked commit does not authenticate every statement in the reason. Agent names and explanations are supplied metadata. Use the [MCP tool reference](/reference/mcp-tools/) to check the fields and query limits.

## Keep the kinds of evidence separate

- **Attribution:** which contributor or tool is associated with a change.
- **Stated reasoning:** the explanation recorded by an agent or person.
- **Observed outcome:** what a linked test, review, or incident actually established.

One does not substitute for the others. In particular, an explanation inferred later from a diff has a different source from one recorded during the work. See [recorded versus inferred reasoning](/concepts/captured-live-vs-inferred/).

For exchanging records, see [Selvedge's Agent Trace support](/compare/agent-trace/). Check which fields a receiving tool preserves before relying on a round trip.

[All concepts →](/concepts/)
