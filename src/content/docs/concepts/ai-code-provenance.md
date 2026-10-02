---
title: "What is code provenance? An AI coding example"
description: "Understand code provenance, AI attribution, and decision history with a concrete example. Learn which fields to record and how to retrieve them."
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
        "description": "Code provenance is the recorded origin and history of a code change: what changed, who or what contributed, and which evidence links them to the change. AI code provenance applies this to code produced with an AI coding agent. Decision provenance adds the stated reason, alternatives, constraints, and outcome. A record supports inspection; it does not by itself prove that the code or its explanation is correct.",
        "inDefinedTermSet": {
          "@id": "https://selvedge.sh/concepts/#terms"
        }
      }
---

Code provenance is the recorded origin and history of a code change: what changed, who or what contributed, and which evidence links them to the change. **AI code provenance** applies this to code produced with an AI coding agent. Decision provenance adds the stated reason, alternatives, constraints, and outcome. A record supports inspection; it does not by itself prove that the code or its explanation is correct.

## What belongs in the record?

A useful record lets a later reader follow an explanation back to its source. For a coding decision, that can include an entity path, event time, agent identifier, commit, stated reason, and outcome. Not every record contains every field. A missing commit or explanation is a gap to identify, not a detail to reconstruct silently.

Suppose a patch removes process-local caching. Git can show the patch and its commit history. A recorded explanation might add that another worker could serve an old profile after an update. The explanation connects the change to a requirement; a linked test or incident supplies evidence to evaluate it. This is an illustrative example, not a measured customer outcome.

A decision record for that example might contain:

| Field | Example value | What it helps a reviewer check |
| --- | --- | --- |
| Entity | `src/cache.py::load_profile` | Which part of the code the decision concerns |
| Change | `revert` | An implemented approach was rolled back |
| Stated reason | Another worker could serve an old profile after an update | Which failure motivated the change |
| Constraint | Profile updates must be visible across workers | Whether the same requirement still applies |
| Revisit condition | Shared invalidation is implemented and tested | What evidence would justify reconsidering caching |

Keep a link to the actual commit and supporting test or incident when available.
A label or explanation alone does not establish that the test passed.

## What does Selvedge record?

Selvedge's `log_change` stores structured events and the reasoning supplied by an agent or user. Selvedge's `blame`, `history`, and `changeset` tools retrieve those records. Its [`prior_attempts`](/concepts/prior-attempt/) tool adds a view of recorded approaches and outcomes before another edit.

These records complement Git. An event is not a complete copy of the repository, and a linked commit does not authenticate every statement in the reason. Agent names and explanations are supplied metadata. Use the [MCP tool reference](/reference/mcp-tools/) to check the fields and query limits.

## Keep the kinds of evidence separate

- **Attribution:** which contributor or tool is associated with a change.
- **Stated reasoning:** the explanation recorded by an agent or person.
- **Observed outcome:** what a linked test, review, or incident actually established.

One does not substitute for the others. In particular, an explanation inferred later from a diff has a different source from one recorded during the work. See [recorded versus inferred reasoning](/concepts/captured-live-vs-inferred/).

For exchanging records, see [Selvedge's Agent Trace support](/compare/agent-trace/). Check which fields a receiving tool preserves before relying on a round trip.

## Try the decision-history workflow

The [worked rejection-and-revisit guide](/guides/revisit-a-rejected-approach/) shows how to save a reason, retrieve it, and revise the decision when its constraint changes. Use the [quickstart](/start/quickstart/) to connect your coding agent, then [verify one decision in a fresh session](/guides/verify-first-decision/).

For review and sharing, see the [AI coding decision audit trail](/audit-trail/) guide. To distinguish recorded reasons from line attribution, compare [Selvedge and git blame](/compare/git-blame/).

[All concepts →](/concepts/)
