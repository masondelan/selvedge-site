---
title: "Agent memory and code decision concepts"
description: "Definitions, examples, and practical guides for agent memory, code provenance, prior attempts, and decisions that need review."
head:
  - tag: script
    attrs:
      type: application/ld+json
    content: |
      {
        "@context": "https://schema.org",
        "@type": "DefinedTermSet",
        "@id": "https://selvedge.sh/concepts/#terms",
        "url": "https://selvedge.sh/concepts/",
        "name": "Selvedge code decision concepts",
        "description": "Definitions used in Selvedge’s documentation for preserving and retrieving coding decisions. Start with the question you need to answer, then follow a concept to its practical guide. General concepts are distinguished from Selvedge-specific behavior; examples illustrate the workflow and are not customer results.",
        "hasDefinedTerm": [
          {
            "@type": "DefinedTerm",
            "@id": "https://selvedge.sh/concepts/ai-code-provenance/#term",
            "url": "https://selvedge.sh/concepts/ai-code-provenance/",
            "name": "AI code provenance",
            "description": "AI code provenance is the recorded origin and history of an AI-assisted code change: the affected code, the people or tools involved, and the evidence linking them to the change. Decision provenance adds the stated reason, alternatives, constraints, and outcome. A provenance record supports inspection; it does not by itself prove that the code or its explanation is correct.",
            "inDefinedTermSet": {
              "@id": "https://selvedge.sh/concepts/#terms"
            }
          },
          {
            "@type": "DefinedTerm",
            "@id": "https://selvedge.sh/concepts/agent-memory/#term",
            "url": "https://selvedge.sh/concepts/agent-memory/",
            "name": "Agent memory",
            "description": "Agent memory is information retained beyond an agent’s current context and made available to later work. For a coding project, it can include instructions, facts, session context, and decisions with their outcomes. Persistence and retrieval are separate requirements: a saved record helps only when the relevant agent can find it and assess whether it still applies.",
            "inDefinedTermSet": {
              "@id": "https://selvedge.sh/concepts/#terms"
            }
          },
          {
            "@type": "DefinedTerm",
            "@id": "https://selvedge.sh/concepts/prior-attempt/#term",
            "url": "https://selvedge.sh/concepts/prior-attempt/",
            "name": "Prior attempt",
            "description": "A prior attempt is an earlier approach considered or implemented for a task or part of a codebase. A useful record preserves the approach, its stated reason, its outcome, and any condition for reconsidering it. A rejected proposal, a rolled-back implementation, and an approach with no recorded outcome carry different evidence and should remain distinguishable.",
            "inDefinedTermSet": {
              "@id": "https://selvedge.sh/concepts/#terms"
            }
          },
          {
            "@type": "DefinedTerm",
            "@id": "https://selvedge.sh/concepts/entity-level-tracking/#term",
            "url": "https://selvedge.sh/concepts/entity-level-tracking/",
            "name": "Entity-level tracking",
            "description": "Entity-level tracking associates a record with an identifiable part of a system, such as a function, database column, route, or dependency. It lets a reader ask for the history of that thing using a consistent identifier. The quality of the result depends on recorded coverage and identifier maintenance; names do not automatically establish identity through every rename or refactor.",
            "inDefinedTermSet": {
              "@id": "https://selvedge.sh/concepts/#terms"
            }
          },
          {
            "@type": "DefinedTerm",
            "@id": "https://selvedge.sh/concepts/changeset/#term",
            "url": "https://selvedge.sh/concepts/changeset/",
            "name": "Changeset",
            "description": "In Selvedge, a changeset is a group of recorded events sharing a changeset identifier for a feature, task, or other unit of work. It connects decisions across affected entities so a reader can inspect their recorded scope together. A Selvedge changeset is a grouping label, not a Git commit, database transaction, or guarantee that every related change was captured.",
            "inDefinedTermSet": {
              "@id": "https://selvedge.sh/concepts/#terms"
            }
          },
          {
            "@type": "DefinedTerm",
            "@id": "https://selvedge.sh/concepts/stale-decision/#term",
            "url": "https://selvedge.sh/concepts/stale-decision/",
            "name": "Stale decision",
            "description": "A stale decision is a recorded choice whose assumptions, constraints, or review conditions may no longer match the current project. A stale signal requests reassessment; it does not establish that the decision is wrong or that a rejected approach is now safe. Useful decision records state both the original reason and the evidence that would justify reconsidering it.",
            "inDefinedTermSet": {
              "@id": "https://selvedge.sh/concepts/#terms"
            }
          },
          {
            "@type": "DefinedTerm",
            "@id": "https://selvedge.sh/concepts/captured-live-vs-inferred/#term",
            "url": "https://selvedge.sh/concepts/captured-live-vs-inferred/",
            "name": "Recorded versus inferred reasoning",
            "description": "Recorded reasoning is an explanation explicitly supplied by an agent or person and preserved with a decision. Reasoning captured during the work has access to that session’s stated context. Inferred reasoning is an explanation reconstructed later from evidence such as code, diffs, or logs. Both can be useful, but neither should be presented as proof of a hidden thought process or of the decision’s correctness.",
            "inDefinedTermSet": {
              "@id": "https://selvedge.sh/concepts/#terms"
            }
          }
        ]
      }
---

Definitions used in Selvedge’s documentation for preserving and retrieving coding decisions. Start with the question you need to answer, then follow a concept to its practical guide. General concepts are distinguished from Selvedge-specific behavior; examples illustrate the workflow and are not customer results.

## Find the concept you need

| Question | Concept |
| --- | --- |
| Where did this change come from, and what evidence explains it? | [AI code provenance](/concepts/ai-code-provenance/) |
| What should an agent retain across sessions? | [Agent memory](/concepts/agent-memory/) |
| Was this approach considered or tried before? | [Prior attempt](/concepts/prior-attempt/) |
| How do I find decisions about a function or column? | [Entity-level tracking](/concepts/entity-level-tracking/) |
| Which recorded decisions belong to the same task? | [Changeset](/concepts/changeset/) |
| What would justify reconsidering an old decision? | [Stale decision](/concepts/stale-decision/) |
| Was the explanation supplied during the work or reconstructed later? | [Recorded versus inferred reasoning](/concepts/captured-live-vs-inferred/) |

## Put a definition to work

Selvedge is a local MCP server and CLI for recording code decisions, stated reasons, and outcomes. Selvedge's `log_change` writes the event; Selvedge's `prior_attempts` retrieves recorded approaches and outcomes before a later edit. This workflow needs both capture and retrieval. A connected server does not automatically preserve every decision or guarantee that an agent follows it.

Start with the [worked rejection-and-revisit guide](/guides/revisit-a-rejected-approach/). It shows how to record a constraint, retrieve it in another session, and preserve the original explanation when new evidence justifies a revision.

If you are choosing how to keep this history, compare [instruction files, ADRs, and event records](/compare/instructions-and-adrs/). A maintained document can be sufficient; choose a format your project will actually use. For commands and parameters, use the [MCP tool reference](/reference/mcp-tools/) and [quickstart](/start/quickstart/).
