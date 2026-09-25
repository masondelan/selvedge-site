// Fixed labels only. No request headers, client addresses, URLs or project data.
export const campaigns = new Set(['agents-sep26', 'aug26_test', 'organic']);
export const creatives = new Set(['next-agent', 'revisit', 'why-column', 'argument', 'wordmark', 'none']);
export const agents = new Set(['none', 'codex', 'claude-code', 'cursor', 'copilot', 'gemini', 'windsurf']);
export const events = new Set(['landing_view', 'start_click', 'demo_click', 'agent_select', 'install_copy', 'setup_copy', 'prompt_copy', 'agent_docs', 'activation_reported']);
const headers = { 'Cache-Control': 'no-store' };
const reply = (status) => new Response(null, { status, headers });

/** Read at most 512 bytes, including requests without Content-Length. */
async function readBody(request) {
  if (!request.headers.get('content-type')?.startsWith('application/json')) throw 415;
  const reader = request.body?.getReader();
  if (!reader) throw 400;
  const chunks = [];
  let size = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 512) { await reader.cancel(); throw 413; }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  try { return JSON.parse(new TextDecoder().decode(bytes)); } catch { throw 400; }
}

function labels(body) {
  return body && agents.has(body.agent) && campaigns.has(body.campaign) && creatives.has(body.creative);
}

const countSQL = `INSERT INTO daily_events (day, event, agent, campaign, creative, count)
  VALUES (?, ?, ?, ?, ?, 1)
  ON CONFLICT(day, event, agent, campaign, creative) DO UPDATE SET count = count + 1`;

/** Persist an anonymous interaction count or issue an explicitly requested receipt. */
export async function browserEvent(request, db, issueReceipt = false) {
  if (request.headers.get('origin') !== new URL(request.url).origin) return reply(403);
  if (request.headers.get('dnt') === '1') return reply(403);
  let body;
  try { body = await readBody(request); } catch (status) { return reply(typeof status === 'number' ? status : 400); }
  if (!labels(body) || (issueReceipt ? body.consent !== true || body.agent === 'none' : !events.has(body.event))) return reply(400);
  if (!db) return reply(503);
  const day = new Date().toISOString().slice(0, 10);
  try {
    if (!issueReceipt) {
      await db.prepare(countSQL).bind(day, body.event, body.agent, body.campaign, body.creative).run();
      return reply(204);
    }
    const token = crypto.randomUUID();
    const now = Math.floor(Date.now() / 1000);
    // The token identifies this optional command, never a person or machine.
    // Cap issuance and remove expired receipts; aggregates have fixed cardinality.
    const results = await db.batch([
      db.prepare('DELETE FROM install_receipts WHERE expires_at < ?').bind(now),
      db.prepare(`INSERT INTO install_receipts (token, day, agent, campaign, creative, expires_at)
        SELECT ?, ?, ?, ?, ?, ? WHERE (SELECT COUNT(*) FROM install_receipts WHERE day = ?) < 2000`)
        .bind(token, day, body.agent, body.campaign, body.creative, now + 7 * 86400, day),
    ]);
    if (results[1].meta.changes !== 1) return reply(429);
    return Response.json({ token }, { headers });
  } catch { return reply(503); }
}

/** Redeem a one-use command receipt. A public endpoint is a signal, not attestation. */
export async function confirmInstall(request, db) {
  if (request.headers.has('origin') || request.headers.get('dnt') === '1') return reply(403);
  let body;
  try { body = await readBody(request); } catch (status) { return reply(typeof status === 'number' ? status : 400); }
  if (!body || typeof body.token !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(body.token)) return reply(400);
  if (!db) return reply(503);
  const now = Math.floor(Date.now() / 1000);
  const day = new Date().toISOString().slice(0, 10);
  try {
    // D1 batches are transactions: concurrent or repeated requests count once.
    const result = await db.batch([
      db.prepare(`INSERT INTO daily_events (day, event, agent, campaign, creative, count)
        SELECT ?, 'install_completed', agent, campaign, creative, 1 FROM install_receipts
        WHERE token = ? AND confirmed = 0 AND expires_at >= ?
        ON CONFLICT(day, event, agent, campaign, creative) DO UPDATE SET count = count + 1`)
        .bind(day, body.token, now),
      db.prepare('UPDATE install_receipts SET confirmed = 1 WHERE token = ? AND expires_at >= ?').bind(body.token, now),
    ]);
    return reply(result[1].meta.changes ? 204 : 410);
  } catch { return reply(503); }
}

/** Bash/zsh command: receipt is sent only after install and version check succeed. */
export function measuredCommand(agent, token) {
  if (!agents.has(agent) || agent === 'none' || !/^[0-9a-f-]{36}$/.test(token)) throw new Error('Invalid command labels');
  return `uv tool install --upgrade selvedge &&\nselvedge --version &&\n{ curl --fail --silent --show-error --max-time 3 -X POST https://selvedge.sh/api/install-confirmation -H 'Content-Type: application/json' --data '{"token":"${token}"}' || true; } &&\nselvedge setup --agent ${agent}`;
}
