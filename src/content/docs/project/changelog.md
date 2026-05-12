---
title: What's new
description: Recent Selvedge releases. Every shipped change is in CHANGELOG.md in the source repo — this page mirrors the latest two minor versions for at-a-glance browsing.
---

The canonical changelog is [`CHANGELOG.md`](https://github.com/masondelan/selvedge/blob/main/CHANGELOG.md)
in the source repo. This page mirrors the most recent two minor versions for
at-a-glance browsing.

## v0.3.5 — 2026-05-11

The recovery-basics release. v0.3.1 made the runtime safe; v0.3.2 made problems
visible; v0.3.5 ships the *minimum viable* "what happens when something has gone
wrong" surface. **Drop-in upgrade for anyone on 0.3.4.**

### Added

- **`selvedge verify` — DB-correctness gate with two exit tiers.** Walks the store
  and reports each check as PASS / WARN / FAIL. Must-fail conditions (SQLite
  corruption from `PRAGMA integrity_check`, schema mismatch against the declared
  `MIGRATIONS`, empty `entity_path`, unknown `change_type` in the store, unparseable
  timestamps, malformed `tool_calls` rows) exit non-zero. Should-warn conditions
  (singleton `changeset_id` groups, events past the 60-minute backfill window with
  no `git_commit`) print warnings but exit 0 by default. Pass `--strict` to
  escalate warnings to failures — the tiering means `selvedge verify` can drop into
  CI on day one without `|| true`. `--json` for machine output. Tier mapping is
  locked in by `selvedge.verify.CHECK_TIERS`.
- **`selvedge backup` — online SQLite snapshot via `VACUUM INTO`.** Default
  destination `.selvedge/backups/selvedge-YYYYMMDD-HHMMSS.db`. Hardcoded
  `keep_last=7`; the setting becomes `backup_keep_last` in `.selvedge/config.toml`
  when that file lands in v0.3.10. Two backups within the same second don't
  collide. `--output <path>` overrides the default destination and is excluded
  from rotation. `--json` for scripting.
- **`.selvedge/backups/` added to the project `.gitignore`.** `selvedge init`
  writes it on fresh repos; the first `selvedge backup` run on an existing repo
  appends it the same way. Idempotent.
- **Doctor — `Last backup` row.** INFO when the newest backup is ≤7 days old,
  WARN when older, FAIL when no backups exist *and* the events table has ≥10,000
  rows (the threshold where no-backups becomes a real data-loss exposure rather
  than a CI/scratch DB).
- **Doctor — `Schema version` now FAILs on downgrade.** When `schema_migrations`
  contains a version not declared in the current `MIGRATIONS` tuple, the row fails
  rather than silently passing.

### Tests

- 24 new tests: `test_verify.py` (13), `test_backup.py` (7), `test_doctor.py`
  extension (4). Within the ≤25 budget for Phase 2.11. Suite is now ≈359 tests.

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

---

[**Full CHANGELOG.md →**](https://github.com/masondelan/selvedge/blob/main/CHANGELOG.md)
in the source repo. Includes 0.3.3 (per-tool annotations, output schemas, custom
icon), 0.3.2 (observability + doctor), 0.3.1 (concurrency hardening), 0.3.0
(correctness fixes), 0.2.x (changesets, import/export), and the 0.1.0 initial
release.

[**Roadmap →**](/project/roadmap/) for what's planned through v1.0.0.
