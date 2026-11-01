import assert from 'node:assert/strict';

// Exercise deployed route wiring, not only the framework-independent handlers.
// Initialize a local D1 database before running this; never target production.
const base = new URL(process.argv[2] || 'http://127.0.0.1:8787');
assert(['127.0.0.1', 'localhost', '[::1]'].includes(base.hostname), 'Use a local Worker preview URL');
const labelCases = [
  { agent: 'codex', campaign: 'organic', creative: 'none' },
  ...['decision-reasons', 'rejected-approaches', 'switch-tools'].map(creative => ({
    agent: 'codex', campaign: 'placement-reddit-nov26', creative,
  })),
];
const post = (path, body, browser = true, extra = {}) => fetch(new URL(path, base), {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', ...(browser ? { Origin: base.origin } : {}), ...extra },
  body: JSON.stringify(body),
  redirect: 'manual',
  signal: AbortSignal.timeout(10_000),
});

for (const labels of labelCases) {
  const november = labels.campaign === 'placement-reddit-nov26';
  const event = { ...labels, event: 'setup_copy' };
  assert.equal((await post('/api/launch-event', event)).status, november ? 400 : 204, 'November automatic events must be rejected; legacy events still reach local D1');
  if (november) {
    for (const name of ['landing_view', 'start_click', 'demo_click', 'agent_select', 'install_copy', 'setup_copy', 'prompt_copy', 'agent_docs']) {
      assert.equal((await post('/api/launch-event', { ...labels, event: name, consent: true })).status, 400, 'a consent flag must not enable automatic November events');
    }
    for (const consent of [undefined, false, 'true']) {
      assert.equal((await post('/api/launch-event', { ...labels, event: 'activation_reported', consent })).status, 400, 'November recall requires explicit boolean consent');
    }
    assert.equal((await post('/api/launch-event', { ...labels, creative: 'unlisted', event: 'activation_reported', consent: true })).status, 400, 'creative labels remain bounded');
  }
  assert.equal((await post('/api/launch-event', event, false)).status, 403, 'event requires same-origin browser request');
  assert.equal((await post('/api/launch-event', event, true, { DNT: '1' })).status, 403, 'DNT remains respected');
  assert.equal((await post('/api/install-receipt', { ...labels, consent: false })).status, 400, 'receipt requires consent');
  assert.equal((await post('/api/install-receipt', { ...labels, consent: true }, true, { DNT: '1' })).status, 403, 'DNT also suppresses receipts');
  const receipt = await post('/api/install-receipt', { ...labels, consent: true });
  assert.equal(receipt.status, 200, 'receipt route must reach local D1');
  assert.equal(receipt.headers.get('cache-control'), 'no-store');
  const { token } = await receipt.json();
  assert.match(token, /^[0-9a-f-]{36}$/);
  assert.equal((await post('/api/install-confirmation', { token })).status, 403, 'browser cannot redeem CLI receipt');
  assert.equal((await post('/api/install-confirmation', { token }, false, { DNT: '1' })).status, 403, 'DNT suppresses confirmation');
  assert.equal((await post('/api/install-confirmation', { token: 'invalid' }, false)).status, 400, 'invalid receipt is rejected');
  for (let i = 0; i < 2; i++) {
    assert.equal((await post('/api/install-confirmation', { token }, false)).status, 204, 'confirmation and retry must reach local D1');
  }
  const recall = { ...labels, event: 'activation_reported', ...(november ? { consent: true } : {}) };
  assert.equal((await post('/api/launch-event', recall, true, { DNT: '1' })).status, 403, 'DNT suppresses consented recall');
  assert.equal((await post('/api/launch-event', recall, false)).status, 403, 'recall requires a same-origin browser request');
  assert.equal((await post('/api/launch-event', recall)).status, 204, 'voluntary recall report remains separate');
}
console.log('PASS: local Worker rejects automatic November events and accepts only consented outcomes for all three creatives; legacy events, origin, DNT, receipts, and confirmation retries remain intact.');
