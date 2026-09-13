---
title: "What is entity-level tracking for code decisions?"
description: "Entity-level tracking associates a record with an identifiable part of a system, such as a function, database column, route, or dependency."
head:
  - tag: script
    attrs:
      type: application/ld+json
    content: |
      {
        "@context": "https://schema.org",
        "@type": "DefinedTerm",
        "@id": "https://selvedge.sh/concepts/entity-level-tracking/#term",
        "url": "https://selvedge.sh/concepts/entity-level-tracking/",
        "name": "Entity-level tracking",
        "description": "Entity-level tracking associates a record with an identifiable part of a system, such as a function, database column, route, or dependency. It lets a reader ask for the history of that thing using a consistent identifier. The quality of the result depends on recorded coverage and identifier maintenance; names do not automatically establish identity through every rename or refactor.",
        "inDefinedTermSet": {
          "@id": "https://selvedge.sh/concepts/#terms"
        }
      }
---

Entity-level tracking associates a record with an identifiable part of a system, such as a function, database column, route, or dependency. It lets a reader ask for the history of that thing using a consistent identifier. The quality of the result depends on recorded coverage and identifier maintenance; names do not automatically establish identity through every rename or refactor.

## Pick the thing a future reader will ask about

For a decision about login behavior, a function path can be more useful than a line range. For a database constraint, the table or column may be the useful unit. Choose a consistent level of detail: a reason logged only against a whole file may be harder to find when the next query names a function.

Selvedge's [entity-path conventions](/reference/entity-paths/) include:

| Entity | Example identifier |
| --- | --- |
| Function | `src/auth.py::login` |
| File | `src/auth.py` |
| Database column | `users.email` |
| API route | `api/v1/users` |
| Dependency | `deps/stripe` |

These are identifiers, not a request to include secret values in a record. Keep sensitive reasoning in the intended private database.

## Query scope matters

Selvedge's `blame` asks for the most recent recorded change to an exact entity. Prefix-capable queries such as `diff` can inspect a broader area. Tool parameters differ; do not assume every query has the same matching rules.

```bash
selvedge blame users.email --json
selvedge diff users --json
```

The first lookup concerns a specific column. The second can collect history under the users namespace. Neither command proves that all code changes were logged.

## Preserve identity when names change

If a symbol moves or a column is renamed, record the rename using Selvedge's supported rename fields and inspect the history under the relevant names. Matching old and new identifiers requires evidence; Selvedge does not infer every semantic refactor from repository files.

Entity records and Git history work together. Git supplies the code diff and commit history, while an entity event can supply the recorded reason and outcome for the thing being changed. A [changeset](/concepts/changeset/) groups events when one task affects several entities.

For a later-session lookup of a function's rejected approach, see the [practical guide](/guides/revisit-a-rejected-approach/).

[All concepts →](/concepts/)
