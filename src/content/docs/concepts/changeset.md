---
title: "What is a changeset in Selvedge?"
description: "In Selvedge, a changeset is a group of recorded events sharing a changeset identifier for a feature, task, or other unit of work."
head:
  - tag: script
    attrs:
      type: application/ld+json
    content: |
      {
        "@context": "https://schema.org",
        "@type": "DefinedTerm",
        "@id": "https://selvedge.sh/concepts/changeset/#term",
        "url": "https://selvedge.sh/concepts/changeset/",
        "name": "Changeset",
        "description": "In Selvedge, a changeset is a group of recorded events sharing a changeset identifier for a feature, task, or other unit of work. It connects decisions across affected entities so a reader can inspect their recorded scope together. A Selvedge changeset is a grouping label, not a Git commit, database transaction, or guarantee that every related change was captured.",
        "inDefinedTermSet": {
          "@id": "https://selvedge.sh/concepts/#terms"
        }
      }
---

In Selvedge, a changeset is a group of recorded events sharing a changeset identifier for a feature, task, or other unit of work. It connects decisions across affected entities so a reader can inspect their recorded scope together. A Selvedge changeset is a grouping label, not a Git commit, database transaction, or guarantee that every related change was captured.

## One task can affect several entities

Consider a hypothetical billing change that adds a database column, modifies a charging function, and changes an API response. Each event can have its own entity and explanation while sharing the identifier `add-stripe-billing`.

Selvedge's `log_change` accepts `changeset_id`. The `changeset` tool retrieves events stored under that identifier. The CLI equivalent is:

```bash
selvedge changeset add-stripe-billing --json
```

The result groups what was recorded. It does not discover omitted edits by scanning the repository.

## Changeset, commit, and session

| Identifier | What it refers to |
| --- | --- |
| `changeset_id` | A chosen grouping of related Selvedge events |
| `git_commit` | The commit associated with an event, when supplied |
| `session_id` | The agent session associated with an event, when supplied |

A task may span multiple sessions or commits. A commit may contain work from several tasks. Keep the identifiers separate and use the available links to inspect the actual code, rather than treating a shared label as proof that the events were applied atomically.

## Make the group useful to the next reader

Use a descriptive identifier and reuse it for the related events. Give each event an explanation specific to its entity. If an approach is later rejected or reverted, preserve that outcome and retrieve the entity's [prior attempts](/concepts/prior-attempt/) before trying it again.

For example, a later reader of the billing group should be able to distinguish the reason for the new column from the reason for an API change. Repeating a generic phrase such as “billing update” on every event loses that detail.

See the [MCP tool reference](/reference/mcp-tools/) for event fields and query limits, and [entity-level tracking](/concepts/entity-level-tracking/) for choosing the affected parts of the system.

[All concepts →](/concepts/)
