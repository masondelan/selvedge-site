export const setupPrompt = 'Help me try Selvedge in this project. Read https://selvedge.sh/start/what-is-selvedge/ and https://selvedge.sh/start/quickstart/ first. Briefly explain how it could help here and what it does and does not capture. Identify my coding agent and guide me through its documented setup. Once connected, help me save one real project decision and retrieve it. Ask me for a decision if none is available; do not invent one. If you cannot read the docs, inspect my project, or run commands, say so and give me the next manual step. Distinguish completed steps from instructions, and do not claim setup or retrieval succeeded without checking.';

// Keep existing campaign/bookmark links useful after the homepage is simplified.
export const legacyDestinations = {
  '#choose-your-agent': '/start/quickstart/#choose-your-agent',
  '#try-the-demo': '/start/quickstart/#install',
  '#what-gets-remembered': '/start/what-is-selvedge/',
  '#a-small-tool-that-stays-with-your-project': '/start/what-is-selvedge/',
  '#find-selvedge': '/start/quickstart/#install',
};

export function legacyDestination(hash, search = '') {
  const path = legacyDestinations[hash];
  if (!path) return null;
  const url = new URL(path, 'https://selvedge.sh');
  url.search = search;
  return url.pathname + url.search + url.hash;
}
