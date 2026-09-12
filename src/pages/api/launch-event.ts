import type { APIRoute } from 'astro';
export const prerender = false;
const events = new Set(['landing_view', 'start_click', 'demo_click', 'agent_select', 'install_copy', 'setup_copy', 'prompt_copy', 'agent_docs', 'activation_reported']);
const agents = new Set(['none', 'codex', 'claude-code', 'cursor', 'copilot', 'gemini', 'windsurf']);
const creatives = new Set(['next-agent', 'revisit', 'none']);
const campaigns = new Set(['agents-sep26', 'organic']);
export const POST: APIRoute = async ({ request, url }) => {
  if (request.headers.get('origin') !== url.origin) return new Response(null, { status: 403 });
  if (!request.headers.get('content-type')?.startsWith('application/json')) return new Response(null, { status: 415 });
  const raw = await request.text();
  if (raw.length > 512) return new Response(null, { status: 413 });
  try {
    const { event, agent, campaign, creative } = JSON.parse(raw);
    if (!events.has(event) || !agents.has(agent) || !campaigns.has(campaign) || !creatives.has(creative)) return new Response(null, { status: 400 });
    // Fixed-schema counts in Workers observability; never log headers, IPs,
    // full URLs, free text or anything from a visitor's project.
    console.log(JSON.stringify({ kind: 'selvedge_launch', event, agent, campaign, creative }));
    return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
  } catch { return new Response(null, { status: 400 }); }
};
