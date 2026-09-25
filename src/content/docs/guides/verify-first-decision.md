---
title: Verify your first decision in a new coding session
description: Confirm Selvedge setup, save a real rejected approach, retrieve it after a fresh session, and distinguish a successful lookup from correct use.
lastUpdated: 2026-09-24
---

The first useful milestone is a decision you can retrieve after the conversation that produced it has ended. This check works with the [six supported setup targets](/reference/compatibility/). Start with the [quickstart](/start/quickstart/) if Selvedge is not connected yet.

## 1. Confirm the project database

Run from your project directory:

```bash
selvedge --version
selvedge doctor
```

Confirm the reported database path belongs to this project. Review any configuration or executable-path warning before continuing. The agent should have access to Selvedge's eight MCP tools. A healthy database alone does not prove that the agent has connected.

## 2. Save one real decision

Use an actual choice from your project, with a specific entity such as `src/cache.py::load_profile`. Ask your agent:

> Use Selvedge to record one real approach we considered and rejected in this project. Include the entity, why we rejected it, and what would change our mind. Do not invent a decision; ask me if none is available. Then show the saved entity path and record ID.

Inspect the `log_change` response. A successful response reports `status: "logged"` and an ID; inspect any warnings about the explanation. If you only want a synthetic demonstration, run `selvedge demo` instead. Keep demonstration records out of real project history.

## 3. Retrieve it without the old conversation

Open a new session in the same project. Do not paste the old rationale into it. Replace `ENTITY` with the path saved above:

> Use Selvedge prior_attempts to retrieve the decision for ENTITY. Show the recorded reason and outcome. Assess whether the original constraint still applies before proposing any edit.

Confirm that the tool actually ran and returned the correct record. Compare its reason and outcome with what you saved. A fluent answer without a tool result does not verify later-session retrieval.

## 4. Check use separately from retrieval

On the next relevant coding task, inspect whether the agent consulted the decision before editing, considered current evidence, and tested its chosen approach. If the constraint has changed, [reopen the intended decision explicitly](/guides/revisit-a-rejected-approach/#reconsider-explicitly-when-the-evidence-changes).

```bash
selvedge stats --json
```

This reports observed tool calls and explanation-quality signals. Its logging ratio is not the percentage of all repository edits captured. Record retrieval and successful application as separate observations.

## If a step fails

| What you observe | What to check next |
| --- | --- |
| No Selvedge tools | Restart the client, enable MCP tools, and check the server executable path in its setup guide |
| `log_change` returns an error | Correct the reported parameter error and retry; do not treat an attempted call as a saved record |
| Fresh session returns no record | Compare database paths and exact entity paths; inspect filters and full history |
| Terminal sees the record but the agent does not | Check the agent's working directory and MCP environment against `selvedge doctor` |
| Agent repeats the rejected approach | Inspect tool use and applicability; connecting memory is not a guarantee of compliance |

An empty result means no qualifying record was returned under that query. It does not prove the approach was never tried.

To evaluate a second client, follow [share decision memory between agents](/guides/share-memory-between-agents/). To report your experience voluntarily, use the existing [feedback pilot](https://github.com/masondelan/selvedge/discussions/49); read its consent details and redact private code and decisions.
