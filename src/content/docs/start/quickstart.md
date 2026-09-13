---
title: Quickstart
description: Install Selvedge, try a safe demo, connect your coding agent, and carry your first decision into a new session.
---

## Install

Selvedge requires Python 3.10 or newer. With [uv installed](https://docs.astral.sh/uv/getting-started/installation/):

```bash
uv tool install --upgrade selvedge
selvedge --version
selvedge demo
```

The current release is **[Selvedge 0.3.14](/project/changelog/#v0314--2026-09-12)**, which fixes validation of an explicit seven-day prior-attempt window and includes the earlier decision-review fixes. Agent setup choices and the isolated demo were introduced in 0.3.12. The demo saves a rejection and retrieves it through a fresh connection to a temporary database. It does not write to your project or configured database.

Using pip instead? Install in a virtual environment:

```bash
python -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade selvedge
selvedge demo
```

On Windows, activate with `.venv\Scripts\Activate.ps1` in PowerShell. If your system calls Python `python3`, use that to create the environment.

**The agent must be able to launch `selvedge-server`.** Start your editor from the activated terminal, or use the absolute path to that executable in its MCP configuration. With uv tools, run `uv tool update-shell` if needed, then restart your terminal and editor.

## Connect your agent

From your project directory:

```bash
cd your-project
selvedge setup --agent codex
```

| Agent | Setup flag | MCP configuration | Instructions |
| --- | --- | --- | --- |
| [Codex](/mcp/codex/) | `codex` | `.codex/config.toml` | `AGENTS.md` |
| [Claude Code](/mcp/claude-code/) | `claude-code` | `.mcp.json` | `CLAUDE.md` |
| [Cursor](/mcp/cursor/) | `cursor` | `~/.cursor/mcp.json` | `.cursorrules` |
| [Copilot in VS Code](/mcp/vscode/) | `copilot` | `.vscode/mcp.json` | `.github/copilot-instructions.md` |
| [Gemini CLI](/mcp/gemini/) | `gemini` | `.gemini/settings.json` | `GEMINI.md` |
| [Windsurf](/mcp/windsurf/) | `windsurf` | `~/.codeium/windsurf/mcp_config.json` | `.windsurfrules` |

Repeat `--agent` to connect several tools to the same project. Without it, setup detects supported tools. It asks before changes, backs up modified files, installs instructions, initializes the local store and offers a Git post-commit hook. Custom MCP entries raise a conflict. Custom Codex TOML entries require manual reconciliation; `--force` never rewrites them.

Already using the Selvedge Claude Code plugin? Keep that installation; adding a second MCP server through setup is unnecessary.

Restart your agent in this project. Approve or enable Selvedge and its tools if prompted. Codex requires a trusted project to load its project configuration. Copilot requires Agent mode.

## Save and recall your first decision

Ask your agent:

> Use Selvedge to record one approach we considered and rejected in this project. Include why we rejected it and what would change our mind. Then look it up with prior_attempts.

Use a real decision you can verify. Watch the calls in another terminal:

```bash
selvedge watch
```

Start a new session in the same project. Ask the agent to query `prior_attempts` for that entity. You should see the saved rejection and its reason.

**MCP access does not automatically capture every decision.** The installed instructions guide your agent to call Selvedge. Session-start delivery, pre-compaction reminders and the schema edit gate are currently Claude Code integrations. Other clients use MCP tools and the CLI.

## If nothing appears

1. Run `selvedge --version`. Upgrade to the current release, 0.3.13; setup choices and the demo require at least 0.3.12.
2. Confirm `selvedge-server` is on the PATH your agent uses, or set its absolute path.
3. Restart the agent after setup and enable its eight Selvedge tools.
4. Make sure your terminal and agent are in the same project.
5. Run `selvedge doctor` and explicitly ask the agent to use `log_change`.

## Read your project history

```bash
selvedge status
selvedge prior-attempts users.api_key
selvedge blame users.api_key
selvedge history --since 7d
selvedge search "credentials"
selvedge stale
```

Read commands support `--json`. See the [CLI reference](/reference/cli/) and [MCP tools](/reference/mcp-tools/).

## Unattended setup

```bash
selvedge setup --agent codex --non-interactive --yes
```

Without `--yes`, non-interactive setup is a dry run.

## Help test later-session retrieval

Trying this in a project you control? [Join the voluntary feedback pilot](https://github.com/masondelan/selvedge/discussions/49). We want to hear about failed or confusing setup and retrieval as well as successful lookups. Read the participation and consent details before replying; the discussion is public, so share only redacted, non-sensitive notes.
