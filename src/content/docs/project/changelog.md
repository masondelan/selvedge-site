---
title: What's new
description: Recent Selvedge releases. Every shipped change is in CHANGELOG.md in the source repo — this page mirrors the latest two minor versions for at-a-glance browsing.
---

The canonical changelog is [`CHANGELOG.md`](https://github.com/masondelan/selvedge/blob/main/CHANGELOG.md)
in the source repo. This page mirrors the most recent two minor versions for
at-a-glance browsing.

## v0.3.6 — 2026-05-24

Two themes in one release as a one-time exception to the single-theme
cadence: **stay-current** (background PyPI version check) and
**retention basics** (`selvedge prune` for the `tool_calls` table).
**Drop-in upgrade for anyone on 0.3.5.**

### Stay-current

**Background version check in `selvedge` (the CLI only — never the MCP
server).** A daemon thread fetches the latest published version from
PyPI's JSON endpoint, caches the result at
`~/.selvedge/update_check.json` (user-global so you don't re-check per
project), and on process exit prints to stderr:

```
selvedge: v0.3.7 available (you're on 0.3.6) — https://selvedge.sh/upgrade
```

The notice is printed via `atexit` so it appears *after* the command's
output, never interleaved. Cache TTL is 24h, matching `gh` and `npm`.

**Generous suppression.** The check is disabled when any of
`SELVEDGE_NO_UPDATE_CHECK=1`, `SELVEDGE_QUIET=1`, or `CI` is set in
the environment, when stderr isn't a TTY (piping, agent stdio,
`--json` to a file), and on dev / editable installs. The TTY gate is
re-checked at print time too — even a cached notice can't pollute
redirected output. The 1.5s fetch timeout and the no-raise posture of
every code path mean a network blip can't slow or break the CLI.

**`selvedge-server` stays silent.** The check is wired into the CLI
group callback only — the MCP server's stdio is the JSON-RPC channel
and an inadvertent stderr write would surface in the calling agent's
logs as noise.

### Retention basics

**`selvedge prune` — trim old `tool_calls` rows.** Default retention
is 90 days; `--days N` overrides. The default is long enough that the
previous month's agents are still in the data. Every run appends a
tab-separated audit line to `.selvedge/prune.log` so the cadence is
visible later — even empty prunes log, so you can tell the difference
between "no prunes yet" and "nothing to prune."

```
selvedge prune                # 90-day default
selvedge prune --days 30      # tighter window
selvedge prune --json         # for cron / scripting
```

Only `tool_calls` is pruned in this release. The destructive
events-table path waits for `.selvedge/config.toml` in v0.3.10 and
will require both `SELVEDGE_DESTRUCTIVE=1` *and* an interactive
confirmation — the cron / non-interactive `--yes` footgun is
defended against by design.

**Doctor — `Last prune` row + oversized-`tool_calls` WARN.** The
doctor table now surfaces the tail of `.selvedge/prune.log` (most
recent timestamp, rows pruned, day threshold) and WARNs when the
`tool_calls` table exceeds 100k rows so users get a nudge to run
`selvedge prune` before the noise table gets large.

### Note on cadence

This release combines two themes — a **one-time exception** to the
single-theme-per-release discipline locked in on 2026-05-10. The
retention work could have slipped to v0.3.7 (entity foundation +
`prior_attempts` wedge), but combining here avoided a renumbering
pass on the phase plan. Single-theme resumes at v0.3.7.

### Tests

- 36 new tests: `test_update_check.py` (24), `test_prune.py` (10),
  `test_doctor.py` extension (2). Suite is now ≈403 tests.

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

---

[**Full CHANGELOG.md →**](https://github.com/masondelan/selvedge/blob/main/CHANGELOG.md)
in the source repo. Includes 0.3.4 (first-run wizard, prompt, watch),
0.3.3 (per-tool annotations, output schemas, custom icon), 0.3.2
(observability + doctor), 0.3.1 (concurrency hardening), 0.3.0
(correctness fixes), 0.2.x (changesets, import/export), and the 0.1.0
initial release.

[**Roadmap →**](/project/roadmap/) for what's planned through v1.0.0.
