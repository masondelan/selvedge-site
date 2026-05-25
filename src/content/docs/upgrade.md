---
title: Upgrading Selvedge
description: How to upgrade Selvedge across PyPI, Smithery, Glama, and source installs — plus how to silence the version-check notice if you don't want it.
---

If you landed here from a one-line stderr notice like

```
selvedge: v0.3.7 available (you're on 0.3.6) — https://selvedge.sh/upgrade
```

…that's the background version check that ships with Selvedge v0.3.6+. It runs at
most once every 24 hours, never inside the MCP server (the agent's stdio stays
quiet), and the line above is the only place it points at the web. This page is what
it points at.

## The short version

Most people installed Selvedge from PyPI. If that's you:

```bash
pip install -U selvedge
```

Then check:

```bash
selvedge --version
```

That's it. The DB and `.selvedge/` directory are forward-compatible — schema
migrations run automatically on the first command after the upgrade.

## By install channel

Selvedge ships through a few different surfaces. The upgrade story is different for
each, which is why the notice points here rather than hard-coding `pip install -U`.

### PyPI — `pip` or `pipx`

The default, and what `pip install selvedge` gives you:

```bash
pip install -U selvedge
```

If you installed with `pipx` (recommended for CLI tools so it lives in an isolated
venv):

```bash
pipx upgrade selvedge
```

`pipx list` will tell you which one you used if you can't remember.

### Smithery

Smithery serves Selvedge as an MCPB bundle. The agent host (Claude Desktop, etc.)
re-pulls the bundle on its own update cadence, so for most users this is automatic
— but you can force it from the
[Smithery listing](https://smithery.ai/server/masondelan/selvedge) by reinstalling
the server in your client. The published bundle version matches the PyPI version.

### Glama

Glama mirrors the package metadata and refreshes the
[catalog entry](https://glama.ai/mcp/servers/masondelan/selvedge) automatically. If
you installed the actual binary via Glama's recommended path (which is `pip install
selvedge` under the hood), follow the PyPI steps above.

### From source

For anyone running off a clone of
[masondelan/selvedge](https://github.com/masondelan/selvedge):

```bash
cd path/to/selvedge
git pull
pip install -e .
```

The editable install means subsequent `git pull`s pick up code changes without
reinstalling, but you'll want to re-run `pip install -e .` whenever
`pyproject.toml`'s dependencies change.

Note: editable installs intentionally suppress the update-check notice (the version
string contains `.dev` / `+` / `rc` markers), so if you're hacking on Selvedge
you'll never see the prompt that brought you here.

## Verify the upgrade

```bash
selvedge --version
selvedge doctor
```

`selvedge doctor` runs a single-command health check across DB resolution, hook
installation, agent-tool wiring, and (in v0.3.6+) the last prune timestamp. If
anything regressed in the upgrade, `doctor` is the fastest way to find it.

## If the upgrade breaks something

Selvedge follows [semver](https://semver.org/) and the v0.3.x line is committed to
**drop-in upgrades** — a `pip install -U selvedge` on a 0.3.x should never require
config changes or a DB migration you have to think about. If something does break:

1. Capture `selvedge doctor --json` output.
2. Check [the changelog](/project/changelog/) for the version you upgraded to —
   most behavioral changes are called out in the **Changed** section.
3. File an issue at
   [github.com/masondelan/selvedge/issues](https://github.com/masondelan/selvedge/issues)
   with the doctor output and the version you came from.

You can roll back with `pip install selvedge==X.Y.Z` (substitute the prior
version). The schema only ever migrates forward, but the v0.3.x migrations are
additive — a rollback won't corrupt your DB, you just won't see new fields if you
recorded data on the newer version first.

## Silencing the update notice

The check is opt-out via several signals — most users never need to think about
this because at least one already applies (CI environments, redirected output,
agent stdio).

Disable it explicitly with any of:

| Environment variable | Effect |
|---|---|
| `SELVEDGE_NO_UPDATE_CHECK=1` | The dedicated kill switch. |
| `SELVEDGE_QUIET=1` | Silences the update notice *and* the one-time global-DB-fallback warning. |
| `CI=1` | Standard CI signal — matches `gh` and `npm`. Set by GitHub Actions / GitLab CI / etc. by default. |

The check is also auto-disabled when:

- `stderr` isn't a TTY — anything piping, redirecting, or running over the MCP
  stdio channel never sees the notice.
- The install is editable / dev (`pip install -e .` where the version contains
  `.dev` / `+` / `rc`).
- The cached fetch is less than 24 hours old (the daemon thread doesn't even
  start).

The cache lives at `~/.selvedge/update_check.json` if you want to inspect or
delete it.

## Why this page exists

Hard-coding `pip install -U selvedge` into the notice would have been wrong for
Smithery and Glama users — and we wanted the line short enough to read in a
glance, which ruled out enumerating channels in stderr. A single short URL keeps
the notice clean and gives us a place to keep the advice correct as the
distribution story evolves.

## Next

[**What's new →**](/project/changelog/) — every release, in order.
[**Configuration →**](/reference/configuration/) — every environment variable,
including the suppression flags above.
[**FAQ →**](/project/faq/) — common gotchas and "why does it work this way".
