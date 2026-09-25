---
title: Evaluate decision memory in your coding workflow
description: Test whether saved project decisions are retrieved and applied, with no-memory and maintained-file controls, changed constraints, and visible failure evidence.
lastUpdated: 2026-09-24
---

Useful decision memory must survive a fresh session and help with the next relevant task. Test retrieval and application separately. Connecting an MCP server, seeing a plausible answer, or counting recorded events is not enough to establish either outcome.

## Start with a real decision

Choose a project decision with a concrete rejected approach and a checkable constraint. Record the entity, reason, observed outcome and the evidence that would change the decision. Use the [first-decision guide](/guides/verify-first-decision/) to confirm that a new session can retrieve the saved record.

Then give a new agent session a relevant task without supplying the old explanation. Retain the actual tool result, the proposed change and its tests. Verify the final code, not just the agent's summary.

## Compare against useful alternatives

Use the same task, model version, current code and test budget across conditions:

| Condition | Purpose |
| --- | --- |
| No prior decision supplied | Shows what the agent can infer from current evidence alone |
| Maintained instruction file or ADR | Tests whether an existing simpler workflow is sufficient |
| Same decision supplied in the prompt | Checks whether the information helps when delivery succeeds |
| Selvedge retrieval | Tests access to the stored decision through the actual workflow |

Repeat runs in fresh sessions and vary their order. Keep unrelated memory, tools and instructions consistent. Record differences in context size and delivery rather than assuming the conditions are equivalent.

## Include cases where old advice should lose

A remembered rejection can become obsolete. Include a task where current tests or requirements invalidate its original constraint, and another where the stored decision concerns a different entity. The agent should reconsider the first and avoid applying the second indiscriminately.

Record failed lookups, ignored records, incorrect changes, unnecessary refusals and incomplete runs. Selectively reporting successful examples makes the comparison less useful.

## Reproduce the configuration pilot

The public [decision-memory pilot](https://github.com/masondelan/selvedge/tree/main/bench/decision_memory) provides four synthetic configuration-choice cases and four conditions, with a frozen schedule, isolated stores and observable tool traces. It uses a real Selvedge MCP server in the retrieval condition. Model calls require an explicit execution flag and available Claude Code access.

This is a small author-written fixture suite. It does not measure real repository coding performance, agent capture quality, native client memory, hook delivery or competing products. The maintained-file condition is a controlled fixture, and the inline condition contains the same facts without matching the full token budget. Read the harness limitations before interpreting a result.

## Initial pilot results

The [September 25, 2026 UTC run](https://github.com/masondelan/selvedge/tree/main/bench/decision_memory/results/2026-09-25) used Claude Code 2.1.170, model `claude-sonnet-4-6`, and Selvedge 0.3.14. All 48 measured trials completed.

| Condition | Correct final choices |
| --- | --- |
| No prior memory | 8/12 |
| Decision-file fixture | 12/12 |
| Same facts in the prompt | 12/12 |
| Selvedge MCP retrieval | 12/12 |

Selvedge retrieved the relevant saved record before the first edit in all nine trials with relevant prior memory. It chose correctly without retrieving the unrelated record in the other three. All conditions handled the changed-constraint and unrelated-memory cases correctly.

This small pilot does **not** show an advantage over a maintained file or well-supplied prompt. The public results include every measured choice, sanitized tool traces, prompts, final configurations and the excluded technical-smoke failure. These measurements concern behavior in the fixture, not discoverability or recommendations by other LLMs.

## Share evidence someone else can inspect

A useful report includes exact versions, task and record text (redacted where needed), prompts, condition definitions, all attempted runs, actual tool calls, final changes, checks, tokens and failures. Separate observed retrieval from correct application and report the denominator for each rate.

The existing [feedback pilot](https://github.com/masondelan/selvedge/discussions/49) accepts voluntary experience reports. Follow its consent terms; do not include private code, credentials or sensitive project decisions. Independent replications are more useful than endorsements.
