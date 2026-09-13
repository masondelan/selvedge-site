---
title: "Recorded versus inferred reasoning: what is the difference?"
description: "Recorded reasoning is an explanation explicitly supplied by an agent or person and preserved with a decision."
head:
  - tag: script
    attrs:
      type: application/ld+json
    content: |
      {
        "@context": "https://schema.org",
        "@type": "DefinedTerm",
        "@id": "https://selvedge.sh/concepts/captured-live-vs-inferred/#term",
        "url": "https://selvedge.sh/concepts/captured-live-vs-inferred/",
        "name": "Recorded versus inferred reasoning",
        "description": "Recorded reasoning is an explanation explicitly supplied by an agent or person and preserved with a decision. Reasoning captured during the work has access to that session’s stated context. Inferred reasoning is an explanation reconstructed later from evidence such as code, diffs, or logs. Both can be useful, but neither should be presented as proof of a hidden thought process or of the decision’s correctness.",
        "inDefinedTermSet": {
          "@id": "https://selvedge.sh/concepts/#terms"
        }
      }
---

Recorded reasoning is an explanation explicitly supplied by an agent or person and preserved with a decision. Reasoning captured during the work has access to that session’s stated context. Inferred reasoning is an explanation reconstructed later from evidence such as code, diffs, or logs. Both can be useful, but neither should be presented as proof of a hidden thought process or of the decision’s correctness.

## The difference is the source of the explanation

Suppose a patch removes a process-local cache. From the diff alone, a later reader might infer a performance, correctness, or memory-use concern. A contemporaneous record might instead state: “Another worker can serve an old profile after an update.” The recorded sentence preserves a specific explanation that the diff may not contain.

That sentence is still a claim. A linked test or incident can support it; recording it does not make it true. This example is hypothetical.

| Evidence | What it can support | What it does not establish alone |
| --- | --- | --- |
| Code or diff | The implementation or observed code change | The complete reason for choosing it |
| Explanation recorded during work | What the agent or person explicitly stated in that context | Their hidden reasoning, factual accuracy, or complete alternatives |
| Later inference | A possible explanation based on the available evidence | That the original author held that explanation |
| Linked test or observation | A result under the stated conditions | Every future outcome or the complete decision history |

## What Selvedge captures

Selvedge's `log_change` records the `reasoning` text supplied by its caller. Calling it during the work can preserve context before the session ends. Selvedge does not inspect a model's private thought process, and connecting the server alone does not capture every decision.

The time of a database event is not proof that its explanation was written at the time of the original change. If a record is imported, backfilled, or written later, preserve that source and timing distinction in the explanation and available metadata.

Selvedge can also infer some **outcomes** from recorded event patterns in `prior_attempts`. That is a different inference from reconstructing the reason a change was made. The tool labels its evidence confidence; an explicit recorded rejection can be exact evidence of the recorded outcome without proving that its explanation was correct. See [prior attempts](/concepts/prior-attempt/).

## Keep evidence inspectable

Use a brief explanation of the problem, constraint, and chosen approach. Link a commit, test, or reviewed record where available. Label later interpretation as interpretation and keep the original source accessible. A summary can help a reader navigate a long history without replacing the evidence it summarizes.

See [AI code provenance](/concepts/ai-code-provenance/) for the fields that connect a decision to its source, or follow the [worked decision-record guide](/guides/revisit-a-rejected-approach/) to practice capture and retrieval.

[All concepts →](/concepts/)
