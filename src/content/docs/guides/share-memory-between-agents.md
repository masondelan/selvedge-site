---
title: Share decision memory between coding agents
description: Record a decision in one coding agent and retrieve it in another using the same Selvedge database, with a repeatable handoff check.
lastUpdated: 2026-09-24
---

Two agents can share Selvedge decisions when they connect to the same database. The useful handoff is the saved rationale and outcome attached to an entity. It does not transfer an entire conversation or synchronize separate databases.

## Connect two clients to one project

For example, run from the project root:

```bash
selvedge setup --agent claude-code --agent codex
selvedge doctor
```

Review the setup prompts, then restart both clients in this project. Enable the MCP server and tools; Codex must trust the project to load its project configuration. The [compatibility table](/reference/compatibility/) lists other setup targets and distinguishes MCP access from native lifecycle capabilities.

Use the effective database path reported by `doctor` to diagnose mismatches. If either client sets `SELVEDGE_DB`, it must resolve to the intended shared store. Changing a terminal environment variable does not update an already-running editor or a separately configured MCP process. Check that client's server environment. See [database path resolution](/reference/configuration/#db-path-resolution).

## Run the handoff check

1. In the first client, [save a real decision](/guides/verify-first-decision/#2-save-one-real-decision) and note the entity path and event ID.
2. Close that conversation. In a fresh session in the second client, give only the entity path and ask it to retrieve the record with `prior_attempts`.
3. Verify that the returned ID, rationale and outcome match. Do not supply the old rationale in the prompt; that would bypass the retrieval check.
4. Ask the second client to explain whether the recorded constraint still applies. Test any ensuing code change separately.

This establishes a handoff for the clients, versions and configuration you actually tested. It does not establish that either agent will consult history without prompting.

## After context loss or compaction

Saved database records survive the conversation boundary. Information that was never logged is not recovered by attaching Selvedge later. Retrieve relevant entities in the new session, then inspect current code and tests before continuing. Avoid loading all history merely because it exists.

## Another machine or Git worktree

A second checkout may resolve to a different database. Moving a repository does not necessarily move an ignored database, and a SQLite file committed to Git is not automatic multi-writer synchronization. Use a consistent SQLite backup process to transfer a store, keep private records in a private destination, and verify the effective path after the move. [Configuration](/reference/configuration/) and the [sharing FAQ](/project/faq/#can-i-commit-selvedge-to-git) describe the tradeoffs.

If both clients see the record but make different choices, retain that observation. Shared evidence does not imply identical behavior across models.
