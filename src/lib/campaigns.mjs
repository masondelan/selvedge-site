// Public, fixed placement labels only. Never derive a label from a referrer or user input.
export const placementCampaigns = Object.freeze({
  'placement-dhanushnehru': 'DhanushNehru/awesome-mcp-servers',
  'placement-mnemoverse': 'mnemoverse/awesome-agent-memory',
  'placement-tensorblock': 'TensorBlock/awesome-mcp-servers',
  'placement-tsinghuac3i': 'TsinghuaC3I/Awesome-Memory-for-Agents',
  'placement-ai-boost': 'ai-boost/awesome-harness-engineering',
  'placement-ccplugins': 'ccplugins/awesome-claude-code-plugins',
  'placement-langgpt': 'LangGPT/awesome-claude-code',
  'placement-roggeohta': 'RoggeOhta/awesome-codex-cli',
  'placement-milisp': 'milisp/awesome-codex-cli',
  'placement-piebald-ai': 'Piebald-AI/awesome-gemini-cli',
  'placement-mcp-tc': 'mcp.tc',
  'placement-mymcptools': 'MyMCPTools',
  'placement-vaultplane': 'VaultPlane',
  'placement-agenticskills': 'AgenticSkills',
  'placement-mcpserver-cc': 'MCP Server Directory (mcpserver.cc)',
  'placement-product-hunt': 'Product Hunt',
  'placement-devhunt': 'DevHunt',
  'placement-cline': 'Cline',
  'placement-github-mcp-registry': 'GitHub MCP registry',
  'placement-reddit-nov26': 'Reddit paid test — November 2026',
});

export const campaigns = new Set(['agents-sep26', 'aug26_test', 'organic', ...Object.keys(placementCampaigns)]);
const novemberCreatives = new Set(['decision-reasons', 'rejected-approaches', 'switch-tools']);
export const creatives = new Set(['next-agent', 'revisit', 'why-column', 'argument', 'wordmark', 'none',
  ...novemberCreatives]);

/** New creative labels must not expand historical campaigns' automatic counts. */
export function creativeAllowed(campaign, creative) {
  return creatives.has(creative)
    && (!novemberCreatives.has(creative) || campaign === 'placement-reddit-nov26');
}

/** November measurement is limited to a deliberately submitted recall report.
 * Optional installation receipts have their own explicit-consent endpoint.
 * Leave historical campaigns unchanged; this is not a whole-site consent policy.
 */
export function browserEventAllowed(campaign, event, consent = false) {
  return campaign !== 'placement-reddit-nov26'
    || (event === 'activation_reported' && consent === true);
}

export function campaignLabels(search) {
  const query = new URLSearchParams(search);
  const value = query.get('utm_campaign');
  // This fixed alias is still published on DevHunt. Normalize future browser events only.
  const campaign = value === 'launch_2026_10_06' ? 'placement-devhunt' : value;
  const recognizedCampaign = campaigns.has(campaign) ? campaign : 'organic';
  const creative = query.get('utm_content');
  return {
    campaign: recognizedCampaign,
    creative: creativeAllowed(recognizedCampaign, creative) ? creative : 'none',
  };
}
