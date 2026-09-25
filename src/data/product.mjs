/** Public facts shared by setup, compatibility, and product metadata.
 * Verify against the released package's setup.py and server.py on each release.
 */
export const product = {
  name: 'Selvedge',
  version: '0.3.15',
  changelogUrl: '/project/changelog/#v0315--2026-09-25',
  category: 'Persistent decision memory for AI coding agents',
  description: 'Selvedge records why code changed, which approaches were rejected, and when decisions deserve another look, so future sessions can retrieve that context before editing.',
  shortDescription: 'Persistent decision memory for AI coding agents. Save stated rationale and rejected approaches locally, then retrieve them before the next edit.',
  python: '3.10+',
};

export const agents = [
  { id: 'codex', label: 'Codex', doc: '/mcp/codex/', config: '.codex/config.toml', instructions: 'AGENTS.md', hooks: 'Startup, edit gate, compaction notice', note: 'Writes project .codex/config.toml and AGENTS.md. Open this project in Codex and trust it to load project configuration; review and trust its hooks with /hooks.' },
  { id: 'claude-code', label: 'Claude Code', doc: '/mcp/claude-code/', config: '.mcp.json', instructions: 'CLAUDE.md', hooks: 'Startup, edit gate, compaction reminder', note: 'Writes .mcp.json and CLAUDE.md, plus Claude Code lifecycle hooks. Already using the Selvedge plugin? Keep that installation instead.' },
  { id: 'cursor', label: 'Cursor', doc: '/mcp/cursor/', config: '~/.cursor/mcp.json', instructions: '.cursorrules', hooks: 'Startup, edit gate, compaction notice', note: 'Adds the server to ~/.cursor/mcp.json and instructions to this project’s .cursorrules.' },
  { id: 'copilot', label: 'Copilot (VS Code Local)', doc: '/mcp/vscode/', config: '.vscode/mcp.json', instructions: '.github/copilot-instructions.md', hooks: 'Startup, edit gate, compaction notice', note: 'Writes .vscode/mcp.json and .github/copilot-instructions.md. Use the VS Code Local harness, enable the server’s tools, and review Chat: Configure Hooks.' },
  { id: 'gemini', label: 'Gemini CLI', doc: '/mcp/gemini/', config: '.gemini/settings.json', instructions: 'GEMINI.md', hooks: 'Startup, edit gate, compaction notice', note: 'Writes this project’s .gemini/settings.json and GEMINI.md. Restart Gemini CLI in the project and approve the server if prompted.' },
  { id: 'windsurf', label: 'Windsurf', doc: '/mcp/windsurf/', config: '~/.codeium/windsurf/mcp_config.json', instructions: '.windsurfrules', hooks: 'Edit and command gates', note: 'Adds the server to ~/.codeium/windsurf/mcp_config.json and instructions to this project’s .windsurfrules.' },
].sort((a, b) => a.label.localeCompare(b.label));
