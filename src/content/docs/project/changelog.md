---
title: What's new
description: Recent Selvedge releases. Every shipped change is in CHANGELOG.md in the source repo — this page mirrors the latest two minor versions for at-a-glance browsing.
---

The canonical changelog is [`CHANGELOG.md`](https://github.com/masondelan/selvedge/blob/main/CHANGELOG.md)
in the source repo. This page mirrors the most recent two minor versions for
at-a-glance browsing.

## v0.3.4 — 2026-04-26

The first-run release. The install funnel was six manual steps with three documentation
lookups; v0.3.4 collapses it to one command and makes the agent integration discoverable
from inside the tool instead of from the README. **Drop-in upgrade for anyone on
0.3.3.**

### Added

- **`selvedge setup` — interactive first-run wizard.** Detects Claude Code, Cursor,
  Copilot on the machine and walks through every install step in one pass: writes the
  MCP entry into each tool's config, drops the canonical agent-instructions block into
  the project's prompt file, runs `selvedge init`, installs the post-commit hook. Every
  modified file gets a `.bak` written next to it before any change reaches disk.
  Re-running on an already-set-up project is a no-op (idempotent). For CI / devcontainer
  `postCreateCommand`: `selvedge setup --non-interactive --yes`.
- **`selvedge prompt` — canonical agent instructions on tap.** Prints the recommended
  system-prompt block to stdout (pipe-friendly), or installs it idempotently into a
  target file with `--install <file>`. Sentinel-bracketed
  (`<!-- selvedge:start -->` / `<!-- selvedge:end -->`) so re-running `--install`
  updates the bracketed region without disturbing anything else in the file.
- **`selvedge watch` — live tail of newly-logged events.** Polls the SQLite store at
  `--interval` (default 1s) and prints each new event as it lands. Filters mirror
  `selvedge history`. `--json` for `jq`. WAL mode means polling never blocks the
  writer.
- **`selvedge.prompt.PROMPT_BLOCK` is now public.** Library users can import the
  canonical agent-instructions block as a constant for templating into their own
  onboarding flows.

### Changed

- **Better empty-state diagnosis in `selvedge status`.** Decision-tree-driven hint:
  MCP entry installed but agent hasn't reloaded → restart-your-agent grace; MCP entry
  not detected anywhere → run `selvedge setup`. Surfaces the actual config path in
  either case.
- **`selvedge doctor`'s "MCP wiring" check now points at `selvedge setup`.** Same
  diagnostic improvement, surfaced through the doctor table.
- **`server.json` regenerated from live `server.py`.** Was still showing v0.3.2 tool
  descriptions through v0.3.3; now in lockstep with `manifest.json`. Folded into the
  version-bump checklist so this can't drift again.

### Tests

- 54 new tests across `test_setup.py` (18), `test_prompt.py` (18), `test_watch.py`
  (18). Suite is now ≈336 tests.

## v0.3.3 — 2026-04-26

A discoverability + ergonomics release. No new MCP tools, no behavior changes that
affect stored data — but the live tool schema is substantially richer for the agents
that read it. **Drop-in upgrade for anyone on 0.3.2.**

### Added

- **Per-parameter descriptions on every MCP tool.** All 6 tools now declare each
  parameter via `Annotated[T, Field(description=...)]`. Coverage went 0/21 → 21/21.
- **MCP tool annotations on every tool.** `readOnlyHint`, `destructiveHint`,
  `idempotentHint`, `openWorldHint`, plus a human-friendly `title`. `log_change` is
  the only writer. The five readers are read-only + idempotent. None are open-world.
- **`outputSchema` on `log_change` and `blame`.** New `LogChangeResult` and
  `BlameResult` TypedDicts give the JSON-RPC layer something concrete to advertise.
- **Custom server icon.** A "stitched timeline" mark — a horizontal running stitch
  where each visible stitch is a captured change event. Lives at `assets/icon.svg`.

### Changed

- **`log_change` always returns a complete result payload.** `id`, `timestamp`,
  `status`, `error`, `warnings` — every key always populated. Easier to type-check
  without branching.
- **`blame` returns a stable shape on miss.** Empty-history responses populate every
  event field with the empty value of its type and set `error` to the "no history
  found" message.
- **Tool-level descriptions are dedented at startup.** Each tool's docstring is run
  through `inspect.cleandoc` once at import time so `tools/list` doesn't leak the
  function-body indent.

### Documentation

- **`CLAUDE.md` ↔ `docs/architecture.md` split.** `CLAUDE.md` is now a thin
  agent-instructions file. The architecture, data model, MCP tool reference, full CLI
  reference, phase plan, and non-goals all moved to `docs/architecture.md`.

---

[**Full CHANGELOG.md →**](https://github.com/masondelan/selvedge/blob/main/CHANGELOG.md)
in the source repo. Includes 0.3.0 (correctness fixes), 0.3.1 (concurrency hardening),
0.3.2 (observability + doctor), 0.2.x (changesets, import/export), and the 0.1.0
initial release.

[**Roadmap →**](/project/roadmap/) for what's planned through v1.0.0.
