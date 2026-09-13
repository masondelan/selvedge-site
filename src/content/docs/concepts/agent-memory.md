---
title: "What is agent memory for a coding project?"
description: "Agent memory is information retained beyond an agent’s current context and made available to later work."
head:
  - tag: script
    attrs:
      type: application/ld+json
    content: |
      {
        "@context": "https://schema.org",
        "@type": "DefinedTerm",
        "@id": "https://selvedge.sh/concepts/agent-memory/#term",
        "url": "https://selvedge.sh/concepts/agent-memory/",
        "name": "Agent memory",
        "description": "Agent memory is information retained beyond an agent’s current context and made available to later work. For a coding project, it can include instructions, facts, session context, and decisions with their outcomes. Persistence and retrieval are separate requirements: a saved record helps only when the relevant agent can find it and assess whether it still applies.",
        "inDefinedTermSet": {
          "@id": "https://selvedge.sh/concepts/#terms"
        }
      }
---

Agent memory is information retained beyond an agent’s current context and made available to later work. For a coding project, it can include instructions, facts, session context, and decisions with their outcomes. Persistence and retrieval are separate requirements: a saved record helps only when the relevant agent can find it and assess whether it still applies.

## Three useful patterns

These are overlapping patterns for choosing what to preserve, not a universal taxonomy or a ranking of products.

| Pattern | What it preserves | Examples and a useful question |
| --- | --- | --- |
| Maintained documents | Standing instructions, reviewed decisions, explanations, and linked notes | Instruction files, ADRs, and [Basic Memory](https://docs.basicmemory.com/welcome), which represents a knowledge graph in Markdown. Can the team keep the relevant record current and easy to find? |
| Retrieved facts and context | Information saved for recall across interactions | [Mem0](https://docs.mem0.ai/introduction) provides memory across sessions and tools. The [MCP reference memory server](https://github.com/modelcontextprotocol/servers/blob/main/src/memory/README.md) stores entities, relations, and observations. Which facts and sources does the next task need? |
| Decision and outcome events | A sequence of recorded approaches, explanations, rejections, and later revisions | Selvedge stores events against entity paths. What was considered or tried here, why, and what happened next? |

The same project may use all three. A general memory system can store a decision, and an ADR can describe a rejection. Selvedge supplies an event structure and queries for that workflow; it does not make other record formats incapable of preserving reasoning. The examples above come from the linked product documentation, checked September 13, 2026; they are not a feature-by-feature evaluation.

## Where Selvedge fits

Selvedge is a local MCP server and CLI for [decision provenance](/concepts/ai-code-provenance/). Selvedge's `log_change` captures the explanation supplied during the work, and Selvedge's `prior_attempts` retrieves recorded approaches and outcomes for an entity before a later edit. It stores the record in SQLite and does not require an LLM in its core.

It needs useful logging, consistent [entity paths](/concepts/entity-level-tracking/), and retrieval at the right time. Connecting the MCP server does not automatically capture every decision or guarantee that the agent follows the record. The MCP client may send retrieved text to its model provider; local storage alone does not determine the whole data path.

## Choose by the next question

For a few standing rules, start with a maintained instruction file. For a reviewed architectural choice, an indexed ADR may be sufficient. For repeated questions about a particular function's earlier approaches and outcomes, consider structured decision events. Code navigation and current-code search answer another useful question: what does the repository contain now?

Use the [instruction files and ADR comparison](/compare/instructions-and-adrs/) to choose a format, or follow the [across-session setup guide](/agent-memory/) and verify that a later session retrieves an actual record.

[All concepts →](/concepts/)
